import { Tasks } from "Tasks";
import { Helper } from "Helper";
import { profile } from "./Profiler";
import { GetRoomObjects } from "GetRoomObjects";

@profile
export class MemoryManager implements IMemoryManager {
  private static rooms: { [name: string]: RoomMemory };

  constructor (){
    if (Memory.Keys == undefined) {
      Memory.Keys = new Object();
    }
    //this.initializeContainers();
    if (Game.time % 5 == 0) {
      this.saveRoomsToMemory();
    }
    this.loadRoomsFromMemory();
  }

  public static getRoomMemory(room: Room | string): RoomMemory {
    if (room instanceof Room) {
      return MemoryManager.rooms[room.name];
    } else {
      return MemoryManager.rooms[room];
    }
  }

  initializeSource() {
    let rooms = Tasks.getmyRoomsWithController();
    let roomsToHarvest = Tasks.getRoomsToHarvest();

    roomsToHarvest.forEach(function (room) {
      let r = Game.rooms[room];
      if (r) {
        rooms.push(r);
      }
    });

    let sources: (Source | Mineral)[];
    sources = [];
    rooms.forEach(function (room) {
      let sourcesFromRoom = room.find(FIND_SOURCES);
      let mineralFromRoom = GetRoomObjects.getMineral(room, true);
      sourcesFromRoom.forEach(function (source) {
        sources.push(source);
      })
      if (mineralFromRoom) {
        sources.push(mineralFromRoom);
      }
    })

    sources.forEach(function (source) {
      let creeps = _.filter(Game.creeps, (creep) => creep.memory.targetId == source.id);
      Helper.setCashedMemory("Harvesting-" + source.id, creeps.length);
    })
  }

  initializeContainers() {
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

  saveRoomsToMemory() {
    //TODO: This is not great, should get all rooms in a different way
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

  loadRoomsFromMemory() {
    MemoryManager.rooms = {}
    let rooms = Tasks.getRoomsToHarvest();
    for (let roomIndex in rooms) {
      MemoryManager.rooms[rooms[roomIndex]] = Memory.rooms[rooms[roomIndex]];
    }
  }
}
