
var spawnNewCreep = 
{

    /** @param {Creep} creep **/
    run: function(roomToSpawnFrom, energy, role, styleParts, remoteLocation) 
    {
        if(energy < 200 && role != "spy")
        {
            return;
        }
        if(energy > 3000)
        {
            energy = 3000
        }
        var newName = role + Game.time;
        var mySpawns = roomToSpawnFrom.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_SPAWN})
        for(var i = 0; i < mySpawns.length; i ++)
        {
            if(mySpawns[i].spawnCustomCreep(energy, role, styleParts, mySpawns[i].room, remoteLocation) == 0)
            {
                console.log('Spawning new ' + role + ': ' + newName + ' from ' + mySpawns.name);
                break;
            }
        }
    }
};

module.exports = spawnNewCreep;