//blablatest
var logicTasks = require("logic.tasks");

var helper = {
    moveCreepToDifferentRoom: function(creep, roomToGoTo) {
        var exitDir = creep.room.findExitTo(roomToGoTo);
        var exit = creep.pos.findClosestByRange(exitDir);
        /*
        console.log("creep " + creep.id)
        console.log("creep pos " + creep.pos)
        console.log("room from " + creep.room.name)
        console.log("room to " + roomToGoTo)
        console.log("exitDir " + exitDir)
        console.log("exit " + exit)*/
        if((creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49) && !(exit.x == creep.pos.x && exit.y == creep.pos.y))
        {
            var goToX = creep.pos.x == 0 ? 1 : (creep.pos.x == 49 ? 48 : creep.pos.x)
            var goToY = creep.pos.y == 0 ? 1 : (creep.pos.y == 49 ? 48 : creep.pos.y)
            creep.moveTo(goToX, goToY)
        }
        else
        {
            creep.moveTo(exit);
        }
        return;
    },
    
    moveOffTheEdge: function(creep) {
        if(creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49)
        {
            var goToX = creep.pos.x == 0 ? 1 : (creep.pos.x == 49 ? 48 : creep.pos.x)
            var goToY = creep.pos.y == 0 ? 1 : (creep.pos.y == 49 ? 48 : creep.pos.y)
            creep.moveTo(goToX, goToY)
        }
    },
    
    goToNewController: function(creep) {
        var allRoomsToReserve = logicTasks.getRoomToReserve();
        var claimer = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer');
        for(var i = 0; i < allRoomsToReserve.length; i ++) {
            if(Game.rooms[allRoomsToReserve[i]] == null)//Aka no visibility to room
                continue
            var controllerFromRoom = Game.rooms[allRoomsToReserve[i]].controller;
            var claimerInRemoteRoom = _.filter(claimer, (creep) => creep.memory.remote == allRoomsToReserve[i]);
            var userWhoClaimedItSoFar = controllerFromRoom.reservation != null ? controllerFromRoom.reservation.username : "Raul";
            var ticksTillReservationEnds =  controllerFromRoom.reservation != null ? controllerFromRoom.reservation.ticksToEnd : 0;
            var creepsProtectingTheRoom = _.filter(Game.creeps, (creep) => creep.pos.roomName == allRoomsToReserve[i] && (creep.memory.role == "armyAttacker" || creep.memory.role == "soldier"));
            var controllerOwnedBy = controllerFromRoom.owner != null ? controllerFromRoom.owner.username : "N/A"
            
            var needToDowngrade = logicTasks.getRoomToDowngrade().includes(allRoomsToReserve[i]);
            
            console.log("to rserver" + allRoomsToReserve[i])
            console.log((controllerOwnedBy != "N/A" && !needToDowngrade))
            console.log((controllerOwnedBy))
            console.log((controllerOwnedBy != "Raul" && !needToDowngrade))
            //If is not protected or is it already owned by someone with the exception when it needs downgrading
            if(creepsProtectingTheRoom.length == 0 ||  controllerFromRoom.upgradeBlocked > 100 || controllerOwnedBy == "Raul" //|| (controllerOwnedBy != "N/A" && !needToDowngrade)
            ){ 
                continue;
            }
            
            if(claimerInRemoteRoom.length < 1 && ((userWhoClaimedItSoFar == "Raul" && ticksTillReservationEnds < 5000) || userWhoClaimedItSoFar != "Raul")) {
                creep.memory.remote = allRoomsToReserve[i]
            }
        }
    },
    
    getCashedMemory: function(key) {
        return Memory.Keys[key]
    },
    
    setCashedMemory: function(key, value) {
        Memory.Keys[key] = value;
    },
    
    getActiveBodyPartsFromArrayOfCreeps: function(creeps, bodyPart) {
        var bodyParts = 0;
        for(var i = 0; i < creeps.length; i ++) 
        {
            bodyParts += creeps[i].getActiveBodyparts(bodyPart);
        }
        return bodyParts;
    }
};

module.exports = helper;