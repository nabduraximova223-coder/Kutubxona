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
        const systemRole = isRu
            ? "Вы — умный ИИ-ассистент библиотеки ТАТУ. Вы должны отвечать на все вопросы пользователя полезно, развернуто и на языке: RU."
            : "Siz TATU kutubxonasining aqlli AI yordamchisisiz. Siz foydalanuvchining barcha savollariga (nafaqat kutubxona haqida, balki har qanday mavzuda) batafsil va to'g'ri javob berishingiz kerak. Javob berish tili: UZ.";

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
