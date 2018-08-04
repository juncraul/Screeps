
var helper = require('helper');

var roleCarrieUnloader = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var myMatesAreGoingTo = []
        for(var name in Game.creeps) 
        {
            var cr = Game.creeps[name];
            if(creep.id == cr.id) continue;
            if(cr.memory.role != "carrier" && cr.memory.role != "carrierUnloader") continue;
            if(cr.memory.goingToDeposit) continue;
            myMatesAreGoingTo.push(cr.memory.goingTo);
        }
        
        if(creep.room.name != creep.memory.home.name)
        {
            helper.moveCreepToDifferentRoom(creep, creep.memory.home.name);
            return;
        }   
        
        if(_.sum(creep.carry) == 0) 
        {
            var closesPickup = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if(closesPickup && closesPickup.energy > 100)
            {
                if(creep.pickup(closesPickup) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(closesPickup, {visualizePathStyle: {stroke: '#ffaa00'}});
                    return;
                }
            }
            if(closesPickup && creep.pickup(closesPickup) != ERR_NOT_IN_RANGE) 
            {
                return;
            }
            
            var source;
            var linkCloseToStorage;
            var roomStorage = creep.room.find(FIND_MY_STRUCTURES,{filter: {structureType: STRUCTURE_STORAGE}})[0];
            if(roomStorage)
            {
                linkCloseToStorage = roomStorage.pos.findInRange(FIND_MY_STRUCTURES, 2,{filter: (structure) => {return structure.structureType == STRUCTURE_LINK && structure.energy > 0}})[0];
            }
            if(linkCloseToStorage)
            {
                source = linkCloseToStorage;
            }
            if(!source && roomStorage)
            {
                source = roomStorage;
            }
            if(source)
            {
                creep.memory.goingTo = source.id;
                creep.memory.goingToDeposit = false;
            }
            else
            {
                creep.memory.goingTo = "";
                creep.memory.goingToDeposit = false;
            }
            
            var allAreFilledWithEnergy = creep.room.find(FIND_STRUCTURES, {filter: (structure) => {
                    return (((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN ) && structure.energy < structure.energyCapacity)
                        || (structure.structureType == STRUCTURE_TOWER  && structure.energy < structure.energyCapacity * 0.8))&& !myMatesAreGoingTo.includes(structure.id)}}).length == 0;
            
            
            if(allAreFilledWithEnergy && linkCloseToStorage)
            {
                source = roomStorage;
                if(creep.withdraw(source, RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
            else
            {
                if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        }
        else 
        {
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (structure) => {
                    return (((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN ) && structure.energy < structure.energyCapacity)
                        || (structure.structureType == STRUCTURE_TOWER  && structure.energy < structure.energyCapacity * 0.8)
                        )&& !myMatesAreGoingTo.includes(structure.id)}});
            var priorityTargets = creep.room.find(FIND_STRUCTURES, {filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) &&
                        structure.energy < structure.energyCapacity
                        && !myMatesAreGoingTo.includes(structure.id)}});
            var targetStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (structure) => {return (structure.structureType == STRUCTURE_STORAGE);}});
            var targetTerminal = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (structure) => {return (structure.structureType == STRUCTURE_TERMINAL)}});
            if(priorityTargets.length > 0 && creep.room.find(FIND_HOSTILE_CREEPS).length > 0)
            {
                target = priorityTargets[0];
            }
            
            //TODO: can't read property store, this happens when creep moves by mistake to other room with no storage
            if(creep.carry.energy == 0)
            {
                target = targetStorage;
            }
            if(target == targetStorage && targetStorage != null && _.sum(targetStorage.store) > 150000 && targetStorage.store[RESOURCE_ENERGY] > 100000)
            {
                target = targetTerminal;
            }
            
            if(target)
            {
                creep.memory.goingTo = target.id;
                creep.memory.goingToDeposit = false;
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                if(target.structureType == STRUCTURE_STORAGE || target.structureType == STRUCTURE_TERMINAL)
                {
                    if(creep.transfer(target, RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE)
                    {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
            else
            {
                var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_STORAGE);
                        }
                    });
                if(target)
                {
                    creep.memory.goingTo = target.id;
                    creep.memory.goingToDeposit = true;
                    if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    if(target.structureType == STRUCTURE_STORAGE)
                    {
                        if(creep.transfer(target, RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE)
                        {
                            creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleCarrieUnloader;