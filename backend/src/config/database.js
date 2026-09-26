const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const dataDirectory = path.join(__dirname, "../../data");

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}

const dbPath = path.join(dataDirectory, "stock-sense.db");
const db = new Database(dbPath);

// Enable WAL mode for performance and concurrent reads
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Initialize users table
const initDatabase = () => {
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

    // Check if initial demo accounts exist, seed if empty
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

initDatabase();

console.log(`SQLite database connected & initialized: ${dbPath}`);

module.exports = db;