var roleArmyHealer = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        var flagToAttachFrom = Game.flags["Attack"];
        var flagToAttachFromWhenAllReady = Game.flags["AttackWhenAllTroopsReady"];
        var armyAttacker = _.filter(Game.creeps, (creep) => creep.memory.role == 'armyAttacker' && !creep.spawning);
        var armyHealer = _.filter(Game.creeps, (creep) => creep.memory.role == 'armyHealer' && !creep.spawning);
        if(armyAttacker.length >= 3 && armyHealer.length >= 2 && flagToAttachFromWhenAllReady.room != null){
            flagToAttachFrom = flagToAttachFromWhenAllReady
        }
        
        var roomToAttack = flagToAttachFrom.room;
        
        if(roomToAttack != null)
        {
            if(creep.room != roomToAttack)
            {
                var exitDir = creep.room.findExitTo(roomToAttack);
                var exit = creep.pos.findClosestByRange(exitDir);
                creep.moveTo(exit);
                return;
            }
            else 
            {
                var wondedCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS,  {filter: function(object) {return object.hits < object.hitsMax}});
                
                if (wondedCreep && wondedCreep.pos.x != 0 && wondedCreep.pos.y != 0 && wondedCreep.pos.x != 49 && wondedCreep.pos.y != 49) 
                {
                    if(creep.heal(wondedCreep) == ERR_NOT_IN_RANGE)
                    {
                        if(wondedCreep)
                        creep.moveTo(wondedCreep, {visualizePathStyle: {stroke: '#00ff00'}});
                    }
                }
                else
                {
                    console.log("move to flag" + flagToAttachFrom)
                    creep.moveTo(flagToAttachFrom, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            }
        }
    }
};

module.exports = roleArmyHealer;