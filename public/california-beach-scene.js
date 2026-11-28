import {districtMeshes} from "./gyeongju-mesh.js";
import {beachEntrance,beachBoundary,beachWalkways,beachServices,beachBeds,beachRides} from "./california-beach-layout.js";
import {beachPools} from "./california-beach-water.js";
import {buildBeachPools} from "./california-beach-pools.js";
import {buildBeachResort} from "./california-beach-resort.js";
import {buildBeachSlides} from "./california-beach-slides.js";

export function buildCaliforniaBeach(T,root,kit){
  const paving=districtMeshes(root),outer=beachBoundary.map(p=>new T.Vector2(p.x,-p.z));
  const holes=beachPools.map(s=>s.outline.map(p=>new T.Vector2(p.x,-p.z)));
  const triangles=T.ShapeUtils.triangulateShape(outer,holes).flat();
  paving.face([outer,...holes].flat().map(v=>[v.x,.026,-v.y]),triangles,0xe3cda7,"pavers");
  for(const pool of beachPools)for(const island of pool.holes)paving.polygon(island,.052,0x9aae75,"grass");
  for(const path of beachWalkways){
    paving.strip(path,5.7,.062,0xb48e69,"pavers");
    paving.strip(path,5.2,.074,0xe9d5aa,"pavers");
  }
  paving.finish();
  const pools=buildBeachPools(T,root,kit);
  const resort=buildBeachResort(T,root,kit,{entrance:beachEntrance,services:beachServices,beds:beachBeds,walkways:beachWalkways});
  const slides=buildBeachSlides(T,root,kit,beachRides);
  return {seats:slides.seats,update(seconds,clock,sessions,night,camera){
    pools(clock,night,camera);resort(clock,night,camera);slides.update(seconds,clock,sessions);
  }};
}
