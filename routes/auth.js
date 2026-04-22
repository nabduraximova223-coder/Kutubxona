const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { sendOTP } = require('../utils/email');

// Public Landing Page
router.get('/', (req, res) => {
    res.render('index', { user: req.session.user, isLandingPage: true });
});

// Register Page (Step 1: Email)
router.get('/register', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/library');
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    req.session.challenge = {
        question: `${num1} + ${num2}`,
        answer: (num1 + num2).toString()
    };
    res.render('register', {
        user: req.session.user,
        challenge: req.session.challenge.question
    });
});

// Register Logic (Step 1: Email -> OTP)
router.post('/register', async (req, res) => {
    const { email, challenge_answer } = req.body;

    if (!email) {
        return res.render('register', {
            error: "Email manzilni kiriting",
            challenge: req.session.challenge ? req.session.challenge.question : ""
        });
    }

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

    try {
        const row = await db.getRow("SELECT * FROM users WHERE email = $1", [email]);
        if (row) {
            return res.render('register', {
                error: "Bu email allaqachon ro'yxatdan o'tgan",
                challenge: req.session.challenge ? req.session.challenge.question : ""
            });
        }

        req.session.registration = { email: email, step: 'complete' };
        res.redirect('/complete-register');
    } catch (err) {
        console.error(err);
        res.render('register', { error: "Xatolik yuz berdi", challenge: "" });
    }
});

// Verify OTP Page
router.get('/verify-otp', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/library');
    if (!req.session.registration || req.session.registration.step !== 'verify') {
        return res.redirect('/register');
    }
    res.render('verify-otp', {
        user: req.session.user,
        dev_otp: req.session.registration.otp
    });
});

// Verify OTP Logic
router.post('/verify-otp', (req, res) => {
    const { otp } = req.body;
    const sessionReg = req.session.registration;

    if (!sessionReg || sessionReg.step !== 'verify') {
        return res.redirect('/register');
    }

    if (otp === sessionReg.otp) {
        sessionReg.step = 'complete';
        res.redirect('/complete-register');
    } else {
        res.render('verify-otp', { error: "Noto'g'ri kod kiritildi", dev_otp: sessionReg.otp });
    }
});

// Complete Registration Page
router.get('/complete-register', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/library');
    if (!req.session.registration || req.session.registration.step !== 'complete') {
        return res.redirect('/register');
    }
    res.render('complete-register', { user: req.session.user });
});

// Complete Registration Logic
router.post('/complete-register', async (req, res) => {
    const { firstname, lastname, phone, username, password, confirm_password } = req.body;
    const sessionReg = req.session.registration;

    if (!sessionReg || sessionReg.step !== 'complete') {
        return res.redirect('/register');
    }

    if (!firstname || !lastname || !phone || !username || !password || !confirm_password) {
        return res.render('complete-register', { error: "Barcha maydonlarni to'ldiring" });
    }

    if (password !== confirm_password) {
        return res.render('complete-register', { error: "Parollar bir-biriga mos kelmadi." });
    }

    // Parol kuchlilik tekshiruvi
    if (password.length < 8) {
        return res.render('complete-register', { error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." });
    }
    if (!/[A-Z]/.test(password)) {
        return res.render('complete-register', { error: "Parolda kamida 1 ta KATTA harf bo'lishi shart (A-Z)." });
    }
    if (!/[a-z]/.test(password)) {
        return res.render('complete-register', { error: "Parolda kamida 1 ta kichik harf bo'lishi shart (a-z)." });
    }
    if (!/[0-9]/.test(password)) {
        return res.render('complete-register', { error: "Parolda kamida 1 ta raqam bo'lishi shart (0-9)." });
    }

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        await db.run(
            "INSERT INTO users (email, username, firstname, lastname, phone, password) VALUES ($1, $2, $3, $4, $5, $6)",
            [sessionReg.email, username, firstname, lastname, phone, hashedPassword]
        );
        delete req.session.registration;
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        const msg = err.message || '';
        if (msg.includes('unique constraint') && msg.includes('users_username_key')) {
            return res.render('complete-register', { error: "Bu Login (username) allaqachon band. Iltimos, boshqasini tanlang." });
        }
        if (msg.includes('unique constraint') && msg.includes('users_email_key')) {
            return res.render('complete-register', { error: "Bu email allaqachon ro'yxatdan o'tgan." });
        }
        return res.render('complete-register', { error: "Tizim xatosi: " + msg });
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
