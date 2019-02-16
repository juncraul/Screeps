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
  private static rooms: { [name: string]: RoomMemory };
  
  public static initializeMemory() {
    if (Memory.Keys == undefined) {
      Memory.Keys = new Object();
    }
    MemoryManager.initializeSource();
    MemoryManager.initializeContainers();
    if (Game.time % 5 == 0) {
      MemoryManager.saveRoomsToMemory();
    }
    MemoryManager.loadRoomsFromMemory();
  }

  public static getRoomMemory(room: Room | string): RoomMemory {
    if (room instanceof Room) {
      return MemoryManager.rooms[room.name];
    } else {
      return MemoryManager.rooms[room];
    }
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

  private static saveRoomsToMemory() {
    let rooms = Tasks.getRoomsToHarvest();
    for (let roomIndex in rooms) {
      let room = Game.rooms[rooms[roomIndex]];
      if (room) {
        let controllerFromRoom = room.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) })[0];
        let controllerContainerFromRoom = controllerFromRoom.pos.findInRange(FIND_STRUCTURES, 3, { filter: structure => (structure.structureType == STRUCTURE_CONTAINER) })[0];
        let roomMem: RoomMemory = {
          controller: controllerFromRoom.id,
          controllerContainer: controllerContainerFromRoom ? controllerContainerFromRoom.id : undefined,
          sources: room.find(FIND_SOURCES).map(source => source.id)
        }
        Memory.rooms[rooms[roomIndex]] = roomMem;
      }
    }
  }

  private static loadRoomsFromMemory() {
    MemoryManager.rooms = {}
    let rooms = Tasks.getRoomsToHarvest();
    for (let roomIndex in rooms) {
      MemoryManager.rooms[rooms[roomIndex]] = Memory.rooms[rooms[roomIndex]];
    }
  }
}
