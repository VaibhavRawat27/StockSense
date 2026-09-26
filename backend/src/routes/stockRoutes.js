const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

router.get("/", stockController.getStockAvailability);
router.get("/alerts", stockController.getReorderAlerts);
router.put("/adjust", stockController.adjustStock);

module.exports = router;
