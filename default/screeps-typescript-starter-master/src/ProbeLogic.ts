import { Probe } from "Probe";
import { Tasks } from "Tasks";
import { GetRoomObjects } from "GetRoomObjects";
import { MY_SIGNATURE } from "Constants";
import { Profiler } from "Profiler";

export class ProbeLogic {

  public static harvesterLogic(probe: Probe): void {
    Profiler.start("harvesterLogic");
    if (_.sum(probe.carry) === probe.carryCapacity && probe.carryCapacity != 0) {
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
    Profiler.end("harvesterLogic");
  }

  public static upgraderLogic(probe: Probe): void {
    Profiler.start("upgraderLogic");
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
    }

    if (probe.memory.isWorking) {
      let controller = GetRoomObjects.getController(probe);
      if (controller) {
        if (Game.time % 1000 == 0) {
          probe.sign(controller, MY_SIGNATURE);
        }
        probe.upgradeController(controller);
      }
    }
    if (probe.memory.isGathering) {
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, false, 300);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
      } else {
        let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
        if (droppedResource) {
          probe.pickup(droppedResource);
        }
        else {
          //Don't allow upgrader to harvest
          //let source = GetRoomObjects.getClosestActiveSourceDivided(probe);
          //if (source) {
          //  let containerNextToSource = GetRoomObjects.getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
          //  if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          //    if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
          //      probe.goTo(containerNextToSource.pos);
          //    }
          //  } else {
          //    probe.harvest(source);
          //  }
          //}
        }
      }
    }
    Profiler.end("upgraderLogic");
  }

  public static builderLogic(probe: Probe): void {
    Profiler.start("builderLogic");
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
      probe.memory.targetId = "";//After a refill probe can choose a different target
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
      probe.memory.targetId = "";//When gathering it can also go for harvest, so empty targetid to don't mess with harvesting logic.
    }

    if (probe.memory.isWorking) {
      if (probe.memory.targetId != "") {
        let targ = Game.getObjectById(probe.memory.targetId);
        if (targ instanceof ConstructionSite) {
          probe.build(targ);
        } else {
          probe.memory.targetId = "";//TODO: Kinda going to loose a tick redo this somehow
        }
      }
      else {
        let target = GetRoomObjects.getClosestConstructionSite(probe);
        if (target) {
          probe.build(target);
        }
        else {
          let targetRepair = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.9);
          if (targetRepair) {
            probe.repair(targetRepair);
          }
        }
      }
    }
    if (probe.memory.isGathering) {
      let allowToGetAbove = 300;
      let controller = GetRoomObjects.getController(probe.room);
      if (controller && controller.level < 3)
        allowToGetAbove = 200;//We are at the beginning allow to take from smaller deposits
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, false, allowToGetAbove);
      if (deposit) {
        probe.withdraw(deposit, RESOURCE_ENERGY);
      } else {
        let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
        if (droppedResource) {
          probe.pickup(droppedResource);
        }
        else {
          //Don't allow builder to harvest
          //let source = GetRoomObjects.getClosestActiveSourceDivided(probe);
          //if (source) {
          //  let containerNextToSource = GetRoomObjects.getStructuresInRangeOf(source.pos, STRUCTURE_CONTAINER, 1)[0];
          //  if (containerNextToSource && containerNextToSource.pos.lookFor(LOOK_CREEPS).length == 0) {
          //    if (JSON.stringify(probe.pos) != JSON.stringify(containerNextToSource.pos)) {
          //      probe.goTo(containerNextToSource.pos);
          //    }
          //  } else {
          //    probe.harvest(source);
          //  }
          //}
        }
      }
    }
    Profiler.end("builderLogic");
  }

  public static carrierLogic(probe: Probe): void {
    Profiler.start("carrierLogic");
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
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, true, true, 200, false);
      if (!Game.flags["WAR"] && !deposit) {
        deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, false, true, 200, false);//If at war, pick up from storage as well
      } 
      if (deposit) {
        probe.withdrawAll(deposit);
      } else {
        let droppedResource = GetRoomObjects.getDroppedResource(probe.pos);
        if (droppedResource) {
          probe.pickup(droppedResource);
        }
        else {
          deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, true, false, 200, false);
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
    Profiler.end("carrierLogic");
  }

  public static repairerLogic(probe: Probe): void {
    Profiler.start("repairerLogic");
    if (_.sum(probe.carry) === probe.carryCapacity) {
      probe.memory.isWorking = true;
      probe.memory.isGathering = false;
      probe.memory.targetId = "";//After a refill probe can choose a different target
    }
    if (_.sum(probe.carry) === 0) {
      probe.memory.isWorking = false;
      probe.memory.isGathering = true;
      probe.memory.targetId = "";//When gathering it can also go for harvest, so empty targetid to don't mess with harvesting logic.
    }

    if (probe.memory.isWorking) {
      if (probe.memory.targetId != "") {
        let targ = Game.getObjectById(probe.memory.targetId);
        if (targ instanceof Structure && targ.hits != targ.hitsMax) {
          probe.repair(targ);
        } else {
          probe.memory.targetId = "";//TODO: Kinda going to loose a tick redo this somehow
        }
      }
      else {
        let target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.8);
        if (target) {
          probe.repair(target);
        } else {
          target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.9, true);
          if (target) {
            probe.repair(target);
          }
        }
      }
    }
    if (probe.memory.isGathering) {
      let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, false, 300);
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
    Profiler.end("repairerLogic");
  }

  public static longDistanceHarvesterLogic(probe: Probe): void {
    Profiler.start("longDistanceHarvesterLogic");
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote);
    }
    else {
      if (_.sum(probe.carry) === probe.carryCapacity && probe.carryCapacity != 0) {
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
            let target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.4);
            if (target) {
              probe.repair(target);
            }
            else {
              let target = GetRoomObjects.getClosestConstructionSite(probe);
              if (target) {
                probe.build(target);
              }
              else {
                let target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.7);
                if (target) {
                  probe.repair(target);
                }
                else {
                  let target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 1.0);
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
    Profiler.end("longDistanceHarvesterLogic");
  }

  public static longDistanceCarrierLogic(probe: Probe): void {
    Profiler.start("longDistanceCarrierLogic");
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
          let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, false, false, probe.carryCapacity - _.sum(probe.carry));
          if (deposit) {
            probe.withdraw(deposit, RESOURCE_ENERGY);
          }
          else {
            let deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, false, false, 0);
            if (deposit) {
              probe.withdraw(deposit, RESOURCE_ENERGY);
            }
          }
        }
      }
    }
    if (probe.memory.isWorking) {
      if (probe.room.name != probe.memory.homeName) {
        ProbeLogic.goToRemoteRoom(probe, probe.memory.homeName);
      }
      else {
        let supply = GetRoomObjects.getStructureToSupplyByRemoteWorkers(probe);
        if (supply) {
          probe.transfer(supply, RESOURCE_ENERGY);
        }
      }
    }
    Profiler.end("longDistanceCarrierLogic");
  }

  public static longDistanceBuilderLogic(probe: Probe): void {
    Profiler.start("longDistanceBuilderLogic");
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote);
    }
    else {
      if (_.sum(probe.carry) === probe.carryCapacity) {
        probe.memory.isWorking = true;
        probe.memory.isGathering = false;
        probe.memory.targetId = "";//After a refill probe can choose a different target
      }
      if (_.sum(probe.carry) === 0) {
        probe.memory.isWorking = false;
        probe.memory.isGathering = true;
        probe.memory.targetId = "";//When gathering it can also go for harvest, so empty targetid to don't mess with harvesting logic.
      }

      if (probe.memory.isWorking) {
        if (probe.memory.targetId != "") {
          let targ = Game.getObjectById(probe.memory.targetId);
          if (targ instanceof Structure && targ.hits != targ.hitsMax) {
            probe.repair(targ);
          } else if (targ instanceof ConstructionSite) {
            probe.build(targ);
          } else {
            probe.memory.targetId = "";//TODO: Kinda going to loose a tick redo this somehow
          }
        }
        else {
          let target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.4);
          if (target) {
            probe.repair(target);
          }
          else {
            let target = GetRoomObjects.getClosestConstructionSite(probe);
            if (target) {
              probe.build(target);
            }
            else {
              let target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.6);
              if (target) {
                probe.repair(target);
              }
              else {
                let target = GetRoomObjects.getClosestStructureToRepairByPath(probe.pos, 0.8, true);
                if (target) {
                  probe.repair(target);
                }
              }
            }
          }
        }
      }
      if (probe.memory.isGathering) {
        let deposit = GetRoomObjects.getClosestFilledDeposit(probe, false, true, false, 100);
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
    Profiler.end("longDistanceBuilderLogic");
  }

  public static claimerLogic(probe: Probe): void {
    Profiler.start("claimerLogic");
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote);
    }
    else {
      let controller = GetRoomObjects.getController(probe);
      if (controller) {
        if (Game.time % 1000 == 0) {
          probe.sign(controller, MY_SIGNATURE);
        }
        if (Tasks.getRoomsToClaim().includes(probe.room.name)) {
          probe.claim(controller);
        } else {
          probe.reserve(controller);
        }
      }
    }
    Profiler.end("claimerLogic");
  }

  public static soldierLogic(probe: Probe): void {
    Profiler.start("soldierLogic");
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote);
    }
    else {
      let enemy = GetRoomObjects.getClosestEnemy(probe);
      if (enemy) {
        probe.attack(enemy);
      }
    }
    Profiler.end("soldierLogic");
  }

  public static armyAttackerLogic(probe: Probe): void {
    Profiler.start("armyAttackerLogic");
    var flagToAttachFrom = Game.flags["WAR"];
    if (!flagToAttachFrom) {
      flagToAttachFrom = Game.flags["WAR Over"];//This flag is used just here, it is not used for reproduction
    }
    if (!flagToAttachFrom)
      return;

    if (flagToAttachFrom == null) {
      return;
    }

    var roomToAttack = flagToAttachFrom.pos;
    if (roomToAttack != null) {
      if (probe.room.name != roomToAttack.roomName) {
        probe.creep.moveTo(roomToAttack);
        return;
      }
      else {
        const targetCreepsFromFlag = flagToAttachFrom.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
        const targetStructuresFromFlag = flagToAttachFrom.pos.findInRange(FIND_HOSTILE_STRUCTURES, 1);
        const targetCreeps = targetCreepsFromFlag.length == 0 ? probe.pos.findClosestByPath(FIND_HOSTILE_CREEPS) : targetCreepsFromFlag[0];
        const targetStructures = targetStructuresFromFlag.length == 0 ? probe.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES) : targetStructuresFromFlag[0];
        if (targetCreeps && targetCreeps.pos.x != 0 && targetCreeps.pos.y != 0 && targetCreeps.pos.x != 49 && targetCreeps.pos.y != 49) {
          if (probe.attack(targetCreeps) == ERR_NOT_IN_RANGE) {
            probe.creep.moveTo(targetCreeps, { visualizePathStyle: { stroke: '#ff0000' } });
          }
          if (probe.creep.rangedAttack(targetCreeps) == ERR_NOT_IN_RANGE) {
            probe.creep.moveTo(targetCreeps, { visualizePathStyle: { stroke: '#ff0000' } });
          }
        } else if (targetStructures) {
          if (probe.attack(targetStructures) == ERR_NOT_IN_RANGE) {//This quite not work, have to analyze it, probes still targeted other creeps
            probe.creep.moveTo(targetStructures, { visualizePathStyle: { stroke: '#ff0000' } });
          }
          if (probe.creep.rangedAttack(targetStructures) == ERR_NOT_IN_RANGE) {
            probe.creep.moveTo(targetStructures, { visualizePathStyle: { stroke: '#ff0000' } });
          }
        }
        else {
          probe.creep.moveTo(flagToAttachFrom, { visualizePathStyle: { stroke: '#ff0000' } });
        }
      }
    }
    Profiler.end("armyAttackerLogic");
  }

  public static armyHealerLogic(probe: Probe): void {
    Profiler.start("armyHealerLogic");
    //if (probe.pos.y < 35 && probe.pos.roomName == "E32N46")
    //  return;
    var flagToAttachFrom = Game.flags["WAR"];
    if (!flagToAttachFrom) {
      flagToAttachFrom = Game.flags["WAR Over"];//This flag is used just here, it is not used for reproduction
    }
    if (!flagToAttachFrom)
      return;

    var roomToAttack = flagToAttachFrom.pos;

    if (roomToAttack != null) {
      if (probe.room.name != roomToAttack.roomName) {
        probe.creep.moveTo(roomToAttack);
        return;
      }
      else {
        var wondedCreep = probe.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function (object) { return object.hits < object.hitsMax } });

        if (wondedCreep && wondedCreep.pos.x != 0 && wondedCreep.pos.y != 0 && wondedCreep.pos.x != 49 && wondedCreep.pos.y != 49) {
          if (probe.creep.heal(wondedCreep) == ERR_NOT_IN_RANGE) {
            probe.creep.rangedHeal(wondedCreep)
            probe.creep.moveTo(wondedCreep, { visualizePathStyle: { stroke: '#00ff00' } });
          }
        }
        else {
          probe.creep.moveTo(flagToAttachFrom, { visualizePathStyle: { stroke: '#00ff00' } });
        }
      }
    }
    Profiler.end("armyHealerLogic");
  }

  public static decoyLogic(probe: Probe): void {
    Profiler.start("decoy");
    var flagDecoy = Game.flags["Decoy"];
    if (!flagDecoy)
      return;
    if (probe.room.name != flagDecoy.pos.roomName) {
      ProbeLogic.goToRemoteRoom(probe, flagDecoy.pos.roomName);
    }
    else {
        probe.goToCashed(flagDecoy.pos);
    }
    Profiler.end("decoy");
  }

  private static goToRemoteRoom(probe: Probe, roomName: string) {
    let path = Tasks.getFarAwayRoomPath(roomName);
    if (path.length == 0) {
      probe.goToDifferentRoom(roomName);
    } else {
      let foundCurrentRoom = false;
      for (let currenRoomIndex in path) {
        if (foundCurrentRoom) {
          probe.goToDifferentRoom(path[currenRoomIndex]);
          break;
        }
        if (path[currenRoomIndex] == probe.room.name) {
          foundCurrentRoom = true;
        }
      }
    }
  }
}
