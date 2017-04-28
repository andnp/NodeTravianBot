var fs = require('fs');

var daysBetween = function( date1, date2 ) {
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
    
  // Convert back to days and return
  return Math.round(difference_ms/one_day); 
}

function auctionMarket(client,taskQueue){
	console.log('Start up market recorder');
	// record auction market data
	setInterval(function(){
		taskQueue.push(function(){
			return client.getAuctionsTable(function(err, res){
				console.log("checking market");
				res.forEach(function(item){
					if(item.time < 60){
						var d = new Date();
 						item.day = daysBetween(global.serverStart, d);
 						item.hour = d.getHours();
 						console.log(JSON.stringify(item));
 						fs.appendFile("../itemData.json", JSON.stringify(item) + "\n", 'utf8', function(err){
 							if(err) console.log(err);
 						});
					}
				});
			});
		});
	}, 55 * 1000);
}

module.exports = auctionMarket;