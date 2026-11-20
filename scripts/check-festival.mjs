import assert from "node:assert/strict";
import {festivalDuration,showAge} from "../public/pohang-layout.js";
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
console.log(`Festival: ${festivalCues.length} cues, ${seen.size} motifs, ${chapters.length} chapters; final light fades at ${lastLight.toFixed(2)}s.`);
