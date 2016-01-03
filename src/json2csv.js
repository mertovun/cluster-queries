var fs = require('fs');

var Query = require('./query');

var query = new Query();

query.list.forEach(function(q,i,list){
    delete list[i].set;
});

function ConvertToCSV(array) {
    var str = '';

    for (key in array[0]) {
      str += '"'+key+'",';
    }
    str +='\r\n'

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {

            line += '"'+array[i][index].toString().replace(/"/g,'\\"')+'",';
        }

        str += line + '\r\n';
    }
    str = str.replace(/,\r\n/g,'\r\n');
    return str;
}

var csv = ConvertToCSV(query.list);

console.log(csv);

fs.writeFileSync("../results/queries.csv", csv);