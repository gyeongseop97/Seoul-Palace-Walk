export const SHOOTING_LANE = Object.freeze({
  x: -6.3, stationZ: 3.7, sourceZ: 3.18, sourceY: 1.57, targetZ: -4.81, shots: 45
});
export const SHOOTING_FALL_MS = 375;
export const SHOOTING_RISE_MS = 465;
const clearPause = 650;
const laneHalfWidth = 1.96, floor = .11, ceiling = 3.65;
const velocity = 43, pelletRadius = .010;
const radians = Math.PI / 180;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const finite = (n, lo, hi) => Number.isFinite(n) && n >= lo && n <= hi;
const time = n => Number.isSafeInteger(n) && finite(n, 0, 9999999999999);
const compact = n => Math.round(n * 1000) / 1000;
const phases = ["aim", "flying", "resetting", "finished"];
const tiers = [
  {count: 5, spacing: .650, y: .83, z: -3.64, radius: .239, points: 10, tier: "large"},
  {count: 6, spacing: .557, y: 1.42, z: -4.02, radius: .169, points: 20, tier: "medium"},
  {count: 7, spacing: .481, y: 2.00, z: -4.39, radius: .111, points: 30, tier: "small"}
];
export const SHOOTING_TARGETS = Object.freeze(tiers.flatMap(({count, spacing, ...tier}) =>
  Array.from({length: count}, (_, index) => Object.freeze({...tier, x: compact((index - (count - 1) / 2) * spacing)}))));
const rackScore = SHOOTING_TARGETS.reduce((sum, target) => sum + target.points, 0);
const maxRack = Math.floor(SHOOTING_LANE.shots / SHOOTING_TARGETS.length) + 1;

function point(shot, seconds) {
  return {x: shot.vx * seconds, y: SHOOTING_LANE.sourceY + shot.vy * seconds, z: SHOOTING_LANE.sourceZ + shot.vz * seconds};
}

function launch(view, down) {
  const heading = clamp(view.pan - 270, -24, 24) * radians;
  const pitch = clamp(-view.tilt, -28, 22) * radians;
  const level = velocity * Math.cos(pitch);
  const vx = level * Math.sin(heading), vy = velocity * Math.sin(pitch), vz = -level * Math.cos(heading);
  const rear = (SHOOTING_LANE.targetZ - SHOOTING_LANE.sourceZ) / vz;
  const atWall = vx ? laneHalfWidth / Math.abs(vx) : Infinity;
  const atHeight = vy > 0 ? (ceiling - SHOOTING_LANE.sourceY) / vy : vy < 0 ? (floor - SHOOTING_LANE.sourceY) / vy : Infinity;
  const shot = {vx, vy, vz, seconds: Math.min(rear, atWall, atHeight), target: -1};
  for (const [index, target] of SHOOTING_TARGETS.entries()) {
    if (down[index] !== null) continue;
    const seconds = (target.z - SHOOTING_LANE.sourceZ) / vz;
    if (seconds >= shot.seconds) continue;
    const p = point(shot, seconds);
    if (Math.hypot(p.x - target.x, p.y - target.y) <= target.radius + pelletRadius) {
      shot.seconds = seconds;
      shot.target = index;
    }
  }
  return shot;
}

export function makeArcadeShooting() {
  let round = null;

  function start() {
    round = {attempts: 0, score: 0, lastScore: null, shot: null, rack: 1,
      down: SHOOTING_TARGETS.map(() => null), clearAt: null, riseAt: null};
  }

  function shoot(now, view) {
    if (!round || !Number.isFinite(now) || !Number.isFinite(view?.pan) || !Number.isFinite(view?.tilt) ||
      round.shot || round.clearAt !== null || round.riseAt !== null || round.attempts >= SHOOTING_LANE.shots) return false;
    round.shot = {...launch(view, round.down), at: now};
    round.attempts++;
    round.lastScore = null;
    return true;
  }

  function update(now) {
    if (!round) return;
    const shot = round.shot;
    if (shot && now >= shot.at + shot.seconds * 1000) {
      const impactAt = Math.round(shot.at + shot.seconds * 1000);
      round.lastScore = SHOOTING_TARGETS[shot.target]?.points ?? 0;
      if (shot.target >= 0) {
        round.down[shot.target] = impactAt;
        round.score += round.lastScore;
        if (round.down.every(hitAt => hitAt !== null)) round.clearAt = impactAt + clearPause;
      }
      round.shot = null;
    }
    if (round.clearAt !== null && now >= round.clearAt) {
      round.rack++;
      round.down.fill(null);
      round.riseAt = round.clearAt;
      round.clearAt = null;
    }
    if (round.riseAt !== null && now >= round.riseAt + SHOOTING_RISE_MS) round.riseAt = null;
  }

  function state(now) {
    if (!round) return null;
    const {attempts, score, lastScore, shot, rack, down, clearAt, riseAt} = round;
    const shotsLeft = SHOOTING_LANE.shots - attempts;
    const phase = shot ? "flying" : clearAt !== null || riseAt !== null ? "resetting" : shotsLeft ? "aim" : "finished";
    const projectile = shot ? point(shot, clamp((now - shot.at) / 1000, 0, shot.seconds)) : null;
    return {kind: "shooting", phase, attempts, shotsLeft, score, lastScore, rack, down, riseAt, projectile, clock: now};
  }

  return {start, shoot, update, state, stop() { round = null; }};
}

export function shootingSnapshot({phase, score, attempts, lastScore, rack, down, riseAt, projectile}) {
  return {kind: "shooting", phase, score, attempts, lastScore, rack, riseAt,
    ball: projectile ? [compact(projectile.x), compact(projectile.y), compact(projectile.z)] : null,
    down: down.flatMap((at, index) => at === null ? [] : [[index, at]])};
}

export function cleanShootingSnapshot(packet) {
  const {phase, score, attempts, lastScore, rack, riseAt, ball, down} = packet;
  const count = SHOOTING_TARGETS.length;
  if (!phases.includes(phase) || !Number.isInteger(attempts) || !finite(attempts, 0, SHOOTING_LANE.shots) ||
      !Number.isInteger(rack) || !finite(rack, 1, maxRack) || !Array.isArray(down) || down.length > count ||
      (riseAt !== null && !time(riseAt))) return null;
  if (phase === "finished" && attempts !== SHOOTING_LANE.shots || phase === "aim" && attempts >= SHOOTING_LANE.shots ||
      (phase === "resetting") !== (down.length === count || riseAt !== null) ||
      riseAt !== null && (rack === 1 || down.length)) return null;
  if (phase === "flying" || !attempts ? lastScore !== null : ![0, 10, 20, 30].includes(lastScore)) return null;
  if (phase === "flying" ? !(Array.isArray(ball) && ball.length === 3 &&
    finite(ball[0], -laneHalfWidth - .001, laneHalfWidth + .001) && finite(ball[1], floor - .001, ceiling + .001) &&
    finite(ball[2], SHOOTING_LANE.targetZ - .001, SHOOTING_LANE.sourceZ + .001)) : ball !== null) return null;

  const used = new Set();
  let counted = (rack - 1) * rackScore;
  for (const pair of down) {
    if (!Array.isArray(pair) || pair.length !== 2) return null;
    const [index, at] = pair;
    if (!Number.isInteger(index) || !finite(index, 0, count - 1) || used.has(index) || !time(at)) return null;
    used.add(index);
    counted += SHOOTING_TARGETS[index].points;
  }
  if (attempts < (rack - 1) * count + used.size + Number(phase === "flying") || score !== counted) return null;
  return {kind: "shooting", phase, score, attempts, lastScore, rack, riseAt, ball: ball?.map(compact) ?? null,
    down: down.map(([index, at]) => [index, at])};
}

export function readShootingSnapshot({phase, score, attempts, lastScore, rack, riseAt, ball, down}) {
  const dropped = SHOOTING_TARGETS.map(() => null);
  for (const [index, at] of down) dropped[index] = at;
  return {kind: "shooting", phase, score, attempts, lastScore, rack, riseAt,
    shotsLeft: SHOOTING_LANE.shots - attempts, down: dropped, projectile: ball ? {x: ball[0], y: ball[1], z: ball[2]} : null};
}
