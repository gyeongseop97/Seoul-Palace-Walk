import {martFront} from "./coast-shops.js";
import * as T from "three";
import {buildKtx} from "./ktx-model.js";
import {standSign} from "./regional-stands.js";
import {stationPoint,stationYaw,stationRing,platformRings,hallHeight,platformHeight,plazaHeight,frontDoorLocal,frontStairBase,counterLocal} from "./pohang-station-layout.js";

const steel=0xbac9c9,blue=0x285775,dark=0x52636b,stone=0xc3c2b9;
function surface(parent,ring,y,bottom,color){
 const verts=ring.map(([u,v])=>new T.Vector2(u,v)),positions=[];
 const add=(...points)=>positions.push(...points.flat());
 for(const [a,b,c] of T.ShapeUtils.triangulateShape(verts,[])){
  add([verts[a].x,y,verts[a].y],[verts[b].x,y,verts[b].y],[verts[c].x,y,verts[c].y]);
  if(bottom>2)add([verts[a].x,bottom,verts[a].y],[verts[c].x,bottom,verts[c].y],[verts[b].x,bottom,verts[b].y]);
 }
 for(let i=0;i<ring.length;i++){
  const [x,z]=ring[i],[u,v]=ring[(i+1)%ring.length];
  add([x,y,z],[u,y,v],[u,bottom,v],[x,y,z],[u,bottom,v],[x,bottom,z]);
 }
 return mesh(parent,positions,color);
}
function mesh(parent,positions,color){
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.6}));m.receiveShadow=true;parent.add(m);return m;
}
function group(parent,x,z,yaw=0,y=0){
 const a=new T.Group();a.position.set(x,y,z);a.rotation.y=yaw;parent.add(a);return a;
}
export function buildPohangStation(root,{box,post,rod,sign,street}){
 const center=stationPoint(0,0),st=group(root,center.x,center.z,stationYaw);
 const glass=new T.MeshStandardMaterial({color:0x79a8b6,roughness:.17,metalness:.12,transparent:true,opacity:.28,depthWrite:false});
 const main=[stationRing[0],stationRing[1],...stationRing.slice(4)],bridge=stationRing.slice(1,5);
 const floor=surface(st,main,hallHeight,1.83,0xd6d1c3);
 floor.material.onBeforeCompile=shader=>{
  shader.vertexShader="varying vec3 palaceStationPos;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\npalaceStationPos=position;");
  shader.fragmentShader="varying vec3 palaceStationPos;\n"+shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
    if(palaceStationPos.y>8.59){
     vec2 uv=palaceStationPos.xz/vec2(1.25,.85);
     vec2 d=min(fract(uv),1.-fract(uv))/max(fwidth(uv),vec2(.004));
     float grout=1.-smoothstep(.4,1.25,min(d.x,d.y));
     diffuseColor.rgb*=1.-.17*grout-.023*fract(sin(dot(floor(uv),vec2(9.7,73.8)))*912.6);
    }`);
 };
 surface(st,bridge,hallHeight,hallHeight-.65,0xc3c8c5);
 const roofAt=(u,v)=>hallHeight+7.3+3.7*Math.exp(-1*((u+42)/24)**2)+1.6*Math.cos((u+v*.32)/24)+.018*v;
 const widths=u=>{
  const hits=[];
  for(let i=0;i<main.length;i++){
   const [a,b]=main[i],[x,z]=main[(i+1)%main.length];
   if(u>=Math.min(a,x)&&u<Math.max(a,x))hits.push(b+(z-b)*(u-a)/(x-a));
  }
  return [Math.min(...hits),Math.max(...hits)];
 };
 // The wave silhouette follows the asymmetric footprint instead of filling the forecourt.
 const xs=main.map(p=>p[0]).sort((a,b)=>a-b);
 const slices=[...new Set([...xs,...Array.from({length:32},(_,i)=>xs[0]+(xs.at(-1)-xs[0])*i/31)])].sort((a,b)=>a-b);
 const top=[],fascia=[];
 for(let i=1;i<slices.length;i++){
  const a=slices[i-1]+.001,b=slices[i]-.001;if(b<=a)continue;
  const wa=widths(a),wb=widths(b);
  const row=(x,w,t)=>{const z=w[0]-1.6+(w[1]-w[0]+3.2)*t;return [x,roofAt(x,z)+1.27*Math.sin(t*Math.PI),z];};
  for(let n=0;n<8;n++){
   const A=row(a,wa,n/8),B=row(a,wa,(n+1)/8),C=row(b,wb,(n+1)/8),D=row(b,wb,n/8);
   top.push(...A,...B,...C,...A,...C,...D);
  }
  for(const t of [0,1]){const A=row(a,wa,t),B=row(b,wb,t),C=[B[0],B[1]-.56,B[2]],D=[A[0],A[1]-.56,A[2]];fascia.push(...A,...B,...C,...A,...C,...D);}
 }
 mesh(st,top,0xd5dcdb);mesh(st,fascia,0x879b9f);
 const light=new T.MeshBasicMaterial({color:0xffedca});
 for(let u=-56;u<46;u+=9.6){
  const [near,far]=widths(u);
  const rafter=v=>roofAt(u,v)+1.27*Math.sin(Math.PI*(v-near+1.6)/(far-near+3.2))-.74;
  let prev=near;
  for(let k=1;k<=4;k++){
   const next=near+(far-near)*k/4;
   rod(st,[u,rafter(prev),prev],[u,rafter(next),next],.15,steel);prev=next;
  }
  for(const v of [near+4,far-4])if(v>near&&v<far){
   box(st,dark,u,rafter(v)-.28,v,4.25,.22,.38);
   box(st,light,u,rafter(v)-.42,v,4.08,.075,.28);
  }
 }
 const door=frontDoorLocal;
 for(let i=0;i<stationRing.length;i++){
  if(i===2)continue;
  const [x,z]=stationRing[i],[u,v]=stationRing[(i+1)%stationRing.length],length=Math.hypot(u-x,v-z);
  const crossing=i===1||i===3;
  const edge=group(st,x,z,Math.atan2(u-x,v-z)),bays=Math.ceil(length/3.7),bay=length/bays;
  for(let j=0;j<bays;j++){
   const f=(j+.5)/bays,d=(j+.5)*bay,px=x+(u-x)*f,pz=z+(v-z)*f;
   const height=(crossing?hallHeight+3.85:roofAt(px,pz))-hallHeight;
   const doorway=Math.hypot(px-door.x,pz-door.z)<5.1;
   if(!crossing){
    const center=stationRing.reduce((v,[x,z])=>[v[0]+x/stationRing.length,v[1]+z/stationRing.length],[0,0]);
    const nx=(v-z)/length,nz=(x-u)/length,out=Math.sign((px-center[0])*nx+(pz-center[1])*nz)||1;
    box(edge,0x879ba1,out*.11,plazaHeight+2.75,d,.25,3.2,bay-.18);
    box(edge,0x4d6670,out*.25,plazaHeight+2.62,d,.095,2.48,bay-.47);
    box(edge,steel,out*.34,plazaHeight+2.65,d,.12,2.5,.075);
    box(edge,0xb3b7b0,out*.16,plazaHeight+.87,d,.30,.41,bay);
   }
   if(!doorway){
    box(edge,glass,0,hallHeight+height*.49,d,.12,height*.97,bay-.06);
    box(edge,steel,0,hallHeight+.49,d,.2,.84,bay);
    box(edge,steel,0,hallHeight+height*.54,d,.2,.094,bay);
    box(edge,dark,0,hallHeight+height*.5,d-bay/2,.2,height,.13);
   }else{
    box(edge,blue,0,hallHeight+3.7,d,.3,.45,bay+.02);
    if(height>4)box(edge,glass,0,hallHeight+(height+4)*.5,d,.14,height-4,bay);
   }
   if(crossing)box(edge,steel,0,hallHeight+height-.13,d,.44,.35,bay+.02);
  }
 }
 surface(st,bridge,hallHeight+4.04,hallHeight+3.78,0xd1d7ce);
 for(const v of [-17,-40,-59]){
  const u=6+v*.09;
  for(const side of [-1,1])box(st,0x9aaba8,u+side*4.4,(1.85+hallHeight-.68)/2,v,.74,hallHeight-2.48,.74);
 }
 const stairRun=Math.hypot(frontStairBase.x-door.x,frontStairBase.z-door.z);
 const front=group(st,frontStairBase.x,frontStairBase.z,Math.atan2(door.x-frontStairBase.x,door.z-frontStairBase.z));
 for(let i=0;i<36;i++){
  const dz=stairRun/36,rise=(i+1)*(hallHeight-plazaHeight)/36;
  box(front,stone,0,plazaHeight+rise/2,(i+.5)*dz,9,rise,dz+.004);
 }
 for(const side of [-1,1]){
  for(let k=0;k<=6;k++)post(front,steel,4.45*side,plazaHeight+.58+(hallHeight-plazaHeight)*k/6,stairRun*k/6,.06,1.12,.06);
  rod(front,[side*4.45,plazaHeight+1.12,0],[side*4.45,hallHeight+1.12,stairRun],.073,steel);
 }
 // A projecting steel canopy and the corner entrance align with the mapped public door.
 box(front,0xb1c0be,0,hallHeight+4.15,stairRun-2.9,12.3,.36,7.4);
 for(const x of [-5.3,5.3])post(front,steel,x,(hallHeight+4.15+plazaHeight)/2,stairRun-5.75,.17,hallHeight+4.15-plazaHeight,.17);
 box(front,blue,0,hallHeight+4.45,stairRun-6.59,12.4,1.28,.25);
 sign(front,"포항역   POHANG",0,hallHeight+4.46,stairRun-6.75,12.2,1.19,"#31546b",Math.PI);
 const outer=stationPoint(frontStairBase.x,frontStairBase.z);
 street(root,outer,{x:-3200,z:-1927},11,.08,plazaHeight+.045,0xc6c3b8);
 for(const side of [-1,1]){
  box(front,0xb9b6aa,side*6,plazaHeight+.2,-1.2,1.09,.40,4.65);
  box(front,0x648064,side*6,plazaHeight+.52,-1.2,.89,.43,4.42);
 }
 box(front,dark,7,plazaHeight+1.42,1.7,1.62,2.84,.22);
 sign(front,"포항역",7,plazaHeight+2.2,1.56,1.53,.61,"#31546b",Math.PI);
 sign(front,"KTX  ↑",7,plazaHeight+1.49,1.56,1.52,.46,"#31546b",Math.PI);
 // Ticketing, information and waiting seats stay on the circulation level of the station.
 const tactile=[[frontDoorLocal.x,frontDoorLocal.z],[-43,18],[5.8,18],[5.8,.5],[.5,-62.5]];
 for(let i=1;i<tactile.length;i++){
  const [x,z]=tactile[i-1],[u,v]=tactile[i];
  street(st,{x,z},{x:u,z:v},.48,.016,hallHeight+.009,0xc6aa65);
 }
 for(const u of [-37,-26,-15,-4,18,29]){
  for(const v of [7,29]){
   if((u<0&&v===7)||u===-15&&v===29)continue;
   for(let j=0;j<3;j++){
    const x=u+j*.9;box(st,dark,x,hallHeight+.46,v,.82,.12,.75);
    box(st,0x7c9aa1,x,hallHeight+.85,v+.29,.79,.69,.09);
    for(const dv of [-.19,.19])box(st,steel,x,hallHeight+.21,v+dv,.12,.42,.16);
   }
  }
 }
 const shop=group(st,counterLocal.x,counterLocal.z,Math.PI);
 box(shop,0x557266,0,hallHeight+1.51,-1.58,6.4,3.02,2.3);
 box(shop,0xb6a386,0,hallHeight+.52,-.15,6.45,1.02,.8);
 box(shop,0xddd0ac,0,hallHeight+1.06,-.1,6.62,.12,.95);
 box(shop,blue,0,hallHeight+2.91,-.34,6.82,.2,1.6);
 sign(shop,"포항역 편의점",0,hallHeight+2.58,-.15,4.9,.64,"#426957");
 for(let j=0;j<9;j++)box(shop,[0xb77658,0xcdb36b,0x857f97][j%3],(j-4)*.43,hallHeight+1.28,-.21,.31,.35,.2);
 for(const u of [-34,-31.8,-29.6]){
  box(st,0x476878,u,hallHeight+.82,36,1.1,1.64,.66);
  box(st,0xaac5c5,u,hallHeight+1.18,35.64,.81,.43,.06);
 }
 // Two surveyed island platforms and the Donghae Line continue beneath the glazed bridge.
 for(const r of platformRings){
  surface(st,r,platformHeight,1.88,0xbfbbb2);
  for(const i of [0,1]){
   const [a,z]=r[i],[b,w]=r[3-i];
   street(st,{x:a,z:z+(i?.52:-.52)},{x:b,z:w+(i?.52:-.52)},.27,.025,platformHeight+.012,0xcfac57);
  }
 }
 for(const v of [-30.1,-40.5,-58,-74.8,-82.1,-91.7]){
  box(st,0x978f7e,63,2.04,v,370,.39,3.38);
  for(const t of [-.72,.72])box(st,0x5c6362,63,2.79,v+t,370,.14,.09);
  for(let u=-118;u<248;u+=1.65)box(st,0x706d64,u,2.41,v,.24,.32,2.48);
 }
 for(const v of [-50.7,-67.65])for(const [u,len] of [[-48,78],[81,89],[180,89]]){
  box(st,0xd1dbd6,u,platformHeight+4.85,v,len,.25,8.42);
  for(let dx=-len/2+4;dx<len/2;dx+=13){
   post(st,steel,u+dx,platformHeight+2.35,v,.13,4.70,.13);
   for(const side of [-1,1])rod(st,[u+dx,platformHeight+2.95,v],[u+dx,platformHeight+4.68,v+side*3.55],.083,steel);
  }
 }
 // The stairs turn parallel to the rails; passengers never have to walk on a track.
 box(st,0xb7bcb5,0,hallHeight-.22,-66.45,8.7,.44,5.3);
 for(let i=0;i<24;i++){
  const rise=(24-i)*(hallHeight-platformHeight)/24;
  box(st,stone,3.5+(i+.5)*22/24,platformHeight+rise/2,-66.7,22/24+.004,rise,4.7);
 }
 for(const side of [-1,1]){
  const v=-66.7+side*2.35;
  rod(st,[3.5,hallHeight+1.04,v],[25.5,platformHeight+1.04,v],.065,steel);
  for(let i=0;i<=6;i++)post(st,steel,3.5+22*i/6,hallHeight+.53-(hallHeight-platformHeight)*i/6,v,.045,1.04,.045);
 }
 const rolling=group(st,39,-74.8,Math.PI/2,platformHeight);
 const railGroup=(x,z,angle,parent)=>group(parent,x,z,angle);
 buildKtx(T,rolling,{
  box:(color,x,y,z,w,h,d,parent)=>box(parent,color,x,y,z,w,h,d),
  rod:(color,x,y,z,r,h,parent)=>post(parent,color,x,y,z,r,h,r),
  group:railGroup,girder:(p,a,b,gauge,color)=>rod(p,a,b,gauge*.5,color),
  paintMap:(w,h,draw)=>{const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;}
 });
 const railDoor=group(rolling,-1.76,12,-Math.PI/2);
 standSign(T,railDoor,"열차 타는 곳","서울  ·  경주",2.3,0,2.77,0,"#1d4f91","#ffffff",.46);
 box(rolling,0x26333b,-1.71,1.05,12,.05,2.26,1.04);
 box(rolling,0xa3b2b2,-2.4,-.05,12,1.55,.10,1.18);
}

export {buildWaterfrontCafe} from "./coast-cafe-model.js";

export function buildCoastMarket(root,{box,sign}){
 const front=group(root,martFront.x,martFront.z,martFront.yaw,plazaHeight);
 box(front,0x50605e,0,1.55,.12,7.85,3.1,.22);
 for(const x of [-2.6,0,2.6])box(front,0x819a98,x,1.47,.26,2.26,2.62,.09);
 box(front,0x364b4d,.45,1.44,.34,.12,2.60,.10);
 box(front,0xbac2a9,.83,1.24,.39,.07,.34,.06);
 box(front,0x39716d,0,3.16,.49,8,.4,.95);
 box(front,0xe8c980,0,3.35,.51,8,.07,.97);
 sign(front,"해안로 편의점",0,3.12,1.01,3.2,.32,"#345953");
 for(const x of [-2.9,-2.55,-2.20])box(front,0xc2b082,x,.81,.42,.28,.44,.12);
}
