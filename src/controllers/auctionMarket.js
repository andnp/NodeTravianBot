function auctionMarket(client,taskQueue){
	// record auction market data
	setInterval(function(){
		taskQueue.push(function(){
			client.openAuctionPage()
				.getAuctionsTable(function(err, res){
					console.log("checking market");
					res.forEach(function(item){
						if(item.time < 60){
							var d = new Date();
	 						item.day = d.getDate() - (new Date(2016, 1, 8)).getDate();
	 						fs.appendFile("../items.json", JSON.stringify(item) + "\n", 'utf8', function(err){
	 							if(err) console.log(err);
	 						});
						}
					});
				});
		});
	}, 55 * 1000);
}

module.exports = auctionMarket;