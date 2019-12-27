import { profile } from "Profiler";
import { Site } from "./Site";
import { Probe } from "Probe";
import { GetRoomObjects } from "GetRoomObjects";
import { MY_SIGNATURE, BoostActionType, CreepRole } from "Constants";
import { ProbeLogic } from "ProbeLogic";
import { Debugging, DebuggingType } from "Debugging";


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

  run() {
    this.getAllUpgraders();

    for (let upgrader in this.upgraders) {
      Debugging.log(`Upgrader ${this.upgraders[upgrader].id} returned value: ${this.upgraderLogic(this.upgraders[upgrader])}`, DebuggingType.UPGRADER);
    }
  }

  getAllUpgraders() {
    this.assignAnIdleCreep(CreepRole.UPGRADER);//TODO: change this somehow very ineficient
  }

  upgraderLogic(probe: Probe) {
    //Move probe back in home base in case it wonder off
    if (probe.room.name != probe.memory.homeName) {
      probe.goToRemoteRoom(probe.memory.homeName);
      return 1;
    }

    //Boost the creep for level 6
    if (!probe.spawning && this.controller.level == 6 && ProbeLogic.boostCreep(probe, BoostActionType.UPGRADE, 2, 1) == OK) {
      return 2;
    }

    //Boost the creep for level 7 and 8
    if (!probe.spawning && this.controller.level >= 7 && ProbeLogic.boostCreep(probe, BoostActionType.UPGRADE, 4, 1) == OK) {
      return 3;
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
      //Recharge from link
      if (this.link && this.link.energy > 0) {
        probe.withdraw(this.link, RESOURCE_ENERGY)
        return 4;
      }

      //Recharge from container
      if (this.container && this.container.store[RESOURCE_ENERGY] > 0) {
        probe.withdraw(this.container, RESOURCE_ENERGY)
        return 5;
      }

      if (this.controller.level > 3) {//After level 3 don't allow upgraders to take resources from somewhere else
        return;
      }

      //Find other deposits
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, true, 300);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
        return 6;
      }
      
      //Find dropped resources
      let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
      if (droppedResource) {
        probe.pickup(droppedResource);
        return 7;
      }

      //Get from spawner if controller level is 1/2
      if (this.controller.level <= 2) {
        deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, false, 200);
        if (deposit) {
          probe.withdraw(deposit, RESOURCE_ENERGY);
          return 8;
        }
      }
    }
    return -1;
  }
}
