import {mooring,shore,clamp,onHeadland} from "./pohang-layout.js";

export const driftSeconds=13;
const tours=new Map(),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const inSailingArea=p=>!onHeadland(p)&&p.z>=-930&&p.z<=285&&p.x>=shore(p.z)+12&&p.x<=shore(p.z)+525;
function offshore(z,width){return {x:shore(z)+width,z};}
function course(seed){
 const key=[seed.kind,seed.ox,seed.oz,seed.angle].join(",");
 if(tours.has(key))return tours.get(key);
 const start={x:seed.ox,z:seed.oz},first={x:start.x+Math.sin(seed.angle)*28,z:start.z+Math.cos(seed.angle)*28};
 const points=[start,first];
 if(seed.kind==="tour")points.push(offshore(115,125),offshore(180,275),offshore(-10,425),offshore(-380,432),offshore(-548,335),offshore(-560,215));
 points.push(offshore(mooring.z-105,106),{x:mooring.x+3,z:mooring.z-34},{...mooring});
 const steps=[{...start,d:0,yaw:seed.angle}];let length=0;
 for(let i=0;i<points.length-1;i++){
  const p=points[Math.max(0,i-1)],a=points[i],b=points[i+1],n=points[Math.min(points.length-1,i+2)];
  const count=Math.max(10,Math.ceil(distance(a,b)/3));
  for(let j=1;j<=count;j++){
   const t=j/count,t2=t*t,t3=t*t2;
   const spline=k=>.5*(2*a[k]+(-p[k]+b[k])*t+(2*p[k]-5*a[k]+4*b[k]-n[k])*t2+(-p[k]+3*a[k]-3*b[k]+n[k])*t3);
   const z=clamp(spline("z"),-929,284),x=clamp(spline("x"),shore(z)+13,shore(z)+520);
   const prev=steps.at(-1),ds=Math.hypot(x-prev.x,z-prev.z);if(ds<.0001)continue;
   length+=ds;steps.push({x,z,d:length,yaw:Math.atan2(x-prev.x,z-prev.z)});
  }
 }
 const speed=4.9,ramp=Math.min(6,length/speed),total=length/speed+ramp;
 const path={steps,length,speed,ramp,total};
 if(tours.size>=12)tours.delete(tours.keys().next().value);
 tours.set(key,path);return path;
}
export function voyageAt(seed,now){
 const t=Math.max(0,(now-seed.started)/1000);
 if(seed.kind==="drift"){
  const u=Math.min(1,t/driftSeconds),travel=seed.speed*driftSeconds*(1-(1-u)**3)/3;
  const point=f=>({x:seed.ox+Math.sin(seed.angle)*travel*f,z:seed.oz+Math.cos(seed.angle)*travel*f});
  // A server snapshot and a newly arriving passenger must agree even at the edge of the bay.
  let fraction=1;
  if(!inSailingArea(point(1))){let lo=0,hi=1;for(let i=0;i<16;i++){const m=(lo+hi)/2;if(inSailingArea(point(m)))lo=m;else hi=m;}fraction=lo;}
  return {...point(fraction),yaw:seed.angle,speed:fraction===1?seed.speed*(1-u)**2:0,done:u===1||fraction<1};
 }
 const {steps,length,speed,ramp,total}=course(seed);
 if(t>=total)return {...mooring,yaw:0,speed:0,done:true};
 const rest=total-t,dist=t<ramp?.5*speed*t*t/ramp:rest<ramp?length-.5*speed*rest*rest/ramp:speed*(t-ramp/2);
 let lo=1,hi=steps.length-1;
 while(lo<hi){const m=(lo+hi)>>1;if(steps[m].d<dist)lo=m+1;else hi=m;}
 const a=steps[lo-1],b=steps[lo],u=clamp((dist-a.d)/(b.d-a.d),0,1);
 return {x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,yaw:a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*u,speed:speed*Math.min(1,t/ramp,rest/ramp),done:false};
}
