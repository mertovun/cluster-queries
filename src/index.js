var Query = require('./query');
var Word = require('./word');
var cooccurrence = require('./wordCooccurrence');
var Similarity = require('./querySimilarity');

var query = new Query();
var queryList = query.list;
var word = new Word(query.list);

var wordList = word.list;

//Word co-occurrence calculation parameters
var t0 = 1000 * 5 * 1;
var cutoff = 6 * t0;
cooccurrence.compute(wordList, t0, cutoff);
word.writeFile();
//
//word.readFile();
	
// Query similarity matrix
var similarity = new Similarity(query,word);
similarity.writeFile(0);

console.log(similarity.taskList.length-similarity.iteration+ " remaining processes.");

while (similarity.iterate()) {
	//console.log(similarity.iteration);
	if (similarity.iteration % 3000 === 0) {
		var clusters = similarity.sets.slice().sort(function(a,b){
			if (a === null) return 1;
			if (b === null) return -1;
			else return b.queries.length-a.queries.length;});
		clusters = clusters.slice(0, clusters.indexOf(null));
		console.log("________________");
		console.log(clusters.length+" clusters; "+clusters[0].queries.length+" elements in the most popular cluster.");
		console.log(similarity.taskList.length-similarity.iteration+ " remaining processes.");
		console.log("Similarity threshold: "+similarity.threshold);
		//console.log(clusters);
		similarity.writeClusters({
			threshold: similarity.threshold, 
			remaining: similarity.taskList.length-similarity.iteration, 
			clusters:clusters
		});
		
	}
	if (similarity.threshold<1) {
				similarity.writeClusters({
			threshold: similarity.threshold, 
			remaining: similarity.taskList.length-similarity.iteration, 
			clusters:clusters
		});
		break;
	}
}





