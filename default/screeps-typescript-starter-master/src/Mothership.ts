import { Nexus } from "Nexus";
import { Probe } from "Probe";
import { ProbeSetup } from "ProbeSetup";
import { Cannon } from "Cannon";
import { Tasks } from "Tasks";
import { Helper } from "Helper";

export function run(): void {
  let roomsToHarvest = Tasks.getRoomsToHarvest();
  let probeSetupHarvester = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit:3 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupUpgrader = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "upgrader-" + Game.time, { role: "upgrader" });
  let probeSetupBuilder = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "builder-" + Game.time, { role: "builder" });
  let probeSetupCarrier = new ProbeSetup({ ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 3 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupRepairer = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "repairer-" + Game.time, { role: "repairer" });

  let myRooms = Tasks.getmyRoomsWithController();
  myRooms.forEach(function (room) {
    let spawn = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })[0]
    let energyCapacityRoom = room.energyCapacityAvailable;
    let structureSpawn = new StructureSpawn(spawn.id);

    if (Nexus.getProbes("harvester", room.name).length < 4) {
      Nexus.spawnCreep(probeSetupHarvester, structureSpawn, energyCapacityRoom);
    } else if (Nexus.getProbes("upgrader", room.name).length < 2) {
      Nexus.spawnCreep(probeSetupUpgrader, structureSpawn, energyCapacityRoom);
    } else if (Nexus.getProbes("builder", room.name).length < 2 && getConstructionSitesFromRoom(room).length > 0) {
      Nexus.spawnCreep(probeSetupBuilder, structureSpawn, energyCapacityRoom);
    } else if (Nexus.getProbes("carrier", room.name).length < 2) {
      Nexus.spawnCreep(probeSetupCarrier, structureSpawn, energyCapacityRoom);
    } else if (Nexus.getProbes("repairer", room.name).length < 1 && getClosestStructureToRepair(structureSpawn.pos, 0.7) != null) {
      Nexus.spawnCreep(probeSetupRepairer, structureSpawn, energyCapacityRoom);
    } else if (spawnSoldier(room, roomsToHarvest)) {
      console.log("Spawning soldier.");
    } else if (spawnLongDistanceHarvester(room, roomsToHarvest)) {
      console.log("Spawning long distance harvester.");
    } else if (spawnLongDistanceCarrier(room, roomsToHarvest)) {
      console.log("Spawning long distance carrier.");
    } else if (spawnClaimer(room, roomsToHarvest)) {
      console.log("Spawning claimer.");
    } 

    let allCannons = Nexus.getCannons(room);
    allCannons.forEach(function (cannon) {
      cannonLogic(cannon);
    })
  })

  let allProbes = Nexus.getProbes();
  allProbes.forEach(function (probe) {
    switch (probe.memory.role) {
      case "harvester":
        harvesterLogic(probe);
        break;
      case "upgrader":
        upgraderLogic(probe);
        break;
      case "builder":
        builderLogic(probe);
        break;
      case "carrier":
        carrierLogic(probe);
        break;
      case "repairer":
        repairerLogic(probe);
        break;
      case "longDistanceHarvester":
        longDistanceHarvesterLogic(probe);
        break;
      case "longDistanceCarrier":
        longDistanceCarrierLogic(probe);
        break;
      case "claimer":
        claimerLogic(probe);
        break;
      case "soldier":
        soldierLogic(probe);
        break;
    }
  });
}

function harvesterLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    let deposit = getClosestEmptyDeposit(probe);
    if (deposit) {
      probe.transfer(deposit, RESOURCE_ENERGY);
    }
  } else {
    let source = getClosestActiveSourceDivided(probe);
    if (source) {
      probe.harvest(source);
    }
  }
}

function upgraderLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    probe.memory.isWorking = true;
    probe.memory.isGathering = false;
  }
  if (_.sum(probe.carry) === 0) {
    probe.memory.isWorking = false;
    probe.memory.isGathering = true;
  }

  if (probe.memory.isWorking) {
    let target = getController(probe);
    if (target) {
      probe.upgradeController(target);
    }
  }
  if (probe.memory.isGathering) {
    let deposit = getClosestFilledDeposit(probe, false);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    } else {
      let source = getClosestActiveSourceDivided(probe);
      if (source) {
        probe.harvest(source);
      }
    }
  }
}

function builderLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    probe.memory.isWorking = true;
    probe.memory.isGathering = false;
  }
  if (_.sum(probe.carry) === 0) {
    probe.memory.isWorking = false;
    probe.memory.isGathering = true;
  }

  if (probe.memory.isWorking) {
    let target = getClosestConstructionSite(probe);
    if (target) {
      probe.build(target);
    }
  }
  if (probe.memory.isGathering) {
    let deposit = getClosestFilledDeposit(probe, false);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    } else {
      let source = getClosestActiveSourceDivided(probe);
      if (source) {
        probe.harvest(source);
      }
    }
  }
}

function carrierLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    probe.memory.isWorking = true;
    probe.memory.isGathering = false;
  }
  if (_.sum(probe.carry) === 0) {
    probe.memory.isWorking = false;
    probe.memory.isGathering = true;
  }
  if (probe.memory.isWorking) {
    let supply = getStructureToSupplyForReproduction(probe);
    if (supply) {
      probe.transfer(supply, RESOURCE_ENERGY);
    }
    else {
      let supplyControllerDeposit = getDepositNextToController(probe.room, true);
      if (supplyControllerDeposit.length > 0) {
        probe.transfer(supplyControllerDeposit[0], RESOURCE_ENERGY);
      }
      else {
        let differentOtherStucture = getStructureToSupply(probe);
        if (differentOtherStucture) {
          probe.transfer(differentOtherStucture, RESOURCE_ENERGY);
        }
      }
    }
  }
  if (probe.memory.isGathering) {
    let deposit = getClosestFilledDeposit(probe, true);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    }
  }
}

function repairerLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    probe.memory.isWorking = true;
    probe.memory.isGathering = false;
  }
  if (_.sum(probe.carry) === 0) {
    probe.memory.isWorking = false;
    probe.memory.isGathering = true;
  }

  if (probe.memory.isWorking) {
    let target = getClosestStructureToRepair(probe.pos, 0.9);
    if (target) {
      probe.repair(target);
    }
  }
  if (probe.memory.isGathering) {
    let deposit = getClosestFilledDeposit(probe, false);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    } else {
      let source = getClosestActiveSourceDivided(probe);
      if (source) {
        probe.harvest(source);
      }
    }
  }
}

function longDistanceHarvesterLogic(probe: Probe): void {
  if (probe.room.name != probe.memory.remote) {
    probe.goToDifferentRoom(probe.memory.remote);
  }
  else {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isWorking) {
      let containerToConstruct = getConstructionSiteWithinRange(probe.pos, STRUCTURE_CONTAINER, 3);
      if (containerToConstruct) {
        probe.build(containerToConstruct);
      }
      else {
        let deposit = getClosestEmptyDeposit(probe);
        if (deposit) {
          probe.transfer(deposit, RESOURCE_ENERGY);
        } else {
          let target = getClosestStructureToRepair(probe.pos, 0.4);
          if (target) {
            probe.repair(target);
          }
          else {
            let target = getClosestConstructionSite(probe);
            if (target) {
              probe.build(target);
            }
            else {
              let target = getClosestStructureToRepair(probe.pos, 0.7);
              if (target) {
                probe.repair(target);
              }
              else {
                let target = getClosestStructureToRepair(probe.pos, 1.0);
                if (target) {
                  probe.repair(target);
                }
              }
            }
          }
        }
      }
    }
    if (probe.memory.isGathering)
    {
      let source = getClosestActiveSourceDivided(probe);
      if (source) {
        probe.harvest(source);
      }
    }
  }
}

function longDistanceCarrierLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    probe.memory.isWorking = true;
    probe.memory.isGathering = false;
  }
  if (_.sum(probe.carry) === 0) {
    probe.memory.isWorking = false;
    probe.memory.isGathering = true;
  }

  if (probe.memory.isGathering) {
    if (probe.room.name != probe.memory.remote) {
      probe.goToDifferentRoom(probe.memory.remote);
    } else {
      let deposit = getClosestFilledDeposit(probe, true);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
      }
    }
  }
  if (probe.memory.isWorking) {
    if (probe.room.name != probe.memory.homeName) {
      probe.goToDifferentRoom(probe.memory.homeName);
    } else {
      let supply = getStructureToSupply(probe);
      if (supply) {
        probe.transfer(supply, RESOURCE_ENERGY);
      }
    }
  }
}

function cannonLogic(cannon: Cannon): void {
  let enemy = getClosestEnemy(cannon);
  if (enemy) {
    cannon.attack(enemy);
  }
  else {
    let structure = getClosestStructureToRepair(cannon.pos, 0.7);//TODO: Use closest by range
    if (structure) {
      cannon.repair(structure);
    }
    else {
      let structure = getClosestStructureToRepair(cannon.pos, 1);
      if (structure) {
        cannon.repair(structure);
      }
    }
  }
}

function claimerLogic(probe: Probe): void {
  if (probe.room.name != probe.memory.remote) {
    probe.goToDifferentRoom(probe.memory.remote);
  } else {
    let controller = getController(probe);
    if (controller) {
      probe.reserve(controller);
    }
  }
}

function soldierLogic(probe: Probe): void {
  if (probe.room.name != probe.memory.remote) {
    probe.goToDifferentRoom(probe.memory.remote);
  } else {
    let enemy = getClosestEnemy(probe);
    if (enemy) {
      probe.attack(enemy);
    }
  } 
}

function getClosestActiveSourceDivided(probe: Probe): Source | null {
  let sources = probe.room.find(FIND_SOURCES_ACTIVE);
  let arraySources: number[];
  arraySources = [];
  let currentSourceIndex = 0;
  let i = 0;
  sources.forEach(function (source) {
    let count = Helper.getCashedMemory("Harvesting-" + source.id);
    count = count == undefined ? 0 : count;
    if (source.id == probe.memory.targetId) {
      count--;
      currentSourceIndex = i;
    }
    arraySources.push(count);
    i++;
  })
  let minIndex = arraySources.indexOf(Math.min(...arraySources));
  arraySources[minIndex] += 100;
  let secondMinIndex = arraySources.indexOf(Math.min(...arraySources));//Get the second minimum index by temporarly seeting the minimum to a hich number.
  arraySources[minIndex] -= 100;
  if (minIndex != undefined) {
    //if (probe.room.name == "W8N3") {
    //  console.log("-------------");
    //  console.log(probe.creep.id);
    //  console.log("index 0 - " + sources[0] + " " + arraySources[0])
    //  console.log("index 1 - " + sources[1] + " " + arraySources[1])
    //  console.log("index m - " + sources[minIndex] + " " + arraySources[minIndex])
    //  console.log("index c - " + sources[currentSourceIndex] + " " + arraySources[currentSourceIndex])
    //}
    if (arraySources[currentSourceIndex] > arraySources[minIndex]) {
      let source: Source | null;
      if (arraySources[minIndex] == arraySources[secondMinIndex]) {
        source = probe.pos.findPathTo(sources[minIndex]).length < probe.pos.findPathTo(sources[secondMinIndex]).length ? sources[minIndex] : sources[secondMinIndex];
      } else {
        source = sources[minIndex];
      }
      Helper.incrementCashedMemory("Harvesting-" + probe.memory.targetId, -1);
      Helper.incrementCashedMemory("Harvesting-" + source.id, 1);
      return source;
    }
    else {
      return sources[currentSourceIndex];
    }
  } else {
    return null
  }
}

//Old function that returns active source
//function getClosestActiveSource(probe: Probe): Source | null {
//  let source = probe.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
//  return source;
//}

function getClosestEmptyDeposit(probe: Probe): Structure | null {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => (structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity)
      || ((structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION ||
      structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity)
  });
  return deposit;
}

function getClosestFilledDeposit(probe: Probe, excludeControllerDeposit: boolean//, resource: ResourceConstant = RESOURCE_ENERGY
): Structure | null {
  let controllerDeposits = getDepositNextToController(probe.room, false);
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure =>
      ((structure.structureType == STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] > 0
        && (!excludeControllerDeposit || (excludeControllerDeposit && !controllerDeposits.includes(structure))))
  })
  return deposit;
}


function getController(probeOrRoom: Probe | Room): StructureController | null {
  let target: any;
  if (probeOrRoom instanceof Probe) {
    target = probeOrRoom.pos.findClosestByPath(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) });
  }
  else {
    target = probeOrRoom.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) })[0];
  }
  return target instanceof StructureController ? target : null;
}

function getConstructionSiteWithinRange(pos: RoomPosition, structureType: StructureConstant, range: number): ConstructionSite | null {
  let construnctionSite = pos.findInRange(FIND_CONSTRUCTION_SITES, range, { filter: (structure: any) => structure.structureType == structureType })[0];
  return construnctionSite;
}

function getClosestConstructionSite(probe: Probe): ConstructionSite | null {
  let construnctionSite = probe.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  return construnctionSite;
}

function getConstructionSitesFromRoom(room: Room): ConstructionSite[] {
  let construnctionSites = room.find(FIND_CONSTRUCTION_SITES);
  return construnctionSites;
}

function getStructureToSupplyForReproduction(probe: Probe): Structure | null  {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => ((
      structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity)
  });
  return deposit
}

function getStructureToSupply(probe: Probe): Structure | null {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => ((
      structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION ||
      structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity) ||
      ((structure.structureType == STRUCTURE_STORAGE) && _.sum(structure.store) < structure.storeCapacity) ||
      (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.75)
  });
  return deposit
}

function getDepositNextToController(room: Room, notFilled: boolean): Structure[] {
  if (room.controller == null)
    return [];
  let deposits = room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
    filter: (structure: any) => ((structure.structureType == STRUCTURE_CONTAINER) && (!notFilled || (notFilled &&_.sum(structure.store) < structure.storeCapacity * 0.75)))
  });
  return deposits;
}

function getClosestStructureToRepair(pos: RoomPosition, damageProportion: number): Structure | null {
  let structure = pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => (structure.hits < structure.hitsMax * damageProportion)
  });
  return structure;
}

//function getStorage(pos: RoomPosition): StructureStorage | null{
//  let structure = pos.findClosestByPath(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_STORAGE });
//  return structure instanceof StructureStorage ? structure : null;;
//}

function getClosestEnemy(fromThis: Cannon | Probe | Room): Creep | null {
  let enemy: Creep | null;
  if (fromThis instanceof Cannon) {
    enemy = fromThis.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  }
  else if (fromThis instanceof Probe) {
    enemy = fromThis.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
  }
  else {
    enemy = fromThis.find(FIND_HOSTILE_CREEPS)[0];
  }
  return enemy;
}

function spawnLongDistanceHarvester(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {

  for (let i = 0; i < roomsToHarvest.length; i++) {
    let probeSetupLongDistanceHarvester = new ProbeSetup({ ordered: true, pattern: [WORK, WORK, MOVE], suffix: [MOVE, CARRY], proportionalPrefixSuffix: false, sizeLimit: 3 }, "longDistanceHarvester-" + Game.time, { role: "longDistanceHarvester", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let harvesters = Nexus.getProbes("longDistanceHarvester", roomsToHarvest[i], true);
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let sources = roomToHarvest != null ? roomToHarvest.find(FIND_SOURCES).length : 1;
    let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(harvesters, WORK);
    let energyToUse = 800;//6 Work - 3 Move - 1 Carry = 800 would add one more move at level 4
    //adjust for controller level 3

    if (workBodyParts > sources * 6  || roomToSpawnFrom.energyAvailable < energyToUse)
      continue;

    Nexus.spawnCreep(probeSetupLongDistanceHarvester, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

function spawnLongDistanceCarrier(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {

  for (let i = 0; i < roomsToHarvest.length; i++) {
    let probeSetupLongDistanceCarrier = new ProbeSetup({ ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 5 }, "longDistanceCarrier-" + Game.time, { role: "longDistanceCarrier", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let carriers = Nexus.getProbes("longDistanceCarrier", roomsToHarvest[i], true);
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let containers = roomToHarvest != null ? roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER }).length : 0;
    let energyToUse = 750;//10 Carry - 5 Move = 750

    if (carriers.length > containers || roomToSpawnFrom.energyAvailable < energyToUse)
      continue;

    Nexus.spawnCreep(probeSetupLongDistanceCarrier, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

function spawnClaimer(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {

  for (let i = 0; i < roomsToHarvest.length; i++) {
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    if (!roomToHarvest)//If room not visible don't create any claimers
      continue;
    let probeSetupClaimer = new ProbeSetup({ ordered: true, pattern: [CLAIM, MOVE], sizeLimit: 2 }, "claimer-" + Game.time, { role: "claimer", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let claimers = Nexus.getProbes("claimer", roomsToHarvest[i], true);
    let energyToUse = 650;//1 Claim - 1 Move = 650
    let claimBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(claimers, CLAIM);
    let claimer = getController(roomToHarvest);

    if (claimBodyParts >= 2 || roomToSpawnFrom.energyAvailable < energyToUse || !claimer)
      continue;
    if (claimer.reservation) {
      if (claimer.reservation.ticksToEnd > 3000)
        continue;
    }

    Nexus.spawnCreep(probeSetupClaimer, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

function spawnSoldier(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {
  for (let i = 0; i < roomsToHarvest.length; i++) {
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    if (!roomToHarvest)//If room not visible don't create any soldiers
      continue;
    let probeSetupSoldier = new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH], pattern: [ATTACK, MOVE], sizeLimit: 5 }, "soldier-" + Game.time, { role: "soldier", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let soldiers = Nexus.getProbes("soldier", roomsToHarvest[i], true);
    let energyToUse = 700;//5 TOUGH - 5 Attack - 5 Move = 700
    let enemyInRoom = getClosestEnemy(roomToHarvest);

    if (soldiers.length >= 1 || roomToSpawnFrom.energyAvailable < energyToUse || enemyInRoom == undefined)
      continue;
    
    Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

//MOVE	    50	Moves the creep. Reduces creep fatigue by 2/tick. See movement.
//WORK	    100	Harvests energy from target source. Gathers 2 energy/tick. Constructs a target structure. Builds the designated structure at a construction site, at 5 points/tick, consuming 1 energy/point. See building Costs. Repairs a target structure. Repairs a structure for 20 hits/tick. Consumes 0.1 energy/hit repaired, rounded up to the nearest whole number.
//CARRY	    50	Stores energy. Contains up to 50 energy units. Weighs nothing when empty.
//ATTACK	80	Attacks a target creep/structure. Deals 30 damage/tick. Short-ranged attack (1 tile).
//RANGED_ATTACK	150	Attacks a target creep/structure. Deals 10 damage/tick. Long-ranged attack (1 to 3 tiles).
//HEAL	    250	Heals a target creep. Restores 12 hit points/tick at short range (1 tile) or 4 hits/tick at a distance (up to 3 tiles).
//TOUGH	    10	No effect other than the 100 hit points all body parts add. This provides a cheap way to add hit points to a creep.
//CLAIM	    600
