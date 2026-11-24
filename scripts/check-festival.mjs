import assert from "node:assert/strict";
import {beachStop,festivalDuration,mooring,promenade,shore,showAge} from "../public/pohang-layout.js";
import {beachLimits} from "../public/pohang-beach-profile.js";
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

// Measure the horizontal angle of the actual, still-lit sparks shortly after
// each burst. A long row of launches alone can still look tiny from the sand.
function burstWidth(cue,viewer){
  let left=Infinity,right=-Infinity;
  drawCue(cue,(x,y,z,vx,vy,vz,delay,life,gravity)=>{
    const age=1.85-delay;
    if(age<0||age>=life)return;
    const flight=(1-Math.exp(-.33*age))/.33;
    if(cue.y+cue.size*(y+vy*flight-gravity*age*age/2)<=0)return;
    const dx=cue.x-viewer.x+cue.size*(x+vx*flight);
    const dz=cue.z-viewer.z+cue.size*(z+vz*flight);
    const angle=Math.atan2(dz,dx);
    left=Math.min(left,angle);right=Math.max(right,angle);
  });
  return (right-left)*180/Math.PI;
}
const [north,south]=beachLimits;
const firstSalvo=festivalCues.filter(c=>c.at<3);
assert(firstSalvo.some(c=>c.z<=north)&&firstSalvo.some(c=>c.z>=south));
const shoreView=z=>({x:promenade(z),z});
for(const viewer of [shoreView(north),shoreView((north+south)/2),shoreView(south),mooring]){
  assert(burstWidth(festivalCues[0],viewer)>32,"opening shell at the shoreline or cruise");
  assert(burstWidth(festivalCues.at(-1),viewer)>60,"final gold curtain at the shoreline or cruise");
}
console.log(`Festival: ${festivalCues.length} cues across ${layers.size} offshore layers, ${seen.size} motifs, ${chapters.length} chapters; final light fades at ${lastLight.toFixed(2)}s.`);
