import * as T from "three";
import {localFrame,registerDistrictLod,randomSeed} from "./gyeongju-mesh.js";
import {dancheongTexture} from "./palace-dancheong.js";
import {templeAxis} from "./bulguksa-ground.js";
import {drawHallRoof} from "./bulguksa-roof.js";

const yaw=.15,face=new T.PlaneGeometry(1,1);
const timber=0x985843,deepWood=0x6f5440,stone=0xb8b1a0,blueGreen=0x638274;
const paints=new Map();
function paintedPanel(key,draw,width=256,height=512){
 if(!paints.has(key)){
  const cv=document.createElement("canvas");cv.width=width;cv.height=height;
  draw(cv.getContext("2d"),width,height);
  const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  paints.set(key,new T.MeshStandardMaterial({map,roughness:.88}));
 }
 return paints.get(key);
}
function doorMaterial(name,pattern){
 return paintedPanel(name+pattern,(ctx,w,h)=>{
  const blue=name==="극락전",frame=blue?"#70a79a":"#9b8763",lattice=blue?"#75b5a6":"#a89a77";
  ctx.fillStyle=frame;ctx.fillRect(0,0,w,h);
  const x=15,top=20,right=w-15,bottom=h*.73;
  ctx.fillStyle=blue?"#475f58":"#535747";ctx.fillRect(x,top,right-x,bottom-top);
  ctx.save();ctx.beginPath();ctx.rect(x,top,right-x,bottom-top);ctx.clip();
  const step=23,line=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
  for(const [weight,ink] of [[6,"#524e3c"],[3.6,lattice],[1,blue?"#97c9b7":"#c5b997"]]){
   ctx.strokeStyle=ink;ctx.lineWidth=weight;
   if(pattern==="straight"){
    for(let i=x;i<w;i+=step*.7)line(i,top,i,bottom);
    for(const row of [.09,.14,.71,.76,.89])line(x,bottom*row,right,bottom*row);
   }else{
    for(let i=-h;i<w+h;i+=step){line(i,0,i+h*.62,h);line(i,0,i-h*.62,h);}
    if(pattern==="flower")for(let i=x;i<w;i+=step)line(i,top,i,bottom);
   }
  }
  if(pattern==="flower")for(let i=0;i<14;i++)for(let j=0;j<8;j++){
   const px=x+i*step,py=top+j*step/.62+(i%2)*step/.62;
   ctx.fillStyle=(i+j)%2?"#b48267":"#ac975d";
   for(const [sx,sy] of [[-3,0],[3,0],[0,-3],[0,3]]){ctx.beginPath();ctx.arc(px+sx,py+sy,2.9,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
  for(const [dy,dh] of [[bottom+8,15],[bottom+30,h-bottom-49]]){
   ctx.fillStyle=blue?"#4e9082":"#6f775d";ctx.fillRect(11,dy,w-22,dh);
   ctx.strokeStyle="#c9af81";ctx.lineWidth=2;ctx.strokeRect(15,dy+3,w-30,dh-6);
  }
  const mid=(bottom+h)*.5+14;
  ctx.strokeStyle=blue?"#c58562":"#98785a";ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(w/2,mid,39,12,0,0,Math.PI*2);ctx.stroke();
  const rng=randomSeed(7107);
  for(let i=0;i<1200;i++){
   ctx.fillStyle=i%2?"rgba(31,28,20,.09)":"rgba(247,221,178,.10)";
   ctx.fillRect(rng()*w,rng()*h,1+rng()*2,1+rng()*6);
  }
 });
}
function plaque(name){
 const text={대웅전:"殿雄大",극락전:"殿樂極",자하문:"門霞紫",안양문:"門養安"}[name];
 return paintedPanel("plaque-"+name,(ctx,w,h)=>{
  ctx.fillStyle="#352e26";ctx.fillRect(0,0,w,h);
  for(const [inset,col,line] of [[3,"#72533d",6],[10,"#b38b60",3],[14,"#534738",2]]){
   ctx.strokeStyle=col;ctx.lineWidth=line;ctx.strokeRect(inset,inset,w-inset*2,h-inset*2);
  }
  ctx.fillStyle="#eee3ca";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.font='bold 122px Batang,"Noto Serif CJK KR",serif';ctx.fillText(text,w/2,h*.53,w*.88);
 },512,150);
}
export function timberWindow(k,x,y,z,w,h,yaw){
 k.geo(face,x,y,z,w,h,1,0xffffff,yaw,doorMaterial("별당","straight"));
}
let brackets,band;
const photoRects={
 sideDoor:[8,8,144,420],flowerDoor:[168,8,163,420],stone:[352,8,320,182],
 beam:[352,209,316,114],plaster:[699,8,271,324],gable:[360,336,320,106],altar:[8,452,1008,564]
};
const photoPaints=new Map();
let photoAtlas;
function applyPhoto(patch,material){
 const [x,y,w,h]=photoRects[patch],map=photoAtlas.clone();
 map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 map.repeat.set(w/1024,h/1024);map.offset.set(x/1024,1-(y+h)/1024);map.needsUpdate=true;
 material.map=map;material.color.set(0xffffff);material.needsUpdate=true;
}
function photographic(patch,fallback){
 if(!photoPaints.has(patch)){
  const material=fallback.clone();photoPaints.set(patch,material);
  if(photoAtlas?.image)applyPhoto(patch,material);
  if(!photoAtlas&&typeof Image!=="undefined"){
   photoAtlas=new T.TextureLoader().load(new URL("./art/bulguksa-hall-woodwork.webp",import.meta.url).href,
    ()=>{for(const [id,paint] of photoPaints)applyPhoto(id,paint);});
  }
 }
 return photoPaints.get(patch);
}
const granite=new T.MeshStandardMaterial({color:0xb5aa97,roughness:.98});
export const templeGranite=()=>photographic("stone",granite);
const plaster=new T.MeshStandardMaterial({color:0xb69b72,roughness:.99});
const inner=new T.MeshStandardMaterial({color:0x745836,roughness:.96});
function bracketGeometry(){
 const s=new T.Shape();
 s.moveTo(-.5,.14);s.lineTo(.5,.14);s.lineTo(.47,.02);s.quadraticCurveTo(.39,.04,.39,-.045);
 s.quadraticCurveTo(.34,-.09,.29,-.06);s.quadraticCurveTo(.23,-.18,.15,-.13);s.lineTo(.12,-.19);
 s.lineTo(-.12,-.19);s.lineTo(-.15,-.13);s.quadraticCurveTo(-.23,-.18,-.29,-.06);
 s.quadraticCurveTo(-.34,-.09,-.39,-.045);s.quadraticCurveTo(-.39,.04,-.47,.02);s.closePath();
 const geo=new T.ExtrudeGeometry(s,{depth:.20,curveSegments:3,bevelEnabled:false});geo.translate(0,0,-.10);
 const distant=new T.BoxGeometry(1,.27,.2);registerDistrictLod(geo,distant,75);return geo;
}
function edges(width,weights){
 const sum=weights.reduce((a,b)=>a+b,0),result=[-width/2];
 for(const weight of weights)result.push(result.at(-1)+width*weight/sum);return result;
}
export function* drawBulguksaHall(k,b){
 const center=templeAxis(b.u,b.v),at=localFrame(center.x,center.z,yaw),base=b.floor,plinth=b.plinth;
 const great=b.name==="대웅전",gate=!b.plinth,anyang=b.name==="안양문";
 const eave=great?6.28:gate?4.18:4.98,rise=great?4.58:gate?3.05:3.59;
 const beam=eave-(great?1.36:1.06),xHalf=b.bodyW/2,zHalf=b.bodyD/2;
 const part=(u,y,v,w,h,d,col,turn=0)=>{const p=at(u,v);k.piece(p.x,base+y,p.z,w,h,d,col,yaw+turn);};
 function panel(u,y,v,w,h,angle,mat){
  const p=at(u,v);k.geo(face,p.x,base+y,p.z,w,h,1,0xffffff,yaw+angle,mat);
 }
 if(plinth){
  part(0,plinth/2,0,b.deckW-.20,plinth,b.deckD-.20,0xa59d8f);
  for(const [y,w,h,c] of [[.09,.05,.16,0xa29d8d],[plinth-.08,0,.17,0xc8c0ab]]){
   part(0,y,0,b.deckW+w,h,b.deckD+w,c);
  }
  for(const side of [-1,1])for(const end of [false,true]){
   const span=end?b.deckD:b.deckW;
   for(let i=0,n=Math.ceil(span/1.9);i<n;i++){
    const u=span*((i+.5)/n-.5),v=side*(end?b.deckW:b.deckD)/2;
    part(end?v:u,plinth*.5,end?u:v,span/n-.045,plinth-.23,.085,[0xb5aa96,0xb0a997,0xa59f90,0xbab19e][i%4],end?Math.PI/2:0);
    const outside=v+side*.046,angle=end?side*Math.PI/2:side>0?0:Math.PI;
    panel(end?outside:u,plinth*.5,end?u:outside,span/n-.055,plinth-.235,angle,photographic("stone",granite));
   }
  }
  for(const side of b.stairs){
   const end=side==="west"||side==="east",dir=side==="north"||side==="west"?-1:1;
   const edge=(end?b.deckW:b.deckD)/2,tread=b.stairRun/b.stairCount;
   for(let n=0;n<b.stairCount;n++){
    const level=plinth*(1-n/b.stairCount),v=dir*(edge+tread*(n+.5));
    part(end?v:0,level/2,end?0:v,b.stairW,level,tread+.012,n%2?stone:0xbeb6a4,end?Math.PI/2:0);
   }
  }
 }else part(0,.022,0,b.bodyW+.72,.044,b.bodyD+.82,0xb6ac96);
 yield;
 const columnsX=edges(b.bodyW,b.frontBays),columnsZ=edges(b.bodyD,Array(b.sideBays).fill(1));
 const columnWidth=great?.49:gate?.4:.43;
 function column(u,v){
  const p=at(u,v),top=beam+.17,bottom=plinth+.22;
  k.column(p.x,base+plinth+.095,p.z,columnWidth*1.52,.19,columnWidth*1.52,stone);
  k.column(p.x,base+(top+bottom)/2,p.z,columnWidth,top-bottom,columnWidth,timber);
  k.column(p.x,base+beam-.13,p.z,columnWidth*1.025,.5,columnWidth*1.025,0x617a66);
 }
 for(const side of [-1,1]){
  for(const u of columnsX)column(u,side*zHalf);
  for(const v of columnsZ.slice(1,-1))column(side*xHalf,v);
 }
 if(!gate){
  part(0,plinth+.045,0,b.bodyW,.09,b.bodyD,0x92744e);
  // The open leaves reveal a shaded timber interior behind the front line of columns.
  part(0,(plinth+beam)/2,-zHalf*.58,b.bodyW-.42,beam-plinth,.16,0x72563c);
  for(const u of [-xHalf*.56,xHalf*.56])column(u,-zHalf*.25);
  if(great)panel(0,(plinth+beam)/2,-zHalf*.58+.095,(beam-plinth)*1.78,beam-plinth-.09,0,photographic("altar",inner));
 }
 yield;
 brackets??=bracketGeometry();
 if(!band){const map=dancheongTexture(T);map.repeat.x=4;band=new T.MeshStandardMaterial({map,roughness:.93,color:0xbbaa91});}
 for(const side of [-1,1])for(const end of [false,true]){
  const axis=end?columnsZ:columnsX,angle=end?(side>0?Math.PI/2:-Math.PI/2):(side>0?0:Math.PI);
  const limit=end?xHalf:zHalf;
  const site=(u,v)=>end?{x:side*(limit+v),z:u}:{x:u,z:side*(limit+v)};
  function piece(u,y,v,w,h,d,col){const a=site(u,v);part(a.x,y,a.z,w,h,d,col,end?Math.PI/2:0);}
  function imageAt(u,y,v,w,h,mat){const a=site(u,v);panel(a.x,y,a.z,w,h,angle,mat);}
  const span=axis.at(-1)-axis[0];
  piece(0,beam+.025,0,span+.45,.24,.38,timber);
  piece(0,beam+.275,.04,span+.50,.24,.42,blueGreen);
  for(let i=0;i+1<axis.length;i++){
   const mid=(axis[i]+axis[i+1])/2,width=axis[i+1]-axis[i];
   imageAt(mid,beam+.24,.271,width-.05,.31,great?photographic("beam",band):band);
   const front=!end&&side>0,centerBay=i===(axis.length-2)/2;
   const door=front||(end&&i===Math.floor((axis.length-1)/2))||(!end&&side<0&&(centerBay||i===0||i===axis.length-2));
   if(!gate){
    if(door){
     const leaves=front?(great?(centerBay?4:2):(centerBay?4:3)):(end?3:2);
     const clear=width-columnWidth*.85,pitch=clear/leaves,lower=plinth+.22,upper=beam-.11;
     const pattern=front?(great&&centerBay?"flower":"diamond"):"straight";
     const drawn=doorMaterial(b.name,pattern);
     const mat=great&&front?photographic(centerBay?"flowerDoor":"sideDoor",drawn):drawn;
     for(let n=0;n<leaves;n++){
      const opened=front&&centerBay&&(n===1||n===2),u=mid+(n+.5-leaves/2)*pitch;
      const a=site(opened?mid+(n===1?-1:1)*pitch*.98:u,opened?-pitch/2:-.055);
      if(opened)panel(a.x,(upper+lower)/2,a.z,pitch-.045,upper-lower,angle+(n===1?1:-1)*1.36,mat);
      else imageAt(u,(upper+lower)/2,-.055,pitch-.038,upper-lower,mat);
     }
     piece(mid,lower-.08,0,clear,.16,.25,deepWood);
    }else{
     piece(mid,(plinth+beam)/2,-.12,width-.16,beam-plinth,.19,0xc4af8f);
     piece(mid,plinth+.58,.008,width-.2,.13,.11,0x896951);
     if(great)imageAt(mid,(plinth+beam)/2,-.012,width-.30,beam-plinth-.22,photographic("plaster",plaster));
    }
   }else if(end||anyang&&!centerBay){
    piece(mid,(beam+.16)/2,-.09,width-.30,beam-.16,.16,0xb77855);
    for(let j=0;j<4;j++)piece(mid+(j-1.5)*width*.19,beam*(end?.73:.5),.015,.06,beam*(end?.35:.88),.12,deepWood);
   }
   const repeat=Math.max(1,Math.round(width/1.40));
   for(let n=0;n<repeat;n++){
    const u=axis[i]+width*n/repeat;
    for(let j=0;j<3;j++){
     const a=site(u,.13+j*.23),p=at(a.x,a.z);
     k.geo(brackets,p.x,base+beam+.42+j*.21,p.z,.69+j*.18,.78,.95,[0x72917c,0x987452,0x527a6e][j],yaw+angle);
     piece(u,beam+.49+j*.21,.13+j*.20,.20,.21,.62+j*.17,j%2?0x856449:0x608575);
    }
   }
  }
  piece(0,eave-.13,.65,span+1.76,.25,.40,0x758377);
  yield;
 }
 const width=great?3.9:gate?1.48:1.78,height=great?1.15:gate?.68:.65;
 const front=at(0,zHalf+.791);
 part(0,beam+.48,zHalf+.68,width+.1,height+.09,.20,deepWood);
 k.geo(face,front.x,base+beam+.48,front.z,width,height,1,0xffffff,yaw,plaque(b.name));
 // The ceiling and enclosed roof frame meet the sloping eaves behind the open bracket bays.
 part(0,eave+.40,0,b.bodyW+2.8,1.01,b.bodyD+2.65,0x6b7565);
 drawHallRoof(k,b,at,yaw,eave,rise,great?photographic("gable",plaster):undefined);
}
