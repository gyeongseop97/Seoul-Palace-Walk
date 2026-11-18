import {nodes,links} from "./visitor-paths.js";

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
const PERIOD=10800,groups=42;
const interests=["shop","meal","seat","water","photo","cat"];
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
      const n=i<4?adjacent[Math.floor(p.rand()*adjacent.length)].to:Math.floor(p.rand()*stops.length);
      if(n===p.node)continue;
      const crowd=pressure.get(districts[n])??0;
      const score=p.rand()*3.1-costs[n]/reach-(occupied.get(n)??0)*2.4-crowd*.24-Math.max(0,crowd-10)*.7
        -(p.history.includes(n)?3:0)+(p.interest===stops[n].kind?1.5:0)
        +(far&&districts[n]!==districts[p.node]?1.0:0);
      if(score>best){best=score;choice=n;}
    }
    return choice;
  }
  function decide(p){
    const t=p.until;
    if(p.edge){p.node=p.edge.to;p.arrived=true;p.edge=null;p.history.push(p.node);if(p.history.length>6)p.history.shift();}
    p.start=t;
    const remaining=PERIOD-t,home=pathsTo(p.end);
    const returning=remaining<=home.costs[p.node]/p.speed+145;
    if(returning)p.goal=p.end;
    const reached=p.node===p.goal;
    const site=stops[p.node],rand=p.rand;
    if(returning&&reached){p.action="look";p.until=PERIOD;return;}
    if(p.arrived&&(reached||(!returning&&rand()<(site.kind ? .48 : .16)))){
      const useSite=site.kind&&rand()<(site.kind===p.interest ? .94 : .77);
      p.action=useSite?site.kind:p.pair&&rand()<.46?"photo":rand()<.38?"cat":"look";
      const duration=p.action==="meal"?95:p.action==="shop"?27:p.action==="water"||p.action==="seat"?32:9;
      p.until=t+Math.min(duration*(.78+rand()*.85),remaining-home.costs[p.node]/p.speed-1);
      p.arrived=false;p.variant=Math.floor(rand()*0x1000000);
      return;
    }
    if(reached)p.goal=choose(p);
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
