import { profile } from "./Profiler";

@profile
export class PathLogic {
  public static generateNewPath(roomPositionStart: RoomPosition, roomPositionFinish: RoomPosition, ignoreCreeps: boolean): string {
    let pathPoints;
    if (!ignoreCreeps) {
      pathPoints = roomPositionStart.findPathTo(roomPositionFinish, { ignoreCreeps: true })
    } else {
      pathPoints = roomPositionStart.findPathTo(roomPositionFinish);
    }
    return Room.serializePath(pathPoints);
  }

  public static getPath(roomPositionStart: RoomPosition, roomPositionFinish: RoomPosition, override: boolean = false, debug: boolean = false): string {
    if (debug && override) {
      console.log("This creep got stuck")
    }
    if (JSON.stringify(roomPositionStart) == JSON.stringify(roomPositionFinish)){
      return "";
    }
    let oldPath: Path | undefined;
    
    if (!override) {
      let pathInMemoryIndex = PathLogic.getPathIndex(roomPositionStart, roomPositionFinish, debug);
      if (pathInMemoryIndex != -1) {
        oldPath = Memory.paths[pathInMemoryIndex];
        if (debug) {
          console.log("returning old path: " + JSON.stringify(oldPath))
        }
        return oldPath.path;
      }
    }

    let newPathString = PathLogic.generateNewPath(roomPositionStart, roomPositionFinish, override);
    let newPath: Path = {
      createdOn: Game.time,
      start: roomPositionStart,
      finish: roomPositionFinish,
      path: newPathString
    }
    if (override) {
      let pathInMemoryIndex = PathLogic.getPathIndex(roomPositionStart, roomPositionFinish, debug);
      if (pathInMemoryIndex != -1) {
        if (debug) {
          console.log("found an old path that needs override pos i: " + pathInMemoryIndex + " " + JSON.stringify(Memory.paths[pathInMemoryIndex]))
        }
        Memory.paths.splice(pathInMemoryIndex, 1);
      }
    }
    Memory.paths.push(newPath);
    if (debug) {
      console.log("returning new path: " + JSON.stringify(newPath))
      console.log("now we have: " + Memory.paths.length)
    }
    return newPath.path;
  }

  private static getPathIndex(start: RoomPosition, finish: RoomPosition, debug: boolean) {

    for (let i = 0; i < Memory.paths.length; i++) {
      if (JSON.stringify(Memory.paths[i].start) == JSON.stringify(start) && JSON.stringify(Memory.paths[i].finish) == JSON.stringify(finish)) {
        if (debug) {
          console.log("compare is equal at index " + i + ": " + JSON.stringify(Memory.paths[i].start) + " " + JSON.stringify(start))
        }
      return i;
      }
    }
    return -1;
  }

  public static cleanUpPaths() {
    for (let i = Memory.paths.length - 1; i >= 0; i--) {
      if ((Memory.paths[i].createdOn ? (Memory.paths[i].createdOn + 1000) : 0) < Game.time) {
        //console.log("deleting the following path: " + JSON.stringify(Memory.paths[i]))
        Memory.paths.splice(i, 1);
      }
    }
  }
}
