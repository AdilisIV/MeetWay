var express = require('express');
var bodyParser = require('body-parser');
var db = require('./db');
var eventsController = require('./controllers/events');
var path = require('path');
var request = require('request');
var fs = require('fs');
var app = express();
const VK = require('vk-io');
const { RequestError } = require('vk-io/errors'); // Возникает при проблемах в соединении или ответа сервера с ошибкой

const vk = new VK({
    app: 5980502,
    login: 'ilia.fyodoroff@mail.ru',
    pass: 'zxcfghb12QLNkftMGS44078',
    phone: '+79220291925',
    scope: 'stats,notifications,groups,wall,pages,friends,offline,photos,market',
    limit: 2
});

var jquery = require('jquery');
var Nightmare = require('nightmare');
nightmare = Nightmare({ show: true, dock: true });
var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.hour = new schedule.Range(0, 59, 4);


var CitiesID = ['96','1','2','10','37','153','49','60','61','72','73','95','99','104','110','119','123','151','158','133','506'];

var CitiesName = ['Нижний Тагил','Москва','Санкт-Петербург','Волгоград','Владивосток','Хабаровск','Екатеринбург','Казань','Калининград','Краснодар','Красноярск','Нижний Новгород','Новосибирск','Омск','Пермь','Ростов-на-Дону','Самара','Уфа','Челябинск','Сочи', "Санкт-Петербург-506"];

//var ABC = ["в","с","до","от","к","2017","по","и","на","за","для","фестиваль","день","уроки","встреча","отдых","МК","выиграй","спектакль","кубок","приз","репост","ночь","концерт","турнир","розыгрыш","тренинг","интенсив","через","клуб","забег","бизнес","хутор","поход","фитнес","сказка","семинар","выставка"];



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

        db.get().collection('cities').remove({}) // clear collection

        for (var l=0; l<CitiesID.length; l++) {
            request.post({
                url: 'http://localhost/cities',
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
function RemoveDoubleDocuments(c) {
    setTimeout(function () {
        console.log('Запрос на удаление дублей в Mongodb');
        db.get().collection('cityevents').find({"cityid":CitiesID[c]}, { id:1 }).sort({ _id:1 }).forEach(function(doc) {
            db.get().collection('cityevents').remove({
                _id:{$gt:doc._id},
                id: doc.id
            }).catch((err) => { console.error("Ошибка запросе на удаление дублей: ", err); })
        })

        db.get().collection('cityevents').find({"cityid":CitiesID[c]}, { name:1 }).sort({ _id:1 }).forEach(function(doc) {
            db.get().collection('cityevents').remove({
                _id:{$gt:doc._id},
                name: doc.name
            }).catch((err) => { console.error("Ошибка запросе на удаление дублей: ", err); })
        })

    }, 100)
}


function insertDocuments() {
    setTimeout(function () {

        console.log('insertDocuments')

        db.get().collection('cityevents').remove({}) // clear collection

        db.get().collection('cityevents').insert({
            "cityid": "506",
            "id": "27823606",
            "name": "Фестиваль экологии Представь Зелёное: Движение",
            "activity": "21 июл 2017 в 12:00",
            "photo": "https://pp.userapi.com/c840122/v840122433/d956/RjmvJsLopuk.jpg",
            "start": 1500620400,
            "members": 3744,
            "latitude": 59.932378,
            "longitude": 30.321042,
            "description": "Что общего между наукой, искусством, модой, архитектурой, косметикой и едой? Все эти сферы могут быть экологичными - созданными с заботой о природе и человеке. На большом фестивале экологии Представь Зелёное гости смогут:  - Посетить познавательные лекции, эко-маркет, выставки арт-объектов, кинопоказы, спектакли о планете и концерты;  - Поиграть в настольные эко-игры и квесты;  - Поучаствовать в круглых столах, мастер-классах по рециклинг-творчеству и в кулинарных вегетарианских мастер-классах от общественных организаций и заведений города.",
            "screenname": "https://m.vk.com/club27823606"
        })

        db.get().collection('cityevents').insert({
            "cityid": "506",
            "id": "32814569",
            "name": "Интеллигентная барахолка",
            "activity": "21 июл 2017 в 13:00",
            "photo": "https://pp.userapi.com/c836528/v836528609/48605/G4iAW2aXBDM.jpg",
            "start": 1500631200,
            "members": 14795,
            "latitude": 59.92887,
            "longitude": 30.344219,
            "description": "Интеллигентная барахолка – дизайн-маркет с четырехлетней историей, особой атмосферой и непростым характером; большой, нарядный и разношерстный праздник экзальтированных дам, понаехавших денди и петербургских модников.",
            "screenname": "https://m.vk.com/club32814569"
        })

        db.get().collection('cityevents').insert({
            "cityid": "506",
            "id": "150196755",
            "name": "Рисование вином и дегустация. СПБ - 21 июля",
            "activity": "21 июл 2017 в 13:00",
            "photo": "https://pp.userapi.com/c638830/v638830146/4893e/i4-NkrRqsvs.jpg",
            "start": 1500634800,
            "members": 5,
            "latitude": 0,
            "longitude": 0,
            "description": "Новый проект от [club96773634|Студии Рисования&#9679;ZUART&#9679;] и винного клуба [club147593638|ART of Wine]! Арт-дегустация – это новый формат мероприятия, соединяющий в себе живопись и винное искусство. В этот вечер мы продегустируем 3 бутылочки изысканного вина и нарисуем картину вином! Наш проект создан для творческих людей, кто увлекается искусством, современными техниками рисования и кто любит дегустировать эксклюзивные вина или хотел бы научиться в них разбираться.",
            "screenname": "https://m.vk.com/club150196755"
        })

        db.get().collection('cityevents').insert({
            "cityid": "506",
            "id": "78907820",
            "name": "ВЕГАН ФЕСТ | До встречи осенью!",
            "activity": "21 июл 2017 в 14:00",
            "photo": "https://pp.userapi.com/c639828/v639828106/25399/6-1TeHOeUAw.jpg",
            "start": 1500635900,
            "members": 5230,
            "latitude": 59.950767,
            "longitude": 30.245988,
            "description": "– Ваша любимая веганская еда и продукция этичных производителей; – интересные лекции и полезные мастер-классы; – спорт, веселье, игры и общение; – игровая и образовательная программа для деток; – дегустации, конкурсы и подарки! Вход бесплатный!",
            "screenname": "https://m.vk.com/club78907820"
        })
    }, 1000)
}



var func = function (c) {
    return function () {
        for (var j = 0; j<ABC.length; j++) {
            vk.api.groups.search({
                    q: ABC[j],
                    type: 'event',
                    city_id: CitiesID[c],
                    future: 1,
                    offset: 0,
                    count: 1000
                })
                .catch(RequestError,(error) => {
                    console.error(`RequestError error №${error.code} ${error.message}`);
                })
                .catch((error) => {
                    console.error(error);
                })
                .then((group) => {
                    var result = [];
                    console.log('Поиское слово: ', ABC[j]);

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
                    //console.log(result)
                    vk.api.groups.getById({
                            group_ids: result,
                            fields: 'members_count,start_date,activity,place,description'
                        })
                        .catch(RequestError,(error) => {
                            console.error(`RequestError error №${error.code} ${error.message}`);
                        })
                        .catch((error) => {
                            console.error(error);
                        })
                        .then((data) => {
                            var dataObj = JSON.stringify(data);
                            var dataJSON = JSON.parse(dataObj);

                            var id = [];
                            var name = [];
                            var activity = [];
                            var photo = [];
                            var start = [];
                            var members = [];
                            var latitude = [];
                            var longitude = [];
                            var description = [];
                            var screenname = [];

                            for (var i = 0; i < dataJSON.length; i++) {
                                if ((dataJSON[i].members_count > 4) || (dataJSON[i].is_closed == 0)) {
                                    if (dataJSON[i].place) {
                                        latitude.push(dataJSON[i].place.latitude);
                                        longitude.push(dataJSON[i].place.longitude);
                                    } else {
                                        latitude.push(0);
                                        longitude.push(0);
                                    }

                                    if(dataJSON[i].description != "") {
                                        description.push(dataJSON[i].description);
                                    } else {
                                        description.push("Упс, видимо организаторы мероприятия решили не добавлять описание. :(");
                                    }

                                    id.push(dataJSON[i].id);
                                    name.push(dataJSON[i].name);
                                    activity.push(dataJSON[i].activity);
                                    photo.push(dataJSON[i].photo_200);
                                    start.push(dataJSON[i].start_date);
                                    members.push(dataJSON[i].members_count);
                                    screenname.push("https://m.vk.com/club" + dataJSON[i].id);
                                }
                            }

                            for (var l=0; l<id.length; l++) {
                                request.post({
                                    url: 'http://localhost/events/'+CitiesID[c],
                                    form: {
                                        id: id[l],
                                        name: name[l],
                                        activity: activity[l],
                                        photo: photo[l],
                                        start: start[l],
                                        members: members[l],
                                        latitude: latitude[l],
                                        longitude: longitude[l],
                                        description: description[l],
                                        screenname: screenname[l]
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
                        .then(() => {
                            console.log('Параметр "с" перед удалением дублей: ', c);
                            RemoveDoubleDocuments(c);
                        })
                        .catch((error) => {
                            console.error(error);
                        })
                })
                .catch((error) => {
                    console.error(error);
                })
        }
    }
}


//var CitiesID = ['96','1','2','10','37','153','49','60'];
//var CitiesID = ['49'];
var ABC = ["в","с","до","от","фестиваль"];


function StartAPI() {

    setTimeout(function() {
        db.get().collection('cityevents').remove({}) // clear collection
    }, 1000)

    auth.run()
        .then((token) => {
            console.log('User token:', token);
            vk.setToken(token);
        })
        .catch((error) => {
            console.error(error);
        })
        .then(() => {
            for (var c = 0; c<CitiesID.length; c++) {
                setTimeout(func(c), 15000 * c);
            }
        })
}

//schedule.scheduleJob(rule, function(){
//StartAPI();
//});



// Установка списка городов
// Добавлены: Сочи
//setCities();
insertDocuments();




// API methods

app.get('/', function (req, res) {
    res.send("Server started!");
});

app.get('/events', eventsController.all);

app.get('/events/:id', eventsController.findById);

app.get('/events/eventbyid/:id', eventsController.eventById);

app.get('/cities', eventsController.allcities);

app.post('/events/:cityid', eventsController.create);

app.post('/cities', eventsController.createCity);

//app.put('/events/:id', eventsController.update);

//app.delete('/events/:id', eventsController.delete);

app.delete('events/remove', eventsController.deleteDouble);

app.use(function (err, req, res, next)  {
    res.status(err.status || 500);
});

app.on('error', function (message) {
    console.error("[ERROR]: ", message);
});

db.connect("mongodb://localhost:27017/eventsDB", function (err) { // VK_eAPI or test
    if(err) { return console.log(err); }
    app.listen(80, function () {
        console.log("API app started");
    });
});
