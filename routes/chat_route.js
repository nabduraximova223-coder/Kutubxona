const express = require('express');
const router = express.Router();
const https = require('https');
const db = require('../database');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

router.get('/history', async (req, res) => {
    if (!req.session || !req.session.user) return res.json({ chats: [] });
    try {
        const chats = await db.getAll('SELECT id, title, created_at FROM chats WHERE user_id = $1 ORDER BY created_at DESC', [req.session.user.id]);
        res.json({ chats });
    } catch (e) {
        res.status(500).json({ error: "DB Error" });
    }
});

router.get('/session/:id', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: "Unauthorized" });
    try {
        const chat = await db.getRow('SELECT * FROM chats WHERE id = $1 AND user_id = $2', [req.params.id, req.session.user.id]);
        if (!chat) return res.status(404).json({ error: "Chat not found" });
        const messages = await db.getAll('SELECT role, content, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC', [req.params.id]);
        res.json({ messages });
    } catch (e) {
        res.status(500).json({ error: "DB Error" });
    }
});

router.post('/session', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ error: "Unauthorized" });
    const title = req.body.title || 'Yangi suhbat';
    try {
        const result = await db.run('INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id', [req.session.user.id, title]);
        res.json({ chatId: result.rows[0].id });
    } catch (e) {
        res.status(500).json({ error: "DB Error" });
    }
});

router.post('/', async (req, res) => {
    const { message, lang, chatId } = req.body;
    let finalChatId = chatId;

    try {
        const isRu = lang === 'ru';
        let userContext = "";

        if (req.session && req.session.user) {
            try {
                const userProfile = await db.getRow("SELECT faculty, course FROM users WHERE id = $1", [req.session.user.id]);
                const activities = await db.getAll(`
                    SELECT b.title, b.author, a.action_type 
                    FROM user_activity a 
                    JOIN books b ON a.book_id = b.id 
                    WHERE a.user_id = $1 
                    ORDER BY a.created_at DESC LIMIT 10
                `, [req.session.user.id]);

                if (userProfile && (userProfile.faculty || userProfile.course)) {
                    userContext += isRu
                        ? `\nДанные пользователя: факультет ${userProfile.faculty || 'не указан'}, курс ${userProfile.course || 'не указан'}.`
                        : `\nFoydalanuvchi ma'lumotlari: fakultet ${userProfile.faculty || 'aniqlanmagan'}, kurs ${userProfile.course || 'aniqlanmagan'}.`;
                }

                if (activities.length > 0) {
                    const activityList = activities.map(a => `${a.title} (${a.author}) - ${a.action_type}`).join(', ');
                    userContext += isRu
                        ? `\nПоследние действия: ${activityList}.`
                        : `\nOxirgi harakatlar: ${activityList}.`;
                }
            } catch (e) {
                console.error("Context fetch error:", e);
            }
        }

        const systemRole = isRu
            ? "Вы — умный ИИ-ассистент библиотеки ТАТУ. Вы должны отвечать на все вопросы полезно и развернуто. Если пользователь называет название книги и автора и просит составить тесты, вы должны опираясь на свои знания составить запрошенное количество качественных тестов с вариантами ответов (A, B, C, D) по содержанию этой книги (с указанием правильных ответов). Язык ответов: RU." + userContext
            : "Siz TATU kutubxonasining aqlli AI yordamchisisiz. Siz foydalanuvchining barcha savollariga batafsil javob berishingiz kerak. Agar foydalanuvchi tizimdagi biror kitob nomini va muallifini qoldirib, shu kitob bo'yicha test (quiz) tuzib berishni so'rasa, siz o'z bilimingizga tayangan holda shu kitob mazmuniga oid so'ralgan miqdorda har xil variantli (A, B, C, D) sifatli testlarni tuzib berishingiz shart. Test oxirida to'g'ri javoblarni ham kalit sifatida ko'rsating. Javob berish tili: UZ." + userContext;

        const apiMessages = [{ role: "system", content: systemRole }];

        if (req.session && req.session.user) {
            if (!finalChatId || String(finalChatId) === 'null' || finalChatId === 'new') {
                const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
                const result = await db.run('INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id', [req.session.user.id, title]);
                finalChatId = result.rows[0].id;
            } else {
                const chat = await db.getRow('SELECT * FROM chats WHERE id = $1 AND user_id = $2', [finalChatId, req.session.user.id]);
                if (chat) {
                    const pastMessages = await db.getAll('SELECT role, content FROM messages WHERE chat_id = $1 ORDER BY created_at ASC', [finalChatId]);
                    pastMessages.forEach(m => apiMessages.push({ role: m.role, content: m.content }));
                } else {
                    finalChatId = null;
                }
            }

            if (finalChatId) {
                await db.run('INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)', [finalChatId, 'user', message]);
            }
        }

        apiMessages.push({ role: "user", content: message });

        const requestData = JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 1024
        });

        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData)
            }
        };

        const groqReq = https.request(options, (groqRes) => {
            let data = '';
            groqRes.on('data', chunk => data += chunk);
            groqRes.on('end', async () => {
                if (groqRes.statusCode >= 200 && groqRes.statusCode < 300) {
                    try {
                        const parsedData = JSON.parse(data);
                        const text = parsedData.choices[0].message.content;
                        if (finalChatId) {
                            await db.run('INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)', [finalChatId, 'assistant', text]);
                        }
                        res.json({ reply: text, chatId: finalChatId });
                    } catch (e) {
                        res.status(500).json({ error: "Failed to parse response" });
                    }
                } else {
                    res.status(500).json({ error: "Groq API error" });
                }
            });
        });

        groqReq.on('error', () => res.status(500).json({ error: "Request failed" }));
        groqReq.write(requestData);
        groqReq.end();

    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
