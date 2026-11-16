import {bukchonTerrain} from "./bukchon-layout.js";
import {chairSize,diningFurniture,diningTables,diningVenue,diningWalls,tableSize} from "./dining-layout.js";
import {addDiningBell,buildDiningKitchen,buildDiningKiosk,makeDiningStaff} from "./dining-staff.js";
import {standBatcher,standSign} from "./regional-stands.js";

const wood=0x614336,heartwood=0x402e28,copper=0xc9955d,cream=0xe8d8b6;
const paper=0xf4e4bf,teal=0x4c6557,red=0x88473e;
const styles={
  bukchon:{front:paper,trim:wood,sign:"#4b362c",ink:"#ffeac8",wall:0xe2cfab,runner:teal},
  jeongdong:{front:0xb48570,trim:0x496353,sign:"#384e45",ink:"#f6e5cf",wall:0xe3d6c5,runner:0x66846e},
  gwanghwamun:{front:0xcbd1c7,trim:0x405455,sign:"#244a4b",ink:"#e4fff3",wall:0xdfe5d9,runner:0x5a8784},
  western:{front:0xd5be9e,trim:0x3d4a40,sign:"#32443a",ink:"#f8e5b8",wall:0xf1e5d1,runner:0x6b3338},
  japanese:{front:0xe4d8b9,trim:0x333951,sign:"#28344d",ink:"#eee7d7",wall:0xeae0c8,runner:0x4c5976},
  chinese:{front:0xdbccb0,trim:0x8a3029,sign:"#792c26",ink:"#ffe59b",wall:0xf1ddaf,runner:0xac3d32},
};

export function* buildDiningFacade(T,root,kit,venue=diningVenue,groundHeight=point=>bukchonTerrain(point.x,point.y)){
  const {wx,wz,box,cylinder}=kit;
  const {x,y,w,d,angle}=venue.plot,z=d/2,style=styles[venue.cuisine]??styles[venue.area];
  const group=new T.Group();group.name=venue.name;
  const frontFloor=groundHeight(venue.outsideDoor);
  group.position.set(wx(x),frontFloor,wz(y));group.rotation.y=angle;root.add(group);
  const part=(color,x0,h,z0,width,height,depth)=>box(color,x0,h,z0,width,height,depth,group);
  if(venue.service==="robot"||venue.cuisine==="western"){
    part(0x777e7c,0,-.45,0,w+.26,1.09,d+.22);
    part(style.front,0,1.70,-.10,w,3.36,d-.20);
    part(0x747f7d,0,.075,z+.30,w,.15,.85);
    part(style.trim,0,1.50,z,2.62,3,.14);
    part(0x648383,0,1.43,z+.085,2.15,2.60,.049);
    for(const a of [-1,1]){
      part(0x304646,a*.78,1.45,z+.119,.070,2.61,.035);
      part(0xc0c9c0,a*.19,1.29,z+.157,.045,.340,.069);
      part(style.trim,a*4.19,1.58,z+.029,4.24,2.61,.064);
      part(0x6d9590,a*4.19,1.58,z+.075,3.99,2.39,.026);
      part(0x4f7373,a*4.19,1.05,z+.091,3.98,.91,.019);
      part(0x394e50,a*4.19,1.59,z+.115,.055,2.39,.048);
      part(0xc6dfd3,a*4.19,2.52,z+.116,3.88,.026,.020);
      part(0x638b77,a*3.28,.75,z+.104,1.55,.069,.052);
    }
    part(style.front,0,3.34,z+.05,w,.69,.26);
    standSign(T,group,venue.name,venue.cuisine==="western"?"PASTA · SANDWICH":venue.cuisine==="japanese"?"うどん · カレー":"키오스크 주문",
      4.07,0,3.34,z+.191,style.sign,style.ink,.53);
    part(style.trim,0,3.13,z+.38,w+.15,.085,.56);
    part(0xe4eddd,0,3.073,z+.632,w-.22,.028,.03);
    part(0x697675,0,3.80,0,w+.49,.27,d+.45);
    if(venue.cuisine==="japanese")for(const x of [-.82,0,.82]){
      part(style.trim,x,2.59,z+.181,.75,.92,.041);
      part(0xe7dbc3,x,2.28,z+.204,.72,.045,.01);
    }
    if(venue.cuisine==="western")for(const side of [-1,1])for(let i=0;i<8;i++){
      const stripe=part(i%2?0xeadbc3:0x702f36,side*4.17+(i-3.5)*.51,2.89,z+.43,.51,.11,.85);
      stripe.rotation.x=.24;
    }
    yield;
    return;
  }
  part(0x999183,0,-.45,0,w+.24,1.1,d+.21);
  part(0xaaa18c,0,.023,z+.28,w,.07,.91);
  part(style.front,0,1.68,-.15,w,3.27,d-.30);
  part(heartwood,0,1.71,z,2.14,3.06,.22);
  part(0x54483a,0,1.25,z+.14,1.38,2.42,.038);
  part(copper,.44,1.15,z+.199,.047,.26,.077);
  part(wood,0,.12,z+.09,2.03,.15,.24);
  for(const px of [-6.4,-2.6,-1.1,1.1,2.6,6.4])part(style.trim,px,1.64,z+.14,.15,3.28,.24);
  for(const side of [-1,1]){
    const px=side*4.45;
    part(style.trim,px,1.50,z+.12,3.47,1.93,.11);
    part(0xdda874,px,1.53,z+.18,3.22,1.70,.028);
    for(let i=-4;i<=4;i++)part(style.trim,px+i*.354,1.53,z+.21,.042,1.70,.039);
    for(const h of [.89,1.58,2.16])part(style.trim,px,h,z+.21,3.24,.046,.034);
    part(style.trim,px,.61,z+.24,3.46,.105,.34);
    part(style.trim,side*2.15,.3,z+.22,.64,.11,.58);
    cylinder(red,side*2.15,.37,z+.22,.21,.45,11,group,1.22);
    for(let i=0;i<5;i++){
      const a=i*2.399,h=.12+(i%3)*.12;
      const leaf=box(i%2?teal:0x70845a,side*2.15+Math.sin(a)*.12,.62+h/2,z+.22+Math.cos(a)*.12,.10,h,.075,group);
      leaf.rotation.z=(i-2)*.3;
    }
  }
  part(heartwood,0,3.17,z+.12,w+.24,.24,.32);
  standSign(T,group,venue.name,venue.dishes[0].name,3.82,0,2.80,z+.20,style.sign,style.ink,.75);
  if(venue.area==="jeongdong"){
    for(let row=0;row<10;row++){
      const h=.20+row*.28;
      for(const px of [-6.52,6.52])part(row%2?0xc49b84:0x90685b,px,h,z+.022,.30,.18,.035);
    }
  }
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
  if(venue.cuisine==="chinese")for(const side of [-1,1]){
    const lantern=cylinder(0xb73e30,side*2.12,2.69,z+.52,.24,.48,10,group,1.12);lantern.scale.z*=1.15;
    for(const h of [2.92,2.44])cylinder(0xddad57,side*2.12,h,z+.52,.23,.039,10,group);
    part(0xe7be65,side*2.12,2.325,z+.52,.028,.19,.028);
  }
  yield;
}

export function* buildDiningInterior(T,root,kit,venue,walkerModels){
  const {wx,wz,box,cylinder}=kit;
  const room=new T.Group(),{center,cuisine}=venue,style=styles[cuisine]??styles[venue.area];
  const modern=venue.service==="robot",western=cuisine==="western",japanese=cuisine==="japanese",chinese=cuisine==="chinese";
  const frame=western||japanese||chinese?style.trim:modern?0x4e6968:heartwood;
  room.name=venue.name;room.position.set(wx(center.x),0,wz(center.y));root.add(room);
  const staticGroups=[room];
  const part=(color,x,y,z,w,h,d,parent=room)=>box(color,x,y,z,w,h,d,parent);
  const panel=(title,sub,w,x,y,z,height=.70)=>standSign(T,room,title,sub,w,x,y,z,style.sign,style.ink,height);

  part(modern?0x849390:0xa7805e,0,-.105,0,24,.20,24);
  const floor=modern?[0xa2aca5,0xaab3ac,0x9ba7a2,0xa5aea6,0xaeb7ae,0xa0ada7]:
    [0xac8768,0xb28c6b,0xb79271,0xa88362,0xc09b78,0xb99270];
  if(modern||western){
    for(let row=0;row<12;row++)for(let strip=0;strip<12;strip++){
      const tile=western?(row+strip)%2?0x41534a:0xe8e3d3:floor[(row*5+strip*7)%floor.length];
      part(tile,-11+strip*2,-.008,-11+row*2,1.98,.020,1.98);
    }
  }else{
    for(let row=0;row<36;row++){
      const z=(row+.5)*2/3-12;
      for(let strip=0;strip<6;strip++){
        part(floor[(row*5+strip*7)%floor.length],-10+strip*4,-.008,z,3.965,.020,.651);
      }
    }
  }
  if(western||chinese||japanese){
    for(const side of [-1,1])for(const z of [-6.8,0,8.9]){
      part(frame,side*11.79,1.18,z,.20,1.99,japanese?4.0:3.25);
      if(chinese)for(const dy of [-.52,.23,.86])part(0xc2975a,side*11.66,1.17+dy,z,.05,.043,2.92);
      if(western)for(const dz of [-1.18,0,1.18])part(0xbc9a63,side*11.665,1.18,z+dz,.035,1.68,.028);
      if(japanese)for(const dz of [-1.24,0,1.24])part(0xd7c299,side*11.665,1.37,z+dz,.05,1.33,.91);
    }
    if(chinese)for(const side of [-1,1])for(const z of [-5.2,5.2]){
      cylinder(0xb73e30,side*8.9,3.94,z,.36,.74,12,room,1.13);
      for(const y of [3.58,4.31])cylinder(0xd8ab56,side*8.9,y,z,.34,.05,12,room);
      part(0xe7be65,side*8.9,3.49,z,.035,.18,.035);
    }
    if(western)for(const z of [-6.4,.2,6.8])for(const side of [-1,1]){
      part(0xc8a66d,side*11.52,2.85,z,.14,1.12,.83);
      part(0x879488,side*11.435,2.87,z,.035,.85,.62);
    }
  }
  part(modern?0xdfe8dc:cream,0,4.99,0,24,.19,24);
  for(const [x,z,w,d] of diningWalls){
    part(style.wall,x,2.46,z,w,4.90,d);
    part(frame,x,.133,z,w+.11,.27,d+.12);
    part(modern?0xa7b4a9:wood,x,4.74,z,w+.15,.24,d+.14);
  }
  for(const x of [-11.68,11.68]){
    for(const z of [-9.3,-3.2,3.2,9.3])part(frame,x,2.30,z,.22,4.58,.19);
    for(const z of [-2.8,6.3]){
      const side=Math.sign(x);
      part(modern?frame:wood,x,2.5,z,.24,2.36,4.16);
      part(modern?0x8fada9:paper,x-side*.133,2.52,z,.036,2.11,3.93);
      const spacing=modern?.95:.33;
      for(let i=modern?-1:-5;i<=(modern?1:5);i++)part(modern?frame:wood,x-side*.155,2.5,z+i*spacing,.035,2.10,.041);
      for(const y of modern?[1.64,3.34]:[1.64,2.11,2.90,3.34])part(modern?frame:wood,x-side*.156,y,z,.035,.037,3.96);
      part(modern?frame:wood,x-side*.07,1.29,z,.37,.11,4.27);
    }
  }
  for(const z of [-10.8,-5.4,0,5.4,10.8])part(modern?0xb6c6bd:wood,0,4.76,z,24,.23,.24);
  const exit=new T.Group();exit.position.set(0,0,11.839);exit.rotation.y=Math.PI;room.add(exit);
  staticGroups.push(exit);
  part(frame,0,1.55,0,2.97,3.08,.06,exit);
  for(const side of [-1,1]){
    part(modern?0x637f7b:0x9d7556,side*.69,1.52,.052,1.30,2.95,.046,exit);
    part(modern?0x9eb9b0:paper,side*.69,1.90,.084,1.08,1.89,.016,exit);
    if(!modern){
      for(let n=-2;n<=2;n++)part(wood,side*.69+n*.19,1.9,.100,.043,1.90,.018,exit);
      for(const y of [1.18,1.57,2.30,2.66])part(wood,side*.69,y,.101,1.09,.034,.024,exit);
    }
    part(copper,side*.13,1.34,.12,.057,.19,.068,exit);
  }
  standSign(T,exit,"나가는 문",venue.street,1.99,0,3.54,.11,"#494335","#fae6bd",.47);
  part(modern?0x4f7673:0x825549,0,.016,10.2,3.28,.028,2.79);
  part(modern?0xadc8b6:0xc3a172,0,.032,10.2,3.02,.029,2.54);
  part(modern?0x699389:0x91574b,0,.049,10.2,2.92,.029,2.45);
  if(modern&&venue.kioskPoint)staticGroups.push(buildDiningKiosk(T,room,kit,venue));
  yield;

  const counter=diningFurniture.counter;
  const counterBody=counter.h-.13;
  part(modern?0x758d86:wood,counter.x,counterBody/2,counter.z,counter.w,counterBody,counter.d);
  part(modern?0xc0cbc1:heartwood,0,counter.h-.07,counter.z,counter.w+.22,.14,counter.d+.16);
  part(modern?0xa2b1a6:0x936946,0,.46,counter.z+.60,counter.w-.39,.53,.082);
  for(let x=-4.15;x<4.24;x+=modern?1.06:.32)part(frame,x,.46,counter.z+.652,.043,.51,.029);
  panel(venue.name,venue.dishes.map(dish=>dish.name).join(" · "),5.16,0,3.67,-11.64,.86);
  staticGroups.push(buildDiningKitchen(T,room,kit,venue));
  for(const cabinet of [diningFurniture.cupboardLeft,diningFurniture.cupboardRight]){
    const {x,z,w,d}=cabinet;
    part(wood,x,1.04,z,w,2.10,d-.16);
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

  const glow=new T.MeshBasicMaterial({color:modern?0xf5fff4:0xf9d8a1});
  const fixtures=new T.Group();room.add(fixtures);
  const shade=new T.CylinderGeometry(.185,.37,.38,10,1,true);
  const shadeMaterial=new T.MeshStandardMaterial({color:0x926d4b,roughness:.83,side:T.DoubleSide});
  const bulb=new T.SphereGeometry(.077,10,6);
  for(const {x,z,chairs} of diningTables){
    const {w,d}=tableSize;
    part(modern?0xc2ab8b:wood,x,.732,z,w,.145,d);
    part(modern?0xd2bd9d:0xaf8058,x,.812,z,w+.055,.044,d+.052);
    for(const a of [-1,1])for(const b of [-1,1])part(frame,x+a*.97,.36,z+b*.56,.108,.72,.108);
    part(style.runner,x,.838,z,.48,.01,d-.15);
    if(!modern)addDiningBell(T,room,kit,x,z);

    for(const {x:chairX,z:chairZ,side} of chairs){
      const chair=new T.Group();chair.position.set(chairX,0,chairZ);chair.rotation.y=side===1?-Math.PI/2:Math.PI/2;room.add(chair);
      staticGroups.push(chair);
      const {w:chairW,d:chairD}=chairSize;
      part(frame,0,.421,0,chairW,.082,chairD,chair);
      part(modern?style.runner:side<0?style.runner:red,0,.474,.017,chairW-.034,.044,chairD-.062,chair);
      for(const i of [-1,1])for(const j of [-1,1]){
        part(modern?frame:wood,i*.21,j<0?.44:.21,j*.263,.066,j<0?.88:.42,.064,chair);
      }
      part(modern?style.runner:wood,0,.79,-.263,.51,modern?.27:.111,.075,chair);
      if(!modern)for(const i of [-1,0,1])part(wood,i*.126,.633,-.263,.04,.22,.053,chair);
    }

    if(modern){
      part(0x6c8381,x,4.68,z,2.38,.16,.30);
      const strip=new T.Mesh(new T.BoxGeometry(2.29,.035,.23),glow);strip.position.set(x,4.59,z);room.add(strip);
    }else{
      cylinder(heartwood,x,4.08,z,.022,1.36,7,room);
      const lampshade=new T.Mesh(shade,shadeMaterial);lampshade.position.set(x,3.34,z);fixtures.add(lampshade);
      const lamp=new T.Mesh(bulb,glow);lamp.position.set(x,3.22,z);room.add(lamp);
    }
    yield;
  }
  const light=new T.PointLight(modern?0xe2fff2:0xffcc8a,29,29,1.65);
  light.position.set(0,4.3,-3.0);room.add(light);
  const foyerLight=new T.PointLight(modern?0xebfff0:0xffdcac,26,19,1.65);
  foyerLight.position.set(1.5,4.1,7.0);room.add(foyerLight);
  staticGroups.forEach(standBatcher(T));
  const staff=makeDiningStaff(T,room,kit,venue,walkerModels);
  yield;
  return {update(clock,_lightMode,tickets){staff.update(clock,tickets);}};
}
