module.exports = function() {
    StructureSpawn.prototype.spawnCustomCreep = 
        function(energy, role, bodyPartsStyle, home, remoteLocation)
        {
            var body = [];
            if (role == "carrier")
            {
                var numberOfParts =  Math.floor(energy / 150)
                for(let i = 0; i < numberOfParts * 2; i ++)
                {
                    body.push(CARRY);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(MOVE);
                }
            }
            else if (role == "carrierUnloader")
            {
                var numberOfParts =  Math.floor(energy / 150)
                for(let i = 0; i < numberOfParts * 2; i ++)
                {
                    body.push(CARRY);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(MOVE);
                }
            }
            else if (role == "longDistanceCarrier")
            {
                switch(bodyPartsStyle)
                {
                    case 0:
                        var numberOfParts =  Math.floor((energy - 100) / 100) ;
                        body.push(WORK);
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(CARRY);
                        }
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(MOVE);
                        }
                    break;
                    case 1:
                        var numberOfParts =  Math.floor((energy - 250) / 150) ;
                        body.push(WORK);
                        body.push(WORK);
                        body.push(MOVE);
                        for(let i = 0; i < numberOfParts * 2; i ++)
                        {
                            body.push(CARRY);
                        }
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(MOVE);
                        }
                    break;
                }
            }
            else if (role == "harvester")
            {
                switch(bodyPartsStyle)
                {
                    case 0:
                        var numberOfTripleParts =  Math.floor(energy / 200);
                        if(numberOfTripleParts == 0) return;
                        for(let i = 0; i < numberOfTripleParts; i ++)
                        {
                            body.push(WORK);
                            body.push(CARRY);
                            body.push(MOVE);
                        }
                    break;
                    case 1:
                        var numberOfParts =  Math.floor((energy - 300) / 100)
                        if(numberOfParts == 0) return;
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(WORK);
                        }
                        body.push(CARRY);
                        body.push(CARRY);
                        body.push(MOVE);
                        body.push(MOVE);
                        body.push(MOVE);
                        body.push(MOVE);
                    break;
                }
            }
            else if (role == "longDistanceHarvester")
            {
                switch(bodyPartsStyle)
                {
                    case 0:
                        var numberOfTripleParts =  Math.floor(energy / 200);
                        if(numberOfTripleParts == 0) return;
                        for(let i = 0; i < numberOfTripleParts; i ++)
                        {
                            body.push(WORK);
                            body.push(CARRY);
                            body.push(MOVE);
                        }
                    break;
                    case 1:
                        var numberOfParts =  Math.floor((energy - 50) / 150)
                        if(numberOfParts == 0) return;
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(WORK);
                        }
                        body.push(CARRY);
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(MOVE);
                        }
                    break;
                }
            }
            else if (role == "claimer")
            {
                var numberOfParts =  Math.floor(energy / 650);
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(CLAIM);
                    body.push(MOVE);
                }
            }
            else if (role == "soldier")
            {
                var numberOfParts =  Math.floor(energy / 190);
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(TOUGH);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(ATTACK);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(MOVE);
                    body.push(MOVE);
                }
            }
            else if (role == "upgrader")
            {
                switch(bodyPartsStyle)
                {
                    case 0:
                        var numberOfParts =  Math.floor(energy / 200)
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(WORK);
                        }
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(CARRY);
                        }
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(MOVE);
                        }
                    break;
                    case 1:
                        var numberOfParts =  Math.floor((energy - 100) / 100)
                        
                        body.push(CARRY);
                        body.push(MOVE);
                        for(let i = 0; i < numberOfParts; i ++)
                        {
                            body.push(WORK);
                        }
                    break;
                }
            }
            else if (role == "builder" || role == "longDistanceBuilder")
            {
                var numberOfParts =  Math.floor(energy / 200)
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(WORK);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(CARRY);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(MOVE);
                }
            }
            else if (role == "armyAttacker")
            {
                var numberOfParts =  Math.floor(energy / 190);
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(TOUGH);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(ATTACK);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(MOVE);
                    body.push(MOVE);
                }
            }
            else if (role == "armyHealer")
            {
                var numberOfParts =  Math.floor(energy / 360);
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(TOUGH);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(HEAL);
                }
                for(let i = 0; i < numberOfParts; i ++)
                {
                    body.push(MOVE);
                    body.push(MOVE);
                }
            }
            else if (role == "spy")
            {
                body.push(MOVE);
            }
            return this.spawnCreep(body, role + Game.time, {memory: {role: role, home: home, remote: remoteLocation}});
        }/*,
    
    Room.prototype.getCostMatrixCallback = function(end, excludeStructures, oneRoom, allowExits) {
        let costMatrix = false;
        try 
        {
            costMatrix = this.getMemoryCostMatrix();
            console.log(costMatrix)
        } 
        catch (err) 
        {
            this.log('getMemoryCostMatrix', err, err.stack);
        }
        if (!costMatrix) 
        {
            this.updatePosition();
        }
    }*/
};

//MOVE	    50	Moves the creep. Reduces creep fatigue by 2/tick. See movement.
//WORK	    100	Harvests energy from target source. Gathers 2 energy/tick. Constructs a target structure. Builds the designated structure at a construction site, at 5 points/tick, consuming 1 energy/point. See building Costs. Repairs a target structure. Repairs a structure for 20 hits/tick. Consumes 0.1 energy/hit repaired, rounded up to the nearest whole number.
//CARRY	    50	Stores energy. Contains up to 50 energy units. Weighs nothing when empty.
//ATTACK	80	Attacks a target creep/structure. Deals 30 damage/tick. Short-ranged attack (1 tile).
//RANGED_ATTACK	150	Attacks a target creep/structure. Deals 10 damage/tick. Long-ranged attack (1 to 3 tiles).
//HEAL	    250	Heals a target creep. Restores 12 hit points/tick at short range (1 tile) or 4 hits/tick at a distance (up to 3 tiles).
//TOUGH	    10	No effect other than the 100 hit points all body parts add. This provides a cheap way to add hit points to a creep.
//CLAIM	    600






