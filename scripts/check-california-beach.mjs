import assert from "node:assert/strict";
import { beachEntrance, beachPoolGates, beachRides, inCaliforniaBeach } from "../public/california-beach-layout.js";
import { beachRiver, beachRiverLength, beachWaterAt, riverOffset } from "../public/california-beach-water.js";
import { inSwimmingDepth, playerWater } from "../public/california-beach-play.js";
import { parkRoute, parkSolid } from "../public/gyeongju-world-layout.js";
import { gyeongjuPoint } from "../public/region-coordinates.js";

for (const site of [...beachPoolGates, ...beachRides]) {
  assert(inCaliforniaBeach(site.gate));
  assert.equal(beachWaterAt(site.gate), null, site.name);
  assert(parkRoute(beachEntrance, site.gate).length, site.name);
}
for (const [kind, x, z] of [["wave", 6331, 272], ["river", 6299, 239], ["kids", 6369, 266]]) {
  const point = {x, z};
  const w = beachWaterAt(point, 2500);
  assert.equal(w.kind, kind);
  assert.equal(inSwimmingDepth(w), kind === "wave");
  assert.deepEqual(w, beachWaterAt(point, 130500));
  assert.deepEqual(w, playerWater(gyeongjuPoint(point), 2500));
  assert.equal(playerWater({...gyeongjuPoint(point), seat: 0}, 2500), null);
  assert.equal(parkSolid(point, .4), false);
}
assert(!inSwimmingDepth(beachWaterAt({x:6331, z:250}, 0)));
for (const bend of beachRiver) {
  const bank = riverOffset(bend, bend.half + 1.25);
  assert.equal(beachWaterAt(bank, 600), null, "river exit is dry");
  assert(!parkSolid(bank, .4), "river exit is clear");
}
let x = 6299, z = 239, distance = 0;
for (let i = 0; i < 6000; i++) {
  const w = beachWaterAt({x, z}, i * 100);
  assert.equal(w?.kind, "river", "current keeps an idle tube afloat");
  x += w.vx * .1;
  z += w.vz * .1;
  distance += Math.hypot(w.vx, w.vz) * .1;
}
assert(distance > beachRiverLength * 3);
console.log("Verified pool thresholds, clock synchronization, dry river exits, connected entrances and 600 seconds of tube drift.");
