const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Settings Page
router.get('/settings', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    db.get("SELECT id, username, email FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) {
            return res.redirect('/');
        }
        res.render('settings', {
            user: req.session.user,
            profile: user,
            error: null,
            success: null
        });
    });
});


// Change Password
router.post('/settings/change-password', isAuthenticated, (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.id;

    db.get("SELECT password, username, email FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) {
            return res.redirect('/');
        }

        const renderSettings = (error, success) => {
            res.render('settings', {
                user: req.session.user,
                profile: { username: user.username, email: user.email },
                error,
                success
            });
        };

        if (!current_password || !new_password || !confirm_password) {
            return renderSettings('Barcha maydonlarni to\'ldiring', null);
        }

        if (new_password !== confirm_password) {
            return renderSettings('Parollar mos kelmadi', null);
        }

        const validPassword = bcrypt.compareSync(current_password, user.password);
        if (!validPassword) {
            return renderSettings('Joriy parol noto\'g\'ri', null);
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(new_password, salt);

        db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId], (err) => {
            if (err) {
                return renderSettings('Xatolik yuz berdi', null);
            }
            renderSettings(null, 'Parol muvaffaqiyatli o\'zgartirildi');
        });
    });
});

module.exports = router;
