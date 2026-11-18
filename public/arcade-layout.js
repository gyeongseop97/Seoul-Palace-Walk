import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {plazaAt} from "./plaza-layout.js";
import {arcadeBounds,arcadeThirdBounds,arcadeUpperBounds,interiorAt} from "./interior-layout.js";
import {BASKET_BACKING} from "./arcade-basket-physics.js";
import {MOLE_BOARD} from "./arcade-mole.js";

const east=165,north=478;
const insideAngle=Math.PI/2;
const floorAt=(bounds,x,z)=>({x:(bounds.minX+bounds.maxX)/2+z,y:(bounds.minY+bounds.maxY)/2-x});
const at=(x,z)=>floorAt(arcadeBounds,x,z),upperAt=(x,z)=>floorAt(arcadeUpperBounds,x,z);
export const thirdArcadeAt=(x,z)=>floorAt(arcadeThirdBounds,x,z);
const outsideDoor={...plazaAt(east-6.8,north,"광화문 오락실"),heading:270};
export const ARCADE_SITE={...outsideDoor,id:"arcade",area:"gwanghwamun",outsideDoor,body:plazaAt(east,north),angle:-Math.PI/2,
  width:16,depth:11,bounds:arcadeBounds,center:at(0,0),insideAngle,
  insideWidth:arcadeBounds.maxY-arcadeBounds.minY,insideDepth:arcadeBounds.maxX-arcadeBounds.minX,
  insideDoor:{...at(-.82,6.1),heading:90},insideSpawn:{...at(-.82,4.25),heading:270}};
export const ARCADE_UPPER_SITE={id:"arcade-upper",name:"광화문 오락실 2층",area:"gwanghwamun",outsideDoor,
  bounds:arcadeUpperBounds,center:upperAt(0,0),insideAngle,
  insideWidth:ARCADE_SITE.insideWidth,insideDepth:ARCADE_SITE.insideDepth};
export const ARCADE_THIRD_SITE={...ARCADE_UPPER_SITE,id:"arcade-third",name:"광화문 오락실 3층",bounds:arcadeThirdBounds,
  center:thirdArcadeAt(0,0)};
const floorPositions={[ARCADE_SITE.id]:at,[ARCADE_UPPER_SITE.id]:upperAt,[ARCADE_THIRD_SITE.id]:thirdArcadeAt};
export const arcadeFloorAt=(x,y)=>{
  const id=interiorAt(x,y);
  return Object.hasOwn(floorPositions,id)?id:null;
};
export const ARCADE_STAIRS={
  [ARCADE_SITE.id]:[{...at(-8.52,4.42),localX:-8.52,localZ:2.94,name:"2층 올라가기",up:true,
    badge:"2층 ↑",activities:"사격 · 양궁 · 스크린 야구",to:{...upperAt(-8.56,4.60),heading:30},place:ARCADE_UPPER_SITE.name}],
  [ARCADE_UPPER_SITE.id]:[
    {...upperAt(-8.56,5.16),localX:-8.56,localZ:6.16,name:"1층 내려가기",up:false,
      badge:"1층 ↓",activities:"볼링 · 농구 · 출구",to:{...at(-8.52,4.88),heading:90},place:ARCADE_SITE.name},
    {...upperAt(8.55,5.94),localX:8.55,localZ:4.25,name:"3층 올라가기",up:true,
      badge:"3층 ↑",activities:"핀볼 · 에어하키 · 벽돌깨기 · 서울 랠리",to:{...thirdArcadeAt(8.55,4.65),heading:233},place:ARCADE_THIRD_SITE.name}],
  [ARCADE_THIRD_SITE.id]:[{...thirdArcadeAt(8.55,5.30),localX:8.55,localZ:6.16,name:"2층 내려가기",up:false,
    badge:"2층 ↓",activities:"사격 · 양궁 · 스크린 야구",to:{...upperAt(8.55,6.17),heading:180},place:ARCADE_UPPER_SITE.name}]
};
const arcadeFloors=Object.keys(floorPositions);
export function arcadeStairToward(from,to){
  const current=arcadeFloors.indexOf(from),target=Math.max(0,arcadeFloors.indexOf(to));
  if(current<0||current===target)return null;
  return ARCADE_STAIRS[from].find(stairs=>stairs.up===(target>current))??null;
}
const game=(x,z,front,reach,floor=ARCADE_SITE.id)=>{
  const locate=floorPositions[floor];
  return {...locate(x,front),machine:locate(x,z),localX:x,localZ:z,reach,floor};
};
export const ARCADE_CLAW=game(-6.63,-.63,1.35,1.65);
export const ARCADE_PUMP=game(-2.8,.1,.1,1.95);
export const ARCADE_BASKET=game(1.73,-.72,1.43,1.65);
export const ARCADE_BOWLING=game(6.55,0,4.90,1.65);
export const ARCADE_MOLE=game(-4.45,-4.05,-2.78,1.45);
const classic=(name,x,width,depth)=>({...game(x,-1.8,2.6,1.6,ARCADE_THIRD_SITE.id),name,width,depth});
export const ARCADE_PINBALL=classic("핀볼",-6.3,2.5,4.6);
export const ARCADE_AIR_HOCKEY=classic("에어하키",0,3.3,4.9);
export const hockeyFarEnd=thirdArcadeAt(0,ARCADE_AIR_HOCKEY.localZ-3.05);
export const ARCADE_BRICK_BREAKER=classic("벽돌깨기",6.4,2.7,4.6);
export const ARCADE_PADS=[[-.68,0,"←"],[0,-.68,"↑"],[0,.68,"↓"],[.68,0,"→"]].map(([dx,dz,arrow])=>({
  ...at(ARCADE_PUMP.localX+dx,ARCADE_PUMP.localZ+dz),dx,dz,arrow
}));
export const ARCADE_GAMES={claw:ARCADE_CLAW,pump:ARCADE_PUMP,basket:ARCADE_BASKET,bowling:ARCADE_BOWLING,mole:ARCADE_MOLE,
  shooting:game(-6.3,0,3.7,1.75,ARCADE_UPPER_SITE.id),archery:game(0,0,3.7,1.75,ARCADE_UPPER_SITE.id),
  baseball:game(6.4,0,3.7,1.75,ARCADE_UPPER_SITE.id),pinball:ARCADE_PINBALL,airHockey:ARCADE_AIR_HOCKEY,brickBreaker:ARCADE_BRICK_BREAKER,
  racing:{...game(-3.22,-1.8,1.56,1.18,ARCADE_THIRD_SITE.id),name:"서울 랠리",width:2.48,depth:4.2}};

export function registerArcade(){
  const apron=(x,y)=>x>=ARCADE_SITE.x-1.7&&x<=ARCADE_SITE.body.x-ARCADE_SITE.depth/2+.03&&Math.abs(y-ARCADE_SITE.y)<=6.2;
  addZone({name:ARCADE_SITE.name,contains:apron,walkable:apron});
  addLandmarks([ARCADE_SITE]);
  const {insideWidth:width,insideDepth:depth}=ARCADE_SITE;
  addObstacle(ARCADE_SITE.body.x,ARCADE_SITE.body.y,ARCADE_SITE.width,ARCADE_SITE.depth,ARCADE_SITE.angle);
  for(const [id,locate] of Object.entries(floorPositions)){
    for(const side of [-1,1]){
      const longWall=locate(0,side*(depth/2-.05)),endWall=locate(side*(width/2-.05),0);
      addObstacle(longWall.x,longWall.y,width,.28,insideAngle,4);
      addObstacle(endWall.x,endWall.y,.27,depth,insideAngle,4);
    }
    for(const stairs of ARCADE_STAIRS[id]){
      if(stairs.up){
        const body=locate(stairs.localX,stairs.localZ);
        addObstacle(body.x,body.y,1.55,2.26,insideAngle,2.65);
      }else{
        const landing=locate(stairs.localX,stairs.localZ+.47);
        addObstacle(landing.x,landing.y,1.48,.12,insideAngle,1.57);
      }
    }
  }
  for(const side of [-3.22,3.17]){
    const divider=upperAt(side,-.88);
    addObstacle(divider.x,divider.y,.12,8.06,insideAngle,1.62);
  }
  const board=at(ARCADE_BASKET.localX,ARCADE_BASKET.localZ+BASKET_BACKING.z);
  addObstacle(ARCADE_CLAW.machine.x+.13,ARCADE_CLAW.machine.y,2.48,2.13,insideAngle);
  addObstacle(board.x,board.y,BASKET_BACKING.width,BASKET_BACKING.depth,insideAngle);
  addObstacle(ARCADE_PUMP.machine.x-1.68,ARCADE_PUMP.machine.y,2.12,.42,insideAngle);
  addObstacle(ARCADE_MOLE.machine.x,ARCADE_MOLE.machine.y,MOLE_BOARD.width,MOLE_BOARD.depth,insideAngle,1.05);
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
  for(const station of [ARCADE_PINBALL,ARCADE_AIR_HOCKEY,ARCADE_BRICK_BREAKER,ARCADE_GAMES.racing]){
    addObstacle(station.machine.x,station.machine.y,station.width,station.depth,insideAngle);
  }
}
