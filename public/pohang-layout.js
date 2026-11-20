import geography from "./pohang-geography.js";
import {samhoRoad,onRetailApron} from "./coast-retail-layout.js";
import {tavernTables as tables,tavernSeatSpot as seatSpot,tavernTerrace} from "./coast-tavern-layout.js";
export {tables,seatSpot};
import {onPavilion,pavilionFloor} from "./pohang-pavilion-layout.js";
import {cityBlocks,headland} from "./pohang-transit-geography.js";
import {transitWalkable} from "./pohang-transit.js";
import {shore,promenade,beachFloor,atBeachWall} from "./pohang-beach-profile.js";
export {shore,promenade,canCrossBeachEdge} from "./pohang-beach-profile.js";
export {busAt,busDwell,busTravel,busPeriod,busCount,routeLength,harborStops,stopById,arrivalsAt,busLine,busLines,transitRoads} from "./pohang-transit.js";
import {stationFloor,stationAccess} from "./pohang-station-layout.js";
export {arrival,stationHall,stationDoor,stationShop,beachShop,train,platformDoor,stationForecourt,hallAxes} from "./pohang-station-layout.js";
export const geo={...geography,blocks:[...geography.blocks,...cityBlocks]};
export {headland};
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=([x,z])=>({x,z});
// Hwanho's shore doubles back on itself around the inlet. A single x at a given
// latitude cannot represent both the water in the cove and the headland beyond.
export function onHeadland(p){
 if(p.x<headland[0][0]||p.z> -795||p.z< -2000)return false;
 let inside=false;
 for(let i=0,j=headland.length-1;i<headland.length;j=i++){
  const [x,z]=headland[i],[u,v]=headland[j];
  if((z>p.z)!==(v>p.z)&&p.x<x+(u-x)*(p.z-z)/(v-z))inside=!inside;
 }
 return inside;
}
export function segmentDistance(p,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,u=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
 return Math.hypot(p.x-a.x-u*dx,p.z-a.z-u*dz);
}
export const pier=geo.pier.map(point),pavilion=point(geo.pavilion);
export const onPier=onPavilion;
export function ground(p){
 const pierLevel=pavilionFloor(p);if(pierLevel!==null)return pierLevel;
 if(onHeadland(p))return 1.85;
 const stationY=stationFloor(p);if(stationY!==null)return stationY;
 if(tavernTerrace(p))return 1.97;
 return beachFloor(p);
}
export const route=geo.route.map(point);
export const station=route[0],beachStop=route.at(-1);
const streetsByCell=new Map();
export const sideStreets=[];
for(const [width,way] of [...geo.contextRoads,[8,samhoRoad]]){
 for(let i=1;i<way.length;i++){
  const a=point(way[i-1]),b=point(way[i]),mid={x:(a.x+b.x)*.5,z:(a.z+b.z)*.5};
  if(distance(a,b)<1||mid.x>promenade(mid.z)-3||route.some((v,j)=>j&&segmentDistance(mid,route[j-1],v)<4))continue;
  const segment={a,b,width};sideStreets.push(segment);
  const pad=width/2+2;
  for(let cx=Math.floor((Math.min(a.x,b.x)-pad)/64);cx<=Math.floor((Math.max(a.x,b.x)+pad)/64);cx++)
   for(let cz=Math.floor((Math.min(a.z,b.z)-pad)/64);cz<=Math.floor((Math.max(a.z,b.z)+pad)/64);cz++){
    const key=cx+","+cz;if(!streetsByCell.has(key))streetsByCell.set(key,[]);streetsByCell.get(key).push(segment);
   }
 }
}
function onSideStreet(p){
 if(transitWalkable(p))return true;
 if(p.x>790&&p.x<826&&p.z> -1050&&p.z< -990&&segmentDistance(p,{x:802.9,z:-1046.1},{x:822,z:-994})<2.2)return true;
 const block=streetsByCell.get(Math.floor(p.x/64)+","+Math.floor(p.z/64));
 return block?.some(({a,b,width})=>segmentDistance(p,a,b)<width/2+1.55)??false;
}
export const boardRack={x:promenade(beachStop.z)+1.1,z:beachStop.z-4.2};
export const dock={x:shore(beachStop.z-47)+21,z:beachStop.z-47};
export const mooring={x:dock.x+8.05,z:dock.z};
export function onDock(p){return p.z>dock.z-2.2&&p.z<dock.z+2.2&&p.x>=promenade(dock.z)&&p.x<=dock.x+1;}
export const spectrum=[[0.55,0.043,0.019,0.67,1.2],[0.29,0.079,-0.031,0.93,2.75],[0.22,0.126,0.053,1.23,3.6],[0.14,0.17,-0.077,1.56,5.2],[0.09,0.245,0.14,1.92,0.4],[0.05,0.325,-0.174,2.19,2.7]];
export function wave(x,z,t){
 let h=0;
 for(const [a,kx,kz,s,phase] of spectrum){const q=Math.sin(x*kx+z*kz+t*s+phase);h+=a*(q+.17*(2*q*q-1));}
 return h;
}
export function inWater(p){return ground(p)<-.81&&!onDock(p)&&!onPier(p);}
export const festivalDuration=180;
export function showAge(now,started){
 const age=(now-started)/1000;
 return started>0&&age>=0&&age<festivalDuration?age:-1;
}
export function inBounds(p){
 if(atBeachWall(p))return false;
 if(tavernTerrace(p)||onRetailApron(p))return true;
 if(p.z>=-937&&p.z<=300&&p.x>=promenade(p.z)-42&&p.x<shore(p.z)+530)return true;
 const access=stationAccess(p);if(access!==null)return access;
 return distance(p,station)<45||onSideStreet(p)||route.some((b,i)=>i&&segmentDistance(p,route[i-1],b)<19);
}
export const limits={minX:-5300,maxX:1850,minZ:-3400,maxZ:1550};
