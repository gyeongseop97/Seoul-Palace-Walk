import * as T from "three";
export {coastVisitors} from "./coast-visitors.js";
import {coastObstacle} from "./coast-region.js";
import {seaPoint} from "./region-coordinates.js";
import {shore,ground,onDock,inWater,wave,showAge,busAt,busCount,tables,clamp} from "./pohang-layout.js";
import {buildCoast,cruiseModel,surfboard} from "./pohang-scenery.js";
import {ocean,skyDome} from "./pohang-water.js";
import {fireworks} from "./pohang-festival.js";
import {buildHarborStreet,harborBusRoute} from "./coast-streets.js";
import {buildSejongBusModels} from "./sejong-bus-model.js";
import {buildSpaceWalk} from "./space-walk-model.js";
import {parkFloor} from "./space-walk-layout.js";

export function createCoastScene(root,play,walkers,kit){
 const lights=buildCoast(root),water=ocean(root),sky=skyDome(root),show=fireworks(root,water);
 buildHarborStreet(root);const parkLights=buildSpaceWalk(root);
 const ship=cruiseModel();root.add(ship);
 const buses=buildSejongBusModels(T,root,kit,walkers,()=>1.85,()=>1.85,harborBusRoute);
 const shells=tables.map(t=>Array.from({length:4},(_,i)=>{
  const shell=new T.Mesh(new T.SphereGeometry(1,10,7,0,2*Math.PI,0,Math.PI/2),new T.MeshStandardMaterial({color:0xc1a785,side:T.DoubleSide}));
  shell.scale.set(.11,.055,.13);shell.position.set(t.x+(i%2-.5)*.24,2.78,t.z+(Math.floor(i/2)-.5)*.26);root.add(shell);return shell;
 }));
 const boards=new Map(),ripples=new Map(),ringGeometry=new T.RingGeometry(.76,.79,36).rotateX(-Math.PI/2);
 function swimmingWake(player,p,t){
  let rings=ripples.get(player.id);
  if(!rings){
   rings=[0,1].map(()=>{const mesh=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xd9f4ed,transparent:true,depthWrite:false}));mesh.renderOrder=2;root.add(mesh);return mesh;});
   ripples.set(player.id,rings);
  }
  rings.forEach((ring,i)=>{
   const phase=(t*(player.stepping?.89:.43)+i*.5)%1;
   ring.visible=true;ring.position.set(p.x,wave(p.x,p.z,t)+.032,p.z);
   ring.scale.setScalar(.30+.92*phase);ring.material.opacity=.30*(1-phase);
  });
 }
 window.addEventListener("pointerdown",show.unlock,{once:true});window.addEventListener("keydown",show.unlock,{once:true});
 let lastClock=Date.now();
 function surface(p){
  const local=seaPoint(p),s=p.coast,t=lastClock/1000%14400;
  if(s?.mode==="deck")return ship.position.y+clamp(s.floor??5.46,5.46,7.85);
  if(s?.mode==="bus")return 3.12;
  const park=parkFloor(local,p.coast?.track);if(park!=null)return park;
  if(onDock(local))return 1.85;
  if(inWater(local))return wave(local.x,local.z,t)*(smooth((local.x-(shore(local.z)-5))/12))+(s?.mode==="surf"?.14:-.61);
  return ground(local);
 }
 function smooth(x){x=clamp(x,0,1);return x*x*(3-2*x);}
 function update(state,night,camera,height){
  lastClock=state.clock;const t=lastClock/1000%14400,b=play.ship,p=seaPoint(state.me);
  const id=state.me.id;ship.position.set(b.x,wave(b.x,b.z,t)*.21,b.z);ship.rotation.y=b.yaw;
  buses.update(lastClock,state.me);
  sky.sky.position.copy(camera.position);sky.uniforms.night.value=night;
  lights(night);parkLights(night);water.night.value=night;water.uTime.value=t;
  water.speed.value=play.boat.helm?Math.min(1,(ship.userData.last?Math.hypot(b.x-ship.userData.last.x,b.z-ship.userData.last.z)*9:0)):0;
  ship.userData.last={x:b.x,z:b.z};water.wake.value.set(b.x,b.z,b.yaw);
  show.update(showAge(lastClock,play.boat.festival),p,t,height);
  shells.forEach((group,i)=>group.forEach(s=>{const start=play.grills.get(i);s.visible=!!start;if(start)s.rotation.x=-clamp((lastClock-start-4400)/2200,0,1)*1.2;}));
  const visible=new Set([id,...state.peers.map(p=>p.id)]);
  for(const [key,rings] of ripples)if(!visible.has(key)){for(const ring of rings){ring.removeFromParent();ring.material.dispose();}ripples.delete(key);}
  for(const [key,board] of boards)if(!visible.has(key)){board.removeFromParent();boards.delete(key);}
 }
 function pose(player,model){
  const s=player.coast,wet=s?.mode==="swim",surf=s?.mode==="surf",t=lastClock/1000%14400,p=seaPoint(player);
  if(wet||surf)model.shadow.visible=false;
  if(wet||surf)swimmingWake(player,p,t);else for(const ring of ripples.get(player.id)??[])ring.visible=false;
  if(wet||surf){
   model.body.rotation.x=wet?(player.stepping?.99:.62):.13;
   if(wet){model.legs[0].upper.rotation.x=-.34+.22*Math.sin(t*3.6);model.legs[1].upper.rotation.x=-.34-.22*Math.sin(t*3.6);}
   if(!player.gesture&&!player.hand&&!player.groundSit)model.arms.forEach((arm,i)=>{
    if(i===0?player.item:player.secondItem)return;
    arm.upper.rotation.set(wet?-.42+Math.sin(t*(player.stepping?3.6:1.6)+i*Math.PI)*.85:.22,0,(i?1:-1)*(wet?.61:.89));
   });
   if(surf){model.legs[0].upper.rotation.x=-.4;model.legs[1].upper.rotation.x=.3;}
  }else model.body.rotation.x=0;
  let board=boards.get(player.id);
  if(!s?.board){if(board)board.visible=false;return;}
  if(!board){board=surfboard();boards.set(player.id,board);root.add(board);}
  board.visible=wet||surf||s.mode==="walk";
  const a=Math.PI-player.heading*Math.PI/180,land=!wet&&!surf;
  board.position.set(p.x+(land?.45*Math.cos(a):0),land?surface(player)+.72:wave(p.x,p.z,t)+.05,p.z-(land?.45*Math.sin(a):0));
  board.rotation.set(0,a,land?1.4:.06*Math.sin(t));
 }
 return {surface,pose,update,cameraBlocked:(point,y)=>coastObstacle(seaPoint(point),y),festival:time=>showAge(time,play.boat.festival)>=0,watchLift:play.watchLift};
}
