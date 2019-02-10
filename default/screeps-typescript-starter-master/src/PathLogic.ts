
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
    if (!override) {
      Memory.paths.forEach(function (path) {
        if (JSON.stringify(path.start) == JSON.stringify(roomPositionStart) && JSON.stringify(path.finish) == JSON.stringify(roomPositionFinish)) {
          oldPath = path;
        }
      })

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
    Memory.paths.push(newPath);
    return newPath.path;
  }
}
