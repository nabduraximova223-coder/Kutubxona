const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function createTables() {
    await db.execute(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        subject TEXT,
        faculty TEXT,
        course INTEGER,
        description TEXT,
        filepath TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await db.execute(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        role TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )`);

    // Create admin user if not exists
    const bcrypt = require('bcrypt');
    const existing = await db.execute("SELECT * FROM users WHERE username = 'admin'");
    if (existing.rows.length === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        await db.execute({
            sql: "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            args: ['admin', hash, 'admin']
        });
        console.log("Admin user created.");
    }
}

// Helper wrappers matching sqlite3 API style
db.getRow = async (sql, params = []) => {
    const result = await db.execute({ sql, args: params });
    return result.rows[0] || null;
};

db.getAll = async (sql, params = []) => {
    const result = await db.execute({ sql, args: params });
    return result.rows;
};

db.run = async (sql, params = []) => {
    const result = await db.execute({ sql, args: params });
    return { lastID: Number(result.lastInsertRowid), changes: result.rowsAffected };
};

// Initialize tables on startup
createTables().catch(console.error);

module.exports = db;
