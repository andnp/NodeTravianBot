var troopEnum = require('../enums/troops.js');

function addPercentResToDataCollection(coords, percent) {
	let index = -1;
	for (let i = 0; i < global.farmCollection.length; ++i) {
		let farm = Object.assign({}, global.farmCollection[i]);
		if (farm.coords.x === coords.x && farm.coords.y === coords.y) {
			farm.lastScout = (Date.now() - farm.lastScout) / 1000;
			farm.lastFarm = (Date.now() - farm.lastFarm) / 1000;
			farm.isFull = percent;
			global.completedFarms.push(farm);
			index = i;
		}
	}
	if(index >= 0)
		global.farmCollection.splice(index, 1);
}

function controller(client, taskQueue, villageList, oasisList, center){
	console.log('Start up report monitor');
	setInterval(function(){
		var troops = {};
		var lostTroops = {};
		var percent;
		var isOasis;
		client.checkForReport(function(err, res){
			if(res){
				taskQueue.push(async function(){
					return client.openReports()
					.openFirstUnreadReport()
					.getLostTroopsFromReport(function(err, lostData){
						console.log(lostData)
						lostTroops = lostData;
					})
					.getTroopsFromReport(function(err, tdata){
						troops = tdata;
					})
					.getPercentResourcesFromReport(function(err, resData){
						percent = resData || 0;
						console.log("percent: " + percent);
					})
					.getIsOasis(function(err, oasisRes){
						isOasis = oasisRes;
					})
					.getCoordsFromOpenReport(async function(err, coords){
						if(err){
							console.log("Report monitor err: ");
							console.log(err);
							return;
						}
						if(coords == null){
							console.log('null coords');
							return;
						}
						var exists = false;
						if(!isOasis){
							for(var i = 0; i < villageList.length; i++){
								var village = villageList[i];
								if(village.coords.x == coords.x && village.coords.y == coords.y){
									village.troops = troops;
									if(village.lostTroops == undefined || !(troopEnum.getNumberOfTroops(village.lostTroops) == 0 && troopEnum.getNumberOfTroops(village.lostTroops) > 0)){
										village.lostTroops = lostTroops;
									}
									village.lastScout = Date.now();
									if(percent !== null || percent !== undefined)
										village.isFull = percent;
									exists = true;
									addPercentResToDataCollection(coords, percent);
									break;
								}
							}
							if(!exists){
								await client.addVillage(coords.x, coords.y, villageList, center, function(err, village){
									if(err){
										console.log(err);
										return;
									}
									village.troops = troops;
									village.lostTroops = lostTroops;
									village.lastScout = Date.now();
									if(percent)
										village.isFull = percent;
									villageList.push(village);
									addPercentResToDataCollection(coords, percent);
									return;
								});
							}
						} else {
							for(var i = 0; i < oasisList.length; i++){
								var oasis = oasisList[i];
								if(oasis.coords.x == coords.x && oasis.coords.y == coords.y){
									oasis.troops = troops;
									if(troopEnum.getNumberOfTroops(lostTroops) > 0)
										oasis.lostTroops = lostTroops;
									if(oasis.lostTroops == undefined)
										oasis.lostTroops = lostTroops;
									oasis.lastScout = Date.now();
									if(percent)
										oasis.isFull = percent;
									exists = true;
									break;
								}
							}
							if(!exists){
								await client.addOasis(coords.x, coords.y, oasisList, center, function(err, oasis){
									if(err) {
										console.log(err);
										return;
									}
									oasis.troops = troops;
									oasis.lostTroops = lostTroops;
									oasis.lastScout = Date.now();
									if(percent)
										oasis.isFull = percent;
									oasisList.push(oasis);
									return;
								})
							}
						}
					});
				});
			}
		});
	}, 10 * 1000);
}

module.exports = controller;