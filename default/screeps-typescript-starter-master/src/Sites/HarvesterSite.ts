import { profile } from "Profiler";
import { Site } from "./Site";
import { Probe } from "Probe";
import { GetRoomObjects } from "GetRoomObjects";
import { CreepRole } from "Constants";


@profile
export class HarvesterSite extends Site {
  miners: Probe[];
  source: Source;
  energyPerTick: number;
  powerNeededForHarvest: number;

  constructor(source: Source) {
    super("HarvesterSite", source.pos, "HarvesterSite-" + JSON.stringify(source.pos));
    this.miners = this.getProbes();
    this.source = source;
    this.energyPerTick = 3000 / ENERGY_REGEN_TIME;//TODO: calculate the 3000 number automatically
    this.powerNeededForHarvest = Math.ceil(this.energyPerTick / HARVEST_POWER);
  }

  minerLogic(probe: Probe) {
    if (_.sum(probe.carry) === probe.carryCapacity && probe.carryCapacity != 0) {
      let deposit = GetRoomObjects.getClosestEmptyDeposit(probe);
      if (deposit) {
        probe.transferAll(deposit);
      }
    } else {
      let source = this.source;
      if (source) {
        let containerNextToSource = GetRoomObjects.getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
        if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
            probe.goTo(containerNextToSource.pos);
          }
        } else {
          probe.harvest(source);
        }
      }
    }
  }

  checkIfMinersAreNeeded() {
    let totalPowerOnHarvesterSite = 0;
    for (let i in this.miners) {
      totalPowerOnHarvesterSite += this.miners[i].getNumberOfBodyPart(WORK);
    }
    if (totalPowerOnHarvesterSite < this.powerNeededForHarvest) {
      this.assignAnIdleCreep(CreepRole.HARVESTER);
    }
  }

  run() {
    this.checkIfMinersAreNeeded();

    for (let miner in this.miners) {
      this.minerLogic(this.miners[miner]);
    }
  }
}
