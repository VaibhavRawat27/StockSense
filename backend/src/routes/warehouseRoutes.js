const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouseController");
const { verifyToken } = require("../middleware/authMiddleware");

// Secure all warehouse settings APIs behind auth middleware
router.use(verifyToken);

router.get("/", warehouseController.getWarehouses);
router.get("/:id", warehouseController.getWarehouseById);
router.post("/", warehouseController.createWarehouse);
router.put("/:id", warehouseController.updateWarehouse);
router.delete("/:id", warehouseController.deleteWarehouse);

module.exports = router;
