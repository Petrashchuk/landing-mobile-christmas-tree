$(document).ready((function () {
    function e(e) {
        return "<span>" + (e = ("00" + e).substr(-2))[0] + "</span><span>" + e[1] + "</span>"
    }

    $("a[href^='#']").click((function () {
        var e = $(this).attr("href");
        return $("html, body").animate({scrollTop: $(e).offset().top + "px"}), !1
    })), function t() {
        var o = new Date, n = new Date;
        n.setHours(23), n.setMinutes(59), n.setSeconds(59), 23 === o.getHours() && 59 === o.getMinutes() && 59 === o.getSeconds && n.setDate(n.getDate() + 1);
        var s = Math.floor((n.getTime() - o.getTime()) / 1e3), c = Math.floor(s / 3600);
        s -= 3600 * c;
        var i = Math.floor(s / 60);
        s -= 60 * i, $(".timer .hours").html(e(c)), $(".timer .minutes").html(e(i)), $(".timer .seconds").html(e(s)), setTimeout(t, 200)
    }(), $(".owl-carousel").owlCarousel({
        items: 1,           // показуємо по 1 зображенню
        loop: true,         // зациклювання
        margin: 10,         // відступи між картинками
        nav: true,          // кнопки вперед/назад
        dots: true,         // точки навігації
        autoplay: true,     // автопрогравання
        autoplayTimeout: 3000,
        autoplayHoverPause: true
    });
    var t = $(".voice_count b").text().replace(/\D/g, "");


// при кліку на варіант
    $(".question_item").one("click", function () {
        localStorage.setItem('isPolled', '1');

        $(".questions_list").addClass("active");
        t++;

        $(".questions_list").children().each(function () {
            var e = parseInt($(this).find(".percents").text().replace(/\D/g, ""), 10);
            $(this).find(".value").text(
                (Math.round(t * e / 100) + "")
                    .replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, "$1 ")
            );
            $(this).find(".line").animate({width: e + "%"}, 700);
        });
    });

// якщо вже голосував — одразу показуємо результат
    if (localStorage.getItem('isPolled')) {
        $(".question_item:eq(0)").click();
    }


    /* scroll */

    $("a[href^='#']").click(function () {
        var target = $(this).attr("href");
        var product = $(this).parent().find("h3").text();
        $("#order_form select[name='type'] option[value='" + product + "']").prop("selected", true);
        $("html, body").animate({scrollTop: $(target).offset().top + "px"});
        return false;
    });

    /* timer */

    function update() {
        var Now = new Date(), Finish = new Date();
        Finish.setHours(23);
        Finish.setMinutes(59);
        Finish.setSeconds(59);
        if (Now.getHours() === 23 && Now.getMinutes() === 59 && Now.getSeconds() === 59) {
            Finish.setDate(Finish.getDate() + 1);
        }
        var sec = Math.floor((Finish.getTime() - Now.getTime()) / 1000);
        var hrs = Math.floor(sec / 3600);
        sec -= hrs * 3600;
        var min = Math.floor(sec / 60);
        sec -= min * 60;
        $(".timer .hours").html(pad(hrs));
        $(".timer .minutes").html(pad(min));
        $(".timer .seconds").html(pad(sec));
        setTimeout(update, 200);
    }

    function pad(s) {
        s = ("00" + s).substr(-2);
        return "<span>" + s[0] + "</span><span>" + s[1] + "</span>";
    }

    update();


    $('.mask_phone').attr("placeholder", "+38(___) ___-__-__").mask("+38(ddd) ddd-dd-dd");

}));

function updateDate() {
    var currentDate = new Date();
    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1; // Місяці в JS нумеруються з 0 (січень) до 11 (грудень)
    var formattedDate = (day < 10 ? '0' : '') + day + '.' + (month < 10 ? '0' : '') + month;

    var dateContainers = document.getElementsByClassName('date-container');

    for (var i = 0; i < dateContainers.length; i++) {
        dateContainers[i].textContent = formattedDate;
    }
}

// Оновлення дати при завантаженні сторінки та потім кожен день
window.onload = function () {
    updateDate();
    setInterval(updateDate, 86400000); // 86400000 мілісекунд в одній добі
    var fy = document.getElementById("footerYear");
    if (fy) fy.textContent = new Date().getFullYear();
}


let lastScrollTop = 0;
document.addEventListener("scroll", (function (e) {
    const t = window.scrollY;
    t > 160 && (t > lastScrollTop ? document.querySelector("header").classList.remove("active") : document.querySelector("header").classList.add("active"), lastScrollTop = t)
}));
const menuItems = document.querySelectorAll("#menu a");
hamburger.addEventListener("click", (function (e) {
    e.preventDefault();
    e.currentTarget;
    menu.classList.contains("show-menu") ? menu.classList.remove("show-menu") : menu.classList.add("show-menu")
})), menuItems.forEach((function (e, t) {
    e.addEventListener("click", (function (e) {
        menu.classList.remove("show-menu")
    }))
}));

const treeSelect = document.getElementById("treeSelect");
const sizeSelect = document.getElementById("sizeSelect");

// словник: вид → розміри
// Ціни синхронізовано з каталогом CRM/сайту (джерело істини). Розміри — повний
// діапазон з CRM по кожному виду. SKU-прив'язка робиться на бекенді (server.js).
const treeSizes = {
    "Снігова Королева": ["1.0 м - 520грн", "1.3 м - 720грн", "1.5 м - 940грн", "1.8 м - 1360грн", "2.0 м - 1580грн", "2.2 м - 1790грн", "2.5 м - 2660грн", "3.0 м - 3840грн"],
    "Казка": ["1.0 м - 500грн", "1.3 м - 690грн", "1.5 м - 860грн", "1.8 м - 1200грн", "2.0 м - 1440грн", "2.2 м - 1560грн", "2.5 м - 2220грн", "3.0 м - 3420грн"],
    "Елітна з шишкою": ["1.3 м - 925грн", "1.5 м - 1160грн", "1.8 м - 1660грн", "2.0 м - 1880грн", "2.2 м - 2090грн", "2.5 м - 3040грн", "3.0 м - 4240грн"],
    "Кармен + сині ягідки": ["1.3 м - 990грн", "1.5 м - 1220грн", "1.8 м - 1760грн", "2.0 м - 1980грн", "2.2 м - 2140грн", "2.5 м - 3220грн", "3.0 м - 4490грн"],
    "Кармен + червоні ягідки": ["1.3 м - 990грн", "1.5 м - 1220грн", "1.8 м - 1760грн", "2.0 м - 1980грн", "2.2 м - 2140грн", "2.5 м - 3220грн", "3.0 м - 4490грн"],
    "Кармен + срібні ягідки": ["1.3 м - 990грн", "1.5 м - 1220грн", "1.8 м - 1760грн", "2.0 м - 1980грн", "2.2 м - 2140грн", "2.5 м - 3220грн", "3.0 м - 4490грн"],
    "Кармен + золоті ягідки": ["1.3 м - 990грн", "1.5 м - 1220грн", "1.8 м - 1760грн", "2.0 м - 1980грн", "2.2 м - 2140грн", "2.5 м - 3220грн", "3.0 м - 4490грн"],
    "Тріумф Зелена": ["1.5 м - 2440грн", "1.8 м - 3560грн", "2.1 м - 4690грн", "2.3 м - 5680грн", "2.5 м - 7980грн"],
    "Тріумф Блакитна": ["1.5 м - 2440грн", "1.8 м - 3560грн", "2.1 м - 4690грн", "2.3 м - 5680грн", "2.5 м - 7980грн"],
    "Тріумф Засніжена": ["1.5 м - 3480грн", "1.8 м - 4460грн", "2.1 м - 5980грн", "2.3 м - 7240грн", "2.5 м - 10400грн"],
    "Роял Зелена": ["1.5 м - 2440грн", "1.8 м - 3560грн", "2.1 м - 4690грн", "2.3 м - 5680грн", "2.5 м - 7980грн"],
    "Роял Блакитна": ["1.5 м - 2440грн", "1.8 м - 3560грн", "2.1 м - 4690грн", "2.3 м - 5680грн", "2.5 м - 7980грн"],
    "Роял Засніжена": ["1.5 м - 3480грн", "1.8 м - 4460грн", "2.1 м - 5980грн", "2.3 м - 7240грн", "2.5 м - 10400грн"],
    "Буковельська Зелена": ["1.5 м - 2290грн", "1.8 м - 2990грн", "2.1 м - 3990грн", "2.3 м - 5160грн", "2.5 м - 7280грн"],
    "Буковельська Блакитна": ["1.5 м - 2290грн", "1.8 м - 2990грн", "2.1 м - 3990грн", "2.3 м - 5160грн", "2.5 м - 7280грн"],
    "Буковельська Засніжена": ["1.5 м - 3120грн", "1.8 м - 4075грн", "2.1 м - 5280грн", "2.3 м - 6860грн", "2.5 м - 9295грн"],
    "Віденська": ["1.5 м - 2290грн", "1.8 м - 2990грн", "2.1 м - 3990грн", "2.3 м - 5160грн", "2.5 м - 7280грн"],
    "Смерека": ["1.5 м - 2290грн", "1.8 м - 2990грн", "2.1 м - 3990грн", "2.3 м - 5160грн", "2.5 м - 7280грн"],
    'Горщик - Роял Зелена': ['0.7 м - 1005грн', '0.9 м - 1195грн', '1.1 м - 1475грн'],
    'Горщик - Роял Блакитна': ['0.7 м - 1005грн', '0.9 м - 1195грн', '1.1 м - 1475грн'],
    'Горщик - Роял Засніжена': ['0.7 м - 1260грн', '0.9 м - 1470грн', '1.1 м - 1750грн']
};

// loadSizes('Снігова Королева');


// функція для підгрузки розмірів
function loadSizes(treeName) {
    sizeSelect.innerHTML = ""; // очищаємо
    if (treeSizes[treeName]) {
        sizeSelect.disabled = false;

         const sizes = treeSizes[treeName];
        // const middleIndex = Math.floor(sizes.length / 2); // знаходимо середній індекс

        sizes.forEach((size, index) => {
            // const selected = index === middleIndex ? "selected" : "";
            sizeSelect.insertAdjacentHTML("beforeend", `<option value="${size}">${size}</option>`);
        });

    } else {
        sizeSelect.disabled = true;
        sizeSelect.insertAdjacentHTML("beforeend", `<option selected disabled>Немає доступних розмірів</option>`);
    }
}


// коли змінюється select з видом
// Показуємо ціну обраного розміру одразу (парситься з value "1.5 м - 2290грн"),
// щоб клієнт бачив суму ще до відправки форми.
const priceDisplay = document.getElementById("priceDisplay");
function updatePrice() {
    if (!priceDisplay) return;
    const m = (sizeSelect.value || "").match(/(\d[\d\s]*)\s*грн/i);
    if (m) {
        priceDisplay.textContent = "До сплати: " + m[1].replace(/\s/g, "") + " грн";
        priceDisplay.style.display = "block";
    } else {
        priceDisplay.textContent = "";
        priceDisplay.style.display = "none";
    }
}
sizeSelect.addEventListener("change", updatePrice);

treeSelect.addEventListener("change", function () {
    loadSizes(this.value);
    updatePrice();
});

// автопідстановка при кліку на кнопку
document.querySelectorAll(".order-form-wrapper-btn .button").forEach(btn => {
    btn.addEventListener("click", function () {
        const treeName = this.getAttribute("data-tree");
        if (!treeName) return;

        // правильно підставляємо value та викликаємо change
        treeSelect.value = treeName;
        treeSelect.dispatchEvent(new Event("change"));
    });
})


document.getElementById("order_form").addEventListener("submit", async function (e) {
    e.preventDefault();
    let isValid = true;

    // функція для показу помилки
    function showError(input, message) {
        isValid = false;
        input.classList.add("error"); // додаємо червоний бордер

        // якщо повідомлення вже є — видаляємо
        let next = input.nextElementSibling;
        if (next && next.classList.contains("error-message")) {
            next.remove();
        }

        // додаємо повідомлення
        let error = document.createElement("div");
        error.className = "error-message";
        error.innerText = message;
        input.insertAdjacentElement("afterend", error);
    }

    // функція для очищення помилок
    function clearError(input) {
        input.classList.remove("error");
        let next = input.nextElementSibling;
        if (next && next.classList.contains("error-message")) {
            next.remove();
        }
    }

    // Тип ялинки
    const treeSelect = document.getElementById("treeSelect");
    clearError(treeSelect);

    if (!treeSelect.value) {
        showError(treeSelect, "Будь ласка, виберіть вид ялинки.");
    }

    // Розмір
    const sizeSelect = document.getElementById("sizeSelect");
    clearError(sizeSelect);
    if (sizeSelect.disabled || !sizeSelect.value) {
        showError(sizeSelect, "Будь ласка, виберіть розмір ялинки.");
    }

    // Ім’я
    const name = this.name;
    clearError(name);
    if (name.value.trim().length < 2) {
        showError(name, "Введіть коректне ім’я (мінімум 2 символи).");
    }

    // Телефон
    const phone = this.phone;
    clearError(phone);
    if (phone.value.includes("_") || phone.value.length < 17) {
        showError(phone, "Будь ласка, введіть повний номер телефону.");
    }

    // Нова Пошта: область → місто → відділення
    const npArea = document.getElementById("npArea");
    clearError(npArea);
    if (!npArea.value) {
        showError(npArea, "Будь ласка, виберіть область.");
    }

    const npCity = document.getElementById("npCity");
    clearError(npCity);
    if (!document.getElementById("npCityRef").value) {
        showError(npCity, "Виберіть місто зі списку.");
    }

    const npWarehouse = document.getElementById("npWarehouse");
    clearError(npWarehouse);
    if (!document.getElementById("npWarehouseRef").value) {
        showError(npWarehouse, "Виберіть відділення зі списку.");
    }

    // Якщо все добре — відправляємо
    if (isValid) {

        try {
            const event_id = generateEventId();
            document.getElementById('event_id').value = event_id;

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            if (typeof fbq === 'function') {
                fbq('track', 'Lead', {
                    content_name: data.type,
                    content_category: data.size,
                }, {
                    eventID: event_id
                });
            }
            const response = await fetch('/order', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...data,
                    _fbp: getFbClientId(),
                    _fbc: getFbClickId(),
                    ...getUtmParams() // utm_source/medium/campaign/content/term з URL → CRM-атрибуція
                })
            });

            // якщо сервер повертає JSON з redirect
            const json = await response.json();
            if (json?.redirect) {
                window.location.href = json.redirect; // вручну робимо редірект
            } else {
                // fallback: якщо сервер віддав 200/HTML, можна парсити або перейти вручну
                console.warn('No redirect url in response', json);
            }

        } catch (error) {
            console.error('Помилка при відправці:', error);
        }

    }

    const nameInput = document.querySelector('input[name="name"]');
    const phoneInput = document.querySelector('input[name="phone"]');

    [treeSelect, sizeSelect, nameInput, phoneInput].forEach(input => {
        input.addEventListener("input", () => clearError(input)); // для тексту
        input.addEventListener("change", () => clearError(input)); // для select і будь-яких змін
    });
});


function generateEventId() {
    // Простий варіант UUID
    return 'xxxxxx-xxxx-4xxx-yxxx-xxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


function getCookieValue(cookieName) {
    const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
    return match ? match[2] : null;
}

function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
        const v = params.get(k);
        if (v) out[k] = v;
    });
    return out;
}

function getFbClientId() {
    return getCookieValue('_fbp');
}

/* ---------------- Nova Poshta picker (область → місто → відділення) ---------------- */
(function () {
    const area = document.getElementById("npArea");
    const city = document.getElementById("npCity");
    const cityList = document.getElementById("npCityList");
    const warehouse = document.getElementById("npWarehouse");
    const whList = document.getElementById("npWarehouseList");
    if (!area || !city || !warehouse) return;

    const cityRefEl = document.getElementById("npCityRef");
    const cityNameEl = document.getElementById("npCityName");
    const whRefEl = document.getElementById("npWarehouseRef");
    const whNumEl = document.getElementById("npWarehouseNumber");
    const whDescEl = document.getElementById("npWarehouseDesc");

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    async function fetchJson(url) {
        try {
            const r = await fetch(url);
            return await r.json();
        } catch (e) {
            console.error("NP fetch error:", e);
            return {items: []};
        }
    }

    function renderList(listEl, items, onPick, emptyText) {
        listEl.innerHTML = "";
        if (!items.length) {
            const li = document.createElement("li");
            li.className = "np-empty";
            li.textContent = emptyText;
            listEl.appendChild(li);
            listEl.classList.add("open");
            return;
        }
        items.forEach((it) => {
            const li = document.createElement("li");
            li.textContent = it.label;
            li.addEventListener("mousedown", (ev) => {
                ev.preventDefault(); // не губимо фокус до кліку
                onPick(it);
                listEl.classList.remove("open");
            });
            listEl.appendChild(li);
        });
        listEl.classList.add("open");
    }

    function resetCity() {
        city.value = "";
        cityRefEl.value = "";
        cityNameEl.value = "";
        cityList.classList.remove("open");
    }

    function resetWarehouse() {
        warehouse.value = "";
        whRefEl.value = "";
        whNumEl.value = "";
        whDescEl.value = "";
        warehouse.disabled = true;
        whList.classList.remove("open");
    }

    // 1) Області — одразу при завантаженні
    fetchJson("/np/areas").then((data) => {
        (data.items || []).forEach((a) => {
            const opt = document.createElement("option");
            opt.value = a.ref;
            opt.textContent = a.name;
            area.appendChild(opt);
        });
    });

    // 2) Вибір області → розблокувати місто
    area.addEventListener("change", function () {
        resetWarehouse();
        resetCity();
        city.disabled = !this.value;
    });

    // 3) Пошук міста
    const onCityInput = debounce(async function () {
        resetWarehouse();
        cityRefEl.value = "";
        cityNameEl.value = "";
        const q = city.value.trim();
        if (q.length < 2) {
            cityList.classList.remove("open");
            return;
        }
        const data = await fetchJson(
            `/np/cities?areaRef=${encodeURIComponent(area.value)}&q=${encodeURIComponent(q)}`
        );
        const items = (data.items || []).map((c) => ({
            ref: c.ref,
            label: c.area ? `${c.name}, ${c.area} обл.` : c.name,
            name: c.name,
            area: c.area,
        }));
        renderList(cityList, items, (it) => {
            city.value = it.label;
            cityRefEl.value = it.ref;
            cityNameEl.value = it.label;
            warehouse.disabled = false;
            warehouse.value = "";
            warehouse.focus();
        }, "Місто не знайдено");
    }, 300);
    city.addEventListener("input", onCityInput);

    // 4) Пошук/перелік відділень
    const onWarehouseInput = debounce(async function () {
        whRefEl.value = "";
        whNumEl.value = "";
        whDescEl.value = "";
        if (!cityRefEl.value) return;
        const q = warehouse.value.trim();
        const data = await fetchJson(
            `/np/warehouses?cityRef=${encodeURIComponent(cityRefEl.value)}&q=${encodeURIComponent(q)}`
        );
        const items = (data.items || []).map((w) => ({
            ref: w.ref,
            number: w.number,
            name: w.name,
            label: w.name,
        }));
        renderList(whList, items, (it) => {
            warehouse.value = it.label;
            whRefEl.value = it.ref;
            whNumEl.value = it.number;
            whDescEl.value = it.name;
        }, "Відділення не знайдено");
    }, 300);
    warehouse.addEventListener("input", onWarehouseInput);
    // Фокус на порожньому полі → показати найближчі відділення
    warehouse.addEventListener("focus", function () {
        if (cityRefEl.value && !warehouse.value.trim()) onWarehouseInput();
    });

    // Сховати списки при кліку поза полями
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".np-autocomplete")) {
            cityList.classList.remove("open");
            whList.classList.remove("open");
        }
    });
})();

function getFbClickId() {
    return getCookieValue('_fbc');
}

