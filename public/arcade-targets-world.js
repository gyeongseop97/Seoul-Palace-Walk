import {TARGET_LANES, targetAimPreview} from "./arcade-targets.js";
import {standSign} from "./regional-stands.js";

const ink = 0x26343a, cream = 0xffe0a6, mist = 0xcdccbf;
const archeryRings = [0xf0d566, 0xf0d566, 0xbd3d32, 0xbd3d32, 0x5d9aae, 0x5d9aae, 0x302d31, 0x302d31, 0xe9debd, 0xe9debd];
const rifleRings = [0xe6dfb8, 0xd6cda9, 0x303831, 0x3d453c, 0x303831, 0x606558, 0xe4ddc4, 0xd2cbb2, 0xe4ddc4, 0xd2cbb2];

export function addArcadeTargets(T, parent, {box, cylinder, shape}) {
  const bays = Object.fromEntries(Object.entries(TARGET_LANES).map(([kind, lane]) => [kind, buildBay(kind, lane)]));
  return {update(shooting, archery) {
    bays.shooting(shooting);
    bays.archery(archery);
  }};

  function buildBay(kind, lane) {
    const archery = kind === "archery", title = archery ? "양궁" : "사격";
    const metal = archery ? 0x6a5942 : 0x41666a;
    const bay = new T.Group();
    bay.name = title + " 레인";
    bay.position.x = lane.x;
    parent.add(bay);
    const block = (color, x, y, z, w, h, d, root = bay) => box(color, x, y, z, w, h, d, root);
    const dynamic = group => group.traverse(node => { if (node.isMesh) node.userData.dynamic = true; });
    const front = lane.stationZ - .35;

    block(archery ? 0x504638 : 0x394749, 0, .019, -.15, 4.18, .035, 8.95);
    block(metal, 0, .044, front + .27, 3.97, .014, .08);
    block(cream, 0, .052, front + .34, 1.79, .012, .046);
    for (const side of [-1, 1]) {
      const x = 2.02 * side;
      block(ink, x, 1.19, -.26, .095, 2.28, 8.58);
      block(metal, x, 2.34, -.26, .155, .12, 8.58);
      block(metal, x * .94, .96, front, .12, 1.86, .16);
      block(mist, x * .94, .565, front + .07, .165, .06, .46);
      for (const joint of [-3.45, -1.1, 1.25]) {
        block(archery ? 0x80694a : 0x576c6a, x * .98, .95, joint, .085, 1.86, .105);
      }
    }
    block(metal, 0, 2.46, front, 4.00, .19, .17);
    standSign(T, bay, title, "", 1.42, 0, 2.48, front + .099, "#26393d", "#ffe0a6", .30);
    block(archery ? 0x956b43 : 0x6a7772, 0, .92, front, 1.31, .09, .43);
    block(ink, 0, .45, front - .032, .95, .89, .31);
    if (archery) addSpareArrows(bay, front);
    else addAirRifle(bay, front);

    const targetZ = lane.targetZ, targetY = lane.targetY;
    block(metal, 0, 1.88, targetZ - .292, lane.backstopWidth + .38, 3.5, .18);
    block(ink, 0, targetY, targetZ - .096, lane.backstopWidth + .095, lane.backstopHeight + .095, .15);
    block(archery ? 0xb99a63 : 0xe5dcb9, 0, targetY, targetZ - .043, lane.backstopWidth, lane.backstopHeight, .061);
    const rings = archery ? archeryRings : rifleRings;
    for (const [i, color] of rings.entries()) {
      const inner = lane.radius * i / 10, outer = lane.radius * (i + 1) / 10;
      shape(new T.RingGeometry(inner, outer, 52), color, 0, targetY, targetZ, bay);
      if (i) shape(new T.RingGeometry(inner - .0013, inner + .0013, 52), 0x554a3a, 0, targetY, targetZ + .002, bay);
    }
    for (const side of [-1, 1]) {
      const x = (lane.backstopWidth / 2 + .09) * side;
      block(cream, x, targetY + .67, targetZ + .011, .052, .48, .02);
    }
    const updateBoard = makeBoard(bay, title, 0, 2.96, targetZ + .054);

    const projectile = new T.Group();
    projectile.name = archery ? "날아가는 화살" : "사격 탄환";
    bay.add(projectile);
    if (archery) addArrow(projectile);
    else {
      block(0xfdb952, 0, 0, .26, .015, .015, .52, projectile).material =
        new T.MeshBasicMaterial({color: 0xfad280});
      shape(new T.SphereGeometry(.026, 8, 5), 0xe9c486, 0, 0, 0, projectile);
    }
    dynamic(projectile);
    projectile.visible = false;

    const hits = Array.from({length: lane.shots}, () => {
      const marker = new T.Group();
      bay.add(marker);
      if (archery) addArrow(marker);
      else shape(new T.CircleGeometry(.018, 10), ink, 0, 0, .006, marker);
      dynamic(marker);
      marker.visible = false;
      return marker;
    });
    const preview = archery ? Array.from({length: 9}, (_, index) => {
      const dot = shape(new T.SphereGeometry(.018 + index * .0014, 8, 5), cream, 0, 0, 0, bay);
      dot.userData.dynamic = true;
      dot.material = new T.MeshBasicMaterial({color: 0xf9d08c});
      dot.visible = false;
      return dot;
    }) : [];
    const forward = new T.Vector3(0, 0, -1), direction = new T.Vector3();
    let previousPoint = null, previousAim = null, previousHits = null;
    return state => {
      const ball = state?.projectile;
      projectile.visible = Boolean(ball);
      if (ball) {
        projectile.position.set(ball.x, ball.y, ball.z);
        if (previousPoint && ball.z < previousPoint.z) {
          direction.set(ball.x - previousPoint.x, ball.y - previousPoint.y, ball.z - previousPoint.z).normalize();
          projectile.quaternion.setFromUnitVectors(forward, direction);
        } else if (!previousPoint || ball.z > previousPoint.z) {
          projectile.quaternion.identity();
        }
      }
      previousPoint = ball ?? null;
      if (state?.impacts !== previousHits) {
        hits.forEach((marker, i) => {
          const impact = state?.impacts?.[i];
          marker.visible = Boolean(impact);
          if (impact) marker.position.set(impact.x, impact.y, targetZ + .012);
        });
        previousHits = state?.impacts;
      }
      const aim = state?.phase === "aim" ? state.aim : null;
      if (aim !== previousAim) {
        const points = targetAimPreview(kind, aim);
        preview.forEach((dot, index) => {
          const p = points[index];
          dot.visible = Boolean(p);
          if (p) dot.position.set(p.x, p.y, p.z);
        });
        previousAim = aim;
      }
      updateBoard(state);
    };
  }

  function addArrow(root) {
    const shaft = cylinder(0xcf9a55, 0, 0, .31, .011, .59, 7, root);
    shaft.rotation.x = Math.PI / 2;
    const head = shape(new T.ConeGeometry(.024, .084, 6), 0xbfc8bc, 0, 0, .034, root);
    head.rotation.x = -Math.PI / 2;
    box(0xa85343, 0, .029, .55, .017, .072, .14, root);
    box(0x487b78, .029, 0, .55, .072, .016, .14, root);
  }

  function addSpareArrows(bay, front) {
    for (let i = 0; i < 3; i++) {
      const arrow = new T.Group();
      arrow.position.set(-.35 + i * .20, 1.03, front - .22);
      arrow.rotation.y = i * .1 - .12;
      addArrow(arrow);
      bay.add(arrow);
    }
  }

  function addAirRifle(bay, front) {
    box(0x815745, 0, 1.023, front + .11, .106, .116, .276, bay);
    box(ink, 0, 1.09, front - .13, .091, .08, .325, bay);
    const barrel = cylinder(ink, 0, 1.113, front - .32, .022, .375, 8, bay);
    barrel.rotation.x = Math.PI / 2;
    box(0xb1aa92, 0, 1.159, front - .35, .027, .044, .035, bay);
  }

  function makeBoard(parent, title, x, y, z) {
    box(ink, x, y, z - .025, 1.33, .46, .087, parent);
    if (typeof document === "undefined") return () => {};
    const canvas = document.createElement("canvas");
    canvas.width = 288;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => {};
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    const surface = new T.Mesh(new T.PlaneGeometry(1.29, .43),
      new T.MeshBasicMaterial({map, toneMapped: false}));
    surface.position.set(x, y, z + .022);
    parent.add(surface);
    let previous = "";
    const update = state => {
      const label = state ? `${state.score}점 · ${state.shotsLeft}발` : title;
      const detail = state?.lastScore != null ? (state.lastScore ? `+${state.lastScore}점` : "빗나감") : "과녁을 조준하세요";
      const key = label + detail;
      if (key === previous) return;
      previous = key;
      ctx.fillStyle = "#1c3136";
      ctx.fillRect(0, 0, 288, 96);
      ctx.fillStyle = "#f4d6a0";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, 144, 42);
      ctx.fillStyle = "#cce0d5";
      ctx.font = "16px sans-serif";
      ctx.fillText(detail, 144, 72);
      map.needsUpdate = true;
    };
    update(null);
    return update;
  }
}
