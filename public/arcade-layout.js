import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {plazaAt} from "./plaza-layout.js";
import {arcadeBounds,arcadeUpperBounds,interiorAt} from "./interior-layout.js";
import {BASKET_BACKING} from "./arcade-basket-physics.js";

const east=54.3,north=468.2;
const insideAngle=Math.PI/2;
const floorAt=(bounds,x,z)=>({x:(bounds.minX+bounds.maxX)/2+z,y:(bounds.minY+bounds.maxY)/2-x});
const at=(x,z)=>floorAt(arcadeBounds,x,z),upperAt=(x,z)=>floorAt(arcadeUpperBounds,x,z);
const outsideDoor={...plazaAt(east-6.8,north,"광화문 오락실"),heading:270};
export const ARCADE_SITE={...outsideDoor,id:"arcade",area:"gwanghwamun",outsideDoor,body:plazaAt(east,north),angle:-Math.PI/2,
  width:16,depth:11,bounds:arcadeBounds,center:at(0,0),insideAngle,
  insideWidth:arcadeBounds.maxY-arcadeBounds.minY,insideDepth:arcadeBounds.maxX-arcadeBounds.minX,
  insideDoor:{...at(-.82,6.1),heading:90},insideSpawn:{...at(-.82,4.25),heading:270}};
export const ARCADE_UPPER_SITE={id:"arcade-upper",name:"광화문 오락실 2층",area:"gwanghwamun",outsideDoor,
  bounds:arcadeUpperBounds,center:upperAt(0,0),insideAngle,
  insideWidth:ARCADE_SITE.insideWidth,insideDepth:ARCADE_SITE.insideDepth};
export const arcadeFloorAt=(x,y)=>{
  const id=interiorAt(x,y);
  return id===ARCADE_SITE.id||id===ARCADE_UPPER_SITE.id?id:null;
};
export const ARCADE_STAIRS={
  [ARCADE_SITE.id]:{...at(-8.52,4.42),localX:-8.52,localZ:2.94,name:"2층 올라가기",up:true,
    to:{...upperAt(-8.56,4.60),heading:30},place:ARCADE_UPPER_SITE.name},
  [ARCADE_UPPER_SITE.id]:{...upperAt(-8.56,5.16),localX:-8.56,localZ:6.16,name:"1층 내려가기",up:false,
    to:{...at(-8.52,4.88),heading:90},place:ARCADE_SITE.name}
};
const game=(x,z,front,reach,floor=ARCADE_SITE.id)=>{
  const locate=floor===ARCADE_SITE.id?at:upperAt;
  return {...locate(x,front),machine:locate(x,z),localX:x,localZ:z,reach,floor};
};
export const ARCADE_CLAW=game(-6.63,-.63,1.35,1.65);
export const ARCADE_PUMP=game(-2.8,.1,.1,1.95);
export const ARCADE_BASKET=game(1.73,-.72,1.43,1.65);
export const ARCADE_BOWLING=game(6.55,0,4.90,1.65);
export const ARCADE_MOLE=game(-4.45,-4.05,-2.78,1.45);
export const ARCADE_PADS=[[-.68,0,"←"],[0,-.68,"↑"],[0,.68,"↓"],[.68,0,"→"]].map(([dx,dz,arrow])=>({
  ...at(ARCADE_PUMP.localX+dx,ARCADE_PUMP.localZ+dz),dx,dz,arrow
}));
export const ARCADE_GAMES={claw:ARCADE_CLAW,pump:ARCADE_PUMP,basket:ARCADE_BASKET,bowling:ARCADE_BOWLING,mole:ARCADE_MOLE,
  shooting:game(-6.3,0,3.7,1.75,ARCADE_UPPER_SITE.id),archery:game(0,0,3.7,1.75,ARCADE_UPPER_SITE.id),
  baseball:game(6.4,0,3.7,1.75,ARCADE_UPPER_SITE.id)};

export function registerArcade(){
  const apron=(x,y)=>x>=ARCADE_SITE.x-1.7&&x<=ARCADE_SITE.body.x-ARCADE_SITE.depth/2+.03&&Math.abs(y-ARCADE_SITE.y)<=6.2;
  addZone({name:ARCADE_SITE.name,contains:apron,walkable:apron});
  addLandmarks([ARCADE_SITE]);
  const {insideWidth:width,insideDepth:depth}=ARCADE_SITE;
  addObstacle(ARCADE_SITE.body.x,ARCADE_SITE.body.y,ARCADE_SITE.width,ARCADE_SITE.depth,ARCADE_SITE.angle);
  for(const locate of [at,upperAt]){
    for(const side of [-1,1]){
      const longWall=locate(0,side*(depth/2-.05)),endWall=locate(side*(width/2-.05),0);
      addObstacle(longWall.x,longWall.y,width,.28,insideAngle,4);
      addObstacle(endWall.x,endWall.y,.27,depth,insideAngle,4);
    }
  }
  const stairs=at(ARCADE_STAIRS.arcade.localX,ARCADE_STAIRS.arcade.localZ);
  addObstacle(stairs.x,stairs.y,1.55,2.26,insideAngle,2.65);
  const upperLanding=upperAt(ARCADE_STAIRS[ARCADE_UPPER_SITE.id].localX,6.63);
  addObstacle(upperLanding.x,upperLanding.y,1.48,.12,insideAngle,1.57);
  for(const side of [-3.22,3.17]){
    const divider=upperAt(side,-.88);
    addObstacle(divider.x,divider.y,.12,8.06,insideAngle,1.62);
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
  for(const kind of ["shooting","archery","baseball"]){
    const station=ARCADE_GAMES[kind];
    const target=upperAt(station.localX,-4.4);
    addObstacle(target.x,target.y,4.25,.42,insideAngle,2.90);
  }
}
