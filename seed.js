const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

const booksToAdd = [
    // 1-kurs
    { course: 1, faculty: 'ki', subject: "Ingliz tili", title: "English for IT Students", author: "John Smith", description: "Asosiy ingliz tili darsligi" },
    { course: 1, faculty: 'ki', subject: "Hisob (Calculus)", title: "Calculus I", author: "James Stewart", description: "Matematik tahlil asoslari" },
    { course: 1, faculty: 'ki', subject: "Fizika", title: "University Physics", author: "Young & Freedman", description: "Fizika kursi" },
    { course: 1, faculty: 'ki', subject: "Falsafa", title: "Falsafa asoslari", author: "O'zbekiston faylasuflari", description: "Falsafa tarixi va nazariyasi" },
    { course: 1, faculty: 'ki', subject: "Dinshunoslik", title: "Dinshunoslikka kirish", author: "Tarixchilar", description: "Dinlar tarixi" },
    { course: 1, faculty: 'ki', subject: "Dasturlash", title: "Python Programming", author: "Guido van Rossum", description: "Boshlang'ich dasturlash darsligi" },
    { course: 1, faculty: 'ki', subject: "O'zbekistonning eng yangi tarixi", title: "O'zbekiston tarixi", author: "Tarix instituti", description: "Yangi tarix fanidan o'quv qo'llanma" },
    { course: 1, faculty: 'ki', subject: "Diskret tuzilmalar", title: "Discrete Mathematics", author: "Kenneth Rosen", description: "Diskret matematika va uning tatbiqlari" },
    { course: 1, faculty: 'ki', subject: "Differentsial tenglamalar", title: "Differential Equations", author: "Dennis Zill", description: "Differensial tenglamalar kursi" },

    // 2-kurs
    { course: 2, faculty: 'ki', subject: "Sun'iy intellekt asoslari", title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", description: "Sun'iy intellekt asoslari" },
    { course: 2, faculty: 'ki', subject: "Ma'lumotlar tuzilmasi va algoritmlar", title: "Introduction to Algorithms", author: "Thomas H. Cormen", description: "Algoritmlar" },
    { course: 2, faculty: 'ki', subject: "Kompyuterni tashkil etish", title: "Computer Organization and Design", author: "David A. Patterson", description: "Kompyuter arxitekturasi" },
    { course: 2, faculty: 'ki', subject: "Kiberxavfsizlik asoslari", title: "Cybersecurity Fundamentals", author: "Charles J. Brooks", description: "Axborot xavfsizligi" },
    { course: 2, faculty: 'ki', subject: "Elektronika va sxemalar", title: "Microelectronic Circuits", author: "Adel S. Sedra", description: "Sxemotexnika" },
    { course: 2, faculty: 'ki', subject: "Veb ilovalar yaratish", title: "Web Development with Node & Express", author: "Ethan Brown", description: "Veb dasturlash" },
    { course: 2, faculty: 'ki', subject: "Ma'lumotlar bazasi", title: "Database System Concepts", author: "Abraham Silberschatz", description: "Ma'lumotlar bazasi" },
    { course: 2, faculty: 'ki', subject: "Kompyuter tarmoqlari", title: "Computer Networking", author: "James Kurose", description: "Tarmoqlar" },
    { course: 2, faculty: 'ki', subject: "Ehtimollar va statistika", title: "Introduction to Probability", author: "Dimitri P. Bertsekas", description: "Ehtimollar nazariyasi" },
    { course: 2, faculty: 'ki', subject: "Amaliy intellektual tizimlar", title: "Applied Intelligent Systems", author: "John MacIntyre", description: "Intellektual tizimlar tatbiqi" },

    // 3-kurs
    { course: 3, faculty: 'ki', subject: "Operatsion tizimlar", title: "Modern Operating Systems", author: "Andrew S. Tanenbaum", description: "OT nazariyasi va amaliyoti" },
    { course: 3, faculty: 'ki', subject: "Moliyaviy savodxonlik asoslari", title: "Personal Finance", author: "Jack Kapoor", description: "Moliyaviy savodxonlik" },
    { course: 3, faculty: 'ki', subject: "Inson kompyuter interfeysi", title: "Human-Computer Interaction", author: "Alan Dix", description: "HCI asoslari" },
    { course: 3, faculty: 'ki', subject: "Bulutli hisoblash", title: "Cloud Computing", author: "Thomas Erl", description: "Bulutli texnologiyalar" },
    { course: 3, faculty: 'ki', subject: "Bilimlar bazasini loyihalash", title: "Knowledge Management Systems", author: "Ronald Maier", description: "Bilimlar bazasi" },
    { course: 3, faculty: 'ki', subject: "O'rnatilgan tizimlar", title: "Embedded Systems Architecture", author: "Tammy Noergaard", description: "O'rnatilgan tizimlar" },
    { course: 3, faculty: 'ki', subject: "Machine learning", title: "Pattern Recognition and Machine Learning", author: "Christopher M. Bishop", description: "Mashinali o'qitish" },
    { course: 3, faculty: 'ki', subject: "Jismoniy madaniyat va sport", title: "Jismoniy tarbiya", author: "O'qituvchilar", description: "Sog'lom turmush tarzi" },
    { course: 3, faculty: 'ki', subject: "IoT: tizimlar va ilovalar", title: "Internet of Things", author: "Raj Kamal", description: "Buyumlar interneti" }
];

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO books (title, author, subject, faculty, course, description, filepath) VALUES (?, ?, ?, ?, ?, ?, ?)");

    booksToAdd.forEach(b => {
        stmt.run(b.title, b.author, b.subject, b.faculty, b.course, b.description, "uploads/dummy.pdf");
    });

    stmt.finalize(() => {
        console.log("Books added successfully!");
        db.close();
    });
});
