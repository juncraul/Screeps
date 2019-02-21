import { Probe } from "Probe";
import { Tasks } from "Tasks";
import { GetRoomObjects } from "GetRoomObjects";
import { MY_SIGNATURE, TERMINAL_MIN_ENERGY, TERMINAL_MAX_ENERGY, TERMINAL_MIN_MINERAL, TERMINAL_MAX_MINERAL, FlagName } from "Constants";
import { profile } from "./Profiler";
import { TradeHub } from "TradeHub";
import { Laboratory } from "Laboratory";

@profile
export class ProbeLogic {

  public static harvesterLogic(probe: Probe): void {
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
  }

  public static builderLogic(probe: Probe): void {
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
            let towerToSupply = GetRoomObjects.getTowerToSupply(probe);
            if (towerToSupply && probe.carry[RESOURCE_ENERGY] > 0) {
              probe.transfer(towerToSupply, RESOURCE_ENERGY);
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
    }
    if (probe.memory.isGathering) {
      let tombstone = GetRoomObjects.getClosestTombstone(probe.pos);
      if (tombstone) {
        probe.withdrawAll(tombstone);
      }
      else {
        let deposit = GetRoomObjects.getClosestFilledDeposit(probe, true, true, true, 200, false);
        if (!Game.flags[FlagName.WAR] && !deposit) {
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
    }
  }

  public static repairerLogic(probe: Probe): void {
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
  }

  public static longDistanceHarvesterLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote!); //TODO: We assume we always have remote here
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
        probe.goToDifferentRoom(probe.memory.remote!); //TODO: We assume we always have remote here
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
  }

  public static longDistanceBuilderLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote!); //TODO: We assume we always have remote here
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
  }

  public static claimerLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote!); //TODO: We assume we always have remote here
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
  }

  public static soldierLogic(probe: Probe): void {
    if (probe.room.name != probe.memory.remote) {
      ProbeLogic.goToRemoteRoom(probe, probe.memory.remote!); //TODO: We assume we always have remote here
    }
    else {
      let enemy = GetRoomObjects.getClosestEnemy(probe);
      if (enemy) {
        probe.attack(enemy);
      }
    }
  }

  public static armyAttackerLogic(probe: Probe): void {
    var flagToAttachFrom = Game.flags[FlagName.WAR];
    if (!flagToAttachFrom)
      return;

    if (flagToAttachFrom == null) {
      return;
    }

    var roomToAttack = flagToAttachFrom.pos;
    if (roomToAttack != null) {
      if (probe.room.name != roomToAttack.roomName) {
        probe.goTo(roomToAttack);
        return;
      }
      else {
        const targetCreepsFromFlag = flagToAttachFrom.pos.findInRange(FIND_HOSTILE_CREEPS, 1);
        const targetStructuresFromFlag = flagToAttachFrom.pos.findInRange(FIND_HOSTILE_STRUCTURES, 1);
        const targetCreeps = targetCreepsFromFlag.length == 0 ? probe.pos.findClosestByPath(FIND_HOSTILE_CREEPS) : targetCreepsFromFlag[0];
        const targetStructures = targetStructuresFromFlag.length == 0 ? probe.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES) : targetStructuresFromFlag[0];
        if (targetCreeps && targetCreeps.pos.x != 0 && targetCreeps.pos.y != 0 && targetCreeps.pos.x != 49 && targetCreeps.pos.y != 49) {
          if (probe.attack(targetCreeps) == ERR_NOT_IN_RANGE) {
            probe.goTo(targetCreeps.pos, '#ff0000');
          }
          if (probe.rangedAttack(targetCreeps) == ERR_NOT_IN_RANGE) {
            probe.goTo(targetCreeps.pos, '#ff0000');
          }
        } else if (targetStructures) {
          if (probe.attack(targetStructures) == ERR_NOT_IN_RANGE) {//This quite not work, have to analyze it, probes still targeted other creeps
            probe.goTo(targetStructures.pos, '#ff0000');
          }
          if (probe.rangedAttack(targetStructures) == ERR_NOT_IN_RANGE) {
            probe.goTo(targetStructures.pos, '#ff0000');
          }
        }
        else {
          probe.goTo(flagToAttachFrom.pos, '#ff0000');
        }
      }
    }
  }

  public static armyHealerLogic(probe: Probe): void {
    var flagToAttachFrom = Game.flags[FlagName.WAR];
    if (!flagToAttachFrom)
      return;

    var roomToAttack = flagToAttachFrom.pos;

    if (roomToAttack != null) {
      if (probe.room.name != roomToAttack.roomName) {
        probe.goTo(roomToAttack);
        return;
      }
      else {
        var wondedCreep = probe.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function (object) { return object.hits < object.hitsMax } });

        if (wondedCreep && wondedCreep.pos.x != 0 && wondedCreep.pos.y != 0 && wondedCreep.pos.x != 49 && wondedCreep.pos.y != 49) {
          if (probe.heal(wondedCreep) == ERR_NOT_IN_RANGE) {
            probe.rangedHeal(wondedCreep)
            probe.goTo(wondedCreep.pos, '#00ff00');
          }
        }
        else {
          probe.goTo(flagToAttachFrom.pos, '#00ff00');
        }
      }
    }
  }

  public static decoyLogic(probe: Probe): void {
    var flagDecoy = Game.flags["Decoy"];
    if (!flagDecoy)
      return;
    if (probe.room.name != flagDecoy.pos.roomName) {
      ProbeLogic.goToRemoteRoom(probe, flagDecoy.pos.roomName);
    }
    else {
        probe.goToCashed(flagDecoy.pos);
    }
  }

  public static merchantLogic(probe: Probe, tradeHub: TradeHub, laboratory: Laboratory | null): void {
    let storage = GetRoomObjects.getStorage(probe);
    if (!storage || !tradeHub)
      return;

    //TODO: External stuff can cause the poor merchant to get stuck on a task
    let resourceMovementTask: ResourceMovementTask | undefined | null = probe.memory.resourceMovementTask;

    if (!resourceMovementTask && laboratory) {
      resourceMovementTask = laboratory.getLaboratoryJob(tradeHub)
    }
    if (!resourceMovementTask) {
      resourceMovementTask = probe.memory.resourceMovementTask ? probe.memory.resourceMovementTask : this.getResourceMovementTask(probe);
    }

    if (resourceMovementTask) {
      probe.memory.resourceMovementTask = resourceMovementTask;
      let structureFrom: StructureStorage | StructureTerminal | StructureLab | null = Game.getObjectById(resourceMovementTask.fromId);
      let structureTo: StructureStorage | StructureTerminal | StructureLab | null = Game.getObjectById(resourceMovementTask.toId);
      if (structureFrom && structureTo && structureFrom instanceof Structure && structureTo instanceof Structure) {
        if (_.sum(probe.carry) > 0 && !probe.memory.resourceMovementTask.pickedUp) {//If we didn't pick up material from task but we have something, then empty in storage
          probe.transferAll(storage);
        }
        else if (!probe.memory.resourceMovementTask.pickedUp) {//After we cleaned up we are ready to start the task
          let amountFrom: number;
          if (structureFrom instanceof StructureLab) {
            amountFrom = structureFrom.mineralAmount;
          } else {
            amountFrom = structureFrom.store[resourceMovementTask.mineralType] ? structureFrom.store[resourceMovementTask.mineralType]! : 0
          }
          let amount = amountFrom < resourceMovementTask.amount ? amountFrom : resourceMovementTask.amount;
          if (probe.withdraw(structureFrom, resourceMovementTask.mineralType, amount) == OK) {
            probe.memory.resourceMovementTask.pickedUp = true;
          }
        }
        else {//Now move the resource to complete the task
          if (probe.transfer(structureTo, resourceMovementTask.mineralType, resourceMovementTask.amount) == OK) {
            probe.memory.resourceMovementTask = undefined;
          }
        }
      }
    }
    else {
      let labs = GetRoomObjects.getLabs(probe.room).filter(a => a.energy < a.energyCapacity);//Check for labs that need energy refill
      if (labs.length != 0) {
        if (_.sum(probe.carry) == probe.carry[RESOURCE_ENERGY]) {
          if (_.sum(probe.carry) != probe.carryCapacity) {
            let terminal = GetRoomObjects.getTerminalFromRoom(probe.room);
            if (terminal) {
              probe.withdraw(terminal, RESOURCE_ENERGY);
            }
          }
          else {
            probe.transfer(labs[0], RESOURCE_ENERGY);
          }
        }
        else {
          if (_.sum(probe.carry) > 0) {
            let terminal = GetRoomObjects.getTerminalFromRoom(probe.room);
            if (terminal) {
              probe.transferAll(terminal);
            }
          }
        }
      }
    }
  }
  
  private static getResourceMovementTask(probe: Probe): ResourceMovementTask | null {
    let storage = GetRoomObjects.getStorage(probe);
    let terminal = GetRoomObjects.getTerminalFromRoom(probe.room);
    if (!storage || !terminal)
      return null;
    //console.log("-------")
    for (let i in terminal.store) {
      //console.log(i + " " + terminal.store[<ResourceConstant>i] + " " + storage.store[<ResourceConstant>i]);
      if (i == RESOURCE_ENERGY) {
        if (terminal.store[<ResourceConstant>i]! > TERMINAL_MAX_ENERGY) {
          return { amount: terminal.store[<ResourceConstant>i]! - TERMINAL_MAX_ENERGY, fromId: terminal.id, toId: storage.id, mineralType: <ResourceConstant>i, pickedUp: false }
        }
      } else if (terminal.store[<ResourceConstant>i]! > TERMINAL_MAX_MINERAL) {
        return { amount: terminal.store[<ResourceConstant>i]! - TERMINAL_MAX_MINERAL, fromId: terminal.id, toId: storage.id, mineralType: <ResourceConstant>i, pickedUp: false }
      }
    }
    //console.log("--")
    for (let i in storage.store) {
      //console.log(i + " " + terminal.store[<ResourceConstant>i] + " " + storage.store[<ResourceConstant>i]);
      let resTerminal = terminal.store[<ResourceConstant>i] ? terminal.store[<ResourceConstant>i]! : 0;
      if (i == RESOURCE_ENERGY) {
        if (resTerminal < TERMINAL_MIN_ENERGY && storage.store[RESOURCE_ENERGY] > 0) {
          return { amount: TERMINAL_MIN_ENERGY - resTerminal, fromId: storage.id, toId: terminal.id, mineralType: <ResourceConstant>i, pickedUp: false }
        }
      } else if (resTerminal < TERMINAL_MIN_MINERAL) {
        return { amount: TERMINAL_MIN_MINERAL - resTerminal, fromId: storage.id, toId: terminal.id, mineralType: <ResourceConstant>i, pickedUp: false }
      }
    }
    return null;
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
