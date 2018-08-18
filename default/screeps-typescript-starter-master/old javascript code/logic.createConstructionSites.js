
var previewPlacement = false;
var disableConstruction = false;

var logicCreateConstructionSites = {
    run: function () {
        var flag;
        for(var i = 0; i < 10; i ++)
        {
            flag = Game.flags["ConstructionSite-" + i];
            if(flag === null)
                continue;
            var startPos = flag.pos;
            if(_.filter(Game.creeps, (creep) => creep.room === flag.room).length === 0) return;
            
            if(flag.color === COLOR_WHITE)
            {
                buildExtensionsAlongPath(flag.room, {x:startPos.x, y:startPos.y - 7}, false, true);
                buildExtensionsAlongPath(flag.room, startPos, true, true);
                buildExtensionsAlongPath(flag.room, {x:startPos.x, y:startPos.y + 7}, true, false);
            }
            else if(flag.color === COLOR_GREY)
            {
                buildExtensionsAlongPathFlip(flag.room, {x:startPos.x, y:startPos.y - 7}, false, true);
                buildExtensionsAlongPathFlip(flag.room, startPos, true, true);
                buildExtensionsAlongPathFlip(flag.room, {x:startPos.x, y:startPos.y + 7}, true, false);
            }
            createWall(flag.room);
        }
        
        flag = Game.flags["CreateSpawn"];
        if(flag !== null)
        {
            flag.room.createConstructionSite(flag.pos.x, flag.pos.y, STRUCTURE_SPAWN, "Raul-" + flag.room.name + "-X");
        }
    }
};

var createWall = function(room) {
    for(var i = 0; i < 50; i ++)
    {
        if(Game.map.getTerrainAt(0, i, room.name) !== "wall" && Game.map.getTerrainAt(2, i, room.name) !== "wall")
        {
            createConstructionSite(room, 2, i, (i % 5 === 4 ? "A" : "W"));
            createWallEdge(room, 2, i);
        }
        if(Game.map.getTerrainAt(49, i, room.name) !== "wall" && Game.map.getTerrainAt(47, i, room.name) !== "wall")
        {
            createConstructionSite(room, 47, i, (i % 5 === 4 ? "A" : "W"));
            createWallEdge(room, 47, i);
        }
        if(Game.map.getTerrainAt(i, 0, room.name) !== "wall" && Game.map.getTerrainAt(i, 2, room.name) !== "wall")
        {
            createConstructionSite(room, i, 2, (i % 5 === 4 ? "A" : "W"));
            createWallEdge(room, i, 2);
        }
        if(Game.map.getTerrainAt(i, 49, room.name) !== "wall" & Game.map.getTerrainAt(i, 47, room.name) !== "wall")
        {
            createConstructionSite(room, i, 47, (i % 5 === 4 ? "A" : "W"));
            createWallEdge(room, i, 47);
        }
    }
}

var createWallEdge = function(room, x, y) {
    var terrainXToCheck = (x !== 2 && x !== 47) ? x : (x  < 25 ? 0 : 49);
    var terrainYToCheck = (y !== 2 && y !== 47) ? y : (y  < 25 ? 0 : 49);
    var xDirection = x === 2 ? 1 : (x === 47 ? -1 : 0)
    var yDirection = y === 2 ? 1 : (y === 47 ? -1 : 0)
    var xOffset = (x === 2 || x === 47) ? 0 : -1;
    var yOffset = (y === 2 || y === 47) ? 0 : -1;
    if(x === 47 && y === 47)
    {
        checkForStructureAndBuild(room, 48, 47, "wall", "W")
        checkForStructureAndBuild(room, 47, 48, "wall", "W")
        checkForStructureAndBuild(room, 48, 48, "wall", "W")
    }
    else if(x === 2 && y === 2)
    {
        checkForStructureAndBuild(room, 2, 1, "wall", "W")
        checkForStructureAndBuild(room, 1, 2, "wall", "W")
        checkForStructureAndBuild(room, 1, 1, "wall", "W")
    }
    else if(x === 47 && y === 2)
    {
        checkForStructureAndBuild(room, 47, 1, "wall", "W")
        checkForStructureAndBuild(room, 46, 2, "wall", "W")
        checkForStructureAndBuild(room, 47, 1, "wall", "W")
    }
    else if(x === 2 && y === 47)
    {
        checkForStructureAndBuild(room, 2, 46, "wall", "W")
        checkForStructureAndBuild(room, 1, 47, "wall", "W")
        checkForStructureAndBuild(room, 1, 46, "wall", "W")
    }
    else
    {
        if(Game.map.getTerrainAt(terrainXToCheck + xOffset, terrainYToCheck + yOffset, room.name) === "wall")
        {
            checkForStructureAndBuild(room, terrainXToCheck + 1 * xDirection + 2 * xOffset, terrainYToCheck + 1 * yDirection + 2 * yOffset, "wall", ((y - 1) % 5 === 4 ? "A" : "W"))
            checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 2 * xOffset, terrainYToCheck + 2 * yDirection + 2 * yOffset, "wall", ((y - 1) % 5 === 4 ? "A" : "W"))
            checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 1 * xOffset, terrainYToCheck + 2 * yDirection + 1 * yOffset, "wall", ((y - 1) % 5 === 4 ? "A" : "W"))
        }
        xOffset = (x === 2 || x === 47) ? 0 : 1;
        yOffset = (y === 2 || y === 47) ? 0 : 1;
        if(Game.map.getTerrainAt(terrainXToCheck + xOffset, terrainYToCheck + yOffset, room.name) === "wall")
        {
            checkForStructureAndBuild(room, terrainXToCheck + 1 * xDirection + 2 * xOffset, terrainYToCheck + 1 * yDirection + 2 * yOffset, "wall", ((y - 1) % 5 === 4 ? "A" : "W"))
            checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 2 * xOffset, terrainYToCheck + 2 * yDirection + 2 * yOffset, "wall", ((y - 1) % 5 === 4 ? "A" : "W"))
            checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 1 * xOffset, terrainYToCheck + 2 * yDirection + 1 * yOffset, "wall", ((y - 1) % 5 === 4 ? "A" : "W"))
        }
    }
}

var checkForStructureAndBuild = function(room, x, y, structure, build){
    if(Game.map.getTerrainAt(x, y, room.name) !== structure)
            createConstructionSite(room, x, y, build);
}

var buildExtensionsAlongPath = function(room, startPos, buildAbove, buildBelow) {
    var top = 6;
    var i;
    for(i = 1; i <= ((buildAbove && top) || (!buildAbove && top - 1)); i ++)
    {
        createConstructionSite(room, startPos.x - i, startPos.y -i, "R");
        if(i % 3 === 0 && buildAbove)
        {
            buildExtensionsAroundCenter(room, {x:startPos.x - i + 1, y:startPos.y - i - 1}, {x:startPos.x - i, y:startPos.y - i})
        }
        if(i % 3 === 1 && buildBelow && ((buildAbove && i < 10) || (!buildAbove && i < 5)))
        {
            buildExtensionsAroundCenter(room, {x:startPos.x - i - 1, y:startPos.y - i + 1}, {x:startPos.x - i, y:startPos.y - i})
        }
        if(buildAbove && buildBelow)
        {
            if (i % 3 !== 2)
                createConstructionSite(room, startPos.x - i, startPos.y - i + (i % 3 === 0 ? 1 : -1), "E");
        }
    }
    if(buildAbove && buildBelow)
    {
        for(i = 0; i < 1; i ++)//Most top road left:right
        {
            createConstructionSite(room, startPos.x + i - top, startPos.y - top - 6, "R");
        }
        for(i = -13; i < 0; i ++)//Most left road up:down
        {
            createConstructionSite(room, startPos.x - top - 1, startPos.y + i + top - 5, "R");
        }
        for(i = -7; i < 8; i ++)//Most right road up:down
        {
            createConstructionSite(room, startPos.x, startPos.y + i, "R");
        }
    }
}

var buildExtensionsAlongPathFlip = function(room, startPos, buildAbove, buildBelow) {
    var top = 6;
    var i
    for(i = 1; i <= ((buildAbove && top) || (!buildAbove && top + 1)); i ++)
    {
        createConstructionSite(room, startPos.x - i, startPos.y +i, "R");
        if(i % 3 === 0 && buildAbove)
        {
            buildExtensionsAroundCenter(room, {x:startPos.x - i + 1, y:startPos.y + i - 3}, {x:startPos.x - i + 2, y:startPos.y + i - 2})
        }
        if(i % 3 === 1 && buildBelow && ((buildAbove && i < 10) || (!buildAbove && i < 5)))
        {
            buildExtensionsAroundCenter(room, {x:startPos.x - i - 1, y:startPos.y + i + 3}, {x:startPos.x - i - 2, y:startPos.y + i + 2})
        }
        if(buildAbove && buildBelow)
        {
            if (i % 3 !== 2)
                createConstructionSite(room, startPos.x - i, startPos.y + i + (i % 3 === 0 ? -1 : 1), "E");
        }
    }
    if(buildAbove && buildBelow)
    {
        for(i = 0; i < 1; i ++)//Most top road left:right
        {
            //createConstructionSite(room, startPos.x + i - top, startPos.y - top - 6, "R");
        }
        for(i = -13; i < 0; i ++)//Most left road up:down
        {
            createConstructionSite(room, startPos.x - top - 1, startPos.y + i + top + 8, "R");
        }
        for(i = -7; i < 8; i ++)//Most right road up:down
        {
            createConstructionSite(room, startPos.x, startPos.y + i, "R");
        }
    }
}

var buildExtensionsAroundCenter = function(room, center, comingFrom) {
    for(var i = center.x - 1; i <= center.x + 1; i ++)
    {
        for(var j = center.y - 1; j <= center.y + 1; j ++)
        {
            if(i === center.x && j === center.y) continue;
            if(i === comingFrom.x && j === comingFrom.y) continue;
            createConstructionSite(room, i, j, "E");
        }
    }
    createConstructionSite(room, center.x, center.y, "R");
}

var createConstructionSite = function(room, x, y, type){
    if(previewPlacement)
    {
        var color = "#ffffff"
        switch(type)
        {
            case "R":
                color = room.controller.level <= 2 ? "#ff0000" : "#ffffff"
            break;
            case "E":
                color = "#ffffff"
            break;
            case "W":
                color = room.controller.level <= 2 ? "#ff0000" : "#ffffff"
            break;
            case "A":
                color = room.controller.level <= 2 ? "#ff0000" : "#ffffff"
            break;
        }
        room.visual.text(type, x, y, {align: 'center', opacity: 0.5, color: color});
    }
    
    if(disableConstruction)
        return;
    if(x < 0 || y < 0 || x > 49 || y > 49)
        return;
    if(room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length !== 0) return;
    
    var foundStructures = room.lookForAt('structure', x, y);
    var roadFound = false;
    var otherStructureFound = false
    
    for(var i = 0; i < foundStructures.length; i ++)
    {
        switch(foundStructures[i].structureType)
        {
            case STRUCTURE_ROAD:
                roadFound = true;
            break;
            default:
                otherStructureFound = true;
            break;
        }
    }
    
    var extensions = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_EXTENSION });
    var extensionsInConstruction = room.find(FIND_CONSTRUCTION_SITES, { filter: (s) => s.structureType === STRUCTURE_EXTENSION });
    var extensionCount;
    switch (room.controller.level) {
    case 2:
      extensionCount = 5;
      break;
    case 3:
      extensionCount = 10;
      break;
    default:
      extensionCount = (room.controller.level - 2) * 10;
      break;
    }
    
    switch(type)
    {
        case "R":
            if(!roadFound && room.controller.level > 2)
            {
                room.createConstructionSite(x, y, STRUCTURE_ROAD);
            }
        break;
        case "E":
            if(!otherStructureFound)
            {
                if (extensions.length + extensionsInConstruction.length < extensionCount) {
                    room.createConstructionSite(x, y, STRUCTURE_EXTENSION);
                }
            }
        break;
        case "W":
            if(!otherStructureFound && room.controller.level > 2)
            {
                room.createConstructionSite(x, y, STRUCTURE_WALL);
            }
        break;
        case "A":
            
            if(!otherStructureFound && room.controller.level > 2)
            {
                room.createConstructionSite(x, y, STRUCTURE_RAMPART)
            }
        break;
    }
}

module.exports = logicCreateConstructionSites;
