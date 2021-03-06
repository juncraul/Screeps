import { Probe } from "Probe";
import { Cannon } from "Cannon";
import { Helper } from "Helper";
import { MemoryManager } from "MemoryManager";
import { profile } from "./Profiler";

@profile
export class GetRoomObjects {
  public static getClosestActiveSourceDivided(probe: Probe, includeMineralDeposit: boolean = false): Mineral | Source | null {
    //let previouslyAssignedTo = Game.getObjectById(probe.memory.targetId);
    //if (previouslyAssignedTo instanceof Mineral && previouslyAssignedTo.mineralAmount > 0) {
    //  return previouslyAssignedTo;
    //} else if (previouslyAssignedTo instanceof Source && previouslyAssignedTo.energy > 0) {
    //  return previouslyAssignedTo;
    //}
    let sources: (Mineral | Source)[]
    sources = GetRoomObjects.getSources(probe.room, true);
    if (includeMineralDeposit) {
      let mineral = GetRoomObjects.getMineral(probe.room, true);
      if (mineral) {
        sources.push(mineral);
      }
    }
    if (sources.length == 0)//TODO: Consider moving the creeps to the closest source that will refresh
      return null;
    let arraySources: number[];
    arraySources = [];
    let minCount = 1000;
    let maxCount = -1000;
    let i = 0;
    let currenctlyMining = -1;
    sources.forEach(function (source) {
      let count = Helper.getCashedMemory("Harvesting-" + source.id, 0);
      minCount = count < minCount ? count : minCount;
      maxCount = count > maxCount ? count : maxCount;
      if (source.id == probe.memory.targetId) {
        currenctlyMining = i;
      }
      i++;
      arraySources.push(count);
    })
    let minIndex = arraySources.indexOf(Math.min(...arraySources));
    arraySources[minIndex] += 100;
    let secondMinIndex = arraySources.indexOf(Math.min(...arraySources));//Get the second minimum index by temporarly seeing the minimum to a high number.
    arraySources[minIndex] -= 100;

    //If we already have the probe assign and no redistribution is need, exit func.
    let previouslyAssignedTo = sources.filter(s => s.id == probe.memory.targetId)[0];
    if (previouslyAssignedTo && maxCount - minCount <= 1) {
      return previouslyAssignedTo;
    }
    else {
      if (previouslyAssignedTo && arraySources[currenctlyMining] == minCount) {//Exit only if this probe already mines the smallest source.
        return previouslyAssignedTo;
      }
    }
    //if (probe.id == "5c5ed1fbaa0b8422e64c9e0f")
    //{
    //  console.log("-------------")
    //  console.log(probe.creep.id);
    //  console.log("sources - " + sources)
    //  console.log("prev ass: " + previouslyAssignedTo);
    //  console.log("max : " + maxCount);
    //  console.log("min : " + minCount);
    //}

    if (minIndex != undefined) {
      //if (probe.id == "5c5ed1fbaa0b8422e64c9e0f")
      //{
      //  console.log("sources - " + sources)
      //  console.log("index 0 - " + sources[0] + " " + arraySources[0])
      //  console.log("index 1 - " + sources[1] + " " + arraySources[1])
      //  console.log("index m - " + sources[minIndex] + " " + arraySources[minIndex])
      //}
      let source: Mineral | Source | null;
      if (arraySources[minIndex] == arraySources[secondMinIndex]) {
        source = probe.pos.findPathTo(sources[minIndex]).length < probe.pos.findPathTo(sources[secondMinIndex]).length ? sources[minIndex] : sources[secondMinIndex];
      } else {
        source = sources[minIndex];
      }
      Helper.incrementCashedMemory("Harvesting-" + probe.memory.targetId, -1);
      Helper.incrementCashedMemory("Harvesting-" + source.id, 1);
      return source;
    } else {
      return null
    }
  }

  public static getSources(room: Room, onlyActive: boolean = false): Source[] {
    let roomMemory = MemoryManager.getRoomMemory(room.name);
    let sources: Source[] = [];
    if (!roomMemory)
      return [];
    for (let sourceIndex in roomMemory.sources) {
      let source = Game.getObjectById(roomMemory.sources[sourceIndex]);
      if (source instanceof Source && (onlyActive ? source.energy > 0 : true)) {
        sources.push(source)
      }
    }
    return sources;
  }

  public static getMineral(room: Room, onlyActive: boolean = false): Mineral | null {
    let mineralExtractor = room.find(FIND_STRUCTURES, { filter: (structure) => { return (structure.structureType === STRUCTURE_EXTRACTOR) } })[0];
    let mineral = room.find(FIND_MINERALS, { filter: mineral => (onlyActive ?  mineral.mineralAmount > 0 : true) })[0];
    if (mineralExtractor && mineral) {
      return mineral;
    } else {
      return null;
    }
  }

  public static getClosestEmptyDeposit(probe: Probe): Structure | null {
    let deposit;
    if (probe.carry[RESOURCE_ENERGY] == 0) {
      deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure => ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_TERMINAL)
          && _.sum(structure.store) < structure.storeCapacity)
      });
    }
    else {
      deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure => (structure.structureType == STRUCTURE_CONTAINER && _.sum(structure.store) < structure.storeCapacity)
          || ((structure.structureType == STRUCTURE_SPAWN ||
            structure.structureType == STRUCTURE_EXTENSION ||
            structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity)
      });
    }
    return deposit;
  }

  public static getClosestFilledDeposit(probe: Probe, excludeControllerDeposit: boolean, excludeStorage: boolean, excludeSpawn: boolean, whenIsMoreThan: number, onlyEnergy: boolean = true): Structure | null {
    let controllerDeposits = GetRoomObjects.getDepositNextToController(probe.room, false);
    let previousDeposit = probe.room.find(FIND_STRUCTURES, {
      filter: structure => structure.id == probe.memory.targetId &&
        ((structure.structureType == STRUCTURE_LINK && structure.energy > whenIsMoreThan) ||
        ((structure.structureType == STRUCTURE_CONTAINER || (!excludeStorage && structure.structureType == STRUCTURE_STORAGE))
            && ((onlyEnergy && structure.store[RESOURCE_ENERGY] > whenIsMoreThan) || (!onlyEnergy && _.sum(structure.store) > whenIsMoreThan))))
    })[0]
    if (previousDeposit) {
      return previousDeposit;
    } else {
      let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure =>
          ((((structure.structureType == STRUCTURE_CONTAINER ||
            (!excludeStorage && structure.structureType == STRUCTURE_STORAGE))
            && ((onlyEnergy && structure.store[RESOURCE_ENERGY] > whenIsMoreThan) || (!onlyEnergy && _.sum(structure.store) > whenIsMoreThan))) ||
            (structure.structureType == STRUCTURE_LINK && structure.energy > whenIsMoreThan))
            && (!excludeControllerDeposit || (excludeControllerDeposit && !controllerDeposits.includes(structure))))
      })
      if (!deposit && !excludeSpawn) {
        deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: structure => structure.structureType == STRUCTURE_SPAWN && structure.energy > whenIsMoreThan
        })
      }
      return deposit;
    }
  }


  public static getController(probeOrRoom: Probe | Room): StructureController | null {
    let roomName: string;
    let roomMemory: RoomMemory;
    let target: any;
    if (probeOrRoom instanceof Probe) {
      roomName = probeOrRoom.room.name;
    }
    else {
      roomName = probeOrRoom.name;
    }
    roomMemory = MemoryManager.getRoomMemory(roomName);
    if (roomMemory) {
      target = Game.getObjectById(roomMemory.controller);
    }
    return target instanceof StructureController ? target : null;
  }

  public static getSpawn(probeOrRoom: Probe | Room): StructureSpawn | null {
    let target: any;
    if (probeOrRoom instanceof Probe) {
      target = probeOrRoom.room.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_SPAWN) })[0];
    }
    else {
      target = probeOrRoom.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_SPAWN) })[0];
    }
    return target instanceof StructureSpawn ? target : null;
  }

  public static getConstructionSiteWithinRange(pos: RoomPosition, structureType: StructureConstant, range: number): ConstructionSite | null {
    let construnctionSite = pos.findInRange(FIND_CONSTRUCTION_SITES, range, { filter: (structure: any) => structure.structureType == structureType })[0];
    return construnctionSite;
  }

  public static getClosestConstructionSite(probe: Probe): ConstructionSite | null {
    let construnctionSite = probe.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    return construnctionSite;
  }

  public static getConstructionSitesFromRoom(room: Room): ConstructionSite[] {
    let construnctionSites = room.find(FIND_CONSTRUCTION_SITES);
    return construnctionSites;
  }

  public static getStructureToSupplyForReproduction(probe: Probe): Structure | null {
    let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => ((
        structure.structureType == STRUCTURE_SPAWN ||
        structure.structureType == STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity)
    });
    return deposit
  }

  public static getTowerToSupply(probe: Probe): Structure | null {
    let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => (
      (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.90))
    });

    return deposit
  }


  public static getStructureDepositToSupply(probe: Probe): Structure | null {
    let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => (
        ((structure.structureType == STRUCTURE_STORAGE ||
          structure.structureType == STRUCTURE_TERMINAL) && _.sum(structure.store) < structure.storeCapacity))
    });

    return deposit
  }

  public static getStructureToSupplyPriority(probe: Probe): Structure | null {
    let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => (
        (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.45)
      )
    });
    return deposit
  }

  public static getStorage(room: Room): StructureStorage | null {
    let deposit = room.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_STORAGE) })[0];
    return deposit instanceof StructureStorage ? deposit : null;
  }

  public static getStructureToSupplyByRemoteWorkers(probe: Probe): Structure | null {
    let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => ((
        structure.structureType == STRUCTURE_SPAWN ||
        structure.structureType == STRUCTURE_EXTENSION ||
        structure.structureType == STRUCTURE_LINK) && structure.energy < structure.energyCapacity) ||
        ((structure.structureType == STRUCTURE_STORAGE ||
          structure.structureType == STRUCTURE_CONTAINER ||
          structure.structureType == STRUCTURE_TERMINAL) && _.sum(structure.store) < structure.storeCapacity) ||
        (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.75)
    });
    return deposit
  }

  public static getDepositNextToController(room: Room, notFilled: boolean): Structure[] {
    if (room.controller == null)
      return [];
    let deposits = room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
      filter: (structure: any) => ((structure.structureType == STRUCTURE_CONTAINER) && (!notFilled || (notFilled && _.sum(structure.store) < structure.storeCapacity * 0.75)))
    });
    return deposits;
  }

  public static getClosestStructureToRepairByPath(pos: RoomPosition, damageProportionForNonWallRamp: number, includeRampartsWalls: boolean = false): Structure | null {
    let structure = pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => (structure.hits < structure.hitsMax * damageProportionForNonWallRamp)
        && (structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
    });
    if (!structure && includeRampartsWalls) {
      for (let i = 0.00001; i < 1 && !structure; i *= 2) {
        structure = pos.findClosestByPath(FIND_STRUCTURES, {
          filter: structure =>
            (structure.structureType != STRUCTURE_RAMPART && structure.hits < structure.hitsMax * i) ||
            (structure.structureType == STRUCTURE_RAMPART && structure.hits < structure.hitsMax * i * 300) //Ramparts are 300 times smaller than wall
        })
      }
    }
    return structure;
  }

  public static getClosestStructureToRepairByRange(pos: RoomPosition, damageProportionForNonWallRamp: number, includeRampartsWalls: boolean = false): Structure | null {
    let structure = pos.findClosestByRange(FIND_STRUCTURES, {
      filter: structure =>
        (structure.structureType == STRUCTURE_RAMPART && structure.hits < 5000) //Just choose low life ramparts first, as they degrade quickly
    })
    if (!structure) {
      structure = pos.findClosestByRange(FIND_STRUCTURES, {
        filter: structure => (structure.hits < structure.hitsMax * damageProportionForNonWallRamp)
          && (structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART)
      });
    }
    if (!structure && includeRampartsWalls) {
      for (let i = 0.00001; i < 1 && !structure; i *= 2) {
        structure = pos.findClosestByRange(FIND_STRUCTURES, {
          filter: structure =>
            (structure.structureType != STRUCTURE_RAMPART && structure.hits < structure.hitsMax * i) ||
            (structure.structureType == STRUCTURE_RAMPART && structure.hits < structure.hitsMax * i * 300) //Ramparts are 300 times smaller than wall
        })
      }
    }
    return structure;
  }

  public static getDroppedResource(pos: RoomPosition): Resource | null {
    let resource = pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (res) => res.amount > 100 });
    return resource;
  }

  public static getClosestTombstone(pos: RoomPosition): Tombstone | null {
    let tombstone = pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: (res) =>
        (res.store[RESOURCE_ENERGY] == _.sum(res.store) && res.store[RESOURCE_ENERGY] > 100) || //If just energy, don't bother if is less than 100
        (res.store[RESOURCE_ENERGY] != _.sum(res.store)) //Collect tomstone if it has minerals
    });
    return tombstone;
  }

  //public static getStorage(pos: RoomPosition): StructureStorage | null{
  //  let structure = pos.findClosestByPath(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_STORAGE });
  //  return structure instanceof StructureStorage ? structure : null;;
  //}

  public static getClosestEnemyByRange(fromThis: RoomPosition, containsBodyPart?: BodyPartConstant): Creep | null {
    if (containsBodyPart) {
      return fromThis.findClosestByRange(FIND_HOSTILE_CREEPS, {
        filter: enemy => enemy.body.find(body => body.type == containsBodyPart) != undefined
      });
    }
    return fromThis.findClosestByRange(FIND_HOSTILE_CREEPS);
  }

  public static getClosestEnemyByPath(fromThis: RoomPosition, containsBodyPart?: BodyPartConstant): Creep | null {
    if (containsBodyPart) {
      return fromThis.findClosestByPath(FIND_HOSTILE_CREEPS, {
        filter: enemy => enemy.body.find(body => body.type == containsBodyPart) != undefined
      });
    }
    return fromThis.findClosestByPath(FIND_HOSTILE_CREEPS);
  }

  public static getEnemy(room: Room): Creep | null {
    return room.find(FIND_HOSTILE_CREEPS)[0];
  }

  public static getClosestDamagedUnit(fromThis: Cannon | Probe): Creep | null {
    let damagedUnit: Creep | null;
    if (fromThis instanceof Cannon) {
      damagedUnit = fromThis.pos.findClosestByRange(FIND_MY_CREEPS, { filter: (creep) => creep.hits < creep.hitsMax })
    } else {
      damagedUnit = fromThis.pos.findClosestByPath(FIND_MY_CREEPS, { filter: (creep) => creep.hits < creep.hitsMax })
    }
    return damagedUnit;
  }

  public static getStructuresInRangeOf(roomPosition: RoomPosition, structureToLookFor: StructureConstant, range: number): Structure[] {
    let structures = roomPosition.findInRange(FIND_STRUCTURES, range);
    let structuresFiltered: Structure[];
    structuresFiltered = [];
    structures.forEach(function (structure) {
      if (structure.structureType == structureToLookFor) {
        structuresFiltered.push(structure);
      }
    })
    return structuresFiltered;
  }

  public static getTerminalFromRoom(room: Room): StructureTerminal | null {
    let structure = room.find(FIND_MY_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_TERMINAL })[0];
    if (structure instanceof StructureTerminal) {
      return structure;
    }
    return null;
  }


  public static getLabs(room: Room): StructureLab[] {
    let structures = room.find(FIND_MY_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_LAB });
    let labs: StructureLab[] = [];
    for (let i in structures) {
      let lab = structures[i];
      if (lab instanceof StructureLab) {
        labs.push(lab)
      }
    }
    return labs;
  }
}
