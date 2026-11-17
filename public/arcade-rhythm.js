import {ARCADE_PADS} from "./arcade-layout.js";

const leadMs = 1800;
const travelMs = 1450;
const beatMs = 790;
const hitWindowMs = 190;
const perfectWindowMs = 88;
const padHalfWidth = .286;
const padHalfDepth = .284;
const chart = [0, 3, 1, 2, 0, 1, 3, 2, 1, 0, 2, 3, 0, 2, 1, 3, 2, 1, 0, 3, 1, 3, 2, 0];
const laneAt = position => ARCADE_PADS.findIndex(pad =>
  Math.abs(position.x - pad.x) <= padHalfDepth && Math.abs(position.y - pad.y) <= padHalfWidth);
const noteTime = (round, index) => round.start + index * beatMs;

function entryTime(previous, position, pad, now, frameMs) {
  // Find where this step crossed the pad's edge, even when it happened between frames.
  const fractionFromEdge = (before, after, center, halfSize) => {
    if (Math.abs(before - center) <= halfSize) return 0;
    const edge = center + Math.sign(before - center) * halfSize;
    return (edge - before) / (after - before);
  };
  const fraction = Math.max(
    fractionFromEdge(previous.x, position.x, pad.x, padHalfDepth),
    fractionFromEdge(previous.y, position.y, pad.y, padHalfWidth)
  );
  const start = Math.max(previous.time, now - frameMs);
  return start + (now - start) * fraction;
}

export function makeArcadeRhythm(playBeat) {
  let round = null;

  function start(now, position) {
    round = {
      start: now + leadMs, index: 0, sounded: -1, score: 0, combo: 0, best: 0,
      previous: {x: position.x, y: position.y, lane: laneAt(position), time: now},
      litLane: -1, litUntil: 0, result: "", finished: false
    };
  }

  function expireNotes(r, time) {
    while (r.index < chart.length && time > noteTime(r, r.index) + hitWindowMs) {
      r.index++;
      r.combo = 0;
      r.result = "놓쳤어요";
    }
  }

  function update(now, position, frameMs = 56) {
    if (!round || round.finished) return;
    const r = round;
    const beat = Math.min(chart.length - 1, Math.floor((now - r.start) / beatMs));
    if (beat >= 0 && beat > r.sounded) {
      r.sounded = beat;
      // Resuming a hidden tab should not play all the beats that elapsed in the background.
      if (now - noteTime(r, beat) <= 120) playBeat(chart[beat], beat % 4 === 0);
    }

    const lane = laneAt(position);
    if (lane >= 0 && lane !== r.previous.lane) {
      const steppedAt = entryTime(r.previous, position, ARCADE_PADS[lane], now, frameMs);
      expireNotes(r, steppedAt);
      const gap = Math.abs(steppedAt - noteTime(r, r.index));
      if (chart[r.index] === lane && gap <= hitWindowMs) {
        const perfect = gap <= perfectWindowMs;
        r.index++;
        r.combo++;
        r.best = Math.max(r.best, r.combo);
        r.score += perfect ? 100 : 65;
        r.litLane = lane;
        r.litUntil = now + 260;
        r.result = perfect ? "정확해요!" : "좋아요!";
      }
    }
    expireNotes(r, now);
    r.previous = {x: position.x, y: position.y, lane, time: now};
    r.finished = r.index === chart.length && r.sounded === chart.length - 1;
  }

  function state(now) {
    if (!round) return null;
    const r = round, notes = [];
    for (let index = r.index; index < chart.length; index++) {
      const until = noteTime(r, index) - now;
      if (until > travelMs) break;
      notes.push({lane: chart[index], progress: 1 - until / travelMs});
    }
    return {
      active: !r.finished, finished: r.finished, score: r.score, combo: r.combo, best: r.best,
      result: r.result, notes, hitZone: hitWindowMs / travelMs,
      readyLane: Math.abs(noteTime(r, r.index) - now) <= hitWindowMs ? chart[r.index] ?? -1 : -1,
      litLane: now < r.litUntil ? r.litLane : -1
    };
  }

  return {start, update, state, stop() { round = null; }};
}
