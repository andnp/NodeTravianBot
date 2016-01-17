var wio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = wio.remote(options);
var fs = require('fs');

var login = require('./browser/login.js')(client);
var auction = require('./browser/Auction.js')(client);

var taskQueue = [];

client.login().then(function(){
	// begin execution of tasks in queue
	setInterval(function(){
		if(taskQueue.length > 0)
			taskQueue.shift()();
	}, 1000);

	// record auction market data
	setInterval(function(){
		taskQueue.push(function(){
			client.openAuctionPage()
				.getAuctionsTable(function(err, res){
					console.log("checking market");
					res.forEach(function(item){
						if(item.time < 60){
							var d = new Date();
	 						item.day = d.getDate() - (new Date(2016, 1, 8)).getDate();
	 						fs.appendFile("../items.json", JSON.stringify(item) + "\n", 'utf8', function(err){
	 							if(err) console.log(err);
	 						});
						}
					});
				});
		});
	}, 55 * 1000);


});