import * as T from "three";
import {coastalMasonry} from "./pohang-masonry.js";
import {beachLimits,beachAccess,sandEdge,sandCrest,cycleX,upperRoadEdge,wallSolid,accessHeight} from "./pohang-beach-profile.js";

const [north,south]=beachLimits;
// Keep the bicycle lane distinct from the sea-side paving where the beach pinches by the pier.
function section(z){
 const end=sandEdge(z),red=Math.min(cycleX(z),end-2.4);
 return {end,red,start:Math.min(upperRoadEdge(z),red-2.6)};
}
export function plantedSpot(z){
 const {end,red,start}=section(z);
 // Use wide tree pits on the road side. Narrow reaches have occasional planting in the plaza.
 const x=red-start>5.1?(start+red-1.5)*.5:end-red>10?red+4.25:null;
 if(x===null||Math.abs(z+179)<8||Math.abs(z+86)<24||Math.abs(z+126)<8)return null;
 return {x,z};
}
export function buildBeachFront(root,rows,{box,post}){
 const batches=new Map(),wallUv=[];
 function quad(layer,a,b,c,d){
  if(!batches.has(layer))batches.set(layer,[]);
  batches.get(layer).push(...a,...b,...c,...a,...c,...d);
  if(layer==="stone"){
   // The long seawall runs along the beach; stair cheeks turn inland. Keep the grain and joints horizontal on both.
   const axis=Math.abs(b[0]-a[0])>Math.abs(b[2]-a[2])?0:2;
   for(const p of [a,b,c,a,c,d])wallUv.push(p[axis],p[1]);
  }
 }
 const tint={roadPavers:0x777b78,plaza:0xc7c6bb,cycle:0xb87f70,edge:0xa49c8c,seat:0xbaa997,face:0x948d82,nose:0xb8b3a5,ramp:0xb8afa0};
 const zRows=rows.filter(z=>z>=-833&&z<=284);
 for(let k=1;k<zRows.length;k++){
  const z=zRows[k-1],v=zRows[k],m=(z+v)*.5,a=section(z),b=section(v);
  const strip=(name,xa,xb,ua,ub,h)=>quad(name,[xa,h,z],[ua,h,v],[ub,h,v],[xb,h,z]);
  strip("roadPavers",a.start,a.red-1.46,b.start,b.red-1.46,1.885);
  strip("cycle",a.red-1.46,a.red+1.46,b.red-1.46,b.red+1.46,1.903);
  strip("plaza",a.red+1.46,a.end,b.red+1.46,b.end,1.89);
  if(m<north||m>south||!wallSolid(m))continue;
  // A low granite coping and a battered block face hold back the upper terrace.
  strip("edge",a.end-.42,a.end+.04,b.end-.42,b.end+.04,1.918);
  quad("stone",[a.end+.04,1.918,z],[b.end+.04,1.918,v],[b.end+.17,sandCrest(v)-.045,v],[a.end+.17,sandCrest(z)-.045,z]);
 }
 for(const g of beachAccess){
  const z=g.z-g.width*.5,v=g.z+g.width*.5,a=sandEdge(z),b=sandEdge(v);
  const num=g.steps||1;
  for(let k=0;k<num;k++){
   const left=g.run*k/num,right=g.run*(k+1)/num;
   const nearA=accessHeight(g,z,left+.001)+.017,nearB=accessHeight(g,v,left+.001)+.017;
   const farA=accessHeight(g,z,right+.001)+.017,farB=accessHeight(g,v,right+.001)+.017;
   const endA=g.steps?nearA:farA,endB=g.steps?nearB:farB;
   quad(g.steps?"seat":"ramp",[a+left,nearA,z],[b+left,nearB,v],[b+right,endB,v],[a+right,endA,z]);
   if(g.steps){
    quad("face",[a+right,endA,z],[b+right,endB,v],[b+right,farB,v],[a+right,farA,z]);
    quad("nose",[a+right-.065,endA+.006,z],[b+right-.065,endB+.006,v],[b+right,endB+.006,v],[a+right,endA+.006,z]);
   }
   for(const [x,zz,n,f] of [[a,z,nearA,endA],[b,v,nearB,endB]]){
    quad("stone",[x+left,n,zz],[x+right,f,zz],[x+right,sandCrest(zz)-.16,zz],[x+left,sandCrest(zz)-.16,zz]);
   }
  }
 }
 for(const [key,data] of batches){
  const geom=new T.BufferGeometry();geom.setAttribute("position",new T.Float32BufferAttribute(data,3));geom.computeVertexNormals();
  const wall=key==="stone";
  if(wall)geom.setAttribute("uv",new T.Float32BufferAttribute(wallUv,2));
  const mat=wall?coastalMasonry():new T.MeshStandardMaterial({color:tint[key],side:T.DoubleSide,roughness:.92});
  if(["plaza","roadPavers","ramp"].includes(key)){
   mat.onBeforeCompile=shader=>{
    shader.vertexShader="varying vec3 promenadePoint;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\npromenadePoint=position;");
    shader.fragmentShader="varying vec3 promenadePoint;\n"+shader.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\nvec2 p=promenadePoint.xz/vec2(.64,.39);p.x+=.5*mod(floor(p.y),2.);vec2 grout=min(fract(p),1.-fract(p))/max(fwidth(p),vec2(.004));float close=1.-smoothstep(9.,42.,length(cameraPosition.xz-promenadePoint.xz));diffuseColor.rgb*=.985+.025*fract(sin(dot(floor(p),vec2(14.32,28.17)))*18453.)-.19*close*(1.-smoothstep(.1,1.1,min(grout.x,grout.y)));");
   };
   mat.customProgramCacheKey=()=>key;
  }
  const mesh=new T.Mesh(geom,mat);mesh.receiveShadow=true;root.add(mesh);
 }
 const benchCount=17;
 for(let i=0;i<benchCount;i++){
  const z=-743+i*58;
  const {red,end}=section(z);if(end-red<7.6||beachAccess.some(g=>Math.abs(g.z-z)<g.width*.5+2)||Math.abs(z+85)<22||Math.abs(z+210)<6)continue;
  const x=Math.min(end-1.85,red+4.3);
  for(const dz of [-.78,.78]){box(root,0x616763,x,2.10,z+dz,.48,.42,.11);}
  for(let j=0;j<4;j++)box(root,0x9e7859,x-.25+j*.15,2.32,z,.137,.10,1.98);
  for(let j=0;j<2;j++)box(root,0xa47d59,x-.32,2.57+j*.17,z,.09,.135,1.99);
 }
 // The public cycleway continues to the pavilion and around the headland; keep the pier entrance open.
 for(let z=-814;z<268;z+=32){
  const p=plantedSpot(z);if(!p||Math.abs(z+805)<6)continue;
  box(root,0x8c8880,p.x,1.901,z,2.42,.034,2.42);
  box(root,0x625e4f,p.x,1.927,z,2.10,.035,2.10);
  if((z+814)%96===0){post(root,0x56615c,p.x+1.27,3.96,z,.064,4.22,.064);post(root,0xf1dfb9,p.x+1.27,6.09,z,.23,.15,.23);}
 }
}
