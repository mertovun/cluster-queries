var enStopWords = require('./en-stopwords');

var tokenizer = function(queryList) {
  var tokenList = [];

  queryList.forEach(function(query){
  
    // Tokenize queries into words and form a vocabulary list
    var tokens = query.query_text.split(/[\s*\.*\,\;?\|:\\\[\]\(\)\{\}"]/)
            .filter(function(text){return text.length > 0;})
  
            // Filter out stop words
            .filter(function(text){return !enStopWords.hasOwnProperty(text.toLowerCase());})
            // All words to lowercase
            //.map(function(word){return word.toLowerCase();})
  
            // tokenList item props: word and occurence time
            .map(function(word){return {word:word, time:query.time};});
    
    query.tokens = tokens;
    tokenList = tokenList.concat(tokens);
  });

  console.log(tokenList.length + " words in " + queryList.length + " queries.");

  return tokenList;

}

module.exports = tokenizer;