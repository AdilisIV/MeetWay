var express = require('express');
var bodyParser = require('body-parser');
var db = require('./db');
var eventsController = require('./controllers/events');
var path = require('path');
var request = require('request');
var fs = require('fs');
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
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0, 59, 1);


var groupID = [];
var groupName = [];
var groupActivity = [];
var groupMembers = [];
var groupPhoto = [];
var groupStartdate= [];
var groupLatitude = [];
var groupLongitude = [];
var eventsArr = [];

//var CitiesID = ['96','1','2','10','37','153','49','60','61','72','73','95','99','104','110','119','123','151','158','133'];
//var ABC = ["в","с","до","от","2017","по","на","за","для","фестиваль","день","уроки","встреча","отдых","МК"];

var CitiesID = ['96', '153'];
var ABC = ['в', 'с'];

var email = 'ilia.fyodoroff@mail.ru';
var password = 'zxcfghb12QLNkftMGS44078';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const auth = vk.auth.standalone();


function arrayUnique(arr){
    return arr.filter((e,i,a)=>a.indexOf(e)==i)
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
        console.log('Параметр с:', c);
        nightmare
            .goto('https://vk.com/login')
            .wait(1000)
            .type('form [name=email]', email)
            .click('input#pass')
            .type('input#pass', password)
            .click('button#login_button')
            .wait(1000)
            .goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bnot_safe%5D=1&c%5Bsection%5D=communities&c%5Btype%5D=3')
            .wait(3000)
            .inject('js', './jquery_v1_10_2.js')
            .wait(1500)
            .inject('js', './scrollAnimate.js')
            .wait(15000)
            .evaluate(function () {
                var shortNames = [];
                $('.labeled.title a').each(function () {
                    var item = $(this).attr('href');
                    $.trim(item);
                    item = item.replace('/','');
                    item = item.replace('event','club');
                    shortNames.push(item)
                });

                shortNames = shortNames.join(',');

                return new Promise(function (resolve, reject) {
                    setTimeout(() => resolve(shortNames), 1000);
                })
            })
            //.end()
            .then(function (result) {
                return new Promise(function (resolve, reject) {
                    console.info('Result (nightmare по городу): ',result);
                    vk.api.groups.getById({
                            group_ids: result,
                            fields: 'members_count,start_date,activity,place'
                        })
                        .then((data) => {
                            //console.log(data);

                            /*var Event = {
                                id: String,
                                name: String,
                                activity: String,
                                photo: String,
                                start: Number,
                                members: Number,
                                latitude: Number,
                                longitude: Number
                            };*/

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
                                    //console.info('Адрес проведения мероприятий не указан организаторами');
                                }

                                if (dataJSON[i].is_closed == 0) {
                                    gActivity = dataJSON[i].activity;
                                    gMembers = dataJSON[i].members_count;
                                    gStartDate = dataJSON[i].start_date;
                                } else {
                                    //console.info('Частное сообщество');
                                }

                                if ((gMembers == 0) || (gMembers == 1)) {
                                    //console.log("Число участников: ", gMembers);
                                    //console.log("Аватар сообщества: ", dataJSON[i].photo_200);
                                    //console.log('ПУСТОЕ СООБЩЕСТВО');
                                } else {
                                    id.push(dataJSON[i].id);
                                    name.push(dataJSON[i].name);
                                    activity.push(gActivity);
                                    photo.push(dataJSON[i].photo_200);
                                    start.push(gStartDate);
                                    members.push(gMembers);
                                    latitude.push(gLatitude);
                                    longitude.push(gLongitude);
                                }
                                

                            }

                            // console.log("Длинна массива с members: ", id.length);
                            // console.log("Длинна массива с members: ", name.length);
                            // console.log("Длинна массива с members: ", activity.length);
                            // console.log("Длинна массива с members: ", photo.length);
                            // console.log("Длинна массива с members: ", start.length);
                            // console.log("Длинна массива с members: ", members.length);
                            // console.log("Длинна массива с members: ", latitude.length);
                            // console.log("Длинна массива с members: ", longitude.length);

                            for (var l=0; l<id.length; l++) {
                                //console.log('XXXXXXX----XXXXXX', l);
                                request.post({
                                    url: 'http://localhost:1337/events/'+CitiesID[c],
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
                                        //console.log(body);
                                    }
                                });
                                
                                if (l == id.length-1) {
                                    resolve();
                                    console.log('DICK');
                                    //RemoveDoubleRequest();
                                }
                            }

                            //resolve(eventsArr);
                        })
                        .then(() => {
                            console.log('DICK2');
                            console.log('Параметр "с" перед удалением дублей: ', c);
                            RemoveDoubleRequest(c);
                        })
                })
            })
            .catch((error) => {
                console.error(error);
                if (error.statusCode == 404) {
                    parseDataFromSite(c);
                }
            })
    }
}

function parseDataViaAPI(j,c) {
    return function () {
        //.then(function () {
        auth.run()
            .then((token) => {
                console.log('User token:', token);
                vk.setToken(token);
                vk.api.groups.search({
                        q: ABC[j], // j
                        type: 'event',
                        city_id: CitiesID[c], // c
                        future: 1,
                        offset: 0,
                        count: 1000
                    })
                    .then((group) => {
                        var result = [];
                        console.log('Первое поиское слово: ', ABC[j]); // j
                        var groupObj = JSON.stringify(group);
                        var groupJSON = JSON.parse(groupObj);
                        for (var i = 0; i < groupJSON.items.length; i++) {
                            result.push(groupJSON.items[i].screen_name); // все id по словарю для заданного города
                        }
                        result = arrayUnique(result); // удаляем дублирующиеся данные
                        result = result.join(',');

                        return result;
                    })
                    .then(function (result) {
                        return new Promise(function (resolve, reject) {
                            console.info('Result (api по букве словаря): ',result);
                            vk.api.groups.getById({
                                    group_ids: result,
                                    fields: 'members_count,start_date,activity,place'
                                })
                                .then((data) => {
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
                                            groupLatitude.push(0);
                                            groupLongitude.push(0);
                                        }

                                        if (dataJSON[i].is_closed == 1) {
                                            groupActivity.push("Данные недоступны");
                                            groupMembers.push(0);
                                            groupStartdate.push(2001513200);
                                        } else {
                                            groupActivity.push(dataJSON[i].activity);
                                            groupMembers.push(dataJSON[i].members_count);
                                            groupStartdate.push(dataJSON[i].start_date);
                                        }
                                    }
                                    console.log('Глобавльные переменные заполнены');

                                    resolve(groupName);
                                })
                        })
                    })
                    .then(function (res) {
                        //console.log(res); // запись в базу данных с API
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
                        for(var i = 0; i < groupID.length; i++) {
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

                        //eventsArr.sort(compareStart); // массив объектов отсортированный по дате старта

                        // записать
                        for (k=0; k<eventsArr.length; k++) {
                            request.post({
                                url: 'http://localhost:1337/events/'+CitiesID[c],
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
                                    //console.log(body);
                                }
                            });
                        }
                    })
            })
            //})
            .catch((error) => {
                console.error(error);
                if (error.statusCode == 404) {
                    parseDataViaAPI(j,c);
                }
            })
    }
}


function RemoveDoubleRequest(c) {
    setTimeout(function () {
        console.log('Запрос на удаление дублей в Mongodb');
        db.get().collection('cityevents').find({"cityid":CitiesID[c]}, {id:1}).sort({_id:1}).forEach(function(doc) {
            db.get().collection('cityevents').removeOne({
                _id:{$gt:doc._id},
                id: doc.id
            })
        });

    }, 500)
}


function StartAPI() {
    //return new Promise(function (resolve, reject) {
        cleaningGlobalValues();

        for (var c = 0; c<CitiesID.length; c++) { // цикл для сбора данных по всем городам
            cleaningGlobalValues();
            for (var j = 0; j<ABC.length; j++) { // цикл для сбора данных по всем поисковым словам
                setTimeout(parseDataViaAPI(j,c), 5000*(j+1)); // Сбор, сортировка, запись
            }

            //setTimeout(parseDataFromSite(c), 25000*(c+1)); // Сбор, сортировка, запись
        }

    //})
}


function StartParse() {
    return new Promise(function (resolve, reject) {

        for (var c = 0; c<CitiesID.length; c++) { // цикл для сбора данных по всем городам
            setTimeout(parseDataFromSite(c), 40000*(c+1)); // Сбор, сортировка, запись
        }

    })
}


//schedule.scheduleJob(rule, function(){
    //StartAPI();
    StartParse();
//});






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


db.connect("mongodb://localhost:27017/VK_eAPI", function (err) { // VK_eAPI or test
    if(err) { return console.log(err); }
    app.listen(1337, function () {
        console.log("API app started");
    });
});