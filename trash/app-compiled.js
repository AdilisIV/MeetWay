var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db = require('./db');
var eventsController = require('./controllers/events');
var eventsModel = require('./models/events');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var encoding = require('encoding');
var jquery = require('jquery');
var Nightmare = require('nightmare');
nightmare = Nightmare();
var app = express();
const VK = require('vk-io');
const vk = new VK({
    app: 5980502,
    login: 'ilia.fyodoroff@mail.ru',
    pass: 'zxcfghb12QLNkftMGS44078',
    phone: '+79220291925',
    scope: 'stats,notifications,groups,wall,pages,friends,offline,photos,market'
});
//var ABC = ["в","с","до","от","2017","по","на","за","для","фестиваль","день","уроки","встреча","отдых","МК"];
//var CitiesID = [96, 1, 2, 10, 37, 153, 49, 60, 61, 72, 73, 95, 99, 104, 110, 119, 123, 151, 158];
//var CitiesID = ['96','1','2','10','37','153','49','60','61','72','73','95','99','104','110','119','123','151','158'];
var ABC = ["в"];
var CitiesID = ['96'];

var mergeName = [];

var groupID = [];
var groupName = [];
var groupActivity = [];
var groupPhoto = [];
var groupStartdate = [];
var groupLatitude = [];
var groupLongitude = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const auth = vk.auth.standalone();

function arrayUnique(arr) {
    return arr.filter((e, i, a) => a.indexOf(e) == i);
}

function parseDataFromSite(result, c) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3').wait(2000).inject('js', './jquery_v1_10_2.js').wait(2000).scrollTo(999999999999999999999999999, 0).wait(5000).evaluate(function () {
                var shortNames = [];
                $('.labeled.title a').each(function () {
                    var item = $(this).attr('href');
                    $.trim(item);
                    item = item.replace('/', '');
                    item = item.replace('event', 'club');
                    shortNames.push(item);
                });

                console.log('shortNames:', shortNames);

                mergeName = result.concat(shortNames);
                mergeName = arrayUnique(mergeName);

                var mergeResult = mergeName.join(',');
                if (mergeResult) {
                    resolve(mergeResult);
                } else {
                    reject('Ошибка при парсе данных с сайта');
                }
            });
        }, 12000);
    });
}

function tryGetGroupData(j, c) {
    return function () {
        console.log('Счетчик слов: ', j);
        console.log('Счетчик городов: ', c);
        vk.api.groups.search({
            q: ABC[j],
            type: 'event',
            city_id: CitiesID[c],
            future: 1,
            offset: 0,
            count: 1000
        }).then(group => {
            var result = [];

            console.log('Первое поиское слово: ', ABC[j]);
            console.log('Groups:', group);
            var groupObj = JSON.stringify(group);
            var groupJSON = JSON.parse(groupObj);
            for (var i = 0; i < groupJSON.items.length; i++) {
                result.push(groupJSON.items[i].screen_name); // все id по словарю для заданного города
            }
            result = arrayUnique(result); // удаляем дублирующиеся данные
            console.info('Value "c" after API request: ', c);

            return result;
        }).then(function (result) {
            return new Promise(function (resolve, reject) {
                console.log('then Result: ', result);
                console.log('then c: ', c);
                nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3').wait(2000).inject('js', './jquery_v1_10_2.js').wait(2000).scrollTo(999999999999999999999999999, 0).wait(5000).evaluate(function () {
                    var shortNames = [];
                    $('.labeled.title a').each(function () {
                        var item = $(this).attr('href');
                        $.trim(item);
                        item = item.replace('/', '');
                        item = item.replace('event', 'club');
                        shortNames.push(item);
                    });

                    console.log('shortNames:', shortNames);

                    mergeName = result.concat(shortNames);
                    mergeName = arrayUnique(mergeName);

                    var mergeResult = mergeName.join(',');
                    if (mergeResult) {
                        resolve(mergeResult);
                    } else {
                        reject('Ошибка при парсе данных с сайта');
                    }
                });
            });
        }, function () {
            console.error('Произошла ошибка в след. обещании после API request:');
        }).then(function (result) {
            console.info('Результат после merge: ', result); //запись в базу данных с сайта
        }, function (error) {
            console.error(error);
        }).then(() => {
            //console.log(c);
            vk.api.groups.getById({
                group_ids: '137040892,145368412,121232062,140933197,139631659,100506804,135759889',
                fields: 'members_count,start_date,activity,place'
            }).then(data => {
                console.log(data);
                var dataObj = JSON.stringify(data);
                var dataJSON = JSON.parse(dataObj);
                for (var i = 0; i < dataJSON.length; i++) {
                    groupID.push(dataJSON[i].id);
                    var place = dataJSON[i].place;
                    if (place) {
                        groupLatitude.push(dataJSON[i].place.latitude);
                        groupLongitude.push(dataJSON[i].place.longitude);
                    } else {
                        groupLatitude.push('Адрес неизвестен');
                        groupLongitude.push('Адрес неизвестен');
                    }
                    groupName.push(dataJSON[i].name);
                    groupActivity.push(dataJSON[i].activity);
                    groupPhoto.push(dataJSON[i].photo_200);
                    groupStartdate.push(dataJSON[i].start_date);
                }
                console.log(groupPhoto);
            });
        }).catch(error => {
            console.error(error);
        });
    };
}

// Get Groups ID

auth.run().then(token => {
    console.log('User token:', token);
    vk.setToken(token);
    for (var c = 0; c < CitiesID.length; c++) {
        // цикл для сбора данных по всем городам
        for (var j = 0; j < ABC.length; j++) {
            // цикл для сбора данных по всем поисковым словам
            setTimeout(tryGetGroupData(j, c), 4000 * (j + 1)); // Groups.search
        }
    }
}, () => console.error('Ошибка при получении токена.')).catch(error => {
    console.error(error);
});

/*setTimeout(function () {
    db.get().collection('events').find({}, {name:1}).sort({_id:1}).forEach(function(doc) {
        db.get().collection('events').remove({
            _id:{$gt:doc._id},
            name:doc.name
        })
    })
}, 5000)*/

//app.get(eventsController.deleteDouble);


// API methods

app.get('/', function (req, res) {
    res.send("OneTwoMeet.ru started!");
});

app.get('/events', eventsController.all);

app.get('/events/:id', eventsController.findById);

app.post('/events/:cityid', eventsController.create);

//app.put('/events/:id', eventsController.update);

//app.delete('/events/:id', eventsController.delete);

app.delete('events/remove', eventsController.deleteDouble);

db.connect("mongodb://localhost:27017/VK_eAPI", function (err) {
    // VK_eAPI or test
    if (err) {
        return console.log(err);
    }
    app.listen(1337, function () {
        console.log("API app started");
    });
});

//# sourceMappingURL=app-compiled.js.map