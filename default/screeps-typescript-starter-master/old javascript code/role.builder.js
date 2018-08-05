var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.room.name !== creep.memory.home.name)// && target && creep.room.name != roomToHarvest))
        {
            var exitDir = creep.room.findExitTo(creep.memory.home);
            var exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
            return;
        }

        var targetRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: object => (object.hits < object.hitsMax * 0.5) && (object.hits < 1000)
                });
        var targetBuildPriority = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                    filter: (structure) => {
                            return (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_RAMPART)
                        }});
        var targetBuild = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            
        if(creep.memory.building && creep.carry.energy === 0 && (targetRepair||targetBuildPriority||targetBuild)) 
        {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.carry.energy === creep.carryCapacity) 
        {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if(creep.memory.building) 
        {
            if(targetRepair && false)
            {
                creep.memory.target = targetRepair;
                creep.memory.repairing = true;
            }
            //else if(targetBuildPriority) 
            //{
            //    creep.memory.target = targetBuildPriority;
            //    creep.memory.repairing = false;
            //}
            else {
                creep.memory.target = targetBuild;
                creep.memory.repairing = false;
            }
            
            if(creep.memory.target) 
            {
                if(creep.memory.repairing)
                {
                    if(creep.repair(creep.memory.target) === ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(creep.memory.target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                else 
                {
                    if(creep.build(creep.memory.target) === ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(creep.memory.target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
            else
            {
                var source = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_STORAGE)
                }
                });
                if(creep.transfer(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
                if(Game.time % 2 === 0)
                    creep.say('🚬', true);
            }
        }
        else {
            var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester' && creep.memory.home.name === creep.room.name);
            if(harvesters.length < 2)
            {
                creep.say('Wait Harvesters')
                return;
            }
            source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if(source && creep.pickup(source) !== ERR_NOT_IN_RANGE) 
            {
                return;
            }
            
            var sourceStorage = creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {return (structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 100)}});
            
            if(sourceStorage === null)
            {
                source = creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {return ((structure.structureType === STRUCTURE_SPAWN && structure.energy > 205) || (structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 100) )}});
            }
            else
            {
                source = sourceStorage;
            }
            
            if(creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    }
};

module.exports = roleBuilder;
