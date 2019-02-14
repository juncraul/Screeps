import { ErrorMapper } from "utils/ErrorMapper";
import * as Mothership from "Mothership";
import { MemoryManager } from "MemoryManager";
import { BaseBuilder } from "BaseBuilder/BaseBuilder";
import { Profiler } from "Profiler";
//import { Helper } from "Helper";
//import { Helper } from "Helper";
//import { PathLogic } from "PathLogic";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  //For new game the following commands will have to be run, this should be automated.
  //Memory.profiler = {}
  //Memory.cpu = {}
  //Memory.cpu.history = []
  //Memory.paths = {}

  
  //let roomPos = new RoomPosition(10, 10, "E33N44");
  //let room = new Room("E33N44")
  //let controller = roomPos.findClosestByPath(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) });
  //let cpuUsage;

  //if (controller) {
  //  console.log("Start a: ")
  //  cpuUsage = Game.cpu.getUsed();
  //  console.log(roomPos.findClosestByPath(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) }));
  //  console.log(Game.cpu.getUsed() - cpuUsage)

  //  console.log("Start b: ")
  //  cpuUsage = Game.cpu.getUsed();
  //  Helper.setCashedMemory("Controller-E33N44", controller.id)
  //  console.log(Game.cpu.getUsed() - cpuUsage)

  //  console.log("Start c: ")
  //  cpuUsage = Game.cpu.getUsed();
  //  console.log(Game.getObjectById(Helper.getCashedMemory("Controller-E33N44", null)))
  //  console.log(Game.cpu.getUsed() - cpuUsage)

  //  console.log("Start d: ")
  //  cpuUsage = Game.cpu.getUsed();
  //  console.log(room.find(FIND_STRUCTURES, { filter: structure => (structure.structureType == STRUCTURE_CONTROLLER) }));
  //  console.log(Game.cpu.getUsed() - cpuUsage)
  //}

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
