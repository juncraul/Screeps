import { Tasks } from "Tasks";
import { Helper } from "Helper";

export const enum CreepRoles {
  ROLE_UNASSIGNED = 0,
  ROLE_ALL,
  ROLE_BUILDER,
  ROLE_MINER,
  ROLE_MINEHAULER,
  ROLE_HEALER,
  ROLE_FIGHTER,
  ROLE_RANGER,
  ROLE_CLAIMER,
  ROLE_REMOTEMINER,
  ROLE_REMOTEMINEHAULER,
  ROLE_CUSTOMCONTROL,
  ROLE_UPGRADER,
  ROLE_UPGRADETRANSPORT
}

export class MemoryManager {
  public static initializeMemory() {
    if (Memory.Keys == undefined) {
      Memory.Keys = new Object();
    }
    MemoryManager.initializeSource();
    MemoryManager.initializeContainers();
  }

  private static initializeSource() {
    let rooms = Tasks.getmyRoomsWithController();
    let roomsToHarvest = Tasks.getRoomsToHarvest();

    roomsToHarvest.forEach(function (room) {
      let r = Game.rooms[room];
      if (r) {
        rooms.push(r);
      }
    });

    let sources: Source[];
    sources = [];
    rooms.forEach(function (room) {
      let sourcesFromRoom = room.find(FIND_SOURCES);
      sourcesFromRoom.forEach(function (source) {
        sources.push(source);
      })
    })

    sources.forEach(function (source) {
      let creeps = _.filter(Game.creeps, (creep) => creep.memory.targetId == source.id);
      Helper.setCashedMemory("Harvesting-" + source.id, creeps.length);
    })
  }

  private static initializeContainers() {
    let rooms = Tasks.getmyRoomsWithController();
    let roomsToHarvest = Tasks.getRoomsToHarvest();

    roomsToHarvest.forEach(function (room) {
      let r = Game.rooms[room];
      if (r) {
        rooms.push(r);
      }
    });
    rooms.forEach(function (room) {
      let containersFromRoom = room.find(FIND_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_CONTAINER });
      containersFromRoom.forEach(function (container) {
        if (container instanceof StructureContainer) {
          let prevSum: number[];
          prevSum = Helper.getCashedMemory("ContainerFill-Sum50-" + container.id, []);
          prevSum.push(_.sum(container.store));
          if (prevSum.length > 50)
            prevSum.shift();
          Helper.setCashedMemory("ContainerFill-Sum50-" + container.id, prevSum);
          Helper.setCashedMemory("ContainerFill-Average50-" + container.id, _.sum(prevSum) / prevSum.length);
        }
      })
    })
  }
}
