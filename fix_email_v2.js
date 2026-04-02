const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // 1. Add email column without UNIQUE constraint first
    db.run("ALTER TABLE users ADD COLUMN email TEXT", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Email column already exists.");
            } else {
                console.error("Error adding email column:", err.message);
            }
        } else {
            console.log("Successfully added email column.");
        }
    });

    // 2. Create unique index for email
    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)", (err) => {
        if (err) {
            console.error("Error creating unique index for email:", err.message);
        } else {
            console.log("Successfully created unique index for email.");
        }
    });
});

db.close();
