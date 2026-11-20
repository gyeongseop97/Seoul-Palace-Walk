import {coastWalkingRoute} from "./coast-region.js";

self.onmessage=({data:{id,from,to}})=>{
 self.postMessage({id,steps:coastWalkingRoute(from,to)});
};
