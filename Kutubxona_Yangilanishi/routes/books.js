const express = require('express');
const router = express.Router();
const db = require('../database');

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) return next();
    res.redirect('/login');
};

router.get('/library', isAuthenticated, async (req, res) => {
    const { q, faculty, course, subject } = req.query;
    console.log('--- Library Route DEBUG ---');
    console.log('Query:', { q, faculty, course, subject });

    let sql = "SELECT * FROM books WHERE 1=1";
    let params = [];
    let pCount = 1;

    if (q) {
        sql += ` AND (title ILIKE $${pCount} OR author ILIKE $${pCount + 1})`;
        params.push(`%${q}%`, `%${q}%`);
        pCount += 2;
    }
    if (course) {
        sql += ` AND course = $${pCount++}`;
        params.push(parseInt(course));
    }
    if (faculty) {
        sql += ` AND (faculty = $${pCount} OR faculty = 'all')`;
        params.push(faculty);
        pCount++;
    }
    if (subject) {
        sql += ` AND subject = $${pCount++}`;
        params.push(subject);
    }

    const tatuFaculties = [
        { id: 'ki', name_key: 'ki', icon: 'fa-laptop-code' },
        { id: 'di', name_key: 'di', icon: 'fa-code' },
        { id: 'ax', name_key: 'ax', icon: 'fa-shield-alt' },
        { id: 'tt', name_key: 'tt', icon: 'fa-tower-broadcast' },
        { id: 'tv', name_key: 'tv', icon: 'fa-tv' },
        { id: 'im', name_key: 'im', icon: 'fa-chart-line' },
        { id: 'kt', name_key: 'kt', icon: 'fa-chalkboard-teacher' }
    ];

    const courses = [
        { id: 1, name_key: 'course_1', icon: 'fa-graduation-cap' },
        { id: 2, name_key: 'course_2', icon: 'fa-graduation-cap' },
        { id: 3, name_key: 'course_3', icon: 'fa-graduation-cap' },
        { id: 4, name_key: 'course_4', icon: 'fa-graduation-cap' }
    ];

    const subjectsMap = {
        'ki_1': ["Ingliz tili", "Hisob (Calculus)", "Fizika", "Falsafa", "Dinshunoslik", "Dasturlash", "O'zbekistonning eng yangi tarixi", "Diskret tuzilmalar", "Differentsial tenglamalar"],
        'ki_2': ["Sun'iy intellekt asoslari", "Ma'lumotlar tuzilmasi va algoritmlar", "Kompyuterni tashkil etish", "Kiberxavfsizlik asoslari", "Elektronika va sxemalar", "Veb ilovalar yaratish", "Ma'lumotlar bazasi", "Kompyuter tarmoqlari", "Ehtimollar va statistika", "Amaliy intellektual tizimlar"],
        'ki_3': ["Operatsion tizimlar", "Moliyaviy savodxonlik asoslari", "Inson kompyuter interfeysi", "Bulutli hisoblash", "Bilimlar bazasini loyihalash", "O'rnatilgan tizimlar", "Machine learning", "Jismoniy madaniyat va sport", "IoT: tizimlar va ilovalar"],
        'ki_4': ["1-Mutaxassislik fani", "2-Mutaxassislik fani", "3-Mutaxassislik fani", "4-Mutaxassislik fani"],
        'kt_1': ["O'zbekistonning eng yangi tarixi", "Ingliz tili", "Hisob(Calculus)", "Fizika", "Dasturlash", "Falsafa", "Dinshunoslik", "Diskret tuzilmalar", "Differentsial tenglamalar"],
        'kt_2': ["Ma'lumotlar tuzilmasi va algoritmlar", "Ma'lumotlar bazasi", "Kompyuterni tashkil etish", "Kiberxavfsizlik asoslari", "Elektronika va sxemalar", "Veb ilovalar yaratish", "Sun'iy intellekt asoslari", "Masofaviy ta'lim texnologiyalari", "Kompyuter tarmoqlari", "Ehtimollar va statistika"],
        'kt_3': ["Ta'lim nazariyasi", "Ta'limga kirish", "Operatsion tizimlar", "Jismoniy madaniyat va sport", "Elektron pedagogika", "Raqamli texnologiya va innovatsiyalar", "Pedagogika. Psixologiya", "O'rnatilgan tizimlar", "Kreativ pedagogika"],
        'kt_4': ["1-Mutaxassislik fani", "2-Mutaxassislik fani", "3-Mutaxassislik fani", "4-Mutaxassislik fani"],
        'di_1': ["O'zbekistonning eng yangi tarixi", "Umumiy psixologiya", "Informatikaning nazariy asoslari", "Chiziqli algebra va analitik geometriya", "Diskret matematika va matematik mantiq", "Matematik analiz", "Algoritm tillari va dasturlash", "Mediasavodxonlik va axborot madaniyati"],
        'di_2': ["Falsafa", "Umumiy pedagogika", "Umumiy fizika", "Differensial tenglamalar", "Dinshunoslik"],
        'di_3': ["Funksional analiz", "Sonli usullar", "Matematik fizika tenglamalari", "Matematik modellashtirish", "Jarayonlar tadqiqoti va optimal boshqaruv", "Matematika va informatika o'qitish metodikasi"],
        'di_4': ["Kompyuterli matematik tizimlar", "Inklyuziv ta'lim", "Gospital pedagogika", "Kompleks o'zgaruvchili funksiyalar nazariyasi", "1-Mutaxassislik fani", "2-Mutaxassislik fani", "3-Mutaxassislik fani", "4-Mutaxassislik fani"],
        'tv_1': ["Dasturlash", "Fizika", "Hisob (Calculus)", "Ingliz tili", "O'zbekistonning eng yangi tarixi", "Diskret tuzilmalar", "Differentsial tenglamalar", "Falsafa", "Dinshunoslik"],
        'tv_2': ["Kiberxavfsizlik asoslari", "Elektronika va sxemalar", "Sun'iy intellekt asoslari"],
        'tv_3': ["Energomenedjment", "Hayot faoliyati xavfsizligi", "Raqamli o'lchov qurilmalari va axborot-boshqaruv tizimlari"],
        'tv_4': ["1-Mutaxassislik tanlov fani", "2-Mutaxassislik tanlov fani", "1-IT tanlov fani", "2-IT tanlov fani", "1-Mutaxassislik fani", "2-Mutaxassislik fani", "3-Mutaxassislik fani", "4-Mutaxassislik fani"],
        'ax_1': ["Dasturlash", "Fizika", "Hisob (Calculus)", "Ingliz tili", "O'zbekistonning eng yangi tarixi", "Diskret tuzilmalar", "Differentsial tenglamalar", "Falsafa", "Dinshunoslik"],
        'ax_2': ["Ma'lumotlar bazasi", "Kiberxavfsizlik asoslari", "Ma'lumotlar tuzilmasi va algoritmlar", "Elektronika va sxemalar", "Kompyuter tarmoqlari", "Server administration"],
        'ax_3': ["Operatsion tizimlar", "Ochiq kodli OT xavfsizligi", "O'rnatilgan tizimlar", "Tarmoq xavfsizligi"],
        'ax_4': ["1-Mutaxassislik fani", "2-Mutaxassislik fani", "3-Mutaxassislik fani", "4-Mutaxassislik fani"],
        'im_1': ["Dasturlash", "Fizika", "Hisob (Calculus)", "Ingliz tili", "O'zbekistonning eng yangi tarixi", "Diskret tuzilmalar", "Differentsial tenglamalar", "Iqtisodiyot nazariyasi", "Falsafa", "Dinshunoslik"],
        'im_2': ["Ma'lumotlar bazasi", "Kiberxavfsizlik asoslari", "Mikroiqtisodiyot", "Buxgalteriya hisobi va tamoyillari", "Statistika", "Sun'iy intellekt asoslari", "Pul, kredit, Banklar"],
        'im_3': ["Amaliy ekonometrika", "Operatsion tizimlar", "Iqtisodiy xavfsizlik", "Pedagogika. Psixologiya", "Moliya bozorlari"],
        'im_4': ["1-Mutaxassislik fani", "2-Mutaxassislik fani", "3-Mutaxassislik fani", "4-Mutaxassislik fani"],
        'tt_1': ["Dasturlash", "Fizika", "Hisob(Calculus)", "Ingliz tili", "O'zbekistonning eng yangi tarixi", "Diskret tuzilmalar", "Differentsial tenglamalar", "Falsafa", "Dinshunoslik"],
        'tt_2': ["Kiberxavfsizlik asoslari", "Ma'lumotlar tuzilmasi va algoritmlar", "Elektronika va sxemalar", "Ehtimollar va statistika", "Muhandislik grafikasi", "Radioelektronikaning nazariy asoslari", "Raqamli aloqa", "Sun'iy intellekt asoslari"],
        'tt_3': ["Raqamli qurilmalarni loyihalash", "Tasvirlarni qayta ishlash", "Pedagogika. Psixologiya", "Simsiz tarmoqlar", "O'rnatilgan boshqaruv tizimlar"],
        'tt_4': ["1-Mutaxassislik fani", "2-Mutaxassislik fani", "3-Mutaxassislik fani", "4-Mutaxassislik fani"],
        'default': ["Mutaxassislikka kirish", "Xorijiy til", "Oliy matematika", "Fizika", "Axborot texnologiyalari", "Sotsiologiya"]
    };

    const currentSubjects = (course && faculty) ? (subjectsMap[`${faculty}_${course}`] || subjectsMap['default']) : [];
    console.log(`Key: ${faculty}_${course}, Found: ${currentSubjects.length} subjects`);

    if (!course && !q) {
        return res.render('library', { books: [], user: req.session.user, search: q, courseFilter: null, facultyFilter: null, subjectFilter: null, faculties: tatuFaculties, courses, subjects: [], viewMode: 'courses' });
    }
    if (course && !faculty && !q) {
        return res.render('library', { books: [], user: req.session.user, search: q, courseFilter: course, facultyFilter: null, subjectFilter: null, faculties: tatuFaculties, courses, subjects: [], viewMode: 'faculties' });
    }
    if (course && faculty && !subject && !q && currentSubjects.length > 0) {
        return res.render('library', { books: [], user: req.session.user, search: q, courseFilter: course, facultyFilter: faculty, subjectFilter: null, faculties: tatuFaculties, courses, subjects: currentSubjects, viewMode: 'subjects' });
    }

    try {
        if (faculty && course && req.session.user) {
            // Passive profiling: update user faculty/course if browsing a specific section
            await db.run("UPDATE users SET faculty = $1, course = $2 WHERE id = $3 AND (faculty IS NULL OR course IS NULL)", [faculty, parseInt(course), req.session.user.id]);
        }

        const books = await db.getAll(sql, params);

        let videosSql = "SELECT * FROM videos WHERE 1=1";
        let vParams = [];
        let vCount = 1;
        if (course) { videosSql += ` AND course = $${vCount++}`; vParams.push(parseInt(course)); }
        if (faculty) { videosSql += ` AND (faculty = $${vCount} OR faculty = 'all')`; vParams.push(faculty); vCount++; }
        if (subject) { videosSql += ` AND subject = $${vCount++}`; vParams.push(subject); }
        const videos = await db.getAll(videosSql, vParams);

        res.render('library', { books, videos, user: req.session.user, search: q, courseFilter: course, facultyFilter: faculty, subjectFilter: subject, faculties: tatuFaculties, courses, subjects: currentSubjects, viewMode: 'books' });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Download Book
router.get('/download/:id', isAuthenticated, async (req, res) => {
    try {
        const row = await db.getRow("SELECT id, filepath FROM books WHERE id = $1", [req.params.id]);
        if (!row) return res.status(404).send("Kitob topilmadi");

        // Log activity
        await db.run("INSERT INTO user_activity (user_id, book_id, action_type) VALUES ($1, $2, 'download')", [req.session.user.id, row.id]);

        if (row.filepath.startsWith('http')) {
            try {
                const downloadUrl = new URL(row.filepath);
                downloadUrl.searchParams.set('download', '1');
                return res.redirect(downloadUrl.toString());
            } catch (e) {
                return res.redirect(row.filepath);
            }
        }

        res.download(row.filepath);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Read Book
router.get('/read/:id', isAuthenticated, async (req, res) => {
    try {
        const row = await db.getRow("SELECT id, filepath FROM books WHERE id = $1", [req.params.id]);
        if (!row) return res.status(404).send("Kitob topilmadi");

        // Log activity
        await db.run("INSERT INTO user_activity (user_id, book_id, action_type) VALUES ($1, $2, 'view')", [req.session.user.id, row.id]);

        if (row.filepath.startsWith('http')) {
            return res.redirect(row.filepath);
        }

        const absolutePath = require('path').resolve(row.filepath);
        res.sendFile(absolutePath, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${encodeURIComponent(row.filepath)}"`
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error: " + err.message);
    }
});

// Rate Book
router.post('/rate/:id', isAuthenticated, async (req, res) => {
    try {
        const rating = parseInt(req.body.rating);
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Noto'g'ri baho" });
        }

        const bookId = req.params.id;
        const row = await db.getRow("SELECT id FROM books WHERE id = $1", [bookId]);
        if (!row) {
            return res.status(404).json({ success: false, message: "Kitob topilmadi" });
        }

        await db.run("UPDATE books SET rating_sum = COALESCE(rating_sum, 0) + $1, rating_count = COALESCE(rating_count, 0) + 1 WHERE id = $2", [rating, bookId]);

        // Activity log
        await db.run("INSERT INTO user_activity (user_id, book_id, action_type) VALUES ($1, $2, 'rate')", [req.session.user.id, bookId]);

        res.json({ success: true, message: "Baho qabul qilindi" });
    } catch (err) {
        console.error("Rate book error:", err);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

module.exports = router;
