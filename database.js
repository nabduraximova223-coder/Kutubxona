const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createTables() {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user'
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        author VARCHAR(255),
        subject VARCHAR(255),
        faculty VARCHAR(255),
        course INTEGER,
        description TEXT,
        filepath VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        role VARCHAR(50),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    const bcrypt = require('bcryptjs');
    const existing = await pool.query("SELECT * FROM users WHERE username = 'admin'");
    if (existing.rows.length === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        await pool.query(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
            ['admin', hash, 'admin']
        );
        console.log("Admin user created.");
    }
}

const db = {
    getRow: async (sql, params = []) => {
        const res = await pool.query(sql, params);
        return res.rows[0] || null;
    },
    getAll: async (sql, params = []) => {
        const res = await pool.query(sql, params);
        return res.rows;
    },
    run: async (sql, params = []) => {
        const res = await pool.query(sql, params);
        return res;
    },
    pool
};

createTables().catch(console.error);

module.exports = db;
