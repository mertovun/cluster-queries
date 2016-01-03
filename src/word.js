var fs = require('fs');
var tokenizer = require('./tokenizer');

var Word = function(queryList) {

  this.dictionary = createDictionary(queryList);
  this.list = createList(this.dictionary);

  return this;
}

Word.prototype.get = function(string) {
  if (typeof this.dictionary['_w_' + string] !== 'undefined') {
    return this.list[this.dictionary['_w_' + string]];
  }
  else return null;
}

Word.prototype.getIndex = function(string) {
  if (this.dictionary['_w_' + string]) {
    return this.dictionary['_w_' + string];
  }
  else return null;
}

Word.prototype.cooccurrence = function(word1,word2) {
  var parent = this.get(word1);
  if (parent) {
    if (typeof parent.cooccurDict['_c_'+word2] !== 'undefined')
      return parent.cooccurrence[parent.cooccurDict['_c_'+word2]].score;
    else return 0;
  }
  else {
    console.log(word1);
    throw 'No Such Word';
  }
}

Word.prototype.writeFile = function() {
  fs.writeFileSync('../results/word.json', JSON.stringify({dictionary:this.dictionary,list:this.list}));
}

Word.prototype.readFile = function() {
  word = JSON.parse(fs.readFileSync('../results/word.json'));
  this.list = word.list;
  this.dictonary = word.dictionary;
}

var createDictionary = function(queryList) {
  var dictionary = {};

  tokenizer(queryList).forEach(function(token){
    if(token.word.length > 0 ) {
      typeof dictionary["_w_"+token.word] !== 'undefined' ? (dictionary["_w_"+token.word]).push(token.time) : dictionary["_w_"+token.word]=[token.time];
    }
  });  

  return dictionary;

}

var createList = function(dictionary) {
  var wordList = Object.keys(dictionary)
    .map(function(val){ return {text:val.substring(3), occurrence:dictionary[val], cooccurrence:[], cooccurDict:{} };})
    // Sort by word count
    .sort(function(a,b){return b.occurrence.length - a.occurrence.length;})
    ;

  console.log(wordList.length + " distinct words.");

  for (var i = 0;i<wordList.length;i++) {
    dictionary["_w_" + wordList[i].text] = i;
  }

  return wordList;
}

module.exports = Word;