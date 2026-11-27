import assert from "node:assert/strict";
import {createResidentLife} from "../public/resident-life.js";
import {interiorAt} from "../public/interior-layout.js";
import {alcoholGait} from "../public/avatar-gestures.js";

const base=Date.UTC(2026,10,27);
for(const city of ["seoul","pohang","gyeongju","cruise"]){
 const graph=(await import("../public/"+city+"-resident-streets.js")).default;
 const life=createResidentLife(graph,"room A",city);
 const targets=graph.nodes.filter(n=>n[2].length&&["table","drink","templeBow","churchPrayer","water","deckSeat","station"].includes(n[3]));
 const types=new Set(),travelers=new Map(),roomAt=city==="seoul"?interiorAt:()=>null;
 const anchors=targets.filter((n,i)=>n[3]!=="water"||i%14===0);
 for(let t=0;t<1200;t+=9){
  const clock=base+t*1000;
  for(const [x,y] of anchors){
   const room=roomAt(x,y),point={x,y};
   const actors=life.visible(clock,point,room,[],14,roomAt);
   assert(actors.length<=14);
   assert.equal(new Set(actors.map(p=>p.id)).size,actors.length);
   for(const p of actors){
    assert(Number.isFinite(p.x+p.y+p.heading));
    assert.equal(roomAt(p.x,p.y),room);
    if(p.id.startsWith("rail-traveler"))travelers.set(p.id,p);
    if(p.gesture)types.add(p.gesture.kind);
    if(p.item)types.add(p.item.kind);
    if(p.deckSeat)types.add("deck seat");
    if(p.stepping&&p.alcoholGlasses>=2&&alcoholGait(p,clock,p.running))types.add("drunken walk");
    if(p.coast?.mode==="table"){
     types.add("table");const seat=p.coast.seat;
     const busy=life.visible(clock,point,room,[{coast:{mode:"table",seat}}],7,roomAt);
     assert(busy.length<=7&&!busy.some(q=>q.coast?.mode==="table"&&q.coast.seat===seat));
    }
   }
  }
 }
 const wanted={seoul:["churchPrayer"],pohang:["table","drunken walk"],gyeongju:["templeBow","drunken walk"],cruise:["deck seat"]};
 for(const kind of wanted[city])assert(types.has(kind),city+" missing "+kind);
 if(city!=="cruise")assert(travelers.size>0);
 const [x,y]=targets[0],anchor={x,y},time=base+733000;
 const again=()=>createResidentLife(graph,"room A",city).visible(time,anchor,roomAt(x,y),[],14,roomAt);
 const first=again(),late=life.visible(time,anchor,roomAt(x,y),[],14,roomAt);
 assert.deepEqual(first,late);
 console.log(city,life.count,[...types].join(", "));
}

// Walk alongside one traveler through multiple outing boundaries. A fresh
// client entering midway must find the same person without a position jump.
const lane=Array.from({length:41},(_,i)=>[i*12,0,[i-1,i+1].filter(j=>j>=0&&j<41)]);
const neighborhood={nodes:lane,homes:[20],portals:[]},town=createResidentLife(neighborhood,"journey","seoul");
let anchor={x:240,y:0},minimum=Infinity,maximum=-Infinity;
for(let second=0;second<3000;second++){
 const clock=second*1000,roomAt=()=>null;
 const result=town.visible(clock,anchor,null,[],1,roomAt)[0];
 // The observer may initially be at the opposite end of the street.
 if(!result){anchor={x:(anchor.x+66)%490,y:0};continue;}
 if(Number.isFinite(minimum))assert(Math.abs(anchor.x-result.x)<=3.01,"jump across outings");
 minimum=Math.min(minimum,result.x);maximum=Math.max(maximum,result.x);anchor=result;
 if(second%613===0)assert.deepEqual(createResidentLife(neighborhood,"journey","seoul").visible(clock,anchor,null,[],1,roomAt)[0],result);
}
assert(maximum-minimum>120,"residents can spend time beyond their home neighborhood");
