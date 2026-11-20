import {festivalDuration} from "./pohang-layout.js";

export const chapters = [
  {at: 0, title: "등대의 첫 신호", line: "영일대에 불이 켜지고, 작은 배가 항구를 떠나요."},
  {at: 29, title: "파도 너머", line: "물결이 높아지며 작은 배의 길이 흐려져요."},
  {at: 66, title: "갈매기의 길", line: "갈매기 한 쌍이 날개를 펴고 뱃길을 열어요."},
  {at: 101, title: "별자리 항해", line: "갈매기가 떠난 하늘에 돌아갈 길이 별로 이어져요."},
  {at: 141, title: "다시, 영일만", line: "첫 등불이 다시 반짝이고, 배가 영일만의 품으로 돌아와요."}
];

export function chapterAt(age) {
  if (!(age >= 0 && age < festivalDuration)) return null;
  return chapters.findLast(chapter => age >= chapter.at);
}

// Opening times are seconds on the shared room clock. Side is a horizontal
// offset along the horizon as seen from Yeongildae. Height and span are metres.
const cues = [];
function cue(at, shape, side, height, span, palette, lean = 0) {
  cues.push({at, shape, side, height, span, palette, lean, seed: cues.length + 1});
}
function pair(at, shape, spread, height, size, palette, delay = .45) {
  cue(at, shape, -spread, height, size, palette, -1);
  cue(at + delay, shape, spread, height, size, palette, 1);
}

cue(1.6, "lighthouse", 0, 46, 25, "beacon");
cue(6.4, "ring", 0, 56, 17, "pearl");
cue(9.7, "comet", -37, 29, 24, "beacon", 1);
cue(12.1, "comet", 28, 41, 19, "pearl", -1);
cue(15.4, "sail", 0, 51, 30, "sunrise");
pair(20.8, "peony", 30, 43, 16, "sunrise", .78);
cue(25.6, "palm", 0, 55, 21, "beacon");

for (const [pass, at] of [29.8, 39.3, 51.3].entries()) {
  const direction = pass === 1 ? -1 : 1;
  for (let i = 0; i < 5; i++) {
    cue(at + i * .55, "fan", (i - 2) * 18 * direction, 12 + i * 2, 21, pass === 2 ? "storm" : "tide", direction);
  }
  cue(at + 4.1, "wave", direction * 5, 41, 32, "tide", direction);
  cue(at + 6.8, "ring", direction * 23, 57, 22, pass === 1 ? "storm" : "lagoon", direction);
}
pair(61.4, "cascade", 28, 63, 25, "storm", .32);

cue(66.8, "gull", -23, 48, 18, "pearl", 1);
cue(69.0, "gull", 8, 58, 21, "rose", 1);
cue(72.1, "gull", 29, 64, 15, "pearl", 1);
pair(75.9, "flower", 29, 42, 20, "garden", .85);
cue(80.3, "palm", 0, 59, 24, "rose");
for (let i = 0; i < 3; i++) cue(84 + i * 1.05, "gull", (1 - i) * 25, 48 + i * 6, 17, "sunrise", -1);
pair(89.2, "flower", 32, 52, 23, "orchid");
cue(93.8, "bouquet", -12, 59, 25, "garden");
cue(97.4, "flower", 20, 45, 19, "rose");

cue(101.7, "moon", -22, 60, 20, "moon");
cue(105.6, "star", 19, 51, 12, "pearl");
cue(109.1, "constellation", 0, 52, 34, "twilight");
cue(114.0, "comet", 37, 56, 27, "twilight", -1);
cue(117.1, "star", -26, 49, 16, "moon");
cue(119.7, "star", 7, 62, 12, "orchid");
cue(122.3, "star", 31, 45, 14, "twilight");
cue(126.0, "ring", -17, 54, 23, "orchid");
cue(128.8, "constellation", 14, 56, 29, "moon", -1);
pair(134.4, "willow", 33, 71, 23, "twilight", .7);
cue(138.3, "comet", 0, 41, 23, "beacon", 1);

cue(141.7, "lighthouse", -26, 48, 22, "beacon");
cue(145.1, "sail", 12, 52, 29, "sunrise");
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

export const festivalCues = cues.sort((a, b) => a.at - b.at);
