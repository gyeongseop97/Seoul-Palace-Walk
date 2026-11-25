import {addLandmarks,addZone} from "./layout.js";
import {gyeongjuPoint,localGyeongju,inGyeongjuSpace} from "./region-coordinates.js";
import {places,roads,buildings,walls,mounds,parks,gyeongjuRoute,gyeongjuWalkable} from "./gyeongju-layout.js";
export {gyeongjuOrigin,gyeongjuPoint,inGyeongjuSpace} from "./region-coordinates.js";

const describe=(local,name,heading=local.heading??0)=>({...gyeongjuPoint(local),name,label:name,heading});
export const travelStops={
 stationExit:describe(places.stationExit,"경주역 출입구"),
 stationBus:describe(places.stationBus,"경주역 버스정류장"),
 townBus:describe(places.townBus,"황리단길 정류장"),
 townReturnBus:describe(places.townReturnBus,"경주역행 정류장")
};
export const platformArrival=travelStops.stationExit;
export const counters=[];
const sites=[
 [travelStops.stationExit,"railway"],[travelStops.stationBus,"bus"],[travelStops.townBus,"bus"],[travelStops.townReturnBus,"bus"],
 [describe(places.hwangnidan,"황리단길"),"activity"],[describe(places.cafe,"황리단길 한옥 카페"),"shop"],
 [describe(places.northGate,"대릉원 후문"),"heritage"],[describe(places.photo,"대릉원 목련 포토존"),"heritage"],
 [describe(places.mainGate,"대릉원 정문"),"heritage"],[describe(places.stars,"첨성대 관람길"),"heritage"]
];
export const destinations=sites.map(([p])=>p);
const atStation=p=>Math.hypot(p.x-places.stationExit.x,p.z-places.stationExit.z)<680;
export const sameGyeongjuArea=(a,b)=>atStation(localGyeongju(a))===atStation(localGyeongju(b));
export const coastWalkable=(x,y)=>gyeongjuWalkable(localGyeongju({x,y}));
export const coastDrySpot=coastWalkable;
export function coastDryStep(a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.35));
 for(let i=1;i<=n;i++)if(!coastWalkable(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;
 return true;
}
export function spaceWalkRoute(a,b){
 if(!inGyeongjuSpace(a)||!inGyeongjuSpace(b)||!sameGyeongjuArea(a,b))return [];
 return gyeongjuRoute(localGyeongju(a),localGyeongju(b)).map(gyeongjuPoint);
}
export const requestCoastWalkingRoute=spaceWalkRoute;
export function registerGyeongju(){
 addZone({contains:(x,y)=>inGyeongjuSpace({x,y}),walkable:coastWalkable});
 addLandmarks(destinations);
}
export function coastName(p){
 let nearest=null,best=Infinity;
 for(const site of destinations){
  const d=Math.hypot(site.x-p.x,site.y-p.y);
  if(d<best){best=d;nearest=site;}
 }
 if(best<28)return nearest.name;
 if(atStation(localGyeongju(p)))return "경주역 광장";
 return best<135?nearest.name+" 일대":"경주 역사유적지구";
}
const bounds=(pts,pad)=>{
 let x=Infinity,y=Infinity,r=-Infinity,b=-Infinity;
 for(const p of pts){x=Math.min(x,p.x);r=Math.max(r,p.x);y=Math.min(y,p.y);b=Math.max(b,p.y);}
 return [Math.floor(x-pad),Math.floor(y-pad),Math.ceil(r-x+2*pad),Math.ceil(b-y+2*pad)].join(" ");
};
const stationBox=bounds([travelStops.stationBus,travelStops.stationExit],65);
const townBox=bounds(destinations.filter(p=>!atStation(localGyeongju(p))),70);
export function coastBox(p,overview){
 // The overview covers the current walking district. Its bus pin connects to the other district.
 if(atStation(localGyeongju(p)))return stationBox;
 if(overview)return townBox;
 const anchor=destinations.slice(2).reduce((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)<Math.hypot(p.x-b.x,p.y-b.y)?a:b);
 return [Math.round(anchor.x)-190,Math.round(anchor.y)-150,380,300].join(" ");
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
