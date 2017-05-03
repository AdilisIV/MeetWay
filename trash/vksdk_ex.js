var VK = require('vksdk');
var vk = new VK({
    'appId': 5980502,
    'appSecret': '56MUqOcp0f4XMzEIwoaF', // 45e0e76c9a94f6744d // 56MUqOcp0f4XMzEIwoaF
    'language': 'ru',
    'mode': 'auth'
});
vk.setToken('794cf59ce9dfd15743138040a315bc9d507eaf4ccf8f4fed7b05e9a9da53979d8f407ddb00cb284d2a5fb');

vk.request('groups.search', {
    'q': 'в',
    'type': 'event',
    'city_id': '69',
    'future': '1',
    'offset': '0',
    'count': '1000'
});
vk.on('done:groups.search', function(res) {
    console.log(res);
});



var ABC = ["в","с","до","от","2017","по","на","за","для","фестиваль","день","уроки","встреча","отдых","МК"];

/*for(i=1; i<=ABC.count; i++) {
 vk.request('groups.search', {
 'q': 'в',
 'type': 'event',
 'city_id': '69',
 'future': 1,
 'offset': 0,
 'count': 1000
 });
 vk.on('done:groups.search', function(res) {
 console.log(res);
 });
 }*/






/*
 nightmare.goto('https://vk.com/search?c%5Bcity%5D=1&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3')
 .wait(2000)
 .inject('js', './jquery_v1_10_2.js')
 .wait(2000)
 //.scrollTo(999999999999999999999999999,0)
 //.wait(5000)
 .evaluate(function () {
 var shortNames = [];
 $('.labeled.title a').each(function () {
 item = {}
 //item['title'] = $(this).text()
 item['link'] = $(this).attr('href');
 $.trim(item['link']);
 item['link'] = item['link'].replace('/','');
 item['link'] = item['link'].replace('event','');
 shortNames.push(item)
 })
 return shortNames
 })
 .end()
 .then(function (result) {
 for (name in result) {
 request.post({url: 'http://localhost:3012/events/96', form: {name: result[name].link}}, function (err, res, body) {
 if (err) {
 console.log(err);
 } else if (body) {
 console.log(body);
 }
 });
 //console.log(result[name].link)
 //console.log('\n')
 }
 });
 */






/*var destination = fs.createWriteStream('./downloads/google.html');
 var url = "http://google.com";
 request(url)
 .pipe(destination);*/


/*var destination = fs.createWriteStream('./downloads/google2.html');
 var url = "http://google.com";
 request(url)
 .pipe(destination)
 .on('finish', function () {
 console.log(done);
 })
 .on('error', function (err) {
 console.log(err);
 });
 */

/*
 var website_url = "https://vk.com/search?c%5Bcity%5D=1&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3";
 request({
 uri: website_url,
 method:'POST',
 encoding:'binary'
 }, function (error, response, html) {
 if (!error && response.statusCode == 200) {
 var $ = cheerio.load(html);
 $('.labeled.title').each(function(i, elem){
 var a = $(this).children();
 var url = a.attr('href');
 console.log(url);
 console.log(i);
 });
 } else if (error) {
 console.log(error);
 }
 });
 */


nightmare.goto('https://vk.com/search?c%5Bcity%5D=1&c%5Bcountry%5D=1&c%5Bsection%5D=communities&c%5Bskip_catalog%5D=1&c%5Btype%5D=3')
    .wait(2000)
    .inject('js', './jquery_v1_10_2.js')
    .wait(2000)
    //.scrollTo(999999999999999999999999999,0)
    //.wait(5000)
    .evaluate(function () {
        var shortNames = [];
        $('.labeled.title a').each(function () {
            item = {}
            //item['title'] = $(this).text()
            item['link'] = $(this).attr('href');
            $.trim(item['link']);
            item['link'] = item['link'].replace('/','');
            item['link'] = item['link'].replace('event','');
            shortNames.push(item)
        })
        return shortNames
    })
    .end()
    .then(function (result) {
        for (name in result) {
            request.post({url: 'http://localhost:3012/events/96', form: {name: result[name].link}}, function (err, res, body) {
                if (err) {
                    console.log(err);
                } else if (body) {
                    console.log(body);
                }
            });
            //console.log(result[name].link)
            //console.log('\n')
        }
    });



/*vk.api.groups.search({
 q: 'в',
 type: 'event',
 city_id: 12,
 future: 1,
 offset: 0,
 count: 1000
 })
 .then((group) => {
 console.log('Group: ', group);

 var groupObj = JSON.stringify(group);
 var groupJSON = JSON.parse(groupObj);
 console.log('Длинна groupJSON: ', groupJSON.items.length);
 for (var i = 0; i < groupJSON.items.length; i++) {
 //console.log(group.items[i].id);
 result.push(groupJSON.items[i].id)
 }
 console.log(ABC[0]);
 console.log(result.length);
 })
 .catch((error) => {
 console.error(error);
 });*/