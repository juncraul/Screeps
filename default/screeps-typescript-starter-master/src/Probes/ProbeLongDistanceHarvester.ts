import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";
import { Tasks } from "Tasks";

export class ProbeLongDistanceHarvester extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room, roomToHarvest: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [MOVE, MOVE, MOVE], proportionalPrefixSuffix: false, sizeLimit: 5 }, "longDistanceHarvester-" + roomToHarvest.name + "-" + Game.time, { role: CreepRole.LONG_DISTANCE_HARVESTER, remote: roomToHarvest.name, homeName: roomToSpawnFrom.name });
      default:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [MOVE, MOVE, MOVE, MOVE, MOVE], proportionalPrefixSuffix: false, sizeLimit: 5 }, "longDistanceHarvester-" + roomToHarvest.name + "-" + Game.time, { role: CreepRole.LONG_DISTANCE_HARVESTER, remote: roomToHarvest.name, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnLongDistanceHarvester(roomToSpawnFrom: Room, roomsToHarvest: string[]): SPAWN_RESULT_CODES {
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let harvesters = Nexus.getProbes(CreepRole.LONG_DISTANCE_HARVESTER, roomsToHarvest[i], true);
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let sources = roomToHarvest != null ? roomToHarvest.find(FIND_SOURCES).length : 1;
      let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(harvesters, WORK);
      let remoteController = roomToHarvest != null ? GetRoomObjects.getController(roomToHarvest) : null;
      let roomNeedsClaimed = roomToHarvest != null ? Tasks.getRoomsToClaim().includes(roomToHarvest.name) : false;
      let spawnerInRemote = roomToHarvest != null ? GetRoomObjects.getSpawn(roomToHarvest) : null;
      let energyToUse: number;
      let levelBlueprintToBuild: number;
      let probeSetupLongDistanceHarvester = ProbeLongDistanceHarvester.getProbeSetup(controller.level, roomToSpawnFrom, roomToHarvest);

      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level.
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
      //This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
      switch (levelBlueprintToBuild) {
        case 1:
        case 2:
          return SPAWN_RESULT_CODES.NOT_NEEDED_AT_THIS_LEVEL;
        case 3://800 Energy available
          energyToUse = 650;//5 Work; 3 Move //This reply that it stands on top of container
        default://1300 Energy at least
          energyToUse = 750;//5 Work; 5 Move //This reply that it stands on top of container
          break;
      }

      if (workBodyParts >= sources * 5 || roomToSpawnFrom.energyAvailable < energyToUse)
        continue;

      if (spawnerInRemote) {
        if (roomNeedsClaimed && remoteController && remoteController.level >= 3 && workBodyParts >= 1 * 5) {
          continue; //Room is quite big now send only one harvester
        } else if (roomNeedsClaimed && remoteController && remoteController.level >= 4) {
          continue; //Room is big now to handle its own harvesters
        }
      }

      Nexus.spawnCreep(probeSetupLongDistanceHarvester, roomToSpawnFrom, energyToUse);
      return SPAWN_RESULT_CODES.OK;
    }
    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
