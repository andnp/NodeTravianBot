var troopEnum = require('../enums/troops.js');

function openRallySpot(){
	return this.url(global.server + '/build.php?tt=1&id=39');
}

function getNextIncoming() {
	return this.openRallySpot()
	.getText('//*[@id="build"]/div[4]/table[1]/tbody/tr/td/div[1]/span[contains(@class, "timer")]', function(err, res) {
		if (err) {
			return {hour: 100, min: 100, sec: 100};
		}
		let s = res.split(':')
		let hour = parseInt(s[0]);
		let min = parseInt(s[1]);
		let sec = parseInt(s[2]);
		let time = {hour, min, sec};
		return time;
	});
}

function getTroops(){
	var troopList = {};
	var nums = [];
	var names = [];
	return this.openMain()
	.getText('//*[@id="troops"]/tbody/tr/td[3]',function(err, res){
		names = res;
		if (typeof(res) === 'string') {
			names = [res];
		}
	})
	.getText('//*[@id="troops"]/tbody/tr/td[2]', function(err, res){
		if (typeof(res) === 'string') {
			res = [res]
		}
		for(var i = 0; i < res.length; i++){
			troopList[troopEnum.getTroopNumber(names[i])] = parseInt(res[i]);	
		}
		return troopList;
	})
}

function scout(coords, scouts){
	return this.url(global.server + '/position_details.php?newdid=3327&x='+coords.x+'&y='+coords.y)
	.isExisting('//*[@id="tileDetails"]/div[1]/div/div[2]/a')
	.then(function(exists){
		if(exists){
			return this.click('//*[@id="tileDetails"]/div[1]/div/div[2]/a')
			.setValue('//*[@id="troops"]/tbody/tr[1]/td[2]/input', scouts)
			.click('//*[@id="build"]/div[2]/form/div[2]/label[3]/input')
			.click('//*[@id="btn_ok"]')
			.click('//*[@id="build"]/div[2]/form/table[2]/tbody[2]/tr/td/input[1]')
			.click('//*[@id="btn_ok"]');
		} else {
			return null;
		}
	});
}

function raid(coords, troops){
	return this.url(global.server + '/position_details.php?newdid=3327&x='+coords.x+'&y='+coords.y)
	.getText('//*[@id="content"]/h1', function(err, title){
		if(title.indexOf('Abandoned') == -1){
			try {
			return this.click('//*[@id="tileDetails"]/div[1]/div/div[2]/a')
			.setValue('//*[@id="troops"]/tbody/tr[1]/td[2]/input', troops[3] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[1]/td[1]/input', troops[0] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[1]/td[3]/input', troops[6] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[1]/td[4]/input', troops[8] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[2]/td[1]/input', troops[1] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[2]/td[2]/input', troops[4] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[2]/td[3]/input', troops[7] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[2]/td[4]/input', troops[9] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[3]/td[1]/input', troops[2] || 0)
			.setValue('//*[@id="troops"]/tbody/tr[3]/td[2]/input', troops[5] || 0)
			.isExisting('//*[@id="troops"]/tbody/tr[3]/td[4]/input')
			.then(function(exists){
				if(exists)
					return this.setValue('//*[@id="troops"]/tbody/tr[3]/td[4]/input', troops[10] || 0)
					.click('//*[@id="build"]/div[2]/form/div[2]/label[3]/input')
					.click('//*[@id="btn_ok"]')
					.click('//*[@id="btn_ok"]');
				else
					return this.click('//*[@id="build"]/div[2]/form/div[2]/label[3]/input')
					.click('//*[@id="btn_ok"]')
					.click('//*[@id="btn_ok"]');
			});
			} catch (err) {
				return false;
			}
		} else {
			return false;
		}
	});
}

module.exports = function(client){
	client.addCommand('openRallySpot', openRallySpot);
	client.addCommand('getTroops', getTroops);
	client.addCommand('scout', scout);
	client.addCommand('raid', raid);
	client.addCommand('getNextIncoming', getNextIncoming);
}