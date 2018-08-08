import { Nexus } from "Nexus";
import { Probe } from "Probe";
import { ProbeSetup } from "ProbeSetup";

export function run(): void {
  let room = Game.rooms["W8N3"];
  let roomsToHarvest = ["W7N3"];
  let spawn = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })[0]
  let energyCapacityRoom = room.energyCapacityAvailable;
  let structureSpawn = new StructureSpawn(spawn.id);
  let probeSetupHarvester = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit:3 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupUpgrader = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "upgrader-" + Game.time, { role: "upgrader" });
  let probeSetupBuilder = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "builder-" + Game.time, { role: "builder" });
  let probeSetupCarrier = new ProbeSetup({ ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 3 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupRepairer = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "repairer-" + Game.time, { role: "repairer" });

  if (Nexus.getProbes("harvester", room.name).length < 4) {
    Nexus.spawnCreep(probeSetupHarvester, structureSpawn, energyCapacityRoom);
  } else if (Nexus.getProbes("upgrader", room.name).length < 2) {
    Nexus.spawnCreep(probeSetupUpgrader, structureSpawn, energyCapacityRoom);
  } else if (Nexus.getProbes("builder", room.name).length < 2 && getConstructionSitesFromRoom(room).length > 0) {
    Nexus.spawnCreep(probeSetupBuilder, structureSpawn, energyCapacityRoom);
  } else if (Nexus.getProbes("carrier", room.name).length < 2) {
    Nexus.spawnCreep(probeSetupCarrier, structureSpawn, energyCapacityRoom);
  } else if (Nexus.getProbes("repairer", room.name).length < 1 && getClosestStructureToRepair(spawn.pos, 0.7) != null) {
    Nexus.spawnCreep(probeSetupRepairer, structureSpawn, energyCapacityRoom);
  } else if (spawnLongDistanceHarvester(room, roomsToHarvest)) {
    console.log("Spawning long distance harvester.");
  } else if (spawnLongDistanceCarrier(room, roomsToHarvest)) {
    console.log("Spawning long distance carrier.");
  } else if (spawnClaimer(room, roomsToHarvest)) {
    console.log("Spawning claimer.")
  }

  let harvesters = Nexus.getProbes("harvester");
  let upgraders = Nexus.getProbes("upgrader");
  let builders = Nexus.getProbes("builder");
  let carriers = Nexus.getProbes("carrier");
  let repairers = Nexus.getProbes("repairer");
  let longDistanceHarvesters = Nexus.getProbes("longDistanceHarvester");
  let longDistanceCarriers = Nexus.getProbes("longDistanceCarrier");
  let claimers = Nexus.getProbes("claimer");
  harvesters.forEach(function (harvester) {
    harvesterLogic(harvester);
  });
  upgraders.forEach(function (upgrader) {
    upgraderLogic(upgrader);
  });
  builders.forEach(function (builder) {
    builderLogic(builder);
  });
  carriers.forEach(function (carrier) {
    carrierLogic(carrier);
  });
  repairers.forEach(function (repairer) {
    repairerLogic(repairer);
  });
  longDistanceHarvesters.forEach(function (longDistanceHarvester) {
    longDistanceHarvestersLogic(longDistanceHarvester);
  });
  longDistanceCarriers.forEach(function (longDistanceCarrier) {
    longDistanceCarrierLogic(longDistanceCarrier);
  });
  claimers.forEach(function (claimer) {
    claimerLogic(claimer);
  });
}

function harvesterLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    let deposit = getClosestEmptyDeposit(probe);
    if (deposit) {
      probe.transfer(deposit, RESOURCE_ENERGY);
    }
  } else {
    let source = getClosestActiveSource(probe);
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
      let source = getClosestActiveSource(probe);
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
      let source = getClosestActiveSource(probe);
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
      let source = getClosestActiveSource(probe);
      if (source) {
        probe.harvest(source);
      }
    }
  }
}

function longDistanceHarvestersLogic(probe: Probe): void {
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
    if (probe.memory.isGathering)
    {
      let source = getClosestActiveSource(probe);
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

function getClosestActiveSource(probe: Probe): Source | null {
  let source = probe.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  return source;
}

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
      ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0
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
      structure.structureType == STRUCTURE_EXTENSION ||
      structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity)
  });
  return deposit
}

function getStructureToSupply(probe: Probe): Structure | null {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => ((
      structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION ||
      structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity) ||
      ((structure.structureType == STRUCTURE_STORAGE ||
        structure.structureType == STRUCTURE_CONTAINER) && _.sum(structure.store) < structure.storeCapacity)
  });
  return deposit
}

function getDepositNextToController(room: Room, notFilled: boolean): Structure[] {
  if (room.controller == null)
    return [];
  let deposits = room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
    filter: (structure: any) => ((structure.structureType == STRUCTURE_CONTAINER) && (!notFilled || (notFilled &&_.sum(structure.store) < structure.storeCapacity)))
  });
  return deposits;
}

function getClosestStructureToRepair(pos: RoomPosition, damageProportion: number): Structure | null {
  let structure = pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => (structure.hits < structure.hitsMax * damageProportion)
  });
  return structure;
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
    let containers = roomToHarvest != null ? roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER }).length : 1;
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
