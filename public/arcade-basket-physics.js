export const BASKET_HOOP = Object.freeze({x: 0, y: 1.67, z: -.8, majorRadius: .285, tubeRadius: .026});
export const BASKET_BALL = Object.freeze({x: 0, y: 1.35, z: 1.6, radius: .11});
export const BASKET_BACKBOARD = Object.freeze({x: 0, y: 2.10, z: -1.247, width: 1.91, height: .93, depth: .034});
export const BASKET_BACKING = Object.freeze({x: 0, y: 1.38, z: -1.369, width: 2.10, height: 2.76, depth: .21});
export const BASKET_RAMP = Object.freeze({x: 0, y: .34, z: .39, width: 1.93, height: .11, depth: 1.83, tilt: .17});

const GRAVITY = 9.8;
const STEP = 1 / 120;
const MAX_STEPS = 450;
const FLOOR = -.055;
const BALL_RADIUS = BASKET_BALL.radius;
const OPENING = BASKET_HOOP.majorRadius - BASKET_HOOP.tubeRadius - BALL_RADIUS;
const NET_ENTRY = BASKET_HOOP.y - BALL_RADIUS - BASKET_HOOP.tubeRadius;
const CONTACT_PAD = .00045;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const mix = (from, to, fraction) => from + (to - from) * fraction;

export function basketVelocity(view, power) {
  const yaw = (view.pan - 270) * Math.PI / 180;
  const elevation = clamp(44 - view.tilt, 12, 59) * Math.PI / 180;
  const speed = 3.44 + 3 * clamp(power, 0, 1);
  const flat = speed * Math.cos(elevation);
  return {x: flat * Math.sin(yaw), y: speed * Math.sin(elevation), z: -flat * Math.cos(yaw)};
}

export function basketTrajectory(view) {
  const velocity = basketVelocity(view, view.power);
  const ground = FLOOR + BALL_RADIUS;
  const landing = (velocity.y + Math.sqrt(velocity.y ** 2 + 2 * GRAVITY * (BASKET_BALL.y - ground))) / GRAVITY;
  const face = BASKET_BACKBOARD.z + BASKET_BACKBOARD.depth / 2 + BALL_RADIUS;
  const endsAt = Math.min(landing, (face - BASKET_BALL.z) / velocity.z, .77);
  return Array.from({length: 14}, (_, index) => {
    const time = endsAt * (index + 1) / 14;
    return {
      x: BASKET_BALL.x + velocity.x * time,
      y: BASKET_BALL.y + velocity.y * time - .5 * GRAVITY * time ** 2,
      z: BASKET_BALL.z + velocity.z * time
    };
  });
}

function unit(x, y, z) {
  const length = Math.hypot(x, y, z);
  return length ? {x: x / length, y: y / length, z: z / length} : {x: 0, y: 1, z: 0};
}

function solidBox(spec, kind, restitution, grip) {
  const {width, height, depth} = spec;
  const halfX = width / 2, halfY = height / 2, halfZ = depth / 2;
  const cos = Math.cos(spec.tilt ?? 0), sin = Math.sin(spec.tilt ?? 0);
  const point = (x, y, z) => ({x: x - spec.x, y: (y - spec.y) * cos + (z - spec.z) * sin,
    z: (z - spec.z) * cos - (y - spec.y) * sin});
  return {
    kind, restitution, grip,
    gap(x, y, z) {
      const p = point(x, y, z);
      const dx = Math.abs(p.x) - halfX, dy = Math.abs(p.y) - halfY, dz = Math.abs(p.z) - halfZ;
      return Math.hypot(Math.max(0, dx), Math.max(0, dy), Math.max(0, dz)) +
        Math.min(0, Math.max(dx, dy, dz)) - BALL_RADIUS;
    },
    normal(x, y, z) {
      const p = point(x, y, z);
      let dx = p.x - clamp(p.x, -halfX, halfX);
      let dy = p.y - clamp(p.y, -halfY, halfY);
      let dz = p.z - clamp(p.z, -halfZ, halfZ);
      if (!dx && !dy && !dz) {
        const deepest = Math.max(Math.abs(p.x) - halfX, Math.abs(p.y) - halfY, Math.abs(p.z) - halfZ);
        if (deepest === Math.abs(p.x) - halfX) dx = Math.sign(p.x) || 1;
        else if (deepest === Math.abs(p.y) - halfY) dy = Math.sign(p.y) || 1;
        else dz = Math.sign(p.z) || 1;
      }
      return unit(dx, dy * cos - dz * sin, dy * sin + dz * cos);
    }
  };
}

const rim = {
  kind: "rim", restitution: .73, grip: .95,
  gap(x, y, z) {
    const radial = Math.hypot(x, z - BASKET_HOOP.z);
    return Math.hypot(radial - BASKET_HOOP.majorRadius, y - BASKET_HOOP.y) - BASKET_HOOP.tubeRadius - BALL_RADIUS;
  },
  normal(x, y, z) {
    const radial = Math.hypot(x, z - BASKET_HOOP.z) || 1;
    const axis = 1 - BASKET_HOOP.majorRadius / radial;
    return unit(x * axis, y - BASKET_HOOP.y, (z - BASKET_HOOP.z) * axis);
  }
};
const fixedSurfaces = [
  solidBox(BASKET_BACKBOARD, "backboard", .71, .96),
  solidBox(BASKET_BACKING, "backboard", .63, .94),
  solidBox(BASKET_RAMP, "ramp", .51, .82),
  {kind: "floor", restitution: .43, grip: .77,
    gap: (_x, y) => y - FLOOR - BALL_RADIUS, normal: () => ({x: 0, y: 1, z: 0})}
];

function sweep(surface, from, to, shiftFrom = 0, shiftTo = shiftFrom) {
  const startX = from.x - shiftFrom;
  const dx = to.x - shiftTo - startX, dy = to.y - from.y, dz = to.z - from.z;
  const length = Math.hypot(dx, dy, dz);
  if (length < 1e-8) return null;
  let fraction = 0;
  // The gap is measured from the ball's outer surface. Advancing by that distance
  // cannot jump over either the curved rim or a rounded backboard edge.
  for (let pass = 0; pass < 32 && fraction <= 1; pass++) {
    const x = startX + dx * fraction, y = from.y + dy * fraction, z = from.z + dz * fraction;
    const gap = surface.gap(x, y, z);
    if (gap <= CONTACT_PAD) {
      const normal = surface.normal(x, y, z);
      return normal.x * dx + normal.y * dy + normal.z * dz < 0 ? {fraction, normal, surface} : null;
    }
    fraction += (gap - CONTACT_PAD * .5) / length;
  }
  return null;
}

function crossesOpening(from, to, fraction, rimStart, rimEnd) {
  if (from.y < BASKET_HOOP.y || to.y > BASKET_HOOP.y || to.y >= from.y) return false;
  const cross = (from.y - BASKET_HOOP.y) / (from.y - to.y);
  if (cross > fraction) return false;
  const x = mix(from.x, to.x, cross) - mix(rimStart, rimEnd, cross);
  const z = mix(from.z, to.z, cross) - BASKET_HOOP.z;
  return Math.hypot(x, z) <= OPENING;
}

export function createBasketShot(at, view, power) {
  const velocity = basketVelocity(view, power);
  return {
    at, steps: 0, x: BASKET_BALL.x, y: BASKET_BALL.y, z: BASKET_BALL.z,
    vx: velocity.x, vy: velocity.y, vz: velocity.z, enteredHoop: false, scored: false, endedAt: null
  };
}

function step(shot, startAt, rimXAt, onEvent) {
  let remaining = STEP, time = startAt;
  for (let contact = 0; contact < 4 && remaining > .00001; contact++) {
    const to = {x: shot.x + shot.vx * remaining,
      y: shot.y + shot.vy * remaining - .5 * GRAVITY * remaining ** 2, z: shot.z + shot.vz * remaining};
    const startX = rimXAt(time), endX = rimXAt(time + remaining * 1000);
    let hit = sweep(rim, shot, to, startX, endX);
    for (const surface of fixedSurfaces) {
      const candidate = sweep(surface, shot, to);
      if (candidate && (!hit || candidate.fraction < hit.fraction)) hit = candidate;
    }
    const fraction = hit?.fraction ?? 1;
    const height = mix(shot.y, to.y, fraction);
    if (!shot.scored) {
      if (height > BASKET_HOOP.y) shot.enteredHoop = false;
      if (crossesOpening(shot, to, fraction, startX, endX)) shot.enteredHoop = true;
      if (shot.enteredHoop && height <= NET_ENTRY) {
        const crossing = (shot.y - NET_ENTRY) / (shot.y - to.y);
        shot.scored = true;
        onEvent("score", time + crossing * remaining * 1000, 1);
      }
    }
    const segment = remaining * fraction;
    shot.x = mix(shot.x, to.x, fraction);
    shot.y = height;
    shot.z = mix(shot.z, to.z, fraction);
    shot.vy -= GRAVITY * segment;
    time += segment * 1000;
    if (!hit) return;

    const {normal: n, surface} = hit;
    const surfaceVx = surface === rim ? (endX - startX) / remaining : 0;
    const vx = shot.vx - surfaceVx;
    const inward = Math.min(0, vx * n.x + shot.vy * n.y + shot.vz * n.z);
    const rebound = -inward * (surface.restitution + surface.grip);
    shot.vx = surfaceVx + vx * surface.grip + rebound * n.x;
    shot.vy = shot.vy * surface.grip + rebound * n.y;
    shot.vz = shot.vz * surface.grip + rebound * n.z;
    shot.x += n.x * CONTACT_PAD * 2;
    shot.y += n.y * CONTACT_PAD * 2;
    shot.z += n.z * CONTACT_PAD * 2;
    if (inward < -.48) onEvent(surface.kind, time, Math.min(1, -inward / 6.4));
    if ((surface.kind === "floor" || surface.kind === "ramp") && n.y > .8 && Math.abs(inward) < .62) {
      shot.endedAt = time;
      return;
    }
    remaining -= segment;
  }
}

export function advanceBasketShot(shot, now, rimXAt, onEvent) {
  // The ball gets the same trajectory and score at every render rate, including
  // a large frame gap. Each fixed step still sweeps for contacts within that step.
  const end = Math.min(MAX_STEPS, Math.floor((now - shot.at) / (STEP * 1000)));
  while (shot.endedAt === null && shot.steps < end) {
    step(shot, shot.at + shot.steps * STEP * 1000, rimXAt, onEvent);
    shot.steps++;
    if (Math.abs(shot.x) >= 5.7 || shot.z <= -5.7 || shot.z >= 2.75 || shot.steps === MAX_STEPS) {
      shot.x = clamp(shot.x, -5.7, 5.7);
      shot.z = clamp(shot.z, -5.7, 2.75);
      shot.endedAt ??= shot.at + shot.steps * STEP * 1000;
    }
  }
}
