import {clearSegment} from "./layout.js";
import {stops as seoulStops,createVisitorWalks,streetLine,onLine} from "./visitor-walks.js";
import {diningVenues} from "./dining-data.js";
import {buskingSpot} from "./street-people.js";
import {PET_MS} from "./activities.js";
import {BUS_SEATS,busAt,busLocalPose,busSeatPose,busStopById} from "./sejong-bus.js";
import {visitorEdgePose} from "./visitor-crossings.js";
import {bikePassengerPose} from "./sejong-bike.js";

const coats=[0x95664e,0x527669,0x7a607e,0x58768e,0xae7447,0xa3666a,0x6b7351];
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const facing=(a,b)=>Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI;
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const besideCache=new WeakMap(),laneCache=new WeakMap();
function beside(p){
  if(besideCache.has(p))return besideCache.get(p);
  const offset=[1.14,-1.14].flatMap(d=>[{x:p.x+d,y:p.y},{x:p.x,y:p.y+d}]).find(q=>clearSegment(p,q))??p;
  besideCache.set(p,offset);return offset;
}
function companionLane(line){
  if(laneCache.has(line))return laneCache.get(line);
  const pts=[beside(line.points[0])];
  for(let i=1;i<line.points.length;i++){
    const left=pts.at(-1),right=beside(line.points[i]);
    if(!clearSegment(left,right))pts.push(line.points[i-1],line.points[i]);
    pts.push(right);
  }
  const lane=streetLine(pts);laneCache.set(line,lane);return lane;
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

function busPlaces(parties,players,clock){
  const buses=new Map(),places=new Map();
  for(const p of parties){
    if(!["boardBus","bus","leaveBus"].includes(p.action))continue;
    const index=p.trip.ride.index;
    if(!buses.has(index)){
      const occupied=new Set(players.filter(player=>player.bus?.index===index).map(player=>player.bus.seat));
      buses.set(index,{bus:busAt(index,clock),occupied,passengers:[]});
    }
    const cabin=buses.get(index);
    for(let side=0;side<(p.pair?2:1);side++){
      const seat=p.trip.ride.seats[side],free=!cabin.occupied.has(seat);
      if(free)cabin.occupied.add(seat);
      cabin.passengers.push({id:p.id*2+side,seat:free?seat:-1});
    }
  }
  for(const [index,{bus,occupied,passengers}] of buses){
    let standing=0;
    for(let {id,seat} of passengers){
      if(seat<0){
        seat=BUS_SEATS-1;while(seat>=0&&occupied.has(seat))seat--;
        if(seat>=0)occupied.add(seat);
      }
      const point=seat>=0?busSeatPose(bus,seat):busLocalPose(bus,0,1.3-standing++*.95);
      places.set(id,{bus,index,seat,point});
    }
  }
  return places;
}

export function addCityVisitors(T,kit,models,{benches,stations,parkLife,floorHeight,seatAt,showMeal,water,room,neighborhood}){
  const stops=neighborhood?.stops??seoulStops,makeWalks=neighborhood?.createWalks??createVisitorWalks;
  const visitors=new Map();
  let walks=makeWalks(room);
  const restaurants=new Map(diningVenues.map(venue=>[venue.id,venue]));
  const tables=new Map(diningVenues.map(v=>[v.id,benches.filter(b=>b.venueId===v.id)]));
  function actor(p,side){
    const index=p.id*2+side;
    if(!visitors.has(index)){
      visitors.set(index,{id:"city-visitor-"+index,index,side,character:index%3?"woman":"man",
        look:{hair:["short","bob","part","bun"][index%4],eyes:index%3?"soft":"round",outfit:index%7===0?"hanbok":index%3?"coat":"puffer"}});
    }
    return visitors.get(index);
  }
  function visit(v,p,site){
    const side=v.side,start=side?beside(site):site,other=side?site:beside(site);
    const rest=(q,action,extras={})=>({...q,action,wait:15,heading:p.pair?facing(q,other):p.variant%360,...extras});
    const venue=restaurants.get(site.ref),shop=stations[site.ref];
    let path,seat=null,kind=null;
    if(p.action==="meal"&&venue){
      const choices=tables.get(venue.id);
      seat=choices[p.variant%choices.length];
      const slot=seat.slots[side],room=venue.id,door=venue.outsideDoor,entry={...venue.insideDoor,room};
      const aisle={x:slot.approach.x,y:entry.y-2.2,room};
      kind=venue.dishes[(p.variant+side)%venue.dishes.length].kind;
      path=[start,site,door,entry,aisle,rest(slot.approach,"meal",{room,wait:48,heading:slot.heading}),aisle,entry,door,site];
    }else if(p.action==="shop"&&shop){
      kind=shop.kind;
      const counter=side?beside(shop):shop;
      const approach=clearSegment(start,counter)?[]:[site,shop];
      path=[start,...approach,rest(counter,"order",{wait:3,carried:kind}),...approach.reverse(),rest(start,"snack",{carried:kind})];
    }else if(p.action==="water"||p.action==="seat"){
      seat=benches[site.ref];
      const slot=seat?.slots[side];
      if(slot)path=[start,site,rest(slot.approach,p.action,{heading:slot.heading}),site];
    }else if(p.action==="music"){
      path=[rest(start,"listen",{heading:facing(start,buskingSpot)})];
    }
    if(!path){
      const action=p.action==="photo"?(side?"pose":"camera"):p.action==="cat"?"cat":"look";
      path=[rest(start,action)];
    }
    const tour=itinerary(path);
    return {tour,seat,seatIndex:seat?benches.indexOf(seat):-1,kind};
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
    const range=sparse?62:90,{parties,t}=walks.at(clock),claimed=new Set();
    const cabinPlaces=inside?null:busPlaces(parties,players,clock);
    for(const p of parties)for(let side=0;side<(p.pair?2:1);side++){
      const v=actor(p,side),site=stops[p.node],venue=p.action==="meal"?restaurants.get(site.ref):null;
      if(inside&&venue?.id!==inside){hide(v,now);continue;}
      const ageSec=t-p.start;
      let pose,visitInfo=null,seat=null,vehicleFloor;
      if(p.edge){
        const line=p.edge.line,span=p.until-p.start,nominal=onLine(line,ageSec/span*line.length);
        if(gap(nominal,anchor)>range+25){hide(v,now);continue;}
        const began=Math.round(clock-ageSec*1000);
        const {progress,centre,stepping}=visitorEdgePose(line,began,span,ageSec);
        if(gap(centre,anchor)>range+2){hide(v,now);continue;}
        if(p.action==="cycle"){
          pose={...(side?bikePassengerPose(centre):centre),age:ageSec};
        }else{
          const lane=side?companionLane(line):line;
          pose={...onLine(lane,progress*lane.length),age:ageSec,stepping};
        }
      }else if(cabinPlaces?.has(v.index)){
        const place=cabinPlaces.get(v.index),bus=place.bus,boarding=p.action==="boardBus";
        if(gap(bus,anchor)>range+9){hide(v,now);continue;}
        const base=seatAt({bus:{index:place.index,seat:Math.max(0,place.seat)}},clock).base;
        if(p.action==="bus"){
          pose={...place.point,age:ageSec};vehicleFloor=base;
          if(place.seat>=0)seat={...pose,base};
        }else{
          const stop=stops[boarding?p.trip.from:p.trip.to],pavement=side?beside(stop):stop;
          const progress=Math.max(0,Math.min(1,ageSec/3)),u=boarding?progress:1-progress;
          const door=busLocalPose(bus,-1.15,3.15);
          const path=u<.5?[pavement,door]:[door,place.point];
          const fraction=u<.5?u*2:u*2-1;
          pose={...mix(...path,fraction),heading:boarding?facing(...path):facing(path[1],path[0]),stepping:true,age:ageSec};
          const ground=floorHeight(pavement);
          vehicleFloor=ground+(base-ground)*Math.min(1,u*2);
        }
      }else if(p.action==="waitBus"){
        const point=side?beside(site):site;
        pose={...point,heading:facing(point,busStopById(site.ref).berth),age:ageSec};
      }else if(p.action==="rentBike"||p.action==="returnBike"){
        const driver={...site,heading:p.trip.heading};
        const mounted=p.action==="rentBike"?ageSec>=1:ageSec<1;
        pose={...(side?(mounted?bikePassengerPose(driver):beside(site)):driver),heading:driver.heading,age:ageSec};
        pose.mounting=mounted;
      }else{
        if(!inside&&gap(site,anchor)>range+12){hide(v,now);continue;}
        const key=clock-ageSec*1000;
        if(!v.visit||Math.abs(v.visitKey-key)>1){
          v.visit=visit(v,p,site);v.visitKey=key;
        }
        visitInfo=v.visit;
        const scale=visitInfo.tour.duration/(p.until-p.start);
        pose=sample(visitInfo.tour,ageSec*scale);pose.age/=scale;
        if(pose.action==="look"&&!p.pair)pose.heading+=Math.sin(pose.age*.29+p.id)*29;
      }
      const distance=gap(pose,anchor);
      if((pose.room??null)!==(inside??null)||distance>range){hide(v,now);continue;}
      // The route stays on room time even when distant walkers animate less often.
      if(v.visible&&p.edge&&distance>22&&now-v.lastSeen<(distance>50?140:65))continue;
      const poseDelta=v.visible?Math.max(delta,Math.min(.15,(now-v.lastSeen)/1000)):delta;
      if(!v.model){
        v.model=models.create(coats[v.index%coats.length],null,null,v.id);
        v.model.group.name=v.id;
      }
      v.lastSeen=now;v.visible=true;
      const age=pose.age*1000,part=age%5000;
      Object.assign(pose,{id:v.id,character:v.character,look:v.look});
      if(p.action==="cycle"||pose.mounting){
        if(side)pose.bikeRide={driver:"city-visitor-"+(v.index-1)};
        else pose.bike={dock:stops[p.trip.from].ref};
      }
      if(pose.action==="look"&&now>=(v.greetCheck??0)){
        v.greetCheck=now+550;
        if(clock-(v.wave??0)>24000&&players.some(player=>gap(player,pose)<2.6))v.wave=clock;
      }
      if(pose.action==="look")pose.wave=v.wave;
      if(visitInfo?.seat&&["seat","water","meal"].includes(pose.action)){
        const index=visitInfo.seatIndex,slot=visitInfo.seat.slots[v.side],seatKey=index*2+v.side;
        const occupied=claimed.has(seatKey)||players.some(p=>p.seat===index&&(p.seatSide??0)===v.side||gap(p,slot)<.72);
        if(!occupied&&index>=0){
          claimed.add(seatKey);
          seat=seatAt({seat:index,seatSide:v.side},clock);
          if(pose.action==="water")pose.kick=clock-age%7800;
          if(pose.action==="meal"&&age>2600)pose.diningMeal={kind:visitInfo.kind,remaining:Math.max(1,3-Math.floor(age/10000)),started:clock-part};
        }
      }
      if(pose.carried&&(pose.action!=="order"||age>2100))pose.item={kind:pose.carried,remaining:2,started:pose.action==="snack"?clock-part:0};
      if(pose.action==="pose")pose.gesture={kind:"peace",at:clock-age%4050};
      if(pose.action==="listen"&&age%12500<2400)pose.gesture={kind:"clap",at:clock-age%12500};
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
      models.update(v.model,pose,{now,clock,delta:poseDelta,seat,floor:vehicleFloor??floorHeight(pose),turnEase:1-Math.exp(-poseDelta*8)});
      if(seat?.tray||v.hadMeal)showMeal(pose,seat,clock);
      if(seat?.footBath||v.wasBathing)water(v.id,now,seat,pose,clock);
      v.hadMeal=Boolean(seat?.tray);v.wasBathing=Boolean(seat?.footBath);
    }
  }
  function setRoom(id){
    if(room===id)return;
    room=id;walks=makeWalks(id);
    for(const v of visitors.values()){hide(v,Infinity);v.visit=null;v.catCycle=null;}
  }
  return {update,setRoom};
}

