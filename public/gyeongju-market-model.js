import * as T from "three";
import {marketDining,marketRooms} from "./gyeongju-market.js";
import {drawCafe} from "./gyeongju-architecture.js";
import {makeDiningStaff} from "./dining-staff.js";

export function drawMarket(k,room){
 const {fit,yaw,width:w,depth:d}=room,front=d/2,cz=fit.counter.z;
 drawCafe(k,room,fit);
 const timber=0x735038,clay=0x855840;
 const piece=(x,y,z,a,b,c,color)=>{const p=fit.point(x,z);k.piece(p.x,y,p.z,a,b,c,color,yaw);};
 const round=(x,y,z,a,b,color)=>{const p=fit.point(x,z);k.column(p.x,y,p.z,a,b,a,color);};
 const oval=(x,y,z,a,b,c,color)=>{const p=fit.point(x,z);k.crown(p.x,y,p.z,a,b,c,color,yaw);};
 if(room.id==="restaurant"){
  // The visible bell and tray share the table's actual seated height.
  for(const t of fit.tables){
   round(t.x,.78,t.z,.14,.035,0x72513b);oval(t.x,.811,t.z,.071,.046,.071,0xcbaa63);
   round(t.x,.857,t.z,.036,.024,0xb18a5a);
  }
  piece(-.68,1.062,cz,.78,.055,.58,0x52483d);
  round(-.68,1.198,cz,.46,.241,0xb1a293);
  round(-.68,1.33,cz,.485,.036,0x887865);round(-.68,1.378,cz,.086,.058,0x5e5148);
  for(const [i,side] of [[0,-1],[1,1]]){
   const x=side*1.88;
   round(x,1.06,cz,.48,.06,0xe1d2ae);
   for(let j=0;j<6;j++)oval(x+Math.cos(j*2.399)*.11,1.115,cz+Math.sin(j*2.399)*.10,.11,.035,.08,i?0x8c9b50:0x699051);
  }
 }else if(room.id==="pub"){
  // Earthenware jars sit under the eaves and small ceramic bottles line the bar.
  for(const [i,x] of [-w*.35,-w*.26].entries()){
   oval(x,.39,front+.36,.34-i*.05,.43-i*.07,.34-i*.05,clay);
   round(x,.78-i*.07,front+.36,.49-i*.07,.055,0x664737);
  }
  for(let shelf=0;shelf<2;shelf++)for(let i=0;i<8;i++){
   const x=(i-3.5)*.42,y=1.49+shelf*.65,z=-front+.38,color=[0x7d8663,0xb8a17a,0x668777,0x846147][i%4];
   round(x,y,z,.155,.205,color);round(x,y+.13,z,.076,.092,color);round(x,y+.18,z,.065,.024,timber);
  }
  for(const t of fit.tables){round(t.x,.775,t.z,.28,.033,0xc7ae80);round(t.x,.804,t.z,.17,.038,0xf0dfbf);}
 }else if(room.id==="store"){
  for(const side of [-1,1]){
   const x=side*(w/2-.52);
   piece(x,.97,.4,.70,1.88,4.50,0x76817b);
   for(let row=0;row<3;row++){
    const y=.4+row*.54;
    piece(x-side*.05,y,.4,.79,.058,4.45,0xd6c9a8);
    for(let i=0;i<11;i++){
     const z=(i-5)*.36+.4,col=[0xc99f6a,0xc88871,0x6b9785,0x7896a0,0xcdba80][(i+row)%5];
     piece(x-side*.36,y+.16,z,.23,.26,.24,col);
     piece(x-side*.479,y+.15,z,.014,.061,.18,0xe8dfc6);
    }
   }
  }
  piece(.65,1.23,cz,.56,.345,.10,0x354744);piece(.65,1.23,cz+.059,.47,.25,.016,0xa8bbb0);
 }else{
  // Rows of stamped red-bean buns under the counter display glass.
  piece(1.08,1.07,cz,1.13,.055,.52,timber);
  for(const x of [.53,1.63])for(const z of [cz-.245,cz+.245])piece(x,1.22,z,.027,.29,.027,timber);
  piece(1.08,1.37,cz,1.15,.041,.55,0xc5c4ad);
  for(let i=0;i<6;i++){const x=.72+i%3*.34,z=cz+(i<3?-.12:.12);oval(x,1.134,z,.137,.066,.098,0xbb7b47);round(x,1.195,z,.075,.01,0x9d693c);}
 }
}
export function createMarketStaff(town,kit,walkerModels){
 const room=marketRooms.find(r=>r.id==="restaurant");
 const space=new T.Group();space.name=marketDining.name+" 직원";space.position.set(room.x,0,room.z);space.rotation.y=room.yaw;town.add(space);
 return makeDiningStaff(T,space,kit,marketDining,walkerModels);
}
