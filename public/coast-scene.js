import {buildCoastScooters,scooterGround} from "./coast-scooter-model.js";
import {scooterFit} from "./coast-scooter-fit.js";
import * as T from "three";
import {buildTavernService} from "./coast-tavern-model.js";
import {buildCoastStudio} from "./coast-studio-model.js";
import {studioInRoom,studioWall,studioDoor,studioStorm} from "./coast-studio-layout.js";
import {tavernStoolTop,tavernDiningPlate} from "./coast-tavern-layout.js";
import {beachBenches} from "./coast-beach-seats.js";
import {cafeBenches,cafeLevel,pickCafe} from "./coast-cafe.js";
import {breaststroke,swimSeed,swimStroke} from "./beach-swimming.js";
import {surferPose,boardAttitude} from "./coast-surfing.js";
import {hullAttitude,deckToSea,seaToDeck,deckHeight,gangwayHeight,exitGate,cruiseScale,mainFloor,salonBowDoor,salonSideHalfWidth,inSalonPortDoor} from "./coast-vessel-layout.js";
import {cruiseSeatById,cruiseSeatHeading,cruiseSeatSpot} from "./coast-vessel-seats.js";
export {default as residentStreets} from "./pohang-resident-streets.js";
import cruiseStreets from "./cruise-resident-streets.js";
import {createResidentLife} from "./resident-life.js";
import {surfSample} from "./pohang-surf-waves.js";
export function residentActivity(p,person,clock,a,b){
 if(p.coast)return;
 const local=seaPoint(p);
 if(!inWater(local)){
  if(person.board&&!p.coast&&Math.abs(local.x-shore(local.z))<55&&local.z>-160&&local.z<130&&p.stepping)
   p.coast={mode:"walk",board:true};
  return;
 }
 const surf=person.board&&(a[4]==="surf"||b[4]==="surf");
 const wave=surfSample(local.x,local.z,clock/1000%14400);
 p.groundSit=false;delete p.gesture;
 p.coast={mode:surf?"surf":"swim",swimwear:person.seed%2?"coral":"tide",board:surf};
 if(surf)p.coast.surf={rise:p.stepping?Math.min(1,.35+wave.drive):0,speed:p.stepping?3.3:0,bank:wave.dz*.5};
}
export {coastVisitors} from "./coast-visitors.js";
import {coastObstacle} from "./coast-region.js";
import {pickSpaceWalk} from "./space-walk-navigation.js";
import {pavilionFloor,pickPavilion} from "./pohang-pavilion-layout.js";
import {coastPoint,seaPoint} from "./region-coordinates.js";
import {shore,ground,onDock,inWater,wave,showAge,busAt,busCount,clamp} from "./pohang-layout.js";
import {buildCoast,cruiseModel} from "./pohang-scenery.js";
import {carrySurfboard,surfboard} from "./pohang-surfboard.js";
import {ocean,skyDome,oceanSurface as waterAt} from "./pohang-water.js";
import {createWake} from "./coast-wake.js";
import {coastalGulls} from "./coast-gulls.js";
import {buildSurfBuoys} from "./coast-surf-buoys.js";
import {buildSurfSpray} from "./coast-surf-spray.js";
import {buildCoastActionMarker} from "./coast-action-marker.js";
import {fireworks} from "./pohang-festival.js";
import {buildHarborStreet,harborBusRoute} from "./coast-streets.js";
import {buildSejongBusModels} from "./sejong-bus-model.js";
import {buildSpaceWalk} from "./space-walk-model.js";
import {parkFloor} from "./space-walk-layout.js";

export function createCoastScene(root,play,walkers,kit){
 const updateScooters=buildCoastScooters(root);
 const lights=buildCoast(root),water=ocean(root),sky=skyDome(root),show=fireworks(root,water);
 const updateWake=createWake(root);
 const updateGulls=coastalGulls(root);
 const updateSurfBuoys=buildSurfBuoys(root);
 const updateSurfSpray=buildSurfSpray(root,waterline);
 buildHarborStreet(root);const parkLights=buildSpaceWalk(root);
 const ship=cruiseModel();ship.scale.set(cruiseScale,1,cruiseScale);root.add(ship);
 const updateActionMarker=buildCoastActionMarker(root,ship,p=>surface(coastPoint(p)));
 const buses=buildSejongBusModels(T,root,kit,walkers,()=>1.85,()=>1.85,harborBusRoute);
 const updateTavern=buildTavernService(root,walkers,kit);
 const updateStudio=buildCoastStudio(root);
 const boards=new Map(),ripples=new Map(),ringGeometry=new T.RingGeometry(.76,.79,36).rotateX(-Math.PI/2);
 const swimmerHead=new T.Vector3();
 const hullEuler=new T.Euler(0,0,0,"YXZ"),seatTurn=new T.Quaternion(),up=new T.Vector3(0,1,0);
 function swimmingWake(player,p,t,stroke){
  let rings=ripples.get(player.id);
  if(!rings){
   rings=[0,1].map(()=>{const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xd9f4ed,transparent:true,depthWrite:false}));mesh.renderOrder=2;root.add(mesh);return mesh;});
   ripples.set(player.id,rings);
  }
  rings.forEach((ring,i)=>{
   const phase=(stroke.phase+i*.5)%1;
   ring.visible=true;ring.position.set(p.x,waterAt(p.x,p.z,t)+.032,p.z);
   ring.scale.setScalar(.30+.92*phase);ring.material.opacity=.30*(1-phase);
  });
 }
 let lastClock=Date.now(),deckViewer=null,orbitShip=false,cafeViewerFloor;
 let studioViewer={x:0,z:0};
 function setClock(clock){lastClock=clock;}
 function waterline(x,z){return waterAt(x,z,lastClock/1000%14400);}
 function vesselFloor(p,h){
  if(h<=mainFloor+.01){
   const ramp=gangwayHeight(p);if(ramp!=null&&play.gangwayOpen())return ramp;
  }
  return deckHeight(p,h);
 }
 function pickDeck({origin:o,direction:d}){
  if(!deckViewer)return null;
  let above=true;
  for(let distance=.2;distance<72;distance+=.22){
   const p={x:o.x+d.x*distance,z:o.z+d.z*distance};
   if(Math.hypot(p.x-play.ship.x,p.z-play.ship.z)>31)continue;
   const local=seaToDeck(play.ship,p,lastClock,deckViewer.floor),h=vesselFloor(local,deckViewer.floor);
   if(h==null)continue;
   const level=deckToSea(play.ship,local,lastClock,h).h,y=o.y+d.y*distance;
   if(above&&y<=level+.035)return {distance,point:coastPoint(p)};
   above=y>level;
  }
  return null;
 }
 function cameraBlocked(point,height){
  const p=seaPoint(point);
  if(studioInRoom(studioViewer)){
   if(height<studioDoor.h+.08||height>studioDoor.h+2.73||!studioInRoom(p))return true;
  }else if(Math.abs(p.z-studioWall.z)<studioWall.half&&Math.abs(p.x-studioWall.x)<.24&&height<studioWall.height)return true;
  // An upward-looking third-person camera can swing into the rising sand behind the walker.
  if(!deckViewer)return (height<2.25&&height<ground(p)+.22)||coastObstacle(p,height);
  if(orbitShip)return false;
  const {deckX,deckZ,floor}=deckViewer;
  const bridgeRoom=floor>7.7&&deckZ>2.9&&Math.abs(deckX)<2.4;
  const salon=floor<2.55&&deckZ> -7.82&&deckZ<salonBowDoor.z&&Math.abs(deckX)<salonSideHalfWidth(deckZ);
  if(!bridgeRoom&&!salon)return false;
  const local=seaToDeck(play.ship,p,lastClock,floor);
  const localFloor=deckToSea(play.ship,local,lastClock,floor).h;
  if(bridgeRoom)return height-localFloor>2.06||Math.abs(local.x)>2.40||local.z>8.46||(local.z<2.85&&Math.abs(local.x)>.66);
  const x=Math.abs(local.x);
  if(Math.abs(local.z-salonBowDoor.z)<.20&&x>salonBowDoor.half-.12)return true;
  if(Math.abs(local.z+7.82)<.20&&x>.64)return true;
  if(local.z< -7.82||local.z>salonBowDoor.z)return false;
  const half=salonSideHalfWidth(local.z);
  if(x<=half&&height-localFloor>2.37)return true;
  return Math.abs(x-half)<.16&&(!inSalonPortDoor(local,.13)||height-localFloor>2.27);
 }
 function cruiseSeatPose(id){
  const seat=cruiseSeatById.get(id);
  if(!seat)return null;
  const top=deckToSea(play.ship,cruiseSeatSpot(seat),lastClock,seat.floor+seat.seatHeight);
  return {...coastPoint(top),top:top.h,heading:cruiseSeatHeading(play.ship,seat)};
 }
 function surface(p){
  const local=seaPoint(p),s=p.coast,t=lastClock/1000%14400;
  if(s?.mode==="walk"&&Number.isFinite(s.railY))return s.railY;
  if(s?.mode==="scooter")return scooterGround(local)+scooterFit.deckTop;
  const cafe=cafeLevel(local,s?.cafeFloor);if(cafe!=null)return cafe;
  if(s?.mode==="deck"){
   const spot=Number.isFinite(s.deckX)&&Number.isFinite(s.deckZ)?{x:s.deckX,z:s.deckZ}:seaToDeck(play.ship,local,lastClock,s.floor);
   return deckToSea(play.ship,spot,lastClock,clamp(s.floor??deckHeight(spot)??mainFloor,mainFloor-exitGate.drop,7.85)).h;
  }
  if(s?.mode==="bus")return 3.12;
  const pierLevel=pavilionFloor(local,s?.track);if(pierLevel!=null)return pierLevel;
  const park=parkFloor(local,p.coast?.track);if(park!=null)return park;
  if(onDock(local))return 1.85;
  if(inWater(local))return waterAt(local.x,local.z,t)+(s?.mode==="surf"?.14:-1.035);
  return ground(local);
 }
 function update(state,night,camera,height,reducedDetail=false,locals=[]){
  const viewer=state.monitorFocus??state.me,t=lastClock/1000%14400,b=play.ship,p=seaPoint(viewer);
  const id=state.me.id,attitude=hullAttitude(b,lastClock);
  deckViewer=state.me.coast?.mode==="deck"?state.me.coast:null;orbitShip=Boolean(deckViewer&&play.boat.helm===id);
  cafeViewerFloor=state.me.coast?.cafeFloor;
  ship.position.set(b.x,attitude.heave,b.z);ship.rotation.set(attitude.pitch,b.yaw,attitude.roll,"YXZ");
  ship.userData.setGangwayOpen(play.gangwayOpen());
  ship.userData.updateDetail(camera);
  updateActionMarker(state.photoCapture?null:state.coastMarker,camera);
  buses.update(lastClock,viewer);
  const players=[state.me,...state.peers];
  updateScooters(players);
  sky.sky.position.copy(camera.position);sky.uniforms.night.value=night;
  sky.uniforms.storm.value=water.storm.value=studioStorm(p);sky.uniforms.clock.value=t;
  lights(night,players,lastClock,camera);parkLights(night);water.night.value=night;water.uTime.value=t;
  water.reducedDetail.value=reducedDetail;
  water.updateVisibility(camera);
  updateSurfBuoys(t,p);
  updateSurfSpray(players.concat(locals),p,t,night,height);
  updateWake(b,lastClock,night,water);
  updateGulls(lastClock,p,b,camera.position);
  show.update(showAge(lastClock,play.boat.festival),p,t,height);
  const diners=players.concat(locals),orders=[...(play.tavernOrders??[])];
  for(const visitor of locals){
   if(visitor.coast?.mode!=="table")continue;
   const spot=Math.floor(visitor.coast.seat/4);
   if(!orders.some(o=>o.spot===spot)&&!players.some(person=>person.coast?.mode==="table"&&Math.floor(person.coast.seat/4)===spot))
   {
    const called=visitor.orderAt,age=lastClock-called,ordered=called+4000,ready=called+6500,served=called+9000;
    const phase=age<2600?"called":age<4000?"ordering":age<9000?"cooking":"served";
    orders.push({spot,phase,called,ordered,ready,served,sashimi:age>=9000?4:0,soju:age>=9000?3:0,summary:"회 한 접시와 소주 한 병"});
   }
  }
  updateTavern(lastClock,orders,p,diners);
  studioViewer=p;updateStudio(p,players,night);
  const visible=new Set([id,...state.peers.map(p=>p.id),...locals.map(p=>p.id)]);
  for(const [key,rings] of ripples)if(!visible.has(key)){for(const ring of rings){ring.removeFromParent();ring.material.dispose();}ripples.delete(key);}
  for(const [key,board] of boards)if(!visible.has(key)){board.removeFromParent();boards.delete(key);}
 }
 function pose(player,model){
  const s=player.coast,wet=s?.mode==="swim",surf=s?.mode==="surf",t=lastClock/1000%14400,p=seaPoint(player);
  if(s?.mode==="deck"&&Number.isFinite(s.deckX)&&Number.isFinite(s.deckZ)){
   const seat=cruiseSeatById.get(s.deckSeat),local={x:s.deckX,z:s.deckZ},height=vesselFloor(local,s.floor);
   if(seat){
    const attitude=hullAttitude(play.ship,lastClock);
    hullEuler.set(attitude.pitch,play.ship.yaw,attitude.roll,"YXZ");
    model.group.quaternion.setFromEuler(hullEuler).multiply(seatTurn.setFromAxisAngle(up,seat.yaw));
   }else if(height!=null){
    const world=deckToSea(play.ship,local,lastClock,height),attitude=hullAttitude(play.ship,lastClock);
    if(player.id===play.boat.helm)model.group.rotation.y=play.ship.yaw;
    const relative=model.group.rotation.y-play.ship.yaw;
    model.group.position.x=world.x;model.group.position.z=world.z;
    model.group.position.y+=world.h-model.floorY;
    model.group.rotation.x=attitude.pitch*Math.cos(relative)-attitude.roll*Math.sin(relative);
    model.group.rotation.z=attitude.roll*Math.cos(relative)+attitude.pitch*Math.sin(relative);
   }
  }else{model.group.rotation.x=0;model.group.rotation.z=0;}
  if(wet||surf)model.shadow.visible=false;
  const stroke=wet?swimStroke(lastClock/1000,player.stepping,swimSeed(player),player.running,model.swimStroke):null;
  model.swimStroke=stroke;
  if(wet)swimmingWake(player,p,t,stroke);else for(const ring of ripples.get(player.id)??[])ring.visible=false;
  if(wet){
   breaststroke(model,stroke);
   // Sample the actual wave under the moving face: the prone head can be almost a metre
   // ahead of the avatar origin. Keep the mouth clear on the inhale and near the surface in glide.
   model.face.getWorldPosition(swimmerHead);
   const waterline=waterAt(swimmerHead.x,swimmerHead.z,t),clearance=stroke.idle?.242:.136+.149*stroke.breath;
   model.group.position.y+=waterline+clearance-swimmerHead.y;
   if(model.label)model.label.position.y=waterline+.92-model.group.position.y;
  }else if(surf)surferPose(model,s.surf,t);
  else{
   model.body.position.z=0;model.body.rotation.set(0,0,model.body.rotation.z,'XYZ');
  }
  let board=boards.get(player.id);
  if(!s?.board){if(board)board.visible=false;return;}
  if(!board){board=surfboard();boards.set(player.id,board);}
  board.visible=Boolean(model.surfboardCarrySide||wet||surf);
  if(!board.visible)return;
  if(model.surfboardCarrySide)carrySurfboard(board,model);
  else{
   if(board.parent!==root){root.add(board);board.scale.setScalar(1);}
   const a=Math.PI-player.heading*Math.PI/180;
   const beside=wet?.70:0;
   const center={x:p.x+beside*Math.cos(a),z:p.z-beside*Math.sin(a)};
   const attitude=boardAttitude(center,a,t,waterAt,surf?s.surf?.bank:0);
   board.position.set(center.x,attitude.height,center.z);
   board.rotation.set(attitude.pitch,a,attitude.roll,'YXZ');
   if(surf){
    model.group.position.copy(board.position);model.group.position.y+=.052;
    model.group.rotation.copy(board.rotation);
   }
  }
 }
 let passengerLife,passengerRoom;
 function passengers(clock,anchor,players,room,limit){
  const sea=seaPoint(anchor);
  if(Math.hypot(sea.x-play.ship.x,sea.z-play.ship.z)>72)return [];
  if(!passengerLife||passengerRoom!==room){passengerRoom=room;passengerLife=createResidentLife(cruiseStreets,room,"cruise");}
  const local=seaToDeck(play.ship,sea,clock,mainFloor);
  const taken=new Set(players.map(p=>p.coast?.deckSeat).filter(Boolean));
  return passengerLife.visible(clock,{x:local.x,y:local.z},null,[],limit,()=>null).map(p=>{
   let point={x:p.x,z:p.y},heading=p.heading-play.ship.yaw*180/Math.PI;
   const seat=cruiseSeatById.get(p.deckSeat);
   const seated=seat&&!taken.has(seat.id);
   if(seated){taken.add(seat.id);point=cruiseSeatSpot(seat);heading=cruiseSeatHeading(play.ship,seat);}
   return {...p,...coastPoint(deckToSea(play.ship,point,clock,mainFloor)),heading,groundSit:false,
    coast:{mode:"deck",deckX:point.x,deckZ:point.z,floor:mainFloor,deckSeat:seated?seat.id:undefined}};
  });
 }
 function hideBoard(id){
  const board=boards.get(id);
  if(board)board.visible=false;
 }
 return {benches:[...beachBenches,...cafeBenches],stormAt:p=>studioStorm(seaPoint(p)),tavernStoolTop,tavernDiningPlate,cruiseSeatPose,passengers,setClock,waterline,surface,pose,hideBoard,update,pickTrack:ray=>pickDeck(ray)??pickCafe(ray,cafeViewerFloor)??pickSpaceWalk(ray)??pickPavilion(ray),cameraBlocked,watchLift:play.watchLift};
}
