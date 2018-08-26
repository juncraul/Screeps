import { Tasks } from "Tasks";


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
  
  constructor(terminal: StructureTerminal) {
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
  }

  setUpOrders() {
    let orders = Tasks.getOrdersToCreate();
    let ordersFromTerminalRoom = TradeHub.getOrdersFromRoom(this.room);
    let thisTradeHub = this;

    for (var i = 0; i < orders.length; i++) {
      let availableForSale = thisTradeHub.store[<ResourceConstant>orders[i].resourceType]! - orders[i].thresholdForSell;
      if (availableForSale <= 0)
        continue;
      if (ordersFromTerminalRoom.filter(ord => ord.resourceType == orders[i].resourceType).length == 0) {
        thisTradeHub.createOrder(ORDER_SELL, orders[i].resourceType, orders[i].price, availableForSale)
      }
    }
  }

  createOrder(type: string, resourceType: MarketResourceConstant, price: number, amount: number) {
    let result = Game.market.createOrder(type, resourceType, price, amount, this.room.name);
    console.log(`Result of the order creation is: ${result} Type:${type} resourceType:${resourceType} price:${price} amount${amount}`)
  }

  static getOrdersFromRoom(room: Room): Order[] {
    return Game.market.getAllOrders({ roomName: room.name });
  }

  static getTerminalFromRoom(room: Room): StructureTerminal | null {
    let structure = room.find(FIND_MY_STRUCTURES, { filter: structure => structure.structureType == STRUCTURE_TERMINAL })[0];
    if (structure instanceof StructureTerminal) {
      return structure;
    }
    return null;
  }

}
