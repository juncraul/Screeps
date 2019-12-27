import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";
import { Tasks } from "Tasks";

export class ProbeClaimer extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room, roomToHarvest: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      case 4:
      default:
        return new ProbeSetup({ ordered: true, pattern: [CLAIM, MOVE], sizeLimit: 4 }, "claimer-" + roomToHarvest.name + "-" + Game.time, { role: CreepRole.CLAIMER, remote: roomToHarvest.name, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnClaimer(roomToSpawnFrom: Room, roomsToHarvest: string[]): SPAWN_RESULT_CODES {

    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomToHarvest)//If room not visible don't create any claimers
        continue;
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let claimers = Nexus.getProbes(CreepRole.CLAIMER, roomsToHarvest[i], true);
      let energyToUse = 650;//1 Claim - 1 Move = 650
      let claimBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(claimers, CLAIM);
      let controller = GetRoomObjects.getController(roomToSpawnFrom);
      let remoteController = GetRoomObjects.getController(roomToHarvest);
      let maxClaimer = ProbeClaimer.getMaximumPossibleNumberOfClaimers(roomToHarvest);
      let levelBlueprintToBuild: number;

      if (!controller) {
        return SPAWN_RESULT_CODES.NO_CONTROLLER;
      }
      else {
        levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
          ? controller.level//No extenstions to construct, set blueprint as current controller level.
          : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
      }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
      let probeSetupClaimer = ProbeClaimer.getProbeSetup(controller.level, roomToSpawnFrom, roomToHarvest);
      switch (levelBlueprintToBuild) {
        case 1:
        case 2:
          return SPAWN_RESULT_CODES.NOT_NEEDED_AT_THIS_LEVEL;
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
      return SPAWN_RESULT_CODES.OK;
    }
    return SPAWN_RESULT_CODES.NOT_NEEDED;
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
}
