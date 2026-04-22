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
    // If already logged in, redirect to library
    if (req.session && req.session.user) return res.redirect('/library');

    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    req.session.challenge = {
        question: `${num1} + ${num2}`,
        answer: (num1 + num2).toString()
    };
    res.render('register', {
        user: null,
        challenge: req.session.challenge.question
    });
});

// Register Logic (Unified)
router.post('/register', async (req, res) => {
    const { firstname, lastname, email, phone, username, password, confirm_password, challenge_answer } = req.body;

    // Check challenge first
    if (!challenge_answer || challenge_answer !== req.session.challenge.answer) {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        req.session.challenge = {
            question: `${num1} + ${num2}`,
            answer: (num1 + num2).toString()
        };
        return res.render('register', {
            error: "Matematik misol xato javob berildi",
            challenge: req.session.challenge.question
        });
    }

    if (!firstname || !lastname || !email || !phone || !username || !password || !confirm_password) {
        return res.render('register', {
            error: "Barcha maydonlarni to'ldiring",
            challenge: req.session.challenge.question
        });
    }

    if (password !== confirm_password) {
        return res.render('register', {
            error: "Parollar bir-biriga mos kelmadi.",
            challenge: req.session.challenge.question
        });
    }

    // Password strength check
    if (password.length < 8) {
        return res.render('register', { error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak.", challenge: req.session.challenge.question });
    }
    if (!/[A-Z]/.test(password)) {
        return res.render('register', { error: "Parolda kamida 1 ta KATTA harf bo'lishi shart (A-Z).", challenge: req.session.challenge.question });
    }
    if (!/[a-z]/.test(password)) {
        return res.render('register', { error: "Parolda kamida 1 ta kichik harf bo'lishi shart (a-z).", challenge: req.session.challenge.question });
    }
    if (!/[0-9]/.test(password)) {
        return res.render('register', { error: "Parolda kamida 1 ta raqam bo'lishi shart (0-9).", challenge: req.session.challenge.question });
    }

    try {
        // Check if email or username exists
        const emailRow = await db.getRow("SELECT * FROM users WHERE email = $1", [email]);
        if (emailRow) {
            return res.render('register', { error: "Bu email allaqachon ro'yxatdan o'tgan", challenge: req.session.challenge.question });
        }

        const userRow = await db.getRow("SELECT * FROM users WHERE username = $1", [username]);
        if (userRow) {
            return res.render('register', { error: "Bu Login (username) allaqachon band. Iltimos, boshqasini tanlang.", challenge: req.session.challenge.question });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        await db.run(
            "INSERT INTO users (email, username, firstname, lastname, phone, password) VALUES ($1, $2, $3, $4, $5, $6)",
            [email, username, firstname, lastname, phone, hashedPassword]
        );

        // Success - clear registration temp data and redirect to login
        delete req.session.registration;
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: "Xatolik yuz berdi: " + err.message, challenge: req.session.challenge.question });
    }
});


// Login Page
router.get('/login', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/library');
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
