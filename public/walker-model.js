import {FEED_MS, PET_MS, JUMP_HEIGHT, avatarHands} from "./activities.js";
import {bikeFit,bikePedal,bikeRearFit,makeRidingBike} from "./sejong-bike-model.js";
import {isBikeDriver,isBikePassenger,isCycling} from "./sejong-bike.js";
import {CLINK_DURATION_MS} from "./social-events.js";
import {makeUmbrella,makeWearables} from "./wearables-models.js";
import {alcoholGlasses,alcoholLevel,gestureBody,gestureHands,MAX_ALCOHOL_LEVEL} from "./avatar-gestures.js";

const TAU = Math.PI * 2;
const HAIR = ["short", "bob", "long", "bun"];
const EYES = ["round", "soft", "bright"];
const OUTFITS = ["coat", "puffer", "tee", "hanbok"];
const SIDE = [-1, 1];
const LEG = [.322, .304];
const ARM = [.252, .228];
const SOLE = .124;
// SD proportions: the rig keeps its limb lengths in body units, the whole body is drawn
// at BODY scale and the head is enlarged on top of it, giving a two-heads-tall figure.
const BODY = .74;
const HEAD = .93;
const WIDE = 1.14;
const SEAT_LIFT = .17;
const CYCLING_HIP = .704;
const CYCLING_LIFT = bikeFit.saddleY+.09-CYCLING_HIP*BODY;
const CHAT_BUBBLE_MS = 6000;
const FACE_TONES = [
  {top:"#f8d1ad", middle:"#f5c8a3", chin:"#edb892", light:"#fff1d55d", cheek:"#e88e897a", radius:14},
  {top:"#f8c1aa", middle:"#f4b198", chin:"#e39b86", light:"#ffe2ce50", cheek:"#e57678a6", radius:18},
  {top:"#f8ae9e", middle:"#f09788", chin:"#df887b", light:"#ffd4c148", cheek:"#df636bc2", radius:22},
  {top:"#f69e96", middle:"#ef8078", chin:"#d76d68", light:"#ffc3b842", cheek:"#d54d59d2", radius:26},
  {top:"#f69a91", middle:"#ee7a74", chin:"#d96a64", light:"#ffc3b838", cheek:"#d74c56d8", radius:27},
  {top:"#f5958d", middle:"#ee746e", chin:"#d6655e", light:"#ffc3b838", cheek:"#d34a54dc", radius:28},
  {top:"#f39189", middle:"#eb6e68", chin:"#d4615a", light:"#ffc3b835", cheek:"#d14a52df", radius:29},
  {top:"#f28d85", middle:"#ea6965", chin:"#d05b55", light:"#ffc3b832", cheek:"#cf474ee0", radius:30},
  {top:"#f08983", middle:"#e96561", chin:"#cd5752", light:"#ffc3b830", cheek:"#ca444ce3", radius:31}
];
const clamp = (n, low = 0, high = 1) => Math.min(high, Math.max(low, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const mix = (a, b, t) => a + (b - a) * t;

function canvasTexture(T, width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"));
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function oval(ctx, x, y, width, height, color, angle = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, angle, 0, TAU);
  ctx.fill();
}

function softTint(ctx, x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "#ffffff00");
  oval(ctx, x, y, radius, radius, glow);
}

function faceTexture(T, eyes, blink, blushLevel) {
  const colors = FACE_TONES[blushLevel];
  return canvasTexture(T, 1024, 512, ctx => {
    ctx.scale(2, 2);
    const tone = ctx.createLinearGradient(0, 42, 0, 204);
    tone.addColorStop(0, colors.top);
    tone.addColorStop(.47, colors.middle);
    tone.addColorStop(1, colors.chin);
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, 512, 256);
    softTint(ctx, 128, 116, 56, colors.light);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const eyeY = 139;
    for (const side of SIDE) {
      const x = 128 + side * 33;
      softTint(ctx, 128 + side * 50, 161, colors.radius + 7, colors.cheek);
      ctx.strokeStyle = "#5a3a2e";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x - 9, 116 + side * .6);
      ctx.quadraticCurveTo(x, eyes === "soft" ? 112 : 110, x + 9, 116 - side * .6);
      ctx.stroke();
      if (eyes === "sick") {
        ctx.strokeStyle="#412723";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(x-10,eyeY-3);ctx.quadraticCurveTo(x-3,eyeY+5,x+1,eyeY+3);
        ctx.quadraticCurveTo(x+6,eyeY+2,x+11,eyeY-2);ctx.stroke();
      } else if (eyes === "woozy") {
        const y=eyeY+side*3;
        oval(ctx,x,y,11,8.7,"#ffddd1",side*.15);
        oval(ctx,x-side*2,y+1,5.4,5.1,"#4d302c");
        oval(ctx,x-side*2-1.4,y-.6,1.6,1.4,"#fff0df");
        ctx.strokeStyle="#694033";ctx.lineWidth=2.6;
        ctx.beginPath();ctx.moveTo(x-11,y-1);ctx.quadraticCurveTo(x,y-9+side*2,x+11,y+1);ctx.stroke();
      } else if (blink || eyes === "soft") {
        ctx.strokeStyle = "#3d2a26";
        ctx.lineWidth = blink ? 3.2 : 4.2;
        ctx.beginPath();
        ctx.moveTo(x - 11, eyeY + 2);
        ctx.quadraticCurveTo(x, blink ? eyeY + 8 : eyeY - 11, x + 11, eyeY + 2);
        ctx.stroke();
      } else {
        const wide = eyes === "bright" ? 10.4 : 11.6, tall = 16.2;
        if (eyes === "bright") oval(ctx, x, eyeY, 13.6, 17.8, "#fffaf0");
        oval(ctx, x, eyeY, wide, tall, "#33221f");
        oval(ctx, x, eyeY + 4.5, wide * .78, tall * .62, eyes === "bright" ? "#7a5a3f" : "#6b4332");
        oval(ctx, x, eyeY + .5, wide * .58, tall * .56, "#241718");
        oval(ctx, x - 3.6, eyeY - 6.4, 4.3, 5.0, "#ffffff");
        oval(ctx, x + 3.8, eyeY + 6.6, 2.0, 2.3, "#ffe9cf");
        ctx.strokeStyle = "#33221f";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x + side * (wide - 1), eyeY - tall * .62);
        ctx.lineTo(x + side * (wide + 4.5), eyeY - tall * .86);
        ctx.stroke();
      }
    }
    oval(ctx, 128, 154.5, 2.1, 1.3, "#d99577");
    if(eyes==="sick"){oval(ctx,128,165,4.3,5.2,"#6e3a35");return;}
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#8a4a40";
    ctx.beginPath();
    ctx.moveTo(121.5, 164);
    ctx.quadraticCurveTo(128, 171.5, 134.5, 164);
    ctx.stroke();
  });
}

// A rounder head with soft cheeks and a slightly flattened chin.
function chibiHead(T) {
  const geometry = new T.SphereGeometry(1, 32, 24), points = geometry.attributes.position;
  for (let i = 0; i < points.count; i++) {
    let x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    const cheek = 1 + .075 * Math.exp(-(((y + .36) / .34) ** 2));
    x *= cheek;
    z *= z > 0 ? 1 + (cheek - 1) * .6 : 1;
    if (y < -.5) y = -.5 + (y + .5) * .92;
    points.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function garmentTexture(T, style) {
  return canvasTexture(T, 256, 256, ctx => {
    ctx.fillStyle = "#f3ece6";
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 1; y < 256; y += 3) {
      ctx.fillStyle = y % 4 ? "#4535280a" : "#fffaf033";
      ctx.fillRect(0, y, 256, 1);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (style === "puffer") {
      ctx.fillStyle = "#5a504e8a"; ctx.fillRect(124,0,8,256);
      ctx.fillStyle = "#c9bcb8"; ctx.fillRect(127,0,2,256);
      for (const x of [103,153]) {
        ctx.strokeStyle = "#64575685"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x-5,168); ctx.lineTo(x+5,190); ctx.stroke();
      }
    } else if (style === "tee") {
      ctx.strokeStyle = "#70655f7e"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(128,-4,17,23,0,0,TAU); ctx.stroke();
      ctx.fillStyle = "#b4a8a15e";
      ctx.beginPath(); ctx.roundRect(145,76,16,24,2); ctx.fill();
    } else {
      ctx.fillStyle = "#82665d64";
      ctx.beginPath(); ctx.moveTo(143, 64); ctx.lineTo(111, 128); ctx.lineTo(114, 139); ctx.lineTo(153, 79); ctx.fill();
      ctx.strokeStyle = "#a891804d"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(104, 0); ctx.lineTo(143, 112); ctx.lineTo(119, 147); ctx.stroke();
      for (let y = 189; y < 242; y += 9) { ctx.fillStyle = "#9b776c26"; ctx.fillRect(0, y, 256, 2); }
    }
    ctx.strokeStyle = "#65564d65";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(-4, 224, 264, 21);
  });
}

// Vertex colours store only light and shade; the material supplies the hair colour.
const HAIR_BASE = 0x46312e;
const HAIR_SHADES = [0x2e2528,0x46312e,0x6a4733,0x8b6340,0x3b2d3d,0xa77b4c,0x54382c];
const ease = (edge0, edge1, n) => smooth((n-edge0)/(edge1-edge0));

// How far down the head the hair reaches at each side angle (0 = front), in radians from the crown.
function hairline(style, angle) {
  const side = Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)));
  const back = ease(.70,1.30,side);
  if (style === "short") {
    const fringe = 1.02+.20*Math.sin(angle*1.15+.55)+.045*Math.cos(angle*9);
    return mix(fringe,1.62+.10*ease(1.7,2.6,side),back);
  }
  if (style === "bob") {
    const fringe = 1.25+.028*Math.cos(angle*11);
    return mix(fringe,2.02,back);
  }
  if (style === "long") {
    const fringe = .90+.42*ease(0,.72,side)**1.25;
    return mix(fringe,1.86,back);
  }
  const fringe = .93+.14*ease(0,.9,side)+.03*Math.cos(angle*7);
  return mix(fringe,1.60,back);
}

function hairCap(T, style) {
  const geometry = new T.BufferGeometry();
  const positions = [], colors = [], triangles = [];
  const rings = 16, sides = 56;
  for (let row = 0; row <= rings; row++) {
    for (let side = 0; side <= sides; side++) {
      const angle = side / sides * TAU, t = row / rings;
      const reach = hairline(style,angle);
      const pitch = .009 + t * reach;
      const strand = Math.sin(angle * (style === "bob" ? 22 : 14) + pitch * 1.6);
      // Puff the crown slightly and curl the ends back toward the head.
      const puff = 1.035 + .030*Math.sin(Math.min(pitch,1.6)) - .050*t**6
        + (style === "bob" ? .055*ease(1.45,2.0,pitch) : 0) + strand*.0045*Math.sin(pitch);
      const below = Math.max(0,pitch-1.571), level = Math.min(pitch,1.571);
      // Past the widest point the hair hangs instead of wrapping under the chin.
      const hang = style === "bob" ? .86 : 1;
      const radius = Math.sin(level)*(1-below*(1-hang)*.55);
      positions.push(Math.sin(angle) * radius * .362 * puff,
        .012 + (Math.cos(level) - below*.94) * .348 * puff,
        -.016 + Math.cos(angle) * radius * .346 * puff);
      const sheen = .86 + .09 * Math.sin(angle * 2 + .3) + .075 * strand
        + .30 * Math.max(0, 1 - Math.abs(pitch - .72) * 2.1) * Math.max(0, Math.cos(angle - .55))
        - .10*t**3;
      colors.push(sheen, sheen, sheen);
      if (row && side) {
        const a = (row - 1) * (sides + 1) + side - 1, b = a + sides + 1;
        triangles.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

function hairLock(T, points, width, depth, tint) {
  const path = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
  const geometry = new T.TubeGeometry(path, 14, 1, 9, false);
  const position = geometry.attributes.position;
  const colors = [];
  const reference = new T.Color(HAIR_BASE), base = new T.Color(tint);
  base.setRGB(base.r/reference.r,base.g/reference.g,base.b/reference.b);
  for (let row = 0; row <= 14; row++) {
    const p = row / 14, center = path.getPointAt(p);
    const volume = .025 + .975 * Math.sin(Math.PI * p) ** .52;
    for (let side = 0; side <= 9; side++) {
      const i = row * 10 + side;
      position.setXYZ(i, center.x + (position.getX(i) - center.x) * width * volume,
        center.y + (position.getY(i) - center.y) * width * volume,
        center.z + (position.getZ(i) - center.z) * depth * volume);
      const shade = .91 + .19 * Math.max(0, Math.sin(p * Math.PI)) + .12 * Math.cos(side / 9 * TAU);
      colors.push(base.r * shade, base.g * shade, base.b * shade);
    }
  }
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function combineParts(T, parts) {
  const geometry = new T.BufferGeometry();
  const positions = [], colors = [], normals = [], indices = [];
  let offset = 0;
  for (const part of parts) {
    const attributes = part.attributes;
    positions.push(...attributes.position.array);
    normals.push(...attributes.normal.array);
    colors.push(...attributes.color.array);
    for (const index of part.index.array) indices.push(index + offset);
    offset += attributes.position.count;
    part.dispose();
  }
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

function hairBall(T, x, y, z, rx, ry, rz, twist = 6) {
  const ball = new T.SphereGeometry(1,24,16), points = ball.attributes.position, colors = [];
  for (let i = 0; i < points.count; i++) {
    const px = points.getX(i), py = points.getY(i), pz = points.getZ(i);
    const ridge = Math.sin(Math.atan2(pz,px)*twist+py*5.7)*(1-py*py);
    const volume = 1+ridge*.05;
    points.setXYZ(i,x+px*rx*volume,y+py*ry,z+pz*rz*volume);
    const light = .92+.12*ridge+.16*py;
    colors.push(light,light,light);
  }
  ball.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  ball.computeVertexNormals();
  return ball;
}

function styledHair(T, style) {
  const parts = [hairCap(T, style)];
  const lock = (points, width, depth, tint) => parts.push(hairLock(T, points, width, depth, tint));
  if (style === "short") {
    // Side-swept fringe and a small cowlick.
    lock([[-.262,.170,.186],[-.190,.300,.224],[-.046,.345,.262],[.118,.292,.286],[.250,.150,.238]],
      .092,.060,0x4d3430);
    lock([[-.268,.120,.178],[-.170,.214,.268],[-.030,.196,.322],[.120,.150,.306]], .060,.034,0x553934);
    lock([[.020,.352,-.040],[.050,.420,-.020],[.110,.432,.020],[.150,.398,.050]], .034,.030,0x553934);
  } else if (style === "bob") {
    parts.push(hairBall(T,.262,.258,.118,.040,.030,.026,3));
  } else if (style === "long") {
    for (const side of SIDE) {
      // Strands framing the face, then falling in front of the shoulders.
      lock([[side*.030,.330,.150],[side*.120,.300,.248],[side*.232,.196,.262],[side*.300,.050,.212],
        [side*.318,-.110,.170]], .060,.040,side===1 ? 0x573932 : 0x4b322e);
      lock([[side*.310,.060,.090],[side*.330,-.110,.100],[side*.300,-.290,.110],
        [side*.262,-.440,.118],[side*.236,-.540,.118]], .056,.050,0x503732);
    }
    // Back panel reaching the shoulder blades.
    lock([[0,.120,-.250],[0,-.120,-.330],[0,-.380,-.330],[0,-.600,-.300],[0,-.730,-.262]],.300,.120,0x442f30);
    for (const side of SIDE) {
      lock([[side*.190,.080,-.210],[side*.250,-.160,-.240],[side*.250,-.420,-.240],[side*.210,-.660,-.220]],
        .130,.100,0x49312f);
    }
  } else {
    // Twin buns with a few loose strands at the temples.
    for (const side of SIDE) {
      parts.push(hairBall(T,side*.232,.330,-.060,.132,.124,.128,5));
      lock([[side*.070,.318,.170],[side*.170,.300,.200],[side*.270,.200,.170],[side*.316,.050,.130]],
        .050,.036,0x4a3437);
    }
  }
  return combineParts(T, parts);
}

function modeledDetails(T, sphere, specifications) {
  return combineParts(T,specifications.map(([color,x,y,z,sx,sy,sz,rotation=0]) => {
    const part = sphere.clone().scale(sx,sy,sz).rotateZ(rotation).translate(x,y,z);
    const tint = new T.Color(color), colors = new Float32Array(part.attributes.position.count*3);
    for (let i=0;i<colors.length;i+=3) {
      colors[i]=tint.r; colors[i+1]=tint.g; colors[i+2]=tint.b;
    }
    part.setAttribute("color",new T.BufferAttribute(colors,3));
    return part;
  }));
}

function roundedLathe(T, points, depth = 1, sides = 24) {
  const profile = points.map(([r,y]) => new T.Vector2(r,y));
  const geometry = new T.LatheGeometry(profile,sides);
  geometry.scale(1,1,depth);
  geometry.rotateY(Math.PI);
  return geometry;
}

function coatShell(T, profile, gap, depth) {
  const geometry = new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),36,gap,TAU-2*gap);
  geometry.scale(1,1,depth);
  return geometry;
}

function collarPanels(T, outlines) {
  const faces = outlines.map(outline=>new T.Shape(outline.map(([x,y])=>new T.Vector2(x,y))));
  return new T.ExtrudeGeometry(faces,{depth:.012,bevelThickness:.006,bevelSize:.006,bevelSegments:1,steps:1});
}

function chimaGeometry(T) {
  const geometry = roundedLathe(T,[[.320,-.812],[.334,-.825],[.355,-.805],[.374,-.748],[.356,-.570],
    [.318,-.343],[.268,-.132],[.229,-.028],[.224,0],[0,0]],.88,64);
  const points=geometry.attributes.position, colors=[];
  for (let i=0;i<points.count;i++) {
    const x=points.getX(i),y=points.getY(i),z=points.getZ(i),angle=Math.atan2(x,z);
    const fold=Math.cos(angle*18+y*2), fullness=clamp(-y/.825);
    const scale=1+fold*(.014+fullness*.051);
    points.setXYZ(i,x*scale,y,z*scale);
    const light=1+fold*(.028+fullness*.075);
    colors.push(light,light,light);
  }
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}

export function makeWalkerModels(T, scene, {wx, wz}, createItemProp) {
  const wearables=makeWearables(T),umbrellaTemplate=makeUmbrella(T);
  const sphere = new T.SphereGeometry(1,16,12);
  const head = chibiHead(T);
  const shadowGeometry = new T.CircleGeometry(.40,24);
  const segment = roundedLathe(T, [[0,-1.125],[.49,-1.109],[.72,-1.068],[.86,-.994],
    [.92,-.67],[1,-.28],[.99,-.035],[.87,.048],[.56,.111],[0,.14]],1,12);
  const paddedSleeve = roundedLathe(T,[[0,-1.12],[.53,-1.075],[.91,-1],[1,-.82],[.84,-.65],
    [1.04,-.48],[.85,-.26],[1.05,-.12],[.89,.047],[.47,.11],[0,.14]],1,14);
  const shortSleeve = roundedLathe(T,[[.77,-.78],[1.02,-.78],[1.05,-.66],[1.11,-.38],
    [1.10,-.08],[.86,.057],[.41,.122],[0,.132]],1,14);
  const coatTop = coatShell(T,[[.275,-.109],[.286,-.085],[.278,.10],[.288,.277],
    [.295,.369],[.263,.437],[.181,.487],[.144,.489]],.33,.82);
  const coatTail = coatShell(T,[[.323,-.378],[.338,-.347],[.320,-.235],
    [.299,-.108],[.278,.007],[.272,.055]],.69,.93);
  const lapelPoints = [[.063,.465],[.187,.409],[.157,.299],[.112,.321],[.116,.231],[.051,.335]];
  const lapelGeometry = collarPanels(T,SIDE.map(side=>lapelPoints.map(([x,y])=>[x*side,y])));
  const jeogoriCollar = collarPanels(T,[
    [[-.121,.461],[-.087,.473],[.069,.325],[.047,.301]],
    [[.114,.473],[.142,.455],[.069,.325],[.047,.301]]
  ]);
  const skirtGeometry = chimaGeometry(T);
  const torsoGeometry = {
    coat: roundedLathe(T,[[0,-.128],[.202,-.128],[.225,-.079],[.224,.160],[.237,.355],
      [.227,.42],[.155,.475],[.121,.48],[0,.48]],.74),
    puffer: roundedLathe(T,[[0,-.126],[.217,-.126],[.268,-.113],[.273,-.096],[.264,-.078],
      [.289,-.058],[.299,-.015],[.288,.036],[.270,.052],[.292,.072],[.305,.113],
      [.291,.162],[.269,.174],[.297,.202],[.305,.247],[.289,.285],[.265,.302],
      [.290,.327],[.295,.365],[.275,.402],[.246,.421],[.201,.466],[.142,.479],[0,.479]],.82,32),
    tee: roundedLathe(T,[[0,-.104],[.201,-.104],[.229,-.097],[.241,-.077],[.244,.113],
      [.249,.265],[.255,.369],[.225,.431],[.167,.471],[.120,.476],[0,.476]],.71),
    hanbok: roundedLathe(T,[[0,-.021],[.234,-.021],[.255,-.009],[.256,.035],[.246,.20],
      [.254,.32],[.262,.385],[.235,.443],[.163,.475],[.126,.476],[0,.476]],.75)
  };
  const hairGeometry = Object.fromEntries(HAIR.map(style => [style,styledHair(T,style)]));
  const hairMaterials = HAIR_SHADES.map(color =>
    new T.MeshStandardMaterial({color,vertexColors:true,roughness:.72,side:T.DoubleSide}));
  const textileStyles = OUTFITS.filter(style=>style!=="coat");
  const garmentMaps = Object.fromEntries(textileStyles.map(style => [style,garmentTexture(T,style)]));
  const faces = new Map(), clothes = new Map();
  const matte = (color, roughness = .84) => new T.MeshStandardMaterial({color,roughness});
  const skin = matte(0xf0bc99), details = new T.MeshStandardMaterial({vertexColors:true,roughness:.86});
  const earMaterials=Array.from({length:MAX_ALCOHOL_LEVEL+1},(_,level)=>new T.MeshStandardMaterial({
    color:new T.Color(0xffffff).lerp(new T.Color(0xff8f9c),level/MAX_ALCOHOL_LEVEL),vertexColors:true,roughness:.86
  }));
  const hanbokPants = matte(0xb9b295);
  const trousers = {coat:matte(0x3f4452),puffer:matte(0x4d6787),tee:matte(0xc7b089),hanbok:hanbokPants};
  const pants = trousers.coat;
  const ivory = matte(0xf0debd), hairpin = matte(0xdfb475), scarfCloth = matte(0xf2e4c8,.95);
  const earGeometry = modeledDetails(T,sphere,SIDE.flatMap(side => [
    [0xf0bc99,side*.330,-.040,.004,.066,.086,.052], [0xd8947e,side*.362,-.038,.038,.026,.048,.018]
  ]));
  const shoe = (sole,upper,toe) => modeledDetails(T,sphere,[
    [sole,0,-.100,.046,.136,.030,.200],[upper,0,-.050,.042,.134,.072,.194],[toe,0,.010,.100,.080,.012,.024]
  ]);
  const footGeometries = {
    coat:shoe(0xcdbda2,0x5a4034,0x7a5a48), puffer:shoe(0xf2efe8,0xf7f4ee,0xd8dde4),
    tee:shoe(0xf2efe8,0xe9695b,0xf7f4ee), hanbok:shoe(0xe9e1cf,0xf6f1e6,0xc65a52)
  };
  const footGeometry = footGeometries.coat;
  const scarfGeometry = new T.TorusGeometry(.150,.058,10,26);
  scarfGeometry.rotateX(Math.PI/2);
  const handGeometry = SIDE.map(side => modeledDetails(T,sphere,[
    [0xf2bd98,0,-.046,.012,.088,.094,.080],[0xf2bd98,-side*.060,-.034,.044,.034,.046,.035]
  ]));
  const fistGeometry=SIDE.map(side=>modeledDetails(T,sphere,[
    [0xf2bd98,0,-.044,.024,.083,.077,.077],[0xe9aa83,-side*.055,-.042,.071,.033,.044,.029]
  ]));
  const knotGeometry = modeledDetails(T,sphere,[
    [0xc97c66,0,0,0,.048,.036,.027],[0xc97c66,-.045,-.017,.007,.062,.023,.016,-.36],
    [0xc97c66,.048,.008,.004,.056,.023,.016,.26],[0xc97c66,.042,-.075,.011,.020,.072,.012,.27],
    [0xf0debd,.073,-.062,.007,.017,.059,.011,.53]
  ]);
  const buttonsGeometry = modeledDetails(T,sphere,[
    [0xc1a184,.095,.10,.217,.016,.016,.011],[0xc1a184,.095,.198,.214,.016,.016,.011],
    [0xc1a184,.095,.285,.213,.016,.016,.011]
  ]);

  function faceMaterial(eye, blink, blush) {
    const key = `${eye}/${blink}/${blush}`;
    if (!faces.has(key)) faces.set(key, new T.MeshStandardMaterial({
      color:0xffffff, map:faceTexture(T,eye,blink,blush), roughness:.84
    }));
    return faces.get(key);
  }

  function outfitMaterials(color) {
    if (!clothes.has(color)) {
      const base = new T.Color(color);
      const fabric = base.clone().lerp(new T.Color(0xe1cab4),.19);
      const accent = fabric.clone().multiplyScalar(.76);
      const outer = matte(fabric);
      outer.side = T.DoubleSide;
      clothes.set(color, {
        tops:Object.fromEntries(textileStyles.map(style => [style,new T.MeshStandardMaterial({
          color:fabric,map:garmentMaps[style],roughness:style==="puffer" ? .62 : .92
        })])),
        sleeve:matte(fabric), trim:matte(accent), outer,
        lining:matte(fabric.clone().lerp(new T.Color(0xeee3c8),.78)),
        padded:matte(fabric,.63), collar:matte(fabric.clone().lerp(new T.Color(0xe8d7bd),.13)),
        chima:new T.MeshStandardMaterial({color:fabric.clone().multiplyScalar(.80),vertexColors:true,roughness:.79,side:T.DoubleSide})
      });
    }
    return clothes.get(color);
  }

  function part(parent, geometry, material, x, y, z, sx, sy, sz) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    mesh.scale.set(sx,sy,sz);
    parent.add(mesh);
    return mesh;
  }

  function joint(parent, x=0, y=0, z=0) {
    const group = new T.Group();
    group.position.set(x,y,z);
    parent.add(group);
    return group;
  }

  function chain(parent, x, y, lengths, radii, material) {
    const upper = joint(parent,x,y);
    const lower = joint(upper,0,-lengths[0]);
    const end = joint(lower,0,-lengths[1]);
    const top = part(upper,segment,material,0,0,0,radii[0],lengths[0],radii[0]);
    const bottom = part(lower,segment,material,0,0,0,radii[1],lengths[1],radii[1]);
    return {upper,lower,end,top,bottom,lengths,target:new T.Vector3()};
  }

  function create(coat, nickname, labelSprite, seedName) {
    const group = joint(scene), body = joint(group);
    body.scale.setScalar(BODY);
    const pelvis = joint(body,0,.705), chest = joint(pelvis,0,.045);
    // Clothes are widened around the trunk; the limbs keep their own joints.
    const garb = joint(chest), lower = joint(pelvis);
    garb.scale.set(WIDE,1,WIDE);
    lower.scale.set(WIDE,1,WIDE);
    const palette = outfitMaterials(coat ?? 0xab5947);
    const torso = part(garb,torsoGeometry.coat,palette.lining,0,0,0,1,1,1);
    const waist = part(lower,sphere,pants,0,-.036,0,.190,.108,.132);
    part(garb,sphere,skin,0,.470,0,.100,.080,.096);
    const overcoat = joint(garb);
    part(overcoat,coatTop,palette.outer,0,0,0,1,1,1);
    part(overcoat,lapelGeometry,palette.trim,0,0,.223,1,1,1);
    part(overcoat,buttonsGeometry,details,0,0,0,1,1,1);
    // A wool scarf for the autumn walk.
    part(overcoat,scarfGeometry,scarfCloth,0,.468,.004,1,1.05,.92);
    const scarfEnd = part(overcoat,sphere,scarfCloth,.085,.335,.214,.050,.115,.026);
    scarfEnd.rotation.z = .16;
    const hem = part(lower,coatTail,palette.outer,0,.025,0,1,1,1);
    const pufferCollar = part(garb,sphere,palette.collar,0,.452,-.042,.180,.093,.159);
    const teeHem = part(garb,sphere,palette.sleeve,0,-.082,0,.240,.074,.176);
    const hanbokDetails = joint(garb);
    part(hanbokDetails,jeogoriCollar,ivory,0,0,.186,1,1,1);
    part(hanbokDetails,knotGeometry,details,.066,.31,.190,1,1,1);
    const skirt = part(lower,skirtGeometry,palette.chima,0,.259,0,1,1,1);

    const headJoint = joint(chest,0,.487,.011);
    headJoint.scale.setScalar(HEAD/BODY);
    const face = joint(headJoint,0,.300,.012);
    const faceMesh = part(face,head,faceMaterial("round",false,0),0,0,0,.338,.322,.314);
    const ears = part(face,earGeometry,earMaterials[0],0,0,0,1,1,1);
    let offset = 0;
    for (const letter of String(seedName ?? nickname ?? "")) offset = (offset * 31 + letter.charCodeAt(0)) >>> 0;
    const hairMesh = part(face,hairGeometry.short,hairMaterials[offset % hairMaterials.length],0,0,0,1.06,1,1.05);
    const pin = part(face,sphere,hairpin,.262,.258,.150,.050,.016,.012);
    pin.rotation.z = .5;

    const legs = SIDE.map(side => {
      const leg = chain(pelvis,side*.135,-.014,LEG,[.142,.122],pants);
      leg.foot = part(leg.end,footGeometry,details,0,0,0,1,1,1);
      return leg;
    });
    const arms = SIDE.map((side,i) => {
      const arm = chain(chest,side*.300,.405,ARM,[.110,.098],palette.sleeve);
      arm.cuff = part(arm.lower,sphere,palette.trim,0,-.204,0,.102,.046,.100);
      arm.shortSleeve = part(arm.upper,shortSleeve,palette.sleeve,0,0,0,.114,.165,.114);
      arm.hand=part(arm.end,handGeometry[i],details,0,0,0,1,1,1);
      return arm;
    });
    const itemPivots=SIDE.map(()=>{
      const pivot=joint(chest);pivot.scale.setScalar(1.35);pivot.visible=false;
      return {pivot,show:createItemProp(pivot)};
    });
    const label = nickname && labelSprite ? labelSprite(nickname,coat) : null;
    if (label) group.add(label);
    const emote = new T.Sprite(new T.SpriteMaterial({transparent:true,depthWrite:false,toneMapped:false}));
    emote.scale.set(.65,.65,1);
    emote.visible = false;
    group.add(emote);
    const shadow = new T.Mesh(shadowGeometry,new T.MeshBasicMaterial({color:0x27352d,transparent:true,opacity:.20,depthWrite:false}));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .028;
    group.add(shadow);
    group.visible = false;
    group.traverse(mesh => { if (mesh.isMesh && mesh !== shadow) mesh.castShadow = true; });
    return {group,body,floorY:null,teeHem,pelvis,chest,torso,waist,face,garb,faceMesh,ears,headJoint,hairMesh,pin,overcoat,hem,pufferCollar,hanbokDetails,skirt,legs,arms,label,
      shadow,emote,chatSprite:null,chatMessage:null,itemPivots,palette,offset,phase:(offset%100)/100,
      stride:0,sprint:0,seatBlend:0,petBlend:0,appearance:"",lastX:null,lastY:null,bike:null,hat:null,charm:null,umbrella:null};
  }

  const down = new T.Vector3(0,-1,0), forward = new T.Vector3(0,0,1);
  const target = new T.Vector3(), direction = new T.Vector3(), elbow = new T.Vector3(), bend = new T.Vector3();
  const pole = new T.Vector3(), clasp = new T.Vector3(), grip = new T.Vector3(), globalLower = new T.Quaternion();
  const emoteAnchor = new T.Vector3(), chatAnchor = new T.Vector3();
  const pitch = new T.Quaternion(), inverseChest = new T.Quaternion();
  const xAxis = new T.Vector3(1,0,0);

  // Solve a two-segment limb from the end position and a preferred bend direction.
  function solve(limb, point, preferred) {
    const {upper,lower,lengths:[a,b]} = limb;
    target.copy(point).sub(upper.position);
    const length = clamp(target.length(),.095,a+b-.002);
    direction.copy(target).normalize();
    const along = (a*a-b*b+length*length)/(2*length);
    bend.copy(preferred).addScaledVector(direction,-preferred.dot(direction)).normalize();
    elbow.copy(direction).multiplyScalar(along).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-along*along)));
    upper.quaternion.setFromUnitVectors(down,bend.copy(elbow).normalize());
    globalLower.setFromUnitVectors(down,bend.copy(direction).multiplyScalar(length).sub(elbow).normalize());
    lower.quaternion.copy(upper.quaternion).invert().multiply(globalLower);
  }

  function appearance(model, position, blink, blush, woozy, sick) {
    const look = position.look;
    const hair = HAIR.includes(look?.hair) ? look.hair : position.character === "woman" ? "long" : "short";
    const eyes = EYES.includes(look?.eyes) ? look.eyes : "round";
    const requestedOutfit = look?.outfit === "hoodie" ? "puffer" : look?.outfit;
    const outfit = OUTFITS.includes(requestedOutfit) ? requestedOutfit : "coat";
    const chima = outfit === "hanbok" && position.character === "woman";
    const headwear=Object.hasOwn(wearables.headwear,look?.headwear)?look.headwear:"none";
    const keepsake=Object.hasOwn(wearables.keepsakes,look?.keepsake)?look.keepsake:"none";
    const key = `${hair}/${eyes}/${outfit}/${chima}/${headwear}/${keepsake}`;
    if (key !== model.appearance) {
      model.appearance = key;
      model.hairMesh.geometry = hairGeometry[hair];
      model.pin.visible = hair === "bob"&&headwear==="none";
      model.hat?.removeFromParent();model.charm?.removeFromParent();
      model.hat=wearables.headwear[headwear]?.clone()??null;
      model.charm=wearables.keepsakes[keepsake]?.clone()??null;
      if(model.hat){model.hat.name=headwear;model.face.add(model.hat);}
      if(model.charm){model.charm.name=keepsake;model.garb.add(model.charm);}
      model.torso.geometry = torsoGeometry[outfit];
      model.torso.material = outfit === "coat" ? model.palette.lining : model.palette.tops[outfit];
      model.torso.scale.set(chima ? .94 : 1,1,chima ? .94 : 1);
      model.overcoat.visible = model.hem.visible = outfit === "coat";
      model.pufferCollar.visible = outfit === "puffer";
      model.teeHem.visible = outfit === "tee";
      model.hanbokDetails.visible = outfit === "hanbok";
      model.skirt.visible = chima;
      model.waist.material = trousers[outfit];
      for (const leg of model.legs) {
        const roomy = outfit === "hanbok" && !chima;
        leg.top.material = leg.bottom.material = model.waist.material;
        leg.foot.geometry = footGeometries[outfit];
        leg.top.scale.set(roomy ? .164 : .142,LEG[0],roomy ? .158 : .142);
        leg.bottom.scale.set(roomy ? .142 : .122,LEG[1],roomy ? .136 : .122);
        leg.top.visible = !chima;
        leg.bottom.visible = !chima;
      }
      for (const arm of model.arms) {
        const bare = outfit === "tee", padded = outfit === "puffer";
        arm.top.geometry = arm.bottom.geometry = padded ? paddedSleeve : segment;
        arm.top.material = arm.bottom.material = bare ? skin : padded ? model.palette.padded : model.palette.sleeve;
        const upperRadius = bare ? .092 : padded ? .126 : .110;
        const lowerRadius = bare ? .084 : padded ? .112 : .098;
        arm.top.scale.set(upperRadius,ARM[0],upperRadius);
        arm.bottom.scale.set(lowerRadius,ARM[1],lowerRadius);
        arm.cuff.visible = !bare;
        arm.shortSleeve.visible = bare;
      }
    }
    const expression=sick?"sick":woozy?"woozy":eyes;
    model.faceMesh.material = faceMaterial(expression,expression===eyes&&blink,blush);
    model.ears.material = earMaterials[blush];
  }

  function clearChat(model) {
    if (!model.chatSprite) return;
    const {material} = model.chatSprite;
    model.chatSprite.removeFromParent();
    material.map.dispose();
    material.dispose();
    model.chatSprite = model.chatMessage = null;
  }

  function updateChat(model, chat, clock, chatTexture) {
    const age = clock-chat?.at;
    if (!chatTexture || !chat?.id || typeof chat.text !== "string" || !Number.isFinite(age) || age < -300 || age >= CHAT_BUBBLE_MS) {
      clearChat(model);
      return;
    }
    if (model.chatMessage?.id !== chat.id || model.chatMessage.text !== chat.text) {
      clearChat(model);
      const map = chatTexture(chat.text);
      if (!map) return;
      const sprite = new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));
      sprite.center.set(.5,0);
      sprite.scale.set(map.image.width/148,map.image.height/148,1);
      model.group.add(sprite);
      model.chatSprite = sprite;
      model.chatMessage = chat;
    }
    model.chatSprite.visible = true;
    model.chatSprite.material.opacity = Math.min(1,(CHAT_BUBBLE_MS-age)/320);
  }

  function placeChat(model, cameraUp) {
    const {chatSprite,label,emote} = model;
    if (!chatSprite) return;
    const anchor = emote.visible ? emote : label;
    if (anchor) {
      anchor.getWorldPosition(chatAnchor).addScaledVector(cameraUp,anchor.scale.y/2+.085);
      chatSprite.position.copy(model.group.worldToLocal(chatAnchor));
    } else {
      chatSprite.position.set(0,2.15,0);
    }
  }

  function update(model, position, {now,clock,delta=1/60,seat,floor=0,jump=0,emojiTexture,chatTexture,turnEase=1}) {
    const {group,body,pelvis,chest,headJoint,legs,arms,itemPivots,emote} = model;
    const wasVisible = group.visible;
    group.visible = true;
    const smoothPose = wasVisible ? 1 - Math.exp(-delta*15) : 1;
    const riding = !seat && isCycling(position);
    const driving = riding && isBikeDriver(position),passenger = riding && isBikePassenger(position);
    const lift = riding ? 0 : jump;
    const airborne = Math.min(1,lift/JUMP_HEIGHT);
    const walking = Boolean(position.stepping && !seat && !riding && jump<.06);
    const running = walking && Boolean(position.running);
    const hands=avatarHands(position,clock,{riding,seated:Boolean(seat),walking});
    const {claspSide,feedAge,feeding,petAge,petting:pet,petSide,umbrellaHand,itemFor,feedingSide}=hands;
    const feedPose = feeding ? smooth(Math.min(feedAge/320,(FEED_MS-feedAge)/360)) : 0;
    const petPose = pet ? smooth(Math.min(petAge/235,(PET_MS-petAge)/275)) : 0;
    const clinkEvent=position.clink,clinkAge=clock-clinkEvent?.startedAt;
    const clinkSide=clinkEvent?.slot==="secondItem"?-1:1;
    const clink=itemFor(clinkSide)?.spec.verb==="마시기"&&!seat&&!claspSide&&clinkAge>=0&&clinkAge<CLINK_DURATION_MS
      ? smooth(Math.min(clinkAge/600,(CLINK_DURATION_MS-clinkAge)/730)) : 0;
    const contact=clink?Math.max(0,1-Math.abs(clinkAge-900)/170)*.045:0;
    const performance=gestureHands(position,clock,hands,{riding,busy:Boolean(clink)});
    const {pose:acting,sick,fall,umbrellaOpen,umbrellaSide}=performance;
    const bodyPose=acting&&gestureBody(acting);
    const blushLevel=alcoholLevel(position,clock);
    const woozy=alcoholGlasses(position,clock)>=2;

    const facing = Math.PI - (seat?.heading ?? position.clink?.heading ?? position.heading ?? 252) * Math.PI/180;
    const turn = facing - group.rotation.y;
    group.rotation.y += Math.atan2(Math.sin(turn),Math.cos(turn)) * (wasVisible && !seat && !riding && !claspSide ? turnEase : 1);
    // Stepping onto or off a ledge eases the floor so the body does not pop.
    const vaulting=position.vaultBase!=null&&lift>0;
    model.floorY = !vaulting && wasVisible && model.floorY !== null && Math.abs(floor-model.floorY) < 1.6
      ? mix(model.floorY,floor,1-Math.exp(-delta*17)) : floor;
    group.position.set(wx(seat?.x ?? position.x),seat ? (seat.base ?? 0) : model.floorY+lift,wz(seat?.y ?? position.y));
    const travel = model.lastX === null ? 0 : Math.hypot(position.x-model.lastX,position.y-model.lastY);
    model.lastX = position.x;
    model.lastY = position.y;
    let pedalAngle = 0;
    if (driving) {
      const pedaling = wasVisible && model.bike?.group.visible && travel <= Math.max(.8,delta*22);
      if (!model.bike) {
        model.bike = makeRidingBike(T,{rearSeat:true});
        group.add(model.bike.group);
      }
      model.bike.group.visible = true;
      pedalAngle = model.bike.update(pedaling ? travel : 0);
    } else if (model.bike) {
      model.bike.group.visible = false;
    }
    model.sprint = mix(model.sprint,Number(running),smoothPose);
    model.seatBlend = mix(model.seatBlend,Number(Boolean(seat)),smoothPose);
    model.petBlend = mix(model.petBlend,Math.max(petPose,feedPose),smoothPose);
    const sprint = riding ? 0 : model.sprint;
    const seated = riding ? 1 : model.seatBlend, crouch = riding ? 0 : model.petBlend;
    // Short legs take quick little steps.
    const cycleDistance = mix(1.00,1.80,sprint), stance = mix(.57,.36,sprint);
    const velocity = mix(2.58,6.675,sprint);
    const strideTarget = walking ? (position.blocked ? .32 : 1) : 0;
    model.stride = mix(model.stride,strideTarget,smoothPose);
    const stride = riding ? 0 : model.stride;
    if (walking) {
      const distance = position.blocked || !wasVisible || travel > .6 ? velocity*delta : travel;
      model.phase = (model.phase + Math.max(distance,velocity*delta*.55)/cycleDistance)%1;
    }
    const phase = model.phase, pendulum = Math.sin(phase*TAU);
    const breath = Math.sin(now*.0025 + (model.offset%37)*.16);
    const sway = stride * (1-seated);
    const flight = stance < .5 ? Math.sin(Math.PI*clamp((phase%.5-stance)/(.5-stance))) : 0;
    const bob = (.009*(1-sprint)*(1-Math.cos(phase*TAU*2))+.065*sprint*flight)*sway;
    const strideDip = (.074+.020*sprint)*sway;
    const idleRise = .035*(1-stride)*(1-seated)*(1-crouch);
    if (riding) {
      body.position.y = CYCLING_LIFT+(passenger?bikeRearFit.saddleY-bikeFit.saddleY:0);
      pelvis.position.set(0,CYCLING_HIP,0);
      chest.rotation.set(passenger?.14:.28,0,0);
      headJoint.rotation.set(passenger?-.13:-.25,0,breath*.012);
      inverseChest.copy(chest.quaternion).invert();
    } else {
      body.position.y = seated*SEAT_LIFT+(fall?.weight??0)*.23;
      const idleGesture=seat||!walking?1:.40;
      const wobble=woozy?Math.sin(clock*.0048+model.offset)*.062:0;
      pelvis.position.set(.020*pendulum*sway+(bodyPose?.x??0)*(1-seated),
        .691+bob-strideDip+idleRise+breath*.004-seated*.145-crouch*.225+(bodyPose?.y??0)*idleGesture,0);
      chest.rotation.set(.020+sprint*.13+crouch*.34+seated*.03+clink*.22+(bodyPose?.pitch??0)*idleGesture,
        pendulum*sway*.10+(bodyPose?.yaw??0)*idleGesture,pendulum*sway*.065+(bodyPose?.roll??0)*idleGesture+wobble*.41);
      headJoint.rotation.set(-.030-sprint*.070+crouch*.16+(bodyPose?.headPitch??0)*idleGesture,
        -pendulum*sway*.05+wobble*.65,breath*.020-pendulum*sway*.045+(bodyPose?.headRoll??0)*idleGesture+wobble);
    }
    body.rotation.z=-(fall?.weight??0)*1.48;
    model.shadow.visible = !seat;
    model.shadow.position.y = .028-lift-(model.floorY-floor);
    model.shadow.material.opacity = .25 - sprint*bob*1.12 - airborne*.09;
    model.shadow.scale.set(1+sprint*.05-airborne*.18,1+crouch*.13-airborne*.18,1);

    const blinkTick = (now + model.offset%4100) % 4120;
    appearance(model,position,blinkTick>3970&&blinkTick<4100,blushLevel,woozy,Boolean(sick?.weight>.38));
    if (model.hem.visible) {
      model.hem.scale.set(1+seated*.08,1-seated*.61,1+stride*.10);
      model.hem.rotation.set(-seated*.37-sprint*.12,pendulum*sway*.065,pendulum*sway*.044);
    }
    if (model.skirt.visible) {
      model.skirt.scale.set(1+seated*.12,1-seated*.10-crouch*.24,1+stride*.18+seated*.16);
      model.skirt.rotation.set(-seated*.72-sprint*.085,pendulum*sway*.065,pendulum*sway*.059);
      for (const leg of legs) leg.bottom.visible = seated > .64;
    }
    for (let i=0;i<2;i++) {
      const side = SIDE[i], leg = legs[i];
      if (riding) {
        const foot = passenger?{x:side*bikeRearFit.pegX,y:bikeRearFit.pegY,z:bikeRearFit.pegForward}:bikePedal(side,pedalAngle);
        leg.target.set(foot.x/BODY,(foot.y+.011-body.position.y)/BODY+.130-pelvis.position.y,foot.z/BODY-.046);
        solve(leg,leg.target,forward);
        leg.end.quaternion.copy(globalLower).invert();
        continue;
      }
      const footPhase = (phase + i*.5)%1;
      const swing = clamp((footPhase-stance)/(1-stance));
      const stroke = footPhase < stance ? stance*.5-footPhase : stance*(smooth(swing)-.5);
      const step = clamp(cycleDistance/BODY*stroke*stride,-.38,.38);
      const lift = (.13+sprint*.12)*Math.sin(Math.PI*swing)*stride;
      const dance=acting?.kind==="dance"&&!walking?acting.weight*(1-seated):0;
      const danceStep=dance?Math.sin(acting.time*TAU*1.36+side*Math.PI*.5):0;
      const ankleY = SOLE+lift*(1-seated)+seated*.10+airborne*(.17+i*.05)+Math.max(0,danceStep)*dance*.081;
      leg.target.set(side*(.140+crouch*.033+dance*.044)-pelvis.position.x,ankleY-pelvis.position.y,
        mix(step+crouch*.09,.47,seated)+airborne*(.10+i*.05)+danceStep*dance*.10);
      solve(leg,leg.target,forward);
      const roll = (footPhase < stance ? 0 : Math.sin(swing*TAU)*.24*stride) * (1-seated);
      pitch.setFromAxisAngle(xAxis,roll+seated*.06);
      leg.end.quaternion.copy(globalLower).invert().multiply(pitch);
    }

    for (let i=0;i<2;i++) {
      const side = SIDE[i], arm = arms[i];
      const {pivot,show}=itemPivots[i];
      const prop=itemFor(side),item=prop?.item,spec=prop?.spec,itemAge=prop?.itemAge;
      const spark=item?.kind==="sparkler";
      const eat=prop&&!spark&&item.kind!=="churu"&&itemAge<spec.duration
        ?smooth(Math.min(itemAge/255,(spec.duration-itemAge)/360)):0;
      const toasting=side===clinkSide?clink:0,serving=side===feedingSide?feedPose:0;
      pivot.visible=Boolean(prop);
      const performanceHand=performance.hand(side);
      const fist=performanceHand?.curl<-.8&&acting.weight>.4;
      arm.hand.geometry=fist?fistGeometry[i]:handGeometry[i];
      if (riding) {
        // The driver holds the bars. The rear rider steadies themselves near the driver's waist.
        const grip=passenger?{x:.177,y:.90,z:.44}:{x:bikeFit.gripX,y:bikeFit.gripY,z:bikeFit.gripZ};
        arm.target.set(side*grip.x/BODY,(grip.y-body.position.y)/BODY+.046-pelvis.position.y-chest.position.y,
          grip.z/BODY-.012).applyQuaternion(inverseChest);
        pole.set(side*.5,-.7,-.25);
        solve(arm,arm.target,pole);
        arm.end.quaternion.copy(globalLower).invert().multiply(inverseChest);
        show(null);
        continue;
      }
      let x = side*.385, y = -.015+seated*.09, z = .020+seated*.21;
      z += side*pendulum*sway*(.17+sprint*.10);
      y += sprint*sway*(.050+Math.max(0,side*pendulum)*.12);
      x += side*airborne*.14; y += airborne*.30; z += airborne*.08;
      pole.set(side*.56,-.12,-1);
      const clasping = side === claspSide;
      if (clasping) {
        inverseChest.copy(chest.quaternion).invert();
        clasp.set(side*.608-pelvis.position.x,.930-pelvis.position.y-chest.position.y,.078).applyQuaternion(inverseChest);
        x = clasp.x; y = clasp.y; z = clasp.z;
      } else if (side === umbrellaSide) {
        x=side*.288;y=.385+seated*.075;z=.205;
        if(umbrellaHand&&side!==position.sharedUmbrella){x=position.sharedUmbrella*.065;z=.34;}
        pole.set(side*.67,-.32,-.33);
      } else if (toasting) {
        x=mix(side*.370,side*.055,toasting);
        y=mix(.110,.375,toasting);
        z=mix(.330,.445,toasting)-contact;
        pole.set(side*.8,-.42,-.11);
      } else if (prop) {
        x = side*mix(.370,.170,eat); y = mix(.110,.395,eat); z = mix(.330,.440,eat);
        if (spark) { x = side*.440; y = .150; z = .320; }
        if (serving) {
          x = side*mix(.370,.18,serving);
          y = mix(.110,-.215,serving);
          z = mix(.330,.46,serving);
        }
        pole.set(side*.8,-.69,-.16);
      } else if (pet && side === petSide) {
        const pat = Math.sin(petAge*.018)*.041;
        x = mix(x,side*.290,crouch); y = mix(y,.030+pat,crouch); z = mix(z,.390+pat,crouch);
        pole.set(side*.42,-.48,-.76);
      } else if (performanceHand) {
        x=mix(x,performanceHand.x,acting.weight);y=mix(y,performanceHand.y,acting.weight);
        z=mix(z,performanceHand.z,acting.weight);pole.set(side*.96,-.39,-.28);
      }
      const armEase = wasVisible && !clasping ? 1 - Math.exp(-delta*29) : 1;
      arm.target.set(mix(arm.target.x,x,armEase),mix(arm.target.y,y,armEase),mix(arm.target.z,z,armEase));
      solve(arm,arm.target,pole);
      arm.end.rotation.set((performanceHand?.bend??0)*(acting?.weight??0),0,(performanceHand?.roll??0)*(acting?.weight??0));
      if(prop){
        const hand=toasting?chest.worldToLocal(arm.end.getWorldPosition(grip)):arm.target;
        pivot.position.set(hand.x,hand.y+.015,hand.z+.039);
        if(clasping)pivot.position.x+=side*.13;
        pivot.rotation.set(toasting?-.12*toasting+contact*3:spark?.11:serving?1.81*serving:-.66*eat,0,toasting*.08);
      }
      show(item?.kind??null,serving?feedAge/1000:spark&&item.started?itemAge/1000:-1);
    }
    if(umbrellaOpen&&!model.umbrella){model.umbrella=umbrellaTemplate.clone();model.umbrella.name="umbrella";chest.add(model.umbrella);}
    if(model.umbrella){
      model.umbrella.visible=umbrellaOpen;
      if(umbrellaOpen){
        if(umbrellaSide)model.umbrella.position.copy(arms[umbrellaSide===1?1:0].target);
        else model.umbrella.position.set(0,.43+seated*.075,.15);
        const tilt=umbrellaHand?-position.sharedUmbrella*(umbrellaHand===position.sharedUmbrella?.13:.30):umbrellaSide*.20;
        model.umbrella.rotation.set(-.073,0,tilt+pendulum*sway*.035);
        const width=position.sharedUmbrella?1.35:1;
        model.umbrella.scale.set(width,1,width);
      }
    }

    const reaction = position.emote, age = (clock-reaction?.at)/1000;
    emote.visible = age >= -.3 && age < 3.15 && Boolean(emojiTexture);
    const labelY = (model.hat ? 2.03 : model.hairMesh.geometry === hairGeometry.bun ? 1.90 : 1.84)+
      (riding ? CYCLING_LIFT : seated*(SEAT_LIFT-.107)-crouch*.166);
    if (model.label) model.label.position.y = labelY;
    if (emote.visible) {
      const map = emojiTexture(reaction.emoji);
      if (emote.material.map !== map) { emote.material.map = map; emote.material.needsUpdate = true; }
      model.faceMesh.getWorldPosition(emoteAnchor);
      group.worldToLocal(emoteAnchor);
      emote.position.set(emoteAnchor.x,labelY+.49+.036*Math.sin(now*.009),emoteAnchor.z);
      emote.material.opacity = Math.min(1,(3.15-age)*4);
    }
    updateChat(model,position.chat,clock,chatTexture);
  }

  function dispose(model) {
    clearChat(model);
    model.group.removeFromParent();
    model.shadow.material.dispose();
    model.emote.material.dispose();
    for(const {show} of model.itemPivots)show.dispose();
    if (model.label) {
      model.label.material.map.dispose();
      model.label.material.dispose();
    }
  }

  return {create,update,placeChat,clearChat,dispose};
}
