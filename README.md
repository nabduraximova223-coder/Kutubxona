# TATU Online Library Web Platform

Ushbu loyiha Node.js, Express va SQLite yordamida yaratilgan to'liq funksional onlayn kutubxona tizimidir.

## Talablar (Requirements)

Loyihani ishga tushirish uchun kompyuteringizda **Node.js** o'rnatilgan bo'lishi kerak.

1.  **Node.js yuklab olish**: [nodejs.org](https://nodejs.org/) saytiga kiring va **LTS** versiyasini yuklab o'rnating.
2.  O'rnatilganligini tekshirish uchun terminalda (PowerShell yoki CMD) quyidagi buyruqni yozing:
    ```bash
    node -v
    ```

## O'rnatish (Installation)

1.  Loyiha papkasiga kiring: `C:\Users\MSI\Desktop\Loyiha`
2.  Terminalni shu papkada oching va kerakli kutubxonalarni o'rnating:
    ```bash
    npm install
    ```
    *Bu buyruq barcha kerakli paketlarni (express, sqlite3, ejs, va h.k.) internetdan yuklab oladi.*

## Ishga tushirish (Run)

1.  Loyihani ishga tushirish uchun:
    ```bash
    npm start
    ```
    yoki
    ```bash
    node server.js
    ```
2.  Brauzerni oching va manzil qatoriga yozing:
    ```
    http://localhost:3000
    ```

## Foydalanish (Usage)

### 1. Foydalanuvchi qismi
*   **Bosh sahifa**: Barcha kitoblarni ko'rish, qidirish va fan bo'yicha filterlash mumkin.
*   **Ro'yxatdan o'tish**: Yangi foydalanuvchilar o'z akkauntlarini yaratishi mumkin.
*   **Kirish**: Tizimga kirish (Login).
*   **Yuklab olish**: Faqat ro'yxatdan o'tgan foydalanuvchilar kitoblarni (PDF) yuklab olishi mumkin.

### 2. Admin Panel
*   **Admin bo'lib kirish**:
    *   **Login**: `admin`
    *   **Parol**: `admin123`
    *(Bu foydalanuvchi avtomatik tarzda yaratiladi)*
*   Admin panelda yangi kitob qo'shish, o'chirish va tahrirlash imkoniyati mavjud.

## Loyiha Tuzilmasi

*   `server.js`: Asosiy server fayli.
*   `database.js`: Ma'lumotlar bazasi (SQLite) sozlamalari.
*   `routes/`: Yo'nalishlar (Auth, Books, Admin).
*   `views/`: HTML shablonlar (EJS).
*   `public/`: CSS, rasmlar va JS fayllar.
*   `uploads/`: Yuklangan kitob fayllari.
