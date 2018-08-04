
var helper = require('helper');

var roleLongDistanceBuilder = {

    /** @param {Creep} creep **/
    run: function(creep, roomToBuild) {
        var targetRepairCritical = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: object => (object.hits < object.hitsMax * 0.30) && object.structureType != STRUCTURE_WALL && object.structureType != STRUCTURE_RAMPART});
        var targetRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: object => (object.hits < object.hitsMax * 0.95) && object.structureType != STRUCTURE_WALL && object.structureType != STRUCTURE_RAMPART});
        var targetBuildPriority = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {filter: (structure) => {return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_RAMPART)}});
        var targetBuild = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        
        var targetRapiringNow = creep.memory.target != null ? Game.getObjectById(creep.memory.target.id) : null;
        if(targetRapiringNow != null && creep.memory.repairing && targetRapiringNow.hits < targetRapiringNow.hitsMax * 0.90)
        {
            targetRepair = targetRapiringNow;
        }
            
        if(creep.memory.building && creep.carry.energy == 0 && (targetRepair||targetBuildPriority||targetBuild)) 
        {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) 
        {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if(creep.memory.building) 
        {
            if(creep.room.name != roomToBuild)
            {
                helper.moveCreepToDifferentRoom(creep, roomToBuild);
                return;
            }
            if(targetRepairCritical)
            {
                targetRepair = targetRepairCritical
            }
            if (targetBuild) 
            {
                creep.memory.target = targetBuild;
                creep.memory.repairing = false;
            } 
            else if(targetRepair)
            {
                creep.memory.target = targetRepair;
                creep.memory.repairing = true;
            }
            //else if(targetBuildPriority) 
            //{
            //    creep.memory.target = targetBuildPriority;
            //    creep.memory.repairing = false;
            //}
            
            
            if(creep.memory.target) 
            {
                var targetMemory = Game.getObjectById(creep.memory.target.id);
                if(creep.memory.repairing)
                {
                    if(creep.repair(targetMemory) == ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(targetMemory, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                else 
                {
                    if(creep.build(targetMemory) == ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(targetMemory, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
            else
            {
                var source = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE)
                }
                });
                if(creep.transfer(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
                if(Game.time % 2 == 0)
                    creep.say('🚬');
            }
        }
        else {
            var source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if(source && creep.pickup(source) != ERR_NOT_IN_RANGE) 
            {
                return;
            }
            
            var source = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] > 200;//structure.storeCapacity * 0.25;
                }
            });
            if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    }
};

module.exports = roleLongDistanceBuilder;