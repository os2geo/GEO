/*global require, console,process*/
var config = require('./config.json');
var nano = require('nano')({
    url: 'http://localhost:5986',
    requestDefaults: {
        auth: {
            user: config.couchdb.user,
            pass: config.couchdb.password
        }
    }
});
var db = nano.use('_users');
db.list({
    include_docs: true
}, function (err, body) {
    body.rows.forEach(function(doc){
        console.log(doc);
    });    
});
