import {ALCOHOL_DURATION_MS} from "./avatar-gestures.js";

const period=600;
const colours=[0x527c77,0xc76a59,0x6f78ac,0xa97d4b,0x6c864e,0xb67691,0x537d9b];
const tastes=["photo","snack","water","drink","table","wander"];
function generator(seed){
 return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);

// Plan on room time. A late joiner reconstructs just the current outing.
// Residents visit another neighborhood across successive outings. Consecutive
// start and end points agree without replaying earlier days.
function outing(nodes,person,epoch,isPortal){
 const random=generator(person.seed^Math.imul(epoch+1,2654435761));
 const legs=[],trail=[],seen=new Set();
 let at=person.home,time=0,back=0,lastDrink=-Infinity,glasses=0,lastMeal=-Infinity;
 let goalSteps=[],heading=person.seed%360;
 function append(to,seconds,action){
  if(at!==to&&action!=="transfer")heading=Math.atan2(nodes[to][0]-nodes[at][0],nodes[at][1]-nodes[to][1])*180/Math.PI;
  legs.push({a:at,b:to,start:time,end:time+seconds,action,lastDrink,glasses,heading});
  at=to;time+=seconds;
 }
 function stay(){
  const site=nodes[at],kind=site[3];
  const action=kind&&(kind===person.taste||random()<.8)?kind:random()<.35?"rest":"photo";
  const drinks=action==="drink"||action==="table";
  const duration=drinks?20+random()*16:4+random()*13;
  append(at,duration,action);
  if(action==="snack"||action==="table")lastMeal=time;
  if(drinks){const dining=duration-(action==="table"?9:0);glasses=Math.min(8,(time-lastDrink<120?glasses:0)+Math.floor(dining/6));lastDrink=time-dining%6;}
 }
 function move(to){
  const a=nodes[at],b=nodes[to],water=a[3]==="water"||b[3]==="water";
  const running=!water&&random()<.22&&time-lastDrink>120;
  if(isPortal(at,to)){append(to,4,"transfer");return;}
  const surfing=person.board&&(a[4]==="surf"||b[4]==="surf");
  const speed=water?(surfing?3.3:1.18):time-lastDrink<120?.88:running?2.9:1.38;
  append(to,Math.max(.25,distance(a,b)/speed),running?"run":"walk");
 }
 // One day trip spans three outings: go out, spend time there, and return.
 // Bound the travel time and use only traversable edges; the return follows
 // the same connections, including the bus on the station-to-town routes.
 if(!person.visitor){
  const cycle=Math.floor(epoch/4),phase=epoch-cycle*4;
  if(phase!==3){
   if(person.tripCycle!==cycle){
    const draw=generator(person.seed^Math.imul(cycle+1,3266489917));
    const route=[person.home],visited=new Set(route),origin=nodes[person.home];
    let budget=210;
    for(let hop=0;hop<24;hop++){
     const from=route.at(-1),a=nodes[from];let next,cost,best=-Infinity;
     for(const to of a[2]){
      if(visited.has(to))continue;
      const b=nodes[to],fare=isPortal(from,to)?4:Math.max(.25,distance(a,b)/.85);
      if(fare>budget)continue;
      const score=draw()*28+Math.min(45,distance(origin,b)-distance(origin,a))+(b[3]===person.taste?6:0);
      if(score>best){next=to;cost=fare;best=score;}
     }
     if(next==null)break;
     route.push(next);visited.add(next);budget-=cost;
    }
    person.trip=route;person.tripCycle=cycle;
   }
   const route=person.trip;
   if(phase===1||phase===2)at=route.at(-1);
   if(phase===0){stay();for(let i=1;i<route.length;i++)move(route[i]);}
   if(phase===2)for(let i=route.length-2;i>=0;i--)move(route[i]);
  }
 }
 stay();
 // Consider reachable destinations a few junctions ahead. The first path to
 // each site is a checked walking route, including doors and bus transfers.
 function chooseDestination(){
  const queue=[at],parent=new Map([[at,null]]),depth=[0];
  let goal=null,best=-Infinity;
  for(let i=0;i<queue.length&&i<48;i++){
   const here=queue[i];
   if(depth[i]>=5)continue;
   for(const next of nodes[here][2]){
    if(parent.has(next))continue;
    parent.set(next,here);queue.push(next);depth.push(depth[i]+1);
    const kind=nodes[next][3],food=kind==="snack"||kind==="table";
    let score=random()*4+(seen.has(next)?-4:0)+depth[i]*.16;
    if(kind===person.taste)score+=1.7;
    if(food)score+=time-lastMeal>150?1.4:-2;
    if(kind==="drink"||kind==="table")score+=time-lastDrink>120?.7:-2.5;
    if(score>best){best=score;goal=next;}
   }
  }
  const steps=[];
  for(let n=goal;n!=null&&n!==at;n=parent.get(n))steps.push(n);
  return steps;
 }
 while(trail.length<36){
  if(!goalSteps.length)goalSteps=chooseDestination();
  if(!goalSteps.length)break;
  const to=goalSteps.pop();
  const cost=isPortal(at,to)?4:Math.max(.25,distance(nodes[at],nodes[to])/.85);
  if(time+2*cost+back+45>period)break;
  trail.push(at);seen.add(at);move(to);back+=cost;
  if(!goalSteps.length||random()<.15)stay();
 }
 while(trail.length)move(trail.pop());
 append(at,period-time,"wait");
 return legs;
}

export function createResidentLife(graph,room,city){
 const portals=new Set(graph.portals.flatMap(([a,b])=>[a*graph.nodes.length+b,b*graph.nodes.length+a]));
 const isPortal=(a,b)=>portals.has(a*graph.nodes.length+b);
 let seed=2166136261;
 for(const char of String(room??""))seed=Math.imul(seed^char.charCodeAt(0),16777619);
 const platforms=graph.nodes.flatMap((n,i)=>n[3]==="station"&&n[2].length?[i]:[]);
 const homes=graph.homes.slice();
 for(let i=0;i<12&&platforms.length;i++)homes.push(platforms[i%platforms.length]);
 const cities=["seoul","pohang","gyeongju"];
 const people=homes.map((home,i)=>{
  const visitor=i>=graph.homes.length,serial=visitor?i-graph.homes.length:i;
  const random=generator(seed^Math.imul(serial+1,2246822519));
  const n=graph.nodes[home],board=n[4]==="surf"||random()<.38;
  return {home,visitor,serial,id:visitor?"rail-traveler-"+serial:"resident-"+city+"-"+i,seed:Math.floor(random()*4294967296),offset:random()*period,
   board,taste:n[3]==="templeBow"||n[3]==="churchPrayer"?n[3]:tastes[Math.floor(random()*tastes.length)],coat:colours[serial%colours.length],character:serial%2?"woman":"man",
   look:{hair:["short","part","bun","bob"][serial%4],outfit:["tee","puffer","coat","overalls","hanbok"][serial%5],eyes:serial%3?"soft":"round"}};
 });
 let nearby=[],updated=-Infinity,lastAnchor={x:Infinity,y:Infinity},lastRoom,lastLimit;
 function sample(person,clock){
  const seconds=clock/1000+person.offset,epoch=Math.floor(seconds/period),t=seconds-epoch*period;
  if(person.visitor&&(cities[(epoch+person.serial)%3]!==city||t<2||t>=period-2))return null;
  if(person.epoch!==epoch){person.legs=outing(graph.nodes,person,epoch,isPortal);person.epoch=epoch;person.index=0;}
  let i=person.index;
  if(person.legs[i].start>t)i=0;
  while(i+1<person.legs.length&&person.legs[i].end<=t)i++;
  person.index=i;
  const leg=person.legs[i],a=graph.nodes[leg.a],b=graph.nodes[leg.b],age=t-leg.start;
  const u=leg.action==="transfer"?Number(age>=2):age/(leg.end-leg.start),x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u;
  return {x,y,a,b,leg,age,time:t};
 }
 function visible(clock,anchor,inside,players,limit,roomAt,decorate){
  if(clock<updated||clock-updated>=400||inside!==lastRoom||limit!==lastLimit||Math.hypot(anchor.x-lastAnchor.x,anchor.y-lastAnchor.y)>6){
   lastAnchor={x:anchor.x,y:anchor.y};updated=clock;lastRoom=inside;lastLimit=limit;
   nearby=[];
   for(const person of people){
    const snapshot=sample(person,clock);if(!snapshot)continue;
    const {x,y}=snapshot,d=(x-anchor.x)**2+(y-anchor.y)**2;
    if(d<85**2&&roomAt(x,y)===inside)nearby.push({person,d});
   }
   nearby.sort((a,b)=>a.d-b.d);nearby.length=Math.min(nearby.length,limit);
  }
  const seats=new Set(players.filter(p=>p.coast?.mode==="table").map(p=>p.coast.seat));
  // Resolve competing customers by arrival time, regardless of the camera or detail setting.
  const owners=new Map();
  if(nearby.some(({person})=>sample(person,clock)?.leg.action==="table")){
   for(const person of people){
    const s=sample(person,clock);
    if(s?.leg.action!=="table")continue;
    const seat=s.a[4][0],owner=owners.get(seat);
    if(!owner||s.age>owner.age)owners.set(seat,{person,age:s.age});
   }
  }
  return nearby.flatMap(({person})=>{
   const s=sample(person,clock);if(!s||roomAt(s.x,s.y)!==inside)return [];
   const {x,y,a,b,leg,age,time}=s,action=leg.action,stepping=leg.a!==leg.b&&action!=="transfer";
   const pose={x,y,id:person.id,coat:person.coat,look:person.look,character:person.character,stepping,running:action==="run",
    heading:leg.heading};
   const drinking=action==="table"||action==="drink",sips=drinking?Math.floor(Math.max(0,age-(action==="table"?9:0))/6):0;
   const since=sips?(age-(action==="table"?9:0))%6:time-leg.lastDrink,glasses=(time-leg.lastDrink<120?leg.glasses:0)+sips;
   if(glasses&&since*1000<ALCOHOL_DURATION_MS)Object.assign(pose,{alcoholGlasses:Math.min(8,glasses),blushLevel:Math.min(8,glasses),blushUntil:clock+ALCOHOL_DURATION_MS-since*1000});
   if(action==="drink"||action==="snack")pose.item={kind:a[4],remaining:2,started:clock-age%6*1000};
   if(action==="rest"&&age>2&&age<13)pose.groundSit=true;
   if(action==="templeBow"||action==="churchPrayer")pose.heading=a[4]??0;
   if(action==="photo"||action==="templeBow"||action==="churchPrayer")pose.gesture={kind:action==="photo"?"peace":action,at:clock-age%9*1000};
   if(action==="table"){
    const [seat,heading,sx,sy]=a[4];
    if(!seats.has(seat)&&owners.get(seat)?.person===person){Object.assign(pose,{x:sx,y:sy,heading,orderAt:clock-age*1000,coast:{mode:"table",seat,tableGlass:age>=9,
      tasting:age>=9?{kind:Math.floor((age-9)/3)%2?"sashimi":"soju",at:clock-(age-9)%3*1000}:null}});}
    else pose.item={kind:"soju",remaining:2,started:clock-age%6*1000};
   }
   if(action==="deckSeat")pose.deckSeat=a[4];
   if(a[3]==="stairs"&&b[3]==="stairs"){
    const progress=age/(leg.end-leg.start);pose.coast={mode:"walk",track:a[4]+(b[4]-a[4])*progress};
   }
   decorate?.(pose,person,clock,a,b);
   return pose;
  });
 }
 return {count:graph.homes.length,visible};
}
