import {bukchonTerrain} from "./bukchon-layout.js";
import {chairSize,diningFurniture,diningPlot,diningTables,diningVenue,diningWalls,tableSize} from "./dining-layout.js";
import {makeDiningDishes} from "./dining-dishes.js";
import {standBatcher,standSign} from "./regional-stands.js";

const wood=0x614336,heartwood=0x402e28,copper=0xc9955d,cream=0xe8d8b6;
const paper=0xf4e4bf,teal=0x4c6557,red=0x88473e;

export function* buildDiningFacade(T,root,kit){
  const {wx,wz,box,cylinder}=kit;
  const {x,y,w,d,angle}=diningPlot,z=d/2;
  const group=new T.Group();group.name=diningVenue.name;
  const frontFloor=bukchonTerrain(diningVenue.outsideDoor.x,diningVenue.outsideDoor.y);
  group.position.set(wx(x),frontFloor,wz(y));group.rotation.y=angle;root.add(group);
  const part=(color,x0,h,z0,width,height,depth)=>box(color,x0,h,z0,width,height,depth,group);
  part(0x999183,0,-.45,0,w+.24,1.1,d+.21);
  part(0xaaa18c,0,.023,z+.28,w,.07,.91);
  part(paper,0,1.68,-.15,w,3.27,d-.30);
  part(heartwood,0,1.71,z,2.14,3.06,.22);
  part(0x54483a,0,1.25,z+.14,1.38,2.42,.038);
  part(copper,.44,1.15,z+.199,.047,.26,.077);
  part(wood,0,.12,z+.09,2.03,.15,.24);
  for(const px of [-6.4,-2.6,-1.1,1.1,2.6,6.4])part(wood,px,1.64,z+.14,.15,3.28,.24);
  for(const side of [-1,1]){
    const px=side*4.45;
    part(wood,px,1.50,z+.12,3.47,1.93,.11);
    part(0xdda874,px,1.53,z+.18,3.22,1.70,.028);
    for(let i=-4;i<=4;i++)part(wood,px+i*.354,1.53,z+.21,.042,1.70,.039);
    for(const h of [.89,1.58,2.16])part(wood,px,h,z+.21,3.24,.046,.034);
    part(wood,px,.61,z+.24,3.46,.105,.34);
    part(wood,side*2.15,.3,z+.22,.64,.11,.58);
    cylinder(red,side*2.15,.37,z+.22,.21,.45,11,group,1.22);
    for(let i=0;i<5;i++){
      const a=i*2.399,h=.12+(i%3)*.12;
      const leaf=box(i%2?teal:0x70845a,side*2.15+Math.sin(a)*.12,.62+h/2,z+.22+Math.cos(a)*.12,.10,h,.075,group);
      leaf.rotation.z=(i-2)*.3;
    }
  }
  part(heartwood,0,3.17,z+.12,w+.24,.24,.32);
  standSign(T,group,diningVenue.name,"나물 비빔밥 · 버섯 국밥",3.58,0,2.80,z+.17,"#4b362c","#ffeac8",.75);
  part(0x403f3a,0,3.41,0,w+.8,.23,d+.91);
  for(const side of [-1,1]){
    const roof=part(0x494843,0,3.89,side*(d/4+.16),w+.73,.19,d*.511+.42);
    roof.rotation.x=side*.191;
    for(let i=0;i<=42;i++){
      const xx=(i/42-.5)*(w+.7);
      const tile=part(i%4===0?0x4c4945:0x373b39,xx,3.96,side*(d/4+.16),.076,.095,d*.511+.47);
      tile.rotation.x=side*.191;
    }
  }
  part(0x3b3e3a,0,4.44,0,w+.91,.14,.30);
  yield;
}

export function* buildDiningInterior(T,root,kit){
  const {wx,wz,box,cylinder}=kit;
  const room=new T.Group(),{center}=diningVenue;
  room.name=diningVenue.name;room.position.set(wx(center.x),0,wz(center.y));root.add(room);
  const staticGroups=[room];
  const part=(color,x,y,z,w,h,d,parent=room)=>box(color,x,y,z,w,h,d,parent);
  const panel=(title,sub,w,x,y,z,height=.70)=>standSign(T,room,title,sub,w,x,y,z,"#544033","#ffecd1",height);

  part(0xa7805e,0,-.10,0,24,.20,24);
  const floor=[0xac8768,0xb28c6b,0xb79271,0xa88362,0xc09b78,0xb99270];
  for(let row=0;row<36;row++){
    const z=(row+.5)*2/3-12;
    for(let strip=0;strip<6;strip++){
      part(floor[(row*5+strip*7)%floor.length],-10+strip*4,-.008,z,3.965,.020,.651);
    }
  }
  part(cream,0,4.99,0,24,.19,24);
  for(const [x,z,w,d] of diningWalls){
    part(0xe2cfab,x,2.46,z,w,4.90,d);
    part(heartwood,x,.133,z,w+.11,.27,d+.12);
    part(wood,x,4.74,z,w+.15,.24,d+.14);
  }
  for(const x of [-11.68,11.68]){
    for(const z of [-9.3,-3.2,3.2,9.3])part(heartwood,x,2.30,z,.22,4.58,.19);
    for(const z of [-2.8,6.3]){
      part(wood,x,2.5,z,.24,2.36,4.16);
      const side=Math.sign(x);
      part(paper,x-side*.133,2.52,z,.036,2.11,3.93);
      for(let i=-5;i<=5;i++)part(wood,x-side*.155,2.5,z+i*.33,.035,2.10,.041);
      for(const y of [1.64,2.11,2.90,3.34])part(wood,x-side*.156,y,z,.035,.037,3.96);
      part(wood,x-side*.07,1.29,z,.37,.11,4.27);
    }
  }
  for(const z of [-10.8,-5.4,0,5.4,10.8])part(wood,0,4.76,z,24,.23,.24);
  const exit=new T.Group();exit.position.set(0,0,11.839);exit.rotation.y=Math.PI;room.add(exit);
  staticGroups.push(exit);
  part(heartwood,0,1.55,0,2.97,3.08,.06,exit);
  for(const side of [-1,1]){
    part(0x9d7556,side*.69,1.52,.052,1.30,2.95,.046,exit);
    part(paper,side*.69,1.90,.084,1.08,1.89,.016,exit);
    for(let n=-2;n<=2;n++)part(wood,side*.69+n*.19,1.9,.100,.043,1.90,.018,exit);
    for(const y of [1.18,1.57,2.30,2.66])part(wood,side*.69,y,.101,1.09,.034,.024,exit);
    part(copper,side*.13,1.34,.12,.057,.19,.068,exit);
  }
  standSign(T,exit,"나가는 문","삼청로",1.79,0,3.54,.11,"#494335","#fae6bd",.47);
  part(0x825549,0,.016,10.2,3.28,.028,2.79);
  part(0xc3a172,0,.032,10.2,3.02,.029,2.54);
  part(0x91574b,0,.049,10.2,2.92,.029,2.45);
  yield;

  const counter=diningFurniture.counter;
  part(wood,counter.x,.52,counter.z,counter.w,1.04,counter.d);
  part(heartwood,0,1.06,counter.z,counter.w+.22,.14,counter.d+.16);
  part(0x936946,0,.55,counter.z+.60,counter.w-.39,.63,.082);
  for(let x=-4.15;x<4.24;x+=.32)part(heartwood,x,.55,counter.z+.652,.043,.61,.029);
  panel("북촌 작은 식탁","나물 비빔밥 · 버섯 국밥",5.16,0,3.67,-11.64,.86);
  const samples=makeDiningDishes(T,kit);
  for(const [name,x] of [["bibimbap",-1.23],["mushroomSoup",1.11]]){
    const dish=new T.Group();dish.position.set(x,1.249,counter.z-.045);dish.scale.setScalar(2.1);room.add(dish);
    samples[name](dish);staticGroups.push(dish);
  }
  for(const x of [-3.25,3.25]){
    const cabinet=diningFurniture.cupboard;
    part(wood,x,1.04,cabinet.z,1.6,2.10,cabinet.d);
    for(const y of [.74,1.23,1.79]){
      part(heartwood,x,y,cabinet.z+.37,1.61,.062,.17);
      for(const offset of [-.44,0,.44])cylinder((y>1?cream:teal),x+offset,y+.085,cabinet.z+.373,.138,.16,11,room,1.08);
    }
  }
  const sideboard=diningFurniture.sideboard;
  part(wood,sideboard.x,.58,sideboard.z,sideboard.w,1.16,sideboard.d);
  part(heartwood,sideboard.x,1.17,sideboard.z,sideboard.w+.105,.078,sideboard.d+.18);
  for(let i=0;i<5;i++){
    const z=sideboard.z+1.8-i*.90,color=i%2?0x6f7557:cream;
    cylinder(color,sideboard.x,1.37,z,.166,.40,13,room,1.34);
    cylinder(color,sideboard.x,1.579,z,.215,.028,13,room,.84);
    cylinder(heartwood,sideboard.x,1.602,z,.055,.027,11,room);
  }

  const guestbook=diningFurniture.guestbook;
  part(wood,guestbook.x,.45,guestbook.z,guestbook.w,.9,guestbook.d);
  part(heartwood,guestbook.x,.91,guestbook.z,guestbook.w+.16,.11,guestbook.d+.11);
  const book=new T.Group();book.position.set(guestbook.x,1.045,guestbook.z-.05);book.rotation.y=-.14;room.add(book);
  staticGroups.push(book);
  part(red,0,0,0,.68,.069,.45,book);
  for(const side of [-1,1]){
    const page=part(paper,side*.16,.047,0,.315,.026,.413,book);
    page.rotation.z=side*.065;
    for(let i=0;i<6;i++){
      const line=part(0x9d8366,side*.167,.063,.132-i*.047,.21,.004,.009,book);
      line.rotation.z=side*.065;
    }
  }
  part(0x4a4640,.46,-.067,-.07,.034,.030,.31,book).rotation.y=.32;
  const guestSign=new T.Group();guestSign.position.set(guestbook.x,2.14,11.835);guestSign.rotation.y=Math.PI;room.add(guestSign);
  standSign(T,guestSign,"방명록","한 줄을 남겨 보세요",2.04,0,0,.09,"#604639","#fde8c7",.58);
  yield;

  const glow=new T.MeshBasicMaterial({color:0xf9d8a1});
  const fixtures=new T.Group();room.add(fixtures);
  const shade=new T.CylinderGeometry(.185,.37,.38,10,1,true);
  const shadeMaterial=new T.MeshStandardMaterial({color:0x926d4b,roughness:.83,side:T.DoubleSide});
  const bulb=new T.SphereGeometry(.077,10,6);
  for(const {x,z,chairs} of diningTables){
    const {w,d}=tableSize;
    part(wood,x,.732,z,w,.145,d);
    part(0xaf8058,x,.812,z,w+.055,.044,d+.052);
    for(const a of [-1,1])for(const b of [-1,1])part(heartwood,x+a*.97,.36,z+b*.56,.108,.72,.108);
    part(teal,x,.838,z,.48,.01,d-.15);
    for(const side of [-1,1]){
      const settingX=x+side*.70;
      cylinder(0xdddbc2,settingX,.850,z,.137,.022,16,room,1.09);
      cylinder(0xa0a388,settingX,.863,z,.085,.006,15,room);
      for(const offset of [-.018,.018])part(heartwood,settingX,.845,z+side*.24+offset,.32,.015,.015);
      cylinder(teal,settingX-.13*side,.876,z-side*.23,.055,.087,10,room,1.16);
    }
    cylinder(0xa58059,x,.887,z,.083,.091,11,room,.88);
    cylinder(0xb08e65,x,.945,z,.08,.04,11,room,.91);

    for(const {x:chairX,z:chairZ,side} of chairs){
      const chair=new T.Group();chair.position.set(chairX,0,chairZ);chair.rotation.y=side===1?-Math.PI/2:Math.PI/2;room.add(chair);
      staticGroups.push(chair);
      const {w:chairW,d:chairD}=chairSize;
      part(heartwood,0,.421,0,chairW,.082,chairD,chair);
      part(side<0?teal:red,0,.474,.017,chairW-.034,.044,chairD-.062,chair);
      for(const i of [-1,1])for(const j of [-1,1]){
        part(wood,i*.21,j<0?.44:.21,j*.263,.066,j<0?.88:.42,.064,chair);
      }
      part(wood,0,.79,-.263,.51,.111,.075,chair);
      for(const i of [-1,0,1])part(wood,i*.126,.633,-.263,.04,.22,.053,chair);
    }

    cylinder(heartwood,x,4.08,z,.022,1.36,7,room);
    const lampshade=new T.Mesh(shade,shadeMaterial);lampshade.position.set(x,3.34,z);fixtures.add(lampshade);
    const lamp=new T.Mesh(bulb,glow);lamp.position.set(x,3.22,z);room.add(lamp);
    yield;
  }
  const light=new T.PointLight(0xffcc8a,29,29,1.65);
  light.position.set(0,4.3,-3.0);room.add(light);
  const foyerLight=new T.PointLight(0xffdcac,26,19,1.65);
  foyerLight.position.set(1.5,4.1,7.0);room.add(foyerLight);
  staticGroups.forEach(standBatcher(T));
  yield;
}
