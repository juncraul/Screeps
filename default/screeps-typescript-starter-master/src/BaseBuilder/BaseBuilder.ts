import { BaseLayout, Coord } from "./BaseLayout";
import { layout } from "./Layout";


export class BaseBuilder {
  public static logicCreateConstructionSites() {
    for (var i = 0; i < 10; i++) {
      var flag = Game.flags["ConstructionSite-" + i];
      if (flag == null)
        continue;
      if (_.filter(Game.creeps, (creep) => creep.room == flag.room).length == 0)
        continue;

      this.buildBase(flag.pos, layout, 4, flag.color == COLOR_WHITE);
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

    this.buildBuildingType(anchor, spawnCoordinates, "S", STRUCTURE_SPAWN, previewInsteadOfBuild);
    this.buildBuildingType(anchor, roadCoordinates, "R", STRUCTURE_ROAD, previewInsteadOfBuild);
    this.buildBuildingType(anchor, extensionCoordinates, "E", STRUCTURE_EXTENSION, previewInsteadOfBuild);
    this.buildBuildingType(anchor, wallCoordinates, "W", STRUCTURE_WALL, previewInsteadOfBuild);
    this.buildBuildingType(anchor, rampartCoordinates, "R", STRUCTURE_RAMPART, previewInsteadOfBuild);
  }

  private static buildBuildingType(anchor: RoomPosition, buildingsCoordinates: Coord[], annotate: string, constructionType: BuildableStructureConstant, previewInsteadOfBuild: boolean) {
    buildingsCoordinates.forEach(function (coord) {
      let x = coord.x - layout.data.anchor.x + anchor.x;
      let y = coord.y - layout.data.anchor.y + anchor.y;
      if (previewInsteadOfBuild) {
        Game.rooms[anchor.roomName].visual.text(annotate, x, y, { align: 'center', opacity: 0.5, color: "#ff0000" });
      }
      else {
        Game.rooms[anchor.roomName].createConstructionSite(x, y, constructionType);
      }
    })
  }
}
