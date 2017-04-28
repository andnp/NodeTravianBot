function openMain(){
	return this.url(global.server + '/dorf1.php?newdid=3327&');
}

function openReports(){
	return this.url(global.server + '/berichte.php');
}

function openVillageCenter() {
	return this.url(global.server + '/dorf2.php');
}

module.exports = function(client){
	client.addCommand('openMain', openMain);
	client.addCommand('openVillageCenter', openVillageCenter);
	client.addCommand('openReports', openReports);
}