var fs = require('fs');

var scanRadius = 25;

function Oasis(client, x, y, oasisList, center){
	console.log("found Oasis");
	client.addOasis(x, y, oasisList, center,function(err, oasis){
		if(oasis)
			oasisList.push(oasis);
		global.done = true;
	});
}

function Village(client, x, y, villageList, center){
	console.log("found Village");
	client.addVillage(x, y, villageList, center, function(err, village){
		if(village)
			villageList.push(village);
		global.done = true;
	});
}

function controller(client, taskQueue, villageList, oasisList, center){
	console.log('Start up map scanner');
	var x,y;
	client.click('//*[contains(@class, "toggleCoordsWhite")]')
	.getText('//*[contains(@class, "coordinateX")]', function(err, res){
		res = res[0]; // temporary fix for multiple villages
		x = parseInt(res.replace(/\D+/g, ""));
		if(res.match("-", ''))
			x = 0 - x;
		center.x = x;
	})
	.getText('//*[contains(@class, "coordinateY")]', function(err, res){
		res = res[0]; // temp fix
		y = parseInt(res.replace(/\D+/g, ""));
		if(res.match("-", ''))
			y = 0 - y;
		center.y = y;
	})
	.click('//*[contains(@class, "toggleCoordsWhite")]')
	.then(function(){
		x = x - scanRadius;
		y = y - scanRadius;
		setInterval(function(){
			taskQueue.push(function(){
				x++;
				if(x > center.x + scanRadius){
					y++;
					x = center.x - scanRadius;
				}
				if(y > center.y + scanRadius)
					y = center.y - scanRadius;
				console.log("checking map @(" + x + "," + y + ")");
				client.url(global.server + '/position_details.php?x='+x+'&y='+y)
					.getText('//*[@id="content"]/h1',function(err,res){
						if(res.indexOf("Unoccupied") !== -1){
							Oasis(client, x, y, oasisList, center);
						} else if(res.indexOf("Wilderness") === -1 && res.indexOf("Abandoned") === -1){
							Village(client, x, y, villageList, center);
						} else {
							global.done = true;
						}
					});
			});
		},(Math.random() * 1) * 60 * 1000);
	});
};

module.exports = controller;
