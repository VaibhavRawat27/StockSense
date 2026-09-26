const express = require("express");
const db = require("./config/database");

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Stock Sense API is running",
    });
});

app.get("/api/health", (req, res) => {
    const result = db.prepare("SELECT 1 AS database_status").get();

    res.json({
        status: "OK",
        database: result.database_status === 1 ? "connected" : "error",
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});