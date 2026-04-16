require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetAdmin() {
    const newPassword = 'admin123'; // Yangi parolni shu yerga yozing
    const hash = bcrypt.hashSync(newPassword, 10);

    // Avval admin bormi tekshiramiz
    const existing = await pool.query("SELECT * FROM users WHERE username = 'admin'");

    if (existing.rows.length > 0) {
        // Admin bor - parolini yangilaymiz
        await pool.query("UPDATE users SET password = $1, role = 'admin' WHERE username = 'admin'", [hash]);
        console.log(`✅ Admin paroli yangilandi: admin / ${newPassword}`);
    } else {
        // Admin yo'q - yangisini yaratamiz
        await pool.query(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
            ['admin', hash, 'admin']
        );
        console.log(`✅ Admin yaratildi: admin / ${newPassword}`);
    }

    // Barcha adminlarni ko'rsatamiz
    const admins = await pool.query("SELECT id, username, email, role FROM users WHERE role = 'admin'");
    console.log('\n📋 Admin foydalanuvchilar:');
    console.table(admins.rows);

    await pool.end();
}

resetAdmin().catch(err => {
    console.error('❌ Xatolik:', err.message);
    process.exit(1);
});
