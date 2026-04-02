const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const { sendOTP } = require('../utils/email');

// Public Landing Page
router.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

// Register Page
// Register Page (Step 1: Email)
router.get('/register', (req, res) => {
    // Generate math challenge
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
router.post('/register', (req, res) => {
    const { email, challenge_answer } = req.body;

    if (!email) {
        return res.render('register', {
            error: "Email manzilni kiriting",
            challenge: req.session.challenge ? req.session.challenge.question : ""
        });
    }

    if (!challenge_answer || challenge_answer !== req.session.challenge.answer) {
        // Regenerate challenge on failure
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

    // Check if email already used
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (row) {
            return res.render('register', { error: "Bu email allaqachon ro'yxatdan o'tgan" });
        }

        // Skip OTP and go directly to completion step
        req.session.registration = {
            email: email,
            step: 'complete'
        };

        res.redirect('/complete-register');
    });
});

// Verify OTP Page (Step 2: Enter Code)
router.get('/verify-otp', (req, res) => {
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

// Complete Registration Page (Step 3: Create Login/Password)
router.get('/complete-register', (req, res) => {
    if (!req.session.registration || req.session.registration.step !== 'complete') {
        return res.redirect('/register');
    }
    res.render('complete-register', { user: req.session.user });
});

// Complete Registration Logic
router.post('/complete-register', (req, res) => {
    const { username, password } = req.body;
    const sessionReg = req.session.registration;

    if (!sessionReg || sessionReg.step !== 'complete') {
        return res.redirect('/register');
    }

    if (!username || !password) {
        return res.render('complete-register', { error: "Barcha maydonlarni to'ldiring" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    db.run("INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
        [sessionReg.email, username, hashedPassword],
        function (err) {
            if (err) {
                console.error(err);
                if (err.message.includes("UNIQUE constraint failed: users.username")) {
                    return res.render('complete-register', { error: "Bu login allaqachon band. Iltimos, boshqa login tanlang." });
                }
                if (err.message.includes("UNIQUE constraint failed: users.email")) {
                    return res.render('complete-register', { error: "Bu email allaqachon ro'yxatdan o'tgan." });
                }
                // Boshqa xatoliklar uchun
                return res.render('complete-register', { error: "Tizim xatosi: " + err.message });
            }
            // Clear session
            delete req.session.registration;
            res.redirect('/login');
        });
});

// Login Page
router.get('/login', (req, res) => {
    res.render('login', { user: req.session.user });
});

// Login Logic
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err || !row) {
            return res.render('login', { error: "Login yoki parol noto'g'ri" });
        }

        const validPassword = bcrypt.compareSync(password, row.password);
        if (!validPassword) {
            return res.render('login', { error: "Login yoki parol noto'g'ri" });
        }

        req.session.user = {
            id: row.id,
            username: row.username,
            role: row.role
        };
        res.redirect('/library');
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        res.clearCookie('connect.sid'); // Default express-session cookie name
        res.redirect('/');
    });
});

module.exports = router;
