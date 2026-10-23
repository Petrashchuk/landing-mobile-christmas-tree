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
        loop: true,         // зациклювання
        margin: 12,         // відступи між картинками
        nav: true,          // кнопки вперед/назад
        dots: true,         // точки навігації
        autoplay: true,     // автопрогравання
        autoplayTimeout: 3500,
        autoplayHoverPause: true,
        // адаптив: кілька відгуків у ряд (портретні фото → не на весь екран)
        responsive: {
            0:    { items: 1.4 },
            480:  { items: 2 },
            720:  { items: 3 },
            1000: { items: 4 }
        }
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
// Бургер-меню — лише якщо елементи присутні (новий лендінг їх не має → без помилки)
var hamburgerEl = document.getElementById("hamburger");
var menuEl = document.getElementById("menu");
if (hamburgerEl && menuEl) {
    var menuItems = menuEl.querySelectorAll("a");
    hamburgerEl.addEventListener("click", function (e) {
        e.preventDefault();
        menuEl.classList.toggle("show-menu");
    });
    menuItems.forEach(function (a) {
        a.addEventListener("click", function () { menuEl.classList.remove("show-menu"); });
    });
}

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

// Сірий placeholder для select'ів форми, поки не обрано реальне значення
// (щоб «Виберіть…»/«Регіон/Область» виглядали як підказка, а не як заповнене поле).
(function () {
    function isPlaceholder(sel) {
        var o = sel.options[sel.selectedIndex];
        return !o || o.value === "" || o.disabled || /^Виберіть/.test((o.textContent || "").trim());
    }
    function mark(sel) { if (sel) sel.classList.toggle("is-placeholder", isPlaceholder(sel)); }
    var ids = ["treeSelect", "sizeSelect", "npArea"];
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        mark(el);
        el.addEventListener("change", function () { mark(el); });
    });
    // sizeSelect перемальовується при зміні дерева — перемаркувати після цього
    if (treeSelect) treeSelect.addEventListener("change", function () {
        setTimeout(function () { mark(document.getElementById("sizeSelect")); }, 0);
    });
})();

// Допродаж: попап «Доповнення до ялинки» на головній
(function () {
    var pop = document.querySelector(".addon-popup");
    var ov = document.querySelector(".addon-overlay");
    if (!pop || !ov) return;
    function openPop() { pop.style.display = "block"; ov.style.display = "block"; }
    function closePop() { pop.style.display = "none"; ov.style.display = "none"; }
    document.querySelectorAll(".addon-order").forEach(function (b) { b.addEventListener("click", openPop); });
    document.querySelectorAll(".addon-close").forEach(function (c) { c.addEventListener("click", closePop); });
    ov.addEventListener("click", closePop);
})();

// Відлік днів до Нового року
(function () {
    var el = document.getElementById("nyDays");
    if (!el) return;
    var now = new Date();
    var nextNY = new Date(now.getFullYear() + 1, 0, 1);
    el.textContent = Math.max(0, Math.ceil((nextNY - now) / 86400000));
})();

// FAQ-акордеон
(function () {
    document.querySelectorAll(".faq__q").forEach(function (q) {
        q.addEventListener("click", function () { q.parentElement.classList.toggle("open"); });
    });
})();

// Липка кнопка «Замовити» — показати після прокрутки, сховати коли форма у видимості
(function () {
    var cta = document.querySelector(".sticky-cta");
    if (!cta) return;
    var form = document.getElementById("order_form");
    function upd() {
        var y = window.scrollY || window.pageYOffset || 0;
        var show = y > 500;
        if (show && form) {
            var r = form.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) show = false;
        }
        cta.classList.toggle("show", show);
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
})();

// ============ Міні-магазин: каталог + quick-view + кошик ============
(function () {
    if (typeof treeSizes === "undefined") return;
    var catBox = document.getElementById("catalogCards");
    var DISCOUNT = 30; // % «старої ціни» (анкер магазину); 0 = показувати лише поточну ціну
    var CARDS = [
        { title: "Казка", img: "trees/kazka/1.webp", cats: ["Зелена"], colors: [{ label: "Зелена", v: "Казка", sw: "#2e7d32" }] },
        { title: "Снігова Королева", img: "trees/snow-queen/1.webp", cats: ["Білі кінчики"], colors: [{ label: "Білі кінчики", v: "Снігова Королева", sw: "#eaf2ff" }] },
        { title: "Елітна з шишкою", img: "trees/elite/1.webp", cats: ["З декором"], colors: [{ label: "Зелена", v: "Елітна з шишкою", sw: "#2e7d32" }] },
        { title: "Кармен + ягідки", img: "trees/karmen/1.webp", cats: ["З декором"], colors: [
            { label: "Червоні", v: "Кармен + червоні ягідки", sw: "#c0392b" },
            { label: "Сині", v: "Кармен + сині ягідки", sw: "#2e5fb0" },
            { label: "Срібні", v: "Кармен + срібні ягідки", sw: "#c9ccd1" },
            { label: "Золоті", v: "Кармен + золоті ягідки", sw: "#d4af37" } ] },
        { title: "Тріумф (лита)", img: "trees/triumph-green/1.webp", cats: ["Лита","Зелена","Засніжена"], colors: [
            { label: "Зелена", v: "Тріумф Зелена", sw: "#2e7d32" },
            { label: "Блакитна", v: "Тріумф Блакитна", sw: "#7fb0d8" },
            { label: "Засніжена", v: "Тріумф Засніжена", sw: "#eaf2ff" } ] },
        { title: "Роял (лита)", img: "trees/royal-green/1.webp", cats: ["Лита","Зелена","Засніжена"], colors: [
            { label: "Зелена", v: "Роял Зелена", sw: "#2e7d32" },
            { label: "Блакитна", v: "Роял Блакитна", sw: "#7fb0d8" },
            { label: "Засніжена", v: "Роял Засніжена", sw: "#eaf2ff" } ] },
        { title: "Віденська", img: "trees/videnska/1.webp", cats: ["Лита","Зелена"], colors: [{ label: "Зелена", v: "Віденська", sw: "#2e7d32" }] },
        { title: "Смерека", img: "trees/smereka/1.webp", cats: ["Лита","Зелена"], colors: [{ label: "Зелена", v: "Смерека", sw: "#2e7d32" }] }
    ];
    var CATS = ["Усі", "Зелена", "Білі кінчики", "Засніжена", "Лита", "З декором"];
    function priceNum(v) { var m = (v || "").match(/(\d[\d\s]*)\s*грн/i); return m ? parseInt(m[1].replace(/\s/g, ""), 10) : 0; }
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
    function oldPrice(p) { return DISCOUNT > 0 ? Math.round(p / (1 - DISCOUNT / 100) / 10) * 10 : 0; }
    function fillHeights(sel, model) {
        sel.innerHTML = "";
        (treeSizes[model] || []).forEach(function (s) {
            var o = document.createElement("option");
            o.value = s; o.textContent = (s.split(" - ")[0] || s).trim();
            sel.appendChild(o);
        });
    }

    // ---------- Кошик (localStorage) ----------
    var CART_KEY = "yalynka_cart_v1";
    var cart = [];
    try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]") || []; } catch (_) { cart = []; }
    function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {} }
    function cartCount() { return cart.reduce(function (s, i) { return s + (i.qty || 1); }, 0); }
    function cartTotal() { return cart.reduce(function (s, i) { return s + (Number(i.price) || 0) * (i.qty || 1); }, 0); }
    function cartAdd(item) {
        var key = item.name + "|" + (item.variant || "");
        var ex = cart.filter(function (i) { return (i.name + "|" + (i.variant || "")) === key; })[0];
        if (ex) ex.qty = (ex.qty || 1) + 1;
        else cart.push({ name: item.name, variant: item.variant || "", price: Number(item.price) || 0, img: item.img || "", qty: 1 });
        saveCart(); renderCart(); updateBadge(); flashCart();
    }
    function cartSetQty(idx, d) { if (!cart[idx]) return; cart[idx].qty = (cart[idx].qty || 1) + d; if (cart[idx].qty < 1) cart.splice(idx, 1); saveCart(); renderCart(); updateBadge(); }
    function cartRemove(idx) { cart.splice(idx, 1); saveCart(); renderCart(); updateBadge(); }
    function cartClear() { cart = []; saveCart(); renderCart(); updateBadge(); }

    var badgeEl = document.getElementById("cartCount");
    function updateBadge() { var n = cartCount(); if (badgeEl) { badgeEl.textContent = n; badgeEl.classList.toggle("empty", n === 0); } }

    var drawer = document.getElementById("cartDr"), cartOv = document.getElementById("cartOv");
    var cartItemsEl = document.getElementById("cartItems"), cartEmptyEl = document.getElementById("cartEmpty"),
        cartFtEl = document.getElementById("cartFt"), cartTotalEl = document.getElementById("cartTotal");
    function renderCart() {
        if (!cartItemsEl) return;
        cartItemsEl.innerHTML = "";
        if (!cart.length) { if (cartEmptyEl) cartEmptyEl.style.display = "flex"; if (cartFtEl) cartFtEl.style.display = "none"; return; }
        if (cartEmptyEl) cartEmptyEl.style.display = "none";
        if (cartFtEl) cartFtEl.style.display = "block";
        cart.forEach(function (it, idx) {
            var row = document.createElement("div"); row.className = "cart-row";
            row.innerHTML =
                '<img src="' + (it.img || "") + '" alt="">' +
                '<div class="ci"><div class="ci-nm">' + it.name + '</div>' +
                (it.variant ? '<div class="ci-v">' + it.variant + '</div>' : '') +
                '<div class="ci-pr">' + fmt(it.price) + ' ₴</div>' +
                '<div class="ci-qty"><button type="button" data-a="dec">−</button><span>' + (it.qty || 1) + '</span><button type="button" data-a="inc">+</button></div>' +
                '<button type="button" class="ci-rm">Видалити</button></div>';
            row.querySelector('[data-a="dec"]').addEventListener("click", function () { cartSetQty(idx, -1); });
            row.querySelector('[data-a="inc"]').addEventListener("click", function () { cartSetQty(idx, 1); });
            row.querySelector('.ci-rm').addEventListener("click", function () { cartRemove(idx); });
            cartItemsEl.appendChild(row);
        });
        if (cartTotalEl) cartTotalEl.textContent = fmt(cartTotal()) + " ₴";
    }
    function openCart() { if (drawer) { drawer.classList.add("show"); drawer.setAttribute("aria-hidden", "false"); } if (cartOv) cartOv.classList.add("show"); }
    function closeCart() { if (drawer) { drawer.classList.remove("show"); drawer.setAttribute("aria-hidden", "true"); } if (cartOv) cartOv.classList.remove("show"); }
    function flashCart() { var b = document.getElementById("cartBtn"); if (b && b.animate) { b.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 300 }); } }
    var cartBtn = document.getElementById("cartBtn"); if (cartBtn) cartBtn.addEventListener("click", openCart);
    var cartX = document.getElementById("cartX"); if (cartX) cartX.addEventListener("click", closeCart);
    if (cartOv) cartOv.addEventListener("click", closeCart);

    // ---------- Quick-view ----------
    var qv = document.getElementById("qv"), qvOv = document.getElementById("qvOv"),
        qvImg = document.getElementById("qvImg"), qvBadge = document.getElementById("qvBadge"),
        qvTitle = document.getElementById("qvTitle"), qvColors = document.getElementById("qvColors"),
        qvHeight = document.getElementById("qvHeight"), qvPrice = document.getElementById("qvPrice"),
        qvEcon = document.getElementById("qvEcon"), qvAdd = document.getElementById("qvAdd");
    var qvModel = null;
    function qvRefresh() {
        var p = priceNum(qvHeight.value);
        if (!p) { qvPrice.textContent = ""; qvEcon.textContent = ""; return; }
        if (DISCOUNT > 0) { var o = oldPrice(p); qvPrice.innerHTML = fmt(p) + ' ₴ <span class="old">' + fmt(o) + ' ₴</span>'; qvEcon.textContent = "Економія " + fmt(o - p) + " ₴"; }
        else { qvPrice.textContent = fmt(p) + " ₴"; qvEcon.textContent = ""; }
    }
    function openQuickView(c) {
        if (!qv) return;
        qvImg.src = c.img; qvImg.alt = c.title;
        if (qvBadge) { qvBadge.textContent = DISCOUNT > 0 ? ("−" + DISCOUNT + "%") : ""; qvBadge.style.display = DISCOUNT > 0 ? "block" : "none"; }
        qvTitle.textContent = c.title;
        qvModel = c.colors[0].v;
        qvColors.innerHTML = "";
        if (c.colors.length > 1) {
            c.colors.forEach(function (col, i) {
                var b = document.createElement("button"); b.type = "button"; b.className = "sw" + (i === 0 ? " on" : ""); b.style.background = col.sw; b.title = col.label;
                b.addEventListener("click", function () { qvColors.querySelectorAll(".sw").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); qvModel = col.v; fillHeights(qvHeight, col.v); qvRefresh(); });
                qvColors.appendChild(b);
            });
        }
        fillHeights(qvHeight, qvModel); qvRefresh();
        qv.classList.add("show"); qv.setAttribute("aria-hidden", "false"); if (qvOv) qvOv.classList.add("show");
    }
    function closeQuickView() { if (qv) { qv.classList.remove("show"); qv.setAttribute("aria-hidden", "true"); } if (qvOv) qvOv.classList.remove("show"); }
    if (qvHeight) qvHeight.addEventListener("change", qvRefresh);
    var qvX = document.getElementById("qvX"); if (qvX) qvX.addEventListener("click", closeQuickView);
    if (qvOv) qvOv.addEventListener("click", closeQuickView);
    if (qvAdd) qvAdd.addEventListener("click", function () {
        var p = priceNum(qvHeight.value); if (!p) return;
        var variant = (qvHeight.value.split(" - ")[0] || "").trim();
        cartAdd({ name: qvModel, variant: variant, price: p, img: qvImg.src });
        closeQuickView(); openCart();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeQuickView(); closeCart(); } });

    // ---------- Рендер каталогу ----------
    var pillsBox = document.getElementById("catPills"); var pills = [];
    if (pillsBox && catBox) {
        CATS.forEach(function (cat, i) {
            var b = document.createElement("button");
            b.type = "button"; b.className = "catpill" + (i === 0 ? " on" : ""); b.textContent = cat; b.setAttribute("data-cat", cat);
            b.addEventListener("click", function () {
                pills.forEach(function (p) { p.classList.remove("on"); });
                b.classList.add("on");
                catBox.querySelectorAll(".card").forEach(function (cd) {
                    var show = cat === "Усі" || (cd.getAttribute("data-cat") || "").split("|").indexOf(cat) >= 0;
                    cd.classList.toggle("hide", !show);
                });
            });
            pillsBox.appendChild(b); pills.push(b);
        });
    }
    if (catBox) CARDS.forEach(function (c) {
        var model = c.colors[0].v;
        var multi = c.colors.length > 1;
        var swHtml = multi
            ? '<div class="collabel">Колір: <b class="cl-name">' + c.colors[0].label + '</b></div><div class="swatches">' +
              c.colors.map(function (col, i) { return '<button type="button" class="sw' + (i === 0 ? " on" : "") + '" style="background:' + col.sw + '" data-v="' + col.v + '" data-label="' + col.label + '" title="' + col.label + '"></button>'; }).join("") + '</div>'
            : "";
        var badge = DISCOUNT > 0 ? '<span class="badge">−' + DISCOUNT + '%</span>' : "";
        var card = document.createElement("div");
        card.className = "card";
        card.setAttribute("data-cat", c.cats.join("|"));
        card.innerHTML =
            '<div class="ph"><img loading="lazy" src="' + c.img + '" alt="' + c.title + '">' + badge + '</div>' +
            '<div class="b"><div class="nm">' + c.title + '</div>' + swHtml +
            '<div class="sellabel">Оберіть висоту</div><select class="h-sel"></select>' +
            '<div class="c-price"></div><div class="c-econ"></div>' +
            '<a class="cbuy" href="#">Додати в кошик →</a></div>';
        catBox.appendChild(card);
        var hsel = card.querySelector(".h-sel");
        var priceEl = card.querySelector(".c-price");
        var econEl = card.querySelector(".c-econ");
        var clName = card.querySelector(".cl-name");
        function refresh() {
            var p = priceNum(hsel.value);
            if (!p) { priceEl.textContent = ""; econEl.textContent = ""; return; }
            if (DISCOUNT > 0) { var o = oldPrice(p); priceEl.innerHTML = fmt(p) + ' ₴ <span class="old">' + fmt(o) + ' ₴</span>'; econEl.textContent = "Економія " + fmt(o - p) + " ₴"; }
            else { priceEl.textContent = fmt(p) + " ₴"; econEl.textContent = ""; }
        }
        fillHeights(hsel, model); refresh();
        hsel.addEventListener("change", refresh);
        card.querySelectorAll(".swatches .sw").forEach(function (b) {
            b.addEventListener("click", function () {
                card.querySelectorAll(".swatches .sw").forEach(function (x) { x.classList.remove("on"); });
                b.classList.add("on");
                model = b.getAttribute("data-v");
                if (clName) clName.textContent = b.getAttribute("data-label");
                fillHeights(hsel, model); refresh();
            });
        });
        var ph = card.querySelector(".ph"); ph.style.cursor = "pointer";
        ph.addEventListener("click", function () { openQuickView(c); });
        card.querySelector(".nm").style.cursor = "pointer";
        card.querySelector(".nm").addEventListener("click", function () { openQuickView(c); });
        card.querySelector(".cbuy").addEventListener("click", function (e) {
            e.preventDefault();
            var p = priceNum(hsel.value); if (!p) return;
            var variant = (hsel.value.split(" - ")[0] || "").trim();
            cartAdd({ name: model, variant: variant, price: p, img: c.img });
            openCart();
        });
    });

    // ---------- Доповнення (гірлянди/іграшки) → кошик ----------
    document.querySelectorAll(".addon-cart").forEach(function (b) {
        b.addEventListener("click", function () {
            cartAdd({ name: b.getAttribute("data-name"), variant: "", price: Number(b.getAttribute("data-price")) || 0, img: b.getAttribute("data-img") || "" });
            openCart();
        });
    });

    // ---------- Оформлення: кошик → форма ----------
    var checkoutBtn = document.getElementById("cartCheckout");
    var orderForm = document.getElementById("order_form");
    var ocs = document.getElementById("orderCartSummary");
    function renderOrderSummary() {
        if (!ocs) return;
        if (!cart.length) { ocs.style.display = "none"; if (orderForm) orderForm.classList.remove("cart-mode"); return; }
        var html = '<div class="ocs-hd">🛒 Ваше замовлення</div>';
        cart.forEach(function (it) { html += '<div class="ocs-li"><span>' + it.name + (it.variant ? (" · " + it.variant) : "") + ' ×' + (it.qty || 1) + '</span><span>' + fmt(it.price * (it.qty || 1)) + ' ₴</span></div>'; });
        html += '<div class="ocs-tot"><span>Разом</span><span>' + fmt(cartTotal()) + ' ₴</span></div>';
        html += '<span class="ocs-edit" id="ocsEdit">← Змінити кошик</span>';
        ocs.innerHTML = html; ocs.style.display = "block";
        if (orderForm) orderForm.classList.add("cart-mode");
        var ed = document.getElementById("ocsEdit"); if (ed) ed.addEventListener("click", openCart);
    }
    if (checkoutBtn) checkoutBtn.addEventListener("click", function () {
        if (!cart.length) return;
        renderOrderSummary();
        closeCart();
        var order = document.getElementById("order");
        if (order) window.scrollTo({ top: order.offsetTop - 8, behavior: "smooth" });
    });

    // доступ для обробника сабміту форми
    window.YalCart = {
        items: function () { return cart.map(function (i) { return { name: i.name, variant: i.variant, price: i.price, qty: i.qty }; }); },
        count: cartCount, total: cartTotal, clear: cartClear,
        has: function () { return cart.length > 0; },
        refreshSummary: renderOrderSummary
    };

    updateBadge(); renderCart();
})();

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

    // Замовлення з кошика (міні-магазин) чи одна ялинка з форми?
    const cartMode = !!(window.YalCart && window.YalCart.has());

    // Тип + розмір ялинки — валідуємо лише коли замовлення НЕ з кошика
    const treeSelect = document.getElementById("treeSelect");
    const sizeSelect = document.getElementById("sizeSelect");
    clearError(treeSelect);
    clearError(sizeSelect);
    if (!cartMode) {
        if (!treeSelect.value) {
            showError(treeSelect, "Будь ласка, виберіть вид ялинки.");
        }
        if (sizeSelect.disabled || !sizeSelect.value) {
            showError(sizeSelect, "Будь ласка, виберіть розмір ялинки.");
        }
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
            const cartItems = cartMode ? window.YalCart.items() : null;
            if (typeof fbq === 'function') {
                fbq('track', 'Lead', {
                    content_name: cartMode ? 'Кошик' : data.type,
                    content_category: cartMode ? (cartItems.length + ' поз.') : data.size,
                }, {
                    eventID: event_id
                });
            }
            const response = await fetch('/order', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    ...data,
                    ...(cartMode ? {cart: JSON.stringify(cartItems)} : {}),
                    _fbp: getFbClientId(),
                    _fbc: getFbClickId(),
                    ...getUtmParams() // utm_source/medium/campaign/content/term з URL → CRM-атрибуція
                })
            });

            // якщо сервер повертає JSON з redirect
            const json = await response.json();
            if (json?.redirect) {
                if (cartMode && window.YalCart) window.YalCart.clear();
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

