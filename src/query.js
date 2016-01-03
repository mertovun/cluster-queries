var queryReader = require('./queryReader.js');


var Query = function(filter) {
  this.list = queryReader(filter);
  this.dictionary = createDictionary(this.list);

  return this;
}

Query.prototype.get = function(string) {
  if (typeof  this.dictionary['_q_' + string] !== 'undefined') {
    //if (this.dictionary['_q_' + string].length>1) {
    //return this.dictionary['_q_' + string].map((i) =>{
    //  return this.list[i];
    //});
    //}
    //else return this.list[this.dictionary['_q_' + string]];
  }
  else return null;
}

Query.prototype.getIndex = function(string) {
  if (typeof  this.dictionary['_q_' + string] !== 'undefined') {
    if (this.dictionary['_q_' + string].length>0) {
      return this.dictionary['_q_' + string].map((i) =>{
        return this.list[i];
      })
    }
    else return this.list[this.dictionary['_q_' + string]];
  }
  else return null;
}

var createDictionary = function(queryList) {
  var queryDictionary = {};

  for (var i = 0;i<queryList.length;i++) {
    if (!queryDictionary["_q_" + queryList[i].query_text]) queryDictionary["_q_" + queryList[i].query_text] = [i];
    else queryDictionary["_q_" + queryList[i].query_text].push(i);
  }

  return queryDictionary;
}




module.exports = Query;