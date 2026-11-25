import assert from "node:assert/strict";
import {readFile,writeFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {pathToFileURL} from "node:url";
import {gzipSync} from "node:zlib";
import {normalChoice,restoreSurveyNormals,smoothSurveyNormals,surveyIndexHash} from "../public/survey-normals.js";
import {prepareSurveyTerrain} from "../public/survey-terrain.js";

// Run with the same Three.js package version as public/index.html. Supplying
// --check as the last argument verifies an existing bake without writing files.
const [threeDir,inputDir,outputDir,...flags]=process.argv.slice(2);
if(!threeDir||!inputDir||!outputDir)throw Error("Usage: node scripts/bake-palace-normals.mjs <three-package-dir> <source-glb-dir> <destination-dir> [--check]");
const lib=path=>import(pathToFileURL(resolve(threeDir,path)));
const [T,{GLTFLoader},{MeshoptDecoder}]=await Promise.all([lib("build/three.module.js"),
  lib("examples/jsm/loaders/GLTFLoader.js"),lib("examples/jsm/libs/meshopt_decoder.module.js")]);
// Textures stay byte-for-byte in the original BIN chunk. The offline geometry
// comparison only needs a texture placeholder for GLTFLoader.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const parse=bytes=>loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),"");
const align=n=>Math.ceil(n/4)*4;

function packModel(json,parts){
  const binary=Buffer.concat(parts);json.buffers[0].byteLength=binary.length;
  const body=Buffer.from(JSON.stringify(json)),length=align(body.length);
  const header=Buffer.alloc(20);
  header.write("glTF");header.writeUInt32LE(2,4);header.writeUInt32LE(28+length+binary.length,8);
  header.writeUInt32LE(length,12);header.write("JSON",16);
  const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length,0);binHeader.write("BIN\0",4,"ascii");
  return Buffer.concat([header,body,Buffer.alloc(length-body.length,32),binHeader,binary]);
}

function bakeGeometry(geometry){
  const position=geometry.attributes.position,index=geometry.index.array;
  const canonical=new Map(),weld=new Uint32Array(position.count),bytes=[];
  for(let i=0;i<position.count;i++){
    const key=position.getX(i)+"/"+position.getY(i)+"/"+position.getZ(i);
    const id=canonical.get(key)??i;canonical.set(key,id);weld[i]=id;
    let delta=i-id;
    while(delta>=128){bytes.push(128+delta%128);delta=Math.floor(delta/128);}
    bytes.push(delta);
  }
  const previous=new Int32Array(position.count).fill(-1);
  const reference=smoothSurveyNormals(T,geometry,(i,candidates,accepted,normals)=>{
    const vertex=weld[index[i]],last=previous[vertex],start=i*3;
    previous[vertex]=start;
    if(last>=0&&normals[start]===normals[last]&&normals[start+1]===normals[last+1]&&normals[start+2]===normals[last+2]){
      bytes.push(normalChoice.previous);
    }else if(!accepted.length){
      bytes.push(normalChoice.zero);
    }else if(accepted.every(face=>face===Math.floor(i/3))){
      bytes.push(normalChoice.face);
    }else if(accepted.length===candidates.length){
      bytes.push(normalChoice.all);
    }else{
      bytes.push(normalChoice.mask);
      const used=new Set(accepted);
      for(let k=0;k<candidates.length;k+=8){
        let mask=0;
        for(let bit=0;bit<8&&k+bit<candidates.length;bit++)if(used.has(candidates[k+bit]))mask|=1<<bit;
        bytes.push(mask);
      }
    }
  });
  return {reference,gzip:gzipSync(Uint8Array.from(bytes),{level:9})};
}

function terrainMeshes(asset,name){
  prepareSurveyTerrain(T,asset.scene,name,[{userData:{surveyShell:[{}]}}]);
  const meshes=[];asset.scene.traverse(mesh=>{if(mesh.isMesh)meshes.push(mesh);});return meshes;
}

for(const name of ["junghwamun","seokjojeon","jeonggwanheon","junghwajeon","hamnyeongjeon","seogeodang"]){
  const path=name+".glb",input=await readFile(join(inputDir,path));
  const length=input.readUInt32LE(12),json=JSON.parse(input.subarray(20,20+length));
  const binary=input.subarray(28+length);
  const primitives=json.meshes.flatMap(mesh=>mesh.primitives);
  // The baker owns only its trailing buffer views. Rebuilding a previously
  // baked model replaces those views while preserving its original GLB data.
  const old=primitives.map(p=>p.extras?.surveyLighting?.bufferView).filter(Number.isInteger).sort((a,b)=>a-b);
  if(old.length)assert.deepEqual(old,Array.from({length:old.length},(_,i)=>json.bufferViews.length-old.length+i));
  const first=old.length?json.bufferViews[old[0]].byteOffset:binary.length;
  if(old.length)json.bufferViews.length=old[0];
  const parts=[binary.subarray(0,first)],asset=await parse(input),references=[];
  let offset=first;
  for(const mesh of terrainMeshes(asset,name)){
    const refs=asset.parser.associations.get(mesh),primitive=json.meshes[refs.meshes].primitives[refs.primitives];
    const geometry=mesh.geometry,{reference,gzip}=bakeGeometry(geometry);
    const bufferView=json.bufferViews.length;
    json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:gzip.length});
    primitive.extras={...primitive.extras,surveyLighting:{version:1,bufferView,vertices:geometry.attributes.position.count,
      corners:geometry.index.count,indexHash:surveyIndexHash(geometry.index.array)}};
    references.push(reference);
    parts.push(gzip,Buffer.alloc(align(gzip.length)-gzip.length));offset+=align(gzip.length);
  }
  const output=packModel(json,parts),decoded=await parse(output);
  for(const [i,mesh] of terrainMeshes(decoded,name).entries()){
    const restored=await restoreSurveyNormals(T,mesh.geometry,decoded.parser);
    assert(restored,name+" did not restore");
    for(const [key,attr] of Object.entries(references[i].attributes)){
      const a=attr.array,b=restored.attributes[key].array;
      assert(Buffer.from(a.buffer,a.byteOffset,a.byteLength).equals(Buffer.from(b.buffer,b.byteOffset,b.byteLength)),name+" changed "+key);
    }
  }
  if(flags.includes("--check"))assert(output.equals(await readFile(join(outputDir,path))),name+" must be rebaked");
  else await writeFile(join(outputDir,path),output);
  console.log(name+": "+(offset-first)+" lighting bytes, all triangle corners match");
}
