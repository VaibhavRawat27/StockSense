const path = require("path");
const Database = require("better-sqlite3");

// Single SQLite file at project root: backend/database.sqlite
const dbPath = path.join(__dirname, "..", "..", "database.sqlite");

const db = new Database(dbPath);

// Enforce foreign key constraints (off by default in SQLite)
db.pragma("foreign_keys = ON");

module.exports = db;