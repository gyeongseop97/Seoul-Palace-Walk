import {BUNGEO_BURN_MS, BUNGEO_GOOD_MS, BUNGEO_MOLD_COUNT, bungeoStep} from "./bungeo-data.js";
import {makeHotteokProps} from "./regional-item-props.js";

const top = 1.023;
const surface = top + .109;
const workZ = -.040;
const doughX = -1.084, doughZ = .20;
const qualityColor = {idle: 0x766e59, cooking: 0xe8a64d, ready: 0x9cce7a, burnt: 0xeb714a};
const clamp = value => Math.min(1, Math.max(0, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function addHotteokGriddle(T, root, kit, {hit, highlight, counterLabel, watchRadius, body}) {
  const {box, cylinder, shape} = kit;
  const cast = 0x303137, steel = 0x777a76, brass = 0x857344, wood = 0xad723e;
  const bake = makeHotteokProps(T, kit);
  const dynamic = group => group.traverse(mesh => { if (mesh.isMesh) mesh.userData.dynamic = true; });
  const centers = Array.from({length: BUNGEO_MOLD_COUNT}, (_, index) => (index - (BUNGEO_MOLD_COUNT - 1) / 2) * .463);
  const plate = new T.LatheGeometry([[0, .020], [.682, .020], [.726, .035], [.744, .071], [.747, .102],
    [.736, .114], [.716, .111], [.707, .092], [.666, .086], [0, .086]].map(([r, y]) => new T.Vector2(r, y)), 56);
  const deck = shape(plate, cast, 0, top, workZ, root);
  deck.name = "호떡 철판";
  deck.scale.z = .59;
  deck.material = new T.MeshStandardMaterial({color: 0x323137, metalness: .46, roughness: .54});
  box(0x5a5752, 0, top + .034, workZ + .315, 1.37, .071, .185, root);
  box(steel, 0, top + .056, workZ + .409, 1.34, .105, .024, root);
  for (const x of [-.55, .55]) box(cast, x, top + .016, workZ - .283, .20, .036, .108, root);
  for (const x of [-.709, .709]) {
    box(steel, x, top + .062, workZ + .02, .065, .027, .162, root);
    box(0x413934, x * 1.055, top + .071, workZ + .02, .062, .032, .101, root);
  }

  const doughTray = new T.Group();
  doughTray.name = "호떡 반죽 쟁반";
  doughTray.position.set(doughX, top, doughZ);
  root.add(doughTray);
  box(0x8d5a39, 0, .024, 0, .328, .047, .323, doughTray);
  box(0xe1bb81, 0, .051, 0, .305, .013, .282, doughTray);
  for (const x of [-.153, .153]) box(0xa27047, x, .064, 0, .023, .041, .322, doughTray);
  const pastrySphere = new T.SphereGeometry(1, 16, 10);
  for (const [i, [x, z]] of [[-.079, -.061], [.079, -.064], [.005, .063]].entries()) {
    const dough = shape(pastrySphere, i === 1 ? 0xf6d19b : 0xf3d8aa, x, .090, z, doughTray);
    dough.scale.set(.060, .038, .053);
    dough.rotation.y = i * .53;
    shape(pastrySphere, 0xdbae78, x - .013, .121, z, doughTray).scale.set(.016, .004, .010);
  }
  dynamic(doughTray);
  highlight("batter", doughX, doughZ);
  counterLabel("반죽", doughX, .432, "#624635");
  const doughTarget = hit(root, {tool: "batter"}, doughX, top + .090, doughZ, .335, .158, .328);

  const press = new T.Group();
  press.name = "호떡 누르개";
  root.add(press);
  cylinder(steel, 0, .014, 0, .109, .028, 24, press);
  cylinder(cast, 0, .059, 0, .020, .076, 12, press);
  cylinder(wood, 0, .103, 0, .044, .037, 16, press, .84);
  dynamic(press);
  const spatula = new T.Group();
  spatula.name = "호떡 뒤집개";
  spatula.position.set(1.01, top + .029, .12);
  spatula.rotation.y = -.39;
  root.add(spatula);
  box(steel, 0, 0, -.102, .105, .009, .14, spatula);
  box(0x9b9f99, 0, .008, .006, .018, .016, .132, spatula);
  box(wood, 0, .017, .091, .037, .030, .119, spatula);
  cylinder(brass, 0, .034, .085, .008, .004, 8, spatula);

  const oilEdge = new T.TorusGeometry(.188, .0065, 6, 32).rotateX(-Math.PI / 2);
  const zones = centers.map((x, index) => {
    const bay = new T.Group();
    bay.name = `${index + 1}번 호떡 굽는 자리`;
    bay.position.set(x, 0, workZ);
    root.add(bay);
    const cookingPlate = cylinder(0x424048, 0, surface - .014, 0, .205, .024, 32, bay);
    cookingPlate.material = new T.MeshStandardMaterial({color: 0x46434a, metalness: .39, roughness: .47});
    shape(oilEdge, 0x6b5945, 0, surface, 0, bay);
    for (const [angle, radius] of [[.34, .163], [2.29, .153], [4.12, .164], [5.43, .151]]) {
      cylinder(0x645341, Math.cos(angle) * radius, surface + .002, Math.sin(angle) * radius, .012, .002, 8, bay);
    }
    hit(bay, {cavity: index}, 0, surface + .088, .014, .416, .174, .426);
    counterLabel(String(index + 1), x - .046, .483, "#52453b");
    const lamp = cylinder(qualityColor.idle, .107, top + .082, .387, .023, .024, 10, bay);
    lamp.rotation.x = Math.PI / 2;
    lamp.userData.dynamic = true;
    lamp.material = new T.MeshStandardMaterial({color: qualityColor.idle, emissive: qualityColor.idle, emissiveIntensity: .16});
    const pastry = new T.Group();
    pastry.visible = false;
    bay.add(pastry);
    const variants = Object.fromEntries(["raw", "good", "burnt", "torn"].map(quality => {
      const model = new T.Group();
      model.name = quality + " 호떡";
      bake(model, quality);
      pastry.add(model);
      return [quality, model];
    }));
    dynamic(pastry);
    let shown = null, previous = null, removal = null;
    return (mold, clock, nearby) => {
      const step = bungeoStep(mold, clock), active = nearby && step.action !== "pour";
      if (!nearby || active) removal = null;
      else if (previous?.stage === "second" && !mold) {
        const prior = bungeoStep(previous, clock);
        if (prior.action === "take") removal = {quality: prior.quality, at: clock};
      }
      previous = nearby ? mold : null;
      if (removal && clock - removal.at >= 390) removal = null;
      const age = active ? Math.max(0, clock - (mold.flippedAt ?? mold.pouredAt)) : 0;
      const firstAge = active ? (mold.flippedAt ?? clock) - mold.pouredAt : 0;
      const second = active && mold.stage === "second";
      const hot = active && (age > BUNGEO_BURN_MS || firstAge > BUNGEO_BURN_MS);
      const quality = removal?.quality ?? (!active ? null : hot ? "burnt" : second && firstAge < BUNGEO_GOOD_MS ? "torn"
        : firstAge > BUNGEO_GOOD_MS * .72 || second ? "good" : "raw");
      if (shown !== quality) {
        shown = quality;
        pastry.visible = Boolean(quality);
        for (const [key, model] of Object.entries(variants)) model.visible = key === quality;
      }
      if (quality) {
        const flip = removal ? 1 : second ? ease(age / 590) : 0, rise = Math.sin(flip * Math.PI);
        const remove = removal ? ease((clock - removal.at) / 390) : 0;
        const press = !second && active ? ease(age / 480) : 1;
        pastry.position.set(0, surface + .026 + rise * .20 + (.025 * (1 - press)) + remove * .34, rise * .054 + remove * .19);
        pastry.rotation.x = flip * Math.PI - remove * .64;
        pastry.scale.set((.91 + press * .43) * (1 - remove * .74), (1.5 - press * .49) * (1 - remove * .74),
          (.91 + press * .43) * (1 - remove * .74));
      }
      const indicator = !active ? qualityColor.idle : hot ? qualityColor.burnt : step.waitMs === 0 ? qualityColor.ready : qualityColor.cooking;
      lamp.material.color.setHex(indicator);
      lamp.material.emissive.setHex(indicator);
      lamp.material.emissiveIntensity = active ? .65 : .16;
    };
  });
  let previousTime = 0, doughLift = 0;

  function update(molds, clock, viewer, baking = null) {
    const nearby = Boolean(viewer && Math.hypot(viewer.x - body.x, viewer.y - body.y) <= watchRadius);
    const elapsed = Math.max(0, Math.min(64, clock - previousTime));
    previousTime = clock;
    doughLift += ((baking?.tool === "batter" ? 1 : 0) - doughLift) * (1 - Math.exp(-elapsed * .024));
    doughTray.position.y = top + .118 * doughLift;
    doughTray.rotation.z = -.073 * doughLift;
    if (doughTarget) doughTarget.position.y = top + .090 + .118 * doughLift;
    let pressing = -1, pressedAt = 0;
    zones.forEach((updateZone, index) => {
      const mold = molds?.[index] ?? null;
      updateZone(mold, clock, nearby);
      if (nearby && mold?.stage === "first" && clock - mold.pouredAt >= 0 && clock - mold.pouredAt < 630 && mold.pouredAt > pressedAt) {
        pressing = index;
        pressedAt = mold.pouredAt;
      }
    });
    if (pressing >= 0) {
      const age = clock - pressedAt, bump = Math.sin(clamp(age / 630) * Math.PI);
      press.position.set(centers[pressing], surface + .080 + .16 * (1 - bump), workZ);
    } else press.position.set(.977, top + .013, -.295);
  }
  update(null, 0, null);
  return {update};
}
