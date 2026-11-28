import {promenade} from "./pohang-layout.js";
import {festivalBooth} from "./pohang-festival-site.js";
import {coastPoint} from "./region-coordinates.js";

export const MARKET_ANGLE=-Math.PI/2;
function marketSpot(offset){
  const z=festivalBooth.z+offset;
  return {x:promenade(z)+2.8,z};
}

export const beachMarketStalls=[
  {id:"bungeo-yeongildae",name:"영일대 야시장 붕어빵",kind:"bungeo",spot:marketSpot(8)},
  {id:"hotteok-yeongildae",name:"영일대 야시장 호떡",kind:"hotteok",spot:marketSpot(14)}
];
export const beachPiano={body:marketSpot(22),name:"영일대 바다 피아노"};
beachPiano.action=coastPoint({x:beachPiano.body.x-1.85,z:beachPiano.body.z});

export function beachMarketObstacle(p,height){
  return beachMarketStalls.some(({spot})=>height<4.1&&Math.abs(p.x-spot.x)<.55&&Math.abs(p.z-spot.z)<1.31)||
    height<3.1&&Math.abs(p.x-beachPiano.body.x)<.36&&Math.abs(p.z-beachPiano.body.z)<.81;
}
