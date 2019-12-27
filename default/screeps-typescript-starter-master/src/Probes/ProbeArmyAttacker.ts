import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES, FlagName } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeArmyAttacker extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      default:
        return new ProbeSetup({ ordered: true, prefix: [TOUGH, TOUGH, TOUGH], pattern: [RANGED_ATTACK, MOVE], suffix: [MOVE, MOVE], sizeLimit: 3 }, "soldier-" + Game.time, { role: CreepRole.ARMY_ATTCKER, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnArmyAttacker(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let warFlag = Game.flags[FlagName.WAR];

    if (!controller)
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    if (!warFlag || (warFlag.secondaryColor != COLOR_RED && warFlag.secondaryColor != COLOR_PURPLE))//RED for full build, PURPLE for limited build
      return SPAWN_RESULT_CODES.NOT_NEEDED;

    let armyAttacker = Nexus.getProbes(CreepRole.ARMY_ATTCKER);
    let armyHealer = Nexus.getProbes(CreepRole.ARMY_HEALER);

    if (warFlag.secondaryColor == COLOR_PURPLE && armyAttacker.length >= 2)
      return SPAWN_RESULT_CODES.NOT_NEEDED;
    if (armyAttacker.length * 2 > armyHealer.length)
      return SPAWN_RESULT_CODES.NEED_OTHER_TYPES_OF_CREEPS;

    let probeSetupSoldier = ProbeArmyAttacker.getProbeSetup(controller.level, roomToSpawnFrom)
    let energyToUse = 1150;//3 TOUGH - 5 RANGED_ATTACK - 5 Move = 1150

    Nexus.spawnCreep(probeSetupSoldier, roomToSpawnFrom, energyToUse);

    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
