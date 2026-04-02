require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session Setup
app.use(session({
    secret: 'tatu_library_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const locales = require('./locales');

// Global variables and Language Detection
app.use((req, res, next) => {
    // Set language (default to uz)
    const lang = (req.session && req.session.lang) ? req.session.lang : 'uz';
    if (req.session) req.session.lang = lang;

    // Translation helper
    const t = (key) => {
        const cleanKey = key.trim();
        return locales[lang] && locales[lang][cleanKey] ? locales[lang][cleanKey] : cleanKey;
    };

    res.locals.t = t;
    res.locals.currentLang = lang;
    res.locals.user = (req.session && req.session.user) ? req.session.user : null;
    next();
});

// Set Language Route (Global)
app.get('/set-lang/:lang', (req, res) => {
    const lang = req.params.lang;
    if (['uz', 'ru'].includes(lang)) {
        req.session.lang = lang;
        req.session.save((err) => {
            if (err) console.error("Session save error:", err);
            res.redirect('back' || '/');
        });
    } else {
        res.redirect('back' || '/');
    }
});

// Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const chatRoutes = require('./routes/chat');

app.use('/', authRoutes);
app.use('/', bookRoutes);
app.use('/', settingsRoutes);
app.use('/admin', adminRoutes);
app.use('/chat', chatRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
