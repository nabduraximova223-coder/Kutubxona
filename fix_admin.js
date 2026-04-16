require('dotenv').config();
const db = require('./database');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
    await new Promise(r => setTimeout(r, 1500));
    try {
        // First check if admin exists
        const admin = await db.getRow("SELECT id, username, role, password FROM users WHERE username = 'admin'");
        console.log("Admin row:", admin ? `Found (id:${admin.id} role:${admin.role})` : "NOT FOUND");

        const hash = bcrypt.hashSync('admin123', 10);

        if (admin) {
            // Update existing
            await db.run("UPDATE users SET password = $1, role = 'admin' WHERE username = 'admin'", [hash]);
            console.log("Admin password updated to: admin123");
        } else {
            // Insert new
            await db.run(
                "INSERT INTO users (username, password, role) VALUES ('admin', $1, 'admin')",
                [hash]
            );
            console.log("Admin created with password: admin123");
        }

        // Verify
        const check = await db.getRow("SELECT id, username, role FROM users WHERE username = 'admin'");
        console.log("Verified admin:", check);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
fixAdmin();
