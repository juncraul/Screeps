var roleArmyAttacker = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var flagToAttachFrom = Game.flags["Attack"];
        var flagToAttachFromWhenAllReady = Game.flags["AttackWhenAllTroopsReady"];
        var armyAttacker = _.filter(Game.creeps, (creep) => creep.memory.role == 'armyAttacker' && !creep.spawning);
        var armyHealer = _.filter(Game.creeps, (creep) => creep.memory.role == 'armyHealer' && !creep.spawning);
        if(armyAttacker.length >= 3 && armyHealer.length >= 2 && flagToAttachFromWhenAllReady != null && flagToAttachFromWhenAllReady.room != null){
            flagToAttachFrom = flagToAttachFromWhenAllReady
        }
        else if (flagToAttachFrom == null)
        {
            flagToAttachFrom = flagToAttachFromWhenAllReady
        }
        
        if(flagToAttachFrom == null)
        {
            return;
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
                const targetCreepsFromFlag = flagToAttachFrom.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
                const targetStructuresFromFlag = flagToAttachFrom.pos.findInRange(FIND_HOSTILE_STRUCTURES, 1);
                const targetCreeps = targetCreepsFromFlag.length == 0 ? creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) : targetCreepsFromFlag[0];
                const targetStructures = targetStructuresFromFlag.length == 0 ? creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES) : targetStructuresFromFlag[0];
                if(targetCreeps && targetCreeps.pos.x != 0 && targetCreeps.pos.y != 0 && targetCreeps.pos.x != 49 && targetCreeps.pos.y != 49) 
                {
                    if(creep.attack(targetCreeps) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targetCreeps, {visualizePathStyle: {stroke: '#ff0000'}});
                    }
                } 
                else if(targetStructures) 
                {
                    if(creep.attack(targetStructures) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targetStructures, {visualizePathStyle: {stroke: '#ff0000'}});
                    }
                }
                else
                {
                    creep.moveTo(flagToAttachFrom, {visualizePathStyle: {stroke: '#ff0000'}});
                }
            }
        }
    }
};

module.exports = roleArmyAttacker;