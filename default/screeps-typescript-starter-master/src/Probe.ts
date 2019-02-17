import { PathLogic } from "PathLogic";
import { profile } from "./Profiler";

@profile
export class Probe {
  creep: Creep; 						// The creep that this wrapper class will control
  body: BodyPartDefinition[];    	 	// These properties are all wrapped from this.creep.* to this.*
  carry: StoreDefinition;				// |
  carryCapacity: number;				// |
  fatigue: number;					// |
  hits: number;						// |
  hitsMax: number;					// |
  id: string;							// |
  memory: CreepMemory;				// | See the ICreepMemory interface for structure
  // my: boolean;						// |
  name: string;						// |
  // owner: Owner; 						// |
  pos: RoomPosition;					// |
  //ref: string;						// |
  //roleName: string;					// |
  room: Room;							// |
  saying: string;						// |
  spawning: boolean;					// |
  ticksToLive: number | undefined;	// |
  //lifetime: number;
  actionLog: { [actionName: string]: boolean }; // Tracks the actions that a creep has completed this tick
  blockMovement: boolean; 			// Whether the zerg is allowed to move or not
  // settings: any;					// Adjustable settings object, can vary across roles
  //private _task: Task | null; 		// Cached Task object that is instantiated once per tick and on change

  constructor(creep: Creep) {
    this.creep = creep;
    this.body = creep.body;
    this.carry = creep.carry;
    this.carryCapacity = creep.carryCapacity;
    this.fatigue = creep.fatigue;
    this.hits = creep.hits;
    this.hitsMax = creep.hitsMax;
    this.id = creep.id;
    this.memory = creep.memory;
    // this.my = creep.my;
    this.name = creep.name;
    // this.owner = creep.owner;
    this.pos = creep.pos;
    //this.ref = creep.ref;
    //this.roleName = creep.memory.role;
    this.room = creep.room;
    this.saying = creep.saying;
    this.spawning = creep.spawning;
    this.ticksToLive = creep.ticksToLive;
    //this.lifetime = this.getBodyparts(CLAIM) > 0 ? CREEP_CLAIM_LIFE_TIME : CREEP_LIFE_TIME;
    this.actionLog = {};
    this.blockMovement = false;
    // this.settings = {};
    //Game.zerg[this.name] = this; // register global reference
  }

  build(structure: ConstructionSite) {
    let result = this.creep.build(structure);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(structure.pos)
      } else {
        this.goTo(structure.pos);
      }
    }
    this.memory.targetId = structure.id;
    return result;
  }

  repair(structure: Structure) {
    let result = this.creep.repair(structure);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(structure.pos)
      } else {
        this.goTo(structure.pos);
      }
    }
    this.memory.targetId = structure.id;
    return result;
  }

  harvest(source: Source | Mineral) {//Don't think will ever have the creep's internal cooldown longer than EXTRACTOR_COOLDOWN
    let cooldownTime = source instanceof Mineral ? EXTRACTOR_COOLDOWN : (this.creep.memory.harvestCooldownXTicks ? this.creep.memory.harvestCooldownXTicks : 0);
    if (this.creep.memory.lastHarvestTick) {
      if (this.creep.memory.lastHarvestTick + cooldownTime >= Game.time) {
        this.memory.targetId = source.id;
        return -100;
      }
    }

    let result = this.creep.harvest(source);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(source.pos)
      } else {
        this.goTo(source.pos);
      }
    } else {
      this.creep.memory.lastHarvestTick = Game.time;
    }
    this.memory.targetId = source.id;
    return result;
  }
  
  transfer(target: Creep | Probe | Structure, resourceType: ResourceConstant, amount?: number) {
    let result: ScreepsReturnCode;
    if (target instanceof Probe) {
      if (amount) {
          result = this.creep.transfer(target.creep, resourceType, this.carry[resourceType]! < amount ? this.carry[resourceType]! : amount);
      }
      else {
        result = this.creep.transfer(target.creep, resourceType);
      }
    } else {
      if (amount) {
        result = this.creep.transfer(target, resourceType, this.carry[resourceType]! < amount ? this.carry[resourceType]! : amount);
      }
      else {
        result = this.creep.transfer(target, resourceType);
      }
    }
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(target.pos)
      } else {
        this.goTo(target.pos);
      }
    }
    return result;
  }

  transferAll(target: Creep | Probe | Structure) {
    let result: ScreepsReturnCode;
    result = ERR_NOT_ENOUGH_RESOURCES;
    for (let resourceType in this.carry) {
      if (this.carry[<ResourceConstant>resourceType]! == 0)
        continue;
      if (target instanceof Probe) {
        result = this.creep.transfer(target.creep, <ResourceConstant>resourceType);
      } else {
        result = this.creep.transfer(target, <ResourceConstant>resourceType);
      }
    }
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(target.pos)
      } else {
        this.goTo(target.pos);
      }
    }
    return result;
  }

  withdraw(target: Tombstone | Structure, resourceType: ResourceConstant, amount?: number) {
    let result;
    if (amount) {
      let freeSpace = this.carryCapacity - _.sum(this.carry);
      result = this.creep.withdraw(target, resourceType, freeSpace < amount ? freeSpace : amount);
    }
    else {
      result = this.creep.withdraw(target, resourceType);
    }
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(target.pos)
      } else {
        this.goTo(target.pos);
      }
    }
    return result;
  }

  withdrawAll(target: Tombstone | Structure) {
    let result: ScreepsReturnCode;
    result = ERR_NOT_ENOUGH_RESOURCES;
    if (target instanceof StructureLink) {
      result = this.creep.withdraw(target, RESOURCE_ENERGY);
    }
    else if (target instanceof StructureLab) {
      result = this.creep.withdraw(target, <ResourceConstant>target.mineralType);
    }
    else if (target instanceof Tombstone || target instanceof StructureContainer || target instanceof StructureStorage || target instanceof StructureTerminal) {
      for (let resourceType in target.store) {
        result = this.creep.withdraw(target, <ResourceConstant>resourceType);
      }
    }
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(target.pos)
      } else {
        this.goTo(target.pos);
      }
    }
    return result;
  }

  pickup(resource: Resource) {
    let result = this.creep.pickup(resource);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(resource.pos)
      } else {
        this.goTo(resource.pos);
      }
    }
    return result;
  }

  upgradeController(controller: StructureController) {
    let result = this.creep.upgradeController(controller);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(controller.pos)
      } else {
        this.goTo(controller.pos);
      }
    }
    this.memory.targetId = controller.id;
    return result;
  }

  reserve(controller: StructureController) {
    let result = this.creep.reserveController(controller);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(controller.pos)
      } else {
        this.goTo(controller.pos);
      }
    }
    this.memory.targetId = controller.id;
    return result;
  }

  claim(controller: StructureController) {
    let result = this.creep.claimController(controller);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(controller.pos)
      } else {
        this.goTo(controller.pos);
      }
    }
    this.memory.targetId = controller.id;
    return result;
  }

  attack(creep: Creep | Structure) {
    let result = this.creep.attack(creep);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(creep.pos)
      } else {
        this.goTo(creep.pos);
      }
    }
    this.memory.targetId = creep.id;
    return result;
  }
  
  rangedAttack(creep: Creep | Structure) {
    let result = this.creep.rangedAttack(creep);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(creep.pos)
      } else {
        this.goTo(creep.pos);
      }
    }
    this.memory.targetId = creep.id;
    return result;
  }

  heal(creep: Creep) {
    let result = this.creep.heal(creep);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(creep.pos)
      } else {
        this.goTo(creep.pos);
      }
    }
    this.memory.targetId = creep.id;
    return result;
  }

  rangedHeal(creep: Creep) {
    let result = this.creep.rangedHeal(creep);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(creep.pos)
      } else {
        this.goTo(creep.pos);
      }
    }
    this.memory.targetId = creep.id;
    return result;
  }

  sign(controller: StructureController, text: string) {
    let result = this.creep.signController(controller, text);
    if (result == ERR_NOT_IN_RANGE) {
      if (this.memory.useCashedPath) {
        this.goToCashed(controller.pos)
      } else {
        this.goTo(controller.pos);
      }
    }
    this.memory.targetId = controller.id;
    return result;
  }

  goTo(destination: RoomPosition, strokeColor: string = "") {
    if (strokeColor != "") {
      return this.creep.moveTo(destination, { reusePath: 10, visualizePathStyle: { stroke: strokeColor } });
    }
    else {
      return this.creep.moveTo(destination);
    }
  };

  goToCashed(destination: RoomPosition) {
    let creepGotStuck = JSON.stringify(this.creep.memory.previousPosition) == JSON.stringify(this.creep.pos);
    if (!this.creep.memory.path || creepGotStuck) {
      this.creep.memory.path = PathLogic.getPath(this.creep.pos, destination, creepGotStuck);
    }
    this.creep.memory.previousPosition = this.creep.pos;
    return this.creep.moveByPath(this.creep.memory.path);
  };

  goToDifferentRoom(destination: string) {
    return this.creep.moveTo(new RoomPosition(25, 25, destination));
  }

  static getActiveBodyPartsFromArrayOfProbes(probes: Probe[], bodyPart: BodyPartConstant) {
  var bodyParts = 0;
    for (var i = 0; i < probes.length; i++) {
      bodyParts += probes[i].creep.getActiveBodyparts(bodyPart);
  }
  return bodyParts;
}
}
