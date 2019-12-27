import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";
import { Tasks } from "Tasks";

export class ProbeLongDistanceCarrier extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room, roomToHarvest: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 5 }, "longDistanceCarrier-" + roomToHarvest.name + "-" + Game.time, { role: CreepRole.LONG_DISTANCE_CARRIER, remote: roomToHarvest.name, homeName: roomToSpawnFrom.name, useCashedPath: true });
      default:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, CARRY, MOVE], sizeLimit: 8 }, "longDistanceCarrier-" + roomToHarvest.name + "-" + Game.time, { role: CreepRole.LONG_DISTANCE_CARRIER, remote: roomToHarvest.name, homeName: roomToSpawnFrom.name, useCashedPath: true });
    }
  }

  static spawnLongDistanceCarrier(roomToSpawnFrom: Room, roomsToHarvest: string[]): SPAWN_RESULT_CODES {
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let carriers = Nexus.getProbes(CreepRole.LONG_DISTANCE_CARRIER, roomsToHarvest[i], true);
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let containers = roomToHarvest != null ? roomToHarvest.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_CONTAINER }).length : 0;
      let roomNeedsClaimed = roomToHarvest != null ? Tasks.getRoomsToClaim().includes(roomToHarvest.name) : false;
      let energyToUse: number;
      let levelBlueprintToBuild: number;
      let probeSetupLongDistanceCarrier = ProbeLongDistanceCarrier.getProbeSetup(controller.level, roomToSpawnFrom, roomToHarvest);

      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level.
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
      //This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
      switch (levelBlueprintToBuild) {
        case 1:
        case 2:
          return SPAWN_RESULT_CODES.NOT_NEEDED_AT_THIS_LEVEL;
        case 3://800 Energy available
          energyToUse = 750;//10 Carry; 5 Move
          break;
        case 4://1300 Energy available
          energyToUse = 1050//14 Carry; 7 Move
          break;
        default://1800 Energy at least
          energyToUse = 1200//16 Carry; 8 Move
          break;
      }

      if (carriers.length >= containers || roomToSpawnFrom.energyAvailable < energyToUse || roomNeedsClaimed)
        continue;

      Nexus.spawnCreep(probeSetupLongDistanceCarrier, roomToSpawnFrom, energyToUse);
      return SPAWN_RESULT_CODES.OK;
    }
    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
