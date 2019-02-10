// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  name: string;
  role: string;
  isGathering: boolean;
  targetId: string;
  isWorking: boolean;
  remote: string;
  homeName: string;
  useCashedPath: boolean;
  path: string;
  previousPosition: RoomPosition;
}

interface Path {
  start: RoomPosition;
  finish: RoomPosition;
  path: string
}

interface Memory {
  uuid: number;
  log: any;
  paths: Path[];
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
