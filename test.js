//Opdater fulltext
//app.put('/api/fulltext/:id', auth, function (req, res) {
var nano = require('nano')({
    url: 'http://geo.os2geo.dk/couchdb',
    "parseUrl": false,
    requestDefaults: {
        auth: {
            user: 'admin',
            pass: 'wont775dock'
        }
    }
});
var db_admin = nano.db.use("admin");
var id = '50efa8aeaf1dc77d4906dac5dcd8de18'; //jammerbugt
//var id = '77f7f88f8df24a84717b77babc111df9'; //frederikssund
//var id = '066d1a39335d7a8560f936f75a6de0df'; //helsingør
//var id = '41f5e28b83897e6ecbfe5d0f7f59bcee'; //fredericia
var req = { params: { id: id }, userCtx: { roles: ['sys'] }, body: { sort: "/properties/Temanavn" } };
db_admin.get(req.params.id, function (err, database) {
    if (err) {
        return res.status(err.status_code || 500).send(err);
    }
    if (req.userCtx.roles.indexOf("sys") === -1 && req.userCtx.roles.indexOf("admin_" + database.organization) === -1) {
        return res.status(401).send(JSON.stringify({
            ok: false,
            message: 'Du har ikke rettigheder til at opdatere fulltext.'
        }));
    }
    var d = nano.db.use('db-' + req.params.id);
    d.get('_design/schema', function (err, schema) {
        if (err) {
            return res.status(err.status_code || 500).send(err);
        }
        var m,
            keys = req.body.sort.split('/'),
            item = schema.schema,
            key,
            buildMappings,
            mappings = {};
        keys.splice(0, 1);
        for (m = 0; m < keys.length; m++) {
            key = keys[m];
            if (item.properties && item.properties.hasOwnProperty(key)) {
                item = item.properties[key];
            }
        }
        buildMappings = function (keys) {
            var json = {},
                key = keys[0];
            if (keys.length === 1) {

                json[key] = {
                    type: "string",
                    analyzer: "danish",
                    "index": "analyzed",
                    fields: {
                        raw: {
                            type: "string",
                            index: "not_analyzed"
                        }
                    }
                };
                /*json[key].fields[key] = {
                    type: "string",
                    index: "analyzed"
                };*/
                return json;
            }
            keys.splice(0, 1);
            json[key] = {
                properties: buildMappings(keys)
            };

            return json;
        };

        if (item.type === 'string') {

            mappings["db-" + req.params.id] = {
                "properties": buildMappings(keys)
            };
            mappings["db-" + req.params.id].properties._rev = {
                type: "string",
                index: "no"
            };
        }
        /*console.log(inspect(mappings, {
            depth: null,
            colors: true
        }));*/
        request.del({
            uri: "http://" + config.elasticsearch.host + "/db-" + req.params.id
        }, function (err, response, body) {
            //console.log("del1",err);
            request.del({
                uri: "http://" + config.elasticsearch.host + "/_river/db-" + req.params.id
            }, function (err, response, body) {
                //console.log("del2",err);
                request.post({
                    uri: "http://" + config.elasticsearch.host + "/db-" + req.params.id,
                    json: {
                        mappings: mappings
                    }
                }, function (err, response, body) {
                    if (err) {
                        return res.status(err.status_code || 500).send(err);
                    }
                    var river = {
                        "type": "couchdb",
                        "couchdb": {
                            "host": config.elasticsearch.couchdb.host,
                            "port": config.elasticsearch.couchdb.port,
                            "db": "db-" + req.params.id,
                            "filter": "schema/data"
                        },
                        "index": {
                            "index": "db-" + req.params.id,
                            "type": "db-" + req.params.id,
                            "bulk_size": 100,
                            "bulk_timeout": "10ms"
                        }
                    };
                    request.put({
                        uri: "http://" + config.elasticsearch.host + "/_river/db-" + req.params.id + '/_meta',
                        json: river
                    }, function (err, response, body) {
                        if (err) {
                            return res.status(err.status_code || 500).send(err);
                        }
                        schema.sort = req.body.sort;

                        d.insert(schema, '_design/schema', function (err, body) {
                            if (err) {
                                return res.status(err.status_code || 500).send(err);
                            }
                            res.json(body);
                        });
                    });
                });
            });
        });
    });
});
   // });