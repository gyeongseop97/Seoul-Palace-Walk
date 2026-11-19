import {addZone,addLandmarks} from "./layout.js";
import {stationSurfaces} from "./station-data.js";
import {groundIndex} from "./ground-index.js";

export const stationBounds={minX:-200,maxX:602,minY:388,maxY:1565};
export const stationBands=[[388,720],[720,1120],[1120,1565]];
export const stationSites=[
  {name:"숭례문",label:"숭례문",x:325,y:883.8,heading:30},
  {name:"문화역서울284",label:"문화역서울284",x:42,y:1323,heading:270},
  {name:"서울역광장",label:"서울역광장",x:41,y:1445,heading:260}
];
export const stationGround=groundIndex(stationSurfaces);
export function stationWalkable(x,y){
  const kind=stationGround(x,y);
  return kind==="path"||kind==="crossing"||kind==="stone"||kind==="grass";
}
let registered=false;
export function registerStation(){
  if(registered)return;
  registered=true;
  addLandmarks(stationSites);
  addZone({name:"숭례문 · 서울역",contains:(x,y)=>x>=stationBounds.minX&&x<=590&&y>=388&&y<=1530,walkable:stationWalkable});
}
