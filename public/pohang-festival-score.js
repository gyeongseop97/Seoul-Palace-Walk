import {festivalDuration,shore} from "./pohang-layout.js";
import {beachLimits} from "./pohang-beach-profile.js";

export const chapters = [0,29,66,101,141].map(at => ({at}));

export function chapterAt(age) {
  if (!(age >= 0 && age < festivalDuration)) return null;
  return chapters.findLast(chapter => age >= chapter.at);
}

// Launch lines follow the beach. Keep burst altitude separate from the width
// of the shell so even a broad crown stays framed above the horizon.
const stages={
  front:{offshore:670,spacing:12,size:8.8,altitude:6.3},
  middle:{offshore:985,spacing:14,size:13.8,altitude:9.5},
  horizon:{offshore:1500,spacing:17.5,size:20.8,altitude:14.2}
};
const [north,south]=beachLimits;
const midBeach=(north+south)/2;
export const festivalFocus={x:shore(midBeach)+stages.middle.offshore,z:midBeach,y:46*stages.middle.altitude};
function stageCue(cue) {
  const layer=cue.layer??(cue.shape==="fan"||cue.shape==="comet"?"front":
    cue.shape==="willow"||cue.shape==="brocade"||cue.shape==="strobe"?"horizon":"middle");
  const {offshore,spacing,size,altitude}=stages[layer];
  const z=midBeach+cue.side*spacing;
  const x=shore(Math.max(north,Math.min(south,z)))+offshore+Math.sin(cue.seed*1.37)*16;
  return {...cue,layer,x,z,size,y:cue.height*altitude};
}

// Choreography uses metres before each layer is scaled to its viewing distance.
const cues = [];
function cue(at, shape, side, height, span, palette, lean = 0, layer) {
  cues.push({at, shape, side, height, span, palette, lean, layer, seed: cues.length + 1});
}
function pair(at, shape, spread, height, size, palette, delay = .45) {
  cue(at, shape, -spread, height, size, palette, -1);
  cue(at + delay, shape, spread, height, size, palette, 1);
}

cue(1.6, "chrysanthemum", 0, 46, 25, "beacon");
cue(6.4, "ring", 0, 56, 17, "pearl");
cue(9.7, "comet", -37, 29, 24, "beacon", 1);
cue(12.1, "comet", 28, 41, 19, "pearl", -1);
cue(15.4, "brocade", 0, 51, 30, "sunrise");
pair(20.8, "peony", 30, 43, 16, "sunrise", .78);
cue(25.6, "palm", 0, 55, 21, "beacon");

for (const [pass, at] of [29.8, 39.3, 51.3].entries()) {
  const direction = pass === 1 ? -1 : 1;
  for (let i = 0; i < 5; i++) {
    cue(at + i * .55, "fan", (i - 2) * 18 * direction, 12 + i * 2, 21, pass === 2 ? "storm" : "tide", direction);
  }
  cue(at + 4.1, "cascade", direction * 5, 41, 32, "tide", direction);
  cue(at + 6.8, "ring", direction * 23, 57, 22, pass === 1 ? "storm" : "lagoon", direction);
}
pair(61.4, "cascade", 28, 63, 25, "storm", .32);

cue(66.8, "dahlia", -23, 48, 18, "pearl", 1);
cue(69.0, "dahlia", 8, 58, 21, "rose", 1);
cue(72.1, "dahlia", 29, 64, 15, "pearl", 1);
pair(75.9, "flower", 29, 42, 20, "garden", .85);
cue(80.3, "palm", 0, 59, 24, "rose");
for (let i = 0; i < 3; i++) cue(84 + i * 1.05, "dahlia", (1 - i) * 25, 48 + i * 6, 17, "sunrise", -1);
pair(89.2, "flower", 32, 52, 23, "orchid");
cue(93.8, "bouquet", -12, 59, 25, "garden");
cue(97.4, "flower", 20, 45, 19, "rose");

cue(101.7, "willow", -22, 60, 20, "moon");
cue(105.6, "crossette", 19, 51, 12, "pearl");
cue(109.1, "strobe", 0, 52, 34, "twilight");
cue(114.0, "comet", 37, 56, 27, "twilight", -1);
cue(117.1, "crossette", -26, 49, 16, "moon");
cue(119.7, "crossette", 7, 62, 12, "orchid");
cue(122.3, "crossette", 31, 45, 14, "twilight");
cue(126.0, "ring", -17, 54, 23, "orchid");
cue(128.8, "strobe", 14, 56, 29, "moon", -1);
pair(134.4, "willow", 33, 71, 23, "twilight", .7);
cue(138.3, "comet", 0, 41, 23, "beacon", 1);

cue(141.7, "chrysanthemum", -26, 48, 22, "beacon");
cue(145.1, "brocade", 12, 52, 29, "sunrise");
pair(149.2, "ring", 35, 47, 18, "lagoon", .26);
cue(151.4, "bouquet", 0, 66, 25, "rose");
pair(154.0, "palm", 52, 44, 22, "garden", .32);
cue(156.2, "flower", 0, 56, 25, "orchid");
for (let i = 0; i < 7; i++) {
  cue(159 + i * .34, "fan", (i - 3) * 16, 15 + 5 * Math.cos(i - 3), 23, i % 2 ? "sunrise" : "lagoon", Math.sign(i - 3));
}
pair(161.9, "bouquet", 39, 59, 25, "orchid", .24);
cue(164.2, "peony", 0, 69, 32, "coral");
pair(166.1, "flower", 54, 47, 26, "garden", .18);
cue(168.2, "bouquet", -18, 64, 28, "lagoon");
cue(169.1, "bouquet", 20, 61, 28, "rose");
pair(171.3, "willow", 55, 71, 30, "beacon", .32);
pair(172.6, "cascade", 27, 55, 24, "sunrise", .22);
cue(174.55, "willow", 0, 75, 35, "gold");

// Distant answering lights carry each chapter to the horizon. The finale stacks
// a low sweep, mid-air flowers and a high gold curtain without extending its ending.
cue(6.8,"peony",-31,51,19,"sunrise",-1,"horizon");
cue(21.5,"palm",35,61,23,"pearl",1,"horizon");
cue(33.6,"ring",-42,48,26,"lagoon",-1,"horizon");
cue(46.2,"peony",45,53,24,"storm",1,"horizon");
cue(57.9,"cascade",-39,58,27,"storm",-1,"horizon");
cue(77.0,"peony",36,51,25,"rose",1,"horizon");
cue(89.9,"palm",-48,57,27,"orchid",-1,"horizon");
cue(111.0,"crossette",46,54,18,"pearl",1,"horizon");
cue(128.2,"peony",-46,46,21,"twilight",-1,"horizon");
cue(151.8,"ring",-49,61,22,"coral",-1,"horizon");
cue(154.5,"ring",51,59,22,"gold",1,"horizon");
cue(164.0,"palm",-55,52,25,"rose",-1,"horizon");
cue(165.0,"palm",55,54,26,"orchid",1,"horizon");
cue(170.5,"cascade",-61,40,28,"gold",-1,"middle");
cue(170.9,"cascade",61,41,28,"gold",1,"middle");
cue(173.0,"fan",-50,12,25,"sunrise",-1,"front");
cue(173.2,"fan",50,12,25,"sunrise",1,"front");
cue(174.2,"peony",0,50,26,"coral",0,"middle");

// The two ends of the beach answer the central shell. Alternating the first
// launch sends the wave back down the shore in the next chapter.
for(const [at,shape,height,span,palette,fromNorth] of [
  [1.85,"peony",36,22,"sunrise",true],
  [25.85,"ring",45,23,"pearl",false],
  [42.55,"palm",44,24,"lagoon",true],
  [71.5,"flower",42,25,"garden",false],
  [96.85,"ring",47,21,"orchid",true],
  [116.4,"strobe",43,23,"twilight",false],
  [141.95,"chrysanthemum",46,26,"sunrise",true]
]){
  const edge=fromNorth?-34:34;
  cue(at,shape,edge,height,span,palette,Math.sign(edge),"middle");
  cue(at+.55,shape,-edge,height+3,span,palette,-Math.sign(edge),"middle");
}

export const festivalCues = cues.map(stageCue).sort((a, b) => a.at - b.at);
