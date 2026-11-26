import * as T from "three";
import {localFrame,registerDistrictLod} from "./gyeongju-mesh.js";

// A hipped tiled roof, with upturned corners and a shallow concave slope.
function tiledRoof(U,V){
 const points=[],uv=[],faces=[];
 const lower=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],ridge=[[-.31,0],[.31,0],[.31,0],[-.31,0]];
 for(let face=0;face<4;face++){
  const next=(face+1)%4,offset=points.length/3;
  for(let j=0;j<=V;j++)for(let i=0;i<=U;i++){
   const u=i/U,v=j/V,k=1-v;
   const px=(lower[face][0]*(1-u)+lower[next][0]*u)*k+(ridge[face][0]*(1-u)+ridge[next][0]*u)*v;
   const pz=(lower[face][1]*(1-u)+lower[next][1]*u)*k+(ridge[face][1]*(1-u)+ridge[next][1]*u)*v;
   const lift=Math.pow(Math.abs(2*u-1),3)*.15*k*k;
   points.push(px,.82*v*v+.18*v+lift,pz);uv.push(u*(face%2?18:38),v);
   if(j<V&&i<U){const a=offset+j*(U+1)+i;faces.push(a,a+U+1,a+1,a+1,a+U+1,a+U+2);}
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(points,3));geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geo.setIndex(faces);geo.computeVertexNormals();
 return geo;
}
const tile=tiledRoof(10,4);
registerDistrictLod(tile,tiledRoof(6,2),170);
function roofMaterial(){
 const canvas=document.createElement("canvas");canvas.width=32;canvas.height=96;const ctx=canvas.getContext("2d"),g=ctx.createLinearGradient(0,0,32,0);
 g.addColorStop(0,"#c5c6c6");g.addColorStop(.22,"#f7f7f6");g.addColorStop(.44,"#c7c8c8");g.addColorStop(.9,"#a9aaaa");g.addColorStop(1,"#bebfbf");
 ctx.fillStyle=g;ctx.fillRect(0,0,32,96);ctx.fillStyle="#a1a1a1";for(let i=0;i<96;i+=16)ctx.fillRect(0,i,32,1);
 const map=new T.CanvasTexture(canvas);map.wrapS=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 return new T.MeshStandardMaterial({map,side:T.DoubleSide,roughness:.86});
}
let tileMat;
const roofColors=[0x667078,0x626b72,0x57616b,0x737976],plaster=[0xefdec1,0xe4d5b8,0xe5ded0,0xcfbfa8,0xcfc5b9];
export function roof(k,x,y,z,w,h,d,yaw,color=0x64727a,material=null){
 tileMat??=roofMaterial();k.geo(tile,x,y,z,w,h,d,color,yaw,material??tileMat);
 k.piece(x,y+h+.05,z,w*.65,.16,.17,0x657079,yaw);
}
export function illuminatedRoofMaterial(){
 tileMat??=roofMaterial();
 const mat=tileMat.clone();mat.emissive.set(0xffb866);mat.emissiveMap=mat.map;mat.emissiveIntensity=0;
 return mat;
}
export function buildingFrame(points){
 let longest=-1,yaw=0;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz;
  if(n>longest){longest=n;yaw=Math.atan2(-dz,dx);}
 }
 const c=Math.cos(yaw),s=Math.sin(yaw);
 let xmin=Infinity,xmax=-Infinity,zmin=Infinity,zmax=-Infinity,twiceArea=0;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],x=a.x*c-a.z*s,z=a.x*s+a.z*c;
  xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);zmin=Math.min(zmin,z);zmax=Math.max(zmax,z);
  twiceArea+=a.x*b.z-a.z*b.x;
 }
 const x=(xmin+xmax)/2,z=(zmin+zmax)/2;
 return {x:x*c+z*s,z:-x*s+z*c,width:xmax-xmin,depth:zmax-zmin,yaw,outward:twiceArea>0?-1:1,
  fill:Math.abs(twiceArea)/2/Math.max(.01,(xmax-xmin)*(zmax-zmin))};
}
export function drawBuilding(k,b,index,nearestRoad,insideBuilding,nearestPoseok){
 if(b.points.length<3)return;
 const r=buildingFrame(b.points),{x,z,width:w,depth:d,yaw}=r;
 if(w<1.15||d<1.15)return;
 const reach=Math.max(w,d)*.65+10,mainRoad=nearestPoseok?.(x,z);
 const hwangStreet=mainRoad&&mainRoad.gap<Math.min(reach,26);
 const road=hwangStreet?mainRoad:nearestRoad(x,z),shop=road&&road.gap<reach;
 const traditional=r.fill>.70&&w<33&&d<25&&index%5!==2;
 const stone=plaster[index%plaster.length],wood=0x765134;
 const h=traditional?2.6+(index%4)*.16:3.3+(w>15&&index%3===0?3.25:0);
 for(let i=0;i<b.points.length;i++){
  const a=b.points[i],t=b.points[(i+1)%b.points.length];
  if(a.x===t.x&&a.z===t.z)continue;
  k.face([[a.x,.04,a.z],[t.x,.04,t.z],[t.x,h,t.z],[a.x,h,a.z]],[0,1,2,0,2,3],stone);
 }
 if(traditional){
  roof(k,x,h,z,w+.75,Math.min(2.5,d*.22+.34),d+.80,yaw,roofColors[index%4]);
 }else{k.polygon(b.points,h,0xa4a199);}
 if(!shop)return;
 // Doors and lattice windows face the closest street, not a common compass direction.
 let best=null;
 for(let i=0;i<b.points.length;i++){
  const a=b.points[i],t=b.points[(i+1)%b.points.length],dx=t.x-a.x,dz=t.z-a.z,len=Math.hypot(dx,dz);
  if(len<3.4)continue;
  const px=(a.x+t.x)*.5,pz=(a.z+t.z)*.5,score=Math.hypot(px-road.x,pz-road.z);
  const nx=r.outward*-dz/len,nz=r.outward*dx/len;
  const facesStreet=nx*(road.x-px)+nz*(road.z-pz)>=0;
  if(best&&(best.facesStreet&&!facesStreet||best.facesStreet===facesStreet&&score>best.score))continue;
  if(insideBuilding?.({x:px+nx*.30,z:pz+nz*.30}))continue;
  best={px,pz,score,len,nx,nz,facesStreet};
 }
 if(!best)return;
 const {px,pz,len,nx,nz}=best,angle=Math.atan2(nx,nz),at=localFrame(px,pz,angle);
 const piece=(u,y,v,w,h,d,color)=>{const p=at(u,v);k.piece(p.x,y,p.z,w,h,d,color,angle);};
 const bays=Math.max(1,Math.min(8,Math.floor(len/2.7))),spacing=len/bays;
 piece(0,.19,.03,len,.37,.11,0x918c80);
 piece(0,h-.17,.07,len,.17,.16,wood);
 for(let i=0;i<bays;i++){
  const u=(i+.5)*spacing-len/2,door=i===Math.floor(bays/2),panel=Math.min(2.25,spacing-.20);
  piece(u,door?1.23:1.5,.10,panel,door?2.18:1.35,.09,wood);
  piece(u,door?1.25:1.5,.16,panel-.15,door?1.93:1.18,.045,traditional?0xafada0:0x719197);
  piece(u,1.48,.20,.048,door?1.68:1.22,.034,wood);
  piece(u,1.73,.20,panel-.15,.040,.034,wood);
  if(traditional){
   for(const sign of [-1,1])piece(u+sign*panel*.24,1.51,.20,.035,door?1.64:1.19,.035,wood);
   piece(u,.99,.20,panel-.15,.049,.03,wood);
  }
  piece(u-spacing*.5+.10,h*.52,.11,.17,h-.21,.20,wood);
 }
 if((hwangStreet||index%8===0)&&road.gap<22&&len>4){
  const name=b.name||["차방","도자기 공방","황남 다과","책방","소품 공방","황남 제과","수제 아이스크림","사진관","황남식당","찻집","황리단 잡화점"][index%11];
  const hasAwning=hwangStreet&&index%4===0;
  // On low shopfronts the cloth drops below the lintel. Mount its sign on the outer fascia.
  const signY=hasAwning ? 2.29 : h-.29,signZ=hasAwning ? .87 : .23;
  const p=at(0,signZ+.05),signWidth=Math.min(3.15,len*.51);
  const paint=["#65513d","#516960","#78584b","#415659","#785335"][index%5];
  piece(0,signY,signZ,signWidth+.08,.54,.09,wood);
  k.sign(name,p.x,signY,p.z,signWidth,.48,angle,paint);
  if(hwangStreet){
   const apron=Math.max(.65,Math.min(3.5,Math.hypot(road.x-px,road.z-pz)-road.width*.49));
   k.polygon([at(-len/2,.08),at(len/2,.08),at(len/2,apron),at(-len/2,apron)],.035,0xbbafa1,"pavers");
   // Pots, linen noren and small timber displays sit directly against shopfronts.
   const u=Math.min(2.4,len*.30),pot=at(u,.44);
   k.column(pot.x,.28,pot.z,.40,.54,.40,0x9a7860);
   k.crown(pot.x,.77,pot.z,.38,.34,.31,0x647c50,index);
   const edge=index%2===0?-1:1,shelf=Math.min(1.25,len*.20);
   piece(edge*u,.46,.39,shelf,.12,.40,0x9d7956);
   for(const j of [-1,1])piece(edge*u+j*shelf*.34,.20,.40,.075,.40,.24,wood);
   for(let j=0;j<3;j++){
    const vase=at(edge*u+(j-1)*shelf*.26,.39);
    k.column(vase.x,.60,vase.z,.17,.21,.17,[0xac8b71,0x9fae9d,0xc5b18c][j]);
   }
   const curtain=["#a79278","#a1ada0","#c3ac91","#a29888"][index%4];
   for(const j of [-1,0,1])piece(j*.32,2.25,.255,.29,.53,.045,curtain);
   if(hasAwning){
    const span=Math.min(3.2,len*.65),a=at(-span/2,.15),b=at(span/2,.15),c=at(span/2,.83),d=at(-span/2,.83);
    k.face([[a.x,2.55,a.z],[b.x,2.55,b.z],[c.x,2.32,c.z],[d.x,2.32,d.z]],[0,1,2,0,2,3],index%8?0xac8d70:0x8c9b87);
    piece(0,2.275,.82,span,.11,.042,index%8?0x997a5d:0x788573);
   }
  }
 }
}
export function drawCafe(k,r,f){
 const {width:w,depth:d,yaw}=r,at=f.point;
 function piece(x,y,z,a,b,c,col){const p=at(x,z);k.piece(p.x,y,p.z,a,b,c,col,yaw);}
 const timber=0x714e36,white=0xebddbd,front=d/2;
 piece(0,.03,0,w,.06,d,0xc2a780);
 for(const sign of [-1,1]){
  piece(sign*w/2,1.52,0,.19,3,d,white);
  const wide=w/2-1.34,center=sign*(1.34+wide/2);
  piece(center,.39,front,wide,.75,.18,white);
  piece(center,1.77,front,wide,1.96,.11,0x9aafa4);
  for(let i=0;i<=4;i++)piece(sign*(1.34+wide*i/4),1.58,front+.085,.10,3,.14,timber);
  for(const y of [.82,1.47,2.12,2.77])piece(center,y,front+.085,wide,.075,.15,timber);
 }
 piece(0,1.53,-front,w,3,.18,white);piece(0,2.96,front,w+.18,.31,.3,timber);
 for(let i=0;i<4;i++)piece(0,2.95,-d*.45+d*.3*i,w+.6,.17,.23,timber);
 roof(k,r.x,3.04,r.z,w+1.35,1.89,d+1.35,yaw);
 const sign=at(0,front+.185);k.sign(r.name,sign.x,2.93,sign.z,Math.min(w*.52,r.name.length*.39+.52),.45,yaw,r.sign);
 const counter=f.counter;
 piece(counter.x,.48,counter.z,counter.width,.9,counter.depth,0x97775b);
 piece(counter.x,.98,counter.z,counter.width+.16,.12,counter.depth+.15,0xe5d3b5);
 for(const x of r.id==="pub"?[]:[-2.1,-1.35,-.6,.15,.9,1.65]){
  const p=at(x,-front+.48);k.column(p.x,1.49,p.z,.18,.23,.18,0xede0c5);
 }
 piece(0,1.34,-front+.4,w*.67,.085,.48,timber);
 piece(0,1.99,-front+.4,w*.67,.085,.48,timber);
 if(r.id==="cafe")piece(-.97,1.18,counter.z,.58,.26,.39,0x424b46);
 const menu=at(.85,-front+.12);k.sign(r.board,menu.x,2.39,menu.z,3.08,.38,yaw,r.sign);
 for(const u of [-2.65,0,2.65]){
  const p=at(u,-.38);k.column(p.x,2.70,p.z,.038,.51,.038,timber);k.crown(p.x,2.37,p.z,.22,.19,.22,0xf2d7a5);
 }
 for(const table of f.tables){
  const p=at(table.x,table.z);k.column(p.x,.71,p.z,1.03,.095,1.03,0xb88755);k.column(p.x,.35,p.z,.12,.70,.12,timber);
  for(const seat of table.seats){
   piece(seat.x,.455,seat.z,.53,.10,.46,0xb58c5d);
   const away=seat.z>table.z?1:-1;
   piece(seat.x,.72,seat.z+away*.21,.49,.30,.06,timber);
   for(const s of [-1,1])for(const t of [-1,1])piece(seat.x+s*.205,.224,seat.z+t*.17,.058,.448,.058,timber);
  }
 }
}
