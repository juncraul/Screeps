import { Probe } from "Probe";
import { CreepRole, SPAWN_RESULT_CODES } from "Constants";
import { ProbeSetup } from "ProbeSetup";
import { Nexus } from "Nexus";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeCarrier extends Probe {

  static getProbeSetup(controllerLevel: number, roomToSpawnFrom: Room) {
    switch (controllerLevel) {
      case 1:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 1 }, "carrier-" + Game.time, { role: CreepRole.CARRIER, homeName: roomToSpawnFrom.name, useCashedPath: true });
      case 2:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 2 }, "carrier-" + Game.time, { role: CreepRole.CARRIER, homeName: roomToSpawnFrom.name, useCashedPath: true });
      case 3:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 5 }, "carrier-" + Game.time, { role: CreepRole.CARRIER, homeName: roomToSpawnFrom.name, useCashedPath: true });
      case 4:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 10 }, "carrier-" + Game.time, { role: CreepRole.CARRIER, homeName: roomToSpawnFrom.name, useCashedPath: true });
      default:
        return new ProbeSetup({ ordered: true, pattern: [CARRY, MOVE], sizeLimit: 17 }, "carrier-" + Game.time, { role: CreepRole.CARRIER, homeName: roomToSpawnFrom.name, useCashedPath: true });
    }
  }

  static spawnCarrier(roomToSpawnFrom: Room): SPAWN_RESULT_CODES {
    let carriers = Nexus.getProbes(CreepRole.CARRIER, roomToSpawnFrom.name);
    let carriersAboutToDie = _.filter(carriers, (probe: Probe) => probe.ticksToLive != undefined && probe.ticksToLive < 100);
    let controller = GetRoomObjects.getController(roomToSpawnFrom);
    let carryBodyParts = Probe.getActiveBodyPartsFromArrayOfProbes(carriers, CARRY)
    let energyToUse: number;
    let levelBlueprintToBuild: number;
    let deposit = roomToSpawnFrom.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_CONTAINER });

    if (!controller) {
      return SPAWN_RESULT_CODES.NO_CONTROLLER;
    }
    else {
      levelBlueprintToBuild = Game.rooms[roomToSpawnFrom.name].find(FIND_CONSTRUCTION_SITES, { filter: structure => structure.structureType == STRUCTURE_EXTENSION }).length == 0
        ? controller.level//No extenstions to construct, set blueprint as current controller level.
        : controller.level - 1;//Extensions are pending to be constucted, set blueprint as previous controller level.
    }//This substruction will not happen when controller.level == 1 because there are no extensions to be built at that time.
    let probeSetupCarrier = this.getProbeSetup(controller.level, roomToSpawnFrom);
    switch (levelBlueprintToBuild) {
      case 1://300 Energy avilable
        energyToUse = 100;//1 Carry; 1 Move
        if (deposit.length == 0) {                                    //Don't build any carrier if we don't have a container anyway
          return SPAWN_RESULT_CODES.NO_DEPOSIT_STRUCTURE_CONSTRUCTED; //For future levels we drop resource on the ground, so will always need carries
        }
        break;
      case 2://550 Energy available
        energyToUse = 200;//2 Carry; 2 Move
        if (deposit.length == 0) {                                    //Don't build any carrier if we don't have a container anyway
          return SPAWN_RESULT_CODES.NO_DEPOSIT_STRUCTURE_CONSTRUCTED; //For future levels we drop resource on the ground, so will always need carries
        }
        break;
      case 3://800 Energy available
        energyToUse = 500;//5 Carry; 5 Move
        break;
      case 4://1300 Energy available
        energyToUse = 1000//10 Carry; 10 Move
        break;
      default://1800 Energy at least
        energyToUse = 1700//17 Carry; 17 Move
        break;
    }
    //In case when not all extensions got a chance to be built.
    energyToUse = roomToSpawnFrom.energyCapacityAvailable < energyToUse ? roomToSpawnFrom.energyCapacityAvailable : energyToUse;

    //Emergency situation with no carriers. Quickly build a low carrier
    if (carriers.length == 0 && roomToSpawnFrom.energyAvailable < energyToUse) {
      energyToUse = 100;//1 Carry; 1 Move
      probeSetupCarrier = this.getProbeSetup(1, roomToSpawnFrom);;
    }
    else {
      if (carriers.length == 1 && carryBodyParts <= 5 && roomToSpawnFrom.energyCapacityAvailable > 500) {//We have a weak carry build a level 3 one
        energyToUse = 500;//5 Carry; 5 Move
        probeSetupCarrier = this.getProbeSetup(3, roomToSpawnFrom);;
      }
    }

    if (carriers.length >= 2) {
      if (carriersAboutToDie.length == 0 || (carriersAboutToDie.length > 0 && carriers.length >= 3)) {
        return SPAWN_RESULT_CODES.TOO_MANY_CREEPS;
      }
    }

    if (roomToSpawnFrom.energyAvailable < energyToUse) {
      return SPAWN_RESULT_CODES.OK;//Show our intend to spawn this probe when energy will be available
    }
    Nexus.spawnCreep(probeSetupCarrier, roomToSpawnFrom, energyToUse);
    return SPAWN_RESULT_CODES.OK;
  }
}
