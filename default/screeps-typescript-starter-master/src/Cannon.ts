import { profile } from "./Profiler";
import { GetRoomObjects } from "GetRoomObjects";

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


  public cannonLogic(): void {
    let enemy = GetRoomObjects.getClosestEnemy(this);
    if (enemy) {
      this.attack(enemy);
    }
    else {
      let damagedUnit = GetRoomObjects.getClosestDamagedUnit(this);
      if (damagedUnit) {
        this.heal(damagedUnit);
      }
      else if (this.energy > this.energyCapacity * 0.5) {
        let structure = GetRoomObjects.getClosestStructureToRepairByRange(this.pos, 0.5);
        if (structure) {
          this.repair(structure);
        }
        else {
          let structure = GetRoomObjects.getClosestStructureToRepairByRange(this.pos, 0.8);
          if (structure) {
            this.repair(structure);
          }
          else if (Game.time % 10 < 5) {
            let structure = GetRoomObjects.getClosestStructureToRepairByRange(this.pos, 0.8, true);
            if (structure) {
              this.repair(structure);
            }
          }
        }
      }
    }
  }
}
