const nodemailer = require("nodemailer");

/**
 * Creates and configures the Nodemailer transporter for Google SMTP / Gmail App Passwords.
 * 
 * How to get a Google App Password:
 * 1. Log in to your Google Account (myaccount.google.com).
 * 2. Navigate to "Security" -> Ensure "2-Step Verification" is ON.
 * 3. Search for "App passwords" (or go to myaccount.google.com/apppasswords).
 * 4. Create an App named "StockSense" and copy the 16-character code (e.g., "abcd efgh ijkl mnop").
 * 5. Paste it into backend/.env as SMTP_PASS=abcdefghijklmnop (without spaces).
 */
const getTransporter = () => {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        return null;
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: user.trim(),
            pass: pass.trim().replace(/\s+/g, ""), // strip any spaces copied from Google
        },
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === "production",
        },
    });
};

/**
 * Checks whether SMTP credentials are fully configured in the environment.
 */
const getSmtpConfigStatus = () => {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    return {
        configured: Boolean(user && pass),
        user: user ? `${user.substring(0, 3)}***@${user.split("@")[1] || "gmail.com"}` : null,
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465", 10),
    };
};

/**
 * Sends a password reset email via Google SMTP (or logs to console if credentials not yet configured).
 */
const sendPasswordResetEmail = async ({ to, name, code, token }) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/login?mode=reset&email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`;

    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const fromAddress = process.env.SMTP_FROM || `"StockSense Security" <${user || "no-reply@stocksense.com"}>`;

    const transporter = getTransporter();

    // Plain text version
    const textContent = `
Hello ${name || "User"},

We received a request to reset the password for your StockSense Inventory & Warehouse account (${to}).

Your 6-digit verification code is:
>>> ${code} <<<

Alternatively, you can reset your password directly by visiting this link:
${resetUrl}

This code and link will expire in 15 minutes. If you did not request this password reset, please ignore this email or notify your system administrator.

Best regards,
StockSense Operations Team
    `.trim();

    // Rich HTML template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StockSense Password Reset</title>
    <style>
        body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 30px; text-align: center; border-bottom: 3px solid #3b82f6; }
        .logo-title { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
        .logo-badge { display: inline-block; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 9999px; margin-top: 8px; letter-spacing: 1px; }
        .content { padding: 36px 32px; color: #334155; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; }
        .intro { font-size: 15px; color: #475569; margin-bottom: 24px; }
        .code-box { background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
        .code-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; margin-bottom: 6px; }
        .code-digits { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; }
        .btn-wrapper { text-align: center; margin: 32px 0 24px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4); }
        .note { font-size: 13px; color: #64748b; border-left: 3px solid #cbd5e1; padding-left: 14px; margin-top: 24px; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .footer-link { color: #64748b; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="logo-title">📦 StockSense</div>
            <div class="logo-badge">Security & Access Management</div>
        </div>
        <div class="content">
            <h2 class="greeting">Password Reset Request</h2>
            <p class="intro">
                Hello <strong>${name || "User"}</strong>,<br>
                We received a request to reset the password for your StockSense account associated with <strong>${to}</strong>.
            </p>

            <div class="code-box">
                <div class="code-label">Your 6-Digit Verification Code</div>
                <div class="code-digits">${code}</div>
            </div>

            <p style="font-size: 14px; text-align: center; color: #64748b;">
                Enter this code in the password reset window, or click the button below to reset directly:
            </p>

            <div class="btn-wrapper">
                <a href="${resetUrl}" class="btn" target="_blank">Reset Password Directly →</a>
            </div>

            <div class="note">
                ⏱️ <strong>Note:</strong> This verification code and link will expire in <strong>15 minutes</strong>.<br>
                If you did not request a password reset, you can safely disregard this email. Your password remains unchanged.
            </div>
        </div>
        <div class="footer">
            StockSense Warehouse & Inventory System • Automated Security Service<br>
            Please do not reply directly to this automated email.
        </div>
    </div>
</body>
</html>
    `.trim();

    if (!transporter) {
        console.log("============================================================");
        console.log("⚠️ [StockSense SMTP Warning] Google App Password not configured in .env");
        console.log(`🔑 Reset Code for ${to}: [ ${code} ]`);
        console.log(`🔗 Reset Link: ${resetUrl}`);
        console.log("👉 To send real emails, set SMTP_USER and SMTP_PASS (Google App Password) in backend/.env");
        console.log("============================================================");

        return {
            delivered: false,
            simulated: true,
            message: "SMTP not configured. Reset code printed to server console in dev mode.",
            code,
            resetUrl,
        };
    }

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject: `[StockSense] Password Reset Code: ${code}`,
            text: textContent,
            html: htmlContent,
        });

        console.log(`✅ [StockSense SMTP] Reset email sent to ${to}. MessageId: ${info.messageId}`);

        return {
            delivered: true,
            simulated: false,
            messageId: info.messageId,
            message: `Password reset email successfully sent to ${to} via Google SMTP.`,
        };
    } catch (error) {
        console.error("❌ [StockSense SMTP Error] Failed to send email via Google SMTP:", error.message);
        console.log("------------------------------------------------------------");
        console.log(`🔑 Fallback Dev Code for ${to}: [ ${code} ]`);
        console.log(`🔗 Fallback Dev Link: ${resetUrl}`);
        console.log("------------------------------------------------------------");

        return {
            delivered: false,
            simulated: true,
            error: error.message,
            code,
            resetUrl,
            message: `Could not send via Google SMTP (${error.message}). Reset code captured on server.`,
        };
    }
};

module.exports = {
    getTransporter,
    getSmtpConfigStatus,
    sendPasswordResetEmail,
};
