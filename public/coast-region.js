import {coastCounters as counters} from "./coast-shops.js";
import {amenities,amenityObstacle} from "./beach-amenities.js";
import {arrival} from "./pohang-station-layout.js";
import {inPark,parkEntry,parkRoad} from "./space-walk-layout.js";
import {spaceWalkRoute as stairRoute} from "./space-walk-navigation.js";
import {pavilionObstacle,pavilionRoute,pavilionStep,pavilionApproach,pavilionPoint,pavilionAxes,upperLevel} from "./pohang-pavilion-layout.js";
export const spaceWalkRoute=(from,to)=>pavilionRoute(from,to)??stairRoute(from,to);
import {expansionWildlife} from "./expansion-wildlife.js";
import {promenade,headland,onHeadland,canCrossBeachEdge} from "./pohang-layout.js";
import {sandEdge,profileRows} from "./pohang-beach-profile.js";
import {makeCoastPaths} from "./coast-walking-route.js";
import {inCafeBounds,cafeCameraWall,cafeRoof,cafeStep} from "./coast-cafe.js";
import {cafeBackdrop,cafeFootprint,onCafeApron} from "./pohang-cafe-site.js";
import {addZone,addLandmarks} from "./layout.js";
import {coastPoint,seaPoint,inCoastSpace} from "./region-coordinates.js";
import {geo,station,stationHall,stationForecourt,sideStreets,pavilion,boardRack,dock,tables,pier,shore,inBounds,inWater,onDock,onPier,distance} from "./pohang-layout.js";
import {stationObstacle,stationFloor,stationWalkLine,platformDoor,platformRings,stationPoint} from "./pohang-station-layout.js";
import {harborStops,busLines,stopById,transitRoads} from "./pohang-transit.js";
import {scooterHubs} from "./coast-scooters.js";
import {festivalBooth} from "./pohang-festival-site.js";
import {surfLineup} from "./pohang-surf-waves.js";
import {tavernArrival,tavernBlockIndex,tavernObstacle,tavernTerrace} from "./coast-tavern-layout.js";

export const platformArrival={...coastPoint(arrival),heading:38};
export const destinations=[[stationForecourt,"포항역 광장"],[stopById("beach"),"영일대 정류장"],[boardRack,"백사장 · 서핑보드 대여"],[{x:dock.x-1,z:dock.z},"선착장"],[parkEntry,"스페이스워크"],[tavernArrival,"바다야장"],[pavilionApproach,"해상누각"]]
 .map(([p,name])=>({...coastPoint(p),label:name,name,heading:p.heading??90}));
export {counters};
// The model of the offshore hall has open colonnades at both levels.
const cityBlocks=geo.blocks.filter(([,ring])=>!ring.every(([x,z])=>Math.hypot(x-pavilion.x,z-pavilion.z)<32));
const blocks=[...cityBlocks,cafeBackdrop].map(([height,polygon])=>({height,polygon,minX:Math.min(...polygon.map(p=>p[0])),maxX:Math.max(...polygon.map(p=>p[0])),minZ:Math.min(...polygon.map(p=>p[1])),maxZ:Math.max(...polygon.map(p=>p[1]))}));
const blocksByCell=new Map();
for(const b of blocks)for(let x=Math.floor(b.minX/80);x<=Math.floor(b.maxX/80);x++)
 for(let z=Math.floor(b.minZ/80);z<=Math.floor(b.maxZ/80);z++){
  const cell=x+","+z;if(!blocksByCell.has(cell))blocksByCell.set(cell,[]);blocksByCell.get(cell).push(b);
 }
export function coastObstacle(p,height,stationFeet=height){
 if(height<4.55&&amenityObstacle(p))return true;
 if(cafeCameraWall(p,height)||tavernObstacle(p,height))return true;
 if(stationObstacle(p,stationFeet)||pavilionObstacle(p,height))return true;
 const nearby=blocksByCell.get(Math.floor(p.x/80)+","+Math.floor(p.z/80));
 for(const b of nearby??[]){
  if(height>b.height+1.85)continue;
  if(p.x<b.minX||p.x>b.maxX||p.z<b.minZ||p.z>b.maxZ)continue;
  if(b.polygon===geo.blocks[tavernBlockIndex][1]&&height<5.68&&tavernTerrace(p))continue;
  let inside=false;
  for(let i=0,j=b.polygon.length-1;i<b.polygon.length;j=i++){
   const [a,z]=b.polygon[i],[c,v]=b.polygon[j];
   if((z>p.z)!==(v>p.z)&&p.x<(c-a)*(p.z-z)/(v-z)+a)inside=!inside;
  }
  if(inside)return true;
 }
 return false;
}
function walkableSurface(p,allowBeachLip=false,airFeet){
 if(inCafeBounds(p)||onCafeApron(p))return true;
 if(inPark(p))return true;
 if(!inBounds(p,allowBeachLip,airFeet))return false;
 return onDock(p)||onPier(p)||!coastObstacle(p,2.1,airFeet);
}
export const coastWalkable=(x,y,passage=false)=>walkableSurface(seaPoint({x,y}),passage===true||passage?.beachLip===true,passage?.airFeet);
const dry=p=>Number.isFinite(p.x)&&Number.isFinite(p.z)&&(p.x<=shore(p.z)||onHeadland(p)||onDock(p)||onPier(p))&&walkableSurface(p);
export const coastDrySpot=(x,y)=>dry(seaPoint({x,y}));
function dryStep(a,b,level){
 if(!canCrossBeachEdge(a,b))return false;
 if(onDock(a)!==onDock(b)&&Math.max(a.x,b.x)>sandEdge(dock.z))return false;
 return pavilionStep(a,b,level?.track)!==false&&cafeStep(a,b,level?.cafeFloor)!==false;
}
const coastPaths=makeCoastPaths(dry,dryStep);
export const coastDryStep=(from,to)=>coastPaths.clear(seaPoint(from),seaPoint(to),from.coast);
let walkingWorker,queryId=0;
const walkingQueries=new Map();
export function requestCoastWalkingRoute(from,to){
 if(!walkingWorker){
  try{
   walkingWorker=new Worker(new URL("./coast-walking-worker.js",import.meta.url),{type:"module"});
   walkingWorker.onmessage=({data:{id,steps}})=>{
    walkingQueries.get(id)?.(steps);walkingQueries.delete(id);
   };
   walkingWorker.onerror=()=>{
    for(const finish of walkingQueries.values())finish([]);
    walkingQueries.clear();walkingWorker.terminate();walkingWorker=null;
   };
  }catch{return Promise.resolve([]);}
 }
 const id=++queryId;
 return new Promise(resolve=>{
  walkingQueries.set(id,resolve);
  walkingWorker.postMessage({id,from:{x:from.x,y:from.y,coast:{track:from.coast?.track}},to:{x:to.x,y:to.y,trackNode:to.trackNode,coast:{track:to.coast?.track}}});
 });
}
export function coastWalkingRoute(from,to){
 if(!inCoastSpace(from)||!inCoastSpace(to)||!dry(seaPoint(from))||!dry(seaPoint(to)))return [];
 // A cross-town trip can begin on the Space Walk stairs and end on the pavilion's upper deck.
 const stops=[],steps=[];
 let previous=from;
 for(const landing of stairRoute(from,to)??[to]){
  stops.push(...(pavilionRoute(previous,landing)??[landing]));previous=landing;
 }
 let start=from;
 for(const stop of stops){
  const a=seaPoint(start),b=seaPoint(stop);
  const pierLeg=onPier(a)&&onPier(b)&&coastPaths.clear(a,b,{track:Math.max(start.coast?.track??0,stop.coast?.track??0)});
  if(!pierLeg&&!(start.trackNode!=null&&stop.trackNode!=null)){
   const leg=coastPaths.path(a,b);
   if(!leg.length)return [];
   for(const p of leg.slice(0,-1))steps.push(coastPoint(p));
  }
  steps.push(stop);start=stop;
 }
 return steps;
}
export function registerCoast(){
 addZone({contains:(x,y)=>inCoastSpace({x,y}),walkable:coastWalkable});
 addLandmarks(destinations);
 const trails=[-95,-240,-415,-660].map(z=>Array.from({length:12},(_,i)=>coastPoint({x:promenade(z+i*3)+1,z:z+i*3})));
 if(!expansionWildlife.some(a=>a.id==="pohang"))expansionWildlife.push({id:"pohang",bounds:{minX:9350,maxX:10950,minY:5060,maxY:6330},land:coastWalkable,trails,perches:[],catCount:8,birdCount:22});
}
export function coastDistrict(point){
 const p=seaPoint(point);
 if(distance(p,station)<220)return "포항역";
 if(inPark(p))return "환호공원";
 if(point.coast?.mode==="deck"||inWater(p)&&!onPier(p)&&!onDock(p))return "영일만";
 return Math.abs(p.x-shore(p.z))<700?"영일대":"포항 시가지";
}
export function coastName(point){
 const p=seaPoint(point);
 if(inCafeBounds(p))return point.coast?.cafeFloor>cafeRoof-.38?"영일대 커피 · 루프탑":"영일대 커피";
 if(inPark(p))return Math.hypot(p.x-parkEntry.x,p.z-parkEntry.z)<85?"환호공원 스페이스워크":"환호공원 해안 산책로";
 if(point.coast?.mode==="deck")return "영일만 크루즈";
 if(point.coast?.mode==="bus")return "포항 버스";
 if(stationFloor(p)!==null||distance(p,station)<65||distance(p,stationHall)<55)return "포항역";
 if(tables.some(t=>distance(p,t)<7))return "영일대 바다야장";
 if(onPier(p))return pavilionAxes(p).v< -13.4?"영일교":point.coast?.track>upperLevel-.36?"영일대 2층 누마루":"영일대 해상누각";
 if(onDock(p))return "크루즈 선착장";
 return inWater(p)?"영일만":Math.abs(p.x-shore(p.z))<150?"영일대해수욕장":"포항 해안로";
}
export const mapGround="#d5d0b4";
export const cityMapBox="6310 3190 5270 4270";
export function coastBox(point,overview){
 return overview?cityMapBox:routeMapBox(point);
}
export function routeMapBox(point){
 if(inPark(seaPoint(point)))return "10200 4670 1140 740";
 const p=seaPoint(point);
 if(stationFloor(p)!==null||distance(p,station)<190)return [coastPoint(stationHall).x-150,coastPoint(stationHall).y-145,300,290].join(" ");
 if(Math.abs(p.x-shore(p.z))<700)return "9730 4825 970 1595";
 return "6350 3250 4770 4050";
}
// Preserve bends while avoiding thousands of near-collinear lane samples in the interactive map.
const mappedLines=busLines.map(line=>({color:line.color,legs:line.legs.map(({lane})=>{
 const keep=[lane[0]];let heading=lane[0].yaw;
 for(let i=1;i<lane.length-1;i++){
  const angle=lane[i].yaw-heading;
  if(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))>.075){keep.push(lane[i]);heading=lane[i].yaw;}
 }
 keep.push(lane.at(-1));return keep;
})}));
export function drawCoastMap(base,svg,drawMarker,mini=false){
 const pts=a=>a.map(p=>{const q=coastPoint(p);return q.x+","+q.y;}).join(" ");
 const path=(list,color,width)=>svg(base,"polyline",{points:pts(list),fill:"none",stroke:color,"stroke-width":width,"stroke-linejoin":"round"});
 const edge=[-3400,...profileRows,1800].map(z=>({z,x:shore(z)}));
 svg(base,"polygon",{points:pts([...edge,{x:2200,z:1800},{x:2200,z:-3400}]),fill:"#88b6c4"});
 path(edge,"#e9cf9e",9);
 svg(base,"polygon",{points:pts(headland.map(([x,z])=>({x,z}))),fill:mapGround});
 path(parkRoad,"#9caa7e",16);
 svg(base,"path",{d:sideStreets.map(({a,b})=>"M"+(10000+a.x)+" "+(6000+a.z)+"L"+(10000+b.x)+" "+(6000+b.z)).join(""),stroke:"#efe9d9","stroke-width":5,fill:"none"});
 for(const way of geo.coastRoads)path(way.map(([x,z])=>({x,z})),"#f4ebd6",7);
 svg(base,"path",{d:transitRoads.map(({a,b})=>"M"+(10000+a.x)+" "+(6000+a.z)+"L"+(10000+b.x)+" "+(6000+b.z)).join(""),stroke:"#eee5d8","stroke-width":10,fill:"none"});
 for(const {color,legs} of mappedLines)for(const leg of legs)path(leg,color,mini?1.7:2.2);
 path(pier,"#aa7958",4);
 path([{x:promenade(dock.z),z:dock.z},dock],"#aa7958",4.4);
 const footprints=geo.blocks.map(([,ring])=>"M"+ring.map(([x,z])=>(10000+x).toFixed(1)+" "+(6000+z).toFixed(1)).join("L")+"Z").join("");
 svg(base,"path",{d:footprints,fill:"#bcb7a8",stroke:"#aea899","stroke-width":.8});
 svg(base,"polygon",{points:pts(cafeFootprint.map(([x,z])=>({x,z}))),fill:"#bcb7a8",stroke:"#aea899","stroke-width":.8});
 svg(base,"polygon",{points:pts(geo.station.map(([x,z])=>({x,z}))),fill:"#999f9d",stroke:"#657572","stroke-width":1.4});
 for(const island of platformRings)svg(base,"polygon",{points:pts(island.map(([u,v])=>stationPoint(u,v))),fill:"#cfcaca",stroke:"#8e918c","stroke-width":.7});
 const seaDeck=[[-14.5,-13.5],[14.5,-13.5],[14.5,13.5],[-14.5,13.5]];
 svg(base,"polygon",{points:pts(seaDeck.map(([u,v])=>pavilionPoint(u,v))),fill:"#dbd4c2",stroke:"#938a75","stroke-width":.8});
 svg(base,"polygon",{points:pts([[-10,1.4],[10,1.4],[10,13.05],[-10,13.05]].map(([u,v])=>pavilionPoint(u,v))),fill:"#726c61"});
 path(stationWalkLine,"#c9a362",1.6);
 drawMarker(base,{...coastPoint(platformDoor),label:"KTX 승강장",name:"KTX 승강장"},"railway",mini);
 const categories=["railway","bus","activity","activity","heritage","shop","heritage"];
 destinations.forEach((p,i)=>{if(i!==1)drawMarker(base,p,categories[i],mini);});
 for(const stop of harborStops){
  const name=stop.name+" · "+(stop.line==="express"?"급행 ":"")+stop.direction;
  drawMarker(base,{...coastPoint(stop),name},"bus",mini);
 }
 for(const hub of scooterHubs)drawMarker(base,{...coastPoint(hub),name:hub.name},"bike",mini);
 for(const a of amenities)drawMarker(base,{...coastPoint(a.entry),name:a.name,label:a.name},"activity",mini);
 drawMarker(base,{...coastPoint(festivalBooth),name:festivalBooth.name},"activity",mini);
 drawMarker(base,{...coastPoint(surfLineup),name:"영일대 서핑 구역"},"activity",mini);
 for(const p of counters)drawMarker(base,p,"shop",mini);
}
