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
}
