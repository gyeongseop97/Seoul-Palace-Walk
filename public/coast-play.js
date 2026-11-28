import {createVesselTrack,followVessel} from "./coast-vessel-motion.js";
import {voyageAt,inSailingArea} from "./coast-voyage.js";
import {cruiseSeats,cruiseSeatById,cruiseSeatInReach,cruiseSeatHeading,cruiseSeatSpot} from "./coast-vessel-seats.js";
import {nearScooterHub,canScoot,onScooterLevel} from "./coast-scooters.js";
import {cafeLevel,cafeStep,cafeCounter,inCafeBounds,cafeGround,cafeRailHeight} from "./coast-cafe.js";
import {swimSpeed} from "./beach-swimming.js";
import {nearbyAmenity,changingRoom,rinseDuration} from "./beach-amenities.js";
import {deckHeight,deckRimHeight,deckJumpSurface,sunDeckRailBlocks,offVessel,deckToSea,seaToDeck,nearHelm,helmStation,boardingSpot,mainFloor,serviceSpot,inWheelhouse,nearCruiseExit,cruiseBerth,exitGate,gangwayToe,gangwayHeight} from "./coast-vessel-layout.js";
import {studioDock,studioMooring,studioFloor,studioStep,studioInteraction} from "./coast-studio-layout.js";
export {restoreStudioPosition,studioStorm} from "./coast-studio-layout.js";
export {deckHeight} from "./coast-vessel-layout.js";
export function restoredDeckSpot(p){
 if(!p||![p.x,p.z,p.h].every(Number.isFinite))return null;
 const h=deckHeight(p,p.h)??deckRimHeight(p,p.h)??gangwayHeight(p);
 return h!=null&&Math.abs(h-p.h)<.12?{x:p.x,z:p.z,h}:null;
}
import {busSeatPose} from "./sejong-bus.js";
import {inPark,parkStep,hillFloor} from "./space-walk-layout.js";
import {pavilionStep,pavilionFloor,pavilionYaw,onPavilion,pavilionRailHeight} from "./pohang-pavilion-layout.js";
import {stationRailHeight} from "./pohang-station-layout.js";
import {coastPoint,seaPoint} from "./region-coordinates.js";
import {atPromenadeLip,beachDropStep,walkDeckY} from "./pohang-beach-profile.js";
import {nearestTavernSeat} from "./coast-tavern-layout.js";
import {readTavernSpeech,tavernReply} from "./tavern-speech.js";
import {deckJumpLift,jumpLift,worldJumpFeet} from "./activities.js";
import {canCrossBeachEdge,harborStops,stopById,arrivalsAt,busLine,platformDoor,boardRack,dock,mooring,tables,seatSpot,distance,busAt,clamp,shore,inWater,onDock,showAge} from "./pohang-layout.js";
import {canStartFestival as atFestivalBooth,festivalBooth} from "./pohang-festival-site.js";
import {festivalFocus} from "./pohang-festival-score.js";
import {newSurfRide,stepSurfRide} from "./coast-surfing.js";
import {surfField,surfSample} from "./pohang-surf-waves.js";

const swimWater=p=>inWater(p)&&!inPark(p);
const radians=Math.PI/180;
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const deckMarker=(p,h)=>({x:p.x,z:p.z,h,deck:true});
const pierMarker={x:dock.x-1.25,z:dock.z,h:1.85};
const rackMarker={x:boardRack.x+.9,z:boardRack.z-1.3};
export function deckOffset(ship,p){
 const x=p.x-ship.x,z=p.z-ship.z,c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 return {x:x*c-z*s,z:x*s+z*c};
}
export const coastActions=["cafeCoffee","changing","rinse","scooter","parkScooter","bus","cityBus","exitBus","train","board","surf","embark","deckSit","deckStand","disembark","helm","release","tour","wine","cheese","return","moor","table","stand","bell","order","fish","drink","grill","clam","festival","studioClimb","studioWater","studioDoor","studioConsole"];
export function createCoastPlay({me,visit,view,request,now,changed,reset,notice,chooseTrainDestination,receiveFood,canReceiveFood=()=>true,tasteFood,chooseOrder,chooseSeat,openMonitor,surfaceHeight}){
 const boat={...mooring,yaw:0,helm:null,festival:0},ship={...boat};
 const remoteVessel=createVesselTrack();
 let deckYaw=null,lastSailingTime=null;
 let deckWatch=null;
 function aimAtFireworks(p,eye){
  const dx=festivalFocus.x-p.x,dz=festivalFocus.z-p.z;
  const elevation=Math.atan2(festivalFocus.y-eye,Math.max(18,Math.hypot(dx,dz)))/radians;
  const camera=view();
  camera.pan=(Math.atan2(dx,-dz)/radians+360)%360;camera.tilt=-elevation-6;
  if(deckWatch){deckWatch.pan=camera.pan;deckWatch.tilt=camera.tilt;}
 }
 let ready=false,inFlight=null,nextPoll=0,disposed=false,speed=0,tableSeat=null,orders=[],grills=new Map();
 let busHeading=null,riders=[],deck=null,wasHelm=false,watchUntil=0,actions=new Map(),pending=[],lastError=0;
 let surfRide=null;
 let deckSeats=[],seatHeading=null;
 let occupiedStools=new Set();
 const seatPending=()=>pending.some(c=>c.action==="deckSit"||c.action==="deckStand");
 const state=()=>me.coast??={mode:"walk",board:false};
 const clock=()=>now()/1000%14400;
 const touring=()=>Boolean(boat.voyage&&boat.voyage.kind!=="drift"&&!ship.done);
 const berth=()=>ready&&!boat.helm&&!touring()?cruiseBerth(ship):null;
 const gangwayOpen=()=>Boolean(berth());
 const canDisembark=()=>state().mode==="deck"&&!state().deckSeat&&!seatPending()&&gangwayOpen()&&nearCruiseExit(deck);
 const canStartTour=()=>state().mode==="deck"&&!state().deckSeat&&!seatPending()&&!boat.helm&&!touring()&&inWheelhouse(deck);
 const canLaunchFireworks=p=>state().mode==="deck"||me.seat==null&&!me.groundSit&&atFestivalBooth({...p,mode:state().mode});
 function mark(){changed();}
 function relocate(p,heading){
  delete state().railY;
  Object.assign(me,coastPoint(p),{vx:0,vy:0,blocked:false,running:false,up:false,groundSit:false});
  if(heading!=null)me.heading=(heading+360)%360;
  reset();mark();
 }
 function command(action,extra={}){
  if(!pending.some(c=>c.action===action&&(action!=="talkTavern"||c.token===extra.token)))pending.push({action,...extra});nextPoll=0;void poll();
 }
 function tableChat(chat){
  if(tableSeat==null||state().mode!=="table")return;
  const said=readTavernSpeech(chat.text);
  if(!said)return;
  const seat=tableSeat,table=Math.floor(seat/4);
  return ()=>{
   if(disposed||tableSeat!==seat||state().mode!=="table")return;
   if(said.error){notice(said.error);return;}
   const order=orders.find(o=>o.spot===table);
   const waitingForCall=pending.some(c=>c.table===table&&(c.action==="callTavern"||c.action==="talkTavern"&&readTavernSpeech(c.text)?.call));
   if(!said.call&&(!order||order.phase==="served")&&!waitingForCall){
    notice("먼저 ‘이모’나 ‘여기요’ 하고 불러 주세요.");return;
   }
   if(order?.phase==="cooking"){notice("주문하신 음식 준비하고 있어요. 잠시만 기다려 주세요!");return;}
   command("talkTavern",{table,token:chat.id,text:chat.text,called:order?.called??0,waitingForCall});
  };
 }
 function poll(){
  const v=visit();if(!v||disposed)return;
  inFlight??=exchange(v).finally(()=>{inFlight=null;});
  return inFlight;
 }
 async function exchange(v){
  const c=pending[0],p=seaPoint(me),s=state();
  if(c?.waitingForCall){c.called=orders.find(o=>o.spot===c.table)?.called??c.called;delete c.waitingForCall;}
  try{
   const response=await request("/api/room",{room:v.room,id:v.id,key:v.key,coast:{...c,shared:true,
    pose:{...p,yaw:Math.PI-me.heading*radians,mode:s.mode,hasBoard:s.board,coach:s.coach,deckX:s.deckX,deckZ:s.deckZ,floor:s.floor,track:s.track},
    boat:boat.helm===v.id?{x:ship.x,z:ship.z,yaw:ship.yaw,speed,at:now()}:null}});
   if(!response.ok)throw Error("harbor");
   const result=await response.json();if(disposed||v!==visit())return;
   const was=boat.helm;Object.assign(boat,result.boat);
   if(boat.helm&&boat.helm!==v.id)remoteVessel.record(boat);else remoteVessel.clear();
   if(!ready||was!==boat.helm&&boat.helm===v.id){Object.assign(ship,boat);deckYaw=null;}
   ready=true;
   if(c){pending.shift();if(c.action==="helm"&&boat.helm!==v.id)notice("다른 동행이 조타 중이에요.");}
   if(was!==boat.helm)speed=boat.speed??0;
   const self=result.people.find(row=>row.id===v.id);
   riders=result.busSeats??[];
   deckSeats=result.deckSeats??[];
   if(s.mode==="deck"){
    const assigned=cruiseSeatById.get(deckSeats.find(row=>row.id===v.id)?.seat);
    const previous=cruiseSeatById.get(s.deckSeat);
    if(assigned!==previous){
     const seat=assigned??previous,spot=assigned?cruiseSeatSpot(assigned):previous.approach;
     deck={x:spot.x,z:spot.z,h:seat.floor};
     Object.assign(s,{deckX:deck.x,deckZ:deck.z,floor:deck.h});
     if(assigned)s.deckSeat=seat.id;else delete s.deckSeat;
     seatHeading=assigned?cruiseSeatHeading(ship,assigned):null;
     Object.assign(me,{seat:null,seatSide:null,jump:0,vaultBase:null});
     relocate(deckToSea(ship,deck,now(),deck.h),seatHeading);
    }
    if(c?.action==="deckSit"&&!assigned)notice("이 자리에 앉을 수 없어요. 가까운 빈 의자를 골라 주세요.");
   }
   const rental=result.scooter??null;
   if(JSON.stringify(rental)!==JSON.stringify(s.scooter??null)||
      (s.mode==="scooter")!==Boolean(rental&&!rental.parked)){
    const pickup=s.scooter?.parked;
    s.scooter=rental;
    if(rental&&!rental.parked){
     s.mode="scooter";me.groundSit=false;me.jump=0;
     if(pickup&&c?.action==="mountScooter"&&canScoot(pickup))relocate(pickup);
     else reset();
    }
    else if(s.mode==="scooter"){
     s.mode="walk";
     if(rental?.parked){
      relocate(rental.parked);
      const track=pavilionFloor(rental.parked)??parkStep(rental.parked,s.track);
      if(track!=null)s.track=track;else delete s.track;
     }else reset();
    }
    mark();
   }
   if(c?.action==="board"){
    const assigned=riders.find(row=>row.id===v.id);
    if(assigned){s.mode="bus";s.coach=assigned.coach;s.chair=assigned.seat;reset();mark();}
    else notice("버스가 출발했거나 이미 선택한 좌석이에요.");
   }
   occupiedStools=new Set(result.tavernSeats??[]);
   if(c?.action==="sit"&&self?.seat==null)notice("이 자리에 앉을 수 없어요. 다른 빈 의자로 다가가 주세요.");
   if(self&&self.seat!==tableSeat){
    tableSeat=self.seat;
    if(tableSeat!=null){
     s.mode="table";s.seat=tableSeat;
     const seat=seatSpot(Math.floor(tableSeat/4),tableSeat%4);relocate(seat,seat.heading);
     if(view)view().pan=seat.heading;
    }
    else if(s.mode==="table"){s.mode="walk";delete s.seat;mark();}
   }
   if(c?.action==="taste"&&result.bite?.token===c.token)tasteFood(result.bite.kind);
   orders=result.tavernOrders??[];
   if(c?.action==="talkTavern"&&s.mode==="table"&&Math.floor(tableSeat/4)===c.table){
    const spoken=readTavernSpeech(c.text)?.order,accepted=orders.find(o=>o.spot===c.table);
    if(spoken&&accepted?.summary&&spoken.summary!==accepted.summary)notice("먼저 접수한 주문은 "+accepted.summary+"예요. 음식을 가져다드린 뒤 추가 주문해 주세요.");
   }
   if(s.mode==="table"&&tableSeat!=null){
    if(!s.tableGlass&&orders.some(o=>o.spot===Math.floor(tableSeat/4)&&o.soju>0)){s.tableGlass=true;mark();}
   }else if(s.tableGlass){delete s.tableGlass;mark();}
   grills=new Map(orders.filter(o=>o.cookingClams>0).map(o=>[o.spot,o.grillUntil-6500]));
  }catch{
   if(c&&now()-lastError>5000){notice("항구와 연결을 다시 시도하고 있어요.");lastError=now();}
  }finally{nextPoll=now()+(pending.length?350:boat.helm?450:s.mode==="table"?1500:4500);}
 }
 function stepAboard(spot){
  deck=spot;
  Object.assign(state(),{mode:"deck",floor:spot.h,deckX:spot.x,deckZ:spot.z});
 }
 function stepAshore(){
  const s=state();s.mode="walk";deck=null;deckYaw=null;nextPoll=0;
  delete s.deckX;delete s.deckZ;delete s.floor;delete s.deckJumpY;
 }
 function jumpAshore(next,time){
  const s=state();
  if(Number.isFinite(s.deckJumpY)&&Number.isFinite(me.jumpOriginY)){
   // Convert the ship-relative launch height at the actual point of departure.
   // The jump clock then continues unchanged over the pier or water.
   me.jumpOriginY=deckToSea(ship,next,time,s.floor).h+s.deckJumpY-s.floor;
  }
  stepAshore();mark();
 }
 function enterDeck(){
  const landing=berth();
  if(state().mode!=="walk"||!landing||distance(seaPoint(me),landing)>=(landing===studioDock?2.9:6))return;
  stepAboard({...boardingSpot,h:mainFloor});speed=0;
  relocate(deckToSea(ship,deck,now(),deck.h),90-ship.yaw/radians);nextPoll=0;
 }
 function leaveDeck(){
  if(!canDisembark())return;
  const landing=berth();
  stepAshore();relocate({x:landing.x+(landing===studioDock?1:-1),z:landing.z});
 }
 // Both piers meet the same port-side ramp. Change reference frames at its foot
 // while preserving the player's actual position and walking direction.
 function gangwayStep(from,to){
  const s=state(),onboard=s.mode==="deck";
  if(onboard&&(!deck||deck.h>mainFloor+.01))return null;
  if(!onboard&&(s.mode!=="walk"||!from||me.seat!=null||me.groundSit))return null;
  if(Math.abs(to.z-ship.z)>5||Math.abs(to.x-ship.x)>12)return null;
  const landing=berth();
  if(!landing||distance(to,landing)>4)return null;
  const atQuay=p=>landing===dock?onDock(p):studioFloor(p)===1.85;
  const time=now(),next=seaToDeck(ship,to,time,onboard?deck.h:mainFloor-exitGate.drop);
  const h=gangwayHeight(next);
  if(!onboard){
   if(h==null||!atQuay(from))return null;
   const previous=seaToDeck(ship,from,time,mainFloor-exitGate.drop);
   if(next.x<=previous.x||previous.x>exitGate.x||Math.abs(previous.z-exitGate.z)>exitGate.half)return null;
  }else if(h==null){
   if(gangwayHeight(deck)!=null&&deck.x<exitGate.x&&next.x<gangwayToe&&
      Math.abs(next.z-exitGate.z)<=exitGate.half-.22&&atQuay(to))return {mode:"walk"};
   return null;
  }
  return {mode:"deck",spot:{...next,h}};
 }
 function riderPose(s,time){
  const b=busAt(s.coach,time/1000);
  return busSeatPose({...coastPoint(b),heading:(540-b.yaw/radians)%360},s.chair??0);
 }
 function tick(dt,axis){
  const t=now(),s=state(),id=visit()?.id;if(!id)return;
  if(t>=nextPoll)void poll();
  if(deckWatch&&(s.mode!=="deck"||axis[0]||axis[1]||Math.abs(view().pan-deckWatch.pan)>.01||
     Math.abs(view().tilt-deckWatch.tilt)>.01||t>watchUntil&&showAge(t,boat.festival)<0))deckWatch=null;
  const helm=boat.helm===id&&s.mode==="deck";
  const followDt=lastSailingTime==null?dt:clamp((t-lastSailingTime)/1000,0,.5);
  lastSailingTime=t;
  if(!helm){
   if(boat.voyage){
    followVessel(ship,voyageAt(boat.voyage,t-followDt*1000),voyageAt(boat.voyage,t),followDt);
   }else if(boat.helm){
    const target=remoteVessel.at(t);
    if(target)followVessel(ship,remoteVessel.at(t-followDt*1000),target,followDt);
   }else if(ship.x!==boat.x||ship.z!==boat.z||ship.yaw!==boat.yaw||ship.speed){
    followVessel(ship,boat,boat,followDt);
   }
  }else{
   speed=clamp(speed-axis[1]*dt*5,-4,16);
   const yaw=turn(0,ship.yaw-axis[0]*dt*.68);
   const x=ship.x+Math.sin(yaw)*speed*dt,z=ship.z+Math.cos(yaw)*speed*dt;
   if(inSailingArea({x,z,yaw})){ship.x=x;ship.z=z;ship.yaw=yaw;}else speed=0;
   ship.speed=speed;
  }
  if(s.mode==="deck"){
   deck??=restoredDeckSpot({x:s.deckX,z:s.deckZ,h:s.floor})??{...boardingSpot,h:mainFloor};
   // Keep a returning passenger in place until we know where their ship is now.
   if(!ready)return;
   if(deck.x<boardingSpot.x&&gangwayHeight(deck)!=null&&!gangwayOpen()&&deckHeight(deck,deck.h)==null){
    stepAboard({...boardingSpot,h:mainFloor});mark();
   }
   if(helm){
    deck={...helmStation,h:7.85};
    const heading=(540-ship.yaw/radians)%360;
    if(!wasHelm){reset();Object.assign(view(),{pan:heading,tilt:0});}
    else view().pan=(view().pan+((heading-me.heading+540)%360)-180+360)%360;
   }
   const seat=cruiseSeatById.get(s.deckSeat);
   if(seat){
    const heading=cruiseSeatHeading(ship,seat);
    if(seatHeading!=null)view().pan=(view().pan+heading-seatHeading+720)%360;
    if(me.heading!==heading){me.heading=heading;mark();}
    seatHeading=heading;
   }
   if(!helm&&!seat&&deckYaw!=null){
    const rotate=-turn(deckYaw,ship.yaw)/radians;
    if(Math.abs(rotate)>.00001){me.heading=(me.heading+rotate+360)%360;view().pan=(view().pan+rotate+360)%360;mark();}
   }
   const prev=seaPoint(me),next=deckToSea(ship,deck,t,deck.h);
   if(distance(prev,next)>.001){Object.assign(me,coastPoint(next));mark();}
   if(helm)me.heading=(540-ship.yaw/radians)%360;
   s.floor=deck.h??deckHeight(deck)??mainFloor;
   s.deckX=deck.x;s.deckZ=deck.z;
   if(s.deckJumpY!=null&&t>me.jump&&deckJumpLift(me,t)===0){
    delete s.deckJumpY;me.jump=0;me.jumpOriginY=null;mark();
   }
   if(deckWatch)aimAtFireworks(next,s.floor);
  }else if(s.mode==="bus"){
   const pose=riderPose(s,t);
   if(busHeading!==null)view().pan=(view().pan+((pose.heading-busHeading+540)%360)-180+360)%360;
   busHeading=pose.heading;Object.assign(me,pose);mark();
  }else if(s.mode!=="table"&&s.mode!=="scooter"){
   const feet=worldJumpFeet(me,t),wet=swimWater(seaPoint(me));
   const overWater=wet&&feet!=null&&feet>(surfaceHeight?.(me)??-1);
   const mode=wet&&!overWater?(s.mode==="surf"?"surf":"swim"):"walk";
   if(mode!==s.mode){
    s.mode=mode;
    if(mode==="swim"){me.jump=0;me.jumpOriginY=me.vaultBase=null;delete s.beachJumpY;}
    mark();
   }
  }
  if(s.mode!=="bus")busHeading=null;
  if(s.mode!=="surf"&&(surfRide||s.surf)){surfRide=null;delete s.surf;mark();}
  deckYaw=s.mode==="deck"?ship.yaw:null;
  wasHelm=helm;
 }
 function startJump(){
  const s=state();
  if(s.mode==="deck"&&Number.isFinite(deck?.h))s.deckJumpY=deck.h;
  else delete s.deckJumpY;
  if(s.mode==="walk"&&s.track==null&&s.cafeFloor==null&&atPromenadeLip(seaPoint(me)))s.beachJumpY=walkDeckY;
  else delete s.beachJumpY;
 }
 function beachPassage(x,y){
  const s=state();
  return s.mode==="walk"&&beachDropStep(seaPoint(me),seaPoint({x,y}),s.beachJumpY!=null&&jumpLift(me,now())>0);
 }
 function deckStepHeight(next,time){
  const floor=deck?.h??state().floor??mainFloor,height=deckHeight(next,floor);
  const lift=deckJumpLift(me,time);
  if(deck&&sunDeckRailBlocks(deck,next,floor,floor+lift))return null;
  if(height!=null&&Math.abs(height-floor)<.49)return height;
  if(deck&&deckRimHeight(deck,floor)!=null&&deckRimHeight(next,floor)!=null)return floor;
  if(!deck||lift<=0)return null;
  if(floor<mainFloor&&gangwayOpen()&&gangwayHeight(deck)!=null&&gangwayHeight(next)==null&&next.x<exitGate.x)return offVessel;
  const landing=deckJumpSurface(deck,next,floor,floor+lift);
  if(landing===offVessel&&(!Number.isFinite(me.jumpOriginY)||next.x<0&&Math.abs(next.z-exitGate.z)<exitGate.half+.1&&!gangwayOpen()))return null;
  return landing;
 }
 function slideAlongRail(dx,dy,move){
  const mode=state().mode;
  let yaw;
  if(mode==="deck")yaw=ship.yaw;
  else if(mode==="scooter"&&(onPavilion(seaPoint(me))||onPavilion(seaPoint({x:me.x+dx,y:me.y+dy}))))yaw=pavilionYaw;
  else return false;
  const c=Math.cos(yaw),s=Math.sin(yaw);
  const across=dx*c-dy*s,along=dx*s+dy*c;
  const fore=[along*s,along*c],side=[across*c,-across*s];
  for(const [x,y] of Math.abs(along)>=Math.abs(across)?[fore,side]:[side,fore]){
   if(Math.abs(x)+Math.abs(y)>.0001&&move(me.x+x,me.y+y))return true;
  }
  return false;
 }
 function canStep(x,y,allowBeachLip=false,airFeet){
  const s=state();
  const cafe=cafeStep(seaPoint(me),seaPoint({x,y}),s.cafeFloor??cafeGround,airFeet);
  if(cafe!==undefined)return s.mode==="walk"&&cafe;
  if(s.mode!=="deck"&&!allowBeachLip&&!canCrossBeachEdge(seaPoint(me),seaPoint({x,y})))return false;
  if(s.mode==="scooter"&&!canScoot(seaPoint({x,y})))return false;
  if(s.mode==="table"||s.mode==="bus"||s.mode==="deck"&&(boat.helm===visit()?.id||s.deckSeat||seatPending()))return false;
  if(gangwayStep(seaPoint(me),seaPoint({x,y})))return true;
  if(s.mode!=="deck"){
    const studio=studioStep(seaPoint(me),seaPoint({x,y}),airFeet);
    if(studio!==undefined)return studio&&s.mode!=="scooter";
    const p=seaPoint({x,y}),atPier=pavilionStep(seaPoint(me),p,s.track,airFeet);
    if(atPier!==undefined)return atPier;
    const track=parkStep(p,s.track);
    if(Number.isFinite(s.track)&&track==null&&s.track>hillFloor(p)+.45){
     if(!Number.isFinite(airFeet)||airFeet<s.track+1.23)return false;
    }
    return true;
  }
  const time=now(),next=seaToDeck(ship,seaPoint({x,y}),time,deck?.h??s.floor??mainFloor);
  return deckStepHeight(next,time)!=null;
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
 function afterMove(leaderCoast,from,airFeet){
  const s=state(),p=seaPoint(me);
  const crossing=gangwayStep(from&&seaPoint(from),p);
  if(crossing){
   if(crossing.mode==="walk"){
    const time=now();jumpAshore(seaToDeck(ship,p,time,s.floor),time);
   }
   else{
    if(s.mode!=="deck")nextPoll=0;
    stepAboard(crossing.spot);
   }
   return;
  }
  const level=cafeLevel(p,leaderCoast?.cafeFloor??s.cafeFloor??cafeGround);
  if(level!=null)s.cafeFloor=level;else delete s.cafeFloor;
  if(s.mode==="deck"){
   const prev=deck?.h??s.floor??mainFloor,time=now(),next=seaToDeck(ship,p,time,prev);
   const height=deckStepHeight(next,time);
   if(height===offVessel){
    jumpAshore(next,time);return;
   }
   deck={...next,h:height??prev};
   Object.assign(s,{deckX:deck.x,deckZ:deck.z,floor:deck.h});
  }
  else {
   const h=pavilionFloor(p,s.track)??parkStep(p,s.track,airFeet);
   if(h!=null)s.track=h;else delete s.track;
   const rail=Number.isFinite(airFeet)?cafeRailHeight(p,s.cafeFloor)??pavilionRailHeight(p,s.track)??stationRailHeight(p):null;
   if(rail!=null&&airFeet>=rail-.015)s.railY=rail;else delete s.railY;
  }
 }
 function menu(){
  const p=seaPoint(me),s=state(),v=visit(),t=now();actions=new Map();let hint="";
  if(!v)return {actions,hint};
  const add=(id,label,run,marker,target)=>actions.set(id,{label,run,marker,target});
  const studio=studioInteraction(p,s.mode);
  if(studio&&me.seat==null&&!me.groundSit)add(studio.id,studio.label,()=>{
   const action=studioInteraction(seaPoint(me),state().mode);
   if(action?.id!==studio.id)return;
   if(action.destination){
    state().mode=action.mode;me.jump=0;me.vaultBase=null;
    relocate(action.destination,action.heading);Object.assign(view(),{pan:action.heading,tilt:0});
   }else openMonitor?.();
  },studio.marker);
  if(s.mode==="walk"&&inCafeBounds(p)&&(me.seat!=null||distance(p,cafeCounter)<2.6&&s.cafeFloor<cafeGround+.45)){
   add("cafeCoffee","커피 주문하기",()=>receiveFood("coffee"),me.seat==null&&canReceiveFood()?{...cafeCounter,h:cafeGround}:null);
  }
  const sailing=s.mode==="deck";
  const nearbyBay=Math.abs(p.x-shore(p.z))<720&&p.z>-1000&&p.z<360;
  const hub=nearScooterHub(p),parked=s.scooter?.parked,beside=parked&&distance(parked,p)<2.8&&onScooterLevel(p,s.track);
  if(s.mode==="walk"&&me.seat==null&&!me.groundSit){
   const changing=nearbyAmenity(p,"changing"),footwash=nearbyAmenity(p,"rinse");
   if(changing)add("changing","탈의실 · 옷 갈아입기",()=>{
    reset();changingRoom(s.swimwear,id=>{
     if(state().mode!=="walk"||nearbyAmenity(seaPoint(me),"changing")!==changing)return;
     if(id)s.swimwear=id;else delete s.swimwear;mark();
    });
   },changing.entry);
   if(footwash&&(!s.rinse||t-s.rinse.at>=rinseDuration))add("rinse","발 씻기",()=>{
    if(nearbyAmenity(seaPoint(me),"rinse")!==footwash)return;
    relocate(footwash.entry,(270-footwash.yaw/radians+360)%360);s.rinse={site:footwash.id,at:now()};mark();
   },{...footwash.entry,h:1.99});
   if(!s.scooter&&hub)add("scooter","전동 킥보드 빌리기",()=>command("rentScooter"),hub);
   if(beside)add("parkScooter","킥보드 다시 타기",()=>command("mountScooter"),parked);
   if(beside&&hub)add("scooter","킥보드 반납하기",()=>command("returnScooter"),hub);
  }
  if(s.mode==="scooter"){
   add("parkScooter","킥보드에서 내리기",()=>command("parkScooter"));
   if(hub)add("scooter","킥보드 반납하기",()=>command("returnScooter"),hub);
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
   if(boat.helm===v.id){
    hint="앞뒤로 속도 조절 · 좌우로 조타";
    add("release","조타 놓기",()=>command("release"));
    if(Math.abs(ship.speed??0)<.45&&[mooring,studioMooring].some(q=>distance(ship,q)<10))add("moor","정박하기",()=>command("moor"));
    else add("return","자동 귀항",()=>command("returnTrip"));
   }else if(s.deckSeat){
    hint=cruiseSeatById.get(s.deckSeat)?.name??"크루즈 좌석";
    add("deckStand","일어나기",()=>command("deckStand"));
   }else if(deckJumpLift(me,t)===0){
    if(deck&&!seatPending()){
     const nearby=cruiseSeats.filter(seat=>cruiseSeatInReach(seat,deck.x,deck.z,deck.h)&&!deckSeats.some(row=>row.seat===seat.id));
     nearby.sort((a,b)=>distance(deck,a.approach)-distance(deck,b.approach));
     const seat=nearby[0];
     if(seat)add("deckSit","앉기",()=>{
      if(cruiseSeatInReach(seat,deck?.x,deck?.z,deck?.h))command("deckSit",{seat:seat.id});
     },deckMarker(seat.approach,seat.floor),seat.id);
    }
    if(canStartTour())add("tour","자동 유람",()=>{if(canStartTour())command("tour");},deckMarker(helmStation,7.85));
    if(deck&&Math.abs((deck.h??s.floor)-5.46)<.4&&distance(deck,serviceSpot)<2.0){
     const counter=canReceiveFood()?deckMarker(serviceSpot,5.46):null;
     add("wine","와인 받기",()=>receiveFood("wine"),counter);
     add("cheese","치즈 받기",()=>receiveFood("cheese"),counter);
    }
    if(!boat.helm&&nearHelm(deck))add("helm","조타 맡기",()=>{if(nearHelm(deck))command("helm");},deckMarker(helmStation,7.85));
    if(canDisembark())add("disembark","내리기",leaveDeck,deckMarker(boardingSpot,mainFloor));
   }
  }else if(s.mode==="table"&&tableSeat!=null){
   const table=Math.floor(tableSeat/4),order=orders.find(o=>o.spot===table);
   const takingOrder=order?.phase==="ordering"&&!order.summary;
   const orderFood=()=>chooseOrder(items=>{
    if(state().mode==="table"&&tableSeat!=null&&Math.floor(tableSeat/4)===table)command("orderTavern",{table,items,called:order.called});
   });
   add("bell","벨 누르기",()=>{
    if(!order||order.phase==="served")command("callTavern",{table,called:order?.called??0});
    else if(takingOrder)orderFood();
    else if(order.phase==="called")notice("점원 · 네, 지금 갈게요!");
    else if(order.phase==="cooking"&&now()>=order.ready)notice("점원 · 주문하신 음식 나갑니다!");
    else notice("점원 · 주문하신 음식 준비하고 있어요.");
   });
   if(order?.phase==="called")hint="점원이 오고 있어요.";
   if(takingOrder)add("order","음식 주문하기",orderFood);
   if(order?.phase==="cooking")hint=t<order.ready?"주방에서 주문을 준비하고 있어요.":"점원이 음식을 가져오고 있어요.";
   const tasting=pending.some(c=>c.action==="taste")||!!s.tasting&&t-s.tasting.at<1450;
   for(const [id,kind,label] of [["drink","soju","소주 한 잔"],["fish","sashimi","회 먹기"],["clam","grilledClam","구운 조개 먹기"]]){
    if(order?.[kind]>0&&!tasting)add(id,label+" · "+order[kind],()=>command("taste",{table,kind,token:crypto.randomUUID()}));
   }
   if(order?.rawClams>0&&!order.cookingClams)add("grill","조개 굽기",()=>command("tavernGrill",{table}));
   if(order?.cookingClams)hint="조개 굽는 중 · "+Math.max(0,Math.ceil((order.grillUntil-t)/1000))+"초";
   const reply=tavernReply(order,t);
   if(reply)hint="점원 · "+reply;
   add("stand","일어나기",()=>command("stand"));
  }else{
   const platforms=s.mode==="walk"?harborStops.filter(h=>distance(h,p)<5.8).sort((a,b)=>distance(a,p)-distance(b,p)):[];
   const messages=[];
   for(const h of platforms){
    const next=arrivalsAt(h.id,t/1000)[0];if(!next)continue;
    const b=busAt(next.index,t/1000),line=busLine(next.index);
    if(b.stop===h.id){
     messages.push(line.name+" · 출발까지 "+b.left+"초");
     add(line.id==="city"?"cityBus":"bus",line.name+" 타기 · "+h.direction,()=>chooseSeat(next.index,h.id),{...h,label:"버스 타기"});
    }else messages.push(line.name+" · "+h.direction+" "+Math.ceil(next.seconds)+"초 후 도착");
   }
   hint=messages.join(" / ");
   if(s.mode==="walk"&&distance(p,platformDoor)<3)add("train","열차 타기",chooseTrainDestination,platformDoor);
   if(distance(p,boardRack)<5&&!me.bag?.some(item=>item.kind==="surfboard"))add("board",s.board?"서핑보드 반납":"서핑보드 빌리기",()=>{
    s.board=!s.board;
    if(s.board)notice("해변으로 내려가 노란 부표 사이에서 파도를 타 보세요.");
    mark();
   },rackMarker);
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
   const landing=berth();
   if(s.mode==="walk"&&landing&&distance(p,landing)<(landing===studioDock?2.9:6))
    add("embark","크루즈 타기",enterDeck,landing===studioDock?{x:landing.x+.6,z:landing.z,h:1.85}:pierMarker);
   if(ready&&s.mode==="walk"){
    const chair=nearestTavernSeat(p,occupiedStools);
    if(chair){
     const center=tables[chair.table],spot=chair.spot,d=distance(spot,center);
     const marker={x:spot.x+.39*(spot.x-center.x)/d,z:spot.z+.39*(spot.z-center.z)/d};
     add("table","앉기",()=>command("sit",{table:chair.table,seat:chair.seat}),marker,chair.id);
    }
   }
  }
  const age=showAge(t,boat.festival);
  if(age<0?canLaunchFireworks(p):sailing||(nearbyBay||inPark(p))&&s.mode!=="bus"){
   add("festival",age<0?"불꽃놀이 시작":"불꽃 바라보기",()=>{
    const current=seaPoint(me);
    if(age<0&&!canLaunchFireworks(current))return;
    deckWatch=state().mode==="deck"?{}:null;
    aimAtFireworks(current,s.track??(inPark(current)?hillFloor(current):s.floor??1.85));
    watchUntil=t+4500;if(age<0)command("festival");
   },age<0&&!sailing?festivalBooth:null);
  }
  return {actions,hint};
 }
 function locked(){
  const s=state();
  return ["bus","table"].includes(s.mode)||s.mode==="deck"&&Boolean(boat.helm===visit()?.id||s.deckSeat||seatPending());
 }
 function canJumpHere(){
  const mode=state().mode;
  return mode==="deck"?!locked():mode==="walk"&&!swimWater(seaPoint(me));
 }
 return {ship,boat,menu,tableChat,tick,startJump,canJumpHere,beachPassage,canStep,afterMove,rideBoard,riderPose,gangwayOpen,selectSeat:(coach,seat,stop)=>command("board",{coach,seat,stop}),
  seatMap:(coach)=>({line:busLine(coach),bus:busAt(coach,now()/1000),occupied:riders.filter(row=>row.coach===coach).map(r=>r.seat)}),trigger:id=>actions.get(id)?.run(),get grills(){return grills;},get tavernOrders(){return orders;},
  swimmingSpeed:fast=>{
   const mode=state().mode;
   return (mode==="swim"||mode==="walk"&&!Number.isFinite(me.jumpOriginY))&&swimWater(seaPoint(me))?swimSpeed(fast):null;
  },
  locked,
  slideAlongRail,
  atSea:()=>["scooter","deck","bus","table"].includes(state().mode),
  deckCheckpoint:()=>state().mode==="deck"?(restoredDeckSpot(deck)??{...boardingSpot,h:mainFloor}):null,
  get harborReady(){return ready;},
  watchLift:()=>deckWatch?Math.max(0,11.6-(state().floor??mainFloor)):
    state().mode!=="deck"&&now()<watchUntil&&distance(seaPoint(me),dock)<11?8.2:0,
  async leaveStation(){
    const v=visit();if(!v)return;
    await inFlight;
    const result=await request("/api/room",{room:v.room,id:v.id,key:v.key,coast:{action:"leave"}});
    if(!result.ok)throw Error("train");
  },stop(){disposed=true;},clock};
}
