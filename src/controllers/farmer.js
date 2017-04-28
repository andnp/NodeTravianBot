var troopEnum = require('../enums/troops.js');
var Farmer = require('../actions/farm.js');

function getNoAllianceList(villageList){
	var farmList = [];
	for(var i = 0; i < villageList.length; i++){
		if(villageList[i].alliance == '')
			farmList.push(villageList[i]);
	}
	return farmList;
}

function getScoutList(villageList){
	var scoutList = getNoAllianceList(villageList);
	var ret = [];
	for(var i = 0; i < scoutList.length; i++){
		if(scoutList[i].farm)
			ret.push(scoutList[i]);
	}
	return ret;
}

function findScoutTarget(villageList){
	var scoutList = getScoutList(villageList);
	scoutList.sort(function(a,b){
		var sum = 0;
		if(a.lastScout == undefined)
			return 1;
		else if(b.lastScout == undefined)
			return -1;
		else 
			sum += (b.lastScout - a.lastScout) / (2 * 60 * 1000);

		if(a.population > b.population)
			sum++;
		else
			sum--;

		if(a.dist < b.dist)
			sum++;
		else
			sum--;

		return sum;
	});
	scoutList.reverse();
	return scoutList[0];
}

function removeFromArray(array, obj){
	var index = -1;
	for(var i = 0; i < array.length; i++){
		if(array[i].coords.x == obj.coords.x && array[i].coords.y == obj.coords.y)
			index = i;
	}
	if(index >= 0)
		array.splice(index, 1);
	return array;
}

function controller(client, taskQueue, villageList, oasisList, troopList, center){
	var iteration = 0;

	console.log("Start up farming controller");
	
	// //Farm controller
	// setInterval(function(){taskQueue.push(function(){
	// 	console.log("checking troops")
	// 	// check # troops
	// 	return client.getTroops(function(err, res){
	// 		troopList = res;
	// 	})
	// 	.then(async function(){
	// 		await Farmer.farm(client, villageList, oasisList, troopList, center);
	// 	});
	// });}, 60 * 1000);

	var fs = require('fs');

	function scout(){
		return client.getTroops(async function(err, res) {
			troopList = res;
			if (err) {
				return;
			}
			if(troopList[3] > 3) {
				let blacklist = JSON.parse(fs.readFileSync('blacklist.json'));
				var scoutTarget = findScoutTarget(villageList);
				if (blacklist.indexOf(scoutTarget.owner) > -1) {
					villageList = removeFromArray(villageList, scoutTarget);
					return;
				}
				if(scoutTarget) {
					console.log("Scouting: " + scoutTarget.owner);
					scoutTarget.lastScout = Date.now();
					await client.scout(scoutTarget.coords, 1)
				}
			}
		});
	}

	//Scout controller
	setInterval(function(){
		taskQueue.push(scout);
	}, 5 * 60 * 1000);
	setTimeout(function(){
		taskQueue.push(scout);
	}, 0);
}

module.exports = controller;