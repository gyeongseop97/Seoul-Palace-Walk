import geo from "./pohang-geography.js";
import {coastCycleway} from "./pohang-transit-geography.js";

// Metres east/south in the same frame as the measured beach polygon and the 해안로 centreline.
const waterLine=[[1350,-1650],[1280,-1240],[1270,-1135],[1180,-1060],[988,-1015],[740,-959],[535,-924],[398,-846],geo.pier[0],...geo.beach.slice(19,32),[112,550]].sort((a,b)=>a[1]-b[1]);
const rearLine=[geo.pier[0],...geo.beach.slice(0,20),[-35,550]].sort((a,b)=>a[1]-b[1]);
const cycleLine=coastCycleway.toSorted((a,b)=>a[1]-b[1]);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function atZ(line,z){
 let i=1;while(i<line.length-1&&line[i][1]<z)i++;
 const a=line[i-1],b=line[i];return a[0]+(b[0]-a[0])*clamp((z-a[1])/(b[1]-a[1]||1),0,1);
}
export const shore=z=>atZ(waterLine,z);
export const promenade=z=>Math.min(shore(z)-5,atZ(rearLine,z)-4);
export const sandEdge=z=>promenade(z)+4;
export const cycleX=z=>atZ(cycleLine,z);
const coastRoad=geo.coastRoads.flatMap(line=>line.slice(1).map((b,i)=>[line[i],b]));
export function upperRoadEdge(z){
 const lane=cycleX(z);
 let x=lane-10,best=Infinity;
 for(const [a,b] of coastRoad){
  if((a[1]>z)===(b[1]>z))continue;
  const mid=a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]),d=Math.abs(mid-lane+9);
  if(d<best){x=mid;best=d;}
 }
 return Math.min(x+4.6,lane-1.7);
}
export const walkDeckY=1.85;
export const beachLimits=[-661.8,283.5];
export const beachAccess=[
 {z:-621,width:7,run:2.7,steps:6},{z:-519,width:4.8,run:11.2,steps:0},
 {z:-391,width:14,run:3.15,steps:7},{z:-276,width:7.8,run:3.15,steps:7},
 {z:-179.8,width:5,run:11.4,steps:0},{z:-126.2,width:10,run:3.3,steps:7},
 {z:-35,width:17,run:3.35,steps:7},{z:37,width:5,run:11.4,steps:0},
 {z:132,width:10,run:3.35,steps:7},{z:226,width:12,run:3.3,steps:7},
 {z:264,width:5,run:10.8,steps:0}
];
const dockZ=geo.route.at(-1)[1]-47;
const gate=z=>beachAccess.find(a=>Math.abs(z-a.z)<=a.width*.5);
export function wallDrop(z){
 if(z<beachLimits[0]||z>beachLimits[1])return 0;
 return 1.03*Math.min(1,(z-beachLimits[0])/11,(beachLimits[1]-z)/10);
}
export const sandCrest=z=>walkDeckY-wallDrop(z);
export const seabedStops=[[0,-.18,0xc4ab83],[5,-.85,0xa5a78c],[15,-2.18,0x789d92],[32,-4.05,0x407e83],[65,-5.9,0x285f70],[140,-8.1,0x235266],[1950,-33,0x204d5f]];
export function sandFloor(x,z){
 const a=sandEdge(z),b=shore(z);
 if(x>b){
  const d=x-b;
  for(let i=1;i<seabedStops.length;i++){
   const [end,h]=seabedStops[i],[start,prev]=seabedStops[i-1];
   if(d<=end)return prev+(h-prev)*(d-start)/(end-start);
  }
  return seabedStops.at(-1)[1];
 }
 return clamp(sandCrest(z)-(x-a)*(sandCrest(z)+.18)/Math.max(.1,b-a),-3,walkDeckY);
}
export function accessHeight(g,z,across){
 const u=clamp(across/g.run,0,1),floor=sandFloor(sandEdge(z)+g.run,z);
 // Every riser has a matching collision tread. The sloped entries use a continuous profile.
 return walkDeckY+(floor-walkDeckY)*(g.steps?Math.floor(u*g.steps+1e-8)/g.steps:u);
}
export function beachFloor(p){
 const x=sandEdge(p.z);
 if(p.x<=x)return walkDeckY;
 const a=wallDrop(p.z)>0&&gate(p.z);
 if(a&&p.x<x+a.run)return accessHeight(a,p.z,p.x-x);
 return sandFloor(p.x,p.z);
}
export function wallSolid(z){
 return wallDrop(z)>.18&&!gate(z)&&Math.abs(z-dockZ)>2.35;
}
export function atBeachWall(p){
 return p.z>=beachLimits[0]&&p.z<=beachLimits[1]&&Math.abs(p.x-sandEdge(p.z))<.21&&wallSolid(p.z);
}
export function canCrossBeachEdge(a,b){
 if(Math.max(a.z,b.z)<beachLimits[0]||Math.min(a.z,b.z)>beachLimits[1])return true;
 const ax=a.x-sandEdge(a.z),bx=b.x-sandEdge(b.z);
 if((ax<0)===(bx<0))return true;
 const t=ax/(ax-bx);return !wallSolid(a.z+(b.z-a.z)*t);
}
export const profileRows=[...new Set([...waterLine,...rearLine,...cycleLine].map(p=>p[1]).concat(beachLimits,...beachAccess.flatMap(g=>[g.z-g.width/2,g.z,g.z+g.width/2]),[dockZ-2.35,dockZ+2.35]))].sort((a,b)=>a-b);
