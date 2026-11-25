import {BUS_COUNT as seoulCount,BUS_BOARD_REACH,busAt as seoulBusAt,busStops as seoulStops,busStopTimes as seoulTimes,nearBus as nearSeoulBus} from "./sejong-bus.js";
import {gyeongjuBusCount,gyeongjuBusStops,gyeongjuBusAt,gyeongjuBusTimes,hwangnamBus,withinGyeongjuBusRange} from "./gyeongju-bus.js";
import {inGyeongjuSpace} from "./region-coordinates.js";
export {BUS_SEATS,BUS_BOARD_REACH,BUS_FLOOR,bukchonBusRoads,busSeatPose,setBusYields} from "./sejong-bus.js";

// Preserve existing Seoul reservation IDs. A bus index identifies one vehicle across the room.
export const BUS_COUNT=seoulCount+gyeongjuBusCount;
export const busStops=[...seoulStops,...gyeongjuBusStops];
const byId=new Map(busStops.map(p=>[p.id,p]));
export const busStopById=id=>byId.get(id)??null;
export const busServiceName=index=>index>=seoulCount?hwangnamBus.name:"세종대로 순환버스";
export const stopsForRegion=gyeongju=>gyeongju?gyeongjuBusStops:seoulStops;
const seoulFleet=Array.from({length:seoulCount},(_,i)=>i);
const gyeongjuFleet=Array.from({length:gyeongjuBusCount},(_,i)=>i+seoulCount);
const noBuses=[];
export const busesForRegion=(gyeongju,listener)=>gyeongju?(listener&&!withinGyeongjuBusRange(listener,45)?noBuses:gyeongjuFleet):seoulFleet;
export function busAt(index,time,yields){
 if(index<seoulCount)return seoulBusAt(index,time,yields);
 const bus=gyeongjuBusAt(index-seoulCount,time);
 return bus&&{...bus,index};
}
export const busStopTimes=(id,time)=>id?.startsWith("gj-")?gyeongjuBusTimes(id,time):seoulTimes(id,time);
export function nearBus(position,time,reach=BUS_BOARD_REACH){
 if(!inGyeongjuSpace(position))return nearSeoulBus(position,time,reach);
 const stop=gyeongjuBusStops.find(s=>Math.hypot(s.board.x-position.x,s.board.y-position.y)<=reach);
 if(!stop)return null;
 for(let i=seoulCount;i<BUS_COUNT;i++){
  const bus=busAt(i,time);
  if(bus?.stopId===stop.id)return {bus,stop};
 }
 return null;
}
