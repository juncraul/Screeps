import { Probe } from "Probe";
import { Tasks } from "Tasks";
import { GetRoomObjects } from "GetRoomObjects";

export class ProbeLogic {

  public static harvesterLogic(probe: Probe): void {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      let deposit = GetRoomObjects.getClosestEmptyDeposit(probe);
      if (deposit) {
        probe.transferAll(deposit);
      }
    } else {
      let source = GetRoomObjects.getClosestActiveSourceDivided(probe, true);
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

  public static upgraderLogic(probe: Probe): void {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isWorking) {
      let target = GetRoomObjects.getController(probe);
      if (target) {
        probe.upgradeController(target);
      }
    }
    if (probe.memory.isGathering) {
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, 300);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
      } else {
        let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
        if (droppedResource) {
          probe.pickup(droppedResource);
        }
        else {
          let source = GetRoomObjects.getClosestActiveSourceDivided(probe);
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
    }
  }

  public static builderLogic(probe: Probe): void {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isWorking) {
      let target = GetRoomObjects.getClosestConstructionSite(probe);
      if (target) {
        probe.build(target);
      }
    }
    if (probe.memory.isGathering) {
      let allowToGetAbove = 300;
      let controller = GetRoomObjects.getController(probe.room);
      if (controller && controller.level < 3)
        allowToGetAbove = 200;//We are at the beginning allow to take from smaller deposits
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, allowToGetAbove);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
      } else {
        let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
        if (droppedResource) {
          probe.pickup(droppedResource);
        }
        else {
          let source = GetRoomObjects.getClosestActiveSourceDivided(probe);
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
    }
  }

  public static carrierLogic(probe: Probe): void {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }
    if (probe.memory.isWorking) {
      let supply = GetRoomObjects.getStructureToSupplyPriority(probe);
      if (supply && probe.carry[RESOURCE_ENERGY] > 0) {
        probe.transfer(supply, RESOURCE_ENERGY);
      }
      else {
        let supply = GetRoomObjects.getStructureToSupplyForReproduction(probe);
        if (supply && probe.carry[RESOURCE_ENERGY] > 0) {
          probe.transfer(supply, RESOURCE_ENERGY);
        }
        else {
          let supplyControllerDeposit = GetRoomObjects.getDepositNextToController(probe.room, true);
          if (supplyControllerDeposit.length > 0 && probe.carry[RESOURCE_ENERGY] > 0) {
            probe.transfer(supplyControllerDeposit[0], RESOURCE_ENERGY);
          }
          else {
            let differentOtherStucture = GetRoomObjects.getStructureDepositToSupply(probe);
            if (differentOtherStucture) {
              probe.transferAll(differentOtherStucture);
            }
          }
        }
      }
    }
    if (probe.memory.isGathering) {
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, true, 200, false);
      if (deposit) {
        probe.withdrawAll(deposit);
      } else {
        deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, false, 200, false);
        if (deposit) {
          probe.withdrawAll(deposit);
        }
      }
      if (!deposit && _.sum(probe.carry) > 0) {//Instead of waiting for a deposit to fill up, just return back what it currenlty has.
        probe.memory.isWorking = true;
        probe.memory.isGathering = false;
      }
    }
  }

  public static repairerLogic(probe: Probe): void {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isWorking) {
      let target = GetRoomObjects.getClosestStructureToRepair(probe.pos, 0.9);
      if (target) {
        probe.repair(target);
      }
    }
    if (probe.memory.isGathering) {
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, 300);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
      } else {
        let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
        if (droppedResource) {
          probe.pickup(droppedResource);
        }
        else {
          let source = GetRoomObjects.getClosestActiveSourceDivided(probe);
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
    }
  }

  public static longDistanceHarvesterLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      probe.goToDifferentRoom(probe.memory.remote);
    }
    else {
      if (_.sum(probe.carry) === probe.carryCapacity) {
        probe.memory.isWorking = true;
        probe.memory.isGathering = false;
      }
      if (_.sum(probe.carry) === 0) {
        probe.memory.isWorking = false;
        probe.memory.isGathering = true;
      }

      if (probe.memory.isWorking) {
        let containerToConstruct = GetRoomObjects.getConstructionSiteWithinRange(probe.pos, STRUCTURE_CONTAINER, 3);
        if (containerToConstruct) {
          probe.build(containerToConstruct);
        }
        else {
          let deposit = GetRoomObjects.getClosestEmptyDeposit(probe);
          if (deposit) {
            probe.transfer(deposit, RESOURCE_ENERGY);
          } else {
            let target = GetRoomObjects.getClosestStructureToRepair(probe.pos, 0.4);
            if (target) {
              probe.repair(target);
            }
            else {
              let target = GetRoomObjects.getClosestConstructionSite(probe);
              if (target) {
                probe.build(target);
              }
              else {
                let target = GetRoomObjects.getClosestStructureToRepair(probe.pos, 0.7);
                if (target) {
                  probe.repair(target);
                }
                else {
                  let target = GetRoomObjects.getClosestStructureToRepair(probe.pos, 1.0);
                  if (target) {
                    probe.repair(target);
                  }
                }
              }
            }
          }
        }
      }
      if (probe.memory.isGathering) {
        let source = GetRoomObjects.getClosestActiveSourceDivided(probe);
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
  }

  public static longDistanceCarrierLogic(probe: Probe): void {
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isGathering) {
      if (probe.room.name != probe.memory.remote) {
        probe.goToDifferentRoom(probe.memory.remote);
      } else {
        let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
        if (droppedResource) {
          probe.pickup(droppedResource);
        }
        else {
          let deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, false, probe.carryCapacity - _.sum(probe.carry));
          if (deposit) {
            probe.withdraw(deposit, RESOURCE_ENERGY);
          }
          else {
            let deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, false, 0);
            if (deposit) {
              probe.withdraw(deposit, RESOURCE_ENERGY);
            }
          }
        }
      }
    }
    if (probe.memory.isWorking) {
      if (probe.room.name != probe.memory.homeName) {
        probe.goToDifferentRoom(probe.memory.homeName);
      } else {
        let supply = GetRoomObjects.getStructureToSupplyByRemoteWorkers(probe);
        if (supply) {
          probe.transfer(supply, RESOURCE_ENERGY);
        }
      }
    }
  }

  public static longDistanceBuilderLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      probe.goToDifferentRoom(probe.memory.remote);
    } else {
      if (_.sum(probe.carry) === probe.carryCapacity) {
        probe.memory.isWorking = true;
        probe.memory.isGathering = false;
      }
      if (_.sum(probe.carry) === 0) {
        probe.memory.isWorking = false;
        probe.memory.isGathering = true;
      }

      if (probe.memory.isWorking) {
        let target = GetRoomObjects.getClosestStructureToRepair(probe.pos, 0.4);
        if (target) {
          probe.repair(target);
        }
        else {
          let target = GetRoomObjects.getClosestConstructionSite(probe);
          if (target) {
            probe.build(target);
          }
          else {
            let target = GetRoomObjects.getClosestStructureToRepair(probe.pos, 0.7);
            if (target) {
              probe.repair(target);
            }
            else {
              let target = GetRoomObjects.getClosestStructureToRepair(probe.pos, 1.0);
              if (target) {
                probe.repair(target);
              }
            }
          }
        }
      }
      if (probe.memory.isGathering) {
        let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, 100);
        if (deposit) {
          probe.withdraw(deposit, RESOURCE_ENERGY);
        } else {
          let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
          if (droppedResource) {
            probe.pickup(droppedResource);
          }
          else {
            let source = GetRoomObjects.getClosestActiveSourceDivided(probe);
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
      }
    }
  }

  public static claimerLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      probe.goToDifferentRoom(probe.memory.remote);
    } else {
      let controller = GetRoomObjects.getController(probe);
      if (controller) {
        if (Tasks.getRoomsToClaim().includes(probe.room.name)) {
          probe.claim(controller);
        } else {
          probe.reserve(controller);
        }
      }
    }
  }

  public static soldierLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      probe.goToDifferentRoom(probe.memory.remote);
    } else {
      let enemy = GetRoomObjects.getClosestEnemy(probe);
      if (enemy) {
        probe.attack(enemy);
      }
    }
  }
}
