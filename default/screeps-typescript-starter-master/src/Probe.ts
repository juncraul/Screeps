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
      this.goTo(structure.pos);
    }
    this.memory.targetId = "";
    return result;
  }

  repair(structure: Structure) {
    let result = this.creep.repair(structure);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(structure.pos);
    }
    this.memory.targetId = "";
    return result;
  }

  harvest(source: Source | Mineral) {
    let result = this.creep.harvest(source);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(source.pos);
    }
    this.memory.targetId = source.id;
    return result;
  }

  transfer(target: Creep | Probe | Structure, resourceType: ResourceConstant, amount?: number) {
    let result: ScreepsReturnCode;
    if (target instanceof Probe) {
      result = this.creep.transfer(target.creep, resourceType, amount);
    } else {
      result = this.creep.transfer(target, resourceType, amount);
    }
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(target.pos);
    }
    return result;
  }

  withdraw(target: Tombstone | Structure, resourceType: ResourceConstant, amount?: number) {
    let result = this.creep.withdraw(target, resourceType, amount);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(target.pos);
    }
    return result;
  }

  pickup(resource: Resource) {
    let result = this.creep.pickup(resource);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(resource.pos);
    }
    return result;
  }

  upgradeController(controller: StructureController) {
    let result = this.creep.upgradeController(controller);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(controller.pos);
    }
    this.memory.targetId = controller.id;
    return result;
  }

  reserve(controller: StructureController) {
    let result = this.creep.reserveController(controller);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(controller.pos);
    }
    this.memory.targetId = controller.id;
    return result;
  }

  claim(controller: StructureController) {
    let result = this.creep.claimController(controller);
    console.log(result);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(controller.pos);
    }
    this.memory.targetId = controller.id;
    return result;
  }

  attack(creep: Creep) {
    let result = this.creep.attack(creep);
    if (result == ERR_NOT_IN_RANGE) {
      this.goTo(creep.pos);
    }
    this.memory.targetId = creep.id;
    return result;
  }

  goTo(destination: RoomPosition) {
    return this.creep.moveTo(destination);
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
