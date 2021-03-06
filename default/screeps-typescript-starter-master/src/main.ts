import { ErrorMapper } from "utils/ErrorMapper";
import { Mothership } from "Mothership";
import { MemoryManager } from "MemoryManager";
import { BaseBuilder } from "BaseBuilder/BaseBuilder";


import * as Profiler from "./Profiler";
import MM from "Mastermind";
import { PathLogic } from "PathLogic";
global.Profiler = Profiler.init();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  //For new game the following commands will have to be run, this should be automated.
  //Memory.profiler = {}
  //Memory.cpu = {}
  //Memory.cpu.history = []
  //Memory.paths = {}
  //Memory.rooms = {}
  //Memory.profiler = {}
  //Memory.profiler.data = {}
  //Memory.market = []

  //MemoryManager.initializeMemory();
  global.MemoryManager = new MemoryManager();

  try {
    if (!Mastermind || Game.time % 20 == 0) {
      delete global.Mastermind;
      global.Mastermind = new MM();
      Mastermind.initialize();
      PathLogic.cleanUpPaths();
    }
    else {
      Mastermind.refresh();
    }
  }
  catch{
    delete global.Mastermind;
    global.Mastermind = new MM();
    Mastermind.initialize();
  }


  //if (!Mastermind || Game.time % 20 == 0) {
  //  delete global.Mastermind;
  //  global.Mastermind = new MM();
  //  Mastermind.initialize();
  //} else {
  //  //refresh
  //}



  Mothership.initialize();
  Mothership.work();

  BaseBuilder.storeBuildOptionInMemory();
  BaseBuilder.logicCreateConstructionSites();


  // Automatically delete memory of missing creeps
  for (let name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  Mastermind.cache();

});
