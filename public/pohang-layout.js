import geo from "./pohang-geography.js";
export {geo};
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=([x,z])=>({x,z});
const shoreline=[[1350,-1650],[1280,-1240],[1270,-1135],[1180,-1060],[988,-1015],[740,-959],[535,-924],[398,-846],geo.pier[0],...geo.beach.slice(19,32),[112,550]].map(point).sort((a,b)=>a.z-b.z);
// The coast bends east from the beach towards the wooded Hwanho headland.
const back=[geo.pier[0],...geo.beach.slice(0,20),[-35,550]].map(point).sort((a,b)=>a.z-b.z);
function atZ(line,z){
 const i=line.findIndex(p=>p.z>=z);
 if(i<0)return line.at(-1).x;
 if(i===0)return line[0].x;
 const a=line[i-1],b=line[i];return a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);
}
export const shore=z=>atZ(shoreline,z);
export const promenade=z=>Math.min(shore(z)-5,atZ(back,z)-4);
export function segmentDistance(p,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,u=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
 return Math.hypot(p.x-a.x-u*dx,p.z-a.z-u*dz);
}
export const pier=geo.pier.map(point),pavilion=point(geo.pavilion);
export const onPier=p=>segmentDistance(p,pier[0],pavilion)<2.2||distance(p,pavilion)<9;
export function ground(p){
 if(onPier(p))return 2.25;
 const stair=p.z-train.z-5;
 if(Math.abs(p.x-train.x)<=3.16&&stair>=-.16&&stair<4.0)return 1.85+(Math.floor((stair+.16)/.32)+1)*.186;
 if(Math.abs(p.x-train.x)<=3.18&&p.z>=train.z+8.96&&p.z<=train.z+25.1)return 4.268;
 const hall=hallAxes(p);if(Math.abs(hall.x)<=47.5&&Math.abs(hall.z)<=21)return 2.27;
 if(tables.some(t=>Math.abs(p.x-t.x)<3.1&&Math.abs(p.z-t.z)<3.1))return 1.85;
 const x=shore(p.z),land=promenade(p.z)+4;
 if(p.x<=land)return 1.85;
 return clamp((x-p.x)/(x-land)*2.05-.18,-3,1.85);
}
export const route=geo.route.map(point);
export const station=route[0],beachStop=route.at(-1);
const streetsByCell=new Map();
export const sideStreets=[];
for(const [width,way] of geo.contextRoads){
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
 const block=streetsByCell.get(Math.floor(p.x/64)+","+Math.floor(p.z/64));
 return block?.some(({a,b,width})=>segmentDistance(p,a,b)<width/2+1.55)??false;
}
export const train={x:station.x-11,z:station.z+7};
export const platformDoor={x:train.x-2.7,z:train.z+17};
export const stationHall=geo.station.reduce((a,[x,z])=>({x:a.x+x/geo.station.length,z:a.z+z/geo.station.length}),{x:0,z:0});
export const stationDoor={x:stationHall.x-22*Math.sin(-1.99),z:stationHall.z-22*Math.cos(-1.99)};
export function hallAxes(p){
 const dx=p.x-stationHall.x,dz=p.z-stationHall.z,a=-1.99;
 return {x:dx*Math.cos(a)-dz*Math.sin(a),z:dx*Math.sin(a)+dz*Math.cos(a)};
}
export const arrival={x:station.x-2,z:station.z+10};
export const stationShop={x:station.x+9,z:station.z+21};
export const beachShop={x:beachStop.x+4,z:beachStop.z+3};
export function kioskWall(p){
 return [stationShop,beachShop].some(k=>Math.abs(p.x-k.x)<2.0&&p.z>k.z-2.86&&p.z<k.z-.42);
}
export const boardRack={x:promenade(beachStop.z)+9,z:beachStop.z};
export const dock={x:shore(beachStop.z-47)+21,z:beachStop.z-47};
export const mooring={x:dock.x+6.6,z:dock.z};
export const tables=[-20,-29,-38,-47].map(d=>({x:promenade(beachStop.z-d)+9.5,z:beachStop.z-d}));
export const seatSpot=(i,s)=>({x:tables[i].x+(s%2?1:-1)*.87,z:tables[i].z+(s<2?-.65:.65)});
export function onDock(p){return p.z>dock.z-2.2&&p.z<dock.z+2.2&&p.x>=promenade(dock.z)&&p.x<=dock.x+1;}
const cumulative=[0];
for(let i=1;i<route.length;i++)cumulative.push(cumulative[i-1]+distance(route[i],route[i-1]));
export const routeLength=cumulative.at(-1),busTravel=92,busDwell=13,busPeriod=(busTravel+busDwell)*2,busCount=5;
export function busAt(index,seconds){
 const phase=((seconds+index*busPeriod/busCount)%busPeriod+busPeriod)%busPeriod;
 const returning=phase>=busDwell+busTravel;
 const t=returning?phase-busDwell-busTravel:phase;
 const progress=clamp((t-busDwell)/busTravel,0,1);
 const d=(returning?1-progress:progress)*routeLength;
 let i=cumulative.findIndex((v,i)=>i>0&&v>=d);if(i<1)i=route.length-1;
 const a=route[i-1],b=route[i],f=(d-cumulative[i-1])/(cumulative[i]-cumulative[i-1]);
 const yaw=Math.atan2(b.x-a.x,b.z-a.z)+(returning?Math.PI:0);
 return {x:a.x+(b.x-a.x)*f+Math.cos(yaw)*2,z:a.z+(b.z-a.z)*f-Math.sin(yaw)*2,yaw,stop:t<busDwell?(returning?'beach':'station'):null,next:returning?'station':'beach',left:Math.ceil(t<busDwell?busDwell-t:busDwell+busTravel-t)};
}
export const spectrum=[[0.55,0.043,0.019,0.67,1.2],[0.29,0.079,-0.031,0.93,2.75],[0.22,0.126,0.053,1.23,3.6],[0.14,0.17,-0.077,1.56,5.2],[0.09,0.245,0.14,1.92,0.4],[0.05,0.325,-0.174,2.19,2.7]];
export function wave(x,z,t){
 let h=0;
 for(const [a,kx,kz,s,phase] of spectrum){const q=Math.sin(x*kx+z*kz+t*s+phase);h+=a*(q+.17*(2*q*q-1));}
 return h;
}
export function inWater(p){return ground(p)<-.45&&!onDock(p)&&!onPier(p);}
export const festivalDuration=180;
export function scheduledFestivalStart(now){
 return Math.floor(now/600000)*600000;
}
export function showAge(now,started){
 const duration=festivalDuration*1000,scheduled=scheduledFestivalStart(now);
 if(started>0&&now>=started&&now<started+duration)return (now-started)/1000;
 // A scheduled curtain that fell during a requested show skips that performance.
 if(started>0&&scheduled>=started&&scheduled<started+duration)return -1;
 return now-scheduled<duration?(now-scheduled)/1000:-1;
}
export function inBounds(p){
 if(p.z>=-937&&p.z<=300&&p.x>=promenade(p.z)-42&&p.x<shore(p.z)+530)return true;
 const h=hallAxes(p);
 if(Math.abs(h.x)<46&&h.z>-21&&h.z<20){
  if(Math.abs(h.x)>44||h.z>18.0||Math.abs(h.z+19.15)<.7&&Math.abs(h.x)>7.7)return false;
  return true;
 }
 if(segmentDistance(p,{x:station.x+11,z:station.z+22},stationDoor)<4.7)return true;
 return distance(p,station)<45||onSideStreet(p)||route.some((b,i)=>i&&segmentDistance(p,route[i-1],b)<19);
}
export const limits={minX:-5300,maxX:1850,minZ:-3400,maxZ:1550};
