import {beachStop,promenade,distance,inWater,onDock,ground} from "./pohang-layout.js";
import {stationForecourt,stationFloor} from "./pohang-station-layout.js";
import {parkRoad,parkStep} from "./space-walk-layout.js";
import {pavilionFloor,pavilionObstacle,lowerLevel} from "./pohang-pavilion-layout.js";

const trailHub=(z,name,id)=>({x:promenade(z)-1,z,name,id});
export const scooterHubs=[
 {...stationForecourt,x:stationForecourt.x-2.3,z:stationForecourt.z+1.2,name:"포항역 킥보드",id:"station"},
 trailHub(beachStop.z+14,"영일대 킥보드","beach"),
 trailHub(-552,"해상누각길 킥보드","pavilion"),
 {...parkRoad[4],z:parkRoad[4].z+3.3,name:"환호공원 킥보드",id:"park"}
];
export const scooterParkTime=600000;
export function nearScooterHub(p){return scooterHubs.find(h=>distance(h,p)<3.6);}
export function onScooterLevel(p,track){
 const floor=pavilionFloor(p,track);
 return floor==null||floor<=lowerLevel+.30;
}
export function canScoot(p){
 const pier=pavilionFloor(p);
 if(pier!=null)return pier<=lowerLevel&&!pavilionObstacle(p,pier+.32);
 const floor=stationFloor(p);
 return !inWater(p)&&!onDock(p)&&ground(p)>=1.55&&
  (floor==null||floor<=1.87)&&parkStep(p,undefined)==null;
}
