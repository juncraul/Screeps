
var helper = require('helper');
var logicTasks = require("logic.tasks");

var roleSpy = {

    /** @param {Creep} creep **/
    run: function(creep, roomToSpy) {
        
        if(creep.room.name != roomToSpy)
        {
            helper.moveCreepToDifferentRoom(creep, roomToSpy);
            return;
        }
        else 
        {
            creep.moveTo(creep.room.controller);
        }
    }
};

module.exports = roleSpy;