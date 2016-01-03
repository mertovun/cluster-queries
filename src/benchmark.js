var benchmark = function()  {
	var start = null;
	var task = '';

	var test = "benchmark test";
	return {
		process: function(f) {
			var start = process.hrtime();
			f();
			var time  = process.hrtime(start);
			console.log("benchmark:"+ (time[0] * 1e9 + time[1]));		
		},
		start: function(_task) {
			task = _task || '';
			console.log("benchmark start");
			start = process.hrtime();
			
		},
		end: function(_mark) {
			if (start) {
				var time  = process.hrtime(start);
				console.log(task+":"+_mark+" time: "+ (time[0] * 1e9 + time[1])/1e6);
				start = process.hrtime();	
			} else console.log("Error: No starting point.");		
		},
		test: function() {

			console.log(test);
		}
	};


};

module.exports.benchmark = benchmark();