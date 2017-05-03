/**
 * Created by user on 4/19/17.
 */
const VK = require('vk-io');
const vk = new VK({
    app: 5980502,
    login: 'ilia.fyodoroff@mail.ru',
    pass: 'zxcfghb12QLNkftMGS44078',
    phone: '+79220291925',
    scope: 'stats,notifications,groups,wall,pages,friends,offline,photos,market'
});
var ABC = ["в","с","до","от","2017","по","на","за","для","фестиваль","день","уроки","встреча","отдых","МК"];
//var CitiesID = [96, 1, 2, 10, 37, 153, 49, 60, 61, 72, 73, 95, 99, 104, 110, 119, 123, 151, 158];
//var CitiesID = ['96','1','2','10','37','153','49','60','61','72','73','95','99','104','110','119','123','151','158'];
var CitiesID = ['96'];
var result = [];

exports.tryGetGroupViaApi = function (j, c) {
    return function () {
        console.log('Счетчик слов: ', j);
        console.log('Счетчик городов: ', c);
        vk.api.groups.search({
                q: ABC[j],
                type: 'event',
                city_id: CitiesID[c],
                future: 1,
                offset: 0,
                count: 1000
            })
            .then((group) => {
                console.log('Первое поиское слово: ', ABC[j]);
                //console.log('Groups:', group)
                var groupObj = JSON.stringify(group);
                var groupJSON = JSON.parse(groupObj);
                for (var i = 0; i < groupJSON.items.length; i++) {
                    result.push(groupJSON.items[i].id)
                }
                // delete duplicate
                result = arrayUnique(result);
                for (var i = 0; i < groupJSON.items.length; i++) {
                    request.post({url: 'http://localhost:3012/events/'+CitiesID[c], form: {name: groupJSON.items[i].id}}, function (err, res, body) {
                        if (err) {
                            console.log(err);
                        } else if (body) {
                            console.log(body);
                        }
                    });
                }
                console.log(ABC[j]);
                console.log(result.length);
            })
            .catch((error) => {
                console.error(error);
            });
    };
}