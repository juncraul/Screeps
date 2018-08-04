/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('logic.tasks');
 * mod.thing == 'a thing'; // true
 */


var logicTasks = {
    getRemoteRoomsToHarvest: function() {
        var remoteRoomsToHarvest = ["W33S54", "W32S55", "W31S55", "W32S56", "W31S54", "W34S53", "W32S53", "W33S52", "W32S54", "W31S53", "W34S52", "W33S51"];
        
        return remoteRoomsToHarvest;
    },
    
    getRoomToReserve: function() {
        var roomToReserve = ["W33S54", "W33S53", "W32S55", "W31S55", "W32S56", "W31S54", "W34S53", "W32S53", "W33S52", "W32S54", "W31S53", "W34S52", "W33S51"];
        
        return roomToReserve;
    },
    
    getRoomToDowngrade: function() {
        var roomToDowngrade = ["W33S53"];
        
        return roomToDowngrade;
    },
    
    getRoomToClaim: function() {
        var roomToClaim = ["W33S53", "W31S54", "W33S51"];
        
        return roomToClaim;
    },
    
    getroomToProtect: function() {
        var roomToProtect = ["W33S54", "W33S56", "W32S55", "W31S55", "W32S56", "W31S54", "W34S53", "W32S53", "W33S52", "W32S54", "W34S52", "W33S51"];
        
        return roomToProtect;
    },
    
    getroomToBuild: function() {
        var roomToBuild = ["W33S51"];
        
        return roomToBuild;
    },
    
    getroomToSpy: function() {
        var roomToSpy = [];
        
        return roomToSpy;
    },
    
    getRoomConnections: function(room) {
        switch(room)
        {
            case "W33S55":
                return ["W33S54", "W32S54"];
            case "W33S53":
                return ["W34S53", "W33S52", "W32S53", "W31S53", "W34S52", "W33S51"];
            case "W33S56":
                return ["W32S56"];
            case "W31S54":
                return ["W32S55", "W31S55"];
            default :
                return []
        }
    },
    
    getmyRoomsWithController: function() {
        var mySpawns = Object.getOwnPropertyNames(Game.spawns)
        var roomsWithSpawns = []
        for(var i = 0; i < mySpawns.length; i ++)
        {
            roomsWithSpawns.push(Game.spawns[mySpawns[i]].room)
        }
        
        return roomsWithSpawns;
    }
};

module.exports = logicTasks;