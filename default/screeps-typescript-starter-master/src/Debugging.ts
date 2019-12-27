export const enum DebuggingType {
  UPGRADER = "upgrader",
  SPAWNING = "spawning"
}

export class Debugging {

  public static log(text: string, debugType: DebuggingType) {
    if (Memory.Debugging[debugType]) {
      console.log(text);
    }
  }
}
