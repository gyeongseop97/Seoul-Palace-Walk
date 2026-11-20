import assert from "node:assert/strict";
import {coastBox,coastWalkable,drawCoastMap} from "../public/coast-region.js";
import {coastCounters} from "../public/coast-shops.js";
import {coastalRetail,samhoRoad} from "../public/coast-retail-layout.js";
import {coastPoint} from "../public/region-coordinates.js";
import {ground} from "../public/pohang-layout.js";
import {ITEMS} from "../public/activities.js";
import {portable} from "../public/walk-inventory.js";

const poi=[
 [36.0573304,129.3779542], // Sulbing, OSM 13068221701
 [36.0596764,129.3792181], // XTC PUB, Haean-ro 123 address point
 [36.0599322,129.3785183]  // Tilt Bar N Grill, OSM 2699055767
];
const mapShops=[];
drawCoastMap(null,()=>{},(_,p,type)=>{if(type==="shop")mapShops.push(p.name);});
function insideView(p,view){
 const [x,y,w,h]=view.split(" ").map(Number);
 return p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h;
}
function canWalk(point){
 const p=coastPoint(point);
 return coastWalkable(p.x,p.y);
}
for(const [index,shop] of coastalRetail.entries()){
 const [lat,lon]=poi[index],pin={x:(lon-129.378)*89950,z:(36.055-lat)*111020};
 const p=coastPoint(shop.entry),counter=coastCounters.find(c=>c.name===shop.name);
 const offset=Math.hypot(pin.x-shop.entry.x,pin.z-shop.entry.z);
 assert(offset<20,`${shop.name} moved away from its mapped address`);
 assert.equal(ground(shop.entry),1.85);
 assert.deepEqual([counter.x,counter.y],[p.x,p.y]);
 assert(mapShops.includes(shop.name)&&insideView(p,coastBox(p,false)));
 assert(shop.stock.every(kind=>ITEMS[kind]&&portable(kind)));
 for(let u=shop.doorX-.8;u<=shop.doorX+.8;u+=.2){
  for(let v=.35;v<shop.depth+4;v+=.16)assert(canWalk(shop.point(u,v)),`${shop.name} blocked approach ${u},${v}`);
 }
 assert(!canWalk(shop.point(0,-1)),shop.name+" building footprint");
 console.log(`${shop.name}: ${offset.toFixed(1)} m from business/address pin to playable street entrance`);
}
for(let i=1;i<samhoRoad.length;i++){
 const [x,z]=samhoRoad[i-1],[u,v]=samhoRoad[i],length=Math.hypot(u-x,v-z);
 for(let d=0;d<length;d+=1){
  const t=d/length,nx=(v-z)/length,nz=(x-u)/length;
  assert(canWalk({x:x+(u-x)*t+nx*4.6,z:z+(v-z)*t+nz*4.6}),"Samho-ro west sidewalk");
 }
}
const rooftop=coastPoint({x:560.04,z:-1046.44});
assert(insideView(rooftop,coastBox(coastPoint(coastalRetail[0].entry),false)),"northern Haean-ro 191-1 in beach district map");
