openAuctionPage = function(){
	return this.url('http://ts2.travian.us/hero_auction.php?action=buy');
}

openBidsPage = function(){
	return this.url('http://ts2.travian.us/hero_auction.php?action=bids');
}

getAuctionsTable = function(){
	return this.getText('//*[@id="auction"]/table/tbody/tr/td[2]', function(err, names){
		return this.getText('//*[@id="auction"]/table/tbody/tr/td[4]', function(err, costs){
			return this.getText('//*[@id="auction"]/table/tbody/tr/td[5]', function(err, times){
				var objects = [];
				for(var i = 0; i < names.length; i++){
					var item = names[i];
					var numstring = item.split("×")[0];
					var num = parseInt(numstring.substring(2, numstring.length - 1));
					var name = item.split("×")[1].substring(2);
					var cost = parseInt(costs[i]);
					var hours = parseInt(times[i].substring(0, 1));
					var minutes = parseInt(times[i].substring(2, 4));
					var seconds = parseInt(times[i].substring(5));
					var time = hours * 3600 + minutes * 60 + seconds;
					objects.push({time: time, number: num, name: name, cost: cost});
				}
				return objects;
			});
		});
	});
}

module.exports = function(client){
	client.addCommand('openAuctionPage', openAuctionPage);
	client.addCommand('openBidsPage', openBidsPage);
	client.addCommand('getAuctionsTable', getAuctionsTable);
}