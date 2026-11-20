import {beachStop,promenade} from "./pohang-layout.js";

const z=beachStop.z-85;
export const festivalBooth={x:promenade(z)+1.5,z,name:"불꽃축제 안내대"};
export function canStartFestival(p){
 return p?.mode==="walk"&&Math.hypot(p.x-festivalBooth.x,p.z-festivalBooth.z)<=3.5;
}
