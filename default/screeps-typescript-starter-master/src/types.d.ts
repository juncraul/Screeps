// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  //name: string;
  role: string;
  isGathering?: boolean;
  targetId?: string;
  isWorking?: boolean;
  remote?: string;
  homeName: string;
  useCashedPath?: boolean;
  path?: string;
  previousPosition?: RoomPosition;
  harvestCooldownXTicks?: number;
  lastHarvestTick?: number;
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
  market: string[];
}

interface RoomMemory {
  controller: string;
  sources: string[]
  controllerContainer: string | undefined;
}

interface MerchantTask {
  remove?: boolean;
  add?: boolean;
  mineralType?: ResourceConstant;
  amount?: number;
  lab: StructureLab;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
    Profiler: Profiler;
    MemoryManager: IMemoryManager
  }

}
interface IMemoryManager {
  
}
