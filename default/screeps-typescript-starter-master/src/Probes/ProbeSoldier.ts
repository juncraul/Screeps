import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";
import { Tasks } from "Tasks";

export class ProbeSoldier extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room, roomToHarvest: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      default:
        return new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH], pattern: [ATTACK, MOVE], sizeLimit: 3 }, "soldier-" + roomToHarvest.name + "-" + Game.time, { role: CreepRole.SOLDIER, remote: roomToHarvest.name, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnSoldier(roomToSpawnFrom: Room, roomsToHarvest: string[]): SPAWN_RESULT_CODES {
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    for (let i = 0; i < roomsToHarvest.length; i++) {
      let roomToHarvest = Game.rooms[roomsToHarvest[i]];
      let roomConnections = Tasks.getRoomConnections(roomToSpawnFrom);
      if (!roomToHarvest)//If room not visible don't create any soldiers
        continue;
      if (!roomConnections.includes(roomsToHarvest[i]))
        continue;
      let probeSetupSoldier = ProbeSoldier.getProbeSetup(controller.level, roomToSpawnFrom, roomToHarvest);
      let soldiers = Nexus.getProbes(CreepRole.SOLDIER, roomsToHarvest[i], true);
      let energyToUse = 570;//3 TOUGH - 3 Attack - 6 Move = 570
      let enemyInRoom = GetRoomObjects.getEnemy(roomToHarvest);

      if (soldiers.length >= 1 || roomToSpawnFrom.energyAvailable < energyToUse || enemyInRoom == undefined)
        continue;

      Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);
      return SPAWN_RESULT_CODES.OK;
    }
    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
