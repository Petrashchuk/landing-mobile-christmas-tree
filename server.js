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

        // Приймачі — незалежні й best-effort: падіння одного не має ламати
        // оформлення (клієнт усе одно побачить «дякуємо»). Сповіщення в Telegram
        // іде НЕ звідси, а через CRM-бот (@orderlicrmbot): замовлення створюється
        // в Orderli, а CRM сам малює картку з кнопками у підключеній групі.
        await Promise.allSettled([
            // Facebook CAPI
            sendFacebookCAPI({
                ...orderData,
                ip: req.ip,
                agent: req.headers['user-agent']
            }, req.headers.referer),
            // Orderli CRM — створюємо замовлення в CRM продавця
            sendCrmOrder({...orderData, utm: extractUtm(req.body)}),
        ]);

        if (req.headers['content-type']?.includes('application/json')) {
            return res.json({redirect: redirectUrl});
        }

        redirectThankYou(res, orderData);
    } catch (error) {
        console.error('Error in /order:', error);
        res.status(500).send('Помилка на сервері');
    }
});

// ---------------- Nova Poshta proxy ----------------
// Проксі до API Нової Пошти, щоб NP_API_KEY лишався на сервері (не світився у
// фронті). Три каскадні довідники: області → міста → відділення. Усі best-effort —
// на помилці повертають порожній список, щоб форма не падала.

async function npCall(calledMethod, methodProperties = {}) {
    const {data} = await axios.post('https://api.novaposhta.ua/v2.0/json/', {
        apiKey: process.env.NP_API_KEY,
        modelName: 'Address',
        calledMethod,
        methodProperties: {Language: 'UA', ...methodProperties},
    }, {timeout: 15000});
    return data;
}

// GET /np/areas — список областей (Ref + назва)
app.get('/np/areas', async (req, res) => {
    if (!process.env.NP_API_KEY) return res.json({items: []});
    try {
        const d = await npCall('getAreas', {});
        res.json({items: (d.data || []).map((a) => ({ref: a.Ref, name: a.Description}))});
    } catch (err) {
        console.error('NP getAreas:', err.message);
        res.json({items: []});
    }
});

// GET /np/cities?areaRef=&q= — міста в області за пошуковим рядком
app.get('/np/cities', async (req, res) => {
    const areaRef = String(req.query.areaRef || '').trim();
    const q = String(req.query.q || '').trim();
    if (!process.env.NP_API_KEY || q.length < 2) return res.json({items: []});
    try {
        const props = {FindByString: q, Limit: '20', Page: '1'};
        if (areaRef) props.AreaRef = areaRef;
        const d = await npCall('getCities', props);
        res.json({
            items: (d.data || []).map((c) => ({
                ref: c.Ref, name: c.Description, area: c.AreaDescription || '',
            })),
        });
    } catch (err) {
        console.error('NP getCities:', err.message);
        res.json({items: []});
    }
});

// GET /np/warehouses?cityRef=&q= — відділення/поштомати міста
app.get('/np/warehouses', async (req, res) => {
    const cityRef = String(req.query.cityRef || '').trim();
    const q = String(req.query.q || '').trim();
    if (!process.env.NP_API_KEY || !cityRef) return res.json({items: []});
    try {
        const props = {CityRef: cityRef, Limit: '50', Page: '1'};
        if (q) props.FindByString = q;
        const d = await npCall('getWarehouses', props);
        res.json({
            items: (d.data || []).map((w) => ({
                ref: w.Ref, number: w.Number, name: w.Description,
            })),
        });
    } catch (err) {
        console.error('NP getWarehouses:', err.message);
        res.json({items: []});
    }
});

// ----------------- Functions -----------------

function parseSizeAndPrice(str) {
    // Використовуємо регулярний вираз для розбору рядка
    const match = str.match(/([\d.,]+\s*м)\D*?(\d+)/);
    if (!match) return null; // якщо не збіглося

    const size = match[1].trim();       // "1.5 м"
    const price = Number(match[2]);     // 2090

    return {size, price};
}

function extractOrderData(body) {
    const {name, phone, type, size, event_id, comment} = body;
    const {size: parsedSize, price} = parseSizeAndPrice(size);
    return {
        name,
        phone,
        type,
        size: parsedSize,
        price,
        event_id: event_id || crypto.randomUUID(),
        comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) : '',
        delivery: extractDelivery(body),
    };
}

// Доставка Нова Пошта (на відділення) — зібрана фронтом із Ref'ами. Валідна
// лише коли є і місто, і відділення; інакше замовлення йде без адреси (продавець
// уточнить вручну). Формат — під delivery_address публічного API CRM.
function extractDelivery(body = {}) {
    const cityRef = String(body.city_ref || '').trim();
    const warehouseRef = String(body.warehouse_ref || '').trim();
    if (!cityRef || !warehouseRef) return null;
    return {
        delivery_type: 'warehouse',
        city_ref: cityRef,
        city_name: String(body.city_name || '').slice(0, 200),
        warehouse_ref: warehouseRef,
        warehouse_number: String(body.warehouse_number || '').slice(0, 20),
        warehouse_description: String(body.warehouse_description || '').slice(0, 500),
    };
}

// Telegram notification
function splitName(fullName = '') {
    const parts = fullName.trim().split(/\s+/);
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
    };
}

// Facebook CAPI
async function sendFacebookCAPI({name, phone, type, size, price, event_id, ip, agent, _fbp, _fbc}, referer) {
    if (!process.env.FB_ACCESS_TOKEN || !process.env.FB_PIXEL_ID) return;

    const fbUrl = `https://graph.facebook.com/v23.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`;

    const {firstName, lastName} = splitName(name);

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
                    ph: phone ? hashSHA256(phone) : undefined,
                    fn: firstName ? hashSHA256(firstName) : undefined,
                    ln: lastName ? hashSHA256(lastName) : undefined,
                    client_ip_address: ip,
                    client_user_agent: agent,
                },
                custom_data: {
                    content_name: type,
                    content_category: size,
                    value: price,
                    currency: 'UAH',
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
            headers: {'Content-Type': 'application/json'},
            params
        });

        if (!response.data.events_received) throw new Error('Facebook CAPI error');
        console.log('Facebook CAPI send successfully!!!');

    } catch (err) {
        console.error('Помилка при відправці Facebook CAPI:', err.message);
    }
}

// Витягуємо UTM-мітки з тіла запиту (фронт прокидає їх з URL-параметрів
// посадкової). Повертаємо лише непорожні — CRM приймає гнучкий «плоский» формат.
function extractUtm(body = {}) {
    const utm = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const v = body[key];
        if (typeof v === 'string' && v.trim()) utm[key] = v.trim().slice(0, 200);
    }
    return utm;
}

// Orderli CRM — публічний API інжесту замовлень (POST /api/v1/public/orders,
// авторизація через API-ключ продавця). Замовлення з'являється у CRM зі
// статусом «Новий», мапиться у власне джерело аналітики/маршрутизації та
// йде в авто-розподіл між менеджерами. Best-effort: ніколи не кидає —
// проблема з CRM не має зривати оформлення на лендінгу.
async function sendCrmOrder({name, phone, type, size, price, event_id, utm, delivery, comment}) {
    if (!process.env.CRM_API_URL || !process.env.CRM_API_KEY) return;

    const {firstName, lastName} = splitName(name);
    const source = process.env.CRM_ORDER_SOURCE || 'Лендінг ялинки';

    // Коментар клієнта + мета лендінгу (вид+розмір) в одному полі.
    const crmComment = [
        comment,
        `Лендінг: ${type || 'Ялинка'}${size ? ` ${size}` : ''}`,
    ].filter(Boolean).join(' · ').slice(0, 2000);

    const payload = {
        client: {
            phone,
            first_name: firstName || 'Клієнт',
            ...(lastName ? {last_name: lastName} : {}),
            // Адреса Нової Пошти (відділення) — CRM префіллить нею форму ТТН.
            ...(delivery ? {delivery_address: delivery} : {}),
        },
        items: [
            {
                name: type || 'Ялинка',
                ...(size ? {variant: size} : {}),
                quantity: 1,
                price: Number(price) || 0, // публічний API приймає гривні
            },
        ],
        payment_type: 'cod',
        source,
        // Ідемпотентність: повторний сабміт з тим самим event_id не задвоїть
        // замовлення (CRM дедуплікує за external_id у межах продавця).
        external_id: `landing:${event_id}`,
        comment: crmComment,
        // Повертаному клієнту оновити збережену адресу на щойно обрану (сайт/CMS
        // чекаут авторитетний щодо місця доставки — інакше ТТН візьме стару).
        ...(delivery ? {refresh_client_delivery: true} : {}),
        ...(utm && Object.keys(utm).length ? utm : {}),
    };

    const base = process.env.CRM_API_URL.replace(/\/+$/, '');

    try {
        const response = await axios.post(`${base}/api/v1/public/orders`, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.CRM_API_KEY}`,
            },
            timeout: 15000,
        });
        const data = response.data?.data;
        console.log(
            `Orderli CRM order ${response.data?.duplicate ? 'deduped' : 'created'}:`,
            data?.order_number || data?.id,
        );
    } catch (err) {
        // Логуємо тіло помилки CRM (валідація/тариф/ключ), але не кидаємо далі.
        console.error('Помилка при створенні замовлення в CRM:', err.response?.data || err.message);
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
