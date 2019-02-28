
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
  moveDestination?: RoomPosition;
  harvestCooldownXTicks?: number;
  lastHarvestTick?: number;
  resourceMovementTask?: ResourceMovementTask;
  bodyPartsUpgraded?: boolean;
  siteId?: string;
}

interface Path {
  createdOn: number;
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

interface MovementOption {
  range?: number;
  stroke?: string;
}

interface BattleStats {
  enemy: Creep;
  firstEncounter: number;
  numberHits: number;
  cooldown?: number;
}

interface ISite {
  run(): void;
}

interface IMemoryManager {
  
}

interface IMastermind {
  probesAtSites: { [siteId: string]: string[] };
  sites: ISite[];

  initialize(): void;
  refresh(): void;
  cache(): void;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
    Profiler: Profiler;
    MemoryManager: IMemoryManager
    Mastermind: IMastermind
  }

}

declare var Mastermind: IMastermind;
declare const NO_ACTION: 1;
