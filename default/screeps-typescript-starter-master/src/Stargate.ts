
export class Stargate {
  link: StructureLink;
  cooldown: number;
  energy: number;
  energyCapacity: number;
  hits: number;
  hitsMax: number;
  id: string;
  my: boolean;
  owner: Owner;
  pos: RoomPosition;
  room: Room;
  structureType: StructureConstant;

  constructor(link: StructureLink) {
    this.link = link;
    this.cooldown = link.cooldown;
    this.energy = link.energy;
    this.energyCapacity = link.energyCapacity;
    this.hits = link.hits;
    this.hitsMax = link.hitsMax;
    this.id = link.id;
    this.my = link.my;
    this.owner = link.owner;
    this.pos = link.pos;
    this.room = link.room;
    this.structureType = link.structureType;

  }

  transferEnergy(stargate: Stargate) {
    this.link.transferEnergy(stargate.link);
  }

  static getOriginStargates(room: Room): Stargate[] {
    var linkFromCollection: Stargate[];
    linkFromCollection = []
    var sources = room.find(FIND_SOURCES);

    //Get From links from nearby sources
    for (var i = 0; i < sources.length; i++) {
      var targetLink = sources[i].pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: (structure: any) => { return structure.structureType == STRUCTURE_LINK } })[0];
      if (targetLink && targetLink instanceof StructureLink) {
        linkFromCollection.push(new Stargate(targetLink));
      }
    }
    
    //Get From links from borders
    var linksBorder = room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_LINK && (structure.pos.x < 4 || structure.pos.y < 4 || structure.pos.x > 45 || structure.pos.y > 45) } })
    for (var i = 0; i < linksBorder.length; i++) {
      var link = linksBorder[i];
      if (link instanceof StructureLink) {
        linkFromCollection.push(new Stargate(link));
      }
    }

    return linkFromCollection;
  }

  static getDestinationStargates(room: Room): Stargate[] {
    var linkToCollection: Stargate[];
    linkToCollection = [];
    
    //Get To links from nearby controller
    if (room.controller) {
      var link = room.controller.pos.findInRange(FIND_MY_STRUCTURES, 2, { filter: { structureType: STRUCTURE_LINK } })[0];
      if (link instanceof StructureLink) {
        linkToCollection.push(new Stargate(link));
      }
    }

    //Get To links from nearby storages
    var storage = room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_STORAGE } })[0];
    if (storage) {
      var link = storage.pos.findInRange(FIND_MY_STRUCTURES, 2, { filter: { structureType: STRUCTURE_LINK } })[0];
      if (link && link instanceof StructureLink) {
        linkToCollection.push(new Stargate(link));
      }
    }

    return linkToCollection;
  }

  public static moveEnergyAround(room: Room) {
    let originStargates = Stargate.getOriginStargates(room);
    let destinationStargates = Stargate.getDestinationStargates(room);

    for (var i = 0; i < originStargates.length; i++) {
      for (var j = 0; j < destinationStargates.length; j++) {
        if (originStargates[i] == null && destinationStargates[j] == null) continue;
        if (originStargates[i].energy > 100 && destinationStargates[j].energy < 500) {
          originStargates[i].transferEnergy(destinationStargates[j]);
        }
      }
    }
  }
}
