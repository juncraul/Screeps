
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

  public static getPath(roomPositionStart: RoomPosition, roomPositionFinish: RoomPosition, override: boolean = false): string {
    if (JSON.stringify(roomPositionStart) == JSON.stringify(roomPositionFinish)){
      return "";
    }
    let oldPath: Path | undefined;
    var BreakException = {};//TODO: need to change so to not use this ugly throw
    if (!override) {
      try {
        Memory.paths.forEach(function (path) {
          if (JSON.stringify(path.start) == JSON.stringify(roomPositionStart) && JSON.stringify(path.finish) == JSON.stringify(roomPositionFinish)) {
            oldPath = path;
            throw BreakException;
          }
        })
      } catch (e) {
        if (e != BreakException)
          throw e;
      }

      if (oldPath) {
        return oldPath.path;
      }
    }

    let newPathString = PathLogic.generateNewPath(roomPositionStart, roomPositionFinish, override);
    let newPath = {
      start: roomPositionStart,
      finish: roomPositionFinish,
      path: newPathString
    }
    if (override) {
      let i = 0;
      try {
        Memory.paths.forEach(function (path) {
          if (JSON.stringify(path.start) == JSON.stringify(roomPositionStart) && JSON.stringify(path.finish) == JSON.stringify(roomPositionFinish)) {
            throw BreakException;
          }
        })
        i++;
      } catch (e) {
        if (e != BreakException)
          throw e;
      }
      Memory.paths.splice(i, 1);
    }
    Memory.paths.push(newPath);
    return newPath.path;
  }
}
