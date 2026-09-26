const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

// Single SQLite file at project root: backend/database.sqlite
const dbPath = path.join(__dirname, "..", "..", "database.sqlite");

const db = new DatabaseSync(dbPath);

// Enforce foreign key constraints (off by default in SQLite)
db.exec("PRAGMA foreign_keys = ON;");

// Apply schema.sql on every startup. All statements use
// CREATE TABLE IF NOT EXISTS, so this is safe to re-run and
// needs no separate migration step.
const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");
db.exec(schema);

module.exports = db;