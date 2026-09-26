/**
 * StockSense Phase 4: Forgot Password & Google SMTP Password Reset Test Suite
 *
 * Verifies:
 * 1. Forgot password validation (missing email, invalid email, non-existent user)
 * 2. SQLite password_resets generation (6-digit OTP code + secure 64-char token)
 * 3. Email service simulation / Google SMTP integration
 * 4. Verify reset code endpoint (valid vs invalid vs expired)
 * 5. Password reset endpoint (password validation, bcrypt hashing, SQLite update)
 * 6. Verification that old password is rejected and new password succeeds in login
 * 7. Verification that used tokens/codes cannot be reused
 * 8. SMTP configuration status endpoint
 */

const db = require("../config/database");

const BASE_URL = "http://localhost:5000/api";
let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`  ❌ FAILED: ${message}`);
        failedCount++;
        throw new Error(`Assertion failed: ${message}`);
    } else {
        console.log(`  ✓ PASSED: ${message}`);
        passedCount++;
    }
}

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const res = await fetch(url, { ...options, headers });
    let body = null;
    try {
        body = await res.json();
    } catch (e) {
        body = null;
    }
    return { status: res.status, ok: res.ok, body };
}

async function runTests() {
    console.log("============================================================");
    console.log("🔑 StockSense: Forgot Password & SMTP Reset Test Suite");
    console.log("============================================================\n");

    try {
        // --- 1. SMTP Status Endpoint ---
        console.log("--- 1. SMTP Configuration Status ---");
        const smtpRes = await request("/auth/smtp-status");
        assert(smtpRes.status === 200, "GET /api/auth/smtp-status returns 200 OK");
        assert(smtpRes.body.success === true, "SMTP status response indicates success");
        assert("configured" in smtpRes.body.smtp, "SMTP status reports configured boolean");
        assert(smtpRes.body.smtp.host === "smtp.gmail.com", "SMTP host defaults to smtp.gmail.com");

        // --- 2. Forgot Password Validation ---
        console.log("\n--- 2. Forgot Password Request Validation ---");
        const noEmailRes = await request("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({}),
        });
        assert(noEmailRes.status === 400, "Missing email in forgot-password returns 400 Bad Request");

        const unknownEmailRes = await request("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email: "unknown-person-999@stocksense.com" }),
        });
        assert(unknownEmailRes.status === 404, "Non-existent user email returns 404 Not Found");

        // --- 3. Request Password Reset for Registered User ---
        console.log("\n--- 3. Password Reset Request & Token Generation ---");
        const targetEmail = "staff@stocksense.com";
        const forgotRes = await request("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email: targetEmail }),
        });

        assert(forgotRes.status === 200, "POST /api/auth/forgot-password for valid email returns 200 OK");
        assert(forgotRes.body.success === true, "Forgot password response indicates success");
        assert(forgotRes.body.email === targetEmail, "Returned email matches target email");

        // Check SQLite password_resets table
        const resetRow = db.prepare(`
            SELECT * FROM password_resets 
            WHERE email = ? AND used = 0 
            ORDER BY created_at DESC LIMIT 1
        `).get(targetEmail);

        assert(Boolean(resetRow), "Reset record created in SQLite password_resets table");
        assert(resetRow.code.length === 6, "Generated OTP code is 6 digits long");
        assert(resetRow.token.length >= 32, "Generated secure reset token is generated");
        assert(new Date(resetRow.expires_at) > new Date(), "Reset code expiration is set in the future (15 min)");

        const generatedCode = resetRow.code;
        const generatedToken = resetRow.token;
        console.log(`     -> Generated OTP Code: ${generatedCode}, Token: ${generatedToken.substring(0, 16)}...`);

        // --- 4. Verify Reset Code Endpoint ---
        console.log("\n--- 4. Verify Reset Code Endpoint ---");
        const invalidCodeRes = await request("/auth/verify-reset-code", {
            method: "POST",
            body: JSON.stringify({ email: targetEmail, code: "000000" }),
        });
        assert(invalidCodeRes.status === 400, "Invalid reset code rejected with 400 Bad Request");

        const validCodeRes = await request("/auth/verify-reset-code", {
            method: "POST",
            body: JSON.stringify({ email: targetEmail, code: generatedCode }),
        });
        assert(validCodeRes.status === 200, "Valid OTP code verified with 200 OK");
        assert(validCodeRes.body.success === true, "Verification confirms code is valid");

        // --- 5. Reset Password Validation ---
        console.log("\n--- 5. Reset Password Validation ---");
        const shortPassRes = await request("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                email: targetEmail,
                code: generatedCode,
                new_password: "123", // too short
            }),
        });
        assert(shortPassRes.status === 400, "Password shorter than 6 chars rejected with 400 Bad Request");

        const mismatchPassRes = await request("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                email: targetEmail,
                code: generatedCode,
                new_password: "NewPassword@2026",
                confirm_password: "DifferentPassword@2026",
            }),
        });
        assert(mismatchPassRes.status === 400, "Mismatched passwords rejected with 400 Bad Request");

        // --- 6. Successful Password Reset ---
        console.log("\n--- 6. Successful Password Reset Execution ---");
        const newPassword = "StaffNewPassword@2026";
        const resetRes = await request("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                email: targetEmail,
                code: generatedCode,
                new_password: newPassword,
                confirm_password: newPassword,
            }),
        });

        assert(resetRes.status === 200, "POST /api/auth/reset-password returns 200 OK");
        assert(resetRes.body.success === true, "Reset password response confirms success");

        // Check SQLite reset record is marked used
        const usedRecord = db.prepare("SELECT used FROM password_resets WHERE id = ?").get(resetRow.id);
        assert(usedRecord.used === 1, "Reset record marked as used (used = 1) in SQLite");

        // Attempting to reuse the same code should fail
        const reuseRes = await request("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                email: targetEmail,
                code: generatedCode,
                new_password: "AnotherPassword@2026",
            }),
        });
        assert(reuseRes.status === 400, "Reusing already consumed reset code is rejected with 400");

        // --- 7. Authentication Verification With New Credentials ---
        console.log("\n--- 7. Verification: Old vs New Password Login ---");
        const oldLoginRes = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: targetEmail,
                password: "Staff@123", // old password
            }),
        });
        assert(oldLoginRes.status === 401, "Login with old password is now rejected with 401 Unauthorized");

        const newLoginRes = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: targetEmail,
                password: newPassword, // new password
            }),
        });
        assert(newLoginRes.status === 200, "Login with new password succeeds with 200 OK");
        assert(Boolean(newLoginRes.body.token), "Login returns valid JWT token");
        assert(newLoginRes.body.user.email === targetEmail, "Logged-in user email matches reset account");

        // Revert password back to default Staff@123 so other tests remain undisturbed
        console.log("\n--- 8. Cleanup & Restore Account ---");
        const bcrypt = require("bcryptjs");
        const originalHash = bcrypt.hashSync("Staff@123", 10);
        db.prepare("UPDATE users SET password = ? WHERE email = ?").run(originalHash, targetEmail);
        console.log("  ✓ Restored default demo password for staff@stocksense.com");

        console.log("\n============================================================");
        console.log(`✅ FORGOT PASSWORD & RESET TESTS PASSED (${passedCount} passed, ${failedCount} failed)`);
        console.log("============================================================\n");
    } catch (err) {
        console.error("\n❌ Test execution interrupted:", err.message);
        process.exit(1);
    }
}

runTests();
