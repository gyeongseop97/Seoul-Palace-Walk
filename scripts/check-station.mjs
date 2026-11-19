import {airportLift,railHeight,railPoint,railStepAllowed,liftLanding,liftCenter,liftAt,storeys,approachAt,approachRoute,subwayExit,stationApproaches} from "../public/station-levels.js";
import assert from "node:assert/strict";
import {addObstacle,planWalk,walkable} from "../public/layout.js";
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
for(const [u,z,h] of [[0,0,0],[0,-38,-3.15],[0,-60,-6.3],[-16,-38,2.55],[-24,-59,5.1],[-20,-94,9.6],[-70,-40,-10.8]]){
  const p=railPoint(u,z);assert(Math.abs(railHeight(p.x,p.y)-h)<.001);reachable(stationHall.insideSpawn,p,"연속 보행 "+u+","+z);
}
for(const floor of [1,2,3,4]){
  const at=(floor-1)*7000+2000;assert.equal(liftAt(at).height,storeys[floor-1]);
  assert(railStepAllowed(liftLanding(floor),liftCenter,at));assert(!railStepAllowed(liftLanding(floor),liftCenter,at+3200));
}
for(const [i,stop] of airportLift.stops.entries()){
  const at=i*7000+2000-airportLift.offset+42000,landing=liftLanding(stop.floor,airportLift);
  assert.equal(liftAt(at,airportLift).floor,stop.floor);
  assert(railStepAllowed(landing,airportLift.center,at));
}
const steps=stationApproaches.find(s=>s.kind==="stairs");assert(approachAt(...steps.b).height>5);
assert(walkable(subwayExit.outside.x,subwayExit.outside.y),"지하철 출구 보도");
const eastRoute=approachRoute(square,stationHall.outsideDoor,planWalk);
assert(eastRoute?.some(p=>Math.hypot(p.x-37.5,p.y-1443.3)<.5),"광장에서 계단을 거쳐 정문으로");
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
const roadKinds=new Set(["road","crossing","shared"]);
assert.equal(stationGround(45.6,1390),"shared","서울역 택시 승차장 진입로");
for(let t=0;t<BUS_CYCLE_MS;t+=200){
  const p=busAt(0,Date.UTC(2026,0,1)+t);
  if(p.y>=400)assert(roadKinds.has(stationGround(p.x,p.y)),`차도 이탈 ${p.x}, ${p.y}`);
}
console.log("서울역 출입문, 매장, 승강장, 객실 좌석과 버스 주행 검사 통과");
