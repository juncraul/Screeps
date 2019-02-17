//import { Tasks } from "Tasks";
import { profile } from "./Profiler";
import { Tasks } from "Tasks";
import { TradeHub } from "TradeHub";
import { REAGENTS, THRESHOLD_LAB_MIN_REFILL } from "Constants";
import { Helper } from "Helper";

@profile
export class Laboratory {
  //cooldown: number;
  //energy: number;
  //energyCapacity: number;
  //mineralAmount: number;
  //mineralType: _ResourceConstantSansEnergy | null;;
  //mineralCapacity: number;
  //hits: number;
  //hitsMax: number;
  //id: string;
  //my: boolean;
  //owner: Owner;
  //pos: RoomPosition;
  //room: Room;
  //structureType: StructureConstant;
  labs: StructureLab[];

  constructor(labs: StructureLab[]) {
    //this.cooldown = lab.cooldown;
    //this.energy = lab.energy;
    //this.energyCapacity = lab.energyCapacity;
    //this.mineralAmount = lab.mineralAmount;
    //this.mineralType = lab.mineralType;
    //this.mineralCapacity = lab.mineralCapacity;
    //this.hits = lab.hits;
    //this.hitsMax = lab.hitsMax;
    //this.id = lab.id;
    //this.my = lab.my;
    //this.owner = lab.owner;
    //this.pos = lab.pos;
    //this.room = lab.room;
    //this.structureType = lab.structureType;
    this.labs = labs;
  }

  getLaboratoryJob(tradeHub: TradeHub): MerchantTask | null {
    let reactionSchedules = Tasks.getReactionSchedules();
    let currentReactionFromMemory = Helper.getCashedMemory("CurrentReaction", null);
    if (currentReactionFromMemory) {
      let currentReaction = reactionSchedules.filter(a => a.resourceType == currentReactionFromMemory)[0]
      if (currentReaction) {
        let amoutToProduce = currentReaction.threshold - tradeHub.getResourceAmountFromTerminal(currentReaction.resourceType);
        if (amoutToProduce > 0) {
          let reagent0 = REAGENTS[currentReaction.resourceType]["0"];
          let reagent1 = REAGENTS[currentReaction.resourceType]["1"];
          if (tradeHub.getResourceAmountFromTerminal(reagent0) + this.getMineralAmountFromLab(this.labs[0], reagent0) > 50
            && tradeHub.getResourceAmountFromTerminal(reagent1) + this.getMineralAmountFromLab(this.labs[1], reagent1) > 50) {
            reactionSchedules = []
            reactionSchedules.push(currentReaction)//This current reaction is still ongoing
          }
          else {
            Helper.setCashedMemory("CurrentReaction", null);//Out of reagent for current reaction, choose another reaction
          }
        } else {
          Helper.setCashedMemory("CurrentReaction", null);//We had enough of this reaction remove from memory
        }
      }
    }
    for (let i in reactionSchedules) {
      let amoutToProduce = reactionSchedules[i].threshold - tradeHub.getResourceAmountFromTerminal(reactionSchedules[i].resourceType);
      if (amoutToProduce > 0) {
        Helper.setCashedMemory("CurrentReaction", reactionSchedules[i].resourceType);
        let reagent0 = REAGENTS[reactionSchedules[i].resourceType]["0"];
        let reagent1 = REAGENTS[reactionSchedules[i].resourceType]["1"];
        let merchantTask: MerchantTask | null;
        merchantTask = this.getMerchantTaskPerLab(this.labs[0], reagent0, amoutToProduce)
        if (merchantTask) {
          return merchantTask;
        } else {
          merchantTask = this.getMerchantTaskPerLab(this.labs[1], reagent1, amoutToProduce)
          if (merchantTask) {
            return merchantTask;
          } else {
            this.labs[2].runReaction(this.labs[0], this.labs[1]);
            if (this.labs[2].mineralAmount >= THRESHOLD_LAB_MIN_REFILL //Remove minerals after a while from resulting lab, also remove all if we want to schedule something else in
              || (this.labs[2].mineralType != null && this.labs[2].mineralType != reactionSchedules[i].resourceType)) {
              return {
                remove: true,
                lab: this.labs[2]
              }
            } else {
              return null;
            }
          }
        }
      }
    }
    return null;
  }

  getMerchantTaskPerLab(lab: StructureLab, mineral: ResourceConstant, amount: number): MerchantTask | null {
    let almostFinished = amount < THRESHOLD_LAB_MIN_REFILL;
    if (lab.mineralType != mineral && lab.mineralType != null) {
      return {
        remove: true,
        lab: lab
      }
    } else if (lab.mineralAmount + (almostFinished ? 0 : THRESHOLD_LAB_MIN_REFILL) < amount) {//Just added a bit of threashold so probe will not go back and fort with 5 minerals in its hands
      return {//Also cancel the threashold if we are about to finish the current reaction 
        add: true,
        mineralType: mineral,
        amount: almostFinished ? THRESHOLD_LAB_MIN_REFILL : amount - lab.mineralAmount,//If almost finished just add plenty more minerals.
        lab: lab
      }
    }
    else {
      return null;
    }
  }

  getMineralAmountFromLab(lab: StructureLab, mineral: ResourceConstant): number {
    return lab.mineralType ? (lab.mineralType == mineral ? lab.mineralAmount : 0) : 0
  }


  static getTerminalFromRoom(room: Room): StructureTerminal | null {
    let structure = room.find(FIND_MY_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_TERMINAL })[0];
    if (structure instanceof StructureTerminal) {
      return structure;
    }
    return null;
  }

}
