import {clearSegment,walkable,route} from "./layout.js";
import {plazaAt,plazaShortcuts} from "./plaza-layout.js";
import {bankAt,cheonggyeAnimalTrails} from "./cheonggye-layout.js";
import {cheonggyeSeats} from "./cheonggye-seats.js";
import {diningVenues} from "./dining-data.js";
import {PET_MS} from "./activities.js";

const coats=[0x95664e,0x527669,0x7a607e,0x58768e,0xae7447,0xa3666a,0x6b7351];
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const facing=(a,b)=>Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI;
const point=(x,y)=>({x,y});
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const from=(p,angle,length)=>({x:p.x+Math.cos(angle)*length,y:p.y+Math.sin(angle)*length});
const open=p=>walkable(p.x,p.y);

function walkingEnd(start,angle,length){
  for(const span of [length,length*.55,2]){
    for(let i=0;i<8;i++){
      const end=from(start,angle+i*Math.PI/4,span);
      if(open(end)&&clearSegment(start,end))return end;
    }
  }
  return start;
}

// Each stop belongs to a room (null outdoors). Doorways switch rooms only at
// the instant the walker reaches the door, the same way a player enters.
function itinerary(stops){
  const legs=[];let duration=0;
  for(let i=0;i<stops.length;i++){
    const a=stops[i],b=stops[(i+1)%stops.length];
    if(a.wait){legs.push({a,b:a,start:duration,span:a.wait,action:a.action});duration+=a.wait;}
    if(a.room!==b.room)continue;
    const span=a.travel??gap(a,b)/1.08;
    if(span>.03){legs.push({a,b,start:duration,span});duration+=span;}
  }
  return {legs,duration};
}
function sample(tour,seconds){
  const phase=seconds%tour.duration;
  const leg=tour.legs.find(l=>phase<l.start+l.span)??tour.legs.at(-1);
  const age=phase-leg.start,walking=leg.a!==leg.b;
  return {...mix(leg.a,leg.b,walking?age/leg.span:0),room:leg.a.room,action:leg.action,age,
    heading:walking?facing(leg.a,leg.b):leg.a.heading??0,stepping:walking,carried:leg.a.carried};
}

export function addCityVisitors(T,kit,models,{benches,stations,parkLife,floorHeight,seatAt,showMeal,water}){
  const visitors=[];
  function visitor(home,build,{venue,phase,kind,seat,side=0}={}){
    const index=visitors.length;
    visitors.push({id:"city-visitor-"+index,home,build,venue,phase:phase??index*17.71,kind,seat,side,index,seatIndex:seat?benches.indexOf(seat):-1,
      character:index%2?"woman":"man",look:{hair:["short","bob","part","bun"][index%4],eyes:index%3?"soft":"round",outfit:index%3?"coat":"puffer"}});
  }
  function stroll(home,angle,activity="walk",partner=false){
    const phase=visitors.length*13.9;
    let stops;
    const prepare=()=>{
      if(stops)return stops;
      const end=walkingEnd(home,angle,12);
      const heading=facing(home,end),normal=Math.atan2(end.y-home.y,end.x-home.x)+Math.PI/2;
      const partnerNear=walkingEnd(home,normal,1.1);
      const nextToEnd=walkingEnd(end,normal,partner&&activity==="photo"?2.7:1.1);
      const partnerFar=clearSegment(partnerNear,nextToEnd)?nextToEnd:walkingEnd(partnerNear,angle,gap(home,end));
      stops={home,end,heading,partnerNear,partnerFar};return stops;
    };
    for(let n=0;n<(partner?2:1);n++)visitor(home,()=>{
      const {end,heading,partnerNear,partnerFar}=prepare(),a=n?partnerNear:home,b=n?partnerFar:end;
      const action=activity==="photo"?(n?"pose":"camera"):activity;
      return itinerary([{...a,wait:4,heading,travel:12},{...b,wait:14,action,
        heading:partner?facing(b,n?end:partnerFar):(heading+180)%360,travel:12}]);
    },{phase});
  }

  stroll(plazaShortcuts.sejong,0,"photo",true);
  stroll(plazaAt(-18,459),Math.PI/2,"walk",true);
  stroll(plazaAt(-25,82),Math.PI/2,"cat");
  stroll(plazaAt(-27,355),0);
  stroll(cheonggyeAnimalTrails[0][2],0,"photo",true);
  stroll(bankAt(790,1,-1.3),0,"cat");
  stroll(bankAt(919,-1,-1.5),Math.PI,"walk",true);
  stroll(route[5],Math.PI,"cat");
  stroll(point(548,282),0,"photo",true);
  stroll(point(721.8,-1107.9),Math.PI/2,"walk",true);

  for(const kind of ["crepe","beer","cake","yakgwa","riceCake","wine"]){
    const shop=stations.find(s=>s.kind===kind);
    if(!shop)continue;
    visitor(shop,()=>{
      const start=walkingEnd(shop,Math.PI/2,9),rest=mix(shop,start,.65);
      return itinerary([{...start,wait:6,heading:facing(start,shop)},
        {...shop,wait:3,action:"order",heading:facing(start,shop),carried:kind},
        {...rest,wait:15,action:"snack",carried:kind,heading:facing(shop,start)}]);
    },{kind});
  }
  function seatVisit(bench,side,phase){
    const slot=bench.slots[side],approach=slot.approach??slot;
    visitor(bench,()=>{
      const start=walkingEnd(approach,0,7);
      return itinerary([{...start,wait:7,travel:7,heading:facing(start,approach)},{...approach,wait:22,travel:7,
        action:bench.footBath?"water":"seat",heading:slot.heading}]);
    },{seat:bench,side,phase});
  }
  const ordinary=benches.filter(b=>!b.table&&!b.footBath&&b.slots?.[0]?.approach&&b.catPerch);
  for(const target of [route[4],plazaShortcuts.sejong,plazaAt(-91,324)]){
    const bench=ordinary.reduce((best,b)=>!best||gap(b,target)<gap(best,target)?b:best,null);
    if(bench&&gap(bench,target)<90&&!visitors.some(v=>v.seat===bench))seatVisit(bench,0,visitors.length*3.7);
  }
  for(const [x,side,pair] of [[664,1,true],[764,-1,false],[919,1,true]]){
    const bench=cheonggyeSeats.filter(b=>b.side===side).reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a);
    const phase=x*.31;
    seatVisit(bench,0,phase);
    if(pair)seatVisit(bench,1,phase);
  }
  for(const venue of diningVenues){
    const bench=benches.find(b=>b.venueId===venue.id&&b.tableIndex===3);
    if(!bench)continue;
    const side=0,slot=bench.slots[side],room=venue.id,entry=venue.insideDoor,aisle={...point(slot.approach.x,entry.y-2.2),room};
    visitor(venue.outsideDoor,()=>{
      const door=venue.outsideDoor,start=walkingEnd(door,Math.atan2(door.y-venue.plot.y,door.x-venue.plot.x),10);
      return itinerary([{...start,wait:6,heading:facing(start,door)},door,{...entry,room},aisle,
        {...slot.approach,room,wait:28,action:"meal",heading:slot.heading},aisle,{...entry,room},door]);
    },{venue,seat:bench,side,kind:venue.dishes[visitors.length%venue.dishes.length].kind});
  }

  function cameraProp(model){
    const g=new T.Group();model.chest.add(g);g.position.set(0,.37,.33);
    kit.box(0x353837,0,0,0,.29,.165,.115,g);
    kit.box(0xaaa49a,0,.089,0,.27,.024,.112,g);
    kit.cylinder(0x202729,0,.002,.08,.065,.09,14,g).rotation.x=Math.PI/2;
    kit.cylinder(0x627f87,0,.002,.128,.045,.01,14,g).rotation.x=Math.PI/2;
    return g;
  }
  function hide(v,now){
    if(!v.model)return;
    v.model.group.visible=false;
    if(v.visible){showMeal({id:v.id},null,0);water(v.id,now,null);v.visible=false;}
    if(now-v.lastSeen>9000){models.dispose(v.model);v.model=null;v.camera=null;v.cat=null;}
  }
  function update(clock,now,delta,anchor,inside,players,sparse){
    const range=sparse?30:55;
    for(const v of visitors){
      if(inside?v.venue?.id!==inside:gap(v.home,anchor)>range+18){hide(v,now);continue;}
      v.tour??=v.build();
      const pose=sample(v.tour,clock/1000+v.phase);
      const distance=gap(pose,anchor);
      if((pose.room??null)!==(inside??null)||distance>range){hide(v,now);continue;}
      // The route stays on room time even when distant walkers animate less often.
      if(v.visible&&distance>22&&now-v.lastSeen<65)continue;
      const poseDelta=v.visible?Math.max(delta,Math.min(.15,(now-v.lastSeen)/1000)):delta;
      if(!v.model){
        v.model=models.create(coats[v.index%coats.length],null,null,v.id);
        v.model.group.name=v.id;
      }
      v.lastSeen=now;v.visible=true;
      const age=pose.age*1000,part=age%5000;
      Object.assign(pose,{id:v.id,character:v.character,look:v.look});
      let seat=null;
      if(["seat","water","meal"].includes(pose.action)){
        const index=v.seatIndex,slot=v.seat.slots[v.side];
        const occupied=players.some(p=>p.seat===index&&(p.seatSide??0)===v.side||gap(p,slot)<.72);
        if(!occupied&&index>=0){
          seat=seatAt({seat:index,seatSide:v.side},clock);
          if(pose.action==="water")pose.kick=clock-age%7800;
          if(pose.action==="meal"&&age>2600)pose.diningMeal={kind:v.kind,remaining:Math.max(1,3-Math.floor(age/10000)),started:clock-part};
        }
      }
      if(pose.carried&&(pose.action!=="order"||age>2100))pose.item={kind:pose.carried,remaining:2,started:pose.action==="snack"?clock-part:0};
      if(pose.action==="pose")pose.gesture={kind:"peace",at:clock-age%4050};
      if(pose.action==="camera"){
        v.camera??=cameraProp(v.model);
        const shot=(age%4050)/1000;
        pose.photograph=Math.max(0,Math.min(1,shot/.55,(3.2-shot)/.55));
        v.camera.position.y=.15+.22*pose.photograph;
      }
      if(v.camera)v.camera.visible=pose.action==="camera";
      if(pose.action==="cat"&&age<11500){
        const cycle=Math.round(clock-age);
        if(v.catCycle!==cycle){v.catCycle=cycle;v.cat=null;v.nextSearch=0;}
        if(!v.cat&&age<5500&&now>=v.nextSearch){
          v.nextSearch=now+500;
          const cat=parkLife.nearestCat(pose.x,pose.y,5);
          if(cat){
            const d=gap(pose,cat),end=mix(pose,cat,Math.max(0,1-.76/Math.max(.01,d)));
            if(clearSegment(pose,end)){v.cat={...cat,end,age,travel:Math.max(200,gap(pose,end)*700)};}
          }
        }
        if(v.cat){
          const cat=v.cat,t=age-cat.age,progress=Math.min(1,t/cat.travel);
          const back=Math.min(1,Math.max(0,(t-cat.travel-PET_MS)/cat.travel));
          Object.assign(pose,mix(pose,cat.end,progress-back),{heading:facing(pose,cat),stepping:progress<1||back>0&&back<1});
          if(progress===1&&!back){
            const actual=parkLife.nearestCat(pose.x,pose.y);
            if(actual?.id===cat.id){
              pose.pet={id:cat.id,at:clock-(t-cat.travel)};
              parkLife.pet(cat.id,pose.pet.at);
            }
          }
        }
      }
      models.update(v.model,pose,{now,clock,delta:poseDelta,seat,floor:floorHeight(pose),turnEase:1-Math.exp(-poseDelta*8)});
      if(v.seat?.table)showMeal(pose,seat,clock);
      if(v.seat?.footBath)water(v.id,now,seat,pose,clock);
    }
  }
  return {update};
}

