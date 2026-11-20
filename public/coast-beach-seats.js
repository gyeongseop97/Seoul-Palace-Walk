import {ground,promenade,shore} from "./pohang-layout.js";
import {coastPoint} from "./region-coordinates.js";

// Both chairs face the bay. Render their cushions and place the seated avatars
// from the same coordinates, including the slope of the sand below each chair.
export const beachParasols=Array.from({length:18},(_,index)=>{
 const z=-520+index*39,x=(shore(z)+promenade(z))/2;
 const chairs=[-.91,.91].map(offset=>{
  const p={x:x-.16,z:z+offset},floor=ground(p);
  return {...p,floor,top:floor+.50};
 });
 return {x,z,index,floor:ground({x,z}),chairs};
});

export const beachBenches=beachParasols.map(({x,z,chairs})=>({
 ...coastPoint({x,z}),beach:true,
 slots:chairs.map(c=>({...coastPoint(c),heading:90,beach:true,top:c.top,
  approach:coastPoint({x:c.x+.75,z:c.z})}))
}));
