import {SHOOTING_FALL_MS, SHOOTING_RISE_MS, SHOOTING_TARGETS} from "./arcade-shooting.js";

const pivotHeight = .086;
const wood = 0x6a4939, brackets = 0x454947, gold = 0xd9a770;
const palettes = {
  large: {body: 0x9b4f46, rim: "#b74e40", face: "#f7dec0", center: "#813a34", ink: "#fff0d5"},
  medium: {body: 0x477871, rim: "#4d9087", face: "#c9e3d0", center: "#205a53", ink: "#fff1cd"},
  small: {body: 0xcf9146, rim: "#ffc575", face: "#ffebb3", center: "#845337", ink: "#ffeccc"}
};
const smooth = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function addShootingRack(T, bay, {box, cylinder, shape}) {
  const faces = new Map(), decks = new Set();
  box(0x303c3d, 0, 1.46, -4.95, 3.89, 2.98, .145, bay);
  box(wood, 0, 1.48, -4.855, 3.70, 2.72, .047, bay);
  for (const side of [-1, 1]) {
    box(wood, side * 1.81, 1.45, -4.58, .165, 2.84, .60, bay);
    box(gold, side * 1.896, 1.44, -4.31, .061, 2.83, .029, bay);
  }
  box(wood, 0, .13, -4.42, 3.79, .22, .96, bay);
  box(gold, 0, 2.63, -4.71, 3.67, .071, .38, bay);
  for (const x of [-1.62, -1.04, -.48, .48, 1.04, 1.62]) {
    const light = shape(new T.SphereGeometry(.045, 9, 6), gold, x, 2.63, -4.485, bay);
    light.material = new T.MeshBasicMaterial({color: 0xf6cbc8});
  }
  const paddles = SHOOTING_TARGETS.map((target, index) => {
    const yBase = target.y - target.radius - pivotHeight;
    if (!decks.has(target.tier)) {
      decks.add(target.tier);
      box(0x875d43, 0, yBase - .046, target.z - .27, 3.47, .074, .72, bay);
      box(gold, 0, yBase - .014, target.z + .02, 3.46, .024, .082, bay);
      box(0x483930, 0, yBase - .094, target.z - .068, 3.41, .041, .21, bay);
    }
    const paddle = new T.Group();
    paddle.name = `사격 표적 ${index + 1} · ${target.points}점`;
    paddle.position.set(target.x, yBase, target.z);
    bay.add(paddle);
    box(brackets, target.x, yBase - .004, target.z - .012, .123, .028, .106, bay);
    box(brackets, 0, .055, -.018, .054, .125, .046, paddle);
    const height = target.radius + pivotHeight, palette = palettes[target.tier];
    cylinder(palette.body, 0, height, -.019, target.radius, .036, 22, paddle).rotation.x = Math.PI / 2;
    if (!faces.has(target.tier)) faces.set(target.tier, drawFace(T, palette, target.points));
    const face = new T.Mesh(new T.CircleGeometry(target.radius * .934, 24), faces.get(target.tier));
    face.position.set(0, height, .001);
    paddle.add(face);
    paddle.traverse(part => { if (part.isMesh) part.userData.dynamic = true; });
    return paddle;
  });

  return function update(state) {
    const clock = state?.clock ?? Infinity;
    for (let index = 0; index < paddles.length; index++) {
      const at = state?.down?.[index] ?? null;
      const fall = at !== null ? smooth((clock - at) / SHOOTING_FALL_MS)
        : state?.riseAt != null ? 1 - smooth((clock - state.riseAt) / SHOOTING_RISE_MS) : 0;
      const angle = -fall * Math.PI * .51;
      if (paddles[index].rotation.x !== angle) paddles[index].rotation.x = angle;
    }
  };
}

function drawFace(T, palette, points) {
  if (typeof document === "undefined") return new T.MeshStandardMaterial({color: palette.face});
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new T.MeshStandardMaterial({color: palette.face});
  function disk(radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(64, 64, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = palette.face;
  ctx.fillRect(0, 0, 128, 128);
  disk(63, palette.rim);
  disk(50, palette.face);
  disk(38, palette.rim);
  disk(32, palette.center);
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = .82;
  ctx.fillRect(63, 5, 2, 15);
  ctx.fillRect(63, 108, 2, 15);
  ctx.fillRect(5, 63, 15, 2);
  ctx.fillRect(108, 63, 15, 2);
  ctx.globalAlpha = 1;
  ctx.font = "bold 35px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(points), 64, 66);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  return new T.MeshBasicMaterial({map, toneMapped: false});
}
