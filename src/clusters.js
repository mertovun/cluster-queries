var fs = require('fs');

var Query = require('./query');
var Word = require('./word');
var cooccurrence = require('./wordCooccurrence');
var QuerySimilarity = require('./querySimilarity');

var query = new Query();
var queryList = query.list;
var word = new Word(query.list);
var wordList = word.list;
word.readFile();
var qs = new QuerySimilarity(query,word, {i:0});




var clusterEvolution = [];

var dictionary = {};

var root = {
  name:"root",
  parent: null,
  children:{
    clusters: [],
    queries:[]
  }
};

var Query = function(id, name) {
  this.id = id;
  this.name = name;
  return this;
}

var Cluster = function(id, parent, children, similarity, firstSeen) {
  this.id = id;

  this.parent = parent;
  this.children = children;
  this.similarity = similarity;
  this.firstSeen = firstSeen;

  dictionary[id] = this;
}

var loadClusterEvolution = function() {

  var files = fs.readdirSync('../results/clusters');
  files.sort(function(a,b){return parseInt(a.substr(0,a.length-5))-parseInt(b.substr(0,b.length-5));});
  files.forEach(function(fileName,i){
    var clusterList = JSON.parse(fs.readFileSync('../results/clusters/'+fileName, 'utf8'));
    clusterEvolution = clusterEvolution.concat(clusterList);
    // console.log(fileName);
  });

  //console.log(clusterEvolution.length);
}

var clusterEvolutionInfo = function() {
  clusterEvolution.forEach(function(clusterList,i){
    //console.log(i+": _________");
    //console.log("Similarity: " + clusterList.threshold);
    //console.log(clusterList.clusters.length + " clusters");
    var totalQ = 0;
    clusterList.clusters.forEach(function(cluster){
      totalQ += cluster.queries.length;
    });
    //console.log(totalQ + " queries");
  })
}

var evolutionTree = function() {
  loadClusterEvolution();

  clusterEvolutionInfo();

  //clusterEvolution.splice(0,10);
  
  for (var i = clusterEvolution.length-1;i>=0;i--) {
    var epoch = clusterEvolution[i];
    var prevEpoch = (i+1<clusterEvolution.length) ? clusterEvolution[i+1] : null;
    for (var j = 0;j<epoch.clusters.length;j++) {
      
      var cluster = epoch.clusters[j];

      var id = cluster.id;
      
      var children = {
        queries: [],
        clusters: [],
        queries:[]
      };
      var similarity = 0;
      var parent = null;
      var firstSeen = i;

      var queries = cluster.queries;
      for (var k = 0; k<queries.length;k++) {
        for (var l = k+1;l<queries.length;l++) {
          similarity += qs.getSimilarity(queries[k],queries[l]);
        }
        var qId = queries[k];
        var q = query.list[qId];
        if (typeof q.cluster === 'undefined') {
          q.cluster = id;
        }
        else {
          if (parent === null) parent = q.cluster;
          else if (parent !== q.cluster) throw "Error: Multiple Parents";
          q.cluster = id;
        }
      }
      
      children.queries = queries;
      similarity /= queries.length*(queries.length-1)/2;
      
      if (dictionary[id]) {
        var _cluster = dictionary[id];
        _cluster.similarity = similarity;
        _cluster.firstSeen = firstSeen;
      }
      else {
        if (parent === null) {
          parent = root;
        }
        else {

          parent = dictionary[parent];

        }
        var newCluster = new Cluster (id, parent, children, similarity, firstSeen);
        parent.children.clusters.push(newCluster);
        //if (parent !== root) console.log(parent);
        dictionary[id] = newCluster;
        if (parent !== root) {
          var firstQuery = newCluster.children.queries[0];
          var length = newCluster.children.queries.length;
  
          var index = parent.children.queries.indexOf(firstQuery);
  
          if (index == -1) throw "Error";
          else  parent.children.queries.splice(index, length);
        }
      } 
    }
  }


  trim(root,4,0);
  rename(root);
  
  refactor (root);
  root.name = "root";
  console.log(root.children.clusters);
  fs.writeFileSync("../results/clusters.json", JSON.stringify(root));
  console.log(dictionary[960]);

  return root;
}

var trim = function(node, minQuery, minSimilarity) {
  
  //node.children.clusters.forEach(function(c,i,clusters){
  // 
  //});
  for (var i = 0;i<node.children.clusters.length;i++) {
    trim(node.children.clusters[i], minQuery, minSimilarity);

    if ((node.children.clusters[i].children.clusters.length === 0 && node.children.clusters[i].children.queries.length <= minQuery)
     || node.children.clusters[i].similarity < minSimilarity) {
      //if (node == root) console.log(c);
      
      node.children.clusters.splice(i,1); 
      i--;
    }
  }
  //if (node.children.clusters.length>0 && node.children.queries.length>0) {
  //  node.children.queries = [];
  //}
}

var rename = function(node) {
  if (node.similarity) node.name = "similarity: "+node.similarity.toString().substr(0,4);
  node.children.clusters.forEach(function(c,i,clusters){
    rename(node.children.clusters[i]);
  });
  for (var i = 0;i<node.children.queries.length;i++) {
    node.children.queries[i] = {
      name: query.list[node.children.queries[i]].query_text,
      size: 1
    };
  }
}

var refactor = function(node) {
  delete node.parent;
  node.name = "similarity: "+node.similarity;
  node.children.clusters.forEach(function(c,i,clusters){
    refactor(clusters[i]);
  });
  var children = [];
  for (var i = 0;i<node.children.clusters.length;i++) {
    var c = node.children.clusters[i];
    children.push(c);
  }
  for (var i = 0;i<node.children.queries.length;i++) {
    var q = node.children.queries[i];
    children.push(q);
  }
  node.children = children;
}


var convert2JSON = function(root) {

}

evolutionTree();