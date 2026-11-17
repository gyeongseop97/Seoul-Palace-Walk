import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {plazaAt} from "./plaza-layout.js";

const east=-58.3,north=415;
const at=(x,z,name)=>plazaAt(east+z,north+x,name);
export const ARCADE_SITE={...at(0,3.25,"광화문 오락실"),body:at(0,0),angle:Math.PI/2,width:10.8,depth:6.3};
export const ARCADE_CLAW={...at(-3.45,.83),machine:at(-3.45,-.75),localX:-3.45,localZ:-.75,reach:1.7};
export const ARCADE_PUMP={...at(0,.05),localX:0,localZ:.05,reach:1.95};
export const ARCADE_BASKET={...at(3.45,1.40),machine:at(3.45,-.60),localX:3.45,localZ:-.60,reach:1.65};
export const ARCADE_PADS=[[-.68,0,"←"],[0,-.68,"↑"],[0,.68,"↓"],[.68,0,"→"]].map(([dx,dz,arrow])=>({
  ...at(ARCADE_PUMP.localX+dx,ARCADE_PUMP.localZ+dz),dx,dz,arrow
}));
export const ARCADE_GAMES={claw:ARCADE_CLAW,pump:ARCADE_PUMP,basket:ARCADE_BASKET};

export function registerArcade(){
  const bounds=({x,y})=>x>=ARCADE_SITE.body.x-3.15&&x<=ARCADE_SITE.x+1.0&&Math.abs(y-ARCADE_SITE.y)<=5.4;
  const inside=(x,y)=>bounds({x,y});
  addZone({name:ARCADE_SITE.name,contains:inside,walkable:inside});
  addLandmarks([ARCADE_SITE]);
  for(const side of [-1,1]){
    const wall=at(side*5.35,0);
    addObstacle(wall.x,wall.y,.17,6.3,ARCADE_SITE.angle);
  }
  const back=at(0,-3.1);
  addObstacle(back.x,back.y,10.75,.17,ARCADE_SITE.angle);
  for(const machine of [ARCADE_CLAW.machine,ARCADE_BASKET.machine])addObstacle(machine.x,machine.y,1.45,1.05,ARCADE_SITE.angle);
}
