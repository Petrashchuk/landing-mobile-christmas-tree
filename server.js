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

// GET / — основний лендінг (повний магазин: каталог, кошик, онлайн-оплата)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /lead — короткий лід-лендінг для Meta-кампаній, оптимізованих під «Leads».
// Мінімальна форма (ім'я + телефон + вид/розмір ялинки, без вибору адреси) → менеджер
// передзвонить уточнити адресу. Сабміт іде на той самий POST /order: браузерний піксель
// Lead (dedup по eventID) + серверний CAPI Lead + створення замовлення в CRM.
app.get(['/lead', '/lead.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lead.html'));
});

// Старе посилання на новий лендінг → на корінь (щоб закладки не ламались)
app.get('/index-new.html', (req, res) => res.redirect(301, '/'));

// WayForPay повертає покупця на returnUrl через POST (авто-сабміт форми з результатом
// оплати). Express-статика обслуговує лише GET → POST падав у «Cannot POST /thank-you.html».
// Редіректимо POST→GET (303 See Other) зі збереженням query, щоб сторінка подяки
// відрендерилась. Факт оплати підтверджує WFP-webhook → CRM, а не цей редірект —
// transactionStatus передаємо як ?pay=, щоб клієнт-сторінка знала success/fail
// (кошик чистимо лише на успіху; на невдачі лишаємо, щоб клієнт повторив оплату).
app.post('/thank-you.html', (req, res) => {
    const status = (req.body && req.body.transactionStatus) ? String(req.body.transactionStatus) : '';
    const sep = req.originalUrl.includes('?') ? '&' : '?';
    const url = status ? `${req.originalUrl}${sep}pay=${encodeURIComponent(status)}` : req.originalUrl;
    res.redirect(303, url);
});

// POST /order
app.post('/order', async (req, res) => {
    try {
        const orderData = extractOrderData(req.body);
        const nameEncoded = encodeURIComponent(orderData.name || 'Гість');
        // value + eid йдуть у thank-you для TikTok CompletePayment (purchase-оптимізація + дедуп)
        const thankYouUrl = `/thank-you.html?name=${nameEncoded}&value=${orderData.price || 0}&eid=${encodeURIComponent(orderData.event_id)}`;

        // Абсолютний URL повернення клієнта з WayForPay на сторінку подяки (success/fail).
        const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0];
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const returnUrl = host ? `${proto}://${host}${thankYouUrl}` : null;

        // Піксельні приймачі — best-effort (не блокують і не ламають оформлення).
        // Сповіщення в Telegram іде НЕ звідси, а через CRM-бот (@orderlicrmbot):
        // замовлення створюється в Orderli, CRM сам малює картку в групі.
        const pixels = Promise.allSettled([
            sendFacebookCAPI({...orderData, ip: req.ip, agent: req.headers['user-agent']}, req.headers.referer),
            sendTikTokEvents({...orderData, ip: req.ip, agent: req.headers['user-agent']}, req.headers.referer),
        ]);
        // CRM створює замовлення (+ для online/частин — WFP-лінк). Чекаємо саме його,
        // бо потрібен pay_url. sendCrmOrder НІКОЛИ не кидає (ловить усередині) → cod-safe.
        const crm = await sendCrmOrder({...orderData, utm: extractUtm(req.body), return_url: returnUrl});
        await pixels;

        // online/частинами → на захищену сторінку оплати (pay_url);
        // накладений або лінк не створено → на сторінку подяки.
        const payUrl = crm && crm.pay_url ? crm.pay_url : null;
        // COD/без лінка → на подяку з маркером ok=1 (підтверджене оформлення, кошик чистимо).
        // Онлайн → на pay_url; статус успіху прийде від WayForPay як ?pay=Approved (не тут),
        // тож returnUrl навмисно БЕЗ ok=1 — інакше скасована оплата хибно виглядала б успішною.
        const redirectUrl = payUrl || `${thankYouUrl}&ok=1`;

        if (req.headers['content-type']?.includes('application/json')) {
            return res.json({redirect: redirectUrl});
        }
        if (payUrl) return res.redirect(payUrl);
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

// GET /np/streets?cityRef=&q= — вулиці міста (для адреси кур'єра)
app.get('/np/streets', async (req, res) => {
    const cityRef = String(req.query.cityRef || '').trim();
    const q = String(req.query.q || '').trim();
    if (!process.env.NP_API_KEY || !cityRef || q.length < 2) return res.json({items: []});
    try {
        const d = await npCall('getStreet', {CityRef: cityRef, FindByString: q, Limit: '30', Page: '1'});
        res.json({
            items: (d.data || []).map((s) => ({
                ref: s.Ref, name: s.Description, type: s.StreetsType || s.StreetsTypeRef || '',
            })),
        });
    } catch (err) {
        console.error('NP getStreet:', err.message);
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
    const {name, first_name, last_name, phone, type, size, event_id, comment, _fbp, _fbc, _ttp, payment_method, installment_bank, installment_parts, order_source} = body;
    // Ім'я/прізвище окремими полями (краще для CRM); фолбек на старе єдине name.
    const firstName = (first_name || '').trim();
    const lastName = (last_name || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || name;
    // Кошик (міні-магазин): кілька позицій одним замовленням. Якщо його нема —
    // лягаємо на стару логіку одного дерева (type + size "1.5 м - 2090грн").
    const items = parseCartItems(body.cart);
    let parsedSize = null, singlePrice = 0;
    if (!items.length && size) {
        const p = parseSizeAndPrice(size) || {};
        parsedSize = p.size || null;
        singlePrice = p.price || 0;
    }
    const total = items.length
        ? items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0)
        : singlePrice;
    // Спосіб оплати (радіо у формі). online/installment → CRM поверне pay_url для редіректу.
    // Частинами — лише від 1000₴ (як на основному сайті); інакше падаємо на онлайн-оплату.
    let payMethod = ['online', 'installment', 'cod'].includes(payment_method) ? payment_method : 'cod';
    if (payMethod === 'installment' && total < 1000) payMethod = 'online';
    const payment = { method: payMethod };
    if (payMethod === 'installment' && installment_bank) {
        payment.installment = { bank: String(installment_bank), parts: Number(installment_parts) || 3 };
    }
    return {
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone,
        type,
        size: parsedSize,
        price: total,       // сума замовлення — CAPI використовує як value
        items,              // [] для legacy-одного-дерева
        event_id: event_id || crypto.randomUUID(),
        comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) : '',
        delivery: extractDelivery(body),
        payment,
        // Meta browser match ids (cookies) — forwarded to the CRM so a later `website` Purchase
        // (sent when the parcel is picked up) ties back to the ad click; also sharpens our own Lead.
        _fbp: _fbp || null,
        _fbc: _fbc || null,
        _ttp: _ttp || null,   // TikTok cookie для серверного match
        // Окреме джерело для CRM (лід-лендінг /lead шле «Лендінг-ліди»); основна форма — без нього.
        source_override: (typeof order_source === 'string' && order_source.trim()) ? order_source.trim() : null,
    };
}

// Кошик із фронта: JSON-масив позицій. Назва дерева = ключ CRM_VARIANT_SKU
// (напр. "Роял Засніжена"), тож SKU резолвиться на сервері. Доповнення
// (гірлянди/іграшки) йдуть без SKU — CRM створить позицію за назвою+ціною.
function parseCartItems(raw) {
    if (!raw) return [];
    let arr;
    try { arr = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return []; }
    if (!Array.isArray(arr)) return [];
    return arr
        .map(it => ({
            name: String(it.name || '').slice(0, 200),
            variant: it.variant ? String(it.variant).slice(0, 100) : '',
            price: Number(it.price) || 0,
            qty: Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1)),
        }))
        .filter(it => it.name && it.price > 0)
        .slice(0, 50);
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

// Телефон → E.164 для TikTok (він вимагає нормалізацію перед хешем, на відміну від FB)
function normalizePhoneE164(p) {
    let d = String(p || '').replace(/\D/g, '');
    if (d.length === 10 && d[0] === '0') d = '38' + d;      // 0XXXXXXXXX → 380XXXXXXXXX
    else if (d.length === 9) d = '380' + d;                 // XXXXXXXXX → 380XXXXXXXXX
    return d ? '+' + d : '';
}

// TikTok Events API — серверна передача CompletePayment (подія, на яку оптимізуємо).
// Дедуп із пікселем через однаковий event_id. Access-Token — секрет із .env.
async function sendTikTokEvents({phone, price, type, event_id, ip, agent, _ttp}, referer) {
    if (!process.env.TT_ACCESS_TOKEN || !process.env.TT_PIXEL_ID) return;

    const url = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
    const e164 = normalizePhoneE164(phone);

    const payload = {
        event_source: 'web',
        event_source_id: process.env.TT_PIXEL_ID,
        ...(process.env.TT_TEST_CODE ? {test_event_code: process.env.TT_TEST_CODE} : {}),
        data: [
            {
                event: 'CompletePayment',
                event_time: Math.floor(Date.now() / 1000),
                event_id,
                user: {
                    phone: e164 ? hashSHA256(e164) : undefined,
                    ttp: _ttp || undefined,
                    ip,
                    user_agent: agent,
                },
                properties: {
                    currency: 'UAH',
                    value: price,
                    contents: [{content_name: type || 'Ялинка', quantity: 1, price}],
                },
                page: {url: referer || 'https://land.yalynkahub.com.ua/'},
            },
        ],
    };

    try {
        const resp = await axios.post(url, payload, {
            headers: {'Access-Token': process.env.TT_ACCESS_TOKEN, 'Content-Type': 'application/json'},
        });
        if (resp.data?.code !== 0) throw new Error('TikTok Events API: ' + (resp.data?.message || 'unknown'));
        console.log('TikTok Events API send successfully!!!');
    } catch (err) {
        console.error('Помилка при відправці TikTok Events API:', err.message);
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
// Карта «вид + розмір → SKU варіанта в CRM» (каталог головного акаунта yalynka).
// Лендінг шле sku у позиції → CRM сам резолвить product_id/variant_id (прив'язка
// «по артикулах»): звідси фото товару, залишок і авторитетна ціна в картці.
// Згенеровано з каталогу CRM; ключі розмірів = формат parseSizeAndPrice ("1.5 м").
const CRM_VARIANT_SKU = {
    "Снігова Королева": { "1.0 м": "MVK-1024-1.0м", "1.3 м": "MVK-1024-1.3м", "1.5 м": "MVK-1024-1.5м", "1.8 м": "MVK-1024-1.8м", "2.0 м": "MVK-1024-2.0м", "2.2 м": "MVK-1024-2.2м", "2.5 м": "MVK-1024-2.5м", "3.0 м": "MVK-1024-3.0м" },
    "Казка": { "1.0 м": "MVK-1032-1.0м", "1.3 м": "MVK-1032-1.3м", "1.5 м": "MVK-1032-1.5м", "1.8 м": "MVK-1032-1.8м", "2.0 м": "MVK-1032-2.0м", "2.2 м": "MVK-1032-2.2м", "2.5 м": "MVK-1032-2.5м", "3.0 м": "MVK-1032-3.0м" },
    "Елітна з шишкою": { "1.3 м": "MVK-1039-1.3м", "1.5 м": "MVK-1039-1.5м", "1.8 м": "MVK-1039-1.8м", "2.0 м": "MVK-1039-2.0м", "2.2 м": "MVK-1039-2.2м", "2.5 м": "MVK-1039-2.5м", "3.0 м": "MVK-1039-3.0м" },
    "Кармен + сині ягідки": { "1.3 м": "MVK-1068-1.3м", "1.5 м": "MVK-1068-1.5м", "1.8 м": "MVK-1068-1.8м", "2.0 м": "MVK-1068-2.0м", "2.2 м": "MVK-1068-2.2м", "2.5 м": "MVK-1068-2.5м", "3.0 м": "MVK-1068-3.0м" },
    "Кармен + червоні ягідки": { "1.3 м": "MVK-1046-1.3м", "1.5 м": "MVK-1046-1.5м", "1.8 м": "MVK-1046-1.8м", "2.0 м": "MVK-1046-2.0м", "2.2 м": "MVK-1046-2.2м", "2.5 м": "MVK-1046-2.5м", "3.0 м": "MVK-1046-3.0м" },
    "Кармен + срібні ягідки": { "1.3 м": "MVK-1053-1.3м", "1.5 м": "MVK-1053-1.5м", "1.8 м": "MVK-1053-1.8м", "2.0 м": "MVK-1053-2.0м", "2.2 м": "MVK-1053-2.2м", "2.5 м": "MVK-1053-2.5м", "3.0 м": "MVK-1053-3.0м" },
    "Кармен + золоті ягідки": { "1.3 м": "MVK-1061-1.3м", "1.5 м": "MVK-1061-1.5м", "1.8 м": "MVK-1061-1.8м", "2.0 м": "MVK-1061-2.0м", "2.2 м": "MVK-1061-2.2м", "2.5 м": "MVK-1061-2.5м", "3.0 м": "MVK-1061-3.0м" },
    "Тріумф Зелена": { "1.5 м": "MVK-1113-1.5м", "1.8 м": "MVK-1113-1.8м", "2.1 м": "MVK-1113-2.1м", "2.3 м": "MVK-1113-2.3м", "2.5 м": "MVK-1113-2.5м" },
    "Тріумф Блакитна": { "1.5 м": "MVK-1107-1.5м", "1.8 м": "MVK-1107-1.8м", "2.1 м": "MVK-1107-2.1м", "2.3 м": "MVK-1107-2.3м", "2.5 м": "MVK-1107-2.5м" },
    "Тріумф Засніжена": { "1.5 м": "MVK-1087-1.5м", "1.8 м": "MVK-1087-1.8м", "2.1 м": "MVK-1087-2.1м", "2.3 м": "MVK-1087-2.3м", "2.5 м": "MVK-1087-2.5м" },
    "Роял Зелена": { "1.5 м": "MVK-1102-1.5м", "1.8 м": "MVK-1102-1.8м", "2.1 м": "MVK-1102-2.1м", "2.3 м": "MVK-1102-2.3м", "2.5 м": "MVK-1102-2.5м" },
    "Роял Блакитна": { "1.5 м": "MVK-1097-1.5м", "1.8 м": "MVK-1097-1.8м", "2.1 м": "MVK-1097-2.1м", "2.3 м": "MVK-1097-2.3м", "2.5 м": "MVK-1097-2.5м" },
    "Роял Засніжена": { "1.5 м": "MVK-1092-1.5м", "1.8 м": "MVK-1092-1.8м", "2.1 м": "MVK-1092-2.1м", "2.3 м": "MVK-1092-2.3м", "2.5 м": "MVK-1092-2.5м" },
    "Буковельська Зелена": { "1.5 м": "MVK-1134-1.5м", "1.8 м": "MVK-1134-1.8м", "2.1 м": "MVK-1134-2.1м", "2.3 м": "MVK-1134-2.3м", "2.5 м": "MVK-1134-2.5м" },
    "Буковельська Блакитна": { "1.5 м": "MVK-1139-1.5м", "1.8 м": "MVK-1139-1.8м", "2.1 м": "MVK-1139-2.1м", "2.3 м": "MVK-1139-2.3м", "2.5 м": "MVK-1139-2.5м" },
    "Буковельська Засніжена": { "1.5 м": "MVK-1144-1.5м", "1.8 м": "MVK-1144-1.8м", "2.1 м": "MVK-1144-2.1м", "2.3 м": "MVK-1144-2.3м", "2.5 м": "MVK-1144-2.5м" },
    "Віденська": { "1.5 м": "MVK-1128-1.5м", "1.8 м": "MVK-1128-1.8м", "2.1 м": "MVK-1128-2.1м", "2.3 м": "MVK-1128-2.3м", "2.5 м": "MVK-1128-2.5м" },
    "Смерека": { "1.5 м": "MVK-1218-1.5м", "1.8 м": "MVK-1218-1.8м", "2.1 м": "MVK-1218-2.1м", "2.3 м": "MVK-1218-2.3м", "2.5 м": "MVK-1218-2.5м" },
    "Горщик - Роял Зелена": { "0.7 м": "MVK-1256-0.7м", "0.9 м": "MVK-1256-0.9м", "1.1 м": "MVK-1256-1.1м" },
    "Горщик - Роял Блакитна": { "0.7 м": "MVK-1253-0.7м", "0.9 м": "MVK-1253-0.9м", "1.1 м": "MVK-1253-1.1м" },
    "Горщик - Роял Засніжена": { "0.7 м": "MVK-1244-0.7м", "0.9 м": "MVK-1244-0.9м", "1.1 м": "MVK-1244-1.1м" },
};

function crmVariantSku(type, size) {
    return (CRM_VARIANT_SKU[type] && CRM_VARIANT_SKU[type][size]) || null;
}

// ── Доповнення (гірлянди + набори іграшок) → точний SKU варіанта в CRM ──────────
// На лендінгу колір доклеюється у назву позиції через " — " (scripts.js addon-cart),
// розмір/довжина — вже в базовій назві картки. Тут мапимо (база + колір) → SKU
// КОНКРЕТНОГО варіанта (каталог головного акаунта yalynka, GET /public/products).
// Прив'язка по артикулу: CRM підтягне товар+варіант (фото/залишок), ціну бере з
// позиції (НЕ перебиває каталожною). Де точного кольору/розміру в CRM нема —
// фолбек на SKU товару (ADDON_PRODUCT_SKU): позиція все одно групується в аналітиці.
// Гірлянди Роса = серія RWM (прозорий кабель, Мікро-LED) — звірено за ціною
// (195/595/1090) і наявністю Синього лише в RWM. Хвіст = RPFW (Водоспад).
const ADDON_VARIANT_SKU = {
    "Гірлянда Роса 20 м": { "Білий": "RWM-20м-Білий", "Жовтий": "RWM-20м-Жовтий" },
    "Гірлянда Роса 50 м": { "Білий": "RWM-50м-Білий", "Жовтий": "RWM-50м-Жовтий", "Синій": "RWM-50м-Синій" },
    "Гірлянда Роса 100 м": { "Білий": "RWM-100м-Білий", "Жовтий": "RWM-100м-Жовтий" },
    "Гірлянда Хвойна Лапа 30 м": { "Білий": "RIS-30м-Білий", "Жовтий": "RIS-30м-Жовтий", "Мультиколір": "RIS-30м-Мультиколір" },
    "Гірлянда Хвойна Лапа 50 м": { "Білий": "RIS-50м-Білий", "Жовтий": "RIS-50м-Жовтий", "Мультиколір": "RIS-50м-Мультиколір" },
    "Гірлянда Хвойна Лапа 100 м": { "Мультиколір": "VTRW-26G-100м-Мультиколір" }, // Білий/Жовтий 100м у CRM нема → фолбек товар
    "Гірлянда Кінський хвіст 2 м": { "Білий": "RPFW-2м-Білий", "Жовтий": "RPFW-2м-Жовтий" },
    "Набір іграшок «Оксамит»": {
        "Червоний": "MVK-1342-Червоний", "Бордовий": "MVK-1342-Бордовий", "Смарагдовий": "MVK-1342-Смарагдовий",
        "Синій": "MVK-1342-Синій", "Джинсовий": "MVK-1342-Джинсовий", "Шоколадний": "MVK-1342-Шоколадний",
        "Бежево-коричневий": "MVK-1342-Коричнево-Бежевий", "Білий": "MVK-1342-Білий", "Бежевий нюд": "MVK-1342-Бежевий-Нюд",
        "Бежевий однотонний": "MVK-1342-Бежевий-Нюд-Однотонний", "Рожевий нюд": "MVK-1342-Рожевий-Нюд",
        "Рожевий однотонний": "MVK-1342-Рожевий", "Сірий": "MVK-1342-Сірий", "Сірий нюд": "MVK-1342-Сірий-Нюд",
        "Сірий нюд однотонний": "MVK-1342-Сірий-Нюд-Однотонний",
    },
    "Набір іграшок «Блиск»": {
        "Золотий": "MVK-1345-Золотий", "Срібний": "MVK-1345-Срібний", "Червоний": "MVK-1345-Червоний",
        "Червоно-білий": "MVK-1345-Червоно-Білий", "Бордовий": "MVK-1345-Бордовий", "Смарагдовий": "MVK-1345-Смарагдовий",
        "Синій": "MVK-1345-Синій", "Рожевий": "MVK-1345-Рожевий", "Золото-червоний": "MVK-1345-Золото-Червоний",
        "Золото-чорний": "MVK-1345-Золото-Чорний", "Бежевий": "MVK-1345-Бежевий",
        // Шампань / Білий у наборі «Блиск» CRM нема → фолбек на товар MVK-1345.
    },
    "Набір іграшок «Горошина»": {
        "Червоний": "MVK-1357-Червоний", "Бордовий": "MVK-1357-Бордовий", "Золотий": "MVK-1357-Золотий",
        "Синій": "MVK-1357-Синій", "Срібний": "MVK-1357-Срібний", "Шоколадний": "MVK-1357-Шоколадний",
        "Шампань": "MVK-1357-Шампань",
    },
};
// Фолбек: SKU ТОВАРУ (не варіанта), коли точного кольору/розміру в CRM нема.
const ADDON_PRODUCT_SKU = {
    "Гірлянда Роса 20 м": "RW", "Гірлянда Роса 50 м": "RW", "Гірлянда Роса 100 м": "RW",
    "Гірлянда Хвойна Лапа 30 м": "VTRW-26G", "Гірлянда Хвойна Лапа 50 м": "VTRW-26G", "Гірлянда Хвойна Лапа 100 м": "VTRW-26G",
    "Гірлянда Кінський хвіст 2 м": "RPFW",
    "Набір іграшок «Оксамит»": "MVK-1342", "Набір іграшок «Блиск»": "MVK-1345", "Набір іграшок «Горошина»": "MVK-1357",
};

// Лендінг кладе колір у назву як "<база> — <Колір>". Розділяємо назад.
function splitAddonName(fullName) {
    const s = String(fullName || '');
    const idx = s.lastIndexOf(' — ');
    return idx === -1 ? { base: s, color: '' } : { base: s.slice(0, idx), color: s.slice(idx + 3).trim() };
}

// Резолвер SKU для будь-якої позиції кошика: спершу ялинка (назва=модель, variant=розмір),
// далі доповнення (колір — у назві). Повертає {sku, base, color, isAddon} або null.
function resolveLineSku(name, variant) {
    const tree = crmVariantSku(name, variant);
    if (tree) return { sku: tree, base: name, color: variant || '', isAddon: false };
    const { base, color } = splitAddonName(name);
    const byColor = ADDON_VARIANT_SKU[base];
    if (byColor && color && byColor[color]) return { sku: byColor[color], base, color, isAddon: true };
    if (ADDON_PRODUCT_SKU[base]) return { sku: ADDON_PRODUCT_SKU[base], base, color, isAddon: true };
    return null;
}

async function sendCrmOrder({name, first_name, last_name, phone, type, size, price, items, event_id, utm, delivery, comment, _fbp, _fbc, payment, return_url, source_override}) {
    if (!process.env.CRM_API_URL || !process.env.CRM_API_KEY) return;

    const split = splitName(name);
    const firstName = (first_name || '').trim() || split.firstName;
    const lastName = (last_name || '').trim() || split.lastName;
    const source = source_override || process.env.CRM_ORDER_SOURCE || 'Лендінг ялинки';

    // Лише коментар клієнта. Вид/розмір товару видно в позиції замовлення
    // (SKU-прив'язка), тому в коментар їх більше не дублюємо.
    const crmComment = (comment || '').trim().slice(0, 2000);

    // Позиції замовлення: з кошика (кілька) або одне дерево (legacy). SKU
    // резолвиться за назвою+варіантом (ялинки) або назвою+кольором (доповнення).
    // Для доповнень колір виносимо з назви у variant → чиста назва + варіант у картці.
    const lineItems = (items && items.length)
        ? items.map(it => {
            const r = resolveLineSku(it.name, it.variant);
            const name = r && r.isAddon ? r.base : it.name;
            const variant = r && r.isAddon ? (r.color || it.variant || '') : (it.variant || '');
            return {
                name,
                ...(variant ? {variant} : {}),
                ...(r && r.sku ? {sku: r.sku} : {}),
                quantity: it.qty || 1,
                price: Number(it.price) || 0,
            };
        })
        : [{
            name: type || 'Ялинка',
            ...(size ? {variant: size} : {}),
            // SKU варіанта → CRM прив'яже товар+варіант (фото/залишок/ціна з каталогу).
            ...(crmVariantSku(type, size) ? {sku: crmVariantSku(type, size)} : {}),
            quantity: 1,
            price: Number(price) || 0, // публічний API приймає гривні
        }];

    const payload = {
        client: {
            phone,
            first_name: firstName || 'Клієнт',
            ...(lastName ? {last_name: lastName} : {}),
            // Адреса Нової Пошти (відділення) — CRM префіллить нею форму ТТН.
            ...(delivery ? {delivery_address: delivery} : {}),
        },
        items: lineItems,
        payment_type: 'cod',
        // Спосіб онлайн-оплати (окремо від payment_type): для online/installment CRM
        // створить WayForPay-лінк і поверне pay_url; cod → без лінка (як було).
        ...(payment && payment.method && payment.method !== 'cod'
            ? { payment: { ...payment, ...(return_url ? { return_url } : {}) } }
            : {}),
        source,
        // Ідемпотентність: повторний сабміт з тим самим event_id не задвоїть
        // замовлення (CRM дедуплікує за external_id у межах продавця).
        external_id: `landing:${event_id}`,
        // Meta browser match ids → CRM стамп на замовленні для website-Purchase по викупу.
        ...(_fbp ? {fbp: _fbp} : {}),
        ...(_fbc ? {fbc: _fbc} : {}),
        ...(crmComment ? {comment: crmComment} : {}),
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
        // pay_url є лише для online/installment (CRM створив WFP-лінк); інакше null.
        return { pay_url: data?.pay_url || null };
    } catch (err) {
        // Логуємо тіло помилки CRM (валідація/тариф/ключ), але не кидаємо далі.
        console.error('Помилка при створенні замовлення в CRM:', err.response?.data || err.message);
        return null;
    }
}

// Redirect to thank-you page
function redirectThankYou(res, {name, price, event_id}) {
    // ok=1 — підтверджене оформлення (COD / без онлайн-оплати).
    const queryParams = new URLSearchParams({name, value: String(price || 0), eid: event_id || '', ok: '1'}).toString();
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
