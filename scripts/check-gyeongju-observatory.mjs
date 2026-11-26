import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
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
assert.equal(me.heading,0);

async function survey(file){
 const bytes=await readFile(new URL("../public/art/"+file,import.meta.url));
 assert.equal(bytes.toString("ascii",0,4),"glTF");
 const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 const mesh=doc.meshes[0].primitives[0],pos=doc.accessors[mesh.attributes.POSITION];
 assert(Math.abs(pos.min[1])<.01&&Math.abs(pos.max[1]-9.17)<.01);
 return {faces:doc.accessors[mesh.indices].count/3,textures:doc.images?.length??0};
}
const [near,far]=await Promise.all(["cheomseongdae.glb","cheomseongdae-lod.glb"].map(survey));
assert(near.textures===1&&far.textures===0&&far.faces<near.faces/10);
console.log("Observatory approach, wall, window, chamber entry and return; both survey scales and distant mesh passed.");
