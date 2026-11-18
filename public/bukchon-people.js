import {bukchonPaths} from "./bukchon-layout.js";
import {clearSegment,walkable} from "./layout.js";
import {mmcaAt} from "./mmca-layout.js";

const coats=[0xb16d59,0x5e7893,0xa98953,0x718874,0x74546c,0x566767,0xae8871,0x75788f];
const hair=["short","bob","bun","long"];
const courtyardRoutes=[
  [[-33,6],[-22,6],[-7,6],[8,6],[26,8],[49,12],[73,13]],
  [[-34,10],[-29,11],[-19,11],[-9,11],[4,11],[16,11],[27,12]],
  [[12,25],[30,27],[49,32],[65,38],[79,41],[86,45],[98,50]],
  [[-27,109],[-25,91],[-24,69],[-25,49],[-29,35],[-31,24]]
].map(points=>points.map(([east,south])=>mmcaAt(east,south)));
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const spacing=2.2;

function walkSegments(points,offset){
  const runs=[];
  let run=[];
  function sample(point){
    const open=walkable(point.x,point.y);
    if(open&&(!run.length||clearSegment(run.at(-1),point,.45))){
      run.push(point);
      return;
    }
    if(run.length>2)runs.push(run);
    run=open?[point]:[];
  }
  const lane=points.map((point,index)=>{
    const a=points[Math.max(index-1,0)],b=points[Math.min(index+1,points.length-1)];
    const scale=offset/(length(a,b)||1);
    return {x:point.x-(b.y-a.y)*scale,y:point.y+(b.x-a.x)*scale};
  });
  sample(lane[0]);
  for(let index=1;index<lane.length;index++){
    const a=lane[index-1],b=lane[index],count=Math.ceil(length(a,b)/spacing);
    for(let step=1;step<=count;step++){
      const fraction=step/count;
      sample({x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction});
    }
  }
  if(run.length>2)runs.push(run);
  return runs;
}

function promenade(points){
  let distance=0;
  const legs=points.slice(1).map((to,index)=>{
    const from=points[index],dx=to.x-from.x,dy=to.y-from.y,span=Math.hypot(dx,dy);
    const start=distance;
    distance+=span;
    return {from,dx,dy,span,start,heading:Math.atan2(dx,-dy)*180/Math.PI};
  });
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  return {distance,legs,west:Math.min(...xs),east:Math.max(...xs),north:Math.min(...ys),south:Math.max(...ys)};
}

function crowdRoutes(path,pathIndex){
  const routes=[];
  for(const points of walkSegments(path.points,0)){
    const route=promenade(points);
    if(route.distance>=11)routes.push(route);
  }
  let identity=pathIndex*1024;
  for(const route of routes){
    const count=Math.min(8,Math.max(1,Math.round(route.distance/85)));
    route.people=Array.from({length:count},(_,index)=>{
      const id=identity++,character=id%2?"woman":"man";
      return {id,character,speed:1.04+(id%7)*.075,phase:(index+.28+(id%5)*.11)/count,
        look:{hair:hair[id%hair.length],eyes:id%3===1?"round":"soft",outfit:id%7===3?"hanbok":id%3===2?"puffer":"coat"}};
    });
  }
  return routes;
}

function poseAt(route,person,clock){
  const {distance,legs}=route;
  const travel=distance/person.speed,span=travel+2.35;
  const phase=((clock/1000+person.phase*span*2)%(span*2)+span*2)%(span*2);
  const backwards=phase>=span,elapsed=backwards?phase-span:phase;
  const step=Math.min(distance,elapsed*person.speed),along=backwards?distance-step:step;
  let first=0,last=legs.length-1;
  while(first<last){
    const middle=(first+last)>>1,leg=legs[middle];
    if(leg.start+leg.span<along)first=middle+1;
    else last=middle;
  }
  const leg=legs[first],fraction=leg.span?(along-leg.start)/leg.span:0;
  return {x:leg.from.x+leg.dx*fraction,y:leg.from.y+leg.dy*fraction,
    heading:leg.heading+(backwards?180:0),stepping:elapsed<travel};
}

export function addBukchonPeople(walkerModels,{floorHeight,handheld=false}){
  const routes=[],paths=[...bukchonPaths.filter(p=>p.kind!=="road"&&p.kind!=="entrance"),
    ...courtyardRoutes.map(points=>({points}))].map((path,index)=>{
    const xs=path.points.map(p=>p.x),ys=path.points.map(p=>p.y);
    return {path,index,west:Math.min(...xs),east:Math.max(...xs),north:Math.min(...ys),south:Math.max(...ys),ready:false};
  });
  let nextBuild=0;
  const models=new Map();
  function update(clock,now,delta,anchor,sparse=false){
    const nearby=[];
    const range=sparse?31:handheld?46:66,limit=sparse?2:handheld?4:6;
    // Do not prepare routes until Bukchon can be seen. Their phases use the
    // shared room clock, so players arriving at different times see the same poses.
    if(anchor&&anchor.x>560&&anchor.y< -814){
      if(now>=nextBuild){
        nextBuild=now+200;
        const entry=paths.find(p=>!p.ready&&anchor.x>p.west-range&&anchor.x<p.east+range&&anchor.y>p.north-range&&anchor.y<p.south+range);
        if(entry){routes.push(...crowdRoutes(entry.path,entry.index));entry.ready=true;}
      }
      for(const route of routes){
        const dx=Math.max(route.west-anchor.x,0,anchor.x-route.east);
        const dy=Math.max(route.north-anchor.y,0,anchor.y-route.south);
        if(Math.hypot(dx,dy)>range)continue;
        for(const person of route.people){
          const pose=poseAt(route,person,clock),gap=length(anchor,pose);
          if(gap<=range)nearby.push({person,pose,gap});
        }
      }
    }
    nearby.sort((a,b)=>a.gap-b.gap||a.person.id-b.person.id);
    const visible=new Set();
    for(const {person,pose} of nearby.slice(0,limit)){
      let entry=models.get(person.id);
      if(!entry){
        const model=walkerModels.create(coats[person.id%coats.length],null,null,"bukchon-"+person.id);
        models.set(person.id,entry={model,lastSeen:now});
      }
      entry.lastSeen=now;visible.add(person.id);
      walkerModels.update(entry.model,{...pose,character:person.character,look:person.look},
        {now,clock,delta,floor:floorHeight(pose),turnEase:1-Math.exp(-delta*9)});
    }
    for(const [id,{model,lastSeen}] of models){
      if(visible.has(id))continue;
      model.group.visible=false;
      if(models.size<=limit+6&&now-lastSeen<1700)continue;
      walkerModels.dispose(model);models.delete(id);
    }
  }
  return {update};
}
