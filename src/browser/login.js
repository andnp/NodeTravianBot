var fs = require('fs');

function login(client){
	var info = JSON.parse(fs.readFileSync("../passwords.json").toString());
	client.addCommand('login', function(){
		return this
			.init()
		    .url('https://ts2.travian.us')
		    .setValue('//*[@id="content"]/div[1]/div[1]/form/table/tbody/tr[1]/td[2]/input', info.user)
		    .setValue('//*[@id="content"]/div[1]/div[1]/form/table/tbody/tr[2]/td[2]/input', info.password)
		    .click('//*[@id="s1"]/div/div[2]');
	});
}

module.exports = login;