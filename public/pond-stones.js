import {graniteMaterial} from "./granite-material.js";

// Each outline runs around the widest part of a different fractured stone.
// Width, thickness, cap offset and cap slope determine its silhouette.
const profiles=[
 {rim:[[1.08,.12],[.63,.74],[-.42,.86],[-1,.29],[-.82,-.48],[.30,-.64]],depth:.72,height:.25,cap:.81,lean:.10,slope:.09},
 {rim:[[.99,.20],[.37,.85],[-.54,.78],[-.90,.25],[-.74,-.67],[.57,-.79]],depth:.85,height:.51,cap:.52,lean:-.23,slope:.34},
 {rim:[[1.31,.04],[.77,.63],[-.61,.76],[-1.20,.30],[-.95,-.36],[.11,-.72],[.91,-.53]],depth:.56,height:.34,cap:.69,lean:.18,slope:-.18},
 {rim:[[.89,.26],[.59,.91],[-.21,.84],[-.94,.42],[-.86,-.48],[-.12,-.79],[.74,-.60]],depth:.94,height:.46,cap:.68,lean:-.06,slope:.15},
 {rim:[[1.12,.18],[.60,.79],[-.10,.83],[-.94,.12],[-.49,-.76],[.56,-.69]],depth:.79,height:.40,cap:.57,lean:.23,slope:-.28}
];
const colors=[0xe2dcd0,0xcdd0c6,0xece5d5,0xcec5bc,0xd8d6cc];
let wetGranite;

export function pondBankStones(T,shore,center,rand){
 if(!wetGranite){
  wetGranite=graniteMaterial(T).clone();
  wetGranite.vertexColors=true;
 }
 const position=[],color=[],uv=[],tint=new T.Color();
 function triangle(a,b,c,uAxis,vAxis,shade){
  for(const p of [a,b,c]){
   position.push(...p);
   const light=shade*(p[1]<.04?.91:1);
   color.push(tint.r*light,tint.g*light,tint.b*light);
   uv.push(p[uAxis],p[vAxis]);
  }
 }
 function stone(x,z,angle,size,profile){
  const {rim,cap,lean,slope,depth,height}=profile;
  const cs=Math.cos(angle),sn=Math.sin(angle),w=size,h=height*(.68+.48*rand())*size/.55;
  const point=(u,y,v)=>[x+w*(cs*u-sn*v),y,z+w*(sn*u+cs*v)];
  const lower=[],belt=[],upper=[];
  for(const [u,v] of rim){
   const jitter=.90+rand()*.17;
   lower.push(point(u*.75,-.085,v*depth*.75));
   belt.push(point(u*jitter,h*(.10+.17*rand()),v*depth*jitter));
   upper.push(point(u*cap+lean,h*(.95+u*slope+rand()*.06),v*depth*cap));
  }
  const crown=point(lean*.85,h*(1.02+lean*slope),0);
  for(let i=0;i<rim.length;i++){
   const j=(i+1)%rim.length;
   const across=Math.abs(belt[i][0]-belt[j][0])>Math.abs(belt[i][2]-belt[j][2])?0:2;
   triangle(lower[i],belt[i],belt[j],across,1,.93);
   triangle(lower[i],belt[j],lower[j],across,1,.93);
   triangle(belt[i],upper[i],upper[j],across,1,.98);
   triangle(belt[i],upper[j],belt[j],across,1,.98);
   triangle(upper[i],crown,upper[j],0,2,1);
  }
 }
 // Carry spacing across short segments so corners don't acquire extra stones.
 let next=.36;
 for(let i=0;i<shore.length;i++){
  const a=shore[i],b=shore[(i+1)%shore.length],dx=b.x-a.x,dz=b.z-a.z;
  const length=Math.hypot(dx,dz);
  if(length<.001)continue;
  const heading=Math.atan2(dz,dx);
  while(next<length){
   const size=.27+.41*rand(),offset=(rand()-.5)*.79;
   const x=a.x-center.x+(dx*next-dz*offset)/length,z=a.z-center.z+(dz*next+dx*offset)/length;
   tint.setHex(colors[Math.floor(rand()*colors.length)]);
   stone(x,z,heading+(rand()-.5)*1.55,size,profiles[Math.floor(rand()*profiles.length)]);
   if(rand()<.17){
    tint.multiplyScalar(.91);
    stone(x+dz*.40/length,z-dx*.40/length,heading+1.2,size*.47,profiles[2]);
   }
   next+=size+.37+rand()*.41;
  }
  next-=length;
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute("position",new T.Float32BufferAttribute(position,3));
 geometry.setAttribute("color",new T.Float32BufferAttribute(color,3));
 geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
 geometry.computeVertexNormals();
 geometry.computeBoundingSphere();
 const mesh=new T.Mesh(geometry,wetGranite);
 mesh.name="연못가 자연석";mesh.position.set(center.x,0,center.z);mesh.receiveShadow=true;
 return mesh;
}
