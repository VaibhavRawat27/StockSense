const db = require("../config/database");

/**
 * GET /api/categories
 * List all product categories with associated product count
 */
const getCategories = (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT 
                c.id, 
                c.name, 
                c.code, 
                c.description, 
                c.created_at,
                COUNT(p.id) AS product_count,
                COALESCE(SUM(sl.quantity), 0) AS total_units_in_stock
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            LEFT JOIN stock_levels sl ON sl.product_id = p.id
            GROUP BY c.id
            ORDER BY c.name ASC
        `).all();

        return res.json({ success: true, count: categories.length, data: categories });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/categories/:id
 */
const getCategoryById = (req, res) => {
    const { id } = req.params;
    try {
        const category = db.prepare(`
            SELECT c.*, COUNT(p.id) AS product_count 
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            WHERE c.id = ?
            GROUP BY c.id
        `).get(id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        return res.json({ success: true, data: category });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/categories
 * Body: { name, code, description }
 */
const createCategory = (req, res) => {
    const { name, code, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const trimmedName = name.trim();
    const generatedCode = (code && code.trim()) ? code.trim().toUpperCase() : `CAT-${trimmedName.slice(0, 4).toUpperCase()}`;

    try {
        const existing = db.prepare("SELECT id FROM categories WHERE name = ? OR code = ?").get(trimmedName, generatedCode);
        if (existing) {
            return res.status(409).json({ success: false, message: "A category with this name or code already exists" });
        }

        const result = db.prepare(`
            INSERT INTO categories (name, code, description) VALUES (?, ?, ?)
        `).run(trimmedName, generatedCode, description ? description.trim() : null);

        const newCategory = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: newCategory
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/categories/:id
 * Body: { name, code, description }
 */
const updateCategory = (req, res) => {
    const { id } = req.params;
    const { name, code, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Category name is required" });
    }

    try {
        const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const trimmedName = name.trim();
        const trimmedCode = code ? code.trim().toUpperCase() : null;

        // Check conflicts
        const duplicate = db.prepare(`
            SELECT id FROM categories 
            WHERE (name = ? OR (code = ? AND code IS NOT NULL)) AND id != ?
        `).get(trimmedName, trimmedCode, id);

        if (duplicate) {
            return res.status(409).json({ success: false, message: "Another category already uses this name or code" });
        }

        db.prepare(`
            UPDATE categories 
            SET name = ?, code = COALESCE(?, code), description = ?
            WHERE id = ?
        `).run(trimmedName, trimmedCode, description ? description.trim() : null, id);

        // Also update text category name in products table for backward compatibility
        db.prepare("UPDATE products SET category = ? WHERE category_id = ?").run(trimmedName, id);

        const updated = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
        return res.json({ success: true, message: "Category updated successfully", data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * DELETE /api/categories/:id
 */
const deleteCategory = (req, res) => {
    const { id } = req.params;
    try {
        const category = db.prepare("SELECT id, name FROM categories WHERE id = ?").get(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const productsCount = db.prepare("SELECT COUNT(*) AS count FROM products WHERE category_id = ?").get(id);
        if (productsCount.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category "${category.name}". It is assigned to ${productsCount.count} product(s). Please reassign them first.`
            });
        }

        db.prepare("DELETE FROM categories WHERE id = ?").run(id);
        return res.json({ success: true, message: `Category "${category.name}" deleted successfully` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
