import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rink={x:568.6,y:239,rx:23,ry:30};
export const rinkGate={x:rink.x,y:rink.y-rink.ry};
export const hillLength=268;
export const gates=[32,65,102,144,189,233];
export const gateSide=i=>i%2?1.55:-1.55;
export const hillLane=kind=>kind==="sled"?7:-5;
export function centerline(s){return 540+11*Math.sin(s/29)+4*Math.sin(s/12);}
function bend(s){return 11/29*Math.cos(s/29)+4/12*Math.cos(s/12);}
export function hillPoint(s,side=0){return gyeongjuPoint({x:1120-s,z:centerline(s)+side});}
export function hillCoords(p){
 const q=localGyeongju(p),s=1120-q.x;
 return {s,side:q.z-centerline(s)};
}
const hillTop=s=>Math.max(0,(hillLength-s)*.178+2.4*(Math.sin(hillLength/31)-Math.sin(s/31)));
export function hillHeight(s,side){
 if(s< -52||s>hillLength||Math.abs(side)>=51)return 0;
 const shoulder=clamp((51-Math.abs(side))/33,0,1),back=clamp(1+s/52,0,1);
 return hillTop(Math.max(0,s))*shoulder*shoulder*(3-2*shoulder)*back*back*(3-2*back);
}
export function sportFloor(p){
 if(p.x<30825||p.x>31175||p.y<22470||p.y>22620)return 0;
 const {s,side}=hillCoords(p);return hillHeight(s,side);
}
export const onRink=(p,margin=0)=>((p.x-rink.x)/(rink.rx+margin))**2+((p.y-rink.y)/(rink.ry+margin))**2<=1;
export const hillStart=hillPoint(0,1),hillFinish=hillPoint(hillLength,1);
export function canRent(kind,p){
 if(kind==="skate")return onRink(p,2.5);
 return (kind==="luge"||kind==="sled")&&Math.hypot(p.x-hillStart.x,p.y-hillStart.y)<14;
}
const heading=(dx,dy)=>(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
const eventLength={spin:1150,hop:780,fall:1500};
export function iceEvent(p,time){
 const age=time-p.sportAt,duration=eventLength[p.sportMove];
 return p.sport==="skate"&&age>=0&&age<duration?{kind:p.sportMove,t:age/duration}:null;
}
export function createSportRide(kind){
 return {kind,s:0,lateral:0,drift:0,speed:0,vx:0,vy:0,contact:false,gate:0,hits:0,elapsed:0};
}
export function iceTrick(ride,p,kind,time){
 if(!ride||ride.kind!=="skate"||!["spin","hop"].includes(kind)||iceEvent(p,time))return false;
 p.sportMove=kind;p.sportAt=time;return true;
}
export function advanceSkater(r,p,dt,input,time){
 const length=Math.hypot(input.x,input.y),scale=Math.max(1,length),event=iceEvent(p,time);
 const speed=Math.hypot(r.vx,r.vy),grip=event?.kind==="fall"?0:event?.kind==="hop"?.18:1;
 const opposition=speed>0&&length>0?-(r.vx*input.x+r.vy*input.y)/(speed*length):0;
 if(!event&&speed>6.1&&opposition>.86&&length>.6){
  p.sportMove="fall";p.sportAt=time;
 }
 p.sportPush=length>.12&&!iceEvent(p,time);
 const fallen=iceEvent(p,time)?.kind==="fall",drag=Math.exp(-dt*(fallen?2.5:length?.42:.20));
 r.vx=r.vx*drag+(fallen?0:input.x/scale*6*grip*dt);
 r.vy=r.vy*drag+(fallen?0:input.y/scale*6*grip*dt);
 const limit=Math.max(1,Math.hypot(r.vx,r.vy)/8.4);r.vx/=limit;r.vy/=limit;
 if(!length&&Math.hypot(r.vx,r.vy)<.1)r.vx=r.vy=0;
 let x=p.x+r.vx*dt,y=p.y+r.vy*dt;
 const rx=rink.rx-.48,ry=rink.ry-.48,edge=Math.hypot((x-rink.x)/rx,(y-rink.y)/ry);
 if(edge>1){
  x=rink.x+(x-rink.x)/edge;y=rink.y+(y-rink.y)/edge;
  const nx=(x-rink.x)/rx**2,ny=(y-rink.y)/ry**2,n=Math.hypot(nx,ny);
  const hit=(r.vx*nx+r.vy*ny)/n;
  if(hit>0){r.vx-=1.14*hit*nx/n;r.vy-=1.14*hit*ny/n;}
  if(hit>4.7&&!fallen){p.sportMove="fall";p.sportAt=time;}
 }
 p.x=x;p.y=y;r.speed=Math.hypot(r.vx,r.vy);
 if(r.speed>.35)p.heading=heading(r.vx,r.vy);
}
export function advanceHill(r,p,dt,input){
 const sled=r.kind==="sled",width=sled?3.7:4.7,braking=Math.max(0,input.y);
 const grade=(hillTop(r.s)-hillTop(r.s+.1))/.1;
 r.speed=clamp(r.speed+(9.81*grade+.48-r.speed*(sled?.10:.065)-braking*5.8)*dt,braking?0:1,sled?8.8:11.8);
 const old=r.s;r.s=Math.min(hillLength,r.s+r.speed*dt/Math.hypot(1,bend(r.s)));
 // The cart carries momentum into each bend. Steering adjusts its cross-track velocity.
 const change=bend(r.s)-bend(old);
 r.drift=(r.drift-change*r.speed)*Math.exp(-dt*1.45)-input.x*(sled?7.5:10)*dt;
 r.lateral+=r.drift*dt;
 const hit=Math.abs(r.lateral)>=width;
 if(hit){r.lateral=clamp(r.lateral,-width,width);r.drift*=-.30;if(!r.contact)r.speed*=.48;else r.speed*=Math.exp(-dt*.9);}
 r.contact=hit;
 while(r.gate<gates.length&&r.s>=gates[r.gate]){
  if(Math.abs(r.lateral-gateSide(r.gate))<=1.9)r.hits++;
  r.gate++;
 }
 Object.assign(p,hillPoint(r.s,hillLane(r.kind)+r.lateral));
 p.heading=heading(-1,bend(r.s)+r.drift/Math.max(1,r.speed));r.elapsed+=dt;
 return r.s>=hillLength;
}
