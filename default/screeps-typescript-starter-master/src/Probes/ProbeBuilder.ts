import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeBuilder extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      default:
        return new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "builder-" + Game.time, { role: CreepRole.BUILDER, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnBuilder(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let builders = Nexus.getProbes(CreepRole.BUILDER, roomToSpawnFrom.name);
    let constructionSites = GetRoomObjects.getConstructionSitesFromRoom(roomToSpawnFrom);

    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    if (constructionSites.length == 0)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    if (builders.length >= 1)
      return SPAWN_RESULT_CODES.TOO_MANY_CREEPS;

    let probeSetupBuilder = ProbeBuilder.getProbeSetup(controller.level, roomToSpawnFrom);
    Nexus.spawnCreep(probeSetupBuilder, roomToSpawnFrom, roomToSpawnFrom.energyCapacityAvailable);

    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
