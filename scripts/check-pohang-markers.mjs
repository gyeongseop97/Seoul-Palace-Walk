import assert from "node:assert/strict";
import {createCoastPlay} from "../public/coast-play.js";
import {boardRack,dock,mooring,platformDoor,promenade,distance} from "../public/pohang-layout.js";
import {amenities} from "../public/beach-amenities.js";
import {coastPoint} from "../public/region-coordinates.js";
import {boardingSpot,deckToSea,mainFloor} from "../public/coast-vessel-layout.js";
import {cruiseSeats} from "../public/coast-vessel-seats.js";
import {festivalBooth} from "../public/pohang-festival-site.js";

const visitor={id:"guest",room:"harbor",key:"key"};
const me={...coastPoint(dock),heading:90,coast:{mode:"walk",board:false}};
const harbor={boat:{...mooring,yaw:0,speed:0,helm:null,voyage:null},people:[],deckSeats:[]};
let time=300000;
const noop=()=>{};
const play=createCoastPlay({me,visit:()=>visitor,now:()=>time,changed:noop,reset:noop,notice:noop,
 request:async()=>Response.json(harbor)});
function move(p){Object.assign(me,coastPoint(p));play.afterMove();}
function action(id){return play.menu().actions.get(id);}
async function poll(){
 time+=2000;play.tick(0,[0,0]);await new Promise(setImmediate);
}
function markerNear(id,point,reach){
 const marker=action(id)?.marker;
 assert(marker&&distance(marker,point)<reach,id+" marker must be at its interaction point");
 return marker;
}

assert.equal(action("embark"),undefined);
await poll();
move({x:promenade(dock.z)+4,z:dock.z-2.3});
assert.equal(action("embark"),undefined,"the inland approach does not offer boarding");
move(dock);markerNear("embark",dock,6);
assert.equal(action("festival"),undefined);
play.trigger("embark");
assert.equal(markerNear("disembark",boardingSpot,1).deck,true);
assert.equal(action("festival").label,"불꽃놀이 시작");
assert(!action("festival").marker,"the deck action does not place a booth marker out at sea");
const seat=cruiseSeats[0];
move(deckToSea(play.ship,seat.approach,time,mainFloor));
assert.equal(action("disembark"),undefined);
const seatMarker=markerNear("deckSit",seat.approach,1.05);
assert.equal(seatMarker.deck,true);assert.equal(seatMarker.h,seat.floor);
harbor.deckSeats=[{id:"other",seat:seat.id}];await poll();
assert.equal(action("deckSit"),undefined,"the occupied seat no longer offers a marker");
me.coast.deckSeat=seat.id;
assert.equal(action("festival").label,"불꽃놀이 시작");
delete me.coast.deckSeat;
move(deckToSea(play.ship,boardingSpot,time,mainFloor));action("disembark").run();
harbor.boat.voyage={kind:"tour",started:time,ox:mooring.x,oz:mooring.z,angle:0,speed:0};
await poll();assert.equal(action("embark"),undefined,"the pier has no boarding marker during a tour");
move(festivalBooth);markerNear("festival",festivalBooth,1);

for(const amenity of amenities){move(amenity.entry);markerNear(amenity.kind,amenity.entry,2.55);}
move(platformDoor);markerNear("train",platformDoor,3);
move(boardRack);markerNear("board",boardRack,5);play.trigger("board");
move({x:mooring.x+90,z:mooring.z});await poll();
assert.equal(action("board"),undefined);assert(action("surf"));assert(!action("surf").marker);
move(boardRack);
harbor.scooter={dock:"beach",parked:null};await poll();
assert(action("parkScooter"));assert(!action("parkScooter").marker);
play.stop();
console.log("Verified shore and deck markers, occupied seats, tours and location-independent actions.");
