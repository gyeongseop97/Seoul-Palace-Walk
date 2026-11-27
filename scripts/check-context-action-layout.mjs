import assert from "node:assert/strict";
import {createContextActionLayout} from "../public/context-action-layout.js";
import {contextKeyPages} from "../public/context-action-keys.js";

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

const control=(id,target)=>({id,dataset:{actionTarget:target}});
const left=control("use-item"),right=control("use-second-item"),bike=control("bike-action"),bus=control("gyeongju-boardBus");
const ticket=control("museum-door","ktx-coach-enter"),museum=control("museum-door","sema-enter"),pickup=control("take-item");
const extras=["landmark-guide","umbrella","sit","picnic"].map(id=>control(id));
assert.deepEqual(contextKeyPages([bike]),[{F:bike}]);
assert.deepEqual(contextKeyPages([museum]),[{F:museum}]);
assert.deepEqual(contextKeyPages([museum,pickup, ...extras.slice(0,2)]),[{F:pickup,R:museum,Q:extras[0],E:extras[1]}]);
assert.deepEqual(contextKeyPages([ticket,left,right]),[{Q:left,E:right,F:ticket}]);
const pages=contextKeyPages([museum,left,right,bike,bus,pickup,...extras]);
for(const [index,page] of pages.entries()){
  assert.equal(page.F,index%2===0?bike:bus);
  assert.equal(page.Q,left);assert.equal(page.E,right);
  assert.equal(new Set(Object.values(page)).size,Object.values(page).length);
}
assert.deepEqual(new Set(pages.flatMap(Object.values)),new Set([museum,left,right,bike,bus,pickup,...extras]));
assert.deepEqual(contextKeyPages([left,right,bike,pickup,...extras]),
  [pickup,...extras].map(action=>({Q:left,E:right,F:bike,R:action})));
assert.deepEqual(contextKeyPages([right,{...left,disabled:true},...extras]),[
  {E:right,F:extras[0],R:extras[1]},{E:right,F:extras[2],R:extras[3]}]);
console.log("Vehicle boarding and hand items use their assigned keys across pages; spare keys reach all other actions.");
