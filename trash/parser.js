var express = require('express');
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
nightmare = Nightmare();
//var ABC = ["в","с","до","от","2017","по","на","за","для","фестиваль","день","уроки","встреча","отдых","МК"];
var groupID = [];
var groupName = [];
var groupActivity = [];
var groupPhoto = [];
var groupStartdate= [];
var groupLatitude = [];
var groupLongitude = [];

var CitiesID = ['96'];
var ABC = ["в"];






//в,с,до,от,2017,по,на,за,для,фестиваль,день,уроки,встреча,отдых,МК

const auth = vk.auth.standalone();

function arrayUnique(arr){
    return arr.filter((e,i,a)=>a.indexOf(e)==i)
}
function compareStart(eventA, eventB) {
    return eventA.start - eventB.start;
}

function parseDataFromSite(c) {
    return function () {
        nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3')
            .wait(2000) // c
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
                        })
                })
            })
            .then(function (events) { // запись в базу данных с сайта
                for (var i=0; i<events.length; i++) {
                    console.log(events[i].name);
                }
                //console.log(groupPhoto);
            })
    }
}














function parseDataAndRecord(j,c) {
    return function () {
        nightmare.goto('https://vk.com/search?c%5Bcity%5D=' + CitiesID[c] + '&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3')
            .wait(2000) // c
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
                        })
                })
            })
            .then(function (events) { // запись в базу данных с сайта
                for (var i=0; i<events.length; i++) {
                    console.log(events[i].name);
                }
                //console.log(groupPhoto);
            })
            // конец парсера начало API
            .then(function () {
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
                                return result;
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

                                            var gID = [];
                                            var gName = [];
                                            var gActivity = [];
                                            var gPhoto = [];
                                            var gStartdate = [];
                                            var gLatitude = [];
                                            var gLongitude = [];

                                            var dataObj = JSON.stringify(data);
                                            var dataJSON = JSON.parse(dataObj);
                                            for (var i = 0; i < dataJSON.length; i++) {
                                                gID.push(dataJSON[i].id);
                                                var place = dataJSON[i].place;
                                                if (place) {
                                                    gLatitude.push(dataJSON[i].place.latitude);
                                                    gLongitude.push(dataJSON[i].place.longitude);
                                                } else {
                                                    gLatitude.push('Адрес неизвестен');
                                                    gLongitude.push('Адрес неизвестен');
                                                }
                                                gName.push(dataJSON[i].name);
                                                gActivity.push(dataJSON[i].activity);
                                                gPhoto.push(dataJSON[i].photo_200);
                                                gStartdate.push(dataJSON[i].start_date);
                                            }

                                            resolve(gStartdate);
                                        })
                                })
                            })
                            .then(function (res) {
                                console.log(res); // запись в базу данных с API
                            })
                    })
            })
            .catch(error => console.error(error))
    }
}




for (var c = 0; c<CitiesID.length; c++) { // цикл для сбора данных по всем городам
    for (var j = 0; j<ABC.length; j++) { // цикл для сбора данных по всем поисковым словам
        setTimeout(parseDataAndRecord(j,c), 4000*(j+1)); // Groups.search
    }
}
//parseDataFromSite();


/*auth.run()
 .then((token) => {
 console.log('User token:',token);
 vk.setToken(token);

 vk.api.groups.getById({
 group_ids: '137040892,145368412,121232062,140933197,139631659,100506804,135759889',
 fields: 'members_count,start_date,activity,place'
 })
 .then((data) => {
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
 })
 })
 .catch((error) => {
 console.error(error);
 });*/



/*auth.run()
 .then((token) => {
 console.log('User token:',token);
 vk.setToken(token);

 vk.api.database.getCities({
 country_id: 1
 })
 .then((cities) => {
 var citiesObj = JSON.stringify(cities);
 var citiesJSON = JSON.parse(citiesObj);
 for (var i = 0; i < citiesJSON.items.length; i++) {
 result.push(citiesJSON.items[i].id)
 }
 console.log(result);
 })
 .catch((error) => {
 console.error(error);
 });

 })
 .catch((error) => {
 console.error(error);
 });*/



/*for(var i = 0; i < 10; i++) {
 setTimeout(LogMe(i), 1000*(i+1)); //получим функцию
 } //видимо хочется не всё сразу через 1 секунду выполнить,
 // а по одному разу за 1 секунду (последний console.log() через 10 секунд)

 function LogMe(i){ //т.к. i объявлена здесь (в аргументе это всё равно что объявление var),
 //то она больше не будет ссылкой на i из цикла
 //эта области видимости отправится  к мусорщику сразу после выполнения следующей функции
 return function() {     //вернем новую функцию со своей областью видимости.
 console.log(i);
 };
 }*/

/*function Person() {
 // Конструктор Person() определяет `this` как экземпляр самого себя.
 this.age = 0;

 setInterval(function growUp() {
 // Без использования `use strict`, функция growUp() определяет `this`
 // как глобальный объект, который отличается от `this`,
 // определённого конструктором Person().
 this.age++;
 }, 1000);
 }
 var p = new Person();
 console.log(p);*/

