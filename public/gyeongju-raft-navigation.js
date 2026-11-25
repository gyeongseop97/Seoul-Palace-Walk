import {RAFT_LENGTH,RAFT_WIDTH,RAFT_DOCK_WIDTH,RAFT_DWELL_MS,RAFT_TRAVEL_MS,RAFT_CYCLE_MS,raftAt,raftStops,raftStopTimes} from "./gyeongju-raft-layout.js";
import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";

export const RAFT_LEASE_MS=6500;
const forwardSpeed=4.3,reverseSpeed=2.1,turnRate=57;
const radians=Math.PI/180,epoch=Date.UTC(2026,0,1),legTime=RAFT_TRAVEL_MS+RAFT_DWELL_MS;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const norm=h=>(h%360+360)%360,turnTo=(a,b)=>(b-a+540)%360-180;
const mix=(a,b,t)=>a+(b-a)*t,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const docks=raftStops.map((s,i)=>({id:s.id,bank:i,...gyeongjuPoint(s.berth),heading:i?270:90}));
const byId=new Map(docks.map(d=>[d.id,d]));
const nearest=p=>dist(p,docks[0])<=dist(p,docks[1])?docks[0]:docks[1];

// This convex water lane is inset from both surveyed banks by the turning radius of the hull.
// Its ends stop short of the stepping stones in the west and the bridge piers in the east.
function inWater(x,z){
 return x>=403.5&&x<=543&&z>=Math.max(715.9,715.9+(x-490)*.132)&&z<=762.8+(x-428)*.085;
}
function clipsPier(x,z,s,c,stop){
 const rx=x-stop.land.x,rz=z-(stop.land.z+stop.dockEnd.z)/2;
 const a=RAFT_DOCK_WIDTH/2,b=Math.abs(stop.dockEnd.z-stop.land.z)/2;
 const w=RAFT_WIDTH/2-.012,l=RAFT_LENGTH/2-.012,as=Math.abs(s),ac=Math.abs(c);
 return Math.abs(rx)<a+ac*w+as*l&&Math.abs(rz)<b+as*w+ac*l&&
  Math.abs(rx*c-rz*s)<w+a*ac+b*as&&Math.abs(rx*s+rz*c)<l+a*as+b*ac;
}
export function raftNavigable(p){
 const {x,z}=localGyeongju(p);
 if(!inWater(x,z)||!Number.isFinite(p.heading))return false;
 const yaw=(180-p.heading)*radians,s=Math.sin(yaw),c=Math.cos(yaw);
 return !raftStops.some(stop=>clipsPier(x,z,s,c,stop));
}
export function raftMooring(p){
 if(!p||p.stopId||p.mooringTarget)return null;
 const dock=nearest(p);
 return dist(p,dock)<=7.5?raftStops[dock.bank]:null;
}
function moveStep(p,throttle,turn,dt){
 const target=throttle*(throttle>=0?forwardSpeed:reverseSpeed);
 const change=(throttle===0?1.6:target*p.speed<0?3.25:2.0)*dt;
 const speed=p.speed+clamp(target-p.speed,-change,change),distance=(p.speed+speed)*dt/2;
 let heading=norm(p.heading+turnRate*turn*dt),x=p.x,y=p.y;
 if(turn&&!raftNavigable({x,y,heading})){
  // Pushing off sideways lets the bow clear the wooden landing even when turning in place.
  const dock=nearest(p),push=y+(dock.bank?-1:1)*turnRate*radians*RAFT_LENGTH/2*dt;
  if(dist(p,dock)<5&&raftNavigable({x,y:push,heading}))y=push;
  else heading=p.heading;
 }
 const dx=Math.sin(heading*radians)*distance,dy=-Math.cos(heading*radians)*distance;
 if(raftNavigable({x:x+dx,y:y+dy,heading})){x+=dx;y+=dy;}
 else if(Math.abs(dx)>.00001&&raftNavigable({x:x+dx,y,heading}))x+=dx;
 else if(Math.abs(dy)>.00001&&raftNavigable({x,y:y+dy,heading}))y+=dy;
 return {x,y,heading,speed:distance&&Math.hypot(x-p.x,y-p.y)<.00001?0:speed};
}
function manualPose(state,now){
 let p={x:state.x,y:state.y,heading:state.heading,speed:state.speed};
 const dt=clamp((now-state.at)/1000,0,RAFT_LEASE_MS/1000),count=Math.ceil(dt/.05);
 if(!state.stopId&&(state.throttle||state.turn||state.speed))for(let i=0;i<count;i++)p=moveStep(p,state.throttle,state.turn,dt/count);
 return {...p,stopId:state.stopId??null,nextStopId:null,eta:null,remaining:0,elapsed:0,
  traveling:!state.stopId,mode:"manual",helm:state.pilot,pilot:state.pilot,turn:state.turn,throttle:state.throttle};
}

function timetableAtDock(dock,time){
 const offset=(time-epoch-dock.bank*legTime)%RAFT_CYCLE_MS;
 return {mode:"auto",offset};
}
function timetablePose(state,now){
 const time=now-(state?.offset??0),pose=raftAt(time);
 let speed=0;
 if(pose.traveling){
  const ahead=raftAt(time+20),h=pose.heading*radians;
  speed=((ahead.x-pose.x)*Math.sin(h)-(ahead.y-pose.y)*Math.cos(h))/.02;
 }
 return {...pose,speed,mode:"auto",helm:null,pilot:null,turn:0,throttle:0};
}
// First clear the pier without rotating, then align in deeper water. The last few metres
// move broadside into the berth, leaving both the walking deck and the shore unobstructed.
function homeward(p,dock,now,mooring){
 const inward=dock.bank?-1:1,here=localGyeongju(p);
 const middle=gyeongjuPoint({x:here.x,z:clamp(here.z,726,756)});
 const approach={x:dock.x,y:dock.y+inward*4.0};
 const waypoints=[{x:p.x,y:p.y,heading:p.heading,at:now}];
 function go(q,heading,speed){
  const prev=waypoints.at(-1),length=dist(prev,q),degrees=Math.abs(turnTo(prev.heading,heading));
  if(length<.001&&degrees<.001)return;
  const duration=Math.max(280,length/speed*1000,degrees/60*1000);
  waypoints.push({x:q.x,y:q.y,heading,at:prev.at+duration});
 }
 if(mooring){
  // Clear the tip before a large heading adjustment. Already aligned boats can slide straight in.
  if(Math.abs(turnTo(p.heading,dock.heading))>4||Math.abs(p.x-dock.x)>1.5){
   const clearY=dock.bank?Math.min(p.y,approach.y):Math.max(p.y,approach.y);
   go({x:p.x,y:clearY},p.heading,2.6);go(approach,dock.heading,2.8);
  }
 }else{
  go(middle,p.heading,3.2);
  go(approach,dock.heading,3.7);
 }
 go(dock,dock.heading,2.5);
 return {waypoints,home:dock.id,arriveAt:waypoints.at(-1).at};
}
function plannedPose(state,now){
 const dock=byId.get(state.home),isManual=state.mode==="manual";
 const base={mode:state.mode,helm:isManual?state.pilot:null,pilot:isManual?state.pilot:null,turn:0,throttle:0};
 if(now>=state.arriveAt||state.waypoints.length<2)return {...base,x:dock.x,y:dock.y,heading:dock.heading,speed:0,stopId:dock.id,nextStopId:null,
  eta:0,remaining:0,elapsed:Math.max(0,now-state.arriveAt),traveling:false};
 const path=state.waypoints,to=Math.max(1,path.findIndex(p=>p.at>=now)),a=path[to-1],b=path[to];
 const f=clamp((now-a.at)/(b.at-a.at),0,1),blend=f*f*(3-2*f);
 return {...base,x:mix(a.x,b.x,blend),y:mix(a.y,b.y,blend),heading:norm(a.heading+turnTo(a.heading,b.heading)*blend),
  speed:dist(a,b)*6000*f*(1-f)/(b.at-a.at),eta:state.arriveAt-now,remaining:0,elapsed:Math.max(0,now-state.at),
  stopId:null,nextStopId:dock.id,mooringTarget:isManual?dock.id:null,traveling:true};
}
function released(state,now){
 const p=state.waypoints?plannedPose(state,now):manualPose(state,now),dock=byId.get(p.stopId)??nearest(p);
 if(p.stopId)return timetableAtDock(dock,now);
 if(state.waypoints)return {mode:"return",at:state.at,home:state.home,waypoints:state.waypoints,arriveAt:state.arriveAt};
 return {mode:"return",at:now,...homeward(p,dock,now,false)};
}
export function liveRaftState(state,now){
 if(state?.mode==="manual"&&now>=state.leaseUntil)state=released(state,state.leaseUntil);
 if(state?.mode==="return"&&now>=state.arriveAt)return timetableAtDock(byId.get(state.home),state.arriveAt);
 return state;
}
export function raftPoseAt(state,now){
 if(!Number.isFinite(now))return null;
 state=liveRaftState(state,now);
 const pose=state?.waypoints?plannedPose(state,now):state?.mode==="manual"?manualPose(state,now):timetablePose(state,now);
 return {...pose,kind:"raft",time:now};
}
function helmSnapshot(p,now,pilot,seq=0){
 return {mode:"manual",pilot,at:now,x:p.x,y:p.y,heading:p.heading,speed:p.speed,stopId:p.stopId,
  throttle:0,turn:0,seq,leaseUntil:now+RAFT_LEASE_MS};
}
export function takeRaftHelm(state,now,pilot){
 if(!pilot||!Number.isFinite(now))return null;
 state=liveRaftState(state,now);
 if(state?.mode==="manual")return state.pilot===pilot?state:null;
 return helmSnapshot(raftPoseAt(state,now),now,pilot);
}
export function driveRaft(state,now,input){
 state=liveRaftState(state,now);
 if(state?.mode!=="manual"||!Number.isSafeInteger(input?.seq)||input.seq<=state.seq||now<state.at||
  !Number.isFinite(input.throttle)||!Number.isFinite(input.turn))return null;
 const seq=input.seq,throttle=clamp(input.throttle,-1,1),turn=clamp(input.turn,-1,1);
 if(state.waypoints&&!throttle&&!turn&&now<state.arriveAt)return {...state,seq,leaseUntil:now+RAFT_LEASE_MS};
 const p=raftPoseAt(state,now),next=helmSnapshot(p,now,state.pilot,seq);
 return {...next,throttle,turn,stopId:throttle||turn?null:p.stopId};
}
export function releaseRaft(state,now){
 if(!Number.isFinite(now))return null;
 state=liveRaftState(state,now);
 return state?.mode==="manual"?released(state,now):state;
}
export function moorRaft(state,now){
 state=liveRaftState(state,now);
 if(state?.mode!=="manual")return null;
 const p=raftPoseAt(state,now),stop=raftMooring(p);
 if(!stop)return null;
 return {...helmSnapshot(p,now,state.pilot,state.seq),...homeward(p,byId.get(stop.id),now,true)};
}
export function raftTimesAt(state,id,now){
 if(!byId.has(id)||!Number.isFinite(now))return null;
 state=liveRaftState(state,now);
 if(state?.mode==="manual")return {arrivalMs:state.home===id?Math.max(0,state.arriveAt-now):null,departureMs:null};
 if(state?.mode==="return"){
  const delay=state.arriveAt-now;
  return {arrivalMs:delay+(state.home===id?0:legTime),departureMs:null};
 }
 return raftStopTimes(id,now-(state?.offset??0));
}
