//import { profile } from "console";
import { Site } from "Sites/Site";
import { Tasks } from "Tasks";
import { Helper } from "Helper";
import { GetRoomObjects } from "GetRoomObjects";
import { HarvesterSite } from "Sites/HarvesterSite";
import { ExtractorSite } from "Sites/ExtractorSite";
import { UpgraderSite } from "Sites/UpgraderSite";

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
      let controller = GetRoomObjects.getController(myRooms[i]);

      if (probesAtSites) {
        this.probesAtSites = probesAtSites;
      }
      for (let j in sources) {
        console.log(`Creating HarvesterSite in ${myRooms[i]}`)
        let miningSite = new HarvesterSite(sources[j]);
        this.sites.push(miningSite);
      }
      if (mineral) {
        let miningSite = new ExtractorSite(mineral);
        this.sites.push(miningSite);
      }
      if (controller) {
        let upgraderSite = new UpgraderSite(controller);
        this.sites.push(upgraderSite);
        
      }
    }
  }

  refresh(): void {
    for (let i in this.sites) {
      this.sites[i].refresh(); 
    }
  }

  cache(): void {
    Helper.setCashedMemory("Sites", this.probesAtSites);
  }
}
