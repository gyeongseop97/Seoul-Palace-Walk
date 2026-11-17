import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {plazaAt} from "./plaza-layout.js";
import {arcadeBounds} from "./interior-layout.js";

const east=-58.3,north=415;
const angle=Math.PI/2;
const at=(x,z)=>({x:(arcadeBounds.minX+arcadeBounds.maxX)/2+z,y:(arcadeBounds.minY+arcadeBounds.maxY)/2-x});
const outsideDoor={...plazaAt(east+3.64,north,"광화문 오락실"),heading:90};
export const ARCADE_SITE={...outsideDoor,id:"arcade",area:"gwanghwamun",outsideDoor,body:plazaAt(east,north),angle,
  width:10.8,depth:6.3,bounds:arcadeBounds,center:at(0,0),insideWidth:12.8,insideDepth:8.2,
  insideDoor:{...at(0,3.40),heading:90},insideSpawn:{...at(0,2.47),heading:270}};
export const ARCADE_CLAW={...at(-3.82,1.08),machine:at(-3.82,-.9),localX:-3.82,localZ:-.9,reach:1.65};
export const ARCADE_PUMP={...at(0,.05),localX:0,localZ:.05,reach:1.95};
export const ARCADE_BASKET={...at(3.78,1.43),machine:at(3.78,-.72),localX:3.78,localZ:-.72,reach:1.65};
export const ARCADE_PADS=[[-.68,0,"←"],[0,-.68,"↑"],[0,.68,"↓"],[.68,0,"→"]].map(([dx,dz,arrow])=>({
  ...at(ARCADE_PUMP.localX+dx,ARCADE_PUMP.localZ+dz),dx,dz,arrow
}));
export const ARCADE_GAMES={claw:ARCADE_CLAW,pump:ARCADE_PUMP,basket:ARCADE_BASKET};

export function registerArcade(){
  const bounds=({x,y})=>x>=ARCADE_SITE.body.x-3.15&&x<=ARCADE_SITE.x+1.0&&Math.abs(y-ARCADE_SITE.y)<=5.4;
  const inside=(x,y)=>bounds({x,y});
  addZone({name:ARCADE_SITE.name,contains:inside,walkable:inside});
  addLandmarks([ARCADE_SITE]);
  addObstacle(ARCADE_SITE.body.x,ARCADE_SITE.body.y,ARCADE_SITE.width,ARCADE_SITE.depth,angle);
  for(const side of [-1,1]){
    const longWall=at(0,side*4.05),endWall=at(side*6.35,0);
    addObstacle(longWall.x,longWall.y,12.8,.28,angle,4);
    addObstacle(endWall.x,endWall.y,.27,8.2,angle,4);
  }
  const rim=at(3.78,-1.91),claw=at(-3.82,-.77),pump=at(0,-1.63);
  addObstacle(claw.x,claw.y,2.48,2.13,angle);
  addObstacle(rim.x,rim.y,2.10,.28,angle);
  addObstacle(pump.x,pump.y,2.12,.42,angle);
}
