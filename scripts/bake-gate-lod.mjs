// Offline build: node scripts/bake-gate-lod.mjs [meshoptimizer package]
// Python 3.11 needs bpy 4.3, numpy and Pillow. Set LOD_PYTHON for a specific interpreter.
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve, join, dirname} from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";

const require=createRequire(import.meta.url);
const {MeshoptDecoder,MeshoptSimplifier,MeshoptEncoder}=require(process.argv[2]?resolve(process.argv[2]):"meshoptimizer");
await Promise.all([MeshoptDecoder.ready, MeshoptSimplifier.ready, MeshoptEncoder.ready]);
const root=fileURLToPath(new URL("../",import.meta.url));
const source=readFileSync(join(root,"public/junghwamun.glb"));
const jsonSize=source.readUInt32LE(12), gltf=JSON.parse(source.subarray(20,20+jsonSize));
const bin=source.subarray(28+jsonSize), primitive=gltf.meshes[0].primitives[0];
function decode(accessorId, Type){
  const accessor=gltf.accessors[accessorId];
  const view=gltf.bufferViews[accessor.bufferView].extensions.EXT_meshopt_compression;
  const data=new Uint8Array(view.count*view.byteStride);
  MeshoptDecoder.decodeGltfBuffer(data, view.count, view.byteStride, bin.subarray(view.byteOffset,view.byteOffset+view.byteLength),view.mode,view.filter);
  return new Type(data.buffer);
}
const sourcePosition=decode(primitive.attributes.POSITION, Uint16Array);
const sourceUv=decode(primitive.attributes.TEXCOORD_0, Uint16Array);
const sourceIndex=decode(primitive.indices, Uint32Array);
const positions=[], weld=new Map(), sourceVertex=new Uint32Array(sourcePosition.length/4);
for(let i=0;i<sourceVertex.length;i++){
  const xyz=sourcePosition.subarray(4*i,4*i+3);
  const key=(xyz[0]*65536+xyz[1])*65536+xyz[2];
  if(!weld.has(key)){
    weld.set(key,positions.length/3);
    positions.push(...xyz);
  }
  sourceVertex[i]=weld.get(key);
}
const xyz=Float32Array.from(positions);
const topology=sourceIndex.map(i=>sourceVertex[i]);
const [reduced,error]=MeshoptSimplifier.simplify(topology,xyz,3,33000*3,.025);
console.log("Original and reduced face counts:",sourceIndex.length/3,reduced.length/3,"relative error",error);

// Keep quantized attributes, local coordinates and texture exactly as baked.
// Reordering the index/vertex streams also improves post-transform cache locality.
function packGeometry(raw){
  const size=raw.readUInt32LE(12), doc=JSON.parse(raw.subarray(20,20+size));
  const binary=raw.subarray(28+size), viewBytes=view=>binary.subarray(view.byteOffset,view.byteOffset+view.byteLength);
  const indexView=doc.bufferViews[3], indexBytes=viewBytes(indexView);
  const IndexType=doc.accessors[3].componentType===5125?Uint32Array:Uint16Array;
  const indices=Uint32Array.from(new IndexType(indexBytes.buffer,indexBytes.byteOffset,doc.accessors[3].count));
  const [remap]=MeshoptEncoder.reorderMesh(indices,true,false);
  const parts=[];
  let physical=0, virtual=0;
  function append(part){
    const offset=physical, padding=Buffer.alloc((4-part.length%4)%4);
    parts.push(part,padding);
    physical+=part.length+padding.length;
    return offset;
  }
  for(let i=0;i<4;i++){
    const view=doc.bufferViews[i], count=doc.accessors[i].count;
    const mode=i===3?"TRIANGLES":"ATTRIBUTES";
    const stride=view.byteStride??IndexType.BYTES_PER_ELEMENT;
    let bytes;
    if(i===3)bytes=new Uint8Array(IndexType.from(indices).buffer);
    else{
      const original=viewBytes(view);
      bytes=new Uint8Array(original.length);
      for(let v=0;v<count;v++)bytes.set(original.subarray(v*stride,(v+1)*stride),remap[v]*stride);
    }
    const compressed=MeshoptEncoder.encodeGltfBuffer(bytes,count,stride,mode);
    view.buffer=1;
    view.byteOffset=virtual;
    virtual+=Math.ceil(bytes.length/4)*4;
    view.extensions={EXT_meshopt_compression:{
      buffer:0,byteOffset:append(compressed),byteLength:compressed.length,byteStride:stride,mode,count
    }};
  }
  const image=doc.bufferViews[doc.images[0].bufferView];
  image.byteOffset=append(viewBytes(image));
  doc.extensionsRequired.push("EXT_meshopt_compression");
  doc.extensionsUsed.push("EXT_meshopt_compression");
  doc.buffers=[{byteLength:physical},{byteLength:virtual,extensions:{EXT_meshopt_compression:{fallback:true}}}];
  const json=Buffer.from(JSON.stringify(doc));
  const desc=Buffer.alloc(Math.ceil(json.length/4)*4,0x20);json.copy(desc);
  const header=Buffer.alloc(20),chunk=Buffer.alloc(8);
  header.write("glTF");header.writeUInt32LE(2,4);header.writeUInt32LE(28+desc.length+physical,8);
  header.writeUInt32LE(desc.length,12);header.write("JSON",16);
  chunk.writeUInt32LE(physical);chunk.write("BIN",4);
  return Buffer.concat([header,desc,chunk,...parts]);
}

const temporary=mkdtempSync(join(tmpdir(),"gate-lod-"));
try{
  for(const [name,data] of Object.entries({xyz,topology,reduced,uv:sourceUv,sourceIndex})){
    writeFileSync(join(temporary,name+".bin"),new Uint8Array(data.buffer,data.byteOffset,data.byteLength));
  }
  const image=gltf.bufferViews[gltf.images[0].bufferView];
  writeFileSync(join(temporary,"source.webp"),bin.subarray(image.byteOffset??0,(image.byteOffset??0)+image.byteLength));
  writeFileSync(join(temporary,"source.json"),JSON.stringify({node:gltf.nodes[0],material:gltf.materials[0]}));
  const baked=join(temporary,"baked.glb");
  execFileSync(process.env.LOD_PYTHON??"python",[join(root,"scripts/bake-gate-atlas.py"),temporary,baked],{stdio:"inherit"});
  const packed=packGeometry(readFileSync(baked));
  writeFileSync(join(root,"public/junghwamun-lod.glb"),packed);
  console.log("Packed GLB bytes:",packed.length);
}finally{
  if(dirname(resolve(temporary))===resolve(tmpdir()))rmSync(temporary,{recursive:true,force:true});
}
