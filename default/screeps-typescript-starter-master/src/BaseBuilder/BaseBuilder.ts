import { BaseLayout, Coord } from "./BaseLayout";
import { layoutSieve, layoutRooftop, layoutReverseRooftop, layoutUtility } from "./Layout";
import { Helper } from "Helper";
import { GetRoomObjects } from "GetRoomObjects";

//Flags: Primary - Secondary
//Layout construction, flag must also be named "ConstructionSite-*" where * is number from 0 to 9
//WHITE - WHITE Build Layout Sieve
//WHITE - GREY  Build Layout Rooftop
//WHITE - BROWN Build Layout Reverse/Rooftop
//GREY  - WHITE Preview Layout Sieve
//GREY  - GREY  Preview Layout Rooftop
//GREY  - BROWN Preview Layout Reverse/Rooftop

//BROWN - WHITE Build Rampart instead of wall

export class BaseBuilder {
  public static storeBuildOptionInMemory() {
    for (let flagName in Game.flags) {
      let flag = Game.flags[flagName];
      switch (flag.color) {
        case COLOR_BROWN:
          switch (flag.secondaryColor) {
            case COLOR_WHITE:
              let constructionRampart: RoomPosition[];
              constructionRampart = Helper.getCashedMemory("Construction-Rampart", []);
              if (constructionRampart.filter(obj => { return obj.roomName == flag.pos.roomName && obj.x == flag.pos.x && obj.y == flag.pos.y }).length == 0) {
                constructionRampart.push(flag.pos);
                Helper.setCashedMemory("Construction-Rampart", constructionRampart);
              }

              break;
          }
          break;
      }
    }
  }

  public static logicCreateConstructionSites() {
    for (var i = 0; i < 10; i++) {
      var flag = Game.flags["ConstructionSite-" + i];
      if (flag == null)
        continue;
      if (_.filter(Game.creeps, (creep) => creep.room == flag.room).length == 0)
        continue;
      let controller = flag.room ? GetRoomObjects.getController(flag.room) : null;

      let layoutToBeUsed: BaseLayout;
      switch (flag.secondaryColor) {
        case COLOR_WHITE:
          layoutToBeUsed = layoutSieve;
          break;
        case COLOR_GREY:
          layoutToBeUsed = layoutRooftop;
          break;
        case COLOR_BROWN:
          layoutToBeUsed = layoutReverseRooftop;
          break;
        default:
          continue;
      }
      if (flag.color == COLOR_WHITE && Game.time % 5 == 0) {//preview only once every 5th tick, might need rethinking
        this.buildBase(flag.pos, layoutToBeUsed, 4, true);
        this.createWall(Game.rooms[flag.pos.roomName], true);
      } else if (flag.color == COLOR_GREY && Game.time % 10 == 0) {//Construct only once every 10th tick
        this.buildBase(flag.pos, layoutToBeUsed, 4, false);
        if (controller && controller.level >= 3) {//Build walls only if the controller is at least level 3 because that's when we can build Cannons.
          this.createWall(Game.rooms[flag.pos.roomName], false);
        }
      }
    }

    for (var i = 10; i < 20; i++) {
      var flag = Game.flags["ConstructionSite-" + i];
      if (flag == null)
        continue;
      if (_.filter(Game.creeps, (creep) => creep.room == flag.room).length == 0)
        continue;

      let layoutToBeUsed: BaseLayout;
      switch (flag.secondaryColor) {
        case COLOR_WHITE:
          layoutToBeUsed = layoutUtility;
          break;
        default:
          continue;
      }
      if (flag.color == COLOR_WHITE && Game.time % 5 == 0) {//preview only once every 5th tick, might need rethinking
        this.buildBase(flag.pos, layoutToBeUsed, 4, true);
      } else if (flag.color == COLOR_GREY && Game.time % 10 == 0) {//Construct only once every 10th tick
        this.buildBase(flag.pos, layoutToBeUsed, 4, false);
      }
    }

    flag = Game.flags["CreateSpawn"];
    if (flag && flag.room) {
      flag.room.createConstructionSite(flag.pos.x, flag.pos.y, STRUCTURE_SPAWN, "Raul-" + flag.room.name + "-X");
    }
  }

  private static buildBase(anchor: RoomPosition, layout: BaseLayout, controllerLevel: number, previewInsteadOfBuild: boolean) {

    let spawnCoordinates = layout[controllerLevel]!.buildings["spawn"].pos;
    let roadCoordinates = layout[controllerLevel]!.buildings["road"].pos;
    let extensionCoordinates = layout[controllerLevel]!.buildings["extension"].pos;
    let wallCoordinates = layout[controllerLevel]!.buildings["wall"].pos;
    let rampartCoordinates = layout[controllerLevel]!.buildings["rampart"].pos;
    let observerCoordinates = layout[controllerLevel]!.buildings["observer"].pos;
    let powerSpawnCoordinates = layout[controllerLevel]!.buildings["powerSpawn"].pos;
    let linkCoordinates = layout[controllerLevel]!.buildings["link"].pos;
    let terminalCoordinates = layout[controllerLevel]!.buildings["terminal"].pos;
    let towerCoordinates = layout[controllerLevel]!.buildings["tower"].pos;
    let nukerCoordinates = layout[controllerLevel]!.buildings["nuker"].pos;
    let storageCoordinates = layout[controllerLevel]!.buildings["storage"].pos;
    let labCoordinates = layout[controllerLevel]!.buildings["lab"].pos;

    this.buildBuildingType(anchor, spawnCoordinates, "Sp", STRUCTURE_SPAWN, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, roadCoordinates, "Ro", STRUCTURE_ROAD, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, extensionCoordinates, "Ex", STRUCTURE_EXTENSION, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, wallCoordinates, "Wa", STRUCTURE_WALL, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, rampartCoordinates, "Ra", STRUCTURE_RAMPART, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, observerCoordinates, "Ob", STRUCTURE_OBSERVER, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, powerSpawnCoordinates, "Po", STRUCTURE_POWER_SPAWN, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, linkCoordinates, "Li", STRUCTURE_LINK, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, terminalCoordinates, "Te", STRUCTURE_TERMINAL, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, towerCoordinates, "To", STRUCTURE_TOWER, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, nukerCoordinates, "Nu", STRUCTURE_NUKER, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, storageCoordinates, "S", STRUCTURE_STORAGE, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, labCoordinates, "La", STRUCTURE_LAB, previewInsteadOfBuild, layout);
  }

  private static buildBuildingType(anchor: RoomPosition, buildingsCoordinates: Coord[], annotate: string, constructionType: BuildableStructureConstant, previewInsteadOfBuild: boolean, layout: BaseLayout) {
    buildingsCoordinates.forEach(function (coord) {
      let x = coord.x - layout.data.anchor.x + anchor.x;
      let y = coord.y - layout.data.anchor.y + anchor.y;
      if (previewInsteadOfBuild) {
        Game.rooms[anchor.roomName].visual.text(annotate, x, y, { align: 'center', opacity: 0.5, color: "#ff0000" });
      }
      else {
        if (Game.rooms[anchor.roomName].lookForAt(LOOK_TERRAIN, x, y)[0] != "wall") {
          Game.rooms[anchor.roomName].createConstructionSite(x, y, constructionType);
        }
      }
    })
  }

  private static createWall(room: Room, previewInsteadOfBuild: boolean) {
    for (var i = 0; i < 50; i++) {
      let roomTerrain = Game.map.getRoomTerrain(room.name);
      if (roomTerrain.get(0, i) !== TERRAIN_MASK_WALL && roomTerrain.get(2, i) !== TERRAIN_MASK_WALL) {
        this.createConstructionSite(room, 2, i, "W", previewInsteadOfBuild);
        this.createWallEdge(room, 2, i, previewInsteadOfBuild);
      }
      if (roomTerrain.get(49, i) !== TERRAIN_MASK_WALL && roomTerrain.get(47, i) !== TERRAIN_MASK_WALL) {
        this.createConstructionSite(room, 47, i, "W", previewInsteadOfBuild);
        this.createWallEdge(room, 47, i, previewInsteadOfBuild);
      }
      if (roomTerrain.get(i, 0) !== TERRAIN_MASK_WALL && roomTerrain.get(i, 2) !== TERRAIN_MASK_WALL) {
        this.createConstructionSite(room, i, 2, "W", previewInsteadOfBuild);
        this.createWallEdge(room, i, 2, previewInsteadOfBuild);
      }
      if (roomTerrain.get(i, 49) !== TERRAIN_MASK_WALL && roomTerrain.get(i, 47) !== TERRAIN_MASK_WALL) {
        this.createConstructionSite(room, i, 47, "W", previewInsteadOfBuild);
        this.createWallEdge(room, i, 47, previewInsteadOfBuild);
      }
    }
  }

  private static createWallEdge(room: Room, x: number, y: number, previewInsteadOfBuild: boolean) {
    var terrainXToCheck = (x !== 2 && x !== 47) ? x : (x < 25 ? 0 : 49);
    var terrainYToCheck = (y !== 2 && y !== 47) ? y : (y < 25 ? 0 : 49);
    var xDirection = x === 2 ? 1 : (x === 47 ? -1 : 0)
    var yDirection = y === 2 ? 1 : (y === 47 ? -1 : 0)
    var xOffset = (x === 2 || x === 47) ? 0 : -1;
    var yOffset = (y === 2 || y === 47) ? 0 : -1;
    if (x === 47 && y === 47) {
      this.checkForStructureAndBuild(room, 48, 47, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 47, 48, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 48, 48, "W", previewInsteadOfBuild)
    }
    else if (x === 2 && y === 2) {
      this.checkForStructureAndBuild(room, 2, 1, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 1, 2, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 1, 1, "W", previewInsteadOfBuild)
    }
    else if (x === 47 && y === 2) {
      this.checkForStructureAndBuild(room, 47, 1, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 46, 2, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 47, 1, "W", previewInsteadOfBuild)
    }
    else if (x === 2 && y === 47) {
      this.checkForStructureAndBuild(room, 2, 46, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 1, 47, "W", previewInsteadOfBuild)
      this.checkForStructureAndBuild(room, 1, 46, "W", previewInsteadOfBuild)
    }
    else {
      let roomTerrain = Game.map.getRoomTerrain(room.name);
      if (roomTerrain.get(terrainXToCheck + xOffset, terrainYToCheck + yOffset) === TERRAIN_MASK_WALL) {
        this.checkForStructureAndBuild(room, terrainXToCheck + 1 * xDirection + 2 * xOffset, terrainYToCheck + 1 * yDirection + 2 * yOffset, "W", previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 2 * xOffset, terrainYToCheck + 2 * yDirection + 2 * yOffset, "W", previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 1 * xOffset, terrainYToCheck + 2 * yDirection + 1 * yOffset, "W", previewInsteadOfBuild)
      }
      xOffset = (x === 2 || x === 47) ? 0 : 1;
      yOffset = (y === 2 || y === 47) ? 0 : 1;
      if (roomTerrain.get(terrainXToCheck + xOffset, terrainYToCheck + yOffset) === TERRAIN_MASK_WALL) {
        this.checkForStructureAndBuild(room, terrainXToCheck + 1 * xDirection + 2 * xOffset, terrainYToCheck + 1 * yDirection + 2 * yOffset, "W", previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 2 * xOffset, terrainYToCheck + 2 * yDirection + 2 * yOffset, "W", previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 1 * xOffset, terrainYToCheck + 2 * yDirection + 1 * yOffset, "W", previewInsteadOfBuild)
      }
    }
  }

  private static checkForStructureAndBuild(room: Room, x: number, y: number, build: string, previewInsteadOfBuild: boolean) {
    let roomTerrain = Game.map.getRoomTerrain(room.name);
    if (roomTerrain.get(x, y) !== TERRAIN_MASK_WALL)
      this.createConstructionSite(room, x, y, build, previewInsteadOfBuild);
  }

  private static createConstructionSite(room: Room, x: number, y: number, type: string, previewInsteadOfBuild: boolean) {
    let constructionRampart: RoomPosition[];
    constructionRampart = Helper.getCashedMemory("Construction-Rampart", []);
    if (constructionRampart.filter(obj => { return obj.roomName == room.name && obj.x == x && obj.y == y }).length != 0) {
      if (type == "W") {
        type = "A";
      }
    }
    if (previewInsteadOfBuild) {
      room.visual.text(type, x, y, { align: 'center', opacity: 0.5, color: "#ff0000" });
    }
    else {
      switch (type) {
        case "W":
          room.createConstructionSite(x, y, STRUCTURE_WALL);
          break;
        case "A":
          room.createConstructionSite(x, y, STRUCTURE_RAMPART);
          break;
      }
    }
  }
}
