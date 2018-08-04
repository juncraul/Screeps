
var helper = require('helper');

var roleLongDistanceHarvester = {

    /** @param {Creep} creep **/
    run: function(creep, roomToHarvest) {
        var mostDamagedStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => (structure.hits < structure.hitsMax * 0.75) && structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART && structure.structureType != STRUCTURE_LINK
                });
        var targetBuild = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        
        if(creep.hits < creep.hitsMax * 0.10)
        {
            helper.setCashedMemory("Danger-" + creep.room.name, Game.time + 1500);
        }
        
        if(creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) 
        {
            creep.memory.harvesting = false;
        }
        if(!creep.memory.harvesting && creep.carry.energy <= creep.carryCapacity * 0.10) 
        {
            creep.memory.harvesting = true;
        }
        
        if(creep.carry.energy > creep.carryCapacity * 0.10 && creep.room.name != creep.memory.home.name && ((mostDamagedStructure && creep.repair(mostDamagedStructure) != ERR_NOT_IN_RANGE) || (targetBuild && creep.build(targetBuild) != ERR_NOT_IN_RANGE))) 
        {
        }
        else if(creep.memory.harvesting) 
        {
            //console.log("deposit here " + target)
            
            if(creep.room.name != roomToHarvest && creep.carry.energy == 0)
            {
                helper.moveCreepToDifferentRoom(creep, roomToHarvest);
                return;
            }   
            else
            {
                helper.moveOffTheEdge(creep);
            }
            
            var source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if(source && creep.pickup(source) != ERR_NOT_IN_RANGE) 
            {
                return;
            }
            
            var previousSelectedSourceToHarvestPeopleHarvest = -1;
            var previousSelectedSourceToHarvest = creep.room.find(FIND_SOURCES,{filter: (structure) => {return (structure.energy > 0 && structure.id == creep.memory.currentlyHarvesting)}})[0];
            
            creep.memory.currentlyHarvesting = "none";
            var sources = creep.room.find(FIND_SOURCES,{filter: (structure) => {return (structure.energy > 0)}});
            var creepsMiningSource = [];
            for(var i = 0; i < sources.length; i ++)
            {
                creepsMiningSource.push(0);
                for(var name in Game.creeps) 
                {
                    var cr = Game.creeps[name];
                    if(cr.memory.role != "harvester" && cr.memory.role != "longDistanceHarvester") continue;
                    if(sources[i].id == cr.memory.currentlyHarvesting)
                    {
                        creepsMiningSource[i] ++;
                    }
                }
                if(previousSelectedSourceToHarvest != null && sources[i].id == previousSelectedSourceToHarvest.id)
                {
                    previousSelectedSourceToHarvestPeopleHarvest = creepsMiningSource[i];
                }
            }
            
            if(sources.length > 0)
            {
                var sourceIndex = creepsMiningSource.indexOf(Math.min(...creepsMiningSource));
                if(previousSelectedSourceToHarvest != null && previousSelectedSourceToHarvestPeopleHarvest <= creepsMiningSource[sourceIndex])
                {
                    source = previousSelectedSourceToHarvest;
                }
                else
                {
                    source = sources[sourceIndex];
                }
                creep.memory.currentlyHarvesting = source.id;
            }
            else
            {
                sources = creep.room.find(FIND_SOURCES);
                var smallestTick = Math.min.apply(Math,sources.map(function(o){return o.ticksToRegeneration;}))
                source = creep.pos.findClosestByPath(FIND_SOURCES,{
                filter: (structure) => {
                    return (structure.ticksToRegeneration == smallestTick);
                }
                });
            }
            if(creep.harvest(source) == ERR_NOT_IN_RANGE || creep.harvest(source) == ERR_NOT_ENOUGH_RESOURCES) 
            {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else 
        {
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) &&
                        _.sum(structure.store) < structure.storeCapacity;
                }
            });
            
            
            if(!target) 
            {
                if(creep.room.name != creep.memory.home.name)
                {
                    helper.moveCreepToDifferentRoom(creep, creep.memory.home.name);
                    return;
                }
            }
            
            if(target)
            {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};

module.exports = roleLongDistanceHarvester;