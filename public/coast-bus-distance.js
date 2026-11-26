import {BUS_LENGTH,BUS_WIDTH} from "./sejong-bus.js";

// Beyond the detailed buses, the whole moving fleet needs just one draw per livery.
function exterior(T,service){
 const box=new T.BoxGeometry(),wheel=new T.CylinderGeometry(.465,.465,.28,12).rotateZ(Math.PI/2);
 const positions=[],normals=[],colors=[],indices=[],tint=new T.Color();
 function part(shape,color,x,y,z,w=1,h=1,d=1){
  tint.setHex(color);
  const start=positions.length/3,{position,normal}=shape.attributes;
  for(let i=0;i<position.count;i++){
   positions.push(x+w*position.getX(i),y+h*position.getY(i),z+d*position.getZ(i));
   normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));
   colors.push(tint.r,tint.g,tint.b);
  }
  for(const i of shape.index.array)indices.push(start+i);
 }
 const side=BUS_WIDTH/2,front=BUS_LENGTH/2;
 part(box,service.coat,0,.96,0,BUS_WIDTH-.04,.94,BUS_LENGTH-.10);
 part(box,0x557482,0,2.05,0,BUS_WIDTH-.11,1.25,BUS_LENGTH-.20);
 part(box,service.body,0,2.71,0,BUS_WIDTH,.30,BUS_LENGTH-.13);
 part(box,0xe0e4e3,0,2.94,0,2.52,.19,BUS_LENGTH-.06);
 part(box,0xa6b0b2,0,3.06,-.74,1.47,.085,2.76);
 for(const s of [-1,1]){
  for(const z of [-5.16,-3.93,-2.58,-1.2,.18,1.56,2.92,5.14])part(box,0x26333e,s*(side-.055),2.04,z,.12,1.19,.084);
  part(box,0x9cabb4,s*side,1.25,0,.03,.11,BUS_LENGTH-.17);
  for(const z of [-3.15,3.04])part(wheel,0x252928,s*(side-.08),.474,z);
  part(box,0xf6ead0,s*.933,1.04,front+.015,.33,.21,.06);
  part(box,0xc9473d,s*1.04,1.04,-front-.012,.20,.30,.05);
 }
 const geometry=new T.BufferGeometry();
 for(const [name,values] of [["position",positions],["normal",normals],["color",colors]])geometry.setAttribute(name,new T.Float32BufferAttribute(values,3));
 geometry.setIndex(indices);return geometry;
}

export function createDistantFleet(T,group,route,prepareScenery){
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.8});
 const liveries=new Map(),fleet=[],transform=new T.Object3D();
 for(let i=0;i<route.count;i++){
  const service=route.vehicle(i);
  if(!liveries.has(service)){
   const batch=new T.InstancedMesh(exterior(T,service),material,route.count);
   batch.name=service.name+" 원경";batch.instanceMatrix.setUsage(T.DynamicDrawUsage);
   if(route.distantBounds){
    const {x,y,z,radius}=route.distantBounds;
    batch.boundingSphere=new T.Sphere(new T.Vector3(x,y,z),radius);
   }
   batch.count=0;batch.visible=false;
   group.add(batch);liveries.set(service,batch);
   prepareScenery?.(batch);
  }
  fleet.push(liveries.get(service));
 }
 return {
  start(){for(const batch of liveries.values())batch.count=0;},
  place(index,x,y,z,yaw){
   const batch=fleet[index];
   transform.position.set(x,y,z);transform.rotation.y=yaw;transform.updateMatrix();
   batch.setMatrixAt(batch.count++,transform.matrix);
  },
  finish(){
   for(const batch of liveries.values()){
    batch.visible=batch.count>0;
    if(batch.visible){
     batch.instanceMatrix.needsUpdate=true;
     if(!route.distantBounds)batch.computeBoundingSphere();
    }
   }
  }
 };
}
