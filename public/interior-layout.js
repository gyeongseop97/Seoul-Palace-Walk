import {museumBounds} from "./visit-layout.js";
import {mmcaVenue} from "./mmca-gallery-layout.js";
import {diningVenues} from "./dining-data.js";

export const arcadeBounds={minX:513,maxX:527,minY:504.8,maxY:525.2};
export const arcadeUpperBounds={minX:473,maxX:487,minY:570.8,maxY:591.2};
export const interiorBounds={museum:museumBounds,[mmcaVenue.id]:mmcaVenue.bounds,arcade:arcadeBounds,"arcade-upper":arcadeUpperBounds,
  ...Object.fromEntries(diningVenues.map(venue=>[venue.id,venue.bounds]))};
const rooms=Object.entries(interiorBounds);

export function interiorAt(x,y){
  for(const [id,{minX,maxX,minY,maxY}] of rooms){
    if(x>minX&&x<maxX&&y>minY&&y<maxY)return id;
  }
  return null;
}
