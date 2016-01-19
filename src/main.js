//-------Global Variables--------

global.server = "http://ts2.travian.us";
global.serverName = "ts2";
global.serverStart = new Date(2016,1,8);

//-------------------------------
var wio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = wio.remote(options);
var fs = require('fs');

var login = require('./browser/login.js')(client);
var auction = require('./browser/Auction.js')(client);

var taskQueue = [];
global.done = true;

client.login().then(function(){
	// begin execution of tasks in queue
	function executor(){
		if(taskQueue.length > 0 && global.done){
			global.done = false;
			taskQueue.shift()();
		}
		setTimeout(executor, 5000);
	}

	// client.placeAuctionBid(7, 500);
	executor();
	taskQueue.push(function(){require('./controllers/mapScanner.js')(client, taskQueue); global.done = true;});
	require('./controllers/auctionMarket.js')(client, taskQueue);
});