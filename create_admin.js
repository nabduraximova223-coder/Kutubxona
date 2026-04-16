require('dotenv').config();
const db = require('./database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    await new Promise(r => setTimeout(r, 1500));
    try {
        const hash = bcrypt.hashSync('admin123', 10);
        await db.run(
            `INSERT INTO users (username, password, role) VALUES ('admin', '${hash}', 'admin') ON CONFLICT (username) DO UPDATE SET password = '${hash}', role = 'admin'`
        );
        console.log('Admin muvaffaqiyatli yaratildi!');
        console.log('Username: admin');
        console.log('Password: admin123');
    } catch (e) {
        console.error('Xatolik:', e.message);
    }
    process.exit(0);
}
createAdmin();
