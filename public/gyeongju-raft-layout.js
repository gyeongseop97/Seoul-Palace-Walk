import {gyeongjuPoint} from "./region-coordinates.js";

export const RAFT_WIDTH=2.4,RAFT_LENGTH=4.6,RAFT_DOCK_WIDTH=1.8;
export const RAFT_DECK_HEIGHT=.34,RAFT_SEAT_HEIGHT=.72,RAFT_BOARD_REACH=3;
export const RAFT_DWELL_MS=15000,RAFT_TRAVEL_MS=40000,RAFT_CYCLE_MS=2*(RAFT_DWELL_MS+RAFT_TRAVEL_MS);
export const raftSeatOffsets=[
 {side:-.50,forward:-.72,headingOffset:0},{side:.50,forward:-.72,headingOffset:0},{side:0,forward:.72,headingOffset:180}
];
export const RAFT_SEATS=raftSeatOffsets.length;
const point=(x,z)=>({x,z});
const world=(p,heading)=>({...gyeongjuPoint(p),heading});
const stops=[
 {id:"gj-raft-north",name:"교촌 나루",land:point(487,709.55),berth:point(487,717.8),dockEnd:point(487,716.6),path:point(499.3,693.3)},
 {id:"gj-raft-south",name:"남천 남안 나루",land:point(477,773.82),berth:point(477,766.7),dockEnd:point(477,767.9),path:point(469.7,783.4)}
];
export const raftStops=stops.map((stop,i)=>{
 const sign=Math.sign(stop.dockEnd.z-stop.land.z),heading=sign>0?180:0;
 return {...stop,kind:"raft",direction:stops[1-i].name+" 방면",board:world(point(stop.dockEnd.x,stop.dockEnd.z-sign*.7),heading),
  exit:world(point(stop.land.x,stop.land.z-sign*.9),(heading+180)%360)};
});
export const nearRaftStop=(p,reach=RAFT_BOARD_REACH)=>p&&raftStops.find(s=>Math.hypot(s.board.x-p.x,s.board.y-p.y)<=reach)||null;

function pierProgress(p,stop){
 const {land,dockEnd}=stop;
 if(Math.abs(p.x-land.x)>RAFT_DOCK_WIDTH/2)return -1;
 const len=dockEnd.z-land.z,d=(p.z-land.z)*Math.sign(len);
 return d>=0&&d<=Math.abs(len)?d:-1;
}
export const onRaftPier=p=>raftStops.some(stop=>pierProgress(p,stop)>=0);
export function raftPierHeight(p){
 for(const stop of raftStops){
  const d=pierProgress(p,stop);
  if(d>=0)return .02+.30*Math.min(1,d/2.5);
 }
 return 0;
}

// The pole raft follows a bend in open water between the stepping stones and Woljeonggyo.
// It returns stern-first, keeping the hull and its seated passengers aligned at each dock.
const north=raftStops[0].berth,south=raftStops[1].berth;
const a=point(550,north.z),b=point(535,south.z);
function riverCourse(t){
 const u=1-t,uu=u*u,tt=t*t;
 const x=uu*u*north.x+3*uu*t*a.x+3*u*tt*b.x+tt*t*south.x;
 const z=uu*u*north.z+3*uu*t*a.z+3*u*tt*b.z+tt*t*south.z;
 const dx=uu*(a.x-north.x)+2*u*t*(b.x-a.x)+tt*(south.x-b.x);
 const dz=uu*(a.z-north.z)+2*u*t*(b.z-a.z)+tt*(south.z-b.z);
 const tangent=(Math.atan2(dx,-dz)*180/Math.PI+360)%360,bank=t<.5?north:south,docked=t<.5?90:270;
 // Leave the pole raft parallel to the landing until its stern clears the tip.
 const f=Math.max(0,Math.min(1,(Math.hypot(x-bank.x,z-bank.z)-3.4)/4.5));
 return world({x,z},docked+((tangent-docked+540)%360-180)*f*f*(3-2*f));
}
const distances=[0],samples=64;
let previous=riverCourse(0);
for(let i=1;i<=samples;i++){
 const p=riverCourse(i/samples);
 distances.push(distances[i-1]+Math.hypot(p.x-previous.x,p.y-previous.y));previous=p;
}
function progressAt(distanceFraction){
 const d=distances[samples]*distanceFraction;
 let low=1,high=samples;
 while(low<high){const mid=(low+high)>>1;if(distances[mid]<d)low=mid+1;else high=mid;}
 return (low-1+(d-distances[low-1])/(distances[low]-distances[low-1]))/samples;
}
const epoch=Date.UTC(2026,0,1),legTime=RAFT_DWELL_MS+RAFT_TRAVEL_MS;
const phase=time=>((time-epoch)%RAFT_CYCLE_MS+RAFT_CYCLE_MS)%RAFT_CYCLE_MS;
export const raftHeave=time=>.018*Math.sin(2*Math.PI*((time%3600)/3600));
export function raftAt(time){
 if(!Number.isFinite(time))return null;
 const elapsed=phase(time),bank=elapsed<legTime?0:1,since=elapsed-bank*legTime;
 const common={kind:"raft",time,nextStopId:raftStops[1-bank].id};
 if(since<RAFT_DWELL_MS)return {...common,...world(raftStops[bank].berth,bank?270:90),
  stopId:raftStops[bank].id,remaining:RAFT_DWELL_MS-since,elapsed:since,traveling:false,eta:0};
 const moving=since-RAFT_DWELL_MS,u=moving/RAFT_TRAVEL_MS,ramp=.10;
 // Accelerate at shore, then hold a steady pace in midstream.
 const fraction=u<ramp?u*u/(2*ramp*(1-ramp)):u>1-ramp?1-(1-u)**2/(2*ramp*(1-ramp)):(u-ramp/2)/(1-ramp);
 return {...common,...riverCourse(progressAt(bank?1-fraction:fraction)),stopId:null,
  remaining:0,elapsed:moving,traveling:true,eta:RAFT_TRAVEL_MS-moving};
}
export function raftSeatAtPose(boat,seat){
 if(!Number.isInteger(seat)||seat<0||seat>=RAFT_SEATS)return null;
 if(!boat)return null;
 const {side,forward,headingOffset}=raftSeatOffsets[seat],yaw=(180-boat.heading)*Math.PI/180,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:boat.x+side*c+forward*s,y:boat.y-side*s+forward*c,heading:(boat.heading+headingOffset)%360};
}
export const raftSeatPose=(time,seat)=>raftSeatAtPose(raftAt(time),seat);
export function raftStopTimes(id,time){
 const bank=raftStops.findIndex(s=>s.id===id);
 if(bank<0||!Number.isFinite(time))return null;
 const at=(phase(time)-bank*legTime+RAFT_CYCLE_MS)%RAFT_CYCLE_MS;
 return {arrivalMs:RAFT_CYCLE_MS-at,departureMs:at<RAFT_DWELL_MS?RAFT_DWELL_MS-at:null};
}
