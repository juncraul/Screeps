//import { profile } from "console";
import { Site } from "Sites/Site";
import { Tasks } from "Tasks";
import { Helper } from "Helper";
import { GetRoomObjects } from "GetRoomObjects";
import { HarvesterSite } from "Sites/HarvesterSite";
import { ExtractorSite } from "Sites/ExtractorSite";

//@profile
export default class Mastermind implements IMastermind {

  probesAtSites: { [siteId: string]: string[] };
  sites: Site[];

  constructor() {
    this.probesAtSites = {};
    this.sites = [];
  }


  initialize(): void {
    let myRooms = Tasks.getmyRoomsWithController();
    for (let i in myRooms) {
      let probesAtSites = Helper.getCashedMemory("Sites", null);
      let sources = GetRoomObjects.getSources(myRooms[i]);
      let mineral = GetRoomObjects.getMineral(myRooms[i]);

      if (probesAtSites) {
        this.probesAtSites = probesAtSites;
      }
      for (let i in sources) {
        let miningSite = new HarvesterSite(sources[i]);
        this.sites.push(miningSite);
        if (this.probesAtSites[miningSite.id] == undefined) {
          this.probesAtSites[miningSite.id] = []
        }
      }
      if (mineral) {
        let miningSite = new ExtractorSite(mineral);
        this.sites.push(miningSite);
        if (this.probesAtSites[miningSite.id] == undefined) {
          this.probesAtSites[miningSite.id] = []
        }
      }
    }
  }

  cache(): void {
    Helper.setCashedMemory("Sites", this.probesAtSites);
  }
}
