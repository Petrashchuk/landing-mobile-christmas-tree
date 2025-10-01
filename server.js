// server.js
import path from 'path';
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// ---------------- Middleware ----------------
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 днів
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// ---------------- Routes ----------------

// GET /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// POST /order
app.post('/order', async (req, res) => {
    try {
        const orderData = extractOrderData(req.body);
        const nameEncoded = encodeURIComponent(orderData.name || 'Гість');
        const redirectUrl = `/thank-you.html?name=${nameEncoded}`;

        // Telegram
        await sendTelegramNotification(orderData);

        // Facebook CAPI
        await sendFacebookCAPI({
            ...orderData,
            ip: req.ip,
            agent: req.headers['user-agent']
        }, req.headers.referer);

        if (req.headers['content-type']?.includes('application/json')) {
            return res.json({redirect: redirectUrl});
        }

        redirectThankYou(res, orderData);
    } catch (error) {
        console.error('Error in /order:', error);
        res.status(500).send('Помилка на сервері');
    }
});

// ----------------- Functions -----------------

function extractOrderData(body) {
    const {name, phone, type, size, event_id} = body;
    return {
        name,
        phone,
        type,
        size,
        event_id: event_id || crypto.randomUUID(),
    };
}

// Telegram notification
async function sendTelegramNotification({name, phone, type, size}) {
    if (!process.env.TELEGRAM_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

    const message = `<b>Ім'я користувача:</b> ${name}\n<b>Телефон:</b> ${phone}\n<b>Вид:</b> ${type}\n<b>Розмір:</b> ${size}`;
    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;

    try {
        const response = await axios.get(telegramUrl, {
            params: {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                parse_mode: 'html',
                text: message,
            },
        });
        if (!response.data.ok) throw new Error('Telegram API error');
    } catch (err) {
        console.error('Помилка при відправці Telegram:', err.message);
    }
}

// Facebook CAPI
async function sendFacebookCAPI({name, phone, type, size, event_id, ip, agent, _fbp, _fbc}, referer) {
    if (!process.env.FB_ACCESS_TOKEN || !process.env.FB_PIXEL_ID) return;

    const fbUrl = `https://graph.facebook.com/v23.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`;

    const eventData = {
        data: [
            {
                event_name: 'Lead',
                event_time: Math.floor(Date.now() / 1000),
                event_id,
                action_source: 'website',
                event_source_url: referer || 'https://land.yalynkahub.com.ua/',
                user_data: {
                    fbp: _fbp,
                    fbc: _fbc,
                    em: hashSHA256(phone),
                    client_ip_address: ip,
                    client_user_agent: agent,
                },
                custom_data: {
                    content_name: type,
                    content_category: size,
                    client_ip_address: ip,
                    client_user_agent: agent,
                },
            },
        ],
    };

    try {
        const params = {};
        if (process.env.FB_TEST_CODE) params.test_event_code = process.env.FB_TEST_CODE;

        const response = await axios.post(fbUrl, eventData, {
            headers: { 'Content-Type': 'application/json' },
            params
        });

        if (!response.data.events_received) throw new Error('Facebook CAPI error');
        console.log('Facebook CAPI send successfully!!!');

    } catch (err) {
        console.error('Помилка при відправці Facebook CAPI:', err.message);
    }
}

// Redirect to thank-you page
function redirectThankYou(res, {name}) {
    const queryParams = new URLSearchParams({name}).toString();
    res.redirect(`/thank-you.html?${queryParams}`);
}

// SHA256 hash
function hashSHA256(str) {
    return crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');
}

// ----------------- Start Server -----------------
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});
