// server.js
const path = require("path");
const express = require("express");
const fetch = require("node-fetch");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Шлях до поточної директорії
const __dirname = path.resolve();

// Парсинг form-data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filePath)) {
            // Кешуємо картинки 30 днів
            res.setHeader("Cache-Control", "public, max-age=2592000");
        } else if (filePath.endsWith(".html")) {
            // HTML не кешуємо
            res.setHeader("Cache-Control", "no-cache");
        }
    }
}));

// GET /
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// POST /order
app.post("/order", async (req, res) => {
    try {
        const name = encodeURIComponent(req.body.name || "Гість");
        const redirectUrl = `/thank-you.html?name=${name}`;
        const orderData = extractOrderData(req.body);
        await sendTelegramNotification(orderData);
        await sendFacebookCAPI(
            { ...orderData, ip: req.ip, agent: req.headers["user-agent"] },
            req.headers.referer
        );

        if (req.headers["content-type"] && req.headers["content-type"].includes("application/json")) {
            return res.json({ redirect: redirectUrl });
        }
        return redirectThankYou(res, orderData);
    } catch (error) {
        console.error(error);
        res.status(500).send("Помилка на сервері");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});

/* ----------------- ФУНКЦІЇ ----------------- */

// Витягуємо дані замовлення з req.body
function extractOrderData(body) {
    const { name, phone, type, size, event_id } = body;
    return {
        name,
        phone,
        type,
        size,
        event_id: event_id || crypto.randomUUID(),
    };
}

// Відправка повідомлення в Telegram
async function sendTelegramNotification({ name, phone, type, size }) {
    const token = process.env.TELEGRAM_TOKEN;
    const chat_id = process.env.TELEGRAM_CHAT_ID;
    const message = `
<b>Ім'я користувача:</b> ${name}
<b>Телефон:</b> ${phone}
<b>Вид:</b> ${type}
<b>Розмір:</b> ${size}
`;
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&parse_mode=html&text=${encodeURIComponent(
        message
    )}`;
    const response = await fetch(telegramUrl);
    const data = await response.json();

    if (!data.ok) throw new Error("Telegram API error");
}

// Відправка події в Facebook CAPI
async function sendFacebookCAPI({ name, phone, type, size, event_id, ip, agent }, referer) {
    const token = process.env.FB_ACCESS_TOKEN;
    const pixelId = process.env.FB_PIXEL_ID;


    const fbUrl = `https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${token}`;

    const eventData = {
        data: [
            {
                event_name: "Lead",
                event_time: Math.floor(Date.now() / 1000),
                event_id,
                action_source: "website",
                event_source_url: referer || "https://land.yalynkahub.com.ua/",
                user_data: {
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

    const response = await fetch(fbUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
    });
    const data = await response.json();
    if (!data.events_received) throw new Error("Facebook CAPI error");
}

// Редірект на сторінку дяки
function redirectThankYou(res, { name }) {
    const queryParams = new URLSearchParams({ name }).toString();
    res.redirect(`/thank-you.html?${queryParams}`);
}

// Хешування для user_data (Facebook CAPI)
function hashSHA256(str) {
    return crypto.createHash("sha256").update(str.trim().toLowerCase()).digest("hex");
}
