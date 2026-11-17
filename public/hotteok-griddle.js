import {BUNGEO_BURN_MS, BUNGEO_GOOD_MS, BUNGEO_MOLD_COUNT, bungeoStep} from "./bungeo-data.js";

const top = 1.023;
const surface = top + .109;
const workZ = -.134, prepZ = .412, prepY = top + .035;
const doughX = -1.084, doughZ = .242, sugarX = -1.077, sugarZ = -.268;
const pressX = .977, pressZ = -.295;
const qualityColor = {idle: 0x766e59, cooking: 0xe8a64d, ready: 0x9cce7a, burnt: 0xeb714a};
const clamp = value => Math.min(1, Math.max(0, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function addHotteokGriddle(T, root, kit, {hit, highlight, counterLabel, watchRadius, body, bake}) {
  const {box, cylinder, shape} = kit;
  const cast = 0x303137, steel = 0x777a76, brass = 0x857344, wood = 0xad723e;
  const dynamic = group => group.traverse(mesh => { if (mesh.isMesh) mesh.userData.dynamic = true; });
  const centers = Array.from({length: BUNGEO_MOLD_COUNT}, (_, index) => (index - (BUNGEO_MOLD_COUNT - 1) / 2) * .463);
  const plate = new T.LatheGeometry([[0, .020], [.682, .020], [.726, .035], [.744, .071], [.747, .102],
    [.736, .114], [.716, .111], [.707, .092], [.666, .086], [0, .086]].map(([r, y]) => new T.Vector2(r, y)), 56);
  const deck = shape(plate, cast, 0, top, workZ, root);
  deck.name = "호떡 철판";
  deck.scale.z = .49;
  deck.material = new T.MeshStandardMaterial({color: 0x323137, metalness: .46, roughness: .54});
  box(0x5a5752, 0, top + .034, workZ + .299, 1.37, .071, .112, root);
  box(steel, 0, top + .052, workZ + .36, 1.34, .098, .024, root);
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

  const sugarBowl = new T.Group();
  sugarBowl.name = "호떡 설탕소 그릇";
  sugarBowl.position.set(sugarX, top, sugarZ);
  root.add(sugarBowl);
  const bowl = new T.LatheGeometry([[0,.009],[.072,.009],[.096,.024],[.121,.058],[.126,.107],[.120,.113],
    [.107,.108],[.107,.083],[.099,.053],[.071,.026],[0,.019]].map(([r,y])=>new T.Vector2(r,y)), 28);
  shape(bowl, 0x628f83, 0, 0, 0, sugarBowl);
  cylinder(0xa7673a, 0, .081, 0, .105, .022, 24, sugarBowl);
  for (let i = 0; i < 19; i++) {
    const angle = i * 2.4, radius = Math.sqrt((i + .5) / 19) * .088;
    shape(pastrySphere, i % 3 ? 0xba814c : 0xe2b778, Math.cos(angle) * radius, .097 + (i % 3) * .002,
      Math.sin(angle) * radius, sugarBowl).scale.set(.012, .004, .009);
  }
  shape(pastrySphere, 0xbec5ba, .018, .104, .012, sugarBowl).scale.set(.027, .009, .036);
  box(0xc4b8a1, .040, .124, -.077, .014, .014, .13, sugarBowl).rotation.x = .36;
  dynamic(sugarBowl);
  highlight("sugar", sugarX, sugarZ);
  counterLabel("설탕소", sugarX, sugarZ + .158, "#774a30");
  const sugarTarget = hit(root, {tool: "sugar"}, sugarX, top + .077, sugarZ, .257, .14, .257);

  const press = new T.Group();
  press.name = "호떡 누르개";
  root.add(press);
  cylinder(steel, 0, .014, 0, .109, .028, 24, press);
  cylinder(cast, 0, .059, 0, .020, .076, 12, press);
  cylinder(wood, 0, .103, 0, .044, .037, 16, press, .84);
  dynamic(press);
  highlight("press", pressX, pressZ);
  counterLabel("누르개", pressX, pressZ + .151, "#5b5245");
  hit(press, {tool: "press"}, 0, .059, 0, .23, .13, .23);
  const spatula = new T.Group();
  spatula.name = "호떡 뒤집개";
  spatula.position.set(1.20, top + .029, -.079);
  spatula.rotation.y = -.39;
  root.add(spatula);
  box(steel, 0, 0, -.102, .105, .009, .14, spatula);
  box(0x9b9f99, 0, .008, .006, .018, .016, .132, spatula);
  box(wood, 0, .017, .091, .037, .030, .119, spatula);
  cylinder(brass, 0, .034, .085, .008, .004, 8, spatula);

  const oilEdge = new T.TorusGeometry(.188, .0065, 6, 32).rotateX(-Math.PI / 2);
  const fold = new T.TubeGeometry(new T.CatmullRomCurve3([
    new T.Vector3(0,.026,.009),new T.Vector3(0,.029,.040),new T.Vector3(.012,.020,.072)
  ]), 6, .0031, 5);
  const zones = centers.map((x, index) => {
    const worktop = new T.Group();
    worktop.name = `${index + 1}번 호떡 작업판`;
    worktop.position.set(x, prepY, prepZ);
    root.add(worktop);
    box(0x855a39, 0, -.023, 0, .408, .031, .233, worktop);
    box(0xdaaa76, 0, -.004, 0, .383, .016, .209, worktop);
    for (const z of [-.084,.084]) box(0xc09262, 0, .005, z, .348, .004, .004, worktop);
    hit(worktop, {cavity: index, surface: "prep"}, 0, .057, .003, .390, .106, .229);
    counterLabel(String(index + 1), x - .140, prepZ + .075, "#784d30", prepY + .006);
    const dough = new T.Group();
    worktop.add(dough);
    const skin = shape(pastrySphere, 0xf4d7a8, 0, .027, 0, dough);
    const pinch = new T.Group();
    pinch.position.y = .027;
    dough.add(pinch);
    for (let i = 0; i < 7; i++) {
      shape(fold, 0xdeb87e, 0, 0, 0, pinch).rotation.y = i / 7 * Math.PI * 2;
    }
    const centerSeam=shape(pastrySphere, 0xf7dfb0, 0, .031, .002, pinch);
    centerSeam.scale.set(.027,.011,.024);
    const filling = new T.Group();
    filling.position.set(0,.043,0);
    dough.add(filling);
    shape(pastrySphere, 0xa86d42, 0, .004, 0, filling).scale.set(.045,.018,.039);
    for (let i = 0; i < 9; i++) {
      const angle=i*2.40, radius=Math.sqrt((i+.5)/9)*.034;
      shape(pastrySphere, i%3?0xc38552:0xead197, Math.cos(angle)*radius,.013+(i%2)*.003,Math.sin(angle)*radius,filling)
        .scale.set(.011,.005,.008);
    }
    dynamic(dough);

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
    hit(bay, {cavity: index, surface: "griddle"}, 0, surface + .066, .004, .412, .139, .393);
    counterLabel(String(index + 1), x - .046, workZ + .292, "#52453b", surface + .004);
    const lamp = cylinder(qualityColor.idle, .107, top + .071, .374, .023, .024, 10, bay);
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
      const step = bungeoStep(mold, clock), occupied = nearby && step.action !== "pour";
      const preparation = occupied && ["dough", "sweetened", "sealed"].includes(mold.stage);
      dough.visible = preparation;
      if (preparation) {
        const age = Math.max(0, clock - mold.pouredAt);
        const pinchProgress = mold.stage === "sealed" ? ease(age / 410) : 0;
        const width = mold.stage === "dough" ? .58 + .42 * ease(age / 450) : 1;
        skin.scale.set((.094 - .020 * pinchProgress) * width, .021 + .028 * pinchProgress, (.084 - .017 * pinchProgress) * width);
        pinch.visible = pinchProgress > .29;
        pinch.scale.setScalar(Math.max(.18,pinchProgress));
        filling.visible = mold.stage === "sweetened" || mold.stage === "sealed" && pinchProgress < .50;
        if (filling.visible) filling.scale.setScalar(mold.stage === "sweetened" ? .22 + .78 * ease(age/320) : 1-pinchProgress);
      }
      const active = occupied && !preparation;
      if (!nearby || active) removal = null;
      else if (previous?.stage === "second" && !mold) {
        const prior = bungeoStep(previous, clock);
        if (prior.action === "take") removal = {quality: prior.quality, at: clock};
      }
      previous = nearby ? mold : null;
      if (removal && clock - removal.at >= 390) removal = null;
      const age = active ? Math.max(0, clock - (mold.flippedAt ?? mold.pouredAt)) : 0;
      const firstAge = active ? (mold.flippedAt ?? clock) - mold.pouredAt : 0;
      const placed = active && mold.stage === "placed";
      const second = active && mold.stage === "second";
      const hot = active && !placed && (age > BUNGEO_BURN_MS || firstAge > BUNGEO_BURN_MS);
      const quality = removal?.quality ?? (!active ? null : hot ? "burnt" : second && firstAge < BUNGEO_GOOD_MS ? "torn"
        : !placed && (firstAge > BUNGEO_GOOD_MS * .72 || second) ? "good" : "raw");
      if (shown !== quality) {
        shown = quality;
        pastry.visible = Boolean(quality);
        for (const [key, model] of Object.entries(variants)) model.visible = key === quality;
      }
      if (quality) {
        const flip = removal ? 1 : second ? ease(age / 590) : 0, rise = Math.sin(flip * Math.PI);
        const remove = removal ? ease((clock - removal.at) / 390) : 0;
        const press = placed ? 0 : !second && active ? ease(age / 480) : 1;
        const travel = placed ? ease(age / 430) : 1;
        const loft = placed ? Math.sin(travel * Math.PI) * .139 : 0;
        pastry.position.set(0, surface + .026 + rise * .20 + (.025 * (1 - press)) + remove * .34 + loft,
          (prepZ - workZ) * (1 - travel) + rise * .054 + remove * .19);
        pastry.rotation.x = flip * Math.PI - remove * .64;
        pastry.scale.set((.91 + press * .43) * (1 - remove * .74), (1.5 - press * .49) * (1 - remove * .74),
          (.91 + press * .43) * (1 - remove * .74));
      }
      const indicator = !active ? qualityColor.idle : hot ? qualityColor.burnt :
        !placed && step.waitMs === 0 ? qualityColor.ready : qualityColor.cooking;
      lamp.material.color.setHex(indicator);
      lamp.material.emissive.setHex(indicator);
      lamp.material.emissiveIntensity = active ? .65 : .16;
    };
  });
  let previousTime = 0, doughLift = 0, sugarLift = 0, pressLift = 0;

  function update(molds, clock, viewer, baking = null) {
    const nearby = Boolean(viewer && Math.hypot(viewer.x - body.x, viewer.y - body.y) <= watchRadius);
    const elapsed = Math.max(0, Math.min(64, clock - previousTime));
    previousTime = clock;
    const easing = 1 - Math.exp(-elapsed * .024);
    doughLift += ((baking?.tool === "batter" ? 1 : 0) - doughLift) * easing;
    sugarLift += ((baking?.tool === "sugar" ? 1 : 0) - sugarLift) * easing;
    pressLift += ((baking?.tool === "press" ? 1 : 0) - pressLift) * easing;
    doughTray.position.y = top + .118 * doughLift;
    doughTray.rotation.z = -.073 * doughLift;
    if (doughTarget) doughTarget.position.y = top + .090 + .118 * doughLift;
    sugarBowl.position.y = top + .113 * sugarLift;
    sugarBowl.rotation.z = .11 * sugarLift;
    if (sugarTarget) sugarTarget.position.y = top + .077 + .113 * sugarLift;
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
      press.position.set(centers[pressing], surface + .047 + .16 * (1 - bump), workZ);
    } else press.position.set(pressX, top + .013 + .142 * pressLift, pressZ);
  }
  update(null, 0, null);
  return {update};
}
