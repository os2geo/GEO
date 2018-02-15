const XLSX = require('xlsx');
const fs = require('fs')
const path = require('path')


var filename = path.join(__dirname, 'import.xlsx')
console.log(filename)
var finalbuffer = fs.readFileSync(filename)
var xlsx = XLSX.read(finalbuffer.toString('base64'), { type: "base64" });
var sheet1 = xlsx.SheetNames[0];
var data = {}
for (var key in xlsx.Sheets[sheet1]) {
    if (key[0] !== '!') {
        var row = key.match(/\d+/g);
        var col = key.match(/[a-zA-Z]+/g);
        if (!data.hasOwnProperty(row)) {
            data[row] = {};
        }
        var cell = xlsx.Sheets[sheet1][key];
        if(cell.hasOwnProperty('v')) {
            data[row][col] = cell.v;
        }
    }
}
var kolonner = data['1'];
var docs = [];
var schema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Projekt",
    "description": "",
    "type": ["object"],
    "properties": {
        "_id": {
            "type": "string"
        },
        "_rev": {
            "type": "string"
        },
        "_revisions": {
            "type": "object",
            "properties": {
                "start": {
                    "type": "integer"
                },
                "ids": {
                    "type": "array"
                }
            }
        },
        "properties": {
            "type": "object",
            "properties": {

            }
        }
    },
    "required": ["properties"]
};
for (var r in data) {
    if (r !== '1') {
        var doc = { properties: {} };
        var row = data[r];
        for (var k in row) {
            var kolonne = kolonner[k];
            if (kolonne === '_id' || kolonne === '_rev') {
                doc[kolonne] = row[k];
            } else {
                doc.properties[kolonne] = row[k];
                schema.properties.properties.properties[kolonne] = {
                    "type": typeof doc.properties[kolonne]
                };
            }
        }
        docs.push(doc);
    }
}
filename = path.join(__dirname, 'export.json')
fs.writeFileSync(filename, JSON.stringify(docs))