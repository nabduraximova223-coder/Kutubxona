# Saytning Umumiy Arxitekturasi

Bu loyiha **Node.js** texnologiyasi asosida qurilgan bo'lib, zamonaviy va kengaytiriluvchan (scalable) arxitekturaga ega.

## 1. Texnologiyalar Paketi (Tech Stack)

*   **Backend:** Node.js va Express.js frameworki.
*   **Frontend:** EJS (Embedded JavaScript) - server-side render uchun.
*   **Dizayn:** Vanilla CSS (Custom styling).
*   **Ma'lumotlar bazasi:** PostgreSQL (Vercel Postgres/Neon).
*   **Fayllar saqlash:** Vercel Blob Storage kitoblar (PDF) uchun.
*   **Autentifikatsiya:** `bcryptjs` (parollarni shifrlash) va `cookie-session`.
*   **Xosting:** Vercel.

## 2. Loyiha Tuzilishi (Folder Structure)

```text
/Loyiha
├── server.js           # Asosiy kirish nuqtasi (Entry point)
├── database.js         # DB ulanishi va jadvallarni yaratish
├── locales.js          # Ko'p tillilik (UZ, RU, EN) ma'lumotlari
├── package.json        # Kutubxonalar va scriptlar
├── /public             # Statik fayllar (CSS, rasmlar, JS)
│   └── /css/style.css  # Asosiy dizayn fayli
├── /routes             # Saytning mantiqiy bo'limlari
│   ├── auth.js         # Ro'yxatdan o'tish va login
│   ├── books.js        # Kitoblar va library bo'limi
│   ├── admin.js        # Admin panel boshqaruvi
│   └── settings.js     # Profil sozalamalari
└── /views              # EJS shablonlari (HTML qismlar)
    ├── /partials       # Takrorlanuvchi qismlar (header, footer)
    └── *.ejs           # Har bir sahifa uchun HTML shablon
```

## 3. Ma'lumotlar Oqimi (Data Flow)

1.  **Request:** Foydalanuvchi brauzer orqali biror sahifaga so'rov yuboradi.
2.  **Routing:** `server.js` so'rovni tegishli `routes/*.js` fayliga yo'naltiradi.
3.  **Controller:** Route bog'langan ma'lumotlarni bazadan (`database.js` orqali) oladi.
4.  **View Engine:** Olingan ma'lumotlar EJS shabloniga uzatiladi.
5.  **Response:** Tayyor bo'lgan HTML foydalanuvchiga yuboriladi.

## 4. Xavfsizlik

*   Parollar ochiq holda saqlanmaydi, `bcrypt` yordamida shifrlanadi.
*   Admin paneli uchun alohida `isAdmin` middleware mavjud bo'lib, u faqat tegishli huquqqa ega foydalanuvchilarni o'tkazadi.
*   Sessionlar xavfsiz cookie orqali boshqariladi.
