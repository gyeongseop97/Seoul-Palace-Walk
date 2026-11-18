import {BUS_COUNT,BUS_LENGTH,BUS_WIDTH,busAt} from "./sejong-bus.js";
import {streetCrossings} from "./bus-crossings.js";

let sampled=-Infinity,vehicles=[];
export function approachingTraffic(point,time){
  if(time<sampled||time-sampled>=100){
    sampled=time;vehicles=[];
    for(let i=0;i<BUS_COUNT;i++){
      const bus=busAt(i,time);
      if(!bus?.traveling)continue;
      const next=busAt(i,time+1000),angle=bus.heading*Math.PI/180;
      vehicles.push({bus,fx:Math.sin(angle),fy:-Math.cos(angle),speed:Math.hypot(next.x-bus.x,next.y-bus.y)});
    }
  }
  let closest=null;
  for(const {bus,fx,fy,speed} of vehicles){
    const dx=point.x-bus.x,dy=point.y-bus.y,side=dx*fy-dy*fx,front=dx*fx+dy*fy-BUS_LENGTH/2;
    if(Math.abs(side)>BUS_WIDTH/2+.55||front< -BUS_LENGTH-.4||front>Math.max(8,speed*2.8))continue;
    if(bus.yielding&&bus.yieldLeft>850&&front>.1)continue;
    const arrival=Math.max(0,front)/Math.max(.1,speed)+(bus.yieldLeft||0)/1000;
    if(!closest||arrival<closest.arrival)closest={bus,side,front,fx,fy,arrival,imminent:arrival<.65};
  }
  return closest;
}

export function clearingLane(hit,vx,vy){
  const lateral=vx*hit.fy-vy*hit.fx;
  if(Math.abs(lateral)<.1)return false;
  const remaining=BUS_WIDTH/2+.55-hit.side*Math.sign(lateral);
  return remaining/Math.abs(lateral)+.1<hit.arrival;
}

export function sidewalkRefuge(point,bus,valid){
  const distance=p=>Math.hypot(p.x-point.x,p.y-point.y),candidates=[];
  for(const {a,b} of streetCrossings){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    if(!len||Math.min(distance(a),distance(b))>48)continue;
    const u=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(len*len)));
    if(distance({x:a.x+u*dx,y:a.y+u*dy})>8)continue;
    for(const d of [1.2,2.3,.25,0]){
      candidates.push({x:a.x-d*dx/len,y:a.y-d*dy/len},{x:b.x+d*dx/len,y:b.y+d*dy/len});
    }
  }
  candidates.sort((a,b)=>distance(a)-distance(b));
  const kerb=candidates.find(valid);
  if(kerb)return kerb;
  const angle=bus.heading*Math.PI/180;
  for(let d=3;d<=16;d++)for(const sign of [-1,1]){
    const q={x:point.x+sign*Math.cos(angle)*d,y:point.y+sign*Math.sin(angle)*d};
    if(valid(q))return q;
  }
  return null;
}
