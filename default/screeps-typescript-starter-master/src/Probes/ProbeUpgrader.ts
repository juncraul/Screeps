import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeUpgrader extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
        return new ProbeSetup({ ordered: true, pattern: [WORK, CARRY, MOVE], sizeLimit: 1 }, "upgrader-" + Game.time, { role: CreepRole.UPGRADER, homeName: roomToSpawnFrom.name });
      case 2:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE, MOVE], sizeLimit: 3 }, "upgrader-" + Game.time, { role: CreepRole.UPGRADER, homeName: roomToSpawnFrom.name });
      case 3:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, MOVE, MOVE], sizeLimit: 5 }, "upgrader-" + Game.time, { role: CreepRole.UPGRADER, homeName: roomToSpawnFrom.name });
      default:
        return new ProbeSetup({ ordered: true, pattern: [WORK], suffix: [CARRY, CARRY, MOVE, MOVE, MOVE], sizeLimit: 10 }, "upgrader-" + Game.time, { role: CreepRole.UPGRADER, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnUpgrader(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let upgraders = Nexus.getProbes(CreepRole.UPGRADER, roomToSpawnFrom.name);
    let upgradersAboutToDie = _.filter(upgraders, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let workBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(upgraders, WORK);
    let maxBodyPartsAllowed = 10;
    let energyToUse: number;
    let deposit = roomToSpawnFrom.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_CONTAINER });
    //let bodyPartsPerSourceRequired = carriers.length <= 1 ? 2 : 6;//Set Harvester at full capacity only if there are enough carriers to sustain them
    let levelBlueprintToBuild: number;

    if (Game.cpu.bucket < 5000 && upgraders.length >= 2) {
      return SPAWN_RESULT_CODES.CPU_BUCKET_LOW;
    }

    if (!controller) {
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    }
    else {
      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level.
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
    }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
    let probeSetupUpgrader = ProbeUpgrader.getProbeSetup(controller.level, roomToSpawnFrom);
    switch (levelBlueprintToBuild) {
      case 1://300 Energy avilable
        energyToUse = 200;//1 Work; 1 Carry; 1 Move
        if (deposit.length == 0 && upgraders.length <= 2) {
          return SPAWN_RESULT_CODES.NO_DEPOSIT_STRUCTURE_CONSTRUCTED;
        }
        break;
      case 2://550 Energy available
        energyToUse = 450;//3 Work; 1 Carry; 2 Move
        if (deposit.length == 0 && upgraders.length <= 2) {
          return SPAWN_RESULT_CODES.NO_DEPOSIT_STRUCTURE_CONSTRUCTED;
        }
        break;
      case 3://800 Energy available
        energyToUse = 650;//5 Work; 1 Carry; 2 Move
        break;
      case 4://1300 Energy at least
        energyToUse = 1250//10 Work; 2 Carry; 3 Move
        break;
      default://1800 Energy at least
        energyToUse = 1250//10 Work; 2 Carry; 3 Move
        maxBodyPartsAllowed = 20;
        break
    }
    ////In case when not all extensions got a chance to be built.
    energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;

    if (upgradersAboutToDie.length == 0 && workBodyParts >= maxBodyPartsAllowed - 5) {
      return SPAWN_RESULT_CODES.PLENTLY_ALIVE_CREEPS;
    }
    else if (upgradersAboutToDie.length > 0 && workBodyParts >= maxBodyPartsAllowed) {
      return SPAWN_RESULT_CODES.PLENTLY_ALIVE_CREEPS;
    }

    if (roomToSpawnFrom.energyAvailable < energyToUse) {
      return SPAWN_RESULT_CODES.OK;//Show our intend to spawn this probe when energy will be available
    }
    Nexus.spawnCreep(probeSetupUpgrader, roomToSpawnFrom, energyToUse);
    return SPAWN_RESULT_CODES.OK;
  }
}
