import { Probe } from "Probe";
import { Cannon } from "Cannon";
import { Helper } from "Helper";

export class GetRoomObjects {
  public static getClosestActiveSourceDivided(probe: Probe, includeMineralDeposit: boolean = false): Mineral | Source | null {
    let sources: (Mineral | Source)[]
    sources = probe.room.find(FIND_SOURCES_ACTIVE);
    if (includeMineralDeposit) {
      let mineral = GetRoomObjects.getAvailableMineral(probe.room);
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

  public static getAvailableMineral(room: Room): Mineral | null {
    let mineralExtractor = room.find(FIND_STRUCTURES, { filter: (structure) => { return (structure.structureType === STRUCTURE_EXTRACTOR) } })[0];
    let mineral = room.find(FIND_MINERALS, { filter: mineral => mineral.mineralAmount > 0 })[0];
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
          ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE)
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
    let target: any;
    if (probeOrRoom instanceof Probe) {
      let targetId = Helper.getCashedMemory("Controller-" + probeOrRoom.room.name, null)
      if (!targetId) {
        target = probeOrRoom.room.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) })[0];
        Helper.setCashedMemory("Controller-" + probeOrRoom.room.name, target.id)
      } else {
        target = Game.getObjectById(targetId);
      }
    }
    else {
      let targetId = Helper.getCashedMemory("Controller-" + probeOrRoom.name, null)
      if (!targetId) {
        target = probeOrRoom.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) })[0];
        Helper.setCashedMemory("Controller-" + probeOrRoom.name, target.id)
      } else {
        target = Game.getObjectById(targetId);
      }
    }
    return target instanceof StructureController ? target : null;
  }

  public static getSpawn(probeOrRoom: Probe | Room): StructureController | null {
    let target: any;
    if (probeOrRoom instanceof Probe) {
      target = probeOrRoom.room.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_SPAWN) })[0];
    }
    else {
      target = probeOrRoom.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_SPAWN) })[0];
    }
    return target instanceof StructureController ? target : null;
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

  public static getStructureDepositToSupply(probe: Probe): Structure | null {
    let deposit = probe.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => (
        ((structure.structureType == STRUCTURE_STORAGE ||
          structure.structureType == STRUCTURE_TERMINAL) && _.sum(structure.store) < structure.storeCapacity))
        || (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * 0.90)
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
    if (pos.roomName == "E31N46")
      return null;
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

  //public static getStorage(pos: RoomPosition): StructureStorage | null{
  //  let structure = pos.findClosestByPath(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_STORAGE });
  //  return structure instanceof StructureStorage ? structure : null;;
  //}

  public static getClosestEnemy(fromThis: Cannon | Probe | Room): Creep | null {
    let enemy: Creep | null;
    if (fromThis instanceof Cannon) {
      enemy = fromThis.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    }
    else if (fromThis instanceof Probe) {
      enemy = fromThis.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    }
    else {
      enemy = fromThis.find(FIND_HOSTILE_CREEPS)[0];
    }
    return enemy;
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
}
