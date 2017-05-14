
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
    login: 'ilia.fyodoroff@mail.ru',
    pass: 'zxcfghb12QLNkftMGS44078',
    phone: '+79220291925',
    scope: 'stats,notifications,groups,wall,pages,friends,offline,photos,market'
});
var jquery = require('jquery');
var Nightmare = require('nightmare');
nightmare = Nightmare({ show: true, dock: true });
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.hour = new schedule.Range(0, 59, 12);



var CitiesID = ['96','1','2','10','37','153','49','60','61','72','73','95','99','104','110','119','123','151','158','133'];

var CitiesName = ['Нижний Тагил','Москва','Санкт-Петербург','Волгоград','Владивосток','Хабаровск','Екатеринбург','Казань','Калининград','Краснодар','Красноярск','Нижний Новгород','Новосибирск','Омск','Пермь','Ростов-на-Дону','Самара','Уфа','Челябинск','Сочи'];

var ABC = ["в","с","до","от","к","2017","по","и","на","за","для","фестиваль","день","уроки","встреча","отдых","МК","выиграй","спектакль","кубок","приз","репост","ночь","концерт","курс","школа","шоу","турнир","розыгрыш","тренинг","интенсив","через","обучение","клуб","вечеринка","билеты","dance","street","тур","халява","забег","форум","афиша","волна","бизнес","хутор","кино","поход","фитнес","сказка","семинар","выставка","москва","of","|"];

//var CitiesID = ['96'];
//var ABC = ['в', 'с'];

//var email = 'ilia.fyodoroff@mail.ru';
//var password = 'zxcfghb12QLNkftMGS44078';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const auth = vk.auth.standalone();


function arrayUnique(arr){
    return arr.filter((e,i,a)=>a.indexOf(e)==i)
}
function compareStart(eventA, eventB) {
    return eventA.start - eventB.start;
}


function setCities() {
    setTimeout(function(){
        for (var l=0; l<CitiesID.length; l++) {
            request.post({
            url: 'http://localhost:1337/cities',
            form: {
                id: CitiesID[l],
                name: CitiesName[l]
            }
            }, function (err, res, body) {
                if (err) {
                    console.log(err);
                } else if (body) {
                    console.log(body);
                }
            });
        }
    }, 2000);
}


function parseDataViaAPI(j,c) {
    return function () {
        // auth.run()
        //     .then((token) => {
        //         console.log('User token:', token);
        //         vk.setToken(token);
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
                            //console.info('Result (api по букве словаря): ',result);
                            vk.api.groups.getById({
                                    group_ids: result,
                                    fields: 'members_count,start_date,activity,place,description'
                                })
                                .then((data) => {
                                    //console.log(data);
                                    //cleaningGlobalValues();

                                    var id = [];
                                    var name = [];
                                    var activity = [];
                                    var photo = [];
                                    var start = [];
                                    var members = [];
                                    var latitude = [];
                                    var longitude = [];
                                    var description = [];

                                    var gLatitude = 0;
                                    var gLongitude = 0;
                                    var gMembers = 0;
                                    var gActivity = "Данные недоступны";
                                    var gStartDate = 2001513200;
                                    var gDescription = "Упс, видимо организаторы мероприятия решили не добавлять описание. :(";



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

                                        if(dataJSON[i].description != "") {
                                            gDescription = dataJSON[i].description;
                                        } else {
                                            console.info('У сообщества нет описания', dataJSON[i].id);
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
                                            description.push(gDescription);
                                        }


                                    }

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
                                                longitude: longitude[l],
                                                description: description[l]
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

                                })
                                .then(() => {
                                    console.log('DICK2');
                                    console.log('Параметр "с" перед удалением дублей: ', c);
                                    RemoveDoubleDocuments(c);
                                })
                        })
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            //})
            // .catch((error) => {
            //     console.error(error);
            // })
    }
}


function RemoveDoubleDocuments(c) {
    setTimeout(function () {
        console.log('Запрос на удаление дублей в Mongodb');
        db.get().collection('cityevents').find({"cityid":CitiesID[c]}, {id:1}).sort({_id:1}).forEach(function(doc) {
            db.get().collection('cityevents').removeOne({
                _id:{$gt:doc._id},
                id: doc.id
            })
        });

    }, 1000)
}


function StartAPI() {
    auth.run()
        .then((token) => {
            console.log('User token:', token);
            vk.setToken(token);
        })
        .catch((error) => {
            console.error(error);
        })
    for (var c = 0; c<CitiesID.length; c++) { // цикл для сбора данных по всем городам
        for (var j = 0; j<ABC.length; j++) { // цикл для сбора данных по всем поисковым словам
            setTimeout(parseDataViaAPI(j,c), 1000*(j+1)); // Сбор, сортировка, запись
        }
    }
}


//schedule.scheduleJob(rule, function(){
//StartAPI();
//});


// Установка списка городов
// Добавлены: Сочи
setCities();

// API methods

app.get('/', function (req, res) {
    res.send("OneTwoMeet.ru started!");
});

app.get('/events', eventsController.all);

app.get('/events/:id', eventsController.findById);

app.get('/cities', eventsController.allcities);

app.post('/events/:cityid', eventsController.create);

app.post('/cities', eventsController.createCity);

//app.put('/events/:id', eventsController.update);

//app.delete('/events/:id', eventsController.delete);

app.delete('events/remove', eventsController.deleteDouble);


db.connect("mongodb://localhost:27017/VK_eAPI", function (err) { // VK_eAPI or test
    if(err) { return console.log(err); }
    app.listen(1337, function () {
        console.log("API app started");
    });
});
