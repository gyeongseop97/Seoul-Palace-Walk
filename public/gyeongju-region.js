import {hillStart,hillLength,hillPoint,hillLane} from "./outdoor-sports.js";
import {addLandmarks,addZone} from "./layout.js";
import {gyeongjuGuides} from "./gyeongju-guide.js";
import {marketRooms,marketCounters,marketRoomAt} from "./gyeongju-market.js";
import {gyeongjuBikeDocks} from "./gyeongju-bike.js";
import {gyeongjuBusStops} from "./gyeongju-bus.js";
import {raftStops} from "./gyeongju-raft-layout.js";
export {nearRaftStop} from "./gyeongju-raft-layout.js";
export {marketDiningAt} from "./gyeongju-market.js";
import {insideObservatory} from "./gyeongju-observatory.js";
import {inCheonmaHall,cheonmaLayer,twinTombName,twinSection} from "./daereungwon.js";
import {gyeongjuPoint,localGyeongju,inGyeongjuSpace} from "./region-coordinates.js";
import {places,roads,buildings,walls,mounds,parks,gyeongjuRoute,gyeongjuWalkable} from "./gyeongju-layout.js";
import {inBulguksa,templeSites,templePaths,templeHalls,templeBridges,templeCourts,templePonds,templeWoods} from "./bulguksa-layout.js";
import {lawnEdge} from "./bulguksa-ground.js";
import {beachBoundary,beachDestinations,beachWalkways,beachServices,inCaliforniaBeach} from "./california-beach-layout.js";
import {beachPools} from "./california-beach-water.js";
import {inAmusementPark,parkBoundary,parkDestinations,parkRides,parkServices,parkFountain,parkWalkways} from "./gyeongju-world-layout.js";
import {templeRoomAt} from "./bulguksa-hall-layout.js";
export {templeWorshipAt} from "./bulguksa-hall-layout.js";
export {gyeongjuOrigin,gyeongjuPoint,inGyeongjuSpace} from "./region-coordinates.js";

const districtByPlace={stationExit:"경주역",stationBus:"경주역",townBus:"황리단길",townReturnBus:"황리단길",hwangnidan:"황리단길",
 stars:"첨성대·계림",observatoryEntrance:"첨성대·계림",gyerimEntry:"첨성대·계림",gyerim:"첨성대·계림",naemul:"첨성대·계림",
 woljeongNorth:"교촌·월정교",woljeong:"교촌·월정교",woljeongSouth:"교촌·월정교"};
const tombAtSite={cheonmaDoor:"천마총",geomchong:"검총",twinTomb:twinTombName,michu:"미추왕릉",naemul:"내물왕릉"};
const describe=(id,name,guideTitle=name)=>{
 const p=places[id];
 const tomb=mounds.find(m=>m.name===tombAtSite[id]);
 return {...gyeongjuPoint(p),name,label:name,heading:p.heading??0,district:districtByPlace[id]??"대릉원",
  caption:tomb?{...gyeongjuPoint(tomb),name:tomb.name.replace("대릉원 ","")}:undefined,guide:{...gyeongjuGuides[id],title:guideTitle}};
};
export const travelStops={
 stationExit:describe("stationExit","경주역 출입구"),stationBus:describe("stationBus","경주역 버스정류장"),
 townBus:describe("townBus","황리단길 정류장"),townReturnBus:describe("townReturnBus","경주역행 정류장"),
 templeBus:{...templeSites[0],...gyeongjuPoint(templeSites[0]),district:"불국사",label:templeSites[0].name}
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
 ...beachDestinations.map(s=>[s,s.name.includes("카페테리아")?"shop":"activity"]),
 ...parkDestinations.map((point,i)=>[point,i===0?"heritage":i<=parkRides.length?"activity":["restaurant","snack","cafe"].includes(parkServices[i-1-parkRides.length]?.type)?"shop":"activity"]),
 [{...hillStart,name:"산악 루지·잔디썰매 출발장",label:"산악 루지·잔디썰매",district:"교촌·월정교",heading:270,guide:{title:"산악 루지·잔디썰매",description:"월정교 동쪽에 조성한 게임 속 산악 코스예요.",directions:"출발장에서 탈것을 고르세요. 좌우로 조향하고 뒤로 당겨 감속하세요. 깃발 사이로 지나면 기록에서 벌점을 피할 수 있어요."}},"activity"],
 [travelStops.stationExit,"railway"],[travelStops.stationBus,"bus"],[travelStops.townBus,"bus"],[travelStops.townReturnBus,"bus"],
 [describe("hwangnidan","황리단길"),"activity"],
 ...marketRooms.map(r=>[{...gyeongjuPoint(r.entry),name:r.name,label:r.name,heading:r.heading,district:r.id==="pub"?"교촌·월정교":"황리단길",guide:{...r.guide,title:r.name}},"shop"]),
 ...gyeongjuBikeDocks.map(d=>[{...d.access,name:d.name,label:d.name,heading:d.heading,
  district:{"gj-hwangnidan":"황리단길","gj-daereungwon":"대릉원","gj-cheomseongdae":"첨성대·계림","gj-woljeong":"교촌·월정교"}[d.id],guide:d.guide},"bike"]),
 ...cityBusSites.map(p=>[p,"bus"]),
 ...raftStops.map(stop=>[{...stop.board,name:stop.name,label:stop.name,district:"교촌·월정교",
  guide:{title:stop.name,description:"남천을 건너며 동쪽으로 월정교를 바라볼 수 있는 게임 속 뗏목 선착장이에요.",
   directions:"나무 발판 끝에서 뗏목이 닿으면 자리를 골라 타세요. ‘노 잡기’를 누르면 직접 저을 수 있어요. 어느 쪽 나루든 가까이 가서 ‘나루에 대기’를 누르면 내릴 수 있어요.",
   source:"https://www.gyeongju.go.kr/design/tour2019/file/tourMap/tourMap2_250821.pdf",sourceLabel:"경주시 교촌마을 안내도"}},"activity"]),
 [describe("northGate","대릉원 후문"),"heritage"],[describe("photo","대릉원 목련 포토존"),"heritage"],
 [describe("cheonmaDoor","천마총 전시관 입구"),"heritage"],[describe("cheonmaGallery","천마총 전시실"),"heritage"],
 [describe("twinTomb","황남대총 연못 전망길"),"heritage"],[describe("michu","미추왕릉 참배길"),"heritage"],
 [describe("geomchong","검총 관람길"),"heritage"],[describe("naemul","내물왕릉 관람길"),"heritage"],
 [describe("mainGate","대릉원 정문"),"heritage"],[describe("stars","첨성대 관람길","첨성대"),"heritage"],
 [describe("observatoryEntrance","첨성대 남쪽 창"),"heritage"],[describe("gyerimEntry","계림 북쪽 입구"),"park"],
 [describe("gyerim","계림 숲길"),"park"],[describe("woljeongNorth","월정교 북쪽 입구"),"heritage"],
 [describe("woljeong","월정교"),"heritage"],[describe("woljeongSouth","월정교 남쪽 입구"),"heritage"],
 [travelStops.templeBus,"bus"],...templeSites.slice(1).map(site=>[{...site,...gyeongjuPoint(site),district:"불국사",label:site.name},site.kind])
];
export const destinations=sites.map(([p])=>p);
const defaultPlace={경주역:"경주역 출입구",황리단길:"황리단길",대릉원:"대릉원 정문","첨성대·계림":"첨성대 관람길","교촌·월정교":"월정교 북쪽 입구",불국사:"불국사 일주문",경주월드:"경주월드 정문",캘리포니아비치:"캘리포니아비치 입구"};
export const travelDistricts=Object.fromEntries(Object.entries(defaultPlace).map(([name,first])=>{
 const local=destinations.filter(p=>p.district===name);
 return [name,[local.find(p=>p.name===first),...local.filter(p=>p.name!==first)]];
}));
const shopGuides=new Map(sites.filter(([,type])=>type==="shop").map(([site])=>[site.name,site.guide]));
const templeGuides=new Map(templeSites.map(site=>[site.name,site.guide]));
// The location badge, guide action and map all sample the same position on an update.
let lastX=NaN,lastY=NaN,nearestSite=null,nearestDistance=Infinity;
export const coastDistrict=p=>locate(p)?.district??"경주 역사유적지구";
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
 const local=localGyeongju(p),room=marketRoomAt(local);
 if(room)return shopGuides.get(room.name);
 const hall=inBulguksa(local)&&templeRoomAt(local);
 if(hall)return templeGuides.get("불국사 "+hall.name);
 const site=locate(p);
 return nearestDistance<144?site.guide:null;
}
const atStation=p=>Math.hypot(p.x-places.stationExit.x,p.z-places.stationExit.z)<680;
function walkingArea(point){
 const p=localGyeongju(point);
 return inAmusementPark(p)?"park":inBulguksa(p)?"temple":atStation(p)?"station":"town";
}
export const sameGyeongjuArea=(a,b)=>walkingArea(a)===walkingArea(b);
const busTerminals={
 station:{name:"경주역",board:travelStops.stationBus,arrive:travelStops.stationBus},
 town:{name:"황리단길",board:travelStops.townReturnBus,arrive:travelStops.townBus},
 park:{name:"경주월드",board:parkDestinations[0],arrive:parkDestinations[0]},
 temple:{name:"불국사",board:travelStops.templeBus,arrive:travelStops.templeBus}
};
export function busDirection(to){
 return busTerminals[walkingArea(to)].name+"행";
}
export function transferStop(from){
 return busTerminals[walkingArea(from)].board;
}
export function transferDestinations(stop){
 return Object.values(busTerminals).filter(terminal=>terminal.board!==stop);
}
export function gyeongjuNextUp(from,to){
 return cheonmaLayer({...localGyeongju(from),up:from.up},localGyeongju(to));
}
export function coastWalkable(x,y,passage){
 const origin=passage?.from,from=origin&&{...localGyeongju(origin),up:origin.up};
 return gyeongjuWalkable(localGyeongju({x,y}),from,Number.isFinite(passage?.airFeet)?passage.airFeet:undefined);
}
export const coastDrySpot=coastWalkable;
const bikeIndoor=(p,up)=>insideObservatory(p)||!up&&inCheonmaHall(p)||Boolean(marketRoomAt(p))||Boolean(inBulguksa(p)&&templeRoomAt(p));
export const enteringBikeInterior=(from,to)=>bikeIndoor(localGyeongju(to),gyeongjuNextUp(from,to))&&!bikeIndoor(localGyeongju(from),from.up);
export function coastDryStep(a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.35));
 let from=a;
 for(let i=1;i<=n;i++){
  const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;
  if(!coastWalkable(x,y,{from}))return false;
  from={x,y,up:gyeongjuNextUp(from,{x,y})};
 }
 return true;
}
export function spaceWalkRoute(a,b){
 if(!inGyeongjuSpace(a)||!inGyeongjuSpace(b)||!sameGyeongjuArea(a,b))return [];
 return gyeongjuRoute({...localGyeongju(a),up:a.up},localGyeongju(b)).map(gyeongjuPoint);
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
 const start={x:a.x,y:a.y,up:Boolean(a.up)},end={x:b.x,y:b.y};
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
 const hall=inBulguksa(local)&&templeRoomAt(local);
 if(hall)return "불국사 "+hall.name+" 법당";
 if(inCheonmaHall(local))return p.up?"천마총 봉분":"천마총 전시관";
 if(insideObservatory(local))return "첨성대 내부";
 const nearest=locate(p);
 if(nearestDistance<28**2)return nearest.name;
 if(inCaliforniaBeach(local))return "캘리포니아비치";
 if(inAmusementPark(local))return "경주월드";
 if(atStation(local))return "경주역 광장";
 if(inBulguksa(local)&&nearestDistance>=135**2)return "불국사 관람로";
 return nearestDistance<135**2?nearest.name+" 일대":"경주 역사유적지구";
}
const bounds=(pts,pad)=>{
 let x=Infinity,y=Infinity,r=-Infinity,b=-Infinity;
 for(const p of pts){x=Math.min(x,p.x);r=Math.max(r,p.x);y=Math.min(y,p.y);b=Math.max(b,p.y);}
 return [Math.floor(x-pad),Math.floor(y-pad),Math.ceil(r-x+2*pad),Math.ceil(b-y+2*pad)].join(" ");
};
const stationBox=bounds([travelStops.stationBus,travelStops.stationExit],65);
const townBox=bounds(destinations.filter(p=>walkingArea(p)==="town"),70);
const templeBox=bounds([...templePaths,...templeHalls].flatMap(r=>r.points.map(gyeongjuPoint)),28);
const amusementBox=bounds([...parkBoundary,...beachBoundary].map(gyeongjuPoint),22),beachBox=bounds(beachBoundary.map(gyeongjuPoint),14);
const [coreX,coreY,coreWidth,coreHeight]=templeBox.split(" ").map(Number);
const lawnBox=bounds(lawnEdge.map(gyeongjuPoint),8);
export const mapDistricts=[
 {name:"경주역",point:travelStops.stationBus,box:stationBox},
 {name:"경주 시내",point:travelStops.townBus,box:townBox},
 {name:"경주월드",point:parkDestinations[0],box:amusementBox},
 {name:"캘리포니아비치",point:beachDestinations[0],box:beachBox},
 {name:"불국사",point:travelStops.templeBus,box:templeBox}
];
export const cityMapBox=bounds(mapDistricts.map(d=>d.point),3400);
export const mapGround="#d8d4b9";
export function routeMapBox(p){
 if(inCaliforniaBeach(localGyeongju(p)))return beachBox;
 if(inAmusementPark(localGyeongju(p)))return amusementBox;
 // Keep route fitting local to the pedestrian network the player is using.
 if(atStation(localGyeongju(p)))return stationBox;
 if(inBulguksa(localGyeongju(p))){
  return p.x>=coreX&&p.x<=coreX+coreWidth&&p.y>=coreY&&p.y<=coreY+coreHeight?templeBox:lawnBox;
 }
 return townBox;
}
export function drawCoastMap(base,svg,drawMarker,mini=false){
 const path=points=>points.map((p,i)=>{const q=gyeongjuPoint(p);return (i?"L":"M")+q.x.toFixed(1)+" "+q.y.toFixed(1);}).join("");
 svg(base,"path",{d:path(parkBoundary)+"Z",fill:"#bac6a0",stroke:"#839578","stroke-width":2});
 for(const walkway of parkWalkways)svg(base,"path",{d:path(walkway),fill:"none",stroke:"#f3dfb4","stroke-width":9,"stroke-linecap":"round","stroke-linejoin":"round"});
 for(const r of parkRides){
  const p=gyeongjuPoint(r);
  svg(base,"ellipse",{cx:p.x,cy:p.y,rx:r.radius||31,ry:r.id==="splash"?34:r.radius||45,fill:r.id==="splash"?"#83b3c3":"#cab0a2",stroke:"#947b70","stroke-width":1.4});
 }
 for(const s of parkServices){
  const p=gyeongjuPoint(s);
  svg(base,"rect",{x:p.x-s.w/2,y:p.y-s.d/2,width:s.w,height:s.d,rx:1,fill:"#ad896a",stroke:"#836951"});
 }
 const fountain=gyeongjuPoint(parkFountain);
 svg(base,"circle",{cx:fountain.x,cy:fountain.y,r:5.6,fill:"#8bbdc3",stroke:"#d4c1a4"});
 svg(base,"path",{d:path(beachBoundary)+"Z",fill:"#e1d1ae",stroke:"#a5b39b","stroke-width":1.6});
 for(const walk of beachWalkways)svg(base,"path",{d:path(walk),fill:"none",stroke:"#faf1d6","stroke-width":5,"stroke-linejoin":"round"});
 for(const pool of beachPools){
  const d=[pool.outline,...pool.holes].map(r=>path(r)+"Z").join("");
  svg(base,"path",{d,fill:"#7cc8d2",stroke:"#4798a9","stroke-width":1,"fill-rule":"evenodd"});
 }
 for(const s of beachServices){
  const q=gyeongjuPoint(s);
  svg(base,"rect",{x:q.x-s.w/2,y:q.y-s.d/2,width:s.w,height:s.d,fill:"#bf9877"});
 }
 for(const [kind,fill] of [["lawn","#c9d2af"],["wood","#a9bf9f"],["water","#9cbcc4"]]){
  svg(base,"path",{d:parks.filter(p=>p.kind===kind).map(p=>path(p.points)+"Z").join(""),fill});
 }
 const courseLine=side=>Array.from({length:69},(_,i)=>localGyeongju(hillPoint(i*hillLength/68,side)));
 svg(base,"path",{d:path([...courseLine(-40),...courseLine(40).reverse()])+"Z",fill:"#b1c29a"});
 for(const [kind,color] of [["luge","#9a9c99"],["sled","#8ea75f"]])
  svg(base,"path",{d:path(courseLine(hillLane(kind))),fill:"none",stroke:color,"stroke-width":8,"stroke-linecap":"round"});
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
 for(const [rings,fill] of [[[lawnEdge],"#c9d2af"],[templeWoods,"#a9bf9f"],[templePonds,"#9cbcc4"],[templeCourts,"#f5edcf"],
  [templeHalls.map(b=>b.points),"#b3a896"],[templeBridges.map(b=>b.points),"#c9bfac"]])
  svg(base,"path",{d:rings.map(r=>path(r)+"Z").join(""),fill});
 for(const kind of ["footway","path","steps"])svg(base,"path",{d:templePaths.filter(r=>r.kind===kind).map(r=>path(r.points)).join(""),
  fill:"none",stroke:kind==="steps"?"#ac9a82":"#f5edcf","stroke-width":kind==="footway"?5:2.7,"stroke-linecap":"round","stroke-linejoin":"round"});
 for(const [p,kind] of sites)drawMarker(base,p,kind,mini);
}
