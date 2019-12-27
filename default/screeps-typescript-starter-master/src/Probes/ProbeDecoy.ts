import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES, FlagName } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeDecoy extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      case 4:
      default:
        return new ProbeSetup({ ordered: true, pattern: [MOVE], sizeLimit: 1 }, "cupidon-" + Game.time, { role: CreepRole.DECOY, remote: roomToSpawnFrom.name, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnDecoy(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let decoy = Game.flags[FlagName.DECOY];
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    if (!decoy)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    let decoySpawner = Game.flags[FlagName.DECOY_SPAWNER];
    if (!decoySpawner || decoySpawner.room != roomToSpawnFrom || decoy.secondaryColor != COLOR_RED)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER
    let probeDecoy = ProbeDecoy.getProbeSetup(controller.level, roomToSpawnFrom)
    let energyToUse = 50;//1 MOVE = 50

    Nexus.spawnCreep(probeDecoy, roomToSpawnFrom, energyToUse);
    return SPAWN_RESULT_CODES.OK;
  }
}
