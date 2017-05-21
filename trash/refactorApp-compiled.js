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

var CitiesID = ['1'];

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
}

function groupsGetByID(arr400, c) {
    return function () {
        //console.info(arr400);
        vk.api.groups.getById({
            group_ids: arr400,
            fields: 'members_count,start_date,activity,place'
        }).then(data => {
            //console.log(data);

            cleaningGlobalValues();

            var dataObj = JSON.stringify(data);
            var dataJSON = JSON.parse(dataObj);

            for (var i = 0; i < dataJSON.length; i++) {

                groupID.push(dataJSON[i].id);
                groupName.push(dataJSON[i].name);
                groupPhoto.push(dataJSON[i].photo_200);

                var place = dataJSON[i].place;
                if (place) {
                    groupLatitude.push(dataJSON[i].place.latitude);
                    groupLongitude.push(dataJSON[i].place.longitude);
                } else {
                    console.info('Адрес проведения мероприятий не указан организаторами');
                    groupLatitude.push(0);
                    groupLongitude.push(0);
                }

                if (dataJSON[i].is_closed == 0) {
                    groupActivity.push(dataJSON[i].activity);
                    groupMembers.push(dataJSON[i].members_count);
                    groupStartdate.push(dataJSON[i].start_date);
                } else {
                    console.info('Частное сообщество');
                    groupActivity.push("Данные недоступны");
                    groupMembers.push(0);
                    groupStartdate.push(2001513200);
                }
            }
        }).then(() => {

            for (var i = 0; i < groupID.length; i++) {
                request.post({
                    url: 'http://localhost:1337/events/' + CitiesID[c],
                    form: {
                        id: groupID[i],
                        name: groupName[i],
                        activity: groupActivity[i],
                        photo: groupPhoto[i],
                        start: groupStartdate[i],
                        members: groupMembers[i],
                        latitude: groupLatitude[i],
                        longitude: groupLongitude[i]
                    }
                }, function (err, res, body) {
                    if (err) {
                        console.log(err);
                    } else if (body) {
                        //console.log(body);
                    }
                });
            }
        });
    };
}

function parseDataFromSite(c) {
    return function () {
        nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3').wait(2000).inject('js', './jquery_v1_10_2.js').wait(3000).inject('js', './scrollAnimate.js').wait(15000).evaluate(function () {
            var shortNames = [];
            $('.labeled.title a').each(function () {
                var item = $(this).attr('href');
                $.trim(item);
                item = item.replace('/', '');
                item = item.replace('event', 'club');
                shortNames.push(item);
            });

            //console.log('shortNames:', shortNames);

            //shortNames = shortNames.join(',');

            return shortNames;
        }).then(function (result) {
            console.info('Параметр "с": ', c);
            var eventsArr = result;
            console.info(eventsArr.length);
            for (var n = 0; n <= eventsArr.length; n = n + 400) {

                var arr400 = eventsArr.slice(n, n + 400);
                arr400 = arr400.join(',');
                console.info('Параметр "с": ', c);
                setTimeout(groupsGetByID(arr400, c), 1000 * (n + 1));
            }
        }).catch(error => {
            console.error(error);
        });
    };
}

function StartRecording() {

    cleaningGlobalValues();

    for (var c = 0; c < CitiesID.length; c++) {
        // цикл для сбора данных по всем городам
        cleaningGlobalValues();
        setTimeout(parseDataFromSite(c), 6000 * (c + 1)); // Сбор, сортировка, запись
    }
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

db.connect("mongodb://localhost:27017/VK_eAPI", function (err) {
    // VK_eAPI or test
    if (err) {
        return console.log(err);
    }
    app.listen(1337, function () {
        console.log("API app started");
    });
});

//# sourceMappingURL=refactorApp-compiled.js.map