var fs = require('fs');


var querySimilarity = function(query, word, read){

  this.query = query;

  console.log(Object.keys(this.query.dictionary).length + ' distinct queries.');
  if (typeof read !== 'undefined' && typeof read.i !== 'undefined') this.matrix = this.readFile(read.i, read.n);
  else this.matrix = calculate(this.query, word);

  this.matrixDictionary = createMatrixDictionary(this.matrix, this.query);

  this.taskList = this.matrix.slice();

  this.sets = [];
  this.iteration = 0;

  this.threshold = 0;

  return this;
}
var calculate = function(query, word) {
  matrix = [];
  query.list.forEach(function(v,i,list){

    for (var j = i+1;j<list.length;j++) {
      var similarity = 0;
      list[i].tokens.forEach(function(token_i){
        list[j].tokens.forEach(function(token_j) {
          similarity += word.cooccurrence(token_i.word,token_j.word);
        });
      });
      if (similarity>0) matrix.push({
        i:i,
        j:j,
        similarity: similarity
      });
    }
  });
  return matrix.sort(function(a,b){return b.similarity - a.similarity;});
}

var createMatrixDictionary = function(matrix, query) {
  var dictionary = {};
  for (var k = 0;k<matrix.length;k++) {
    var ij = [query.list[matrix[k].i].query_text, query.list[matrix[k].j].query_text];
    ij.sort(function(a,b){return a<b;});
    var key = '_q1_'+ij[0] + '_q2_' + ij[1];
    if (typeof dictionary[key] == 'undefined') dictionary[key] = k;
  }
  return dictionary;
}

querySimilarity.prototype.getSimilarity = function(i,j) {
  var ij = [this.query.list[i].query_text, this.query.list[j].query_text];
  ij.sort((a,b) => {return a<b;});
  var key = '_q1_'+ij[0] + '_q2_' + ij[1];
  var index = this.matrixDictionary[key];
  if (typeof index == 'undefined') return 0;
  else return matrix[index].similarity;
}

querySimilarity.prototype.writeFile = function() {

  if (!fs.existsSync('../results/similarity_'+this.iteration)){
    fs.mkdirSync('../results/similarity_'+this.iteration);
  }
  var partNum = 0;
  var part = [];
  for (var j = 0; j<this.matrix.length;j++) {
    part.push(this.matrix[j]);
    if (j%1000000 === 999999 || j === this.matrix.length - 1) {
      fs.writeFileSync('../results/similarity_'+this.iteration+'/'+partNum+'.json', JSON.stringify(part));
      part = [];
      partNum++;
    }
  }
  var part = [];
}


querySimilarity.prototype.writeClusters = function(clusters) {

  if (!fs.existsSync('../results/clusters')){
    fs.mkdirSync('../results/clusters');
  }
  fs.writeFileSync('../results/clusters/'+this.iteration+'.json', JSON.stringify(clusters));

}


querySimilarity.prototype.readFile = function(i,n) {
  matrix = [];
  var files = fs.readdirSync('../results/similarity_'+i);
  files.forEach((fileName, j) => {
      if(n && j<n) {
        matrix = matrix.concat(JSON.parse(fs.readFileSync('../results/similarity_'+i+'/'+fileName, 'utf8')));
        console.log(fileName);        
      }
      else matrix = matrix.concat(JSON.parse(fs.readFileSync('../results/similarity_'+i+'/'+fileName, 'utf8')));
      //console.log(matrix.length);
  });
  return matrix;
}

querySimilarity.prototype.addSet = function(q) {

  var id = this.sets.length;
  this.query.list[q].set = id;
  this.sets.push(new Set(this.sets.length, q));

  //console.log(this.sets[this.sets.length-1]);

  return this.sets[this.sets.length-1];
}

var Set = function(id, q){
  this.id = id;
  this.queries = [q];

  return this;
}

Set.prototype.addQuery = function(q, query) {
  query.list[q].set = this.id;
  this.queries.push(q);
}

Set.prototype.merge = function(set, query, sets) {
  set.queries.forEach((q,i,queries) => {
    query.list[queries[i]].set = this.id;
  })
  this.queries = this.queries.concat(set.queries);
  sets[set.id] = null;
}

querySimilarity.prototype.iterate = function() {
  var task = this.taskList[this.iteration];
  this.threshold = task.similarity;
  this.process(task);
  this.taskList[this.iteration] = null;
  this.iteration++;
  return this.taskList.length > this.iteration;
}

querySimilarity.prototype.process = function(task){
  var qi = task.i;
  var qj = task.j;
  var similarity = task.similarity;

  var code = 0;

  if (qi instanceof Set) {
    if (this.sets[qi.id] === null) return;
    code+=0;
  }
  else {
    //qi = this.query.list[qi];
    if(this.query.list[qi].set === null) {
      code += 10;
    }
    else {
      code+=20;
    }
  }
  if (qj instanceof Set) {
    if (this.sets[qj.id] === null) return;
    code+=0;
  }
  else {
    //qj = this.query.list[qj];
    if(this.query.list[qj].set === null) {
      code+=1;
    }
    else {
      code+=2;
    }
  }

  // convert to a new task
  if(code === 22 && this.query.list[qi].set !== this.query.list[qj].set) this.addTask(this.sets[this.query.list[qi].set],this.sets[this.query.list[qj].set], similarity);

  else if(code === 20 && this.query.list[qi].set !== qj.id) this.addTask(this.sets[this.query.list[qi].set],qj, similarity);
  else if(code === 21) this.addTask(this.sets[this.query.list[qi].set],qj, similarity);

  else if(code === 2 && this.query.list[qj].set !== qi.id) this.addTask(qi,this.sets[this.query.list[qj].set], similarity);
  else if(code === 12) this.addTask(qi,this.sets[this.query.list[qj].set], similarity);

  // add to existing set;
  else if (code === 0) qi.merge(qj,this.query, this.sets);
  else if (code === 1) qi.addQuery(qj,this.query);
  // form new set
  else if (code === 10) this.addSet(qi).merge(qj,this.query, this.sets);
  else if (code === 11) this.addSet(qi).addQuery(qj,this.query);
}

querySimilarity.prototype.addTask = function(i, j, threshold) {

  var task = {i:i, j:j, similarity:0};
  var qi = task.i;
  var qj = task.j;


  if (!(qi instanceof Set)) qi = {queries:[qi]};
  if (!(qj instanceof Set)) qj = {queries:[qj]};


  qi.queries.forEach(q1 => {
    qj.queries.forEach(q2 => {
      task.similarity += this.getSimilarity(q1,q2);
    }); 
  });
  task.similarity /= (qi.queries.length*qj.queries.length);
  // process now...
  if (task.similarity >= threshold) {
    this.process(task);
  }
  // insert to the sorted taskList
  else {
    //console.log('newTask: ');
    //console.log(task);
    var index = insertSorted( this.taskList,  task, function(a,b) { return b.similarity-a.similarity;},this.iteration);
    //this.taskList.splice(index,0,task);
  }

}

var insertSorted = function(arr, item, comparator, from, to) {
    if (comparator == null) {
        comparator = function(a, b) {
            if (typeof a !== 'string') a = String(a);
            if (typeof b !== 'string') b = String(b);
            return (a > b ? 1 : (a < b ? -1 : 0));
        };
    }

    var min = from || 0;
    var max = to || arr.length;
    var index = Math.floor((min + max) / 2);
    while (max > min) {
        if (comparator(item, arr[index]) < 0) {
            max = index;
        } else {
            min = index + 1;
        }
        index = Math.floor((min + max) / 2);
    }
    arr.splice(index, 0, item);
};


module.exports = querySimilarity;