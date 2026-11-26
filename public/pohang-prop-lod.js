import * as T from "three";

const distantTube=new T.CylinderGeometry(1,1,1,6);
const distantSphere=new T.SphereGeometry(1,8,5);

// Keep every instance and its original material. Only the cross section of
// distant posts, roof tiles, rail caps and similar round parts changes.
export function roundPropDetail(root,tube,sphere,stretch=1){
 const banks=[];
 const matrix=new T.Matrix4(),scale=new T.Vector3();
 for(const mesh of root.children){
  const full=mesh.geometry;
  if(!mesh.isInstancedMesh||(full!==tube&&full!==sphere))continue;
  let radius=0;
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);scale.setFromMatrixScale(matrix);
   radius=Math.max(radius,scale.x,scale.z,full===sphere?scale.y:0);
  }
  mesh.computeBoundingBox();
  banks.push({mesh,full,far:full===tube?distantTube:distantSphere,radius:radius*stretch,bounds:mesh.boundingBox});
 }
 const eye=new T.Vector3(),previous=new T.Vector3(Infinity,Infinity,Infinity);
 let lastZoom=0;
 return camera=>{
  if(!camera)return;
  const zoom=camera.projectionMatrix.elements[5];
  root.worldToLocal(eye.copy(camera.position));
  if(lastZoom===zoom&&eye.distanceToSquared(previous)<1)return;
  previous.copy(eye);lastZoom=zoom;
  for(const {mesh,full,far,radius,bounds} of banks){
   // Nearest edge of the entire batch, so reaching any end of a pier or ship
   // restores its high-detail parts. Separate thresholds avoid edge flicker.
   const distant=mesh.geometry===far;
   const threshold=Math.max(distant ? 64 : 78,radius*zoom/(distant ? .009 : .0075));
   mesh.geometry=bounds.distanceToPoint(eye)>threshold?far:full;
  }
 };
}
