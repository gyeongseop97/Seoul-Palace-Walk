import {cafeFace,cafePoint,cafeLocal} from "./pohang-cafe-site.js";
export {cafePoint,cafeLocal} from "./pohang-cafe-site.js";
import {coastPoint} from "./region-coordinates.js";

export const cafeGround=1.85,cafeRoof=6.10;
export const cafeDoor=cafePoint(0,1.0),cafeCounter=cafePoint(4.3,-6.7);
export const cafeSeats=[cafeGround,cafeRoof].flatMap(floor=>[-13,-6.8,6.4].map(x=>({
 x,z:floor===cafeRoof?-2.75:-2.18,floor,yaw:(x<0?-9:12)*Math.PI/180
})));
export const cafeBenches=cafeSeats.map(({x,z,floor,yaw})=>{
 const seatPoint=(dx,dz)=>coastPoint(cafePoint(x+Math.cos(yaw)*dx+Math.sin(yaw)*dz,z-Math.sin(yaw)*dx+Math.cos(yaw)*dz));
 return {...seatPoint(0,0),cafe:floor===cafeRoof?"테라스에 앉기":"창가에 앉기",
  slots:[-.64,.64].map(dx=>({...seatPoint(dx,0),heading:(180-(cafeFace.yaw+yaw)*180/Math.PI+360)%360,
   cafeFloor:floor,top:floor+.49,approach:seatPoint(dx,-.78)}))};
});
export function inCafeBounds(p){const q=cafeLocal(p);return Math.abs(q.x)<=21.62&&q.z>=-10.65&&q.z<=.26;}
function stair(q){return Math.abs(q.x-16.5)<1.34&&q.z<=-1.23&&q.z>=-9.55;}
function blocked(q,floor){
 if(Math.abs(q.x)>21.27||q.z< -10.36)return true;
 if(q.z>-.20&&(floor>cafeGround+.4||Math.abs(q.x)>1.42))return true;
 if(floor<cafeGround+.3&&q.x>1.0&&q.x<10&&q.z< -7.53)return true;
 return false;
}
export function cafeLevel(p,previous=cafeGround){
 if(!inCafeBounds(p))return null;
 const q=cafeLocal(p),upper=previous>cafeRoof-.46;
 if(stair(q)){
  const rise=Math.min(1,Math.max(0,(-q.z-1.55)/7.48));
  return cafeGround+(cafeRoof-cafeGround)*rise;
 }
 return upper?cafeRoof:cafeGround;
}
export function cafeStep(from,to,previous=cafeGround){
 const inside=inCafeBounds(from),target=inCafeBounds(to);
 if(!inside&&!target)return undefined;
 if(!target)return previous<cafeGround+.55&&Math.abs(cafeLocal(from).x)<1.48&&cafeLocal(to).z>0;
 const q=cafeLocal(to),height=cafeLevel(to,previous);
 if(!inside&&(Math.abs(q.x)>1.42||q.z<-.45))return false;
 return !blocked(q,height)&&Math.abs(height-previous)<.46;
}
export function cafeCameraWall(p,height){
 if(!inCafeBounds(p))return false;
 const q=cafeLocal(p);if(height>cafeRoof+.98)return false;
 if(height>cafeRoof-.24&&height<cafeRoof+.10&&!stair(q))return true;
 return (Math.abs(q.x)>21.34||q.z< -10.38||(q.z>-.16&&Math.abs(q.x)>1.5))&&height<cafeRoof+.86;
}
export function pickCafe(ray,level=cafeGround){
 const o=ray.origin,d=ray.direction;
 if(Math.hypot(o.x-cafeFace.x,o.z-cafeFace.z)>50||d.y>-.03)return null;
 // Test the viewer's floor and reproject on the stairs when the first hit is a tread.
 let distance=(level-o.y)/d.y;
 for(let i=0;i<3;i++){
  if(distance<=0||distance>85)return null;
  const p={x:o.x+d.x*distance,z:o.z+d.z*distance},h=cafeLevel(p,level);
  if(h==null)return null;
  if(Math.abs(h-o.y-d.y*distance)<.04)return {distance,point:coastPoint(p)};
  distance=(h-o.y)/d.y;
 }
 return null;
}
