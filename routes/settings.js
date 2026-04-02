const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Settings Page
router.get('/settings', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    try {
        const user = await db.getRow("SELECT id, username, email FROM users WHERE id = $1", [userId]);
        if (!user) return res.redirect('/');
        res.render('settings', {
            user: req.session.user,
            profile: user,
            error: null,
            success: null
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Change Password
router.post('/settings/change-password', isAuthenticated, async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.id;

    try {
        const user = await db.getRow("SELECT password, username, email FROM users WHERE id = $1", [userId]);
        if (!user) return res.redirect('/');

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

        await db.run("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
        renderSettings(null, 'Parol muvaffaqiyatli o\'zgartirildi');

    } catch (err) {
        console.error(err);
        res.render('settings', {
            user: req.session.user,
            profile: req.session.user,
            error: 'Xatolik yuz berdi',
            success: null
        });
    }
});

module.exports = router;
