import geo from "./pohang-geography.js";
export {geo};
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=([x,z])=>({x,z});
const shoreline=[[1350,-1650],[750,-1140],[398,-846],geo.pier[0],...geo.beach.slice(19,32),[112,550]].map(point).sort((a,b)=>a.z-b.z);
// The northern headland is outside the playable bay.
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
 if(tables.some(t=>Math.abs(p.x-t.x)<3.1&&Math.abs(p.z-t.z)<3.1))return 1.85;
 const x=shore(p.z),land=promenade(p.z)+4;
 if(p.x<=land)return 1.85;
 return clamp((x-p.x)/(x-land)*2.05-.18,-3,1.85);
}
export const route=geo.route.map(point);
export const station=route[0],beachStop=route.at(-1);
export const train={x:station.x-11,z:station.z+7};
export const arrival={x:station.x-6,z:station.z+3};
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
export const festivalDuration=76;
export function showAge(now,started){
 const auto=((now/1000)%600+600)%600;
 const manual=(now-started)/1000;
 return started>0&&manual>=0&&manual<festivalDuration?manual:auto<festivalDuration?auto:-1;
}
export function inBounds(p){
 if(p.z>=-937&&p.z<=300&&p.x>=promenade(p.z)-42&&p.x<shore(p.z)+530)return true;
 return distance(p,station)<45||route.some((b,i)=>i&&segmentDistance(p,route[i-1],b)<19);
}
export const limits={minX:-5300,maxX:1850,minZ:-3400,maxZ:1550};
