var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db = require('./../db');
var eventsController = require('./../controllers/events');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var encoding = require('encoding');
var app = express();
const VK = require('vk-io');
const vk = new VK({
    app: 5980502,
    login: '',
    pass: '',
    phone: '',
    scope: 'stats,notifications,groups,wall,pages,friends,offline,photos,market'
});
var jquery = require('jquery');
var Nightmare = require('nightmare');
nightmare = Nightmare({ show: true, dock: true });
//var ABC = ["в","с","до","от","2017","по","на","за","для","фестиваль","день","уроки","встреча","отдых","МК"];
var groupID = [];
var groupName = [];
var groupActivity = [];
var groupMembers = [];
var groupPhoto = [];
var groupStartdate = [];
var groupLatitude = [];
var groupLongitude = [];
var eventsArr = [];

var CitiesID = ['96'];
var ABC = ["в"];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const auth = vk.auth.standalone();

function arrayUnique(arr) {
    return arr.filter((e, i, a) => a.indexOf(e) == i);
}
function compareStart(eventA, eventB) {
    return eventA.start - eventB.start;
}
function cleaningGlobalValues() {
    groupID.length = 0;
    groupName.length = 0;
    groupActivity.length = 0;
    groupMembers.length = 0;
    groupPhoto.length = 0;
    groupStartdate.length = 0;
    groupLatitude.length = 0;
    groupLongitude.length = 0;
    eventsArr.length = 0;
}

function parseDataFromSite(c) {
    return function () {
        nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3').wait(2000).inject('js', './jquery_v1_10_2.js').wait(2000).scrollTo(9999999999999999999999999999999, 0).wait(5000).evaluate(function () {
            var shortNames = [];
            $('.labeled.title a').each(function () {
                var item = $(this).attr('href');
                $.trim(item);
                item = item.replace('/', '');
                item = item.replace('event', 'club');
                shortNames.push(item);
            });

            shortNames = shortNames.join(',');

            return new Promise(function (resolve, reject) {
                setTimeout(() => resolve(shortNames), 1000);
            });
        }).then(function (result) {
            return new Promise(function (resolve, reject) {
                console.info(result);
                vk.api.groups.getById({
                    group_ids: result,
                    fields: 'members_count,start_date,activity,place'
                }).then(data => {
                    console.log(data);

                    var Event = {
                        id: String,
                        name: String,
                        activity: String,
                        photo: String,
                        start: Number,
                        members: Number,
                        latitude: Number,
                        longitude: Number
                    };

                    var gLatitude = 0;
                    var gLongitude = 0;

                    var dataObj = JSON.stringify(data);
                    var dataJSON = JSON.parse(dataObj);
                    for (var i = 0; i < dataJSON.length; i++) {

                        //groupID.push(dataJSON[i].id);
                        var place = dataJSON[i].place;
                        if (place) {
                            gLatitude = dataJSON[i].place.latitude;
                            gLongitude = dataJSON[i].place.longitude;
                        } else {
                            console.info('Адрес проведения мероприятий не указан организаторами');
                        }

                        Event[i] = {
                            id: dataJSON[i].id,
                            name: dataJSON[i].name,
                            activity: dataJSON[i].activity,
                            photo: dataJSON[i].photo_200,
                            start: dataJSON[i].start_date,
                            members: dataJSON[i].members_count,
                            latitude: gLatitude,
                            longitude: gLongitude
                        };

                        var eventEx = Event[i];
                        var eventsArr = [];
                        eventsArr.push(eventEx);
                    }
                    eventsArr.sort(compareStart); // массив объектов отсортированный по дате старта

                    resolve(eventsArr);
                });
            });
        }).then(function (events) {
            // запись в базу данных с сайта
            console.log('Параметр "c" при записи в базу данных с сайта', c);
            for (var k = 0; k < events.length; k++) {
                request.post({
                    url: 'http://localhost:3012/events/' + CitiesID[c],
                    form: {
                        id: events[k].id,
                        name: events[k].name,
                        activity: events[k].activity,
                        photo: events[k].photo,
                        start: events[k].start,
                        members: events[k].members,
                        latitude: events[k].latitude,
                        longitude: events[k].longitude
                    }
                }, function (err, res, body) {
                    if (err) {
                        console.log(err);
                    } else if (body) {
                        console.log(body);
                    }
                });
            }
        });
    };
}

function parseDataViaAPI(j, c) {
    return function () {
        //.then(function () {
        auth.run().then(token => {
            console.log('User token:', token);
            vk.setToken(token);
            vk.api.groups.search({
                q: ABC[j], // j
                type: 'event',
                city_id: CitiesID[c], // c
                future: 1,
                offset: 0,
                count: 1000
            }).then(group => {
                var result = [];
                console.log('Первое поиское слово: ', ABC[j]); // j
                var groupObj = JSON.stringify(group);
                var groupJSON = JSON.parse(groupObj);
                for (var i = 0; i < groupJSON.items.length; i++) {
                    result.push(groupJSON.items[i].screen_name); // все id по словарю для заданного города
                }
                result = arrayUnique(result); // удаляем дублирующиеся данные
                return result;
            }).then(function (result) {
                return new Promise(function (resolve, reject) {
                    console.info(result);
                    vk.api.groups.getById({
                        group_ids: result,
                        fields: 'members_count,start_date,activity,place'
                    }).then(data => {
                        //console.log(data);

                        var dataObj = JSON.stringify(data);
                        var dataJSON = JSON.parse(dataObj);
                        for (var i = 0; i < dataJSON.length; i++) {
                            groupID.push(dataJSON[i].id);
                            var place = dataJSON[i].place;
                            if (place) {
                                groupLatitude.push(dataJSON[i].place.latitude);
                                groupLongitude.push(dataJSON[i].place.longitude);
                            } else {
                                groupLatitude.push(0);
                                groupLongitude.push(0);
                            }
                            if (dataJSON[i].is_closed) {
                                groupActivity.push("Данные недоступны");
                                groupMembers.push("");
                                groupStartdate.push(dataJSON[i].start_date);
                            }
                            groupName.push(dataJSON[i].name);
                            groupActivity.push(dataJSON[i].activity);
                            groupMembers.push(dataJSON[i].members_count);
                            groupPhoto.push(dataJSON[i].photo_200);
                            groupStartdate.push(dataJSON[i].start_date);
                        }
                        console.log('Глобавльные переменные заполнены');

                        resolve(groupName);
                    });
                });
            }).then(function (res) {
                console.log(res); // запись в базу данных с API
            });
        })
        //})
        .catch(error => console.error(error));
    };
}

function StartRecording() {

    cleaningGlobalValues();

    for (var c = 0; c < CitiesID.length; c++) {
        // цикл для сбора данных по всем городам
        cleaningGlobalValues();
        for (var j = 0; j < ABC.length; j++) {
            // цикл для сбора данных по всем поисковым словам
            setTimeout(parseDataViaAPI(j, c), 5000 * (j + 1)); // Сбор, сортировка, запись
        }
        var Event = {
            id: String,
            name: String,
            activity: String,
            photo: String,
            start: Number,
            members: Number,
            latitude: Number,
            longitude: Number
        };
        console.log('Объект создан');
        for (var i = 0; i < groupID.length; i++) {
            Event[i] = {
                id: groupID[i],
                name: groupName[i],
                activity: groupActivity[i],
                photo: groupPhoto[i],
                start: groupStartdate[i],
                members: groupMembers[i],
                latitude: groupLatitude[i],
                longitude: groupLongitude[i]
            };
            var eventEx = Event[i];

            eventsArr.push(eventEx);
        }

        eventsArr.sort(compareStart); // массив объектов отсортированный по дате старта

        // записать
        for (k = 0; k < eventsArr.length; k++) {
            request.post({
                url: 'http://localhost:3012/events/' + CitiesID[c],
                form: {
                    id: eventsArr[k].id,
                    name: eventsArr[k].name,
                    activity: eventsArr[k].activity,
                    photo: eventsArr[k].photo,
                    start: eventsArr[k].start,
                    members: eventsArr[k].members,
                    latitude: eventsArr[k].latitude,
                    longitude: eventsArr[k].longitude
                }
            }, function (err, res, body) {
                if (err) {
                    console.log(err);
                } else if (body) {
                    console.log(body);
                }
            });
        }

        //setTimeout(parseDataFromSite(c), 6000*(c+1)); // Сбор, сортировка, запись
    }

    setTimeout(function () {
        db.get().collection('events').find({}, { id: 1 }).sort({ _id: 1 }).forEach(function (doc) {
            db.get().collection('events').remove({
                _id: { $gt: doc._id },
                id: doc.id,
                name: doc.name,
                activity: doc.activity,
                photo: doc.photo,
                start: doc.start,
                members: doc.members,
                latitude: doc.latitude,
                longitude: doc.longitude
            });
        });
    }, 15000);
}

StartRecording();

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

db.connect("mongodb://localhost:27017/OneTwoMeetDB", function (err) {
    // VK_eAPI or test
    if (err) {
        return console.log(err);
    }
    app.listen(1337, function () {
        console.log("API app started");
    });
});

//# sourceMappingURL=playgroung-compiled.js.map