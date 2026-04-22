const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { sendOTP } = require('../utils/email');

// Public Landing Page
router.get('/', (req, res) => {
    res.render('index', { user: req.session.user, isLandingPage: true });
});

// Register Page (Unified)
router.get('/register', (req, res) => {
    // If already logged in (with a valid ID), redirect to library
    if (req.session && req.session.user && req.session.user.id) return res.redirect('/library');

    res.render('register', {
        user: null,
        error: null
    });
});

// Register Logic (Unified)
router.post('/register', async (req, res) => {
    const { firstname, lastname, phone, username, password, confirm_password } = req.body;

    if (!firstname || !lastname || !phone || !username || !password || !confirm_password) {
        return res.render('register', {
            error: "Barcha maydonlarni to'ldiring"
        });
    }

    if (password !== confirm_password) {
        return res.render('register', {
            error: "Parollar bir-biriga mos kelmadi."
        });
    }

    // Password strength check
    if (password.length < 8) {
        return res.render('register', { error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." });
    }
    if (!/[A-Z]/.test(password)) {
        return res.render('register', { error: "Parolda kamida 1 ta KATTA harf bo'lishi shart (A-Z)." });
    }
    if (!/[a-z]/.test(password)) {
        return res.render('register', { error: "Parolda kamida 1 ta kichik harf bo'lishi shart (a-z)." });
    }
    if (!/[0-9]/.test(password)) {
        return res.render('register', { error: "Parolda kamida 1 ta raqam bo'lishi shart (0-9)." });
    }

    try {
        const userRow = await db.getRow("SELECT * FROM users WHERE username = $1", [username]);
        if (userRow) {
            return res.render('register', { error: "Bu Login (username) allaqachon band. Iltimos, boshqasini tanlang." });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        await db.run(
            "INSERT INTO users (username, firstname, lastname, phone, password) VALUES ($1, $2, $3, $4, $5)",
            [username, firstname, lastname, phone, hashedPassword]
        );

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: "Xatolik yuz berdi: " + err.message });
    }
});



// Login Page
router.get('/login', (req, res) => {
    if (req.session && req.session.user && req.session.user.id) return res.redirect('/library');
    res.render('login', { user: null });
});


// Login Logic
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const row = await db.getRow("SELECT * FROM users WHERE username = $1", [username]);
        if (!row) {
            return res.render('login', { error: "Login yoki parol noto'g'ri" });
        }

        const validPassword = bcrypt.compareSync(password, row.password);
        if (!validPassword) {
            return res.render('login', { error: "Login yoki parol noto'g'ri" });
        }

        req.session.user = {
            id: Number(row.id),
            username: row.username,
            role: row.role
        };
        res.redirect('/library');
    } catch (err) {
        console.error(err);
        res.render('login', { error: "Xatolik yuz berdi" });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

module.exports = router;
