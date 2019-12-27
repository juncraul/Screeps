import { Nexus } from "Nexus";
import { ProbeLogic } from "ProbeLogic";
import { Tasks } from "Tasks";
import { Stargate } from "Stargate";
import { TradeHub } from "TradeHub";
import { GetRoomObjects } from "GetRoomObjects";
import { profile } from "./Profiler";
import { Laboratory } from "Laboratory";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { Helper } from "Helper";
import { Debugging, DebuggingType } from "Debugging";
import { ProbeHarvester } from "Probes/ProbeHarvester";
import { ProbeCarrier } from "Probes/ProbeCarrier";
import { ProbeUpgrader } from "Probes/ProbeUpgrader";
import { ProbeLongDistanceHarvester } from "Probes/ProbeLongDistanceHarvester";
import { ProbeLongDistanceCarrier } from "Probes/ProbeLongDistanceCarrier";
import { ProbeLongDistanceBuilder } from "Probes/ProbeLongDistanceBuilder";
import { ProbeClaimer } from "Probes/ProbeClaimer";
import { ProbeMerchant } from "Probes/ProbeMerchant";
import { ProbeSlayer } from "Probes/ProbeSlayer";
import { ProbeDecoy } from "Probes/ProbeDecoy";
import { ProbeSoldier } from "Probes/ProbeSoldier";
import { ProbeArmyAttacker } from "Probes/ProbeArmyAttacker";
import { ProbeArmyHealer } from "Probes/ProbeArmyHealer";
import { ProbeArmyElite } from "Probes/ProbeArmyElite";
import { ProbeBuilder } from "Probes/ProbeBuilder";
import { ProbeRepairer } from "Probes/ProbeRepairer";


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
      let spawns = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_SPAWN })

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
        else if (Mothership.spawnCreep(ProbeDecoy.spawnDecoy, room, "Decoy")) {

        }
        else if (Mothership.spawnCreep(ProbeArmyElite.spawnArmyElite, room, "ArmyElite")) {

        }
        else if (Mothership.spawnCreep(ProbeArmyAttacker.spawnArmyAttacker, room, "ArmyAttacker")) {

        }
        else if (Mothership.spawnCreep(ProbeArmyHealer.spawnArmyHealer, room, "ArmyHealer")) {

        }
        else if (Mothership.spawnCreep(ProbeUpgrader.spawnUpgrader, room, "Upgrader")) {

        }
        else if (Mothership.spawnCreep(ProbeBuilder.spawnBuilder, room, "Builder")) {

        }
        else if (Mothership.spawnCreep(ProbeRepairer.spawnRepairer, room, "Repairer")) {

        }
        else if (Mothership.spawnCreepRemote(ProbeSoldier.spawnSoldier, room, roomsToHarvest, "Soldier")) {

        }
        else if (Mothership.spawnCreepRemote(ProbeLongDistanceBuilder.spawnLongDistanceBuilder, room, roomsToHarvest, "LongDistanceBuilder")) {

        }
        else if (Mothership.spawnCreepRemote(ProbeLongDistanceHarvester.spawnLongDistanceHarvester, room, roomsToHarvest, "LongDistanceHarvester")) {

        }
        else if (Mothership.spawnCreepRemote(ProbeLongDistanceCarrier.spawnLongDistanceCarrier, room, roomsToHarvest, "LongDistanceCarrier")) {

        }
        else if (Mothership.spawnCreepRemote(ProbeClaimer.spawnClaimer, room, roomsToHarvest, "Claimer")) {

        }
        else if (Mothership.spawnCreep(ProbeMerchant.spawnMerchant, room, "Merchant")) {

        }
        else if (Mothership.spawnCreep(ProbeSlayer.spawnKeeperSlayer, room, "Slayer")) {

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

  private static spawnCreepRemote(spawnFunction: Function, room: Room, roomsToHarvest: string[], name: string): boolean {
    let spawnResult = spawnFunction(room, roomsToHarvest);
    if (spawnResult == SPAWN_RESULT_CODES.OK) {
      console.log(room.name + ` Spawning ${name}`);
      return true;
    } else {
      Debugging.log(`Not spawning ${name} error: ${spawnResult}`, DebuggingType.SPAWNING)
      return false;
    }
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
