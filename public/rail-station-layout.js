import {boardingIslands,roofBeds,hallOrigin,railPoint} from "./station-levels.js";
import {terminalPose as surveyedPose,terminalDoorOffsets} from "./station-approach-plan.js";
import {cultureVenues,registerCultureFurniture} from "./culture-station-layout.js";
// Room coordinates are shared by the renderer, collision map, room server and minimap.
const point=(x,y,heading=0)=>({x,y,heading});
function room(id,name,x,y,w,d,outsideDoor,exit,spawn,enterLabel,exitLabel,parent=null){
  return {id,name,area:"station",center:{x,y},bounds:{minX:x-w/2,maxX:x+w/2,minY:y-d/2,maxY:y+d/2},
    outsideDoor,insideDoor:point(x+exit[0],y+exit[1],exit[2]),insideSpawn:point(x+spawn[0],y+spawn[1],spawn[2]),
    enterLabel,exitLabel,parent};
}
// The glass doors are in the east end wall of the concourse, facing the upper terrace.
export const terminalPose=surveyedPose;
export function terminalPoint(x,z){
  const {angle}=terminalPose,c=Math.cos(angle),s=Math.sin(angle);
  return {x:terminalPose.x+x*c+z*s,y:terminalPose.y-x*s+z*c};
}
export const terminalDoors=terminalDoorOffsets.map(x=>({...terminalPoint(x,6.2),heading:50,up:true}));
export const stationHall=room("station-hall","서울역 2층 맞이방",hallOrigin.x,hallOrigin.y,42,58,
  terminalDoors[2],[0,26.6,180],[0,23,0],"서울역 들어가기","서울역광장으로");
export const hallDoors=terminalDoors.map((outside,i)=>({outside,inside:railPoint((i-2)*7,26.6)}));
export const railPlatform=room("ktx-platform","서울역 KTX 승강장",hallOrigin.x,hallOrigin.y-95.5,8.7,97,
  point(1640,666,180),[0,36,180],[0,32,0],"승강장 내려가기","맞이방 올라가기",stationHall.id);
export const ktxCoach=room("ktx-coach","KTX 일반실",1810,690,3.9,23.8,
  {...railPoint(3,-83.5),heading:270},[-1.05,9.5,90],[0,8.6,0],"KTX 타기","KTX 내리기",railPlatform.id);
export const railRooms=[stationHall,railPlatform,ktxCoach,...cultureVenues];
export const railRoomById=Object.fromEntries(railRooms.map(v=>[v.id,v]));
export const railShopPlots=[
  {name:"옥상정원 커피",kind:"coffee",x:-22,z:-125,angle:-Math.PI/2,w:5.6,d:2.7,level:9.6,color:0x6c7859,ink:"#fff3d8",sign:"#4f5a46"},
  {name:"맞이방 전망 카페",kind:"coffee",x:-27.4,z:-13.5,angle:Math.PI/2,w:7.8,d:2.6,level:5.1,color:0x795140,ink:"#f9eddc",sign:"#634233"},
  {name:"제철 과일모찌",kind:"fruitMochi",x:-16.0,z:13.4,angle:1.80,w:6.5,d:3.4,color:0x86585b,ink:"#72434c",sign:"#f2e5d2"},
  {name:"여행 편의점",kind:"churu",x:-12.65,z:21.4,angle:2.06,w:7.4,d:3.4,color:0x277b75,ink:"#fff4db",sign:"#196663"},
  {name:"서울역 버거",kind:"stationBurger",x:-16.2,z:-8.15,angle:1.38,w:8.5,d:4,color:0xa74e34,ink:"#ffefc8",sign:"#973d2e"},
  {name:"플랫폼 커피",kind:"coffee",x:-13.5,z:-19.0,angle:1.14,w:8.4,d:4,color:0x5f7769,ink:"#f9eedd",sign:"#3c574d"}
];
export const railCounters=railShopPlots.flatMap(p=>{
  const counter={name:p.name,kind:p.kind,area:"station",interior:stationHall.id,
    x:stationHall.center.x+p.x+Math.sin(p.angle)*(p.d/2+.98),y:stationHall.center.y+p.z+Math.cos(p.angle)*(p.d/2+.98)};
  if(p.kind!=="churu")return [counter];
  const along=u=>({...counter,x:counter.x+Math.cos(p.angle)*u,y:counter.y-Math.sin(p.angle)*u});
  return [along(-1.24),{...along(1.40),kind:"triangleRice",secondary:true}];
});
export const plazaCafe={name:"서울역사점 · 광장 카페",kind:"coffee",area:"station",x:21.3,y:1491.9,up:true};
export const seatRows=[-7.6,-5.65,-3.7,-1.75,.2,2.15,4.1,6.05];
// Aisle and window seat centres, measured from the middle of the car.
export const seatOffsets=[.9,1.56];
export const waitingRows=[[-9,1],[-9,-6],[1,1],[1,-6]];
export const extraWaitingRows=[[3.18,1],[3.18,-6],[5.36,1],[5.36,-6],[-6.82,1],[-6.82,-6],[8.4,12.4],[10.58,12.4],[8.4,16.4],[10.58,16.4]];
export const hallColumns=[[-17,-24],[17,-24],[-17,23],[17,23],[-17,3],[18,5]];
export function registerRailFurniture(add,benches){
  registerCultureFurniture(add);
  for(const r of [ktxCoach]){
    const b=r.bounds,w=b.maxX-b.minX,d=b.maxY-b.minY;
    for(const x of [b.minX,b.maxX])add(x,r.center.y,.12,d);
    for(const y of [b.minY,b.maxY])add(r.center.x,y,w,.12);
  }
  const hall=(x,z,w,d,h)=>add(stationHall.center.x+x,stationHall.center.y+z,w,d,0,h);
  for(const p of railShopPlots)add(stationHall.center.x+p.x,stationHall.center.y+p.z,p.w,p.d,p.angle);
  for(const [x,z] of hallColumns)hall(x,z,.64,.64);
  for(const {x} of boardingIslands)for(let z=40;z<74;z+=9)hall(x,z,.22,.22);
  hall(16,-13,6,9); // ticket counter enclosure
  hall(16,-7.55,5.3,.72); // ticket machines
  hall(10.5,21.5,2.3,2.3); // information desk
  function waitingSeat([x,z]){
    const cx=stationHall.center.x+x,cy=stationHall.center.y+z;
    hall(x,z,2.1,.67,.88);
    benches.push({x:cx,y:cy,slots:[-.51,.51].map(dx=>({x:cx+dx,y:cy,heading:0,
      approach:point(cx+dx,cy-1.05),base:-.018}))});
  }
  waitingRows.forEach(waitingSeat);
  const {center:c}=ktxCoach;
  for(const z of seatRows)for(const side of [-1,1]){
    const x=c.x+side*1.23,y=c.y+z;
    add(x,y,1.22,.74,0,.98);
    benches.push({x,y,slots:seatOffsets.map((u,i)=>({x:c.x+side*u,y,heading:0,base:-.03,
      approach:point(c.x+side*.15,y-.34+i*.26)}))});
  }
  extraWaitingRows.forEach(waitingSeat);
  for(const bed of roofBeds)hall(bed.x,bed.z,bed.w,2.25,.67);
}
