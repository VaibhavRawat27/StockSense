const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { JWT_SECRET } = require("../middleware/authMiddleware");

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
