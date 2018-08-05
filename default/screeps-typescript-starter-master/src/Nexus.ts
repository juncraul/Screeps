import { ProbeSetup } from 'ProbeSetup';
import { Probe } from 'Probe';

export interface SpawnRequest {
  setup: ProbeSetup;					// creep body generator to use
  nexus: Nexus;					// overlord requesting the creep
}


export class Nexus {

  public static spawnCreep(probeSetup: ProbeSetup, spawnToUse: StructureSpawn, energy: number): number {

    let result = spawnToUse.spawnCreep(probeSetup.generateBody(energy), probeSetup.name, {
      memory: probeSetup.memory
    });
    return result;
  }

  public static getProbes(role: string, room?: Room): Probe[] {
    let creeps;
    if (room == undefined) {
      creeps = _.filter(Game.creeps, (creep) => creep.memory.role == role);
    } else {
      creeps = _.filter(Game.creeps, (creep) => creep.memory.role == role && creep.room == room);
    }
    let probes = new Array<Probe>();
    creeps.forEach(function (creep) {
      probes.push(new Probe(creep));
    });
    return probes;
  }
}
