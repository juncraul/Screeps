import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES, FlagName } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeSlayer extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      case 4:
      default:
        return new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH], pattern: [TOUGH, MOVE, ATTACK], suffix: [HEAL, HEAL, HEAL, HEAL, HEAL], sizeLimit: 7 }, "keeperSlayer-" + Game.time, { role: CreepRole.KEEPER_SLAYER, remote: roomToSpawnFrom.name, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnKeeperSlayer(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let keeperSlayerFlag = Game.flags[FlagName.KEEPER_SLAYER];
    if (!keeperSlayerFlag)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    let keeperSlayerSpawnerFlag = Game.flags[FlagName.KEEPER_SLAYER_SPAWNER];
    if (!keeperSlayerSpawnerFlag || keeperSlayerSpawnerFlag.room != roomToSpawnFrom || keeperSlayerFlag.secondaryColor != COLOR_RED)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    let keeperSlayer = Nexus.getProbes(CreepRole.KEEPER_SLAYER, roomToSpawnFrom.name);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let energyToUse: number;

    if (!controller || keeperSlayer.length >= 1) {
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    }
    let keeperSlayerSetup = ProbeSlayer.getProbeSetup(controller.level, roomToSpawnFrom)
    switch (controller.level) {
      case 1://300 Energy avilable
      case 2://550 Energy available
      case 3://800 Energy available
      case 4://1300 Energy available
      case 5://1800 Energy available
        return SPAWN_RESULT_CODES.NOT_NEEDED_AT_THIS_LEVEL;
      case 6://2300 Energy avilable
      default://5300 Energy at least
        energyToUse = 2300//14 Tough; 7 Move; 7 Attack; 5 Heal
        break;
    }

    Nexus.spawnCreep(keeperSlayerSetup, roomToSpawnFrom, energyToUse);
    return SPAWN_RESULT_CODES.OK;
  }
}
