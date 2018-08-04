//export interface bodySetup {
//  pattern: BodyPartConstant[];			// body pattern to be repeated
//  sizeLimit: number;						// maximum number of unit repetitions to make body
//  prefix: BodyPartConstant[];				// stuff at beginning of body
//  suffix: BodyPartConstant[];				// stuff at end of body
//  proportionalPrefixSuffix: boolean;		// (?) prefix/suffix scale with body size
//  ordered: boolean;						// (?) assemble as WORK WORK MOVE MOVE instead of WORK MOVE WORK MOVE
//}

export class ProbeSetup {
  role: string;
  body: BodyPartConstant[];
  name: string;
  memory: any;

  constructor(roleName: string, body: BodyPartConstant[], name: string, memory: any) {
    this.role = roleName;
    this.body = body;
    this.name = name;
    this.memory = memory;
  }
}
