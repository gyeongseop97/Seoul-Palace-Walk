import {coastPoint} from "./region-coordinates.js";
import {limits,promenade,station} from "./pohang-layout.js";
import {worldExtent} from "./world-extent.js";
import {hall} from "./layout.js";
import {gwanghwamun} from "./gyeongbok-layout.js";
import {stationSites} from "./station-layout.js";

const presets=[
 ["영일대 해변","pohang",coastPoint({x:promenade(-90)-16,z:-90}),92],
 ["영일만 크루즈","pohang",null,28],["포항역","pohang",coastPoint(station),45],
 ["덕수궁","seoul",hall,5],["광화문","seoul",gwanghwamun,0],["서울역","seoul",stationSites[2],265],
];
const origin=coastPoint({x:0,z:0}),coastBounds={minX:origin.x+limits.minX,maxX:origin.x+limits.maxX,minY:origin.y+limits.minZ,maxY:origin.y+limits.maxZ};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const movement={KeyW:"forward",ArrowUp:"forward",KeyS:"back",ArrowDown:"back",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",KeyE:"rise",KeyQ:"lower"};

export function makeStudioMonitor({world,ship,onClose}){
 const dialog=document.createElement("dialog");
 dialog.id="studio-monitor";dialog.setAttribute("aria-label","관제실 실시간 카메라");
 dialog.innerHTML=`<div class="studio-feed"></div><header><strong>관제실</strong>
  <select aria-label="카메라 위치"></select><output aria-label="카메라 고도"></output>
  <button type="button" data-close>관제 종료</button></header>
  <div class="studio-controls"><div class="studio-pad" aria-label="카메라 이동"></div>
  <span>드래그로 시선 조절 · 방향키로 비행</span><div class="studio-alt"></div></div>
  <div class="studio-status" role="status" hidden></div>`;
 document.body.append(dialog);
 const host=dialog.querySelector(".studio-feed"),select=dialog.querySelector("select"),status=dialog.querySelector(".studio-status"),alt=dialog.querySelector("output");
 for(const [i,[name]] of presets.entries())select.add(new Option(name,String(i)));
 const keys=new Set(),touches=new Map(),drags=new Map();
 let region=null,camera,frame=null,previous=0,lastDraw=0,fast=false,oldHeight=-1;
 function release(){keys.clear();touches.clear();drags.clear();fast=false;}
 function choose(index){
  const [,next,site,yaw]=presets[index],point=site??coastPoint(ship());
  camera={x:point.x,y:point.y+35,height:44,pan:yaw,tilt:37,fov:58};
  if(region===next)return;
  region=next;release();previous=lastDraw=0;
  if(next==="pohang"){
   if(frame)frame.hidden=true;
   status.hidden=true;world.attachViewport(host);
  }else{
   world.attachViewport();
   status.hidden=false;status.textContent="서울 카메라 연결 중…";
   if(frame){frame.hidden=false;return;}
   frame=document.createElement("iframe");frame.title="서울 실시간 관제 화면";frame.tabIndex=-1;
   const content=document.querySelector('script[type="importmap"]').textContent;
   frame.srcdoc=`<!doctype html><html lang="ko"><meta charset="utf-8"><style>html,body,#feed{width:100%;height:100%;margin:0;overflow:hidden;background:#18262a}canvas{display:block}</style><div id="feed"></div><script type="importmap">${content}</script><script type="module" src="./coast-monitor-feed.js"></script></html>`;
   host.append(frame);
  }
 }
 host.tabIndex=0;host.setAttribute("aria-label","드론 카메라 조작");
 select.addEventListener("change",()=>{choose(Number(select.value));host.focus();});
 function close(){if(dialog.open)dialog.close();}
 dialog.querySelector("[data-close]").onclick=close;
 dialog.addEventListener("close",()=>{
  release();world.attachViewport();frame?.contentWindow?.stopStudioFeed?.();frame?.remove();frame=null;region=null;onClose();
 });
 for(const [action,symbol,label] of [["forward","↑","앞으로"],["left","←","왼쪽"],["back","↓","뒤로"],["right","→","오른쪽"],["rise","＋","상승"],["lower","−","하강"]]){
  const button=document.createElement("button");button.type="button";button.textContent=symbol;button.setAttribute("aria-label",label);button.dataset.motion=action;
  dialog.querySelector(action==="rise"||action==="lower"?".studio-alt":".studio-pad").append(button);
  button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touches.set(e.pointerId,action);};
  button.onlostpointercapture=e=>touches.delete(e.pointerId);
  button.onclick=e=>{if(e.detail===0)fly(.12,new Set([action]));};
 }
 dialog.addEventListener("keydown",e=>{
  if(e.target===select)return;
  if(movement[e.code]){e.preventDefault();keys.add(e.code);}
  fast=e.shiftKey;
 });
 dialog.addEventListener("keyup",e=>{keys.delete(e.code);fast=e.shiftKey;});
 window.addEventListener("blur",release);
 host.onpointerdown=e=>{if(e.button!==0)return;host.focus();host.setPointerCapture(e.pointerId);drags.set(e.pointerId,[e.clientX,e.clientY]);};
 host.onpointermove=e=>{
  const p=drags.get(e.pointerId);if(!p)return;
  camera.pan=(camera.pan+(e.clientX-p[0])*.29+360)%360;camera.tilt=clamp(camera.tilt+(e.clientY-p[1])*.24,-87,87);
  drags.set(e.pointerId,[e.clientX,e.clientY]);
 };
 host.onlostpointercapture=e=>drags.delete(e.pointerId);
 function fly(dt,held){
  const forward=Number(held.has("forward"))-Number(held.has("back")),side=Number(held.has("right"))-Number(held.has("left"));
  const r=camera.pan*Math.PI/180,bounds=region==="seoul"?worldExtent:coastBounds;
  const step=dt*(9+camera.height*.82)*(fast?2:1)/Math.max(1,Math.hypot(forward,side));
  const pitch=camera.tilt*Math.PI/180,level=forward*Math.cos(pitch);
  camera.x=clamp(camera.x+step*(level*Math.sin(r)+side*Math.cos(r)),bounds.minX,bounds.maxX);
  camera.y=clamp(camera.y+step*(-level*Math.cos(r)+side*Math.sin(r)),bounds.minY,bounds.maxY);
  const lift=(Number(held.has("rise"))-Number(held.has("lower")))*dt*(8+camera.height*.60);
  camera.height=clamp(camera.height-step*forward*Math.sin(pitch)+lift,5,420);
 }
 return {get active(){return dialog.open;},open(){
  if(dialog.open)return;
  dialog.showModal();select.value="0";choose(0);host.focus();
 },close,render(state,now){
  const dt=previous?Math.min(.12,(now-previous)/1000):0;previous=now;
  fly(dt,new Set([...Array.from(keys,k=>movement[k]),...touches.values()]));
  const meters=Math.round(camera.height);
  if(meters!==oldHeight){oldHeight=meters;alt.textContent=meters+" m";}
  if(now-lastDraw<1000/30)return;lastDraw=now;
  const focus={x:camera.x,y:camera.y,heading:camera.pan,id:"studio-camera"};
  const feed={...state,monitorFocus:focus,view:{...state.view,pan:camera.pan,tilt:camera.tilt},photoCamera:camera,photoCapture:true,firstPerson:false,coastMarker:null};
  if(region==="pohang")world.render(feed,now);
  else if(frame?.contentWindow.drawStudioFeed){
   status.hidden=Boolean(frame.contentWindow.drawStudioFeed(feed));
  }else if(frame?.contentWindow.studioFeedError){status.textContent="서울 화면을 열 수 없어요. 다른 카메라를 선택해 주세요.";}
 }};
}
