import assert from "node:assert/strict";
import {createGyeongjuActivities} from "../public/gyeongju-activities.js";
import {gyeongjuPoint,localGyeongju} from "../public/region-coordinates.js";
import {places,gyeongjuClear,gyeongjuRoute} from "../public/gyeongju-layout.js";
import {ladderFoot,chamberEntry,insideObservatory,towerPoint,observatoryCameraBlocked} from "../public/gyeongju-observatory.js";

const me={...gyeongjuPoint(places.stars)},activities=createGyeongjuActivities({
 me,environment:()=>({night:0}),movePlayer:p=>Object.assign(me,p)
});
assert(!activities.menu().has("gjLadder"));
assert(gyeongjuRoute(places.stars,ladderFoot).length);
assert(!gyeongjuClear(ladderFoot,chamberEntry),"the stone base separates both levels");
Object.assign(me,gyeongjuPoint(ladderFoot));
activities.menu().get("gjLadder").run();
assert(activities.insideTower());
assert.equal(activities.menu().get("gjLadder").label,"사다리로 내려가기");
assert(insideObservatory(localGyeongju(me)));
assert(!observatoryCameraBlocked(towerPoint(0,1.72),4.35),"window sightline");
assert(observatoryCameraBlocked(towerPoint(1.72,0),4.35),"solid side wall");
activities.menu().get("gjLadder").run();
assert(!activities.insideTower());
assert.equal(me.x,gyeongjuPoint(ladderFoot).x);
console.log("Observatory approach, wall, window, chamber entry and return passed.");
