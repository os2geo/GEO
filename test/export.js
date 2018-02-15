const XLSX = require('xlsx');
const body = require('./import.json')
const path = require('path')
const fs = require('fs')
var ws = {};
var columns = ['_id','_rev'];
var attachments = [];
for (var i = 0; i < body.rows.length; i++) {
    var row = body.rows[i];
    if (row.id.substring(0, 1) !== '_') {
        if (row.doc.hasOwnProperty('properties')) {
            for (var key in row.doc.properties) {
                if (columns.indexOf(key) === -1) {
                    columns.push(key);
                }
            }
        }
    }
}
for (var j = 0; j < columns.length; j++) {
    var cell = {v: columns[j], t:'s' };
    var cell_ref = XLSX.utils.encode_cell({c:j,r:0});
    ws[cell_ref] = cell;
}
var range = {s: {c:0, r:0}, e: {c:columns.length-1, r:body.rows.length }};
for (var R= 1; R <= body.rows.length; R++) {
    var row = body.rows[R-1];
    if (row.id.substring(0, 1) !== '_') {
        for (var C = 0; C < columns.length; C++) {            
            var column = columns[C];
            var cell = {}
            if(C<2) {
                cell.v = row.doc[column]
            } else if (row.doc.hasOwnProperty("properties") && row.doc.properties.hasOwnProperty(column)) {
                cell.v = row.doc.properties[column];
            }
            if(cell.hasOwnProperty('v')){
                if(typeof cell.v === 'number') cell.t = 'n';
                else if(typeof cell.v === 'boolean') cell.t = 'b';
                else cell.t = 's';
                var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
                ws[cell_ref] = cell;
            }
        }
    }
}
ws['!ref'] = XLSX.utils.encode_range(range);
let wb = {
    SheetNames: ['Ark1'],
    Sheets: { Ark1: ws }
}
var filename = path.join(__dirname, 'import.xlsx')
var wopts = { bookType:'xlsx', bookSST:false, type:'buffer' };
var buffer = XLSX.write(wb,wopts);
fs.writeFileSync(filename,buffer)
//XLSX.writeFile(wb, filename);
console.log(filename)