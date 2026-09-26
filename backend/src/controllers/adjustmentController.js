const db = require("../config/database");

/**
 * POST /api/adjustments
 * Reconciles recorded stock with a physical count for one product/warehouse.
 * Body: { product_id, warehouse_id, counted_quantity, reason? }
 *
 * Steps (per work plan):
 * 1. Select product/location
 * 2. Enter counted quantity
 * 3. System auto-updates stock and logs the adjustment
 */
const createAdjustment = (req, res) => {
    const { product_id, warehouse_id, counted_quantity, reason } = req.body;

    if (!product_id || !warehouse_id) {
        return res.status(400).json({
            success: false,
            message: "product_id and warehouse_id are required",
        });
    }

    if (counted_quantity === undefined || counted_quantity === null || counted_quantity < 0) {
        return res.status(400).json({
            success: false,
            message: "counted_quantity is required and must be >= 0",
        });
    }

    try {
        const stock = db
            .prepare(`SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?`)
            .get(product_id, warehouse_id);

        const previousQuantity = stock ? stock.quantity : 0;
        const difference = counted_quantity - previousQuantity;

        if (difference === 0) {
            return res.status(200).json({
                success: true,
                message: "Counted quantity matches recorded stock. No adjustment needed.",
                data: { previous_quantity: previousQuantity, counted_quantity, difference: 0 },
            });
        }

        db.exec("BEGIN");

        // Set stock to exactly the counted quantity (upsert)
        db.prepare(`
            INSERT INTO stock_levels (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(product_id, warehouse_id)
            DO UPDATE SET quantity = excluded.quantity
        `).run(product_id, warehouse_id, counted_quantity);

        const adjustmentResult = db.prepare(`
            INSERT INTO adjustments (product_id, warehouse_id, previous_quantity, counted_quantity, difference, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(product_id, warehouse_id, previousQuantity, counted_quantity, difference, reason || null);

        const adjustmentId = adjustmentResult.lastInsertRowid;

        db.prepare(`
            INSERT INTO stock_ledger (product_id, warehouse_id, change_qty, movement_type, reference_type, reference_id)
            VALUES (?, ?, ?, 'adjustment', 'adjustment', ?)
        `).run(product_id, warehouse_id, difference, adjustmentId);

        db.exec("COMMIT");

        return res.status(201).json({
            success: true,
            message: `Stock adjusted from ${previousQuantity} to ${counted_quantity} (${difference > 0 ? "+" : ""}${difference}).`,
            data: {
                adjustment_id: Number(adjustmentId),
                previous_quantity: previousQuantity,
                counted_quantity,
                difference,
            },
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/adjustments
 * List all adjustments, most recent first.
 */
const getAdjustments = (req, res) => {
    try {
        const rows = db
            .prepare(
                `SELECT a.*, p.name AS product_name, p.sku, w.name AS warehouse_name
                 FROM adjustments a
                 JOIN products p ON p.id = a.product_id
                 JOIN warehouses w ON w.id = a.warehouse_id
                 ORDER BY a.id DESC`
            )
            .all();

        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/adjustments/:id
 */
const getAdjustmentById = (req, res) => {
    const { id } = req.params;

    try {
        const row = db
            .prepare(
                `SELECT a.*, p.name AS product_name, p.sku, w.name AS warehouse_name
                 FROM adjustments a
                 JOIN products p ON p.id = a.product_id
                 JOIN warehouses w ON w.id = a.warehouse_id
                 WHERE a.id = ?`
            )
            .get(id);

        if (!row) {
            return res.status(404).json({ success: false, message: "Adjustment not found" });
        }

        return res.json({ success: true, data: row });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createAdjustment,
    getAdjustments,
    getAdjustmentById,
};