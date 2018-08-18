require("prototype.spawn")();

var roleHarvester = require('role.harvester');
var roleCarrier = require('role.carrier');
var roleCarrierUnloader = require('role.carrierUnloader');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var spawnNewCreep = require('spawn.creep');
var towerAttack = require("tower.attack");
var roleLongDistanceBuilder = require("role.longDistanceBuilder");
var roleLongDistanceHarvester = require("role.longDistanceHarvester");
var roleLongDistanceCarrier = require("role.longDistanceCarrier");
var roleClaimer = require("role.claimer");
var roleSoldier = require("role.soldier");
var logicLink = require("logic.link");
var logicMarket = require("logic.market");
var logicTasks = require("logic.tasks");
var logicCreateConstructionSites = require("logic.createConstructionSites");
var roleArmyAttacker = require("role.armyAttacker");
var roleArmyHealer = require("role.armyHealer");
var roleSpy = require("role.spy");
var helper = require('helper');

module.exports.loop = function () {
    
    var armyAttacker = _.filter(Game.creeps, (creep) => creep.memory.role === 'armyAttacker');
    var armyHealer = _.filter(Game.creeps, (creep) => creep.memory.role === 'armyHealer');
    var spys = _.filter(Game.creeps, (creep) => creep.memory.role === 'spy');
    var remoteRoomsToHarvest = logicTasks.getRemoteRoomsToHarvest();
    var roomToReserve = logicTasks.getRoomToReserve();
    var roomToProtect = logicTasks.getroomToProtect();
    var roomToBuild = logicTasks.getroomToBuild();
    var roomToSpy = logicTasks.getroomToSpy();
    var myRoomsWithController = logicTasks.getmyRoomsWithController();
    
    for(var roomIndex = 0; roomIndex < myRoomsWithController.length; roomIndex ++)
    {
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var carrierUnloaders = _.filter(Game.creeps, (creep) => creep.memory.role === 'carrierUnloader' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var carriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'carrier' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var claimer = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var soldier = _.filter(Game.creeps, (creep) => creep.memory.role === 'soldier' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var longDistanceBuilders = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceBuilder' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var longDistanceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceHarvester' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var longDistanceCarriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceCarrier' && creep.memory.home.name === myRoomsWithController[roomIndex].name);
        var mySpawns = myRoomsWithController[roomIndex].find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_SPAWN});
        var energyCapacityInRoom = myRoomsWithController[roomIndex].energyCapacityAvailable;
        var energyAvailableInRoom = myRoomsWithController[roomIndex].energyAvailable;
        
        myRoomsWithController[roomIndex].visual.text("Harvester: " + harvesters.length, 0, 0, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Carrier: " + carriers.length, 0, 1, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Carrier Unloader: " + carrierUnloaders.length, 0, 2, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Upgrader: " + upgraders.length, 0, 3, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Builder: " + builders.length, 0, 4, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("LongDistanceBuilder: " + longDistanceBuilders.length, 0, 5, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("LongDistanceHarvester: " + longDistanceHarvesters.length, 0, 6, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("LongDistanceCarrier: " + longDistanceCarriers.length, 0, 7, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Claimer: " + claimer.length, 0, 8, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Soldier: " + soldier.length, 0, 9, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Army Attacker: " + armyAttacker.length, 9, 0, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Army Healer: " + armyHealer.length, 9, 1, {align: 'left', opacity: 0.5});
        myRoomsWithController[roomIndex].visual.text("Spy: " + spys.length, 9, 2, {align: 'left', opacity: 0.5});

        var i;
        if(Game.time % 5 === 0)
        {
            var allSpawnsAreBusy = true;
            for(i = 0; i < mySpawns.length; i ++)
            {
                if(!mySpawns[i].spawning)
                {
                    allSpawnsAreBusy = false;
                }
            }
            if (allSpawnsAreBusy) {
                console.log("All spawns are busy");
            }
            else if(spawnHarvester(myRoomsWithController[roomIndex]))
            {
                console.log(myRoomsWithController[roomIndex] + " - A new harvester will atempt to spawn.");
            }
            else if(spawnCarrier(myRoomsWithController[roomIndex])) {
                console.log(myRoomsWithController[roomIndex] + " - A new carrier will atempt to spawn.");
            }
            else if(spawnCarrierUnloader(myRoomsWithController[roomIndex])) {
                console.log(myRoomsWithController[roomIndex] + " - A new carrier unloader will atempt to spawn.");
            }
            else if(spawnBuilder(myRoomsWithController[roomIndex])) {
                console.log(myRoomsWithController[roomIndex] + " - A new builder will atempt to spawn.");
            }
            else if(spawnUpgrader(myRoomsWithController[roomIndex])) {
                console.log(myRoomsWithController[roomIndex] + " - A new upgrader will atempt to spawn.");
            }
            else if(spawnLongDistanceHarvester(myRoomsWithController[roomIndex], remoteRoomsToHarvest)) {
                console.log(myRoomsWithController[roomIndex] + " - A new long distance harvester will atempt to spawn.");
            }
            else if(spawnLongDistanceCarrier(myRoomsWithController[roomIndex], remoteRoomsToHarvest)) {
                console.log(myRoomsWithController[roomIndex] + " - A new long distance carrier will atempt to spawn.");
            }
            else if(spawnSoldier(myRoomsWithController[roomIndex], roomToProtect)) {
                console.log(myRoomsWithController[roomIndex] + " - A new soldier will atempt to spawn.");
            }
            else if(spawnLongDistanceBuilder(myRoomsWithController[roomIndex], roomToBuild)) {
                console.log(myRoomsWithController[roomIndex] + " - A new long distance builder will atempt to spawn.");
            }
            else if(spawnClaimer(myRoomsWithController[roomIndex], roomToReserve)) {
                console.log(myRoomsWithController[roomIndex] + " - A new claimer will atempt to spawn.");
            }
            else if(spawnArmy(myRoomsWithController[roomIndex])) {
                console.log(myRoomsWithController[roomIndex] + " - A new army attacher/healer will atempt to spawn.");
            }
            else if(spawnSpy(myRoomsWithController[roomIndex])) {
                console.log(myRoomsWithController[roomIndex] + " - A new spy will atempt to spawn.");
            }
        }
    
        
        
        var towers = myRoomsWithController[roomIndex].find(FIND_MY_STRUCTURES, {filter : object => {return object.structureType === STRUCTURE_TOWER}});
        
        for(i = 0; i < towers.length; i ++)
        {
            towerAttack.run(towers[i], i);
        }
        
        for(i = 0; i < mySpawns.length; i ++)
        {
            if(mySpawns[i].spawning) 
            {
                var spawningCreep = Game.creeps[mySpawns[i].spawning.name];
                mySpawns[i].room.visual.text(mySpawns[i] + ': 🛠️' + spawningCreep.memory.role, 33, i, {align: 'left', opacity: 0.8});
            }
            else
            {
                mySpawns[i].room.visual.text(mySpawns[i] + ': N/A️' , 33, i, {align: 'left', opacity: 0.8});
            }
        }
        logicLink.run(myRoomsWithController[roomIndex]);
    }

    var name;
    for(name in Game.creeps) 
    {
        var creep = Game.creeps[name];
        if(creep.memory.role === "harvester")
        {
            roleHarvester.run(creep);
        }
        else if(creep.memory.role === "carrier")
        {
            roleCarrier.run(creep);
        }
        else if(creep.memory.role === "carrierUnloader")
        {
            roleCarrierUnloader.run(creep);
        }
        else if(creep.memory.role === "upgrader")
        {
            roleUpgrader.run(creep);
        }
        else if(creep.memory.role === "builder")
        {
            roleBuilder.run(creep);
        }
        else if(creep.memory.role === "longDistanceBuilder")
        {
            roleLongDistanceBuilder.run(creep, creep.memory.remote);
        }
        else if(creep.memory.role === "longDistanceHarvester")
        {
            roleLongDistanceHarvester.run(creep, creep.memory.remote);
        }
        else if(creep.memory.role === "longDistanceCarrier")
        {
            roleLongDistanceCarrier.run(creep, creep.memory.remote);
        }
        else if(creep.memory.role === "claimer")
        {
            roleClaimer.run(creep, creep.memory.remote);
        }
        else if(creep.memory.role === "soldier")
        {
            roleSoldier.run(creep, roomToProtect, creep.memory.remote);
        }
        else if(creep.memory.role === "armyAttacker")
        {
            roleArmyAttacker.run(creep);
        }
        else if(creep.memory.role === "armyHealer")
        {
            roleArmyHealer.run(creep);
        }
        else if(creep.memory.role === "spy")
        {
            roleSpy.run(creep, creep.memory.remote);
        }
    }
        
    for(name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    
    if(Game.time % 10 === 0)
    {
        logicMarket.run();
        logicCreateConstructionSites.run();
    }
}

var spawnHarvester = function(roomToSpawnFrom) {
    var harvestersInRoom = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.memory.home.name === roomToSpawnFrom.name);
    var longDistanceHarvestersInRoom = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceHarvester' && creep.memory.remote === roomToSpawnFrom.name);
    var harvestersAboutToDie = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.memory.home.name === roomToSpawnFrom.name && creep.ticksToLive < 150);
    var carriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'carrier' && creep.memory.home.name === roomToSpawnFrom.name);
    var containersInRoom = roomToSpawnFrom.find(FIND_STRUCTURES, {filter: (structure) => {return (structure.structureType === STRUCTURE_CONTAINER)}}).length;
    var sources = roomToSpawnFrom.find(FIND_SOURCES);
    var harvesterCurrentWorkBodyParts = helper.getActiveBodyPartsFromArrayOfCreeps(harvestersInRoom, WORK) + helper.getActiveBodyPartsFromArrayOfCreeps(longDistanceHarvestersInRoom, WORK)
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 900; //Harvester with 6 work body parts, perfect to harvest 3000 in 300 ticks
    
    //TODO: Also store amount of work body parts if the creeps meant to die will actually die
    var keyToStoreMaxPosHar = "MaximumPossibleHarvesters-" + roomToSpawnFrom.name;
    var maximumPossibleHarvesters = helper.getCashedMemory(keyToStoreMaxPosHar);
    if(maximumPossibleHarvesters === null)
    {
        maximumPossibleHarvesters = 0;
        for(var i = 0; i < sources.length; i ++)
        {
            for(var j = -1; j <= 1; j ++)
            {
                for(var k = -1; k <= 1; k ++)
                {
                    if(Game.map.getTerrainAt(sources[i].pos.x + j, sources[i].pos.y + k, roomToSpawnFrom.name) !== "wall")
                    {
                        maximumPossibleHarvesters ++;
                    }
                }
            }
        }
        helper.setCashedMemory(keyToStoreMaxPosHar, maximumPossibleHarvesters);
    }
    
    if(harvestersInRoom.length + longDistanceHarvestersInRoom.length >= maximumPossibleHarvesters)
        return false;
    
    if(harvestersInRoom.length >= 1 && carriers.length === 0 && containersInRoom !== 0)
        return false;
    
    if(containersInRoom === 0)
    {
        if(harvesterCurrentWorkBodyParts < 20 && harvestersInRoom.length < 5)//8)
        {
            console.log("Not enough body parts in current room, a new harvester with minimum avilable energy needs to be built.");
            spawnNewCreep.run(roomToSpawnFrom, energyAvailableInRoom < maximumEnergyAllowedToBeUsed ? energyAvailableInRoom : maximumEnergyAllowedToBeUsed, 'harvester', 0, null);
            return true;
        }
    } else 
    {
        if(harvestersInRoom.length < 2)
        {
            if(harvesterCurrentWorkBodyParts < 4)//6) 
            {
                console.log("Not enough body parts in current room, a new harvester with minimum avilable energy needs to be built.");
                spawnNewCreep.run(roomToSpawnFrom, energyAvailableInRoom < maximumEnergyAllowedToBeUsed ? energyAvailableInRoom : maximumEnergyAllowedToBeUsed, 'harvester', energyAvailableInRoom < 500 ? 0 : 1, null);
            } else 
            {
                console.log("Not enough harvesters in current room, a new ELITE harvester needs to be built.");
                spawnNewCreep.run(roomToSpawnFrom, energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? energyCapacityInRoom : maximumEnergyAllowedToBeUsed, 'harvester', energyAvailableInRoom < 500 ? 0 : 1, null);
            }
            return true;
        }
        //else if(harvesterCurrentWorkBodyParts < 15 && harvestersInRoom.length < 6)
        //{
        //    console.log("Not enough body parts in current room, a new harvester with minimum avilable energy needs to be built.");
        //    spawnNewCreep.run(roomToSpawnFrom, energyAvailableInRoom < maximumEnergyAllowedToBeUsed ? energyAvailableInRoom : maximumEnergyAllowedToBeUsed, 'harvester', energyAvailableInRoom < 500 ? 0 : 1, null);
        //    return true;
        //}
        else if(harvesterCurrentWorkBodyParts < 12 && harvestersInRoom.length < 8)//12 work body parts are enough for 2 sources
        {
            console.log("Not enough harvesters in current room, a new ELITE harvester needs to be built.");
            spawnNewCreep.run(roomToSpawnFrom, energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? energyCapacityInRoom : maximumEnergyAllowedToBeUsed, 'harvester', energyAvailableInRoom < 500 ? 0 : 1, null);
            return true;
        }
        else if(harvesterCurrentWorkBodyParts < 18 && harvestersAboutToDie.length !== 0)//although create a new harvester when one other harveter is about to die
        {
            console.log("A harvester is about to die, create a new ELITE one.");
            spawnNewCreep.run(roomToSpawnFrom, energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? energyCapacityInRoom : maximumEnergyAllowedToBeUsed, 'harvester', energyAvailableInRoom < 500 ? 0 : 1, null);
            return true;
        }
    }
}

var spawnBuilder = function(roomToSpawnFrom) {
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder' && creep.memory.home.name === roomToSpawnFrom.name);
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var noOfConstructionSites = (roomToSpawnFrom.find(FIND_CONSTRUCTION_SITES)).length;
    var maximumEnergyAllowedToBeUsed = 1400;
    var buildersCurrentWorkBodyParts = 0;
    var roomStorage = roomToSpawnFrom.find(FIND_MY_STRUCTURES,{ filter: (structure) => {return (structure.structureType === STRUCTURE_STORAGE)}})[0];
    
    for(var i = 0; i < builders.length; i ++) 
    {
        buildersCurrentWorkBodyParts += builders[i].getActiveBodyparts(WORK);
    }
    
    if(noOfConstructionSites > 0 && buildersCurrentWorkBodyParts < 3 && (roomStorage === null || (roomStorage !== null && roomStorage.store[RESOURCE_ENERGY] > 1000))){
            console.log("There are construction sites that need building and there is energy avilable for the construction materials. A new builder is required.");
            spawnNewCreep.run(roomToSpawnFrom, energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? energyCapacityInRoom / 1.5 : maximumEnergyAllowedToBeUsed, 'builder', 0, null);
            return true;
    }
}

var spawnCarrier = function(roomToSpawnFrom) {
    var carriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'carrier' && creep.memory.home.name === roomToSpawnFrom.name);
    var containers = roomToSpawnFrom.find(FIND_STRUCTURES, {filter: (structure) => { return (structure.structureType === STRUCTURE_CONTAINER)}});
    var containersInRoom = containers.length;
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 2000;
    var minimumEnergyAllowedToBeUsed = energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? (energyCapacityInRoom < 700 ? energyCapacityInRoom : 700) : maximumEnergyAllowedToBeUsed;
    
    var energyInContainers = 0;
    for(var i = 0; i < containers.length; i ++)
    {
        energyInContainers += containers[i].store[RESOURCE_ENERGY];
    }
    
    if(carriers.length < 1 && containersInRoom > 0 && energyInContainers > 500) {
        spawnNewCreep.run(roomToSpawnFrom, energyAvailableInRoom, 'carrier', 0, null);
        
        return true;
    }
    else if(carriers.length < 2 && containersInRoom > 0 && energyCapacityInRoom > 500 && energyInContainers > 500) 
    {
        spawnNewCreep.run(roomToSpawnFrom, minimumEnergyAllowedToBeUsed < energyAvailableInRoom ? energyAvailableInRoom : minimumEnergyAllowedToBeUsed, 'carrier', 0, null);
        return true;
    }
}

var spawnCarrierUnloader = function(roomToSpawnFrom) {
    var carrierUnloaders = _.filter(Game.creeps, (creep) => creep.memory.role === 'carrierUnloader' && creep.memory.home.name === roomToSpawnFrom.name);
    var linksInRoom = roomToSpawnFrom.find(FIND_STRUCTURES, {filter: (structure) => {return (structure.structureType === STRUCTURE_LINK)}}).length;
    var roomStorage = roomToSpawnFrom.find(FIND_MY_STRUCTURES, {filter: (structure) => { return (structure.structureType === STRUCTURE_STORAGE)}});
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 1300;
    
    if(linksInRoom <= 1) return;
    
    if(carrierUnloaders.length < 1 || (carrierUnloaders.length < 2 && roomStorage.length !== 0 && _.sum(roomStorage[0].store) > 500000)) {
        spawnNewCreep.run(roomToSpawnFrom, maximumEnergyAllowedToBeUsed, 'carrierUnloader', 0, null);
        return true;
    }
}

var spawnUpgrader = function(roomToSpawnFrom) {
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader' && creep.memory.home.name === roomToSpawnFrom.name);
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder' && creep.memory.home.name === roomToSpawnFrom.name);
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var upgraderCurrentWorkBodyParts = helper.getActiveBodyPartsFromArrayOfCreeps(upgraders, WORK);
    var maximumEnergyAllowedToBeUsed = 1400;
    var maximumEnergyAllowedToBeUsedMaxController = 600;
    var energyAailableInStore = roomToSpawnFrom.find(FIND_MY_STRUCTURES, {filter: (structure) => { return (structure.structureType === STRUCTURE_STORAGE)}});
    var containers = roomToSpawnFrom.find(FIND_STRUCTURES, {filter: (structure) => { return (structure.structureType === STRUCTURE_CONTAINER)}});
    var closePickup = roomToSpawnFrom.controller.pos.findInRange(FIND_MY_STRUCTURES, 5, {filter: (structure) => { return structure.structureType === STRUCTURE_STORAGE || structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_LINK }});
    var controllerLevel = roomToSpawnFrom.controller.level;
    var spawnsFromRoom = roomToSpawnFrom.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_SPAWN});
    var fastGrow = spawnsFromRoom[0].memory.fastGrowOverride === null ? 0 : spawnsFromRoom[0].memory.fastGrowOverride;
    
    var energyInContainers = 0;
    for(var i = 0; i < containers.length; i ++)
    {
        energyInContainers += containers[i].store[RESOURCE_ENERGY];
    }
    
    if((energyAailableInStore.length !== 0 && ((energyAailableInStore[0].store[RESOURCE_ENERGY] > 10000 && upgraders.length < 1) 
                                           || (energyAailableInStore[0].store[RESOURCE_ENERGY] > 50000 && upgraders.length < 2) 
                                           || (energyAailableInStore[0].store[RESOURCE_ENERGY] > 150000 && upgraders.length < 3))) 
     || (energyAailableInStore.length === 0 && (upgraders.length < 1 || (upgraders.length < 4 && upgraderCurrentWorkBodyParts < 15 && energyInContainers > 1000)))
     || (upgraders.length < fastGrow))
    {
        console.log("There is enough energy in the store for an upgrader to start working. A new upgrader is required.");
        if(closePickup.length !== 0 && controllerLevel === 8)
        {
            spawnNewCreep.run(roomToSpawnFrom, maximumEnergyAllowedToBeUsedMaxController, 'upgrader', 1, null);
        }
        else
        {
            spawnNewCreep.run(roomToSpawnFrom, energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? energyCapacityInRoom : maximumEnergyAllowedToBeUsed, 'upgrader', 0, null);
        }
        return true;
    }
}

var spawnLongDistanceBuilder = function(roomToSpawnFrom, remoteRoomsToBuild) {
    var longDistanceBuilders = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceBuilder');
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 1000;
    var minimumEnergyAllowedToBeUsed = energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? 700 : maximumEnergyAllowedToBeUsed;
    var roomConnections = logicTasks.getRoomConnections(roomToSpawnFrom.name);
    
    for(var i = 0; i < remoteRoomsToBuild.length; i ++) {
        if(roomConnections.length !== 0 && !roomConnections.includes(remoteRoomsToBuild[i]))
            continue;
        var noEnemies = Game.rooms[remoteRoomsToBuild[i]] === null ? 0 : Game.rooms[remoteRoomsToBuild[i]].find(FIND_HOSTILE_CREEPS).length
        var noRepairSites = Game.rooms[remoteRoomsToBuild[i]] === null ? 0 : Game.rooms[remoteRoomsToBuild[i]].find(FIND_STRUCTURES, {filter: object => (object.hits < object.hitsMax * 0.50)}).length;
        var noConstructionSites = Game.rooms[remoteRoomsToBuild[i]] === null ? 0 :  Game.rooms[remoteRoomsToBuild[i]].find(FIND_MY_CONSTRUCTION_SITES).length;
        var longDistanceBuildersInRemoteRoom = _.filter(longDistanceBuilders, (creep) => creep.memory.remote === remoteRoomsToBuild[i]);
        var containersInRoom = Game.rooms[remoteRoomsToBuild[i]] === null ? 0 : Game.rooms[remoteRoomsToBuild[i]].find(FIND_STRUCTURES, {filter: (structure) => {return (structure.structureType === STRUCTURE_CONTAINER)}}).length;
        
        if(noEnemies > 0)
        {
            continue
        }
        
        if(containersInRoom > 0 && longDistanceBuildersInRemoteRoom.length < 1 && (noConstructionSites > 0 || noRepairSites > 0)) {
            spawnNewCreep.run(roomToSpawnFrom, minimumEnergyAllowedToBeUsed < maximumEnergyAllowedToBeUsed ? minimumEnergyAllowedToBeUsed : maximumEnergyAllowedToBeUsed, 'longDistanceBuilder', 0, remoteRoomsToBuild[i]);
            return true;
        }
    }
}

var spawnLongDistanceHarvester = function(roomToSpawnFrom, remoteRoomsToHarvest) {
    var longDistanceHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceHarvester');
    var longDistanceCarriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceCarrier');
    var containersInRoom = roomToSpawnFrom.find(FIND_STRUCTURES, {filter: (structure) => {return (structure.structureType === STRUCTURE_CONTAINER)}}).length;
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 950;//6 work; 1 carry; 6 move
    var minimumEnergyAllowedToBeUsed = energyCapacityInRoom < maximumEnergyAllowedToBeUsed ? 650 : maximumEnergyAllowedToBeUsed;
    var roomToClaim = logicTasks.getRoomToClaim();
    var roomConnections = logicTasks.getRoomConnections(roomToSpawnFrom.name);
    
    
    for(var i = 0; i < remoteRoomsToHarvest.length; i ++) {
        if(roomConnections.length !== 0 && !roomConnections.includes(remoteRoomsToHarvest[i]))
            continue;
        var noEnemies = Game.rooms[remoteRoomsToHarvest[i]] === null ? 0 : Game.rooms[remoteRoomsToHarvest[i]].find(FIND_HOSTILE_CREEPS).length
        var longDistanceHarvestersInRemoteRoom = _.filter(longDistanceHarvesters, (creep) => creep.memory.remote === remoteRoomsToHarvest[i]);
        var longDistanceCarriersInRemoteRoom = _.filter(longDistanceCarriers, (creep) => creep.memory.remote === remoteRoomsToHarvest[i]);
        var sources = Game.rooms[remoteRoomsToHarvest[i]] !== null ? Game.rooms[remoteRoomsToHarvest[i]].find(FIND_SOURCES) : [];
        var noSourcesInRemoteRoom = sources.length === 0 ? 1 : sources.length;
        var keyToStoreMaxPosHar = "MaximumPossibleHarvesters-" + remoteRoomsToHarvest[i];
        var harvesterCurrentWorkBodyParts = helper.getActiveBodyPartsFromArrayOfCreeps(longDistanceHarvestersInRemoteRoom, WORK)
        var roomInDanger = helper.getCashedMemory("Danger-" + remoteRoomsToHarvest[i]);
        var userWhoClaimedItSoFar = Game.rooms[remoteRoomsToHarvest[i]] !== null ? (Game.rooms[remoteRoomsToHarvest[i]].controller.reservation !== null ? Game.rooms[remoteRoomsToHarvest[i]].controller.reservation.username : "Raul") : "Raul";
        
        
        if(noEnemies > 0 || (roomInDanger !== null && roomInDanger - Game.time > roomInDanger > 0) || userWhoClaimedItSoFar !== "Raul")
        {
            console.log("The room " + remoteRoomsToHarvest[i] + " is in danger. We will wait for the room to get cleared down")
            continue
        }
        
        //TODO: This doesn't work in room w34s53 still creates 2 harvesters
        var maximumPossibleHarvesters = helper.getCashedMemory(keyToStoreMaxPosHar);
        if(maximumPossibleHarvesters === null)
        {
            if(sources.length === 0)
            {
                maximumPossibleHarvesters = 1;
            }
            else
            {
                maximumPossibleHarvesters = 0;
                for(var l = 0; l < sources.length; l ++)
                {
                    for(var j = -1; j <= 1; j ++)
                    {
                        for(var k = -1; k <= 1; k ++)
                        {
                            if(Game.map.getTerrainAt(sources[l].pos.x + j, sources[l].pos.y + k, remoteRoomsToHarvest[i]) !== "wall")
                            {
                                maximumPossibleHarvesters ++;
                            }
                        }
                    }
                }
                helper.setCashedMemory(keyToStoreMaxPosHar, maximumPossibleHarvesters);
            }
        }
        
        if(longDistanceHarvestersInRemoteRoom.length >= maximumPossibleHarvesters)
            continue;
        
        if(maximumPossibleHarvesters / noSourcesInRemoteRoom === 1){//There is only one place for harvester per source, create a 6 work creep
            minimumEnergyAllowedToBeUsed = 950;
        }
        
        //keep longDistanceCarriers/longDistanceHarveters to 1:2 so that carriers have a chance to spawn as well but only when there are more than 2 harveters in that room
        if(longDistanceCarriersInRemoteRoom.length < longDistanceHarvestersInRemoteRoom.length / 2 && longDistanceHarvestersInRemoteRoom.length > 2 && !roomToClaim.includes(remoteRoomsToHarvest[i]))
            continue
        
        //We need 6 body parts per source
        if(harvesterCurrentWorkBodyParts < noSourcesInRemoteRoom * 6) {
            spawnNewCreep.run(roomToSpawnFrom, minimumEnergyAllowedToBeUsed < maximumEnergyAllowedToBeUsed ? minimumEnergyAllowedToBeUsed : maximumEnergyAllowedToBeUsed, 'longDistanceHarvester', 1, remoteRoomsToHarvest[i]);
            return true;
        }
    }
}

var spawnLongDistanceCarrier = function(roomToSpawnFrom, remoteRoomsToHarvest) {
    var longDistanceCarriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'longDistanceCarrier');
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 2600;
    var minimumEnergyAllowedToBeUsed = 1000;
    var roomToClaim = logicTasks.getRoomToClaim();
    var roomConnections = logicTasks.getRoomConnections(roomToSpawnFrom.name);
    
    for(var i = 0; i < remoteRoomsToHarvest.length; i ++) {
        if(roomConnections.length !== 0 && !roomConnections.includes(remoteRoomsToHarvest[i]))
            continue;
        var noEnemies = Game.rooms[remoteRoomsToHarvest[i]] === null ? 0 : Game.rooms[remoteRoomsToHarvest[i]].find(FIND_HOSTILE_CREEPS).length
        var longDistanceHarvestersInRemoteRoom = _.filter(longDistanceCarriers, (creep) => creep.memory.remote === remoteRoomsToHarvest[i]);
        var noSourcesInRemoteRoom = Game.rooms[remoteRoomsToHarvest[i]] === null ? 1 : Game.rooms[remoteRoomsToHarvest[i]].find(FIND_SOURCES).length;
        var containersInRoom = Game.rooms[remoteRoomsToHarvest[i]] === null ? [] : Game.rooms[remoteRoomsToHarvest[i]].find(FIND_STRUCTURES, {filter: (structure) => {return (structure.structureType === STRUCTURE_CONTAINER)}});
        var resourcesInRoom = 0;
        var energyToUse = minimumEnergyAllowedToBeUsed
        
        if(noEnemies > 0)
        {
            continue
        }
        for(var j = 0; j < containersInRoom.length; j ++)
        {
            resourcesInRoom += _.sum(containersInRoom[j].store)
        }
        
        if(resourcesInRoom > 2000 || containersInRoom.length > 2)
        {
            energyToUse = 2050;
        }
        else if(resourcesInRoom > 1500)
        {
            energyToUse = 1600;
        }
        else if(resourcesInRoom > 1000)
        {
            energyToUse = 1450;
        }
        
        energyToUse = energyCapacityInRoom < energyToUse ? energyCapacityInRoom : energyToUse;
        
        if(roomToClaim.includes(remoteRoomsToHarvest[i]))
            continue;
        
        //TODO: Test this i guess (too sleepy to test it now)
        //strip it in a function. energyToUse is adjusted in the min/max interval and also it needs to be less the room energy capacity
        energyToUse = energyCapacityInRoom < energyToUse 
                        ? (energyCapacityInRoom < minimumEnergyAllowedToBeUsed 
                                ? minimumEnergyAllowedToBeUsed : energyCapacityInRoom) 
                        : (energyToUse > maximumEnergyAllowedToBeUsed)
                                ? maximumEnergyAllowedToBeUsed : energyToUse;
        if(longDistanceHarvestersInRemoteRoom.length < noSourcesInRemoteRoom && containersInRoom.length > 0) {
            spawnNewCreep.run(roomToSpawnFrom, energyToUse, 'longDistanceCarrier', 1, remoteRoomsToHarvest[i]);
            return true;
        }
    }
}

//Claimers will spawn only if the room is protected
var spawnClaimer = function(roomToSpawnFrom, roomToReserve) {
    if(roomToReserve.length === 0) return false;
    var claimer = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer');
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 1300;
    var roomConnections = logicTasks.getRoomConnections(roomToSpawnFrom.name);
    //Claim body part costs 600
    
    for(var i = 0; i < roomToReserve.length; i ++) {
        if(roomConnections.length !== 0 && !roomConnections.includes(roomToReserve[i]))
            continue;
        if(Game.rooms[roomToReserve[i]] === null)//Aka no visibility to room
            continue
        var noEnemies = Game.rooms[roomToReserve[i]] === null ? 0 : Game.rooms[roomToReserve[i]].find(FIND_HOSTILE_CREEPS).length
        var controllerFromRoom = Game.rooms[roomToReserve[i]].controller;
        var claimerInRemoteRoom = _.filter(claimer, (creep) => creep.memory.remote === roomToReserve[i]);
        var userWhoClaimedItSoFar = controllerFromRoom.reservation !== null ? controllerFromRoom.reservation.username : "Raul";
        var ticksTillReservationEnds =  controllerFromRoom.reservation !== null ? controllerFromRoom.reservation.ticksToEnd : 0;
        var creepsProtectingTheRoom = _.filter(Game.creeps, (creep) => creep.pos.roomName === roomToReserve[i] && (creep.memory.role === "armyAttacker" || creep.memory.role === "soldier"));
        var controllerOwnedBy = controllerFromRoom.owner !== null ? controllerFromRoom.owner.username : "N/A"
        
        var needToDowngrade = logicTasks.getRoomToDowngrade().includes(roomToReserve[i]);
        
        if(noEnemies > 0)
        {
            continue
        }
        //If is not protected or is it already owned by someone with the exception when it needs downgrading
        if(//creepsProtectingTheRoom.length === 0 || //New rule, no need of security creeps anymore
        controllerFromRoom.upgradeBlocked > 100 || controllerOwnedBy === "Raul" //|| (controllerOwnedBy !== "N/A" && !needToDowngrade) || (controllerOwnedBy !== "Raul" && !needToDowngrade))
        ){ 
            continue;
        }
        
        if(claimerInRemoteRoom.length < 1 && ((userWhoClaimedItSoFar === "Raul" && ticksTillReservationEnds < 3000) || userWhoClaimedItSoFar !== "Raul")) {
            spawnNewCreep.run(roomToSpawnFrom, maximumEnergyAllowedToBeUsed, 'claimer', 0, roomToReserve[i]);
            return true;
        }
    }
}

var spawnSoldier = function(roomToSpawnFrom, roomsToProtect) {
    var soldier = _.filter(Game.creeps, (creep) => creep.memory.role === 'soldier');
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var maximumEnergyAllowedToBeUsed = 760;
    var roomConnections = logicTasks.getRoomConnections(roomToSpawnFrom.name);
    
    for(var i = 0; i < roomsToProtect.length; i ++) {
        if(roomConnections.length !== 0 && !roomConnections.includes(roomsToProtect[i]))
            continue;
        var noEnemies = Game.rooms[roomsToProtect[i]] === null ? 1 : Game.rooms[roomsToProtect[i]].find(FIND_HOSTILE_CREEPS).length
        var soldierInRemoteRoom = _.filter(soldier, (creep) => creep.memory.remote === roomsToProtect[i]);
        if(noEnemies === 0)
        {
            continue
        }
        if(soldierInRemoteRoom.length < 1) {
            spawnNewCreep.run(roomToSpawnFrom, maximumEnergyAllowedToBeUsed, 'soldier', 0, roomsToProtect[i]);
            return true;
        }
    }
}

var spawnArmy = function(roomToSpawnFrom) {
    if(Game.flags["Attack"] === null){
        return false;
    }
    
    var armyAttacker = _.filter(Game.creeps, (creep) => creep.memory.role === 'armyAttacker');
    var armyHealer = _.filter(Game.creeps, (creep) => creep.memory.role === 'armyHealer');
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    var enrgForAttacker = 1710; //9 sets of tough-attack-move //down from 1900 which had 10 sets
    var enrgForHealer = 1440; //4 sets of tough-heal-move //down from 1800 which had 4 sets
    
    if(armyAttacker.length < 3 )//|| (armyHealer.length >= 1 && armyAttacker.length < 4))
    {
        spawnNewCreep.run(roomToSpawnFrom, enrgForAttacker, 'armyAttacker', 0, null);
        return true;
    }
    else if(armyHealer.length < 2)
    {
        spawnNewCreep.run(roomToSpawnFrom, enrgForHealer, 'armyHealer', 0, null);
        return true;
    }
}

var spawnSpy = function(roomToSpawnFrom, roomsToSpy) {
    if(Game.flags["Attack"] === null){
        return;
    }
    
    var spys = _.filter(Game.creeps, (creep) => creep.memory.role === 'spy');
    var energyCapacityInRoom = roomToSpawnFrom.energyCapacityAvailable;
    var energyAvailableInRoom = roomToSpawnFrom.energyAvailable;
    
    for(var i = 0; i < roomsToSpy.length; i ++)
    {
        var spyInRemoteRoom = _.filter(spys, (creep) => creep.memory.remote === roomsToSpy[i]);
        
        if(spyInRemoteRoom.length < 1)
        {
            spawnNewCreep.run(roomToSpawnFrom, 100, 'spy', 0, null);
            return true;
        }
    }
}









