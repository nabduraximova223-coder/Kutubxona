const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database');

// Multer Setup — memory storage (Vercel has no persistent disk)
const upload = multer({ storage: multer.memoryStorage() });

// Admin Middleware
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send("Ruxsat yo'q. Faqat admin uchun.");
}
router.use(isAdmin);

// Admin Dashboard
router.get('/', async (req, res) => {
    try {
        const books = await db.getAll("SELECT * FROM books ORDER BY created_at DESC", []);
        res.render('admin', { books, user: req.session.user });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add Book (stores filename only — for Vercel, file upload to Cloudinary recommended)
router.post('/add', upload.single('bookFile'), async (req, res) => {
    const { title, author, subject, faculty, course, description } = req.body;
    // On Vercel, file is in memory (req.file.buffer). We store just the filename as placeholder.
    const filepath = req.file ? req.file.originalname : null;

    if (!filepath) {
        return res.send("Fayl yuklanmadi");
    }

    try {
        await db.run(
            `INSERT INTO books (title, author, subject, faculty, course, description, filepath) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, author, subject, faculty, course, description, filepath]
        );
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send("Xatolik: " + err.message);
    }
});

// Delete Book
router.post('/delete/:id', async (req, res) => {
    try {
        await db.run("DELETE FROM books WHERE id = ?", [req.params.id]);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});

// Edit Book
router.post('/edit/:id', async (req, res) => {
    const { title, author, subject, description } = req.body;
    try {
        await db.run(
            "UPDATE books SET title = ?, author = ?, subject = ?, description = ? WHERE id = ?",
            [title, author, subject, description, req.params.id]
        );
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});

module.exports = router;
