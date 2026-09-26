const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const { verifyToken } = require("../middleware/authMiddleware");

// Secure stock availability and adjustment APIs behind auth middleware
router.use(verifyToken);

router.get("/alerts", stockController.getReorderAlerts);
router.get("/", stockController.getStockAvailability);
router.put("/adjust", stockController.adjustStock);

module.exports = router;
