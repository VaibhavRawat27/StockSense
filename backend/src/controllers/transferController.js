const db = require("../config/database");

/**
 * POST /api/transfers
 * Create a new internal transfer (status: draft) between two warehouses.
 * Body: { from_warehouse_id, to_warehouse_id, items: [{ product_id, quantity }] }
 */
const createTransfer = (req, res) => {
    const { from_warehouse_id, to_warehouse_id, items } = req.body;

    if (!from_warehouse_id || !to_warehouse_id) {
        return res.status(400).json({
            success: false,
            message: "from_warehouse_id and to_warehouse_id are required",
        });
    }

    if (from_warehouse_id === to_warehouse_id) {
        return res.status(400).json({
            success: false,
            message: "from_warehouse_id and to_warehouse_id must be different",
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

        const transferResult = db
            .prepare(
                `INSERT INTO transfers (from_warehouse_id, to_warehouse_id, status) VALUES (?, ?, 'draft')`
            )
            .run(from_warehouse_id, to_warehouse_id);

        const transferId = transferResult.lastInsertRowid;

        const insertItem = db.prepare(
            `INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`
        );
        for (const item of items) {
            insertItem.run(transferId, item.product_id, item.quantity);
        }

        db.exec("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Transfer created as draft",
            data: { transfer_id: Number(transferId) },
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/transfers
 * List all transfers (optionally filter by ?status=)
 */
const getTransfers = (req, res) => {
    const { status } = req.query;

    try {
        const rows = status
            ? db.prepare(`SELECT * FROM transfers WHERE status = ? ORDER BY id DESC`).all(status)
            : db.prepare(`SELECT * FROM transfers ORDER BY id DESC`).all();

        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/transfers/:id
 * Get one transfer with its line items.
 */
const getTransferById = (req, res) => {
    const { id } = req.params;

    try {
        const transfer = db.prepare(`SELECT * FROM transfers WHERE id = ?`).get(id);
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        const items = db
            .prepare(
                `SELECT ti.id, ti.product_id, p.name AS product_name, p.sku, ti.quantity
                 FROM transfer_items ti
                 JOIN products p ON p.id = ti.product_id
                 WHERE ti.transfer_id = ?`
            )
            .all(id);

        return res.json({ success: true, data: { ...transfer, items } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/transfers/:id/validate
 * Validates a transfer: checks enough stock exists at the source warehouse,
 * decreases stock there, increases stock at the destination, and logs a
 * transfer_out + transfer_in pair per item to stock_ledger.
 * Definition of done (work plan): total stock stays unchanged, only location moves.
 */
const validateTransfer = (req, res) => {
    const { id } = req.params;

    try {
        const transfer = db.prepare(`SELECT * FROM transfers WHERE id = ?`).get(id);
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }
        if (transfer.status === "done") {
            return res.status(400).json({ success: false, message: "Transfer is already validated" });
        }
        if (transfer.status === "canceled") {
            return res.status(400).json({ success: false, message: "Cannot validate a canceled transfer" });
        }

        const items = db
            .prepare(`SELECT product_id, quantity FROM transfer_items WHERE transfer_id = ?`)
            .all(id);

        if (items.length === 0) {
            return res.status(400).json({ success: false, message: "Transfer has no items to validate" });
        }

        // Check stock availability at the source warehouse BEFORE making any changes
        const getStock = db.prepare(
            `SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?`
        );
        for (const item of items) {
            const stock = getStock.get(item.product_id, transfer.from_warehouse_id);
            const available = stock ? stock.quantity : 0;
            if (available < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product_id ${item.product_id} at source warehouse: available ${available}, requested ${item.quantity}`,
                });
            }
        }

        db.exec("BEGIN");

        const decrementStock = db.prepare(`
            UPDATE stock_levels SET quantity = quantity - ?
            WHERE product_id = ? AND warehouse_id = ?
        `);

        const upsertStock = db.prepare(`
            INSERT INTO stock_levels (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(product_id, warehouse_id)
            DO UPDATE SET quantity = quantity + excluded.quantity
        `);

        const insertLedger = db.prepare(`
            INSERT INTO stock_ledger (product_id, warehouse_id, change_qty, movement_type, reference_type, reference_id)
            VALUES (?, ?, ?, ?, 'transfer', ?)
        `);

        for (const item of items) {
            // Move stock out of source
            decrementStock.run(item.quantity, item.product_id, transfer.from_warehouse_id);
            insertLedger.run(item.product_id, transfer.from_warehouse_id, -item.quantity, "transfer_out", id);

            // Move stock into destination
            upsertStock.run(item.product_id, transfer.to_warehouse_id, item.quantity);
            insertLedger.run(item.product_id, transfer.to_warehouse_id, item.quantity, "transfer_in", id);
        }

        db.prepare(
            `UPDATE transfers SET status = 'done', validated_at = datetime('now') WHERE id = ?`
        ).run(id);

        db.exec("COMMIT");

        return res.json({
            success: true,
            message: `Transfer #${id} validated. ${items.length} product(s) moved, total stock unchanged.`,
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createTransfer,
    getTransfers,
    getTransferById,
    validateTransfer,
};