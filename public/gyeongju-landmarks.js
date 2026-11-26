import * as T from "three";
import {localFrame,randomSeed} from "./gyeongju-mesh.js";
import {roof} from "./gyeongju-architecture.js";
import {tower} from "./gyeongju-observatory.js";

export function observatory(k,p){
 const rng=randomSeed(673),stone=[0xb9ad92,0xb4a88e,0xc1b397,0xaba18b,0xc3b8a0,0xb6aa91];
 const color=()=>stone[Math.floor(rng()*stone.length)],turn=tower.yaw;
 const radius=t=>1.46+1.04*(1-t)*(1-t);
 const vertex=(r,y,a)=>[p.x+r*Math.sin(a+turn),y,p.z+r*Math.cos(a+turn)];
 const frame=localFrame(p.x,p.z,turn);
 const box=(x,y,z,w,h,d,c)=>{const a=frame(x,z);k.piece(a.x,y,a.z,w,h,d,c,turn);};
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)box((i-1.5)*1.38,.23,(j-1.5)*1.38,1.37,.45,1.37,color());
 // Mortar behind the individual stones keeps daylight from leaking through every joint.
 function backing(first,last,from,to){
  const vertices=[],indices=[],steps=Math.ceil((to-from)*9);
  for(let course=first;course<=last;course++){
   for(let j=0;j<=steps;j++){
    vertices.push(vertex(radius(course/27)-.14,.445+course*.288,from+(to-from)*j/steps));
    if(j===steps||course===last)continue;
    const i=(course-first)*(steps+1)+j;
    indices.push(i,i+steps+1,i+1,i+1,i+steps+1,i+steps+2);
   }
  }
  k.face(vertices,indices,0x776f60);
 }
 backing(0,12,-Math.PI,Math.PI);backing(15,27,-Math.PI,Math.PI);
 backing(12,15,-Math.PI,-.275);backing(12,15,.275,Math.PI);
 function masonry(a,b,y,h,r,rt){
  const n=1,outer=[],top=[],inside=[];
  for(let j=0;j<=n;j++){
   const theta=a+(b-a)*j/n;
   outer.push(vertex(r,y,theta),vertex(rt,y+h,theta));
   top.push(vertex(rt-.30,y+h,theta),vertex(rt,y+h,theta));
   inside.push(vertex(rt-.32,y+h,theta),vertex(r-.32,y,theta));
  }
  const ix=[];
  for(let j=0;j<n;j++){const i=j*2;ix.push(i,i+1,i+2,i+1,i+3,i+2);}
  const col=color();
  k.face(outer,ix,col);k.face(top,ix,col);
  k.face(inside,ix,0x827b6b);
  for(const t of [a,b])k.face([vertex(r,y,t),vertex(rt,y+h,t),vertex(rt-.32,y+h,t),vertex(r-.32,y,t)],[0,1,2,0,2,3],col);
 }
 for(let course=0;course<27;course++){
  const a=course/27,b=(course+1)/27,r=radius(a),rt=radius(b),y=.445+course*.288;
  const blocks=Math.round(2*Math.PI*r/.86),step=2*Math.PI/blocks;
  for(let i=0;i<blocks;i++){
   const theta=(i+(course%2)*.49)*step;
   let lo=theta-Math.PI+.0045,hi=theta+step-Math.PI-.0045;
   // Keep a clear opening through courses 13 to 15 on the south face.
   if(course>=12&&course<15&&lo<.272&&hi>-.272){
    if(lo<-.28)masonry(lo,-.275,y,.281,r,rt);
    if(hi>.28)masonry(.275,hi,y,.281,r,rt);
   }else masonry(lo,hi,y,.281,r,rt);
  }
 }
 box(0,.445+12*.288-.06,radius(12/27)-.05,1.18,.15,.48,color());
 box(0,.445+15*.288+.06,radius(15/27)-.07,1.17,.15,.46,color());
 // The packed lower courses support the visitor just below the window.
 k.column(p.x,tower.landing-.10,p.z,3.50,.20,3.50,0x968871);
 for(const y of [5.66,7.47]){
  for(const side of [-1,1]){
   box(side*.83,y,0,.23,.23,2.56,color());
   box(0,y+.21,side*.83,2.52,.23,.23,color());
  }
 }
 for(const side of [-1,1]){
  box(side*1.19,8.44,0,.46,.43,3.28,color());
  box(0,8.86,side*1.19,3.32,.42,.49,color());
 }
}
export function stationHall(k,p,glass,ceilingLight){
 // Long axis along the tracks. The main doors face the bus bays across the northeast plaza.
 const yaw=2.53,at=localFrame(p.x,p.z,yaw);
 const piece=(x,y,z,w,h,d,c)=>{const q=at(x,z);k.piece(q.x,y,q.z,w,h,d,c,yaw);};
 const point=(u,y,v)=>{const q=at(u,v);return [q.x,y,q.z];};
 const granite=0xc2c1b9,steel=0xb0b6b3;
 const front=-3.4,back=-28,total=84;
 k.polygon([at(-42,front),at(42,front),at(42,9),at(-42,9)],-.055,0xb8b4a7,"pavers");
 piece(0,3.73,(front+back)/2,total,7.45,front-back,0x718c91);
 // Glazing reflects the pale plaza at foot level and blue sky above the visitor's eye.
 const pane=new T.PlaneGeometry(1,1,1,4),tints=[],tint=new T.Color();
 for(const color of [0xcddfe5,0xa6c4d0,0x7f9ba1,0xa3b2ac,0xbac2bd]){
  tint.setHex(color);for(let i=0;i<2;i++)tints.push(tint.r,tint.g,tint.b);
 }
 pane.setAttribute("color",new T.Float32BufferAttribute(tints,3));
 const glaze=(x,y,v,w,h)=>{
  const q=at(x,v);k.geo(pane,q.x,y,q.z,w,h,1,0xffffff,yaw,glass);
 };
 glaze(0,3.73,front+.035,total,7.45);
 for(let x=-total/2;x<=total/2;x+=3.5){
  const y=4.15+Math.cos(x/9.5)*.44;
  piece(x,y,front+.15,.145,2*y,.23,steel);
 }
 for(const y of [1.95,3.9,5.9,7.3])piece(0,y,front+.16,total,.13,.22,steel);
 for(const wing of [-1,1]){
  piece(wing*30,2.24,front+.16,22,4.46,.36,granite);
  for(let j=0;j<5;j++)piece(wing*(19.7+j*4.7),1.9,front+.4,.4,3.8,.34,0x92938c);
 }
 for(let i=-3;i<=3;i++){
  const x=i*2.05;
  piece(x,1.38,front+.27,1.90,2.76,.18,steel);
  glaze(x,1.38,front+.39,1.80,2.63);
  piece(x,1.38,front+.43,.065,2.68,.065,steel);
  piece(x,1.05,front+.44,1.83,.06,.07,0xe1d4a7);
 }
 piece(0,2.98,front+.79,15.3,.20,1.55,steel);
 const strip=new T.BoxGeometry();
 for(const x of [-4.8,0,4.8]){
  const q=at(x,front+1.24);k.geo(strip,q.x,2.87,q.z,3.2,.055,.22,0xffffff,yaw,ceilingLight);
 }
 for(const x of [-35,-17,17,35]){
  piece(x,3.84,front+2.8,.95,7.68,.95,granite);
  piece(x,.31,front+2.8,1.36,.62,1.36,0xa8a39a);
 }
 // Ribbed silver roof echoes tile ridges without turning the KTX station into a wooden hanok.
 const segments=56,depth=37;
 const height=(x,v)=>8.55+.89*Math.cos(x*.106)+.65*Math.pow(Math.abs(x)/44,3)+.9*Math.sin(v*Math.PI);
 for(let i=0;i<segments;i++){
  const x=-44+88*i/segments,u=x+88/segments;
  for(let j=0;j<5;j++){
   const a=j/5,b=(j+1)/5;
   k.face([point(x,height(x,a),front+4.8-a*depth),point(u,height(u,a),front+4.8-a*depth),
    point(u,height(u,b),front+4.8-b*depth),point(x,height(x,b),front+4.8-b*depth)],[0,1,2,0,2,3],i%2?0xc6cbc6:0xc1c6c3);
  }
  k.face([point(x,height(x,0)-.47,front+4.8),point(u,height(u,0)-.47,front+4.8),point(u,height(u,0),front+4.8),point(x,height(x,0),front+4.8)],[0,1,2,0,2,3],0x98a09d);
 }
 const a=at(0,front+.45);k.sign("경주역   Gyeongju Station",a.x,5.65,a.z,12.5,1.22,yaw,"#314850","#fff8da");
 for(const side of [-1,1]){
  const s=at(side*11,front+.27);k.sign(side<0?"기차 타는 곳":"광 장 출 구",s.x,2.42,s.z,2.3,.36,yaw,"#3d5860");
  for(let i=0;i<3;i++){
   const u=side*(25+i*2.5),b=at(u,front+5.0);
   k.column(b.x,.41,b.z,.24,.82,.24,0xb5b3a8);
   k.column(b.x,.62,b.z,.249,.09,.249,0xd3ac65);
  }
 }
 // Covered platforms to either side of the passenger hall occupy the mapped station footprint.
 for(const u of [-98,98]){
  const q=at(u,back-7);
  k.piece(q.x,5.4,q.z,115,.31,14,0x979e9e,yaw);
  for(let i=-50;i<=50;i+=12){
   const s=at(u+i,back-7);k.column(s.x,2.7,s.z,.44,5.4,.44,steel);
  }
 }
}
export function stoneGate(k,p,yaw,w){
 const at=localFrame(p.x,p.z,yaw);
 for(const side of [-1,1]){
  const q=at(side*(w/2-.23),0);k.piece(q.x,.26,q.z,.58,.52,.58,0xb7aca0,yaw);
  k.column(q.x,1.58,q.z,.37,2.66,.37,0x8c4a37);
 }
 k.piece(p.x,2.95,p.z,w+.38,.23,.58,0x37665c,yaw);
 k.piece(p.x,3.17,p.z,w+.66,.19,.75,0xa67a50,yaw);
 roof(k,p.x,3.21,p.z,w+1.22,1.05,3.15,yaw);
 const plaque=at(0,.34);k.sign("대 릉 원",plaque.x,2.92,plaque.z,1.28,.46,yaw,"#473f32");
 const reverse=at(0,-.34);k.sign("대 릉 원",reverse.x,2.92,reverse.z,1.28,.46,yaw+Math.PI,"#473f32");
}
export function magnolia(k,p){
 const rng=randomSeed(513),wood=0x705643;
 const base={...p,y:0},fork={x:p.x+.11,y:1.8,z:p.z+.10};k.beam(base,fork,.24,wood);
 for(let i=0;i<12;i++){
  const a=i*2.399+.22,r=1.0+rng()*1.32,branch={x:p.x+Math.cos(a)*r,y:2.55+rng()*1.35,z:p.z+Math.sin(a)*r};
  k.beam(fork,branch,.075+rng()*.04,wood);
  for(let j=0;j<4;j++){
   const t=a+(rng()-.5)*2,e={x:branch.x+Math.cos(t)*(.45+rng()*.60),y:branch.y+.24+rng()*.77,z:branch.z+Math.sin(t)*(.45+rng()*.55)};
   k.beam(branch,e,.026,wood);
   for(let b=0;b<6;b++){
    const x=e.x+(rng()-.5)*.81,z=e.z+(rng()-.5)*.76,y=e.y+rng()*.51;
    k.beam(e,{x,y,z},.011,wood);
    for(let petal=0;petal<3;petal++){
     const a=petal*2.09+b;
     k.crown(x+.053*Math.cos(a),y+.033,z+.053*Math.sin(a),.052,.12+rng()*.036,.065,petal===1?0xeed8df:0xfff1e9,a);
    }
   }
  }
 }
}
export function busShelter(k,p,yaw,label){
 // Leave the central waiting spot and the front boarding edge clear.
 const at=localFrame(p.x,p.z,yaw),part=(x,y,z,w,h,d,c)=>{const q=at(x,z);k.piece(q.x,y,q.z,w,h,d,c,yaw);};
 for(const side of [-1,1])part(side*1.73,1.32,-.90,.10,2.64,.10,0x426364);
 part(0,2.63,-.29,3.98,.18,1.78,0x4c6968);part(0,2.51,.54,4,.12,.08,0xc4aa75);
 part(0,.65,-.93,3.50,.073,.07,0x8baca9);part(0,1.86,-.93,3.52,.07,.08,0x647d78);
 const glass=at(0,-.93);k.geo(shelterGlass,glass.x,1.24,glass.z,3.50,1.65,1,0xb0d1ce,yaw,shelterGlassMaterial);
 const s=at(-1.36,-.83);k.sign(label,s.x,1.47,s.z,.57,.78,yaw,"#ece8d9","#354a44");
 const title=at(0,.64);k.sign(label,title.x,2.55,title.z,2.37,.28,yaw,"#314e4f");
}
const shelterGlass=new T.PlaneGeometry(),shelterGlassMaterial=new T.MeshStandardMaterial({
 color:0xe9ffff,transparent:true,opacity:.13,roughness:.36,side:T.DoubleSide,depthWrite:false
});
