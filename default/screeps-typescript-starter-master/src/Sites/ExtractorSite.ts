import { profile } from "Profiler";
import { Site } from "./Site";
import { Probe } from "Probe";
import { GetRoomObjects } from "GetRoomObjects";
import { CreepRole } from "Constants";


@profile
export class ExtractorSite extends Site {
  miners: Probe[];
  mineral: Mineral;
  container: StructureContainer | undefined;

  constructor(mineral: Mineral) {
    super("ExtractorSite", mineral.pos, "ExtractorSite-" + JSON.stringify(mineral.pos));
    this.miners = this.getProbes();
    this.mineral = mineral;
    this.loadStructures();
  }

  refresh() {
    super.refresh();
    this.miners = this.getProbes();
  }

  loadStructures() {
    let structure = GetRoomObjects.getStructuresInRangeOf(this.mineral.pos, STRUCTURE_CONTAINER, 1)[0];
    if (structure instanceof StructureContainer) {
      this.container = structure;
    }
  }

  run() {
    this.checkIfMinersAreNeeded();

    for (let miner in this.miners) {
      this.minerLogic(this.miners[miner]);
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

  minerLogic(probe: Probe) {
    if (_.sum(probe.carry) === probe.carryCapacity && probe.carryCapacity != 0) {
      let deposit = GetRoomObjects.getClosestEmptyDeposit(probe);
      if (deposit) {
        probe.transferAll(deposit);
      }
    } else {
      let mineral = this.mineral;
      if (mineral) {
        if (this.container && this.container.pos.lookFor(LOOK_CREEPS).length == 0) {
          probe.goTo(this.container.pos, { range: 0 });
        } else {
          probe.harvest(mineral);
        }
      }
    }
  }
}
