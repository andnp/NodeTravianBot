function getResources() {
    let lumber = -1;
    let clay = -1;
    let iron = -1;
    let food = -1;
    return this.openMain()
    .getText('//*[@id="l1"]', function(err, res) {
        lumber = parseInt(res.replace(',', ''));
    }).getText('//*[@id="l2"]', function(err, res) {
        clay = parseInt(res.replace(',', ''));
    }).getText('//*[@id="l3"]', function(err, res) {
        iron = parseInt(res.replace(',', ''));
    }).getText('//*[@id="l4"]', function(err, res) {
        food = parseInt(res.replace(',', ''));
    }).then(function() {
        return {
            lumber,
            clay,
            iron,
            food
        };
    });
}

function openBuilding(id) {
    return this.url(global.server + '/build.php?id=' + id);
}

function upgradeBuilding(id) {
    let upgraded = false;
    return this
    .openBuilding(id)
    .isExisting('//*[@id="build"]/div[3]/div[4]/div[1]/button[contains(@class, "gold")]')
    .then(function(exists) {
        console.log('Cannot upgrade');
        if (exists) {
            upgraded = false;
        }
    }).isExisting('//*[@id="build"]/div[3]/div[4]/div[1]/button[contains(@class, "green")]')
    .then(function(exists) {
        if (exists) {
            upgraded = true;
            return this.click('//*[@id="build"]/div[3]/div[4]/div[1]/button[contains(@class, "green")]');
        }
    }).then(function() {
        return upgraded;
    });
}

function getResBuildings(village) {
    let buildings = [];
    return this.openMain()
    .gotoVillage(village)
    .getAttribute('//*[@id="rx"]/area', 'alt', function(err, res) {
        for (let i = 0; i < res.length; ++i) {
            let s = res[i].split(' level');
            let building = s[0];
            if (building !== 'Village Center') {
                let level = parseInt(s[1])
                buildings.push({
                    building, level
                });
            }
        }
    }).getAttribute('//*[@id="rx"]/area', 'href', function(err, res) {
        for (let i = 0; i < buildings.length; ++i) {
            let id = parseInt(res[i].split('id=')[1])
            buildings[i].id = id;
        }
    }).then(function() {
        return buildings;
    });
}

function getBuildings(village) {
    let buildings = [];
    return this.openVillageCenter()
    .gotoVillage(village)
    .getAttribute('//*[@id="clickareas"]/area', 'alt', function(err, res) {
        for (let i = 0; i < res.length; ++i) {
            let s = res[i].split(' level');
            let building = s[0].split(' <span')[0].replace("&#39;", '');
            let level = parseInt(s[1])
            buildings.push({
                building, level
            });
        }
    }).getAttribute('//*[@id="clickareas"]/area', 'href', function(err, res) {
        for (let i = 0; i < buildings.length; ++i) {
            let id = parseInt(res[i].split('id=')[1])
            buildings[i].id = id;
        }
    }).then(function() {
        let ret = [];
        for (let i = 0; i < buildings.length; ++i) {
            if (buildings[i].building !== 'Building site') ret.push(buildings[i]);
        }
        return ret;
    });
}

function getBuilding(village, id) {
    let resources = {};
    let time = {};
    return this.gotoVillage(village)
    .url(global.server + '/build.php?id=' + id)
    .isExisting('//*[@id="contract"]/div/div/div/span')
    .then(function(exists) {
        if(exists) {
            return this.getText('//*[@id="contract"]/div/div/div/span', function(err, res) {
                if(err) console.log(err)
                resources.lumber = parseInt(res[0]);
                resources.clay = parseInt(res[1]);
                resources.iron = parseInt(res[2]);
                resources.food = parseInt(res[3]);
            }).getText('//*[@id="build"]/div[3]/div[4]/div[1]/span[1]', function(err, res) {
                if (!res) return {resources: {lumber: 1e10, clay: 1e10, iron: 1e10, food: 1e10}, time: {hour: 1e10, min:1e10, sec:1e10}};
                let s = res.split(':')
                hour = s[0];
                min = s[1];
                sec = s[2];
                time = {hour, min, sec};
            }).then(function() {
                return {resources, time};
            });
        } else {
            return {resources: {lumber: 1e10, clay: 1e10, iron: 1e10, food: 1e10}, time: {hour: 1e10, min:1e10, sec:1e10}};
        }
    });
}

function getConstruction() {
    let building;
    let level;
    let hour;
    let min;
    let sec;
    return this.openMain()
    .isExisting('//*[@id="content"]/div[2]/div[10]/ul/li/div[1]')
    .then(function(exists) {
        if (exists) {
            return this.getText('//*[@id="content"]/div[2]/div[10]/ul/li[1]/div[1]', function(err, res) {
                let s = res.split(' level')
                building = s[0];
                level = parseInt(s[1])
            }).getText('//*[@id="content"]/div[2]/div[10]/ul/li[1]/div[2]/span', function(err, res) {
                let s = res.split(':')
                hour = s[0];
                min = s[1];
                sec = s[2];
            }).then(function() {
                return {
                    building,
                    level,
                    time: {
                        hour, min, sec
                    }
                }
            });
        } else {
            return null;
        }
    });
    
}

function getCoords() {
    let x = 0;
    let y = 0;
    return this.openMap()
    .getUrl(function(err, res) {
        let sx = res.split('x=')[1].split('y=')[0]
        let sy = res.split('y=')[1]
        x = parseInt(sx);
        y = parseInt(sy)
    })
    .then(function() {
        return {x, y};
    })
}

module.exports = function(client){
	client.addCommand('getResources', getResources);
    client.addCommand('getConstruction', getConstruction);
    client.addCommand('getResBuildings', getResBuildings);
    client.addCommand('getBuildings', getBuildings);
    client.addCommand('getBuilding', getBuilding);
    client.addCommand('getCoords', getCoords);
    client.addCommand('upgradeBuilding', upgradeBuilding);
    client.addCommand('openBuilding', openBuilding);
}