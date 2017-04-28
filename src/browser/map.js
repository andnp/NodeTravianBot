function distance(x1,y1,x2,y2){
	return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2, 2));
}

function addVillage(x, y, villageList, center){
	var owner, pop, tribe, alliance;
	return this.getText('//*[@id="village_info"]/tbody/tr[1]/td', function(err, res){
		tribe = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[2]/td', function(err,res){
		alliance = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[3]/td', function(err, res){
		owner = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[4]/td', function(err, res){
		pop = parseInt(res);
		var exists = false;
		for(var i = 0; i < villageList.length; i++){
			if(villageList[i].coords.x == x && villageList[i].coords.y == y){
				exists = true;
				villageList[i].alliance = alliance;
				if(villageList[i].population != pop)
					villageList[i].active = true;
				else
					villageList[i].active = false;
				villageList[i].population = pop;
				if(villageList[i].farm == undefined)
					villageList[i].farm = true;
				break;
			}
		}
		if(!exists){
			var village = {
				coords: {x: x, y: y},
				tribe: tribe,
				alliance: alliance,
				owner: owner,
				population: pop,
				dist: distance(center.x, center.y, x, y),
				farm: true
			};
			return village;
		}
	});
}

function updateVillage(x, y, villageList){
	var owner, pop, tribe, alliance;
	return this.url(global.server + '/position_details.php?x='+x+'&y='+y)
	.getText('//*[@id="village_info"]/tbody/tr[1]/td', function(err, res){
		tribe = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[2]/td', function(err,res){
		alliance = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[3]/td', function(err, res){
		owner = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[4]/td', function(err, res){
		pop = parseInt(res);
		var exists = false;
		for(var i = 0; i < villageList.length; i++){
			if(villageList[i].coords.x == x && villageList[i].coords.y == y){
				exists = true;
				villageList[i].alliance = alliance;
				villageList[i].owner = owner;
				villageList[i].tribe = tribe;
				if(villageList[i].population != pop)
					villageList[i].active = true;
				else
					villageList[i].active = false;
				villageList[i].population = pop;
				if(villageList[i].farm == undefined)
					villageList[i].farm = true;
				
				return villageList[i];
			}
		}
		if(!exists){
			var village = {
				coords: {x: x, y: y},
				tribe: tribe,
				alliance: alliance,
				owner: owner,
				population: pop,
				farm: true
			};
			return village;
		}
	});
}

function addOasis(x, y, oasisList, center){
	var oasis;
	return this.getText('//*[@id="troop_info"]', function(err, res){
		global.done = true;
		var exists = false;
		for(var i = 0; i < oasisList.length; i++){
			if(oasisList[i].coords.x == x && oasisList[i].coords.y ==y){
				exists = true;
				oasisList[i].empty = res.indexOf('none') !== -1;
				oasisList[i].checked = Date.now();
				break;
			}
		}
		if(!exists){
			oasis = {
				coords: {x: x, y: y},
				empty: res.indexOf('none') !== -1,
				dist: distance(center.x, center.y, x, y),
				farm: true,
				checked: Date.now()
			};
		}

		return oasis;
	});
}

function openMap() {
	return this.click('//*[@id="n3"]/a');
}

function checkForFarm(coords){
	return this.url(global.server + '/position_details.php?x='+coords.x+'&y='+coords.y)
	.getText('//*[@id="village_info"]/tbody/tr[2]/td', function(err, alliance){
		if(alliance == ''){
			return true;
		} else {
			return false;
		}
	})
}

module.exports = function(client){
	client.addCommand('addVillage', addVillage);
	client.addCommand('addOasis', addOasis);
	client.addCommand('openMap', openMap);
	client.addCommand('updateVillage', updateVillage);
}