var troopEnum = require('../enums/troops.js');

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

function getFarmList(villageList){
	var farmList = getNoAllianceList(villageList);
	var ret = [];
	for(var i = 0; i < farmList.length; i++){
		// if(farmList[i].lastScout && Date.now() - farmList[i].lastScout > 12 * 60 * 60 * 1000){
			if(farmList[i].lostTroops && troopEnum.getNumberOfTroops(farmList[i].lostTroops) == 0)
				if(farmList[i].farm)
					ret.push(farmList[i]);
		// }
	}
	return ret;
}

function getEmptyOasis(oasisList){
	var ret = [];
	for(var i = 0; i < oasisList.length; i++){
		if(oasisList[i].empty && (Date.now() - oasisList[i].checked) < 45 * 60 * 1000)
			ret.push(oasisList[i]);
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

function findFarmTarget(villageList, oasisList, troopList){
	var farmList = getFarmList(villageList);
	oasisList = getEmptyOasis(oasisList);
	farmList = farmList.concat(oasisList);
	// for(var i = 0; i < farmList.length; i++){
	// 	if(farmList[i].troops != undefined)
	// 		console.log(troopEnum.getNumberOfTroops(farmList[i].troops));
	// 	else
	// 		console.log('undefined')
	// }
	farmList.sort(function(a,b){
		var sum = 0;

		//if a or b is oasis
		if(a.empty != undefined || b.empty != undefined){
			if(a.isFull && a.isFull > 1)
				sum += 20;
			if(b.isFull && b.isFull > 1)
				sum -= 20;
			sum += (b.dist - a.dist) / 2;

			if(!a.lastFarm)
				sum+=10;
			if(!b.lastFarm)
				sum-=10;
			if(a.lastFarm && b.lastFarm)
				sum += (b.lastFarm - a.lastFarm) / (2 * 60 * 1000);

			return sum;
		}


		//if both are villages
		if(a.troops == undefined || troopEnum.getNumberOfTroops(a.troops) > 0)
			return -1;
		else if(b.troops == undefined || troopEnum.getNumberOfTroops(b.troops) > 0)
			return 1;

		if(!(troopEnum.getNumberOfTroops(a.troops) <= 5 && troopList[10] == 1)){
			if(a.lostTroops != undefined && troopEnum.getNumberOfTroops(a.lostTroops) > 0)
				return -1;
			else if(b.lostTroops != undefined && troopEnum.getNumberOfTroops(b.lostTroops) > 0)
				return 1;
		}
		

		if(a.isFull == undefined)
			sum += 20;
		else if(b.isFull == undefined)
			sum -= 20;
		else {
			if(a.isFull > 1)
				sum += 25;
			if(b.isFull > 1)
				sum -= 25;
		} 

		sum += (a.population - b.population) / 10;

		sum += (b.dist - a.dist) / 2;

		if(!a.lastFarm)
			sum+=10;
		if(!b.lastFarm)
			sum-=10;
		if(a.lastFarm && b.lastFarm)
			sum += (b.lastFarm - a.lastFarm) / (2 * 60 * 1000);

		return sum;
	});
	// console.log(farmList);
	farmList.reverse();
	return farmList[0];
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
	
	//Farm controller
	setInterval(function(){taskQueue.push(function(){
		console.log("checking troops")
		// check # troops
		client.getTroops(function(err, res){
			troopList = res;
		})
		.then(function(){
			var farmTarget = findFarmTarget(villageList, oasisList, troopList);

			console.log("Target");
			console.log(farmTarget);

			if(farmTarget.troops == undefined || troopEnum.getNumberOfTroops(farmTarget.troops) == 0){
				var targetName = farmTarget.owner || "oasis";
				console.log("Found farming target: " + targetName);
				var hero = 0;
				// if(farmTarget.lostTroops == undefined || troopEnum.getNumberOfTroops(farmTarget.lostTroops) > 0){
				// 	hero = 1;
				// 	console.log("Using hero: " + troopEnum.getNumberOfTroops(farmTarget.lostTroops))
				// }
				console.log('here');
				if(troopList[4] >= 3){
					console.log("Farming ("+farmTarget.coords.x+","+farmTarget.coords.y+") with: "+troopEnum.getTroopKey(4));
					client.raid(farmTarget.coords, {4:3, 10:hero}, function(err, exists){
						if(!!exists){
							farmTarget.lastFarm = Date.now();
							global.done = true;
							return;
						} else {
							villageList = removeFromArray(villageList, farmTarget);
							global.done = true;
							return;
						}
					});
				} else if(troopList[0] >= 3){
					console.log("Farming ("+farmTarget.coords.x+","+farmTarget.coords.y+") with: "+troopEnum.getTroopKey(0));
					client.raid(farmTarget.coords, {0:5, 10:hero}, function(err, exists){
						if(!!exists){
							farmTarget.lastFarm = Date.now();
							global.done = true;
							return;
						} else {
							villageList = removeFromArray(villageList, farmTarget);
							global.done = true;
							return;
						}
					});
				} else {
					global.done = true;
				}
			} else {
			global.done = true;	
			}
		});
	});}, 60 * 1000);

	function scout(){
		client.getTroops(function(err, res){
			troopList = res;
			if(troopList[3] > 3){
				var scoutTarget = findScoutTarget(villageList);
				if(scoutTarget){
					console.log("Scouting: " + scoutTarget.owner);
					scoutTarget.lastScout = Date.now();
					client.scout(scoutTarget.coords, 1)
					.then(function(){
						global.done = true;
					});
				} else {
					global.done = true;
				}
				
			} else {
				global.done = true;
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