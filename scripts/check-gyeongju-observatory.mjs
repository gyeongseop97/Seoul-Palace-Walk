import assert from "node:assert/strict";
import {createGyeongjuActivities} from "../public/gyeongju-activities.js";
import {gyeongjuPoint,localGyeongju} from "../public/region-coordinates.js";
import {places,gyeongjuClear,gyeongjuRoute} from "../public/gyeongju-layout.js";
import {observatoryApproach,chamberEntry,insideObservatory,towerPoint,observatoryCameraBlocked} from "../public/gyeongju-observatory.js";

const me={...gyeongjuPoint(places.stars)},activities=createGyeongjuActivities({
 me,environment:()=>({night:0}),movePlayer:p=>Object.assign(me,p)
});
assert(!activities.menu().has("gjObservatory"));
assert(gyeongjuRoute(places.stars,observatoryApproach).length);
assert(!gyeongjuClear(observatoryApproach,chamberEntry),"the stone base separates both levels");
Object.assign(me,gyeongjuPoint(observatoryApproach));
activities.menu().get("gjObservatory").run();
assert(activities.insideTower());
assert.equal(activities.menu().get("gjObservatory").label,"나가기");
assert(insideObservatory(localGyeongju(me)));
assert(!observatoryCameraBlocked(towerPoint(0,1.72),4.35),"window sightline");
assert(observatoryCameraBlocked(towerPoint(1.72,0),4.35),"solid side wall");
activities.menu().get("gjObservatory").run();
assert(!activities.insideTower());
assert.equal(me.x,gyeongjuPoint(observatoryApproach).x);
console.log("Observatory approach, wall, window, chamber entry and return passed.");
