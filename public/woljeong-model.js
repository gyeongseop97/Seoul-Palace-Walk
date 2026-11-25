import {localFrame} from "./gyeongju-mesh.js";
import {roof} from "./gyeongju-architecture.js";
import * as T from "three";
import {dancheongTexture} from "./palace-dancheong.js";

// The surveyed axis runs from the Gyochon gate to the opposite bank of Namcheon.
const deck=3.65;
export function woljeongFooting(bridge){
 const {north,south}=bridge,dx=south.x-north.x,dz=south.z-north.z,length=Math.hypot(dx,dz);
 const s=dx/length,c=dz/length,yaw=Math.atan2(s,c),at=localFrame(north.x,north.z,yaw);
 const local=p=>({u:(p.x-north.x)*c-(p.z-north.z)*s,v:(p.x-north.x)*s+(p.z-north.z)*c});
 const approachNorth=Math.hypot(north.x-bridge.northPlaza.x,north.z-bridge.northPlaza.z),approachSouth=Math.hypot(south.x-bridge.southPlaza.x,south.z-bridge.southPlaza.z);
 const h=v=>deck*Math.max(0,Math.min(1,1+v/approachNorth,1+(length-v)/approachSouth));
 function surface(p){
  const {u,v}=local(p);
  if(Math.abs(u)>4.6||v< -approachNorth||v>length+approachSouth)return 0;
  return h(v);
 }
 function cameraBlocked(p,y){
  const {u,v}=local(p);
  if(v<0||v>length){
   const gate=v<0?-11.6:length+9.7;
   if(Math.abs(v-gate)<7.7&&Math.abs(u)<10.5)
    return Math.abs(u)>3.5&&y<h(gate)+5.95||y>h(gate)+5.50&&y<h(gate)+12.5;
   return false;
  }
  if(Math.abs(u)>6.0)return false;
  const ceiling=v<5.8||v>length-5.8?4.7:4.03;
  return (y>deck+ceiling&&y<deck+ceiling+1.45)||
    (Math.abs(u)>3.49&&Math.abs(u)<3.97&&y>deck-.6&&y<deck+1.05);
 }
 return {length,at,local,yaw,h,surface,cameraBlocked,approachNorth,approachSouth};
}

export function drawWoljeong(k,plan,glow,roofFinish){
 const {length:L,yaw,at,h,approachNorth,approachSouth}=plan;
 const red=0x923e31,vermilion=0xad4c39,wood=0x694b38,celadon=0x397d67,green=0x38614b,
   mint=0x93b59b,ochre=0xd8a46c,tile=0x46525b,stone=0xbab5a6;
 const pt=(u,y,v)=>{const p=at(u,v);return {x:p.x,y,z:p.z};};
 const verts=pts=>pts.map(([u,y,v])=>{const p=pt(u,y,v);return [p.x,y,p.z];});
 const part=(u,y,v,w,b,d,color,pitch=0)=>{const p=at(u,v);k.piece(p.x,y,p.z,w,b,d,color,yaw,pitch);};
 const plank=new T.BoxGeometry(),pattern=dancheongTexture(T);
 pattern.repeat.x=2;
 const painted=new T.MeshStandardMaterial({map:pattern,roughness:.82});
 function trim(u,y,v,w,b,d,material=painted,turn=0){
  const p=at(u,v);k.geo(plank,p.x,y,p.z,w,b,d,0xffffff,yaw+turn,material);
 }
 const column=(u,y,v,r,height,col)=>{const p=at(u,v);k.column(p.x,y,p.z,2*r,height,2*r,col);};
 const beam=(a,b,r,col)=>k.beam(pt(...a),pt(...b),r,col);
 const canopy=(v,y,w,rise,d,rot=0)=>{const p=at(0,v);roof(k,p.x,y,p.z,w,rise,d,yaw+rot,tile,roofFinish);};
 function rail(u,a,b,level=deck){
  const length=b-a,mid=(a+b)/2;
  for(const t of [.35,.91])part(u,level+t,mid,.18,t===.91?.17:.11,length,vermilion);
  const n=Math.ceil(length/1.05);
  for(let j=0;j<n;j++)part(u,level+.62,a+(j+.5)*length/n,.1,.54,.1,red);
 }
 function pier(v){
  // Four six-sided stone cutwaters, pointed upstream and downstream.
  for(let row=0;row<6;row++){
   const w=1.24-.044*row,tip=5.8-.17*row,b=.515;
   const ring=[[-tip,0],[-3.65,-w],[3.65,-w],[tip,0],[3.65,w],[-3.65,w]];
   for(let side=0;side<ring.length;side++){
    const [x,z]=ring[side],[tx,tz]=ring[(side+1)%ring.length],count=Math.max(1,Math.ceil(Math.hypot(tx-x,tz-z)/1.76));
    for(let j=0;j<count;j++){
     const f=(j+.008)/count,g=(j+.992)/count,base=.025+row*b;
     k.face(verts([[x+(tx-x)*f,base,v+z+(tz-z)*f],[x+(tx-x)*g,base,v+z+(tz-z)*g],
      [x+(tx-x)*g,base+b-.017,v+z+(tz-z)*g],[x+(tx-x)*f,base+b-.017,v+z+(tz-z)*f]]),
      [0,1,2,0,2,3],[0xa5a094,0xb8b3a7,0xc6bdae,0xb3ac9e][(row+side+j)%4]);
    }
   }
   k.polygon(ring.map(([x,z])=>at(x,v+z)),(row+1)*b+.01,stone);
  }
 }
 function brackets(u,v,y){
  part(u,y,v,.68,.22,.67,green);part(u,y+.18,v,.85,.15,.82,celadon);
  part(u,y+.32,v,1.06,.14,.94,ochre);part(u,y+.44,v,1.22,.14,1.1,green);
 }
 function gate(v,side){
  const floor=h(v),width=1.70,depth=1.49;
  for(const sign of [-1,1]){
   for(let course=0;course<4;course++){
    const slab=floor/4,u=sign*(3.8+3.48),divisions=8;
    part(u,slab*(course+.5),v,7.0-.05*course,slab-.014,15.25-.13*course,[0xb6ad99,0xaaa28f,0xb2aa99,0xc4bcaa][course]);
    for(let j=1;j<divisions;j++){
     const atV=v-7.36+j*1.84+(course%2)*.64;
     for(const face of [-1,1])part(u+face*(3.51-.025*course),slab*(course+.5),atV,.021,slab*.93,.022,0x9d9584);
    }
   }
   part(sign*6.32,floor+1.57,v,4.4,3.15,6.47,0x934533);
  }
  for(const row of [-3.5,3.5])for(const u of [-4.88,-2.49,2.49,4.88]){
   const y=Math.abs(u*width)>4.04?floor:h(v+row*depth),top=floor+5.30;
   column(u*width,y+.16,v+row*depth,.42,.32,stone);column(u*width,(top+y+.32)/2,v+row*depth,.29,top-y-.32,red);
   brackets(u*width,v+row*depth,top);
  }
  part(0,floor+5.75,v,10.2*width,.28,7.6*depth,green);
  for(const face of [-1,1])for(const u of [-4.1,0,4.1]){
   trim(u*1.42,floor+5.72,v+face*5.75,5.83,.34,.11);
  }
  for(const u of [-1,1]){
   part(u*6.05,floor+3.0,v,3.25,4.11,6.1,0x9d4839);
   for(let j=-2;j<=2;j++)part(u*6.05+j*.49,floor+3.24,v+side*3.08,.36,2.36,.1,0x704f35);
  }
  canopy(v,floor+5.88,13.6*width,3.25,11.5*depth);
  // Upper viewing pavilion doors and balustrade sit above the walk-through bay.
  part(0,floor+8.20,v,8.8*width,2.48,5.8*depth,0xa1493a);
  for(const face of [-1,1]){
   for(let j=-2;j<=2;j++){
    const u=j*1.59*width;
    const p=at(u,v+face*2.94*depth);
    k.geo(plank,p.x,floor+8.39,p.z,1.29*width,1.65,.09,0x855f42,yaw,glow);
    for(let n=-3;n<=3;n++)part(u+n*.28,floor+8.39,v+face*3.01*depth,.057,1.65,.05,0xa76b4c);
    part(u,floor+8.56,v+face*3.02*depth,1.29*width,.061,.04,0xb57b55);
   }
   part(0,floor+7.69,v+face*3.48*depth,10.1*width,.12,.14,red);
   for(let j=-11;j<=11;j++)part(j*.74,floor+7.41,v+face*3.46*depth,.095,.62,.10,red);
  }
  canopy(v,floor+9.67,12.2*width,3.65,9.3*depth);
  for(const u of [-4.77,-2.45,0,2.45,4.77])part(u*width,floor+8.48,v+side*3.13*depth,.24,2.20,.24,red);
  const p=at(0,v+side*3.31*depth);
  k.sign("月 精 橋",p.x,floor+8.95,p.z,2.8,.86,yaw+(side===1?0:Math.PI),"#263532","#e6d1a0");
 }
 for(let i=1;i<=4;i++)pier(L*i/5);
 for(const u of [-3.36,-1.13,1.13,3.36])part(u,deck-.47,L/2,.46,.66,L,wood);
 part(0,deck-.19,L/2,8.25,.36,L,0x775746);
 const spans=16,step=L/spans;
 for(let i=0;i<=spans;i++){
  const v=i*step;
  for(const side of [-1,1]){
   const u=side*3.72;
   column(u,deck+.09,v,.28,.18,stone);column(u,deck+1.91,v,.208,3.7,vermilion);
   brackets(u,v,deck+3.56);
   if(i<spans){
    trim(u,deck+3.98,v+step/2,step,.24,.14,painted,Math.PI/2);
    trim(u,deck+3.82,v+step/2,step,.045,.085,glow,Math.PI/2);
   }
   if(i<spans)rail(u,v,v+step);
   part(u,deck+4.05,v,1.23,.19,.28,celadon);
  }
  part(0,deck+3.91,v,8.22,.3,.33,green);part(0,deck+4.10,v,8.5,.072,.38,ochre);
  trim(0,deck+3.92,v-.18,8.21,.33,.045);trim(0,deck+3.92,v+.18,8.21,.33,.045);
  for(let j=-3;j<=3;j++)part(j*1.06,deck+3.74,v,.53,.04,.29,mint);
  if(i%2===0){trim(0,deck+3.58,v,.25,.24,.25,glow);part(0,deck+3.43,v,.29,.05,.29,wood);}
 }
 for(const u of [-3.73,-1.86,0,1.86,3.73]){
  part(u,deck+4.21,L/2,.22,.19,L,celadon);
 }
 const rows=Math.ceil(L/.81),cols=8;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const u=(i+.5-cols/2)*.96,v=(j+.5)*L/rows;
  part(u,deck-.018,v,.953,.044,L/rows-.012,[0xa89982,0xb2a28b,0xb6a58f,0xb0a18b][(j*7+i*3)%4]);
 }
 // A long, continuous tiled ridge parallel to the boardwalk.
 canopy(L/2,deck+4.23,L+2.7,2.43,10.2,Math.PI/2);
 gate(-11.6,-1);gate(L+9.7,1);
 function abutment(a,b){
  for(const u of [-4.02,4.02]){
   const quad=[[u,0,a],[u,0,b],[u,h(b),b],[u,h(a),a]];
   k.face(verts(quad),[0,1,2,0,2,3],stone);
   beam([u,h(a)+.73,a],[u,h(b)+.73,b],.092,0xb7b4a5);
   for(let i=0;i<=5;i++){
    const v=a+(b-a)*i/5;column(u,h(v)+.45,v,.145,.9,stone);
   }
  }
  k.face(verts([[-4.04,h(a)+.012,a],[4.04,h(a)+.012,a],[4.04,h(b)+.012,b],[-4.04,h(b)+.012,b]]),[0,1,2,0,2,3],0xb5b09f,"pavers");
 }
 abutment(-approachNorth,0);abutment(L,L+approachSouth);
}
