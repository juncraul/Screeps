import { Nexus } from "Nexus";
import { Probe } from "Probe";
import { ProbeSetup } from "ProbeSetup";
import { ProbeLogic } from "ProbeLogic";
import { Cannon } from "Cannon";
import { Tasks } from "Tasks";
import { Stargate } from "Stargate";
import { TradeHub } from "TradeHub";
import { GetRoomObjects } from "GetRoomObjects";

export function run(): void {
  let roomsToHarvest = Tasks.getRoomsToHarvest();
  let probeSetupBuilder = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "builder-" + Game.time, { role: "builder" });
  let probeSetupRepairer = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "repairer-" + Game.time, { role: "repairer" });

  let myRooms = Tasks.getmyRoomsWithController();
  myRooms.forEach(function (room) {
    let spawns = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })
    let energyCapacityRoom = room.energyCapacityAvailable;

    spawns.forEach(function (spawn) {
      let structureSpawn = new StructureSpawn(spawn.id);

      if (structureSpawn.spawning)
        return;//This is basically continue, but where are in function iteration

      if (spawnHarvester(room)) {
        console.log(room.name + " Spawning Harvester");
      }
      else if (spawnCarrier(room)) {
        console.log(room.name + " Spawning Carrier");
      }
      else if (spawnSoldierForConqueredRoom(room)) {
        console.log(room.name + " Spawning soldier for this room.");
      }
      else if (spawnUpgrader(room)) {
        console.log(room.name + " Spawning Upgrader");
      }
      else if (Nexus.getProbes("builder", room.name).length < 1 && GetRoomObjects.getConstructionSitesFromRoom(room).length > 0) {
        Nexus.spawnCreep(probeSetupBuilder, structureSpawn, energyCapacityRoom);
      }
      else if (Nexus.getProbes("repairer", room.name).length < 1 && GetRoomObjects.getClosestStructureToRepair(structureSpawn.pos, 0.7) != null) {
        Nexus.spawnCreep(probeSetupRepairer, structureSpawn, energyCapacityRoom);
      }
      else if (spawnSoldier(room, roomsToHarvest)) {
        console.log(room.name + " Spawning soldier.");
      }
      else if (spawnLongDistanceBuilder(room, roomsToHarvest)) {
        console.log(room.name + " Spawning long distance builder.");
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
    })

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
        ProbeLogic.harvesterLogic(probe);
        break;
      case "upgrader":
        ProbeLogic.upgraderLogic(probe);
        break;
      case "builder":
        ProbeLogic.builderLogic(probe);
        break;
      case "carrier":
        ProbeLogic.carrierLogic(probe);
        break;
      case "repairer":
        ProbeLogic.repairerLogic(probe);
        break;
      case "longDistanceHarvester":
        ProbeLogic.longDistanceHarvesterLogic(probe);
        break;
      case "longDistanceCarrier":
        ProbeLogic.longDistanceCarrierLogic(probe);
        break;
      case "claimer":
        ProbeLogic.claimerLogic(probe);
        break;
      case "soldier":
        ProbeLogic.soldierLogic(probe);
        break;
      case "longDistanceBuilder":
        ProbeLogic.longDistanceBuilderLogic(probe);
        break;
    }
  });
}

function cannonLogic(cannon: Cannon): void {
  let enemy = GetRoomObjects.getClosestEnemy(cannon);
  if (enemy) {
    cannon.attack(enemy);
  }
  else {
    let damagedUnit = GetRoomObjects.getClosestDamagedUnit(cannon);
    if (damagedUnit) {
      cannon.heal(damagedUnit);
    }
    else if (cannon.energy > cannon.energyCapacity * 0.5) {
      let structure = GetRoomObjects.getClosestStructureToRepair(cannon.pos, 0.7);//TODO: Use closest by range
      if (structure) {
        cannon.repair(structure);
      }
      else {
        let structure = GetRoomObjects.getClosestStructureToRepair(cannon.pos, 1);
        if (structure) {
          cannon.repair(structure);
        }
      }
    }
  }
}

function getMaximumPossibleNumberOfHarvesters(room: Room): number {
  let sources = room.find(FIND_SOURCES);
  let maxHarvesters = 0;
  sources.forEach(function (source) {
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        if (room.lookForAt(LOOK_TERRAIN, source.pos.x + i, source.pos.y + j)[0] != "wall")
          maxHarvesters++;
  })
  return maxHarvesters;
}

function getMaximumPossibleNumberOfClaimers(room: Room): number {
  let controller = GetRoomObjects.getController(room);
  if (controller == null)
    return 0;
  let maxClaimer = 0;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      if (room.lookForAt(LOOK_TERRAIN, controller.pos.x + i, controller.pos.y + j)[0] != "wall")
        maxClaimer++;
  return maxClaimer;
}

function spawnHarvester(roomToSpawnFrom: Room): boolean {
  let probeSetupHarvester: ProbeSetup;
  let probeSetupHarvesterOne = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 1 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupHarvesterTwo = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE, MOVE], sizeLimit: 3 }, "harvester-" + Game.time, { role: "harvester" });
  let probeSetupHarvesterElite = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [MOVE, MOVE], sizeLimit: 5 }, "harvester-" + Game.time, { role: "harvester" });
  let harvesters = Nexus.getProbes("harvester", roomToSpawnFrom.name);
  let carriers = Nexus.getProbes("carrier", roomToSpawnFrom.name);
  let longDistanceHarvesters = Nexus.getProbes("longDistanceHarvester", roomToSpawnFrom.name, true);
  let harvestersAboutToDie = _.filter(harvesters, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
  let mineral = GetRoomObjects.getAvailableMineral(roomToSpawnFrom);
  let sources = roomToSpawnFrom.find(FIND_SOURCES).length + (mineral ? 1 : 0);
  let controller = GetRoomObjects.getController(roomToSpawnFrom);
  let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(harvesters, WORK) + Probe.getActiveBodyPartsFromArrayOfProbes(longDistanceHarvesters, WORK);
  let energyToUse: number;
  let bodyPartsPerSourceRequired = carriers.length <= 1 ? 2 : 5;//Set Harvester at full capacity only if there are enough carriers to sustain them
  //let levelBlueprintToBuild: number;

  if (harvesters.length >= getMaximumPossibleNumberOfHarvesters(roomToSpawnFrom))
    return false;

  if (!controller) {
    return false;
  }
  else {
    //if (Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0) {
    //  levelBlueprintToBuild = controller.level//No extenstions to construct, set blueprint as current controller level.
    //}
    //else {
    //  levelBlueprintToBuild  = controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
    //}
  }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
  switch (controller.level) {
    case 1://300 Energy avilable
      energyToUse = 200;//1 Work; 1 Carry; 1 Move
      probeSetupHarvester = probeSetupHarvesterOne;
      break;
    case 2://550 Energy available
      energyToUse = 450;//3 Work; 1 Carry; 2 Move
      probeSetupHarvester = probeSetupHarvesterTwo;
      break;
    case 3://800 Energy available
    default://1300 Energy at least
      energyToUse = 600;//5 Work; 2 Move //This rely that it stands on top of container
      probeSetupHarvester = probeSetupHarvesterElite;
      //Not used perhaps will need it
      //energyToUse = 750//6 Work; 1 Carry; 2 Move
      //probeSetupHarvester = probeSetupHarvesterElite;
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

  if (workBodyParts >= sources * bodyPartsPerSourceRequired) {
    if (harvestersAboutToDie.length == 0 || (harvestersAboutToDie.length > 0 && workBodyParts >= (sources + 1) * bodyPartsPerSourceRequired)) {
      return false;
    }
  }

  if (roomToSpawnFrom.energyAvailable < energyToUse) {
    return true;//Show our intend to spawn this probe when energy will be available
  }
  Nexus.spawnCreep(probeSetupHarvester, roomToSpawnFrom, energyToUse);
  return true;
}

function spawnCarrier(roomToSpawnFrom: Room): boolean {
  let probeSetupCarrier: ProbeSetup;
  let probeSetupCarrierOne = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 1 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupCarrierTwo = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 2 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupCarrierThree = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 5 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupCarrierFour = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 10 }, "carrier-" + Game.time, { role: "carrier" });
  let probeSetupCarrierElite = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 17 }, "carrier-" + Game.time, { role: "carrier" });
  let carriers = Nexus.getProbes("carrier", roomToSpawnFrom.name);
  let carriersAboutToDie = _.filter(carriers, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
  let controller = GetRoomObjects.getController(roomToSpawnFrom);
  let energyToUse: number;
  let levelBlueprintToBuild: number;
  let deposit = roomToSpawnFrom.find(FIND_STRUCTURES, {filter: structure =>structure.structureType == STRUCTURE_CONTAINER});

  if (deposit.length == 0) { //Don't build any carrier if we don't have a container anyway
    return false;
  }


  if (!controller) {
    return false;
  }
  else {
    levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
      ? controller.level//No extenstions to construct, set blueprint as current controller level.
      : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
  }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
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
    case 4://1300 Energy available
      energyToUse = 1000//10 Carry; 10 Move
      probeSetupCarrier = probeSetupCarrierFour;
      break;
    default://1800 Energy at least
      energyToUse = 1700//17 Carry; 17 Move
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
  
  if (carriers.length >= 2) {
    if (carriersAboutToDie.length == 0 || (carriersAboutToDie.length > 0 && carriers.length >= 3)) {
      return false;
    }
  }

  if (roomToSpawnFrom.energyAvailable < energyToUse) {
    return true;//Show our intend to spawn this probe when energy will be available
  }
  Nexus.spawnCreep(probeSetupCarrier, roomToSpawnFrom, energyToUse);
  return true;
}

function spawnUpgrader(roomToSpawnFrom: Room): boolean {
  let probeSetupUpgrader: ProbeSetup;
  let probeSetupUpgraderOne = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 1 }, "upgrader-" + Game.time, { role: "upgrader" });
  let probeSetupUpgraderTwo = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE, MOVE], sizeLimit: 3 }, "upgrader-" + Game.time, { role: "upgrader" });
  let probeSetupUpgraderThree = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE, MOVE], sizeLimit: 5 }, "upgrader-" + Game.time, { role: "upgrader" });
  let probeSetupUpgraderElite = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE, MOVE], sizeLimit: 6 }, "upgrader-" + Game.time, { role: "upgrader" });
  let upgraders = Nexus.getProbes("upgrader", roomToSpawnFrom.name);
  let upgradersAboutToDie = _.filter(upgraders, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
  let controller = GetRoomObjects.getController(roomToSpawnFrom);
  let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(upgraders, WORK);
  let energyToUse: number;
  //let bodyPartsPerSourceRequired = carriers.length <= 1 ? 2 : 6;//Set Harvester at full capacity only if there are enough carriers to sustain them
  let levelBlueprintToBuild: number;

  if (!controller) {
    return false;
  }
  else {
    levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
      ? controller.level//No extenstions to construct, set blueprint as current controller level.
      : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
  }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
  switch (levelBlueprintToBuild) {
    case 1://300 Energy avilable
      energyToUse = 200;//1 Work; 1 Carry; 1 Move
      probeSetupUpgrader = probeSetupUpgraderOne;
      break;
    case 2://550 Energy available
      energyToUse = 450;//3 Work; 1 Carry; 2 Move
      probeSetupUpgrader = probeSetupUpgraderTwo;
      break;
    case 3://800 Energy available
      energyToUse = 650;//5 Work; 1 Carry; 2 Move
      probeSetupUpgrader = probeSetupUpgraderThree;
      break;
    default://1300 Energy at least
      energyToUse = 750//6 Work; 1 Carry; 2 Move
      probeSetupUpgrader = probeSetupUpgraderElite;
      break;
  }
  ////In case when not all extensions got a chance to be built.
  energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;


  ////Emergency situation with no carriers and we don't have energy to build the latest harvester. Quickly build 2 low harvesters.
  //if (carriers.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse && harvesters.length < 2) {
  //  energyToUse = 200;//1 Work; 1 Carry; 1 Move
  //  probeSetupHarvester = probeSetupHarvesterOne;
  //}
  //else { //Emergency situation with no harvesters and we don't have energy to build the latest harvester. Quickly build 1 low harvester.
  //  if (harvesters.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse) {
  //    energyToUse = 200;//1 Work; 1 Carry; 1 Move
  //    probeSetupHarvester = probeSetupHarvesterOne;
  //  }
  //  else { //Emergency situation with one weak harvesters and we don't have energy to build the latest harvester. Quickly build 1 medium harvester.
  //    if (workBodyParts < 3 && roomToSpawnFrom.energyAvailable < energyToUse) {
  //      energyToUse = 400;//3 Work; 1 Carry; 1 Move
  //      probeSetupHarvester = probeSetupHarvesterTwo;
  //    }
  //  }
  //}

  if (upgradersAboutToDie.length == 0 && workBodyParts >= 5) {
    return false;
  }
  else if (upgradersAboutToDie.length > 0 && workBodyParts >= 10) {
    return false;
  }

  if (roomToSpawnFrom.energyAvailable < energyToUse) {
    return true;//Show our intend to spawn this probe when energy will be available
  }
  Nexus.spawnCreep(probeSetupUpgrader, roomToSpawnFrom, energyToUse);
  return true;
}

function spawnLongDistanceHarvester(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {
  for (let i = 0; i < roomsToHarvest.length; i++) {
    let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
    if (roomConnections.length != 0 && !roomConnections.includes(roomsToHarvest[i]))
      continue;
    let probeSetupLongDistanceHarvester = new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [MOVE, MOVE, MOVE], proportionalPrefixSuffix: false, sizeLimit: 5 }, "longDistanceHarvester-" + Game.time, { role: "longDistanceHarvester", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let harvesters = Nexus.getProbes("longDistanceHarvester", roomsToHarvest[i], true);
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let sources = roomToHarvest != null ? roomToHarvest.find(FIND_SOURCES).length : 1;
    let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(harvesters, WORK);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let remoteController = roomToHarvest != null ? GetRoomObjects.getController(roomToHarvest) : null;
    let energyToUse: number;
    let levelBlueprintToBuild: number;
    
    if (!controller) {
      return false;
    }
    else {
      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level.
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
    }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
    switch (levelBlueprintToBuild) {
      case 1:
      case 2:
        return false;
      case 3://800 Energy available
      default://1300 Energy at least
        energyToUse = 650;//5 Work; 3 Move //This reply that it stands on top of container
        break;
    }

    if (workBodyParts >= sources * 5  || roomToSpawnFrom.energyAvailable < energyToUse)
      continue;

    if (Tasks.getRoomsToClaim().includes(roomToHarvest.name) && remoteController && remoteController.level >= 3) {
      continue; //Room is big now to handle its own harvesters
    }

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
    let probeSetupLongDistanceCarrier = new ProbeSetup(bodySetup, "longDistanceCarrier-" + Game.time, { role: "longDistanceCarrier", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name, useCashedPath: true });
    let carriers = Nexus.getProbes("longDistanceCarrier", roomsToHarvest[i], true);
    let roomToHarvest = Game.rooms[roomsToHarvest[i]];
    let containers = roomToHarvest != null ? roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER }).length : 0;
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let energyToUse: number;
    let levelBlueprintToBuild: number;
    
    if (!controller) {
      return false;
    }
    else {
      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level.
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
    }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
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

    if (builders.length >= (Tasks.getRoomsToClaim().includes(roomToHarvest.name) ? 3 : 1) || //If we need to claim the room, send a lot of builders to build the base.
      roomToSpawnFrom.energyAvailable < energyToUse ||
      (constructionPointsInTheRoom < 5000 && containers.length == 0))
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
    let probeSetupClaimer = new ProbeSetup({ ordered: true, pattern: [CLAIM, MOVE], sizeLimit: 4 }, "claimer-" + Game.time, { role: "claimer", remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
    let claimers = Nexus.getProbes("claimer", roomsToHarvest[i], true);
    let energyToUse = 650;//1 Claim - 1 Move = 650
    let claimBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(claimers, CLAIM);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let remoteController = GetRoomObjects.getController(roomToHarvest);
    let maxClaimer = getMaximumPossibleNumberOfClaimers(roomToHarvest);
    let levelBlueprintToBuild: number;

    if (!controller) {
      return false;
    }
    else {
      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level.
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
    }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
    switch (levelBlueprintToBuild) {
      case 1:
      case 2:
        return false;
      case 3://800 Energy available
        energyToUse = 650;//1 Claim - 1 Move
        break;
      case 4://1300 Energy available
      default://1800 Energy at least
        energyToUse = 1300;//2 Claim - 2 Move
        break;
    }

    if (claimBodyParts >= 2 || roomToSpawnFrom.energyAvailable < energyToUse || !remoteController || claimers.length >= maxClaimer )
      continue;
    if (remoteController.reservation) {
      if (remoteController.reservation.ticksToEnd > 3000)
        continue;
    }
    if (remoteController.owner) {
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
    let enemyInRoom = GetRoomObjects.getClosestEnemy(roomToHarvest);

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
  let enemyInRoom = GetRoomObjects.getClosestEnemy(roomToSpawnFrom);

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
