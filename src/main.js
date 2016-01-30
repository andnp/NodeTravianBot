//-------Global Variables--------

global.server = process.argv[2] || "http://ts2.travian.us";
global.serverName = process.argv[3] || "ts2";
var dateString = process.argv[4] || "Jan 8, 2016";
global.tribe = process.argv[5] || "Romans";

//---------Required--------------
global.serverStart = new Date(dateString);
var wio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = wio.remote(options);
var fs = require('fs');

var login = require('./browser/login.js')(client);
var auction = require('./browser/Auction.js')(client);
require('./browser/troops.js')(client);
require('./browser/navigation.js')(client);
require('./browser/reports.js')(client);
require('./browser/map.js')(client);


//---------Local Vars------------
var taskQueue = [];
global.done = true;

var villageList = [];
var oasisList = [];
var troopList = [];
var center ={x: -5, y: 52};
var lastCommand = Date.now();

//---------On Start--------------

client.login().then(function(){
	// begin execution of tasks in queue
	function executor(){
		if(taskQueue.length > 0 && global.done){
			global.done = false;
			taskQueue.shift()();
			lastCommand = Date.now();
		}
		// console.log(global.done)
		setTimeout(executor, ((Math.random() * 2) + 1) * 1000);
	}

	function checkBotDeath(){
		if(Date.now() - lastCommand > 5 * 60 * 1000)
			global.done = true;
	}
	setInterval(checkBotDeath, 60 * 1000);

	// client.placeAuctionBid(7, 500);
	require('./controllers/reportMonitor.js')(client, taskQueue, villageList, oasisList, center);
	taskQueue.push(function(){require('./controllers/mapScanner.js')(client, taskQueue, villageList, oasisList, center); global.done = true;});
	require('./controllers/auctionMarket.js')(client, taskQueue);
	require('./controllers/farmer.js')(client, taskQueue, villageList, oasisList, troopList, center);

	executor();
});

fs.readFile('../'+global.serverName+'/villages.json', function(err, res){
	if(res)
		villageList = JSON.parse(res);
	for(var i = 0; i < villageList.length; i++){
		if(villageList[i].farm == undefined)
			villageList[i].farm = true;
	}
});

fs.readFile('../'+global.serverName+'/oasis.json', function(err, res){
	if(err)
		console.log(err);
	if(res)
		oasisList = JSON.parse(res);
});

//---------On exit---------------

function cleanup(){
	fs.writeFileSync('../'+global.serverName+'/villages.json', JSON.stringify(villageList,null, '\t'));
	fs.writeFileSync('../'+global.serverName+'/oasis.json', JSON.stringify(oasisList,null,'\t'));
	process.exit();
}

process.on('SIGINT', cleanup);
process.on('exit', cleanup);