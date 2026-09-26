const db = require("../config/database");

/**
 * GET /api/warehouses
 * List all warehouses with live inventory KPIs and capacity utilization
 */
const getWarehouses = (req, res) => {
    try {
        const warehouses = db.prepare(`
            SELECT 
                w.id,
                w.name,
                w.code,
                w.location,
                w.address,
                COALESCE(w.capacity, 50000) AS capacity,
                COALESCE(w.type, 'Distribution Center') AS type,
                COALESCE(w.is_active, 1) AS is_active,
                w.contact_person,
                w.contact_phone,
                w.created_at,
                COUNT(DISTINCT CASE WHEN sl.quantity > 0 THEN sl.product_id END) AS distinct_skus,
                COALESCE(SUM(sl.quantity), 0) AS total_units_stored
            FROM warehouses w
            LEFT JOIN stock_levels sl ON sl.warehouse_id = w.id
            GROUP BY w.id
            ORDER BY w.id ASC
        `).all();

        // Calculate utilization % for each warehouse
        const enriched = warehouses.map(wh => {
            const cap = wh.capacity || 50000;
            const utilization = Math.min(100, Math.round((wh.total_units_stored / cap) * 100 * 10) / 10);
            return {
                ...wh,
                utilization_percentage: utilization,
                available_capacity: Math.max(0, cap - wh.total_units_stored)
            };
        });

        return res.json({ success: true, count: enriched.length, data: enriched });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/warehouses/:id
 * Get single warehouse details along with current stock breakdown
 */
const getWarehouseById = (req, res) => {
    const { id } = req.params;

    try {
        const warehouse = db.prepare(`
            SELECT 
                w.*,
                COUNT(DISTINCT CASE WHEN sl.quantity > 0 THEN sl.product_id END) AS distinct_skus,
                COALESCE(SUM(sl.quantity), 0) AS total_units_stored
            FROM warehouses w
            LEFT JOIN stock_levels sl ON sl.warehouse_id = w.id
            WHERE w.id = ?
            GROUP BY w.id
        `).get(id);

        if (!warehouse) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }

        const stockItems = db.prepare(`
            SELECT 
                sl.id AS stock_id,
                sl.quantity,
                sl.bin_location,
                p.id AS product_id,
                p.name AS product_name,
                p.sku,
                p.uom,
                p.category,
                p.min_stock,
                p.max_stock,
                p.reorder_qty
            FROM stock_levels sl
            JOIN products p ON p.id = sl.product_id
            WHERE sl.warehouse_id = ?
            ORDER BY p.name ASC
        `).all(id);

        const cap = warehouse.capacity || 50000;
        const utilization = Math.min(100, Math.round((warehouse.total_units_stored / cap) * 100 * 10) / 10);

        return res.json({
            success: true,
            data: {
                ...warehouse,
                utilization_percentage: utilization,
                available_capacity: Math.max(0, cap - warehouse.total_units_stored),
                inventory_items: stockItems
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/warehouses
 * Create a new warehouse facility (Settings → Warehouse Setup)
 * Body: { name, code, location, address, capacity, type, is_active, contact_person, contact_phone }
 */
const createWarehouse = (req, res) => {
    const {
        name,
        code,
        location,
        address,
        capacity,
        type,
        is_active,
        contact_person,
        contact_phone
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Warehouse name is required" });
    }

    const trimmedName = name.trim();
    const generatedCode = (code && code.trim()) 
        ? code.trim().toUpperCase() 
        : `WH-${trimmedName.replace(/[^A-Za-z0-9]/g, '').slice(0, 5).toUpperCase()}`;

    try {
        const existing = db.prepare("SELECT id FROM warehouses WHERE code = ? OR name = ?").get(generatedCode, trimmedName);
        if (existing) {
            return res.status(409).json({ success: false, message: `Warehouse with name "${trimmedName}" or code "${generatedCode}" already exists` });
        }

        const insert = db.prepare(`
            INSERT INTO warehouses (name, code, location, address, capacity, type, is_active, contact_person, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insert.run(
            trimmedName,
            generatedCode,
            location ? location.trim() : (address ? address.trim() : "Main Site"),
            address ? address.trim() : (location ? location.trim() : null),
            capacity ? Number(capacity) : 50000,
            type ? type.trim() : "Distribution Center",
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            contact_person ? contact_person.trim() : null,
            contact_phone ? contact_phone.trim() : null
        );

        const newWh = db.prepare("SELECT * FROM warehouses WHERE id = ?").get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: `Warehouse facility "${newWh.name}" (${newWh.code}) created successfully`,
            data: newWh
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/warehouses/:id
 * Update warehouse settings
 */
const updateWarehouse = (req, res) => {
    const { id } = req.params;
    const {
        name,
        code,
        location,
        address,
        capacity,
        type,
        is_active,
        contact_person,
        contact_phone
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Warehouse name is required" });
    }

    try {
        const warehouse = db.prepare("SELECT id FROM warehouses WHERE id = ?").get(id);
        if (!warehouse) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }

        const trimmedName = name.trim();
        const trimmedCode = code ? code.trim().toUpperCase() : null;

        // Check conflicts
        if (trimmedCode) {
            const conflict = db.prepare("SELECT id FROM warehouses WHERE code = ? AND id != ?").get(trimmedCode, id);
            if (conflict) {
                return res.status(409).json({ success: false, message: `Another warehouse already has code "${trimmedCode}"` });
            }
        }

        db.prepare(`
            UPDATE warehouses 
            SET 
                name = ?,
                code = COALESCE(?, code),
                location = COALESCE(?, location),
                address = COALESCE(?, address),
                capacity = COALESCE(?, capacity),
                type = COALESCE(?, type),
                is_active = COALESCE(?, is_active),
                contact_person = COALESCE(?, contact_person),
                contact_phone = COALESCE(?, contact_phone)
            WHERE id = ?
        `).run(
            trimmedName,
            trimmedCode,
            location ? location.trim() : null,
            address ? address.trim() : null,
            capacity ? Number(capacity) : null,
            type ? type.trim() : null,
            is_active !== undefined ? (is_active ? 1 : 0) : null,
            contact_person ? contact_person.trim() : null,
            contact_phone ? contact_phone.trim() : null,
            id
        );

        const updated = db.prepare("SELECT * FROM warehouses WHERE id = ?").get(id);
        return res.json({ success: true, message: "Warehouse settings updated successfully", data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * DELETE /api/warehouses/:id
 */
const deleteWarehouse = (req, res) => {
    const { id } = req.params;

    try {
        const warehouse = db.prepare("SELECT id, name, code FROM warehouses WHERE id = ?").get(id);
        if (!warehouse) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }

        // Check if warehouse has on-hand stock
        const stockUnits = db.prepare("SELECT SUM(quantity) AS total FROM stock_levels WHERE warehouse_id = ?").get(id);
        if (stockUnits && stockUnits.total > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete warehouse "${warehouse.name}". It currently holds ${stockUnits.total} units of stock. Transfer or adjust stock to 0 first.`
            });
        }

        // Clean empty stock_levels rows for this warehouse
        db.prepare("DELETE FROM stock_levels WHERE warehouse_id = ?").run(id);
        db.prepare("DELETE FROM warehouses WHERE id = ?").run(id);

        return res.json({ success: true, message: `Warehouse "${warehouse.name}" (${warehouse.code}) deleted successfully` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
};
