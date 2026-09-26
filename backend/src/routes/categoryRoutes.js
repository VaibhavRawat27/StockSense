const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyToken } = require("../middleware/authMiddleware");

// Secure category management APIs behind auth middleware
router.use(verifyToken);

router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);
router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
