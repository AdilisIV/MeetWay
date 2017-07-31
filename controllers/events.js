var Events = require('../models/events');
var db = require('../db');

exports.all = function (req, res) {
    Events.all(function (err, docs) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(docs);
    })
};


exports.allcities = function (req, res) {
    Events.allcities(function (err, docs) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(docs);
    })
};


exports.findById = function (req, res) {
    Events.findById(req.params.id, function (err, doc) {
        if  (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    })
};


exports.eventById = function (req, res) {
    Events.eventById(req.params.id, function (err, doc) {
        if  (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    })
};


exports.eventsByTime = function (req, res) {
    Events.eventsByTime(req.params.cityid, req.params.x, req.params.y, function (err, doc) {
        if  (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(doc);
    })
};


exports.create = function (req, res) {
    console.log("HUUUUUUUUUUUUUUUUUUUUY!!!")
    var event = {
        cityid: req.body.cityid,
        id: req.body.id,
        name: req.body.name,
        activity: req.body.activity,
        photo: req.body.photo,
        start: Number(req.body.start),
        members: Number(req.body.members),
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude),
        description: req.body.description,
        screenname: req.body.screenname,
	    commerce: false
    };

    Events.create(event, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(event);
    })
};


exports.superCreate = function (req, res) {

    var event = req.body.eventarr;
    //console.log(event);

    Events.superCreate(event, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(event);
    })
};


exports.createCity = function (req, res) {
    var city = {
        id: req.body.id,
        name: req.body.name
    };

    Events.createCity(city, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.send(city);
    })
};


exports.update = function (req, res) {
    Events.update(req.params.id, { $set: {commerce: req.body.commerce} },
        function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.sendStatus(200);
    })
};

exports.delete = function (req, res) {
    Events.delete(req.params.id, function (err, result) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.sendStatus(200);
    })
};


exports.deleteDouble = function (req, res) {
    Events.deleteDouble();
};