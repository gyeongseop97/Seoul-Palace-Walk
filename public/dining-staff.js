import {makeDiningDishes} from "./dining-dishes.js";
import {DINING_SERVICE_SPEED,diningCounter,diningRobotDock,diningServiceRoute,diningStaffStation} from "./dining-data.js";
import {standSign} from "./regional-stands.js";

const travelPhases=new Set(["summoned","serving","served","clearing","returning"]);
const servingPhases=new Set(["serving","returning"]);
const clamp=value=>Math.max(0,Math.min(1,value));
const mix=(a,b,t)=>a+(b-a)*t;
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const idleStaff={...diningStaffStation,face:0,walking:false,travel:0,cooking:false,writing:false,carrying:false};
const stoveZ=-9.70;
const stoveLift=diningCounter.h-1.13;
const burner={x:-.39,z:-.21};

function atDistance({segments},distance){
  for(const {from,to,length} of segments){
    if(length>0&&distance<length){
      const t=Math.max(0,distance/length);
      return {x:mix(from.x,to.x,t),z:mix(from.z,to.z,t)};
    }
    distance-=length;
  }
  return segments.at(-1).to;
}

function walkPose(route,progress,back){
  const {length}=route;
  const distance=(back?1-progress:progress)*length;
  const before=atDistance(route,distance-.38),after=atDistance(route,distance+.38);
  let face=Math.atan2(after.x-before.x,after.z-before.z);
  if(back)face+=Math.PI;
  face+=angleDelta(face,back?0:route.face)*clamp(1-(1-progress)*length/.7);
  return {...atDistance(route,distance),face,walking:progress<.998,travel:progress*length};
}

function cookingPose(clock,ready,finished){
  const lean=clamp((clock-ready)/320)*clamp((finished-clock)/320);
  return {...idleStaff,z:idleStaff.z+.30*lean,cooking:true};
}

export function diningStaffPose(venue,ticket,clock){
  const robot=venue.service==="robot";
  const idle=robot?{...idleStaff,...diningRobotDock}:idleStaff;
  if(!ticket?.table)return idle;
  const {phase,phaseAt,phaseUntil}=ticket;
  const route=diningServiceRoute(ticket.table,venue);
  if(phase==="ordering")return {...idle,...route.segments.at(-1).to,face:route.face,writing:true};
  if(phase==="cooking"){
    if(robot)return {...idle,cooking:true};
    const travel=1000*route.length/DINING_SERVICE_SPEED;
    const time=clock-phaseAt;
    if(time<travel)return {...idle,...walkPose(route,clamp(time/travel),true)};
    return cookingPose(clock,phaseAt+travel,phaseUntil);
  }
  if(!travelPhases.has(phase)||!phaseUntil)return idle;
  const back=phase==="served"||phase==="returning";
  const progress=clamp((clock-phaseAt)/Math.max(1,phaseUntil-phaseAt));
  return {...idle,...walkPose(route,progress,back),carrying:servingPhases.has(phase)};
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
  stove.position.set(diningStaffStation.x,stoveLift,stoveZ);
  const block=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,stove);
  const round=(color,x,y,z,r,h,sides,top)=>cylinder(color,x,y,z,r,h,sides,stove,top);
  block(modern?0x808d8d:0x665e51,0,1.134,0,2.62,.036,1.04);
  for(const {x,z} of [burner,{x:.58,z:.11}]){
    round(0x252526,x,1.157,z,.279,.041,24,1);
    round(0x555453,x,1.181,z,.226,.014,24,1);
    round(0x625e58,x,1.196,z+.37,.046,.022,11,.87);
  }
  const pot=modern?0x596268:0x85623d;
  round(pot,burner.x,1.314,burner.z,.226,.244,20,1.10);
  round(0xcec6b3,burner.x,1.446,burner.z,.240,.025,24,1.02);
  for(const side of [-1,1])block(0x342e26,burner.x+side*.274,1.363,burner.z,.121,.036,.095);
  round(0x4d4a41,burner.x,1.477,burner.z,.042,.052,12);
  block(0xa68c70,1.55,1.146,.02,.60,.048,.45);
  block(0x736f65,1.56,1.194,.02,.42,.024,.088).rotation.y=-.27;
  block(0x514339,1.78,1.200,.08,.19,.028,.058).rotation.y=-.28;
  if(modern){
    box(0x39464a,diningRobotDock.x,.022,diningRobotDock.z,1.20,.044,.74,room);
    box(0x69c4b7,diningRobotDock.x,.047,diningRobotDock.z+.36,1.04,.012,.026,room);
  }
  return stove;
}

const uniforms={
  "coast-tavern":{character:"woman",hair:"bob",eyes:"soft",outfit:"tee",shirt:0xeadac2,apron:0x375f64,hat:0xdfcaaa},
  "station-foodhall":{character:"woman",hair:"bob",eyes:"soft",outfit:"tee",shirt:0xd4e1de,apron:0x385565,hat:0xe9dcc8},
  "bukchon-dining":{character:"woman",hair:"bob",eyes:"soft",outfit:"tee",shirt:0xc1a988,apron:0x425a4d,hat:0xefdec1},
  "jeongdong-dining":{character:"man",hair:"short",eyes:"round",outfit:"tee",shirt:0x687c6b,apron:0x2b504a,hat:0xe1d6c3},
  "plaza-dining":{character:"woman",hair:"bob",eyes:"round",outfit:"tee",shirt:0xd3e1da,apron:0x296368,hat:0x4a777a},
  "jeongdong-bistro":{character:"woman",hair:"long",eyes:"bright",outfit:"tee",shirt:0xe8d9bf,apron:0x3c1722,hat:0xf6e7d0},
  "plaza-japanese":{character:"man",hair:"short",eyes:"soft",outfit:"tee",shirt:0x4f617c,apron:0x283950,hat:0xf2e9cf},
  "bukchon-chinese":{character:"man",hair:"short",eyes:"bright",outfit:"tee",shirt:0xb65e48,apron:0x6a2929,hat:0x742d2a},
};

function addUniform(T,kit,model,uniform,venue){
  const {box,cylinder,shape}=kit;
  const {apron,hat}=uniform,{garb,headwear:face}=model;
  const outline=new T.Shape([[-.125,.32],[.125,.32],[.184,.055],[.194,-.148],
    [.154,-.183],[-.154,-.183],[-.194,-.148],[-.184,.055]].map(([x,y])=>new T.Vector2(x,y)));
  const fabric=new T.ExtrudeGeometry(outline,{depth:.016,bevelSize:.014,bevelThickness:.008,bevelSegments:2});
  const bib=shape(fabric,apron,0,0,.196,garb);bib.name="앞치마";
  box(apron,0,.055,-.004,.460,.061,.358,garb);
  for(const side of [-1,1]){
    const strap=box(apron,side*.107,.374,.140,.034,.148,.029,garb);
    strap.rotation.set(-.59,0,side*.10);
  }
  box(apron,.066,-.067,.223,.142,.094,.016,garb);
  box(hat,.066,-.027,.233,.148,.013,.010,garb);
  box(0xe6c279,-.061,.244,.226,.090,.041,.012,garb).name="명찰";
  if(venue.cuisine==="western"){
    cylinder(0xf2e5cc,0,.391,.013,.290,.102,21,face,.91).scale.z*=.97;
    const crown=shape(new T.SphereGeometry(1,18,12),hat,0,.508,.013,face);
    crown.scale.set(.300,.146,.276);crown.name="조리모";
  }else if(venue.cuisine==="japanese"||(venue.cuisine==="korean"&&venue.service==="staff")){
    const profile=[[.372,.190],[.382,.201],[.384,.233],[.376,.266],[.363,.278]];
    const band=shape(new T.LatheGeometry(profile.map(([radius,y])=>new T.Vector2(radius,y)),36),hat,0,0,.001,face);
    band.scale.z=.99;band.name="두건";
    for(const side of [-1,1])box(hat,side*.06,.165,-.357,.059,.16,.032,face).rotation.z=side*.35;
  }else{
    const cap=shape(new T.SphereGeometry(1,21,12,0,Math.PI*2,0,Math.PI/2),hat,0,.252,0,face);
    cap.scale.set(.350,.201,.318);cap.name="근무 모자";
    const visor=shape(new T.SphereGeometry(1,18,10),hat,0,.249,.270,face);
    visor.scale.set(.267,.028,.219);
  }
}

export function makeDiningHuman(T,room,kit,venue,walkerModels,staffIndex){
  const {box,cylinder,shape}=kit;
  const uniform=uniforms[venue.id];
  const model=walkerModels.create(uniform.shirt,null,null,staffIndex==null?venue.id:venue.id+"-"+staffIndex);
  model.group.name=venue.name+" 직원";
  room.add(model.group);
  addUniform(T,kit,model,uniform,venue);
  const [left,right]=model.arms;
  let serviceTray=null;
  if(venue.id==="coast-tavern"){
    serviceTray=new T.Group();serviceTray.position.set(0,.92,.44);model.group.add(serviceTray);
    box(0x77503a,0,0,0,.53,.036,.37,serviceTray);
    cylinder(0xe8dac1,-.092,.032,.02,.111,.026,12,serviceTray);
    for(let i=0;i<3;i++)box(0xe3a183,-.15+i*.052,.058,0,.04,.039,.084,serviceTray);
    cylinder(0x3f7651,.135,.104,-.018,.039,.18,12,serviceTray);
    cylinder(0x407554,.135,.216,-.018,.020,.06,12,serviceTray);
  }
  const notice=new T.Group();notice.position.set(.06,-.035,.091);left.end.add(notice);
  box(0x67503b,0,0,0,.221,.018,.242,notice);
  box(0xf1dfb8,0,.012,0,.188,.009,.212,notice);
  for(const z of [-.067,-.029,.008])box(0x92907b,0,.018,z,.119,.004,.006,notice);
  const pencil=cylinder(0xc09354,0,-.053,.083,.008,.151,9,right.end);
  pencil.rotation.x=.64;
  const spoon=new T.Group();spoon.position.set(0,-.015,.061);left.end.add(spoon);
  cylinder(0xb38c58,0,0,.125,.014,.260,10,spoon).rotation.x=Math.PI/2;
  const bowl=shape(new T.SphereGeometry(1,9,7),0xa47048,0,-.006,.279,spoon);
  bowl.scale.set(.042,.019,.071);

  function update(state,clock,ticket,delta){
    const {x,z,face,walking,cooking,writing,carrying}=state;
    const kind=carrying&&!serviceTray?ticket?.kind:null;
    const time=clock/1000;
    walkerModels.update(model,{x:venue.center.x+x,y:venue.center.y+z,heading:180-face*180/Math.PI,
      look:uniform,character:uniform.character,stepping:walking,item:kind?{kind,remaining:1}:null},
      {now:clock,clock,delta,turnEase:Math.min(1,delta*20)});
    // The shared rig gets world coordinates for its stride; the room already carries the world transform.
    model.group.position.set(x,0,z);
    if(serviceTray){
      serviceTray.visible=Boolean(carrying);
      if(carrying)for(const [i,arm] of model.arms.entries()){
        arm.upper.rotation.set(-.89,0,i?-.12:.12);arm.lower.rotation.x=-.73;
      }
    }
    if(kind&&ticket.phase==="returning")model.showTray(kind,-1,0);
    notice.visible=pencil.visible=writing;spoon.visible=cooking;
    if(writing){
      model.headJoint.rotation.x=.13+Math.sin(time*4)*.024;
      left.upper.rotation.set(-.79,.11,-.13);left.lower.rotation.x=-.77;left.end.rotation.set(-.23,.03,.06);
      right.upper.rotation.set(-.71,-.19,.14);right.lower.rotation.x=-.81+Math.sin(time*8)*.076;
    }else if(cooking){
      model.headJoint.rotation.x=.18;
      model.chest.rotation.x+=.08;
      left.upper.rotation.set(-2.06,Math.sin(time*4.2)*.14,-.16);
      left.lower.rotation.x=-.52+Math.cos(time*4.2)*.10;
      spoon.rotation.x=2.13;
    }
  }
  return update;
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

export function makeDiningStaff(T,room,kit,venue,walkerModels){
  const human=makeDiningHuman(T,room,kit,venue,walkerModels);
  const robot=venue.service==="robot"?makeRobot(T,room,kit):null;
  const dishes=robot?makeDiningDishes(T,kit):null;
  const servings=new Map();
  let servingKind=null,previousClock=null;
  const steamGeometry=new T.SphereGeometry(1,7,5);
  const steam=Array.from({length:6},()=>{
    const puff=new T.Mesh(steamGeometry,new T.MeshBasicMaterial({color:0xe8d9b8,transparent:true,depthWrite:false}));
    puff.visible=false;room.add(puff);return puff;
  });
  function showRobotDish(ticket,state){
    const kind=state.carrying?ticket.kind:null;
    if(kind!==servingKind){
      const previous=servings.get(servingKind);if(previous)previous.group.visible=false;
      servingKind=kind;
    }
    if(!dishes[kind])return;
    if(!servings.has(kind)){
      const group=new T.Group();robot.tray.add(group);
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
    const delta=previousClock===null?1/60:Math.max(1/120,Math.min(.064,(clock-previousClock)/1000));
    previousClock=clock;
    const person=robot?(state.cooking?cookingPose(clock,ticket.phaseAt,ticket.phaseUntil):idleStaff):state;
    human(person,clock,ticket,delta);
    if(robot){
      robot.group.position.set(state.x,0,state.z);robot.group.rotation.y=state.face;
      robot.pose(state,time);showRobotDish(ticket,state);
    }
    steam.forEach((puff,index)=>{
      puff.visible=person.cooking;
      if(!person.cooking)return;
      const rise=(time*.66+index/steam.length)%1;
      puff.position.set(diningStaffStation.x+burner.x+Math.sin(time*2.1+index)*rise*.14,1.47+stoveLift+rise*.58,
        stoveZ+burner.z+Math.cos(time*1.5+index)*rise*.14);
      puff.scale.setScalar(.042+rise*.082);puff.material.opacity=.23*(1-rise);
    });
  }
  return {update};
}
