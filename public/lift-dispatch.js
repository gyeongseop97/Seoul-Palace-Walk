// The server schedules requested stops. Everyone in the room animates the same
// itinerary against the room clock, including clients that enter during travel.
const doorTime=600,dwell=4800;
const height=(bank,floor)=>bank.levels[bank.stops.findIndex(s=>s.floor===floor)];
const travel=(bank,a,b)=>Math.round(1200+450*Math.abs(height(bank,a)-height(bank,b)));
const initial=bank=>({floor:bank.stops.reduce((top,s)=>s.floor>top?s.floor:top,bank.stops[0].floor),at:0});
const clamp=t=>Math.max(0,Math.min(1,t));
function remaining(bank,schedule,now){
  const stops=schedule?.length?schedule:[initial(bank)];
  let i=0;while(i+1<stops.length&&stops[i+1].at<=now)i++;
  return stops.slice(i);
}
export function dispatchLift(bank,schedule,floor,now){
  const stops=remaining(bank,schedule,now),here=stops[0],last=stops.at(-1);
  if(stops.slice(1).some(s=>s.floor===floor))return stops;
  if(here.floor===floor&&stops.length===1){
    // A fresh call at an idle landing reopens its doors.
    if(liftPose(bank,stops,now).open<.85)return [{floor,at:now}];
    return stops;
  }
  if(here.floor===floor&&stops.length>1&&liftPose(bank,stops,now).open>.85)return stops;
  const depart=Math.max(now+doorTime,last.at+dwell);
  return [...stops,{floor,at:depart+travel(bank,last.floor,floor)}];
}
export function liftPose(bank,schedule,time){
  const [here,next]=remaining(bank,schedule,time),h=height(bank,here.floor);
  const depart=next?next.at-travel(bank,here.floor,next.floor):Infinity;
  const t=next?clamp((time-depart)/(next.at-depart)):0;
  return {floor:here.floor,next:next?.floor??here.floor,moving:t>0,
    height:t?h+(height(bank,next.floor)-h)*t*t*(3-2*t):h,
    open:here.at?clamp(Math.min((time-here.at)/doorTime,(Math.min(depart,here.at+dwell)-time)/doorTime)):0};
}
