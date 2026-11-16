// People of the palace: gate sentries, a marching guard patrol and visitors strolling in
// hanbok. Everyone follows the shared room clock, so all players see the same scene.
import {at,gbBounds} from "./gyeongbok-layout.js";

const point=([east,north])=>at(east,north);
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);

// A closed walking route. Timing comes from the centre line; each walker may keep a fixed
// distance to one side of it, so companions stay abreast through the corners.
function makeRoute(stops,speed,pauses={}){
  const points=stops.map(point),count=points.length,legs=[];
  let time=0;
  for(let i=0;i<count;i++){
    const a=points[i],b=points[(i+1)%count],travel=length(a,b)/speed,pause=pauses[(i+1)%count]??0;
    legs.push({from:i,to:(i+1)%count,start:time,travel,pause,heading:Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI});
    time+=travel+pause;
  }
  const normals=points.map((p,i)=>{
    const before=points[(i+count-1)%count],after=points[(i+1)%count];
    const a=length(before,p)||1,b=length(p,after)||1;
    const n1={x:(p.y-before.y)/a,y:-(p.x-before.x)/a},n2={x:(after.y-p.y)/b,y:-(after.x-p.x)/b};
    const x=n1.x+n2.x,y=n1.y+n2.y,size=Math.hypot(x,y)||1,spread=Math.min(2.2,2/Math.max(.4,size));
    return {x:x/size*spread,y:y/size*spread};
  });
  const lane=aside=>points.map((p,i)=>({x:p.x-normals[i].x*aside,y:p.y-normals[i].y*aside}));
  function pose(lanePoints,seconds){
    const phase=((seconds%time)+time)%time;
    const leg=legs.find(item=>phase<item.start+item.travel+item.pause)??legs.at(-1);
    const progress=Math.min(1,(phase-leg.start)/(leg.travel||1)),a=lanePoints[leg.from],b=lanePoints[leg.to];
    return {x:a.x+(b.x-a.x)*progress,y:a.y+(b.y-a.y)*progress,heading:leg.heading,stepping:progress<1};
  }
  return {lane,pose,time};
}

const visitorRoutes=[
  // Throne-hall court.
  {stops:[[0,262],[-40,262],[-40,330],[0,340],[40,330],[40,262]],speed:.82,pauses:{0:9,3:7}},
  // Around the Gyeonghoeru pond.
  {stops:[[-58,362],[-58,430],[-58,488],[-128,488],[-198,488],[-198,430],[-198,362],[-128,362]],speed:.9,pauses:{1:10,3:6,7:6}},
  // Around the Hyangwonjeong pond.
  {stops:[[-10,610],[-30,650],[-50,706],[-30,756],[12,762],[46,752],[62,706],[40,650]],speed:.86,pauses:{2:8,4:10,6:8}},
  // Up and down the royal road between the gates.
  {stops:[[1.6,16],[1.6,112],[1.6,205],[1.6,256],[-1.6,256],[-1.6,205],[-1.6,112],[-1.6,16]],speed:.95,pauses:{3:8,7:5}}
];
// Each party: route, how far round the loop it starts, and its members.
const parties=[
  [0,0,[["woman","long",-.45],["man","short",.45]]],
  [1,.05,[["woman","bun",-.45],["woman","bob",.45]]],
  [1,.55,[["man","short",-.45],["woman","long",.45]]],
  [2,.1,[["woman","long",-.45],["woman","bun",.45]]],
  [2,.6,[["man","short",0]]],
  [2,.8,[["woman","bob",-.45],["man","short",.45]]],
  [3,.2,[["woman","bun",-.4],["woman","long",.4]]],
  [3,.7,[["man","short",0]]]
];
const silks=[0xd9778c,0x7fa6d9,0xe3b34f,0x8fbf9a,0xc48bd0,0xe58f6a,0x6fb5b0,0xd16a5a];

// Sentries stand before the piers of Gwanghwamun; the patrol loops between the two gates.
const sentries=[[-12.6,-8.6,0xb0302a],[-4.6,-8.6,0x2f5d9e],[4.6,-8.6,0x2f5d9e],[12.6,-8.6,0xb0302a]];
const patrol=makeRoute([[-1.3,124],[-1.3,-44],[1.3,-44],[1.3,124]],.92);
const squad=[[0,0,0xd9a520,"flag"],[-.6,1.7,0xb0302a,"spear"],[.6,1.7,0x2f5d9e,"spear"]];

// Changing of the guard: for two and a half minutes in every ten the patrol draws up in a
// line before the gate while the sentries step forward from the piers.
const CEREMONY_EVERY=600,CEREMONY_LASTS=150,CEREMONY_MARCH=14;
export function ceremonyAt(clock){
  const phase=((clock/1000)%CEREMONY_EVERY+CEREMONY_EVERY)%CEREMONY_EVERY;
  if(phase>=CEREMONY_LASTS)return {active:false,blend:0,phase};
  return {active:true,phase,blend:Math.min(1,phase/CEREMONY_MARCH,(CEREMONY_LASTS-phase)/CEREMONY_MARCH)};
}
const drawnUp=(pose,spot,blend)=>blend<=0?pose:{x:pose.x+(spot.x-pose.x)*blend,y:pose.y+(spot.y-pose.y)*blend,
  heading:blend>=1?180:pose.heading,stepping:blend<1};

export function addPalacePeople(T,scene,kit,walkerModels,{floorHeight,labelSprite,handheld=false}){
  const {cylinder,box}=kit,people=[];
  // Black felt hat with a red tassel, and a spear or the patrol banner in hand.
  function dress(model,gear){
    const hat=new T.Group();
    cylinder(0x1c1c1f,0,.585,0,.40,.035,16,hat);
    cylinder(0x232326,0,.69,0,.2,.2,12,hat,.82);
    cylinder(0xb3261e,0,.81,0,.05,.07,8,hat);
    box(0xb3261e,0,.69,-.24,.03,.24,.03,hat);
    // The hat was shaped around a head centred .30 above the neck joint.
    hat.position.y=-.300;
    model.headwear.add(hat);
    model.labelLift=.20;
    const hold=new T.Group();
    hold.position.set(.31,-.3,.07);
    cylinder(0x5a4334,0,1.3,0,.022,3.1,6,hold);
    if(gear==="flag"){
      box(0xd9a520,.36,2.42,0,.7,.84,.02,hold);
      box(0xb3261e,.36,2.42,0,.52,.62,.026,hold);
      box(0xe8c867,.36,2.42,0,.2,.34,.03,hold);
      cylinder(0xc9a64a,0,2.9,0,.045,.12,8,hold,.2);
    }else{
      cylinder(0xc7c9c4,0,2.98,0,.035,.34,6,hold,.1);
      box(0xb3261e,0,2.74,0,.09,.12,.09,hold);
    }
    model.chest.add(hold);
    for(const part of [hat,hold])part.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=true;});
  }
  const person=(spec)=>{people.push({model:null,wave:0,waveCheck:0,...spec});};
  for(const [index,[east,north,coat]] of sentries.entries()){
    const spot=at(east,north);
    person({id:"sentry-"+index,coat,gear:"spear",label:"수문장",character:"man",look:{hair:"short",outfit:"hanbok",eyes:"round"},
      where:(seconds,blend)=>drawnUp({x:spot.x,y:spot.y,heading:180,stepping:false},{x:spot.x,y:spot.y+2.4},blend)});
  }
  for(const [index,[aside,lag,coat,gear]] of squad.entries()){
    const lane=patrol.lane(aside);
    person({id:"patrol-"+index,coat,gear,label:index?null:"수문군",character:"man",look:{hair:"short",outfit:"hanbok",eyes:"round"},
      where:(seconds,blend)=>drawnUp(patrol.pose(lane,seconds-lag),at((index-1)*2.2,-17),blend)});
  }
  const routes=visitorRoutes.map(({stops,speed,pauses})=>makeRoute(stops,speed,pauses));
  let serial=0;
  for(const [routeIndex,start,members] of parties){
    const route=routes[routeIndex];
    for(const [character,hair,aside] of members){
      const lane=route.lane(aside),index=serial++;
      person({id:"visitor-"+index,coat:silks[index%silks.length],visitor:true,character,
        look:{hair,outfit:"hanbok",eyes:["round","bright","soft"][index%3]},
        where:seconds=>route.pose(lane,seconds+start*route.time)});
    }
  }

  // anchor: the walker the camera follows (null indoors). sparse: slow device, show fewer.
  function update(clock,now,delta,anchor,walkers=[],sparse=false){
    const seconds=clock/1000,{blend}=ceremonyAt(clock),range=sparse?30:handheld?38:50;
    const {minX,maxX,minY,maxY}=gbBounds;
    const near=anchor&&anchor.x>=minX-range&&anchor.x<=maxX+range&&anchor.y>=minY-range&&anchor.y<=maxY+range;
    for(const one of people){
      const pose=near&&!(sparse&&one.visitor)?one.where(seconds,blend):null;
      if(!pose||Math.hypot(pose.x-anchor.x,pose.y-anchor.y)>range){
        if(one.model?.group.visible)one.model.group.visible=false;
        continue;
      }
      if(!one.model){
        one.model=walkerModels.create(one.coat,one.label,one.label?labelSprite:null,one.id);
        if(one.gear)dress(one.model,one.gear);
      }
      // Visitors greet a walker who comes close.
      if(one.visitor&&clock>=one.waveCheck){
        one.waveCheck=clock+400;
        if(clock-one.wave>16000&&walkers.some(walker=>Math.hypot(walker.x-pose.x,walker.y-pose.y)<2.6))one.wave=clock;
      }
      walkerModels.update(one.model,{...pose,id:one.id,character:one.character,look:one.look,running:false,wave:one.wave,vx:0,vy:0},
        {now,clock,delta,floor:floorHeight(pose),jump:0,turnEase:1-Math.exp(-delta*7)});
    }
  }
  const census=()=>({sentries:sentries.length,patrol:squad.length,visitors:serial});
  return {update,census};
}
