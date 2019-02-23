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
  resourceMovementTask?: ResourceMovementTask;
  bodyPartsUpgraded?: boolean;
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

interface ResourceMovementTask {
  amount: number;
  mineralType: ResourceConstant;
  fromId: string;
  toId: string;
  pickedUp: boolean
}

interface BoostRequest {
  actionToBoost: string;
  tierOfBoost: number;
  numberOfPartsToBoost: number;
  probeId: string;
  mineralUsedForBoost?: ResourceConstant;
  mineralAmountNeeded?: number;
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
