import {createSportRide,canRent,hillStart,hillFinish,hillPoint,hillLane,gates,rinkGate,advanceHill,advanceSkater,iceTrick,iceEvent,hillLength} from "./outdoor-sports.js";
import {gyeongjuPoint} from "./region-coordinates.js";

const bridge=gyeongjuPoint({x:553.3,z:800.2});
const gap=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
const names={skate:"스케이트",luge:"산악 루지",sled:"잔디썰매"};
const timeText=s=>s.toFixed(1)+"초";
export function createSportControls({me,city,canStart,now,movePlayer,reset,sync,toast,setActivity,focus}){
 let ride=null;
 const status=document.getElementById("sport-status");
 function stop(){
  ride=null;
  Object.assign(me,{sport:null,sportPush:false,sportMove:null,sportAt:0,vx:0,vy:0,running:false,blocked:false});
  status.hidden=true;
 }
 function start(kind){
  if(ride||!canStart()||!canRent(kind,me))return;
  if(kind!=="skate")movePlayer({...hillPoint(0,hillLane(kind)),heading:270},names[kind]);
  else if(gap(me,rinkGate)<3){movePlayer({x:rinkGate.x,y:rinkGate.y+2,heading:180},"서울광장 아이스링크");}
  reset();ride=createSportRide(kind);me.sport=kind;me.sportMove=null;me.sportAt=0;
  toast(kind==="skate"?"방향을 놓아도 미끄러져요. 점프와 회전을 해보세요.":"좌우로 조향하고 뒤로 당겨 제동하세요. 깃발 사이를 통과하세요.");
  sync();focus();
 }
 function trick(kind){
  if(iceTrick(ride,me,kind,now())){sync();focus();return true;}
  return false;
 }
 const atLift=()=>city==="gyeongju"&&(gap(me,hillFinish)<15||gap(me,bridge)<12);
 document.getElementById("sport-ride").onclick=()=>{
  if(ride){stop();reset();sync();focus();}
  else start(city==="seoul"?"skate":"luge");
 };
 document.getElementById("sport-extra").onclick=()=>{
  if(ride){trick("spin");return;}
  if(city==="gyeongju"&&canStart()&&gap(me,hillFinish)<15)movePlayer({...bridge,heading:0},"월정교 남쪽 입구");
  else start("sled");
 };
 document.getElementById("sport-lift").onclick=()=>{
  if(!ride&&canStart()&&atLift())movePlayer({...hillStart,heading:270},"산악 루지·잔디썰매 출발장");
 };
 function update(){
  const free=!ride&&canStart(),ice=city==="seoul"&&free&&canRent("skate",me),hill=city==="gyeongju"&&free&&canRent("luge",me);
  setActivity("sport-ride",ride?(ride.kind==="skate"?"스케이트 벗기":"내리기"):ice?"스케이트 신기":hill?"루지 타기":null);
  setActivity("sport-extra",ride?.kind==="skate"?"회전 묘기":hill?"잔디썰매 타기":free&&city==="gyeongju"&&gap(me,hillFinish)<15?"월정교로 돌아가기":null,Boolean(ride&&iceEvent(me,now())));
  setActivity("sport-lift",free&&atLift()?"산 정상 출발장으로":null);
  status.hidden=!ride;
  if(ride){
   const event=iceEvent(me,now());
   const hint=ride.kind==="skate"?(event?.kind==="fall"?"넘어짐 · 일어나는 중":event?.kind==="spin"?"스핀":event?.kind==="hop"?"점프":"자유 활주"):
    Math.floor(ride.s/hillLength*100)+"% · 기문 "+ride.hits+"/"+gates.length+" · "+timeText(ride.elapsed);
   const label=names[ride.kind]+" · "+Math.round(ride.speed*3.6)+" km/h · "+hint;
   if(status.textContent!==label)status.textContent=label;
  }
 }
 function step(dt,input,viewDirection,time){
  if(!ride)return false;
  const oldX=me.x,oldY=me.y,kind=ride.kind,oldEvent=me.sportAt;
  let done=false;
  // Substeps preserve collisions and gate crossings on slower displays.
  for(let left=dt;left>.00001&&!done;){
   const slice=Math.min(left,1/60);left-=slice;
   if(kind==="skate")advanceSkater(ride,me,slice,viewDirection,time);
   else done=advanceHill(ride,me,slice,input);
  }
  if(done){
   const misses=gates.length-ride.hits,score=ride.elapsed+misses*2,key="yuram-hill-best-"+kind;
   let best=score;
   try{const saved=Number(localStorage.getItem(key));if(saved>0)best=Math.min(saved,score);localStorage.setItem(key,String(best));}catch{}
   toast(names[kind]+" 완주! "+timeText(ride.elapsed)+" + 기문 벌점 "+timeText(misses*2)+" · 최종 "+timeText(score)+" · 개인 최고 "+timeText(best));
   stop();sync();
  }else{
   me.vx=Math.max(-12,Math.min(12,(me.x-oldX)/Math.max(.001,dt)));me.vy=Math.max(-12,Math.min(12,(me.y-oldY)/Math.max(.001,dt)));
   if(oldEvent!==me.sportAt)sync();
  }
  return me.x!==oldX||me.y!==oldY;
 }
 return {stop,update,step,trick,get active(){return Boolean(ride);}};
}
