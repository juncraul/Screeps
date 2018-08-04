
var helper = require('helper');

var roleLongDistanceCarrier = {

    /** @param {Creep} creep **/
    run: function(creep, roomToHarvest) {
        var myMatesAreGoingTo = []
        for(var name in Game.creeps) 
        {
            var cr = Game.creeps[name];
            if(creep.id == cr.id) continue;
            if(cr.memory.role != "longDistanceCarrier") continue;
            if(cr.memory.goingToDeposit) continue;
            myMatesAreGoingTo.push(cr.memory.goingTo);
        }
        
        var mostDamagedStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => (structure.hits < structure.hitsMax * 0.20) && structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART && structure.structureType != STRUCTURE_LINK
            });
        var targetBuild = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if(creep.carry.energy > 0 && creep.room.name == roomToHarvest) 
        {
            if(mostDamagedStructure)
            {
                if(creep.repair(mostDamagedStructure) == OK){
                    return;
                }
            }
            if(targetBuild)
            {
                if(creep.build(targetBuild) == OK){
                    return;
                }
            }
        }
            
        if(creep.carry.energy < creep.carryCapacity * 0.1) 
        {
            if(creep.room.name != roomToHarvest)
            {
                helper.moveCreepToDifferentRoom(creep, roomToHarvest);
                return;
            }   
            else
            {
                helper.moveOffTheEdge(creep);
            }
            var source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if(source && source.energy > 100)
            {
                if(creep.pickup(source) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                    return;
                }
            }
            if(source && creep.pickup(source) != ERR_NOT_IN_RANGE) 
            {
                return;
            }
            var source = creep.pos.findClosestByRange(FIND_TOMBSTONES);
            if(source != null && _.sum(source.store) > 100)
            {
                if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
                return;
            }
            
            var previousSelectedSource = creep.room.find(FIND_STRUCTURES,{
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) > 0) || 
                            (structure.structureType == STRUCTURE_LINK && structure.energy > 0))
                        && (structure.id == creep.memory.goingTo)
                    }
            })[0];
            
            var sources = creep.room.find(FIND_STRUCTURES,{
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] > 0
                    && ((previousSelectedSource != null && structure.id == previousSelectedSource.id) || (previousSelectedSource == null));;
                }
            });
            //if(creep.room.name == "W32S55")
            //{
            //    console.log("------")
            //    console.log("creep id " + creep.id)
            //    console.log("sources " + sources)
            //}
            var mostFilledSource;
            for(var i = 0; i < sources.length; i ++)
            {
                if(!mostFilledSource)
                {
                    mostFilledSource = sources[i];
                }
                if(sources[i].store[RESOURCE_ENERGY] > mostFilledSource.store[RESOURCE_ENERGY])
                {
                    //if(creep.room.name == "W32S55")
                    //{
                    //    console.log("found a more filled source " + sources[i].id)
                    //    console.log("previous " + mostFilledSource.id)
                    //}
                    mostFilledSource = sources[i];
                }
                else if(sources[i].store[RESOURCE_ENERGY] == mostFilledSource.store[RESOURCE_ENERGY])//In case two sources have same amout
                {
                    //if(creep.room.name == "W32S55")
                    //{
                    //    console.log("found equal source " + sources[i].id)
                    //    console.log("previous " + mostFilledSource.id)
                    //    console.log("path to potential new one " + creep.pos.findPathTo(sources[i]).length)
                    //    console.log("path to current most filled " + creep.pos.findPathTo(mostFilledSource).length)
                    //}
                    if(creep.pos.findPathTo(sources[i]).length < creep.pos.findPathTo(mostFilledSource).length)//Pick the closest one
                    {
                        //if(creep.room.name == "W32S55")
                        //{
                        //    console.log("this one is closer " + sources[i].id)
                        //    console.log("previous " + mostFilledSource.id)
                        //}
                        mostFilledSource = sources[i];
                    }
                }
            }
            source = mostFilledSource;
            if(!source)
            {
                source = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_CONTAINER);
                    }
                });
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
            if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else 
        {
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity)
                        || (structure.structureType == STRUCTURE_TOWER  && structure.energy < structure.energyCapacity * 0.8)
                        || ((structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] < structure.storeCapacity);
                }
            });
            
            
            if(creep.carry.energy > 0 && creep.room.name != creep.memory.home.name && creep.pos.x != 0 && creep.pos.x != 49 && creep.pos.y != 0 && creep.pos.y != 49) 
            {
                var targetBuild = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                mostDamagedStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: (structure) => (structure.hits < structure.hitsMax * 0.20) && structure.structuretyp != STRUCTURE_WALL && structure.structuretyp != STRUCTURE_RAMPART});
                if((mostDamagedStructure && creep.repair(mostDamagedStructure) == OK) || (targetBuild && creep.build(targetBuild) == OK))
                    return;
            }
            
            if(creep.room.name != creep.memory.home.name)// && target && creep.room.name != roomToHarvest))
            {
                if((creep.room.name != roomToHarvest && !target) || (creep.room.name == roomToHarvest))
                {
                    var exitDir = creep.room.findExitTo(creep.memory.home);
                    var exit = creep.pos.findClosestByRange(exitDir);
                    creep.moveTo(exit);
                    return;
                }
            }   
            else
            {
                helper.moveOffTheEdge(creep);
            }
            
            if(target)
            {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
            else
            {
                var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_STORAGE);
                        }
                    });
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};

module.exports = roleLongDistanceCarrier;