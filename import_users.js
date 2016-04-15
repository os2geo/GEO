/*global require, console,process*/
var config = require('./config.json');
var bigcouch = require('nano')({
    url: 'http://localhost:5986',
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
var bigcouch_users = bigcouch.use('_users');
var couchdb_users = couchdb.use('_users');
var users = [];
var insert = function () {
    if (users.length > 0) {
        var row = users.pop();
        var doc = row.doc;
        couchdb_users.get(doc._id, function (err, body) {
            if (err) {
                delete doc._rev;
                couchdb_users.insert(doc, doc._id, function (err, body) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(body);
                    }
                    insert();
                });
            } else {
                insert();
            }
        });
    }
};
bigcouch_users.list({
    include_docs: true
}, function (err, body) {
    users = body.rows;
    insert();
});
