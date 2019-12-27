import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeMerchant extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room): ProbeSetup {
    switch (controllerLevel) {
      case 1:
      case 2:
      case 3:
      case 4:
      default:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 8 }, "merchant-" + Game.time, { role: CreepRole.MERCHANT, homeName: roomToSpawnFrom.name });
    }
  }

  static spawnMerchant(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let merchants = Nexus.getProbes(CreepRole.MERCHANT, roomToSpawnFrom.name);
    let merchantsAboutToDie = _.filter(merchants, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let energyToUse: number;
    let terminal = roomToSpawnFrom.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_TERMINAL });

    if (!controller) {
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    }
    else if (!terminal) {
      return SPAWN_RESULT_CODES.NO_TERMINAL;
    }
    let probeSetupMerchant = ProbeMerchant.getProbeSetup(controller.level, roomToSpawnFrom)
    switch (controller.level) {
      case 1://300 Energy avilable
      case 2://550 Energy available
      case 3://800 Energy available
      case 4://1300 Energy available
      case 5://1800 Energy available
        return SPAWN_RESULT_CODES.NOT_NEEDED_AT_THIS_LEVEL;
      case 6://2300 Energy avilable
      default://5300 Energy at least
        energyToUse = 800//8 Carry; 8 Move
        break;
    }
    //In case when not all extensions got a chance to be built.
    energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;

    if ((merchantsAboutToDie.length == 0 && merchants.length >= 1) || (merchantsAboutToDie.length > 0 && merchants.length >= 2)) {
      return SPAWN_RESULT_CODES.PLENTLY_ALIVE_CREEPS;
    }

    if (roomToSpawnFrom.energyAvailable < energyToUse) {
      return SPAWN_RESULT_CODES.OK;//Show our intend to spawn this probe when energy will be available
    }
    Nexus.spawnCreep(probeSetupMerchant, roomToSpawnFrom, energyToUse);
    return SPAWN_RESULT_CODES.NOT_NEEDED;
  }
}
