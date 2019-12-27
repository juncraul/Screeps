import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeHarvester extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room) {
    switch (controllerLevel) {
      case 1:
        return new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 1 }, "harvester-" + Game.time, { role: CreepRole.HARVESTER, homeName: roomToSpawnFrom.name });
      case 2:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE, MOVE], sizeLimit: 3 }, "harvester-" + Game.time, { role: CreepRole.HARVESTER, homeName: roomToSpawnFrom.name });
      case 3:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [MOVE, MOVE], sizeLimit: 5 }, "harvester-" + Game.time, { role: CreepRole.HARVESTER, homeName: roomToSpawnFrom.name });
      case 4:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [MOVE, MOVE], sizeLimit: 5 }, "harvester-" + Game.time, { role: CreepRole.HARVESTER, homeName: roomToSpawnFrom.name });
      default:
        return new ProbeSetup({ ordered: true, pattern: [WORK, WORK, MOVE], sizeLimit: 15 }, "harvester-" + Game.time, { role: CreepRole.HARVESTER, homeName: roomToSpawnFrom.name, harvestCooldownXTicks: 1 });
    }
  }

  static spawnHarvester(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let harvesters = Nexus.getProbes(CreepRole.HARVESTER, roomToSpawnFrom.name);
    let carriers = Nexus.getProbes(CreepRole.CARRIER, roomToSpawnFrom.name);
    let longDistanceHarvesters = Nexus.getProbes(CreepRole.LONG_DISTANCE_HARVESTER, roomToSpawnFrom.name, true);
    let harvestersAboutToDie = _.filter(harvesters, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
    let mineral = GetRoomObjects.getMineral(roomToSpawnFrom, true);
    let sources = roomToSpawnFrom.find(FIND_SOURCES).length + (mineral ? 1 : 0);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(harvesters, WORK) + Probe.getActiveBodyPartsFromArrayOfProbes(longDistanceHarvesters, WORK);
    let energyToUse: number;
    let bodyPartsPerSourceRequired = carriers.length <= 1 ? 2 : 5;//Set Harvester at full capacity only if there are enough carriers to sustain them
    //let levelBlueprintToBuild: number;

    if (harvesters.length >= ProbeHarvester.getMaximumPossibleNumberOfHarvesters(roomToSpawnFrom))
      return SPAWN_RESULT_CODES.TOO_MANY_CREEPS;
    if (!controller) {
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    }
    else {
      //if (Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0) {
      //  levelBlueprintToBuild = controller.level//No extenstions to construct, set blueprint as current controller level.
      //}
      //else {
      //  levelBlueprintToBuild  = controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
      //}
    }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
    let probeSetupHarvester = ProbeHarvester.getProbeSetup(controller.level, roomToSpawnFrom);
    switch (controller.level) {
      case 1://300 Energy avilable
        energyToUse = 200;//1 Work; 1 Carry; 1 Move
        break;
      case 2://550 Energy available
        energyToUse = 450;//3 Work; 1 Carry; 2 Move
        break;
      case 3://800 Energy available
        energyToUse = 600;//5 Work; 2 Move //This rely that it stands on top of container
        break;
      case 4://1300 Energy available
        energyToUse = 600;//5 Work; 2 Move //This rely that it stands on top of container
        break;
      default://1800 Energy at least
        energyToUse = 1250;//10 Work; 5 Move //This rely that it stands on top of container
        //This also harvest every second tick to save CPU time
        bodyPartsPerSourceRequired = 10;
        break;
    }
    //In case when not all extensions got a chance to be built.
    energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;

    //Emergency situation with no carriers and we don't have energy to build the latest harvester. Quickly build 2 low harvesters.
    if (carriers.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse && harvesters.length < 2 + (mineral ? 1 : 0)) {
      energyToUse = 200;//1 Work; 1 Carry; 1 Move
      probeSetupHarvester = ProbeHarvester.getProbeSetup(1, roomToSpawnFrom);

    }
    else { //Emergency situation with no harvesters and we don't have energy to build the latest harvester. Quickly build 1 low harvester.
      if (harvesters.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse) {
        energyToUse = 200;//1 Work; 1 Carry; 1 Move
        probeSetupHarvester = ProbeHarvester.getProbeSetup(1, roomToSpawnFrom);;
      }
      else { //Emergency situation with one weak harvesters and we don't have energy to build the latest harvester. Quickly build 1 medium harvester.
        if (workBodyParts < 3 && roomToSpawnFrom.energyAvailable < energyToUse) {
          energyToUse = 400;//3 Work; 1 Carry; 1 Move
          probeSetupHarvester = ProbeHarvester.getProbeSetup(2, roomToSpawnFrom);;
        }
        //else {
        //  if (carriers.length == 0) {//Let carriers to be built
        //    return SPAWN_RESULT_CODES.NEED_OTHER_TYPES_OF_CREEPS;
        //  }
        //}
      }
    }

    if ((harvestersAboutToDie.length == 0 && workBodyParts >= sources * bodyPartsPerSourceRequired) ||
      (harvestersAboutToDie.length > 0 && workBodyParts >= (sources + 1) * bodyPartsPerSourceRequired)) {
      return SPAWN_RESULT_CODES.PLENTLY_ALIVE_CREEPS;
    }

    if (roomToSpawnFrom.energyAvailable < energyToUse) {
      return SPAWN_RESULT_CODES.OK;//Show our intend to spawn this probe when energy will be available
    }
    Nexus.spawnCreep(probeSetupHarvester, roomToSpawnFrom, energyToUse);
    return SPAWN_RESULT_CODES.OK;
  }

  private static getMaximumPossibleNumberOfHarvesters(room: Room): number {
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
}
