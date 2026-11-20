import assert from "node:assert/strict";
import {beachStop,festivalDuration,shore,showAge} from "../public/pohang-layout.js";
import {festivalCues,chapters,chapterAt} from "../public/pohang-festival-score.js";
import {drawCue} from "../public/pohang-festival-shapes.js";

const seen=new Set();
let lastLight=0;
for(const cue of festivalCues){
  seen.add(cue.shape);
  const vertices=[];
  drawCue(cue,(...args)=>{
    assert(args.every(Number.isFinite),cue.shape);
    const [, , , , , , delay,life, ,size,lane]=args;
    assert(life>0&&size>0&&[0,1,2].includes(lane));
    lastLight=Math.max(lastLight,cue.at+delay+life);
    vertices.push(args);
  });
  assert(vertices.length>10);
  // Two viewers joining at different times must generate exactly the same motif.
  let i=0;
  drawCue(cue,(...args)=>assert.deepEqual(args,vertices[i++]));
  assert.equal(i,vertices.length);
}
assert(lastLight>179&&lastLight<=festivalDuration);
assert.equal(chapterAt(-1),null);
assert.equal(chapterAt(festivalDuration),null);
for(const chapter of chapters){
  assert.equal(chapterAt(chapter.at),chapter);
  assert.equal(chapterAt(showAge(900000+chapter.at*1000,900000)),chapter);
}
assert(seen.size>=12);
const layers=new Set(festivalCues.map(e=>e.layer));
assert.deepEqual(layers,new Set(["front","middle","horizon"]));
assert(festivalCues.every(e=>e.x>shore(e.z)&&e.size>0&&e.y>0));
assert(Math.max(...festivalCues.map(e=>e.x))-shore(beachStop.z)>1400);
assert(Math.max(...festivalCues.map(e=>e.z))-Math.min(...festivalCues.map(e=>e.z))>850);
assert.deepEqual(new Set(festivalCues.filter(e=>e.at>=171&&e.at<=174.55).map(e=>e.layer)),layers);
console.log(`Festival: ${festivalCues.length} cues across ${layers.size} offshore layers, ${seen.size} motifs, ${chapters.length} chapters; final light fades at ${lastLight.toFixed(2)}s.`);
