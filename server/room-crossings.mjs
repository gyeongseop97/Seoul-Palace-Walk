import {approachingCrosswalks} from "../public/sejong-bus.js";
import {createVisitorWalks,onLine} from "../public/visitor-walks.js";
import {visitorEdgePose} from "../public/visitor-crossings.js";
import {cheonggyeLevel} from "../public/cheonggye-layout.js";

export const selectYields=(db,room,now)=>db.prepare(
  "SELECT passage,brake FROM bus_crossing_yields WHERE room=? AND ends>?"
).bind(room,now);
export const yieldEntries=rows=>rows.map(({passage,brake})=>[passage,brake]);

function needsCrossing(p,{a,b,width}){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),x=p.x-a.x,y=p.y-a.y;
  const along=(x*dx+y*dy)/length;
  if(Math.abs(x*dy-y*dx)/length>width/2||along< -1.8||along>length+1.8)return false;
  if(along>1&&along<length-1)return true;
  const angle=(p.heading??0)*Math.PI/180;
  return (Math.sin(angle)*dx-Math.cos(angle)*dy)/length*(along<length/2?1:-1)>.5;
}

// Cache the same time-seeded visitors the game draws. Eviction only discards
// the simulation cursor; it cannot change the decisions saved for a room.
const rooms=new Map();
function walkingVisitors(room,now,approaches){
  let walks=rooms.get(room);
  if(!walks){
    if(rooms.size>=24)rooms.delete(rooms.keys().next().value);
    walks=createVisitorWalks(room);rooms.set(room,walks);
  }
  const {parties,t}=walks.at(now),points=[];
  for(const p of parties){
    if(p.action!=="walk"||!p.edge)continue;
    const line=p.edge.line,span=p.until-p.start,age=t-p.start;
    const approx=onLine(line,line.length*age/span);
    if(!approaches.some(({crossing:{a,b}})=>Math.abs(approx.x-(a.x+b.x)/2)<Math.abs(b.x-a.x)/2+30&&
      Math.abs(approx.y-(a.y+b.y)/2)<Math.abs(b.y-a.y)/2+30))continue;
    const {centre}=visitorEdgePose(line,Math.round(now-age*1000),span,age);
    points.push(centre);
  }
  return points;
}

export async function roomYields(db,room,now,existing,walkers){
  const known=new Map(yieldEntries(existing));
  const pending=approachingCrosswalks(now).filter(c=>!known.has(c.key));
  if(!pending.length)return [...known];
  const pedestrians=walkers.filter(p=>!p.bus&&!p.up&&p.seat==null&&!p.bikeRide&&(!p.bike||p.bike.parked)&&
    (cheonggyeLevel(p)??0)>-1.5);
  const visitors=walkingVisitors(room,now,pending);
  const requests=pending.filter(c=>pedestrians.some(p=>needsCrossing(p,c.crossing))||visitors.some(p=>needsCrossing(p,c.crossing)));
  if(!requests.length)return [...known];
  // Concurrent polls agree on the first braking point, even on separate servers.
  const results=await db.batch([...requests.map(c=>db.prepare(
    "INSERT OR IGNORE INTO bus_crossing_yields (room,passage,brake,ends) VALUES (?,?,?,?)"
  ).bind(room,c.key,c.brake,c.ends)),selectYields(db,room,now)]);
  return yieldEntries(results.at(-1).results);
}
