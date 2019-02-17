export class OrderSchedule {
  resourceType: ResourceConstant
  price: number
  threshold: number

  constructor(resourceType: ResourceConstant, price: number, threshold: number) {
    this.resourceType = resourceType;
    this.price = price;
    this.threshold = threshold
  }
}
