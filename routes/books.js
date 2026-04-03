const express = require('express');
const router = express.Router();
const db = require('../database');

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) return next();
    res.redirect('/login');
};

router.get('/library', isAuthenticated, async (req, res) => {
    const { q, faculty, course, subject } = req.query;
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
        'ki_1': ["Ingliz tili", "Hisob (Calculus)", "Fizika", "Falsafa", "Dinshunoslik", "Dasturlash", "O'zbekistonning eng yangi tarixi", "Diskret tuzilmalar", "Differentsial tenglamalar", "Akademik yozuv"],
        'ki_2': ["Sun'iy intellekt asoslari", "Ma'lumotlar tuzilmasi va algoritmlar", "Kompyuterni tashkil etish", "Kiberxavfsizlik asoslari", "Elektronika va sxemalar", "Veb ilovalar yaratish", "Ma'lumotlar bazasi", "Kompyuter tarmoqlari", "Ehtimollar va statistika", "Amaliy intellektual tizimlar"],
        'ki_3': ["Operatsion tizimlar", "Moliyaviy savodxonlik asoslari", "Inson kompyuter interfeysi", "Bulutli hisoblash", "Bilimlar bazasini loyihalash", "O'rnatilgan tizimlar", "Machine learning", "Jismoniy madaniyat va sport", "IoT: tizimlar va ilovalar"],
        'kt_1': ["O'zbekistonning eng yangi tarixi", "Ingliz tili", "Hisob(Calculus)", "Fizika", "Dasturlash", "Akademik yozuv", "Falsafa", "Dinshunoslik", "Diskret tuzilmalar", "Differentsial tenglamalar"],
        'kt_2': ["Ma'lumotlar tuzilmasi va algoritmlar", "Ma'lumotlar bazasi", "Kompyuterni tashkil etish", "Kiberxavfsizlik asoslari", "Elektronika va sxemalar", "Veb ilovalar yaratish", "Sun'iy intellekt asoslari", "Masofaviy ta'lim texnologiyalari", "Kompyuter tarmoqlari", "Ehtimollar va statistika"],
        'kt_3': ["Ta'lim nazariyasi", "Ta'limga kirish", "Operatsion tizimlar", "Jismoniy madaniyat va sport", "Elektron pedagogika", "Raqamli texnologiya va innovatsiyalar", "Pedagogika. Psixologiya", "O'rnatilgan tizimlar", "Kreativ pedagogika"],
        'di_1': ["O'zbekistonning eng yangi tarixi", "Umumiy psixologiya", "Informatikaning nazariy asoslari", "Chiziqli algebra va analitik geometriya", "Diskret matematika va matematik mantiq", "Matematik analiz", "Algoritm tillari va dasturlash", "Mediasavodxonlik va axborot madaniyati"],
        'di_2': ["Falsafa", "Umumiy pedagogika", "Umumiy fizika", "Differensial tenglamalar", "Dinshunoslik"],
        'di_3': ["Funksional analiz", "Sonli usullar", "Matematik fizika tenglamalari", "Matematik modellashtirish", "Jarayonlar tadqiqoti va optimal boshqaruv", "Matematika va informatika o'qitish metodikasi"],
        'di_4': ["Kompyuterli matematik tizimlar", "Inklyuziv ta'lim", "Gospital pedagogika", "Kompleks o'zgaruvchili funksiyalar nazariyasi"],
        'default': ["Mutaxassislikka kirish", "Xorijiy til", "Oliy matematika", "Fizika", "Axborot texnologiyalari", "Sotsiologiya"]
    };

    const currentSubjects = (course && faculty) ? (subjectsMap[`${faculty}_${course}`] || subjectsMap['default']) : [];

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
        const books = await db.getAll(sql, params);
        res.render('library', { books, user: req.session.user, search: q, courseFilter: course, facultyFilter: faculty, subjectFilter: subject, faculties: tatuFaculties, courses, subjects: currentSubjects, viewMode: 'books' });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Download Book
router.get('/download/:id', isAuthenticated, async (req, res) => {
    try {
        const row = await db.getRow("SELECT filepath FROM books WHERE id = $1", [req.params.id]);
        if (!row) return res.status(404).send("Kitob topilmadi");
        res.download(row.filepath);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
