import * as T from "three";
import {cafeFace} from "./pohang-cafe-site.js";
import {cafeGround,cafeRoof,cafeSeats} from "./coast-cafe.js";

export function buildWaterfrontCafe(root,{box,post,sign,rod}){
 const g=new T.Group();g.position.set(cafeFace.x,cafeGround,cafeFace.z);g.rotation.y=cafeFace.yaw;root.add(g);
 const cream=0xe8d9bf,oak=0xab7951,brass=0xb99661,teal=0x315f61,dark=0x314846,roof=cafeRoof-cafeGround;
 const panes=new T.MeshStandardMaterial({color:0x97c8cf,roughness:.14,transparent:true,opacity:.14,depthWrite:false});
 box(g,0xc4bbae,0,.017,4.60,43.30,.034,9.20);
 for(let x=-19.8;x<=21;x+=2.20)box(g,0xada69a,x,.039,4.60,.027,.008,9.2);
 for(let z=1.84;z<9.20;z+=1.84)box(g,0xada69a,0,.04,z,43.25,.008,.026);
 box(g,0xbdac90,0,-.065,-5.2,43.3,.13,10.9);
 for(let x=-20.4;x<21.2;x+=1.26)box(g,0xaa9a82,x,.009,-5.2,.018,.012,10.8);
 // Leave an opening in the terrace slab above the whole stair flight.
 for(const [x,z,w,d] of [[-3.33,-5.22,36.66,10.9],[19.76,-5.22,3.82,10.9],[16.50,-9.9,3.0,1.54],[16.50,-.64,3.0,1.36]])
  box(g,cream,x,roof-.115,z,w,.23,d);
 const lining=new T.MeshBasicMaterial({color:0xe5d8c1});
 box(g,lining,-3.33,roof-.25,-5.22,36.66,.025,10.9);
 box(g,0x997252,0,roof*.5,-10.55,43.15,roof,.19);
 for(const side of [-1,1]){
  box(g,cream,side*21.50,roof*.5,-5.15,.21,roof,10.63);
  const mid=side*11.55,w=19.95;
  box(g,cream,mid,.26,-.04,w,.52,.18);box(g,panes,mid,2.14,-.035,w,3.23,.028);
  for(let i=0;i<7;i++)box(g,dark,side*(1.56+i*3.27),2.10,-.065,.083,4.12,.10);
  box(g,dark,mid,3.67,-.04,w,.065,.12);
 }
 box(g,teal,0,3.92,.075,5.45,.53,.24);sign(g,"영일대 커피",0,3.94,.22,3.90,.42,"#315957");
 box(g,0xb29571,0,3.43,.64,5.82,.12,1.26);
 for(let x=-19.6;x<=20;x+=3.7){box(g,oak,x,roof-1.0,-10.38,.12,1.58,.17);}
 box(g,0x8b6a49,5.4,.57,-8.77,8.55,1.14,1.67);box(g,0xe6d9bd,5.4,1.19,-8.77,8.77,.10,1.81);
 box(g,0x778a85,3.55,1.54,-8.60,1.20,.62,.61);box(g,0x262f2d,3.55,1.49,-8.22,.85,.28,.12);
 for(let i=0;i<5;i++){post(g,cream,4.8+i*.185,1.33,-8.51,.072,.16,.072);post(g,0x6a6348,7.21+i*.23,1.40,-8.85,.092,.31,.092);}
 box(g,teal,5.30,2.67,-10.35,5.20,1.00,.15);sign(g,"커피  ·  해안로",5.30,2.67,-10.24,4.68,.64,"#365751");
 for(let i=0;i<25;i++){const h=roof*(i+1)/25,z=-1.55-(i+.5)*7.48/25;box(g,oak,16.5,h*.5,z,2.72,h,.307);}
 for(const x of [15.04,17.96]){
  rod(g,[x,.95,-1.55],[x,roof+.95,-9.03],.046,brass);
  for(let i=0;i<=5;i++)post(g,dark,x,.48+roof*i/5,-1.55-7.48*i/5,.028,.96,.028);
 }
 for(const [a,b] of [[[-21.4,0],[21.4,0]],[[-21.4,0],[-21.4,-10.4]],[[21.4,0],[21.4,-10.4]]]){
  rod(g,[a[0],roof+.97,a[1]],[b[0],roof+.97,b[1]],.04,brass);
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.92);
  for(let j=0;j<=n;j++)post(g,dark,a[0]+(b[0]-a[0])*j/n,roof+.47,a[1]+(b[1]-a[1])*j/n,.034,.94,.034);
  const sx=Math.abs(b[0]-a[0]),sz=Math.abs(b[1]-a[1]);box(g,panes,(a[0]+b[0])/2,roof+.47,(a[1]+b[1])/2,sx||.03,.78,sz||.03);
 }
 for(const seat of cafeSeats){
  const h=seat.floor-cafeGround,t=new T.Group();g.add(t);t.position.set(seat.x,h,seat.z);t.rotation.y=seat.yaw;
  box(t,oak,0,.73,.87,2.55,.11,.68);
  for(const dx of [-.91,.91])box(t,dark,dx,.34,.87,.098,.68,.25);
  for(const dx of [-.64,.64]){
   box(t,teal,dx,.45,0,.59,.08,.54);box(t,oak,dx,.68,-.27,.60,.43,.075);
   for(const lx of [-.23,.23])for(const lz of [-.19,.19])box(t,dark,dx+lx,.21,lz,.044,.42,.044);
  }
  post(t,cream,0,.87,.88,.10,.16,.10);
  if(h>0){box(t,0xbbac8d,-1.65,.25,-2.57,.79,.5,.68);post(t,0x71885e,-1.65,.70,-2.57,.48,.55,.36);}
 }
 for(const x of [-10.5,1.1]){
  box(g,oak,x,roof+.36,-7.75,3.18,.72,.85);
  box(g,0x65816c,x,roof+.81,-7.75,3.0,.43,.74);
 }
}
