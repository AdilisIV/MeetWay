var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db = require('./../db');
var eventsController = require('./../controllers/events');
var getGroupsData = require('./../controllers/getGroups');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var encoding = require('encoding');
var jquery = require('jquery');
var Nightmare = require('nightmare');
nightmare = Nightmare({ show: true, dock: true });
var app = express();
const VK = require('vk-io');
const vk = new VK({
    app: 5980502,
    login: '',
    pass: '',
    phone: '',
    scope: 'stats,notifications,groups,wall,pages,friends,offline,photos,market'
});
//var ABC = ["в","с","до","от","2017","по","на","за","для","фестиваль","день","уроки","встреча","отдых","МК"];
//var CitiesID = [96, 1, 2, 10, 37, 153, 49, 60, 61, 72, 73, 95, 99, 104, 110, 119, 123, 151, 158];
//var CitiesID = ['96','1','2','10','37','153','49','60','61','72','73','95','99','104','110','119','123','151','158'];
var ABC = ["в"];
var CitiesID = ['96'];

var result = [];
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

function parseDataFromSite(c) {
    nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3').wait(2000).inject('js', './jquery_v1_10_2.js').wait(3000).inject('js', './scrollAnimate.js').wait(15000).evaluate(function () {
        var shortNames = [];
        $('.labeled.title a').each(function () {
            var item = $(this).attr('href');
            $.trim(item);
            item = item.replace('/', '');
            item = item.replace('event', 'club');
            shortNames.push(item);
        });

        console.log('shortNames:', shortNames);

        shortNames = shortNames.join(',');

        return shortNames;
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

                var id = [];
                var name = [];
                var activity = [];
                var photo = [];
                var start = [];
                var members = [];
                var latitude = [];
                var longitude = [];

                var gLatitude = 0;
                var gLongitude = 0;
                var gMembers = 0;
                var gActivity = "Данные недоступны";
                var gStartDate = 2001513200;

                var dataObj = JSON.stringify(data);
                var dataJSON = JSON.parse(dataObj);

                for (var i = 0; i < dataJSON.length; i++) {

                    var place = dataJSON[i].place;
                    if (place) {
                        gLatitude = dataJSON[i].place.latitude;
                        gLongitude = dataJSON[i].place.longitude;
                    } else {
                        console.info('Адрес проведения мероприятий не указан организаторами');
                    }

                    if (dataJSON[i].is_closed == 0) {
                        gActivity = dataJSON[i].activity;
                        gMembers = dataJSON[i].members_count;
                        gStartDate = dataJSON[i].start_date;
                    } else {
                        console.info('Частное сообщество');
                    }

                    id.push(dataJSON[i].id);
                    name.push(dataJSON[i].name);
                    activity.push(gActivity);
                    photo.push(dataJSON[i].photo_200);
                    start.push(gStartDate);
                    members.push(gMembers);
                    latitude.push(gLatitude);
                    longitude.push(gLongitude);
                }

                console.log("Длинна массива с members: ", id.length);
                console.log("Длинна массива с members: ", name.length);
                console.log("Длинна массива с members: ", activity.length);
                console.log("Длинна массива с members: ", photo.length);
                console.log("Длинна массива с members: ", start.length);
                console.log("Длинна массива с members: ", members.length);
                console.log("Длинна массива с members: ", latitude.length);
                console.log("Длинна массива с members: ", longitude.length);

                for (var l = 0; l < id.length; l++) {
                    request.post({
                        url: 'http://localhost:1337/events/' + CitiesID[c],
                        form: {
                            id: id[l],
                            name: name[l],
                            activity: activity[l],
                            photo: photo[l],
                            start: start[l],
                            members: members[l],
                            latitude: latitude[l],
                            longitude: longitude[l]
                        }
                    }, function (err, res, body) {
                        if (err) {
                            console.log(err);
                        } else if (body) {
                            console.log(body);
                        }
                    });
                }

                //resolve(eventsArr);
            });
        });
    });
}

// Get Groups ID

/*auth.run()
    .then((token) => {
        console.log('User token:',token);
        vk.setToken(token);
        for (var c = 0; c<CitiesID.length; c++) { // цикл для сбора данных по всем городам
            for (var j = 0; j<ABC.length; j++) { // цикл для сбора данных по всем поисковым словам
                setTimeout(tryGetGroupData(j,c), 1000*(j+1)); // Groups.search
            }
        }
    }, () => console.error('Ошибка при получении токена.'))
    .catch((error) => {
        console.error(error);
    });*/

//parseDataFromSite(0);


// API methods

app.get('/', function (req, res) {
    res.send("OneTwoMeet.ru started!");
});
app.get('/events', eventsController.all);

app.get('/events/:id', eventsController.findById);

app.post('/events/:cityid', eventsController.create);

//app.put('/events/:id', eventsController.update);

app.delete('/events/:id', eventsController.delete);

db.connect("mongodb://localhost:27017/VK_eAPI", function (err) {
    // VK_eAPI or test
    if (err) {
        return console.log(err);
    }
    app.listen(1337, function () {
        console.log("API app started");
    });
});

//# sourceMappingURL=server-compiled.js.map