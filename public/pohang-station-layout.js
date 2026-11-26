import geo from "./pohang-geography.js";

// The Donghae Line runs SSW. In this frame u follows the platforms and v faces the bus forecourt.
const origin={x:-3230.2,z:-1830.9};
export const stationYaw=Math.atan2(-.905,-.425);
const c=Math.cos(stationYaw),s=Math.sin(stationYaw);
export const stationPoint=(u,v)=>({x:origin.x+c*u+s*v,z:origin.z-s*u+c*v});
export const hallAxes=p=>({x:(p.x-origin.x)*c-(p.z-origin.z)*s,z:(p.x-origin.x)*s+(p.z-origin.z)*c});
export const stationRing=geo.station.map(([x,z])=>{const p=hallAxes({x,z});return [p.x,p.z];});
export const hallHeight=8.6,platformHeight=4.268,plazaHeight=1.85;
const at=(u,v)=>({x:u,z:v});
function contains(p,ring){
 let yes=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [x,z]=ring[i],[y,w]=ring[j];
  if((z>p.z)!==(w>p.z)&&p.x<(y-x)*(p.z-z)/(w-z)+x)yes=!yes;
 }
 return yes;
}
function segment(p,a,b){
 const x=b.x-a.x,z=b.z-a.z,len=Math.hypot(x,z),dx=p.x-a.x,dz=p.z-a.z;
 return {along:(dx*x+dz*z)/len,side:(dz*x-dx*z)/len,len};
}
function segmentDistance(p,a,b){
 const {along,side,len}=segment(p,a,b);return Math.hypot(side,Math.max(-along,along-len,0));
}
export const frontDoorLocal=at(...stationRing[10]);
// The mapped entrance is at the corner between the two angled sections of the NW façade.
export const frontStairBase=at(frontDoorLocal.x-14.8,frontDoorLocal.z+14.8);
export const stationDoor=stationPoint(frontDoorLocal.x,frontDoorLocal.z);
export const stationForecourt=stationPoint(frontStairBase.x-.5,frontStairBase.z+.8);
export const stationHall=stationPoint(-20,18);
export const stationShop=stationPoint(-17,34.6);
export const counterLocal={x:-17,z:36.5};
export const platformDoor=stationPoint(51,-70.8);
export const arrival=stationPoint(51,-68);
export const train=stationPoint(39,-74.8);
export const transferLanding=at(.5,-66.7);
export const transferStairEnd=at(25.5,-66.7);
export const stationWalkLine=[stationForecourt,stationDoor,stationPoint(-46,19),stationPoint(5.8,12),stationPoint(5.8,0),stationPoint(.5,-62),stationPoint(.5,-66.7),stationPoint(25.5,-66.7),arrival,platformDoor];
// OSM 760158842/843. The overhead finger of 333372704 ends above the eastern island.
export const platformRings=[
 [[-101.1,-63.6],[-101.3,-71.8],[240.8,-71.3],[240.5,-63.7]],
 [[-101.8,-47.4],[-101.8,-55],[240.1,-53.8],[239.8,-46.3]]
];
const ringPoints=stationRing.map(([u,v])=>at(u,v));
const transferSide=2.35,stairWidth=9;
const platformStair=p=>p.x>=3.5&&p.x<=transferStairEnd.x&&Math.abs(p.z-transferLanding.z)<=transferSide;
const landing=p=>p.x>=-4.4&&p.x<=3.5&&p.z>=-69.1&&p.z<=-63.5;
const outerFlight=p=>segment(p,frontStairBase,frontDoorLocal);
function stairs(t,count,low,high){
 return low+(high-low)*Math.min(1,Math.max(0,Math.ceil(t*count-1e-5)/count));
}
export function stationFloor(p){
 if(Math.abs(p.x-origin.x)>295||Math.abs(p.z-origin.z)>320)return null;
 const q=hallAxes(p),f=outerFlight(q);
 if(Math.abs(f.side)<=stairWidth/2+.07&&f.along>=-.03&&f.along<=f.len+.04)return stairs(f.along/f.len,36,plazaHeight,hallHeight);
 if(platformStair(q))return stairs((transferStairEnd.x-q.x)/22,24,platformHeight,hallHeight);
 if(landing(q)||contains(q,stationRing))return hallHeight;
 if(platformRings.some(r=>contains(q,r)))return platformHeight;
 return null;
}
export function withinStation(p){
 return Math.abs(p.x-origin.x)<300&&Math.abs(p.z-origin.z)<320;
}
function nearDoor(q){return Math.hypot(q.x-frontDoorLocal.x,q.z-frontDoorLocal.z)<4.7;}
function stairRail(q,f){
 if(Math.abs(f.side)>stairWidth/2-.18&&Math.abs(f.side)<stairWidth/2+.32&&f.along>.6&&f.along<f.len-.5)
  return plazaHeight+(hallHeight-plazaHeight)*f.along/f.len+1.20;
 if(q.x>=3.5&&q.x<25&&Math.abs(Math.abs(q.z-transferLanding.z)-transferSide)<.28)
  return hallHeight-(hallHeight-platformHeight)*(q.x-3.5)/22+1.11;
 return null;
}
export function stationRailHeight(p){
 if(!withinStation(p))return null;
 const q=hallAxes(p);return stairRail(q,outerFlight(q));
}
export function stationObstacle(p,height){
 if(!withinStation(p))return false;
 const q=hallAxes(p),f=outerFlight(q);
 if(height<hallHeight+8.2){
  const rail=stairRail(q,f);if(rail!=null&&height<rail-.015)return true;
  if(!nearDoor(q)){
   for(let i=0;i<ringPoints.length;i++){
    if(i===2)continue; // the glazed bridge opens at the platform landing
    if(segmentDistance(q,ringPoints[i],ringPoints[(i+1)%ringPoints.length])<.36)return true;
   }
  }
  if(q.x>counterLocal.x-3.4&&q.x<counterLocal.x+3.4&&q.z>counterLocal.z-.54&&q.z<39.6)return true;
  if(q.x>=-1.5&&q.x<=4&&Math.abs(q.z+69)<.30)return true;
 }
 return height<platformHeight+3.2&&q.x>-.8&&q.x<83.6&&Math.abs(q.z+74.8)<1.92;
}
export function stationAccess(p,feet=plazaHeight){
 if(!withinStation(p))return null;
 const q=hallAxes(p);
 if(stationFloor(p)!==null)return !stationObstacle(p,feet);
 // Keep the rail yard, the elevated station plinth, and embankment off the public road network.
 if(q.z<1.5&&q.z>-102&&q.x>-111&&q.x<246)return false;
 if(segmentDistance(q,at(-100,14),frontStairBase)<9||segmentDistance(q,at(-88,32),frontStairBase)<8)return true;
 return null;
}
export {beachShop} from "./pohang-cafe-site.js";
