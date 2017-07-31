/**
 * Created by user on 3/28/17.
 */
var MongoClient = require('mongodb').MongoClient;

var state = {
    db: null
};

exports.connect = function (url, done) {
    if (state.db) {
        return done();
    }

    const serverOptions = {
        poolSize: 100,
        autoReconnect: true,
        socketTimeoutMS: 120000,
        keepAlive: 30000,
        promiseLibrary: Promise
    };

    MongoClient.connect(url, serverOptions, function (err, db) {
        if (err) {
            return done(err);
        }
        state.db = db;
        done();
    });
};

exports.get = function () {
    return state.db;
};

//# sourceMappingURL=db-compiled.js.map