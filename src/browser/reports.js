function checkForReport(){
	return this.isExisting('//*[@id="n5"]/div[1]/div[2]')
	.then(function(exists){
		return exists;
	});
}

function openReport(num){
	return this.openReports()
	.click('//*[@id="overview"]/tbody/tr['+ (num + 1) +']/td[2]/div[1]/a');
}

function openFirstUnreadReport(){
	return this.isExisting('//*[contains(@class, "messageStatusUnread")]')
	.then(function(exists){
		if(exists)
			return this.click('//*[contains(@class, "messageStatusUnread")]/../../div/a');
		else {
			return this.click('//*[contains(@class, "next")]')
			.then(function(){
				return openFirstUnreadReport();
			});
		} 
	});
}

function getTroopsFromReport(){
	var troops = {};
	return this.getText('//*[@id="message"]/table[2]/tbody[2]/tr/td', function(err, res){
		for(var i = 0; i < res.length; i++){
			troops[i] = parseInt(res[i]);
		}
		return troops;
	});
}

function getCoordsFromOpenReport(){
	var coords = {};
	var x,y;
	var link;

	return this.getText('//*[@id="subject"]/div[2]', function(err, res){
		if(err){
			console.log("getText err");
			console.log(err);
			return null;
		}
		if(res.indexOf('explores') > -1){
			return null;
		} else {
			if(res.indexOf('Unoccupied') > -1) link = 1;
			return this.isExisting('//*[contains(@class, "noAlliance")]')
			.then(function(exists){
				if(exists && link != 1)
					link = 2;
				else if(link != 1)
					link = 3
				return this.getAttribute('//*[@id="message"]/table[2]/thead/tr/td[2]/p/a['+link+']', 'href')
				.then(function(href){
					return this.click('//*[@id="deleteReportButton"]')
					.click('//*[contains(@class, "dialogButtonOk")]')
					.url(href)
					.getText('//*[@id="content"]/h1/span[1]/span[1]', function(err, res){
						x = parseInt(res.replace(/\D+/g, ""));
						if(res.match("-", ''))
							x = 0 - x;
						coords.x = x;
					})
					.getText('//*[@id="content"]/h1/span[1]/span[3]', function(err, res){
						y = parseInt(res.replace(/\D+/g, ""));
						if(res.match("-", ''))
							y = 0 - y;
						coords.y = y;
					})
					.then(function(){
						return coords;
					});
				});
			});
		}
	});
}

function getFullFromReport(){
	return this.getText('//*[@id="attacker"]/tbody[5]/tr/td/div[3]',function(err, res){
		var left = res.split('/')[0];
		var right  = res.split('/')[1];
		return left == right;
	});
}

function getIsOasis(){
	return this.getText('//*[@id="subject"]/div[2]', function(err, res){
		return res.indexOf('Unoccupied') > -1;
	});
}

function getPercentResourcesFromReport(){
	return this.getText('//*[@id="subject"]/div[2]', function(err, res){
		if(res.indexOf('scouts') > -1){
			return this.isExisting('//*[@id="attacker"]/tbody[6]/tr/td/div/div[1]')
			.then(function(exists){
				if(exists){
					var resources = 0;
					return this.getText('//*[@id="attacker"]/tbody[5]/tr/td/div/div', function(err, res){
						resources = res;
						return this.getText('//*[@id="attacker"]/tbody[6]/tr/td/div/div[1]', function(err, res){
							var sum = 0;
							for(var i = 0; i < resources.length; i++){
								sum += parseInt(resources[i]) - parseInt(res) > 0 ? parseInt(resources[i]) - parseInt(res) : 0;
							}
							return sum / 200;
						})
					})
				} else {
					return 0;
				}
			})
		} else {
			return this.getText('//*[@id="attacker"]/tbody[5]/tr/td/div[3]',function(err, res){
				var left = res.split('/')[0];
				var right  = res.split('/')[1];
				return parseInt(left) / parseInt(right);
			});
		}
	});
}

function getLostTroopsFromReport(){
	var troops = {};
	return this.getText('//*[@id="attacker"]/tbody[3]/tr/td', function(err, res){
		for(var i = 0; i < res.length; i++){
			troops[i] = parseInt(res[i]);
		}
		return troops;
	});
}

module.exports = function(client){
	client.addCommand('checkForReport', checkForReport);
	client.addCommand('openReport', openReport);
	client.addCommand('getTroopsFromReport', getTroopsFromReport);
	client.addCommand('getCoordsFromOpenReport', getCoordsFromOpenReport);
	client.addCommand('getFullFromReport', getFullFromReport);
	client.addCommand('openFirstUnreadReport', openFirstUnreadReport);
	client.addCommand('getPercentResourcesFromReport', getPercentResourcesFromReport);
	client.addCommand('getLostTroopsFromReport', getLostTroopsFromReport);
	client.addCommand('getIsOasis', getIsOasis);
}