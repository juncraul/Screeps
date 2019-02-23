//import { Tasks } from "Tasks";
import { profile } from "./Profiler";
import { Tasks } from "Tasks";
import { TradeHub } from "TradeHub";
import { REAGENTS, THRESHOLD_LAB_MIN_REFILL, REACTION_BATCH, BOOST_PARTS, BOOST_RESOURCES } from "Constants";
import { Helper } from "Helper";
import { Probe } from "Probe";

@profile
export class Laboratory {
  room: Room;
  labs: StructureLab[];
  labReagentZero: StructureLab;
  labReagentOne: StructureLab;
  labCompounds: StructureLab[];
  labForBoosting: StructureLab;
  boostRequest?: BoostRequest;
  tradeHub: TradeHub;

  constructor(labs: StructureLab[], tradeHub: TradeHub) {
    this.room = tradeHub.room;
    this.labs = labs;
    this.labReagentZero = labs[0];
    this.labReagentOne = labs[1];
    this.labCompounds = labs.slice(2);
    this.labForBoosting = labs[labs.length - 1];
    this.tradeHub = tradeHub;
    this.boostRequest = Helper.getCashedMemory("BoostRequest-" + this.room.name, null);
  }

  runReaction() {
    for (let i in this.labCompounds) {
      if (this.labCompounds[i].id == this.labForBoosting.id && this.boostRequest && this.boostRequest.mineralUsedForBoost) {
        if (this.boostRequest.mineralUsedForBoost == this.labForBoosting.mineralType) {//Perhaps this if is not needed
          let creep = Game.getObjectById(this.boostRequest.probeId);
          if (creep instanceof Creep) {
            let probe = new Probe(creep);
            let bodyPart = BOOST_PARTS[this.boostRequest.mineralUsedForBoost];
            let alreadyBoostedBodyParts = probe.getNumberOfBoostedBodyPart(bodyPart)
            if (alreadyBoostedBodyParts < this.boostRequest.numberOfPartsToBoost) {
              this.labForBoosting.boostCreep(creep, this.boostRequest.numberOfPartsToBoost - alreadyBoostedBodyParts);
            }
            else {
              probe.memory.bodyPartsUpgraded = true;
              this.boostRequest = undefined;
              Helper.setCashedMemory("BoostRequest-" + this.room.name, null);
            }
          }
          continue;//Don't run reaction for this lab as we have a boost request pending
        }
      } else {
        this.labCompounds[i].runReaction(this.labReagentZero, this.labReagentOne);
      }
    }
  }

  getLaboratoryJob(): ResourceMovementTask | null {
    if (this.labs.length < 3)
      return null;
    let reactionSchedules = Tasks.getReactionSchedules();
    let currentReactionFromMemory = Helper.getCashedMemory("CurrentReaction-" + this.room.name, null);
    if (currentReactionFromMemory) {
      let currentReaction = reactionSchedules.filter(a => a.resourceType == currentReactionFromMemory)[0]
      if (currentReaction) {
        let amoutToProduce = currentReaction.threshold - this.tradeHub.getResourceAmountFromTerminal(currentReaction.resourceType);
        if (amoutToProduce > 0) {
          let reagent0 = REAGENTS[currentReaction.resourceType]["0"];
          let reagent1 = REAGENTS[currentReaction.resourceType]["1"];
          if (this.tradeHub.getResourceAmountFromTerminal(reagent0) + this.getMineralAmountFromLab(this.labReagentZero, reagent0) > 50
            && this.tradeHub.getResourceAmountFromTerminal(reagent1) + this.getMineralAmountFromLab(this.labReagentOne, reagent1) > 50) {
            reactionSchedules = []
            reactionSchedules.push(currentReaction)//This current reaction is still ongoing
          }
          else {
            Helper.setCashedMemory("CurrentReaction-" + this.room.name, null);//Out of reagent for current reaction, choose another reaction
          }
        } else {
          Helper.setCashedMemory("CurrentReaction-" + this.room.name, null);//We had enough of this reaction remove from memory
        }
      }
    }
    for (let i in reactionSchedules) {
      let amoutToProduce = reactionSchedules[i].threshold - this.tradeHub.getResourceAmountFromTerminal(reactionSchedules[i].resourceType);
      if (amoutToProduce > 0) {
        amoutToProduce = amoutToProduce > REACTION_BATCH ? REACTION_BATCH : amoutToProduce;//Just do reactions in batches
        Helper.setCashedMemory("CurrentReaction-" + this.room.name, reactionSchedules[i].resourceType);
        let reagent0 = REAGENTS[reactionSchedules[i].resourceType]["0"];
        let reagent1 = REAGENTS[reactionSchedules[i].resourceType]["1"];
        let minReagentRemaining = this.tradeHub.getResourceAmountFromTerminal(reagent0) < this.tradeHub.getResourceAmountFromTerminal(reagent1) ? this.tradeHub.getResourceAmountFromTerminal(reagent0) : this.tradeHub.getResourceAmountFromTerminal(reagent1)
        amoutToProduce = minReagentRemaining < amoutToProduce ? minReagentRemaining : amoutToProduce;//Terminal almost empty, do reaction with what is left.
        let merchantTask: ResourceMovementTask | null;
        merchantTask = this.getMerchantTaskPerLab(this.labReagentZero, reagent0, amoutToProduce - this.getMineralAmountFromLab(this.labCompounds, reactionSchedules[i].resourceType))
        if (merchantTask) {
          return merchantTask;
        } else {
          merchantTask = this.getMerchantTaskPerLab(this.labReagentOne, reagent1, amoutToProduce - this.getMineralAmountFromLab(this.labCompounds, reactionSchedules[i].resourceType))
          if (merchantTask) {
            return merchantTask;
          } else {
            for (let j in this.labCompounds) {
              if (this.labCompounds[j].id == this.labForBoosting.id && this.boostRequest && this.boostRequest.mineralUsedForBoost && this.boostRequest.mineralAmountNeeded) {
                merchantTask = this.getMerchantTaskPerLab(this.labForBoosting, this.boostRequest.mineralUsedForBoost, this.boostRequest.mineralAmountNeeded)
                if (merchantTask) {
                  return merchantTask;
                }
                continue;//Don't move any resource out of this lab as is it is scheduled to receive boosting materials
              }

              if (this.labCompounds[j].mineralAmount >= THRESHOLD_LAB_MIN_REFILL //Remove minerals after a while from resulting lab, also remove all if we want to schedule something else in
                || (this.labCompounds[j].mineralType != null && this.labCompounds[j].mineralType != reactionSchedules[i].resourceType)) {
                return {
                  amount: this.labCompounds[j].mineralAmount,
                  mineralType: this.labCompounds[j].mineralType!,
                  fromId: this.labCompounds[j].id,
                  toId: this.tradeHub.terminal.id,
                  pickedUp: false
                }
              }
            }
          }
        }
      }
    }
    return null;
  }

  getMerchantTaskPerLab(lab: StructureLab, mineral: ResourceConstant, amount: number): ResourceMovementTask | null {
    let almostFinished = amount <= THRESHOLD_LAB_MIN_REFILL;
    if (lab.mineralType != mineral && lab.mineralType != null) {
      return {
        amount: lab.mineralAmount,
        mineralType: lab.mineralType,
        fromId: lab.id,
        toId: this.tradeHub.terminal.id,
        pickedUp: false
      }
    } else if (lab.mineralAmount + (almostFinished ? 0 : THRESHOLD_LAB_MIN_REFILL) < amount) {//Just added a bit of threashold so probe will not go back and fort with 5 minerals in its hands
      return {//Also cancel the threashold if we are about to finish the current reaction
        amount: (almostFinished ? THRESHOLD_LAB_MIN_REFILL : amount - lab.mineralAmount),//If almost finished just add plenty more minerals.
        mineralType: mineral,
        fromId: this.tradeHub.terminal.id,
        toId: lab.id,
        pickedUp: false
      }
    }
    else {
      return null;
    }
  }

  getMineralAmountFromLab(lab: StructureLab | StructureLab[], mineral: ResourceConstant): number {
    if (lab instanceof StructureLab) {
      return lab.mineralType ? (lab.mineralType == mineral ? lab.mineralAmount : 0) : 0
    }
    else {
      let amount = 0;
      for (let i in lab) {
        amount += this.getMineralAmountFromLab(lab[i], mineral);
      }
      return amount;
    }
  }

  requestBoosting(newBoostRequest: BoostRequest): ScreepsReturnCode {
    if (this.boostRequest)
      return ERR_FULL;
    let mineralAmountForBoost = LAB_BOOST_MINERAL * newBoostRequest.numberOfPartsToBoost;
    let mineralUsedForBoosting = BOOST_RESOURCES[newBoostRequest.actionToBoost][newBoostRequest.tierOfBoost];
    let mineralAmount = this.getMineralAmountFromLab(this.labForBoosting, mineralUsedForBoosting) + this.tradeHub.getResourceAmountFromTerminal(mineralUsedForBoosting);
    if (mineralAmount < mineralAmountForBoost) {
      return ERR_NOT_ENOUGH_RESOURCES;
    }
    newBoostRequest.mineralAmountNeeded = mineralAmountForBoost
    newBoostRequest.mineralUsedForBoost = mineralUsedForBoosting;
    this.boostRequest = newBoostRequest;
    console.log("New Boost Request: " + JSON.stringify(newBoostRequest))
    Helper.setCashedMemory("BoostRequest-" + this.room.name, newBoostRequest);
    return OK;
  }
}
