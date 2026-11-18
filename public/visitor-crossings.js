import {busLaneIntersections} from "./sejong-bus.js";
import {onLine} from "./visitor-walks.js";
import {approachingTraffic} from "./crossing-traffic.js";

const laneCrossings=new WeakMap();
function crossingPace(line,start,span){
  if(!laneCrossings.has(line))laneCrossings.set(line,busLaneIntersections(line.points));
  const keys=[[0,0]],speed=line.length/span;
  for(const at of laneCrossings.get(line)){
    const before=at-3.4,after=at+3.4,last=keys.at(-1);
    if(before<=last[1]||after>=line.length)continue;
    const arrive=last[0]+(before-last[1])/((line.length-last[1])/(span-last[0]));
    const cross=(after-before)/speed;
    const latest=span-cross-(line.length-after)/(speed*1.65);
    let delay=0;
    while(arrive+delay<latest&&[0,.25,.5,.75,1].some(f=>
      approachingTraffic(onLine(line,before+(after-before)*f),start+(arrive+delay+cross*f)*1000,true)))delay+=.5;
    if(delay>0&&arrive+delay<=latest)keys.push([arrive,before],[arrive+delay,before],[arrive+delay+cross,after]);
  }
  keys.push([span,line.length]);return keys;
}

const passageTimes=new WeakMap();
export function visitorEdgePose(line,began,span,age){
  let trips=passageTimes.get(line);
  if(!trips){trips=new Map();passageTimes.set(line,trips);}
  let pace=trips.get(began);
  if(!pace){
    pace=crossingPace(line,began,span);
    if(trips.size>=8)trips.delete(trips.keys().next().value);
    trips.set(began,pace);
  }
  const found=pace.findIndex(([t])=>t>=age);
  const next=found<0?pace.length-1:Math.max(1,found),[a,x]=pace[next-1],[b,y]=pace[next];
  const metres=x+(y-x)*Math.max(0,Math.min(1,(age-a)/(b-a||1)));
  return {centre:onLine(line,metres),progress:metres/line.length,stepping:y>x};
}
