var troopEnum = require('../enums/troops.js');

function controller(client, taskQueue, villageList, oasisList, center){
	console.log('Start up report monitor');
	setInterval(function(){
		var troops = {};
		var lostTroops = {};
		var percent;
		var isOasis;
		client.checkForReport(function(err, res){
			if(res && global.done){
				taskQueue.push(function(){
					client.openReports()
					.openFirstUnreadReport()
					.getLostTroopsFromReport(function(err, lostData){
						console.log(lostData)
						lostTroops = lostData;
					})
					.getTroopsFromReport(function(err, tdata){
						troops = tdata;
					})
					.getPercentResourcesFromReport(function(err, resData){
						percent = resData;
						console.log("percent: " + percent);
					})
					.getIsOasis(function(err, oasisRes){
						isOasis = oasisRes;
					})
					.getCoordsFromOpenReport(function(err, coords){
						if(err){
							console.log("Report monitor err: ");
							console.log(err);
							global.done = true;
							return;
						}
						if(coords == null){
							console.log('null coords');
							global.done = true;
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
									if(percent)
										village.isFull = percent;
									exists = true;
									break;
								}
							}
							if(!exists){
								client.addVillage(coords.x, coords.y, villageList, center, function(err, village){
									if(err){
										console.log(err);
										global.done = true;
										return;
									}
									village.troops = troops;
									village.lostTroops = lostTroops;
									village.lastScout = Date.now();
									if(percent)
										village.isFull = percent;
									villageList.push(village);
									global.done = true;
									return;
								});
							}
							else {
								global.done = true;
								return;
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
								client.addOasis(coords.x, coords.y, oasisList, center, function(err, oasis){
									if(err) {
										console.log(err);
										global.done = true;
										return;
									}
									oasis.troops = troops;
									oasis.lostTroops = lostTroops;
									oasis.lastScout = Date.now();
									if(percent)
										oasis.isFull = percent;
									oasisList.push(oasis);
									global.done = true;
									return;
								})
							} else {
								global.done = true;
								return;
							}
						}
					});
				});
			}
		});
	}, 5000);
}

module.exports = controller;