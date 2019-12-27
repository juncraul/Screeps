import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES, FlagName } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeArmyElite extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return new ProbeSetup({ ordered: true, prefix: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], pattern: [ATTACK], suffix: [RANGED_ATTACK], sizeLimit: 8 }, "soldier-" + Game.time, { role: CreepRole.ARMY_ATTCKER, homeName: roomToSpawnFrom.name });
      default:
        return new ProbeSetup({ ordered: true, prefix: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], pattern: [ATTACK], suffix: [RANGED_ATTACK], sizeLimit: 10 }, "soldier-" + Game.time, { role: CreepRole.ARMY_ATTCKER, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnArmyElite(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let warFlag = Game.flags[FlagName.WAR];
    if (!warFlag || (warFlag.secondaryColor != COLOR_RED && warFlag.secondaryColor != COLOR_PURPLE))//RED for full build, PURPLE for limited build
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let armyAttacker = Nexus.getProbes(CreepRole.ARMY_ATTCKER);
    let armyHealer = Nexus.getProbes(CreepRole.ARMY_HEALER);
    if (warFlag.secondaryColor == COLOR_PURPLE && armyAttacker.length >= 2)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    if (!controller) {
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    }
    if (armyAttacker.length > armyHealer.length * 2)
      return SPAWN_RESULT_CODES.NEED_OTHER_TYPES_OF_CREEPS;
    let probeSetupSoldier = ProbeArmyElite.getProbeSetup(controller.level, roomToSpawnFrom);
    let energyToUse;
    switch (controller.level) {
      case 1:
      case 2:
      case 3:
        return SPAWN_RESULT_CODES.NOT_NEEDED_AT_THIS_LEVEL;
      case 4://1300 Energy available
        energyToUse = 1240;//9 MOVE - 8 ATTACK - 1 RANGED_ATTACK = 1240
        break;
      case 5://1800 Energy available
      default:
        energyToUse = 1500;//11 MOVE - 10 ATTACK - 1 RANGED_ATTACK = 1500
        break;
    }

    Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);

    return SPAWN_RESULT_CODES.OK;
  }
}
