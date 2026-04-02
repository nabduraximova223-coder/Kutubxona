const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'library.db'));

const title = 'Test Book';
const author = 'Test Author';
const subject = 'Test Subject';
const faculty = 'ki';
const course = 1;
const description = 'Test Desc';
const filepath = 'uploads/dummy.pdf';

db.run(`INSERT INTO books (title, author, subject, faculty, course, description, filepath) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, author, subject, faculty, course, description, filepath],
    function (err) {
        if (err) {
            console.error('INSERT ERROR:', err.message);
        } else {
            console.log('INSERT SUCCESS, ID:', this.lastID);
        }
        db.close();
    }
);
