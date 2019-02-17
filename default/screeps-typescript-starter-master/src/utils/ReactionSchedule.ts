export class ReactionSchedule {
  resourceType: ResourceConstant
  threshold: number

  constructor(resourceType: ResourceConstant, threshold: number) {
    this.resourceType = resourceType;
    this.threshold = threshold
  }
}
