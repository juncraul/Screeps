import { profile } from "Profiler";
import { Probe } from "Probe";


@profile
export abstract class Site implements ISite {

  name: string;
  room: Room;
  id: string;
  pos: RoomPosition;
  private _creeps: Creep[];

  constructor(name: string, roomPosition: RoomPosition, id: string) {
    this.name = name;
    this.room = Game.rooms[roomPosition.roomName];
    this.id = id;
    this.pos = roomPosition;
    this._creeps = [];
    for (let i = 0; i < Mastermind.probesAtSites[id].length; i++) {
      let creep = Game.creeps[Mastermind.probesAtSites[id][i]];
      if (creep) {
        this._creeps.push(creep)
      } else {
        _.remove(Mastermind.probesAtSites[id], cr => cr == Mastermind.probesAtSites[id][i]);
        i--;
      }
    }
  }

  protected getProbes(): Probe[] {
    return _.map(this._creeps, creep => new Probe(creep));
  }

  protected assignAnIdleCreep(role: string): void {
    // Find an idle creep
    let idleCreep = _.filter(Game.creeps, (creep) => creep.memory.siteId == undefined && creep.memory.role == role && creep.memory.homeName == this.room.name)[0]
    if (idleCreep) {
      bindCreepToSite(idleCreep, this);
    }
  }

  protected freeUpCreep(probe: Probe): void {
    let siteId = probe.memory.siteId

    if (siteId) {
      _.remove(Mastermind.probesAtSites[siteId], cr => cr == probe.name);
      probe.memory.siteId = undefined;
    }
  }

  abstract run(): void;
}

export function bindCreepToSite(creep: Creep, site: Site) {
  let siteId = creep.memory.siteId

  if (siteId) {
    _.remove(Mastermind.probesAtSites[siteId], cr => cr == creep.name);
  }

  creep.memory.siteId = site.id;
  Mastermind.probesAtSites[site.id].push(creep.name);
}
