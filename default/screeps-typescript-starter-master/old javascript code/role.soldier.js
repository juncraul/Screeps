
var helper = require('helper');

var roleSoldier = {

    /** @param {Creep} creep **/
    run: function(creep, roomsToProtect, roomToPatrol) {
        
        //Protect only current room
        roomsToProtect = [roomToPatrol]
        
        var attackedRoom;
        for(var i = 0; i < roomsToProtect.length; i ++) {
            if(Game.rooms[roomsToProtect[i]] != null && Game.rooms[roomsToProtect[i]].find(FIND_HOSTILE_CREEPS).length > 0){
                attackedRoom = roomsToProtect[i];
            }
        }
        
        for(var i = 0; i < roomsToProtect.length && !attackedRoom; i ++) {
            if(Game.rooms[roomsToProtect[i]] != null && Game.rooms[roomsToProtect[i]].find(FIND_HOSTILE_STRUCTURES, {filter: (structure) => (structure.structureType != STRUCTURE_CONTROLLER)}).length > 0){
                attackedRoom = roomsToProtect[i];
            }
        }
        
        if(attackedRoom != null)
        {
            if(creep.room.name != attackedRoom)
            {
                helper.moveCreepToDifferentRoom(creep, attackedRoom);
                return;
            }
            else {
                var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                var targetStructures = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {filter: (structure) => (structure.structureType != STRUCTURE_CONTROLLER)});
                if(!target)
                {
                    target = targetStructures
                }
                if(target && target.pos.x != 0 && target.pos.y != 0 && target.pos.x != 49 && target.pos.y != 49) {
                    if(creep.attack(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
                    }
                }
                switch(Game.time % 5)
                {
                    case 0:
                        creep.say("Stop right", true);
                        break;
                    case 1:
                        creep.say("there", true);
                        break;
                    case 2:
                        creep.say("criminal", true);
                        break;
                    case 4:
                        creep.say("scum!", true);
                        break;
                }
            }
        }
        else
        {
            var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if(!target)
                target = creep.room.controller
                
            if(creep.room.name != roomToPatrol)
            {
                helper.moveCreepToDifferentRoom(creep, roomToPatrol);
                return;
            }
            else
            if(creep.room.controller) {
                helper.moveOffTheEdge(creep);
                if(creep.pos.inRangeTo(target, 3))
                {
                    switch(Game.time % 6)
                    {
                        case 0:
                            creep.say("Hi friend!", true);
                            break;
                        case 1:
                            creep.say("We are", true);
                            break;
                        case 2:
                            creep.say("a culture", true);
                            break;
                        case 4:
                            creep.say("of peaceful", true);
                            break;
                        case 5:
                            creep.say("people.", true);
                            break;
                    }
                }
                else
                {
                    creep.moveTo(target)
                }
            }
        }
    }
};

module.exports = roleSoldier;