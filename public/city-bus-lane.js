const dist=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)});
export const angle=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
export const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function laneOffset(edge){
 return edge.oneWay?Math.max(0,edge.width*.5-1.65):Math.min(3.48,Math.max(1.43,edge.width*.5-1.65));
}
// Intersect the offset lanes first, then fillet their corners. Offsetting an already tight
// inner curve would make the steering briefly reverse at the triangular market junction.
export function makeBusLeg(edges,line){
 const points=[];
 const verts=edges.map((e,i)=>{
  const yaw=angle(e.a,e.b),off=laneOffset(e),x=e.a.x-Math.cos(yaw)*off,z=e.a.z+Math.sin(yaw)*off;
  if(!i)return {x,z};
  const prev=edges[i-1],prevYaw=angle(prev.a,prev.b),prevOff=laneOffset(prev);
  const px=prev.b.x-Math.cos(prevYaw)*prevOff,pz=prev.b.z+Math.sin(prevYaw)*prevOff;
  const tx=Math.sin(yaw),tz=Math.cos(yaw),ux=Math.sin(prevYaw),uz=Math.cos(prevYaw);
  const determinant=ux*tz-uz*tx;
  if(Math.abs(determinant)<.10)return {x:(px+x)*.5,z:(pz+z)*.5};
  const along=((x-px)*tz-(z-pz)*tx)/determinant;
  const limit=Math.min(5.8,dist(prev.a,prev.b)*.29,dist(e.a,e.b)*.29);
  const shift=Math.max(-limit,Math.min(limit,along));
  return {x:px+ux*shift,z:pz+uz*shift};
 });
 const tail=edges.at(-1),tailYaw=angle(tail.a,tail.b),tailOff=laneOffset(tail);
 verts.push({x:tail.b.x-Math.cos(tailYaw)*tailOff,z:tail.b.z+Math.sin(tailYaw)*tailOff});
 function add(p,limit){
  const prev=points.at(-1);
  if(prev&&dist(prev,p)<.01)return;
  points.push({...p,speed:limit});
 }
 const limit=e=>Math.min(line.maxSpeed,e.speedLimit??Infinity,e.width<5?9:e.width<6.5?13:line.maxSpeed);
 function straight(a,b,cap){
  const n=Math.max(1,Math.ceil(dist(a,b)/3));
  for(let j=1;j<=n;j++)add(mix(a,b,j/n),cap);
 }
 let start=verts[0];add(start,limit(edges[0]));
 for(let i=0;i<edges.length;i++){
  const e=edges[i],n=edges[i+1];
  if(!n){straight(start,verts[i+1],limit(e));break;}
  const v=verts[i+1],before=verts[i],after=verts[i+2];
  const h=Math.abs(turn(angle(before,v),angle(v,after)));
  const trim=Math.min(h>1.8?13.5:9.5,dist(before,v)*.44,dist(v,after)*.44);
  const a=mix(v,before,trim/(dist(before,v)||1)),b=mix(v,after,trim/(dist(v,after)||1));
  straight(start,a,limit(e));
  const steps=Math.max(4,Math.ceil(trim/1.2),Math.ceil(h/.13));
  for(let j=1;j<=steps;j++){
   const t=j/steps;
   add(mix(mix(a,v,t),mix(v,b,t),t),lerp(limit(e),limit(n),t));
  }
  start=b;
 }
 const lane=points;
 // Finite forward/backward braking passes keep approach speed continuous, including tight bends.
 lane.forEach((p,i)=>{
  const prev=lane[Math.max(0,i-1)],next=lane[Math.min(lane.length-1,i+1)];
  p.yaw=angle(prev,next);p.ds=i?dist(prev,p):0;
  if(i>0&&i<lane.length-1){
   const curvature=Math.abs(turn(angle(prev,p),angle(p,next)))/Math.max(.05,(p.ds+dist(p,next))*.5);
   if(curvature>.0001)p.speed=Math.min(p.speed,Math.max(2,Math.sqrt(2.5/curvature)));
  }
 });
 lane[0].speed=0;lane.at(-1).speed=0;
 // Distances are full scale. Compress long, clear stretches for play, while keeping
 // low-speed manoeuvres and the first and last metres at each platform at street speed.
 const lengthMetres=lane.reduce((sum,p)=>sum+p.ds,0);
 let travel=0;
 for(const p of lane){
  travel+=p.ds;
  const t=Math.min(1,travel/210,(lengthMetres-travel)/210);
  const ramp=t*t*(3-2*t);
  p.pace=1+ramp*(line.id==="express"?2.7:.68);
  p.speed*=p.pace;
 }
 for(let i=1;i<lane.length;i++)lane[i].speed=Math.min(lane[i].speed,Math.sqrt(lane[i-1].speed**2+2*line.acceleration*lane[i].pace**2*lane[i].ds));
 for(let i=lane.length-2;i>=0;i--)lane[i].speed=Math.min(lane[i].speed,Math.sqrt(lane[i+1].speed**2+2*line.braking*lane[i].pace**2*lane[i+1].ds));
 let seconds=0,length=0;
 lane.forEach((p,i)=>{
  if(i){seconds+=2*p.ds/(p.speed+lane[i-1].speed);length+=p.ds;}
  p.seconds=seconds;
 });
 return {lane,seconds,length,edge:edges[0]};
}
export function busLanePose(lane,t){
 let lo=1,hi=lane.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(lane[mid].seconds<t)lo=mid+1;else hi=mid;}
 const a=lane[lo-1],b=lane[lo],span=b.seconds-a.seconds,u=Math.max(0,Math.min(1,(t-a.seconds)/span));
 const speed=lerp(a.speed,b.speed,u),d=b.ds?(a.speed+speed)*.5*u*span/b.ds:0;
 return {...mix(a,b,d),yaw:a.yaw+turn(a.yaw,b.yaw)*d,speed};
}
