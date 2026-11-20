// Korea Tourism Organization's Oh Bremen entrance listing, Haean-ro 191-1.
// The surveyed Haean-ro segment runs ENE; its seaward normal faces the cove.
export const cafeAddressPoint={lat:36.0644256555183,lon:129.384226157405};
const center={x:(cafeAddressPoint.lon-129.378)*89950,z:(36.055-cafeAddressPoint.lat)*111020};
const roadDx=629-564.6,roadDz=-1050.6+1018.6,length=Math.hypot(roadDx,roadDz);
const c=roadDx/length,s=-roadDz/length;
export const cafeFace={x:center.x+10.7*s,z:center.z+10.7*c,yaw:Math.atan2(s,c)};
export function cafePoint(x,z){return {x:cafeFace.x+x*c+z*s,z:cafeFace.z-x*s+z*c};}
export function cafeLocal(p){
 const x=p.x-cafeFace.x,z=p.z-cafeFace.z;
 return {x:x*c-z*s,z:x*s+z*c};
}
const ring=(front,rear)=>[[-21.60,rear],[21.60,rear],[21.60,front],[-21.60,front]].map(([x,z])=>{
 const p=cafePoint(x,z);return [p.x,p.z];
});
// OSM maps this street but does not contain a footprint at the tourism pin.
// Model the recessed four-storey volume behind the first-floor terrace.
export const cafeBackdrop=[13.8,ring(-10.74,-21.4)];
export const cafeFootprint=ring(.12,-21.4);
export const beachShop=cafePoint(0,1.72);
export function onCafeApron(p){
 const q=cafeLocal(p);return q.z>=.08&&q.z<=9.2&&Math.abs(q.x)<21.65;
}
