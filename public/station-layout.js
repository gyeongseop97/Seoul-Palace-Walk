import {addZone,addLandmarks,addObstacle} from "./layout.js";
import {stationSurfaces,stationBuildings} from "./station-data.js";
import {terminalPose,terminalPoint} from "./rail-station-layout.js";
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
  return kind==="path"||kind==="shared"||kind==="crossing"||kind==="stone"||kind==="grass";
}
let registered=false;
export function registerStation(){
  if(registered)return;
  registered=true;
  addLandmarks(stationSites);
  for(const b of stationBuildings)for(const ring of b.rings)for(const [i,a] of ring.entries()){
    const next=ring[(i+1)%ring.length],dx=next[0]-a[0],dy=next[1]-a[1];
    addObstacle((a[0]+next[0])/2,(a[1]+next[1])/2,Math.hypot(dx,dy),.10,-Math.atan2(dy,dx));
  }
  // The projecting glass facade and its columns extend beyond the cadastral footprint.
  addObstacle(terminalPose.x,terminalPose.y,47,8,terminalPose.angle);
  for(const side of [-1,1])for(let k=0;k<4;k++){
    const stair=terminalPoint(side*12.4,9.8-k*.55);addObstacle(stair.x,stair.y,20.1,.65,terminalPose.angle,.16+k*.18);
  }
  for(const x of [-20,-8,8,20]){
    const p=terminalPoint(x,10);addObstacle(p.x,p.y,.85,.85);
  }
  addZone({name:"숭례문 · 서울역",contains:(x,y)=>x>=stationBounds.minX&&x<=590&&y>=388&&y<=1530,walkable:stationWalkable});
}
