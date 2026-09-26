const db = require("../config/database");

/**
 * GET /api/stock
 * Returns stock availability per location.
 * Query params: ?warehouse_id=&product_id=&low_stock_only=true
 */
const getStockAvailability = (req, res) => {
    const { warehouse_id, product_id, low_stock_only } = req.query;

    try {
        let query = `
            SELECT 
                sl.id AS stock_id,
                sl.product_id,
                p.name AS product_name,
                p.sku AS product_sku,
                p.uom,
                COALESCE(c.name, p.category, 'General') AS category_name,
                sl.warehouse_id,
                w.name AS warehouse_name,
                w.code AS warehouse_code,
                w.location AS warehouse_location,
                sl.quantity,
                sl.bin_location,
                COALESCE(p.min_stock, 10) AS min_stock,
                COALESCE(p.max_stock, 100) AS max_stock,
                COALESCE(p.reorder_qty, 50) AS reorder_qty,
                p.preferred_vendor,
                sl.updated_at
            FROM stock_levels sl
            JOIN products p ON p.id = sl.product_id
            JOIN warehouses w ON w.id = sl.warehouse_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE w.is_active = 1
        `;

        const params = [];

        if (warehouse_id) {
            query += " AND sl.warehouse_id = ?";
            params.push(warehouse_id);
        }

        if (product_id) {
            query += " AND sl.product_id = ?";
            params.push(product_id);
        }

        query += " ORDER BY w.name ASC, p.name ASC";

        const rows = db.prepare(query).all(...params);

        // Map status per line item
        const enriched = rows.map(r => {
            const qty = Number(r.quantity);
            const minStk = Number(r.min_stock);
            const maxStk = Number(r.max_stock);

            let status = 'optimal';
            if (qty === 0) status = 'out_of_stock';
            else if (qty <= minStk) status = 'low_stock';
            else if (maxStk > 0 && qty > maxStk) status = 'overstock';

            return {
                ...r,
                status,
                reorder_needed: qty <= minStk,
                suggested_reorder_qty: qty <= minStk ? (r.reorder_qty || Math.max(1, maxStk - qty)) : 0
            };
        });

        const filtered = low_stock_only === 'true'
            ? enriched.filter(r => r.reorder_needed)
            : enriched;

        return res.json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/stock/adjust
 * Adjust stock level or bin location directly for a product in a warehouse
 * Body: { product_id, warehouse_id, quantity, bin_location, reason }
 */
const adjustStock = (req, res) => {
    const { product_id, warehouse_id, quantity, bin_location, reason } = req.body;

    if (!product_id || !warehouse_id || quantity === undefined) {
        return res.status(400).json({
            success: false,
            message: "product_id, warehouse_id, and quantity are required"
        });
    }

    const newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 0) {
        return res.status(400).json({ success: false, message: "Quantity must be a non-negative number" });
    }

    try {
        db.exec("BEGIN");

        const existing = db.prepare(`
            SELECT quantity, bin_location FROM stock_levels 
            WHERE product_id = ? AND warehouse_id = ?
        `).get(product_id, warehouse_id);

        const prevQty = existing ? Number(existing.quantity) : 0;
        const diff = newQty - prevQty;
        const bin = bin_location ? bin_location.trim() : (existing ? existing.bin_location : "A-01");

        db.prepare(`
            INSERT INTO stock_levels (product_id, warehouse_id, quantity, bin_location, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(product_id, warehouse_id)
            DO UPDATE SET 
                quantity = excluded.quantity,
                bin_location = COALESCE(excluded.bin_location, stock_levels.bin_location),
                updated_at = datetime('now')
        `).run(product_id, warehouse_id, newQty, bin);

        // Log adjustment to stock_ledger if quantity changed
        if (diff !== 0) {
            db.prepare(`
                INSERT INTO stock_ledger (product_id, warehouse_id, change_qty, movement_type, reference_type, reference_id)
                VALUES (?, ?, ?, 'adjustment', 'manual_adjustment', ?)
            `).run(product_id, warehouse_id, diff, Number(product_id));

            // Also record in adjustments table for audit trail
            db.prepare(`
                INSERT INTO adjustments (product_id, warehouse_id, previous_quantity, counted_quantity, difference, reason)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(product_id, warehouse_id, prevQty, newQty, diff, reason || "Manual location stock adjustment");
        }

        db.exec("COMMIT");

        const updated = db.prepare(`
            SELECT sl.*, p.name AS product_name, p.sku, w.name AS warehouse_name
            FROM stock_levels sl
            JOIN products p ON p.id = sl.product_id
            JOIN warehouses w ON w.id = sl.warehouse_id
            WHERE sl.product_id = ? AND sl.warehouse_id = ?
        `).get(product_id, warehouse_id);

        return res.json({
            success: true,
            message: `Stock for ${updated.product_name} in ${updated.warehouse_name} updated to ${newQty} ${updated.bin_location ? `(Bin: ${updated.bin_location})` : ''}`,
            data: updated
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/stock/alerts
 * Returns all products that have triggered reorder alerts (total_stock <= min_stock)
 */
const getReorderAlerts = (req, res) => {
    try {
        const query = `
            SELECT 
                p.id,
                p.name,
                p.sku,
                COALESCE(c.name, 'Uncategorized') AS category_name,
                p.uom,
                p.min_stock,
                p.max_stock,
                p.reorder_qty,
                p.preferred_vendor,
                COALESCE(SUM(sl.quantity), 0) AS total_stock
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN stock_levels sl ON sl.product_id = p.id
            GROUP BY p.id
            HAVING COALESCE(SUM(sl.quantity), 0) <= p.min_stock
            ORDER BY total_stock ASC
        `;

        const alerts = db.prepare(query).all();

        const enriched = alerts.map(a => {
            const current = Number(a.total_stock);
            const minStk = Number(a.min_stock);
            const maxStk = Number(a.max_stock);
            const deficit = Math.max(0, minStk - current);
            const suggestedReorder = a.reorder_qty > 0 ? a.reorder_qty : (maxStk - current);

            return {
                ...a,
                deficit,
                suggested_reorder_qty: suggestedReorder,
                urgency: current === 0 ? 'CRITICAL' : 'WARNING'
            };
        });

        return res.json({
            success: true,
            count: enriched.length,
            data: enriched
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getStockAvailability,
    adjustStock,
    getReorderAlerts,
};
