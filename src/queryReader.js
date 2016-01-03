var fs =require('fs');

var readDirectory = function(path) {
  return  fs.readdirSync(path);
}

var queryReader = function(filter) {
  var queryList = [];
  console.log("reading...");
  var files = readDirectory('../query-files');
  files.forEach(function(fileName,i){
    if (filter) {
      if (filter(fileName,i, files.length)) {
        queryList = queryList.concat(JSON.parse(fs.readFileSync('../query-files/'+fileName, 'utf8')).event);
        console.log(fileName);
      } 
    }
    else {
      queryList = queryList.concat(JSON.parse(fs.readFileSync('../query-files/'+fileName, 'utf8')).event);
      console.log(fileName);
    }
  });
  return queryList.map(function(item){
      return {query_text:item.query.query_text, time:item.query.id[0].timestamp_usec/1000, set:null};
    });
}

module.exports = queryReader;