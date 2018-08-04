var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.carry.energy == 0) 
        {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) 
        {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        if(creep.memory.upgrading) 
        {
            //if(!creep.pos.isNearTo(creep.room.controller)){
            //    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            //}
            //else 
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else 
        {
            var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.home.name == creep.room.name);
            if(harvesters.length < 2)
            {
                creep.say('Wait Harvesters')
                return;
            }
            var source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if(source && creep.pickup(source) != ERR_NOT_IN_RANGE) 
            {
                return;
            }
            
            var source = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (structure) => {return ((structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] > 100) || (structure.structureType == STRUCTURE_LINK && structure.energy > 100)}});
            
            if(source == null)
            {
                source = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (structure) => {return (structure.structureType == STRUCTURE_SPAWN && structure.energy > 250) || (structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 100)}});
            }
            
            if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    }
};

module.exports = roleUpgrader;