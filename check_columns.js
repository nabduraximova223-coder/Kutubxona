const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'library.db'));

db.all("PRAGMA table_info(books)", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Columns in 'books' table:");
        rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });
    }
    db.close();
});
