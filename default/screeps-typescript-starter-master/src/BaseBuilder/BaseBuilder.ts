import { BaseLayout } from "./BaseLayout";
import { layout } from "./Layout";


export class BaseBuilder {

  public static logicCreateConstructionSites() {
    for (var i = 0; i < 10; i++) {
      var flag = Game.flags["ConstructionSite-" + i];
      if (flag == null)
        continue;
      if (_.filter(Game.creeps, (creep) => creep.room == flag.room).length == 0)
        continue;

      this.buildBase(flag.pos, layout, 4);
      
      //createWall(flag.room);
    }

    flag = Game.flags["CreateSpawn"];
    if (flag && flag.room) {
      flag.room.createConstructionSite(flag.pos.x, flag.pos.y, STRUCTURE_SPAWN, "Raul-" + flag.room.name + "-X");
    }
  }

  private static buildBase(anchor: RoomPosition, layout: BaseLayout, controllerLevel: number) {

    let extensionCoordinates = layout[controllerLevel]!.buildings["extension"].pos;
    extensionCoordinates.forEach(function (coord) {
      let x = coord.x - layout.data.anchor.x + anchor.x;
      let y = coord.y - layout.data.anchor.y + anchor.y;
      Game.rooms[anchor.roomName].visual.text("E", x, y, { align: 'center', opacity: 0.5, color: "#ff0000" });
    })
  }
}
