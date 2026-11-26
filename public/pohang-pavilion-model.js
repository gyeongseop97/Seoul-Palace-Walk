import * as T from "three";
import {coastalMasonry} from "./pohang-masonry.js";
import {pavilionDecking} from "./pohang-pavilion-wood.js";
import {pavilionPoint,pavilionYaw,apronStart,bridgeStart,pierHeight,lowerLevel,upperLevel,stairRun,pillars,upperBounds} from "./pohang-pavilion-layout.js";

export function buildYeongildae(parent,{box,post,rod,oval,sign}){
 const base=pavilionPoint(0,0),g=new T.Group();g.position.set(base.x,0,base.z);g.rotation.y=pavilionYaw;parent.add(g);
 const stone=0xc4c3b6,cap=0xe0dcd0,granite=0xadab9f,wood=0x874f32,rail=0xa16b43,dark=0x543a2b;
 const warm=new T.MeshStandardMaterial({color:0xae8055,roughness:.78,emissive:0xe7a05b,emissiveIntensity:0});
 const litStone=new T.MeshStandardMaterial({color:stone,roughness:.86,emissive:0xb3afce,emissiveIntensity:0});
 const strips=new T.MeshBasicMaterial({color:0xe9b37f});
 const archTriangles=[];
 const span=(x,z,y,X,Z,Y,w,h,col)=>{
  const a=new T.Vector3(x,y,z),b=new T.Vector3(X,Y,Z);
  const part=box(g,col,(x+X)/2,(y+Y)/2,(z+Z)/2,w,h,a.distanceTo(b));
  part.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),b.sub(a).normalize());return part;
 };
 const shaft=(x,z,floor,top,r,color)=>post(g,color,x,(floor+top)/2,z,r,top-floor,r);
 const beam=(x,z,y,X,Z,w,h,color)=>span(x,z,y,X,Z,y,w,h,color);
 const terraceBottom=lowerLevel-.65;
 box(g,stone,0,lowerLevel-.33,0,29,.66,27);
 for(const v of [-11,-3.5,4.2,11])for(const u of [-12.2,-4.1,4.1,12.2])shaft(u,v,-3.8,terraceBottom,.54,litStone);
 for(let k=-13;k<=13;k++)beam(-14.48,k,lowerLevel+.005,14.48,k,.018,.014,granite);
 for(let k=-14;k<=14;k++)beam(k,-13.48,lowerLevel+.008,k,13.48,.019,.012,granite);
 function stoneRail(x,z,X,Z,startY,endY){
  const dx=X-x,dz=Z-z,len=Math.hypot(dx,dz),count=Math.max(1,Math.round(len/1.94));
  span(x,z,startY+.16,X,Z,endY+.16,.28,.2,stone);
  span(x,z,startY+.88,X,Z,endY+.88,.26,.16,cap);
  for(let k=0;k<=count;k++){
   const t=k/count,px=x+dx*t,pz=z+dz*t,y=startY+(endY-startY)*t;
   box(g,stone,px,y+.5,pz,.28,1,.28);
   box(g,cap,px,y+.98,pz,.38,.1,.38);oval(g,cap,px,y+1.13,pz,.175,.18,.175);
   if(k===count)continue;
   for(let j=1;j<4;j++){
    const f=(k+j/4)/count;
    box(g,stone,x+dx*f,startY+(endY-startY)*f+.51,z+dz*f,.115,.61,.115);
   }
  }
 }
 const end=-13.45,length=end-bridgeStart,count=9,step=length/count;
 span(0,apronStart,pierHeight(apronStart)-.16,0,bridgeStart,pierHeight(bridgeStart)-.16,5.38,.32,cap);
 for(let j=0;j<count;j++){
  const z=bridgeStart+j*step,Z=z+step,h=pierHeight(z),H=pierHeight(Z);
  span(0,z,h-.22,0,Z,H-.22,5.38,.44,cap);
  // Recessed stone arches span each bay. The level sidewalk rides across the voussoirs.
  for(const side of [-1,1]){
   const x=side*2.36;
   for(let k=0;k<14;k++){
    const a=Math.PI*k/14,b=Math.PI*(k+1)/14;
    const arc=t=>[x,-.76+(h+.13)*Math.sin(t),z+step/2-(step/2-.40)*Math.cos(t)];
    const A=arc(a),B=arc(b),topA=h-.37+(H-h)*(A[2]-z)/step,topB=h-.37+(H-h)*(B[2]-z)/step;
    archTriangles.push(...A,...B,x,topB,B[2],...A,x,topB,B[2],x,topA,A[2]);
    span(x,A[2],A[1]+.07,x,B[2],B[1]+.07,.32,.16,k%2?granite:stone);
   }
   stoneRail(side*2.5,z,side*2.5,Z,h,H);
  }
  for(let k=0;k<9;k++){
   const v=z+step*k/9;beam(-2.54,v,pierHeight(v)+.007,2.54,v,.018,.012,granite);
  }
  box(g,litStone,0,-.89,z,4.54,5.6,.89);
 }
 const archGeometry=new T.BufferGeometry(),archUv=[];
 for(let i=0;i<archTriangles.length;i+=3)archUv.push(archTriangles[i+2],archTriangles[i+1]);
 archGeometry.setAttribute("position",new T.Float32BufferAttribute(archTriangles,3));
 archGeometry.setAttribute("uv",new T.Float32BufferAttribute(archUv,2));
 archGeometry.computeVertexNormals();g.add(new T.Mesh(archGeometry,coastalMasonry()));
 for(const u of [-14.42,14.42])stoneRail(u,-13.38,u,13.38,lowerLevel,lowerLevel);
 stoneRail(-14.42,13.38,14.42,13.38,lowerLevel,lowerLevel);
 for(const sign of [-1,1])stoneRail(sign*2.57,-13.38,sign*14.42,-13.38,lowerLevel,lowerLevel);
 for(const {u,v} of pillars){
  box(g,cap,u,lowerLevel+.12,v,.79,.24,.79);
  shaft(u,v,lowerLevel+.24,upperLevel-.31,.30,litStone);
  box(g,cap,u,upperLevel-.36,v,.86,.28,.86);
 }
 for(const u of [-7.55,7.55])for(const v of [5.74,8.46])shaft(u,v,lowerLevel+.1,upperLevel-.36,.28,litStone);
 box(g,dark,0,upperLevel-.23,7.1,16.1,.45,8.53);
 const decking=pavilionDecking();
 for(let i=0;i<52;i++)decking.board(-7.89+i*.31,upperLevel-.023,7.1,.304,.052,8.3,i%4===0?0xab7855:i%3===0?0xb58562:0xb17d57);
 const run=stairRun.to-stairRun.from;
 for(let i=0;i<stairRun.count;i++){
  const h=(i+1)*(upperLevel-lowerLevel)/stairRun.count,v=stairRun.from+(i+.5)*run/stairRun.count;
  decking.board(0,lowerLevel+h/2,v,2*stairRun.half,h,run/stairRun.count+.004,wood,true);
  decking.board(0,lowerLevel+h+.006,v-.13,2*stairRun.half,.017,.059,0xb77d52,true);
 }
 decking.mount(g);
 for(const side of [-1,1]){
  const x=side*stairRun.half;
  for(const h of [.42,.92])rod(g,[x,lowerLevel+h,stairRun.from],[x,upperLevel+h,stairRun.to],h>.5?.057:.037,wood);
  for(let k=0;k<=5;k++){const t=k/5;shaft(x,stairRun.from+run*t,lowerLevel+(upperLevel-lowerLevel)*t,lowerLevel+(upperLevel-lowerLevel)*t+1,.066,wood);}
 }
 const eave=upperLevel+3.47,center=7.1;
 for(const {u,v} of pillars){
  shaft(u,v,upperLevel,eave-.20,.207,warm);
  for(let k=0;k<3;k++){
   const w=.57+k*.36;
   box(g,k===1?0x805038:wood,u,eave-.54+k*.16,v,w,.17,.37);
   box(g,k===1?0x805038:wood,u,eave-.50+k*.16,v,.32,.15,w*.95);
  }
 }
 for(const v of [3.27,10.93]){
  box(g,wood,0,eave-.03,v,15.73,.32,.42);
  box(g,warm,0,eave+.18,v,16.16,.21,.43);
 }
 for(const u of [-7.27,7.27])box(g,wood,u,eave+.02,center,.4,.32,8.24);
 function timberRail(x,z,X,Z){
  const length=Math.hypot(X-x,Z-z),n=Math.ceil(length/.28);
  for(const [y,w,h] of [[.12,.15,.16],[.64,.14,.09],[.94,.16,.13]])beam(x,z,upperLevel+y,X,Z,w,h,warm);
  for(let i=0;i<=n;i++){
   const t=i/n,px=x+(X-x)*t,pz=z+(Z-z)*t;
   box(g,i%5?rail:wood,px,upperLevel+.46,pz,i%5?.055:.105,.82,i%5?.055:.105);
  }
 }
 const {left:L,right:R,front:F,back:B}=upperBounds;
 timberRail(L,F,L,B);timberRail(R,F,R,B);timberRail(L,B,R,B);timberRail(L,F,-1.47,F);timberRail(1.47,F,R,F);
 const halfX=9.98,halfZ=5.85,ridge=5.85;
 const row=(t,k,side)=>{
  // A high central gable above the splayed hip and a swept, flared outer eave.
  const extent=halfX-(halfX-ridge)*Math.min(1,t/.64);
  const x=k*extent,z=center+side*(1-t)*halfZ;
  const y=eave+.28+3.1*t**1.62+.6*Math.abs(k)**5*(1-t)**1.15;
  return [x,y,z];
 };
 const tiles=[],hipTiles=[];
 const quad=(dst,a,b,c,d)=>dst.push(...a,...b,...c,...a,...c,...d);
 const geom=(coords,material)=>{const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(coords,3));geo.computeVertexNormals();g.add(new T.Mesh(geo,material));};
 for(const side of [-1,1]){
  for(let i=0;i<50;i++)for(let j=0;j<10;j++){
   const a=i/25-1,b=(i+1)/25-1,t=j/10,T=(j+1)/10;
   quad(tiles,row(t,a,side),row(t,b,side),row(T,b,side),row(T,a,side));
  }
  for(let k=-37;k<=37;k++){
   let a=row(0,k/37,side);
   for(let j=1;j<=5;j++){const b=row(j/5,k/37,side);rod(g,[a[0],a[1]+.035,a[2]],[b[0],b[1]+.035,b[2]],.052,k%3?0x48515a:0x54606a);a=b;}
   const [x,y,z]=row(0,k/37,side);
   rod(g,[x*.8,eave-.10,center+side*3.54],[x,y-.10,z],.073,warm);
  }
 }
 geom(tiles,roofMaterial);
 for(const side of [-1,1]){
  const hip=(t,k)=>{
   const a=row(t*.64,side,-1),b=row(t*.64,side,1);
   return [a[0],a[1]-.20*(1-k*k)*(1-t),a[2]+(b[2]-a[2])*(k+1)/2];
  };
  for(let j=0;j<8;j++){
   for(let n=0;n<6;n++){
    const t=j/8,T=(j+1)/8,k=n/3-1,K=(n+1)/3-1;
    quad(hipTiles,hip(t,k),hip(t,K),hip(T,K),hip(T,k));
   }
  }
  for(let i=-19;i<=19;i++){
   let a=hip(0,i/19);
   for(let j=1;j<=4;j++){
    const b=hip(j/4,i/19);
    rod(g,[a[0],a[1]+.038,a[2]],[b[0],b[1]+.038,b[2]],.051,i%3?0x48515a:0x54606a);a=b;
   }
  }
  const front=row(.64,side,-1),back=row(.64,side,1),tip=row(1,side,1);
  geom([...front,...back,...tip],gableMaterial);
  for(const edge of [-1,1]){
   let a=row(0,side,edge);
   for(let j=1;j<=6;j++){const b=row(j*.64/6,side,edge);rod(g,a,b,.13,0x69727b);a=b;}
  }
 }
 geom(hipTiles,roofMaterial);
 rod(g,[-ridge,eave+3.61,center],[ridge,eave+3.61,center],.16,0x77818a);
 for(const side of [-1,1])rod(g,[side*ridge,eave+3.62,center],[side*(ridge+.35),eave+3.87,center],.136,0x717b83);
 sign(g,"迎 日 臺",0,eave-.35,3.02,2.6,.82,"#3e362d",Math.PI);
 // Long amber beams and soft light on the stone arcade frame the night silhouette.
 for(const v of [3.2,11])box(g,strips,0,eave-.18,v,14.9,.035,.065);
 return night=>{warm.emissiveIntensity=night*.66;litStone.emissiveIntensity=night*.27;strips.color.setHex(night>.4?0xffd09b:0xb7895c);};
}
const roofMaterial=new T.MeshStandardMaterial({color:0x3b4551,side:T.DoubleSide,roughness:.76});
const gableMaterial=new T.MeshStandardMaterial({color:0xaf7755,side:T.DoubleSide,roughness:.81});
