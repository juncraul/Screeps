import { Nexus } from "Nexus";
import { Probe } from "Probe";
import { ProbeSetup } from "ProbeSetup";
import { Cannon } from "Cannon";
import { Tasks } from "Tasks";
import { Helper } from "Helper";
import { Stargate } from "Stargate";
import { TradeHub } from "TradeHub";

export function run(): void {
  let roomsToHarvest = Tasks.getRoomsToHarvest();
  let probeSetupUpgrader = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "upgrader-" + Game.time, { role: "upgrader" });
  let probeSetupBuilder = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "builder-" + Game.time, { role: "builder" });
  let probeSetupRepairer = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "repairer-" + Game.time, { role: "repairer" });

  let myRooms = Tasks.getmyRoomsWithController();
  myRooms.forEach(function (room) {
    let spawn = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })[0]
    let energyCapacityRoom = room.energyCapacityAvailable;
    let structureSpawn = new StructureSpawn(spawn.id);

    if (spawnHarvester(room)) {
      console.log(room.name + " Spawning Harvester");
    }
    else if (spawnCarrier(room)) {
      console.log(room.name + " Spawning Carrier");
    }
    else if (spawnSoldierForConqueredRoom(room)) {
      console.log(room.name + " Spawning soldier for this room.");
    }
    else if (Nexus.getProbes("upgrader", room.name).length < 2) {
      Nexus.spawnCreep(probeSetupUpgrader, structureSpawn, energyCapacityRoom);
    }
    else if (Nexus.getProbes("builder", room.name).length < 2 && getConstructionSitesFromRoom(room).length > 0) {
      Nexus.spawnCreep(probeSetupBuilder, structureSpawn, energyCapacityRoom);
    }
    else if (Nexus.getProbes("repairer", room.name).length < 1 && getClosestStructureToRepair(structureSpawn.pos, 0.7) != null) {
      Nexus.spawnCreep(probeSetupRepairer, structureSpawn, energyCapacityRoom);
    }
    else if (spawnSoldier(room, roomsToHarvest)) {
      console.log(room.name + " Spawning soldier.");
    }
    else if (spawnLongDistanceHarvester(room, roomsToHarvest)) {
      console.log(room.name + " Spawning long distance harvester.");
    }
    else if (spawnLongDistanceCarrier(room, roomsToHarvest)) {
      console.log(room.name + " Spawning long distance carrier.");
    }
    else if (spawnClaimer(room, roomsToHarvest)) {
      console.log(room.name + " Spawning claimer.");
    }
    else if (spawnLongDistanceBuilder(room, roomsToHarvest)) {
      console.log(room.name + " Spawning long distance builder.");
    }

    let allCannons = Nexus.getCannons(room);
    allCannons.forEach(function (cannon) {
      cannonLogic(cannon);
    })

    Stargate.moveEnergyAround(room);

    if (Game.time % 5 == 0) {
      let terminal = TradeHub.getTerminalFromRoom(room);
      if (terminal) {
        let tradeHub = new TradeHub(terminal);
        tradeHub.setUpOrders();
      }
    }
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
      case "longDistanceBuilder":
        longDistanceBuilderLogic(probe);
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
      let containerNextToSource = getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
      if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
        if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
          probe.goTo(containerNextToSource.pos);
        }
      } else {
        probe.harvest(source);
      }
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
    let deposit = getClosestFilledDeposit(probe, false, false, 300);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    } else {
      let source = getClosestActiveSourceDivided(probe);
      if (source) {
        let containerNextToSource = getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
        if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
            probe.goTo(containerNextToSource.pos);
          }
        } else {
          probe.harvest(source);
        }
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
    let deposit = getClosestFilledDeposit(probe, false, false, 300);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    } else {
      let source = getClosestActiveSourceDivided(probe);
      if (source) {
        let containerNextToSource = getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
        if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
            probe.goTo(containerNextToSource.pos);
          }
        } else {
          probe.harvest(source);
        }
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
    let supply = getStructureToSupplyPriority(probe);
    if (supply) {
      probe.transfer(supply, RESOURCE_ENERGY);
    }
    else {
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
  }
  if (probe.memory.isGathering) {
    let deposit = getClosestFilledDeposit(probe, true, true, 200);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    } else if (_.sum(probe.carry) > 0) {//Instead of waiting for a deposit to fill up, just return back what it currenlty has.
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
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
    let deposit = getClosestFilledDeposit(probe, false, false, 300);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
    } else {
      let source = getClosestActiveSourceDivided(probe);
      if (source) {
        let containerNextToSource = getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
        if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
            probe.goTo(containerNextToSource.pos);
          }
        } else {
          probe.harvest(source);
        }
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
        let containerNextToSource = getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
        if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
            probe.goTo(containerNextToSource.pos);
          }
        } else {
          probe.harvest(source);
        }
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
      let droppedResource = getDroppedResource(probe.pos);
      if (droppedResource) {
        probe.pickup(droppedResource);
      }
      else {
        let deposit = getClosestFilledDeposit(probe, true, false, probe.carryCapacity - _.sum(probe.carry));
        if (deposit) {
          probe.withdraw(deposit, RESOURCE_ENERGY);
        }
        else {
          let deposit = getClosestFilledDeposit(probe, true, false, 0);
          if (deposit) {
            probe.withdraw(deposit, RESOURCE_ENERGY);
          }
        }
      }
    }
  }
  if (probe.memory.isWorking) {
    if (probe.room.name != probe.memory.homeName) {
      probe.goToDifferentRoom(probe.memory.homeName);
    } else {
      let supply = getStructureToSupplyByRemoteWorkers(probe);
      if (supply) {
        probe.transfer(supply, RESOURCE_ENERGY);
      }
    }
  }
}

function longDistanceBuilderLogic(probe: Probe): void {
  if (probe.room.name != probe.memory.remote) {
    probe.goToDifferentRoom(probe.memory.remote);
  } else {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isWorking) {
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
    if (probe.memory.isGathering) {
      let deposit = getClosestFilledDeposit(probe, false, false, 100);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
      } else {
        let source = getClosestActiveSourceDivided(probe);
        if (source) {
          let containerNextToSource = getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
          if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
            if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
              probe.goTo(containerNextToSource.pos);
            }
          } else {
            probe.harvest(source);
          }
        }
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
    let damagedUnit = getClosestDamagedUnit(cannon);
    if (damagedUnit) {
      cannon.heal(damagedUnit);
    }
    else if (cannon.energy > cannon.energyCapacity * 0.5) {
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
}

function claimerLogic(probe: Probe): void {
  if (probe.room.name != probe.memory.remote) {
    probe.goToDifferentRoom(probe.memory.remote);
  } else {
    let controller = getController(probe);
    if (controller) {
      if (Tasks.getRoomsToClaim().includes(probe.room.name)) {
        probe.claim(controller);
      } else {
        probe.reserve(controller);
      }
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

function getClosestFilledDeposit(probe: Probe, excludeControllerDeposit: boolean, excludeStorage: boolean, whenIsMoreThan: number): Structure | null {
  let controllerDeposits = getDepositNextToController(probe.room, false);
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure =>
      ((((structure.structureType == STRUCTURE_CONTAINER ||
        (!excludeStorage && structure.structureType == STRUCTURE_STORAGE)) && structure.store[RESOURCE_ENERGY] > whenIsMoreThan) ||
        (structure.structureType == STRUCTURE_LINK && structure.energy > whenIsMoreThan))
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
  let stargate = Stargate.getDestinationStargates(probe.room)[0];//Works only with one destination
  let nono = stargate ? stargate.id: "meh";
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {   //Consider using: objArray.find(function (obj) { return obj.id === 3; });
    filter: structure => ((
      structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity && structure.id != nono) ||
      ((structure.structureType == STRUCTURE_STORAGE ||
        structure.structureType == STRUCTURE_TERMINAL) && _.sum(structure.store) < structure.storeCapacity) ||
      (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.75)
  });
  return deposit
}

function getStructureToSupplyPriority(probe: Probe): Structure | null {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, { 
    filter: structure => (
      (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.45)
  )});
  return deposit
}

function getStructureToSupplyByRemoteWorkers(probe: Probe): Structure | null {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => ((
      structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION ||
      structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity) ||
      ((structure.structureType == STRUCTURE_STORAGE ||
        structure.structureType == STRUCTURE_CONTAINER ||
        structure.structureType == STRUCTURE_TERMINAL) && _.sum(structure.store) < structure.storeCapacity) ||
      (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.75)
  });
  return deposit
}

function getDepositNextToController(room: Room, notFilled: boolean): Structure[] {
  if (room.controller == null)
    return [];
  let deposits = room.controller.pos.findInRange(FIND_STRUCTURES, 4, {
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

function getDroppedResource(pos: RoomPosition): Resource | null {
  let resource = pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (res) => res.amount > 100 });
  return resource;
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

function getClosestDamagedUnit(fromThis: Cannon | Probe): Creep | null {
  let damagedUnit: Creep | null;
  if (fromThis instanceof Cannon) {
    damagedUnit = fromThis.pos.findClosestByRange(FIND_MY_CREEPS, { filter: (creep) => creep.hits < creep.hitsMax })
  } else {
    damagedUnit = fromThis.pos.findClosestByPath(FIND_MY_CREEPS, { filter: (creep) => creep.hits < creep.hitsMax })
  }
  return damagedUnit;
}

function getStructuresInRangeOf(roomPosition: RoomPosition, structureToLookFor: StructureConstant, range: number): Structure[] {
  let structures = roomPosition.findInRange(FIND_STRUCTURES, range);
  let structuresFiltered: Structure[];
  structuresFiltered = [];
  structures.forEach(function (structure) {
    if (structure.structureType == structureToLookFor) {
      structuresFiltered.push(structure);
    }
  })
  return structuresFiltered;
}

function spawnHarvester(roomToSpawnFrom: Room): boolean {
  let probeSetupHarvester: ProbeSetup;
  let probeSetupHarvesterOne = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 1 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupHarvesterTwo = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE], sizeLimit: 3 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupHarvesterThree = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE], sizeLimit: 5 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupHarvesterElite = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE], sizeLimit: 6 }, "harvester-" + Game.time, { role: "harvester" });
  let harvesters = Nexus.getProbes("harvester", roomToSpawnFrom.name);
  let carriers = Nexus.getProbes("carrier", roomToSpawnFrom.name);
  let longDistanceHarvesters = Nexus.getProbes("longDistanceHarvester", roomToSpawnFrom.name, true);
  let harvestersAboutToDie = _.filter(harvesters, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
  let sources = roomToSpawnFrom.find(FIND_SOURCES).length;
  let controller = getController(roomToSpawnFrom);
  let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(harvesters, WORK) + Probe.getActiveBodyPartsFromArrayOfProbes(longDistanceHarvesters, WORK);
  let energyToUse: number;
  let bodyPartsPerSourceRequired = carriers.length <= 1 ? 2 : 6;//Set Harvester at full capacity only if there are enough carriers to sustain them
  let levelBlueprintToBuild: number;

  if (!controller) {
    return false;
  }
  else {
    levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
      ? controller.level//No extenstions to construct, set blueprint as current controller level
      : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level
  }
  switch (levelBlueprintToBuild) {
    case 1://300 Energy avilable
      energyToUse = 200;//1 Work; 1 Carry; 1 Move
      probeSetupHarvester = probeSetupHarvesterOne;
      break;
    case 2://550 Energy available
      energyToUse = 400;//3 Work; 1 Carry; 1 Move
      probeSetupHarvester = probeSetupHarvesterTwo;
      break;
    case 3://800 Energy available
      energyToUse = 600;//5 Work; 1 Carry; 1 Move
      probeSetupHarvester = probeSetupHarvesterThree;
      break;
    default://1300 Energy at least
      energyToUse = 700//6 Work; 1 Carry; 1 Move
      probeSetupHarvester = probeSetupHarvesterElite;
      break;
  }
  //In case when not all extensions got a chance to be built.
  energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;

  //Emergency situation with no carriers and we don't have energy to build the latest harvester. Quickly build 2 low harvesters.
  if (carriers.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse && harvesters.length < 2) {
    energyToUse = 200;//1 Work; 1 Carry; 1 Move
    probeSetupHarvester = probeSetupHarvesterOne;
  }
  else { //Emergency situation with no harvesters and we don't have energy to build the latest harvester. Quickly build 1 low harvester.
    if (harvesters.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse) {
      energyToUse = 200;//1 Work; 1 Carry; 1 Move
      probeSetupHarvester = probeSetupHarvesterOne;
    }
    else { //Emergency situation with one weak harvesters and we don't have energy to build the latest harvester. Quickly build 1 medium harvester.
      if (workBodyParts < 3 && roomToSpawnFrom.energyAvailable < energyToUse) {
        energyToUse = 400;//3 Work; 1 Carry; 1 Move
        probeSetupHarvester = probeSetupHarvesterTwo;
      }
    }
  }

  if (roomToSpawnFrom.energyAvailable < energyToUse) {
    return true;
  }
  
  if (workBodyParts >= sources * bodyPartsPerSourceRequired) {
    if (harvestersAboutToDie.length == 0 || (harvestersAboutToDie.length > 0 && workBodyParts >= (sources + 1) * bodyPartsPerSourceRequired)) {
      return false;
    }
  }

  Nexus.spawnCreep(probeSetupHarvester, roomToSpawnFrom, energyToUse);
  return true;
}

function spawnCarrier(roomToSpawnFrom: Room): boolean {
  let probeSetupCarrier: ProbeSetup;
  let probeSetupCarrierOne = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 1 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupCarrierTwo = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 2 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupCarrierThree = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 5 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupCarrierElite = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 10 }, "carrier-" + Game.time, { role: "carrier" });
  let carriers = Nexus.getProbes("carrier", roomToSpawnFrom.name);
  let carriersAboutToDie = _.filter(carriers, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
  let controller = getController(roomToSpawnFrom);
  let energyToUse: number;
  let levelBlueprintToBuild: number;

  if (!controller) {
    return false;
  }
  else {
    levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
      ? controller.level//No extenstions to construct, set blueprint as current controller level
      : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level
  }
  switch (levelBlueprintToBuild) {
    case 1://300 Energy avilable
      energyToUse = 100;//1 Carry; 1 Move
      probeSetupCarrier = probeSetupCarrierOne;
      break;
    case 2://550 Energy available
      energyToUse = 200;//2 Carry; 2 Move
      probeSetupCarrier = probeSetupCarrierTwo;
      break;
    case 3://800 Energy available
      energyToUse = 500;//5 Carry; 5 Move
      probeSetupCarrier = probeSetupCarrierThree;
      break;
    default://1300 Energy at least
      energyToUse = 1000//10 Carry; 10 Move
      probeSetupCarrier = probeSetupCarrierElite;
      break;
  }
  //In case when not all extensions got a chance to be built.
  energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;

  //Emergency situation with no carriers. Quickly build a low carrier
  if (carriers.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse) {
    energyToUse = 100;//1 Carry; 1 Move
    probeSetupCarrier = probeSetupCarrierOne;
  }

  if (roomToSpawnFrom.energyAvailable < energyToUse) {
    return true;
  }

  if (carriers.length >= 2) {
    if (carriersAboutToDie.length == 0 || (carriersAboutToDie.length > 0 && carriers.length >= 3)) {
      return false;
    }
  }

  Nexus.spawnCreep(probeSetupCarrier, roomToSpawnFrom, energyToUse);
  return true;
}

function spawnLongDistanceHarvester(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {

  for (let i = 0; i < roomsToHarvest.length; i++) {
    let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
    if (roomConnections.length != 0 && !roomConnections.includes(roomsToHarvest[i]))
      continue;
    let probeSetupLongDistanceHarvester = new ProbeSetup({ ordered: true, pattern: [WORK, WORK, MOVE], suffix: [MOVE, CARRY], proportionalPrefixSuffix: false, sizeLimit: 3 }, "longDistanceHarvester-" + Game.time, { role: "longDistanceHarvester", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let harvesters = Nexus.getProbes("longDistanceHarvester", roomsToHarvest[i], true);
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let sources = roomToHarvest != null ? roomToHarvest.find(FIND_SOURCES).length : 1;
    let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(harvesters, WORK);
    let controller = getController(roomToSpawnFrom);
    let energyToUse: number;
    let levelBlueprintToBuild: number;

    if (!controller) {
      return false;
    }
    else {
      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level
    }
    switch (levelBlueprintToBuild) {
      case 1:
      case 2:
        return false;
      case 3://800 Energy available
        energyToUse = 600;//4 Work; 3 Move; 1 Carry
        break;
      default://1300 Energy at least
        energyToUse = 850;//6 Work; 4 Move; 1 Carry
        break;
    }

    if (workBodyParts >= sources * 6  || roomToSpawnFrom.energyAvailable < energyToUse)
      continue;

    Nexus.spawnCreep(probeSetupLongDistanceHarvester, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

function spawnLongDistanceCarrier(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {
  for (let i = 0; i < roomsToHarvest.length; i++) {
    let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
    if (roomConnections.length != 0 && !roomConnections.includes(roomsToHarvest[i]))
      continue;
    let bodySetup = { ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 5 };
    let bodySetupMedium = { ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 8 };
    let probeSetupLongDistanceCarrier = new ProbeSetup(bodySetup, "longDistanceCarrier-" + Game.time, { role: "longDistanceCarrier", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let carriers = Nexus.getProbes("longDistanceCarrier", roomsToHarvest[i], true);
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let containers = roomToHarvest != null ? roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER }).length : 0;
    let controller = getController(roomToSpawnFrom);
    let energyToUse: number;
    let levelBlueprintToBuild: number;
    
    if (!controller) {
      return false;
    }
    else {
      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level
    }
    switch (levelBlueprintToBuild) {
      case 1:
      case 2:
        return false;
      case 3://800 Energy available
        energyToUse = 750;//10 Carry; 5 Move
        break;
      case 4://1300 Energy available
        energyToUse = 1050//14 Carry; 7 Move
        probeSetupLongDistanceCarrier.replaceBodySetup(bodySetupMedium);
        break;
      default://1800 Energy at least
        energyToUse = 1200//16 Carry; 8 Move
        probeSetupLongDistanceCarrier.replaceBodySetup(bodySetupMedium);
        break;
    }

    if (carriers.length >= containers || roomToSpawnFrom.energyAvailable < energyToUse || Tasks.getRoomsToClaim().includes(roomToHarvest.name))
      continue;

    Nexus.spawnCreep(probeSetupLongDistanceCarrier, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

function spawnLongDistanceBuilder(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {
  for (let i = 0; i < roomsToHarvest.length; i++) {
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
    if (!roomToHarvest)
      continue;
    if (roomConnections.length != 0 && !roomConnections.includes(roomsToHarvest[i]))
      continue;
    let probeSetupLongDistanceBuilder = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 5 }, "longDistanceBuilder-" + Game.time, { role: "longDistanceBuilder", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let builders = Nexus.getProbes("longDistanceBuilder", roomsToHarvest[i], true);
    let constructionSites = roomToHarvest.find(FIND_CONSTRUCTION_SITES);
    let constructionPointsInTheRoom = constructionSites.length > 0 ? constructionSites.map(item => item.progressTotal - item.progress).reduce((prev, next) => prev + next) : 0;
    let containers = roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER && structure.hits < 100000 });
    let energyToUse = 600;//3 Work - 3 Carry - 3 Move = 600

    if (builders.length >= 1 || roomToSpawnFrom.energyAvailable < energyToUse || (constructionPointsInTheRoom < 5000 && containers.length == 0))
      continue;

    Nexus.spawnCreep(probeSetupLongDistanceBuilder, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

function spawnClaimer(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {

  for (let i = 0; i < roomsToHarvest.length; i++) {
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
    if (!roomToHarvest)//If room not visible don't create any claimers
      continue;
    if (roomConnections.length != 0 && !roomConnections.includes(roomsToHarvest[i]))
      continue;
    let probeSetupClaimer = new ProbeSetup({ ordered: true, pattern: [CLAIM, MOVE], sizeLimit: 2 }, "claimer-" + Game.time, { role: "claimer", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let claimers = Nexus.getProbes("claimer", roomsToHarvest[i], true);
    let energyToUse = 650;//1 Claim - 1 Move = 650
    let claimBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(claimers, CLAIM);
    let controller = getController(roomToHarvest);

    if (claimBodyParts >= 2 || roomToSpawnFrom.energyAvailable < energyToUse || !controller)
      continue;
    if (controller.reservation) {
      if (controller.reservation.ticksToEnd > 3000)
        continue;
    }
    if (controller.owner) {
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
    let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
    if (!roomToHarvest)//If room not visible don't create any soldiers
      continue;
    if (roomConnections.length != 0 && !roomConnections.includes(roomsToHarvest[i]))
      continue;
    let probeSetupSoldier = new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH], pattern: [ATTACK, MOVE], sizeLimit: 3 }, "soldier-" + Game.time, { role: "soldier", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let soldiers = Nexus.getProbes("soldier", roomsToHarvest[i], true);
    let energyToUse = 570;//3 TOUGH - 3 Attack - 6 Move = 570
    let enemyInRoom = getClosestEnemy(roomToHarvest);

    if (soldiers.length >= 1 || roomToSpawnFrom.energyAvailable < energyToUse || enemyInRoom == undefined)
      continue;
    
    Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);
    return true;
  }
  return false;
}

function spawnSoldierForConqueredRoom(roomToSpawnFrom: Room): boolean {
  let cannons = Nexus.getCannons(roomToSpawnFrom);
  if (cannons.length != 0)
    return false;
  let probeSetupSoldier = new ProbeSetup({ ordered: true, pattern: [TOUGH], suffix: [ATTACK, MOVE], sizeLimit: 10 }, "soldier-" + Game.time, { role: "soldier", remote: roomToSpawnFrom.name, homeName: roomToSpawnFrom.name });
  let soldiers = Nexus.getProbes("soldier", roomToSpawnFrom.name, true);
  let energyToUse = 230;//10 TOUGH - 1 Attack - 1 Move = 230
  let enemyInRoom = getClosestEnemy(roomToSpawnFrom);

  if (soldiers.length >= 1 || roomToSpawnFrom.energyAvailable < energyToUse || enemyInRoom == undefined)
    return false;

  Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);
  return true;
}

//MOVE	    50	Moves the creep. Reduces creep fatigue by 2/tick. See movement.
//WORK	    100	Harvests energy from target source. Gathers 2 energy/tick. Constructs a target structure. Builds the designated structure at a construction site, at 5 points/tick, consuming 1 energy/point. See building Costs. Repairs a target structure. Repairs a structure for 20 hits/tick. Consumes 0.1 energy/hit repaired, rounded up to the nearest whole number.
//CARRY	    50	Stores energy. Contains up to 50 energy units. Weighs nothing when empty.
//ATTACK	80	Attacks a target creep/structure. Deals 30 damage/tick. Short-ranged attack (1 tile).
//RANGED_ATTACK	150	Attacks a target creep/structure. Deals 10 damage/tick. Long-ranged attack (1 to 3 tiles).
//HEAL	    250	Heals a target creep. Restores 12 hit points/tick at short range (1 tile) or 4 hits/tick at a distance (up to 3 tiles).
//TOUGH	    10	No effect other than the 100 hit points all body parts add. This provides a cheap way to add hit points to a creep.
//CLAIM	    600
