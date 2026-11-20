import {voyageAt,inSailingArea} from "./coast-voyage.js";
import {serviceSpot} from "./coast-vessel-layout.js";
import {nearScooterHub,canScoot} from "./coast-scooters.js";
import {cafeLevel,cafeStep,cafeCounter,inCafeBounds,cafeGround} from "./coast-cafe.js";
import {nearbyAmenity,changingRoom,rinseDuration} from "./beach-amenities.js";
import {deckHeight,deckToSea,seaToDeck,nearHelm,helmStation,boardingSpot,mainFloor} from "./coast-vessel-layout.js";
export {deckHeight} from "./coast-vessel-layout.js";
import {busSeatPose} from "./sejong-bus.js";
import {inPark,parkStep,hillFloor} from "./space-walk-layout.js";
import {pavilionStep,pavilionFloor} from "./pohang-pavilion-layout.js";
import {coastPoint,seaPoint} from "./region-coordinates.js";
import {canCrossBeachEdge,harborStops,stopById,arrivalsAt,busLine,platformDoor,boardRack,dock,mooring,tables,seatSpot,distance,busAt,clamp,shore,inWater,showAge} from "./pohang-layout.js";
import {canStartFestival} from "./pohang-festival-site.js";
import {festivalFocus} from "./pohang-festival-score.js";
import {newSurfRide,stepSurfRide} from "./coast-surfing.js";
import {surfField,surfSample} from "./pohang-surf-waves.js";

const radians=Math.PI/180;
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function deckOffset(ship,p){
 const x=p.x-ship.x,z=p.z-ship.z,c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 return {x:x*c-z*s,z:x*s+z*c};
}
export const coastActions=["cafeCoffee","changing","rinse","scooter","parkScooter","bus","cityBus","exitBus","train","board","surf","embark","disembark","helm","release","tour","wine","cheese","return","moor","table","stand","bell","order","fish","drink","grill","clam","festival"];
export function createCoastPlay({me,visit,view,request,now,changed,reset,notice,goSeoul,receiveFood,tasteFood,chooseOrder,chooseSeat}){
 const boat={...mooring,yaw:0,helm:null,festival:0},ship={...boat};
 let ready=false,inFlight=false,nextPoll=0,disposed=false,speed=0,tableSeat=null,orders=[],grills=new Map();
 let busHeading=null,riders=[],deck=null,wasHelm=false,watchUntil=0,actions=new Map(),pending=[],lastError=0;
 let surfRide=null;
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
    pose:{...p,yaw:Math.PI-me.heading*radians,mode:s.mode,hasBoard:s.board,coach:s.coach,deckX:s.deckX,deckZ:s.deckZ,floor:s.floor},
    boat:boat.helm===v.id?{x:ship.x,z:ship.z,yaw:ship.yaw,speed}:null}});
   if(!response.ok)throw Error("harbor");
   const result=await response.json();if(disposed||v!==visit())return;
   const was=boat.helm;Object.assign(boat,result.boat);
   if(!ready||distance(ship,boat)>24||was!==boat.helm&&boat.helm===v.id)Object.assign(ship,boat);
   ready=true;
   if(c){pending.shift();if(c.action==="helm"&&boat.helm!==v.id)notice("다른 동행이 조타 중이에요.");}
   if(was!==boat.helm)speed=boat.speed??0;
   const self=result.people.find(row=>row.id===v.id);
   riders=result.busSeats??[];
   const rental=result.scooter??null;
   if(JSON.stringify(rental)!==JSON.stringify(s.scooter??null)||
      (s.mode==="scooter")!==Boolean(rental&&!rental.parked)){
    s.scooter=rental;
    if(rental&&!rental.parked){s.mode="scooter";me.groundSit=false;me.jump=0;reset();}
    else if(s.mode==="scooter"){s.mode="walk";reset();}
    mark();
   }
   if(c?.action==="board"){
    const assigned=riders.find(row=>row.id===v.id);
    if(assigned){s.mode="bus";s.coach=assigned.coach;s.chair=assigned.seat;reset();mark();}
    else notice("버스가 출발했거나 이미 선택한 좌석이에요.");
   }
   if(c?.action==="sit"&&self?.seat==null)notice("이 탁자는 만석이에요. 옆 탁자에 앉아 주세요.");
   if(self&&self.seat!==tableSeat){
    tableSeat=self.seat;
    if(tableSeat!=null){s.mode="table";s.seat=tableSeat;const seat=seatSpot(Math.floor(tableSeat/4),tableSeat%4);relocate(seat,seat.heading??(tableSeat%2?270:90));}
    else if(s.mode==="table"){s.mode="walk";delete s.seat;mark();}
   }
   if(c?.action==="taste"&&result.bite?.token===c.token)tasteFood(result.bite.kind);
   orders=result.tavernOrders??[];
   grills=new Map(orders.filter(o=>o.cookingClams>0).map(o=>[o.spot,o.grillUntil-6500]));
  }catch{
   if(c&&now()-lastError>5000){notice("항구와 연결을 다시 시도하고 있어요.");lastError=now();}
  }finally{inFlight=false;nextPoll=now()+(pending.length?250:boat.helm?450:1500);}
 }
 function enterDeck(){
  const s=state();s.mode="deck";s.floor=mainFloor;deck={...boardingSpot,h:mainFloor};speed=0;
  relocate(deckToSea(ship,deck,now()),180);nextPoll=0;
 }
 function leaveDeck(){
  state().mode="walk";deck=null;relocate({x:dock.x-1,z:dock.z});nextPoll=0;
 }
 function riderPose(s,time){
  const b=busAt(s.coach,time/1000);
  return busSeatPose({...coastPoint(b),heading:(540-b.yaw/radians)%360},s.chair??0);
 }
 function tick(dt,axis){
  const t=now(),s=state(),id=visit()?.id;if(!id)return;
  if(t>=nextPoll)void poll();
  const helm=boat.helm===id&&s.mode==="deck";
  if(!helm){
   if(boat.voyage)Object.assign(ship,voyageAt(boat.voyage,t));
   else{
    const ease=1-Math.exp(-dt*6);
    const lead=boat.helm?clamp((t-(boat.updated??t))/1000,0,.55)*(boat.speed??0):0;
    ship.x+=(boat.x+Math.sin(boat.yaw)*lead-ship.x)*ease;
    ship.z+=(boat.z+Math.cos(boat.yaw)*lead-ship.z)*ease;
    ship.yaw+=turn(ship.yaw,boat.yaw)*ease;ship.speed=boat.speed??0;
   }
  }else{
   speed=clamp(speed-axis[1]*dt*5,-4,16);ship.yaw-=axis[0]*dt*.68;
   const x=ship.x+Math.sin(ship.yaw)*speed*dt,z=ship.z+Math.cos(ship.yaw)*speed*dt;
   if(inSailingArea({x,z})){ship.x=x;ship.z=z;}else speed=0;
   ship.speed=speed;
  }
  if(s.mode==="deck"){
   if(helm){
    deck={...helmStation,h:7.85};
    const heading=(540-ship.yaw/radians)%360;
    if(!wasHelm){reset();Object.assign(view(),{pan:heading,tilt:0});}
    else view().pan=(view().pan+((heading-me.heading+540)%360)-180+360)%360;
   }
   deck??={...boardingSpot,h:mainFloor};
   const prev=seaPoint(me),next=deckToSea(ship,deck,t);
   if(distance(prev,next)>.001){Object.assign(me,coastPoint(next));mark();}
   if(helm)me.heading=(540-ship.yaw/radians)%360;
   s.floor=deck.h??deckHeight(deck)??mainFloor;
   s.deckX=deck.x;s.deckZ=deck.z;
  }else if(s.mode==="bus"){
   const pose=riderPose(s,t);
   if(busHeading!==null)view().pan=(view().pan+((pose.heading-busHeading+540)%360)-180+360)%360;
   busHeading=pose.heading;Object.assign(me,pose);mark();
  }else if(s.mode!=="table"&&s.mode!=="scooter"){
   const mode=!inPark(seaPoint(me))&&inWater(seaPoint(me))?(s.mode==="surf"?"surf":"swim"):"walk";
   if(mode!==s.mode){s.mode=mode;mark();}
  }
  if(s.mode!=="bus")busHeading=null;
  if(s.mode!=="surf"&&(surfRide||s.surf)){surfRide=null;delete s.surf;mark();}
  wasHelm=helm;
 }
 function canStep(x,y){
  const s=state();
  const cafe=cafeStep(seaPoint(me),seaPoint({x,y}),s.cafeFloor??cafeGround);
  if(cafe!==undefined)return s.mode==="walk"&&cafe;
  if(s.mode!=="deck"&&!canCrossBeachEdge(seaPoint(me),seaPoint({x,y})))return false;
  if(s.mode==="scooter"&&!canScoot(seaPoint({x,y})))return false;
  if(s.mode==="table"||s.mode==="bus"||s.mode==="deck"&&boat.helm===visit()?.id)return false;
  if(s.mode!=="deck"){
    const p=seaPoint({x,y}),atPier=pavilionStep(seaPoint(me),p,s.track);
    if(atPier!==undefined)return atPier;
    const track=parkStep(p,s.track);
    if(Number.isFinite(s.track)&&track==null&&s.track>hillFloor(p)+.45)return false;
    return true;
  }
  const floor=deck?.h??s.floor??mainFloor,next=seaToDeck(ship,seaPoint({x,y}),now(),floor),height=deckHeight(next,floor);
  return height!==null&&Math.abs(height-floor)<.49;
 }
 function rideBoard(dt,inputX,inputZ,move){
  const p=seaPoint(me),s=state();
  surfRide??=newSurfRide();
  const step=stepSurfRide(surfRide,me.heading,inputX,inputZ,surfSample(p.x,p.z,clock()),dt);
  const moving=Math.hypot(step.x,step.z)>1e-6;
  const advanced=moving&&move(me.x+step.x,me.y+step.z);
  if(moving&&!advanced){surfRide.speed=0;surfRide.grip=0;surfRide.riding=false;}
  if(advanced&&!inWater(seaPoint(me))){s.mode="walk";surfRide=null;delete s.surf;mark();return false;}
  const rounded=n=>Math.round(n*100)/100;
  const next={speed:rounded(surfRide.speed),bank:rounded(surfRide.bank),rise:rounded(surfRide.rise)};
  if(me.heading!==step.heading||!s.surf||Object.keys(next).some(k=>s.surf[k]!==next[k]))mark();
  me.heading=step.heading;s.surf=next;
  return moving&&!advanced;
 }
 function afterMove(leaderCoast){
  const s=state(),p=seaPoint(me);
  const level=cafeLevel(p,leaderCoast?.cafeFloor??s.cafeFloor??cafeGround);
  if(level!=null)s.cafeFloor=level;else delete s.cafeFloor;
  if(s.mode==="deck"){
   const prev=deck?.h??s.floor??mainFloor;deck=seaToDeck(ship,p,now(),prev);
   deck.h=deckHeight(deck,prev)??prev;
   Object.assign(s,{deckX:deck.x,deckZ:deck.z,floor:deck.h});
  }
  else {const h=pavilionFloor(p,s.track)??parkStep(p,s.track);if(h!=null)s.track=h;else delete s.track;}
 }
 function menu(){
  const p=seaPoint(me),s=state(),v=visit(),t=now();actions=new Map();let hint="";
  if(!v)return {actions,hint};
  const add=(id,label,run)=>actions.set(id,{label,run});
  if(s.mode==="walk"&&inCafeBounds(p)&&(me.seat!=null||distance(p,cafeCounter)<2.6&&s.cafeFloor<cafeGround+.45)){
   add("cafeCoffee","커피 주문하기",()=>receiveFood("coffee"));
  }
  const sailing=s.mode==="deck";
  const nearbyBay=Math.abs(p.x-shore(p.z))<720&&p.z>-1000&&p.z<360;
  const hub=nearScooterHub(p),parked=s.scooter?.parked,beside=parked&&distance(parked,p)<2.8;
  if(s.mode==="walk"&&me.seat==null&&!me.groundSit){
   const changing=nearbyAmenity(p,"changing"),footwash=nearbyAmenity(p,"rinse");
   if(changing)add("changing","탈의실 · 옷 갈아입기",()=>{
    reset();changingRoom(s.swimwear,id=>{
     if(state().mode!=="walk"||nearbyAmenity(seaPoint(me),"changing")!==changing)return;
     if(id)s.swimwear=id;else delete s.swimwear;mark();
    });
   });
   if(footwash&&(!s.rinse||t-s.rinse.at>=rinseDuration))add("rinse","발 씻기",()=>{
    if(nearbyAmenity(seaPoint(me),"rinse")!==footwash)return;
    relocate(footwash.entry,(270-footwash.yaw/radians+360)%360);s.rinse={site:footwash.id,at:now()};mark();
   });
   if(!s.scooter&&hub)add("scooter","전동 킥보드 빌리기",()=>command("rentScooter"));
   if(beside)add("parkScooter","킥보드 다시 타기",()=>command("mountScooter"));
   if(beside&&hub)add("scooter","킥보드 반납하기",()=>command("returnScooter"));
  }
  if(s.mode==="scooter"){
   add("parkScooter","킥보드에서 내리기",()=>command("parkScooter"));
   if(hub)add("scooter","킥보드 반납하기",()=>command("returnScooter"));
  }else if(s.mode==="bus"){
   const b=busAt(s.coach,t/1000),line=busLine(s.coach);
   const name=stopById(b.stop??b.next)?.name??"정류장";
   hint=line.name+" · "+name+(b.stop?" 출발까지 ":" 도착까지 ")+b.left+"초";
   if(b.stop)add("exitBus","버스 내리기",()=>{
    const here=stopById(busAt(s.coach,now()/1000).stop);
    if(!here||here.id!==b.stop)return;
    s.mode="walk";delete s.coach;delete s.chair;
    command("exitBus");relocate(here,here.heading);
   });
  }else if(sailing){
   const touring=boat.voyage&&boat.voyage.kind!=="drift"&&!ship.done;
   const moored=!touring&&Math.abs(ship.speed??0)<.45&&distance(ship,mooring)<10;
   if(boat.helm===v.id){
    hint="앞뒤로 속도 조절 · 좌우로 조타";
    add("release","조타 놓기",()=>command("release"));
    if(moored)add("moor","부두에 계류",()=>command("moor"));
    else add("return","선착장으로 자동 귀항",()=>command("returnTrip"));
   }else{
    if(!boat.helm&&!touring)add("tour","영일만 자동 유람",()=>command("tour"));
    if(deck&&Math.abs((deck.h??s.floor)-5.46)<.4&&distance(deck,serviceSpot)<2.0){
     add("wine","와인 받기",()=>receiveFood("wine"));
     add("cheese","치즈 받기",()=>receiveFood("cheese"));
    }
    if(!boat.helm&&nearHelm(deck))add("helm","조타 맡기",()=>{if(nearHelm(deck))command("helm");});
    if(moored&&!boat.helm)add("disembark","부두로 내리기",leaveDeck);
   }
  }else if(s.mode==="table"&&tableSeat!=null){
   const table=Math.floor(tableSeat/4),order=orders.find(o=>o.spot===table);
   if(!order||order.phase==="served")add("bell","벨 누르기",()=>command("callTavern",{table}));
   if(order?.phase==="called")hint="점원이 오고 있어요.";
   if(order?.phase==="ordering")add("order","음식 주문하기",()=>chooseOrder(items=>{
    if(state().mode==="table"&&Math.floor(tableSeat/4)===table)command("orderTavern",{table,items,called:order.called});
   }));
   if(order?.phase==="cooking")hint=t<order.ready?"주방에서 주문을 준비하고 있어요.":"점원이 음식을 가져오고 있어요.";
   const tasting=pending.some(c=>c.action==="taste")||!!s.tasting&&t-s.tasting.at<1450;
   for(const [id,kind,label] of [["drink","soju","소주 한 잔"],["fish","sashimi","회 먹기"],["clam","grilledClam","구운 조개 먹기"]]){
    if(order?.[kind]>0&&!tasting)add(id,label+" · "+order[kind],()=>command("taste",{table,kind,token:crypto.randomUUID()}));
   }
   if(order?.rawClams>0&&!order.cookingClams)add("grill","조개 굽기",()=>command("tavernGrill",{table}));
   if(order?.cookingClams)hint="조개 굽는 중 · "+Math.max(0,Math.ceil((order.grillUntil-t)/1000))+"초";
   add("stand","야장에서 일어나기",()=>command("stand"));
  }else{
   const platforms=s.mode==="walk"?harborStops.filter(h=>distance(h,p)<5.8).sort((a,b)=>distance(a,p)-distance(b,p)):[];
   const messages=[];
   for(const h of platforms){
    const next=arrivalsAt(h.id,t/1000)[0];if(!next)continue;
    const b=busAt(next.index,t/1000),line=busLine(next.index);
    if(b.stop===h.id){
     messages.push(line.name+" · 출발까지 "+b.left+"초");
     add(line.id==="city"?"cityBus":"bus",line.name+" 타기 · "+h.direction,()=>chooseSeat(next.index,h.id));
    }else messages.push(line.name+" · "+h.direction+" "+Math.ceil(next.seconds)+"초 후 도착");
   }
   hint=messages.join(" / ");
   if(s.mode==="walk"&&distance(p,platformDoor)<3)add("train","서울행 KTX 타기",goSeoul);
   if(distance(p,boardRack)<5)add("board",s.board?"서핑보드 반납":"서핑보드 빌리기",()=>{
    s.board=!s.board;
    if(s.board)notice("해변 계단으로 내려가세요. 노란 부표 사이에서 파도를 탈 수 있어요.");
    mark();
   });
   if(!inPark(p)&&inWater(p)&&s.board){
    if(s.mode==="surf"){
     if(surfRide?.riding)hint="파도 타는 중 · 대각선으로 방향을 잡아 보세요";
     else if((surfField(p.x,p.z)?.strength??0)<.25)hint="파도가 들어오는 노란 부표 사이로 저어 가세요";
     else hint="파도가 오면 해변 쪽으로 저어 보세요";
    }
    add("surf",s.mode==="surf"?"보드에서 내리기":"보드에 올라 패들링",()=>{
     const mount=s.mode!=="surf";reset();s.mode=mount?"surf":"swim";
     surfRide=mount?newSurfRide():null;delete s.surf;me.jump=0;me.vaultBase=null;mark();
    });
   }
   if(ready&&distance(p,dock)<6&&distance(ship,mooring)<10&&Math.abs(ship.speed??0)<.45&&(!boat.voyage||boat.voyage.kind==="drift"||ship.done))add("embark","크루즈 승선",enterDeck);
   if(ready){
    let nearest=null,best=3.6;
    for(const table of tables){const gap=distance(table,p);if(gap<best){nearest=table;best=gap;}}
    if(nearest)add("table",(nearest.index+1)+"번 야장에 앉기",()=>command("sit",{table:nearest.index}));
   }
  }
  const age=showAge(t,boat.festival);
  if(age<0?me.seat==null&&!me.groundSit&&canStartFestival({...p,mode:s.mode}):((nearbyBay||inPark(p))&&s.mode!=="bus")){
   add("festival",age<0?"불빛축제 시작":"불꽃 바라보기",()=>{
    const current=seaPoint(me);
    if(age<0&&(me.seat!=null||me.groundSit||!canStartFestival({...current,mode:state().mode})))return;
    const dx=festivalFocus.x-p.x,dz=festivalFocus.z-p.z;
    const eye=s.track??(inPark(p)?hillFloor(p):s.floor??1.85);
    const elevation=Math.atan2(festivalFocus.y-eye,Math.max(18,Math.hypot(dx,dz)))/radians;
    Object.assign(view(),{pan:(Math.atan2(dx,-dz)/radians+360)%360,tilt:-elevation-6});
    watchUntil=t+4500;if(age<0)command("festival");
   });
  }
  return {actions,hint};
 }
 return {ship,boat,menu,tick,canStep,afterMove,rideBoard,riderPose,selectSeat:(coach,seat,stop)=>command("board",{coach,seat,stop}),
  seatMap:(coach)=>({line:busLine(coach),bus:busAt(coach,now()/1000),occupied:riders.filter(row=>row.coach===coach).map(r=>r.seat)}),trigger:id=>actions.get(id)?.run(),get grills(){return grills;},get tavernOrders(){return orders;},
  speedScale:()=>state().mode==="swim"?.83:1,
  locked:()=>["bus","table"].includes(state().mode)||state().mode==="deck"&&boat.helm===visit()?.id,
  atSea:()=>["scooter","deck","bus","table"].includes(state().mode),
  watchLift:()=>now()<watchUntil&&distance(seaPoint(me),dock)<11?8.2:0,
  stop(){disposed=true;},clock};
}
