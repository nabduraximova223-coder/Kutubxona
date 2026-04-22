require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const db = require('./database');

const app = express();

// Trust Vercel's proxy for secure cookies
app.set('trust proxy', 1);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cookie-Session (works on Vercel serverless)
const isProduction = process.env.NODE_ENV === 'production';
app.use(cookieSession({
    name: 'tatu_session_v2', // Renamed to force previous sessions to expire instantly
    keys: [process.env.SESSION_SECRET || 'tatu_library_secret_key'],
    // maxAge o'chirildi: endi brauzer yopilganda sessiya nobud bo'ladi
    secure: isProduction,   // HTTPS (Vercel) da true bo'ladi
    httpOnly: true,
    sameSite: 'lax'
}));

// Session save compatibility shim and Rolling session
app.use((req, res, next) => {
    // Update session timestamp to keep it alive if active, creating a 1-hour rolling window
    if (req.session && req.session.user) {
        req.session.now = Date.now();
    }

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

app.use('/admin', adminRoutes);
app.use('/', authRoutes);
app.use('/', bookRoutes);
app.use('/', settingsRoutes);
app.use('/chat', chatRoutes);

// Start Server (local dev)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
