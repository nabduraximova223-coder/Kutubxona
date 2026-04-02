const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    )`, (err) => {
        if (err) {
            console.error("Error creating users table:", err.message);
        } else {
            console.log("Users table created or already exists.");
            // Try to add email column if it doesn't exist
            db.run(`ALTER TABLE users ADD COLUMN email TEXT`, (err) => {
                if (err && !err.message.includes("duplicate column name")) {
                    console.error("Error adding email column:", err.message);
                }
                // Always try to create index
                db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
            });
            createAdminUser();
        }
    });

    // Books Table
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        subject TEXT,
        faculty TEXT,
        description TEXT,
        filepath TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error("Error creating books table:", err.message);
        } else {
            // Try to add faculty column if it doesn't exist
            db.run(`ALTER TABLE books ADD COLUMN faculty TEXT`, (err) => {
                // Ignore "duplicate column name" error
            });
            db.run(`ALTER TABLE books ADD COLUMN course INTEGER`, (err) => {
                // Ignore "duplicate column name" error
            });
        }
    });

    // Chats Table
    db.run(`CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error("Error creating chats table:", err.message);
        } else {
            console.log("Chats table created or already exists.");
        }
    });

    // Messages Table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        role TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error("Error creating messages table:", err.message);
        } else {
            console.log("Messages table created or already exists.");
        }
    });
}

function createAdminUser() {
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const adminRole = 'admin';

    db.get("SELECT * FROM users WHERE username = ?", [adminUsername], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        if (!row) {
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(adminPassword, salt);

            db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                [adminUsername, hashedPassword, adminRole],
                (err) => {
                    if (err) console.error("Error creating admin user:", err.message);
                    else console.log("Admin user created (username: admin, password: admin123)");
                });
        }
    });
}

module.exports = db;
