const nodemailer = require('nodemailer');

// Create transporter
// NOTE: For real usage, you need to provide real credentials provided by USER or use environment variables
// For now, we use a test account or console logging if credentials are not set.
// User must update this later with their Gmail App Password.

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with real email
        pass: process.env.EMAIL_PASS || 'your-app-password'     // Replace with App Password
    }
});

async function sendOTP(email, otp) {
    if (!process.env.EMAIL_USER) {
        console.log("==========================================");
        console.log(`[SIMULATION] Email to ${email}: Your OTP is ${otp}`);
        console.log("==========================================");
        console.log("NOTE: To send real emails, set EMAIL_USER and EMAIL_PASS in .env");
        return;
    }

    try {
        await transporter.sendMail({
            from: 'Online Library <no-reply@library.com>',
            to: email,
            subject: 'Tasdiqlash Kodi',
            text: `Sizning tasdiqlash kodingiz: ${otp}`,
            html: `<h3>Sizning tasdiqlash kodingiz: <b>${otp}</b></h3>`
        });
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error);
        // Fallback to console for dev
        console.log(`[FALLBACK] Email to ${email}: Your OTP is ${otp}`);
    }
}

module.exports = { sendOTP };
