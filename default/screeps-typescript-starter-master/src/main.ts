import { ErrorMapper } from "utils/ErrorMapper";
import * as Mothership from "Mothership";
import { MemoryManager } from "MemoryManager";
import { BaseBuilder } from "BaseBuilder/BaseBuilder";
import { Profiler } from "Profiler";
//import { PathLogic } from "PathLogic";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  //For new game the following commands will have to be run, this should be automated.
  //Memory.profiler = {}
  //Memory.cpu = {}
  //Memory.cpu.history = []
  //Memory.paths = {}

  Profiler.start("init");
  MemoryManager.initializeMemory();
  Profiler.end("init");

  Profiler.start("Mothership");
  Mothership.run();
  Profiler.end("Mothership");

  Profiler.start("BaseBuilder");
  BaseBuilder.storeBuildOptionInMemory();
  BaseBuilder.logicCreateConstructionSites();
  Profiler.end("BaseBuilder");

  //PathLogic.getPath(new RoomPosition(17, 15, "E33N45"), new RoomPosition(31, 48, "E33N45"));
  //console.log(PathLogic.generateNewPath(new RoomPosition(17, 15, "E33N45"), new RoomPosition(31, 48, "E33N45")))

  Profiler.start("CleanUp");
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  Profiler.end("CleanUp");

  try { Profiler.finalize(); } catch (e) { console.log("error checking Profiler:\n", e.stack); }
});
