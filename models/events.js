/**
 * Created by user on 3/28/17.
 */
var ObjectID = require('mongodb').ObjectID;
var db = require('../db');

exports.all = function (callback) {
    db.get().collection('cityevents').find().sort({"start": 1}).toArray(function (err, docs) {
        callback(err, docs);
    })
};


exports.findById = function (id, callback) {
    db.get().collection('cityevents').find({ cityid: String(id) }).toArray(function (err, doc) {
        callback(err, doc);
    })
};


exports.create = function (event, callback) {
    db.get().collection('cityevents').insert(
        event,
        function (err, result) {
            callback(err, result);
        })
};


exports.update = function (id, newData, callback) {
    db.get().collection('cityevents').updateOne(
        { _id: ObjectID(id) },
        newData,
        function (err, result) {
            callback(err, result);
        }
    );
};



exports.delete = function (id, callback) {
    db.get().collection('cityevents').deleteOne(
        { _id: ObjectID(id) },
        function (err, result) {
            callback(err, result);
        }
    );
};


exports.deleteDouble = function (callback) {
    db.get().collection('cityevents').find({},
        {id:1}).sort({_id:1}).forEach(function(doc) {
        db.get().collection('cityevents').remove({
            _id:{$gt:doc._id},
            id: doc.id,
            name: doc.name,
            activity: doc.activity,
            photo: doc.photo,
            start: doc.start,
            members: doc.members,
            latitude: doc.latitude,
            longitude: doc.longitude
        });
    })
};