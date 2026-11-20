import * as T from "three";
import {beachParasols} from "./coast-beach-seats.js";
import {cafeBackdrop} from "./pohang-cafe-site.js";
import {profileRows,sandCrest,seabedStops} from "./pohang-beach-profile.js";
import {buildBeachFront,plantedSpot} from "./pohang-beach-front.js";
import {buildBeachAmenities} from "./beach-amenities-model.js";
import {buildCoastalRetail} from "./coast-retail-model.js";
import {buildPohangStation,buildCoastMarket,buildWaterfrontCafe} from "./pohang-station-model.js";
import {buildTavernFront} from "./coast-tavern-model.js";
import {tavernBlockIndex,tavernEdge,tavernPoint} from "./coast-tavern-layout.js";
import {buildYeongildae} from "./pohang-pavilion-model.js";
import {buildFestivalBooth} from "./pohang-festival-site-model.js";

import {hill,hillFloor,parkRoad} from "./space-walk-layout.js";
import {makeTreeBuilder,treePalettes} from "./lowpoly-trees.js";
import {geo,shore,promenade,beachStop,boardRack,pier,pavilion,dock,mooring,segmentDistance} from "./pohang-layout.js";
const boxGeo=new T.BoxGeometry(),ovalGeo=new T.SphereGeometry(1,14,9),tubeGeo=new T.CylinderGeometry(1,1,1,12),coneGeo=new T.ConeGeometry(1,1,12),mats=new Map();
function mat(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.76}));return mats.get(color);}
export function part(parent,g,color,x,y,z,w,h,d){
 const mesh=new T.Mesh(g,typeof color==="object"?color:mat(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
}
const box=(...a)=>part(a[0],boxGeo,...a.slice(1)),oval=(...a)=>part(a[0],ovalGeo,...a.slice(1)),post=(...a)=>part(a[0],tubeGeo,...a.slice(1));
function rod(parent,a,b,r,color){
 const va=new T.Vector3(...a),vb=new T.Vector3(...b),m=post(parent,color,...va.clone().lerp(vb,.5).toArray(),r,va.distanceTo(vb),r);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return m;
}
function sign(parent,text,x,y,z,w,h,background="#184748",angle=0){
 const c=document.createElement("canvas");c.width=768;c.height=144;const ctx=c.getContext("2d");
 ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#fff5d9";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 83px sans-serif";ctx.fillText(text,384,76,734);
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tx}));m.position.set(x,y,z);m.rotation.y=angle;parent.add(m);
 const rear=m.clone();rear.rotation.y+=Math.PI;rear.translateZ(.013);parent.add(rear);return m;
}
function ribbon(parent,a,b,color){
 const v=[],ix=[];for(let i=0;i<a.length;i++){v.push(...a[i],...b[i]);if(i){const n=2*i;ix.push(n-2,n-1,n,n-1,n+1,n);}}
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.9}));parent.add(m);return m;
}
function street(parent,a,b,w,h,y,color){
 const len=Math.hypot(a.x-b.x,a.z-b.z),m=box(parent,color,(a.x+b.x)/2,y,(a.z+b.z)/2,w,h,len+.06);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);return m;
}
function consolidate(root){
 root.updateMatrixWorld(true);const groups=new Map(),items=[];
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.material.map||o.geometry.type==="BufferGeometry")return;
 const k=o.geometry.uuid+o.material.uuid;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o);});
 for(const meshes of groups.values()){
  if(meshes.length<3)continue;
  const batch=new T.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);
  meshes.forEach((o,i)=>{batch.setMatrixAt(i,o.matrixWorld);items.push(o);});root.add(batch);
 }
 for(const m of items)m.removeFromParent();
}
function facades(root){
 const chunks=new Map();
 for(const block of [...geo.blocks,cafeBackdrop]){const ring=block[1];
  const cx=ring.reduce((v,p)=>v+p[0],0)/ring.length,cz=ring.reduce((v,p)=>v+p[1],0)/ring.length;
  if(Math.hypot(cx-pavilion.x,cz-pavilion.z)<32||cx>shore(cz)-.5)continue;
  const key=Math.floor(ring[0][0]/250)+","+Math.floor(ring[0][1]/250);
  if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(block);}
 const surface=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide});
 for(const blocks of chunks.values()){
 const pos=[],colors=[];const palette=[0xd8c6aa,0xecdfd1,0xabb9bc,0xae9e91,0xbbb9a9].map(n=>new T.Color(n)),glass=new T.Color(0x526f79);
 function quad(a,b,c,d,col){for(const p of [a,b,c,a,c,d]){pos.push(...p);colors.push(col.r,col.g,col.b);}}
 for(let j=0;j<blocks.length;j++){
  const [h,ring]=blocks[j];if(ring.length<3)continue;const col=palette[j%5],top=1.85+h;
  const vs=ring.map(([x,z])=>new T.Vector2(x,z));
  for(const [a,b,c] of T.ShapeUtils.triangulateShape(vs,[]))quad([vs[a].x,top,vs[a].y],[vs[b].x,top,vs[b].y],[vs[c].x,top,vs[c].y],[vs[c].x,top,vs[c].y],col);
  for(let i=0;i<ring.length;i++){const [x,z]=ring[i],[u,v]=ring[(i+1)%ring.length];const groundOpening=ring===geo.blocks[tavernBlockIndex][1]&&i===tavernEdge;const sill=groundOpening?5.68:1.84;quad([x,sill,z],[u,sill,v],[u,top,v],[x,top,z],col);
   const len=Math.hypot(u-x,v-z);if(len<3)continue;const n=Math.min(18,Math.max(1,Math.floor(len/3.7)));
   for(let y=groundOpening?6.65:3.3;y+1.45<top;y+=3.35)for(let k=0;k<n;k++){
    const a=(k+.14)/n,b=(k+.84)/n,dx=(v-z)/len*.035,dz=(x-u)/len*.035;
    // Both sides of arbitrarily wound OSM outlines share the same window band.
    for(const side of [1,-1]){const X=x+dx*side,Z=z+dz*side;quad([X+(u-x)*a,y,Z+(v-z)*a],[X+(u-x)*b,y,Z+(v-z)*b],[X+(u-x)*b,y+1.45,Z+(v-z)*b],[X+(u-x)*a,y+1.45,Z+(v-z)*a],glass);}
   }
  }
 }
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
 root.add(new T.Mesh(g,surface));
 }
}
export function buildCoast(scene){
 const root=new T.Group();scene.add(root);const zList=[...new Set([...Array.from({length:171},(_,i)=>-3700+i*32),...profileRows,...geo.beach.map(p=>p[1]),...geo.pier.map(p=>p[1])])].sort((a,b)=>a-b);
 const row=(x,y)=>zList.map(z=>[x(z),y,z]);
 ribbon(root,row(()=>-6100,1.85),row(z=>promenade(z)+4,1.85),0x9da88a);
 const sand=ribbon(root,zList.map(z=>[promenade(z)+4,sandCrest(z),z]),row(z=>shore(z),-.18),0xc4ab83);
 sand.material.onBeforeCompile=shader=>{
  shader.vertexShader="varying vec3 beachPos;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nbeachPos=position;");
  shader.fragmentShader="varying vec3 beachPos;\n"+shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
   float wet=1.-smoothstep(-.10,.52,beachPos.y+.052*sin(beachPos.z*.14)+.037*sin(beachPos.z*.51));
   float grain=fract(sin(dot(floor(beachPos.xz*28.),vec2(32.61,13.27)))*24817.3);
   float ripples=sin(beachPos.x*3.9+beachPos.z*.93+sin(beachPos.z*.79))*sin(beachPos.x*2.1+beachPos.z*.55);
   float detail=1.-smoothstep(2.,26.,length(cameraPosition.xz-beachPos.xz));
   diffuseColor.rgb*=mix(vec3(1.03,.98,.90),vec3(.52,.56,.51),wet)*(.98+detail*((grain-.5)*.13+.035*ripples));`);
 };
 // Continuous seabed colour through the wading zone; the water transmits these colours.
 const bedStops=seabedStops;
 const verts=[],tints=[],faces=[];
 for(let j=0;j<zList.length;j++)for(let i=0;i<bedStops.length;i++){
  const [off,h,color]=bedStops[i],z=zList[j],c=new T.Color(color);
  verts.push(shore(z)+off,h,z);tints.push(c.r,c.g,c.b);
  if(i&&j){const n=j*bedStops.length+i,m=n-bedStops.length;faces.push(n-1,n,m,n-1,m,m-1);}
 }
 const bed=new T.BufferGeometry();bed.setAttribute("position",new T.Float32BufferAttribute(verts,3));bed.setAttribute("color",new T.Float32BufferAttribute(tints,3));
 bed.setIndex(faces);bed.computeVertexNormals();root.add(new T.Mesh(bed,new T.MeshStandardMaterial({vertexColors:true,roughness:.94,side:T.DoubleSide})));
 buildBeachFront(root,zList,{box,post});
 facades(root);
 let seed=9423;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const green=new T.Group();green.position.y=1.85;root.add(green);
 const trees=makeTreeBuilder(T,green,{rand:random,clearance:{meshFits:()=>true,trim:()=>true}});
 for(let z=-814;z<268;z+=32){
  const site=plantedSpot(z);if(!site||Math.abs(z+805)<6)continue;const {x}=site;
  trees.grow(x,z,{height:4.8+random()*1.8,spread:3.9+random()*1.5,palette:treePalettes.pine,style:random()<.6?"cloud":"branchy"});
 }
 // Terraced woodland frames the open central clearing and the coastal footpath.
 for(let i=0;i<92;i++){
  const angle=i*2.39996,r=43+random()*86,x=hill.x+Math.cos(angle)*r,z=hill.z+Math.sin(angle)*r*.69;
  if(Math.abs(x-hill.x)<34&&Math.abs(z-hill.z)<33)continue;
  if(parkRoad.some((p,j)=>j&&segmentDistance({x,z},parkRoad[j-1],p)<9))continue;
  const first=green.children.length;
  trees.grow(x,z,{height:3.5+random()*4.7,spread:3.0+random()*3.4,palette:treePalettes.pine,style:i%3?"cloud":"branchy"});
  for(let k=first;k<green.children.length;k++)green.children[k].position.y+=hillFloor({x,z})-green.position.y-.07;
 }
 const architecture={box,post,oval,rod,sign,street};
 const updateRinses=buildBeachAmenities(root,architecture);
 buildCoastalRetail(root,architecture);
 buildPohangStation(root,architecture);buildWaterfrontCafe(root,architecture);buildCoastMarket(root,architecture);buildFestivalBooth(root,architecture);
 const pavilionLights=buildYeongildae(root,architecture);
 street(root,{x:promenade(dock.z),z:dock.z},dock,4.4,.45,1.62,0xa07b57);
 for(let x=promenade(dock.z)+2;x<=dock.x;x+=5)for(const z of [dock.z-1.8,dock.z+1.8])post(root,0x64594b,x,.52,z,.15,2.7,.15);
 sign(root,"영일만 크루즈",promenade(dock.z)+4,3.05,dock.z-2.3,3.1,.49,"#31515b",Math.PI/2);
 for(let i=0;i<5;i++){const s=surfboard(i);s.position.set(boardRack.x+i*.56,3.04,boardRack.z);s.rotation.x=1.36;root.add(s);}
 sign(root,"서핑보드 대여",boardRack.x,3.95,boardRack.z,3.8,.6);
 buildTavernFront(root,architecture);
 const chairCount=beachParasols.reduce((n,p)=>n+p.chairs.length,0);
 const seatPads=new T.InstancedMesh(boxGeo,mat(0xe2c99b),chairCount);
 const seatBacks=new T.InstancedMesh(boxGeo,mat(0xc6ad81),chairCount);
 const seatLegs=new T.InstancedMesh(boxGeo,mat(0x826d54),chairCount*4);
 const chairPart=new T.Object3D();
 function placeChairPart(mesh,index,x,y,z,w,h,d,tilt=0){
  chairPart.position.set(x,y,z);chairPart.scale.set(w,h,d);chairPart.rotation.z=tilt;
  chairPart.updateMatrix();mesh.setMatrixAt(index,chairPart.matrix);
 }
 let chairIndex=0,legIndex=0;
 for(const {index:i,x,z,floor:base,chairs} of beachParasols){
  post(root,0x80654d,x,base+1.24,z,.042,2.48,.042);
  const shades=[0xdca674,0x759c95,0xd58475],edge=i%3;
  for(let k=0;k<10;k++){
   const a=k*Math.PI/5,b=(k+1)*Math.PI/5,r=1.74,va=[x,base+2.74,z,x+Math.sin(a)*r,base+2.2,z+Math.cos(a)*r,x+Math.sin(b)*r,base+2.2,z+Math.cos(b)*r];
   const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(va,3));g.computeVertexNormals();
   const m=mat(k%2?shades[edge]:0xe8d8b7);m.side=T.DoubleSide;root.add(new T.Mesh(g,m));
  }
  post(root,0xaf825b,x,base+.65,z,.58,.075,.58);
  for(const {x:cx,z:cz,floor,top} of chairs){
   placeChairPart(seatPads,chairIndex,cx,top-.045,cz,.61,.09,.59);
   placeChairPart(seatBacks,chairIndex++,cx-.31,top+.24,cz,.085,.57,.59,.13);
   for(const side of [-1,1])for(const end of [-1,1]){
    placeChairPart(seatLegs,legIndex++,cx+.23*end,floor+.225,cz+.24*side,.045,.48,.045,end*.11);
   }
  }
  post(root,0x87b8b5,x+.19,base+.78,z+.16,.051,.17,.051);
 }
 root.add(seatPads,seatBacks,seatLegs);
 // Industrial silhouette across the bay, seen behind the moving water.
 for(let i=0;i<33;i++){const x=440+i*28,z=680+Math.sin(i)*29;
  box(root,i%3?0x8d9b9d:0xb1a29a,x,6,z,18+i%7,12+i%9,17);post(root,0x8d8281,x+8,15+i%9,z,1.2,34+i%14,1.2);post(root,0xc99579,x+8,28+i%9,z,1.23,3,1.23);}
 consolidate(root);
 const lamps=[],colors=[];
 const dot=(x,y,z,c)=>{lamps.push(x,y,z);const col=new T.Color(c);colors.push(col.r,col.g,col.b);};
 for(let z=-814;z<268;z+=96){const site=plantedSpot(z);if(site)dot(site.x+1.27,6.09,z,0xffda96);}
 for(let i=-3;i<=3;i++){const p=tavernPoint(i,3.65);dot(p.x,4.64,p.z,0xffce80);}
 for(let i=0;i<130;i++)dot(360+i*8.6,3+(i%6===0?17:0),680+Math.sin(i)*25,i%8?0xffd28b:0xd69173);
 const lp=new T.BufferGeometry();lp.setAttribute("position",new T.Float32BufferAttribute(lamps,3));lp.setAttribute("color",new T.Float32BufferAttribute(colors,3));
 const disk=document.createElement("canvas");disk.width=disk.height=32;const ctx=disk.getContext("2d"),fade=ctx.createRadialGradient(16,16,0,16,16,16);
 fade.addColorStop(0,"#fff");fade.addColorStop(.18,"rgba(255,245,224,.8)");fade.addColorStop(1,"rgba(255,238,200,0)");ctx.fillStyle=fade;ctx.fillRect(0,0,32,32);
 const lightMat=new T.PointsMaterial({map:new T.CanvasTexture(disk),size:.52,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
 scene.add(new T.Points(lp,lightMat));return (night,players=[],clock=0)=>{lightMat.opacity=.08+night*.92;pavilionLights(night);updateRinses(players,clock);};
}
export function surfboard(index=0){
 const g=new T.Group();oval(g,[0xf3b76d,0x58b8ae,0xe28680][index%3],0,0,0,.37,.088,1.2);
 oval(g,0xf6eee0,0,.048,0,.075,.054,1.12);return g;
}
export function busModel(){
 const g=new T.Group();box(g,0x317b96,0,1.35,0,2.65,2.3,9);
 box(g,0xf2e8cf,0,2.72,0,2.7,.31,9.06);
 for(const s of [-1,1]){for(let k=0;k<7;k++)box(g,0x53808c,s*1.335,1.92,-3.72+k*1.22,.035,.97,1.03);
  for(const z of [-2.85,2.85]){const m=post(g,0x303a3c,s*1.25,.53,z,.48,.32,.48);m.rotation.z=Math.PI/2;}}
 box(g,0x587e88,0,1.88,4.51,2.36,1.02,.04);sign(g,"포항역 ↔ 영일대",0,2.53,4.54,2.11,.3);
 for(const s of [-1,1])box(g,0xffe9ae,.93*s,.78,4.52,.4,.15,.05);return g;
}
export {makeCruise as cruiseModel} from "./pohang-cruise.js";
