//-------Global Variables--------

global.server = process.argv[2] || "http://ts20.travian.us";
global.serverName = process.argv[3] || "ts20";
var dateString = process.argv[4] || "Mar 15, 2017";
global.tribe = process.argv[5] || "Romans";

global.farmCollection = [];
global.completedFarms = [];

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
require('./browser/villages.js')(client);
require('./browser/village.js')(client);
var Village = require('./data/state.js');


//---------Local Vars------------
var taskQueue = [];

var villageList = [];
var ownVillages = [];
var oasisList = [];
var troopList = [];
var center ={x: -12, y: 64};  // NEED TO FIX THIS
var lastCommand = Date.now();

//---------On Start--------------

var execHandle = null;
client.login().then(async function(){
	// begin execution of tasks in queue
	async function executor(){
		if(taskQueue.length > 0){
			try {
				await taskQueue.shift()();
			} catch (e) {
				console.log(e);
			}
			lastCommand = Date.now();
		}
		execHandle = setTimeout(executor, ((Math.random() * 2) + 3) * 1000);
	}

	function checkBotDeath(){
		if(Date.now() - lastCommand > 2 * 60 * 1000) {
			clearTimeout(execHandle);
			console.log('bot death');
			taskQueue = [];
			executor();

		}
	}

	let vs = await client.listVillages();

	for (let i = 0; i < vs.length - 2; ++i) {
		ownVillages.push(new Village.Village(vs[i], i+1, client, taskQueue, villageList, oasisList));
		await ownVillages[i].update();
	}

	require('./controllers/reportMonitor.js')(client, taskQueue, villageList, oasisList, center);
	// await require('./controllers/mapScanner.js')(client, taskQueue, villageList, oasisList, center);
	require('./controllers/auctionMarket.js')(client, taskQueue);
	require('./controllers/farmer.js')(client, taskQueue, villageList, oasisList, troopList, center);
	// require('./controllers/villageChooser.js')(client, taskQueue);

	setInterval(checkBotDeath, 60 * 1000);
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
	fs.writeFileSync('../'+global.serverName+'/farm_data.json', JSON.stringify(global.completedFarms,null,'\t'));
	process.exit();
}

process.on('SIGINT', cleanup);
process.on('exit', cleanup);