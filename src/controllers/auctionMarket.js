var fs = require('fs');
function auctionMarket(client,taskQueue){
	console.log('Start up market recorder');
	// record auction market data
	setInterval(function(){
		taskQueue.push(function(){
			client.getAuctionsTable(function(err, res){
				console.log("checking market");
				res.forEach(function(item){
					if(item.time < 60){
						var d = new Date();
 						item.day = d.getDate() - global.serverStart.getDate();
 						item.hour = d.getHours();
 						console.log(JSON.stringify(item));
 						fs.appendFile("../itemData.json", JSON.stringify(item) + "\n", 'utf8', function(err){
 							if(err) console.log(err);
 						});
					}
				});
				global.done = true;
			});
		});
	}, 55 * 1000);
}

module.exports = auctionMarket;