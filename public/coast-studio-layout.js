import {coastPoint,seaPoint} from "./region-coordinates.js";

// The set sits against the far edge of the existing navigable bay, in local coast metres.
export const studioWall={x:568,z:-70,half:57,height:26};
export const studioDock={x:557,z:-70},studioMooring={x:548.95,z:-70,yaw:Math.PI};
export const studioLadder={x:557,z:-64};
// Facing the painted wall from the water, positive z is to the viewer's right.
const start=-67,run=.45,rise=.18,treads=30,base=1.85,width=1.66;
export const studioStairs={x:studioWall.x-width/2,start,end:start+treads*run,treads,run,rise,base,width};
export const studioLanding={minX:studioWall.x-width,maxX:studioWall.x,minZ:studioStairs.end,maxZ:studioStairs.end+2.9};
export const studioDoor={x:studioWall.x,z:studioStairs.end+1.2,h:base+treads*rise};
export const studioConsole={x:574.9,z:studioDoor.z-.1,h:studioDoor.h};
const inside=(p,x1,x2,z1,z2)=>p.x>=x1&&p.x<=x2&&p.z>=z1&&p.z<=z2;
const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export const studioInRoom=p=>inside(p,568.28,576.62,studioConsole.z-3.64,studioConsole.z+3.64);
export function restoreStudioPosition(pose){
 if(pose.layout!==4||pose.deck)return pose;
 const p=seaPoint(pose);
 // The quay and swim ladder stayed in place. Only the former solid flight,
 // landing and control room moved when the stairs were reversed in layout 5.
 const room=inside(p,568.28,576.62,-91.24,-83.96);
 const landing=inside(p,564.85,567.75,-89.4,-86.5);
 const raisedTread=inside(p,565.3,566.7,-86.5,-73.45+1e-6);
 if(!room&&!landing&&!raisedTread)return pose;
 const x=room?p.x:Math.max(studioLanding.minX+.14,Math.min(studioLanding.maxX-.14,studioStairs.x+p.x-566));
 const z=2*studioWall.z-p.z;
 const destination={x,z:landing?Math.min(z,studioLanding.maxZ-.14):z};
 return {...pose,...coastPoint(destination),heading:(540-pose.heading)%360,layout:5};
}
export function studioFloor(p){
 if(p.x<557||p.x>577||p.z< -75||p.z>studioConsole.z+4)return null;
 if(studioInRoom(p))return studioDoor.h;
 const inner=studioLanding.maxX-.13,outer=studioLanding.minX+.13;
 if(inside(p,outer,inner,studioLanding.minZ,studioLanding.maxZ-.13))return studioDoor.h;
 if(inside(p,outer,inner,studioStairs.start,studioStairs.end)){
  const n=Math.floor((p.z-studioStairs.start)/studioStairs.run+1e-6);
  return studioStairs.base+n*studioStairs.rise;
 }
 return inside(p,557,567.75,-75,-61)?1.85:null;
}
export function studioStep(a,b,airFeet){
 if(Math.max(a.x,b.x)<554||Math.min(a.z,b.z)> -12||Math.max(a.z,b.z)< -129)return undefined;
 const first=studioFloor(a),last=studioFloor(b);
 if(first!=null||last!=null){
  if(first!=null&&Number.isFinite(airFeet)&&!studioInRoom(a)&&!studioInRoom(b)&&
     b.x<studioWall.x-.13&&(last==null||last<=airFeet+.03))return true;
  if(first==null||last==null||studioInRoom(a)!==studioInRoom(b))return false;
  // The control desk faces west. Its solid cabinet is behind the controls.
  if(studioInRoom(b)&&inside(b,575.14,576.64,studioConsole.z-1.5,studioConsole.z+1.5))return false;
  return Math.abs(last-first)<.42;
 }
 if(Math.abs(b.z-studioWall.z)<=studioWall.half&&b.x>studioWall.x-.30)return false;
 return undefined;
}
export function studioShipClear(p){
 if(p.x<528||Math.abs(p.z-studioWall.z)>studioWall.half+32)return true;
 const yaw=p.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw);
 for(const [side,front] of [[-6.8,0],[6.8,0],[0,26],[0,-24],[-5.9,15],[5.9,15],[-5.5,-16],[5.5,-16]]){
  const q={x:p.x+side*c+front*s,z:p.z-side*s+front*c};
  if(inside(q,556.85,568,-75.2,-60.8)||inside(q,studioLanding.minX-.15,studioWall.x,studioStairs.start,studioLanding.maxZ)||
     Math.abs(q.z-studioWall.z)<studioWall.half&&q.x>=567.60)return false;
 }
 return true;
}
export function studioStorm(p){
 if(p.x<387||p.x>593||Math.abs(p.z-studioWall.z)>115)return 0;
 const distance=Math.hypot((p.x-490)/1.07,(p.z-studioWall.z)*.84);
 const shelter=Math.hypot(p.x-studioDock.x,p.z-studioDock.z);
 return smooth((96-distance)/48)*smooth((shelter-20)/41);
}
const near=(p,q,r)=>Math.hypot(p.x-q.x,p.z-q.z)<r;
export function studioInteraction(p,mode){
 if(p.x<554||!["swim","walk"].includes(mode))return null;
 const dry=studioFloor(p);
 if(mode==="swim"&&dry==null&&p.x<studioLadder.x&&near(p,studioLadder,1.95))
  return {id:"studioClimb",label:"올라가기",marker:{...studioLadder,h:1.32},destination:{x:558,z:studioLadder.z},mode:"walk",heading:90};
 if(mode!=="walk"||dry==null)return null;
 if(near(p,studioLadder,1.80))return {id:"studioWater",label:"물로 내려가기",marker:{...studioLadder,h:1.85},destination:{x:555.85,z:studioLadder.z},mode:"swim",heading:270};
 const inside=studioInRoom(p);
 if(dry===studioDoor.h&&near(p,studioDoor,1.65))return {id:"studioDoor",label:"문 열기",marker:studioDoor,
  destination:{x:studioWall.x+(inside?-1.18:1.18),z:studioDoor.z},mode:"walk",heading:inside?270:90};
 if(inside&&near(p,studioConsole,1.45))return {id:"studioConsole",label:"관제 화면 보기",marker:{...studioConsole,h:studioConsole.h+.85}};
 return null;
}
