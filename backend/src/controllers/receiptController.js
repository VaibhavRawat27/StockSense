const db = require("../config/database");

/**
 * POST /api/receipts
 * Create a new receipt (status: draft) with supplier, warehouse, and line items.
 * Body: { supplier_id, warehouse_id, items: [{ product_id, quantity }] }
 */
const createReceipt = (req, res) => {
    const { supplier_id, warehouse_id, items } = req.body;

    if (!supplier_id || !warehouse_id) {
        return res.status(400).json({
            success: false,
            message: "supplier_id and warehouse_id are required",
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "items must be a non-empty array of { product_id, quantity }",
        });
    }

    for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Each item needs a valid product_id and a quantity > 0",
            });
        }
    }

    try {
        db.exec("BEGIN");

        const receiptResult = db
            .prepare(
                `INSERT INTO receipts (supplier_id, warehouse_id, status) VALUES (?, ?, 'draft')`
            )
            .run(supplier_id, warehouse_id);

        const receiptId = receiptResult.lastInsertRowid;

        const insertItem = db.prepare(
            `INSERT INTO receipt_items (receipt_id, product_id, quantity) VALUES (?, ?, ?)`
        );
        for (const item of items) {
            insertItem.run(receiptId, item.product_id, item.quantity);
        }

        db.exec("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Receipt created as draft",
            data: { receipt_id: Number(receiptId) },
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/receipts
 * List all receipts (optionally filter by ?status=)
 */
const getReceipts = (req, res) => {
    const { status } = req.query;

    try {
        const rows = status
            ? db.prepare(`SELECT * FROM receipts WHERE status = ? ORDER BY id DESC`).all(status)
            : db.prepare(`SELECT * FROM receipts ORDER BY id DESC`).all();

        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/receipts/:id
 * Get one receipt with its line items.
 */
const getReceiptById = (req, res) => {
    const { id } = req.params;

    try {
        const receipt = db.prepare(`SELECT * FROM receipts WHERE id = ?`).get(id);
        if (!receipt) {
            return res.status(404).json({ success: false, message: "Receipt not found" });
        }

        const items = db
            .prepare(
                `SELECT ri.id, ri.product_id, p.name AS product_name, p.sku, ri.quantity
                 FROM receipt_items ri
                 JOIN products p ON p.id = ri.product_id
                 WHERE ri.receipt_id = ?`
            )
            .all(id);

        return res.json({ success: true, data: { ...receipt, items } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/receipts/:id/validate
 * Validates a receipt: increases stock_levels for each item's product/warehouse,
 * logs each movement to stock_ledger, and marks the receipt as done.
 * Definition of done (work plan): validating a receipt correctly increases
 * stock by the received quantity.
 */
const validateReceipt = (req, res) => {
    const { id } = req.params;

    try {
        const receipt = db.prepare(`SELECT * FROM receipts WHERE id = ?`).get(id);
        if (!receipt) {
            return res.status(404).json({ success: false, message: "Receipt not found" });
        }
        if (receipt.status === "done") {
            return res.status(400).json({ success: false, message: "Receipt is already validated" });
        }
        if (receipt.status === "canceled") {
            return res.status(400).json({ success: false, message: "Cannot validate a canceled receipt" });
        }

        const items = db
            .prepare(`SELECT product_id, quantity FROM receipt_items WHERE receipt_id = ?`)
            .all(id);

        if (items.length === 0) {
            return res.status(400).json({ success: false, message: "Receipt has no items to validate" });
        }

        db.exec("BEGIN");

        const upsertStock = db.prepare(`
            INSERT INTO stock_levels (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(product_id, warehouse_id)
            DO UPDATE SET quantity = quantity + excluded.quantity
        `);

        const insertLedger = db.prepare(`
            INSERT INTO stock_ledger (product_id, warehouse_id, change_qty, movement_type, reference_type, reference_id)
            VALUES (?, ?, ?, 'receipt', 'receipt', ?)
        `);

        for (const item of items) {
            upsertStock.run(item.product_id, receipt.warehouse_id, item.quantity);
            insertLedger.run(item.product_id, receipt.warehouse_id, item.quantity, id);
        }

        db.prepare(
            `UPDATE receipts SET status = 'done', validated_at = datetime('now') WHERE id = ?`
        ).run(id);

        db.exec("COMMIT");

        return res.json({
            success: true,
            message: `Receipt #${id} validated. Stock increased for ${items.length} product(s).`,
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createReceipt,
    getReceipts,
    getReceiptById,
    validateReceipt,
};