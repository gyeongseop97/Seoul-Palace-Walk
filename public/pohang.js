import * as T from "three";
import {gameApiUrl} from "./hosting.js";
import {arrival,station,train,beachStop,boardRack,dock,mooring,tables,seatSpot,pier,pavilion,shore,promenade,ground,onDock,onPier,inWater,inBounds,route,distance,busAt,busCount,clamp,wave,showAge,geo} from "./pohang-layout.js";
import {buildCoast,cruiseModel,busModel} from "./pohang-scenery.js";
import {ocean,skyDome} from "./pohang-water.js";
import {fireworks} from "./pohang-festival.js";
import {coastGuide} from "./pohang-guide.js";
import {actors} from "./pohang-actors.js";

const $=id=>document.getElementById(id);
const ticket=JSON.parse(sessionStorage.getItem("palace-coast-ticket")||"null");
if(ticket?.id&&ticket?.room&&ticket?.key)start(ticket);
else {$("load-text").textContent="서울역 승강장에서 KTX를 타면 이곳으로 올 수 있어요.";}

function start(ticket){
 const canvas=$("world"),renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
 const quality=localStorage.getItem("palace-graphics-quality")||"high";
 renderer.setPixelRatio(Math.min(devicePixelRatio,quality==="low"?1:quality==="medium"?1.35:2));
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(54,1,.11,3900);
 scene.background=new T.Color(0xb5d4e5);scene.fog=new T.FogExp2(0xc1d7e3,.00048);
 const hemi=new T.HemisphereLight(0xf1f6ff,0xc4a580,2.0),sun=new T.DirectionalLight(0xffe9c4,1.95);
 sun.position.set(120,160,-100);scene.add(hemi,sun);const shorelineLights=buildCoast(scene);
 const water=ocean(scene),sky=skyDome(scene),fx=fireworks(scene,water),rigs=actors(scene);
 const ship=cruiseModel();scene.add(ship);
 const buses=Array.from({length:busCount},()=>{const b=busModel();scene.add(b);return b;});
 const grillProps=tables.map(t=>{
  const shells=[];for(let k=0;k<4;k++){
   const g=new T.Group();g.position.set(t.x+(k%2-.5)*.26,2.78,t.z+(Math.floor(k/2)-.5)*.27);
   const m=new T.MeshStandardMaterial({color:0xbb9e77});const top=new T.Mesh(new T.SphereGeometry(1,9,5,0,Math.PI*2,0,Math.PI/2),m);top.scale.set(.11,.047,.12);g.add(top);
   const flesh=new T.Mesh(new T.SphereGeometry(.065,9,5),new T.MeshStandardMaterial({color:0xe7b783}));flesh.scale.y=.38;g.add(flesh);scene.add(g);shells.push({g,top});
  }return shells;
 });
 const me={...arrival,id:ticket.id,yaw:Math.PI/2,mode:"walk",nickname:ticket.nickname,coat:ticket.coat,character:ticket.character,look:ticket.look,plushHead:ticket.plushHead,plushBack:ticket.plushBack,seat:null};
 try{const v=JSON.parse(sessionStorage.getItem("palace-coast-position"));if(v?.room===ticket.room&&inBounds(v)){me.x=v.x;me.z=v.z;me.yaw=v.yaw||0;}}catch{}
 let boat={...mooring,yaw:0,helm:null,festival:0},shipPose={...boat},autoReturn=false,helmSpeed=0;
 let offset=0,ready=false,busy=false,exiting=false,delayUntil=0,board=false,standing=false,first=false,slot=0;
 let pan=me.yaw,tilt=.23,zoom=6,go=null,grills=new Map(),feedback="",feedbackUntil=0,lastActions="",actionMap=new Map();
 const guide=coastGuide($("chart"),me);
 const remote=new Map(),keys=new Set(),axis={x:0,y:0},lookPointers=new Map();let stickId=null;
 const clock=()=>Date.now()+offset;
 const say=(s,d=3200)=>{feedback=s;feedbackUntil=performance.now()+d;};
 const seaTime=()=>clock()/1000%14400;
 const actionQueue=[];
 function command(action,extra={}){if(!actionQueue.some(c=>c.action===action))actionQueue.push({action,...extra});sync();}
 function save(){const p=me.mode==="bus"?arrival:me.mode==="deck"?{x:dock.x-2,z:dock.z}:me;sessionStorage.setItem("palace-coast-position",JSON.stringify({x:p.x,z:p.z,yaw:me.yaw,room:ticket.room}));}
 function back(){
   if(exiting)return;exiting=true;
   fetch(gameApiUrl("/api/room"),{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,body:JSON.stringify({room:ticket.room,id:me.id,key:ticket.key,coast:{action:"leave"}})}).catch(()=>{});
   location.assign(new URL("index.html",location.href));
 }
 $("back").addEventListener("click",e=>{e.preventDefault();back();});
 async function sync(){
  if(busy||exiting||Date.now()<delayUntil)return;busy=true;const c=actionQueue[0],sent=Date.now();
  try{
   const response=await fetch(gameApiUrl("/api/room"),{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",
    body:JSON.stringify({room:ticket.room,id:me.id,key:ticket.key,coast:{...c,pose:me,boat:boat.helm===me.id?{x:shipPose.x,z:shipPose.z,yaw:shipPose.yaw}:null}}),signal:AbortSignal.timeout(8500)});
   const result=await response.json();
   if(!response.ok){if(response.status===403){exiting=true;$("boarding").hidden=false;$("load-text").textContent=result.error;$("back").onclick=e=>{e.preventDefault();location.assign("./index.html");};}throw Error(result.error);}
   if(c)actionQueue.shift();const targetOffset=result.now-(sent+Date.now())/2;offset=ready?offset*.85+targetOffset*.15:targetOffset;
   const prior=boat;boat=result.boat;
   if(!ready||boat.helm===me.id&&prior.helm!==me.id||distance(shipPose,boat)>35)Object.assign(shipPose,boat);
   if(c?.action==="helm"&&boat.helm!==me.id)say("다른 동행이 조종 중이에요.");
   const self=result.people.find(p=>p.id===me.id);
   if(self){me.seat=self.seat;
    if(Number.isInteger(me.seat)){me.mode="table";Object.assign(me,seatSpot(Math.floor(me.seat/4),me.seat%4));}
    else if(me.mode==="table")me.mode="walk";
    if(c?.action==="sit"&&me.seat==null)say("이 테이블은 만석이에요.");}
   if(c?.action==="eat"&&result.ate)gesture("clam");
   if(c?.action==="moor"&&!boat.helm){autoReturn=false;helmSpeed=0;}
   const seen=new Set();
   for(const p of result.people){if(p.id===me.id)continue;seen.add(p.id);const r=remote.get(p.id)||{x:p.x,z:p.z,yaw:p.yaw};r.to=p;remote.set(p.id,r);}
   for(const id of remote.keys())if(!seen.has(id))remote.delete(id);
   grills=new Map(result.grills.map(g=>[g.spot,g.started]));ready=true;$("boarding").hidden=true;
  }catch(e){delayUntil=Date.now()+1400;say("연결을 다시 확인하고 있어요.");if(!ready)$("load-text").textContent=e.message+" · 연결 재시도 중";}
  finally{busy=false;if(actionQueue.length&&ready&&!exiting)setTimeout(sync,100);}
 }
 const timer=setInterval(sync,450);sync();
 window.addEventListener("pagehide",()=>{save();clearInterval(timer);});window.addEventListener("pageshow",e=>{if(e.persisted)location.reload();});
 function gesture(kind){me.gesture=kind;me.gestureAt=clock();if(kind==="drink")me.blush=clock()+120000;say(kind==="drink"?"동해를 바라보며 소주 한 잔":kind==="fish"?"모둠회를 한 점 먹었어요.":"불에 구운 조개를 먹었어요.");}
 const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
 function boardShip(){
  me.mode="deck";slot=parseInt(me.id.slice(0,4),16)%6;me.slot=slot;me.deckX=(slot%3-1)*1.55;me.deckZ=-10.5+Math.floor(slot/3)*1.25;go=null;helmSpeed=0;pan=Math.PI/2;tilt=.09;
  say("상갑판에 올랐어요. 조타를 맡거나 갑판에서 불꽃을 감상하세요.");
 }
 function boardBus(i){me.coach=i;me.mode="bus";go=null;const b=busAt(i,clock()/1000);pan=b.yaw;tilt=.12;say("창밖을 보려면 화면을 끌거나 시점을 전환하세요.");}
 function exitBus(b){Object.assign(me,b.stop==="station"?arrival:{x:beachStop.x+7,z:beachStop.z+2});me.coach=null;me.mode="walk";pan=b.stop==="station"?Math.PI:Math.PI/2;}
 const coastSide=()=>me.z>-1000&&me.z<360&&Math.abs(me.x-shore(me.z))<720;
 function hud(){
  const actions=[],add=(id,label,fn)=>actions.push({id,label,fn});let hint="",loc="해안로";
  const atStation=distance(me,station)<26,atBeach=distance(me,beachStop)<24,activeBus=me.mode==="bus"?busAt(me.coach,clock()/1000):null;
  const show=showAge(clock(),boat.festival);
  if(atStation){loc="포항역";hint="광장 정류장에서 영일대행 버스를 타세요.";}
  else if(coastSide())loc=onPier(me)?"영일대 해상누각":inWater(me)?"영일만":"영일대해수욕장";
  if(activeBus){
   loc="포항 해변버스";hint=activeBus.stop?(activeBus.stop==="beach"?"영일대해수욕장":"포항역")+" 정차 · 출발 "+activeBus.left+"초":(activeBus.next==="beach"?"영일대":"포항역")+" 도착까지 "+activeBus.left+"초";
   if(activeBus.stop)add("busExit","버스 내리기",()=>exitBus(activeBus));
  }else if(me.mode==="deck"){
   loc=boat.helm===me.id?"크루즈 조타석":"크루즈 전망 갑판";
   const moored=distance(shipPose,mooring)<13;
   if(!boat.helm&&moored)add("helm","조타 맡기",()=>command("helm"));
   if(boat.helm===me.id){
    hint=autoReturn?"선착장으로 돌아가는 중":"앞뒤로 속도 조절 · 좌우로 조타";
    if(moored)add("moor","부두에 계류",()=>{helmSpeed=0;command("moor");});
    else add("return",autoReturn?"자동 귀항 취소":"선착장으로 귀항",()=>autoReturn=!autoReturn);
   }else{
    hint="갑판에서 시야를 돌려 영일만을 구경하세요.";
    if(moored&&!boat.helm)add("ashore","하선",()=>{Object.assign(me,{x:dock.x-1,z:dock.z,mode:"walk"});});
   }
  }else if(me.mode==="table"&&me.seat!=null){
   const table=Math.floor(me.seat/4),started=grills.get(table)||0;loc="영일대 바다야장";
   add("fish","회 먹기",()=>gesture("fish"));
   if(!started)add("grill","조개 올리기",()=>command("grill",{table}));
   else if(clock()-started>=6500)add("clam","구운 조개 먹기",()=>command("eat",{table,started}));
   else hint="조개가 입을 벌릴 때까지 "+Math.ceil((6500-clock()+started)/1000)+"초";
   add("drink","소주 한 잔",()=>gesture("drink"));add("stand","일어나기",()=>command("stand"));
  }else{
   if(atStation||atBeach){const key=atStation?"station":"beach";
    const options=Array.from({length:busCount},(_,i)=>({i,...busAt(i,clock()/1000)}));
    const present=options.find(b=>b.stop===key);
    if(present){hint="출발까지 "+present.left+"초";add("bus"+present.i,key==="station"?"영일대행 버스 타기":"포항역행 버스 타기",()=>boardBus(present.i));}
    else{const soon=Math.min(...options.filter(b=>b.next===key&&!b.stop).map(b=>b.left));hint=(atStation?"영일대행":"포항역행")+" 버스 "+(isFinite(soon)?soon+"초 후 도착":"접근 중");}
   }
   if(distance(me,train)<12)add("seoul","서울행 KTX 타기",back);
   if(distance(me,boardRack)<5)add("rent",board?"보드 반납":"서핑보드 빌리기",()=>{board=!board;me.hasBoard=board;say(board?"바다로 들어가서 파도를 잡아보세요.":"보드를 반납했어요.");});
   if(inWater(me)){loc=standing?"영일만 서핑":"영일만 수영";hint=board?"물마루가 올 때 파도 타기를 누르세요.":"방향키나 조이스틱으로 헤엄치세요.";
    if(board)add("surf",standing?"보드에서 내려오기":"파도 타기",()=>{if(!standing&&wave(me.x,me.z,seaTime())<-.38){say("물결이 올라올 때 다시 타보세요.");return;}standing=!standing;});}
   if(distance(me,dock)<6&&distance(shipPose,mooring)<13)add("ship","크루즈 승선",boardShip);
   const i=tables.findIndex(t=>distance(me,t)<3.6);if(i>=0)add("sit","야장에 앉기",()=>{go=null;pan=Math.PI/2;command("sit",{table:i});});
  }
  if(coastSide()&&me.mode!=="bus")add(show<0?"festival":"watch",show<0?"불빛축제 보기":"불꽃 바라보기",()=>{
   const x=shore(beachStop.z)+215-me.x,z=beachStop.z-80-me.z;
   if(!first)toggleCamera();pan=Math.atan2(x,z);tilt=-Math.atan2(47,Math.max(25,Math.hypot(x,z)));
   if(show<0)command("festival");
  });
  if(show>=0&&coastSide()&&!hint)hint="영일만 불빛축제 공연 중";
  if(!hint&&!coastSide())hint="WASD · 방향키 이동 / 화면 끌어 둘러보기";
  $("where").textContent=loc;$("hint").textContent=performance.now()<feedbackUntil?feedback:hint;
  actionMap=new Map(actions.map(a=>[a.id,a.fn]));const sig=actions.map(a=>a.id+a.label).join("|");
  if(sig!==lastActions){lastActions=sig;$("actions").replaceChildren(...actions.map(a=>{const b=document.createElement("button");b.textContent=a.label;b.onclick=()=>actionMap.get(a.id)?.();return b;}));}
 }
 function occupyShip(p){
  const pilot=boat.helm===p.id,q=pilot?{x:0,z:6.7}: {x:p.deckX??((p.slot??slot)%3-1)*1.55,z:p.deckZ??(-10.5+Math.floor((p.slot??slot)/3)*1.25)};
  const a=shipPose.yaw,c=Math.cos(a),s=Math.sin(a);p.x=shipPose.x+q.x*c+q.z*s;p.z=shipPose.z-q.x*s+q.z*c;p.deckHeight=ship.position.y+(pilot?7.88:5.47);p.yaw=pilot?a:a+Math.PI/2;
 }
 const touchStick=$("stick"),handle=touchStick.querySelector("i");
 const setAxis=e=>{const r=touchStick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/36,y=(r.top+r.height/2-e.clientY)/36,n=Math.max(1,Math.hypot(x,y));axis.x=x/n;axis.y=y/n;handle.style.transform="translate("+axis.x*27+"px,"+(-axis.y*27)+"px)";go=null;};
 touchStick.onpointerdown=e=>{if(stickId!==null)return;stickId=e.pointerId;touchStick.setPointerCapture(stickId);setAxis(e);};
 touchStick.onpointermove=e=>{if(e.pointerId===stickId)setAxis(e);};touchStick.onlostpointercapture=()=>{stickId=null;axis.x=axis.y=0;handle.style.transform="";};
 const toggleCamera=()=>{first=!first;$("camera").textContent=first?"3인칭":"1인칭";$("camera").setAttribute("aria-label",first?"3인칭 전환":"1인칭 전환");};
 $("camera").onclick=toggleCamera;
 const keyMap={KeyW:"up",ArrowUp:"up",KeyS:"down",ArrowDown:"down",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",ShiftLeft:"run",ShiftRight:"run"};
 addEventListener("keydown",e=>{if(e.target.tagName==="INPUT"||$("chart").open)return;if(keyMap[e.code]){e.preventDefault();keys.add(keyMap[e.code]);go=null;}if(e.code==="KeyV"&&!e.repeat)toggleCamera();});
 addEventListener("keyup",e=>keys.delete(keyMap[e.code]));addEventListener("blur",()=>{keys.clear();axis.x=axis.y=0;});
 window.addEventListener("pointerdown",()=>fx.unlock(),{once:true});window.addEventListener("keydown",()=>fx.unlock(),{once:true});
 function pinch(){if(lookPointers.size!==2)return 0;const [a,b]=lookPointers.values();return Math.hypot(a.x-b.x,a.y-b.y);}
 canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);lookPointers.set(e.pointerId,{x:e.clientX,y:e.clientY,move:0});if(lookPointers.size===2)for(const p of lookPointers.values())p.move=20;};
 canvas.onpointermove=e=>{const a=lookPointers.get(e.pointerId);if(!a)return;const prev=pinch(),dx=e.clientX-a.x,dy=e.clientY-a.y;a.x=e.clientX;a.y=e.clientY;a.move+=Math.hypot(dx,dy);
  if(prev){zoom=clamp(zoom*prev/Math.max(1,pinch()),2.2,25);}else{pan-=dx*.006;tilt=clamp(tilt+dy*.004,-1.08,1.22);}
 };
 canvas.onpointerup=e=>{const p=lookPointers.get(e.pointerId);if(p?.move<7&&["walk","surf","swim"].includes(me.mode)){
  const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),cam);
  const target=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-Math.max(0,ground(me))),target)&&distance(me,target)<105&&inBounds(target))go={x:target.x,z:target.z};}
  lookPointers.delete(e.pointerId);};
 canvas.onlostpointercapture=e=>lookPointers.delete(e.pointerId);
 canvas.addEventListener("wheel",e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(e.deltaY*.001),2.2,25);},{passive:false});
 $("chat").onsubmit=e=>{e.preventDefault();const input=$("chat").querySelector("input");if(input.value.trim()){me.chat=input.value.trim().slice(0,80);me.chatAt=clock();input.value="";sync();}input.focus();};
 const blocks=geo.blocks.map(([,p])=>({p,x0:Math.min(...p.map(v=>v[0])),x1:Math.max(...p.map(v=>v[0])),z0:Math.min(...p.map(v=>v[1])),z1:Math.max(...p.map(v=>v[1]))}));
 function blocked(p){if(onPier(p)||onDock(p))return false;for(const b of blocks){if(p.x<b.x0||p.x>b.x1||p.z<b.z0||p.z>b.z1)continue;let inside=false;for(let i=0,j=b.p.length-1;i<b.p.length;j=i++){
  const [x,z]=b.p[i],[u,v]=b.p[j];if((z>p.z)!==(v>p.z)&&p.x<(u-x)*(p.z-z)/(v-z)+x)inside=!inside;}if(inside)return true;}return false;}
 function drive(dx,dy,dt){
  if(boat.helm!==me.id){const k=1-Math.exp(-dt*5);shipPose.x+=(boat.x-shipPose.x)*k;shipPose.z+=(boat.z-shipPose.z)*k;shipPose.yaw+=angle(shipPose.yaw,boat.yaw)*k;return;}
  if(autoReturn){const d=distance(shipPose,mooring);if(d<3){autoReturn=false;helmSpeed=0;command("moor");}
   else{const yaw=Math.atan2(mooring.x-shipPose.x,mooring.z-shipPose.z);shipPose.yaw+=clamp(angle(shipPose.yaw,yaw),-dt*1.2,dt*1.2);helmSpeed=Math.min(14,d*.7);}}
  else{helmSpeed=clamp(helmSpeed+dy*dt*5,-4,16);shipPose.yaw+=(dx*-.68)*dt;}
  const x=shipPose.x+Math.sin(shipPose.yaw)*helmSpeed*dt,z=shipPose.z+Math.cos(shipPose.yaw)*helmSpeed*dt;
  if(z>=-930&&z<=285&&x>=shore(z)+12&&x<=Math.min(1250,shore(z)+525)){shipPose.x=x;shipPose.z=z;}else helmSpeed=0;
 }
 function mapDraw(){const cv=$("map-view"),c=cv.getContext("2d");cv.width=790;cv.height=455;const scale=.169,X=x=>75+(x-station.x)*scale,Z=z=>72+(z-station.z)*scale;
  c.fillStyle="#e6dfca";c.fillRect(0,0,790,455);c.fillStyle="#78abae";c.beginPath();c.moveTo(790,0);for(let z=-2450;z<=420;z+=30)c.lineTo(X(shore(z)),Z(z));c.lineTo(790,455);c.fill();
  c.strokeStyle="#b47d52";c.lineWidth=4;c.beginPath();route.forEach((p,i)=>i?c.lineTo(X(p.x),Z(p.z)):c.moveTo(X(p.x),Z(p.z)));c.stroke();guide.marks(c,X,Z);c.font="bold 18px sans-serif";
  for(const [p,label,color,dy] of [[station,"포항역","#325459",-12],[beachStop,"영일대해수욕장","#325459",24],[pavilion,"영일대","#325459",-10],[me,"나","#b63e42",-11]]){c.fillStyle=color;c.beginPath();c.arc(X(p.x),Z(p.z),5,0,7);c.fill();c.fillText(label,X(p.x)+8,Z(p.z)+dy);}}
 $("map-open").onclick=()=>{mapDraw();$("chart").showModal();};$("close-map").onclick=()=>$("chart").close();
 const aim=new T.Vector3();let last=performance.now(),uiAt=0,savedAt=0,night=0;
 function frame(ms){
  const dt=Math.min(.09,(ms-last)/1000);last=ms;const time=clock(),t=seaTime(),sec=time/1000;
  const dx=axis.x+Number(keys.has("right"))-Number(keys.has("left")),dy=axis.y+Number(keys.has("up"))-Number(keys.has("down"));
  drive(me.mode==="deck"?dx:0,me.mode==="deck"?dy:0,dt);
  ship.position.set(shipPose.x,wave(shipPose.x,shipPose.z,t)*.29,shipPose.z);ship.rotation.set(.014*Math.sin(t*.68),shipPose.yaw,.021*Math.sin(t*.91));
  water.wake.value.set(shipPose.x,shipPose.z,shipPose.yaw);water.speed.value=boat.helm===me.id?Math.abs(helmSpeed)/16:Math.min(1,distance(boat,shipPose)/3);
  buses.forEach((b,i)=>{const p=busAt(i,sec);b.position.set(p.x,1.96,p.z);b.rotation.y=p.yaw;});
  me.walk=false;
  if(me.mode==="bus"){const b=busAt(me.coach,sec);me.x=b.x;me.z=b.z;me.yaw=b.yaw;}
  else if(me.mode==="deck"){
   if(boat.helm!==me.id&&(dx||dy)){
    const rel=pan-shipPose.yaw;me.deckX=clamp((me.deckX??0)+(dy*Math.sin(rel)-dx*Math.cos(rel))*dt*2.8,-3.5,3.5);
    me.deckZ=clamp((me.deckZ??-10)+(dy*Math.cos(rel)+dx*Math.sin(rel))*dt*2.8,-12.8,-6.7);me.walk=true;
   }occupyShip(me);
  }
  else if(me.mode!=="table"){
   let vx=dy*Math.sin(pan)-dx*Math.cos(pan),vz=dy*Math.cos(pan)+dx*Math.sin(pan);
   if(go){vx=go.x-me.x;vz=go.z-me.z;if(Math.hypot(vx,vz)<.45){go=null;vx=vz=0;}}
   const len=Math.hypot(vx,vz),wet=inWater(me);
   if(!wet)standing=false;me.mode=wet?(standing?"surf":"swim"):"walk";
   if(len>.03||standing){
    if(!len){vx=Math.sin(me.yaw);vz=Math.cos(me.yaw);}const norm=Math.max(1,Math.hypot(vx,vz));
    let speed=wet?(standing?7.5+wave(me.x,me.z,t)*2.7:board?3.9:2.8):keys.has("run")?7:4.4;
    const p={x:me.x+vx/norm*speed*dt,z:me.z+vz/norm*speed*dt};
    if(standing){const slope=(wave(me.x+.4,me.z,t)-wave(me.x-.4,me.z,t))/.8;p.x-=(1.25+Math.max(0,slope)*11)*dt;}
    if(inBounds(p)&&!blocked(p)){me.x=p.x;me.z=p.z;me.yaw=Math.atan2(vx,vz);me.walk=true;}else go=null;
   }
  }
  const floor=rigs.draw(me,dt,time,t,!first);
  const ids=new Set([me.id]);for(const [id,r] of remote){const p=r.to,k=1-Math.exp(-dt*8);r.x+=(p.x-r.x)*k;r.z+=(p.z-r.z)*k;r.yaw+=angle(r.yaw,p.yaw)*k;
   const actor={...p,x:r.x,z:r.z,yaw:r.yaw};if(p.mode==="deck")occupyShip(actor);if(distance(me,actor)<190){rigs.draw(actor,dt,time,t);ids.add(id);}}rigs.keep(ids);
  const ride=me.mode==="bus",cruise=me.mode==="deck",height=ride?3.58:me.mode==="swim"?floor+1.5:floor+1.37;
  aim.set(me.x,height,me.z);
  if(first){
   if(ride){aim.x+=Math.sin(me.yaw)*4.75;aim.z+=Math.cos(me.yaw)*4.75;}
   cam.position.copy(aim);cam.lookAt(aim.x+Math.sin(pan)*Math.cos(tilt),aim.y-Math.sin(tilt),aim.z+Math.cos(pan)*Math.cos(tilt));
  }else{const d=ride?14:cruise?Math.max(zoom,7):me.mode==="table"?Math.min(3.0,zoom):zoom;
   cam.position.set(aim.x-d*Math.sin(pan)*Math.cos(tilt),Math.max(.32,aim.y+d*Math.sin(tilt)+.5),aim.z-d*Math.cos(pan)*Math.cos(tilt));cam.lookAt(aim);}
  const age=showAge(time,boat.festival),hour=(new Date(time).getUTCHours()+9)%24;
  night+=((age>=0&&coastSide()||hour<6||hour>=19?1:0)-night)*(1-Math.exp(-dt*1.35));
  hemi.intensity=2.05-night*1.54;sun.intensity=1.95-night*1.66;sky.sky.position.copy(cam.position);sky.uniforms.night.value=night;shorelineLights(night);water.night.value=night;water.uTime.value=t;
  scene.fog.color.setHex(0xbfd5df).lerp(new T.Color(0x263348),night);fx.update(age,me,t,canvas.height);
  for(let i=0;i<grillProps.length;i++){const s=grills.get(i);for(const shell of grillProps[i]){shell.g.visible=!!s;if(s)shell.top.rotation.x=-clamp((time-s-4400)/2200,0,1)*1.15;}}
  if(ms-uiAt>125){hud();guide.update(pan);uiAt=ms;}if(ms-savedAt>2300){save();savedAt=ms;}
  renderer.render(scene,cam);requestAnimationFrame(frame);
 }
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(canvas);resize();requestAnimationFrame(frame);
}
