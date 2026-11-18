import {eastCurb, eastRoadWidth, plazaAt} from "./plaza-layout.js";
import {uijeongbuBusBerth} from "./uijeongbu-layout.js";
import {routeCrossings} from "./bus-crossings.js";

export const BUS_COUNT=11;
export const BUS_SEATS=8;
export const BUS_DWELL_MS=10_000;
export const BUS_BOARD_REACH=4.2;
export const BUS_FLOOR=.71;
export const BUS_WIDTH=2.55;
export const BUS_LENGTH=10.66;
const epoch=Date.UTC(2026,0,1);

const pose=(x,y,heading)=>({x,y,heading});
const point=(x,y)=>({x,y});
const plazaEast=(north,margin=3.45)=>plazaAt(eastCurb(north)+eastRoadWidth-margin,north);
const plazaWest=(north,margin=3.45)=>plazaAt(eastCurb(north)+margin,north);
const midpoint=358;
const north=plazaEast(midpoint,1.78),south=plazaWest(midpoint,1.78);
const eastIsland=uijeongbuBusBerth;
const bukchonStop={x:762.7,y:-1429};

// Shelter and passenger positions are on the pavement, offset from the front right door.
// Opposite-direction plaza stops are separate berths on the two sides of the avenue.
export const busStops=[
  {id:"deoksugung",name:"시청앞·덕수궁 정류장",direction:"광화문광장 · 경복궁 방면",
    berth:pose(484.0,205,180),board:pose(480.4,208.2,90),exit:pose(478.4,208.7,270),shelter:pose(476.9,204.5,90)},
  {id:"seoul-plaza",name:"서울광장·환구단 정류장",direction:"광화문광장 · 경복궁 방면",
    berth:pose(516.5,247,0),board:pose(521.2,243.75,270),exit:pose(523.4,242.8,90),shelter:pose(524.8,249.4,270)},
  {id:"cheonggye-north",name:"청계광장 정류장",direction:"광화문광장 · 경복궁 방면",
    berth:pose(514.55,-158,0),board:pose(520.2,-161.25,270),exit:pose(522.3,-161.9,90),shelter:pose(523.6,-157.4,270)},
  {id:"plaza-north",name:"세종문화회관·세종로공원 건너편",direction:"경복궁 방면",
    berth:pose(north.x,north.y,0),board:pose(north.x+3.7,north.y-3.25,270),
    exit:pose(north.x+5.7,north.y-3.7,90),shelter:pose(north.x+6.1,north.y+.7,270)},
  {id:"gyeongbokgung",name:"경복궁·의정부지 정류장",direction:"열린송현 · 삼청동 방면",
    berth:pose(eastIsland.x,eastIsland.y,90),board:pose(eastIsland.x+3.26,eastIsland.y+4.15,0),
    exit:pose(eastIsland.x+3.85,eastIsland.y+6.2,180),shelter:pose(eastIsland.x-.8,eastIsland.y+5.65,0)},
  {id:"songhyeon-north",name:"열린송현·국립현대미술관 정류장",direction:"삼청동 · 북촌 방면",
    berth:pose(711.3,-1109,1),board:pose(718.2,-1112.25,270),exit:pose(720.05,-1112.45,90),shelter:pose(720.3,-1102.8,270)},
  {id:"bukchon-upper",name:"삼청로·북촌 정류장",direction:"삼청동 돌계단길 방면",
    berth:pose(bukchonStop.x,bukchonStop.y,17),board:pose(770.2,-1431.5,287),
    exit:pose(771.9,-1431.9,107),shelter:pose(771.4,-1426.8,287)},
  {id:"bukchon-terminal",name:"삼청동 돌계단길 정류장",direction:"광화문광장 · 덕수궁 방면",
    berth:pose(937.1,-1858,8),board:pose(942.7,-1861.2,278),
    exit:pose(944.2,-1862.8,98),shelter:pose(946.3,-1855.3,278)},
  {id:"songhyeon-south",name:"열린송현·국립현대미술관 건너편",direction:"광화문광장 · 덕수궁 방면",
    berth:pose(704.9,-1144.5,181),board:pose(698.5,-1141.25,90),exit:pose(699.35,-1139.2,270),shelter:pose(695.8,-1145.1,90)},
  {id:"plaza-south",name:"세종문화회관·세종로공원 정류장",direction:"청계광장 · 덕수궁 방면",
    berth:pose(south.x,south.y,180),board:pose(south.x-3.5,south.y+3.25,90),
    exit:pose(south.x-5.6,south.y+3.7,270),shelter:pose(south.x-6.1,south.y-.7,90)},
  {id:"cheonggye-south",name:"청계광장 정류장 건너편",direction:"시청 · 덕수궁 방면",
    berth:pose(481.35,-158,180),board:pose(476.8,-153.9,90),exit:pose(476.55,-151.65,270),shelter:pose(472.8,-158.6,90)}
];
const [deoksugung,seoulPlaza,cheonggyeNorth,plazaNorth,gyeongbokgung,songhyeonNorth,bukchon,bukchonTerminal,
  songhyeonSouth,plazaSouth,cheonggyeSouth]=busStops;
const stopIndex=new Map(busStops.map(stop=>[stop.id,stop]));
export const busStopById=id=>stopIndex.get(id)??null;

// The northern turn is at the end of Samcheong-ro, beyond the last stop.
const itineraries=[
  {travelMs:21_000,points:[deoksugung.berth,point(484,222),point(487.4,247),point(490.3,278),point(490.7,297),
    point(493.4,305.2),point(502.8,309),point(511.6,306.6),point(516.3,299.1),point(516.1,285),point(516.5,259),seoulPlaza.berth]},
  {travelMs:33_000,points:[seoulPlaza.berth,point(516.5,235),point(513.3,215),
    point(513.3,135),point(512.5,-70),point(512.6,-134),point(514.55,-147),cheonggyeNorth.berth]},
  {travelMs:40_000,points:[cheonggyeNorth.berth,point(514.55,-170),point(512.3,-190),point(512.2,-240),
    point(513.6,-292),point(515.3,-301),plazaEast(16),plazaEast(131),
    plazaEast(239),plazaEast(290),plazaEast(335),point(north.x,north.y+10),plazaNorth.berth]},
  {travelMs:39_000,points:[plazaNorth.berth,point(north.x,north.y-11),plazaEast(386),plazaEast(440),plazaEast(476,5.8),
    plazaEast(505,7.0),plazaEast(518,5.1),plazaAt(33.3,529.8),plazaAt(53,544),plazaAt(74,554),
    plazaAt(103,561),plazaAt(138,566.6),gyeongbokgung.berth]},
  {travelMs:38_000,points:[gyeongbokgung.berth,plazaAt(184,573),plazaAt(208,578.2),plazaAt(220,581.4),
    point(709.5,-890),point(714.5,-904),point(716.2,-925),point(713,-950),point(710.1,-990),
    point(710.1,-1075),point(711.15,-1097),songhyeonNorth.berth]},
  {travelMs:50_000,points:[songhyeonNorth.berth,point(711.52,-1122),point(710.8,-1149),point(713.4,-1203),point(716,-1242),point(718.9,-1270),
    point(729,-1306),point(741.1,-1350),point(749.5,-1382),bukchon.berth]},
  {travelMs:58_000,points:[bukchon.berth,point(772.4,-1452.5),point(778,-1464.8),point(814.5,-1489.6),
    point(843.1,-1511),point(874.3,-1554),point(894.2,-1590.63),point(914.9,-1626.15),point(914.3,-1679.43),
    point(920.5,-1731.6),point(933.5,-1831.5),bukchonTerminal.berth]},
  {travelMs:91_000,points:[bukchonTerminal.berth,point(939.2,-1872),point(938.5,-1876.7),point(936.4,-1880.5),
    point(934.2,-1882.2),point(932.7,-1880.4),point(932.3,-1877.8),point(932.1,-1874),point(931.3,-1866),point(929.7,-1855),
    point(927.1,-1831.5),point(914.3,-1731.6),point(908.1,-1679.43),point(908.6,-1626.15),
    point(887.9,-1590.63),point(868.1,-1554),point(836.9,-1511),point(805.5,-1490.5),point(769,-1468),
    point(765.1,-1453),point(743,-1382),point(734.8,-1350),point(722.8,-1306),point(712.7,-1270),
    point(709.8,-1242),point(707.4,-1203),point(705.1,-1157),songhyeonSouth.berth]},
  {travelMs:82_000,points:[songhyeonSouth.berth,point(704.7,-1132),point(703.7,-1075),point(703.5,-995),
    point(705.5,-955),point(709.2,-929),point(710.1,-912),point(706,-898),point(699.8,-886),
    plazaAt(201,585),plazaAt(171,581),plazaAt(109,574),plazaAt(77,565.8),plazaAt(44,551.1),plazaAt(23,542),
    plazaAt(13,534),plazaAt(12,526),
    plazaWest(513),plazaWest(481),plazaWest(441),plazaWest(397),point(south.x,south.y-11),plazaSouth.berth]},
  {travelMs:45_000,points:[plazaSouth.berth,point(south.x,south.y+11),plazaWest(329),plazaWest(285),plazaWest(238),
    plazaWest(125),plazaWest(22),point(493.2,-286),point(486.9,-247),point(484.1,-187),point(481.35,-170),cheonggyeSouth.berth]},
  {travelMs:32_000,points:[cheonggyeSouth.berth,point(481.35,-146),point(484.4,-124),point(484.4,-110),
    point(485.9,-34),point(488.7,61),point(489.6,113),point(488.3,150),point(484.8,180),point(484,194),deoksugung.berth]}
];
export const BUS_CYCLE_MS=itineraries.reduce((total,{travelMs})=>total+travelMs+BUS_DWELL_MS,0);
export const BUS_DEPARTURE_MS=BUS_CYCLE_MS/BUS_COUNT;

// The Dongsipjagak junction box, from the end of Sajik-ro to the kerbs of each corner, then
// the fork and the northern turn on Samcheong-ro.
export const bukchonBusRoads=[
  [[655.8,-859.7],[681.8,-864.7],[706.4,-870.4],[714,-873.6],[730,-873.6],[745,-876.2],[757,-879.5],
    [757,-911.2],[746,-914],[739.9,-917.3],[729.7,-919.2],[724.4,-921.8],[718.9,-922.2],[718.9,-901],[655,-899]],
  [[762,-1458],[777,-1458],[781,-1470],[785,-1486],[786,-1505],
    [780,-1514],[762,-1514],[755,-1505],[755,-1489],[758,-1472]],
  [[923,-1853],[929,-1853],[934,-1864],[943,-1870],[946,-1878],[946,-1885],
    [941,-1889],[923,-1889],[916,-1884],[916,-1874]]
].map(ring=>ring.map(([x,y])=>point(x,y)));

const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const interpolate=(a,b,t)=>point(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
const heading=(a,b)=>(Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI+360)%360;

// Short quadratic corner segments keep turns rounded while maintaining the street lane.
// The length table gives server and clients the same arc-length position and heading.
function buildPath(points){
  const path=[{...points[0],distance:0}];
  function append(p){
    const previous=path.at(-1),length=distance(previous,p);
    if(length>.001)path.push({...p,distance:previous.distance+length});
  }
  for(let i=1;i<points.length-1;i++){
    const from=points[i-1],centre=points[i],to=points[i+1];
    const previous=distance(from,centre),next=distance(centre,to);
    const cut=Math.min(5.4,previous*.28,next*.28);
    const approach=interpolate(centre,from,cut/previous),leave=interpolate(centre,to,cut/next);
    append(approach);
    for(let j=1;j<=8;j++){
      const t=j/8;
      append(interpolate(interpolate(approach,centre,t),interpolate(centre,leave,t),t));
    }
  }
  append(points.at(-1));
  return path;
}

let stopOffset=0;
const route=itineraries.map(leg=>{
  const offset=stopOffset;
  stopOffset+=BUS_DWELL_MS+leg.travelMs;
  const path=buildPath(leg.points),length=path.at(-1).distance,holds=[];
  for(const {distance,crossing} of routeCrossings(path)){
    const at=distance-BUS_LENGTH/2-crossing.width/2-.8;
    if(at>5&&at<length-6&&at-(holds.at(-1)?.at??-Infinity)>12)holds.push({at,crossing});
  }
  const wait=holds.length?Math.min(4800,leg.travelMs*.20/holds.length):0;
  const moving=leg.travelMs-wait*holds.length;
  let last=0,start=0;
  const segments=[...holds,{at:length}].map(({at,crossing})=>{
    const duration=moving*(at-last)/length,end=start+duration+(crossing?wait:0);
    const part={start,from:last,to:at,duration,end,crossing};
    start=end;last=at;return part;
  });
  return {...leg,offset,path,segments};
});
const cyclePhase=(time,offset,period)=>((time-epoch-offset)%period+period)%period;
const laneSegments=route.flatMap(leg=>leg.path.slice(1).map((b,i)=>[leg.path[i],b]));
export function busLaneIntersections(points){
  const result=[];let walked=0;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    for(const [p,q] of laneSegments){
      if(Math.max(a.x,b.x)<Math.min(p.x,q.x)||Math.min(a.x,b.x)>Math.max(p.x,q.x)||
        Math.max(a.y,b.y)<Math.min(p.y,q.y)||Math.min(a.y,b.y)>Math.max(p.y,q.y))continue;
      const sx=q.x-p.x,sy=q.y-p.y,det=dx*sy-dy*sx;if(Math.abs(det)<.001)continue;
      const x=p.x-a.x,y=p.y-a.y,t=(x*sy-y*sx)/det,u=(x*dy-y*dx)/det;
      if(t>=0&&t<=1&&u>=0&&u<=1)result.push(walked+t*length);
    }
    walked+=length;
  }
  return result.sort((a,b)=>a-b).filter((d,i,arr)=>!i||d-arr[i-1]>2);
}
function pointAtDistance(path,target){
  if(target<=0)return path[0];
  if(target>=path.at(-1).distance)return path.at(-1);
  let low=1,high=path.length-1;
  while(low<high){
    const middle=(low+high)>>1;
    if(path[middle].distance<target)low=middle+1;else high=middle;
  }
  const from=path[low-1],to=path[low];
  return interpolate(from,to,(target-from.distance)/(to.distance-from.distance));
}

function traveled(elapsed,duration){
  const ramp=Math.min(4_100,duration*.18),cruise=duration-ramp;
  if(elapsed<=ramp)return elapsed*elapsed/(2*ramp*cruise);
  const left=duration-elapsed;
  if(left<ramp)return 1-left*left/(2*ramp*cruise);
  return (elapsed-ramp*.5)/cruise;
}

export function busAt(index,time){
  if(!Number.isInteger(index)||index<0||index>=BUS_COUNT||!Number.isFinite(time))return null;
  let phase=cyclePhase(time,-index*BUS_DEPARTURE_MS,BUS_CYCLE_MS);
  const id=`sejong-bus-${index+1}`;
  for(const [legIndex,leg] of route.entries()){
    const stop=busStops[legIndex],nextStopId=busStops[(legIndex+1)%busStops.length].id;
    if(phase<BUS_DWELL_MS){
      return {id,index,...stop.berth,stopId:stop.id,remaining:BUS_DWELL_MS-phase,elapsed:phase,
        traveling:false,nextStopId,eta:0};
    }
    phase-=BUS_DWELL_MS;
    if(phase<leg.travelMs){
      const length=leg.path.at(-1).distance,part=leg.segments.find(s=>phase<s.end)??leg.segments.at(-1);
      const elapsed=phase-part.start,holding=elapsed>=part.duration&&part.crossing;
      const metres=part.from+(part.to-part.from)*traveled(Math.min(elapsed,part.duration),part.duration);
      const p=pointAtDistance(leg.path,metres);
      const a=pointAtDistance(leg.path,Math.max(0,metres-.94));
      const b=pointAtDistance(leg.path,Math.min(length,metres+.94));
      return {id,index,...p,heading:heading(a,b),stopId:null,remaining:0,elapsed:phase,
        traveling:true,yielding:Boolean(holding),yieldLeft:holding?part.end-phase:0,nextStopId,eta:leg.travelMs-phase};
    }
    phase-=leg.travelMs;
  }
  return null;
}

export function busStopTimes(stopId,time){
  const index=busStops.findIndex(stop=>stop.id===stopId);
  if(index<0||!Number.isFinite(time))return null;
  const phase=cyclePhase(time,route[index].offset,BUS_DEPARTURE_MS);
  return {
    arrivalMs:BUS_DEPARTURE_MS-phase,
    departureMs:phase<BUS_DWELL_MS?BUS_DWELL_MS-phase:null
  };
}

export function busWait(stopId,time){
  const schedule=busStopTimes(stopId,time);
  if(!schedule)return null;
  return schedule.departureMs===null?schedule.arrivalMs:0;
}

// Times refer to the same vehicle and direction as busAt(), including the
// northern turnaround. Leave enough dwell time for the whole party to board.
export function nextBusRide(fromId,toId,time,available=()=>true){
  const from=busStops.findIndex(stop=>stop.id===fromId),to=busStops.findIndex(stop=>stop.id===toId);
  if(from<0||to<0||from===to)return null;
  const travel=(route[to].offset-route[from].offset+BUS_CYCLE_MS)%BUS_CYCLE_MS;
  let best=null;
  for(let index=0;index<BUS_COUNT;index++){
    const phase=cyclePhase(time,route[from].offset-index*BUS_DEPARTURE_MS,BUS_CYCLE_MS);
    const arrival=phase+4200<BUS_DWELL_MS?time-phase:time+BUS_CYCLE_MS-phase;
    const board=Math.max(time+400,arrival+750),exit=arrival+travel+600;
    if((!best||board<best.board)&&available(index,board,exit+3000))best={index,board,exit};
  }
  return best;
}

// +Z faces forward in the bus model; negative local X is the curb side in right-hand traffic.
export function busLocalPose(bus,side,forward){
  const theta=(180-bus.heading)*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta);
  return pose(bus.x+side*c+forward*s,bus.y-side*s+forward*c,bus.heading);
}

export function busSeatOffset(seat){
  if(!Number.isInteger(seat)||seat<0||seat>=BUS_SEATS)return null;
  return {side:seat%2===0?.66:-.66,forward:1.32-Math.floor(seat/2)*1.15};
}

export function busSeatPose(bus,seat){
  const offset=busSeatOffset(seat);
  return bus&&offset?busLocalPose(bus,offset.side,offset.forward):null;
}

export function nearBus(position,time,reach=BUS_BOARD_REACH){
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.y)||!Number.isFinite(reach)||reach<=0)return null;
  let nearest=null,minimum=reach;
  for(let index=0;index<BUS_COUNT;index++){
    const bus=busAt(index,time),stop=busStopById(bus?.stopId);
    if(!stop)continue;
    const gap=distance(position,stop.board);
    if(gap<=minimum){nearest={bus,stop};minimum=gap;}
  }
  return nearest;
}
