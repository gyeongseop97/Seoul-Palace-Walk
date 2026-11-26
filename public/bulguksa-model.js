import * as T from "three";
import {districtMeshes,localFrame,randomSeed,registerDistrictLod} from "./gyeongju-mesh.js";
import {nearbyConstruction} from "./gyeongju-construction.js";
import {bridgeMasonry,archStones} from "./bulguksa-stone.js";
import {templeHallTerraces} from "./bulguksa-hall-layout.js";
import {drawBulguksaHall,timberWindow} from "./bulguksa-halls.js";
import {drawGabledRoof} from "./bulguksa-roof.js";
import {templeCorridors} from "./bulguksa-cloisters.js";
import {roof,buildingFrame} from "./gyeongju-architecture.js";
import {busShelter} from "./gyeongju-landmarks.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {templeAxis,templePaths,templeHalls,templePonds,templeCourtBounds,templePagodas,templeSites,stoneStairs,stairStepHeight,templeHeight,templePlantings} from "./bulguksa-layout.js";
import {groundU,groundV,groundHeightAt,drapeGround,drapePath} from "./bulguksa-ground.js";

const stone=0xb4ab99,tile=0x485458,timber=0x8e4937,green=0x496c58,sand=0xc9b391;
function groundFace(k,color,surface,offset){
 return (ring,indices)=>k.face(ring.map(({u,v})=>{
  const p=templeAxis(u,v);return [p.x,groundHeightAt(u,v)+offset,p.z];
 }),indices,color,surface);
}
function ribbon(k,path){
 const steps=path.kind==="steps";
 drapePath(path,groundFace(k,steps?stone:sand,steps?"pavers":"dirt",.014));
}
function hall(k,b){
 const frame=buildingFrame(b.points);
 const {x,z,width:w,depth:d,yaw}=frame,at=localFrame(x,z,yaw),h=templeHeight({x,z});
 const gate=b.kind==="gatehouse",eave=gate?4.1:3.25;
 const bays=b.name==="무설전"?8:Math.max(2,Math.min(5,Math.round(w/3)));
 k.piece(x,h+.10,z,w*.96,.20,d*.95,stone,yaw);
 if(!gate){
  k.piece(x,h+eave*.46,z,w*.88,eave*.88,d*.84,0xd0b78d,yaw);
  for(const side of [-1,1])for(let i=0;i<bays;i++){
   const door=at((i+.5-bays/2)*w*.86/bays,side*d*.425),panelW=w*.74/bays;
   k.piece(door.x,h+eave*.45,door.z,panelW,eave*.70,.12,green,yaw);
   for(const sign of [-1,1]){
    const panel=at((i+.5-bays/2)*w*.86/bays+sign*panelW*.247,side*(d*.425+.072));
    timberWindow(k,panel.x,h+eave*.45,panel.z,panelW*.46,eave*.68,side>0?yaw:yaw+Math.PI);
   }
  }
 }
 for(const side of [-1,1])for(let i=0;i<=bays;i++){
  if(gate&&i!==0&&i!==bays&&Math.abs(i/bays-.5)<.26)continue;
  const p=at((i/bays-.5)*w*.87,side*d*.39);
  k.column(p.x,h+.13,p.z,.46,.22,.46,stone);
  k.column(p.x,h+eave*.48,p.z,.29,eave*.96,.29,timber);
  k.piece(p.x,h+eave-.18,p.z,1.0,.26,.86,green,yaw);
 }
 for(const [dy,col] of [[-.27,green],[.0,timber],[.14,0x467c70]])k.piece(x,h+eave+dy,z,w+.3,.15,d+.24,col,yaw);
 if(b.name==="무설전"||b.name==="나한전"||b.name==="불국사 종무소")drawGabledRoof(k,x,h+eave+.26,z,w+1.35,Math.min(d*.33,4.3),d+1.45,yaw);
 else roof(k,x,h+eave+.26,z,w+1.35,Math.min(d*.33,4.3),d+1.45,yaw,tile);
}
function* gallery(k,spans){
 for(const {u,v,w,height:h,yaw,columns,front,outside} of spans){
  const {x,z}=templeAxis(u,v);
  drawGabledRoof(k,x,h+2.8,z,w+.25,1.25,5.0,yaw);
  const at=localFrame(x,z,yaw);
  for(const side of [-1,1]){
   const p=at(0,side*1.72);
   k.piece(p.x,h+2.62,p.z,w,.23,.25,0x596f60,yaw);
   k.piece(p.x,h+2.76,p.z,w,.09,.30,0xaa6d4f,yaw);
  }
  for(let col=0;col<columns;col++)for(const side of [-1,1]){
   const p=at((col/columns-.5)*w,side*1.72);k.column(p.x,h+1.36,p.z,.22,2.72,.22,timber);
   k.column(p.x,h+.12,p.z,.41,.22,.41,stone);
   k.piece(p.x,h+2.53,p.z,.65,.13,.47,0x917855,yaw);
   // South gallery windows face the bridges. Leave a ground-level opening in alternate bays.
   if(front&&side===outside&&col%2===0){
    const span=w/columns,mid=((col+.5)/columns-.5)*w,q=at(mid,side*1.72);
    k.piece(q.x,h+.69,q.z,span-.18,1.21,.11,0xcbb385,yaw);
    k.piece(q.x,h+1.34,q.z,span-.13,.13,.17,0x8f6347,yaw);
    for(let m=1;m<9;m++){
     const slat=at(mid+(m/9-.5)*span,side*1.72);
     k.piece(slat.x,h+1.96,slat.z,.057,1.14,.09,0x735949,yaw);
    }
   }
  }
  yield;
 }
}
function* stoneBridges(k){
 const {put,stone:block,post,railSection}=bridgeMasonry(k);
 for(const flight of stoneStairs){
  const {u,width:w,north:start,south:end,count:n,upper}=flight,d=end-start;
  const east=flight.name==="청운교"||flight.name==="백운교";
  const joint=upper?end:start,radius=east?2.05:1.35,rise=east?1.65:1.2;
  const tread=d/n,stepH=(flight.top-flight.bottom)/n,spine=east?.49:.35;
  const sideSpan=(w-spine)/2;
  for(let i=0;i<n;i++){
   const v=start+(i+.5)*tread,top=stairStepHeight(flight,v);
   const underside=Math.min(top-.09,rise*Math.sqrt(Math.max(0,1-((v-joint)/radius)**2)));
   const slab=Math.min(stepH+.03,top-underside),base=top-slab;
   if(base-underside>.008)block(u,(base+underside)/2,v,w-.018,base-underside,tread+.004,i+2);
   for(const side of [-1,1]){
    block(u+side*(w+spine)/4,top-slab/2,v,sideSpan-.012,slab,tread-.009,i+(side+1));
   }
   // A separate central stringer divides the flights. Its crowns follow the simulated foot height.
   block(u,top-slab/2,v,spine-.009,slab,tread-.009,upper?2:0);
  }
  if(upper){
   for(const lane of [-1,0,1])block(u+lane*w/3,flight.top-.12,(20+start)/2,w/3-.015,.24,start-20,1+lane);
  }
  const bays=upper?1:2;
  const v1=start+d/bays,y1=flight.top+(flight.bottom-flight.top)/bays;
  const handrail=railSection(start,v1,flight.top,y1,.205,.225,true);
  const coping=railSection(start,v1,flight.top,y1,.37,.22,false);
  for(const side of [-1,1]){
   const edge=u+side*(w/2+.19);
   for(let i=0;i<=bays;i++){
    const t=i/bays,v=start+d*t,y=flight.top+(flight.bottom-flight.top)*t;
    if(upper||i>0)post(edge,y,v,i===0||i===bays);
    if(i===bays)break;
    const midY=y+(flight.bottom-flight.top)/(2*bays),midV=v+d/(2*bays);
    put(coping,edge,midY+.08,midV,1,1,1,0xe4e0d8);
    put(handrail,edge,midY+.75,midV,1,1,1,0xf5f4ee);
    post(edge,midY,midV,false);
   }
  }
  if(!upper){
   const arch=archStones(radius,rise);
   for(const side of [-1,1])put(arch,u+side*(w/2+.018),0,joint,1,1,1,0xf8f6ef);
  }
  yield;
 }
 // The two courtyards stand on a stone terrace above the southern forecourt.
 for(const [start,end] of [[-69,-50],[-43,-5],[4,27]]){
  for(let j=0;j<5;j++){
   const span=j<2?1.26:2.17;
   for(let u=start,i=0;u<end-.025;i++){
    const width=Math.min(end-u,i===0&&j%2?span*.54:span*(1+.15*Math.sin(i*17+j*39)));
    const h=templeHeight(templeAxis(u+width/2,20));
    block(u+width/2,(j+.5)*h/5,21.3,width-.018,h/5-.018,1.55,i+j*3);
    u+=width;
   }
  }
  for(let u=start;u<end;u+=2.6){
   const width=Math.min(2.6,end-u),h=templeHeight(templeAxis(u+width/2,20));
   block(u,h*.69,21.95,.32,h*.61,.42,1);
   block(u+width/2,h+.04,21.3,width-.016,.23,1.77);
   block(u+width/2,h*.38,21.3,width-.016,.22,1.73,4);
  }
  yield;
 }
 const pavilion=templeAxis(-24,21),h=templeHeight(templeAxis(-24,20));
 for(const side of [-1,1]){
  const foot=templeAxis(-24+side*2.15,24.3);
  for(let j=0;j<11;j++)block(-24+side*2.15,(j+.5)*h/11,24.3,j%2?1.15:1.52,h/11-.012,1.46,j);
  k.column(foot.x,h+1.33,foot.z,.38,2.66,.38,timber);
 }
 k.piece(pavilion.x,h+.07,pavilion.z,6.55,.29,7.35,0x876c50,.15);
 roof(k,pavilion.x,h+2.74,pavilion.z,7.05,2.22,7.85,.15,tile);
}
function pagodaFallback(k,p,dabo){
 const h=templeHeight(p),part=(base,w,height,offset=0)=>k.piece(p.x,h+base+height/2,p.z,w,height,w,stone,.15+offset);
 part(0,5.4,.43);part(.43,4.75,.52);part(.95,4.3,.8);part(1.75,4.85,.25);
 if(dabo){
  for(const side of [-1,1])for(const end of [-1,1])k.column(p.x+side*1.35,h+3.17,p.z+end*1.35,.5,2.35,.5,stone);
  part(4.34,4.12,.42);part(4.76,2.85,.38,Math.PI/4);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4;k.column(p.x+Math.cos(a)*1.27,h+5.82,p.z+Math.sin(a)*1.27,.24,1.39,.24,stone);
  }
  part(6.5,2.75,.34,Math.PI/4);part(6.84,1.52,1.25);part(8.09,2.18,.38,Math.PI/4);
 }else{
  let y=2;
  for(const [w,height] of [[2.9,2.12],[2.3,1.25],[1.72,1.0]]){
   part(y,w,height);y+=height;
   for(let j=0;j<5;j++){part(y,w+.2+j*.16,.067);y+=.067;}
   part(y,w+1.04,.18);y+=.18;part(y,w+.35,.12);y+=.12;
  }
  for(const [width,height] of [[1.02,.38],[.63,.37],[.84,.31],[.47,.35],[.63,.26],[.31,.34],[.46,.19],[.18,.24]]){
   k.column(p.x,h+y+height/2,p.z,width,height,width,stone);y+=height;
  }
  const tip=10.75-y;k.column(p.x,h+y+tip/2,p.z,.11,tip,.11,stone);return;
 }
 for(const [base,width,height] of [[8.48,1.05,.49],[8.97,.7,.66],[9.63,.29,.66]])k.column(p.x,h+base+height/2,p.z,width,height,width,stone);
}
export function* buildBulguksa(k,eye,drawPond){
 const rng=randomSeed(10763);
 const tasks=nearbyConstruction(eye,k);
 const us=groundU,vs=groundV;
 for(let i=1;i<us.length;i++)for(let j=1;j<vs.length;j++){
  const corners=[[us[i-1],vs[j-1]],[us[i],vs[j-1]],[us[i],vs[j]],[us[i-1],vs[j]]];
  k.face(corners.map(([u,v])=>{const p=templeAxis(u,v);return [p.x,groundHeightAt(u,v),p.z];}),[0,1,2,0,2,3],0x969f6a,"grass");
 }
 for(const [left,top,right,bottom] of templeCourtBounds){
  drapeGround([templeAxis(left,top),templeAxis(right,top),templeAxis(right,bottom),templeAxis(left,bottom)],groundFace(k,sand,"dirt",.007));
 }
 yield* k.finishSteps();
 tasks.add(templeSites[0],()=>busShelter(k,templeSites[0],-.42,"불국사"));
 for(const path of templePaths)tasks.add(path.points[0],()=>ribbon(k,path));
 for(const b of templeHalls)tasks.add(b.points[0],()=>{
  const main=templeHallTerraces.find(hall=>hall.id===b.id);
  if(main)return drawBulguksaHall(k,main);
  if(templeCorridors.has(b.id))return gallery(k,templeCorridors.get(b.id));
  else hall(k,b);
 });
 tasks.add(templeSites[4],()=>stoneBridges(k));
 function* garden(){
  for(const pond of templePonds){drawPond(k,pond,rng);yield;}
  let trunkGround=0;
  const trees=makeTreeBuilder(T,null,{snapshotPart(mesh){mesh.position.y+=trunkGround;k.treePart(mesh);},registerCrownLod:registerDistrictLod,rand:rng,
   clearance:{meshFits:()=>true,trim:()=>true}});
  for(const tree of templePlantings().trees){
   yield;
   trunkGround=templeHeight(tree);
   trees.grow(tree.x,tree.z,tree);
  }
 }
 yield* tasks.assemble(garden());
}
export function createBulguksaPagodas(root,kit){
 const statues=templePagodas.map((p,i)=>{
  const fallback=new T.Group(),meshKit=districtMeshes(fallback);pagodaFallback(meshKit,p,i===0);meshKit.finish();root.add(fallback);
  return {p,fallback,model:null,near:false,pending:false,tried:false};
 });
 return eye=>{
  for(const entry of statues){
   const {p,fallback}=entry;
   if(!p.file)continue;
   const near=Math.hypot(p.x-eye.x,p.z-eye.z)<(entry.near?150:125);
   if(entry.near!==near){
    entry.near=near;
    if(!near)entry.tried=false;
    if(entry.model){entry.model.visible=near;fallback.visible=!near;kit.refreshShadows?.();}
   }
   if(!near||entry.model||entry.pending||entry.tried||!kit.loadGltf)continue;
   entry.pending=entry.tried=true;
   kit.loadGltf("./art/"+p.file+".glb").then(({scene})=>{
    const bounds=new T.Box3().setFromObject(scene),height=bounds.max.y-bounds.min.y;
    if(!(height>0))return;
    const verticalScale=p.height/height;
    scene.scale.y*=verticalScale;
    scene.position.set(p.x,templeHeight(p)-bounds.min.y*verticalScale,p.z);scene.rotation.y=p.yaw;scene.name=p.name;
    scene.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=true;});
    root.add(scene);entry.model=scene;scene.visible=entry.near;fallback.visible=!entry.near;kit.refreshShadows?.();
   }).catch(()=>{}).finally(()=>{entry.pending=false;});
  }
 };
}
