import * as T from "three";
import {makeWalkerModels} from "./walker-model.js";
import {surfboard} from "./pohang-scenery.js";
import {ground,wave,onDock,seatSpot} from "./pohang-layout.js";
function nameTag(name){
 const c=document.createElement("canvas");c.width=384;c.height=80;const ctx=c.getContext("2d");ctx.font="600 37px sans-serif";
 const w=Math.min(380,ctx.measureText(name).width+36);ctx.fillStyle="rgba(19,44,51,.74)";ctx.beginPath();ctx.roundRect((384-w)/2,4,w,67,17);ctx.fill();
 ctx.textAlign="center";ctx.fillStyle="#fff3df";ctx.fillText(name,192,50,350);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
 const spr=new T.Sprite(new T.SpriteMaterial({map:tex,depthWrite:false}));spr.scale.set(2.3,.48,1);return spr;
}
export function actors(scene){
 const blank=()=>{const show=()=>{};show.dispose=()=>{};return show;};
 const rigs=makeWalkerModels(T,scene,{wx:x=>x,wz:z=>z},blank),all=new Map();
 function draw(p,dt,time,t,visible=true){
  let r=all.get(p.id);if(!r){
   const model=rigs.create(Number(p.coat)||0xdd8864,p.nickname,nameTag,p.nickname);
   const board=surfboard();scene.add(board);r={model,board};all.set(p.id,r);
   const group=new T.Group();model.arms[1].end.add(group);
   const food=new T.Mesh(new T.SphereGeometry(.075,12,8),new T.MeshStandardMaterial({color:0xf1aba0}));food.scale.set(.91,.54,1.45);group.add(food);
   const cup=new T.Mesh(new T.CylinderGeometry(.053,.041,.095,12),new T.MeshStandardMaterial({color:0xe7e9d5}));group.add(cup);r.food=food;r.cup=cup;
  }
  const {model,board}=r;let floor=ground(p),sit=null;const mode=p.mode,swimming=mode==="swim",surf=mode==="surf";
  if(onDock(p))floor=1.85;
  if(swimming||surf)floor=wave(p.x,p.z,t)+(swimming?(p.hasBoard?-.37:-.87):.11);
  if(mode==="deck")floor=p.deckHeight??5.47;
  if(mode==="bus")floor=2.95;
  if(mode==="table"&&Number.isInteger(p.seat)){const s=seatSpot(Math.floor(p.seat/4),p.seat%4);sit={x:s.x,y:s.z,heading:p.seat%2?270:90,base:1.9};}
  const posture={...p,y:p.z,heading:180-p.yaw*180/Math.PI,stepping:!!p.walk,running:false,blushUntil:p.blush,blushLevel:p.blush>time?2:0,chat:null};
  rigs.update(model,posture,{now:performance.now(),clock:time,delta:dt,seat:sit,floor,turnEase:1});
  model.body.rotation.x=swimming?1.08:surf?.13:0;
  if(swimming||surf){
   model.arms.forEach((arm,i)=>{arm.upper.rotation.set(swimming?Math.sin(t*3+i*Math.PI)*1.3-.5:.2,0,(i?1:-1)*(swimming?.7:1));});
   if(surf){model.legs[0].upper.rotation.x=-.43;model.legs[1].upper.rotation.x=.33;model.body.rotation.z=.1*Math.sin(t*2);}
  }
  const eating=Number.isFinite(p.gestureAt)&&time-p.gestureAt<1900;
  r.food.visible=eating&&p.gesture!=="drink";r.cup.visible=eating&&p.gesture==="drink";
  if(eating){model.arms[1].upper.rotation.x=-.65;model.arms[1].lower.rotation.x=-1.1-.35*Math.sin((time-p.gestureAt)/490);}
  if(p.chat&&time-p.chatAt<5500){if(r.text!==p.chat){if(r.bubble){r.bubble.material.map.dispose();r.bubble.material.dispose();r.bubble.removeFromParent();}r.bubble=nameTag(p.chat);r.bubble.scale.set(3.6,.59,1);model.group.add(r.bubble);r.text=p.chat;}r.bubble.position.y=1.96;r.bubble.visible=true;}else if(r.bubble)r.bubble.visible=false;
  board.visible=surf||Boolean(p.hasBoard&&["swim","walk"].includes(mode));
  if(mode==="walk"){board.position.set(p.x+.42*Math.cos(p.yaw),floor+.76,p.z-.42*Math.sin(p.yaw));board.rotation.set(0,p.yaw,1.40);}
  else{board.position.set(p.x,wave(p.x,p.z,t)+.035,p.z);board.rotation.set(.075*Math.cos(t*1.3),p.yaw,.09*Math.sin(t*1.55));}
  model.group.visible=visible&&mode!=="bus";return floor;
 }
 function keep(ids){for(const [id,r] of all)if(!ids.has(id)){rigs.dispose(r.model);r.board.removeFromParent();if(r.bubble){r.bubble.material.map.dispose();r.bubble.material.dispose();}all.delete(id);}}
 return {draw,keep};
}
