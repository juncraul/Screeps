
export class Helper {

  public static getCashedMemory(key: string): any {
    return Memory.Keys[key]
  }

  public static setCashedMemory(key: string, value: any) {
    Memory.Keys[key] = value;
  }

  public static incrementCashedMemory(key: string, value: any) {
    let cashed = Helper.getCashedMemory(key);
    if (typeof cashed == 'number') {
      Memory.Keys[key] = cashed + value;
    }
  }
}
