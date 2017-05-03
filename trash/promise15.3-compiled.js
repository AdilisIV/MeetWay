var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function applyForVisa(documents) {
    console.log('Обработка данных...');
    let promise = new Promise(function (resolve, reject) {
        setTimeout(function () {
            Math.random() > .5 ? resolve({}) : reject('В визе отказано: нехватка документов.');
        }, 1000);
    });
    return promise;
}

function bookHotel(visa) {
    console.log(visa);
    console.info('Бронируем отель');
    return new Promise(function (resolve, reject) {
        setTimeout(() => resolve({}), 1000);
    });
}

function buyTeckets(booking) {
    console.log('Покупаем билеты');
    console.log('Бронь', booking);
}

function getVisa(visa) {
    console.info('Виза получена!');
    return new Promise(function (resolve, reject) {
        setTimeout(() => resolve(visa), 1000);
    });
}

setTimeout(function () {
    db.get().collection('cityevents').find({}, { id: 1 }).sort({ _id: 1 }).forEach(function (doc) {
        db.get().collection('cityevents').remove({
            _id: { $gt: doc._id },
            id: doc.id
        });
    });
}, 3000);

applyForVisa({}).then(getVisa).then(bookHotel).then(buyTeckets).catch(error => console.error(error));

app.get('/', function (req, res) {
    res.send("Server started!");
});

app.listen(3012, function () {
    console.log("API app started");
});

//# sourceMappingURL=promise15.3-compiled.js.map