import {cheonma,cheonmaPoint} from "./daereungwon.js";
import {BoxGeometry,CylinderGeometry,MeshStandardMaterial} from "three";
const lightStrip=new BoxGeometry(),circlet=new CylinderGeometry(.5,.5,1,28,1,true);
const glass=new MeshStandardMaterial({color:0xbdd4d2,opacity:.095,transparent:true,depthWrite:false,roughness:.25});

export function drawCheonma(k,glow){
 const {yaw}=cheonma;
 const part=(a,y,b,w,h,d,color)=>{const p=cheonmaPoint(a,b);k.piece(p.x,y,p.z,w,h,d,color,yaw);};
 const sign=(text,a,y,b,w,h,bg,ink)=>{const p=cheonmaPoint(a,b);k.sign(text,p.x,y,p.z,w,h,yaw,bg,ink);};
 const beam=(a,y,b,c,yy,d,r,color)=>k.beam({...cheonmaPoint(a,b),y},{...cheonmaPoint(c,d),y:yy},r,color);
 const stone=0xa39680,wall=0x766b59;
 part(0,.028,12.50,11.5,.055,11.1,0xbaad98);
 part(0,.028,23,4.24,.055,10.08,0xbaad98);
 for(const side of [-1,1]){
  part(side*2.03,1.56,22.7,.34,3.12,9.8,wall);
  part(side*5.72,1.65,12.5,.28,3.3,11.1,wall);
  part(side*3.9,1.65,17.94,3.75,3.3,.24,wall);
  for(let j=0;j<4;j++)part(side*2.23,j*.62+.31,27.55,.83,.60,.92,j%2?stone:0xb6aa92);
 }
 part(0,2.89,27.47,5.65,.80,1.45,0xb1a58e);
 part(0,3.33,27.55,5.92,.12,1.60,0x837968);
 sign("천 마 총",0,2.9,28.215,2.14,.44,"#494239","#f1dfbc");
 part(0,3.23,22.8,4.45,.28,9.75,0x817766);
 part(0,3.34,12.4,11.69,.26,11.2,0x665e51);
 part(0,1.66,7.06,11.5,3.32,.26,wall);
 for(let i=0;i<5;i++){
  const p=cheonmaPoint(0,9.6+i*3.74);
  k.geo(lightStrip,p.x,3.069,p.z,.92,.044,.18,0xffe6bd,yaw,glow);
 }
 sign("천마총 금관",0,.65,13.797,1.08,.19,"#4e4334","#fae6be");
 part(0,.42,12.8,2.58,.8,1.96,0x67574b);
 part(0,.84,12.8,2.67,.06,2.05,0xbca987);
 part(0,.91,12.8,.84,.12,.68,0x443e36);
 const gold=0xd9ad4f;
 const center=cheonmaPoint(0,12.8);
 k.geo(circlet,center.x,1.07,center.z,.53,.18,.43,gold,yaw);
 for(let i=0;i<18;i++){
  const a=i*Math.PI/9,p=cheonmaPoint(.27*Math.sin(a),12.8+.22*Math.cos(a));
  k.crown(p.x,1.065,p.z,.012,.012,.012,0xf4d787);
 }
 for(const a of [-.22,0,.22]){
  const b=a===0?12.65:12.8;
  beam(a,1.08,b,a,1.70,b,.021,gold);
  for(let j=0;j<3;j++)for(const s of [-1,1]){
   const y=1.20+j*.15,tip=a+s*(.097-j*.012);
   beam(a,y,b,tip,y+.064,b,.016,gold);beam(tip,y+.064,b,tip,y+.136,b,.015,gold);
  }
 }
 for(const side of [-1,1]){
  beam(side*.15,1.08,12.90,side*.31,1.51,12.995,.018,gold);
  beam(side*.27,1.40,12.97,side*.39,1.50,12.94,.015,gold);
  beam(side*.22,1.1,12.9,side*.24,.87,12.91,.008,gold);
  const p=cheonmaPoint(side*.24,12.91);k.crown(p.x,.87,p.z,.023,.04,.018,0x779980);
 }
 for(const side of [-1,1]){
  const edge=cheonmaPoint(side*1.22,12.8),front=cheonmaPoint(0,12.8+side*.90);
  k.geo(lightStrip,edge.x,1.40,edge.z,.018,1.08,1.80,0xffffff,yaw,glass);
  k.geo(lightStrip,front.x,1.40,front.z,2.44,1.08,.018,0xffffff,yaw,glass);
  for(const end of [-1,1])part(side*1.22,1.40,12.8+end*.9,.023,1.08,.023,0x958a73);
  part(0,1.95,12.8+side*.9,2.46,.028,.028,0x877e68);
  part(side*1.22,1.95,12.8,.028,.028,1.82,0x877e68);
 }
}

export function drawMichu(k){
 const x=126,z=-117.1,angle=.10;
 const at=(a,b)=>({x:x+a*Math.cos(angle)+b*Math.sin(angle),z:z-a*Math.sin(angle)+b*Math.cos(angle)});
 const stone=(a,y,b,w,h,d,color)=>{const p=at(a,b);k.piece(p.x,y,p.z,w,h,d,color,angle);};
 for(const side of [-1,1]){
  stone(side*1.17,.24,30.15,.70,.47,.81,0x999386);
  const p=at(side*3.42,30.6);k.column(p.x,.37,p.z,.48,.74,.48,0xb3ab99);
  k.crown(p.x,.78,p.z,.25,.15,.25,0xa39e90);
 }
 stone(0,.53,30.15,3.28,.25,1.37,0xb8b1a0);
 stone(3.95,.10,32.45,1.02,.20,.74,0xaaa596);
 stone(3.95,.82,32.45,.65,1.26,.38,0x8f8a7e);
 const s=at(3.95,32.655);k.sign("미추왕릉",s.x,.98,s.z,.57,.18,angle,"#847f73","#eee4c9");
}
