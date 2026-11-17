import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {plazaAt} from "./plaza-layout.js";
import {arcadeBounds} from "./interior-layout.js";
import {BASKET_BACKING} from "./arcade-basket-physics.js";

const east=54.3,north=468.2;
const insideAngle=Math.PI/2;
const at=(x,z)=>({x:(arcadeBounds.minX+arcadeBounds.maxX)/2+z,y:(arcadeBounds.minY+arcadeBounds.maxY)/2-x});
const outsideDoor={...plazaAt(east-6.8,north,"광화문 오락실"),heading:270};
export const ARCADE_SITE={...outsideDoor,id:"arcade",area:"gwanghwamun",outsideDoor,body:plazaAt(east,north),angle:-Math.PI/2,
  width:16,depth:11,bounds:arcadeBounds,center:at(0,0),insideAngle,
  insideWidth:arcadeBounds.maxY-arcadeBounds.minY,insideDepth:arcadeBounds.maxX-arcadeBounds.minX,
  insideDoor:{...at(-.82,6.1),heading:90},insideSpawn:{...at(-.82,4.25),heading:270}};
const game=(x,z,front,reach)=>({...at(x,front),machine:at(x,z),localX:x,localZ:z,reach});
export const ARCADE_CLAW=game(-6.63,-.63,1.35,1.65);
export const ARCADE_PUMP=game(-2.8,.1,.1,1.95);
export const ARCADE_BASKET=game(1.73,-.72,1.43,1.65);
export const ARCADE_BOWLING=game(6.55,0,4.90,1.65);
export const ARCADE_MOLE=game(-4.45,-4.05,-2.78,1.45);
export const ARCADE_PADS=[[-.68,0,"←"],[0,-.68,"↑"],[0,.68,"↓"],[.68,0,"→"]].map(([dx,dz,arrow])=>({
  ...at(ARCADE_PUMP.localX+dx,ARCADE_PUMP.localZ+dz),dx,dz,arrow
}));
export const ARCADE_GAMES={claw:ARCADE_CLAW,pump:ARCADE_PUMP,basket:ARCADE_BASKET,bowling:ARCADE_BOWLING,mole:ARCADE_MOLE};

export function registerArcade(){
  const apron=(x,y)=>x>=ARCADE_SITE.x-1.7&&x<=ARCADE_SITE.body.x-ARCADE_SITE.depth/2+.03&&Math.abs(y-ARCADE_SITE.y)<=6.2;
  addZone({name:ARCADE_SITE.name,contains:apron,walkable:apron});
  addLandmarks([ARCADE_SITE]);
  const {insideWidth:width,insideDepth:depth}=ARCADE_SITE;
  addObstacle(ARCADE_SITE.body.x,ARCADE_SITE.body.y,ARCADE_SITE.width,ARCADE_SITE.depth,ARCADE_SITE.angle);
  for(const side of [-1,1]){
    const longWall=at(0,side*(depth/2-.05)),endWall=at(side*(width/2-.05),0);
    addObstacle(longWall.x,longWall.y,width,.28,insideAngle,4);
    addObstacle(endWall.x,endWall.y,.27,depth,insideAngle,4);
  }
  const board=at(ARCADE_BASKET.localX,ARCADE_BASKET.localZ+BASKET_BACKING.z);
  addObstacle(ARCADE_CLAW.machine.x+.13,ARCADE_CLAW.machine.y,2.48,2.13,insideAngle);
  addObstacle(board.x,board.y,BASKET_BACKING.width,BASKET_BACKING.depth,insideAngle);
  addObstacle(ARCADE_PUMP.machine.x-1.68,ARCADE_PUMP.machine.y,2.12,.42,insideAngle);
  addObstacle(ARCADE_MOLE.machine.x,ARCADE_MOLE.machine.y,3.38,1.36,insideAngle,1.05);
  const pins=at(ARCADE_BOWLING.localX,-5.95);
  addObstacle(pins.x,pins.y,3.85,.52,insideAngle,.85);
  const rack=at(ARCADE_BOWLING.localX+2.73,4.44);
  addObstacle(rack.x,rack.y,.84,1.60,insideAngle,.8);
  for(const side of [-1,1]){
    const rail=at(ARCADE_BOWLING.localX+side*1.90,-.79);
    addObstacle(rail.x,rail.y,.13,9.96,insideAngle,.30);
  }
}
