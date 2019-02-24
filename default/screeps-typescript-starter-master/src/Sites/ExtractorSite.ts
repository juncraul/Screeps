import { profile } from "Profiler";
import { Site } from "./Site";
import { Probe } from "Probe";
import { GetRoomObjects } from "GetRoomObjects";
import { CreepRole } from "Constants";


@profile
export class ExtractorSite extends Site {
  miners: Probe[];
  mineral: Mineral;

  constructor(mineral: Mineral) {
    super("ExtractorSite", mineral.pos, "ExtractorSite-" + JSON.stringify(mineral.pos));
    this.miners = this.getProbes();
    this.mineral = mineral;
  }

  minerLogic(probe: Probe) {
    if (_.sum(probe.carry) === probe.carryCapacity && probe.carryCapacity != 0) {
      let deposit = GetRoomObjects.getClosestEmptyDeposit(probe);
      if (deposit) {
        probe.transferAll(deposit);
      }
    } else {
      let mineral = this.mineral;
      if (mineral) {
        let containerNextToSource = GetRoomObjects.getStructuresInRangeOf(mineral.pos, STRUCTURE_CONTAINER, 1)[0];
        if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
            probe.goTo(containerNextToSource.pos);
          }
        } else {
          probe.harvest(mineral);
        }
      }
    }
  }

  checkIfMinersAreNeeded() {
    if (this.miners.length == 0 && this.mineral.mineralAmount > 0) {
      this.assignAnIdleCreep(CreepRole.HARVESTER);
    }
    if (this.mineral.mineralAmount == 0) {
      for (let i in this.miners)
        this.freeUpCreep(this.miners[i]);
    }
  }

  run() {
    this.checkIfMinersAreNeeded();

    for (let miner in this.miners) {
      this.minerLogic(this.miners[miner]);
    }
  }
}
