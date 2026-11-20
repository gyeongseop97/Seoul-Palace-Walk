import {festivalBooth} from "./pohang-festival-site.js";
import {ground} from "./pohang-layout.js";

export function buildFestivalBooth(root,{box,post,sign}){
 const x=festivalBooth.x-1.45,z=festivalBooth.z,h=ground({x,z});
 box(root,0x3c5458,x,h+.49,z,1.25,.98,.71);
 box(root,0xc2a679,x,h+.99,z,1.44,.10,.84);
 for(const side of [-1,1])post(root,0x75533d,x+side*.62,h+1.57,z-.30,.045,1.25,.045);
 box(root,0x394d5e,x,h+2.21,z,1.72,.14,1.12);
 sign(root,"영일대 불꽃축제",x,h+1.91,z-.22,1.23,.32,"#263e51",0);
 sign(root,"영일대 불꽃축제",x,h+1.91,z-.38,1.23,.32,"#263e51",Math.PI);
}
