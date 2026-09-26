const db = require("../config/database");

/**
 * GET /api/products
 * List products with category, total on-hand stock across all locations,
 * warehouse breakdown, and reordering alert evaluation.
 * Query params: ?search=&category_id=&status=&sort=
 */
const getProducts = (req, res) => {
    const { search, category_id, status } = req.query;

    try {
        let query = `
            SELECT 
                p.id,
                p.name,
                p.sku,
                p.category_id,
                COALESCE(c.name, p.category, 'Uncategorized') AS category_name,
                COALESCE(c.code, 'N/A') AS category_code,
                COALESCE(p.uom, p.unit, 'Units') AS uom,
                p.description,
                p.barcode,
                COALESCE(p.price, 0.0) AS price,
                COALESCE(p.min_stock, p.reorder_level, 0) AS min_stock,
                COALESCE(p.max_stock, 100) AS max_stock,
                COALESCE(p.reorder_qty, 50) AS reorder_qty,
                p.preferred_vendor,
                p.created_at,
                p.updated_at,
                COALESCE(SUM(sl.quantity), 0) AS total_stock
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN stock_levels sl ON sl.product_id = p.id
            WHERE 1=1
        `;

        const params = [];

        if (category_id) {
            query += " AND p.category_id = ?";
            params.push(category_id);
        }

        if (search && search.trim()) {
            query += " AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)";
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        query += " GROUP BY p.id ORDER BY p.name ASC";

        const products = db.prepare(query).all(...params);

        // Fetch warehouse stocks for each product for fast per-location breakdown
        const allStockLevels = db.prepare(`
            SELECT 
                sl.product_id,
                sl.warehouse_id,
                w.name AS warehouse_name,
                w.code AS warehouse_code,
                sl.quantity,
                sl.bin_location
            FROM stock_levels sl
            JOIN warehouses w ON w.id = sl.warehouse_id
            WHERE w.is_active = 1
        `).all();

        const stockMap = {};
        for (const row of allStockLevels) {
            if (!stockMap[row.product_id]) {
                stockMap[row.product_id] = [];
            }
            stockMap[row.product_id].push({
                warehouse_id: row.warehouse_id,
                warehouse_name: row.warehouse_name,
                warehouse_code: row.warehouse_code,
                quantity: row.quantity,
                bin_location: row.bin_location || 'A-01'
            });
        }

        // Enrich with reorder rule status & per-warehouse stock array
        const enriched = products.map(p => {
            const totalStock = Number(p.total_stock);
            const minStock = Number(p.min_stock);
            const maxStock = Number(p.max_stock);

            let stockStatus = 'optimal';
            let alertMessage = 'Stock level is healthy';

            if (totalStock === 0) {
                stockStatus = 'out_of_stock';
                alertMessage = 'Critical: Completely out of stock!';
            } else if (totalStock <= minStock) {
                stockStatus = 'low_stock';
                alertMessage = `Reorder Alert: Stock (${totalStock}) is at or below minimum threshold (${minStock})`;
            } else if (maxStock > 0 && totalStock > maxStock) {
                stockStatus = 'overstock';
                alertMessage = `Notice: Stock (${totalStock}) exceeds maximum target capacity (${maxStock})`;
            }

            const suggestedReorder = (totalStock <= minStock) 
                ? (p.reorder_qty > 0 ? p.reorder_qty : Math.max(1, maxStock - totalStock))
                : 0;

            return {
                ...p,
                total_stock: totalStock,
                min_stock: minStock,
                max_stock: maxStock,
                stock_status: stockStatus,
                alert_message: alertMessage,
                suggested_reorder_qty: suggestedReorder,
                locations: stockMap[p.id] || []
            };
        });

        // Filter by status if requested
        const filtered = status
            ? enriched.filter(p => {
                if (status === 'low_stock') return p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock';
                if (status === 'out_of_stock') return p.stock_status === 'out_of_stock';
                if (status === 'optimal') return p.stock_status === 'optimal';
                if (status === 'overstock') return p.stock_status === 'overstock';
                return true;
            })
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
 * GET /api/products/:id
 */
const getProductById = (req, res) => {
    const { id } = req.params;

    try {
        const product = db.prepare(`
            SELECT 
                p.*,
                COALESCE(c.name, p.category, 'Uncategorized') AS category_name,
                COALESCE(c.code, 'N/A') AS category_code,
                COALESCE(p.uom, p.unit, 'Units') AS uom,
                COALESCE(p.min_stock, p.reorder_level, 0) AS min_stock,
                COALESCE(SUM(sl.quantity), 0) AS total_stock
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN stock_levels sl ON sl.product_id = p.id
            WHERE p.id = ?
            GROUP BY p.id
        `).get(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const locations = db.prepare(`
            SELECT 
                sl.warehouse_id,
                w.name AS warehouse_name,
                w.code AS warehouse_code,
                sl.quantity,
                sl.bin_location,
                sl.updated_at
            FROM stock_levels sl
            JOIN warehouses w ON w.id = sl.warehouse_id
            WHERE sl.product_id = ?
            ORDER BY w.id ASC
        `).all(id);

        const totalStock = Number(product.total_stock);
        const minStock = Number(product.min_stock);
        const maxStock = Number(product.max_stock || 100);

        let stockStatus = 'optimal';
        if (totalStock === 0) stockStatus = 'out_of_stock';
        else if (totalStock <= minStock) stockStatus = 'low_stock';
        else if (maxStock > 0 && totalStock > maxStock) stockStatus = 'overstock';

        return res.json({
            success: true,
            data: {
                ...product,
                stock_status: stockStatus,
                locations
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/products
 * Create a new product in the catalog with reordering rules and optional initial stock
 * Body: {
 *   name, sku, category_id, uom, description, barcode, price,
 *   min_stock, max_stock, reorder_qty, preferred_vendor,
 *   initial_stocks: [{ warehouse_id, quantity, bin_location }]
 * }
 */
const createProduct = (req, res) => {
    const {
        name,
        sku,
        category_id,
        uom,
        unit,
        description,
        barcode,
        price,
        min_stock,
        max_stock,
        reorder_qty,
        preferred_vendor,
        initial_stocks
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Product name is required" });
    }

    if (!sku || !sku.trim()) {
        return res.status(400).json({ success: false, message: "SKU / Product Code is required" });
    }

    const trimmedSku = sku.trim().toUpperCase();
    const trimmedName = name.trim();
    const finalUom = (uom && uom.trim()) || (unit && unit.trim()) || "Units";

    try {
        const existing = db.prepare("SELECT id FROM products WHERE sku = ?").get(trimmedSku);
        if (existing) {
            return res.status(409).json({ success: false, message: `A product with SKU "${trimmedSku}" already exists` });
        }

        // Fetch category name if category_id given
        let categoryName = null;
        if (category_id) {
            const cat = db.prepare("SELECT name FROM categories WHERE id = ?").get(category_id);
            if (cat) categoryName = cat.name;
        }

        db.exec("BEGIN");

        const insert = db.prepare(`
            INSERT INTO products (
                name, sku, category_id, category, unit, uom, description, barcode, price,
                min_stock, max_stock, reorder_qty, reorder_level, preferred_vendor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const minStk = min_stock !== undefined ? Number(min_stock) : 10;
        const maxStk = max_stock !== undefined ? Number(max_stock) : 100;
        const reorderQty = reorder_qty !== undefined ? Number(reorder_qty) : 50;

        const result = insert.run(
            trimmedName,
            trimmedSku,
            category_id ? Number(category_id) : null,
            categoryName,
            finalUom,
            finalUom,
            description ? description.trim() : null,
            barcode ? barcode.trim() : null,
            price ? Number(price) : 0.0,
            minStk,
            maxStk,
            reorderQty,
            minStk,
            preferred_vendor ? preferred_vendor.trim() : null
        );

        const productId = result.lastInsertRowid;

        // Process optional initial stock per warehouse
        if (Array.isArray(initial_stocks) && initial_stocks.length > 0) {
            const insertStock = db.prepare(`
                INSERT OR REPLACE INTO stock_levels (product_id, warehouse_id, quantity, bin_location)
                VALUES (?, ?, ?, ?)
            `);

            const insertLedger = db.prepare(`
                INSERT INTO stock_ledger (product_id, warehouse_id, change_qty, movement_type, reference_type, reference_id)
                VALUES (?, ?, ?, 'adjustment', 'initial_stock', ?)
            `);

            for (const stock of initial_stocks) {
                const whId = Number(stock.warehouse_id);
                const qty = Number(stock.quantity);
                const bin = stock.bin_location ? stock.bin_location.trim() : "A-01";

                if (whId && qty > 0) {
                    insertStock.run(productId, whId, qty, bin);
                    insertLedger.run(productId, whId, qty, Number(productId));
                }
            }
        }

        db.exec("COMMIT");

        const newProduct = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);

        return res.status(201).json({
            success: true,
            message: `Product "${newProduct.name}" (${newProduct.sku}) created successfully`,
            data: newProduct
        });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/products/:id
 * Update product catalog information and reordering rules
 */
const updateProduct = (req, res) => {
    const { id } = req.params;
    const {
        name,
        sku,
        category_id,
        uom,
        unit,
        description,
        barcode,
        price,
        min_stock,
        max_stock,
        reorder_qty,
        preferred_vendor
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Product name is required" });
    }

    try {
        const product = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (sku) {
            const trimmedSku = sku.trim().toUpperCase();
            const conflict = db.prepare("SELECT id FROM products WHERE sku = ? AND id != ?").get(trimmedSku, id);
            if (conflict) {
                return res.status(409).json({ success: false, message: `Another product already uses SKU "${trimmedSku}"` });
            }
        }

        let categoryName = null;
        if (category_id) {
            const cat = db.prepare("SELECT name FROM categories WHERE id = ?").get(category_id);
            if (cat) categoryName = cat.name;
        }

        const finalUom = (uom && uom.trim()) || (unit && unit.trim()) || null;
        const minStk = min_stock !== undefined ? Number(min_stock) : null;

        db.prepare(`
            UPDATE products
            SET 
                name = ?,
                sku = COALESCE(?, sku),
                category_id = COALESCE(?, category_id),
                category = COALESCE(?, category),
                unit = COALESCE(?, unit),
                uom = COALESCE(?, uom),
                description = COALESCE(?, description),
                barcode = COALESCE(?, barcode),
                price = COALESCE(?, price),
                min_stock = COALESCE(?, min_stock),
                reorder_level = COALESCE(?, reorder_level),
                max_stock = COALESCE(?, max_stock),
                reorder_qty = COALESCE(?, reorder_qty),
                preferred_vendor = COALESCE(?, preferred_vendor),
                updated_at = datetime('now')
            WHERE id = ?
        `).run(
            name.trim(),
            sku ? sku.trim().toUpperCase() : null,
            category_id ? Number(category_id) : null,
            categoryName,
            finalUom,
            finalUom,
            description !== undefined ? description : null,
            barcode !== undefined ? barcode : null,
            price !== undefined ? Number(price) : null,
            minStk,
            minStk,
            max_stock !== undefined ? Number(max_stock) : null,
            reorder_qty !== undefined ? Number(reorder_qty) : null,
            preferred_vendor !== undefined ? preferred_vendor : null,
            id
        );

        const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
        return res.json({ success: true, message: "Product updated successfully", data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * DELETE /api/products/:id
 */
const deleteProduct = (req, res) => {
    const { id } = req.params;

    try {
        const product = db.prepare("SELECT id, name, sku FROM products WHERE id = ?").get(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Check if product has on-hand stock
        const stockUnits = db.prepare("SELECT SUM(quantity) AS total FROM stock_levels WHERE product_id = ?").get(id);
        if (stockUnits && stockUnits.total > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete product "${product.name}". It currently has ${stockUnits.total} units in stock. Reconcile or adjust stock to 0 first.`
            });
        }

        db.exec("BEGIN");
        db.prepare("DELETE FROM stock_levels WHERE product_id = ?").run(id);
        db.prepare("DELETE FROM products WHERE id = ?").run(id);
        db.exec("COMMIT");

        return res.json({ success: true, message: `Product "${product.name}" (${product.sku}) removed from catalog` });
    } catch (err) {
        db.exec("ROLLBACK");
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
