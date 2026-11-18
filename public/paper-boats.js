import {bankAt,cheonggyeLevel,cheonggyeLowerEdge,cheonggyeSteppingRows,riverAt} from "./cheonggye-layout.js";

export const paperColors={coral:0xf2a490,sky:0x8ebedb,gold:0xf2cd69,leaf:0xb1ca8b};
const end=1052;
const shore=(x,side)=>bankAt(x,side,cheonggyeLowerEdge(side,x)).y;
export function boatBank(person){
  const {x,y}=person;
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<634||x>end+1||person.up||person.bus||person.bikeRide||(person.bike&&!person.bike.parked))return null;
  const side=y<riverAt(x)[0]?-1:1;
  if(Math.abs(y-shore(x,side))>2.25||(cheonggyeLevel(person)??0)>-3.1)return null;
  return {x,side};
}
const speed=boat=>.97+(parseInt(boat.id.slice(-2),16)%21)/100;
export const boatLifetime=boat=>Math.min(440000,Math.ceil(1000*Math.max(0,end-boat.origin)/speed(boat))+24000);
function channelY(x,side,phase){
  let y=shore(x,side)-side*(.59+.17*Math.sin(x*.67+phase));
  for(const row of cheonggyeSteppingRows){
    const gap=Math.abs(row.stones[0].x-x);
    if(gap>1.45)continue;
    const index=side===-1?0:row.stones.length-2;
    const a=row.stones[index],b=row.stones[index+1];
    const middle=(a.y+a.length/2+b.y-b.length/2)/2;
    const t=Math.min(1,Math.max(0,(1.45-gap)/.56));
    y+=(middle-y)*t*t*(3-2*t);
  }
  return y;
}
export function boatPose(boat,clock){
  const age=Math.max(0,(clock-boat.sent)/1000),x=Math.min(end,boat.origin+age*speed(boat));
  const phase=parseInt(boat.id.slice(-4),16)*.017,side=boat.side;
  return {x,y:channelY(x,side,phase),yaw:-Math.atan2(channelY(x+.07,side,phase)-channelY(x-.07,side,phase),.14)};
}
export function canCatchBoat(person,boat,clock){
  if(!boatBank(person)||clock>=boat.expires)return false;
  const p=boatPose(boat,clock);
  return Math.hypot(p.x-person.x,p.y-person.y)<=2.65;
}
