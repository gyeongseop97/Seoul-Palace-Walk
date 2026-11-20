import {inPark,parkEntry,parkRoad} from "./space-walk-layout.js";
import {expansionWildlife} from "./expansion-wildlife.js";
import {promenade} from "./pohang-layout.js";
import {addZone,addLandmarks} from "./layout.js";
import {coastPoint,seaPoint,inCoastSpace} from "./region-coordinates.js";
import {geo,arrival,station,stationHall,sideStreets,kioskWall,stationShop,beachShop,train,hallAxes,beachStop,pavilion,boardRack,dock,tables,route,pier,shore,inBounds,inWater,onDock,onPier,distance} from "./pohang-layout.js";

export const destinations=[[arrival,"포항역"],[beachStop,"영일대 정류장"],[boardRack,"백사장"],[{x:dock.x-1,z:dock.z},"선착장"],[parkEntry,"스페이스워크"],[tables[0],"바다야장"],[pavilion,"해상누각"]]
 .map(([p,name])=>({...coastPoint(p),label:name,name,heading:90}));
export const counters=[{...coastPoint(stationShop),kind:"churu",name:"포항역 매점"},{...coastPoint(beachShop),kind:"coffee",name:"영일대 커피"}];
const blocks=geo.blocks.map(([height,polygon])=>({height,polygon,minX:Math.min(...polygon.map(p=>p[0])),maxX:Math.max(...polygon.map(p=>p[0])),minZ:Math.min(...polygon.map(p=>p[1])),maxZ:Math.max(...polygon.map(p=>p[1]))}));
const blocksByCell=new Map();
for(const b of blocks)for(let x=Math.floor(b.minX/80);x<=Math.floor(b.maxX/80);x++)
 for(let z=Math.floor(b.minZ/80);z<=Math.floor(b.maxZ/80);z++){
  const cell=x+","+z;if(!blocksByCell.has(cell))blocksByCell.set(cell,[]);blocksByCell.get(cell).push(b);
 }
export function coastObstacle(p,height){
 if(height<5.1&&kioskWall(p))return true;
 if(height<7.55&&p.x>train.x-7.24&&p.x<train.x-3.75&&p.z>train.z-16&&p.z<train.z+69)return true;
 if(Math.abs(p.x-stationHall.x)<55&&Math.abs(p.z-stationHall.z)<55&&height<11.4){
  const h=hallAxes(p);
  if(Math.abs(h.x)<45.5&&Math.abs(h.z-18.6)<.66||Math.abs(Math.abs(h.x)-44.8)<.69&&Math.abs(h.z)<19||
     Math.abs(h.z+19.15)<.65&&Math.abs(h.x)>8&&Math.abs(h.x)<45)return true;
 }
 const nearby=blocksByCell.get(Math.floor(p.x/80)+","+Math.floor(p.z/80));
 for(const b of nearby??[]){
  if(height>b.height+1.85)continue;
  if(p.x<b.minX||p.x>b.maxX||p.z<b.minZ||p.z>b.maxZ)continue;
  let inside=false;
  for(let i=0,j=b.polygon.length-1;i<b.polygon.length;j=i++){
   const [a,z]=b.polygon[i],[c,v]=b.polygon[j];
   if((z>p.z)!==(v>p.z)&&p.x<(c-a)*(p.z-z)/(v-z)+a)inside=!inside;
  }
  if(inside)return true;
 }
 return false;
}
export function coastWalkable(x,y){
 const p=seaPoint({x,y});
 if(inPark(p))return true;
 if(!inBounds(p))return false;
 return onDock(p)||onPier(p)||!coastObstacle(p,2.1);
}
export function registerCoast(){
 addZone({contains:(x,y)=>inCoastSpace({x,y}),walkable:coastWalkable});
 addLandmarks(destinations);
 const trails=[-95,-240,-415,-660].map(z=>Array.from({length:12},(_,i)=>coastPoint({x:promenade(z+i*3)+1,z:z+i*3})));
 if(!expansionWildlife.some(a=>a.id==="pohang"))expansionWildlife.push({id:"pohang",bounds:{minX:9350,maxX:10950,minY:5060,maxY:6330},land:coastWalkable,trails,perches:[],catCount:8,birdCount:22});
}
export function coastName(point){
 const p=seaPoint(point);
 if(inPark(p))return Math.hypot(p.x-parkEntry.x,p.z-parkEntry.z)<85?"환호공원 스페이스워크":"환호공원 해안 산책로";
 if(point.coast?.mode==="deck")return "영일만 크루즈";
 if(point.coast?.mode==="bus")return "영일대행 해변버스";
 if(distance(p,station)<65||distance(p,stationHall)<55)return "포항역";
 if(tables.some(t=>distance(p,t)<7))return "영일대 바다야장";
 if(onPier(p))return "영일대 해상누각";
 if(onDock(p))return "크루즈 선착장";
 return inWater(p)?"영일만":Math.abs(p.x-shore(p.z))<150?"영일대해수욕장":"포항 해안로";
}
export function coastBox(point,overview){
 if(overview)return "6500 3350 5000 3150";
 if(inPark(seaPoint(point)))return "10200 4670 1140 740";
 const p=seaPoint(point);
 if(distance(p,station)<150)return [coastPoint(station).x-115,coastPoint(station).y-100,230,200].join(" ");
 if(Math.abs(p.x-shore(p.z))<700)return "9730 4990 970 1430";
 return "6550 3750 4050 2600";
}
export function drawCoastMap(base,svg,drawMarker,mini=false){
 const pts=a=>a.map(p=>{const q=coastPoint(p);return q.x+","+q.y;}).join(" ");
 const path=(list,color,width)=>svg(base,"polyline",{points:pts(list),fill:"none",stroke:color,"stroke-width":width,"stroke-linejoin":"round"});
 svg(base,"rect",{x:4600,y:2500,width:7400,height:5200,fill:"#d5d0b4"});
 const edge=Array.from({length:160},(_,i)=>({z:-3400+i*32,x:shore(-3400+i*32)}));
 svg(base,"polygon",{points:pts([...edge,{x:2200,z:1800},{x:2200,z:-3400}]),fill:"#88b6c4"});
 path(edge,"#e9cf9e",9);path(parkRoad,"#9caa7e",16);
 svg(base,"path",{d:sideStreets.map(({a,b})=>"M"+(10000+a.x)+" "+(6000+a.z)+"L"+(10000+b.x)+" "+(6000+b.z)).join(""),stroke:"#efe9d9","stroke-width":5,fill:"none"});
 for(const way of geo.coastRoads)path(way.map(([x,z])=>({x,z})),"#f4ebd6",7);
 path(route,"#8c796d",14);path(route,"#efe6d8",10);path(pier,"#aa7958",4);
 const footprints=geo.blocks.map(([,ring])=>"M"+ring.map(([x,z])=>(10000+x).toFixed(1)+" "+(6000+z).toFixed(1)).join("L")+"Z").join("");
 svg(base,"path",{d:footprints,fill:"#bcb7a8",stroke:"#aea899","stroke-width":.8});
 svg(base,"polygon",{points:pts(geo.station.map(([x,z])=>({x,z}))),fill:"#999f9d",stroke:"#657572","stroke-width":1.4});
 const categories=["railway","bus","park","activity","heritage","shop","heritage"];
 destinations.forEach((p,i)=>drawMarker(base,p,categories[i],mini));
 for(const p of counters)drawMarker(base,p,"shop",mini);
}
