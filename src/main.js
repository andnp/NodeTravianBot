//-------Global Variables--------

global.server = "http://ts2.travian.us";

//-------------------------------
var wio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = wio.remote(options);
var fs = require('fs');

var login = require('./browser/login.js')(client);
var auction = require('./browser/Auction.js')(client);

var taskQueue = [];

client.login().then(function(){
	// begin execution of tasks in queue
	function executor(){
		if(taskQueue.length > 0){
			taskQueue.shift()();
		}
		setTimeout(executor, 1000);
	}

	// client.placeAuctionBid(7, 500);
	executor();
	require('./controllers/mapScanner.js')(client, taskQueue);
	// require('./controllers/auctionMarket.js')(client, taskQueue);
});