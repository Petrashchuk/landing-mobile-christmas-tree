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
const treeSizes = {
    "Снігова Королева": ["1.0 м", "1.3 м", "1.5 м", "1.8 м", "2.0 м", '2.2 м', '2.5 м', '3.0 м'],
    "Казка": ["1.0 м", "1.3 м", "1.5 м", "1.8 м", "2.0 м", '2.2 м', '2.5 м', '3.0 м'],
    "Елітна з шишкою": ["1.3 м", "1.5 м", "1.8 м", "2.0 м", '2.2 м', '2.5 м'],
    "Кармен + сині ягідки": ["1.3 м", "1.5 м", "1.8 м", "2.0 м", '2.2 м', '2.5 м'],
    "Кармен + червоні ягідки": ["1.3 м", "1.5 м", "1.8 м", "2.0 м", '2.2 м', '2.5 м'],
    "Кармен + срібні ягідки": ["1.3 м", "1.5 м", "1.8 м", "2.0 м", '2.2 м', '2.5 м'],
    "Кармен + золоті ягідки": ["1.3 м", "1.5 м", "1.8 м", "2.0 м", '2.2 м', '2.5 м'],
    "Тріумф Зелена": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Тріумф Блакитна": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Тріумф Засніжена": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Роял Зелена": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Роял Блакитна": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Роял Засніжена": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Буковельська Зелена": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Буковельська Блакитна": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Буковельська Засніжена": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Віденська": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    "Смерека": ["1.5 м", "1.8 м", "2.1 м", "2.3 м", "2.5 м"],
    'Горщик - Роял Зелена': ['0.7 м', '0.9 м', '1.1 м'],
    'Горщик - Роял Блакитна': ['0.7 м', '0.9 м', '1.1 м'],
    'Горщик - Роял Засніжена': ['0.7 м', '0.9 м', '1.1 м']
};

loadSizes('Снігова Королева');


// функція для підгрузки розмірів
function loadSizes(treeName) {
    sizeSelect.innerHTML = ""; // очищаємо
    if (treeSizes[treeName]) {
        sizeSelect.disabled = false;

        const sizes = treeSizes[treeName];
        const middleIndex = Math.floor(sizes.length / 2); // знаходимо середній індекс

        sizes.forEach((size, index) => {
            const selected = index === middleIndex ? "selected" : "";
            sizeSelect.insertAdjacentHTML("beforeend", `<option value="${size}" ${selected}>${size}</option>`);
        });

    } else {
        sizeSelect.disabled = true;
        sizeSelect.insertAdjacentHTML("beforeend", `<option selected disabled>Немає доступних розмірів</option>`);
    }
}


// коли змінюється select з видом
treeSelect.addEventListener("change", function () {
    loadSizes(this.value);
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
                body: JSON.stringify(data)
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
