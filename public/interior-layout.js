import {culturePart} from "./culture-station-layout.js";
import {partAt} from "./station-levels.js";
import {railRooms} from "./rail-station-layout.js";
import {semaVenue} from "./sema-layout.js";
import {museumBounds} from "./visit-layout.js";
import {mmcaVenue} from "./mmca-gallery-layout.js";
import {diningVenues} from "./dining-data.js";

export const arcadeBounds={minX:513,maxX:527,minY:504.8,maxY:525.2};
export const arcadeUpperBounds={minX:473,maxX:487,minY:570.8,maxY:591.2};
export const arcadeThirdBounds={minX:532,maxX:546,minY:570.8,maxY:591.2};
export const interiorBounds={...Object.fromEntries(railRooms.map(v=>[v.id,v.bounds])),museum:museumBounds,[semaVenue.id]:semaVenue.bounds,[mmcaVenue.id]:mmcaVenue.bounds,arcade:arcadeBounds,"arcade-upper":arcadeUpperBounds,
  "arcade-third":arcadeThirdBounds,
  ...Object.fromEntries(diningVenues.map(venue=>[venue.id,venue.bounds]))};
const rooms=Object.entries(interiorBounds).filter(([id])=>!id.startsWith("culture284"));

export function interiorAt(x,y){
  const culture=culturePart(x,y);if(culture)return culture.venue.id;
  const station=partAt(x,y);
  if(station)return station.id;
  for(const [id,{minX,maxX,minY,maxY}] of rooms){
    if(x>minX&&x<maxX&&y>minY&&y<maxY)return id;
  }
  return null;
}
