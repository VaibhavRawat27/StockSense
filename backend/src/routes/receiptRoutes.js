const express = require("express");
const router = express.Router();
const {
    createReceipt,
    getReceipts,
    getReceiptById,
    validateReceipt,
} = require("../controllers/receiptController");

router.post("/", createReceipt);
router.get("/", getReceipts);
router.get("/:id", getReceiptById);
router.post("/:id/validate", validateReceipt);

module.exports = router;