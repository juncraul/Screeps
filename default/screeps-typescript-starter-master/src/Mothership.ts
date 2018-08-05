import { Nexus } from "Nexus";
import { Probe } from "Probe";
import { ProbeSetup, bodySetup } from "ProbeSetup";

export function run(): void {
  let room = Game.rooms["W8N3"];
  let spawn = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })[0]
  let energyCapacityRoom = room.energyCapacityAvailable;
  let structureSpawn = new StructureSpawn(spawn.id);
  let probeSetupHarvester = new ProbeSetup("harvester", { ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit:3 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupUpgrader = new ProbeSetup("upgrader", { ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "upgrader-" + Game.time, { role: "upgrader" });
  let probeSetupBuilder = new ProbeSetup("builder", { ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "builder-" + Game.time, { role: "builder" });
  let probeSetupCarrier = new ProbeSetup("carrier", { ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 3 }, "carrier-" + Game.time, { role: "carrier" });
  if (Nexus.getProbes("harvester", room).length < 4) {
    Nexus.spawnCreep(probeSetupHarvester, structureSpawn, energyCapacityRoom);
  } else if (Nexus.getProbes("upgrader", room).length < 2) {
    Nexus.spawnCreep(probeSetupUpgrader, structureSpawn, energyCapacityRoom);
  } else if (Nexus.getProbes("builder", room).length < 2 && getConstructionSitesFromRoom(room).length > 0) {
    Nexus.spawnCreep(probeSetupBuilder, structureSpawn, energyCapacityRoom);
  } else if (Nexus.getProbes("carrier", room).length < 2) {
    Nexus.spawnCreep(probeSetupCarrier, structureSpawn, energyCapacityRoom);
  }

  let harvesters = Nexus.getProbes("harvester");
  let upgraders = Nexus.getProbes("upgrader");
  let builders = Nexus.getProbes("builder");
  let carriers = Nexus.getProbes("carrier");
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
    probe.memory.isUpgradingController = true;
    probe.memory.gathering = false;
  }
  if (_.sum(probe.carry) === 0) {
    probe.memory.isUpgradingController = false;
    probe.memory.gathering = true;
  }

  if (probe.memory.isUpgradingController) {
    let target = getController(probe);
    if (target) {
      probe.upgradeController(target);
    }
  }
  if (probe.memory.gathering) {
    let deposit = getClosestFilledDeposit(probe);
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
    probe.memory.isBuilding = true;
    probe.memory.gathering = false;
  }
  if (_.sum(probe.carry) === 0) {
    probe.memory.isBuilding = false;
    probe.memory.gathering = true;
  }

  if (probe.memory.isBuilding) {
    let target = getClosestConstructionSite(probe);
    if (target) {
      probe.build(target);
    }
  }
  if (probe.memory.gathering) {
    let deposit = getClosestFilledDeposit(probe);
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
    let supply = getStructureToSupply(probe);
    if (supply) {
      probe.transfer(supply, RESOURCE_ENERGY);
    }
  } else {
    let deposit = getClosestFilledDeposit(probe);
    if (deposit) {
      probe.withdraw(deposit, RESOURCE_ENERGY);
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

function getClosestFilledDeposit(probe: Probe//, resource: ResourceConstant = RESOURCE_ENERGY
): Structure | null {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure =>
      ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0)
  })
  return deposit;
}


function getController(probe: Probe): StructureController | null {
  let target = probe.pos.findClosestByPath(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) });
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

function getStructureToSupply(probe: Probe): Structure | null  {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => ((
      structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION ||
      structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity)
  });
  return deposit
}
