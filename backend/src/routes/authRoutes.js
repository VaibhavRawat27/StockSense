const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public auth endpoints
router.post("/register", authController.register);
router.post("/signup", authController.register); // alias for convenience
router.post("/login", authController.login);

// Password recovery endpoints (Google SMTP powered)
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-code", authController.verifyResetCode);
router.post("/reset-password", authController.resetPassword);
router.get("/smtp-status", authController.getSmtpStatus);

// Protected endpoints
router.get("/me", verifyToken, authController.getMe);
router.get("/team", verifyToken, authController.getTeamMembers);

module.exports = router;
