const HEAD_HEIGHT = 1.14;
const HEAD_CENTER_Y = .04;
// Stop the face shell behind the ears to leave the back of the mask open.
const RIM_ANGLE = Math.PI * .74;

function softShape(x, y, centerX, centerY, width, height) {
  return Math.exp(-(((x - centerX) / width) ** 2 + ((y - centerY) / height) ** 2));
}

function headSection(y) {
  const height = (y - HEAD_CENTER_Y) / HEAD_HEIGHT;
  const profile = Math.sqrt(Math.max(0, 1 - height * height));
  return {
    width: profile * (.77 - Math.max(0, -height) * .19),
    depth: profile * (.70 - Math.max(0, -height) * .17),
    centerZ: .09 * Math.max(0, -height) - .035 * Math.max(0, height),
  };
}

function facialRelief(x, y) {
  const side = Math.abs(x);
  return .145 * softShape(x, y, -.015, .26, .098, .34)
    + .285 * softShape(x, y, -.015, -.078, .115, .145)
    + .104 * softShape(side, y, .108, -.141, .082, .073)
    - .088 * softShape(side, y, .325, .231, .192, .147)
    + .057 * softShape(side, y, .31, .382, .207, .096)
    + .105 * softShape(side, y, .427, -.07, .223, .211)
    + .026 * softShape(x, y, .36, -.291, .24, .20)
    + .128 * softShape(x, y, .014, -.435, .295, .179)
    - .044 * softShape(x, y, -.008, -.263, .055, .099)
    + .141 * softShape(x, y, .026, -.722, .298, .158);
}

function skinPoint(y, angle) {
  const {width, depth, centerZ} = headSection(y);
  const facing = Math.cos(angle);
  const x = width * Math.sin(angle);
  return [x, y, centerZ + depth * facing + Math.max(0, facing) ** .67 * facialRelief(x, y)];
}

function facePoint(x, y, lift = 0) {
  const {width} = headSection(y);
  const angle = Math.asin(Math.min(1, Math.max(-1, x / width)));
  const point = skinPoint(y, angle);
  point[2] += lift;
  return point;
}

function hairline(angle) {
  const side = Math.abs(angle);
  return .84 - .19 * Math.sin(side * 1.8) - .70 * (side / RIM_ANGLE) ** 3
    + .05 * Math.cos(angle * 7) + .021 * Math.sin(angle * 51);
}

function sculpt(T, parent) {
  const rows = 84, columns = 104, stride = columns + 1;
  const positions = [], colors = [], indices = [];
  const lightSkin = new T.Color(0xd7a890), warmSkin = new T.Color(0xb77064);
  const hairColor = new T.Color(0x584e45), plaster = new T.Color(0xc89980);
  const color = new T.Color();
  const surfaceCount = (rows + 1) * stride;
  for (let surface = 0; surface < 2; surface++) {
    for (let row = 0; row <= rows; row++) {
      const y = HEAD_CENTER_Y - HEAD_HEIGHT * Math.cos(Math.PI * row / rows);
      for (let column = 0; column <= columns; column++) {
        const angle = RIM_ANGLE * (2 * column / columns - 1);
        const [x, , z] = skinPoint(y, angle);
        if (surface === 0) {
          positions.push(x, y, z);
          const warmth = .45 * softShape(Math.abs(x), y, .45, -.03, .23, .24)
            + .29 * softShape(x, y, -.01, -.098, .17, .20)
            + .15 * softShape(Math.abs(x), y, .32, .21, .18, .13);
          const variation = 1 + .027 * Math.sin(x * 14 + y * 24)
            + .021 * Math.cos(x * 113 + z * 107) * Math.sin(y * 103 - z * 62);
          const hairCoverage = Math.min(1, Math.max(0, (y - hairline(angle)) / .09));
          color.copy(lightSkin).lerp(warmSkin, warmth * Math.max(0, Math.cos(angle)))
            .lerp(hairColor, hairCoverage * .9).multiplyScalar(variation);
        } else {
          positions.push(x * .915, HEAD_CENTER_Y + (y - HEAD_CENTER_Y) * .941, z * .90);
          color.copy(plaster);
        }
        colors.push(color.r, color.g, color.b);
      }
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * stride + column, b = a + 1, c = a + stride, d = c + 1;
      indices.push(a, b, c, b, d, c, a + surfaceCount, c + surfaceCount, b + surfaceCount,
        b + surfaceCount, c + surfaceCount, d + surfaceCount);
    }
    const left = row * stride, right = left + columns;
    indices.push(left, left + stride, left + surfaceCount, left + surfaceCount, left + stride,
      left + stride + surfaceCount, right, right + surfaceCount, right + stride,
      right + surfaceCount, right + stride + surfaceCount, right + stride);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  parent.add(new T.Mesh(geometry, new T.MeshStandardMaterial({vertexColors: true, roughness: .78})));
}

function drawStrokes(T, parent, strokes) {
  const positions = [], normals = [], indices = [], colors = [];
  const color = new T.Color();
  for (const {points, radius, tint, steps = 10} of strokes) {
    const curve = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
    const tube = new T.TubeGeometry(curve, steps, radius, 5, false);
    const offset = positions.length / 3;
    positions.push(...tube.attributes.position.array);
    normals.push(...tube.attributes.normal.array);
    for (const index of tube.index.array) indices.push(index + offset);
    color.setHex(tint);
    for (let i = 0; i < tube.attributes.position.count; i++) colors.push(color.r, color.g, color.b);
    tube.dispose();
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  parent.add(new T.Mesh(geometry, new T.MeshStandardMaterial({vertexColors: true, roughness: .86})));
}

function facialFeatures(T, parent) {
  const strokes = [];
  const trace = (coordinates, tint, radius, lift = .0015) => {
    strokes.push({points: coordinates.map(([x, y]) => facePoint(x, y, lift)), tint, radius, steps: 24});
  };
  for (const side of [-1, 1]) {
    const lower = side > 0 ? -.022 : 0;
    const half = (points) => points.map(([x, y]) => [side * x, y + lower]);
    trace(half([[.112,.235],[.167,.209],[.251,.200],[.342,.201],[.441,.215],[.519,.244]]), 0x81534c, .010);
    trace(half([[.137,.246],[.186,.233],[.268,.224],[.352,.227],[.438,.241],[.493,.256]]), 0xc89583, .012);
    trace(half([[.153,.27],[.237,.273],[.339,.263],[.438,.274],[.505,.276]]), 0xb58172, .006);
    trace(half([[.183,.168],[.255,.144],[.342,.141],[.424,.166]]), 0xb78976, .005);
    trace(half([[.056,-.162],[.084,-.154],[.122,-.163],[.141,-.176]]), 0x895b50, .010, .006);
    trace(half([[.13,-.136],[.174,-.148],[.183,-.192],[.155,-.205]]), 0xbf8272, .008);
    trace(half([[.22,-.261],[.273,-.312],[.297,-.362],[.293,-.418]]), 0xbc8c79, .007);
    for (let strand = 0; strand < 18; strand++) {
      const shift = strand / 17;
      const x = .145 + shift * .39;
      const y = .355 + Math.sin(shift * Math.PI) * .065;
      const sprig = half([[x, y], [x + .012, y + .023 - shift * .01], [x + .028, y + .019 - shift * .018]]);
      strokes.push({points: sprig.map(([atX, atY]) => facePoint(atX, atY, .002)),
        tint: strand % 3 ? 0x765952 : 0x9a7465, radius: .0035, steps: 4});
    }
    for (let lash = 0; lash < 11; lash++) {
      const t = lash / 10;
      const x = .215 + t * .284, y = .200 + .031 * t ** 2;
      const points = half([[x, y], [x + .014, y - .007], [x + .018, y - .018]]);
      strokes.push({points: points.map(([atX, atY]) => facePoint(atX, atY, .004)),
        tint: 0x78534c, radius: .0027, steps: 3});
    }
  }
  trace([[-.247,-.406],[-.154,-.406],[-.076,-.393],[-.013,-.416],[.053,-.395],[.139,-.422],[.253,-.436]], 0xc18379, .022, .003);
  trace([[-.25,-.422],[-.162,-.433],[-.078,-.43],[-.012,-.445],[.057,-.441],[.15,-.449],[.248,-.446]], 0x75493e, .014, .013);
  trace([[-.222,-.444],[-.136,-.462],[-.053,-.476],[.045,-.481],[.139,-.477],[.224,-.454]], 0xc3887e, .024, .004);
  trace([[-.155,-.491],[-.087,-.515],[.015,-.519],[.126,-.504]], 0xc59681, .007);
  for (let line = 0; line < 3; line++) {
    const y = .523 + line * .072;
    trace([[-.29,y],[-.175,y+.016],[-.014,y+.008],[.15,y+.012],[.28,y-.01]], 0xca9981, .004);
  }
  for (let i = 0; i < 166; i++) {
    const t = (i * .61803398875) % 1, u = ((i + .37) * .41421356237) % 1;
    const x = .99 * (t - .5), y = -.215 - .68 * u;
    const underLip = y < -.51 && Math.abs(x) < .40 * Math.sqrt(Math.max(0, 1 - ((y + .61) / .37) ** 2));
    const aroundMouth = Math.abs(x) > .23 && Math.abs(x) < .44 && y < -.29 && y > -.65;
    const moustache = Math.abs(x) < .22 && y < -.24 && y > -.373 - Math.abs(x) * .09;
    if (!underLip && !aroundMouth && !moustache) continue;
    const length = .007 + .009 * t;
    strokes.push({points: [facePoint(x, y, .002), facePoint(x + x * length * 1.8, y - length, .004)],
      tint: i % 2 ? 0x9c745f : 0x875e50, radius: .0021, steps: 2});
  }
  for (let i = 0; i < 137; i++) {
    const angle = -RIM_ANGLE + 2 * RIM_ANGLE * i / 136;
    const t = ((i + .5) * .61803398875) % 1;
    const rootY = hairline(angle) + .025 + t * .21;
    const length = .07 + .18 * t;
    const points = [0, .5, 1].map(progress => {
      const direction = .2 * progress * (1 - Math.abs(angle) / RIM_ANGLE);
      const point = skinPoint(Math.min(1.16, rootY + length * progress), angle + direction);
      point[0] *= 1.008;
      point[2] += .006 * Math.cos(angle);
      return point;
    });
    strokes.push({points, tint: i % 3 === 0 ? 0x80695b : 0x594b43, radius: .003 + t * .002, steps: 5});
  }
  return strokes;
}

function ears(T, parent, strokes) {
  const oval = new T.SphereGeometry(1, 24, 16);
  const material = new T.MeshStandardMaterial({color: 0xcf9680, roughness: .81});
  const inner = new T.MeshStandardMaterial({color: 0xae7566, roughness: .87});
  for (const side of [-1, 1]) {
    const ear = new T.Mesh(oval, material);
    ear.position.set(side * .756, .031, -.066);
    ear.rotation.z = -side * .18;
    ear.scale.set(side === 1 ? .110 : .137, .251, .138);
    parent.add(ear);
    const bowl = new T.Mesh(oval, inner);
    bowl.position.set(side * .782, .041, .048);
    bowl.rotation.z = -side * .28;
    bowl.scale.set(.062, .116, .026);
    parent.add(bowl);
    const contour = [
      [.735,-.103,.034],[.794,-.136,.040],[.841,-.057,.046],[.857,.058,.037],
      [.844,.165,.026],[.808,.23,.014],[.760,.198,.038],[.736,.117,.045],
    ];
    strokes.push({points: contour.map(([x, y, z]) => [side * (side === 1 ? x - .021 : x), y, z]),
      radius: .021, tint: 0xd5a08a, steps: 25});
    const fold = [[.77,-.074,.067],[.809,-.017,.075],[.798,.056,.072],[.779,.105,.064],[.803,.144,.050]];
    strokes.push({points: fold.map(([x, y, z]) => [side * x, y, z]), radius: .012, tint: 0xc48a76, steps: 15});
  }
}

export function buildRecliningMask(T, parent) {
  const mask = new T.Group();
  mask.name = "reclining-mask";
  sculpt(T, mask);
  const strokes = facialFeatures(T, mask);
  ears(T, mask, strokes);
  drawStrokes(T, mask, strokes);
  mask.rotation.set(-.47, -.12, -Math.PI * .465, "YXZ");
  mask.scale.setScalar(1.045);
  // Measure before attaching so the resting height stays relative to the exhibition plinth.
  const bounds = new T.Box3().setFromObject(mask, true);
  const center = bounds.getCenter(new T.Vector3());
  mask.position.set(-center.x, .32 - bounds.min.y, -center.z);
  parent.add(mask);
}
