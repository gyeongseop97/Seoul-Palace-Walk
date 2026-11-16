import {museumBounds} from "./visit-layout.js";
import {mmcaVenue} from "./mmca-gallery-layout.js";
import {diningVenue} from "./dining-data.js";

export const interiorBounds={museum:museumBounds,[mmcaVenue.id]:mmcaVenue.bounds,[diningVenue.id]:diningVenue.bounds};
const rooms=Object.entries(interiorBounds);

export function interiorAt(x,y){
  for(const [id,{minX,maxX,minY,maxY}] of rooms){
    if(x>minX&&x<maxX&&y>minY&&y<maxY)return id;
  }
  return null;
}
