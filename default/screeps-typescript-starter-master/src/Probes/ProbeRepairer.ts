import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeRepairer extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      default:
        return new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 3 }, "repairer-" + Game.time, { role: CreepRole.REPAIRER, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnRepairer(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let repairers = Nexus.getProbes(CreepRole.REPAIRER, roomToSpawnFrom.name)
    let buildingToRepair = GetRoomObjects.getClosestStructureToRepairByPath(new RoomPosition(0, 0, roomToSpawnFrom.name), 0.7);

    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    if (buildingToRepair != null)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    if (repairers.length >= 1)
      return SPAWN_RESULT_CODES.TOO_MANY_CREEPS;


    let probeSetupRepairer = ProbeRepairer.getProbeSetup(controller.level, roomToSpawnFrom);
    Nexus.spawnCreep(probeSetupRepairer, roomToSpawnFrom, roomToSpawnFrom.energyCapacityAvailable);

    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
