export const TARGET_LANES = {
  shooting: {x: -6.3, stationZ: 3.7, sourceZ: 3.18, sourceY: 1.57, targetZ: -4, targetY: 1.59,
    radius: .61, backstopWidth: 2.05, backstopHeight: 1.85, shots: 10},
  archery: {x: 0, stationZ: 3.7, sourceZ: 3.18, sourceY: 1.48, targetZ: -4, targetY: 1.63,
    radius: .76, backstopWidth: 2.21, backstopHeight: 1.99, shots: 6}
};
export const TARGET_CHARGE_MS = 860;
const floor = .11;
const ceiling = 3.65;
const laneHalfWidth = 1.96;
const restAim = {pan: 270, tilt: 0, power: .60};
const phases = ["aim", "flying", "finished"];
const clamp = (number, low, high) => Math.min(high, Math.max(low, number));
const finite = (number, low, high) => Number.isFinite(number) && number >= low && number <= high;
const integer = (number, low, high) => Number.isInteger(number) && finite(number, low, high);
const compact = number => Math.round(number * 1000) / 1000;

function point(shot, seconds) {
  return {x: shot.vx * seconds, y: shot.lane.sourceY + shot.vy * seconds - .5 * shot.gravity * seconds ** 2,
    z: shot.lane.sourceZ + shot.vz * seconds};
}

function launch(kind, view, power) {
  const lane = TARGET_LANES[kind], archery = kind === "archery";
  const gravity = archery ? 9.8 : 0;
  const speed = archery ? 7 + 15 * clamp(power, 0, 1) : 43;
  const heading = clamp(view.pan - 270, -24, 24) * Math.PI / 180;
  const elevation = clamp((archery ? 9.7 : 0) - view.tilt, -38, 42) * Math.PI / 180;
  const horizontal = speed * Math.cos(elevation);
  const vx = horizontal * Math.sin(heading), vy = speed * Math.sin(elevation), vz = -horizontal * Math.cos(heading);
  const atTarget = (lane.targetZ - lane.sourceZ) / vz;
  const atFloor = gravity ? (vy + Math.sqrt(vy * vy + 2 * gravity * (lane.sourceY - floor))) / gravity
    : vy < 0 ? (floor - lane.sourceY) / vy : Infinity;
  const rise = ceiling - lane.sourceY, ceilingRadicand = vy * vy - 2 * gravity * rise;
  const atCeiling = vy <= 0 ? Infinity : !gravity ? rise / vy
    : ceilingRadicand >= 0 ? (vy - Math.sqrt(ceilingRadicand)) / gravity : Infinity;
  const atWall = vx ? laneHalfWidth / Math.abs(vx) : Infinity;
  const seconds = Math.min(atTarget, atFloor, atCeiling, atWall);
  const shot = {lane, vx, vy, vz, gravity, seconds};
  const end = point(shot, seconds);
  const dy = end.y - lane.targetY, distance = Math.hypot(end.x, dy);
  const onBoard = seconds === atTarget && Math.abs(end.x) <= lane.backstopWidth / 2 && Math.abs(dy) <= lane.backstopHeight / 2;
  const points = onBoard && distance <= lane.radius ? Math.max(1, 10 - Math.floor(distance / lane.radius * 10)) : 0;
  return {...shot, end, impact: onBoard ? {x: end.x, y: end.y, points} : null, points};
}

export function targetAimPreview(kind, aim) {
  if (kind !== "archery" || !aim) return [];
  const shot = launch(kind, aim, aim.power);
  const end = Math.min(.58, shot.seconds);
  return Array.from({length: 9}, (_, index) => point(shot, end * (index + 1) / 9));
}

export function makeArcadeTargets() {
  let round = null;

  function start(kind) {
    if (!Object.hasOwn(TARGET_LANES, kind)) return false;
    round = {kind, attempts: 0, score: 0, lastScore: null, shot: null, aim: restAim, impacts: []};
    return true;
  }

  function aim(view, power) {
    if (!round || !Number.isFinite(view?.pan) || !Number.isFinite(view?.tilt) || !Number.isFinite(power)) return;
    const previous = round.aim;
    if (previous.pan !== view.pan || previous.tilt !== view.tilt || previous.power !== power) {
      round.aim = {pan: view.pan, tilt: view.tilt, power};
    }
  }

  function shoot(now, view, power = restAim.power) {
    if (!round || !Number.isFinite(now) || !Number.isFinite(view?.pan) || !Number.isFinite(view?.tilt) ||
      !Number.isFinite(power) || round.shot || round.attempts >= TARGET_LANES[round.kind].shots) return false;
    aim(view, power);
    round.shot = {...launch(round.kind, view, power), at: now};
    round.attempts++;
    round.lastScore = null;
    return true;
  }

  function update(now) {
    if (!round?.shot || now < round.shot.at + round.shot.seconds * 1000) return;
    const shot = round.shot;
    round.lastScore = shot.points;
    round.score += shot.points;
    if (shot.impact) round.impacts = [...round.impacts, shot.impact];
    round.shot = null;
  }

  function state(now) {
    if (!round) return null;
    const {kind, aim, attempts, score, lastScore, shot, impacts} = round;
    const shotsLeft = TARGET_LANES[kind].shots - attempts;
    const phase = shot ? "flying" : shotsLeft ? "aim" : "finished";
    const projectile = shot ? point(shot, clamp((now - shot.at) / 1000, 0, shot.seconds)) : null;
    return {kind, phase, attempts, shotsLeft, score, lastScore, aim, projectile, impacts};
  }

  return {start, aim, shoot, update, state, stop() { round = null; }};
}

export function targetSnapshot(state) {
  const {kind, phase, score, attempts, lastScore, projectile, impacts} = state;
  return {
    kind, phase, score, attempts, lastScore,
    ball: projectile ? [compact(projectile.x), compact(projectile.y), compact(projectile.z)] : null,
    hits: impacts.map(({x, y, points}) => [compact(x), compact(y), points])
  };
}

export function cleanTargetSnapshot(packet) {
  if (!packet || typeof packet.kind !== "string" || !Object.hasOwn(TARGET_LANES, packet.kind)) return null;
  const {kind, phase, score, attempts, lastScore, ball, hits} = packet, lane = TARGET_LANES[kind];
  if (!phases.includes(phase) || !integer(attempts, 0, lane.shots) || !integer(score, 0, attempts * 10) ||
      (phase === "finished" && attempts !== lane.shots) || (phase === "aim" && attempts >= lane.shots)) return null;
  if (phase === "flying" || !attempts ? lastScore !== null : !integer(lastScore, 0, 10)) return null;
  if (phase === "flying" ? !(attempts > 0 && Array.isArray(ball) && ball.length === 3 &&
     finite(ball[0], -laneHalfWidth - .001, laneHalfWidth + .001) && finite(ball[1], .10, ceiling + .001) &&
     finite(ball[2], lane.targetZ, lane.sourceZ + .001)) : ball !== null) return null;
  const halfWidth = lane.backstopWidth / 2 + .001, halfHeight = lane.backstopHeight / 2 + .001;
  if (!Array.isArray(hits) || hits.length > attempts || !hits.every(hit => Array.isArray(hit) && hit.length === 3 &&
    finite(hit[0], -halfWidth, halfWidth) && finite(hit[1], lane.targetY - halfHeight, lane.targetY + halfHeight) &&
    integer(hit[2], 0, 10))) return null;
  if (hits.reduce((total, hit) => total + hit[2], 0) !== score) return null;
  return {kind, phase, score, attempts, lastScore,
    ball: ball?.map(compact) ?? null, hits: hits.map(([x, y, value]) => [compact(x), compact(y), value])};
}

export function readTargetSnapshot(packet) {
  const {kind, phase, score, attempts, lastScore, ball, hits} = packet;
  const projectile = ball ? {x: ball[0], y: ball[1], z: ball[2]} : null;
  return {kind, phase, score, attempts, lastScore, projectile, shotsLeft: TARGET_LANES[kind].shots - attempts,
    impacts: hits.map(([x, y, points]) => ({x, y, points}))};
}
