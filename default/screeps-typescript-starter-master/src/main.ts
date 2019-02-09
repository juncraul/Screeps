import { ErrorMapper } from "utils/ErrorMapper";
import * as Mothership from "Mothership";
import { MemoryManager } from "MemoryManager";
import { BaseBuilder } from "BaseBuilder/BaseBuilder";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  MemoryManager.initializeMemory();
  Mothership.run();
  BaseBuilder.storeBuildOptionInMemory();
  BaseBuilder.logicCreateConstructionSites();
  
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
