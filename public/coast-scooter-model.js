import * as T from "three";
import {scooterHubs} from "./coast-scooters.js";
import {ground} from "./pohang-layout.js";
import {hillFloor,inPark} from "./space-walk-layout.js";
import {seaPoint} from "./region-coordinates.js";

const baseAt=p=>inPark(p)?hillFloor(p):ground(p);
const rubber=0x28363a,rim=0xaeb7b7,frame=0x278184,trim=0xf3c473;
export function buildCoastScooters(root){
 const geom={box:new T.BoxGeometry(),cylinder:new T.CylinderGeometry(1,1,1,12)};
 const materials=new Map(),matrix=new T.Object3D(),parent=new T.Object3D();
 function batch(fill){
  const groups=new Map(),result=new T.Group();
  function part(shape,color,x,y,z,sx,sy,sz,rx=0,rz=0){
   matrix.position.set(x,y,z);matrix.rotation.set(rx,0,rz);matrix.scale.set(sx,sy,sz);matrix.updateMatrix();
   const key=shape+color;
   if(!groups.has(key))groups.set(key,{shape,color,matrices:[]});
   groups.get(key).matrices.push(parent.matrix.clone().multiply(matrix.matrix));
  }
  function place(x,y,z,yaw){parent.position.set(x,y,z);parent.rotation.set(0,yaw,0);parent.updateMatrix();}
  fill(part,place);
  for(const {shape,color,matrices} of groups.values()){
   if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.58}));
   const mesh=new T.InstancedMesh(geom[shape],materials.get(color),matrices.length);
   matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();result.add(mesh);
  }
  return result;
 }
 function draw(part){
  for(const z of [-.53,.56]){
   part("cylinder",rubber,0,.145,z,.145,.105,.145,0,Math.PI/2);
   part("cylinder",rim,0,.145,z,.077,.112,.077,0,Math.PI/2);
  }
  part("box",frame,0,.174,-.015,.265,.085,.89);
  part("box",rubber,0,.224,-.025,.234,.02,.79);
  part("box",frame,0,.245,-.44,.13,.055,.24,-.32);
  part("cylinder",frame,0,.675,.458,.044,1.06,.044,-.13);
  part("cylinder",rim,0,1.16,.396,.034,.18,.034,-.13);
  part("cylinder",rubber,0,1.23,.385,.036,.58,.036,0,Math.PI/2);
  part("box",trim,0,1.12,.448,.075,.06,.045);
  part("box",0xca493d,0,.226,-.525,.11,.035,.028);
 }
 const racks=batch((part,place)=>{
  for(const h of scooterHubs){
   const y=baseAt(h);place(h.x,y,h.z,0);
   part("box",0x637777,0,.045,-1.35,2.49,.07,.13);
   for(const x of [-.78,0,.78]){
    place(h.x+x,y,h.z-.96,0);draw(part);
    part("cylinder",rim,-.2,.27,-.39,.033,.51,.033);
   }
   place(h.x,y,h.z,0);part("box",frame,1.30,.78,-1.31,.14,1.55,.14);
   part("box",trim,1.30,1.40,-1.31,.35,.22,.18);
  }
 });
 root.add(racks);
 const prototype=batch((part,place)=>{place(0,0,0,0);draw(part);}),vehicles=new Map();
 function update(roster,anchor){
  const visible=new Set();
  for(const rider of roster){
   const s=rider.coast,parked=s?.scooter?.parked;
   if(!parked&&s?.mode!=="scooter")continue;
   const p=parked??seaPoint(rider);
   if(Math.hypot(p.x-anchor.x,p.z-anchor.z)>135)continue;
   visible.add(rider.id);
   let mesh=vehicles.get(rider.id);
   if(!mesh){mesh=prototype.clone();root.add(mesh);vehicles.set(rider.id,mesh);}
   mesh.position.set(p.x,baseAt(p),p.z);
   mesh.rotation.set(0,parked?parked.yaw:Math.PI-rider.heading*Math.PI/180,parked?.10:0);
  }
  for(const [id,mesh] of vehicles)if(!visible.has(id)){mesh.removeFromParent();for(const part of mesh.children)part.dispose();vehicles.delete(id);}
 }
 return update;
}
export function scooterPose(model){
 model.body.rotation.x=.07;
 model.legs.forEach((leg,i)=>{
  leg.upper.rotation.set(i?.12:-.18,0,0);leg.lower.rotation.x=i?.05:.15;
 });
 model.arms.forEach((arm,i)=>{
  arm.upper.rotation.set(-.68,0,i?.14:-.14);arm.lower.rotation.x=-.55;
 });
}
