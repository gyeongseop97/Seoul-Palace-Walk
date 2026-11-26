// Offline build: node scripts/bake-palace-color-lods.mjs <meshoptimizer-0.22-dir> <three-0.180-dir>
import assert from "node:assert/strict";
import {readFile,writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {prepareSurveyTerrain} from "../public/survey-terrain.js";

const [meshoptDir,threeDir]=process.argv.slice(2);
if(!meshoptDir||!threeDir)throw Error("Pass the meshoptimizer and Three.js package directories");
const {MeshoptEncoder,MeshoptSimplifier}=createRequire(import.meta.url)(resolve(meshoptDir));
const threeFile=path=>pathToFileURL(resolve(threeDir,path)).href;
const [T,{GLTFLoader}]=await Promise.all([import(threeFile("build/three.module.js")),
  import(threeFile("examples/jsm/loaders/GLTFLoader.js")),MeshoptEncoder.ready,MeshoptSimplifier.ready]);
MeshoptSimplifier.useExperimentalFeatures=true;
const directory=fileURLToPath(new URL("../public/",import.meta.url));

function pack(doc,streams){
  const parts=[],views=[];
  let physical=0,virtual=0;
  for(const {bytes,count,stride,mode} of streams){
    const compressed=MeshoptEncoder.encodeGltfBuffer(bytes,count,stride,mode);
    const pad=Buffer.alloc((4-compressed.length%4)%4), attributes=mode==="ATTRIBUTES";
    views.push({buffer:1,byteOffset:virtual,byteLength:bytes.length,target:attributes?34962:34963,
      ...(attributes?{byteStride:stride}:{}),extensions:{EXT_meshopt_compression:{
        buffer:0,byteOffset:physical,byteLength:compressed.length,byteStride:stride,mode,count
      }}});
    virtual+=Math.ceil(bytes.length/4)*4;
    physical+=compressed.length+pad.length;
    parts.push(compressed,pad);
  }
  doc.bufferViews=views;
  doc.buffers=[{byteLength:physical},{byteLength:virtual,extensions:{EXT_meshopt_compression:{fallback:true}}}];
  doc.extensionsUsed=doc.extensionsRequired=["EXT_meshopt_compression","KHR_mesh_quantization"];
  const json=Buffer.from(JSON.stringify(doc)), padding=Buffer.alloc((4-json.length%4)%4,32);
  const header=Buffer.alloc(20), binaryHeader=Buffer.alloc(8);
  header.write("glTF");header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+padding.length+physical,8);
  header.writeUInt32LE(json.length+padding.length,12);header.write("JSON",16);
  binaryHeader.writeUInt32LE(physical);binaryHeader.write("BIN",4);
  return Buffer.concat([header,json,padding,binaryHeader,...parts]);
}

for(const name of ["sajeongmun","sajeongjeon","gyeonghoeru"]){
  const source=await readFile(resolve(directory,name+".glb"));
  const doc=JSON.parse(source.subarray(20,20+source.readUInt32LE(12)));
  const asset=await new GLTFLoader().parseAsync(source.buffer.slice(source.byteOffset,source.byteOffset+source.length),"");
  prepareSurveyTerrain(T,asset.scene,name,[asset.scene]);
  const geometry=asset.scene.getObjectByProperty("isMesh",true).geometry;
  geometry.computeVertexNormals();
  const {position,normal,color}=geometry.attributes;
  const index=geometry.index.array;
  assert(position.itemSize===3&&color.itemSize===4&&color.normalized&&index.length%3===0);
  const attributes=new Float32Array(position.count*6);
  for(let v=0;v<position.count;v++){
    attributes.set(normal.array.subarray(v*3,v*3+3),v*6);
    for(let a=0;a<3;a++)attributes[v*6+3+a]=color.array[v*4+a]/255;
  }
  const [triangles,error]=MeshoptSimplifier.simplifyWithAttributes(Uint32Array.from(index),position.array,3,
    attributes,6,[.04,.04,.04,.18,.18,.18],null,Math.floor(index.length*.31/3)*3,.02);
  const [remap,vertices]=MeshoptEncoder.reorderMesh(triangles,true,false);
  const positions=new Float32Array(vertices*3),normals=new Int8Array(vertices*4),colors=new Uint8Array(vertices*4);
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let v=0;v<remap.length;v++){
    const dest=remap[v];
    if(dest>=vertices)continue;
    colors.set(color.array.subarray(v*4,v*4+4),dest*4);
    for(let a=0;a<3;a++){
      const value=position.array[v*3+a];
      positions[dest*3+a]=value;
      normals[dest*4+a]=Math.round(normal.array[v*3+a]*127);
      min[a]=Math.min(min[a],value);max[a]=Math.max(max[a],value);
    }
  }
  assert(vertices<=65535);
  const streams=[
    {data:positions,stride:12,mode:"ATTRIBUTES"}, {data:colors,stride:4,mode:"ATTRIBUTES"},
    {data:normals,stride:4,mode:"ATTRIBUTES"}, {data:Uint16Array.from(triangles),stride:2,mode:"TRIANGLES"}
  ].map(({data,stride,mode})=>({bytes:new Uint8Array(data.buffer),stride,mode,count:data.byteLength/stride}));
  doc.meshes[0].primitives[0]={...doc.meshes[0].primitives[0],attributes:{POSITION:0,COLOR_0:1,NORMAL:2},indices:3};
  doc.accessors=[
    {bufferView:0,componentType:5126,count:vertices,type:"VEC3",min,max},
    {bufferView:1,componentType:5121,count:vertices,type:"VEC4",normalized:true},
    {bufferView:2,componentType:5120,count:vertices,type:"VEC3",normalized:true},
    {bufferView:3,componentType:5123,count:triangles.length,type:"SCALAR"}
  ];
  const model=pack(doc,streams);
  await writeFile(resolve(directory,name+"-lod.glb"),model);
  console.log(name,{original:index.length/3,distant:triangles.length/3,vertices,error,bytes:model.length});
}
