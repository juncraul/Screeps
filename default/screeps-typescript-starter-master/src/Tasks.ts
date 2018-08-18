
export class Tasks {
  public static getRoomsToHarvest(): string[] {
    switch (Game.shard.name) {
      case "Jalapeno"://Private
        return ["W7N3", "W8N2", "W7N2", "W7N1", "W6N2"];
      case "shard2"://Public
        return ["W33S54", "W32S55", "W31S55", "W32S56", "W34S53", "W32S53", "W33S52", "W32S54", "W31S53", "W34S52", "W34S51", "W31S51"];
      default:
        return [];
    }
  }

  public static getRoomsToClaim(): string[] {
    switch (Game.shard.name) {
      case "Jalapeno"://Private
        return [];
      case "shard2"://Public
        return [];
      default:
        return [];
    }
  }

  public static getRoomConnections(room: Room) {
    switch (Game.shard.name) {
      case "Jalapeno"://Private
        switch (room.name) {
          case "W8N3":
            return ["W7N3", "W8N2", "W7N2"];
          case "W6N1":
            return ["W7N1", "W6N2"];
          default:
            return []
        }
      case "shard2"://Public
        switch (room.name) {
          case "W33S55":
            return ["W33S54", "W32S54"];
          case "W33S53":
            return ["W34S53", "W32S53", "W31S53", "W31S51"];
          case "W33S56":
            return ["W32S56"];
          case "W31S54":
            return ["W32S55", "W31S55"];
          case "W33S51":
            return ["W34S51", "W34S52", "W33S52"]
          default:
            return []
        }
      default:
        return [];
    }
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
