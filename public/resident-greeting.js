import {interiorAt} from "./interior-layout.js";

export function replyToWave(resident,pose,players,clock){
 if(pose.bus||pose.bike||pose.bikeRide||pose.item||pose.carried||pose.mounting||pose.deckSeat||pose.coast?.deckSeat||
    (pose.coast&&!["walk","deck"].includes(pose.coast.mode))||["churchPrayer","templeBow"].includes(pose.gesture?.kind))return;
 let latest=resident.greeting;
 for(const p of players){
  const at=p.gesture?.kind==="wave"?p.gesture.at:p.wave;
  if(!at||at<= (latest?.at??0)||clock-at<0||clock-at>1200||Math.hypot(p.x-pose.x,p.y-pose.y)>4.5)continue;
  if(interiorAt(p.x,p.y)!==interiorAt(pose.x,pose.y))continue;
  if((p.coast?.mode==="deck"||pose.coast?.mode==="deck")&&
     (p.coast?.mode!==pose.coast?.mode||Math.abs((p.coast.floor??0)-(pose.coast.floor??0))>1))continue;
  latest=resident.greeting={at,x:p.x,y:p.y};
 }
 if(!latest)return;
 const elapsed=clock-latest.at-360;
 if(elapsed<0||elapsed>=2350)return;
 pose.gesture={kind:"wave",at:latest.at+360};
 const target=Math.atan2(latest.x-pose.x,pose.y-latest.y);
 const angle=target-(pose.heading??0)*Math.PI/180;
 const turn=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,elapsed/230,(2350-elapsed)/300);
 if(pose.stepping)pose.greetingLook=-Math.max(-1.12,Math.min(1.12,turn));
 else pose.heading=(pose.heading??0)+turn*180/Math.PI;
}
