import {boardingIslands,concourseParts,slabEdges,outdoorFlight,ktxIsland,platformGate,roofBeds,hallOrigin,hallSpan,railPoint,partAt} from "./station-levels.js";
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
// Inside, the same five doors stand in the east end wall of the long concourse.
const hallBounds={minX:hallOrigin.x+hallSpan.x0,maxX:hallOrigin.x+hallSpan.x1,minY:hallOrigin.y+hallSpan.z0,maxY:hallOrigin.y+hallSpan.z1};
export const stationHall={...room("station-hall","서울역 2층 맞이방",hallOrigin.x,hallOrigin.y,1,1,
  terminalDoors[2],[hallSpan.x1-1.8,0,90],[hallSpan.x1-5,0,270],"서울역 들어가기","서울역광장으로"),bounds:hallBounds};
export const hallDoors=terminalDoors.map((outside,i)=>{
  const z=-terminalDoorOffsets[i];
  return {outside,inside:railPoint(hallSpan.x1-1.8,z),arrive:{...railPoint(hallSpan.x1-4.4,z),heading:270}};
});
// The KTX island lies south of the concourse. Its room is built facing north, toward the stairs.
export const ktxStairs={x:-8.7,width:5};
export const railPlatform=room("ktx-platform","서울역 KTX 승강장",hallOrigin.x+ktxIsland.x,hallOrigin.y+platformGate.z1+ktxIsland.length/2,8.7,ktxIsland.length,
  {...railPoint(ktxStairs.x,hallSpan.z1-2.5),heading:180},[ktxStairs.x-ktxIsland.x,-44.5,0],[0,-40,180],"승강장 내려가기","맞이방 올라가기",stationHall.id);
const islands=[ktxIsland,...boardingIslands].sort((a,b)=>b.x-a.x);
const coachDoorZ=platformGate.z1+ktxIsland.length/2-12;
export const ktxBerths=islands.flatMap((island,index)=>[1,-1].map((side,i)=>{
  const track=index*2+i+1,railOffset=island===ktxIsland?6.2:6.4;
  return {track,side,x:island.x+side*railOffset,z:coachDoorZ-side*12,
    landing:{...railPoint(island.x+side*3,coachDoorZ),heading:side>0?270:90,track}};
}));
export const ktxBoardingSpots=ktxBerths.map(berth=>berth.landing);
export function ktxBoardingAt(x,y){
  if(partAt(x,y)?.id!=="ktx-platform")return null;
  const u=x-hallOrigin.x,index=islands.findIndex(island=>Math.abs(u-island.x)<=4.35);
  if(index<0)return null;
  return ktxBoardingSpots[index*2+(u<islands[index].x?1:0)];
}
export const ktxCoach=room("ktx-coach","KTX 일반실",1810,690,3.9,23.8,
  ktxBoardingSpots[3],[-1.05,9.5,90],[0,8.6,0],"KTX 타기","KTX 내리기",railPlatform.id);
export const railRooms=[stationHall,railPlatform,ktxCoach,...cultureVenues];
export const railRoomById=Object.fromEntries(railRooms.map(v=>[v.id,v]));
// Shops line the north wall and open south onto the concourse; x and z are their centres.
const north=hallSpan.z0;
export const railShopPlots=[
  {name:"옥상정원 커피",kind:"coffee",x:7,z:-114,angle:-Math.PI/2,w:5.6,d:2.7,level:9.6,color:0x6c7859,ink:"#fff3d8",sign:"#4f5a46"},
  {name:"맞이방 전망 카페",kind:"coffee",x:-5.6,z:-27,angle:Math.PI/2,w:7.8,d:2.6,level:5.1,color:0x795140,ink:"#f9eddc",sign:"#634233"},
  {name:"제철 과일모찌",kind:"fruitMochi",x:-44.2,z:north+1.8,angle:0,w:6.5,d:3.4,color:0x86585b,ink:"#72434c",sign:"#f2e5d2"},
  {name:"여행 편의점",kind:"churu",x:-52.4,z:north+1.8,angle:0,w:7.4,d:3.4,color:0x277b75,ink:"#fff4db",sign:"#196663"},
  {name:"서울역 버거",kind:"stationBurger",x:-36.6,z:north+2.1,angle:0,w:8.5,d:4,color:0xa74e34,ink:"#ffefc8",sign:"#973d2e"},
  {name:"플랫폼 커피",kind:"coffee",x:-60.4,z:north+2.1,angle:0,w:8.4,d:4,color:0x5f7769,ink:"#f9eedd",sign:"#3c574d"}
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
// Waiting seats stand in blocks down the middle of the hall and face the departure board.
const seatBlock=(x,rows)=>rows.flatMap(z=>[-2.18,0,2.18].map(dx=>[x+dx,z]));
const waitingSeats=[...seatBlock(-20.5,[-2,-5.5]),...seatBlock(-32.5,[-2,-5.5]),...seatBlock(-44.5,[-2,-5.5]),...seatBlock(-86.5,[-2,-5.5])];
export const waitingRows=waitingSeats.slice(0,4),extraWaitingRows=waitingSeats.slice(4);
// Roof trusses stand on paired columns every 17 m, clear of the gates and the north openings.
export const hallBays=[20,3,-14,-31,-48,-65,-82,-99];
export const hallColumns=hallBays.flatMap(x=>[[x,hallSpan.z0+1.4],[x,hallSpan.z1-1.4]]);
export const ticketOffice={x:-5.5,z:north+2.6,w:13,d:5.2},ticketMachines={x:6.5,z:north+.62,count:5,pitch:1.05};
export const infoDesk={x:11,z:0},departureBoard={x:-32.5,z:hallSpan.z1-2.3,w:12.9};
export function registerRailFurniture(add,benches){
  registerCultureFurniture(add);
  for(const r of [ktxCoach]){
    const b=r.bounds,w=b.maxX-b.minX,d=b.maxY-b.minY;
    for(const x of [b.minX,b.maxX])add(x,r.center.y,.12,d);
    for(const y of [b.minY,b.maxY])add(r.center.x,y,w,.12);
  }
  const hall=(x,z,w,d,h)=>add(stationHall.center.x+x,stationHall.center.y+z,w,d,0,h);
  for(const p of railShopPlots)add(stationHall.center.x+p.x,stationHall.center.y+p.z,p.w,p.d,p.angle);
  // Walls stop the camera as well as walkers. Each is a thin box whose collision margin ends
  // exactly on the edge of the floor, so it never narrows a doorway or a neighbouring stair.
  const thin=.02,out=.29+thin/2,trim=.58;
  for(const p of concourseParts){
    if(p.flush||["lift","platform","island"].includes(p.style))continue;
    if(p.style==="stairs"){
      if(!outdoorFlight(p))for(const x of [p.x0-out,p.x1+out])hall(x,(p.z0+p.z1)/2,thin,p.z1-p.z0-trim);
      continue;
    }
    for(const run of slabEdges(p)){
      const lengthX=Math.abs(run.x1-run.x0),lengthZ=Math.abs(run.z1-run.z0);
      if(run.kind!=="wall"&&p.style!=="hall"||lengthX+lengthZ<trim+.05)continue;
      // The concourse walls carry doors, signs and mullions on their inner face.
      const reach=out-(p.style==="hall"?.42:0);
      hall((run.x0+run.x1)/2+run.nx*reach,(run.z0+run.z1)/2+run.nz*reach,run.nx?thin:lengthX-trim,run.nz?thin:lengthZ-trim);
    }
  }
  for(const [x,z] of hallColumns)hall(x,z,.64,.64);
  for(const {x} of boardingIslands)for(let z=platformGate.z1+3;z<platformGate.z1+platformGate.length;z+=9)hall(x,z,.22,.22);
  hall(ticketOffice.x,ticketOffice.z,ticketOffice.w,ticketOffice.d);
  hall(ticketMachines.x,ticketMachines.z,ticketMachines.count*ticketMachines.pitch+.1,.72);
  hall(infoDesk.x,infoDesk.z,2.3,2.3);
  function waitingSeat([x,z]){
    const cx=stationHall.center.x+x,cy=stationHall.center.y+z;
    hall(x,z,2.1,.67,.88);
    benches.push({x:cx,y:cy,slots:[.51,-.51].map(dx=>({x:cx+dx,y:cy,heading:180,
      approach:point(cx+dx,cy+1.05),base:-.018}))});
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
