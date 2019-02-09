import { BaseLayout, Coord } from "./BaseLayout";
import { layoutSieve, layoutRooftop, layoutReverseRooftop } from "./Layout";


export class BaseBuilder {
  public static logicCreateConstructionSites() {
    for (var i = 0; i < 10; i++) {
      var flag = Game.flags["ConstructionSite-" + i];
      if (flag == null)
        continue;
      if (_.filter(Game.creeps, (creep) => creep.room == flag.room).length == 0)
        continue;

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
          layoutToBeUsed = layoutSieve;
          break;
      }
      this.buildBase(flag.pos, layoutToBeUsed, 4, flag.color == COLOR_WHITE);
      this.createWall(Game.rooms[flag.pos.roomName], flag.color == COLOR_WHITE)
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

    this.buildBuildingType(anchor, spawnCoordinates, "S", STRUCTURE_SPAWN, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, roadCoordinates, "R", STRUCTURE_ROAD, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, extensionCoordinates, "E", STRUCTURE_EXTENSION, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, wallCoordinates, "W", STRUCTURE_WALL, previewInsteadOfBuild, layout);
    this.buildBuildingType(anchor, rampartCoordinates, "R", STRUCTURE_RAMPART, previewInsteadOfBuild, layout);
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
        this.createConstructionSite(room, 2, i, (i % 5 === 4 ? "A" : "W"), previewInsteadOfBuild);
        this.createWallEdge(room, 2, i, previewInsteadOfBuild);
      }
      if (roomTerrain.get(49, i) !== TERRAIN_MASK_WALL && roomTerrain.get(47, i) !== TERRAIN_MASK_WALL) {
        this.createConstructionSite(room, 47, i, (i % 5 === 4 ? "A" : "W"), previewInsteadOfBuild);
        this.createWallEdge(room, 47, i, previewInsteadOfBuild);
      }
      if (roomTerrain.get(i, 0) !== TERRAIN_MASK_WALL && roomTerrain.get(i, 2) !== TERRAIN_MASK_WALL) {
        this.createConstructionSite(room, i, 2, (i % 5 === 4 ? "A" : "W"), previewInsteadOfBuild);
        this.createWallEdge(room, i, 2, previewInsteadOfBuild);
      }
      if (roomTerrain.get(i, 49) !== TERRAIN_MASK_WALL && roomTerrain.get(i, 47) !== TERRAIN_MASK_WALL) {
        this.createConstructionSite(room, i, 47, (i % 5 === 4 ? "A" : "W"), previewInsteadOfBuild);
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
        this.checkForStructureAndBuild(room, terrainXToCheck + 1 * xDirection + 2 * xOffset, terrainYToCheck + 1 * yDirection + 2 * yOffset, ((y - 1) % 5 === 4 ? "A" : "W"), previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 2 * xOffset, terrainYToCheck + 2 * yDirection + 2 * yOffset, ((y - 1) % 5 === 4 ? "A" : "W"), previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 1 * xOffset, terrainYToCheck + 2 * yDirection + 1 * yOffset, ((y - 1) % 5 === 4 ? "A" : "W"), previewInsteadOfBuild)
      }
      xOffset = (x === 2 || x === 47) ? 0 : 1;
      yOffset = (y === 2 || y === 47) ? 0 : 1;
      if (roomTerrain.get(terrainXToCheck + xOffset, terrainYToCheck + yOffset) === TERRAIN_MASK_WALL) {
        this.checkForStructureAndBuild(room, terrainXToCheck + 1 * xDirection + 2 * xOffset, terrainYToCheck + 1 * yDirection + 2 * yOffset, ((y - 1) % 5 === 4 ? "A" : "W"), previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 2 * xOffset, terrainYToCheck + 2 * yDirection + 2 * yOffset, ((y - 1) % 5 === 4 ? "A" : "W"), previewInsteadOfBuild)
        this.checkForStructureAndBuild(room, terrainXToCheck + 2 * xDirection + 1 * xOffset, terrainYToCheck + 2 * yDirection + 1 * yOffset, ((y - 1) % 5 === 4 ? "A" : "W"), previewInsteadOfBuild)
      }
    }
  }

  private static checkForStructureAndBuild(room: Room, x: number, y: number, build: string, previewInsteadOfBuild: boolean) {
    let roomTerrain = Game.map.getRoomTerrain(room.name);
    if (roomTerrain.get(x, y) !== TERRAIN_MASK_WALL)
      this.createConstructionSite(room, x, y, build, previewInsteadOfBuild);
  }

  private static createConstructionSite(room: Room, x: number, y: number, type: string, previewInsteadOfBuild: boolean) {
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
