import * as T from "three";
import {shore} from "./pohang-layout.js";
import {getGameSound} from "./sound.js";

// A few flocks patrol the whole waterfront; a small flock rides the air above
// the yacht. Shared time determines their positions for everyone in the room.
export function coastalGulls(root){
 const total=48,white=0xe3e3d7,slate=0x81909a,ink=0x34424c;
 const spindle=new T.SphereGeometry(1,9,6),body=new T.Object3D(),part=new T.Object3D(),temp=new T.Matrix4();
 function batch(geometry,color,count=total){
  const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color,roughness:.88,side:T.DoubleSide}),count);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;root.add(mesh);return mesh;
 }
 function wing(side,tip){
  const pts=tip?[[.53,.10,.02],[1.01,-.045,-.34],[.60,.07,-.18]]:
   [[.04,.025,.11],[.56,.10,.028],[.67,.069,-.17],[.20,-.012,-.21]];
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pts.flatMap(([x,y,z])=>[x*side,y,z]),3));
  g.setIndex(tip?[0,1,2]:[0,1,2,0,2,3]);g.computeVertexNormals();return g;
 }
 const bodies=batch(spindle,white),heads=batch(spindle,white),bills=batch(spindle,0xd09d50);
 const wings=[-1,1].map(side=>[batch(wing(side,false),slate),batch(wing(side,true),ink)]);
 const meshes=[bodies,heads,bills,...wings.flat()];
 function write(mesh,i,x,y,z,w,h,d,rz=0){
  part.position.set(x,y,z);part.scale.set(w,h,d);part.rotation.set(0,0,rz);part.updateMatrix();
  mesh.setMatrixAt(i,temp.multiplyMatrices(body.matrix,part.matrix));
 }
 let last=0,nextCall=0;
 return (clock,player,ship,camera)=>{
  const t=clock/1000;
  if(t>=last&&t-last<1/25)return;last=t;
  let visible=0,nearest=Infinity;
  for(let i=0;i<total;i++){
   const group=Math.floor(i/6),n=i%6,phase=i*2.39996,escort=group===0;
   const z0=escort?ship.z:[-710,-535,-346,-183,-53,89,213][group-1];
   const x0=escort?ship.x:shore(z0)+(group%3===0?151:group%3===1?34:83);
   if(Math.hypot(x0-player.x,z0-player.z)>480)continue;
   const a=t*(.083+.006*n)+phase,b=t*.043+phase*.44,rx=escort?18+2*n:28+n*3,rz=escort?24+n:42+n*2;
   const x=x0+rx*Math.cos(a)+7*Math.sin(b),z=z0+rz*Math.sin(a)+5*Math.cos(b);
   const y=(escort?12:8)+1.6*n+2.65*Math.sin(b*1.55)+.48*Math.sin(a*2);
   if(Math.hypot(camera.x-x,camera.y-y,camera.z-z)<3.8)continue;
   if(Math.hypot(x-player.x,z-player.z)>320)continue;
   nearest=Math.min(nearest,Math.hypot(x-player.x,z-player.z,y-3));
   body.position.set(x,y,z);body.scale.setScalar(1.0+.29*(.5+.5*Math.sin(phase)));
   body.rotation.set(.08*Math.cos(b),Math.atan2(-rx*Math.sin(a)+3.6*Math.cos(b),rz*Math.cos(a)-2.6*Math.sin(b)),.19*Math.sin(a),"YXZ");body.updateMatrix();
   write(bodies,visible,0,0,-.025,.114,.084,.34);
   write(heads,visible,0,.053,.23,.079,.085,.116);write(bills,visible,0,.045,.352,.043,.032,.103);
   const beating=Math.max(0,Math.sin(b*3+.3)),flap=.075+beating*.55*Math.sin(t*5.3+phase);
   wings.forEach(([inner,tip],j)=>{const angle=(j?1:-1)*flap;write(inner,visible,0,0,0,1,1,1,angle);write(tip,visible,0,0,0,1,1,1,angle);});
   visible++;
  }
  for(const mesh of meshes){mesh.count=visible;mesh.instanceMatrix.needsUpdate=true;}
  if(nearest<60&&t>=nextCall){getGameSound().gull(Math.min(.85,(60-nearest)/45));nextCall=t+8.3+nearest*.14;}
 };
}
