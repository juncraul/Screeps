//import { Tasks } from "Tasks";
import { profile } from "./Profiler";
import { Tasks } from "Tasks";
import { TradeHub } from "TradeHub";
import { REAGENTS, THRESHOLD_LAB_MIN_REFILL, REACTION_BATCH } from "Constants";
import { Helper } from "Helper";

@profile
export class Laboratory {
  labs: StructureLab[];
  labReagentOne: StructureLab;
  labReagentTwo: StructureLab;
  labResults: StructureLab[];
  labForBoosting: StructureLab;

  constructor(labs: StructureLab[]) {
    this.labs = labs;
    this.labReagentOne = labs[0];
    this.labReagentTwo = labs[1];
    this.labResults = labs.slice(2);
    this.labForBoosting = labs[labs.length - 1];
  }

  getLaboratoryJob(tradeHub: TradeHub): ResourceMovementTask | null {
    if (this.labs.length < 3)
      return null;
    let reactionSchedules = Tasks.getReactionSchedules();
    let currentReactionFromMemory = Helper.getCashedMemory("CurrentReaction-" + tradeHub.room.name, null);
    if (currentReactionFromMemory) {
      let currentReaction = reactionSchedules.filter(a => a.resourceType == currentReactionFromMemory)[0]
      if (currentReaction) {
        let amoutToProduce = currentReaction.threshold - tradeHub.getResourceAmountFromTerminal(currentReaction.resourceType);
        if (amoutToProduce > 0) {
          let reagent0 = REAGENTS[currentReaction.resourceType]["0"];
          let reagent1 = REAGENTS[currentReaction.resourceType]["1"];
          if (tradeHub.getResourceAmountFromTerminal(reagent0) + this.getMineralAmountFromLab(this.labReagentOne, reagent0) > 50
            && tradeHub.getResourceAmountFromTerminal(reagent1) + this.getMineralAmountFromLab(this.labReagentTwo, reagent1) > 50) {
            reactionSchedules = []
            reactionSchedules.push(currentReaction)//This current reaction is still ongoing
          }
          else {
            Helper.setCashedMemory("CurrentReaction-" + tradeHub.room.name, null);//Out of reagent for current reaction, choose another reaction
          }
        } else {
          Helper.setCashedMemory("CurrentReaction-" + tradeHub.room.name, null);//We had enough of this reaction remove from memory
        }
      }
    }
    for (let i in reactionSchedules) {
      for (let j in this.labResults) {
        let amoutToProduce = reactionSchedules[i].threshold - tradeHub.getResourceAmountFromTerminal(reactionSchedules[i].resourceType);
        if (amoutToProduce > 0) {
          amoutToProduce = amoutToProduce > REACTION_BATCH ? REACTION_BATCH : amoutToProduce;//Just do reactions in batches
          Helper.setCashedMemory("CurrentReaction-" + tradeHub.room.name, reactionSchedules[i].resourceType);
          let reagent0 = REAGENTS[reactionSchedules[i].resourceType]["0"];
          let reagent1 = REAGENTS[reactionSchedules[i].resourceType]["1"];
          let minReagentRemaining = tradeHub.getResourceAmountFromTerminal(reagent0) < tradeHub.getResourceAmountFromTerminal(reagent1) ? tradeHub.getResourceAmountFromTerminal(reagent0) : tradeHub.getResourceAmountFromTerminal(reagent1)
          amoutToProduce = minReagentRemaining < amoutToProduce ? minReagentRemaining : amoutToProduce;//Terminal almost empty, do reaction with what is left.
          let merchantTask: ResourceMovementTask | null;
          merchantTask = this.getMerchantTaskPerLab(this.labReagentOne, reagent0, amoutToProduce - this.getMineralAmountFromLab(this.labResults[j], reactionSchedules[i].resourceType), tradeHub.terminal)
          if (merchantTask) {
            return merchantTask;
          } else {
            merchantTask = this.getMerchantTaskPerLab(this.labReagentTwo, reagent1, amoutToProduce - this.getMineralAmountFromLab(this.labResults[j], reactionSchedules[i].resourceType), tradeHub.terminal)
            if (merchantTask) {
              return merchantTask;
            } else {
              this.labResults[j].runReaction(this.labReagentOne, this.labReagentTwo);
              if (this.labResults[j].mineralAmount >= THRESHOLD_LAB_MIN_REFILL //Remove minerals after a while from resulting lab, also remove all if we want to schedule something else in
                || (this.labResults[j].mineralType != null && this.labResults[j].mineralType != reactionSchedules[i].resourceType)) {
                return {
                  amount: this.labResults[j].mineralAmount,
                  mineralType: this.labResults[j].mineralType!,
                  fromId: this.labResults[j].id,
                  toId: tradeHub.terminal.id,
                  pickedUp: false
                }
              } else {
                return null;
              }
            }
          }
        }
      }
    }
    return null;
  }

  getMerchantTaskPerLab(lab: StructureLab, mineral: ResourceConstant, amount: number, terminal: StructureTerminal): ResourceMovementTask | null {
    let almostFinished = amount < THRESHOLD_LAB_MIN_REFILL;
    if (lab.mineralType != mineral && lab.mineralType != null) {
      return {
        amount: lab.mineralAmount,
        mineralType: lab.mineralType,
        fromId: lab.id,
        toId: terminal.id,
        pickedUp: false
      }
    } else if (lab.mineralAmount + (almostFinished ? 0 : THRESHOLD_LAB_MIN_REFILL) < amount) {//Just added a bit of threashold so probe will not go back and fort with 5 minerals in its hands
      return {//Also cancel the threashold if we are about to finish the current reaction
        amount: (almostFinished ? THRESHOLD_LAB_MIN_REFILL : amount - lab.mineralAmount),//If almost finished just add plenty more minerals.
        mineralType: mineral,
        fromId: terminal.id,
        toId: lab.id,
        pickedUp: false
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
