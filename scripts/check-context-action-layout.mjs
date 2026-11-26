import assert from "node:assert/strict";
import {createContextActionLayout} from "../public/context-action-layout.js";

const layout=createContextActionLayout();
function slots(scope,ids){
  const choices=ids.map(id=>({button:{id,dataset:{}}}));
  const {placed}=layout.arrange(choices,scope,{x:0,y:0});
  const occupied=new Map();
  placed.forEach(({button},index)=>occupied.set(button.id,index));
  assert.equal(occupied.size,ids.length);
  return occupied;
}

const stool=slots("tavern-0",["coast-table"]).get("coast-table");
const seated=["coast-bell","coast-stand"];
const initial=slots("tavern-0",seated);
assert.equal(initial.get("coast-stand"),stool);
const served=slots("tavern-0",["coast-drink","coast-fish","coast-grill",...seated]);
for(const id of seated)assert.equal(served.get(id),initial.get(id));
slots("tavern-0",seated);
const cooked=slots("tavern-0",["coast-clam",...seated]);
assert.equal(cooked.get("coast-clam"),served.get("coast-grill"));
const both=slots("tavern-0",["coast-grill","coast-clam",...seated]);
assert.equal(both.get("coast-clam"),cooked.get("coast-clam"));
assert.notEqual(both.get("coast-grill"),both.get("coast-clam"));

const bridge=slots("cruise",["coast-helm","coast-tour","coast-festival"]);
const steering=slots("cruise",["coast-moor","coast-release","coast-festival"]);
assert.equal(steering.get("coast-release"),bridge.get("coast-helm"));
assert.equal(steering.get("coast-festival"),bridge.get("coast-festival"));

const rack=slots("gyeongju",["bike-action","landmark-guide","use-item","use-second-item"]);
const riding=slots("gyeongju",["bike-park","bike-action","use-item","use-second-item"]);
for(const id of ["bike-action","use-item","use-second-item"])assert.equal(riding.get(id),rack.get(id));
console.log("Table, helm, rental and both hand controls keep their places through action changes.");
