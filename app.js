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
var Block = require("control-block").Block;
var http = require("http");

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
rule.hour = new schedule.Range(0, 59, 7);


var CitiesID = ['1','2','49','96','10','37','153','60','61','72','73','95','99','104','110','119','123','151','158','133'];

var CitiesName = ['Москва','Санкт-Петербург','Екатеринбург','Нижний Тагил','Волгоград','Владивосток','Хабаровск','Казань','Калининград','Краснодар','Красноярск','Нижний Новгород','Новосибирск','Омск','Пермь','Ростов-на-Дону','Самара','Уфа','Челябинск','Сочи'];

var ABC = ["в","с","до","от","к","по","и","на","за","для","фестиваль","МК","приз","ночь","концерт","розыгрыш","интенсив","через","забег","поход","фитнес","семинар","выставка"];


app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
const auth = vk.auth.standalone();


function arrayUnique(arr){
    return arr.filter((e,i,a)=>a.indexOf(e)==i)
}
function compareStart(eventA, eventB) {
    return eventA.start - eventB.start;
}
function copyDataFromBuffer() {
    setTimeout(function () {
        console.log("copyDataFromBuffer: copyDataFromBuffer");

        db.get().collection('cityevents').remove({})
        var documentsToMove = db.get().collection('buffercollection').find({});
        documentsToMove.forEach(function (doc) {
            db.get().collection('cityevents').insertOne(doc)
        })
    }, 500)
}




function setCities() {
    setTimeout(function(){

        db.get().collection('cities').remove({}, function (err, result) {
            if (err) {
                console.log(err)
            }
        }); // clear collection

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
        db.get().collection('buffercollection').find({"cityid":CitiesID[c]}, { id:1 }).sort({ _id:1 }).forEach(function(doc) {
            db.get().collection('buffercollection').remove({
                _id:{$gt:doc._id},
                id: doc.id
            },
            function (err, result) {
                if (err) {
                    console.log(err)
                }
            })
        })

        db.get().collection('buffercollection').find({"cityid":CitiesID[c]}, { name:1 }).sort({ _id:1 }).forEach(function(doc) {
            db.get().collection('buffercollection').remove({
                _id:{$gt:doc._id},
                name: doc.name
            },
            function (err, result) {
                if (err) {
                    console.log(err)
                }
            })
        })

    }, 100)
}



var func = function (c) {
    db.get().close();
    db.get().open();
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
                    try {
                        var groupObj = JSON.stringify(group);
                    } catch(err) { console.error("JSON.stringify error: ", err); }

                    try {
                        var groupJSON = JSON.parse(groupObj);
                    } catch(err) { console.error("JSON.parse error: ", err); }

                    for (var i = 0; i < groupJSON.items.length; i++) {
                        result.push(groupJSON.items[i].screen_name); // все id по словарю для заданного города
                    }
                    result = arrayUnique(result); // удаляем дублирующиеся данные
                    result = result.join(',');

                    return result;
                })
                .then(function (result) {
                    if (result == []) {
                        console.log("Мероприятия по запросу отсутствуют!")
                    } else {
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
                                try {
                                    var dataObj = JSON.stringify(data);
                                } catch(err) { console.error("JSON.stringify error: ", err); }
                                try {
                                    var dataJSON = JSON.parse(dataObj);
                                } catch(err) {
                                    console.error("JSON.parse error: ", err);
                                }

                                var screenname;
                                var latitude;
                                var longitude;

                                var eventObject;

                                for (var i = 0; i < dataJSON.length; i++) {
                                    if ((dataJSON[i].members_count > 4) || (dataJSON[i].is_closed == 0)) {
                                        if (!dataJSON[i].place) {
                                            latitude = 0;
                                            longitude = 0;
                                        } else {
                                            latitude = dataJSON[i].place.latitude;
                                            longitude = dataJSON[i].place.longitude;
                                        }

                                        if (dataJSON[i].description == "") {
                                            dataJSON[i].description = "Упс, видимо организаторы мероприятия решили не добавлять описание. :(";
                                        }

                                        screenname = "https://m.vk.com/club" + dataJSON[i].id;

                                        eventObject = {
                                            cityid: CitiesID[c],
                                            id: dataJSON[i].id,
                                            name: dataJSON[i].name,
                                            activity: dataJSON[i].activity,
                                            photo: dataJSON[i].photo_200,
                                            start: dataJSON[i].start_date,
                                            members: Number(dataJSON[i].members_count),
                                            latitude: latitude,
                                            longitude: longitude,
                                            description: dataJSON[i].description,
                                            screenname: screenname,
                                            commerce: false
                                        };


                                        var req = request.post({
                                            url: 'http://localhost:1337/events',
                                            form: {
                                                cityid: eventObject.cityid,
                                                id: eventObject.id,
                                                name: eventObject.name,
                                                activity: eventObject.activity,
                                                photo: eventObject.photo,
                                                start: eventObject.start,
                                                members: eventObject.members,
                                                latitude: eventObject.latitude,
                                                longitude: eventObject.longitude,
                                                description: eventObject.description,
                                                screenname: eventObject.screenname,
                                                commerce: eventObject.commerce
                                            }
                                        }, function (err, res, body) {
                                            if (err) {
                                                console.log(err);
                                            } else if (body) {
                                                //console.log(body);
                                            }
                                        });
                                        req.on('error', function () {
                                            //Block.errorHandler();
                                            console.error("request.post error!");
                                        });
                                        process.on('uncaughtException', function (err) {
                                            console.log("Тот самый uncaughtException !!!");
                                            console.error(err.stack);
                                            //process.exit();
                                        });


                                    }
                                }
                            })
                            .then(() => {
                                console.log('Параметр "с" перед удалением дублей: ', c);
                                RemoveDoubleDocuments(c);
                            })
                            .catch((error) => {
                                console.error(error);
                            })
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
        }
    }
}


//var CitiesID = ['96'];
//var ABC = ["в", "с", "за", "на"];


function StartAPI() {

    setTimeout(function() {
        db.get().collection('buffercollection').removeMany(
            {},
            function (err, result) {
                if (err) {
                    console.log(err);
                }
            }
        )
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
                setTimeout(func(c), 80000 * c);
            }
        })
}





//schedule.scheduleJob(rule, function(){
    StartAPI();
//});



// Установка списка городов
// Добавлены: Сочи-153
//setCities();
//insertDocuments();
//copyDataFromBuffer();




// API methods

app.get('/', function (req, res) {
    res.send("Server started!");
});

app.get('/events', eventsController.all);

app.get('/events/:id', eventsController.findById);

app.get('/events/eventbyid/:id', eventsController.eventById);

app.get('/cities', eventsController.allcities);

app.get('/events/eventsByTime/:cityid/:x/:y', eventsController.eventsByTime);

app.post('/events', eventsController.create);

app.post('/cities', eventsController.createCity);

app.put('/events/eventbyid/:id', eventsController.update);

app.delete('/events/:id', eventsController.delete);

app.delete('events/remove', eventsController.deleteDouble);




var exit = function exit() {
    setTimeout(function () {
        process.exit(1);
    }, 0);
};

app.use(function (error, req, res, next) {
    if (error.status === 400) {
        console.info(error.body);
        return res.send(400);
    }

    console.error(error);
    exit();
});

app.on('error', function (message) {
    console.error("[ERROR]: ", message);
});

app.setMaxListeners(1000);

db.connect("mongodb://localhost:27017/eventsDB", function (err) { // VK_eAPI or test
    if(err) { return console.log(err); }
    app.listen(1337, function () {
        console.log("API app started");
    });
});
