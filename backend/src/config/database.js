const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const dataDirectory = path.join(__dirname, "../../data");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, "stock-sense.db");
const db = new DatabaseSync(dbPath);

// Enable WAL mode for performance and concurrent reads
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize users table (Auth module)
const initUsers = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            employee_id TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL CHECK(role IN ('manager', 'staff')),
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password TEXT NOT NULL,
            phone_number TEXT,
            batch TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            email TEXT NOT NULL COLLATE NOCASE,
            token TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
        CREATE INDEX IF NOT EXISTS idx_password_resets_code ON password_resets(code);
        CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
    `);

    const countResult = db.prepare("SELECT COUNT(*) AS count FROM users").get();
    if (countResult.count === 0) {
        console.log("Seeding initial demo accounts for Inventory Manager and Warehouse Staff...");
        const insertUser = db.prepare(`
            INSERT INTO users (name, employee_id, role, email, password, phone_number, batch)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const managerHash = bcrypt.hashSync("Manager@123", 10);
        const staffHash = bcrypt.hashSync("Staff@123", 10);

        insertUser.run(
            "Sarah Jenkins",
            "MGR-1001",
            "manager",
            "manager@stocksense.com",
            managerHash,
            "+1 (555) 234-5678",
            "BATCH-HQ-ALPHA"
        );

        insertUser.run(
            "Marcus Vance",
            "STF-2042",
            "staff",
            "staff@stocksense.com",
            staffHash,
            "+1 (555) 876-5432",
            "BATCH-WH-BAY3"
        );

        console.log("Demo accounts seeded successfully.");
    }
};

initUsers();

// Apply schema.sql
const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

// ============================================================
// PHASE 3: PRODUCT & WAREHOUSE MASTER DATA MIGRATION & ENHANCEMENT
// ============================================================
const initMasterData = () => {
    // 1. Categories Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT UNIQUE,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
    `);

    // Helper to ensure columns exist in existing tables
    const ensureColumn = (tableName, columnName, columnDef) => {
        try {
            const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
            const hasColumn = columns.some(c => c.name === columnName);
            if (!hasColumn) {
                db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`);
            }
        } catch (e) {
            console.error(`Error adding column ${columnName} to ${tableName}:`, e.message);
        }
    };

    // 2. Enhance Warehouses table
    ensureColumn("warehouses", "code", "TEXT");
    ensureColumn("warehouses", "capacity", "INTEGER DEFAULT 50000");
    ensureColumn("warehouses", "type", "TEXT DEFAULT 'Distribution Center'");
    ensureColumn("warehouses", "is_active", "INTEGER DEFAULT 1");
    ensureColumn("warehouses", "contact_person", "TEXT");
    ensureColumn("warehouses", "contact_phone", "TEXT");
    ensureColumn("warehouses", "address", "TEXT");

    // 3. Enhance Products table
    ensureColumn("products", "category_id", "INTEGER REFERENCES categories(id)");
    ensureColumn("products", "uom", "TEXT DEFAULT 'pcs'");
    ensureColumn("products", "description", "TEXT");
    ensureColumn("products", "barcode", "TEXT");
    ensureColumn("products", "price", "REAL DEFAULT 0.0");
    ensureColumn("products", "min_stock", "INTEGER DEFAULT 10");
    ensureColumn("products", "max_stock", "INTEGER DEFAULT 100");
    ensureColumn("products", "reorder_qty", "INTEGER DEFAULT 50");
    ensureColumn("products", "preferred_vendor", "TEXT");
    ensureColumn("products", "updated_at", "TEXT DEFAULT (datetime('now'))");

    // 4. Enhance Stock Levels table
    ensureColumn("stock_levels", "bin_location", "TEXT DEFAULT 'A-01'");
    ensureColumn("stock_levels", "updated_at", "TEXT DEFAULT (datetime('now'))");

    // 5. Performance indexes for sub-second SKU search, reorder rules, and smart filters
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_stock_levels_lookup ON stock_levels(product_id, warehouse_id);
        CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
    `);

    // 6. Seed initial Categories if empty
    const catCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get();
    if (catCount.count === 0) {
        console.log("Seeding initial Product Categories...");
        const insertCategory = db.prepare(`
            INSERT INTO categories (name, code, description) VALUES (?, ?, ?)
        `);

        insertCategory.run("Electronics & Sensors", "CAT-ELEC", "Industrial barcode imagers, UHF tags, telemetry hardware");
        insertCategory.run("Packaging & Materials", "CAT-PACK", "Corrugated boxes, heavy stretch film, shipping containers");
        insertCategory.run("Material Handling & Tools", "CAT-TOOL", "Hydraulic pallet trucks, hand trucks, cargo load handling equipment");
        insertCategory.run("Safety & PPE", "CAT-SAFE", "High-visibility vests, safety gloves, protective warehouse apparel");
        insertCategory.run("Storage & Racking", "CAT-STOR", "Modular steel wire shelving, cantilever arms, heavy pallet racking");
    }

    // 6. Seed initial Warehouses if empty
    const whCount = db.prepare("SELECT COUNT(*) AS count FROM warehouses").get();
    if (whCount.count === 0) {
        console.log("Seeding initial Warehouse Master Data...");
        const insertWarehouse = db.prepare(`
            INSERT INTO warehouses (name, code, location, address, capacity, type, is_active, contact_person, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertWarehouse.run(
            "Central Logistics Hub",
            "WH-CENTRAL",
            "Dallas, TX",
            "1000 Logistics Blvd, Dallas, TX 75201",
            60000,
            "Central Distribution Hub",
            1,
            "Sarah Jenkins",
            "+1 (555) 234-5678"
        );

        insertWarehouse.run(
            "East Coast Terminal",
            "WH-EAST",
            "Newark, NJ",
            "450 Harbor Way, Bay 3, Newark, NJ 07101",
            35000,
            "Regional Fulfillment Center",
            1,
            "Marcus Vance",
            "+1 (555) 876-5432"
        );

        insertWarehouse.run(
            "West Coast Transit Depo",
            "WH-WEST",
            "Reno, NV",
            "88 Industrial Pkwy, Reno, NV 89501",
            25000,
            "Cross-Dock & Transit Facility",
            1,
            "Elena Rostova",
            "+1 (555) 345-6789"
        );
    }

    // Seed initial Suppliers if empty (needed for receipts and team integration flows)
    const supCount = db.prepare("SELECT COUNT(*) AS count FROM suppliers").get();
    if (supCount.count === 0) {
        console.log("Seeding initial Suppliers...");
        const insertSupplier = db.prepare(`
            INSERT INTO suppliers (name, contact_email) VALUES (?, ?)
        `);
        insertSupplier.run("Apex Steel & Industrial Supplies", "supplies@apexsteel.com");
        insertSupplier.run("ZebraTech Distribution", "orders@zebratech.com");
        insertSupplier.run("Grainger Industrial Safety", "support@grainger.com");
    }

    // 7. Seed initial Products & Stock Levels if empty
    const prodCount = db.prepare("SELECT COUNT(*) AS count FROM products").get();
    if (prodCount.count === 0) {
        console.log("Seeding initial Product Catalog and Per-Location Stock Levels...");

        const categories = db.prepare("SELECT id, name FROM categories").all();
        const getCatId = (name) => categories.find(c => c.name === name)?.id || 1;

        const warehouses = db.prepare("SELECT id, code FROM warehouses").all();
        const getWhId = (code) => warehouses.find(w => w.code === code)?.id || 1;

        const insertProduct = db.prepare(`
            INSERT INTO products (
                name, sku, category_id, category, unit, uom, description, barcode, price,
                min_stock, max_stock, reorder_qty, reorder_level, preferred_vendor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertStock = db.prepare(`
            INSERT OR REPLACE INTO stock_levels (product_id, warehouse_id, quantity, bin_location)
            VALUES (?, ?, ?, ?)
        `);

        const productsData = [
            {
                name: "Industrial Handheld Barcode Scanner 2D",
                sku: "SCAN-PRO-01",
                category: "Electronics & Sensors",
                uom: "Units",
                description: "Ruggedized IP65 cordless 2D barcode imager with Bluetooth cradle",
                barcode: "840192837401",
                price: 349.99,
                min_stock: 15,
                max_stock: 80,
                reorder_qty: 30,
                preferred_vendor: "ZebraTech Distribution",
                stocks: [
                    { wh: "WH-CENTRAL", qty: 42, bin: "A-12-01" },
                    { wh: "WH-EAST", qty: 18, bin: "B-04-02" },
                    { wh: "WH-WEST", qty: 12, bin: "C-01-05" }
                ]
            },
            {
                name: "Reinforced Corrugated Shipping Boxes 24x18x18",
                sku: "BOX-HVY-100",
                category: "Packaging & Materials",
                uom: "Boxes",
                description: "Heavy-duty double wall corrugated packing boxes (Bundle of 25)",
                barcode: "840192837402",
                price: 48.50,
                min_stock: 200,
                max_stock: 1500,
                reorder_qty: 500,
                preferred_vendor: "Packaging Corp Supply",
                stocks: [
                    { wh: "WH-CENTRAL", qty: 110, bin: "PALLET-BAY-09" },
                    { wh: "WH-EAST", qty: 45, bin: "PALLET-BAY-03" },
                    { wh: "WH-WEST", qty: 10, bin: "PALLET-BAY-01" }
                ]
            },
            {
                name: "Hydraulic Hand Pallet Truck 2500kg",
                sku: "PAL-HYD-25",
                category: "Material Handling & Tools",
                uom: "Units",
                description: "Heavy-duty polyurethane tandem load rollers with ergonomic spring handle",
                barcode: "840192837403",
                price: 420.00,
                min_stock: 6,
                max_stock: 25,
                reorder_qty: 10,
                preferred_vendor: "Crown Equipment Corp",
                stocks: [
                    { wh: "WH-CENTRAL", qty: 8, bin: "BAY-H-01" },
                    { wh: "WH-EAST", qty: 4, bin: "BAY-H-02" },
                    { wh: "WH-WEST", qty: 3, bin: "BAY-H-04" }
                ]
            },
            {
                name: "Ultra-High Frequency RFID Pallet Tags (Roll of 1000)",
                sku: "RFID-TAG-UHF",
                category: "Electronics & Sensors",
                uom: "Rolls",
                description: "Gen 2 UHF printable asset tags, 10m read range on plastic & cardboard",
                barcode: "840192837404",
                price: 185.00,
                min_stock: 40,
                max_stock: 200,
                reorder_qty: 80,
                preferred_vendor: "Avery Dennison Smartrac",
                stocks: [
                    { wh: "WH-CENTRAL", qty: 22, bin: "A-03-02" },
                    { wh: "WH-EAST", qty: 9, bin: "B-01-01" }
                ]
            },
            {
                name: "High-Visibility Reflective Safety Vests (ANSI Class 2)",
                sku: "PPE-VEST-OR",
                category: "Safety & PPE",
                uom: "Packs",
                description: "Fluorescent orange breathable mesh vest with 2-inch silver reflective tape",
                barcode: "840192837405",
                price: 65.00,
                min_stock: 50,
                max_stock: 350,
                reorder_qty: 100,
                preferred_vendor: "Grainger Industrial Safety",
                stocks: [
                    { wh: "WH-CENTRAL", qty: 140, bin: "SEC-SAFE-01" },
                    { wh: "WH-EAST", qty: 80, bin: "SEC-SAFE-02" },
                    { wh: "WH-WEST", qty: 65, bin: "SEC-SAFE-03" }
                ]
            },
            {
                name: "Heavy Duty Modular Steel Wire Shelving Rack",
                sku: "RCK-IND-04",
                category: "Storage & Racking",
                uom: "Units",
                description: "4-Tier commercial chrome wire shelving rack (800 lb per shelf capacity)",
                barcode: "840192837406",
                price: 195.00,
                min_stock: 10,
                max_stock: 50,
                reorder_qty: 20,
                preferred_vendor: "InterMetro Industries",
                stocks: [
                    { wh: "WH-CENTRAL", qty: 2, bin: "RACK-WH-08" },
                    { wh: "WH-EAST", qty: 1, bin: "RACK-WH-02" }
                ]
            }
        ];

        for (const item of productsData) {
            const catId = getCatId(item.category);
            const res = insertProduct.run(
                item.name,
                item.sku,
                catId,
                item.category,
                item.uom,
                item.uom,
                item.description,
                item.barcode,
                item.price,
                item.min_stock,
                item.max_stock,
                item.reorder_qty,
                item.min_stock,
                item.preferred_vendor
            );

            const productId = res.lastInsertRowid;

            for (const stock of item.stocks) {
                const whId = getWhId(stock.wh);
                insertStock.run(productId, whId, stock.qty, stock.bin);
            }
        }

        console.log("Initial Product Catalog and stock distribution seeded successfully.");
    }
};

initMasterData();

console.log(`SQLite database connected & initialized: ${dbPath}`);

module.exports = db;