import {nodes,links} from "./visitor-paths.js";
import {BUS_SEATS,nextBusRide} from "./sejong-bus.js";

export const stops=nodes.map(([x,y,kind,ref])=>({x,y,kind,ref}));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function district({x,y}){
  if(y<-865)return x>690?"bukchon":"palace";
  if(y<-297)return "gwanghwamun";
  if(y<-80&&x>520)return "stream";
  if(y<65)return "avenue";
  return x>495?"cityHall":"deoksugung";
}
export function streetLine(points){
  let length=0;
  const ends=points.slice(1).map((p,i)=>(length+=distance(points[i],p)));
  return {points,ends,length};
}
export function onLine(line,metres){
  const last=line.ends.length-1;
  let i=0;while(i<last&&metres>line.ends[i])i++;
  const a=line.points[i],b=line.points[i+1],start=i?line.ends[i-1]:0;
  const t=Math.max(0,Math.min(1,(metres-start)/(line.ends[i]-start||1)));
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI};
}
const roads=stops.map(()=>[]),distances=new Map();
for(const [a,b,...via] of links){
  const points=[stops[a]];
  for(let i=0;i<via.length;i+=2)points.push({x:via[i],y:via[i+1]});
  points.push(stops[b]);
  roads[a].push({to:b,line:streetLine(points)});
  roads[b].push({to:a,line:streetLine([...points].reverse())});
}
function pathsTo(goal){
  if(distances.has(goal))return distances.get(goal);
  const costs=new Float64Array(stops.length).fill(Infinity),next=new Array(stops.length),done=new Uint8Array(stops.length);
  costs[goal]=0;
  for(;;){
    let best=Infinity,n=-1;
    for(let i=0;i<costs.length;i++)if(!done[i]&&costs[i]<best){n=i;best=costs[i];}
    if(n<0)break;
    done[n]=1;
    for(const {to,line} of roads[n]){
      const d=best+line.length;
      if(d>=costs[to])continue;
      costs[to]=d;next[to]=roads[to].find(edge=>edge.to===n);
    }
  }
  const result={costs,next};distances.set(goal,result);return result;
}
function random(seed){
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
const districts=stops.map(district),zones=[...new Set(districts)];
const byZone=zones.map(zone=>stops.map((_,i)=>i).filter(i=>districts[i]===zone));
const PERIOD=10800,groups=91;
const meetingPoints=[[464,298],[217,334],[548,220],[552,-154],[665,-143],[480,-545],[400,-862],[438,-1110],[727,-1258],[942,-1840]]
  .map(([x,y])=>stops.reduce((best,p,i)=>distance({x,y},p)<distance({x,y},stops[best])?i:best,0));
const interests=["shop","meal","seat","water","photo","cat"];
const cycleSpeed=4.7;
const terminals=Object.fromEntries(["busStop","bikeDock"].map(kind=>[kind,
  stops.flatMap((s,i)=>s.kind===kind?[i]:[])]));
function closestTerminals(kind,costs){
  return [...terminals[kind]].sort((a,b)=>costs[a]-costs[b]).slice(0,3);
}
// Each three-hour boundary supplies a reproducible rendezvous for late arrivals.
// Between boundaries each party picks goals, takes breaks and remembers recent stops.
export function createVisitorWalks(room){
  let seed=2166136261;
  for(const ch of String(room??"city"))seed=Math.imul(seed^ch.charCodeAt(0),16777619);
  let block=-1,parties=[],last=-1,due=0;
  function rendezvous(period){
    const rand=random((seed^Math.imul(period,2654435761))>>>0);
    const shuffle=list=>{const arr=[...list];for(let n=arr.length-1;n>0;n--){const j=Math.floor(rand()*(n+1));[arr[n],arr[j]]=[arr[j],arr[n]];}return arr;};
    const lanes=shuffle(byZone).map(shuffle),places=[];
    for(let i=0;i<groups;i++){const lane=lanes[i%lanes.length];places.push(lane[Math.floor(i/lanes.length)%lane.length]);}
    return shuffle(places);
  }
  function reset(period){
    block=period;due=0;
    const starts=rendezvous(period),ends=rendezvous(period+1);
    parties=starts.map((node,id)=>{
      const rand=random((seed^Math.imul(period+1,3266489917)^Math.imul(id+1,2654435761))>>>0);
      return {id,node,end:ends[id],pair:id%5===1||id%5===3,interest:interests[id%interests.length],
        speed:1.1+(id%9)*.052,rand,history:[node],goal:node,start:0,until:0,action:"look",arrived:true};
    });
  }
  function choose(p){
    const costs=pathsTo(p.node).costs;
    const occupied=new Map(),pressure=new Map();
    for(const q of parties)if(q!==p){
      occupied.set(q.goal,(occupied.get(q.goal)??0)+1);
      const size=q.pair?2:1;
      for(const area of [districts[q.goal],districts[q.node]])pressure.set(area,(pressure.get(area)??0)+size/2);
    }
    const far=p.rand()<.24,reach=far?650:160,adjacent=roads[p.node];
    let best=-Infinity,choice=adjacent[Math.floor(p.rand()*adjacent.length)].to;
    for(let i=0;i<24;i++){
      const n=i<4?adjacent[Math.floor(p.rand()*adjacent.length)].to:i<8?
        meetingPoints[Math.floor(p.rand()*meetingPoints.length)]:Math.floor(p.rand()*stops.length);
      if(n===p.node)continue;
      const crowd=pressure.get(districts[n])??0;
      const score=p.rand()*3.1-costs[n]/reach-(occupied.get(n)??0)*2.4-crowd*.24-Math.max(0,crowd-10)*.7
        -(p.history.includes(n)?3:0)+(p.interest===stops[n].kind?1.5:0)
        +(far&&districts[n]!==districts[p.node]?1.0:0);
      if(score>best){best=score;choice=n;}
    }
    return choice;
  }
  function chooseTrip(p,t){
    const start=pathsTo(p.node).costs,finish=pathsTo(p.goal).costs,direct=start[p.goal]/p.speed;
    if(districts[p.node]===districts[p.goal]||direct<175||p.rand()>.58)return null;
    const epoch=block*PERIOD*1000;
    const kinds=p.rand()<.48?["busStop","bikeDock"]:["bikeDock","busStop"];
    const size=p.pair?2:1;
    function available(index,board,exit){
      let count=size;
      for(const q of parties){
        const ride=q.trip?.ride;
        if(ride?.index===index&&board<ride.exit+3000&&exit>ride.board)count+=q.pair?2:1;
      }
      return count<=4;
    }
    for(const kind of kinds){
      let best=null,limit=direct*.96;
      for(const from of closestTerminals(kind,start))for(const to of closestTerminals(kind,finish)){
        if(from===to||districts[from]===districts[to])continue;
        const at=t+start[from]/p.speed;
        const ride=kind==="busStop"?nextBusRide(stops[from].ref,stops[to].ref,epoch+at*1000,available):null;
        if(kind==="busStop"&&!ride)continue;
        const done=ride?(ride.exit-epoch)/1000+3:at+4+pathsTo(to).costs[from]/cycleSpeed;
        const total=done-t+finish[to]/p.speed;
        if(total>=limit||done+pathsTo(p.end).costs[to]/p.speed+30>=PERIOD)continue;
        best={from,to,ride,stage:"approach"};limit=total;
      }
      if(best){
        if(best.ride){
          const ride=best.ride,occupied=new Set();
          for(const q of parties){
            const other=q.trip?.ride;
            if(other?.index===ride.index&&ride.board<other.exit+3000&&ride.exit+3000>other.board){
              for(const seat of other.seats)occupied.add(seat);
            }
          }
          ride.seats=[];
          for(let i=BUS_SEATS-1;i>=0&&ride.seats.length<size;i--)if(!occupied.has(i))ride.seats.push(i);
        }
        return best;
      }
    }
    return null;
  }
  function advanceTrip(p,t){
    const trip=p.trip,epoch=block*PERIOD;
    function follow(target,action,speed){
      p.edge=pathsTo(target).next[p.node];p.action=action;p.until=t+p.edge.line.length/speed;
    }
    if(trip.stage==="approach"){
      if(p.node!==trip.from){follow(trip.from,"walk",p.speed);return;}
      if(trip.ride){
        trip.stage="boarding";p.action="waitBus";p.until=Math.max(t,trip.ride.board/1000-epoch);return;
      }
      trip.heading=onLine(pathsTo(trip.to).next[p.node].line,0).heading;
      trip.stage="cycling";p.action="rentBike";p.until=t+2;return;
    }
    if(trip.stage==="cycling"){
      if(p.node!==trip.to){
        follow(trip.to,"cycle",cycleSpeed);
        trip.heading=onLine(p.edge.line,p.edge.line.length).heading;return;
      }
      trip.stage="done";p.action="returnBike";p.until=t+2;return;
    }
    if(trip.stage==="boarding"){trip.stage="aboard";p.action="boardBus";p.until=t+3;return;}
    if(trip.stage==="aboard"){trip.stage="alighting";p.action="bus";p.until=trip.ride.exit/1000-epoch;return;}
    if(trip.stage==="alighting"){trip.stage="done";p.action="leaveBus";p.until=t+3;return;}
    p.node=trip.to;p.arrived=true;p.trip=null;
  }
  function decide(p){
    const t=p.until;
    if(p.edge){p.node=p.edge.to;p.arrived=true;p.edge=null;p.history.push(p.node);if(p.history.length>6)p.history.shift();}
    p.start=t;
    if(p.trip){advanceTrip(p,t);if(p.trip)return;}
    const remaining=PERIOD-t,home=pathsTo(p.end);
    const returning=remaining<=home.costs[p.node]/p.speed+145;
    if(returning)p.goal=p.end;
    const reached=p.node===p.goal;
    const site=stops[p.node],rand=p.rand;
    if(returning&&reached){p.action="look";p.until=PERIOD;return;}
    if(p.arrived&&(reached||(!returning&&rand()<(site.kind ? .48 : .16)))){
      const amenity=site.kind&&!(site.kind in terminals);
      const useSite=amenity&&rand()<(site.kind===p.interest ? .94 : .77);
      p.action=useSite?site.kind:p.pair&&rand()<.46?"photo":rand()<.38?"cat":"look";
      const duration=p.action==="meal"?95:p.action==="shop"?27:p.action==="water"||p.action==="seat"?32:9;
      p.until=t+Math.min(duration*(.78+rand()*.85),remaining-home.costs[p.node]/p.speed-1);
      p.arrived=false;p.variant=Math.floor(rand()*0x1000000);
      return;
    }
    if(reached){
      p.goal=choose(p);p.trip=chooseTrip(p,t);
      if(p.trip){advanceTrip(p,t);return;}
    }
    p.edge=pathsTo(p.goal).next[p.node];
    if(p.node!==p.end&&(p.edge.line.length+home.costs[p.edge.to])/p.speed+1>=remaining){
      p.goal=p.end;p.edge=home.next[p.node];
    }else if(p.node===p.end&&(p.edge.line.length+home.costs[p.edge.to])/p.speed+1>=remaining){
      p.edge=null;p.action="look";p.until=PERIOD;return;
    }
    p.action="walk";p.until=t+p.edge.line.length/p.speed;
  }
  function at(clock){
    const seconds=clock/1000,period=Math.floor(seconds/PERIOD);
    let t=seconds-period*PERIOD;
    if(block!==period||t<last-2)reset(period);
    else t=Math.max(last,t);
    last=t;
    if(t>=due){
      for(;;){
        let first=null;for(const p of parties)if(!first||p.until<first.until)first=p;
        if(first.until>t){due=first.until;break;}
        decide(first);
      }
    }
    return {parties,t};
  }
  return {at};
}
