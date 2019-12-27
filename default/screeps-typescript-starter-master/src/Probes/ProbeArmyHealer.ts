import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES, FlagName } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeArmyHealer extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
        return new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH], pattern: [HEAL, MOVE], suffix: [MOVE, MOVE], sizeLimit: 2 }, "soldier-" + Game.time, { role: CreepRole.ARMY_HEALER, homeName: roomToSpawnFrom.name });
      case 4:
        return new ProbeSetup({ ordered: true, pattern: [MOVE, HEAL], sizeLimit: 5 }, "soldier-" + Game.time, { role: CreepRole.ARMY_HEALER, homeName: roomToSpawnFrom.name });
      default:
        return new ProbeSetup({ ordered: true, pattern: [MOVE, HEAL], sizeLimit: 6 }, "soldier-" + Game.time, { role: CreepRole.ARMY_HEALER, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnArmyHealer(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let warFlag = Game.flags[FlagName.WAR];
    if (!warFlag || (warFlag.secondaryColor != COLOR_RED && warFlag.secondaryColor != COLOR_PURPLE))//RED for full build, PURPLE for limited build
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    let armyHealer = Nexus.getProbes(CreepRole.ARMY_HEALER);
    if (warFlag.secondaryColor == COLOR_PURPLE && armyHealer.length >= 1)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    let probeSetupHealer = ProbeArmyHealer.getProbeSetup(controller.level, roomToSpawnFrom);
    let energyToUse;
    switch (controller.level) {
      case 1:
      case 2:
        return SPAWN_RESULT_CODES.NOT_NEEDED_AT_THIS_LEVEL;
      case 3://800 Energy available
        energyToUse = 750;//2 TOUGH - 2 HEAL - 2 Move = 750
        break;
      case 4://1300 Energy available
        energyToUse = 1200;//4 MOVE - 4 HEAL = 1200
        break;
      case 5://1800 Energy available
      default:
        energyToUse = 1800;//6 MOVE - 6 HEAL = 1800
        break;
    }

    Nexus.spawnCreep(probeSetupHealer, roomToSpawnFrom, energyToUse);

    return SPAWN_RESULT_CODES.OK;
  }
}
