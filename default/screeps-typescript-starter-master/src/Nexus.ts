import { ProbeSetup } from 'ProbeSetup';
import { Probe } from 'Probe';

export interface SpawnRequest {
  setup: ProbeSetup;					// creep body generator to use
  nexus: Nexus;					// overlord requesting the creep
}


export class Nexus {

  public static spawnCreep(probeSetup: ProbeSetup, spawnToUse: StructureSpawn | Room, energy: number): number {
    let result = -1;
    if (spawnToUse instanceof StructureSpawn) {
      result = spawnToUse.spawnCreep(probeSetup.generateBody(energy), probeSetup.name, {
        memory: probeSetup.memory
      });
    }
    else {
      let spawns = spawnToUse.find(FIND_MY_SPAWNS);
      for (let i = 0; i < spawns.length; i++) {
        if (!spawns[i].canCreateCreep) continue;
        result = spawns[i].spawnCreep(probeSetup.generateBody(energy), probeSetup.name, {
          memory: probeSetup.memory
        });
        break;
      }
    }
    return result;
  }

  public static getProbes(role: string, room?: string, checkRemote?: boolean): Probe[] {
    let creeps;
    if (room == undefined) {
      creeps = _.filter(Game.creeps, (creep) => creep.memory.role == role);
    } else if (checkRemote == undefined || !checkRemote) {
      creeps = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.room.name == room);
    } else {
      creeps = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.memory.remote == room);
    }
    let probes = new Array<Probe>();
    creeps.forEach(function (creep) {
      probes.push(new Probe(creep));
    });
    return probes;
  }
}
