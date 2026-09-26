const express = require("express");
const router = express.Router();
const {
    createDelivery,
    getDeliveries,
    getDeliveryById,
    validateDelivery,
} = require("../controllers/deliveryController");

router.post("/", createDelivery);
router.get("/", getDeliveries);
router.get("/:id", getDeliveryById);
router.post("/:id/validate", validateDelivery);

module.exports = router;