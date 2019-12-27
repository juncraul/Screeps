import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";
import { Tasks } from "Tasks";

export class ProbeLongDistanceBuilder extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room, roomToHarvest: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      default:
        return new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 5 }, "longDistanceBuilder-" + roomToHarvest.name + "-" + Game.time, { role: CreepRole.LONG_DISTANCE_BUILDER, remote: roomToHarvest.name, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnLongDistanceBuilder(roomToSpawnFrom: Room, roomsToHarvest: string[]): SPAWN_RESULT_CODES {
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomToHarvest)
        continue;
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let probeSetupLongDistanceBuilder = ProbeLongDistanceBuilder.getProbeSetup(controller.level, roomToSpawnFrom, roomToHarvest);
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
      return SPAWN_RESULT_CODES.OK;
    }
    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
