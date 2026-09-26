const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken } = require("../middleware/authMiddleware");

// Secure all product catalog APIs behind auth middleware
router.use(verifyToken);

router.get("/alerts", productController.getReorderAlerts);
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
