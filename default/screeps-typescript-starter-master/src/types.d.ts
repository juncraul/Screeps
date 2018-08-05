// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  name: string;
  role: string;
  roleString: string;
  log: boolean;
  gathering: boolean;
  assignedMineTaskId?: number;
  assignedContainerId?: string;
  assignedTargetId?: string;
  isUpgradingController: boolean;
  isBuilding: boolean;
  repairTargetId?: string;
}





interface Memory {
  uuid: number;
  log: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
