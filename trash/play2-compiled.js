var express = require('express');
var jquery = require('jquery');
var Vue = require('vue');
var app = express();

function applyForVisa(documents) {
    console.log("Обработка заявления...");
    let promise = new Promise(function (resolve, reject) {
        setTimeout(function () {
            Math.random() > 0 ? resolve({}) : reject('В визе отказано: не хватило документов.');
        }, 2000);
    });
    return promise;
}

function getVisa(visa) {
    console.info('Виза получена');
    //return visa; // вернем объект visa в следующее обещание
    return new Promise(function (resolve, reject) {
        setTimeout(() => resolve(visa), 2000);
    });
}
function bookHotel(visa) {
    console.log(visa);
    console.log('Бронируем отель');
    // return Promise.resolve(visa);
    return new Promise(function (resolve, reject) {
        reject('Нет мест');
        // resolve({});
    });
}
function buyTickets(booking) {
    console.log('Покупаем билеты');
    console.log('Бронь', booking);
}

applyForVisa({})
/*.then(
    function (visa) {
        console.info('Виза получена');
    }*/
.then(getVisa).then(bookHotel).then(buyTickets).catch(error => console.error(error)).then(() => console.log('Обещание после catch'));

app.listen(3012, function () {
    console.log("API app started");
});

/*function arrayUnique(arr){
    return arr.filter((e,i,a)=>a.indexOf(e)==i)
}

var arr = [1, 1, 1, 1, 3, 4, 40, 50];

arr = arrayUnique(arr);
console.log(arr);*/

//# sourceMappingURL=play2-compiled.js.map