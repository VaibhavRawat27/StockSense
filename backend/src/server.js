const express = require("express");
const cors = require("cors");
const db = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const transferRoutes = require("./routes/transferRoutes");
const adjustmentRoutes = require("./routes/adjustmentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/adjustments", adjustmentRoutes);

app.get("/", (req, res) => {
    res.json({
        name: "StockSense API",
        version: "1.0.0",
        message: "Stock Sense Inventory & Warehouse Management API is running",
        endpoints: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login",
            me: "GET /api/auth/me",
            health: "GET /api/health",
        },
    });
});

app.get("/api/health", (req, res) => {
    try {
        const result = db.prepare("SELECT 1 AS database_status").get();
        const userCount = db.prepare("SELECT COUNT(*) AS total_users FROM users").get();

        res.json({
            status: "OK",
            timestamp: new Date().toISOString(),
            database: result.database_status === 1 ? "connected" : "error",
            total_registered_users: userCount.total_users,
        });
    } catch (err) {
        res.status(500).json({
            status: "ERROR",
            message: err.message,
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.url} not found`,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Server unhandled error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error occurred",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

app.listen(PORT, () => {
    console.log(`🚀 StockSense Backend Server running on http://localhost:${PORT}`);
});