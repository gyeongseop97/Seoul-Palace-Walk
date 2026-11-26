import * as T from "three";
import {registerDistrictLod} from "./gyeongju-mesh.js";
import {templeGranite} from "./bulguksa-halls.js";
import {templeAxis} from "./bulguksa-ground.js";

// Project the same photographic granite used on the hall plinth onto each cut face.
// Keep UVs within the stone patch, including the bevels and rounded shoulders.
function dressedBlock(post){
 const outline=new T.Shape();
 outline.moveTo(-.5,-.5);outline.lineTo(.5,-.5);
 if(post){
  outline.lineTo(.5,.30);outline.quadraticCurveTo(.49,.5,0,.5);
  outline.quadraticCurveTo(-.49,.5,-.5,.30);
 }else{outline.lineTo(.5,.5);outline.lineTo(-.5,.5);}
 outline.closePath();
 const g=new T.ExtrudeGeometry(outline,{depth:1,bevelEnabled:true,bevelSegments:1,
  bevelSize:post?.024:.018,bevelThickness:.025,curveSegments:4});
 g.center();g.computeBoundingBox();
 const size=g.boundingBox.getSize(new T.Vector3());g.scale(1/size.x,1/size.y,1/size.z);
 if(!post)g.rotateX(-Math.PI/2);
 const {position:p,normal:n,uv}=g.attributes;
 for(let i=0;i<p.count;i++){
  const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
  const x=nx>ny&&nx>nz?p.getZ(i):p.getX(i),y=ny>nx&&ny>nz?p.getZ(i):p.getY(i);
  uv.setXY(i,.50+(post?.30:.85)*x,.50+.82*y);
 }
 registerDistrictLod(g,new T.BoxGeometry(),post?76:58);
 return g;
}
let ashlar,pillar;
const tints=[0xfcfaf4,0xecece8,0xf2eee6,0xe7e4dd,0xf5f5f0,0xeceeea];
export function archStones(radius,rise){
 const pos=[],uv=[],idx=[];
 function quad(a,b,c,d){
  const start=pos.length/3;
  for(const v of [a,b,c,d])pos.push(...v);
  uv.push(.08,.13,.86,.13,.86,.9,.08,.9);idx.push(start,start+1,start+2,start,start+2,start+3);
 }
 for(let i=0;i<11;i++){
  const a=i*Math.PI/11+.004,b=(i+1)*Math.PI/11-.004;
  const edge=x=>[[a,0],[a,.32],[b,.32],[b,0]].map(([angle,t])=>[x,Math.sin(angle)*(rise+t),Math.cos(angle)*(radius+t)]);
  const left=edge(-.09),right=edge(.09);
  quad(...left);quad(...right.slice().reverse());
  for(let j=0;j<4;j++){const m=(j+1)%4;quad(left[m],left[j],right[j],right[m]);}
 }
 const g=new T.BufferGeometry();
 g.setAttribute("position",new T.Float32BufferAttribute(pos,3));
 g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function bridgeMasonry(k){
 ashlar??=dressedBlock(false);pillar??=dressedBlock(true);
 const mat=templeGranite(),yaw=.15,tone=new T.Color(),graniteBalance=new T.Color(.80,.94,1.14);
 function put(shape,u,y,v,w,h,d,tint=0xffffff){
  const p=templeAxis(u,v);k.geo(shape,p.x,y,p.z,w,h,d,tone.setHex(tint).multiply(graniteBalance),yaw,mat);
 }
 const stone=(u,y,v,w,h,d,i=0)=>put(ashlar,u,y,v,w,h,d,tints[Math.abs(i)%tints.length]);
 function post(u,base,v,large){
  const w=large?.44:.32,h=large?1.04:.86;
  stone(u,base+.065,v,w+.19,.13,w+.22,1);
  put(pillar,u,base+.12+h/2,v,w,h,w*.95,0xfcfaf6);
 }
 function railSection(v0,v1,y0,y1,width,height,round){
  const run=v1-v0,climb=y1-y0,length=Math.hypot(run,climb);
  if(round){
   // Mirror the small granite sample along the carved rail so its grain keeps a physical scale.
   const spans=Math.ceil(length/.56),g=new T.CylinderGeometry(1,1,length,10,spans);
   const uv=g.attributes.uv;
   for(let i=0;i<uv.count;i++){
    const t=uv.getY(i)*spans%2;
    uv.setXY(i,.12+.72*uv.getX(i),.12+.72*(t>1?2-t:t));
   }
   g.scale(width/2,1,height/2);g.rotateX(Math.atan2(run,climb));
   return g;
  }
  const g=ashlar.clone();g.scale(width,height,run);
  g.applyMatrix4(new T.Matrix4().makeShear(0,0,0,0,0,climb/run));
  return g;
 }
 return {put,stone,post,railSection};
}
