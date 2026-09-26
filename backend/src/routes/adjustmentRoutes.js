const express = require("express");
const router = express.Router();
const {
    createAdjustment,
    getAdjustments,
    getAdjustmentById,
} = require("../controllers/adjustmentController");

router.post("/", createAdjustment);
router.get("/", getAdjustments);
router.get("/:id", getAdjustmentById);

module.exports = router;