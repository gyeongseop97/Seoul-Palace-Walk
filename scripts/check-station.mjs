import {dispatchLift} from "../public/lift-dispatch.js";
import {boardingIslands,liftBanks,setStationLifts,outdoorRailBlocks,railHeight,railPoint,railStepAllowed,liftLanding,liftAt,approachAt,approachRoute,subwayExit,stationApproaches} from "../public/station-levels.js";
import assert from "node:assert/strict";
import {gatePose} from "../public/station-approach-plan.js";
import {stationTerraces} from "../public/station-terraces.js";
import {stationBuildings} from "../public/station-data.js";
import {groundIndex} from "../public/ground-index.js";
import {addObstacle,clearSegment,loftStep,planWalk,walkable} from "../public/layout.js";
import {registerStation,stationGround,stationSites} from "../public/station-layout.js";
import {ktxCoach,railCounters,railPlatform,railRooms,registerRailFurniture,seatRows,stationHall,terminalDoors} from "../public/rail-station-layout.js";
import {interiorAt} from "../public/interior-layout.js";
import {registerDiningNavigation} from "../public/dining-layout.js";
import {stationDining} from "../public/dining-data.js";
import {cultureVenues,cultureFrontDoors} from "../public/culture-station-layout.js";
import {metroInsidePoint,westExit,rearMarketExit} from "../public/station-levels.js";
import {expandedSubwayStops,registerExpandedSubway} from "../public/subway-expansion.js";
import {busAt,busStops,BUS_CYCLE_MS} from "../public/sejong-bus.js";

const seats=[];
registerStation();
registerExpandedSubway();
registerDiningNavigation(seats,[stationDining]);
registerRailFurniture(addObstacle,seats);
function reachable(from,to,label){
  const end=planWalk(from,to).at(-1);
  assert(end&&Math.hypot(end.x-to.x,end.y-to.y)<.6,label);
}
const square=stationSites.find(site=>site.name==="서울역광장");
for(const door of terminalDoors)reachable(square,door,"광장에서 역사 출입문까지");
const transfer=busStops.find(s=>s.id==="station-transfer");
reachable(square,transfer.board,"광장에서 지정 횡단보도를 거쳐 버스 승강섬까지");
for(const v of [...railRooms,stationDining]){
  assert.equal(interiorAt(v.insideSpawn.x,v.insideSpawn.y),v.id);
  assert.equal(interiorAt(v.outsideDoor.x,v.outsideDoor.y),v.parent??null);
  reachable(v.insideSpawn,v.insideDoor,v.name+" 출구");
}
for(const p of [...railCounters,railPlatform.outsideDoor,stationDining.outsideDoor])reachable(stationHall.insideSpawn,p,p.name??"층간 이동");
reachable(railPlatform.insideSpawn,ktxCoach.outsideDoor,"승강장에서 열차 문까지");
const coachBenches=seats.filter(s=>interiorAt(s.x,s.y)===ktxCoach.id);
assert.equal(coachBenches.length,2*seatRows.length);
for(const bench of coachBenches)for(const slot of bench.slots){
  assert(walkable(slot.approach.x,slot.approach.y));
  reachable(ktxCoach.insideSpawn,slot.approach,"KTX 좌석 통로");
}
for(const [u,z,h] of [[0,0,0],[0,-38,-3.15],[0,-60,-6.3],[-16,-38,2.55],[-24,-59,5.1],[-20,-94,9.6],[-70,-40,-10.8],[-28,28,-3.15],...boardingIslands.map(s=>[s.x,70,-6.3]),[-35,-10.5,2.55],[-36,-27,5.1],[-28,-124,9.6],[25,-10,0]]){
  const p=railPoint(u,z);assert(Math.abs(railHeight(p.x,p.y)-h)<.001);reachable(stationHall.insideSpawn,p,"연속 보행 "+u+","+z);
}
const shortcut=[railPoint(0,-140),railPoint(0,-160),railPoint(-75,-160),railPoint(-75,-40),metroInsidePoint(4)];
for(let i=1;i<shortcut.length;i++)reachable(shortcut[i-1],shortcut[i],"4번 승강장 전철 직통환승");
assert.equal(railHeight(stationHall.center.x+28,stationHall.center.y),0);
assert.equal(railHeight(stationHall.center.x+29,stationHall.center.y),null);
for(const bank of liftBanks){
  let time=100000;
  const first=bank.stops[0].floor,last=bank.stops.at(-1).floor;
  let stops=dispatchLift(bank,[],first,time);
  setStationLifts({[bank.id]:stops});
  time=stops.at(-1).at+850;
  assert(railStepAllowed(liftLanding(first,bank),bank.center,time));
  stops=dispatchLift(bank,stops,last,time);setStationLifts({[bank.id]:stops});
  assert.deepEqual(stops.map(s=>s.floor),[first,last]);
  assert(!railStepAllowed(liftLanding(last,bank),bank.center,time));
  const arrived=stops.at(-1).at;
  assert(liftAt(arrived-1000,bank).moving);
  assert(railStepAllowed(liftLanding(last,bank),bank.center,arrived+800));
  assert.equal(liftAt(arrived+86400000,bank).floor,last);
  assert.equal(liftAt(arrived+86400000,bank).open,0);
}
setStationLifts({});
for(const s of stationApproaches.filter(s=>["stairs","escalator"].includes(s.kind))){
  const p=(t,u)=>({x:s.a[0]+s.ux*t-s.uy*u,y:s.a[1]+s.uy*t+s.ux*u}),m=s.len/2;
  assert(outdoorRailBlocks(p(m,s.w/2-1),p(m,s.w/2+.6)));
  if(s.kind==="escalator"||s.w>10)assert(outdoorRailBlocks(p(m,-.7),p(m,.7)));
  assert(!outdoorRailBlocks(p(-.8,s.w/4),p(s.len+.8,s.w/4)));
}
assert(!railStepAllowed(railPoint(.1,-38),railPoint(1.6,-38)),"실내 계단과 에스컬레이터 사이 난간");
assert(railStepAllowed(railPoint(1.6,-38),railPoint(1.6,-37)),"실내 에스컬레이터 진행 방향");
// Crossing the vault must work from either approach while the masonry remains solid.
const gatePoint=(u,v)=>({x:gatePose.x+u*Math.cos(gatePose.angle)+v*Math.sin(gatePose.angle),
  y:gatePose.y-u*Math.sin(gatePose.angle)+v*Math.cos(gatePose.angle)});
for(const u of [-2.6,0,2.6]){
  const a=gatePoint(u,-17),b=gatePoint(u,17);
  assert(clearSegment(a,b)&&clearSegment(b,a),"홍예문 양방향 보행");
}
assert(!clearSegment(gatePoint(5,-17),gatePoint(5,17)),"석축 충돌");
const walls=groundIndex(stationBuildings);
for(const {rings} of stationTerraces){
  const deck=groundIndex([{kind:"deck",rings}]),xs=rings[0].map(p=>p[0]),ys=rings[0].map(p=>p[1]);
  for(let x=Math.min(...xs);x<Math.max(...xs);x+=.75){
    for(let y=Math.min(...ys);y<Math.max(...ys);y+=.75)if(deck(x,y))assert(!walls(x,y),"광장을 덮는 건물 "+x+","+y);
  }
}
let walker={x:40,y:1443.3,up:false};
for(const [x,y] of [[37.5,1445.3],[12.3,1445.9],[10,1450],...terminalDoors.slice().reverse().map(p=>[p.x,p.y]),[27,1487.2],[33.5,1499.8]]){
  const start=walker,n=Math.ceil(Math.hypot(start.x-x,start.y-y)/.15);
  for(let i=1;i<=n;i++){
    const px=start.x+(x-start.x)*i/n,py=start.y+(y-start.y)*i/n,step=loftStep(walker,px,py);
    assert(step!==null&&walkable(px,py),"계단에서 광장·출입문·카페까지");
    walker={x:px,y:py,up:!!step?.up};
  }
}
assert(walker.up);
const steps=stationApproaches.find(s=>s.kind==="stairs");assert(approachAt(...steps.b).height>5);
assert(walkable(subwayExit.outside.x,subwayExit.outside.y),"지하철 출구 보도");
const eastRoute=approachRoute(square,stationHall.outsideDoor,planWalk);
assert(eastRoute?.some(p=>Math.hypot(p.x-37.5,p.y-1443.3)<3.3),"광장에서 계단을 거쳐 정문으로");
assert.deepEqual(eastRoute.at(-1),stationHall.outsideDoor);
for(const venue of cultureVenues){
  for(const r of venue.rooms){
    const p={x:venue.center.x+(r.x0+r.x1)/2,y:venue.center.y+(r.z0+r.z1)/2};
    reachable(venue.insideSpawn,p,venue.name+" → "+r.name);
  }
  assert(walkable(venue.outsideDoor.x,venue.outsideDoor.y),venue.name+" 외부 착지");
}
for(const door of cultureFrontDoors){
  assert(walkable(door.outside.x,door.outside.y));
  reachable(cultureVenues[0].insideSpawn,door.inside,"중앙홀 현관 출입문");
}
const metroStops=expandedSubwayStops.filter(s=>s.area==="station");
assert.equal(metroStops.length,17);
for(const stop of metroStops){
  const outside=stop.number===1?subwayExit.outside:stop.arrive;
  const inside=stop.number===1?subwayExit.inside:metroInsidePoint(stop.number);
  assert(walkable(outside.x,outside.y),stop.name+" 광장 보도");
  reachable(railPoint(-70,-40),inside,stop.name+" 실내 접근");
}
for(const p of [westExit.outside,rearMarketExit.outside])assert(walkable(p.x,p.y));
assert(approachAt(subwayExit.outside.x,subwayExit.outside.y).height< -4);
for(const [x,y] of [[490.87,459.87],[457.95,573.82],[363.6,697.66],[203.36,1078.31],[139.06,1192],[106.09,1316.44],[59.58,1381.13],[114.44,1420.05]]){
  assert.equal(stationGround(x,y),"path","서울역 방향 보도 포장");
  assert(walkable(x,y),"서울역 방향 보도 이동");
}
for(const [x,y] of [[498.93,426.68],[385.89,653.29],[373.55,844.55],[153.07,1130.47]]){
  assert.equal(stationGround(x,y),"crossing","차로 중심의 횡단보도");
  assert(walkable(x,y));
}
const roadKinds=new Set(["road","crossing","shared"]);
assert.equal(stationGround(45.6,1390),"shared","서울역 택시 승차장 진입로");
for(let t=0;t<BUS_CYCLE_MS;t+=200){
  const p=busAt(0,Date.UTC(2026,0,1)+t);
  if(p.y>=400)assert(roadKinds.has(stationGround(p.x,p.y)),`차도 이탈 ${p.x}, ${p.y}`);
}
console.log("서울역 출입문, 매장, 승강장, 객실 좌석과 버스 주행 검사 통과");
