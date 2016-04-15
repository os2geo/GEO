/*global require, console,process*/
var config = require('./config.json');
var bigcouch = require('nano')({
    url: 'http://localhost:5984',
    requestDefaults: {
        auth: {
            user: config.couchdb.user,
            pass: config.couchdb.password
        }
    }
});
var couchdb = require('nano')({
    url: 'http://couchdb:5984',
    requestDefaults: {
        auth: {
            user: config.couchdb.user,
            pass: config.couchdb.password
        }
    }
});
var all_dbs = [];
var replicate = function () {
    if (all_dbs.length > 0) {
        var db = all_dbs.pop();
        console.log(db);

        couchdb.db.replicate('http://' + config.couchdb.user + ':' + config.couchdb.password + '@bigcouch:5984/' + db, db {
            create_target: true
        }, function (err, body) {
            if (err) {
                console.log(err);
            } else {
                console.log(body);
            }
            replicate();
        });


    }
};
bigcouch.db.get('_all_dbs', function (err, body) {
    all_dbs = body;
    replicate();
});
