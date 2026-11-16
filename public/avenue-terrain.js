import {gradePalaceMeshes,groundPiece} from "./gyeongbok-terrain.js";

// Map geometry uses one metre per scene unit and a shared origin. Some
// buildings have local group coordinates, while older parts and instance
// matrices store absolute scene coordinates.
export function* gradeAvenueMeshes(T,objects,height){
  const matrix=new T.Matrix4(),centroid=new T.Vector3();
  const offset=(x,z)=>height({x:x+300,y:z+225});
  const samples=new Map();
  const anchorHeight=anchor=>{
    if(!samples.has(anchor))samples.set(anchor,height(anchor));
    return samples.get(anchor);
  };
  let count=0;
  function* grade(object){
    const {position,geometry,userData}=object;
    if(userData.flatBackground||userData.dynamic||object.isLight)return;
    if(userData.terrainAnchor){
      position.y+=anchorHeight(userData.terrainAnchor);
    }else if(object.isInstancedMesh){
      const anchors=userData.terrainAnchors;
      for(let index=0;index<object.count;index++){
        object.getMatrixAt(index,matrix);
        const anchor=anchors?.[index],m=matrix.elements;
        m[13]+=anchor?anchorHeight(anchor):offset(position.x+m[12],position.z+m[14]);
        object.setMatrixAt(index,matrix);
        if(++count%100===0)yield;
      }
      object.instanceMatrix.needsUpdate=true;
      object.computeBoundingSphere();
      object.boundingBox=null;
      delete userData.terrainAnchors;
    }else if(object.isMesh&&(userData.followTerrain||groundPiece(T,object))){
      yield* gradePalaceMeshes(T,[object],height);
    }else if(object.isMesh){
      if(position.x||position.z)position.y+=offset(position.x,position.z);
      else if(geometry?.attributes.position){
        object.updateMatrix();
        geometry.computeBoundingBox();
        geometry.boundingBox.getCenter(centroid).applyMatrix4(object.matrix);
        position.y+=offset(centroid.x,centroid.z);
      }
    }else if(object.children.length){
      if(position.x||position.z)position.y+=offset(position.x,position.z);
      else for(const child of object.children)yield* grade(child);
    }
    if(++count%100===0)yield;
  }
  for(const object of objects)yield* grade(object);
}
