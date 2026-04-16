require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const db = require('./database');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cookie-Session (works on Vercel serverless)
const isProduction = process.env.NODE_ENV === 'production';
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'tatu_library_secret_key'],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: isProduction,   // HTTPS (Vercel) da true bo'ladi
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax'
}));

// Session save compatibility shim
app.use((req, res, next) => {
    if (req.session && !req.session.save) {
        req.session.save = (cb) => { if (cb) cb(); };
    }
    if (req.session && !req.session.destroy) {
        req.session.destroy = (cb) => {
            req.session = null;
            if (cb) cb();
        };
    }
    next();
});

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const locales = require('./locales');

// Global variables and Language Detection
app.use((req, res, next) => {
    const lang = (req.session && req.session.lang) ? req.session.lang : 'uz';
    if (req.session) req.session.lang = lang;

    const t = (key) => {
        const cleanKey = key.trim();
        return locales[lang] && locales[lang][cleanKey] ? locales[lang][cleanKey] : cleanKey;
    };

    res.locals.t = t;
    res.locals.currentLang = lang;
    res.locals.user = (req.session && req.session.user) ? req.session.user : null;
    next();
});

// Set Language Route
app.get('/set-lang/:lang', (req, res) => {
    const lang = req.params.lang;
    if (['uz', 'ru'].includes(lang)) {
        req.session.lang = lang;
    }
    const referer = req.headers.referer || '/';
    res.redirect(referer);
});

// Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const chatRoutes = require('./routes/chat_route');

app.use('/', authRoutes);
app.use('/', bookRoutes);
app.use('/', settingsRoutes);
app.use('/admin', adminRoutes);
app.use('/chat', chatRoutes);

// Start Server (local dev)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
