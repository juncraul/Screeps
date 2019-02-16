import { profile } from "./Profiler";

@profile
export class Cannon {
  energy: number;
  energyCapacity: number;
  tower: StructureTower;
  pos: RoomPosition;


  constructor(tower: StructureTower) {
    this.energy = tower.energy;
    this.energyCapacity = tower.energyCapacity;
    this.pos = tower.pos;
    this.tower = tower;
  }

  repair(structure: Structure) {
    let result = this.tower.repair(structure);
    return result;
  }

  heal(creep: Creep) {
    let result = this.tower.heal(creep);
    return result;
  }

  attack(creep: Creep) {
    let result = this.tower.attack(creep);
    return result;
  }
}
