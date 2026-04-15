const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Setup — fallback to disk if local, but since they need it working, we explicitly save it
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});

const upload = multer({ storage: storage });

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

// Add Book
router.post('/add', upload.single('bookFile'), async (req, res) => {
    const { title, author, subject, faculty, course, description } = req.body;
    // Save the relative path like 'uploads/filename.pdf'
    const filepath = req.file ? 'uploads/' + req.file.filename : null;

    if (!filepath) {
        return res.send("Fayl yuklanmadi");
    }

    try {
        await db.run(
            `INSERT INTO books (title, author, subject, faculty, course, description, filepath) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
        await db.run("DELETE FROM books WHERE id = $1", [req.params.id]);
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
            "UPDATE books SET title = $1, author = $2, subject = $3, description = $4 WHERE id = $5",
            [title, author, subject, description, req.params.id]
        );
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});

module.exports = router;
