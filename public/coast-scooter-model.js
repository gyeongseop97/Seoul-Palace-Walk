import * as T from "three";
import {scooterHubs} from "./coast-scooters.js";
import {scooterFit} from "./coast-scooter-fit.js";
import {ground} from "./pohang-layout.js";
import {parkFloor} from "./space-walk-layout.js";
import {seaPoint} from "./region-coordinates.js";

export const scooterGround=p=>parkFloor(p)??ground(p);
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
  const {deckTop,deckWidth,deckLength,deckZ,gripX,gripY,gripZ}=scooterFit;
  const radius=.096,frontAxle=.344;
  for(const z of [-.344,frontAxle]){
   part("cylinder",rubber,0,radius,z,radius,.067,radius,0,Math.PI/2);
   part("cylinder",rim,0,radius,z,.054,.072,.054,0,Math.PI/2);
  }
  part("box",frame,0,deckTop-.042,deckZ,deckWidth+.012,.056,deckLength+.02);
  part("box",rubber,0,deckTop-.007,deckZ,deckWidth,.014,deckLength);
  for(const side of [-1,1])for(const end of [-1,1])
   part("box",frame,side*.047,radius,end*.307,.024,.033,.09);
  part("box",0xca493d,0,.198,-.346,.077,.026,.033);
  part("box",frame,0,.181,-.328,.099,.024,.12,-.17);
  const shaftAngle=Math.atan2(gripZ-frontAxle,gripY-radius);
  part("cylinder",frame,0,(radius+gripY)/2,(frontAxle+gripZ)/2,.028,Math.hypot(gripY-radius,gripZ-frontAxle),.028,shaftAngle);
  part("cylinder",rim,0,gripY,gripZ,.014,2*gripX+.068,.014,0,Math.PI/2);
  for(const side of [-1,1])
   part("cylinder",rubber,side*gripX,gripY,gripZ,.022,.084,.022,0,Math.PI/2);
  part("box",trim,0,gripY-.061,gripZ+.037,.049,.041,.025);
 }
 const racks=batch((part,place)=>{
  for(const h of scooterHubs){
   const y=scooterGround(h);place(h.x,y,h.z,0);
   part("box",0x637777,0,.045,-1.35,2.49,.07,.13);
   for(const x of [-.78,0,.78]){
    place(h.x+x,y,h.z-.99,0);draw(part);
    part("cylinder",rim,-.10,.085,-.15,.013,.18,.013,0,-.37);
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
   mesh.position.set(p.x,scooterGround(p),p.z);
   mesh.rotation.set(0,parked?parked.yaw:Math.PI-rider.heading*Math.PI/180,parked?.10:0);
  }
  for(const [id,mesh] of vehicles)if(!visible.has(id)){mesh.removeFromParent();for(const part of mesh.children)part.dispose();vehicles.delete(id);}
 }
 return update;
}
