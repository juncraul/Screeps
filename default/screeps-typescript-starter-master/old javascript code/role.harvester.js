var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(_.sum(creep.carry) === 0)
        {
            creep.memory.isHarvesting = true;
        }
        
        if(_.sum(creep.carry) === creep.carryCapacity)
        {
            creep.memory.isHarvesting = false;
        }
        if(creep.memory.isHarvesting) 
        {
            var source = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
            if(source && creep.pickup(source) !== ERR_NOT_IN_RANGE) 
            {
                return;
            }
            
            var previousSelectedSourceToHarvestPeopleHarvest = -1;
            var previousSelectedSourceToHarvest = creep.room.find(FIND_SOURCES,{filter: (structure) => {return (structure.energy > 0 && structure.id === creep.memory.currentlyHarvesting)}})[0];
            creep.memory.currentlyHarvesting = "none";
            var sources = creep.room.find(FIND_SOURCES_ACTIVE,{
                filter: (structure) => {
                    return (structure.energy > 0) || (structure.amount > 0);
                }
            });
            var mineralExtension = creep.room.find(FIND_STRUCTURES, {filter: (structure) => {return (structure.structureType === STRUCTURE_EXTRACTOR)}})[0];
            var minerals = creep.room.find(FIND_MINERALS,{filter: (structure) => {return (structure.mineralAmount > 0)}});
            if(mineralExtension === null)
            {
                minerals = []
            }
            var creepsMiningThisSource = [];
            for(var i = 0; i < sources.length + minerals.length; i ++)
            {
                creepsMiningThisSource.push(0);
                for(var name in Game.creeps) 
                {
                    var cr = Game.creeps[name];
                    if(cr.memory.role !== "harvester") continue;
                    if((i < sources.length && sources[i].id === cr.memory.currentlyHarvesting) || 
                       (i >= sources.length && minerals[i - sources.length].id === cr.memory.currentlyHarvesting))
                    {
                        creepsMiningThisSource[i] ++;
                    }
                }
                if(i >= sources.length)
                {
                    if(previousSelectedSourceToHarvest !== null && minerals[i - sources.length].id === previousSelectedSourceToHarvest.id)
                    {
                        previousSelectedSourceToHarvestPeopleHarvest = creepsMiningThisSource[i];
                    }
                }
                else
                {
                    if(previousSelectedSourceToHarvest !== null && sources[i].id === previousSelectedSourceToHarvest.id)
                    {
                        previousSelectedSourceToHarvestPeopleHarvest = creepsMiningThisSource[i];
                    }
                }
            }
            //console.log(creep.id + " " + creepsMiningThisSource)
            for(i = 0; i < sources.length + minerals.length; i ++)
            {
                var availableSpacesAroundSource = 0;
                for(var j = -1; j <= 1; j ++)
                {
                    for(var k = -1; k <= 1; k ++)
                    {
                        if(i >= sources.length)
                        {
                            if(Game.map.getTerrainAt(minerals[i - sources.length].pos.x + j, minerals[i - sources.length].pos.y + k, creep.room.name) !== "wall")
                            {
                                availableSpacesAroundSource ++;
                            }
                        }
                        else
                        {
                            if(Game.map.getTerrainAt(sources[i].pos.x + j, sources[i].pos.y + k, creep.room.name) !== "wall")
                            {
                                availableSpacesAroundSource ++;
                            }
                        }
                    }
                }
                if(creepsMiningThisSource[i] >= availableSpacesAroundSource)
                {
                    creepsMiningThisSource[i] = 100
                }
            }
            //console.log(creepsMiningThisSource)
            
            if(sources.length > 0)
            {
                var sourceIndex = creepsMiningThisSource.indexOf(Math.min(...creepsMiningThisSource));
                if(previousSelectedSourceToHarvest !== null && previousSelectedSourceToHarvestPeopleHarvest <= creepsMiningThisSource[sourceIndex])
                {
                    source = previousSelectedSourceToHarvest;
                }
                else
                {
                    source = sourceIndex < sources.length ? sources[sourceIndex] : minerals[sourceIndex - sources.length];
                }
                creep.memory.currentlyHarvesting = sourceIndex < sources.length ? sources[sourceIndex].id : minerals[sourceIndex - sources.length].id;
            }
            else
            {
                //sources = creep.room.find(FIND_SOURCES);
                //var smallestTick = Math.min.apply(Math,sources.map(function(o){return o.ticksToRegeneration;}))
                //source = creep.pos.findClosestByPath(FIND_SOURCES,{filter: (structure) => {return (structure.ticksToRegeneration == smallestTick)}});
                source = minerals[0];
            }
            if(creep.harvest(source) === ERR_NOT_IN_RANGE || creep.harvest(source) === ERR_NOT_ENOUGH_RESOURCES) 
            {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else 
        {
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity)
                        || ((structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_LINK) && structure.energy < structure.energyCapacity);
                        
                }
            });
            
            var targetNonEnergy = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity)
                        
                }
            });
            
            //This code was to make the link as a priority
            //if(creep.memory.currentlyHarvesting != "none")
            //{
            //    var targetLink = Game.getObjectById(creep.memory.currentlyHarvesting).pos.findInRange(FIND_MY_STRUCTURES, 3, {filter: (structure) => { return structure.structureType == STRUCTURE_LINK }});
            //    //console.log("link " + targetLink);
            //    if(targetLink.length != 0)
            //    {
            //        target = targetLink[0]
            //    }
            //}
            
            var targetStorage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] < structure.storeCapacity);
                        
                }
            });
            if(!target)
            {
                target = targetStorage;
            }
            
            if(creep.carry.energy === 0)
            {
                target = targetNonEnergy
            }
            
            if(target) 
            {
                // transfer all resources
                for(const resourceType in creep.carry) 
                {
                    if(creep.transfer(target, resourceType) === ERR_NOT_IN_RANGE)
                    {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                        break;
                    }
                }
            }
            else
            {
                creep.moveTo(Game.spawns["Raul"], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
};

module.exports = roleHarvester;
