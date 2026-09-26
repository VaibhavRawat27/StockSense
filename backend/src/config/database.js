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

// Apply schema.sql (Products/Suppliers/Warehouses stubs, Receipts,
// Stock Levels, Stock Ledger) on every startup. All statements use
// CREATE TABLE IF NOT EXISTS, so this is safe to re-run.
const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

console.log(`SQLite database connected & initialized: ${dbPath}`);

module.exports = db;