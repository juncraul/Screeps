import { OrderSchedule } from "utils/OrderSchedule";

export class Tasks {
  public static getRoomsToHarvest(): string[] {
    switch (Game.shard.name) {
      case "Jalapeno"://Private
        return ["W7N3", "W8N2", "W7N2", "W7N1", "W6N2"];
      case "shard2"://Public
        return ["W33S54", "W32S55", "W31S55", "W32S56", "W34S53", "W32S53", "W33S52", "W32S54", "W31S53", "W34S52", "W34S51", "W31S51"];
      case "shard3"://Public Free-Subscription
        return [
          "E33N45",
          "E33N43",
          "E32N45",
          "E31N44",
          "E33N42",
          "E32N43",
          "E33N46",
          "E31N46"
        ];
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
      case "shard3"://Public Free-Subscription
        return ["E32N44", "E32N45"];
      default:
        return [];
    }
  }

  public static getRoomConnections(room: Room): string[] {
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
      case "shard3"://Public Free-Subscription
        switch (room.name) {
          case "E33N44":
            return ["E33N45", "E33N43", "E33N42", "E32N44", "E33N46", "E32N45", "E31N46"];
          case "E32N44":
            return ["E31N44", "E32N43", "E32N45", "E31N49"]
          default:
            return []
        }
      default:
        return [];
    }
  }

  public static getFarAwayRoomPath(roomName: string): string[] {
    switch (Game.shard.name) {
      case "Jalapeno"://Private
        switch (roomName) {
          default:
            return []
        }
      case "shard2"://Public
        switch (roomName) {
          default:
            return []
        }
      case "shard3"://Public Free-Subscription
        switch (roomName) {
          case "E31N49":
            return ["E33N44", "E33N45", "E32N45", "E32N44", "E31N44", "E30N44", "E30N45" ,"E30N46", "E30N47", "E30N48", "E30N49", "E31N49"];
          default:
            return []
        }
      default:
        return [];
    }
  }

  public static getOrdersToCreate(): OrderSchedule[] {
    return [new OrderSchedule(RESOURCE_ENERGY, 0.001, 10000)];
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
