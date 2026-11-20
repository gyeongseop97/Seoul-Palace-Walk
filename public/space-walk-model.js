import * as T from "three";
import {hill,parkRoad,hillFloor,tracks,loop,landings,stairHalfWidth} from "./space-walk-layout.js";
export function buildSpaceWalk(scene){
 const g=new T.Group();scene.add(g);g.name="환호공원 스페이스워크";
 const geom=new T.PlaneGeometry(360,215,80,54).rotateX(-Math.PI/2),v=geom.attributes.position;
 for(let i=0;i<v.count;i++){
  const x=hill.x+v.getX(i),z=hill.z+v.getZ(i),r=Math.hypot((x-hill.x)/160,(z-hill.z)/95);
  v.setXYZ(i,x,hillFloor({x,z})-Math.max(0,r-.95)*36-.05,z);
 }
 geom.computeVertexNormals();const mound=new T.Mesh(geom,new T.MeshStandardMaterial({color:0x839157,roughness:1}));g.add(mound);
 const batches=new Map(),obj=new T.Object3D(),up=new T.Vector3(0,1,0),box=new T.BoxGeometry(),tube=new T.CylinderGeometry(1,1,1,9);
 const steel=new T.MeshStandardMaterial({color:0xc3c9c6,roughness:.37,metalness:.32}),step=new T.MeshStandardMaterial({color:0xa7afac,roughness:.56,metalness:.23});
 const led=new T.MeshStandardMaterial({color:0xffebc4,emissive:0xffd69a,emissiveIntensity:.16});
 function add(geometry,material){const id=geometry.uuid+material.uuid;if(!batches.has(id))batches.set(id,{geometry,material,matrices:[]});obj.updateMatrix();batches.get(id).matrices.push(obj.matrix.clone());}
 function rod(a,b,r,mat=steel){
  const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p);
  obj.position.copy(p).lerp(q,.5);obj.quaternion.setFromUnitVectors(up,d.clone().normalize());obj.scale.set(r,d.length(),r);add(tube,mat);
 }
 // Sample both edges and the centreline so the path follows the cross-slope of the hill.
 const pathPoints=[],indices=[];
 for(let i=1;i<parkRoad.length;i++){
  const a=parkRoad[i-1],b=parkRoad[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),n=Math.ceil(length/2);
  for(let k=i===1?0:1;k<=n;k++){
   const cx=a.x+dx*k/n,cz=a.z+dz*k/n;
   for(const offset of [-4,0,4]){
    const x=cx+offset*dz/length,z=cz-offset*dx/length;
    pathPoints.push(x,hillFloor({x,z})+.09,z);
   }
   const start=pathPoints.length/3-3;
   if(start)for(let j=0;j<2;j++)indices.push(start+j-3,start+j,start+j+1,start+j-3,start+j+1,start+j-2);
  }
 }
 const pathGeometry=new T.BufferGeometry();pathGeometry.setAttribute("position",new T.Float32BufferAttribute(pathPoints,3));
 pathGeometry.setIndex(indices);pathGeometry.computeVertexNormals();
 g.add(new T.Mesh(pathGeometry,new T.MeshStandardMaterial({color:0xc6b79c,roughness:1,side:T.DoubleSide})));
 const railOffset=stairHalfWidth+.04;
 for(const d of landings){
  obj.position.set(d.x,d.h-.09,d.z);obj.rotation.set(0,0,0);obj.scale.set(d.halfX*2,.18,d.halfZ*2);add(box,step);
  for(const side of ["west","east","north","south"]){
   const alongZ=side==="west"||side==="east",span=alongZ?d.halfZ:d.halfX;
   const sign=side==="west"||side==="north"?-1:1;
   const edge=(u,v)=>[d.x+(alongZ?sign*d.halfX:u),d.h+v,d.z+(alongZ?u:sign*d.halfZ)];
   // The two gates protect only the loop. At a stair mouth the rail stops
   // on each side, leaving the entire stair width open for crossing.
   const sections=d.ports[side]==="walk"?[[-span,-railOffset],[railOffset,span]]:[[-span,span]];
   for(const [u,v] of sections){
    rod(edge(u,1.2),edge(v,1.2),.032);rod(edge(u,.59),edge(v,.59),.016);
    rod(edge(u,.02),edge(u,1.2),.022);rod(edge(v,.02),edge(v,1.2),.022);
   }
   if(d.ports[side]==="loop"){
    for(const u of [-railOffset,0,railOffset])rod(edge(u,.02),edge(u,1.2),.023);
   }
   rod(edge(-span,-.10),edge(span,-.10),.043,led);
  }
 }
 for(const line of [...tracks,loop]){
  const closed=line===loop;
  function edge(i,sign,height){
   const p=line[i],prev=line[Math.max(0,i-1)],next=line[Math.min(i+1,line.length-1)];
   const length=Math.hypot(next.x-prev.x,next.z-prev.z)||1;
   const nx=closed?0:(next.z-prev.z)/length,nz=closed?1:(prev.x-next.x)/length;
   return [p.x+sign*railOffset*nx,p.h+height,p.z+sign*railOffset*nz];
  }
  for(let i=1;i<line.length;i++){
   const a=line[i-1],b=line[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||.001;
   // The visual loop banks through vertical, while both walkable arms have horizontal treads.
   const yaw=Math.atan2(dx,dz);
   obj.position.set((a.x+b.x)/2,(a.h+b.h)/2-.06,(a.z+b.z)/2);
   obj.rotation.set(0,yaw,0);if(closed)obj.rotateX(-Math.atan2(b.h-a.h,len));
   obj.scale.set(stairHalfWidth*2,.105,Math.hypot(len,closed?b.h-a.h:0)+.025);add(box,step);
   if(i%3===0||i===line.length-1){
    const k=Math.floor((i-1)/3)*3,prev=line[k];
    for(const sign of [-1,1]){
     rod(edge(k,sign,1.2),edge(i,sign,1.2),.032);rod(edge(k,sign,.59),edge(i,sign,.59),.016);
     rod(edge(i,sign,.02),edge(i,sign,1.2),.021);rod(edge(k,sign,-.07),edge(i,sign,-.07),.043,led);
    }
    rod([prev.x,prev.h-.23,prev.z],[b.x,b.h-.23,b.z],.15);
   }
   if(!closed&&i%29===0&&b.h>hillFloor(b)+2)rod([b.x+.9,hillFloor(b)-.2,b.z+.8],[b.x,b.h-.22,b.z],.23);
  }
 }
 for(const {geometry,material,matrices} of batches.values()){
  const mesh=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));g.add(mesh);
 }
 return n=>{led.emissiveIntensity=.14+2.4*n;};
}
