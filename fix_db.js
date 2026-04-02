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
    // Check table info
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
            console.error("Error getting table info:", err);
            return;
        }
        console.log("Current columns:", rows.map(r => r.name));

        const hasPhone = rows.some(r => r.name === 'phone');
        if (!hasPhone) {
            console.log("Adding phone column...");
            db.run("ALTER TABLE users ADD COLUMN phone TEXT UNIQUE", (err) => {
                if (err) {
                    console.error("Error adding phone column:", err.message);
                } else {
                    console.log("Successfully added phone column.");
                }
            });
        } else {
            console.log("Phone column already exists.");
        }
    });
});
