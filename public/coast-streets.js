import * as T from "three";
import {arrival,station,beachStop,busAt,busCount,busDwell,route,sideStreets,geo} from "./pohang-layout.js";
import {coastPoint} from "./region-coordinates.js";
const stop=(p,name,direction)=>({name,direction,shelter:{...coastPoint(p),heading:180}});
export const harborBusRoute={name:"영일대 해변버스",line:"포항역 · 영일대",count:busCount,
 stops:[stop({x:arrival.x-2,z:arrival.z+.4},"포항역","영일대 방면"),stop({x:beachStop.x+7,z:beachStop.z-2},"영일대해수욕장","포항역 방면")],
 at(index,time){const b=busAt(index,time/1000);return {...coastPoint(b),heading:(540-b.yaw*180/Math.PI)%360,
  stopId:b.stop,traveling:!b.stop,remaining:b.left*1000,elapsed:(busDwell-b.left)*1000};}
};
export function buildHarborStreet(scene){
 const batches=new Map(),unit=new T.BoxGeometry(),object=new T.Object3D();
 function box(color,x,y,z,w,h,d,angle=0){
  object.position.set(x,y,z);object.scale.set(w,h,d);object.rotation.set(0,angle,0);object.updateMatrix();
  if(!batches.has(color))batches.set(color,[]);batches.get(color).push(object.matrix.clone());
 }
 for(const {a,b,width} of sideStreets){
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),cx=(a.x+b.x)/2,cz=(a.z+b.z)/2;
  box(0x596165,cx,1.868,cz,width,.03,len+.06,yaw);
  for(const side of [-1,1]){
   const offset=(width/2+.69)*side;
   box(0xbeb7a9,cx+dz/len*offset,1.883,cz-dx/len*offset,1.38,.05,len+.07,yaw);
  }
 }
 // Curbs, sidewalks, granite paving and crossing stripes share the palette of Sejong-daero.
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<1)continue;
  const x=(a.x+b.x)/2,z=(a.z+b.z)/2,yaw=Math.atan2(dx,dz),nx=dz/len,nz=-dx/len;
  for(const side of [-1,1]){
   box(0xc4bcb1,x+side*nx*8,1.922,z+side*nz*8,2.9,.12,len+.13,yaw);
   box(0xb6afa3,x+side*nx*6.59,1.976,z+side*nz*6.59,.23,.13,len+.13,yaw);
   const n=Math.ceil(len/2.8);for(let j=0;j<n;j++){
    const f=(j+.5)/n;
    box(0xa6a39b,a.x+f*dx+side*nx*8,1.985,a.z+f*dz+side*nz*8,2.7,.011,.022,yaw);
   }
  }
  if(len>25&&i%9===1)for(let n=-5;n<=5;n++)box(0xe7e3d2,x+n*nx*1.04,1.971,z+n*nz*1.04,.52,.015,3.1,yaw);
  if(len>26&&i%3===0){
   const sx=x+nx*9.3,sz=z+nz*9.3;
   box(0x4d5958,sx,4.67,sz,.13,5.6,.13);
   box(0x566361,sx-nx*.71,7.43,sz-nz*.71,1.62,.1,.13,yaw);
   box(0xe6d3a5,sx-nx*1.38,7.34,sz-nz*1.38,.52,.11,.32,yaw);
  }
 }
 // A continuous tiled boarding island meets the first bus lane at its actual bearing.
 const tangent={x:route[1].x-station.x,z:route[1].z-station.z};
 const len=Math.hypot(tangent.x,tangent.z),tx=tangent.x/len,tz=tangent.z/len,nx=tz,nz=-tx;
 const yaw=Math.atan2(tx,tz),island=(color,v,u,y,w,h,d)=>box(color,station.x+tx*u+nx*v,y,station.z+tz*u+nz*v,w,h,d,yaw);
 island(0x555d60,0,-3.8,1.901,13,.088,7.7);
 island(0xb4afa3,12.07,6.2,1.956,10.96,.104,29.2);
 island(0xd1bb85,7.24,6.2,2.012,.32,.012,29);
 for(let j=-7;j<=20;j++)island(0xbdb8ac,12.07,j,2.013,10.9,.009,.021);
 for(let j=8;j<=17;j++)island(0xbdb8ac,j,6.2,2.013,.021,.009,29.1);
 // Model shop entrances and masonry on the mapped building footprints.
 let idx=0;
 for(const [height,polygon] of geo.blocks){
  idx++;if(polygon.length<3)continue;
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
