import * as T from "three";
import {registerDistrictLod} from "./gyeongju-mesh.js";

// The long pitches continue to the ridge. The end hips stop below the upright gables.
const shoulder=.55;
function roofPoint(end,u,t){
 const span=.50-.188*Math.min(t/shoulder,1),depth=.50*(1-t);
 const lift=.225*Math.abs(u)**3*(1-t)**1.5;
 return end?{x:span,z:u*depth,y:.18*t+.82*t*t+lift}:
  {x:u*span,z:depth,y:.18*t+.82*t*t+lift};
}
const ridgeLift=u=>.11*Math.abs(u)**3;
function roofSurface(near){
 const positions=[],colors=[],indices=[],color=new T.Color();
 for(const end of [false,true])for(const sign of [-1,1]){
  const tileCount=end?40:60,cols=near?tileCount*4:12,rows=near?10:4,start=positions.length/3;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const u=i/cols*2-1,t=j/rows*(end?shoulder:1),p=roofPoint(end,u,t);
   const roll=near?(1+Math.cos(i*Math.PI/2))/2:0;
   const stripe=(Math.floor((i+2)/4)*17)%11;
   color.setHex(near?[0x5f6460,0x727675,0x92958b,0x757a75][i%4]:0x6a706b);
   color.multiplyScalar(near?.91+stripe*.014:1);
   colors.push(color.r,color.g,color.b);
   const y=p.y+ridgeLift(u)*t**2+roll*.018;
   positions.push(end?sign*p.x:p.x,y,end?p.z:sign*p.z);
   if(i<cols&&j<rows){
    const a=start+j*(cols+1)+i,reverse=end?sign>0:sign<0;
    if(reverse)indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);
    else indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);
   }
  }
 }
 const g=new T.BufferGeometry();
 g.setAttribute("position",new T.Float32BufferAttribute(positions,3));
 g.setAttribute("color",new T.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();return g;
}
const gableTriangle=new T.BufferGeometry();
gableTriangle.setAttribute("position",new T.Float32BufferAttribute([-.5,0,0,.5,0,0,0,1,0],3));
gableTriangle.setAttribute("uv",new T.Float32BufferAttribute([0,0,1,0,.5,1],2));
gableTriangle.setIndex([0,1,2]);gableTriangle.computeVertexNormals();
let roofGeo,roofMat,gableRoof;
function coloredGeometry(points,colors,indices){
 const g=new T.BufferGeometry();
 g.setAttribute("position",new T.Float32BufferAttribute(points,3));
 g.setAttribute("color",new T.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();return g;
}
function gabledRoof(tiles,rows){
 const points=[],colors=[],indices=[],color=new T.Color(),cols=tiles*4;
 for(const side of [-1,1]){
  const start=points.length/3;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const u=i/cols*2-1,t=j/rows,rib=(Math.cos(i*Math.PI/2)+1)/2;
   points.push(u*.5,.18*t+.82*t*t+Math.abs(u)**3*(.15-.07*t)+rib*.018,side*(1-t)*.5);
   color.setHex([0x606765,0x7b817b,0x929488,0x7b817b][i%4]);colors.push(color.r,color.g,color.b);
   if(j<rows&&i<cols){
    const a=start+j*(cols+1)+i;
    if(side>0)indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);
    else indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);
   }
  }
 }
 return coloredGeometry(points,colors,indices);
}
function roofPaint(){
 return roofMat??=new T.MeshStandardMaterial({vertexColors:true,roughness:.91,side:T.DoubleSide});
}
export function drawGabledRoof(k,x,y,z,w,rise,d,yaw,gableColor=0x9b634a){
 if(!gableRoof){
  gableRoof=gabledRoof(40,7);registerDistrictLod(gableRoof,gabledRoof(8,3),110);
 }
 k.geo(gableRoof,x,y,z,w,rise,d,0xffffff,yaw,roofPaint());
 const c=Math.cos(yaw),s=Math.sin(yaw);
 const p=(u,v,dy)=>({x:x+u*c+v*s,y:y+dy,z:z-u*s+v*c});
 for(const sign of [-1,1]){
  const a=p(sign*w*.47,0,0);
  k.geo(gableTriangle,a.x,y+rise*.09,a.z,d*.94,rise*.96,1,gableColor,yaw+sign*Math.PI/2);
  for(const v of [-1,1]){
   let prev=p(sign*w*.50,v*d*.50,rise*.15);
   for(let j=1;j<=6;j++){
    const t=j/6,next=p(sign*w*.50,v*(1-t)*d*.50,rise*(.15+.11*t+.82*t*t));
    k.beam(prev,next,.095,0x817d6b);prev=next;
   }
  }
  let edge=p(-w*.5,sign*d*.5,rise*.15-.045);
  for(let j=1;j<=8;j++){
   const u=j/4-1,next=p(u*w*.5,sign*d*.5,rise*.15*Math.abs(u)**3-.045);
   k.beam(edge,next,.072,0x77685a);edge=next;
  }
 }
 let ridge=p(-w*.5,0,rise*1.08+.09);
 for(let j=1;j<=8;j++){
  const u=j/4-1,next=p(u*w*.5,0,rise*(1+.08*Math.abs(u)**3)+.09);
  k.beam(ridge,next,.125,0x8d8c80);ridge=next;
 }
}
export function drawHallRoof(k,b,at,yaw,eave,rise,paintedGable){
 if(!roofGeo){
  roofGeo=roofSurface(true);registerDistrictLod(roofGeo,roofSurface(false),100);
 }
 const w=b.w+1.18,d=b.d+.95,h=b.floor+eave,c=at(0,0);
 if(b.gable){drawGabledRoof(k,c.x,h,c.z,w,rise,d,yaw);return;}
 k.geo(roofGeo,c.x,h,c.z,w,rise,d,0xffffff,yaw,roofPaint());
 const point=(u,y,v)=>({...at(u,v),y:h+y});
 function curve(sample,r,color,n){
  let a=sample(0);
  for(let i=1;i<=n;i++){const next=sample(i/n);k.beam(a,next,r,color);a=next;}
 }
 for(const side of [-1,1]){
  const gable=.312*w*side,half=.5*(1-shoulder)*d,base=rise*(.18*shoulder+.82*shoulder**2);
  const a=point(gable,base,0);
  k.geo(gableTriangle,a.x,a.y,a.z,half*2,rise*1.11-base,1,paintedGable?0xffffff:0xa6634d,yaw+side*Math.PI/2,paintedGable);
  for(const end of [false,true]){
   const outline=(u,t,dy=0)=>{const p=roofPoint(end,u,t);return point((end?side*p.x:p.x)*w,p.y*rise+dy,(end?p.z:side*p.z)*d);};
   for(let i=0;i<12;i++){
    const u=i/6-1,v=(i+1)/6-1;
    const underside=[outline(u,0,-.13),outline(v,0,-.13),outline(v,.27,-.14),outline(u,.27,-.14)];
    k.face(underside.map(p=>[p.x,p.y,p.z]),[0,1,2,0,2,3],i%2?0x657565:0x727b68);
   }
   for(const [depth,r,col] of [[-.23,.077,0x655d4c],[-.10,.064,0x6c6558],[.015,.050,0x586361]]){
    curve(t=>outline(2*t-1,0,depth),r,col,8);
   }
   const count=end?29:43;
   for(let i=0;i<=count;i++){
    const u=i/count*2-1,a=outline(u,0,-.20),p=roofPoint(end,u,.21);
    const inside=point((end?side*p.x:p.x)*w,p.y*rise-.23,(end?p.z:side*p.z)*d);
    k.beam(inside,a,.074,i%3===0?0xac9979:0x797865);
   }
  }
  for(const v of [-1,1]){
   const arr=t=>{const p=roofPoint(false,side,t);return point(p.x*w,p.y*rise+ridgeLift(1)*t**2*rise+.06,p.z*d*v);};
   curve(arr,.095,0xb2ae99,8);
  }
 }
 curve(t=>{const u=2*t-1;return point(.312*u*w,rise*(1+ridgeLift(u))+.12,0);},.16,0xa9a697,10);
}
