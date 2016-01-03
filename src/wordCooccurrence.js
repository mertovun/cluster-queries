
var wordCooccurrence = function() {
  return this;
}


// Compute the co-occurrence matrix in adjacency list form
wordCooccurrence.prototype.compute = function(wordList, t0, cutoff) {

  wordList
    .forEach(function(val,i,list){
      var score;

      // word(i) vs. word(j)
      for (var j = i;j<list.length;j++) {
        var occurrenceLimit = 0;
        if(list[i].occurrence.length>occurrenceLimit && list[j].occurrence.length>occurrenceLimit) {
          score = 0;
          list[i].occurrence.forEach(function(i){
            list[j].occurrence.forEach(function(j){
              var dt = Math.abs(i-j);
              if (dt<=cutoff)
                score += Math.exp(-dt/t0);
            });
          });
          if (score > 0) {
            score /= Math.sqrt(list[i].occurrence.length * list[j].occurrence.length);
  
            list[i].cooccurrence.push({word:list[j].text, score:score});
            if (i!==j) list[j].cooccurrence.push({word:list[i].text, score:score});
          }
        }
      }
      var total = 0; 
      list[i].cooccurrence.forEach(function(val){
        total += val.score;
      });
      
      list[i].cooccurrence
          .sort(function(a,b){return b.score - a.score;})
          .forEach(function(val,i,cooccurrence){
            //cooccurrence[i].score /= total;
          });

      list[i].occurrence = list[i].occurrence.length;

      list[i].cooccurrence.forEach(function(v,k) {
        list[i].cooccurDict['_c_' + v.word] = k;
      });

    });
    
}

module.exports = new wordCooccurrence();