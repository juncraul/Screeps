var towerAttack = {
    run: function(tower, order) {
        
        var mostDamagedStructures = [];
        if(tower.energy > tower.energyCapacity * 0.5) 
        {
            for(var i = 500, increment = 500; i <= 150000 && mostDamagedStructures.length == 0 && (Game.time + order) % 10 < 5; i+= increment, increment*= 1.25)
            {
                mostDamagedStructures = tower.room.find(FIND_STRUCTURES, {
                    filter: (structure) => (structure.hits < structure.hitsMax * 0.75) && (structure.hits < i)
                });
            }
            for(var i = 0.000001, increment = 2; i <= 1 && mostDamagedStructures.length == 0 && (Game.time + order) % 10 < 2; i *= increment, increment*= 1.25)
            {
                mostDamagedStructures = tower.room.find(FIND_STRUCTURES, {
                    filter: (structure) => (structure.hits < structure.hitsMax * 0.75) && (structure.hits / structure.hitsMax < i)
                });
            }
            var priority = tower.room.find(FIND_STRUCTURES, {filter: (structure) => (structure.structureType == STRUCTURE_CONTAINER && structure.hits < 200000)});
            if(priority.length != 0)
            {
                mostDamagedStructures = priority;
            }
        }
        
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var wondedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS,  {filter: function(object) {return object.hits < object.hitsMax}});
        if(closestHostile) {
            tower.attack(closestHostile);
        }
        else if (wondedCreep) {
            tower.heal(wondedCreep);
        }
        else
        {
            if(mostDamagedStructures.length > 0)
            {
                tower.repair(mostDamagedStructures[0]);
            }
            
        }
    }
};

module.exports = towerAttack;