export class OrderSchedule {
  resourceType: ResourceConstant
  price: number
  thresholdForSell: number

  constructor(resourceType: ResourceConstant, price: number, thresholdForSell: number) {
    this.resourceType = resourceType;
    this.price = price;
    this.thresholdForSell = thresholdForSell
  }
}
