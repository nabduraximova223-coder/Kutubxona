const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

// Multer Setup for File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Admin Middleware
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send("Ruxsat yo'q. Faqat admin uchun.");
}

router.use(isAdmin);

// Admin Dashboard
router.get('/', (req, res) => {
    db.all("SELECT * FROM books ORDER BY created_at DESC", [], (err, books) => {
        if (err) return res.status(500).send(err.message);
        res.render('admin', { books, user: req.session.user });
    });
});

// Add Book
router.post('/add', upload.single('bookFile'), (req, res) => {
    const { title, author, subject, faculty, course, description } = req.body;
    const filepath = req.file ? req.file.path : null;

    if (!filepath) {
        return res.send("Fayl yuklanmadi");
    }

    db.run(`INSERT INTO books (title, author, subject, faculty, course, description, filepath) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, author, subject, faculty, course, description, filepath],
        (err) => {
            if (err) console.error(err);
            res.redirect('/admin');
        }
    );
});

// Delete Book
router.post('/delete/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT filepath FROM books WHERE id = ?", [id], (err, row) => {
        if (err) return console.error(err);
        if (row && row.filepath) {
            // Attempt to delete file
            fs.unlink(row.filepath, (err) => {
                if (err) console.error("Failed to delete local file:", err);
            });
        }
        db.run("DELETE FROM books WHERE id = ?", [id], (err) => {
            if (err) console.error(err);
            res.redirect('/admin');
        });
    });
});

// Edit Book (simplified, no file update for now)
router.post('/edit/:id', (req, res) => {
    const { title, author, subject, description } = req.body;
    const id = req.params.id;

    db.run("UPDATE books SET title = ?, author = ?, subject = ?, description = ? WHERE id = ?",
        [title, author, subject, description, id],
        (err) => {
            if (err) console.error(err);
            res.redirect('/admin');
        }
    );
});

module.exports = router;
