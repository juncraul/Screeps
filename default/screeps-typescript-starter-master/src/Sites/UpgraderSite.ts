import { profile } from "Profiler";
import { Site } from "./Site";
import { Probe } from "Probe";
import { GetRoomObjects } from "GetRoomObjects";
import { MY_SIGNATURE, BoostActionType, CreepRole } from "Constants";
import { ProbeLogic } from "ProbeLogic";


@profile
export class UpgraderSite extends Site {
  upgraders: Probe[];
  controller: StructureController;
  container: StructureContainer | undefined;
  link: StructureLink | undefined;

  constructor(controller: StructureController) {
    super("UpgraderSite", controller.pos, "UpgraderSite-" + JSON.stringify(controller.pos));
    this.upgraders = this.getProbes();
    this.controller = controller;
    this.loadStructures();
  }

  refresh() {
    super.refresh();
    this.upgraders = this.getProbes();
    if (this.container) {
      this.container = <StructureContainer>Game.getObjectById(this.container.id)
    }
    if (this.link) {
      this.link = <StructureLink>Game.getObjectById(this.link.id)
    }
  }

  loadStructures() {
    this.container = <StructureContainer>GetRoomObjects.getStructuresInRangeOf(this.controller.pos, STRUCTURE_CONTAINER, 2)[0];
    this.link = <StructureLink>GetRoomObjects.getStructuresInRangeOf(this.controller.pos, STRUCTURE_LINK, 2)[0];
  }

  upgraderLogic(probe: Probe) {
    //Move probe back in home base in case it wonder off
    if (probe.room.name != probe.memory.homeName) {
      probe.goToRemoteRoom(probe.memory.homeName);
      return;
    }

    //Boost the creep
    if (this.controller.level >= 6 && ProbeLogic.boostCreep(probe, BoostActionType.UPGRADE, 5, 1) == OK) {
      return;
    }

    //Sign the controller every now and then
    if (Game.time % 1000 == 0) {
      probe.sign(this.controller, MY_SIGNATURE);
    }

    //Probe is full of energy, get ready for work
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }

    //Probe has no energy, get ready to look for some
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isWorking) {
      //Upgrade controller
      probe.upgradeController(this.controller);
    }
    if (probe.memory.isGathering) {
      //Recharge from container
      if (this.container && this.container.store[RESOURCE_ENERGY] > 0) {
        probe.withdraw(this.container, RESOURCE_ENERGY)
        return;
      }

      //Recharge from link
      if (this.link && this.link.energy > 0) {
        probe.withdraw(this.link, RESOURCE_ENERGY)
        return;
      }

      //Find other deposits
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, false, 300);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
        return;
      }

      //Find dropped resources
      let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
      if (droppedResource) {
        probe.pickup(droppedResource);
        return;
      }
    }
  }

  getAllUpgraders() {
    this.assignAnIdleCreep(CreepRole.UPGRADER);
  }

  run() {
    this.getAllUpgraders();
    
    for (let upgrader in this.upgraders) {
      this.upgraderLogic(this.upgraders[upgrader]);
    }
  }
}
