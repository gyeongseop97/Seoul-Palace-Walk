import * as T from "three";
import {coastPoint} from "./region-coordinates.js";
import {front,tavernName,tavernYaw,tavernAxes,tavernTables,tavernPlateOffset} from "./coast-tavern-layout.js";
import {makeDiningHuman} from "./dining-staff.js";
import {tavernReply} from "./tavern-speech.js";

const floor=1.97;
function frame(parent){
 const g=new T.Group();g.position.set(front.x,floor,front.z);g.rotation.y=tavernYaw;parent.add(g);return g;
}
// The east corner frontage uses the existing upper storeys. Indoors the open doorway frames the kitchen.
export function buildTavernFront(parent,{box,post,oval,rod,sign}){
 const g=frame(parent),wood=0x996f50,red=0xa24431,steel=0x6b7777;
 box(g,0x938677,0,-.075,-1.92,7.42,.15,12.25);
 for(let row=0;row<8;row++){
  const z=-3.5+row*1.02;
  box(g,0x82776a,0,.004,z,7.40,.009,.018);
  const span=Math.min(1,4.16-z);
  for(let x=-3.35+(row%2)*.81;x<3.6;x+=1.63)box(g,0x82776a,x,.004,z+span/2,.018,.009,span);
 }
 box(g,0xd0c7ad,0,1.9,-8.02,7.44,3.8,.20);
 box(g,0xb6b2a1,0,3.83,-3.92,7.5,.23,8.2);
 for(const u of [-3.69,3.69])box(g,0x917d6b,u,1.83,-3.96,.11,3.66,8.06);
 const glass=new T.MeshStandardMaterial({color:0x90b3b1,roughness:.21,transparent:true,opacity:.31,depthWrite:false});
 for(const side of [-1,1]){
  box(g,wood,side*2.32,.45,-3.76,2.60,.90,.19);
  box(g,glass,side*2.32,1.68,-3.71,2.54,1.52,.08);
  for(const u of [side*.99,side*2.41])box(g,0x535349,u,1.43,-3.66,.068,2.87,.18);
  box(g,0x535349,side*2.32,2.52,-3.7,2.62,.12,.15);
  box(g,0xc5b398,side*1.91,.53,-7.41,3.05,1.06,.87);
  box(g,steel,side*1.91,1.10,-7.41,3.16,.09,.99);
  for(const u of [.92,2.25])post(g,steel,side*u,1.31,-7.43,.23,.31,.23);
  box(g,steel,side*1.9,2.34,-7.62,2.40,.43,.58);
  box(g,0x709491,side*2.89,.96,-4.27,1.32,1.62,.77);
  box(g,0x577b78,side*2.89,1.07,-3.85,1.19,1.10,.09);
  for(let i=0;i<3;i++)oval(g,0xc1baa1,side*2.89-.33+i*.28,.91+i%2*.23,-3.78,.14,.049,.028);
  for(let i=0;i<5;i++){
   const u=side*(.375+i*.74);
   const color=i%2?0xe2d6bc:0xae5140;
   const awning=box(g,color,u,2.97,1.80,.743,.13,3.80);awning.rotation.x=.092;
   box(g,color,u,2.66,3.69,.743,.32,.078);
  }
  post(g,steel,side*3.58,1.34,3.62,.043,2.68,.043);
 }
 box(g,0x744031,0,3.33,-.01,7.51,.69,.22);
 for(const u of [-1.44,1.44])rod(g,[u,2.89,3.61],[u,3.44,3.66],.026,steel);
 box(g,0x3c5b56,0,3.19,3.67,4.00,.56,.12);
 sign(g,tavernName,0,3.19,3.734,3.94,.48,"#344d47");
 for(let u=-3;u<=3;u++){
  rod(g,[u,2.85,3.65],[u,2.70,3.65],.011,steel);
  oval(g,0xffddaf,u,2.67,3.65,.048,.065,.048);
 }
 sign(g,"활어회  ·  조개구이  ·  소주",0,2.81,-3.54,3.47,.39,"#863b2c");
 for(const t of tavernTables){
  const x=t.u,z=t.v;
  box(g,wood,x,.75,z,.94,.14,1.72);
  for(const dx of [-.35,.35])for(const dz of [-.69,.69])box(g,steel,x+dx,.34,z+dz,.071,.68,.071);
  post(g,0x393e3e,x,.84,z,.28,.062,.28);
  for(let k=0;k<7;k++)box(g,0xacac9f,x-.22+k*.073,.883,z,.019,.022,.37);
  box(g,0x403e37,x+.31,.847,z+.69,.17,.093,.16);
  post(g,0xdba257,x+.31,.917,z+.69,.052,.034,.052);
  box(g,0x846858,x+.32,.91,z-.69,.18,.22,.20);
  for(let k=0;k<4;k++)rod(g,[x+.28+k*.024,.94,z-.69],[x+.27+k*.026,1.21,z-.67],.009,0xd0b780);
  post(g,0xeee3c7,x-.31,.85,z+.66,.10,.055,.10);
  post(g,0xad6147,x-.31,.882,z+.66,.072,.015,.072);
  for(const seat of t.seats){
   const q=tavernAxes(seat);
   post(g,red,q.u,.46,q.v,.30,.095,.30);
   for(const dx of [-.16,.16])for(const dz of [-.16,.16])rod(g,[q.u+dx*1.35,.03,q.v+dz*1.35],[q.u+dx,.42,q.v+dz],.034,steel);
  }
 }
}

// Order phases are shared room time. Every client evaluates the same walk through the door.
function routePose(table,t,reverse){
 const kitchen=tavernAxes(table.kitchen),side=Math.sign(table.u);
 const service=tavernAxes(table.server);
 const points=[[kitchen.u,kitchen.v],[side*.24,-4.53],[side*.24,-3.31],[side*.24,service.v],[service.u,service.v]];
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 let n=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,reverse?1-t:t)),j=0;
 while(j<lengths.length-1&&n>lengths[j])n-=lengths[j++];
 const a=points[j],b=points[j+1],f=Math.min(1,n/lengths[j]);
 const face=Math.atan2(b[0]-a[0],b[1]-a[1])+(reverse?Math.PI:0);
 return {x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,face,walking:t>0&&t<1};
}
export function servicePose(table,order,now){
 const spot=tavernAxes(table.kitchen),idle={x:spot.u,z:spot.v,face:0,walking:false};
 if(!order)return idle;
 if(order.phase==="called")return routePose(table,(now-order.called)/2600,false);
 if(order.phase==="ordering")return {...routePose(table,1,false),writing:true};
 if(order.phase==="cooking"){
  if(now>=order.ready)return {...routePose(table,(now-order.ready)/Math.max(1,order.served-order.ready||3000),false),carrying:true};
  if(now<order.ordered+2200)return routePose(table,(now-order.ordered)/2200,true);
  return {...idle,cooking:true,face:Math.PI};
 }
 if(order.phase==="served"&&now<order.served+2400)return routePose(table,(now-order.served)/2400,true);
 return idle;
}
const dishPaint=new Map(),cube=new T.BoxGeometry(),round=new T.CylinderGeometry(1,1,1,18),ball=new T.SphereGeometry(1,12,8);
function piece(root,geometry,tint,x,y,z,w,h,d){
 if(!dishPaint.has(tint))dishPaint.set(tint,new T.MeshStandardMaterial({color:tint,roughness:.62}));
 const m=new T.Mesh(geometry,dishPaint.get(tint));m.position.set(x,y,z);m.scale.set(w,h,d);root.add(m);return m;
}
function dishSet(root,table){
 const tableware=new T.Group();root.add(tableware);tableware.position.set(table.u,.84,table.v);
 const tray=piece(tableware,cube,0x754e37,-.07,.006,-.65,.55,.038,.30);
 piece(tableware,ball,0xe1d9c2,-.07,.045,-.65,.24,.023,.13);
 const cuts=[],portions=[],bottles=[],grill=[],raw=[];
 for(let i=0;i<6;i++){
  const fillet=piece(tableware,ball,i%2?0xf5ccb0:0xda927c,-.22+i*.057,.074,-.65,.036,.015,.068);fillet.rotation.y=.44;cuts.push(fillet);
 }
 for(let i=0;i<4;i++){
  const {u,v}=tavernPlateOffset(i);
  piece(tableware,ball,0xf3e6cd,u,.006,v,.108,.014,.087);
  const bite=new T.Group();tableware.add(bite);bite.position.set(u,.033,v);
  piece(bite,ball,0xe59883,0,0,0,.038,.010,.018);
  for(const x of [-.015,.008])piece(bite,ball,0xffdbbe,x,.007,0,.0018,.002,.013).rotation.y=.33;
  portions.push(bite);
 }
 for(let i=0;i<3;i++){
  const bottle=new T.Group();tableware.add(bottle);bottle.position.set(.05+i*.117,.008,.47);
  piece(bottle,round,0x30714b,0,.13,0,.053,.26,.053);piece(bottle,round,0x31794e,0,.29,0,.027,.083,.027);
  piece(bottle,round,0xe1ddb4,0,.14,0,.055,.087,.055);piece(bottle,round,0xd0c6a0,0,.344,0,.032,.032,.032);bottles.push(bottle);
 }
 const shellGeometry=new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2);
 const shell=(shade,x,z)=>{const dish=new T.Group();tableware.add(dish);dish.position.set(x,.10,z);
  const low=piece(dish,shellGeometry,0xc3aa8c,0,0,0,.10,.036,.073);low.rotation.x=Math.PI;
  piece(dish,ball,0xddab6e,0,.012,0,.053,.02,.044);
  const top=piece(dish,shellGeometry,shade,0,.023,.013,.103,.045,.074);return {dish,top};};
 for(let i=0;i<6;i++){
  grill.push(shell(i%2?0xaa9b87:0xc2b39b,(i%3-1)*.19,(Math.floor(i/3)-.5)*.22));
  raw.push(shell(0x9a9684,(i%3-1)*.133,(Math.floor(i/3)-.5)*.15+.64));
 }
 return (order,now,diners)=>{
  tableware.visible=!!order&&(order.phase==="served"||order.soju>0||order.sashimi>0||order.grilledClam>0||order.rawClams>0||order.cookingClams>0);
  if(!tableware.visible)return;
  const clamReady=order.cookingClams>0&&now>=order.grillUntil;
  const portionsLeft=order.sashimi??0;
  cuts.forEach((m,i)=>m.visible=i<Math.min(6,portionsLeft));
  for(const [i,bite] of portions.entries()){
   const diner=diners.find(p=>p.coast?.mode==="table"&&p.coast.seat===table.index*4+i),taste=diner?.coast.tasting;
   const age=taste?.kind==="sashimi"?now-taste.at:-1;
   bite.visible=Boolean(diner)&&(age>=0&&age<1300?age<234:portionsLeft>0);
  }
  bottles.forEach((b,i)=>b.visible=i<Math.ceil((order.soju??0)/4));
  for(let i=0;i<6;i++){
   const cooking=order.cookingClams??0,done=order.grilledClam??0;
   grill[i].dish.visible=i<cooking+done;grill[i].top.rotation.x=i<done||clamReady?-1.22:-.14;
   raw[i].dish.visible=i<(order.rawClams??0);
  }
  tray.visible=true;
 };
}
export function buildTavernService(parent,walkers,kit){
 const room=frame(parent);room.name=tavernName;
 const venue={id:"coast-tavern",name:tavernName,center:coastPoint(front),cuisine:"korean",service:"staff"};
 let last=0;
 const staff=[],dishes=tavernTables.map(t=>dishSet(room,t));
 return (now,orders,viewer,diners=[])=>{
  const near=Math.hypot(viewer.x-front.x,viewer.z-front.z)<110;room.visible=near;
  if(!near)return;
  const delta=Math.min(.07,(now-last)/1000);last=now;
  const active=Array.isArray(orders)?orders:[];
  for(const t of tavernTables){
   const order=active.find(o=>o.spot===t.index);
   const state=servicePose(t,order,now);
   const reply=tavernReply(order,now);
   if(reply){
    const at=order.phase==="called"?order.called:order.phase==="ordering"?order.called+2600:
      order.phase==="served"?order.served:now>=order.ready?order.ready:order.ordered;
    state.chat={id:t.index+"-"+at,text:reply,at};
   }
   if(order||t.index===0){
    if(!staff[t.index]){
     const group=new T.Group();room.add(group);
     staff[t.index]={group,update:makeDiningHuman(T,group,kit,venue,walkers,t.index)};
    }
    staff[t.index].group.visible=true;
    staff[t.index].update(state,now,order,delta);
   }else if(staff[t.index])staff[t.index].group.visible=false;
   dishes[t.index](order,now,diners);
  }
 };
}
