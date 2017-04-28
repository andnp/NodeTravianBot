function listVillages() {
    villages = []
    return this.getText('//*[@id="sidebarBoxVillagelist"]/div[2]/div[2]/ul/li/a/div', function(err, res) {
        for (var i = 0; i < res.length; i++) {
            villages.push(res[i].replace('\n', ''));
        }
        return villages;
    });
}

function gotoVillage(village) {
    return this.click('//*[@id="sidebarBoxVillagelist"]/div[2]/div[2]/ul/li[' + village + ']/a');
}

module.exports = function(client){
	client.addCommand('listVillages', listVillages);
    client.addCommand('gotoVillage', gotoVillage);
}