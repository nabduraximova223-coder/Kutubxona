const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'library.db'));

db.all("SELECT * FROM books ORDER BY created_at DESC LIMIT 5", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
