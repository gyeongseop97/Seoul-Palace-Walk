import {CLAW_PRIZES} from "../public/arcade-games.js";
import {ARCADE_GAMES,ARCADE_SITE} from "../public/arcade-layout.js";
import {interiorAt} from "../public/interior-layout.js";

export const arcadeSnapshotLifetime=5000;
const lastPrize=CLAW_PRIZES.length-1;
const headRanges=[[-1.08,1.08],[0,1.85],[-.80,.80],[0,1],[-.25,.25],[-.25,.25],[-.66,.66],[-.66,.66]];
const prizeRanges=[[0,lastPrize],[-1.4,1.4],[-.6,1.8],[-1.1,1.1],[-4,4],[-7,7],[-4,4]];
const ballRanges=[[-6,6],[0,8],[-6,3]];
const basketPhases=new Set(["aim","shooting","returning"]);
const inRange=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
const integer=(value,min,max)=>Number.isInteger(value)&&inRange(value,min,max);
const lane=value=>integer(value,-1,3);
const compact=value=>Math.round(value*1000)/1000;
const vector=(values,ranges)=>Array.isArray(values)&&values.length===ranges.length&&
  ranges.every(([min,max],index)=>inRange(values[index],min,max));

function cleanPump({active,score,readyLane,litLane,notes}){
  if(typeof active!=="boolean"||!integer(score,0,50000)||!lane(readyLane)||!lane(litLane)||
    !Array.isArray(notes)||notes.length>4||!notes.every(note=>Array.isArray(note)&&note.length===2&&
      integer(note[0],0,3)&&inRange(note[1],-.05,1.2)))return null;
  return {kind:"pump",active,score,readyLane,litLane,notes:notes.map(([track,progress])=>[track,compact(progress)])};
}

function cleanBasket({phase,score,level,ball,rimX}){
  if(!basketPhases.has(phase)||!integer(score,0,100000)||!integer(level,1,34000)||
    !vector(ball,ballRanges)||!inRange(rimX,-.7,.7))return null;
  return {kind:"basket",phase,score,level,ball:ball.map(compact),rimX:compact(rimX)};
}

function cleanClaw({head,holding,prizes}){
  if(!vector(head,headRanges)||!integer(holding,-1,lastPrize)||!Array.isArray(prizes)||prizes.length>CLAW_PRIZES.length)return null;
  const cleaned=[],seen=new Set();
  for(const prize of prizes){
    if(!Array.isArray(prize)||!integer(prize[0],0,lastPrize)||seen.has(prize[0]))return null;
    const collected=prize.length===2&&prize[1]===false;
    if(collected?holding===prize[0]:!vector(prize,prizeRanges))return null;
    seen.add(prize[0]);
    cleaned.push(collected?[prize[0],false]:prize.map(compact));
  }
  return {kind:"claw",head:head.map(compact),holding,prizes:cleaned};
}

export function cleanArcadeActivity(avatar){
  const activity=avatar?.arcade;
  if(typeof activity?.kind!=="string"||!Object.hasOwn(ARCADE_GAMES,activity.kind)||avatar.seat!=null||avatar.bus||avatar.bikeRide||
    avatar.bike&&!avatar.bike.parked||interiorAt(avatar.x,avatar.y)!==ARCADE_SITE.id)return null;
  const station=ARCADE_GAMES[activity.kind],reach=activity.kind==="pump"?3.6:1.85;
  if(Math.hypot(station.x-avatar.x,station.y-avatar.y)>reach)return null;
  switch(activity.kind){
    case "pump":return cleanPump(activity);
    case "basket":return cleanBasket(activity);
    case "claw":return cleanClaw(activity);
  }
}
