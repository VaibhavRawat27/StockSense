const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const emailService = require("../services/emailService");

// Helper to sign JWT token
const signToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            employee_id: user.employee_id,
            name: user.name,
            batch: user.batch,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Register new user (Manager or Staff)
exports.register = async (req, res) => {
    try {
        const { name, employee_id, role, email, password, phone_number, batch } = req.body;

        // Validation
        if (!name || !employee_id || !role || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, employee_id, role, email, and password are required.",
            });
        }

        const normalizedRole = role.toLowerCase().trim();
        if (!["manager", "staff"].includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either 'manager' or 'staff'.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedEmployeeId = employee_id.trim().toUpperCase();

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        // Check if email already registered
        const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "An account with this email address already exists.",
            });
        }

        // Check if employee_id already registered
        const existingEmployeeId = db.prepare("SELECT id FROM users WHERE employee_id = ?").get(normalizedEmployeeId);
        if (existingEmployeeId) {
            return res.status(409).json({
                success: false,
                message: `Employee ID "${normalizedEmployeeId}" is already assigned to an existing user.`,
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert into SQLite
        const insertStmt = db.prepare(`
            INSERT INTO users (name, employee_id, role, email, password, phone_number, batch)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertStmt.run(
            name.trim(),
            normalizedEmployeeId,
            normalizedRole,
            normalizedEmail,
            hashedPassword,
            phone_number ? phone_number.trim() : null,
            batch ? batch.trim() : "GENERAL-01"
        );

        const newUser = db.prepare(`
            SELECT id, name, employee_id, role, email, phone_number, batch, created_at
            FROM users WHERE id = ?
        `).get(result.lastInsertRowid);

        const token = signToken(newUser);

        return res.status(201).json({
            success: true,
            message: `Account created successfully for ${newUser.name} (${newUser.role === "manager" ? "Inventory Manager" : "Warehouse Staff"})`,
            token,
            user: newUser,
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during registration.",
            error: error.message,
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Search user by email (or allow employee_id login as well for convenience)
        const user = db.prepare(`
            SELECT id, name, employee_id, role, email, password, phone_number, batch, created_at
            FROM users 
            WHERE email = ? OR employee_id = ?
        `).get(normalizedEmail, email.trim().toUpperCase());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials. No user found with this email or Employee ID.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials. Password is incorrect.",
            });
        }

        // Strip password before returning
        const { password: _, ...userWithoutPassword } = user;
        const token = signToken(userWithoutPassword);

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            token,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login.",
            error: error.message,
        });
    }
};

// Get current logged-in user profile
exports.getMe = (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, name, employee_id, role, email, phone_number, batch, created_at
            FROM users WHERE id = ?
        `).get(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("GetMe error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user details.",
            error: error.message,
        });
    }
};

// List all warehouse team members (useful for managers to see their staff)
exports.getTeamMembers = (req, res) => {
    try {
        const users = db.prepare(`
            SELECT id, name, employee_id, role, email, phone_number, batch, created_at
            FROM users
            ORDER BY created_at DESC
        `).all();

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching team members.",
            error: error.message,
        });
    }
};

// ============================================================
// FORGOT & RESET PASSWORD (GOOGLE SMTP APP PASSWORD POWERED)
// ============================================================

// Initiate forgot password request -> sends email via Google SMTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide the email address registered with your account.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = db.prepare("SELECT id, name, email FROM users WHERE email = ?").get(normalizedEmail);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No account found with email "${normalizedEmail}". Please check your spelling or register.`,
            });
        }

        // Invalidate previous active reset tokens for this email
        db.prepare("UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0").run(normalizedEmail);

        // Generate 6-digit OTP code and secure 64-char hex token
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString("hex");

        // 15-minute expiration
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        db.prepare(`
            INSERT INTO password_resets (user_id, email, token, code, expires_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(user.id, normalizedEmail, token, code, expiresAt);

        // Send email via Google SMTP
        const emailResult = await emailService.sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            code,
            token,
        });

        return res.status(200).json({
            success: true,
            message: emailResult.delivered
                ? `Password reset code sent to ${user.email} via Google SMTP!`
                : (emailResult.simulated
                    ? `Password reset request created. (Note: Google SMTP credentials pending in .env, code captured on server).`
                    : `Password reset code generated.`),
            email: user.email,
            expiresInMinutes: 15,
            smtpDelivered: emailResult.delivered,
            // In dev mode or if SMTP is simulated, expose code for easy testing
            ...(emailResult.simulated || process.env.NODE_ENV !== "production"
                ? { devCode: code, devToken: token, devResetUrl: emailResult.resetUrl }
                : {}),
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing your password reset request.",
            error: error.message,
        });
    }
};

// Verify OTP or token validity before submitting new password
exports.verifyResetCode = (req, res) => {
    try {
        const { email, code, token } = req.body;
        if (!email || (!code && !token)) {
            return res.status(400).json({
                success: false,
                message: "Email and either verification code or token are required.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        let resetRecord;
        if (code) {
            resetRecord = db.prepare(`
                SELECT id, user_id, email, expires_at, used
                FROM password_resets
                WHERE email = ? AND code = ? AND used = 0
                ORDER BY created_at DESC LIMIT 1
            `).get(normalizedEmail, code.trim());
        } else if (token) {
            resetRecord = db.prepare(`
                SELECT id, user_id, email, expires_at, used
                FROM password_resets
                WHERE email = ? AND token = ? AND used = 0
                ORDER BY created_at DESC LIMIT 1
            `).get(normalizedEmail, token.trim());
        }

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code or link. Please check your email or request a new code.",
            });
        }

        if (new Date(resetRecord.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "This verification code has expired (15 minute validity). Please request a new one.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Verification code is valid. You can now choose a new password.",
            email: resetRecord.email,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying reset code.",
            error: error.message,
        });
    }
};

// Submit new password with verification code or token
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, token, new_password, newPassword, confirm_password, confirmPassword } = req.body;
        const passwordToSet = new_password || newPassword;
        const confirmToSet = confirm_password || confirmPassword;

        if (!email || (!code && !token) || !passwordToSet) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: email, verification code/token, and new password are required.",
            });
        }

        if (passwordToSet.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long.",
            });
        }

        if (confirmToSet && confirmToSet !== passwordToSet) {
            return res.status(400).json({
                success: false,
                message: "Password confirmation does not match the new password.",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find active reset record
        let resetRecord;
        if (code) {
            resetRecord = db.prepare(`
                SELECT id, user_id, email, expires_at, used
                FROM password_resets
                WHERE email = ? AND code = ? AND used = 0
                ORDER BY created_at DESC LIMIT 1
            `).get(normalizedEmail, code.trim());
        }
        if (!resetRecord && token) {
            resetRecord = db.prepare(`
                SELECT id, user_id, email, expires_at, used
                FROM password_resets
                WHERE email = ? AND token = ? AND used = 0
                ORDER BY created_at DESC LIMIT 1
            `).get(normalizedEmail, token.trim());
        }

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used verification code. Please request a new one.",
            });
        }

        if (new Date(resetRecord.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please request a new password reset.",
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordToSet, salt);

        // Update user's password
        db.prepare(`
            UPDATE users
            SET password = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(hashedPassword, resetRecord.user_id);

        // Mark reset token as used
        db.prepare(`
            UPDATE password_resets
            SET used = 1
            WHERE id = ?
        `).run(resetRecord.id);

        const updatedUser = db.prepare(`
            SELECT id, name, employee_id, role, email
            FROM users WHERE id = ?
        `).get(resetRecord.user_id);

        return res.status(200).json({
            success: true,
            message: `Password reset successful for ${updatedUser.name}! You can now sign in with your new password.`,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "Error resetting password.",
            error: error.message,
        });
    }
};

// Check Google SMTP configuration status
exports.getSmtpStatus = (req, res) => {
    try {
        const status = emailService.getSmtpConfigStatus();
        return res.status(200).json({
            success: true,
            smtp: status,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error checking SMTP status.",
            error: error.message,
        });
    }
};

