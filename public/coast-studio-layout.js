// The set sits against the far edge of the existing navigable bay, in local coast metres.
export const studioWall={x:568,z:-70,half:57,height:26};
export const studioDock={x:557,z:-70},studioMooring={x:548.95,z:-70,yaw:Math.PI};
export const studioLadder={x:557,z:-64},studioDoor={x:568,z:-87.7,h:7.25};
export const studioConsole={x:574.9,z:-87.6,h:7.25};
export const studioStairs={x:566,start:-73,end:-86.5,treads:30,width:1.66};
const inside=(p,x1,x2,z1,z2)=>p.x>=x1&&p.x<=x2&&p.z>=z1&&p.z<=z2;
const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export const studioInRoom=p=>inside(p,568.28,576.62,-91.24,-83.96);
export function studioFloor(p){
 if(p.x<557||p.x>577||p.z< -92||p.z> -61)return null;
 if(studioInRoom(p))return studioDoor.h;
 if(inside(p,564.85,567.75,-89.4,studioStairs.end))return studioDoor.h;
 if(inside(p,studioStairs.x-.7,studioStairs.x+.7,studioStairs.end,studioStairs.start)){
  const n=Math.floor((studioStairs.start-p.z)/.45+1e-6);
  return 1.85+n*.18;
 }
 return inside(p,557,567.75,-75,-61)?1.85:null;
}
export function studioStep(a,b){
 if(Math.max(a.x,b.x)<554||Math.min(a.z,b.z)> -12||Math.max(a.z,b.z)< -129)return undefined;
 const first=studioFloor(a),last=studioFloor(b);
 if(first!=null||last!=null){
  if(first==null||last==null||studioInRoom(a)!==studioInRoom(b))return false;
  // The control desk faces west. Its solid cabinet is behind the controls.
  if(studioInRoom(b)&&inside(b,575.14,576.64,-89.1,-86.1))return false;
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
  if((q.x>=556.85&&inside(q,556.85,568,-75.2,-60.8))||Math.abs(q.z-studioWall.z)<studioWall.half&&q.x>=567.60)return false;
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
