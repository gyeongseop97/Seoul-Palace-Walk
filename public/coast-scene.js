import {buildCoastScooters,scooterPose} from "./coast-scooter-model.js";
import * as T from "three";
import {buildTavernService} from "./coast-tavern-model.js";
import {tavernStoolTop} from "./coast-tavern-layout.js";
import {beachBenches} from "./coast-beach-seats.js";
import {cafeBenches,cafeLevel,pickCafe} from "./coast-cafe.js";
import {breaststroke,swimSeed,swimStroke} from "./beach-swimming.js";
import {surferPose,boardAttitude} from "./coast-surfing.js";
import {hullAttitude,deckToSea,seaToDeck,deckHeight,cruiseScale,mainFloor} from "./coast-vessel-layout.js";
export {coastVisitors} from "./coast-visitors.js";
import {coastObstacle} from "./coast-region.js";
import {pickSpaceWalk} from "./space-walk-navigation.js";
import {pavilionFloor,pickPavilion} from "./pohang-pavilion-layout.js";
import {coastPoint,seaPoint} from "./region-coordinates.js";
import {shore,ground,onDock,inWater,wave,showAge,busAt,busCount,clamp} from "./pohang-layout.js";
import {buildCoast,cruiseModel,surfboard} from "./pohang-scenery.js";
import {ocean,skyDome,oceanSurface as waterAt} from "./pohang-water.js";
import {createWake} from "./coast-wake.js";
import {coastalGulls} from "./coast-gulls.js";
import {buildSurfBuoys} from "./coast-surf-buoys.js";
import {buildSurfSpray} from "./coast-surf-spray.js";
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
 const buses=buildSejongBusModels(T,root,kit,walkers,()=>1.85,()=>1.85,harborBusRoute);
 const updateTavern=buildTavernService(root,walkers,kit);
 const boards=new Map(),ripples=new Map(),ringGeometry=new T.RingGeometry(.76,.79,36).rotateX(-Math.PI/2);
 const swimmerHead=new T.Vector3();
 function swimmingWake(player,p,t){
  let rings=ripples.get(player.id);
  if(!rings){
   rings=[0,1].map(()=>{const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xd9f4ed,transparent:true,depthWrite:false}));mesh.renderOrder=2;root.add(mesh);return mesh;});
   ripples.set(player.id,rings);
  }
  rings.forEach((ring,i)=>{
   const phase=(t*(player.stepping?.89:.43)+i*.5)%1;
   ring.visible=true;ring.position.set(p.x,waterAt(p.x,p.z,t)+.032,p.z);
   ring.scale.setScalar(.30+.92*phase);ring.material.opacity=.30*(1-phase);
  });
 }
 let lastClock=Date.now(),deckViewer=null,orbitShip=false,cafeViewerFloor;
 function setClock(clock){lastClock=clock;}
 function waterline(x,z){return waterAt(x,z,lastClock/1000%14400);}
 function pickDeck({origin:o,direction:d}){
  if(!deckViewer)return null;
  let above=true;
  for(let distance=.2;distance<72;distance+=.22){
   const p={x:o.x+d.x*distance,z:o.z+d.z*distance};
   if(Math.hypot(p.x-play.ship.x,p.z-play.ship.z)>31)continue;
   const local=seaToDeck(play.ship,p,lastClock,deckViewer.floor),h=deckHeight(local,deckViewer.floor);
   if(h==null)continue;
   const level=deckToSea(play.ship,local,lastClock,h).h,y=o.y+d.y*distance;
   if(above&&y<=level+.035)return {distance,point:coastPoint(p)};
   above=y>level;
  }
  return null;
 }
 function cameraBlocked(point,height){
  const p=seaPoint(point);
  if(!deckViewer)return coastObstacle(p,height);
  if(orbitShip)return false;
  const {deckX,deckZ,floor}=deckViewer;
  const bridgeRoom=floor>7.7&&deckZ>2.9&&Math.abs(deckX)<2.4;
  const salon=floor<2.55&&deckZ> -7.65&&deckZ<9.65&&Math.abs(deckX)<3.65;
  if(!bridgeRoom&&!salon)return false;
  const local=seaToDeck(play.ship,p,lastClock,floor);
  const localFloor=deckToSea(play.ship,local,lastClock,floor).h;
  return height-localFloor>(bridgeRoom?2.06:2.37)||Math.abs(local.x)>(bridgeRoom?2.40:3.70)||
   local.z>(bridgeRoom?8.46:9.66)||(local.z<(bridgeRoom?2.85:-7.67)&&Math.abs(local.x)>.66);
 }
 function surface(p){
  const local=seaPoint(p),s=p.coast,t=lastClock/1000%14400;
  const cafe=cafeLevel(local,s?.cafeFloor);if(cafe!=null)return cafe;
  if(s?.mode==="deck"){
   const spot=Number.isFinite(s.deckX)&&Number.isFinite(s.deckZ)?{x:s.deckX,z:s.deckZ}:seaToDeck(play.ship,local,lastClock,s.floor);
   return deckToSea(play.ship,spot,lastClock,clamp(s.floor??deckHeight(spot)??mainFloor,mainFloor,7.85)).h;
  }
  if(s?.mode==="bus")return 3.12;
  if(s?.mode==="scooter")return (parkFloor(local)??ground(local))+.229;
  const pierLevel=pavilionFloor(local,s?.track);if(pierLevel!=null)return pierLevel;
  const park=parkFloor(local,p.coast?.track);if(park!=null)return park;
  if(onDock(local))return 1.85;
  if(inWater(local))return waterAt(local.x,local.z,t)+(s?.mode==="surf"?.14:-1.035);
  return ground(local);
 }
 function update(state,night,camera,height){
  const t=lastClock/1000%14400,b=play.ship,p=seaPoint(state.me);
  const id=state.me.id,attitude=hullAttitude(b,lastClock);
  deckViewer=state.me.coast?.mode==="deck"?state.me.coast:null;orbitShip=Boolean(deckViewer&&play.boat.helm===id);
  cafeViewerFloor=state.me.coast?.cafeFloor;
  ship.position.set(b.x,attitude.heave,b.z);ship.rotation.set(attitude.pitch,b.yaw,attitude.roll,"YXZ");
  buses.update(lastClock,state.me);
  const players=[state.me,...state.peers];
  updateScooters(players,p);
  sky.sky.position.copy(camera.position);sky.uniforms.night.value=night;
  lights(night,players,lastClock);parkLights(night);water.night.value=night;water.uTime.value=t;
  updateSurfBuoys(t,p);
  updateSurfSpray(players,p,t,night,height);
  updateWake(b,lastClock,night,water);
  updateGulls(lastClock,p,b,camera.position);
  show.update(showAge(lastClock,play.boat.festival),p,t,height);
  updateTavern(lastClock,play.tavernOrders,p);
  const visible=new Set([id,...state.peers.map(p=>p.id)]);
  for(const [key,rings] of ripples)if(!visible.has(key)){for(const ring of rings){ring.removeFromParent();ring.material.dispose();}ripples.delete(key);}
  for(const [key,board] of boards)if(!visible.has(key)){board.removeFromParent();boards.delete(key);}
 }
 function pose(player,model){
  const s=player.coast,wet=s?.mode==="swim",surf=s?.mode==="surf",t=lastClock/1000%14400,p=seaPoint(player);
  if(s?.mode==="deck"&&Number.isFinite(s.deckX)&&Number.isFinite(s.deckZ)){
   const local={x:s.deckX,z:s.deckZ},height=deckHeight(local,s.floor);
   if(height!=null){
    const world=deckToSea(play.ship,local,lastClock,height),attitude=hullAttitude(play.ship,lastClock);
    const relative=model.group.rotation.y-play.ship.yaw;
    model.group.position.x=world.x;model.group.position.z=world.z;
    model.group.rotation.x=attitude.pitch*Math.cos(relative)-attitude.roll*Math.sin(relative);
    model.group.rotation.z=attitude.roll*Math.cos(relative)+attitude.pitch*Math.sin(relative);
   }
  }else{model.group.rotation.x=0;model.group.rotation.z=0;}
  if(wet||surf)model.shadow.visible=false;
  if(wet)swimmingWake(player,p,t);else for(const ring of ripples.get(player.id)??[])ring.visible=false;
  if(wet){
   const stroke=swimStroke(t,player.stepping,swimSeed(player));breaststroke(model,stroke);
   // Sample the actual wave under the moving face: the prone head can be almost a metre
   // ahead of the avatar origin. Keep the mouth clear on the inhale and near the surface in glide.
   model.face.getWorldPosition(swimmerHead);
   const waterline=waterAt(swimmerHead.x,swimmerHead.z,t),clearance=stroke.idle?.242:.136+.149*stroke.breath;
   model.group.position.y+=waterline+clearance-swimmerHead.y;
   if(model.label)model.label.position.y=waterline+.92-model.group.position.y;
  }else if(surf)surferPose(model,s.surf,t);
  else{
   model.body.position.z=0;model.body.rotation.set(0,0,model.body.rotation.z,'XYZ');
   if(s?.mode==="scooter")scooterPose(model);
  }
  let board=boards.get(player.id);
  if(!s?.board){if(board)board.visible=false;return;}
  if(!board){board=surfboard();boards.set(player.id,board);root.add(board);}
  board.visible=wet||surf||s.mode==="walk";
  const a=Math.PI-player.heading*Math.PI/180,land=!wet&&!surf;
  if(land){
   board.position.set(p.x+.45*Math.cos(a),surface(player)+.72,p.z-.45*Math.sin(a));
   board.rotation.set(0,a,1.4,'YXZ');
  }else{
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
 return {benches:[...beachBenches,...cafeBenches],tavernStoolTop,setClock,waterline,surface,pose,update,pickTrack:ray=>pickDeck(ray)??pickCafe(ray,cafeViewerFloor)??pickSpaceWalk(ray)??pickPavilion(ray),cameraBlocked,watchLift:play.watchLift};
}
