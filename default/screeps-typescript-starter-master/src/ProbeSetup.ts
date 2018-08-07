export interface bodySetup {
  pattern: BodyPartConstant[];			// body pattern to be repeated
  sizeLimit: number;						// maximum number of unit repetitions to make body
  prefix: BodyPartConstant[];				// stuff at beginning of body
  suffix: BodyPartConstant[];				// stuff at end of body
  proportionalPrefixSuffix: boolean;		// (?) prefix/suffix scale with body size
  ordered: boolean;						// (?) assemble as WORK WORK MOVE MOVE instead of WORK MOVE WORK MOVE
}

// Return the cost of an entire array of body parts
export function bodyCost(bodyparts: BodyPartConstant[]): number {
  return _.sum(_.map(bodyparts, part => BODYPART_COST[part]));
}

export class ProbeSetup {
  bodySetup: bodySetup;
  name: string;
  memory: any;

  constructor(bodySetup = {}, name: string, memory: any) {
    _.defaults(bodySetup, {
      pattern: [],
      sizeLimit: Infinity,
      prefix: [],
      suffix: [],
      proportionalPrefixSuffix: false,
      ordered: true,
    });
    this.bodySetup = bodySetup as bodySetup;
    this.name = name;
    this.memory = memory;
  }

  generateBody(availableEnergy: number): BodyPartConstant[] {
    let patternCost, patternLength, numRepeats: number;
    let prefix = this.bodySetup.prefix;
    let suffix = this.bodySetup.suffix;
    let body: BodyPartConstant[] = [];
    // calculate repetitions
    if (this.bodySetup.proportionalPrefixSuffix) { // if prefix and suffix are to be kept proportional to body size
      patternCost = bodyCost(prefix) + bodyCost(this.bodySetup.pattern) + bodyCost(suffix);
      patternLength = prefix.length + this.bodySetup.pattern.length + suffix.length;
      let energyLimit = Math.floor(availableEnergy / patternCost); // max number of repeats room can produce
      let maxPartLimit = Math.floor(MAX_CREEP_SIZE / patternLength); // max repetitions resulting in <50 parts
      numRepeats = Math.min(energyLimit, maxPartLimit, this.bodySetup.sizeLimit);
    } else { // if prefix and suffix don't scale
      let extraCost = bodyCost(prefix) + bodyCost(suffix);
      patternCost = bodyCost(this.bodySetup.pattern);
      patternLength = this.bodySetup.pattern.length;
      let energyLimit = Math.floor((availableEnergy - extraCost) / patternCost);
      let maxPartLimit = Math.floor((MAX_CREEP_SIZE - prefix.length - suffix.length) / patternLength);
      numRepeats = Math.min(energyLimit, maxPartLimit, this.bodySetup.sizeLimit);
    }
    // build the body
    if (this.bodySetup.proportionalPrefixSuffix) { // add the prefix
      for (let i = 0; i < numRepeats; i++) {
        body = body.concat(prefix);
      }
    } else {
      body = body.concat(prefix);
    }

    if (this.bodySetup.ordered) { // repeated body pattern
      for (let part of this.bodySetup.pattern) {
        for (let i = 0; i < numRepeats; i++) {
          body.push(part);
        }
      }
    } else {
      for (let i = 0; i < numRepeats; i++) {
        body = body.concat(this.bodySetup.pattern);
      }
    }

    if (this.bodySetup.proportionalPrefixSuffix) { // add the suffix
      for (let i = 0; i < numRepeats; i++) {
        body = body.concat(suffix);
      }
    } else {
      body = body.concat(suffix);
    }
    // return it
    return body;
  }
}
