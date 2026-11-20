import {addZone,addLandmarks,addObstacle,addLoft} from "./layout.js";
import {stationSurfaces,stationBuildings,registerForecourt} from "./station-survey.js";
import {terminalPose,terminalPoint} from "./rail-station-layout.js";
import {plazaCafeFront,outletFront,terminalSpan,terminalDoorOffsets} from "./station-approach-plan.js";
import {approachAt,stationRise} from "./station-levels.js";
import {cultureVenues} from "./culture-station-layout.js";
import {groundIndex} from "./ground-index.js";

export const stationBounds={minX:-257,maxX:602,minY:388,maxY:1745};
export const stationBands=[[388,720],[720,1120],[1120,1745]];
export const stationSites=[
  {name:"숭례문",label:"숭례문",x:325,y:883.8,heading:30},
  {name:"문화역서울284",label:"문화역서울284",x:42,y:1323,heading:270},
  {name:"서울역광장",label:"서울역광장",x:41,y:1445,heading:260},
  {name:"서울역 서부광장",label:"서부광장",x:-190,y:1537,heading:65},
  {name:"문화역서울284 RTO",label:"RTO",x:13,y:1259,heading:270}
];
export const stationGround=groundIndex(stationSurfaces);
export function stationWalkable(x,y){
  if(approachAt(x,y))return true;
  const kind=stationGround(x,y);
  return kind==="path"||kind==="shared"||kind==="crossing"||kind==="stone"||kind==="grass";
}
let registered=false;
export function registerStation(){
  if(registered)return;
  registered=true;
  addLandmarks(stationSites);
  for(const {id,bounds:b} of cultureVenues)addZone({name:id,contains:(x,y)=>x>=b.minX&&x<=b.maxX&&y>=b.minY&&y<=b.maxY,walkable:()=>false,routing:{spacing:.65}});
  addLoft({height:stationRise,stair:(x,y)=>{const p=approachAt(x,y);return p&&(p.s.h0!==p.s.h1||p.s.kind==="lowerLanding")?p.height:null;},deck:(x,y)=>approachAt(x,y)?.s.kind==="deck"});
  for(const b of stationBuildings)for(const ring of b.rings)for(const [i,a] of ring.entries()){
    const next=ring[(i+1)%ring.length],dx=next[0]-a[0],dy=next[1]-a[1];
    addObstacle((a[0]+next[0])/2,(a[1]+next[1])/2,Math.hypot(dx,dy),.10,-Math.atan2(dy,dx));
  }
  registerForecourt(addObstacle);
  for(const {x,y,w,d,angle} of [plazaCafeFront,outletFront])
    addObstacle(x-Math.sin(angle)*d/2,y-Math.cos(angle)*d/2,w,d,angle);

  // Slender posts carry the deep eave between the five doors of the concourse.
  for(const x of [terminalSpan[1]-.4,...terminalDoorOffsets.slice(1).map((door,i)=>(door+terminalDoorOffsets[i])/2),terminalDoorOffsets[0]-2.2]){
    const p=terminalPoint(x,9.4);addObstacle(p.x,p.y,.3,.3);
  }
  addZone({name:"숭례문 · 서울역",contains:(x,y)=>x>=stationBounds.minX&&x<=590&&y>=388&&y<=stationBounds.maxY,walkable:stationWalkable});
}
