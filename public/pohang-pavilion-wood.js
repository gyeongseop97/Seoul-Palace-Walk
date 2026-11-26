import * as T from "three";
import {timberMaterial} from "./timber-material.js";

// One mesh for the finished floorboards and treads. The grain follows the sawn length of each board.
export function pavilionDecking(){
 const unit=new T.BoxGeometry(),template=unit.attributes,positions=[],normals=[],colors=[],uvs=[],indices=[];
 const color=new T.Color();let boardCount=0;
 function board(x,y,z,width,height,depth,tint,alongX=false){
  const start=positions.length/3,index=boardCount++,uOffset=index*.61803%1,vOffset=index*.41421%1;
  color.set(tint);
  for(let i=0;i<template.position.count;i++){
   const dx=template.position.getX(i)*width,dy=template.position.getY(i)*height,dz=template.position.getZ(i)*depth;
   const nx=template.normal.getX(i),ny=template.normal.getY(i),nz=template.normal.getZ(i);
   positions.push(x+dx,y+dy,z+dz);normals.push(nx,ny,nz);colors.push(color.r,color.g,color.b);
   const along=alongX?dx:dz,across=alongX?dz:dx,end=alongX?nx:nz;
   uvs.push((end?across:along)/2+uOffset,(ny?across:dy)/.4+vOffset);
  }
  for(const i of unit.index.array)indices.push(start+i);
 }
 function mount(parent){
  const geometry=new T.BufferGeometry();
  for(const [name,values,components] of [["position",positions,3],["normal",normals,3],["color",colors,3],["uv",uvs,2]]){
   geometry.setAttribute(name,new T.Float32BufferAttribute(values,components));
  }
  geometry.setIndex(indices);unit.dispose();
  const material=timberMaterial(T).clone();material.vertexColors=true;
  const mesh=new T.Mesh(geometry,material);mesh.name="영일대 누각 마루와 나무계단";parent.add(mesh);
 }
 return {board,mount};
}
