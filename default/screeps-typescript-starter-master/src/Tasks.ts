
export class Tasks {
  public static getRoomsToHarvest(): string[] {
    return ["W7N3", "W8N2"];
  }

  public static getmyRoomsWithController(): Room[] {
    var mySpawns = Object.getOwnPropertyNames(Game.spawns)
    var roomsWithSpawns = []
    for (var i = 0; i < mySpawns.length; i++) {
      roomsWithSpawns.push(Game.spawns[mySpawns[i]].room)
    }

    return roomsWithSpawns;
  }
}
