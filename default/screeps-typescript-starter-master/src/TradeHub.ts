import { Tasks } from "Tasks";
import { profile } from "./Profiler";

@profile
export class TradeHub {
  cooldown: number;
  hits: number;
  hitsMax: number;
  id: string;
  my: boolean;
  owner: Owner;
  pos: RoomPosition;
  room: Room;
  store: StoreDefinition;
  storeCapacity: number;
  structureType: StructureConstant;
  terminal: StructureTerminal;
  storage: StructureStorage;

  //One time only send resource for rooms in need
  //Game.getObjectById("5c6884ec6f956a230ba5654c").send(RESOURCE_ENERGY, 10000, "E32N44", "yoyoy");

  constructor(terminal: StructureTerminal, storage: StructureStorage) {
    this.cooldown = terminal.cooldown;
    this.hits = terminal.hits;
    this.hitsMax = terminal.hitsMax;
    this.id = terminal.id;
    this.my = terminal.my;
    this.owner = terminal.owner;
    this.pos = terminal.pos;
    this.room = terminal.room;
    this.store = terminal.store;
    this.storeCapacity = terminal.storeCapacity;
    this.structureType = terminal.structureType;
    this.terminal = terminal;
    this.storage = storage
  }

  setUpSellOrders() {
    let orders = Tasks.getSellOrdersToCreate();

    for (let i = 0; i < orders.length; i++) {
      let amountOfResource = this.getResourceAmountFromTerminal(orders[i].resourceType) + this.getResourceAmountFromStorage(orders[i].resourceType);
      let availableForSale = this.getResourceAmountFromTerminal(orders[i].resourceType) - orders[i].threshold;
      let ordersFromTerminalRoom = TradeHub.getOrdersFromRoom(this.room, orders[i].resourceType);
      if (amountOfResource < orders[i].threshold * 2 //Leave at least double
        || ordersFromTerminalRoom.length > 0 //Order already placed for this resource
        || availableForSale <= 0) { //Available to sell so that we leave the threshold in terminal
        continue;
      }
      this.createOrder(ORDER_SELL, orders[i].resourceType, orders[i].price, availableForSale)
    }
  }

  setUpBuyOrders() {

  }

  buyFromMarket() {
    if (this.cooldown > 0) {
      return;
    }
    let orders = Tasks.getBuysFromMarket();
    for (let i in orders) {
      let ordersMarket = TradeHub.getOrdersFromMarket(orders[i].resourceType, orders[i].price, "sell");
      let amountToBuy = orders[i].threshold - this.getResourceAmountFromTerminal(orders[i].resourceType)
      if (amountToBuy <= 0)
        continue;
      //TODO: need to take in consideration the order's availablitity 
      ordersMarket = ordersMarket.sort((a, b) =>
        TradeHub.getTotalTranCost(amountToBuy, a.price, this.room.name, a.roomName!)
        -
        TradeHub.getTotalTranCost(amountToBuy, b.price, this.room.name, b.roomName!)
      )
      if (ordersMarket.length == 0)
        continue;
      if (this.getResourceAmountFromTerminal(RESOURCE_ENERGY) < ordersMarket[0].price * amountToBuy) {//If terminal has less energy than the transfer cost, go to next order
        continue;
      }
      
      if (this.completeOrder(ordersMarket[0], amountToBuy, this.room.name) == OK) {
        return;//One order was complited succesfully we can exit as Terminal will go in cooldown.
      }
    }
  }

  sellToMarket() {

  }

  createOrder(type: string, resourceType: MarketResourceConstant, price: number, amount: number) {
    let result = Game.market.createOrder(type, resourceType, price, amount, this.room.name);
    let storeResult = `Time ${Game.time} Result of the order creation is: ${result} Type:${type} resourceType:${resourceType} price:${price} amount${amount}`;
    Memory.market.push(storeResult);
    if (Memory.market.length > 100)
      Memory.market.shift()
    console.log(storeResult)
  }

  completeOrder(order: Order, amount: number, targetRoom: string): number {
    let result = Game.market.deal(order.id, amount, targetRoom);
    let storeResult = `Time ${Game.time} Result of the order deal is: ${result} ID:${order.id} TargetRoom:${targetRoom} Amount:${amount} Price:${order.price} Resource:${order.resourceType} TotalPrice: ${TradeHub.getTotalTranCost(amount, order.price, this.room.name, order.roomName!)}`;
    Memory.market.push(storeResult);
    if (Memory.market.length > 100)
      Memory.market.shift()
    console.log(storeResult)
    return result;
  }

  getResourceAmountFromTerminal(resource: ResourceConstant): number {
    return (this.store[resource] ? this.store[resource]! : 0)
  }
  getResourceAmountFromStorage(resource: ResourceConstant): number {
    return (this.store[resource] ? this.store[resource]! : 0)
  }

  static getTotalTranCost(amountToBuy: number, price: number, roomName1: string, roomName2: string): number {
    return (Game.market.calcTransactionCost(amountToBuy, roomName1, roomName2) + price * amountToBuy)
  }

  static getOrdersFromRoom(room: Room, resource?: ResourceConstant): Order[] {
    if (resource) {
      return Game.market.getAllOrders({ roomName: room.name, resourceType: resource });//TODO: use the orders object
    } else {
      return Game.market.getAllOrders({ roomName: room.name });//TODO: use the orders object
    }
  }

  static getOrdersFromMarket(resource: ResourceConstant, price: number, orderType: string): Order[] {
    let orders = Game.market.getAllOrders({ resourceType: resource, type: orderType });
    let ordersReturn: Order[] = []
    for (let i in orders) {
      if (orders[i].price <= price) {
        ordersReturn.push(orders[i]);
      }
    }
    return ordersReturn;
  }
}
