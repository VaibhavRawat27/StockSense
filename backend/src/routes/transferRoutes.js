const express = require("express");
const router = express.Router();
const {
    createTransfer,
    getTransfers,
    getTransferById,
    validateTransfer,
} = require("../controllers/transferController");

router.post("/", createTransfer);
router.get("/", getTransfers);
router.get("/:id", getTransferById);
router.post("/:id/validate", validateTransfer);

module.exports = router;