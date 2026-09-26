const db = require("../config/database");

/**
 * POST /api/deliveries
 * Create a new delivery order (status: draft) with warehouse and line items.
 * Body: { warehouse_id, items: [{ product_id, quantity }] }
 */
const createDelivery = (req, res) => {
    const { warehouse_id, items } = req.body;

    if (!warehouse_id) {
        return res.status(400).json({ success: false, message: "warehouse_id is required" });
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

        const deliveryResult = db
            .prepare(`INSERT INTO deliveries (warehouse_id, status) VALUES (?, 'draft')`)
            .run(warehouse_id);

        const deliveryId = deliveryResult.lastInsertRowid;

        const insertItem = db.prepare(
            `INSERT INTO delivery_items (delivery_id, product_id, quantity) VALUES (?, ?, ?)`
        );
        for (const item of items) {
            insertItem.run(deliveryId, item.product_id, item.quantity);
        }

        db.exec("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Delivery order created as draft",
            data: { delivery_id: Number(deliveryId) },
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/deliveries
 * List all delivery orders (optionally filter by ?status=)
 */
const getDeliveries = (req, res) => {
    const { status } = req.query;

    try {
        const rows = status
            ? db.prepare(`SELECT * FROM deliveries WHERE status = ? ORDER BY id DESC`).all(status)
            : db.prepare(`SELECT * FROM deliveries ORDER BY id DESC`).all();

        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/deliveries/:id
 * Get one delivery order with its line items.
 */
const getDeliveryById = (req, res) => {
    const { id } = req.params;

    try {
        const delivery = db.prepare(`SELECT * FROM deliveries WHERE id = ?`).get(id);
        if (!delivery) {
            return res.status(404).json({ success: false, message: "Delivery order not found" });
        }

        const items = db
            .prepare(
                `SELECT di.id, di.product_id, p.name AS product_name, p.sku, di.quantity
                 FROM delivery_items di
                 JOIN products p ON p.id = di.product_id
                 WHERE di.delivery_id = ?`
            )
            .all(id);

        return res.json({ success: true, data: { ...delivery, items } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/deliveries/:id/validate
 * Validates a delivery: checks enough stock exists for each item, decreases
 * stock_levels, logs each movement to stock_ledger, and marks it done.
 * Definition of done (work plan): a delivery order reduces stock correctly.
 */
const validateDelivery = (req, res) => {
    const { id } = req.params;

    try {
        const delivery = db.prepare(`SELECT * FROM deliveries WHERE id = ?`).get(id);
        if (!delivery) {
            return res.status(404).json({ success: false, message: "Delivery order not found" });
        }
        if (delivery.status === "done") {
            return res.status(400).json({ success: false, message: "Delivery is already validated" });
        }
        if (delivery.status === "canceled") {
            return res.status(400).json({ success: false, message: "Cannot validate a canceled delivery" });
        }

        const items = db
            .prepare(`SELECT product_id, quantity FROM delivery_items WHERE delivery_id = ?`)
            .all(id);

        if (items.length === 0) {
            return res.status(400).json({ success: false, message: "Delivery has no items to validate" });
        }

        // Check stock availability BEFORE making any changes
        const getStock = db.prepare(
            `SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?`
        );
        for (const item of items) {
            const stock = getStock.get(item.product_id, delivery.warehouse_id);
            const available = stock ? stock.quantity : 0;
            if (available < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product_id ${item.product_id}: available ${available}, requested ${item.quantity}`,
                });
            }
        }

        db.exec("BEGIN");

        const decrementStock = db.prepare(`
            UPDATE stock_levels SET quantity = quantity - ?
            WHERE product_id = ? AND warehouse_id = ?
        `);

        const insertLedger = db.prepare(`
            INSERT INTO stock_ledger (product_id, warehouse_id, change_qty, movement_type, reference_type, reference_id)
            VALUES (?, ?, ?, 'delivery', 'delivery', ?)
        `);

        for (const item of items) {
            decrementStock.run(item.quantity, item.product_id, delivery.warehouse_id);
            insertLedger.run(item.product_id, delivery.warehouse_id, -item.quantity, id);
        }

        db.prepare(
            `UPDATE deliveries SET status = 'done', validated_at = datetime('now') WHERE id = ?`
        ).run(id);

        db.exec("COMMIT");

        return res.json({
            success: true,
            message: `Delivery #${id} validated. Stock decreased for ${items.length} product(s).`,
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createDelivery,
    getDeliveries,
    getDeliveryById,
    validateDelivery,
};