import { Nexus } from "Nexus";
import { Probe } from "Probe";
import { ProbeSetup } from "ProbeSetup";

export function run(): void {
  let room = Game.rooms["W8N3"];
  let spawn = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })[0]
  let structureSpawn = new StructureSpawn(spawn.id);
  let probeSetupHarvester = new ProbeSetup("harvester", [WORK, CARRY, MOVE], "harvester-" + Game.time, { role: "harvester" });
  let probeSetupUpgrader = new ProbeSetup("upgrader", [WORK, CARRY, MOVE], "upgrader-" + Game.time, { role: "upgrader" });
  if (Nexus.getProbes("harvester", room).length < 4) {
    Nexus.spawnCreep(probeSetupHarvester, structureSpawn);
  } else if (Nexus.getProbes("upgrader", room).length < 2) {
    Nexus.spawnCreep(probeSetupUpgrader, structureSpawn);
  }

  let harvesters = Nexus.getProbes("harvester");
  let upgraders = Nexus.getProbes("upgrader");
  harvesters.forEach(function (harvester) {
    harvesterLogic(harvester);
  });
  upgraders.forEach(function (upgrader) {
    upgraderLogic(upgrader);
  });
}

function harvesterLogic(probe: Probe): void {
  if (_.sum(probe.carry) === probe.carryCapacity) {
    let deposit = getClosestDeposit(probe);
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
    let source = getClosestActiveSource(probe);
    if (source) {
      probe.harvest(source);
    }
  }
}

function getClosestActiveSource(probe: Probe): Source | null {
  let source = probe.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  return source;
}

function getClosestDeposit(probe: Probe): Structure | null {
  let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => (structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity)
      || ((structure.structureType == STRUCTURE_SPAWN ||
      structure.structureType == STRUCTURE_EXTENSION ||
      structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity)
  });
  return deposit;
}

function getController(probe: Probe): StructureController | null {
  let target = probe.pos.findClosestByPath(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) });
  return target instanceof StructureController ? target : null;
}
