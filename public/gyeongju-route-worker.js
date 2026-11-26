import {gyeongjuRoute} from "./gyeongju-layout.js";
import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";

self.onmessage=({data:{id,start,end}})=>{
 const steps=gyeongjuRoute({...localGyeongju(start),up:start.up},localGyeongju(end)).map(gyeongjuPoint);
 self.postMessage({id,steps});
};
