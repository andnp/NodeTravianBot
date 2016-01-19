var fs = require('fs');

function Oasis(client, x, y){
	console.log("found Oasis");
	client.getText('//*[@id="troop_info"]', function(err, res){
		var file = fs.readFileSync('..'+ global.serverName + '/oasis.json', 'utf8');
		var datapoints = JSON.parse(file || '[]');
		var exists = false;
		for(var i = 0; i < datapoints.length; i++){
			if(datapoints[i].coords.x == x && datapoints[i].coords.y ==y){
				exists = true;
				datapoints[i].empty = res.indexOf('none') !== -1;
				break;
			}
		}
		if(!exists){
			datapoints.push({
				coords: {x: x, y: y},
				empty: res.indexOf('none') !== -1
			});
		}

		fs.writeFile('../' + global.serverName + '/oasis.json', JSON.stringify(datapoints));
	});
}

function Village(client, x, y){
	console.log("found Village");
	var owner, pop, tribe, alliance;
	client.getText('//*[@id="village_info"]/tbody/tr[1]/td', function(err, res){
		tribe = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[2]/td', function(err,res){
		alliance = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[3]/td', function(err, res){
		owner = res;
	})
	.getText('//*[@id="village_info"]/tbody/tr[4]/td', function(err, res){
		pop = res;
		var file = fs.readFileSync('../' + global.serverName + '/villages.json', 'utf8');
		var datapoints = JSON.parse(file);
		var exists = false;
		for(var i = 0; i < datapoints.length; i++){
			if(datapoints[i].coords.x == x && datapoints[i].coords.y == y){
				exists = true;
				datapoints[i].alliance = alliance;
				datapoints[i].pop = pop;
				break;
			}
		}
		if(!exists){
			datapoints.push({
				coords: {x: x, y: y},
				tribe: tribe,
				alliance: alliance,
				owner: owner,
				population: pop
			});
		}
		fs.writeFile('../' + global.serverName + '/villages.json', JSON.stringify(datapoints), function(err){
		});
	});
}

function controller(client, taskQueue){
	// console.log('here');
	var x,y;
	var center = {x:0, y:0};
	client.click('//*[contains(@class, "toggleCoordsWhite")]')
	.getText('//*[contains(@class, "coordinateX")]', function(err, res){
		x = parseInt(res.replace(/\D+/g, ""));
		if(res.match("-", ''))
			x = 0 - x;
		center.x = x;
	})
	.getText('//*[contains(@class, "coordinateY")]', function(err, res){
		y = parseInt(res.replace(/\D+/g, ""));
		if(res.match("-", ''))
			y = 0 - y;
		center.y = y;
	})
	.click('//*[contains(@class, "toggleCoordsWhite")]')
	.then(function(){
		x = x - 15;
		y = y - 15;
		setInterval(function(){
			taskQueue.push(function(){
				x++;
				if(x > center.x + 15){
					y++;
					x = center.x - 15;
				}
				if(y > center.y + 15)
					y = center.y - 15;
				console.log("checking map @(" + x + "," + y + ")");
				client.url(global.server + '/position_details.php?x='+x+'&y='+y)
					.getText('//*[@id="content"]/h1',function(err,res){
						if(res.indexOf("Unoccupied") !== -1){
							Oasis(client, x, y);
						} else if(res.indexOf("Wilderness") === -1 && res.indexOf("Abandoned") === -1){
							Village(client, x, y);
						}
					});
			});
			global.done = true;
		},(Math.random() * 120) * 1000);
	});
};

module.exports = controller;
