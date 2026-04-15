const db = require('./database');
require('dotenv').config();

async function listBooks() {
    try {
        const books = await db.getAll("SELECT * FROM books");
        console.log("Total books:", books.length);
        books.forEach(book => {
            console.log(`ID: ${book.id}, Title: ${book.title}, Subject: ${book.subject}, Faculty: ${book.faculty}, Course: ${book.course}`);
        });
    } catch (err) {
        console.error("Error listing books:", err);
    } finally {
        process.exit();
    }
}

listBooks();
