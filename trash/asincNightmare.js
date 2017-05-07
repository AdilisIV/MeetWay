var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var db = require('./../db');
//var eventsController = require('./../controllers/events');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
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


var groupID = [];
var groupName = [];
var groupActivity = [];
var groupMembers = [];
var groupPhoto = [];
var groupStartdate= [];
var groupLatitude = [];
var groupLongitude = [];
var eventsArr = [];

var CitiesID = ['96'];
var ABC = ["в", "c"];


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

function RemoveDoubleRequest(c) {
    setTimeout(function () {
        console.log('Запрос на удаление дублей в Mongodb');
        db.get().collection('cityevents').find({"cityid":CitiesID[c]}, {id:1}).sort({_id:1}).forEach(function(doc) {
            db.get().collection('cityevents').remove({
                _id:{$gt:doc._id},
                id: doc.id
            })
        });

    }, 500)
}

var Nightmare = require('nightmare');
var vo = require('vo');
var nightmare = Nightmare({ show: true, dock: true });

var email = 'ilia.fyodoroff@mail.ru';
var password = 'zxcfghb12QLNkftMGS44078';



var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.minute = new schedule.Range(0, 59, 3);


function asyncNightmare() {

    var urls = [
        'https://vk.com/search?c%5Bcity%5D=96&c%5Bcountry%5D=1&c%5Bnot_safe%5D=1&c%5Bsection%5D=communities&c%5Btype%5D=3',
        'https://vk.com/search?c%5Bcity%5D=49&c%5Bcountry%5D=1&c%5Bnot_safe%5D=1&c%5Bsection%5D=communities&c%5Btype%5D=3',
        'https://vk.com/search?c%5Bcity%5D=153&c%5Bcountry%5D=1&c%5Bnot_safe%5D=1&c%5Bsection%5D=communities&c%5Btype%5D=3'
    ];
    urls.reduce(function(accumulator, url) {
        return accumulator.then(function(results) {
            return nightmare.goto(url)
                .wait('body')
                .wait(15000)
                //.title()
                .inject('js', './../jquery_v1_10_2.js')
                .wait(1500)
                .inject('js', './../scrollAnimate.js')
                .wait(15000)
                // .then(function(result){
                //     results.push(result);
                //     return results;
                // });
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
                .then(function (result) {
                    return new Promise(function (resolve, reject) {
                        console.info('Result (nightmare по городу): ',result);
                        vk.api.groups.getById({
                                group_ids: result,
                                fields: 'members_count,start_date,activity,place'
                            })
                            .then((data) => {
                                //console.log(data);

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
                                        console.info('Частное сообщество');
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
                                            console.log(body);
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
                    // if (error.statusCode == 404) {
                    //     parseDataFromSite(c);
                    // }
                })
        });
    }, Promise.resolve([])).then(function(results){
        console.dir(results);
    });
}


function login() {
    nightmare
        .goto('https://vk.com/login')
        .wait(1000)
        .type('form [name=email]', email)
        .click('input#pass')
        .type('input#pass', password)
        .click('button#login_button')
        .wait(4000);
}



schedule.scheduleJob(rule, function(){
    asyncNightmare();
});










db.connect("mongodb://localhost:27017/VK_eAPI", function (err) { // VK_eAPI or test
    if(err) { return console.log(err); }
    app.listen(1337, function () {
        console.log("API app started");
    });
});