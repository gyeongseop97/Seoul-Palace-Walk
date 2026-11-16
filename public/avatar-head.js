// A sculpted chibi head. It starts as a sphere so the face texture keeps its simple wrap,
// then gains a broad round cranium, hollows for the eyes, full cheeks, a small nose and a
// narrow chin. The eye line sits halfway down the head, as in super-deformed drawings.
const clamp = (n, low = 0, high = 1) => Math.min(high, Math.max(low, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const bump = (n, width) => Math.exp(-((n / width) ** 2));

// Where the features are painted, as heights on the unit head (1 crown, -1 chin).
// The skull above the eye line is taller than a ball; the hair is built to cover it.
export const CROWN = 1.14;
export const FACE_LINES = {brow: -.03, eye: -.235, nose: -.455, mouth: -.615, cheek: -.50};

// How much wider than a ball the head is at a given height: nothing above the eye line,
// then full, chubby cheeks and a broad jaw with a nearly flat underside.
export function fullness(y) {
  if (y >= 0) return 1;
  const low = Math.min(.965, -y);
  return Math.min(1.62, Math.pow(1 - Math.pow(low, 3.0), 1 / 3.0) / Math.sqrt(1 - low * low));
}

// Extra width high on the skull, so the top of the head is a round dome and not a point.
export function crownFullness(y) {
  if (y <= 0) return 1;
  const high = Math.min(.95, y);
  return Math.min(1.34, Math.pow(1 - Math.pow(high, 2.5), 1 / 2.5) / Math.sqrt(1 - high * high));
}

// Seen from above a ball comes to its furthest point only in the middle of the face. This
// pushes the front-left and front-right out too, so the forehead and cheeks are broad.
export function frontBreadth(across, forward, y) {
  if (forward <= 0) return 1;
  return 1 + .085 * (2 * across * forward) ** 2 * (.55 + .45 * smooth((.15 - y) / .5));
}

export function sculptedHead(T) {
  const geometry = new T.SphereGeometry(1, 56, 40), points = geometry.attributes.position;
  const ball = points.array.slice();
  for (let i = 0; i < points.count; i++) {
    let x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    const ring = Math.hypot(x, z) || 1e-6, across = x / ring, forward = z / ring, front = smooth((forward + .25) / 1.05);
    // Cranium: a little wider and deeper than a ball.
    const dome = smooth((y + .18) / .5), full = fullness(y) - 1, round = crownFullness(y) - 1;
    x *= 1 + .035 * dome + full + round;
    // The forehead sits back a little while the cheeks and jaw come forward.
    z *= z > 0 ? 1 - .055 * smooth((y - .05) / .55) + full * 1.0 + round * .35 : 1 + .03 * dome + full * .50 + round * .6;
    const broad = frontBreadth(across, forward, y);
    x *= broad; z *= broad;
    // The back of the skull is rounder.
    if (z < 0) z *= 1 + .07 * smooth((y + .35) / .6);
    // Relief on the face itself.
    let relief = .060 * bump(y + .50, .34) * bump(across, .70);                            // lower face
    relief -= .050 * bump(y - FACE_LINES.eye, .17) * bump(Math.abs(across) - .36, .30);   // eye hollows
    relief -= .018 * bump(y - FACE_LINES.eye + .02, .12) * bump(across, .16);             // bridge of the nose
    relief += .085 * bump(y - FACE_LINES.nose, .060) * bump(across, .070);                // nose tip
    relief += .060 * bump(y - FACE_LINES.cheek, .22) * bump(Math.abs(across) - .50, .30); // cheeks
    relief += .030 * bump(y - FACE_LINES.mouth, .13) * bump(across, .30);                 // lips
    relief += .040 * bump(y + .86, .12) * bump(across, .30);                              // chin
    const push = relief * front;
    x += across * push * .35;
    if (z > 0) z += push;
    // The underside is flatter than a ball, so the jaw reads as a soft line.
    if (y < -.72) y = -.72 + (y + .72) * .80;
    if (y > 0) y *= CROWN;
    points.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  // Lean the shading back toward a ball so the flat underside of the jaw does not go dark.
  const shading = geometry.attributes.normal;
  for (let i = 0; i < points.count; i++) {
    const keep = ball[i * 3 + 1] < 0 ? .34 : .7;
    const nx = shading.getX(i) * keep + ball[i * 3] * (1 - keep), ny = shading.getY(i) * keep + ball[i * 3 + 1] * (1 - keep) * .6;
    const nz = shading.getZ(i) * keep + ball[i * 3 + 2] * (1 - keep), length = Math.hypot(nx, ny, nz) || 1;
    shading.setXYZ(i, nx / length, ny / length, nz / length);
  }
  // The seam of a sphere splits its vertices; average their normals so no line shows.
  const normals = geometry.attributes.normal, columns = 57;
  for (let row = 0; row <= 40; row++) {
    const a = row * columns, b = a + columns - 1;
    const nx = normals.getX(a) + normals.getX(b), ny = normals.getY(a) + normals.getY(b), nz = normals.getZ(a) + normals.getZ(b);
    const length = Math.hypot(nx, ny, nz) || 1;
    normals.setXYZ(a, nx / length, ny / length, nz / length);
    normals.setXYZ(b, nx / length, ny / length, nz / length);
  }
  return geometry;
}
