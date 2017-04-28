var TroopsEnum = require('../enums/troops.js');
var Farmer = require('../actions/farm.js');
var fs = require('fs');

var scanRadius = 50;

async function Oasis(client, x, y, oasisList, center){
	console.log("found Oasis");
	await client.addOasis(x, y, oasisList, center,function(err, oasis){
		if(oasis)
			oasisList.push(oasis);
	});
}

async function Village(client, x, y, villageList, center){
	console.log("found Village");
	await client.addVillage(x, y, villageList, center, function(err, village){
		if(village)
			villageList.push(village);
	});
}

function Resources(res) {
    let self = this;
    self.food = res.food;
    self.lumber = res.lumber;
    self.iron = res.iron;
    self.clay = res.clay;

    self.canAfford = function(cost) {
        return self.food >= cost.food && self.lumber >= cost.lumber && self.iron >= cost.iron && self.clay >= cost.clay;
    }
}

function Troops(tobject) {
    let self = this;
    self.troops = {};
    for(let i = 0; i < 11; ++i) {
        self.troops[i] = 0;
    }

    self.getByString = function(str) {
        return self.troops[TroopsEnum.getTroopNumber(str)];
    }

    self.getByNumber = function(num) {
        return self.troops[num];
    }
    
    for (let i = 0; i < 11; ++i) {
        self.troops[i] = tobject[i] || 0;
    }
}

function Research(research) {
    let self = this;
    self.start_time = -1;
    self.end_time = -1;
    self.research = "";

    self.startResearch = function(research) {
        // This should start research based on name and fill out data fields.
        // Should return a promise.
    }
}

function Building(client, build_object) {
    let self = this;
    self.name = build_object.building;
    self.level = build_object.level;
    self.location = build_object.id;
    self.is_resource = build_object.res;
    self.upgrade_time = build_object.update_time;
    self.upgrade_cost = build_object.cost;
    self.village = build_object.village;

    self.upgrade = async function() {
        await client.upgradeBuilding(self.location);
        let new_dat = await client.getBuilding(self.village, self.location);
        self.level = new_dat.level;
        self.upgrade_time = new_dat.upgrade_time;
        self.upgrade_cost = new_dat.upgrade_cost;
    }
}

function timeToMilli(time) {
    return (time.sec + time.min * 60 + time.hour * 3600) * 1000;
}


function Construction(co) {
    let self = this;
    self.start_time = Date.now();
    self.end_time = -1;
    self.building = co.building;
    self.level = co.level;
    self.end_time = self.start_time + timeToMilli(co.time);
}

function setLongTimeout(callback, timeout_ms) {
 //if we have to wait more than max time, need to recursively call this function again
 if(timeout_ms > 2147483647) {    //now wait until the max wait time passes then call this function again with
      //requested wait - max wait we just did, make sure and pass callback
      setTimeout(function(){ setLongTimeout(callback, (timeout_ms - 2147483647)); },
          2147483647);
 } else  //if we are asking to wait less than max, finally just do regular setTimeout and call callback
    {setTimeout(callback, timeout_ms);}
}

function OwnVillage(name, number, client, taskQueue, villageList, oasisList) {
    let self = this;
    self.troops = {};
    self.resources = {};
    self.buildings = [];
    self.resBuildings = [];
    self.research = {};
    self.construction = {};
    self.name = name;
    self.nextIncoming = {};
    self.number = number;
    self.coords = {};

    let x, y;

    self.last_updated = -1;
    let initialized = false;

    self.registerTask = async function(task, s) {
        taskQueue.push(async function() {
            if (s == undefined || s) {
                console.log('Switching to Village', self.name);
                await client.gotoVillage(self.number);
            }
            await task();
        });
    }

    async function getNextIncoming() {
        // self.nextIncoming = await client.getNextIncoming();
        // let time = timeToMilli(self.nextIncoming);
        // console.log('Next Incoming', time);
        // setLongTimeout(self.incomingFarms, time);
    }

    async function getCoords() {
        self.coords = await client.getCoords();
        x = self.coords.x - scanRadius;
        y = self.coords.y - scanRadius;
        console.log(self.coords);
    }

    async function getTroops() {
        let troopObject = await client.getTroops();
        self.troops = new Troops(troopObject);
        let canfarm = Farmer.canFarm(self.troops.troops);
        if (canfarm) {
            console.log(self.name, 'can still farm');
            await Farmer.farm(client, self.number, villageList, oasisList, self.troops.troops, self.coords);
            setTimeout(function() {
                self.registerTask(async function() {
                    await getTroops();
                });
            }, 30 * 1000);
        }
    }

    async function getResources() {
        self.resources = new Resources(await client.getResources());
    }

    async function getConstruction() {
        let co = await client.getConstruction();
        if (co){
            self.construction = new Construction(co);
        } else {
            await self.finishedConstruction();
        }
    }

    async function getBuildings() {
        let b = await client.getBuildings(self.number);
        self.buildings = [];
        for (let i = 0; i < b.length; ++i) {
            b[i].res = false;
            let build_data = await client.getBuilding(self.number, b[i].id);
            b[i].update_time = build_data.time;
            b[i].cost = build_data.resources;
            b[i].village = self.number;
            self.buildings.push(new Building(client, b[i]));
        }
    }

    async function getResBuildings() {
        let b = await client.getResBuildings(self.number);
        self.resBuildings = [];
        for (let i = 0; i < b.length; ++i) {
            b[i].res = true;
            let build_data = await client.getBuilding(self.number, b[i].id);
            b[i].update_time = build_data.time;
            b[i].cost = build_data.resources;
            b[i].village = self.number;
            self.resBuildings.push(new Building(client, b[i]))
        } 
    }

    self.startScanner = function() {
		setInterval(function(){
			self.registerTask(async function(){
				x++;
				if(x > self.coords.x + scanRadius){
					y++;
					x = self.coords.x - scanRadius;
				}
				if(y > self.coords.y + scanRadius)
					y = self.coords.y - scanRadius;
				console.log("checking map @(" + x + "," + y + ")");
				return client.url(global.server + '/position_details.php?x='+x+'&y='+y)
					.getText('//*[@id="content"]/h1', async function(err,res){
						if(res.indexOf("Unoccupied") !== -1){
							await Oasis(client, x, y, oasisList, self.coords);
						} else if(res.indexOf("Wilderness") === -1 && res.indexOf("Abandoned") === -1){
							await Village(client, x, y, villageList, self.coords);
						}
					});
			}, false);
		}, 1 * 60 * 1000);
    }

    function initilize() {
        self.startScanner();
        setInterval(function() {
            self.registerTask(async function() {
                await getTroops();
            });
        }, 5 * 60 * 1000);
        setInterval(function() {
            self.registerTask(async function() {
                await getConstruction();
            });
        }, 5 * 60 * 1000);
    }

    self.finishedConstruction = async function() {
        console.log('Finished building ::: Village', self.name);
        self.registerTask(async function() {
            await getResources();
            let buildList = JSON.parse(fs.readFileSync(global.serverName + '.json')).villages[self.number - 1].buildings;
            for (let i = 0; i < buildList.length; ++i) {
                let build = buildList[i];
                let buildings = self.buildings.concat(self.resBuildings).filter(x => x.name == build.name);
                buildings.sort(function(a, b) {
                    return a.level > b.level ? -1 : 1;
                });
                let canBuild = self.resources.canAfford(buildings[0].upgrade_cost);
                if (buildings.length > 0 && buildings[0].level < build.level && canBuild) {
                    console.log("Upgrading bulding", buildings[0])
                    await buildings[0].upgrade();
                    await getConstruction();
                    break;
                } else if (buildings.length == 0) {
                    console.log('need to construct', build);
                }
            }
        });
        
    }

    self.incomingFarms = async function() {
        console.log('Incoming Farms ::: Village', self.name);
        self.registerTask(async function() {
            await getTroops();
            await Farmer.farm(client, self.number, villageList, oasisList, self.troops.troops, self.coords);
            await getNextIncoming();
        });
    }

    self.update = async function() {
        await client.gotoVillage(self.number);
        await getCoords();
        await getTroops();
        await getResources();
        await getBuildings();
        // await getResBuildings();
        await getConstruction();
        await getNextIncoming();

        self.last_updated = Date.now();
        if (!initialized) {
            initialized = true;
            initilize();
        }
    }

    self.print = function() {
        console.log('Troops:', self.troops);
        console.log('Resources', self.resources);
        console.log('Buildings', self.buildings);
        console.log('ResBuildings', self.resBuildings);
        console.log('Research', self.research);
        console.log('Construction', self.construction);
        console.log('Name', self.name);
    }

}

module.exports = {
    Village: OwnVillage
};