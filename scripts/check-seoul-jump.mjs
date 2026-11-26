import assert from "node:assert/strict";
import {addObstacle,clearSegment,loftHeight,loftStep,platformAt,solidAt} from "../public/layout.js";
import {at} from "../public/gyeongbok-layout.js";
import {gyeongbokObstacles} from "../public/gyeongbok-obstacles.js";
import {bankAt,cheonggyeLevel} from "../public/cheonggye-layout.js";
import {outsideGroundOffset} from "../public/gyeongbok-terrain.js";
import {registerStation} from "../public/station-layout.js";
import {approachHeight,stationApproaches} from "../public/station-levels.js";

const jumping=(p,localFeet)=>({airFeet:outsideGroundOffset(p)+localFeet,localFeet});
for(const [x,y,w,d,angle,top] of gyeongbokObstacles)addObstacle(x,y,w,d,angle,top??Infinity);
for(const [edge,level] of [[22.6,1.70],[29,.85]]){
  const start=at(edge-1,312),end=at(edge+1,312),rail=at(edge-.3,312);
  const support=platformAt(rail.x,rail.y);
  assert.ok(support>=level+.68-1e-6&&support<=level+.8+1e-6);
  assert.equal(clearSegment(start,end,.15,level+.19),false);
  assert.ok(clearSegment(start,end,.15,level+1.3,jumping(end,level+1.3)));
  assert.ok(platformAt(end.x,end.y)<level);
}
const pier=at(13.1,0);
assert.ok(solidAt(pier.x,pier.y,1.45),"Gwanghwamun pier remains solid");

const deck={...at(-78.35,428),up:true},cap={...at(-78.01,428),up:true},island=at(-77.5,428);
assert.equal(loftHeight(deck),5.5);
assert.equal(loftStep(deck,cap.x,cap.y),null);
assert.deepEqual(loftStep(deck,cap.x,cap.y,jumping(cap,6.7)),{up:true});
assert.equal(loftHeight(cap),6.47);
assert.equal(loftStep(cap,island.x,island.y),undefined);
assert.deepEqual(loftStep(cap,deck.x,deck.y),{up:true});
assert.ok(clearSegment(cap,island,.1,6.47));
assert.equal(platformAt(island.x,island.y),.38);

const street=bankAt(815,-1,1),bank=bankAt(815,-1,-1),guard=bankAt(815,-1,.3);
assert.equal(cheonggyeLevel(guard),.95);
assert.ok(cheonggyeLevel(bank)<-3);
assert.equal(clearSegment(street,bank,.1,.2),false);
assert.ok(clearSegment(street,bank,.1,1.2,jumping(bank,1.2)));
assert.ok(clearSegment(guard,bank,.1,1.0));
assert.ok(clearSegment(guard,street,.1,1.0));

registerStation();
const s=stationApproaches.find(s=>s.kind==="stairs"&&s.w>10);
const t=s.len/2,h=approachHeight(s,t);
const pos=side=>({x:s.a[0]+t*s.ux-side*s.uy,y:s.a[1]+t*s.uy+side*s.ux});
const left=pos(-.65),right=pos(.65),rail=pos(0);
assert.equal(loftStep(left,rail.x,rail.y),null);
assert.deepEqual(loftStep(left,rail.x,rail.y,jumping(rail,h+1.3)),{up:false});
assert.ok(Math.abs(loftHeight(rail)-(h+1.09))<1e-6);
assert.deepEqual(loftStep(rail,left.x,left.y),{up:false});
assert.deepEqual(loftStep(rail,right.x,right.y),{up:false});
console.log("Seoul palace terraces, pavilion rails, stream bank and station stairs pass.");
