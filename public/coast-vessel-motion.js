import {inSailingArea} from "./coast-voyage.js";

const delay=420;
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const mix=(a,b,u)=>a+(b-a)*u;
function navigable(start,pose){
 if(inSailingArea(pose))return pose;
 let lo=0,hi=1;
 for(let i=0;i<12;i++){
  const u=(lo+hi)/2;
  if(inSailingArea({x:mix(start.x,pose.x,u),z:mix(start.z,pose.z,u),yaw:start.yaw+turn(start.yaw,pose.yaw)*u}))lo=u;else hi=u;
 }
 return {...pose,x:mix(start.x,pose.x,lo),z:mix(start.z,pose.z,lo),yaw:start.yaw+turn(start.yaw,pose.yaw)*lo,speed:0};
}
// Samples are in shared room time. Buffer a little steering history and use
// helm speed and the observed turn rate through a short gap in deliveries.
export function createVesselTrack(){
 const samples=[];
 function record(boat){
  const at=boat.sampleAt??boat.updated;
  if(!Number.isFinite(at))return;
  const last=samples.at(-1);
  if(last&&last.helm!==boat.helm)samples.length=0;
  else if(last&&at<=last.at)return;
  samples.push({at,helm:boat.helm,x:boat.x,z:boat.z,yaw:boat.yaw,speed:boat.speed??0});
  if(samples.length>8)samples.shift();
 }
 function at(clock){
  const t=clock-delay,last=samples.at(-1);
  if(!last)return null;
  if(t<=samples[0].at)return samples[0];
  for(let i=1;i<samples.length;i++){
   const a=samples[i-1],b=samples[i];
   if(t>b.at)continue;
   const span=(b.at-a.at)/1000,u=(t-a.at)/(b.at-a.at),u2=u*u,u3=u2*u;
   const axis=(key,component)=>mix(a[key],b[key],3*u2-2*u3)+span*
    ((u3-2*u2+u)*a.speed*component(a.yaw)+(u3-u2)*b.speed*component(b.yaw));
   return navigable(a,{x:axis("x",Math.sin),z:axis("z",Math.cos),yaw:a.yaw+turn(a.yaw,b.yaw)*u,speed:mix(a.speed,b.speed,u)});
  }
  const age=(t-last.at)/1000,prev=samples.at(-2),span=prev?(last.at-prev.at)/1000:0;
  const rate=span>.04&&span<2.5?clamp(turn(prev.yaw,last.yaw)/span,-.68,.68):0;
  // Give delayed samples room to arrive, then coast to rest if the skipper disconnects.
  const fade=clamp((age-1.1)/.8,0,1),dt=Math.min(age,1.1)+.8*(fade-fade*fade/2);
  const yaw=last.yaw+rate*dt,half=rate*dt/2;
  const travel=last.speed*dt*(Math.abs(half)>.0001?Math.sin(half)/half:1);
  return navigable(last,{x:last.x+travel*Math.sin(last.yaw+half),z:last.z+travel*Math.cos(last.yaw+half),
   yaw,speed:last.speed*(1-fade)});
 }
 return {record,at,clear(){samples.length=0;}};
}

// Advance along the current trajectory at its actual velocity. A newly
// received sample only changes the residual, which decays over several frames.
export function followVessel(ship,previous,target,dt){
 const decay=Math.exp(-Math.max(0,dt)*4.6);
 const x=target.x+(ship.x-previous.x)*decay,z=target.z+(ship.z-previous.z)*decay;
 const desiredYaw=target.yaw+turn(previous.yaw,ship.yaw)*decay;
 const yaw=ship.yaw+clamp(turn(ship.yaw,desiredYaw),-.94*dt,.94*dt);
 const correction={x,z,yaw,speed:target.speed,done:target.done};
 if(Math.hypot(x-target.x,z-target.z)<.001&&Math.abs(turn(correction.yaw,target.yaw))<.0002)Object.assign(ship,target);
 else Object.assign(ship,inSailingArea(correction)?correction:target);
}
