import {stationShop,beachShop} from "./pohang-station-layout.js";
import {coastPoint} from "./region-coordinates.js";
import {coastalRetail} from "./coast-retail-layout.js";

// East frontage of the mapped building on Haean-ro, facing the pedestrian sidewalk.
export const martFront={x:-26.5,z:-172,yaw:Math.atan2(4,1)};
const martDoor={x:martFront.x+1.8*Math.sin(martFront.yaw),z:martFront.z+1.8*Math.cos(martFront.yaw)};
const stock=["cannedBeer","cupNoodles","churu"];
export const coastCounters=[
 {...coastPoint(stationShop),name:"포항역 편의점",kind:"churu",stock},
 {...coastPoint(beachShop),name:"영일대 커피",kind:"coffee"},
 {...coastPoint(martDoor),name:"해안로 편의점",kind:"churu",stock},
 ...coastalRetail.map(({entry,name,kind,stock,actionLabel})=>({...coastPoint(entry),name,kind,stock,actionLabel}))
];
