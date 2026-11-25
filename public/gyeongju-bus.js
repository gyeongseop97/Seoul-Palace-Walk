import {historicBusRoads as roads} from "./gyeongju-bus-geography.js";
import {angle,makeBusLeg,busLanePose} from "./city-bus-lane.js";
import {gyeongjuPoint} from "./region-coordinates.js";

// This game service follows the surveyed road centre lines clockwise around the tomb park.
// The narrow hanok streets have a lower speed limit and the shuttle keeps to one direction.
export const hwangnamBus={name:"황남 순환버스",number:"황남 순환",summary:"천마총후문 · 대릉원 · 첨성로 · 황남골목",
 coat:0x68886b,body:0x445f4d,tint:"#41644e"};
export const gyeongjuBusBounds={x:96,y:2,z:-173,radius:455};
const centre=gyeongjuPoint(gyeongjuBusBounds);
export const withinGyeongjuBusRange=(p,margin)=>Boolean(p&&(p.x-centre.x)**2+(p.y-centre.y)**2<(gyeongjuBusBounds.radius+margin)**2);
const service={id:"hwangnam",maxSpeed:10,acceleration:1.35,braking:1.75};
const dwell=12_000,epoch=Date.UTC(2026,0,1);
const stops=[
 {id:"gj-heavenly-horse",name:"천마총후문·황리단길",direction:"계림로 · 대릉원 정문 방면",road:"taejong",segment:1,part:.40},
 {id:"gj-daereungwon",name:"대릉원 정문",direction:"첨성로 · 황남골목 방면",road:"gyerim",segment:13,part:.68},
 {id:"gj-cheomseong-ro",name:"첨성로 돌담길",direction:"황남골목 · 황리단길 방면",road:"cheomseong",segment:7,part:.76},
 {id:"gj-hwangnam",name:"황남 한옥골목",direction:"천마총후문 · 대릉원 방면",road:"poseokWest",segment:8,part:.84}
];
const edges=[];
function street(id,start,end){
 const [kind,width,,points]=roads[id],step=Math.sign(end-start);
 for(let i=start;i!==end;i+=step){
  const [x,z]=points[i],[u,v]=points[i+step];
  const a={x,z},b={x:u,z:v};
  const edge={width,oneWay:width<6,speedLimit:width<=4?3.75:kind==="lane"?5.75:10};
  const stop=stops.find(p=>p.road===id&&p.segment===i);
  if(stop){
   const split={x:x+(u-x)*stop.part,z:z+(v-z)*stop.part};
   edges.push({...edge,a,b:split});
   stop.edge=edges.length;
   edges.push({...edge,a:split,b});
  }else edges.push({...edge,a,b});
 }
}
street("taejong",0,5);
street("gyerim",0,19);
street("cheomseong",8,3);
street("poseokEast",9,0);
street("poseokWest",0,9);
street("poseok",2,0);

const legs=stops.map((stop,i)=>{
 const end=stops[(i+1)%stops.length].edge;
 const span=end>stop.edge?edges.slice(stop.edge,end):[...edges.slice(stop.edge),...edges.slice(0,end)];
 return makeBusLeg(span,service);
});
const heading=yaw=>(540-yaw*180/Math.PI)%360;
const asWorld=(p,yaw)=>({...gyeongjuPoint(p),heading:heading(yaw)});
export const gyeongjuBusStops=stops.map(({id,name,direction},i)=>{
 const {a,b,width}=legs[i].edge,yaw=angle(a,b),tx=Math.sin(yaw),tz=Math.cos(yaw);
 const at=(along,across,rotation)=>asWorld({x:a.x+along*tx-across*tz,z:a.z+along*tz+across*tx},rotation);
 return {id,name,direction,berth:asWorld(legs[i].lane[0],yaw),board:at(3.45,width/2+.80,yaw+Math.PI/2),
  exit:at(3.75,width/2+1.38,yaw-Math.PI/2),shelter:at(-.75,width/2+2.40,yaw+Math.PI/2),
  routeName:hwangnamBus.name,lineLabel:hwangnamBus.summary,tint:hwangnamBus.tint,short:"황남"};
});
let cycle=0;
for(const leg of legs){
 leg.start=cycle;
 cycle+=dwell+leg.seconds*1000;
}
export const gyeongjuBusCycle=cycle;
export const gyeongjuBusCount=Math.ceil(cycle/42_000);
export const gyeongjuBusInterval=cycle/gyeongjuBusCount;
const phase=(time,offset,period)=>((time-epoch-offset)%period+period)%period;
export function gyeongjuBusAt(index,time){
 if(!Number.isInteger(index)||index<0||index>=gyeongjuBusCount||!Number.isFinite(time))return null;
 const t=phase(time,-index*gyeongjuBusInterval,cycle);
 const i=legs.findLastIndex(leg=>leg.start<=t),leg=legs[i],elapsed=t-leg.start;
 const stop=gyeongjuBusStops[i],nextStopId=gyeongjuBusStops[(i+1)%legs.length].id;
 const base={id:"hwangnam-bus-"+(index+1),index,nextStopId};
 if(elapsed<dwell)return {...base,...stop.berth,stopId:stop.id,remaining:dwell-elapsed,elapsed,traveling:false,eta:0};
 const travel=elapsed-dwell,p=busLanePose(leg.lane,travel/1000);
 return {...base,...asWorld(p,p.yaw),stopId:null,remaining:0,elapsed:travel,traveling:true,eta:leg.seconds*1000-travel};
}
export function gyeongjuBusTimes(stopId,time){
 const i=gyeongjuBusStops.findIndex(stop=>stop.id===stopId);
 if(i<0||!Number.isFinite(time))return null;
 const elapsed=phase(time,legs[i].start,gyeongjuBusInterval);
 return {arrivalMs:gyeongjuBusInterval-elapsed,departureMs:elapsed<dwell?dwell-elapsed:null};
}
