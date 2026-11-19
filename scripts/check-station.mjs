import assert from "node:assert/strict";
import {addObstacle,planWalk,walkable} from "../public/layout.js";
import {registerStation,stationGround,stationSites} from "../public/station-layout.js";
import {ktxCoach,railCounters,railPlatform,railRooms,registerRailFurniture,seatRows,stationHall,terminalDoors} from "../public/rail-station-layout.js";
import {interiorAt} from "../public/interior-layout.js";
import {registerDiningNavigation} from "../public/dining-layout.js";
import {stationDining} from "../public/dining-data.js";
import {registerExpandedSubway} from "../public/subway-expansion.js";
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
const roadKinds=new Set(["road","crossing","shared"]);
assert.equal(stationGround(45.6,1390),"shared","서울역 택시 승차장 진입로");
for(let t=0;t<BUS_CYCLE_MS;t+=200){
  const p=busAt(0,Date.UTC(2026,0,1)+t);
  if(p.y>=400)assert(roadKinds.has(stationGround(p.x,p.y)),`차도 이탈 ${p.x}, ${p.y}`);
}
console.log("서울역 출입문, 매장, 승강장, 객실 좌석과 버스 주행 검사 통과");
