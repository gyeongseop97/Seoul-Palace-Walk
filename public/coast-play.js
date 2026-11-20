import {busSeatPose} from "./sejong-bus.js";
import {inPark,parkStep,hillFloor} from "./space-walk-layout.js";
import {coastPoint,seaPoint} from "./region-coordinates.js";
import {station,train,platformDoor,arrival,beachStop,boardRack,dock,mooring,tables,seatSpot,distance,busAt,busCount,clamp,shore,inWater,wave,showAge} from "./pohang-layout.js";
import {chapterAt} from "./pohang-festival-score.js";

const radians=Math.PI/180;
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function deckOffset(ship,p){
 const x=p.x-ship.x,z=p.z-ship.z,c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 return {x:x*c-z*s,z:x*s+z*c};
}
function fromDeck(ship,p){
 const c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 return {x:ship.x+p.x*c+p.z*s,z:ship.z-p.x*s+p.z*c};
}
// Walkable surfaces follow the teak stern, the starboard companionway and the flybridge.
export function deckHeight(p){
 if(p.z>=-12.65&&p.z<=-6.15&&Math.abs(p.x)<=3.35){
  if(Math.abs(p.x-1.7)<.69&&p.z>=-9.65)return 5.46+clamp((p.z+9.65)/4,0,1)*2.39;
  return 5.46;
 }
 if(p.z>=-6.35&&p.z< -5.55&&Math.abs(p.x-1.7)<.69)return 5.46+clamp((p.z+9.65)/4,0,1)*2.39;
 if(p.z>=-5.58&&p.z<9&&Math.abs(p.x)<2.75)return 7.85;
 return null;
}
export const coastActions=["bus","exitBus","train","board","surf","embark","disembark","helm","release","return","moor","table","stand","fish","drink","grill","clam","festival"];
export function createCoastPlay({me,visit,view,request,now,changed,reset,notice,goSeoul,receiveFood,chooseSeat}){
 const boat={...mooring,yaw:0,helm:null,festival:0},ship={...boat};
 let ready=false,inFlight=false,nextPoll=0,disposed=false,auto=false,speed=0,tableSeat=null,grills=new Map();
 let riders=[],deck=null,wasHelm=false,watchUntil=0,actions=new Map(),pending=[],lastError=0;
 const state=()=>me.coast??={mode:"walk",board:false};
 const clock=()=>now()/1000%14400;
 function mark(){changed();}
 function relocate(p,heading){
  Object.assign(me,coastPoint(p),{vx:0,vy:0,blocked:false,running:false,up:false,groundSit:false});
  if(heading!=null)me.heading=(heading+360)%360;
  reset();mark();
 }
 function command(action,extra={}){
  if(!pending.some(c=>c.action===action))pending.push({action,...extra});nextPoll=0;void poll();
 }
 async function poll(){
  const v=visit();if(!v||inFlight||disposed)return;
  inFlight=true;const c=pending[0],p=seaPoint(me),s=state();
  try{
   const response=await request("/api/room",{room:v.room,id:v.id,key:v.key,coast:{...c,shared:true,
    pose:{...p,yaw:Math.PI-me.heading*radians,mode:s.mode,hasBoard:s.board,coach:s.coach},
    boat:boat.helm===v.id?{x:ship.x,z:ship.z,yaw:ship.yaw}:null}});
   if(!response.ok)throw Error("harbor");
   const result=await response.json();if(disposed||v!==visit())return;
   const was=boat.helm;Object.assign(boat,result.boat);
   if(!ready||distance(ship,boat)>24||was!==boat.helm&&boat.helm===v.id)Object.assign(ship,boat);
   ready=true;
   if(c){pending.shift();if(c.action==="helm"&&boat.helm!==v.id)notice("다른 동행이 조타 중이에요.");}
   if(was===v.id&&boat.helm!==v.id){speed=0;auto=false;}
   const self=result.people.find(row=>row.id===v.id);
   riders=result.busSeats??[];
   if(c?.action==="board"){
    const assigned=riders.find(row=>row.id===v.id);
    if(assigned){s.mode="bus";s.coach=assigned.coach;s.chair=assigned.seat;reset();mark();}
    else notice("버스가 출발했거나 이미 선택한 좌석이에요.");
   }
   if(self&&self.seat!==tableSeat){
    tableSeat=self.seat;
    if(tableSeat!=null){s.mode="table";s.seat=tableSeat;relocate(seatSpot(Math.floor(tableSeat/4),tableSeat%4),tableSeat%2?270:90);}
    else if(s.mode==="table"){s.mode="walk";delete s.seat;mark();}
   }
   if(c?.action==="eat"&&result.ate)receiveFood("grilledClam");
   grills=new Map(result.grills.map(g=>[g.spot,g.started]));
  }catch{
   if(c&&now()-lastError>5000){notice("항구와 연결을 다시 시도하고 있어요.");lastError=now();}
  }finally{inFlight=false;nextPoll=now()+(pending.length?250:boat.helm?450:1500);}
 }
 function enterDeck(){
  const s=state();s.mode="deck";deck={x:0,z:-10.7};speed=0;
  relocate(fromDeck(ship,deck),90);nextPoll=0;
 }
 function leaveDeck(){
  state().mode="walk";deck=null;relocate({x:dock.x-1,z:dock.z});nextPoll=0;
 }
 function tick(dt,axis){
  const t=now(),s=state(),id=visit()?.id;if(!id)return;
  if(t>=nextPoll)void poll();
  const helm=boat.helm===id&&s.mode==="deck";
  if(!helm){
   const ease=1-Math.exp(-dt*5);
   ship.x+=(boat.x-ship.x)*ease;ship.z+=(boat.z-ship.z)*ease;ship.yaw+=turn(ship.yaw,boat.yaw)*ease;
  }else{
   if(auto){
    const d=distance(ship,mooring);
    if(d<3){auto=false;speed=0;command("moor");}
    else {ship.yaw+=clamp(turn(ship.yaw,Math.atan2(mooring.x-ship.x,mooring.z-ship.z)),-dt*1.2,dt*1.2);speed=Math.min(14,d*.65);}
   }else{speed=clamp(speed-axis[1]*dt*5,-4,16);ship.yaw-=axis[0]*dt*.68;}
   const x=ship.x+Math.sin(ship.yaw)*speed*dt,z=ship.z+Math.cos(ship.yaw)*speed*dt;
   if(z>=-930&&z<=285&&x>=shore(z)+12&&x<=shore(z)+525){ship.x=x;ship.z=z;}else speed=0;
  }
  if(s.mode==="deck"){
   if(helm){deck={x:0,z:6.5};if(!wasHelm)reset();}
   deck??={x:0,z:-10.7};
   const prev=seaPoint(me),next=fromDeck(ship,deck);
   if(distance(prev,next)>.001){Object.assign(me,coastPoint(next));mark();}
   if(helm)me.heading=(540-ship.yaw/radians)%360;
   s.floor=deckHeight(deck)??5.46;
  }else if(s.mode==="bus"){
   const b=busAt(s.coach,t/1000),pose=busSeatPose({...coastPoint(b),heading:(540-b.yaw/radians)%360},s.chair??0);
   Object.assign(me,pose);mark();
  }else if(s.mode!=="table"){
   const mode=!inPark(seaPoint(me))&&inWater(seaPoint(me))?(s.mode==="surf"?"surf":"swim"):"walk";
   if(mode!==s.mode){s.mode=mode;mark();}
  }
  wasHelm=helm;
 }
 function canStep(x,y){
  const s=state();
  if(s.mode==="table"||s.mode==="bus"||s.mode==="deck"&&boat.helm===visit()?.id)return false;
  if(s.mode!=="deck"){
    const p=seaPoint({x,y}),track=parkStep(p,s.track);
    if(Number.isFinite(s.track)&&track==null&&s.track>hillFloor(p)+.45)return false;
    return true;
  }
  const next=deckOffset(ship,seaPoint({x,y})),height=deckHeight(next);
  return height!==null&&Math.abs(height-(deckHeight(deck)||5.46))<.49;
 }
 function drift(dt,move){
  const p=seaPoint(me),flow=wave(p.x,p.z,clock()),heading=me.heading;
  const energy=clamp(1+flow*.7,.35,1.85);
  if(move(me.x-dt*energy,me.y-dt*energy*.22))me.heading=heading;
 }
 function afterMove(){
  const s=state(),p=seaPoint(me);
  if(s.mode==="deck")deck=deckOffset(ship,p);
  else {const h=parkStep(p,s.track);if(h!=null)s.track=h;else delete s.track;}
 }
 function menu(){
  const p=seaPoint(me),s=state(),v=visit(),t=now();actions=new Map();let hint="";
  if(!v)return {actions,hint};
  const add=(id,label,run)=>actions.set(id,{label,run});
  const stationSide=distance(p,station)<28,beach=distance(p,beachStop)<25,sailing=s.mode==="deck";
  const nearbyBay=Math.abs(p.x-shore(p.z))<720&&p.z>-1000&&p.z<360;
  if(s.mode==="bus"){
   const b=busAt(s.coach,t/1000);hint=b.stop?"출발까지 "+b.left+"초":(b.next==="beach"?"영일대":"포항역")+" 도착까지 "+b.left+"초";
   if(b.stop)add("exitBus","버스 내리기",()=>{s.mode="walk";command("exitBus");relocate(b.stop==="station"?arrival:{x:beachStop.x+7,z:beachStop.z+2},90);});
  }else if(sailing){
   const moored=distance(ship,mooring)<13;
   if(boat.helm===v.id){
    hint="앞뒤로 속도 조절 · 좌우로 조타";
    add("release","조타 놓기",()=>{speed=0;auto=false;command("release");});
    if(moored)add("moor","부두에 계류",()=>{speed=0;auto=false;command("moor");});
    else add("return",auto?"자동 귀항 취소":"선착장으로 귀항",()=>{auto=!auto;});
   }else{
    if(!boat.helm)add("helm","조타 맡기",()=>command("helm"));
    if(moored&&!boat.helm)add("disembark","부두로 내리기",leaveDeck);
   }
  }else if(s.mode==="table"&&tableSeat!=null){
   const table=Math.floor(tableSeat/4),started=grills.get(table);
   add("fish","회 받기",()=>receiveFood("sashimi"));add("drink","소주 받기",()=>receiveFood("soju"));
   if(!started)add("grill","조개 굽기",()=>command("grill",{table}));
   else if(t-started>=6500)add("clam","구운 조개 받기",()=>{if(!me.item||!me.secondItem)command("eat",{table,started});else notice("손을 하나 비운 뒤 받아 주세요.");});
   else hint="조개가 익을 때까지 "+Math.ceil((6500-t+started)/1000)+"초";
   add("stand","야장에서 일어나기",()=>command("stand"));
  }else{
   if(stationSide||beach){
    const stop=stationSide?"station":"beach",all=Array.from({length:busCount},(_,i)=>({...busAt(i,t/1000),i})),b=all.find(b=>b.stop===stop);
    if(b){hint="버스 출발까지 "+b.left+"초";add("bus",stationSide?"영일대행 버스 타기":"포항역행 버스 타기",()=>chooseSeat(b.i,stop));}
    else{const due=all.filter(b=>b.next===stop&&!b.stop).map(b=>b.left);if(due.length)hint="다음 버스 "+Math.min(...due)+"초 후 도착";}
   }
   if(distance(p,train)<12||distance(p,platformDoor)<3)add("train","서울행 KTX 타기",goSeoul);
   if(distance(p,boardRack)<5)add("board",s.board?"서핑보드 반납":"서핑보드 빌리기",()=>{s.board=!s.board;mark();});
   if(!inPark(p)&&inWater(p)&&s.board)add("surf",s.mode==="surf"?"보드에서 내리기":"파도 타기",()=>{s.mode=s.mode==="surf"?"swim":"surf";mark();});
   if(ready&&distance(p,dock)<6&&distance(ship,mooring)<13)add("embark","크루즈 승선",enterDeck);
   const table=tables.findIndex(q=>distance(q,p)<3.6);if(ready&&table>=0)add("table","야장에 앉기",()=>command("sit",{table}));
  }
  const age=showAge(t,boat.festival);
  if(nearbyBay&&s.mode!=="bus"){
   add("festival",age<0?"불빛축제 시작":"불꽃 바라보기",()=>{
    const dx=shore(beachStop.z)+215-p.x,dz=beachStop.z-80-p.z;
    Object.assign(view(),{pan:(Math.atan2(dx,-dz)/radians+360)%360,tilt:-Math.atan2(46,Math.max(18,Math.hypot(dx,dz)))/radians});
    watchUntil=t+4500;if(age<0)command("festival");
   });
   const chapter=chapterAt(age);if(chapter&&(!hint||t<watchUntil))hint="영일만의 작은 배 · "+chapter.title+(age-chapter.at<7?" · "+chapter.line:"");
  }
  return {actions,hint};
 }
 return {ship,boat,menu,tick,canStep,afterMove,drift,selectSeat:(coach,seat)=>command("board",{coach,seat}),
  seatMap:(coach)=>({bus:busAt(coach,now()/1000),occupied:riders.filter(row=>row.coach===coach).map(r=>r.seat)}),trigger:id=>actions.get(id)?.run(),get grills(){return grills;},
  speedScale:()=>state().mode==="surf"?2.5:state().mode==="swim"?.83:1,
  locked:()=>["bus","table"].includes(state().mode)||state().mode==="deck"&&boat.helm===visit()?.id,
  atSea:()=>["deck","bus","table"].includes(state().mode),
  watchLift:()=>now()<watchUntil&&distance(seaPoint(me),dock)<11?8.2:0,
  stop(){disposed=true;},clock};
}
