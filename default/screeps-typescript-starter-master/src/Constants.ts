export const MY_SIGNATURE = "Just changing stuff and seeing what happens";

export const PROFILER_ENABLED: boolean = true;
export const THRESHOLD_LAB_MIN_REFILL: number = 300;
export const REACTION_BATCH: number = 500;
export const TERMINAL_MIN_ENERGY: number = 30000;
export const TERMINAL_MAX_ENERGY: number = 50000;
export const TERMINAL_MIN_MINERAL: number = 3000;
export const TERMINAL_MAX_MINERAL: number = 5000;


export const REAGENTS: { [product: string]: [ResourceConstant, ResourceConstant] } = {
  // Tier 0
  [RESOURCE_HYDROXIDE]: [RESOURCE_OXYGEN, RESOURCE_HYDROGEN],
  [RESOURCE_ZYNTHIUM_KEANITE]: [RESOURCE_ZYNTHIUM, RESOURCE_KEANIUM],
  [RESOURCE_UTRIUM_LEMERGITE]: [RESOURCE_UTRIUM, RESOURCE_LEMERGIUM],
  [RESOURCE_GHODIUM]: [RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE],
  // Tier 1
  [RESOURCE_UTRIUM_HYDRIDE]: [RESOURCE_UTRIUM, RESOURCE_HYDROGEN],
  [RESOURCE_UTRIUM_OXIDE]: [RESOURCE_UTRIUM, RESOURCE_OXYGEN],
  [RESOURCE_KEANIUM_HYDRIDE]: [RESOURCE_KEANIUM, RESOURCE_HYDROGEN],
  [RESOURCE_KEANIUM_OXIDE]: [RESOURCE_KEANIUM, RESOURCE_OXYGEN],
  [RESOURCE_LEMERGIUM_OXIDE]: [RESOURCE_LEMERGIUM, RESOURCE_OXYGEN],
  [RESOURCE_LEMERGIUM_HYDRIDE]: [RESOURCE_LEMERGIUM, RESOURCE_HYDROGEN],
  [RESOURCE_ZYNTHIUM_HYDRIDE]: [RESOURCE_ZYNTHIUM, RESOURCE_HYDROGEN],
  [RESOURCE_ZYNTHIUM_OXIDE]: [RESOURCE_ZYNTHIUM, RESOURCE_OXYGEN],
  [RESOURCE_GHODIUM_HYDRIDE]: [RESOURCE_GHODIUM, RESOURCE_HYDROGEN],
  [RESOURCE_GHODIUM_OXIDE]: [RESOURCE_GHODIUM, RESOURCE_OXYGEN],
  // Tier 2
  [RESOURCE_UTRIUM_ACID]: [RESOURCE_UTRIUM_HYDRIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_UTRIUM_ALKALIDE]: [RESOURCE_UTRIUM_OXIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_KEANIUM_ACID]: [RESOURCE_KEANIUM_HYDRIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_KEANIUM_ALKALIDE]: [RESOURCE_KEANIUM_OXIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_LEMERGIUM_ACID]: [RESOURCE_LEMERGIUM_HYDRIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_LEMERGIUM_ALKALIDE]: [RESOURCE_LEMERGIUM_OXIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_ZYNTHIUM_ACID]: [RESOURCE_ZYNTHIUM_HYDRIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_ZYNTHIUM_ALKALIDE]: [RESOURCE_ZYNTHIUM_OXIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_GHODIUM_ACID]: [RESOURCE_GHODIUM_HYDRIDE, RESOURCE_HYDROXIDE],
  [RESOURCE_GHODIUM_ALKALIDE]: [RESOURCE_GHODIUM_OXIDE, RESOURCE_HYDROXIDE],
  // Tier 3
  [RESOURCE_CATALYZED_UTRIUM_ACID]: [RESOURCE_UTRIUM_ACID, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_UTRIUM_ALKALIDE]: [RESOURCE_UTRIUM_ALKALIDE, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_KEANIUM_ACID]: [RESOURCE_KEANIUM_ACID, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]: [RESOURCE_KEANIUM_ALKALIDE, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_LEMERGIUM_ACID]: [RESOURCE_LEMERGIUM_ACID, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]: [RESOURCE_LEMERGIUM_ALKALIDE, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]: [RESOURCE_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_ZYNTHIUM_ACID]: [RESOURCE_ZYNTHIUM_ACID, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_GHODIUM_ACID]: [RESOURCE_GHODIUM_ACID, RESOURCE_CATALYST],
  [RESOURCE_CATALYZED_GHODIUM_ALKALIDE]: [RESOURCE_GHODIUM_ALKALIDE, RESOURCE_CATALYST]
};

export const BOOST_PARTS: { [boostType: string]: BodyPartConstant } = {

  'UH': ATTACK,           //+100% attack effectiveness
  'UO': WORK,             //+200% harvest effectiveness
  'KH': CARRY,            //+50 capacity
  'KO': RANGED_ATTACK,    //+100% rangedAttack and rangedMassAttack effectiveness
  'LH': WORK,             //+50% repair and build effectiveness without increasing the energy cost
  'LO': HEAL,             //+100% heal and rangedHeal effectiveness
  'ZH': WORK,             //+100% dismantle effectiveness
  'ZO': MOVE,             //+100% fatigue decrease speed
  'GH': WORK,             //+50% upgradeController effectiveness without increasing the energy cost
  'GO': TOUGH,            //-30% damage taken
                          
  'UH2O': ATTACK,         //+200% attack effectiveness
  'UHO2': WORK,           //+400% harvest effectiveness
  'KH2O': CARRY,          //+100 capacity
  'KHO2': RANGED_ATTACK,  //+200% rangedAttack and rangedMassAttack effectiveness
  'LH2O': WORK,           //+80% repair and build effectiveness without increasing the energy cost
  'LHO2': HEAL,           //+200% heal and rangedHeal effectiveness
  'ZH2O': WORK,           //+200% dismantle effectiveness
  'ZHO2': MOVE,           //+200% fatigue decrease speed
  'GH2O': WORK,           //+80% upgradeController effectiveness without increasing the energy cost
  'GHO2': TOUGH,          //-50% damage taken
                          
  'XUH2O': ATTACK,        //+300% attack effectiveness
  'XUHO2': WORK,          //+600% harvest effectiveness
  'XKH2O': CARRY,         //+150 capacity
  'XKHO2': RANGED_ATTACK, //+300% rangedAttack and rangedMassAttack effectiveness
  'XLH2O': WORK,          //+100% repair and build effectiveness without increasing the energy cost
  'XLHO2': HEAL,          //+300% heal and rangedHeal effectiveness
  'XZH2O': WORK,          //+300% dismantle effectiveness
  'XZHO2': MOVE,          //+300% fatigue decrease speed
  'XGH2O': WORK,          //+100% upgradeController effectiveness without increasing the energy cost
  'XGHO2': TOUGH,         //-70% damage taken

};

export const BOOST_RESOURCES: { [actionName: string]: { [boostLevel: number]: ResourceConstant } } = {
  'attack': {
    1: 'UH',
    2: 'UH2O',
    3: 'XUH2O',
  },
  'carry': {
    1: 'KH',
    2: 'KH2O',
    3: 'XKH2O',
  },
  'ranged_attack': {
    1: 'KO',
    2: 'KHO2',
    3: 'XKHO2',
  },
  'heal': {
    1: 'LO',
    2: 'LHO2',
    3: 'XLHO2',
  },
  'move': {
    1: 'ZO',
    2: 'ZHO2',
    3: 'XZHO2',
  },
  'tough': {
    1: 'GO',
    2: 'GHO2',
    3: 'XGHO2',
  },
  'harvest': {
    1: 'UO',
    2: 'UHO2',
    3: 'XUHO2',
  },
  'construct': {
    1: 'LH',
    2: 'LH2O',
    3: 'XLH2O',
  },
  'dismantle': {
    1: 'ZH',
    2: 'ZH2O',
    3: 'XZH2O',
  },
  'upgrade': {
    1: 'GH',
    2: 'GH2O',
    3: 'XGH2O',
  },

};

export const enum BoostActionType {
  ATTACK = "attack",
  CARRY = "carry",
  RANGED_ATTACK = "ranged_attack",
  HEAL = "heal",
  MOVE = "move",
  TOUGH = "tough",
  HARVEST = "harvest",
  CONSTRUCT = "construct",
  DISMANTLE = "dismantle",
  UPGRADE = "upgrade",
}

export const enum CreepRole {
  UNASSIGNED = "none",
  HARVESTER = "harvester",
  CARRIER = "carrier",
  DECOY = "decoy",
  SOLDIER = "soldier",
  ARMY_ELITE = "armyElite",
  ARMY_ATTCKER = "armyAttacker",
  ARMY_HEALER = "armyHealer",
  UPGRADER = "upgrader",
  BUILDER = "builder",
  REPAIRER = "repairer",
  LONG_DISTANCE_BUILDER = "longDistanceBuilder",
  LONG_DISTANCE_HARVESTER = "longDistanceHarvester",
  LONG_DISTANCE_CARRIER = "longDistanceCarrier",
  CLAIMER = "claimer",
  MERCHANT = "merchant",
  KEEPER_SLAYER = "keeperSlayer"
}

export const enum FlagName {
  DECOY = "Decoy", //Indicates where decoys should go
  DECOY_SPAWNER = "DecoySpawner", //The base where decoys spawn from
  WAR = "War", //Build War Creeps
  KEEPER_SLAYER = "KeeperSlayer", //Indicate that we want to build keeper slayer
  KEEPER_SLAYER_SPAWNER = "KeeperSlayerSpawner" //Indicate from where to build a keeper slayer
}

export const enum SPAWN_RESULT_CODES {
  OK,
  NO_CONTROLLER,
  NO_TERMINAL,
  NO_DEPOSIT_STRUCTURE_CONSTRUCTED,
  TOO_MANY_CREEPS,
  NEED_OTHER_TYPES_OF_CREEPS,
  PLENTLY_ALIVE_CREEPS,
  CPU_BUCKET_LOW,
  NOT_NEEDED,
  NOT_NEEDED_AT_THIS_LEVEL
}
