import assert from "node:assert/strict";
import {createCoastPlay} from "../public/coast-play.js";
import {registerCoast} from "../public/coast-region.js";
import {studioMooring} from "../public/coast-studio-layout.js";
import {boardingSpot,deckToSea,exitGate,gangwayHeight,gangwayToe,mainFloor} from "../public/coast-vessel-layout.js";
import {clearSegment} from "../public/layout.js";
import {mooring} from "../public/pohang-layout.js";
import {coastPoint} from "../public/region-coordinates.js";

registerCoast();
const visitor={id:"walker"},noop=()=>{};
for(const berth of [{...mooring,yaw:0},studioMooring]){
 for(const lane of [-.65,0,.65]){
  let time=300000;
  const ship={...berth,speed:0,helm:null},camera={pan:0,tilt:0};
  function point(x,z=lane){
   const p={x,z},h=gangwayHeight(p)??(x<gangwayToe?mainFloor-exitGate.drop:mainFloor);
   return coastPoint(deckToSea(ship,p,time,h));
  }
  const start=gangwayToe-1.25,end=-1.35;
  const me={...point(start),heading:90,coast:{mode:"walk",board:false}};
  const play=createCoastPlay({me,visit:()=>visitor,view:()=>camera,now:()=>time,changed:noop,reset:noop,notice:noop,
   request:async()=>Response.json({boat:ship,people:[],deckSeats:[]})});
  async function poll(){
   await new Promise(setImmediate);
   time+=1600;play.tick(.016,[0,0]);await new Promise(setImmediate);play.tick(.016,[0,0]);
  }
  await poll();
  function walk(a,b){
   const n=Math.ceil(Math.abs(b-a)/.19);let slopeSamples=0;
   for(let i=1;i<=n;i++){
    time+=24;
    const x=a+(b-a)*i/n,next=point(x),from={x:me.x,y:me.y};
    assert(play.canStep(next.x,next.y)&&clearSegment(from,next),JSON.stringify({berth,lane,x,coast:me.coast}));
    Object.assign(me,next);play.afterMove(undefined,from);play.tick(.024,[0,0]);
    if(x>gangwayToe+.02&&x<exitGate.x-.02){
     assert.equal(me.coast.mode,"deck");
     assert(Math.abs(me.coast.floor-gangwayHeight({x,z:lane}))<.005);
     assert(play.menu().actions.has("disembark"));slopeSamples++;
    }
    assert.notEqual(me.coast.mode,"swim");
   }
   return slopeSamples;
  }
  assert(walk(start,end)>=5);
  assert.equal(me.coast.mode,"deck");assert(!play.menu().actions.has("disembark"));
  const besideGate=point(exitGate.x-.22,exitGate.z+exitGate.half+.2);
  assert(!play.canStep(besideGate.x,besideGate.y),"rail outside the open passage");
  assert(walk(end,start)>=5);assert.equal(me.coast.mode,"walk");assert.equal(me.coast.deckX,undefined);
  const mid=exitGate.x-exitGate.run/2;
  walk(start,mid);ship.helm="captain";await poll();
  assert.equal(play.gangwayOpen(),false);assert.equal(me.coast.mode,"deck");
  assert.equal(me.coast.deckX,boardingSpot.x);assert.equal(me.coast.floor,mainFloor);
  assert(!play.menu().actions.has("disembark"));
  const folded=point(mid);assert(!play.canStep(folded.x,folded.y));
 }
}
console.log("Walked the center and both sides of the ramp in both directions at both piers, including a departure during boarding.");
