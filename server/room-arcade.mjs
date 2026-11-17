import {CLAW_PRIZES} from "../public/arcade-games.js";
import {ARCADE_GAMES} from "../public/arcade-layout.js";
import {interiorAt} from "../public/interior-layout.js";
import {cleanTargetSnapshot} from "../public/arcade-targets.js";

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

function cleanBowling({roll}){
  if(roll===null)return {kind:"bowling",roll};
  if(!roll||!integer(roll.at,1,9999999999999)||!inRange(roll.angle,-.34,.34)||
    !inRange(roll.power,0,1)||!integer(roll.mask,1,1023)||!integer(roll.attempt,1,2)||
    (roll.attempt===1&&roll.mask!==1023))return null;
  const {at,angle,power,mask,attempt}=roll;
  return {kind:"bowling",roll:{at,angle,power,mask,attempt}};
}

function cleanMole({score,target,height,swingAt,finished,remaining}){
  if(!integer(score,0,24)||!integer(target,-1,2)||!inRange(height,0,1)||!integer(swingAt,0,9999999999999)||
    typeof finished!=="boolean"||!integer(remaining,0,25))return null;
  return {kind:"mole",score,target,height:compact(height),swingAt,finished,remaining};
}

function cleanBaseball({pitchNo,score,hits,pitch,swingAt,hit,result,finished}){
  const time=value=>integer(value,1,9999999999999);
  if(!integer(pitchNo,1,6)||!integer(score,0,24)||!integer(hits,0,pitchNo)||
    ![null,"miss","foul","single","double","home"].includes(result)||typeof finished!=="boolean"||
    (swingAt!==null&&!time(swingAt)))return null;
  if(finished?(pitch!==null||hit!==null):(!pitch||!time(pitch.at)||!inRange(pitch.flight,700,1250)||
    !inRange(pitch.bend,-.45,.45)||!inRange(pitch.height,.85,1.36)))return null;
  if(hit!==null&&(!hit||!time(hit.at)||!inRange(hit.x,-.55,.55)||!inRange(hit.y,.70,1.54)||
    !inRange(hit.z,1.65,4.80)||!inRange(hit.vx,-22,22)||!inRange(hit.vy,-7,8)||!inRange(hit.vz,-25,0)))return null;
  return {kind:"baseball",pitchNo,score,hits,pitch:pitch&&{at:pitch.at,flight:pitch.flight,bend:pitch.bend,height:pitch.height},
    swingAt,hit:hit&&{at:hit.at,x:compact(hit.x),y:compact(hit.y),z:compact(hit.z),vx:compact(hit.vx),vy:compact(hit.vy),vz:compact(hit.vz)},
    result,finished};
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
    avatar.bike&&!avatar.bike.parked)return null;
  const station=ARCADE_GAMES[activity.kind],reach=activity.kind==="pump"?3.6:activity.kind==="mole"?3.05:1.85;
  if(interiorAt(avatar.x,avatar.y)!==station.floor||Math.hypot(station.x-avatar.x,station.y-avatar.y)>reach)return null;
  switch(activity.kind){
    case "pump":return cleanPump(activity);
    case "basket":return cleanBasket(activity);
    case "claw":return cleanClaw(activity);
    case "bowling":return cleanBowling(activity);
    case "mole":return cleanMole(activity);
    case "shooting":case "archery":return cleanTargetSnapshot(activity);
    case "baseball":return cleanBaseball(activity);
  }
}
