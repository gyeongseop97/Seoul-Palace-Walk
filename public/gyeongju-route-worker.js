import {gyeongjuRoute} from "./gyeongju-layout.js";
import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";

self.onmessage=({data:{id,start,end}})=>{
 const steps=gyeongjuRoute(localGyeongju(start),localGyeongju(end)).map(gyeongjuPoint);
 self.postMessage({id,steps});
};
