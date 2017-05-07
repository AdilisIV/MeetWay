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
var Nightmare = require('nightmare');
nightmare = Nightmare({ show: true, dock: true });

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

function parseDataFromSite(c) {
    return function () {
        nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3')
            .wait(2000)
            .inject('js', './jquery_v1_10_2.js')
            .wait(2000)
            .scrollTo(9999999999999999999999999999999,0)
            .wait(5000)
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
                    console.info(result);
                    vk.api.groups.getById({
                            group_ids: result,
                            fields: 'members_count,start_date,activity,place'
                        })
                        .then((data) => {
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

                        })
                })
            })
            .catch((error) => {
                console.error(error);
            });
    }
}


setTimeout(parseDataFromSite(0), 3500*(1)); // Сбор, сортировка, запись


db.connect("mongodb://localhost:27017/VK_eAPI", function (err) { // VK_eAPI or test
    if(err) { return console.log(err); }
    app.listen(1337, function () {
        console.log("API app started");
    });
});

// .cookies.set({
//     _ym_uid: '1480693391430570032',
//     remixdt: '7200',
//     remixflash: '25.0.0',
//     remixlang: '0',
//     remixlhk: 'b2bb8ecdcf35e20998',
//     remixmdevice: '1366/768/1/!!-!!!!',
//     remixrefkey: 'e6183419d1c7983866',
//     remixscreen_depth: '24',
//     remixseenads: '0',
//     remixsid: 'ba872a5f3cb886f2d96ed73397c6c6e68c7d44a3aa27f4bc49ec1',
//     remixsslsid: '1',
//     remixstid: '1027994728_432392ce1cfdbbb4cb',
//     remixvkcom:	'1'
// })