import {clamp,dock,mooring,wave} from "./pohang-layout.js";
import {cruiseFurnitureBlocks} from "./coast-vessel-seats.js";
import {studioDock,studioMooring} from "./coast-studio-layout.js";

export const bridge={aft:2.75,front:8.65,half:2.55,door:.83,floor:7.85};
export const cruiseScale=1.35,mainFloor=2.46,midFloor=5.46;
// The outer stringer carries the handrail. The other side opens onto the landing.
export const cruiseStairs=[
 {x:-2.50,start:-15.66,end:-11.76,half:1.04,from:mainFloor,to:midFloor,steps:16,side:-1},
 {x:1.55,start:-9.65,end:-5.55,half:1.06,from:midFloor,to:bridge.floor,steps:13,side:1}
];
const [aftStair,upperStair]=cruiseStairs;
export const loungePorch={aft:-13.16,front:aftStair.end,left:aftStair.x+aftStair.half,right:3.30};
export const cruiseHullStations=[[-18,.70],[-15,.95],[-9,1],[0,1],[8,.94],[13,.76],[17,.44],[20,.035]];
const loungeRailsFore=cruiseHullStations.slice(1).map(([station,ratio])=>
 [4.26*ratio,aftStair.end+(station+18)/38*(12.75-aftStair.end)]);
const stairEdge=Math.abs(aftStair.x)+aftStair.half;
export const loungeRails={
 port:[[stairEdge,aftStair.end],[stairEdge,aftStair.end+1.12],...loungeRailsFore],
 starboard:[[loungePorch.right,loungePorch.aft],[loungePorch.right,loungePorch.front],...loungeRailsFore]
};
export const mainDeckRail={aft:-17.8,front:19.5,half:5.05};
export const salonBowDoor={z:9.85,half:.90};
export const salonPortDoor={z:0,half:1.38};
export function inSalonPortDoor(p,clearance=0){
 return p.x<0&&Math.abs(p.z-salonPortDoor.z)<salonPortDoor.half-clearance;
}
export const salonTaperStart=6;
export function salonSideHalfWidth(z){
 const taper=clamp((z-salonTaperStart)/(salonBowDoor.z-salonTaperStart),0,1);
 return 3.85-.55*taper;
}
const railEdge=cruiseHullStations.map(([station,ratio])=>({
 x:mainDeckRail.half*ratio,z:mainDeckRail.aft+(station+18)/38*(mainDeckRail.front-mainDeckRail.aft)
}));
const railSegments=railEdge.slice(1).map((b,i)=>{
 const a=railEdge[i],slope=(b.x-a.x)/(b.z-a.z);
 return {...a,slope,normal:Math.hypot(1,slope)};
});
// Offset each side of the convex rail outline by the passenger's clearance,
// including the steep diagonal sides which meet at the pointed bow.
export function mainDeckRailHalfWidth(z,clearance=0){
 if(z<mainDeckRail.aft+clearance||z>mainDeckRail.front-clearance)return 0;
 let half=Infinity;
 for(const edge of railSegments){
  half=Math.min(half,edge.x+(z-edge.z)*edge.slope-clearance*edge.normal);
 }
 return Math.max(0,half);
}
export const exitGate={x:-mainDeckRail.half,z:0,half:1.22,run:1.30,drop:.61};
export const gangwayToe=exitGate.x-exitGate.run;
export const boardingSpot={x:exitGate.x+.57,z:exitGate.z};
export function gangwayHeight(p){
 if(!p||Math.abs(p.z-exitGate.z)>exitGate.half-.22||p.x<gangwayToe||p.x>boardingSpot.x)return null;
 return mainFloor-exitGate.drop*clamp((exitGate.x-p.x)/exitGate.run,0,1);
}
export function nearCruiseExit(p){
 const ramp=gangwayHeight(p);
 if(ramp!=null&&Math.abs(p.h-ramp)<.15)return true;
 return Boolean(p&&Math.abs(p.h-mainFloor)<.15&&Math.abs(p.z-exitGate.z)<exitGate.half+.15&&
  p.x< -salonSideHalfWidth(p.z)-.24&&p.x> -mainDeckRailHalfWidth(p.z,.26));
}
export function cruiseBerth(ship){
 if(!ship||Math.abs(ship.speed??0)>=.01)return null;
 // The foot of the lowered gangway must land on the pier, clear of its outer posts.
 const span=gangwayToe*cruiseScale;
 const x=ship.x+span*Math.cos(ship.yaw),z=ship.z-span*Math.sin(ship.yaw);
 if(Math.cos(ship.yaw)>.985&&x>=dock.x-1.40&&x<=dock.x-.06&&Math.abs(z-dock.z)<.85)return dock;
 if(Math.cos(ship.yaw)<-.985&&x>=studioDock.x+.06&&x<=studioDock.x+1.40&&Math.abs(z-studioDock.z)<.85)return studioDock;
 return null;
}
export const cruiseAtBerth=ship=>cruiseBerth(ship)!==null;
export const helmStation={x:-.46,z:6.15};
export const serviceSpot={x:-1.56,z:-8.24};
export const nearHelm=p=>p&&(p.h==null||p.h>7.7)&&Math.hypot(p.x-helmStation.x,p.z-helmStation.z)<1.15;
export function inWheelhouse(p){
 return Boolean(p&&Math.abs(p.h-bridge.floor)<.15&&p.z>bridge.aft+.23&&p.z<=bridge.front-.27&&
  Math.abs(p.x)<=bridge.half-.25&&deckHeight(p,p.h)===bridge.floor);
}
function lowerDeck(p){
 const x=Math.abs(p.x);
 if(x>=mainDeckRailHalfWidth(p.z,.26))return null;
 if(cruiseFurnitureBlocks(p,mainFloor))return null;
 if(p.z< -8.05)return mainFloor;
 if(p.z< -7.58&&x<4.13&&x>.72)return null;
 const cabinHalf=salonSideHalfWidth(p.z);
 if(p.z<=salonBowDoor.z+.25&&Math.abs(x-cabinHalf)<.25&&!inSalonPortDoor(p,.25))return null;
 if(Math.abs(p.z-salonBowDoor.z)<.25&&x<cabinHalf&&x>salonBowDoor.half-.24)return null;
 return mainFloor;
}
function stairHeight(stair,p){
 const sideways=(p.x-stair.x)*stair.side;
 if(p.z<stair.start||p.z>stair.end||sideways< -stair.half||sideways>stair.half-.15)return null;
 return stair.from+(stair.to-stair.from)*(p.z-stair.start)/(stair.end-stair.start);
}
function middleDeck(p){
 if(p.z<loungePorch.aft||p.z>upperStair.end)return null;
 if(p.z<aftStair.end&&p.x<loungePorch.left)return null;
 const rail=p.x<0?loungeRails.port:loungeRails.starboard;
 for(let i=1;i<rail.length;i++){
  const [width,z]=rail[i];
  if(p.z>z)continue;
  const [prevWidth,prevZ]=rail[i-1];
  const half=prevWidth+(width-prevWidth)*clamp((p.z-prevZ)/(z-prevZ),0,1);
  if(Math.abs(p.x)>half-.15)return null;
  break;
 }
 if(Math.abs(p.x+1.65)<1.36&&Math.abs(p.z+7.02)<.51)return null;
 return cruiseFurnitureBlocks(p,midFloor)?null:midFloor;
}
function upperDeck(p){
 if(p.z<upperStair.end||p.z>bridge.front-.27||Math.abs(p.x)>2.75)return null;
 if(p.z>=bridge.aft-.23&&p.z<=bridge.aft+.23&&Math.abs(p.x)>bridge.door-.21)return null;
 if(p.z>bridge.aft&&Math.abs(p.x)>bridge.half-.25)return null;
 if(p.z>6.81&&p.z<7.98&&Math.abs(p.x)<1.81)return null;
 return cruiseFurnitureBlocks(p,bridge.floor)?null:bridge.floor;
}
export function deckHeight(p,previous=p?.h){
 if(!p)return null;
 for(const stair of cruiseStairs){
  const h=stairHeight(stair,p);
  if(h==null)continue;
  if(previous==null||Math.abs(previous-h)<.49)return h;
  // The high end leaves headroom on the deck below. The low treads block a side entry.
  if(Math.abs(previous-stair.from)<.49&&h-previous<1.78)return null;
 }
 if(previous==null)return upperDeck(p)??middleDeck(p)??lowerDeck(p);
 if(Math.abs(previous-mainFloor)<.49)return lowerDeck(p);
 if(Math.abs(previous-midFloor)<.49)return middleDeck(p);
 if(Math.abs(previous-bridge.floor)<.49)return upperDeck(p);
 return null;
}
function crossesOpenEdge(from,to,axis,line,min,max){
 const delta=to[axis]-from[axis];
 if(!delta)return false;
 const t=(line-from[axis])/delta;
 if(t<0||t>1)return false;
 const along=axis==="x"?"z":"x",v=from[along]+t*(to[along]-from[along]);
 return v>=min&&v<=max;
}
// A jump can leave either aft terrace or the unrailed side of a flight. The
// first solid surface below those openings catches it; walls and rails stay solid.
export function deckJumpSurface(from,to,currentFloor,feetHeight){
 if(!from||!to||!Number.isFinite(currentFloor)||!Number.isFinite(feetHeight))return null;
 for(const stair of cruiseStairs){
  if(currentFloor<=stair.from+.01||currentFloor>stair.to+.01)continue;
  const inside=stair.x-stair.side*stair.half;
  const crossesFlight=crossesOpenEdge(from,to,"x",inside,stair.start,stair.end);
  const onUpperLanding=Math.abs(currentFloor-stair.to)<.02;
  const crossesTerrace=onUpperLanding&&to.z<from.z&&(stair===aftStair?
   crossesOpenEdge(from,to,"z",loungePorch.aft,loungePorch.left,loungePorch.right-.15):
   crossesOpenEdge(from,to,"z",upperStair.end,-2.75,2.75));
  if(!crossesFlight&&!crossesTerrace)continue;
  // The lounge slab meets the top part of the aft flight along its inboard side.
  // Dropping through that slab would put the passenger underneath the landing.
  if(stair===aftStair&&crossesFlight&&to.x>inside&&to.z>=loungePorch.aft)return null;
  const onFlight=to.z>=stair.start&&to.z<=stair.end&&Math.abs(to.x-stair.x)<=stair.half;
  const h=onFlight?stairHeight(stair,to):(stair===aftStair?lowerDeck(to):middleDeck(to));
  if(h!=null&&h<currentFloor&&h<=feetHeight)return h;
 }
 return null;
}

// Sample along the waterline on both axes. The protected berth has very little swell.
export function hullAttitude(ship,at){
 const s=Math.sin(ship.yaw),c=Math.cos(ship.yaw),t=at/1000%14400;
 const w=(x,z)=>wave(ship.x+x*c+z*s,ship.z-x*s+z*c,t);
 const fore=w(0,10),aft=w(0,-10),star=w(3.5,0),port=w(-3.5,0);
 const berthDistance=Math.min(Math.hypot(ship.x-mooring.x,ship.z-mooring.z),Math.hypot(ship.x-studioMooring.x,ship.z-studioMooring.z));
 const exposure=.075+.925*clamp((berthDistance-5)/58,0,1);
 return {heave:(fore+aft+port+star)*.085*exposure,
  pitch:clamp((aft-fore)/20,-.038,.038)*exposure,roll:clamp((star-port)/7,-.052,.052)*exposure};
}
// THREE's YXZ hull rotation. Reverse the x/z projection for the deck's known
// height, so walking and drawing use the same tilted plane.
export function deckToSea(ship,p,at,height=deckHeight(p)??5.46){
 const {pitch,roll,heave}=hullAttitude(ship,at),c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 const cr=Math.cos(roll),sr=Math.sin(roll),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const x=p.x*cruiseScale*cr-height*sr,y=p.x*cruiseScale*sr+height*cr,z=y*sp+p.z*cruiseScale*cp;
 return {x:ship.x+x*c+z*s,z:ship.z-x*s+z*c,h:heave+y*cp-p.z*cruiseScale*sp};
}
export function seaToDeck(ship,p,at,previous){
 const {pitch,roll}=hullAttitude(ship,at),c=Math.cos(ship.yaw),s=Math.sin(ship.yaw);
 const dx=p.x-ship.x,dz=p.z-ship.z,flatX=dx*c-dz*s,flatZ=dx*s+dz*c;
 const cr=Math.cos(roll),sr=Math.sin(roll),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const local={x:flatX/cruiseScale,z:flatZ/cruiseScale};
 for(let i=0;i<2;i++){
  const h=deckHeight(local,previous)??previous??(local.z> -5.55?7.85:5.46);
  local.x=(flatX+h*sr)/(cr*cruiseScale);local.z=(flatZ-(local.x*cruiseScale*sr+h*cr)*sp)/(cp*cruiseScale);
 }
 return local;
}
