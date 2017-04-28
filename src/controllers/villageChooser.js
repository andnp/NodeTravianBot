// For now naively choosing village based on time

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function switchVillage(client,taskQueue){
	console.log('Start up village chooser');
	setInterval(function(){
		taskQueue.push(async function(){
			return client.openMain().listVillages(async function(err, villages) {
                const randVillage = getRandomInt(0, villages.length) + 1;
                console.log("switching to village: " + randVillage);
                await client.gotoVillage(randVillage);
            });
		});
    }, 2 * 60 * 1000);
}

module.exports = switchVillage;