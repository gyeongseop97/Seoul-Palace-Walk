import {graniteMaterial} from "./granite-material.js";

const boxes=new Map();

export function graniteBoxGeometry(T,width,height,depth){
  const key=width+"/"+height+"/"+depth;
  if(!boxes.has(key)){
    const geometry=new T.BoxGeometry(width,height,depth);
    const {position,normal,uv}=geometry.attributes;
    for(let i=0;i<uv.count;i++){
      const side=Math.abs(normal.getX(i))>.5,top=Math.abs(normal.getY(i))>.5;
      uv.setXY(i,side?position.getZ(i):position.getX(i),top?position.getZ(i):position.getY(i));
    }
    boxes.set(key,geometry);
  }
  return boxes.get(key);
}

export function graniteBox(T,parent,x,y,z,width,height,depth){
  const mesh=new T.Mesh(graniteBoxGeometry(T,width,height,depth),graniteMaterial(T));
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
