import geo from "./pohang-geography.js";
import {coastPoint,seaPoint} from "./region-coordinates.js";

// OSM 541695869 / 541695871 / 892267632: ridge runs across the bridge; hall occupies its seaward half.
const [cx,cz]=geo.pavilion,[sx,sz]=geo.pier[0];
export const pavilionYaw=Math.atan2(cx-sx,cz-sz);
const c=Math.cos(pavilionYaw),s=Math.sin(pavilionYaw);
export const pavilionPoint=(u,v)=>({x:cx+c*u+s*v,z:cz-s*u+c*v});
export const pavilionAxes=p=>({u:(p.x-cx)*c-(p.z-cz)*s,v:(p.x-cx)*s+(p.z-cz)*c});
export const bridgeStart=-Math.hypot(cx-sx,cz-sz);
export const upperLevel=6.13,lowerLevel=2.83,stairRun={from:-3.7,to:3.4,half:1.43,count:20};
export const upperBounds={left:-7.9,right:7.9,front:2.96,back:11.24};
export const pillars=[-7.25,-4.35,-1.45,1.45,4.35,7.25].flatMap(u=>[3.3,10.9].map(v=>({u,v})));
export const pierHeight=v=>1.89+.94*Math.min(1,Math.max(0,(v-bridgeStart)/55));
const inUpper=({u,v})=>u>upperBounds.left&&u<upperBounds.right&&v>=upperBounds.front&&v<upperBounds.back;
const stair=({u,v})=>Math.abs(u)<stairRun.half&&v>=stairRun.from&&v<=stairRun.to;
const stairHeight=v=>lowerLevel+(upperLevel-lowerLevel)*Math.min(1,Math.max(0,Math.ceil((v-stairRun.from)/(stairRun.to-stairRun.from)*stairRun.count-.00001)/stairRun.count));
const deck=({u,v})=>Math.abs(u)<=14.5&&v>=-13.4&&v<=13.5;
const bridge=({u,v})=>Math.abs(u)<=2.64&&v>=bridgeStart-.6&&v<=-12.9;
export function nearPavilion(p){
 return Math.abs(p.x-cx)<105&&Math.abs(p.z-cz)<92;
}
export function onPavilion(p){if(!nearPavilion(p))return false;const q=pavilionAxes(p);return deck(q)||bridge(q);}
export function pavilionFloor(p,previous){
 if(!nearPavilion(p))return null;
 const q=pavilionAxes(p);
 if(stair(q))return stairHeight(q.v);
 if(inUpper(q)&&previous>upperLevel-.55)return upperLevel;
 return deck(q)?lowerLevel:bridge(q)?pierHeight(q.v):null;
}
function railing(q,upper){
 const {u,v}=q;
 if(upper){
  if(Math.abs(u)>7.7||v>11.02)return true;
  return v<3.16&&Math.abs(u)>1.28;
 }
 if(v< -13)return v>bridgeStart+1&&Math.abs(u)>2.37;
 if(Math.abs(u)>14.23||v>13.23||v< -13.12&&Math.abs(u)>2.36)return true;
 return Math.abs(Math.abs(u)-stairRun.half)<.18&&v>stairRun.from+.4&&v<stairRun.to+.1;
}
export function pavilionObstacle(p,height){
 if(!onPavilion(p))return false;
 const q=pavilionAxes(p);
 const upper=height>upperLevel-.45&&height<upperLevel+1.25;
 if(upper&&inUpper(q)&&railing(q,true)||height<lowerLevel+1.3&&railing(q,false))return true;
 return pillars.some(({u,v})=>Math.hypot(q.u-u,q.v-v)<.35)&&height<upperLevel+3.2;
}
export function pavilionStep(from,to,previous){
 if(!nearPavilion(from)&&!nearPavilion(to))return undefined;
 const old=pavilionFloor(from,previous),next=pavilionFloor(to,previous);
 if(old===null&&next===null)return undefined;
 if(old===null||next===null){
  const q=pavilionAxes(old===null?to:from);
  return q.v<bridgeStart+1.6&&Math.abs(q.u)<2.4;
 }
 return Math.abs(next-old)<.49&&!pavilionObstacle(to,next+.32);
}
export const pavilionEntry=pavilionPoint(0,bridgeStart);
export const pavilionApproach=pavilionPoint(0,-7);
const wp=(v,h,u=0)=>({...coastPoint(pavilionPoint(u,v)),coast:{track:h}});
export function pavilionRoute(from,to){
 if(!onPavilion(seaPoint(to))&&!onPavilion(seaPoint(from)))return null;
 const a=pavilionAxes(seaPoint(from)),b=pavilionAxes(seaPoint(to)),way=[];
 const aHigh=from.coast?.track>lowerLevel+.45,bHigh=to.coast?.track>lowerLevel+.45;
 if(!onPavilion(seaPoint(from)))way.push(wp(bridgeStart,1.89),wp(-7,lowerLevel));
 if(aHigh&&!bHigh)way.push(wp(stairRun.to+.4,upperLevel),wp(stairRun.from-.4,lowerLevel));
 if(!aHigh&&bHigh){
  if(a.v>stairRun.from&&Math.abs(a.u)>stairRun.half)way.push(wp(stairRun.from-1.1,lowerLevel,a.u));
  way.push(wp(stairRun.from-.35,lowerLevel),wp(stairRun.to+.4,upperLevel));
 }
 if(!onPavilion(seaPoint(to)))way.push(wp(-7,lowerLevel),wp(bridgeStart,1.89));
 else if(!aHigh&&!bHigh&&Math.abs(b.u)>3&&Math.abs(a.u)<2&&b.v>3)way.push(wp(-6,lowerLevel,b.u));
 return [...way,to];
}
export function pickPavilion(ray,limit=105){
 const o=ray.origin,d=ray.direction;if(!nearPavilion(o)||Math.abs(d.y)<.001)return null;
 const t=(upperLevel-o.y)/d.y;if(t<=0||t>=limit||o.y<upperLevel-.18)return null;
 const p={x:o.x+t*d.x,z:o.z+t*d.z};
 return inUpper(pavilionAxes(p))?{distance:t,point:{...coastPoint(p),coast:{track:upperLevel}}}:null;
}
