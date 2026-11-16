// Hair for the walker's sculpted head. Every style is a scalp shell covered with thick,
// tapered clumps laid along the skull, the way stylised character hair is usually modelled:
// big shapes for the silhouette, then overlapping locks for the fringe, sides and back.
// Vertex colours hold only light and shade; the material supplies the hair colour.
import {CROWN,crownFullness,frontBreadth,fullness} from "./avatar-head.js";

const TAU = Math.PI * 2, SIDE = [-1, 1];
const clamp = (n, low = 0, high = 1) => Math.min(high, Math.max(low, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const mix = (a, b, t) => a + (b - a) * t;
const ease = (from, to, n) => smooth((n - from) / (to - from));

export const HAIR_STYLES = ["short", "crop", "parted", "curly", "bob", "long", "wavy", "ponytail", "twintails",
  "braids", "bun", "topknot"];
// Styles that stand above the crown, so name labels and hats know to make room.
export const TALL_HAIR = new Set(["bun", "topknot", "ponytail"]);

// A point on a shell around the skull. turn: 0 is the face, positive toward +x, π the back.
// drop: angle down from the crown. lift: shell size, 1 being the skin.
function on(turn, drop, lift = 1.07) {
  const depth = Math.cos(turn), height = Math.cos(drop), full = fullness(height) - 1, round = crownFullness(height) - 1;
  // Below the eye line the head is fuller than a ball, and its underside flatter.
  const ring = Math.sin(drop), y = height < -.72 ? -.72 + (height + .72) * .80 : height > 0 ? height * CROWN : height;
  const broad = frontBreadth(Math.sin(turn), depth, height);
  return [Math.sin(turn) * ring * (.352 + .338 * (full + round)) * lift * broad, y * .324 * lift + .004,
    depth * ring * ((depth > 0 ? .324 - .016 * smooth((height - .05) / .55) : .348) + .314 * (full * (depth > 0 ? 1.0 : .50) + round * (depth > 0 ? .35 : .6))) * lift * broad - .004];
}

export function makeHairGeometry(T, style) {
  const positions = [], colors = [], indices = [];
  const tangent = new T.Vector3(), out = new T.Vector3(), across = new T.Vector3(), point = new T.Vector3();
  const vertex = (x, y, z, shade) => { positions.push(x, y, z); colors.push(shade, shade, shade); return positions.length / 3 - 1; };

  // The shell that covers the scalp. reach(turn) says how far down the hair grows.
  function cap(reach, {lift = 1.045, hang = 0, curl = 0, strands = 15} = {}) {
    const rings = 15, sides = 52, base = positions.length / 3;
    for (let row = 0; row <= rings; row++) {
      for (let side = 0; side <= sides; side++) {
        const turn = side / sides * TAU, t = row / rings, drop = .01 + t * reach(turn);
        const level = Math.min(drop, 2.30), below = Math.max(0, drop - 2.30);
        const ridge = Math.sin(turn * strands + drop * 1.4) * Math.sin(Math.min(drop, 1.5));
        const [x, y, z] = on(turn, level, lift + .012 * ridge + .020 * Math.sin(level));
        // Past the ears the hair hangs instead of wrapping under the jaw.
        const tuck = 1 - curl * smooth(below / .35) * .16;
        vertex(x * tuck, y - below * .34 * (1 + hang), z * tuck,
          .80 + .07 * ridge + .05 * Math.sin(turn * 2 + .4) - .10 * t ** 3);
        if (row && side) {
          const a = base + (row - 1) * (sides + 1) + side - 1, b = a + sides + 1;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
  }

  // A lock of hair swept along a spine: rounded on the outside, flatter against the head,
  // swelling from the root and tapering to the tip.
  function clump(spine, width, thick, {tip = .10, root = .55, tint = 1, flat = .42, rings = 9, sides = 8, twist = 0, round = false} = {}) {
    const curve = new T.CatmullRomCurve3(spine.map(p => new T.Vector3(p[0], p[1], p[2])), false, "centripetal");
    const base = positions.length / 3;
    for (let row = 0; row <= rings; row++) {
      const s = row / rings;
      curve.getPoint(s, point); curve.getTangent(s, tangent);
      out.set(point.x, point.y - clamp(point.y, -.10, .10), point.z + .01);
      out.addScaledVector(tangent, -out.dot(tangent));
      if (out.lengthSq() < 1e-8) out.set(0, 0, 1);
      out.normalize();
      across.crossVectors(tangent, out).normalize();
      const body = mix(root, 1, smooth(s / .28));
      // Pointed locks taper all the way; rounded ones keep their width and close like a fingertip.
      const end = round ? mix(1, tip, smooth((s - .25) / .6)) * Math.sqrt(Math.max(.02, 1 - Math.max(0, (s - .84) / .16) ** 2))
        : 1 - (1 - tip) * smooth((s - .45) / .55) ** 1.25;
      const w = width * body * end, h = thick * (.5 + .5 * body) * end ** .7;
      for (let side = 0; side < sides; side++) {
        const angle = side / sides * TAU + twist * s, c = Math.cos(angle), n = Math.sin(angle);
        const rise = n >= 0 ? n * h : n * h * flat;
        vertex(point.x + across.x * c * w + out.x * rise, point.y + across.y * c * w + out.y * rise,
          point.z + across.z * c * w + out.z * rise,
          tint * (.80 + .15 * Math.max(0, n) + .07 * Math.sin(Math.PI * Math.min(1, s * 1.15)) - .05 * Math.abs(c) ** 3));
        if (row) {
          const a = base + (row - 1) * sides + side, b = base + (row - 1) * sides + (side + 1) % sides;
          indices.push(a, a + sides, b, b, a + sides, b + sides);
        }
      }
    }
    curve.getPoint(1, point); curve.getTangent(1, tangent);
    const reach = round ? .01 : width * tip * 1.4;
    const end = vertex(point.x + tangent.x * reach, point.y + tangent.y * reach, point.z + tangent.z * reach, tint * .78);
    for (let side = 0; side < sides; side++) indices.push(base + rings * sides + side, end, base + rings * sides + (side + 1) % sides);
  }

  // Buns, curls and the beads of a braid.
  function ball(x, y, z, rx, ry, rz, {twist = 5, tint = 1, detail = 12} = {}) {
    const base = positions.length / 3, rows = Math.max(6, Math.round(detail * .7));
    for (let row = 0; row <= rows; row++) {
      for (let side = 0; side <= detail; side++) {
        const polar = row / rows * Math.PI, turn = side / detail * TAU;
        const px = Math.sin(polar) * Math.sin(turn), py = Math.cos(polar), pz = Math.sin(polar) * Math.cos(turn);
        const ridge = Math.sin(turn * twist + py * 5.5) * (1 - py * py), swell = 1 + ridge * .05;
        vertex(x + px * rx * swell, y + py * ry, z + pz * rz * swell, tint * (.82 + .11 * ridge + .14 * py));
        if (row && side) {
          const a = base + (row - 1) * (detail + 1) + side - 1, b = a + detail + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
  }

  const hairline = (front, side, back) => turn => {
    const away = Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn)));
    return mix(mix(front, side, ease(.55, 1.25, away)), back, ease(1.55, 2.25, away));
  };
  // One lock of a fringe, from near the crown to the brow.
  function lock(from, to, drop, width, {lift = 1.09, start = .34, thick = .034, tint = 1, tip = .10} = {}) {
    // Fringes reach down to the eyebrows.
    drop += .15;
    clump([on(from, start, 1.05), on(mix(from, to, .45), mix(start, drop, .52), lift + .035), on(to, drop, lift)],
      width, thick, {tip, tint, root: .7});
  }
  const shades = [1, .93, 1.06, .97, 1.03, .90, 1.05];
  // A fringe swept from a parting on one side across the forehead.
  function sweptFringe(direction = 1, drop = 1.30) {
    [[.62, .98, drop + .12, .080], [.50, .52, drop + .02, .092], [.38, .16, drop + .06, .100], [.24, -.20, drop, .104],
      [.10, -.52, drop - .05, .098], [-.06, -.82, drop - .02, .088], [-.42, -1.06, drop + .14, .074]]
      .forEach(([from, to, reach, width], i) => lock(direction * from, direction * to, reach, width, {tint: shades[i]}));
  }
  // Straight bangs cut level above the eyes.
  function bluntFringe(drop = 1.34, span = .86) {
    for (let i = 0; i < 7; i++) {
      const turn = mix(-span, span, i / 6);
      lock(turn * .62, turn, drop + .03 * Math.cos(i * 2.1), .098, {tint: shades[i], tip: .34, thick: .030});
    }
  }
  // Parted in the middle and drawn aside like curtains.
  function curtainFringe(drop = 1.40, width = 1) {
    for (const side of SIDE) {
      lock(side * .05, side * .50, drop - .20, .078 * width, {tint: 1.04, lift: 1.11});
      lock(side * .09, side * .86, drop, .098 * width, {tint: .96, lift: 1.11});
      lock(side * .20, side * 1.16, drop + .14, .086 * width, {tint: 1.02, lift: 1.10});
    }
  }
  // Thin strands that leave most of the forehead showing.
  function wispyFringe(drop = 1.22) {
    [[-.10, -.62, .060], [.02, -.24, .066], [.06, .18, .066], [.14, .58, .060], [-.30, -.96, .054], [.34, .98, .054]]
      .forEach(([from, to, width], i) => lock(from, to, drop + (Math.abs(to) > .8 ? .22 : .04 * Math.cos(i * 1.7)), width,
        {tint: shades[i], thick: .028}));
  }
  // Locks covering the nape, from behind one ear to the other.
  function nape(drop, count = 7, width = .100, start = .95) {
    for (let i = 0; i < count; i++) {
      const turn = mix(1.72, TAU - 1.72, i / (count - 1));
      clump([on(turn, start, 1.05), on(turn, mix(start, drop, .55), 1.10), on(turn + .04 * Math.cos(i * 2.3), drop, 1.07)],
        width, .036, {tint: shades[i % 7], tip: .22});
    }
  }
  function sideburns(drop = 1.80, width = .060) {
    for (const side of SIDE) clump([on(side * 1.22, 1.05, 1.05), on(side * 1.27, 1.45, 1.08), on(side * 1.24, drop, 1.05)],
      width, .028, {tint: .95});
  }
  // Long hair falling from the skull: `fall` lists [reach outward, height, depth] below the head.
  function fallingLock(turn, start, fall, width, thick, options = {}) {
    const [x, , z] = on(turn, 1.57, 1), ring = Math.hypot(x, z) || 1, sx = x / ring, sz = z / ring;
    clump([on(turn, start, 1.05), on(turn, mix(start, 1.5, .6), 1.11), on(turn, 1.56, 1.10),
      ...fall.map(([reach, y, sway = 0]) => [sx * reach - sz * sway, y, sz * reach * .98 + sx * sway])], width, thick, options);
  }

  if (style === "short") {
    cap(hairline(1.02, 1.52, 2.50));
    sweptFringe(1, 1.28);
    sideburns();
    nape(2.36, 7, .104, 1.0);
    clump([on(2.6, .20, 1.05), on(2.3, .10, 1.20), on(1.6, .22, 1.24)], .050, .034, {tint: 1.06});
  } else if (style === "crop") {
    cap(hairline(.94, 1.42, 2.42), {lift: 1.035, strands: 23});
    // A short fringe brushed up and away from the forehead.
    for (let i = 0; i < 7; i++) {
      const turn = mix(-.84, .84, i / 6);
      clump([on(turn * .8, .62, 1.04), on(turn, .90, 1.10), on(turn * 1.04, .94, 1.22 - .05 * Math.abs(turn))], .078, .040,
        {tint: shades[i], tip: .2});
    }
    sideburns(1.70, .050);
  } else if (style === "parted") {
    cap(hairline(.98, 1.56, 2.50));
    curtainFringe(1.42, 1.08);
    sideburns();
    nape(2.38, 7, .104, 1.0);
  } else if (style === "curly") {
    cap(hairline(1.04, 1.50, 2.40), {lift: 1.03});
    // Rows of round curls, loosest over the forehead.
    [[.30, 5, 1.08], [.68, 9, 1.10], [1.04, 12, 1.10], [1.34, 13, 1.08], [1.60, 9, 1.07], [1.84, 7, 1.05]]
      .forEach(([drop, count, lift], row) => {
        for (let i = 0; i < count; i++) {
          let turn = (i + (row % 2) * .5) / count * TAU;
          if (row >= 4) turn = mix(1.55, TAU - 1.55, i / (count - 1));
          else if (row === 3 && Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn))) < .95) continue;
          const [x, y, z] = on(turn, drop, lift), size = .078 + .012 * Math.cos(i * 2.7 + row);
          ball(x, y, z, size, size * .92, size, {twist: 3, tint: shades[(i + row) % 7], detail: 9});
        }
      });
    for (let i = 0; i < 5; i++) {
      const [x, y, z] = on(mix(-.72, .72, i / 4), 1.16 + .04 * Math.cos(i * 2), 1.09);
      ball(x, y, z, .074, .066, .060, {twist: 3, tint: shades[i], detail: 9});
    }
  } else if (style === "bob") {
    cap(hairline(1.05, 2.40, 2.46), {lift: 1.07, hang: .25, curl: 1, strands: 21});
    bluntFringe(1.36);
    for (const side of SIDE) {
      // Panels that curve in under the cheeks.
      fallingLock(side * .98, .5, [[.378, -.13], [.352, -.255], [.300, -.300]], .098, .040, {tint: 1.03, tip: .7, round: true});
      fallingLock(side * 1.36, .5, [[.386, -.14], [.360, -.275], [.305, -.318]], .110, .040, {tint: .95, tip: .7, round: true});
    }
  } else if (style === "long" || style === "wavy") {
    const wavy = style === "wavy";
    cap(hairline(.98, 1.80, 1.92), {lift: 1.05});
    if (wavy) curtainFringe(1.50, 1.12); else sweptFringe(-1, 1.30);
    const sway = (amount, i) => wavy ? amount * 2.1 * Math.cos(i * 2.2) : 0;
    const mass = {round: true, rings: 14, sides: 14, root: .7};
    // One broad sheet down the back with a thick lock at either side of it.
    fallingLock(Math.PI, .6, [[.372, -.20], [.352, -.46, sway(.03, 1)], [.318, -.70, sway(-.03, 2)], [.286, -.86]],
      .285, wavy ? .095 : .080, {...mass, tip: .80, tint: .94});
    for (const side of SIDE) {
      fallingLock(Math.PI + side * .80, .65, [[.372, -.20, sway(.03, 2)], [.356, -.44, sway(-.045, 3)],
        [.330, -.66, sway(.045, 4)], [.300, -.80, sway(-.02, 5)]], .165, wavy ? .090 : .074, {...mass, tip: .72, tint: 1.03});
      fallingLock(side * 1.62, .6, [[.384, -.18, sway(-.03, 3)], [.376, -.40, sway(.045, 4)], [.352, -.60, sway(-.045, 5)],
        [.322, -.74, sway(.02, 6)]], .125, wavy ? .078 : .062, {...mass, tip: .70, tint: .97});
      // A lock in front of each ear, resting on the shoulder.
      fallingLock(side * 1.10, .5, [[.376, -.15, sway(.03, 1)], [.364, -.34, sway(-.04, 2)], [.340, -.52, sway(.04, 3)],
        [.312, wavy ? -.68 : -.62, sway(-.02, 4)]], .088, wavy ? .060 : .048, {...mass, tip: .66, tint: 1.05});
    }
  } else if (style === "ponytail") {
    cap(hairline(1.00, 1.58, 2.52), {strands: 26});
    wispyFringe(1.26);
    sideburns(1.92, .050);
    const [, tieY, tieZ] = on(Math.PI, .78, 1.10);
    ball(0, tieY, tieZ - .02, .070, .060, .060, {twist: 8, tint: .7, detail: 10});
    clump([[0, tieY, tieZ], [0, tieY + .05, tieZ - .15], [0, tieY - .14, tieZ - .23], [0, tieY - .42, tieZ - .20],
      [0, tieY - .64, tieZ - .11]], .150, .085, {root: .55, rings: 14, sides: 12, round: true, tip: .62});
  } else if (style === "twintails") {
    cap(hairline(1.00, 1.58, 2.52), {strands: 26});
    bluntFringe(1.32, .78);
    sideburns(1.95, .052);
    for (const side of SIDE) {
      const [x, y, z] = on(side * 1.92, .98, 1.10);
      ball(x, y, z, .062, .062, .062, {twist: 8, tint: .7, detail: 10});
      clump([[x, y, z], [x + side * .12, y + .02, z - .05], [x + side * .19, y - .22, z - .05],
        [x + side * .17, y - .48, z - .02], [x + side * .11, y - .68, z + .02]], .125, .080,
        {root: .55, rings: 14, sides: 12, round: true, tip: .60});
    }
  } else if (style === "braids") {
    cap(hairline(1.00, 1.62, 2.52), {strands: 26});
    curtainFringe(1.36, .95);
    for (const side of SIDE) {
      const [x, y, z] = on(side * 1.72, 1.74, 1.04);
      // Plaits hanging in front of the shoulders, tied at the ends.
      for (let i = 0; i < 9; i++) {
        const t = i / 8, size = .060 - .014 * t;
        ball(x + side * (.012 * Math.cos(i * Math.PI) - .030 * t), y - .02 - i * .072, z + .050 + .012 * Math.sin(i * Math.PI + .5) + .05 * t,
          size, size * .78, size * .92, {twist: 2, tint: i % 2 ? 1.05 : .93, detail: 8});
      }
      ball(x - side * .030, y - .685, z + .104, .040, .026, .040, {twist: 8, tint: .7, detail: 8});
      clump([[x - side * .030, y - .70, z + .104], [x - side * .034, y - .77, z + .110], [x - side * .030, y - .84, z + .106]],
        .042, .034, {tip: .3});
    }
  } else if (style === "bun") {
    cap(hairline(1.00, 1.56, 2.52), {strands: 26});
    wispyFringe(1.24);
    sideburns(1.92, .050);
    for (const side of SIDE) {
      const [x, y, z] = on(side * 1.05, .62, 1.30);
      ball(x, y, z, .128, .120, .124, {twist: 5, detail: 14});
    }
  } else {
    cap(hairline(1.00, 1.56, 2.52), {strands: 26});
    sweptFringe(-1, 1.26);
    sideburns(1.92, .050);
    const [x, y, z] = on(Math.PI, .30, 1.36);
    ball(x, y, z, .150, .128, .146, {twist: 6, detail: 14});
    ball(x, y - .10, z + .02, .100, .040, .100, {twist: 9, tint: .8, detail: 10});
  }

  // A soft band of light around the crown.
  for (let i = 0; i < positions.length; i += 3) {
    const height = positions[i + 1] / .37, turn = Math.atan2(positions[i], positions[i + 2]);
    const band = Math.exp(-(((height - .60) / .15) ** 2)) * (.55 + .45 * Math.cos(turn - .5));
    colors[i] += .17 * band; colors[i + 1] += .17 * band; colors[i + 2] += .17 * band;
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
