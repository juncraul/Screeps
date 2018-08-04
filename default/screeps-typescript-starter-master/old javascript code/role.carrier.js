var roleCarrier = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(creep.room.name != creep.memory.home.name)
        {
            var exitDir = creep.room.findExitTo(creep.memory.home);
            var exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
            return;
        }
        
        var myMatesAreGoingTo = []
        for(var name in Game.creeps) 
        {
            var cr = Game.creeps[name];
            if(creep.id == cr.id) continue;
            if(cr.memory.role != "carrier" && cr.memory.role != "carrierUnloader") continue;
            if(cr.memory.goingToDeposit) continue;
            myMatesAreGoingTo.push(cr.memory.goingTo);
        }
        
        if(_.sum(creep.carry) == 0) 
        {
            var source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES,{filter: (structure) => {!myMatesAreGoingTo.includes(structure.id)}});
            if(source && source.energy > 100)
            {
                if(creep.pickup(source) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                    creep.memory.goingTo = source.id;
                    creep.memory.goingToDeposit = false;
                    return;
                }
            }
            if(source && creep.pickup(source) != ERR_NOT_IN_RANGE) 
            {
                return;
            }
            var source = creep.pos.findClosestByRange(FIND_TOMBSTONES,{filter: (structure) => {!myMatesAreGoingTo.includes(structure.id)}});
            if(source != null && (_.sum(source.store) > 100 || _.sum(source.store) - source.store[RESOURCE_ENERGY] > 0))
            {
                // transfer all resources
                for(const resourceType in source.store) 
                {
                    if(creep.withdraw(source, resourceType) == ERR_NOT_IN_RANGE)
                    {
                        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffffff'}});
                        creep.memory.goingTo = source.id;
                        creep.memory.goingToDeposit = false;
                        break;
                    }
                }
                //TODO: Make that just one goes for tombstone and it takes all resources.
                return;
            }
            
            
            var controllerContainer = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3,{filter: (structure) => {return structure.structureType == STRUCTURE_CONTAINER}})[0];
            
            var previousSelectedSource = creep.room.find(FIND_STRUCTURES,{
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) > 0) || 
                            (structure.structureType == STRUCTURE_LINK && structure.energy > 0))
                        && (structure.id == creep.memory.goingTo)
                    }
            })[0];
                        
            var sources = creep.room.find(FIND_STRUCTURES,{
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) > 0) || 
                            (structure.structureType == STRUCTURE_LINK && structure.energy > 0))
                        && !myMatesAreGoingTo.includes(structure.id)
                        && (!controllerContainer || (controllerContainer && controllerContainer.id != structure.id))
                        && ((previousSelectedSource != null && structure.id == previousSelectedSource.id) || (previousSelectedSource == null));
                }
            });
            
            //if(controllerContainer != null && sources.length == 0 && _.sum(controllerContainer.store) > 0)//Take from container next to controller if that is the only one
            //{
            //    sources.push(controllerContainer)
            //}
            
            var test = creep.room.find(FIND_STRUCTURES,{
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) > 0) || 
                            (structure.structureType == STRUCTURE_LINK && structure.energy > 0))
                        && !myMatesAreGoingTo.includes(structure.id)
                        && (!controllerContainer || (controllerContainer && controllerContainer.id != structure.id))
                        && ((previousSelectedSource != null && structure.id == previousSelectedSource.id) || (previousSelectedSource == null));
                }
            });
            
            //console.log("-----")
            //console.log(test)
            //console.log(previousSelectedSource)
            //console.log(sources)
            //console.log(sources[0].store)
            //console.log(_.sum(sources[0].store))
            if(creep.id == "5b596240bdb7055cc753a9b4")
            {
                console.log("bla" + sources)
                console.log("mates" + myMatesAreGoingTo)
            }
            
            var mostFilledSource;
            for(var i = 0; i < sources.length; i ++)
            {
                if(!mostFilledSource)
                {
                    mostFilledSource = sources[i];
                }
                var thisSource = (sources[i].structureType == STRUCTURE_LINK) ? sources[i].energy : _.sum(sources[i].store);
                var maximSource = (mostFilledSource.structureType == STRUCTURE_LINK) ? mostFilledSource.energy : mostFilledSource.store[RESOURCE_ENERGY];
                if(thisSource > maximSource)
                {
                    mostFilledSource = sources[i];
                }
            }
            var source = mostFilledSource;
            
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
            if(creep.withdraw(source, RESOURCE_ZYNTHIUM) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else 
        {
            var controllerContainer = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3,{filter: (structure) => {return structure.structureType == STRUCTURE_CONTAINER}})[0];
            var targetNotControllerContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN ) && structure.energy < structure.energyCapacity)
                        || (structure.structureType == STRUCTURE_TOWER  && structure.energy < structure.energyCapacity * 0.8)
                        )&& !myMatesAreGoingTo.includes(structure.id);
                }
            });
            var targetNormal = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN ) && structure.energy < structure.energyCapacity)
                        || (structure.structureType == STRUCTURE_TOWER  && structure.energy < structure.energyCapacity * 0.8)
                        || (structure.structureType == STRUCTURE_CONTAINER && controllerContainer && controllerContainer.id == structure.id && _.sum(structure.store) < structure.storeCapacity)
                        )&& !myMatesAreGoingTo.includes(structure.id);
                }
            });
            
            if(targetNotControllerContainer != null)//First fill up other structures before filling the controller's container
            {
                targetNormal = targetNotControllerContainer;
            }
            
            var priorityTargets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) &&
                        structure.energy < structure.energyCapacity
                        && !myMatesAreGoingTo.includes(structure.id);
                }
            });
            var targetStorage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_STORAGE);
                    }
                });
            var targetTerminal = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_TERMINAL);
                    }
                });
            var target;
            
            if(priorityTargets.length > 0 && creep.room.find(FIND_HOSTILE_CREEPS).length > 0)
            {
                target = priorityTargets[0];
            }
            
            if(targetNormal)
            {
               target = targetNormal; 
            }
            
            if(creep.carry.energy == 0)//If creep has no energy always put in storage
            {
                target = targetStorage;
            }
            else if(targetNormal == null && targetStorage != null && targetTerminal != null && _.sum(targetStorage.store) > 100000 && _.sum(targetTerminal.store) < 300000)
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
                    // transfer all resources
                    for(const resourceType in creep.carry) 
                    {
                        if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE)
                        {
                            creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                            break;
                        }
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
                    if(target.structureType == STRUCTURE_STORAGE || target.structureType == STRUCTURE_TERMINAL)
                    {
                        // transfer all resources
                        for(const resourceType in creep.carry) 
                        {
                            if(creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE)
                            {
                                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleCarrier;