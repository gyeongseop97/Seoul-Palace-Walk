import {seaPoint,inCoastSpace} from "./region-coordinates.js";
import {shore,promenade} from "./pohang-beach-profile.js";
import {inKiteLawn} from "./plaza-layout.js";

export const PICNIC_WIDTH=2.64;
export const PICNIC_DEPTH=2.10;
export const PICNIC_REACH=3.9;
export const PICNIC_OFFER_MS=60000;
export const PICNIC_SLOTS=[
  [-.91,-.53],[-.31,-.53],[.31,-.53],[.91,-.53],
  [-.91,.52],[-.31,.52],[.31,.52],[.91,.52]
];

export const picnicKinds=["cannedBeer","cupNoodles","cheese","soju","sashimi","grilledClam","coffee","crepe","parfait","beer","yakgwa","cake","bingsu","bungeoppang","riceCake",
  "ssambap","hwangnamBread","sikhye","beopju",
  "makgeolli","wine","fruitWine","highball","bungeoppangCustard","bungeoppangBurnt","bungeoppangTorn","hotteok","hotteokBurnt","hotteokTorn"];
export const isPicnicItem=kind=>picnicKinds.includes(kind);
export const picnicGap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function picnicBlanketFits(point){
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;
  if(inCoastSpace(point)){const {x,z}=seaPoint(point);return z>-860&&z<275&&x>promenade(z)+9&&x<shore(z)-6;}
  return [-1,1].every(side=>[-1,1].every(edge=>inKiteLawn(
    point.x+side*(PICNIC_WIDTH/2+.04),point.y+edge*(PICNIC_DEPTH/2+.04)
  )));
}

export function nearestPicnic(point,mats){
  if(!point)return null;
  let nearest=null,distance=PICNIC_REACH;
  for(const mat of mats){
    const gap=picnicGap(point,mat);
    if(gap<=distance){nearest=mat;distance=gap;}
  }
  return nearest;
}
