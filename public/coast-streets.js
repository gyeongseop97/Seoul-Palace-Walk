import * as T from "three";
import {geo,headland,harborStops,route,sideStreets,transitRoads} from "./pohang-layout.js";
import {parkRoad} from "./space-walk-layout.js";
import {coastalRetailBlocks} from "./coast-retail-layout.js";
import {tavernBlockIndex} from "./coast-tavern-layout.js";
export {harborBusRoute} from "./coast-bus-route.js";

const asphalt=0x555d61,sidewalk=0xc3b9a9;
const length=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const roadKey=(p)=>p.x.toFixed(1)+","+p.z.toFixed(1);
function streetNetwork(){
 const list=[],seen=new Set(),grid=new Map(),spatialKey=p=>Math.floor(p.x/70)+","+Math.floor(p.z/70);
 function add(a,b,width,oneWay,source){
  const len=length(a,b);if(len<.2)return;
  const key=[roadKey(a),roadKey(b)].sort().join(":");if(seen.has(key))return;
  if(source!=="transit"){
   const mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2},others=grid.get(spatialKey(mid))??[];
   // Older map strokes can span several surveyed segments. Drop only a parallel
   // centre line; adjacent divided roads and side streets remain independent.
   if(others.some(r=>{
    const l=length(r.a,r.b),dx=(r.b.x-r.a.x)/l,dz=(r.b.z-r.a.z)/l;
    if(Math.abs(dx*(b.x-a.x)/len+dz*(b.z-a.z)/len)<.965)return false;
    const t=(mid.x-r.a.x)*dx+(mid.z-r.a.z)*dz;
    return t>=-2&&t<=l+2&&Math.abs((mid.x-r.a.x)*dz-(mid.z-r.a.z)*dx)<1.5;
   }))return;
  }
  const r={a,b,width,oneWay,source};list.push(r);seen.add(key);
  if(source==="side")return;
  for(let x=Math.floor((Math.min(a.x,b.x)-4)/70);x<=Math.floor((Math.max(a.x,b.x)+4)/70);x++)
   for(let z=Math.floor((Math.min(a.z,b.z)-4)/70);z<=Math.floor((Math.max(a.z,b.z)+4)/70);z++){
    const k=x+","+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(r);
   }
 }
 for(const r of transitRoads)add(r.a,r.b,r.width,r.oneWay,"transit");
 for(let j=1;j<route.length;j++)add(route[j-1],route[j],11.5,false,"arterial");
 for(const coords of geo.coastRoads){
  for(let j=1;j<coords.length;j++){
   const [x,z]=coords[j-1],[u,v]=coords[j];
   if(Math.min(z,v)<-1090||Math.max(z,v)>415)continue;
   add({x,z},{x:u,z:v},10,false,"arterial");
  }
 }
 for(const r of sideStreets)add(r.a,r.b,r.width,false,"side");
 return list;
}
function flatMesh(parent,coords,color,options={}){
 if(!coords.length)return;
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(coords,3));g.computeVertexNormals();
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.95,side:T.DoubleSide,...options}));m.receiveShadow=true;parent.add(m);
}
function ribbon(coords,a,b,width,y){
 const d=length(a,b);if(!d)return;
 const nx=(b.z-a.z)*width/(2*d),nz=(a.x-b.x)*width/(2*d);
 coords.push(a.x+nx,y,a.z+nz,a.x-nx,y,a.z-nz,b.x+nx,y,b.z+nz,b.x+nx,y,b.z+nz,a.x-nx,y,a.z-nz,b.x-nx,y,b.z-nz);
}
function cap(coords,p,r,y){
 for(let k=0;k<12;k++){
  const a=k*Math.PI/6,b=(k+1)*Math.PI/6;
  coords.push(p.x,y,p.z,p.x+Math.sin(b)*r,y,p.z+Math.cos(b)*r,p.x+Math.sin(a)*r,y,p.z+Math.cos(a)*r);
 }
}
function buildParkShore(scene){
 const g=[],sides=[],vertices=headland.map(([x,z])=>new T.Vector2(x,z));
 for(const tri of T.ShapeUtils.triangulateShape(vertices,[]))for(const i of tri)g.push(headland[i][0],1.845,headland[i][1]);
 for(let j=1;j<headland.length-2;j++){
  const [x,z]=headland[j-1],[u,v]=headland[j];
  sides.push(x,1.845,z,u,1.845,v,x,-1.4,z,x,-1.4,z,u,1.845,v,u,-1.4,v);
 }
 flatMesh(scene,g,0x9da88a);flatMesh(scene,sides,0x9b9382);
}
export function buildHarborStreet(scene){
 const batches=new Map(),unit=new T.BoxGeometry(),object=new T.Object3D();
 function box(color,x,y,z,w,h,d,angle=0){
  object.position.set(x,y,z);object.scale.set(w,h,d);object.rotation.set(0,angle,0);object.updateMatrix();
  if(!batches.has(color))batches.set(color,[]);batches.get(color).push(object.matrix.clone());
 }
 buildParkShore(scene);
 const network=streetNetwork(),roadBed=[],walkBed=[],corners=new Map();
 for(const [i,{a,b,width,oneWay,source}] of network.entries()){
  const len=length(a,b),dx=(b.x-a.x)/len,dz=(b.z-a.z)/len,x=(a.x+b.x)/2,z=(a.z+b.z)/2,angle=Math.atan2(dx,dz);
  const walk=width+(source==="side"?2.8:6.2);
  ribbon(walkBed,a,b,walk,1.883);ribbon(roadBed,a,b,width,1.928);
  for(const p of [a,b]){
   const key=roadKey(p);let node=corners.get(key);
   if(!node){node={p,walk:0,road:0};corners.set(key,node);}
   node.road=Math.max(node.road,width*.5);node.walk=Math.max(node.walk,walk*.5);
  }
  if(width>=6.4&&len>7){
   // Yellow divides opposing traffic. White separates lanes with the same direction.
   if(oneWay){
    const count=Math.max(1,Math.round(width/3.25));
    for(let divider=1;divider<count;divider++){
     const off=width*(divider/count-.5);
     for(let d=3;d<len-2;d+=9){
      box(0xe2e0d4,a.x+dx*d+dz*off,1.942,a.z+dz*d-dx*off,.115,.008,Math.min(3,len-d-1),angle);
     }
    }
   }else box(0xc9a766,x,1.942,z,.14,.009,Math.max(1,len-1.8),angle);
  }
  if(source!=="side"&&len>23&&i%5===0){
   const w=width/2+2.54,sx=x+dz*w,sz=z-dx*w;
   box(0x53605e,sx,4.64,sz,.13,5.54,.13);
   box(0x61706b,sx-dz*.69,7.4,sz+dx*.69,1.53,.10,.13,angle);
   box(0xebdbb9,sx-dz*1.35,7.31,sz+dx*1.35,.54,.10,.34,angle);
  }
 }
 for(const c of corners.values()){cap(walkBed,c.p,c.walk,1.883);cap(roadBed,c.p,c.road,1.928);}
 flatMesh(scene,walkBed,sidewalk);flatMesh(scene,roadBed,asphalt);
 const linkFrom=harborStops.find(p=>p.id==="park"),linkTo=parkRoad[4],trail=[];
 ribbon(trail,linkFrom,linkTo,3.1,1.899);flatMesh(scene,trail,0xbaaa8d);
 for(const stop of harborStops){
  const {x,z,yaw}=stop.berth,tx=Math.sin(yaw),tz=Math.cos(yaw),nx=-tz,nz=tx;
  const right=(stop.shelter.x-x)*nx+(stop.shelter.z-z)*nz;
  function slab(color,along,across,y,w,h,d){box(color,x+tx*along+nx*across,y,z+tz*along+nz*across,w,h,d,yaw);}
  slab(0xcac2b4,.25,right-.2,1.923,3.76,.086,16.1);
  slab(0xc8a95d,.25,right-1.7,1.972,.28,.014,15.6);
  for(let k=-7;k<=7;k++)slab(0xb8b0a4,k,right-.15,1.969,3.55,.008,.025);
  // Crossings are painted along the road axis with stripes spanning its width.
  if(!stop.oneWay&&stop.roadWidth>=6.4){
   for(let off=.65;off<stop.roadWidth-.3;off+=1.05)slab(0xe7e4d8,13.2,off-stop.laneOffset-stop.roadWidth*.5,1.948,.51,.011,3.1);
  }
 }
 // Model shop entrances and masonry on the mapped building footprints.
 let idx=0;
 for(const [height,polygon] of geo.blocks){
  idx++;if(idx===104||idx-1===tavernBlockIndex||coastalRetailBlocks.has(idx-1)||polygon.length<3)continue;
  let best=null,len=0;
  polygon.forEach((a,i)=>{const b=polygon[(i+1)%polygon.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>len){best=[a,b];len=l;}});
  if(len<6||len>66||height<3.8)continue;
  const [a,b]=best,x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,angle=Math.atan2(b[0]-a[0],b[1]-a[1]),nx=Math.cos(angle),nz=-Math.sin(angle);
  const cx=polygon.reduce((s,p)=>s+p[0],0)/polygon.length,cz=polygon.reduce((s,p)=>s+p[1],0)/polygon.length;
  const sign=Math.sign((x-cx)*nx+(z-cz)*nz)||1;
  const front=(color,dist,y,w,h,d)=>box(color,x+sign*nx*dist,y,z+sign*nz*dist,w,h,d,angle);
  front(0x8b847a,.05,2.07,.14,.44,len);
  front(0x536466,.13,3.06,.22,2.28,Math.min(3.4,len*.42));
  front(0x95b3ae,.25,3.25,.10,1.48,1.33);
  front([0x835750,0x667964,0x697c87,0xb28e65][idx%4],.42,4.52,.94,.18,Math.min(len-.3,8.4));
  front(0xc1b7a7,.08,height+1.77,.25,.22,len);
 }
 for(const [color,matrices] of batches){
  const mesh=new T.InstancedMesh(unit,new T.MeshStandardMaterial({color,roughness:.88}),matrices.length);
  matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.receiveShadow=true;scene.add(mesh);
 }
}
