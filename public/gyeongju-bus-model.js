import {createDistantFleet} from "./coast-bus-distance.js";
import {buildSejongBusModels} from "./sejong-bus-model.js";
import {gyeongjuBusBounds,gyeongjuBusCount,gyeongjuBusStops,gyeongjuBusAt,hwangnamBus,withinGyeongjuBusRange} from "./gyeongju-bus.js";

// The whole surveyed loop fits inside this sphere, including coach bodies at the edge.
const gyeongjuBusRoute={name:hwangnamBus.name,count:gyeongjuBusCount,createDistantFleet,distantBounds:gyeongjuBusBounds,
 stops:gyeongjuBusStops,vehicle:()=>hwangnamBus,at:gyeongjuBusAt};

export function buildGyeongjuBuses(T,scene,kit,walkers){
 const group=new T.Group();group.name=hwangnamBus.name;scene.add(group);
 let fleet;
 return {update(time,anchor){
  // The KTX forecourt is kilometres from the historic district and outside the camera range.
  const visible=withinGyeongjuBusRange(anchor,1500);
  group.visible=visible;
  if(!visible)return;
  fleet??=buildSejongBusModels(T,group,kit,walkers,()=>0,()=>0,gyeongjuBusRoute);
  fleet.update(time,anchor);
 }};
}
