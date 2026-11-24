import {busAt,busLine,busCount,harborStops} from "./pohang-layout.js";
import {coastPoint} from "./region-coordinates.js";
import {createDistantFleet} from "./coast-bus-distance.js";

const services={
 express:{name:"포항역 급행",number:"급행 E1",summary:"포항역 ↔ 영일대",coat:0xc33e37,body:0x8e3532,tint:"#a43833"},
 city:{name:"영일대 시내버스",number:"시내 C1",summary:"북부시장 · 영일대 · 환호공원",coat:0x327bc1,body:0x285987,tint:"#2a66a3"}
};
export const harborBusRoute={
 name:"포항 버스",count:busCount,createDistantFleet,
 stops:harborStops.map(p=>{
  const service=services[p.line];
  return {...p,shelter:{...coastPoint(p.shelter),heading:p.shelter.heading},
   routeName:service.name,lineLabel:service.summary,tint:service.tint,short:service.number};
 }),
 vehicle:index=>services[busLine(index).id],
 at(index,time){
  const b=busAt(index,time/1000);
  return {...coastPoint(b),heading:(540-b.yaw*180/Math.PI)%360,stopId:b.stop,
   traveling:!b.stop,remaining:b.left*1000,elapsed:b.elapsed*1000};
 }
};
