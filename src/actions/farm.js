var troopEnum = require('../enums/troops.js');
var fs = require('fs');

function distance(x1,y1,x2,y2){
	return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2, 2));
}

function getNoAllianceList(villageList){
	var farmList = [];
	for(var i = 0; i < villageList.length; i++){
		if(villageList[i].alliance == '')
			farmList.push(villageList[i]);
	}
	return farmList;
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

function findFarmTarget(villageList, oasisList, troopList, coords){
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
			if(a.isFull >= 1)
				sum += 1000;
			if(b.isFull >= 1)
				sum -= 1000;
		} 

		sum += (a.population - b.population);

		sum += (distance(b.coords.x, b.coords.y, coords.x, coords.y) - distance(a.coords.x, a.coords.y, coords.x, coords.y)) / 2;

		if(!a.lastFarm)
			sum+=10;
		if(!b.lastFarm)
			sum-=10;
		if(a.lastFarm && b.lastFarm)
			sum += (b.lastFarm - a.lastFarm) / (15 * 1000);

		return sum;
	});
	// console.log(farmList);
	farmList.reverse();
	let list = farmList.filter(function (v) {
		return !v.lastFarm || Date.now() - v.lastFarm > 10 * 60 * 1000;
	});
	console.log(farmList.length + " :: " + list.length)
	if (list.length > 0)
		return list[0];
	else
		return null;
}

function removeFromArray(array, obj){
	var index = -1;
	for(var i = 0; i < array.length; i++){
		if(array[i].coords.x == obj.coords.x && array[i].coords.y == obj.coords.y) {
			index = i;
			break;
		}
	}
	if(index >= 0)
		array.splice(index, 1);
	return array;
}

module.exports.canFarm = function(troopList) {
	if(troopList[4] >= 20){
		return true;
	// } else if(troopList[0] >= 20){
	// 	return true;
	} else {
		return false;
	}
}


module.exports.farm = async function farm(client, village, villageList, oasisList, troopList, center) {
	let blacklist = JSON.parse(fs.readFileSync('blacklist.json'));
	var farmTarget = findFarmTarget(villageList, oasisList, troopList, center);
	if (!farmTarget)
		return;

	if (blacklist.indexOf(farmTarget.owner) > -1) {
		villageList = removeFromArray(villageList, farmTarget);
		return;
	}

	console.log("Time since farmed:", Date.now() - farmTarget.lastFarm)

	if(farmTarget.troops == undefined || troopEnum.getNumberOfTroops(farmTarget.troops) == 0){
		var targetName = farmTarget.owner || "oasis";
		console.log("Found farming target: " + targetName);
		var hero = 0;
		// if(farmTarget.lostTroops == undefined || troopEnum.getNumberOfTroops(farmTarget.lostTroops) > 0){
		// 	hero = 1;
		// 	console.log("Using hero: " + troopEnum.getNumberOfTroops(farmTarget.lostTroops))
		// }
		console.log(troopList);
		if(troopList['4'] >= 20){
			console.log("Farming ("+farmTarget.coords.x+","+farmTarget.coords.y+") with: "+troopEnum.getTroopKey(4));
			let vil = await client.updateVillage(farmTarget.coords.x, farmTarget.coords.y, villageList);
			if (blacklist.indexOf(vil.owner) > -1) {
				console.log("remove " + vil.owner + " from list");
				villageList = removeFromArray(villageList, vil);
				return;
			} else if (vil.alliance != '') {
				console.log(vil.owner + " in alliance: " + vil.alliance);				
				return;
			}
			vil.dist = distance(vil.coords.x, vil.coords.y, center.x, center.y);
			global.farmCollection.push(vil);
			await client.gotoVillage(village)
			.raid(farmTarget.coords, {4:20, 10:hero}, function(err, exists){
				if(!!exists){
					troopList['4'] -= 20;
					farmTarget.lastFarm = Date.now();
					return;
				}
			});
		} //else if(troopList['0'] >= 20){
		// 	console.log("Farming ("+farmTarget.coords.x+","+farmTarget.coords.y+") with: "+troopEnum.getTroopKey(0));
		// 	await client.gotoVillage(village)
		// 	.raid(farmTarget.coords, {0:20, 10:hero}, function(err, exists){
		// 		if(!!exists){
		// 			troopList['0'] -= 20;
		// 			farmTarget.lastFarm = Date.now();
		// 			return;
		// 		} else {
		// 			villageList = removeFromArray(villageList, farmTarget);
		// 			return;
		// 		}
		// 	});
		// }
		// else if(troopList[2] >= 10){
		// 	console.log("Farming ("+farmTarget.coords.x+","+farmTarget.coords.y+") with: "+troopEnum.getTroopKey(2));
		// 	await client.raid(farmTarget.coords, {2:10, 10:hero}, function(err, exists){
		// 		if(!!exists){
		// 			farmTarget.lastFarm = Date.now();
		// 			return;
		// 		} else {
		// 			villageList = removeFromArray(villageList, farmTarget);
		// 			return;
		// 		}
		// 	});
		// }
	}
}