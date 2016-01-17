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

	require('./controllers/auctionMarket.js')(client, taskQueue);
});