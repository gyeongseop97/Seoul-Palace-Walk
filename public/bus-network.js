import {BUS_COUNT as seoulCount,BUS_SEATS,BUS_BOARD_REACH,busAt as seoulBusAt,busSeatPose as roadSeatPose,busStops as seoulStops,busStopTimes as seoulTimes,nearBus as nearSeoulBus} from "./sejong-bus.js";
import {gyeongjuBusCount,gyeongjuBusStops,gyeongjuBusAt,gyeongjuBusTimes,hwangnamBus,withinGyeongjuBusRange} from "./gyeongju-bus.js";
import {RAFT_SEATS,RAFT_BOARD_REACH,raftAt,raftSeatAtPose,raftStopTimes,raftStops,nearRaftStop} from "./gyeongju-raft-layout.js";
import {inGyeongjuSpace} from "./region-coordinates.js";
export {BUS_SEATS,BUS_BOARD_REACH,BUS_FLOOR,bukchonBusRoads,setBusYields} from "./sejong-bus.js";

// Preserve existing Seoul reservation IDs. A bus index identifies one vehicle across the room.
export const RAFT_INDEX=seoulCount+gyeongjuBusCount;
export const BUS_COUNT=RAFT_INDEX+1;
export const isRaftBus=index=>index===RAFT_INDEX;
export const busSeatCount=index=>isRaftBus(index)?RAFT_SEATS:BUS_SEATS;
export const busBoardReach=index=>isRaftBus(index)?RAFT_BOARD_REACH:BUS_BOARD_REACH;
export const busStops=[...seoulStops,...gyeongjuBusStops];
const byId=new Map([...busStops,...raftStops].map(p=>[p.id,p]));
export const busStopById=id=>byId.get(id)??null;
export const busServiceName=index=>isRaftBus(index)?"남천 뗏목":index>=seoulCount?hwangnamBus.name:"세종대로 순환버스";
export const stopsForRegion=gyeongju=>gyeongju?gyeongjuBusStops:seoulStops;
const seoulFleet=Array.from({length:seoulCount},(_,i)=>i);
const gyeongjuFleet=Array.from({length:gyeongjuBusCount},(_,i)=>i+seoulCount);
const noBuses=[];
export const busesForRegion=(gyeongju,listener)=>gyeongju?(listener&&!withinGyeongjuBusRange(listener,45)?noBuses:gyeongjuFleet):seoulFleet;
export function busAt(index,time,yields,raftPose){
 if(isRaftBus(index)){
  if(!Number.isFinite(time))return null;
  return {...(raftPose??raftAt(time)),index,kind:"raft"};
 }
 if(index<seoulCount)return seoulBusAt(index,time,yields);
 const bus=gyeongjuBusAt(index-seoulCount,time);
 return bus&&{...bus,index};
}
export function busSeatPose(bus,seat){
 return isRaftBus(bus?.index)?raftSeatAtPose(bus,seat):roadSeatPose(bus,seat);
}
export const busStopTimes=(id,time)=>byId.get(id)?.kind==="raft"?raftStopTimes(id,time):id?.startsWith("gj-")?gyeongjuBusTimes(id,time):seoulTimes(id,time);
export function nearBus(position,time,reach=BUS_BOARD_REACH,raftPose){
 if(!inGyeongjuSpace(position))return nearSeoulBus(position,time,reach);
 const pier=nearRaftStop(position,Math.min(reach,RAFT_BOARD_REACH));
 if(pier){
  const bus=busAt(RAFT_INDEX,time,undefined,raftPose);
  return bus?.stopId===pier.id&&!bus.traveling?{bus,stop:pier}:null;
 }
 const stop=gyeongjuBusStops.find(s=>Math.hypot(s.board.x-position.x,s.board.y-position.y)<=reach);
 if(!stop)return null;
 for(let i=seoulCount;i<RAFT_INDEX;i++){
  const bus=busAt(i,time);
  if(bus?.stopId===stop.id)return {bus,stop};
 }
 return null;
}
