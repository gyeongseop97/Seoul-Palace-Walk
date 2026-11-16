import {makeDiningDishes} from "./dining-dishes.js";
import {standSign} from "./regional-stands.js";

const kitchen={x:0,z:-8};
const walkingSpeed=4.3;
const localTableSide=2.75;
const aisleOffset=1.06;
const travelPhases=new Set(["summoned","serving","served","clearing","returning"]);
const servingPhases=new Set(["serving","returning"]);
const clamp=value=>Math.max(0,Math.min(1,value));
const mix=(a,b,t)=>a+(b-a)*t;
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

function tableRoute(table,venue){
  const x=table.x-venue.center.x,z=table.y-venue.center.y;
  return {x:x+table.side*localTableSide,z:z+aisleOffset,
    face:Math.atan2(table.side*(1.46-localTableSide),-aisleOffset)};
}

function walkPose(table,progress,back){
  // Follow the aisle and approach the table across its unobstructed short side.
  const aisle=table.z-kitchen.z,cross=Math.abs(table.x),length=aisle+cross;
  const distance=(back?1-progress:progress)*length;
  const x=Math.sign(table.x)*Math.max(0,distance-aisle),z=kitchen.z+Math.min(distance,aisle);
  const turn=clamp((distance-aisle+.26)/.52);
  const across=Math.sign(table.x)*Math.PI/2;
  let face=mix(0,across,turn);
  if(back)face+=Math.PI;
  else face+=angleDelta(face,table.face)*clamp((progress-.90)*10);
  return {x,z,face,walking:progress<.998,travel:progress*length};
}

export function diningStaffPose(venue,ticket,clock){
  const robot=venue.service==="robot";
  const idle={...kitchen,face:robot?0:Math.PI,walking:false,travel:0,cooking:false,writing:false,carrying:false};
  if(!ticket?.table)return idle;
  const {phase,phaseAt,phaseUntil}=ticket;
  const table=tableRoute(ticket.table,venue);
  const standing={...idle,x:table.x,z:table.z,face:table.face};
  if(phase==="ordering")return {...standing,writing:true};
  if(phase==="cooking"){
    const time=clock-phaseAt;
    const travel=1000*(table.z-kitchen.z+Math.abs(table.x))/walkingSpeed;
    if(!robot&&time<travel)return {...idle,...walkPose(table,clamp(time/travel),true)};
    const approachingStove=clamp((time-travel)/320)*clamp((phaseUntil-clock)/320);
    return {...idle,z:robot?kitchen.z:kitchen.z-.55*approachingStove,cooking:true};
  }
  if(!travelPhases.has(phase)||!phaseUntil)return idle;
  const back=phase==="served"||phase==="returning";
  const progress=clamp((clock-phaseAt)/Math.max(1,phaseUntil-phaseAt));
  return {...idle,...walkPose(table,progress,back),carrying:servingPhases.has(phase)};
}

export function buildDiningKiosk(T,room,kit,venue){
  const {box,cylinder}=kit,{center,kioskPoint}=venue;
  const kiosk=new T.Group();kiosk.name="키오스크";
  kiosk.position.set(kioskPoint.x-center.x,0,kioskPoint.y-center.y+1.70);
  kiosk.rotation.y=Math.PI;room.add(kiosk);
  const shape=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,kiosk);
  shape(0x485256,0,.064,0,.68,.128,.47);
  shape(0x6e7d81,0,.72,0,.25,1.3,.24);
  shape(0xd9dedd,0,1.45,0,.77,.90,.19);
  shape(0x1c292e,0,1.51,.10,.67,.69,.021);
  standSign(T,kiosk,"키오스크","메뉴 고르기",.59,0,1.52,.116,"#1e4c50","#e5fff8",.57);
  shape(0x4e6e72,0,1.067,.113,.21,.082,.065);
  cylinder(0x76b6ab,.29,1.05,.115,.026,.017,12,kiosk).rotation.x=Math.PI/2;
  return kiosk;
}

export function addDiningBell(T,room,kit,x,z){
  const {cylinder,shape}=kit;
  cylinder(0x412f26,x,.849,z,.107,.026,16,room,1.03);
  cylinder(0xd8ad60,x,.870,z,.100,.023,20,room,.99);
  shape(new T.SphereGeometry(.094,18,10,0,2*Math.PI,0,Math.PI/2),0xe4b76a,x,.883,z,room);
  cylinder(0x684932,x,.970,z,.017,.024,12,room);
  cylinder(0xe4be79,x,.989,z,.038,.021,16,room,.86);
}

export function buildDiningKitchen(T,room,kit,venue){
  const {box,cylinder}=kit;
  const modern=venue.service==="robot";
  const stove=new T.Group();stove.name="조리대";room.add(stove);
  const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,stove);
  block(modern?0x808d8d:0x665e51,0,1.134,-9.25,2.62,.036,1.04);
  for(const [x,z] of [[.23,-9.04],[-.68,-9.36]]){
    cylinder(0x252526,x,1.157,z,.279,.041,24,stove,1);
    cylinder(0x555453,x,1.181,z,.226,.014,24,stove,1);
    cylinder(0x625e58,x,1.196,z+.37,.046,.022,11,stove,.87);
  }
  const pot=modern?0x596268:0x85623d;
  cylinder(pot,.23,1.314,-9.04,.226,.244,20,stove,1.10);
  cylinder(0xcec6b3,.23,1.446,-9.04,.240,.025,24,stove,1.02);
  for(const side of [-1,1])block(0x342e26,.23+side*.274,1.363,-9.04,.121,.036,.095);
  cylinder(0x4d4a41,.23,1.477,-9.04,.042,.052,12,stove);
  block(0xa68c70,1.55,1.146,-9.27,.60,.048,.45);
  block(0x736f65,1.56,1.194,-9.27,.42,.024,.088).rotation.y=.27;
  block(0x514339,1.78,1.200,-9.33,.19,.028,.058).rotation.y=.28;
  if(modern){
    block(0x39464a,.52,.075,-7.22,1.20,.15,.74);
    block(0x69c4b7,.52,.149,-6.86,1.04,.012,.026);
  }
  return stove;
}

function makeHuman(T,root,kit,venue){
  const {box,cylinder,shape}=kit;
  const group=new T.Group();group.name=venue.area==="jeongdong"?"정동 메밀집 주인":"북촌 작은 식탁 직원";root.add(group);
  const sphere=new T.SphereGeometry(1,15,11);
  const skin=venue.area==="jeongdong"?0xca8b65:0xe0ae85;
  const sweater=venue.area==="jeongdong"?0x60766a:0x84684c;
  const apron=venue.area==="jeongdong"?0x2d504c:0x554e5a;
  const hair=venue.area==="jeongdong"?0x5a5653:0x383331;
  function ellipsoid(color,x,y,z,a,b,c,parent=group){
    const part=shape(sphere,color,x,y,z,parent);part.scale.set(a,b,c);return part;
  }
  const body=new T.Group();group.add(body);
  ellipsoid(sweater,0,.956,0,.233,.277,.137,body);
  ellipsoid(0x3f4142,0,.723,0,.169,.185,.105,body);
  box(apron,0,.889,.133,.313,.405,.036,body);
  box(apron,0,.665,.123,.361,.250,.041,body).rotation.x=-.12;
  box(0xc2b4a3,0,.789,.160,.161,.096,.021,body);
  for(const side of [-1,1])box(apron,side*.103,1.114,.097,.035,.203,.029,body).rotation.x=.45;
  cylinder(skin,0,1.209,0,.056,.116,12,body);
  const head=new T.Group();head.position.y=1.406;body.add(head);
  ellipsoid(skin,0,0,0,.153,.187,.132,head);
  ellipsoid(hair,0,.105,-.027,.158,.110,.144,head);
  ellipsoid(hair,0,.007,-.094,.151,.149,.073,head);
  ellipsoid(skin,0,-.019,.132,.031,.031,.029,head);
  const cap=ellipsoid(0xdcd6c5,0,.181,-.006,.151,.047,.143,head);
  cap.rotation.z=.04;
  ellipsoid(0xe6e2cb,0,.147,.040,.164,.035,.148,head);
  for(const side of [-1,1]){
    ellipsoid(skin,side*.148,-.025,.013,.031,.047,.024,head);
    ellipsoid(0x392c29,side*.052,.007,.124,.012,.014,.009,head);
    box(hair,side*.054,.037,.117,.044,.009,.012,head).rotation.z=side*.12;
  }
  ellipsoid(0x945d50,0,-.078,.112,.037,.009,.009,head);

  const arms=[],legs=[];
  for(const side of [-1,1]){
    const shoulder=new T.Group(),elbow=new T.Group();
    shoulder.position.set(side*.225,1.119,0);elbow.position.y=-.224;
    body.add(shoulder);shoulder.add(elbow);
    ellipsoid(sweater,0,-.11,0,.078,.151,.075,shoulder);
    ellipsoid(sweater,0,-.096,0,.058,.127,.059,elbow);
    cylinder(0xc5b5a1,0,-.183,0,.056,.039,12,elbow,.98);
    ellipsoid(skin,0,-.230,.006,.052,.061,.044,elbow);
    arms.push({shoulder,elbow,side});

    const leg=new T.Group();leg.position.set(side*.093,.670,0);body.add(leg);
    ellipsoid(0x404445,0,-.257,0,.087,.307,.079,leg);
    ellipsoid(0x322b29,0,-.584,.044,.089,.081,.122,leg);
    legs.push({leg,side});
  }
  const notice=new T.Group();notice.position.set(-.144,.960,.351);body.add(notice);
  box(0x67503b,0,0,0,.203,.015,.257,notice);
  box(0xf1dfb8,0,.010,0,.161,.007,.213,notice);
  for(const z of [-.064,-.026,.017])box(0x9f8f72,0,.015,z,.108,.002,.005,notice);
  const spoon=new T.Group();spoon.position.set(-.200,.941,.459);body.add(spoon);
  cylinder(0xa08159,0,0,0,.016,.279,12,spoon).rotation.x=Math.PI/2;
  ellipsoid(0x863e27,0,0,.146,.047,.016,.080,spoon);

  const tray=new T.Group();tray.position.set(0,.866,.387);body.add(tray);
  function pose(state,time){
    const stride=state.walking?Math.sin(state.travel*6.85):0;
    body.position.y=state.walking?Math.abs(stride)*.024:Math.sin(time*2)*.005;
    head.rotation.x=state.writing?.16+Math.sin(time*3)*.051:state.cooking?.13:0;
    for(const {leg,side} of legs)leg.rotation.x=stride*side*.41;
    for(const {shoulder,elbow,side} of arms){
      const pressing=state.cooking&&side===-1;
      shoulder.rotation.x=state.carrying?-.68:state.writing?-.93:pressing?-.77+Math.sin(time*5.4)*.20:stride*side*-.48;
      shoulder.rotation.z=state.carrying?side*.16:state.writing?side*.27:side*.043;
      elbow.rotation.x=state.carrying?-.65:state.writing?-.94:pressing?-.63:-.13;
    }
    notice.visible=state.writing;notice.rotation.x=-.17;
    spoon.visible=state.cooking;spoon.rotation.z=Math.sin(time*5.4)*.15;
    spoon.rotation.y=Math.cos(time*5.4)*.24;
  }
  return {group,tray,pose};
}

function makeRobot(T,root,kit){
  const {box,cylinder,shape}=kit;
  const group=new T.Group();group.name="서빙 로봇";root.add(group);
  const span=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,group);
  const body=new T.LatheGeometry([[0,.07],[.291,.07],[.363,.125],[.380,.225],[.348,.331],[0,.341]]
    .map(p=>new T.Vector2(...p)),24);
  shape(body,0xdeece8,0,0,0,group);
  cylinder(0x393f43,0,.084,0,.296,.071,24,group,1);
  cylinder(0x54736f,0,.189,0,.368,.037,24,group,1.02);
  cylinder(0x78cabe,0,.217,0,.373,.014,24,group,1.01);
  const wheels=[];
  for(const side of [-1,1]){
    const wheel=new T.Group();wheel.position.set(side*.287,.125,0);group.add(wheel);wheels.push(wheel);
    cylinder(0x292f31,0,0,0,.119,.083,16,wheel).rotation.z=Math.PI/2;
    cylinder(0x747d7b,side*.049,0,0,.067,.009,16,wheel).rotation.z=Math.PI/2;
    box(0x5c9b91,side*.055,0,0,.014,.110,.024,wheel);
    span(0xdbe5e2,side*.251,.669,-.164,.084,.645,.102);
  }
  for(const y of [.446,.746]){
    span(0x657a79,0,y,0,.625,.057,.499);
    span(0xe8ede6,0,y+.039,0,.597,.028,.478);
    for(const side of [-1,1])span(0xb3d6cd,side*.289,y+.065,0,.027,.055,.477);
  }
  span(0xcbdedb,0,1.023,-.166,.125,.575,.104);
  span(0xe2efed,0,1.314,-.095,.503,.280,.235).rotation.x=-.15;
  span(0x273f44,0,1.327,.025,.429,.213,.028).rotation.x=-.15;
  const face=new T.MeshBasicMaterial({color:0x97e5d3,toneMapped:false});
  const eyes=[];
  for(const side of [-1,1]){
    const eye=new T.Mesh(new T.SphereGeometry(.032,10,7),face);
    eye.position.set(side*.103,1.343,.048);eye.scale.set(1,1.15,.20);group.add(eye);eyes.push(eye);
  }
  cylinder(0x82bcb0,.19,1.474,-.105,.025,.056,12,group,.72);
  const tray=new T.Group();tray.position.set(0,.825,.005);group.add(tray);
  function pose(state,time){
    for(const wheel of wheels)wheel.rotation.x=-state.travel/.117;
    const blink=Math.max(.16,Math.min(1,Math.abs((time+.38)%4.1-2.05)*15));
    for(const eye of eyes)eye.scale.y=blink*1.15;
    face.color.setHex(state.carrying?0x97e5d3:0x75c4bf);
  }
  return {group,tray,pose};
}

export function makeDiningStaff(T,room,kit,venue){
  const actor=venue.service==="robot"?makeRobot(T,room,kit):makeHuman(T,room,kit,venue);
  const dishes=makeDiningDishes(T,kit);
  const servings=new Map();
  let servingKind=null;
  const steamGeometry=new T.SphereGeometry(1,7,5);
  const steam=Array.from({length:6},()=>{
    const puff=new T.Mesh(steamGeometry,new T.MeshBasicMaterial({color:0xe8d9b8,transparent:true,depthWrite:false}));
    puff.visible=false;room.add(puff);return puff;
  });
  function showDish(ticket,state){
    const kind=state.carrying?ticket.kind:null;
    if(kind!==servingKind){
      const previous=servings.get(servingKind);if(previous)previous.group.visible=false;
      servingKind=kind;
    }
    if(!dishes[kind])return;
    if(!servings.has(kind)){
      const group=new T.Group();actor.tray.add(group);
      servings.set(kind,{group,...dishes[kind](group)});
    }
    const dish=servings.get(kind);dish.group.visible=true;
    dish.update?.(-1,ticket.phase==="returning"?0:undefined);
  }
  function update(clock,tickets=[]){
    const ticket=tickets.find(entry=>entry.venue===venue.id&&entry.table&&
      entry.phase!=="queued"&&entry.phase!=="clearQueued"&&
      (entry.phase!=="served"||Number.isFinite(entry.phaseUntil)&&clock<entry.phaseUntil));
    const state=diningStaffPose(venue,ticket,clock),time=clock/1000;
    actor.group.position.set(state.x,0,state.z);actor.group.rotation.y=state.face;
    actor.pose(state,time);showDish(ticket,state);
    steam.forEach((puff,index)=>{
      puff.visible=state.cooking;
      if(!state.cooking)return;
      const rise=(time*.66+index/steam.length)%1;
      puff.position.set(.23+Math.sin(time*2.1+index)*rise*.14,1.47+rise*.58,-9.04+Math.cos(time*1.5+index)*rise*.14);
      puff.scale.setScalar(.042+rise*.082);puff.material.opacity=.23*(1-rise);
    });
  }
  return {update};
}
