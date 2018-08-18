var linkTransfer = {
    run: function(room) {
        var linkFromCollection = [];
        var linkToCollection = [];
        var sources = room.find(FIND_SOURCES);
        
        //Get From links from nearby sources
        var i
        for(i = 0; i < sources.length; i ++)
        {
            var targetLink = sources[i].pos.findInRange(FIND_MY_STRUCTURES, 3, {filter: (structure) => { return structure.structureType === STRUCTURE_LINK }});
            if(targetLink.length !== 0)
            {
                linkFromCollection.push(targetLink[0]);
            }
        }
        
        //Get To links from nearby controller
        var links = room.controller.pos.findInRange(FIND_MY_STRUCTURES, 2,{filter: {structureType: STRUCTURE_LINK}});
        if(links.length !== 0)
        {
            linkToCollection.push(links[0])
        }
        
        //Get To links from nearby storages
        var storages = room.find(FIND_MY_STRUCTURES,{filter: {structureType: STRUCTURE_STORAGE}});
        if(storages.length !== 0)
        {
            links = storages[0].pos.findInRange(FIND_MY_STRUCTURES, 2,{filter: {structureType: STRUCTURE_LINK}});
            if(links.length !== 0)
            {
                linkToCollection.push(links[0])
            }
        }
        
        //Get From links from borders
        var linksBorder = room.find(FIND_MY_STRUCTURES, {filter: (structure) => { return structure.structureType === STRUCTURE_LINK && (structure.pos.x < 4 || structure.pos.y < 4 || structure.pos.x > 45 || structure.pos.y > 45) }})
        for(i = 0; i < linksBorder.length; i ++)
        {
            linkFromCollection.push(linksBorder[i]);
        }
        
        for(i = 0; i < linkFromCollection.length; i ++)
        {
            for(var j = 0; j < linkToCollection.length; j ++)
            {
                if(linkFromCollection[i] === null && linkToCollection[j] === null) continue;
                if(linkFromCollection[i].energy > 100 && linkToCollection[j].energy < 500)
                {
                    linkFromCollection[i].transferEnergy(linkToCollection[j]);
                }
            }
        }
        
    }
}

module.exports = linkTransfer;
