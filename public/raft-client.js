import {busAt as scheduledBus,busStopTimes as scheduledTimes,isRaftBus,nearBus as scheduledNearBus} from "./bus-network.js";
import {nearRaftStop,raftStops} from "./gyeongju-raft-layout.js";
import {driveRaft,raftPoseAt,raftTimesAt} from "./gyeongju-raft-navigation.js";

let snapshot=null,prediction=null,operator=null,offset=null;
let throttle=0,turn=0,sequence=0,sentAt=-Infinity,controlsChanged=false;
let sampleTime=NaN,sample=null;
const angleBetween=(a,b)=>((a-b+540)%360)-180;
const axis=value=>Math.round(Math.max(-1,Math.min(1,value))*10)/10;

export function resetRaft(){
 snapshot=prediction=operator=offset=sample=null;
 throttle=turn=sequence=0;sentAt=-Infinity;controlsChanged=false;sampleTime=NaN;
}
export const watchesRaft=p=>Math.hypot(p.x-raftStops[0].board.x,p.y-raftStops[0].board.y)<460;
export function clientRaftAt(time){
 if(time===sampleTime)return sample;
 sampleTime=time;
 sample=raftPoseAt(prediction??snapshot,time);
 // Give everyone on deck the same correction, including the player holding the oar.
 if(offset){
  const amount=Math.exp(-Math.max(0,time-offset.at)/130);
  if(amount<.005)offset=null;
  else sample={...sample,x:sample.x+offset.x*amount,y:sample.y+offset.y*amount,
   heading:(sample.heading+offset.heading*amount+360)%360};
 }
 return sample;
}
function predict(state,time){
 const next=driveRaft(state,Math.max(state.at,time),{throttle,turn,seq:state.seq+1});
 return next?{...next,leaseUntil:state.leaseUntil}:null;
}
export function receiveRaft(next,self,time){
 if(!next&&!snapshot)return;
 if(next&&snapshot&&next.mode===snapshot.mode&&next.at===snapshot.at&&next.offset===snapshot.offset&&
  next.lease===snapshot.lease&&next.seq===snapshot.seq&&next.leaseUntil===snapshot.leaseUntil&&next.arriveAt===snapshot.arriveAt)return;
 const previous=clientRaftAt(time),sameLease=next?.lease&&next.lease===snapshot?.lease;
 snapshot=next;
 operator=next?.mode==="manual"&&next.pilot===self?self:null;
 if(!operator||!sameLease){
  throttle=turn=0;sequence=next?.seq??0;sentAt=-Infinity;controlsChanged=Boolean(operator);
 }
 prediction=operator&&(next.throttle!==throttle||next.turn!==turn)?predict(next,time):null;
 offset=null;sampleTime=NaN;
 const current=clientRaftAt(time),dx=previous.x-current.x,dy=previous.y-current.y;
 if(Math.hypot(dx,dy)<6&&!current.stopId)offset={at:time,x:dx,y:dy,heading:angleBetween(previous.heading,current.heading)};
 sampleTime=NaN;
}
export function setRaftAxes(forward,right,time){
 if(!operator)return false;
 forward=axis(forward);right=axis(right);
 if(throttle===forward&&turn===right)return false;
 throttle=forward;turn=right;controlsChanged=true;
 prediction=predict(prediction??snapshot,time);sampleTime=NaN;
 return true;
}
export function drivePacket(time,heartbeat=true){
 if(!operator||time>=snapshot.leaseUntil||(!controlsChanged&&(!heartbeat||time-sentAt<700)))return null;
 sequence=Math.max(sequence,snapshot.seq)+1;sentAt=time;controlsChanged=false;
 return {action:"drive",throttle,turn,seq:sequence,lease:snapshot.lease};
}
export const raftCommand=action=>action==="take"?{action}:operator?{action,lease:snapshot.lease}:null;
export const busAt=(index,time,yields)=>scheduledBus(index,time,yields,isRaftBus(index)?clientRaftAt(time):null);
export const busStopTimes=(id,time)=>id?.startsWith("gj-raft-")?raftTimesAt(snapshot,id,time):scheduledTimes(id,time);
export const nearBus=(p,time,reach)=>scheduledNearBus(p,time,reach,snapshot&&nearRaftStop(p)?clientRaftAt(time):null);
