$(document).ready(function () {
    for (var i = 0; i < 11; i++) {
        // 11 циклов необходимо, чтобы прокрутить до футера страницу с 1000 групп
        setTimeout(function () {
            $('html, body').animate({ scrollTop: 10000000000000000000000000000 }, 800);
        }, 1500); // timeout можно уменьшить или убрать, но я оставил, чтобы ajax-данные 100% загрузились
    }
});

//# sourceMappingURL=scrollAnimate-compiled.js.map