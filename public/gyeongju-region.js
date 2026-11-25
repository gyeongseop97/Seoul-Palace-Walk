import {addLandmarks,addZone} from "./layout.js";
import {gyeongjuGuides} from "./gyeongju-guide.js";
import {marketRooms,marketCounters,marketRoomAt} from "./gyeongju-market.js";
import {gyeongjuBikeDocks} from "./gyeongju-bike.js";
import {gyeongjuBusStops} from "./gyeongju-bus.js";
import {raftStops} from "./gyeongju-raft-layout.js";
export {nearRaftStop} from "./gyeongju-raft-layout.js";
export {marketDiningAt} from "./gyeongju-market.js";
import {insideObservatory} from "./gyeongju-observatory.js";
import {inCheonmaHall,twinTombName,twinSection} from "./daereungwon.js";
import {gyeongjuPoint,localGyeongju,inGyeongjuSpace} from "./region-coordinates.js";
import {places,roads,buildings,walls,mounds,parks,gyeongjuRoute,gyeongjuWalkable} from "./gyeongju-layout.js";
export {gyeongjuOrigin,gyeongjuPoint,inGyeongjuSpace} from "./region-coordinates.js";

const districtByPlace={stationExit:"경주역",stationBus:"경주역",townBus:"황리단길",townReturnBus:"황리단길",hwangnidan:"황리단길",
 stars:"첨성대·계림",observatoryEntrance:"첨성대·계림",gyerimEntry:"첨성대·계림",gyerim:"첨성대·계림",naemul:"첨성대·계림",
 woljeongNorth:"교촌·월정교",woljeong:"교촌·월정교",woljeongSouth:"교촌·월정교"};
const tombAtSite={cheonmaDoor:"천마총",geomchong:"검총",twinTomb:twinTombName,michu:"미추왕릉",naemul:"내물왕릉"};
const describe=(id,name)=>{
 const p=places[id];
 const tomb=mounds.find(m=>m.name===tombAtSite[id]);
 return {...gyeongjuPoint(p),name,label:name,heading:p.heading??0,district:districtByPlace[id]??"대릉원",
  caption:tomb?{...gyeongjuPoint(tomb),name:tomb.name.replace("대릉원 ","")}:undefined,guide:{...gyeongjuGuides[id],title:name}};
};
export const travelStops={
 stationExit:describe("stationExit","경주역 출입구"),stationBus:describe("stationBus","경주역 버스정류장"),
 townBus:describe("townBus","황리단길 정류장"),townReturnBus:describe("townReturnBus","경주역행 정류장")
};
export const platformArrival=travelStops.stationExit;
export const counters=marketCounters;
const cityBusSites=gyeongjuBusStops.map((stop,index)=>{
 const name=stop.name+" 순환버스 정류장";
 return {...stop.board,name,label:name,district:["황리단길","대릉원","첨성대·계림","황리단길"][index],guide:{title:name,description:"게임 속 황남 순환버스가 정차하는 곳입니다.",
  directions:stop.direction+" 방면 버스가 서면 좌석을 골라 타세요. 다음 정류장에서 내릴 수 있어요.",
  source:"https://www.gyeongju.go.kr/hwangridan/images/gj_map_kor.pdf",sourceLabel:"경주시 황리단길 안내도"}};
});
const sites=[
 [travelStops.stationExit,"railway"],[travelStops.stationBus,"bus"],[travelStops.townBus,"bus"],[travelStops.townReturnBus,"bus"],
 [describe("hwangnidan","황리단길"),"activity"],
 ...marketRooms.map(r=>[{...gyeongjuPoint(r.entry),name:r.name,label:r.name,heading:r.heading,district:r.id==="pub"?"교촌·월정교":"황리단길",guide:{...r.guide,title:r.name}},"shop"]),
 ...gyeongjuBikeDocks.map(d=>[{...d.access,name:d.name,label:d.name,heading:d.heading,
  district:{"gj-hwangnidan":"황리단길","gj-daereungwon":"대릉원","gj-cheomseongdae":"첨성대·계림","gj-woljeong":"교촌·월정교"}[d.id],guide:d.guide},"bike"]),
 ...cityBusSites.map(p=>[p,"bus"]),
 ...raftStops.map(stop=>[{...stop.board,name:stop.name,label:stop.name,district:"교촌·월정교",
  guide:{title:stop.name,description:"남천을 건너며 동쪽으로 월정교를 바라볼 수 있는 게임 속 뗏목 선착장이에요.",
   directions:"강가의 나무 발판 끝에서 뗏목이 닿으면 ‘뗏목 타기’를 누르고 자리를 고르세요. 반대편 선착장에 닿으면 내릴 수 있어요.",
   source:"https://www.gyeongju.go.kr/design/tour2019/file/tourMap/tourMap2_250821.pdf",sourceLabel:"경주시 교촌마을 안내도"}},"activity"]),
 [describe("northGate","대릉원 후문"),"heritage"],[describe("photo","대릉원 목련 포토존"),"heritage"],
 [describe("cheonmaDoor","천마총 전시관 입구"),"heritage"],[describe("cheonmaGallery","천마총 전시실"),"heritage"],
 [describe("twinTomb","황남대총 연못 전망길"),"heritage"],[describe("michu","미추왕릉 참배길"),"heritage"],
 [describe("geomchong","검총 관람길"),"heritage"],[describe("naemul","내물왕릉 관람길"),"heritage"],
 [describe("mainGate","대릉원 정문"),"heritage"],[describe("stars","첨성대 관람길"),"heritage"],
 [describe("observatoryEntrance","첨성대 남쪽 창"),"heritage"],[describe("gyerimEntry","계림 북쪽 입구"),"park"],
 [describe("gyerim","계림 숲길"),"park"],[describe("woljeongNorth","월정교 북쪽 입구"),"heritage"],
 [describe("woljeong","월정교"),"heritage"],[describe("woljeongSouth","월정교 남쪽 입구"),"heritage"]
];
export const destinations=sites.map(([p])=>p);
const defaultPlace={경주역:"경주역 출입구",황리단길:"황리단길",대릉원:"대릉원 정문","첨성대·계림":"첨성대 관람길","교촌·월정교":"월정교 북쪽 입구"};
export const travelDistricts=Object.fromEntries(Object.entries(defaultPlace).map(([name,first])=>{
 const local=destinations.filter(p=>p.district===name);
 return [name,[local.find(p=>p.name===first),...local.filter(p=>p.name!==first)]];
}));
const shopGuides=new Map(sites.filter(([,type])=>type==="shop").map(([site])=>[site.name,site.guide]));
// The location badge, guide action and map all sample the same position on an update.
let lastX=NaN,lastY=NaN,nearestSite=null,nearestDistance=Infinity;
function locate(p){
 if(lastX===p.x&&lastY===p.y)return nearestSite;
 lastX=p.x;lastY=p.y;nearestDistance=Infinity;
 for(const site of destinations){
  const dx=p.x-site.x,dy=p.y-site.y,d=dx*dx+dy*dy;
  if(d<nearestDistance){nearestDistance=d;nearestSite=site;}
 }
 return nearestSite;
}
export function nearbyGuide(p){
 const room=marketRoomAt(localGyeongju(p));
 if(room)return shopGuides.get(room.name);
 const site=locate(p);
 return nearestDistance<144?site.guide:null;
}
const atStation=p=>Math.hypot(p.x-places.stationExit.x,p.z-places.stationExit.z)<680;
export const sameGyeongjuArea=(a,b)=>atStation(localGyeongju(a))===atStation(localGyeongju(b));
export const coastWalkable=(x,y)=>gyeongjuWalkable(localGyeongju({x,y}));
export const coastDrySpot=coastWalkable;
const bikeIndoor=p=>insideObservatory(p)||inCheonmaHall(p)||Boolean(marketRoomAt(p));
export const enteringBikeInterior=(from,to)=>bikeIndoor(localGyeongju(to))&&!bikeIndoor(localGyeongju(from));
export function coastDryStep(a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.35));
 for(let i=1;i<=n;i++)if(!coastWalkable(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;
 return true;
}
export function spaceWalkRoute(a,b){
 if(!inGyeongjuSpace(a)||!inGyeongjuSpace(b)||!sameGyeongjuArea(a,b))return [];
 return gyeongjuRoute(localGyeongju(a),localGyeongju(b)).map(gyeongjuPoint);
}
let routeWorker,workerUnavailable=false,nextRoute=0;
const pendingRoutes=new Map();
function stopRouteWorker(){
 workerUnavailable=true;
 routeWorker?.terminate();routeWorker=null;
 for(const request of pendingRoutes.values())request.finish(spaceWalkRoute(request.start,request.end));
 pendingRoutes.clear();
}
export function requestCoastWalkingRoute(a,b){
 if(!inGyeongjuSpace(a)||!inGyeongjuSpace(b)||!sameGyeongjuArea(a,b))return Promise.resolve([]);
 const start={x:a.x,y:a.y},end={x:b.x,y:b.y};
 if(!routeWorker&&!workerUnavailable){
  try{
   routeWorker=new Worker(new URL("./gyeongju-route-worker.js",import.meta.url),{type:"module"});
   routeWorker.onmessage=({data:{id,steps}})=>{
    pendingRoutes.get(id)?.finish(steps);pendingRoutes.delete(id);
   };
   routeWorker.onerror=routeWorker.onmessageerror=stopRouteWorker;
  }catch{stopRouteWorker();}
 }
 if(!routeWorker)return Promise.resolve(spaceWalkRoute(start,end));
 const id=++nextRoute;
 return new Promise(finish=>{
  pendingRoutes.set(id,{start,end,finish});
  try{routeWorker.postMessage({id,start,end});}catch{stopRouteWorker();}
 });
}
export function registerGyeongju(){
 addZone({contains:(x,y)=>inGyeongjuSpace({x,y}),walkable:coastWalkable});
 addLandmarks(destinations);
}
export function coastName(p){
 const local=localGyeongju(p),room=marketRoomAt(local);
 if(room)return room.name;
 if(inCheonmaHall(local))return "천마총 전시관";
 if(insideObservatory(local))return "첨성대 내부";
 const nearest=locate(p);
 if(nearestDistance<28**2)return nearest.name;
 if(atStation(local))return "경주역 광장";
 return nearestDistance<135**2?nearest.name+" 일대":"경주 역사유적지구";
}
const bounds=(pts,pad)=>{
 let x=Infinity,y=Infinity,r=-Infinity,b=-Infinity;
 for(const p of pts){x=Math.min(x,p.x);r=Math.max(r,p.x);y=Math.min(y,p.y);b=Math.max(b,p.y);}
 return [Math.floor(x-pad),Math.floor(y-pad),Math.ceil(r-x+2*pad),Math.ceil(b-y+2*pad)].join(" ");
};
const stationBox=bounds([travelStops.stationBus,travelStops.stationExit],65);
const townBox=bounds(destinations.filter(p=>!atStation(localGyeongju(p))),70);
const streetBoxes=new Map(destinations.map(p=>[p,[Math.round(p.x)-190,Math.round(p.y)-150,380,300].join(" ")]));
export function coastBox(p,overview){
 // The overview covers the current walking district. Its bus pin connects to the other district.
 if(atStation(localGyeongju(p)))return stationBox;
 if(overview)return townBox;
 return streetBoxes.get(locate(p));
}
export function drawCoastMap(base,svg,drawMarker,mini=false){
 const path=points=>points.map((p,i)=>{const q=gyeongjuPoint(p);return (i?"L":"M")+q.x.toFixed(1)+" "+q.y.toFixed(1);}).join("");
 for(const box of [stationBox,townBox]){
  const [x,y,width,height]=box.split(" ").map(Number);
  svg(base,"rect",{x:x-400,y:y-400,width:width+800,height:height+800,fill:"#d8d4b9"});
 }
 for(const [kind,fill] of [["lawn","#c9d2af"],["wood","#a9bf9f"],["water","#9cbcc4"]]){
  svg(base,"path",{d:parks.filter(p=>p.kind===kind).map(p=>path(p.points)+"Z").join(""),fill});
 }
 const blocks=buildings.map(b=>path(b.points)+"Z").join("");
 svg(base,"path",{d:blocks,fill:"#b3a896",stroke:"#9e9586","stroke-width":.5});
 for(const m of mounds){
  if(m.name===twinTombName){
   const half=Array.from({length:41},(_,i)=>{const z=-60+3*i;return {x:m.x+z*.043,z:m.z+z,half:39.8*twinSection(z)};});
   const edge=(p,side)=>({x:p.x+side*p.half,z:p.z});
   svg(base,"path",{d:path([...half.map(p=>edge(p,1)),...half.reverse().map(p=>edge(p,-1))])+"Z",fill:"#9eaf7c",stroke:"#829765","stroke-width":1});
   continue;
  }
  const p=gyeongjuPoint(m);
  svg(base,"ellipse",{cx:p.x,cy:p.y,rx:m.rx,ry:m.rz,fill:"#9eaf7c",stroke:"#829765","stroke-width":1,transform:"rotate("+(-(m.yaw??0)*180/Math.PI)+" "+p.x+" "+p.y+")"});
 }
 const colors={street:"#a9a59a",lane:"#ece5d5",path:"#f5edcf",crossing:"#ffffff",platform:"#c9bfac"};
 const groups=new Map();
 for(const road of roads){const key=road.kind+"/"+road.width;groups.set(key,(groups.get(key)??"")+path(road.points));}
 for(const [key,d] of groups){
  const [kind,width]=key.split("/");
  svg(base,"path",{d,fill:"none",stroke:colors[kind]??colors.path,"stroke-width":width,"stroke-linejoin":"round","stroke-linecap":"round"});
 }
 svg(base,"path",{d:walls.map(w=>path(w.points)).join(""),fill:"none",stroke:"#8f7869","stroke-width":1.5});
 for(const [p,kind] of sites)drawMarker(base,p,kind,mini);
}
