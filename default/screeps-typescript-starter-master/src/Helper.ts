import { profile } from "./Profiler";

@profile
export class Helper {

  public static getCashedMemory(key: string, defaultValue : any): any {
    let obj = Memory.Keys[key];
    if (obj == undefined) {
      obj = defaultValue;
    }
    return obj;
  }

  public static setCashedMemory(key: string, value: any) {
    Memory.Keys[key] = value;
  }

  public static incrementCashedMemory(key: string, value: any) {
    let cashed = Helper.getCashedMemory(key, 0);
    if (typeof cashed == 'number') {
      Memory.Keys[key] = cashed + value;
    }
  }

  public static deleteAllKeysStartingWith(startWith: string) {
    for (let i in Memory.Keys) {
      if (i.startsWith(startWith)) {
        delete Memory.Keys[i]
      }
    }
  }

  public static say(text: string, roomPos: RoomPosition) {
    Game.rooms[roomPos.roomName].visual.text(text, roomPos);
  }
}
