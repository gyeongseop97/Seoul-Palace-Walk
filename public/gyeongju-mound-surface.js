import {cheonma,cheonmaLocal,cheonmaPoint,twinSection,twinTombName} from "./daereungwon.js";

const sequence=(n,at)=>Array.from({length:n},(_,i)=>at(i));
const grassBands=sequence(13,i=>i*Math.PI/24),grassAngles=sequence(53,i=>i*Math.PI/26);
const lip=Math.acos(Math.sqrt(3.155/cheonma.height)),edge=Math.asin(2.08/(cheonma.radius*Math.sin(lip)));
const doorBands=[...sequence(21,i=>i*Math.PI/40),lip].sort((a,b)=>a-b);
const doorAngles=[...sequence(65,i=>-Math.PI+i*Math.PI/32).filter(a=>Math.abs(a)>edge),-edge,edge].sort((a,b)=>a-b);
const radii=bands=>bands.map(a=>Math.sin(a));
const grassR=radii(grassBands),doorR=radii(doorBands);
const sections=sequence(65,i=>-60*Math.cos(i*Math.PI/64));
const lobes=sections.map(z=>{
 const profile=twinSection(z);
 return {width:39.8*profile,height:(22.5+.5*Math.tanh(z/12))*profile**1.6};
});
const arc=sequence(37,i=>Math.cos(i*Math.PI/36));

// The renderer and the walker's soles use the same triangles, including the saddle
// between Hwangnam's two summits and the opening cut into Cheonmachong's south face.
export function moundMesh(m){
 const vertices=[],indices=[];
 function grid(rows,cols,vertex,omit){
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
   vertices.push(vertex(i,j));
   if(i+1===rows||j+1===cols||omit?.(i,j))continue;
   const t=i*cols+j;
   indices.push(t,t+1,t+cols,t+1,t+cols+1,t+cols);
  }
 }
 if(m.name===twinTombName){
  grid(65,37,(i,j)=>{
   const z=sections[i],{width,height}=lobes[i];
   return [m.x+z*.043+width*arc[j],height*(1-arc[j]**2)-.055,m.z+z];
  });
 }else if(m.name==="천마총"){
  const {height:h,radius:r}=cheonma;
  grid(doorR.length,doorAngles.length,(i,j)=>{
   const rad=doorR[i],a=doorAngles[j],p=cheonmaPoint(r*rad*Math.sin(a),r*rad*Math.cos(a));
   return [p.x,h*(1-rad*rad)-.055,p.z];
  },(i,j)=>doorBands[i]>=lip&&Math.abs((doorAngles[j]+doorAngles[j+1])/2)<edge);
  // The entrance's angular coordinates run clockwise when seen from above.
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 }else{
  const c=Math.cos(m.yaw),s=Math.sin(m.yaw);
  grid(grassR.length,grassAngles.length,(i,j)=>{
   const rad=grassR[i],theta=grassAngles[j],dx=rad*m.rx*Math.cos(theta),dz=rad*m.rz*Math.sin(theta);
   return [m.x+c*dx+s*dz,m.height*(1-rad*rad)-.065,m.z-s*dx+c*dz];
  });
 }
 return {vertices,indices};
}

function interval(values,n){
 let lo=0,hi=values.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(n<values[mid])hi=mid;else lo=mid;}
 return lo;
}
// Within each radial wedge the mesh has parallel, flat ring edges. Its height
// interpolates linearly between their perpendicular distances, not as a sphere.
function radialHeight(x,z,h,bands,angles,entrance){
 const r=Math.hypot(x,z);
 if(r>=1)return 0;
 let a=Math.atan2(z,x);
 if(!entrance&&a<0)a+=2*Math.PI;
 const j=interval(angles,a),left=angles[j],right=angles[j+1];
 const radius=r*Math.cos(a-(left+right)/2)/Math.cos((right-left)/2);
 if(radius>=1||entrance&&radius>Math.sin(lip)&&Math.abs(a)<edge)return 0;
 const i=interval(bands,radius),r0=bands[i],r1=bands[i+1];
 return Math.max(0,h*(1-r0*r0-(radius-r0)*(r1+r0))-(entrance?.055:.065));
}
const mix=(a,b,t)=>a+(b-a)*t;
function twinTurf(m,p){
 const z=p.z-m.z;
 if(Math.abs(z)>=60)return 0;
 const i=interval(sections,z),t=(z-sections[i])/(sections[i+1]-sections[i]);
 const a=lobes[i],b=lobes[i+1],w=mix(a.width,b.width,t),x=p.x-m.x-z*.043;
 if(Math.abs(x)>=w)return 0;
 const j=Math.min(35,Math.floor(Math.acos(x/w)*36/Math.PI)),left=arc[j+1],right=arc[j];
 const near=1-left*left,far=1-right*right,diag=mix(a.width*left,b.width*right,t);
 // Interpolate within one of the two triangles on either side of the B–C diagonal.
 const onDiagonal=mix(a.height*near,b.height*far,t);
 const section=x>=diag?a:b;
 const delta=section.width>0?(x-diag)*(far-near)*section.height/(section.width*(right-left)):0;
 return Math.max(0,onDiagonal+delta-.055);
}
export function moundSurfaceHeight(m,p){
 if(m.name===twinTombName)return twinTurf(m,p);
 if(m.name==="천마총"){
  const {a,b}=cheonmaLocal(p);
  return radialHeight(b/cheonma.radius,a/cheonma.radius,cheonma.height,doorR,doorAngles,true);
 }
 const dx=p.x-m.x,dz=p.z-m.z,c=Math.cos(m.yaw),s=Math.sin(m.yaw);
 return radialHeight((c*dx-s*dz)/m.rx,(s*dx+c*dz)/m.rz,m.height,grassR,grassAngles,false);
}
