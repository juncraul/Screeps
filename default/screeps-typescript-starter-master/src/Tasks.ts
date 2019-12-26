import { OrderSchedule } from "utils/OrderSchedule";
import { profile } from "./Profiler";
import { ReactionSchedule } from "utils/ReactionSchedule";

@profile
export class Tasks {
  public static getRoomsToHarvest(): string[] {
    switch (Game.shard.name) {
      case "Jalapeno"://Private
        return ["W7N3", "W8N2", "W7N2", "W7N1", "W6N2"];
      case "shard2"://Public
        return ["W33S54", "W32S55", "W31S55", "W32S56", "W34S53", "W32S53", "W33S52", "W32S54", "W31S53", "W34S52", "W34S51", "W31S51"];
      case "shard3"://Public Free-Subscription
        return ["W8S22"];
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
        return ["E32N44"];
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
          case "E31N46":
            return ["E32N44"];
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

  public static getSellOrdersToCreate(): OrderSchedule[] {
    return [
      new OrderSchedule(RESOURCE_ENERGY, 0.5, 10000),
      new OrderSchedule(RESOURCE_OXYGEN, 0.299, 2000)
    ];
  }

  public static getBuyOrdersToCreate(): OrderSchedule[] {
    return [];
  }

  public static getBuysFromMarket(): OrderSchedule[] {
    return [
      new OrderSchedule(RESOURCE_ZYNTHIUM, 0.2, 1000),
      new OrderSchedule(RESOURCE_KEANIUM, 0.2, 1000),
      new OrderSchedule(RESOURCE_UTRIUM, 0.2, 1000),
      new OrderSchedule(RESOURCE_LEMERGIUM, 0.2, 1000),
      new OrderSchedule(RESOURCE_OXYGEN, 0.2, 1000),
      new OrderSchedule(RESOURCE_HYDROGEN, 0.2, 1000),
      new OrderSchedule(RESOURCE_CATALYST, 0.3, 1000),
    ];
  }

  public static getSellsToMarket(): OrderSchedule[] {
    return [
      new OrderSchedule(RESOURCE_ENERGY, 0.8, 20000)
    ];
  }

  public static getReactionSchedules(): ReactionSchedule[] {
    return [
      new ReactionSchedule(RESOURCE_ZYNTHIUM_KEANITE, 1000),
      new ReactionSchedule(RESOURCE_UTRIUM_LEMERGITE, 1000),
      new ReactionSchedule(RESOURCE_ZYNTHIUM_OXIDE, 1000),
      new ReactionSchedule(RESOURCE_UTRIUM_HYDRIDE, 1000),
      new ReactionSchedule(RESOURCE_GHODIUM, 1000),
      new ReactionSchedule(RESOURCE_GHODIUM_OXIDE, 1000),
      new ReactionSchedule(RESOURCE_GHODIUM_HYDRIDE, 1000),
      new ReactionSchedule(RESOURCE_LEMERGIUM_OXIDE, 2000),
      new ReactionSchedule(RESOURCE_HYDROXIDE, 1000),
      new ReactionSchedule(RESOURCE_LEMERGIUM_ALKALIDE, 2000),
      new ReactionSchedule(RESOURCE_GHODIUM_ALKALIDE, 1000),
      new ReactionSchedule(RESOURCE_UTRIUM_ACID, 1000),
      new ReactionSchedule(RESOURCE_CATALYZED_GHODIUM_ALKALIDE, 2500),
      new ReactionSchedule(RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, 2500),
    ];
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
