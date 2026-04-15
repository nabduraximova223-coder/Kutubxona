require('dotenv').config();
const db = require('./database');

async function migrate() {
    try {
        await db.run(`ALTER TABLE books ADD COLUMN IF NOT EXISTS rating_sum INTEGER DEFAULT 0`);
        await db.run(`ALTER TABLE books ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0`);
        console.log("Migration successful");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e.message);
        process.exit(1);
    }
}

setTimeout(migrate, 1000);
