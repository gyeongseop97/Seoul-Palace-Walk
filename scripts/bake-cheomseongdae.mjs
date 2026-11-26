// Run bake-cheomseongdae-stone.py first, then pass that relief atlas as the last argument.
// node scripts/bake-cheomseongdae.mjs <heritage ASCII STL> <meshoptimizer-0.22-dir> <atlas.webp>
import assert from "node:assert/strict";
import {readFile,writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve} from "node:path";
import {packMeshoptGlb} from "./pack-meshopt-glb.mjs";

const [input,meshopt,texture]=process.argv.slice(2);
if(!input||!meshopt||!texture)throw Error("Pass the heritage STL, meshoptimizer package directory and relief atlas");
const {MeshoptEncoder,MeshoptSimplifier}=createRequire(import.meta.url)(resolve(meshopt));
await Promise.all([MeshoptSimplifier.ready,MeshoptEncoder.ready]);
const [source,atlas]=await Promise.all([readFile(input,"utf8"),readFile(texture)]);
const points=[],indices=[],vertices=new Map();
function vertex(p){
  const key=p.map(n=>Math.round(n*1e5)).join(",");
  if(!vertices.has(key)){vertices.set(key,points.length);points.push(p);}
  return vertices.get(key);
}
function polygon(p){
  for(let i=1;i<p.length-1;i++){
    const a=vertex(p[0]),b=vertex(p[i]),c=vertex(p[i+1]);
    if(a!==b&&b!==c&&c!==a)indices.push(a,b,c);
  }
}
// The source Y axis is vertical. Its separate print caption lies beyond Z=20400.
// Align the center of the two surveyed window jambs with positive Z (south).
const scale=9.17/(20087.1835938-10827.4277344),turn=.105,cs=Math.cos(turn),sn=Math.sin(turn);
const ring=Array.from({length:24},(_,i)=>[1.19*Math.cos(i*Math.PI/12),1.19*Math.sin(i*Math.PI/12)]);
function outsideLanding(poly){
  // Preserve the sill and original stone surfaces. Only recess the packed earth
  // beneath the player; its lip follows the STL floor around the chamber.
  const keep=[];
  for(let i=0;i<ring.length&&poly.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1];
    const distance=p=>dx*(p[2]-a[1])-dz*(p[0]-a[0]);
    const inside=[],outside=[];
    for(let j=0;j<poly.length;j++){
      const p=poly[j],q=poly[(j+1)%poly.length],d=distance(p),e=distance(q);
      (d>=0?inside:outside).push(p);
      if((d>=0)===(e>=0))continue;
      const cross=p.map((v,axis)=>v+(q[axis]-v)*d/(d-e));
      inside.push(cross);outside.push(cross);
    }
    if(outside.length>2)keep.push(outside);
    poly=inside;
  }
  for(const p of keep)polygon(p);
}
let tri=[];
for(const match of source.matchAll(/vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/g)){
  const x=(Number(match[1])-28853.2265625)*scale,y=(Number(match[2])+20087.1835938)*scale,z=(Number(match[3])-17438.64208985)*scale;
  tri.push([cs*x+sn*z,y,-sn*x+cs*z]);
  if(tri.length!==3)continue;
  if(tri.every(p=>p[2]<2.95)){
    if(tri.every(p=>p[1]>4.04&&p[1]<4.17)&&tri.some(p=>Math.hypot(p[0],p[2])<1.72))outsideLanding(tri);
    else polygon(tri);
  }
  tri=[];
}
for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],p=(t,y)=>[t[0],y,t[1]];
  polygon([p(a,3.08),p(b,3.08),[0,3.08,0]].reverse());
  polygon([p(a,4.112),p(b,4.112),p(b,3.08),p(a,3.08)].reverse());
}
assert(points.length>15000&&points.length<25000);
const geometry=Float32Array.from(points.flat());
const [low,error]=MeshoptSimplifier.simplify(Uint32Array.from(indices),geometry,3,2400*3,.012);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const linear=v=>((v/255+.055)/1.055)**2.4;
function bake(triangles,detail){
  const normals=new Float64Array(points.length*3),neighbors=Array.from({length:points.length},()=>new Set());
  const top=triangles.reduce((height,v)=>Math.max(height,points[v][1]),0);
  for(let j=0;j<triangles.length;j+=3){
    const [a,b,c]=triangles.subarray(j,j+3),p=points[a],q=points[b],r=points[c];
    const x=q.map((v,i)=>v-p[i]),y=r.map((v,i)=>v-p[i]);
    const n=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
    for(const v of [a,b,c])for(let k=0;k<3;k++)normals[v*3+k]+=n[k];
    neighbors[a].add(b).add(c);neighbors[b].add(c).add(a);neighbors[c].add(a).add(b);
  }
  const positions=[],shading=[],colors=[],uv=[],out=[],draw=new Map();
  const min=[Infinity,Infinity,Infinity],max=min.map(()=>-Infinity);
  function add(v,sheet){
    const key=v*3+sheet;
    if(draw.has(key))return draw.get(key);
    const dest=draw.size;draw.set(key,dest);
    const p=points[v].map((value,k)=>{
      if(k===1&&value>8)value=8+(value-8)*1.17/(top-8);
      return Math.round(value*2048)/2048;
    }),n=Array.from(normals.subarray(v*3,v*3+3)),len=Math.hypot(...n)||1;
    for(let k=0;k<3;k++){n[k]/=len;min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}
    positions.push(...p);shading.push(...n.map(x=>Math.round(x*127)),0);
    const [x,y,z]=p,rad=Math.hypot(x,z);
    let bend=0,total=0;
    for(const other of neighbors[v]){
      const q=points[other],d=q.map((value,k)=>value-p[k]);
      total+=Math.hypot(...d);bend+=d.reduce((s,t,k)=>s+t*n[k],0);
    }
    const recess=clamp(bend/(total||1),0,.38);
    const height=clamp((y-.65)/6,0,1),inner=rad<1.23&&y<4.12;
    const variation=3*Math.sin(4*x+1.7*y)*Math.cos(4.1*z-1.6*y)+2.5*Math.sin(2.2*x-3*z+3.8*y);
    const base=inner?[128,120,107]:[151+34*height,146+38*height,136+41*height];
    const inward=n[0]*x+n[2]*z<-.5*rad&&y>4&&y<8;
    colors.push(...base.map(value=>Math.round(255*linear(clamp(value+variation-77*recess-(inward?24:0)-(detail?0:14),0,255)))),255);
    if(detail){
      if(sheet===2)uv.push(.5+x*.16,.0625+z*.017);
      else uv.push(Math.atan2(x,z)/(2*Math.PI)+.5+sheet,1-.875*y/9.17);
    }
    return dest;
  }
  for(let i=0;i<triangles.length;i+=3){
    const face=triangles.subarray(i,i+3),angles=Array.from(face,v=>Math.atan2(points[v][0],points[v][2])/(2*Math.PI)+.5);
    const seam=Math.max(...angles)-Math.min(...angles)>.5;
    const [a,b,c]=Array.from(face,v=>points[v]),ab=b.map((value,k)=>value-a[k]),ac=c.map((value,k)=>value-a[k]);
    const nx=ab[1]*ac[2]-ab[2]*ac[1],ny=ab[2]*ac[0]-ab[0]*ac[2],nz=ab[0]*ac[1]-ab[1]*ac[0];
    const horizontal=Math.abs(ny)>.76*Math.hypot(nx,ny,nz)||nx*a[0]+nz*a[2]<0;
    for(let j=0;j<3;j++)out.push(add(face[j],!detail?0:horizontal?2:seam&&angles[j]<.5?1:0));
  }
  assert(draw.size<65536);
  const accessors=[],streams=[];
  function attribute(data,stride,type,componentType,extra={}){
    const count=data.byteLength/stride,index=streams.length;
    accessors.push({bufferView:index,componentType,count,type,...extra});
    streams.push({bytes:new Uint8Array(data.buffer),stride,count,mode:type==="SCALAR"?"TRIANGLES":"ATTRIBUTES"});return index;
  }
  const attributes={POSITION:attribute(Float32Array.from(positions),12,"VEC3",5126,{min,max}),
    NORMAL:attribute(Int8Array.from(shading),4,"VEC3",5120,{normalized:true}),
    COLOR_0:attribute(Uint8Array.from(colors),4,"VEC4",5121,{normalized:true})};
  if(detail)attributes.TEXCOORD_0=attribute(Float32Array.from(uv,v=>Math.round(v*4096)/4096),8,"VEC2",5126);
  const index=attribute(Uint16Array.from(out),2,"SCALAR",5123);
  const doc={asset:{version:"2.0",copyright:"Cultural Heritage Administration (KOGL Type 1), lightweight STL by 카리스χάρης, game adaptation."},
    scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{name:"경주 첨성대",primitives:[{attributes,indices:index,material:0}]}],
    materials:[{doubleSided:true,pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:1,...(detail?{baseColorTexture:{index:0}}:{})}}],accessors};
  return packMeshoptGlb(MeshoptEncoder,doc,streams,detail?atlas:null);
}
for(const [suffix,faces] of [["",Uint32Array.from(indices)],["-lod",low]]){
  const glb=bake(faces,!suffix);
  await writeFile(new URL("../public/art/cheomseongdae"+suffix+".glb",import.meta.url),glb);
  console.log(suffix||"near",faces.length/3,"triangles",glb.length,"bytes");
}
console.log("Distant relative simplification error",error);
