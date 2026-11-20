import {dispatchLift} from "../public/lift-dispatch.js";
import {boardingIslands,concourseParts,northBridgeExit,marketExit,liftBanks,setStationLifts,outdoorRailBlocks,railHeight,railPoint,railStepAllowed,liftLanding,liftAt,approachAt,approachRoute,subwayExit,stationApproaches} from "../public/station-levels.js";
import assert from "node:assert/strict";
import {gatePose} from "../public/station-approach-plan.js";
import {stationTerraces} from "../public/station-terraces.js";
import {stationBuildings} from "../public/station-survey.js";
import {groundIndex} from "../public/ground-index.js";
import {addObstacle,clearSegment,loftStep,planWalk,walkable} from "../public/layout.js";
import {registerStation,stationGround,stationSites} from "../public/station-layout.js";
import {hallDoors,ktxBoardingAt,ktxBoardingSpots,ktxCoach,plazaCafe,railCounters,railPlatform,railRooms,registerRailFurniture,seatRows,stationHall,terminalDoors} from "../public/rail-station-layout.js";
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
assert.deepEqual(ktxBoardingSpots.map(spot=>spot.track),Array.from({length:14},(_,i)=>i+1));
for(const spot of ktxBoardingSpots){
  const east=spot.track%2===1,side=east?1:-1,islandX=10-17*Math.floor((spot.track-1)/2);
  for(const z of [36.1,52,95.9,...([3,4].includes(spot.track)?[110,132.9]:[])]){
    for(const offset of [.3,3.9]){
      const p=railPoint(islandX+side*offset,z);
      assert.equal(ktxBoardingAt(p.x,p.y)?.track,spot.track,`${spot.track}번 승강장 탑승 (${offset}, ${z})`);
    }
  }
  assert.equal(ktxBoardingAt(spot.x,spot.y)?.track,spot.track);
  assert(walkable(spot.x,spot.y),"하차 위치");
  reachable(stationHall.insideSpawn,spot,spot.track+"번 승강장");
  for(const [x,z] of [[islandX,12],[islandX,28],[islandX+side*6,74],[islandX,135]]){
    const p=railPoint(x,z);assert.equal(ktxBoardingAt(p.x,p.y),null,"승강장 밖");
  }
}
assert.equal(ktxBoardingAt(ktxCoach.insideSpawn.x,ktxCoach.insideSpawn.y),null);
const coachBenches=seats.filter(s=>interiorAt(s.x,s.y)===ktxCoach.id);
assert.equal(coachBenches.length,2*seatRows.length);
for(const bench of coachBenches)for(const slot of bench.slots){
  assert(walkable(slot.approach.x,slot.approach.y));
  reachable(ktxCoach.insideSpawn,slot.approach,"KTX 좌석 통로");
}
const islandPoints=boardingIslands.flatMap(s=>[[s.x-.6,27,-3.15],[s.x,90,-6.3]]);
for(const [u,z,h] of [[0,0,0],[-100,0,0],[-9.7,27,-3.15],[-7,120,-6.3],[11.5,-27,2.55],[5,-48,5.1],[1,-27,5.1],[-3.5,-68,7.35],[5,-84,9.6],[0,-115,9.6],[22,-90,9.6],
  [-23,-40,0],[-70,-22,0],[-71.5,-39.5,-5.4],[-70,-59,-10.8],[-48,-36,-10.8],[-101,-58,-10.8],...islandPoints]){
  const p=railPoint(u,z);assert(Math.abs(railHeight(p.x,p.y)-h)<.001,"층 높이 "+u+","+z);reachable(stationHall.insideSpawn,p,"연속 보행 "+u+","+z);
}
for(const [i,p] of concourseParts.entries())for(const q of concourseParts.slice(i+1)){
  if(p.flush||q.flush)continue;
  assert(Math.min(p.x1,q.x1)-Math.max(p.x0,q.x0)<.02||Math.min(p.z1,q.z1)-Math.max(p.z0,q.z0)<.02,"겹친 바닥 "+p.name+" / "+q.name);
}
for(const door of hallDoors){
  assert.equal(interiorAt(door.inside.x,door.inside.y),stationHall.id);
  reachable(door.arrive,door.inside,"맞이방 동쪽 출입문");reachable(door.arrive,railPoint(-100,0),"맞이방 동서 보행");
}
for(const link of [westExit,northBridgeExit,rearMarketExit,marketExit,subwayExit])reachable(stationHall.insideSpawn,link.inside,"맞이방 연결 출입구");
for(const bank of liftBanks)for(const [i,stop] of bank.stops.entries()){
  const landing=liftLanding(stop.floor,bank);
  assert.equal(railHeight(landing.x,landing.y),bank.levels[i],bank.id+" 승강기 "+stop.floor+"층 승강장");
}
assert.equal(railHeight(stationHall.center.x+23.9,stationHall.center.y),0);
assert.equal(railHeight(stationHall.center.x+24.6,stationHall.center.y),null);
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
assert(!railStepAllowed(railPoint(-8.6,27),railPoint(-7.9,27)),"실내 계단과 에스컬레이터 사이 난간");
assert(railStepAllowed(railPoint(-7.7,27),railPoint(-7.7,26)),"실내 에스컬레이터 진행 방향");
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
let walker={x:36,y:1441,up:false};
for(const [x,y] of [[30.6,1441],[14.6,1441.4],[6.4,1448],[6.4,1478],...terminalDoors.slice().reverse().map(p=>[p.x,p.y]),[terminalDoors[2].x,terminalDoors[2].y],[11.7,1487.7],[16,1476],[plazaCafe.x,plazaCafe.y]]){
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
const eastFeet=stationApproaches.filter(s=>s.h0===0&&s.h1>5&&s.a[0]>0);
assert(eastRoute?.some(p=>eastFeet.some(s=>Math.hypot(p.x-s.a[0],p.y-s.a[1])<s.w/2+1.2)),"광장에서 계단을 거쳐 정문으로");
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
  reachable(railPoint(-70,-59),inside,stop.name+" 실내 접근");
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
