import { Nexus } from "Nexus";
import { Probe } from "Probe";
import { ProbeSetup } from "ProbeSetup";
import { ProbeLogic } from "ProbeLogic";
import { Tasks } from "Tasks";
import { Stargate } from "Stargate";
import { TradeHub } from "TradeHub";
import { GetRoomObjects } from "GetRoomObjects";
import { profile } from "./Profiler";
import { Laboratory } from "Laboratory";
import { CreepRole, FlagName, SPAWN_RESULT_CODES } from "Constants";
import { Helper } from "Helper";
import { Debugging, DebuggingType } from "Debugging";
import { ProbeHarvester } from "Probes/ProbeHarvester";
import { ProbeCarrier } from "Probes/ProbeCarrier";
import { ProbeUpgrader } from "Probes/ProbeUpgrader";
import { ProbeLongDistanceHarvester } from "Probes/ProbeLongDistanceHarvester";


@profile
export class Mothership {
  static laboratories: { [roomName: string]: Laboratory };
  static tradeHubs: { [roomName: string]: TradeHub };
  static requestRenewProbeId: { [roomName: string]: string };
  static renewalSpawn: { [roomName: string]: string };
  

  public static initialize() {
    Mothership.laboratories = {};
    Mothership.tradeHubs = {};
    Mothership.requestRenewProbeId = {};
    Mothership.renewalSpawn = {};
    //Mothership.probesAtSites = {};
    //Mothership.sites = [];
    let myRooms = Tasks.getmyRoomsWithController();
    myRooms.forEach(function (room) {
      let labs = GetRoomObjects.getLabs(room);
      let terminal = GetRoomObjects.getTerminalFromRoom(room);
      let storage = GetRoomObjects.getStorage(room);
      let spawn = GetRoomObjects.getSpawn(room);
      let probeIdForRenawal = Helper.getCashedMemory("RequestRenew-" + room.name, null);
      if (terminal && storage) {
        Mothership.tradeHubs[room.name] = new TradeHub(terminal, storage);
      }
      if (labs.length >= 3 && Mothership.tradeHubs[room.name]) {
        Mothership.laboratories[room.name] = new Laboratory(labs, Mothership.tradeHubs[room.name]);
      }
      if (spawn) {
        Mothership.renewalSpawn[room.name] = spawn.id;
      }
      if (probeIdForRenawal) {
        Mothership.requestRenewProbeId[room.name] = probeIdForRenawal;
      }
    });
  }
  
  public static work() {
    let roomsToHarvest = Tasks.getRoomsToHarvest();

    let myRooms = Tasks.getmyRoomsWithController();
    myRooms.forEach(function (room) {
      let probeSetupBuilder = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "builder-" + Game.time, { role: CreepRole.BUILDER, homeName: room.name });
      let probeSetupRepairer = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "repairer-" + Game.time, { role: CreepRole.REPAIRER, homeName: room.name });
      let spawns = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })
      let energyCapacityRoom = room.energyCapacityAvailable;

      spawns.forEach(function (spawn) {
        let structureSpawn = new StructureSpawn(spawn.id);

        if (Mothership.requestRenewProbeId[room.name]) {
          let creep = Game.getObjectById(Mothership.requestRenewProbeId[room.name])
          if (creep instanceof Creep) {
            structureSpawn.renewCreep(creep);
            if (1450 < creep.ticksToLive!) {
              delete Mothership.requestRenewProbeId[room.name];
              Helper.setCashedMemory("RequestRenew-" + room.name, null);
            }
          }
          return;
        }

        if (structureSpawn.spawning || Game.time % 5 < 4)//Only try to spawn every 5th tick
          return;//This is basically continue, but where are in function iteration

        if (Mothership.spawnCreep(ProbeHarvester.spawnHarvester, room, "Harvester")) {

        }
        else if (Mothership.spawnCreep(ProbeCarrier.spawnCarrier, room, "Carrier")) {

        }
        else if (Mothership.spawnDecoy(room)) {
          console.log(room.name + " Spawning Decoy");
        }
        else if (Mothership.spawnSoldierForConqueredRoom(room)) {
          console.log(room.name + " Spawning soldier for this room.");
        }
        else if (Mothership.spawnArmyElite(room)) {
          console.log(room.name + " Spawning Army Elite")
        }
        else if (Mothership.spawnArmyAttacker(room) && Game.time == 1) {
          console.log(room.name + " Spawning Army Attacker")
        }
        else if (Mothership.spawnArmyHealer(room)) {
          console.log(room.name + " Spawning Army Healer")
        }
        else if (Mothership.spawnCreep(ProbeUpgrader.spawnUpgrader, room, "Upgrader")) {

        }
        else if (Nexus.getProbes(CreepRole.BUILDER, room.name).length < 1 && GetRoomObjects.getConstructionSitesFromRoom(room).length > 0) {
          Nexus.spawnCreep(probeSetupBuilder, structureSpawn, energyCapacityRoom);
        }
        else if (Nexus.getProbes(CreepRole.REPAIRER, room.name).length < 1 && GetRoomObjects.getClosestStructureToRepairByPath(structureSpawn.pos, 0.7) != null) {
          Nexus.spawnCreep(probeSetupRepairer, structureSpawn, energyCapacityRoom);
        }
        else if (Mothership.spawnSoldier(room, roomsToHarvest)) {
          console.log(room.name + " Spawning soldier.");
        }
        else if (Mothership.spawnLongDistanceBuilder(room, roomsToHarvest)) {
          console.log(room.name + " Spawning long distance builder.");
        }
        else if (Mothership.spawnCreep(ProbeLongDistanceHarvester.spawnLongDistanceHarvester, room, "LongDistanceHarvester")) {

        }
        else if (Mothership.spawnLongDistanceCarrier(room, roomsToHarvest)) {
          console.log(room.name + " Spawning long distance carrier.");
        }
        else if (Mothership.spawnClaimer(room, roomsToHarvest)) {
          console.log(room.name + " Spawning claimer.");
        }
        else if (Mothership.spawnMerchant(room)) {
          console.log(room.name + " Spawning merchant.");
        }
        else if (Mothership.spawnKeeperSlayer(room)) {
          console.log(room.name + " Spawning keeper slayer.");
        }

      })

      let allCannons = Nexus.getCannons(room);
      allCannons.forEach(function (cannon) {
        cannon.cannonLogic();
      })

      Stargate.moveEnergyAround(room);

      if (Game.time % 20 == 0 && Mothership.tradeHubs[room.name]) {
        Mothership.tradeHubs[room.name].setUpBuyOrders();
        Mothership.tradeHubs[room.name].setUpSellOrders();
        Mothership.tradeHubs[room.name].buyFromMarket();
        Mothership.tradeHubs[room.name].sellToMarket();
      }
      if (Mothership.laboratories[room.name]) {
        Mothership.laboratories[room.name].runReaction();
      }
    })

    let allProbes = Nexus.getProbes();
    allProbes.forEach(function (probe) {
      if (probe.spawning) {
        return;
      }
      switch (probe.memory.role) {
        case CreepRole.BUILDER:
          ProbeLogic.builderLogic(probe);
          break;
        case CreepRole.CARRIER:
          ProbeLogic.carrierLogic(probe);
          break;
        case CreepRole.REPAIRER:
          ProbeLogic.repairerLogic(probe);
          break;
        case CreepRole.LONG_DISTANCE_HARVESTER:
          ProbeLogic.longDistanceHarvesterLogic(probe);
          break;
        case CreepRole.LONG_DISTANCE_CARRIER:
          ProbeLogic.longDistanceCarrierLogic(probe);
          break;
        case CreepRole.CLAIMER:
          ProbeLogic.claimerLogic(probe);
          break;
        case CreepRole.SOLDIER:
          ProbeLogic.soldierLogic(probe);
          break;
        case CreepRole.LONG_DISTANCE_BUILDER:
          ProbeLogic.longDistanceBuilderLogic(probe);
          break;
        case CreepRole.ARMY_ATTCKER:
          ProbeLogic.armyAttackerLogic(probe);
          break;
        case CreepRole.ARMY_HEALER:
          ProbeLogic.armyHealerLogic(probe);
          break;
        case CreepRole.DECOY:
          ProbeLogic.decoyLogic(probe);
          break;
        case CreepRole.MERCHANT:
          if (Mothership.tradeHubs[probe.room.name] && Mothership.laboratories[probe.room.name]) {
            ProbeLogic.merchantLogic(probe, Mothership.tradeHubs[probe.room.name], Mothership.laboratories[probe.room.name]);
          }
          break;
        case CreepRole.KEEPER_SLAYER:
          ProbeLogic.keeperSlayerLogic(probe);
          break;
      }
    });

    for (let i in Mastermind.sites) {
      Mastermind.sites[i].run();
    }
  }

  private static spawnCreep(spawnFunction: Function, room: Room, name: string): boolean {
    let spawnResult = spawnFunction(room);
    if (spawnResult == SPAWN_RESULT_CODES.OK) {
      console.log(room.name + ` Spawning ${name}`);
      return true;
    } else {
      Debugging.log(`Not spawning ${name} error: ${spawnResult}`, DebuggingType.SPAWNING)
      return false;
    }
  }

  private static getMaximumPossibleNumberOfClaimers(room: Room): number {
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

  private static spawnLongDistanceCarrier(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {
    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let bodySetup = { ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 5 };
      let bodySetupMedium = { ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 8 };
      let probeSetupLongDistanceCarrier = new ProbeSetup(bodySetup, "longDistanceCarrier-" + roomsToHarvest[i] + "-" + Game.time, { role: CreepRole.LONG_DISTANCE_CARRIER, remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name, useCashedPath: true });
      let carriers = Nexus.getProbes(CreepRole.LONG_DISTANCE_CARRIER, roomsToHarvest[i], true);
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let containers = roomToHarvest != null ? roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER }).length : 0;
      let controller = GetRoomObjects.getController(roomToSpawnFrom);
      let roomNeedsClaimed = roomToHarvest != null ? Tasks.getRoomsToClaim().includes(roomToHarvest.name) : false;
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

      if (carriers.length >= containers || roomToSpawnFrom.energyAvailable < energyToUse || roomNeedsClaimed)
        continue;

      Nexus.spawnCreep(probeSetupLongDistanceCarrier, roomToSpawnFrom, energyToUse);
      return true;
    }
    return false;
  }

  private static spawnLongDistanceBuilder(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {
    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomToHarvest)
        continue;
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let probeSetupLongDistanceBuilder = new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 5 }, "longDistanceBuilder-" + roomsToHarvest[i] + "-" + Game.time, { role: CreepRole.LONG_DISTANCE_BUILDER, remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
      let builders = Nexus.getProbes(CreepRole.LONG_DISTANCE_BUILDER, roomsToHarvest[i], true);
      let constructionSites = roomToHarvest.find(FIND_CONSTRUCTION_SITES);
      let constructionPointsInTheRoom = constructionSites.length > 0 ? constructionSites.map(item => item.progressTotal - item.progress).reduce((prev, next) => prev + next) : 0;
      let containers = roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER && structure.hits < 100000 });
      let remoteController = roomToHarvest != null ? GetRoomObjects.getController(roomToHarvest) : null;
      let roomNeedsClaimed = roomToHarvest != null ? Tasks.getRoomsToClaim().includes(roomToHarvest.name) : false;
      let spawnerInRemote = roomToHarvest != null ? GetRoomObjects.getSpawn(roomToHarvest) : null;
      let energyToUse = 600;//3 Work - 3 Carry - 3 Move = 600

      if (builders.length >= (roomNeedsClaimed ? 3 : 1) || //If we need to claim the room, send a lot of builders to build the base.
        roomToSpawnFrom.energyAvailable < energyToUse ||
        (constructionPointsInTheRoom < 5000 && containers.length == 0))
        continue;

      if (spawnerInRemote) {
        if (roomNeedsClaimed && remoteController && remoteController.level >= 2 && builders.length >= 1) {
          continue; //Room is quite big now send only one builder
        } else if (roomNeedsClaimed && remoteController && remoteController.level >= 3) {
          continue; //Room is big now to handle its own builders
        }
      }
      Nexus.spawnCreep(probeSetupLongDistanceBuilder, roomToSpawnFrom, energyToUse);
      return true;
    }
    return false;
  }

  private static spawnClaimer(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {

    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomToHarvest)//If room not visible don't create any claimers
        continue;
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let probeSetupClaimer = new ProbeSetup({ ordered: true, pattern: [CLAIM, MOVE], sizeLimit: 4 }, "claimer-" + roomsToHarvest[i] + "-" + Game.time, { role: CreepRole.CLAIMER, remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
      let claimers = Nexus.getProbes(CreepRole.CLAIMER, roomsToHarvest[i], true);
      let energyToUse = 650;//1 Claim - 1 Move = 650
      let claimBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(claimers, CLAIM);
      let controller = GetRoomObjects.getController(roomToSpawnFrom);
      let remoteController = GetRoomObjects.getController(roomToHarvest);
      let maxClaimer = Mothership.getMaximumPossibleNumberOfClaimers(roomToHarvest);
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

      if (claimBodyParts >= 2 || roomToSpawnFrom.energyAvailable < energyToUse || !remoteController || claimers.length >= maxClaimer)
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

  private static spawnSoldier(roomToSpawnFrom: Room, roomsToHarvest: string[]): boolean {

    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomToHarvest)//If room not visible don't create any soldiers
        continue;
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let probeSetupSoldier = new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH], pattern: [ATTACK, MOVE], sizeLimit: 3 }, "soldier-" + roomsToHarvest[i] + "-" + Game.time, { role: CreepRole.SOLDIER, remote: roomsToHarvest[i], homeName: roomToSpawnFrom.name });
      let soldiers = Nexus.getProbes(CreepRole.SOLDIER, roomsToHarvest[i], true);
      let energyToUse = 570;//3 TOUGH - 3 Attack - 6 Move = 570
      let enemyInRoom = GetRoomObjects.getEnemy(roomToHarvest);

      if (soldiers.length >= 1 || roomToSpawnFrom.energyAvailable < energyToUse || enemyInRoom == undefined)
        continue;

      Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);
      return true;
    }
    return false;
  }

  private static spawnArmyAttacker(roomToSpawnFrom: Room): boolean {
    let warFlag = Game.flags[FlagName.WAR];
    if (!warFlag || (warFlag.secondaryColor != COLOR_RED && warFlag.secondaryColor != COLOR_PURPLE))//RED for full build, PURPLE for limited build
      return false;
    let armyAttacker = Nexus.getProbes(CreepRole.ARMY_ATTCKER);
    let armyHealer = Nexus.getProbes(CreepRole.ARMY_HEALER);
    if (warFlag.secondaryColor == COLOR_PURPLE && armyAttacker.length >= 2)
      return false;
    if (armyAttacker.length * 2 > armyHealer.length)
      return false;
    let probeSetupSoldier = new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH], pattern: [RANGED_ATTACK, MOVE], suffix: [MOVE, MOVE], sizeLimit: 3 }, "soldier-" + Game.time, { role: CreepRole.ARMY_ATTCKER, homeName: roomToSpawnFrom.name });
    let energyToUse = 1150;//3 TOUGH - 5 RANGED_ATTACK - 5 Move = 1150

    Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);

    return false;
  }

  private static spawnArmyElite(roomToSpawnFrom: Room): boolean {
    let warFlag = Game.flags[FlagName.WAR];
    if (!warFlag || (warFlag.secondaryColor != COLOR_RED && warFlag.secondaryColor != COLOR_PURPLE))//RED for full build, PURPLE for limited build
      return false;
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let armyAttacker = Nexus.getProbes(CreepRole.ARMY_ATTCKER);
    let armyHealer = Nexus.getProbes(CreepRole.ARMY_HEALER);
    if (warFlag.secondaryColor == COLOR_PURPLE && armyAttacker.length >= 2)
      return false;
    if ((controller && controller.level < 4) || !controller) {
      return false;
    }
    if (armyAttacker.length > armyHealer.length * 2)
      return false;
    let probeSetupSoldier = new ProbeSetup({ ordered: true, prefix: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], pattern: [ATTACK], suffix: [RANGED_ATTACK], sizeLimit: 8 }, "soldier-" + Game.time, { role: CreepRole.ARMY_ATTCKER, homeName: roomToSpawnFrom.name });
    let probeSetupSoldierElite = new ProbeSetup({ ordered: true, prefix: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], pattern: [ATTACK], suffix: [RANGED_ATTACK], sizeLimit: 10 }, "soldier-" + Game.time, { role: CreepRole.ARMY_ATTCKER, homeName: roomToSpawnFrom.name });
    let energyToUse;
    switch (controller.level) {
      case 1:
      case 2:
      case 3:
        return false;
      case 4://1300 Energy available
        energyToUse = 1240;//9 MOVE - 8 ATTACK - 1 RANGED_ATTACK = 1240
        break;
      case 5://1800 Energy available
      default:
        energyToUse = 1500;//11 MOVE - 10 ATTACK - 1 RANGED_ATTACK = 1500
        probeSetupSoldier = probeSetupSoldierElite
        break;
    }

    Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);

    return true;
  }

  private static spawnArmyHealer(roomToSpawnFrom: Room): boolean {
    let warFlag = Game.flags[FlagName.WAR];
    if (!warFlag || (warFlag.secondaryColor != COLOR_RED && warFlag.secondaryColor != COLOR_PURPLE))//RED for full build, PURPLE for limited build
      return false;
    let armyHealer = Nexus.getProbes(CreepRole.ARMY_HEALER);
    if (warFlag.secondaryColor == COLOR_PURPLE && armyHealer.length >= 1)
      return false;
    let probeSetupHealer = new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH], pattern: [HEAL, MOVE], suffix: [MOVE, MOVE], sizeLimit: 2 }, "soldier-" + Game.time, { role: CreepRole.ARMY_HEALER, homeName: roomToSpawnFrom.name });
    let probeSetupHealerFour = new ProbeSetup({ ordered: true, pattern: [MOVE, HEAL], sizeLimit: 5 }, "soldier-" + Game.time, { role: CreepRole.ARMY_HEALER, homeName: roomToSpawnFrom.name });
    let probeSetupHealerElite = new ProbeSetup({ ordered: true, pattern: [MOVE, HEAL], sizeLimit: 6 }, "soldier-" + Game.time, { role: CreepRole.ARMY_HEALER, homeName: roomToSpawnFrom.name });
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    if (!controller)
      return false;
    let energyToUse;
    switch (controller.level) {
      case 1:
      case 2:
        return false;
      case 3://800 Energy available
        energyToUse = 750;//2 TOUGH - 2 HEAL - 2 Move = 750
        break;
      case 4://1300 Energy available
        energyToUse = 1200;//4 MOVE - 4 HEAL = 1200
        probeSetupHealer = probeSetupHealerFour
        break;
      case 5://1800 Energy available
      default:
        energyToUse = 1800;//6 MOVE - 6 HEAL = 1800
        probeSetupHealer = probeSetupHealerElite
        break;
    }

    Nexus.spawnCreep(probeSetupHealer, roomToSpawnFrom, energyToUse);

    return true;
  }

  private static spawnSoldierForConqueredRoom(roomToSpawnFrom: Room): boolean {
    let cannons = Nexus.getCannons(roomToSpawnFrom);
    if (cannons.length != 0)
      return false;
    let probeSetupSoldier = new ProbeSetup({ ordered: true, pattern: [TOUGH], suffix: [ATTACK, MOVE], sizeLimit: 10 }, "soldier-" + Game.time, { role: CreepRole.SOLDIER, remote: roomToSpawnFrom.name, homeName: roomToSpawnFrom.name });
    let soldiers = Nexus.getProbes(CreepRole.SOLDIER, roomToSpawnFrom.name, true);
    let energyToUse = 230;//10 TOUGH - 1 Attack - 1 Move = 230
    let enemyInRoom = GetRoomObjects.getEnemy(roomToSpawnFrom);

    if (soldiers.length >= 1 || roomToSpawnFrom.energyAvailable < energyToUse || enemyInRoom == undefined)
      return false;

    Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);
    return true;
  }


  private static spawnDecoy(roomToSpawnFrom: Room): boolean {
    let decoy = Game.flags[FlagName.DECOY];
    if (!decoy)
      return false;
    let decoySpawner = Game.flags[FlagName.DECOY_SPAWNER];
    if (!decoySpawner || decoySpawner.room != roomToSpawnFrom || decoy.secondaryColor != COLOR_RED)
      return false;
    let probeDecoy = new ProbeSetup({ ordered: true, pattern: [MOVE], sizeLimit: 1 }, "cupidon-" + Game.time, { role: CreepRole.DECOY, remote: roomToSpawnFrom.name, homeName: roomToSpawnFrom.name });
    let energyToUse = 50;//1 MOVE = 50

    Nexus.spawnCreep(probeDecoy, roomToSpawnFrom, energyToUse);
    return true;
  }

  private static spawnMerchant(roomToSpawnFrom: Room): boolean {
    let probeSetupMerchant: ProbeSetup;
    let probeSetupMerchantSix = new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 8 }, "merchant-" + Game.time, { role: CreepRole.MERCHANT, homeName: roomToSpawnFrom.name });
    let merchants = Nexus.getProbes(CreepRole.MERCHANT, roomToSpawnFrom.name);
    let merchantsAboutToDie = _.filter(merchants, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let energyToUse: number;
    let terminal = roomToSpawnFrom.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_TERMINAL });

    if (!controller || !terminal) {
      return false;
    }
    switch (controller.level) {
      case 1://300 Energy avilable
      case 2://550 Energy available
      case 3://800 Energy available
      case 4://1300 Energy available
      case 5://1800 Energy available
        return false;
      case 6://2300 Energy avilable
      default://5300 Energy at least
        energyToUse = 800//8 Carry; 8 Move
        probeSetupMerchant = probeSetupMerchantSix;
        break;
    }
    //In case when not all extensions got a chance to be built.
    energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;

    if ((merchantsAboutToDie.length == 0 && merchants.length >= 1 ) || (merchantsAboutToDie.length > 0 && merchants.length >= 2)) {
      return false;
    }

    if (roomToSpawnFrom.energyAvailable < energyToUse) {
      return true;//Show our intend to spawn this probe when energy will be available
    }
    Nexus.spawnCreep(probeSetupMerchant, roomToSpawnFrom, energyToUse);
    return true;
  }

  private static spawnKeeperSlayer(roomToSpawnFrom: Room): boolean {
    let keeperSlayerFlag = Game.flags[FlagName.KEEPER_SLAYER];
    if (!keeperSlayerFlag)
      return false;
    let keeperSlayerSpawnerFlag = Game.flags[FlagName.KEEPER_SLAYER_SPAWNER];
    if (!keeperSlayerSpawnerFlag || keeperSlayerSpawnerFlag.room != roomToSpawnFrom || keeperSlayerFlag.secondaryColor != COLOR_RED)
      return false;
    let keeperSlayer = Nexus.getProbes(CreepRole.KEEPER_SLAYER, roomToSpawnFrom.name);
    let keeperSlayerSetup = new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH], pattern: [TOUGH, MOVE, ATTACK], suffix: [HEAL, HEAL, HEAL, HEAL, HEAL], sizeLimit: 7 }, "keeperSlayer-" + Game.time, { role: CreepRole.KEEPER_SLAYER, remote: roomToSpawnFrom.name, homeName: roomToSpawnFrom.name });
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let energyToUse: number;

    if (!controller || keeperSlayer.length >= 1) {
      return false;
    }
    switch (controller.level) {
      case 1://300 Energy avilable
      case 2://550 Energy available
      case 3://800 Energy available
      case 4://1300 Energy available
      case 5://1800 Energy available
        return false;
      case 6://2300 Energy avilable
      default://5300 Energy at least
        energyToUse = 2300//14 Tough; 7 Move; 7 Attack; 5 Heal
        break;
    }

    Nexus.spawnCreep(keeperSlayerSetup, roomToSpawnFrom, energyToUse);
    return true;
  }
}

//MOVE	    50	Moves the creep. Reduces creep fatigue by 2/tick. See movement.
//WORK	    100	Harvests energy from target source. Gathers 2 energy/tick. Constructs a target structure. Builds the designated structure at a construction site, at 5 points/tick, consuming 1 energy/point. See building Costs. Repairs a target structure. Repairs a structure for 20 hits/tick. Consumes 0.1 energy/hit repaired, rounded up to the nearest whole number.
//CARRY	    50	Stores energy. Contains up to 50 energy units. Weighs nothing when empty.
//ATTACK	80	Attacks a target creep/structure. Deals 30 damage/tick. Short-ranged attack (1 tile).
//RANGED_ATTACK	150	Attacks a target creep/structure. Deals 10 damage/tick. Long-ranged attack (1 to 3 tiles).
//HEAL	    250	Heals a target creep. Restores 12 hit points/tick at short range (1 tile) or 4 hits/tick at a distance (up to 3 tiles).
//TOUGH	    10	No effect other than the 100 hit points all body parts add. This provides a cheap way to add hit points to a creep.
//CLAIM	    600
