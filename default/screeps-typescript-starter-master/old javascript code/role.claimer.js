
var helper = require('helper');
var logicTasks = require("logic.tasks");

var roleClaimer = {

    /** @param {Creep} creep **/
    run: function(creep, roomToReserve) {
        var roomToClaim = logicTasks.getRoomToClaim();
        
        
        if(creep.room.name !== roomToReserve)
        {
            helper.moveCreepToDifferentRoom(creep, roomToReserve);
            return;
        }
        else 
        {
            if(creep.room.controller) 
            {
                if(roomToClaim.includes(creep.room.name))
                {
                    if((creep.room.controller.reservation !== null && creep.room.controller.reservation.username !== "Raul") ||
                       (creep.room.controller.owner !== null && creep.room.controller.owner.username !== "Raul")){
                        if(creep.attackController(creep.room.controller) === ERR_NOT_IN_RANGE){
                            creep.moveTo(creep.room.controller);
                        }
                        else if(creep.room.controller.owner.username === "Raul" || creep.attackController(creep.room.controller) === ERR_TIRED){
                            helper.goToNewController(creep);
                        }
                    }
                    else if(creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                    else
                    {
                        helper.goToNewController(creep);
                    }
                }
                else if(creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE || creep.signController(creep.room.controller, "For Unity") === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        }
    },
    
}

module.exports = roleClaimer;
