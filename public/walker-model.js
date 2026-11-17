import {FEED_MS, PET_MS, JUMP_HEIGHT, avatarHands} from "./activities.js";
import {bikeFit,bikePedal,bikeRearFit,makeRidingBike} from "./sejong-bike-model.js";
import {isBikeDriver,isBikePassenger,isCycling} from "./sejong-bike.js";
import {CLINK_DURATION_MS} from "./social-events.js";
import {makeUmbrella,makeWearables} from "./wearables-models.js";
import {alcoholGlasses,alcoholLevel,gestureBody,gestureHands,MAX_ALCOHOL_LEVEL,peaceHandParts} from "./avatar-gestures.js";
import {DINING_TRAY_WIDTH,diningGesture,makeDiningUtensil} from "./dining-dishes.js";
import {FACE_LINES,sculptedHead} from "./avatar-head.js";
import {FACE_SCALE,makeFaceAccessories} from "./avatar-face-accessories.js";
import {HAIR_STYLES,TALL_HAIR,makeHairGeometry} from "./avatar-hair.js";
import {LOOK_OPTIONS,SKIN_TONES} from "./look-options.js";

const TAU = Math.PI * 2;
const HAIR = HAIR_STYLES;
const EYES = LOOK_OPTIONS.eyes;
const BROWS = LOOK_OPTIONS.brows, MOUTHS = LOOK_OPTIONS.mouth;
const OUTFITS = LOOK_OPTIONS.outfit;
const SIDE = [-1, 1];
// Shorter limbs than the first rig; HIP_DROP lowers the hips by the length the legs lost.
const LEG = [.284, .268];
const ARM = [.228, .206];
const HIP_DROP = .070;
const SOLE = .096;
// The rig keeps its limb lengths in body units and the whole body is drawn at BODY scale.
// Proportions sit between the reference sculpt and a chibi: about three and a half heads
// tall with the head resting on the collar, a slim trunk and rounded limbs. Limb lengths
// and joint heights are unchanged, so every pose still fits.
const BODY = .675;
const HEAD = .72;
const WIDE = 1.0;
const HIP = .090, SHOULDER = .236, STANCE = .096, REACH = .76, GESTURE_REACH = .84;
const LIMB = {leg:[.120,.101], roomy:[.136,.114], arm:[.090,.079], bare:[.080,.072], padded:[.104,.091]};
const FOOT = [.76,.84,.74], HAND = .76;
// Keeps the hips at bench height (.57 m) whatever the body scale.
const SEAT_LIFT = .574-(.546-HIP_DROP)*BODY;
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

function tinted(hex, tone) {
  const channel = i => Math.min(255, Math.round(parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) * tone[i]));
  const alpha = hex.length > 7 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
  return `rgba(${channel(0)},${channel(1)},${channel(2)},${alpha.toFixed(3)})`;
}
const EYE_SHAPES = {
  round:{wide:14.4,tall:19.6,tilt:0}, bright:{wide:15.2,tall:20.6,tilt:0,sparkle:true},
  almond:{wide:16.2,tall:15.0,tilt:-.20,wing:1.5}, gentle:{wide:14.6,tall:18.2,tilt:.17},
  sleepy:{wide:15.0,tall:18.4,tilt:.05,lid:.42},
  // Narrower eyes under a firm, straight lid.
  sharp:{wide:15.6,tall:15.6,tilt:-.04,lid:.17,level:true}, fierce:{wide:15.8,tall:13.6,tilt:-.21,lid:.30,level:true}
};

function faceTexture(T, eyes, blink, blushLevel, brows = "soft", mouth = "smile", skin = "light") {
  const colors = FACE_TONES[blushLevel], tone = SKIN_TONES[skin] ?? SKIN_TONES.light;
  const liner = "#2f1f1d", angleOf = height => Math.acos(height) / Math.PI * 256;
  const eyeY = angleOf(FACE_LINES.eye), browY = eyeY - 28.5, mouthY = angleOf(FACE_LINES.mouth);
  const cheekY = angleOf(FACE_LINES.cheek), noseY = angleOf(FACE_LINES.nose) + 4.5, gap = 33;
  return canvasTexture(T, 1024, 512, ctx => {
    ctx.scale(2, 2);
    const complexion = ctx.createLinearGradient(0, 50, 0, 290);
    complexion.addColorStop(0, tinted(colors.top, tone));
    complexion.addColorStop(.5, tinted(colors.middle, tone));
    complexion.addColorStop(1, tinted(colors.chin, tone));
    ctx.fillStyle = complexion;
    ctx.fillRect(0, 0, 512, 256);
    softTint(ctx, 128, 108, 58, tinted(colors.light, tone));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const side of SIDE) {
      const x = 128 + side * gap;
      softTint(ctx, 128 + side * 57, cheekY + 3, colors.radius + 8, tinted(colors.cheek, [1,.94,.94]));
      ctx.strokeStyle = "#4a302a";
      ctx.lineWidth = brows === "straight" || brows === "raised" ? 3.2 : brows === "thick" || brows === "short" ? 5.4
        : brows === "thin" ? 1.5 : 2.5;
      ctx.beginPath();
      if (brows === "droopy") {
        // The outer ends fall away, for a gentle, worried look.
        ctx.moveTo(x - side * 10.5, browY - 2.5);
        ctx.quadraticCurveTo(x + side * 1, browY - 3.5, x + side * 11.5, browY + 4.5);
      } else if (brows === "raised") {
        // Low over the nose and swept up toward the temples.
        ctx.moveTo(x - side * 11, browY + 4);
        ctx.quadraticCurveTo(x + side * 1, browY - .5, x + side * 11.5, browY - 5);
      } else if (brows === "short") {
        ctx.moveTo(x - side * 6.5, browY + .8);
        ctx.lineTo(x + side * 1.5, browY - 1.2);
      } else if (brows === "thick") {
        ctx.moveTo(x - 10, browY + 1.5 + side * .8);
        ctx.quadraticCurveTo(x, browY - 2.5, x + 10, browY + 1.5 - side * .8);
      } else if (brows === "arched") {
        ctx.moveTo(x - side * 11, browY + 3);
        ctx.quadraticCurveTo(x + side * 1, browY - 8, x + side * 11.5, browY + 1.5);
      } else if (brows === "straight") {
        ctx.moveTo(x - 10.5, browY - side * 1.3);
        ctx.lineTo(x + 10.5, browY + side * 1.3);
      } else {
        ctx.moveTo(x - 10, browY + 2 + side * .6);
        ctx.quadraticCurveTo(x, browY - 4, x + 10, browY + 2 - side * .6);
      }
      ctx.stroke();
      if (eyes === "sick") {
        ctx.strokeStyle="#412723";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(x-11,eyeY-3);ctx.quadraticCurveTo(x-3,eyeY+5,x+1,eyeY+3);
        ctx.quadraticCurveTo(x+6,eyeY+2,x+12,eyeY-2);ctx.stroke();
      } else if (eyes === "woozy") {
        const y=eyeY+side*3;
        oval(ctx,x,y,12,9.4,"#ffe9df",side*.15);
        oval(ctx,x-side*2,y+1,5.8,5.5,"#4d302c");
        oval(ctx,x-side*2-1.4,y-.6,1.7,1.5,"#fff0df");
        ctx.strokeStyle="#694033";ctx.lineWidth=2.8;
        ctx.beginPath();ctx.moveTo(x-12,y-1);ctx.quadraticCurveTo(x,y-10+side*2,x+12,y+1);ctx.stroke();
      } else if (blink || eyes === "soft") {
        ctx.strokeStyle = liner;
        ctx.lineWidth = blink ? 3.4 : 4.4;
        ctx.beginPath();
        ctx.moveTo(x - 13.5, eyeY + 3);
        ctx.quadraticCurveTo(x, blink ? eyeY + 11 : eyeY - 14, x + 13.5, eyeY + 3);
        ctx.stroke();
      } else if (eyes === "dot") {
        oval(ctx, x, eyeY + 1, 7.6, 10.2, "#2a1c1c");
        oval(ctx, x - 2.2, eyeY - 2.8, 2.5, 3.1, "#ffffff");
      } else {
        const {wide, tall, tilt, sparkle, lid, level, wing = 0} = EYE_SHAPES[eyes] ?? EYE_SHAPES.round;
        ctx.save();
        ctx.translate(x, eyeY);
        ctx.rotate(side * tilt);
        oval(ctx, 0, 0, wide, tall, "#fffaf3");
        const iris = ctx.createLinearGradient(0, -tall, 0, tall);
        iris.addColorStop(0, "#2b1a17"); iris.addColorStop(.5, "#5b3827"); iris.addColorStop(1, sparkle ? "#b98658" : "#96633f");
        // Under a straight lid the iris is a smaller circle, partly covered.
        const [irisWide, irisTall] = level ? [tall * .80, tall * .88] : [wide * .80, tall * .86];
        oval(ctx, 0, level ? -.6 : 1.1, irisWide, irisTall, iris);
        oval(ctx, 0, level ? -.8 : .2, irisWide * .50, irisTall * .51, "#1d1213");
        oval(ctx, -wide * .30, -tall * .38, wide * .30, tall * .23, "#ffffff", -.3);
        oval(ctx, wide * .30, tall * .42, wide * .15, tall * .11, "#ffe6c8");
        if (sparkle) { oval(ctx, wide * .26, -tall * .14, wide * .12, tall * .09, "#ffffff"); oval(ctx, -wide * .10, tall * .50, wide * .22, tall * .10, "#ffd9a8"); }
        if (lid) {
          // A heavy upper lid covers the top of the eye.
          ctx.fillStyle = tinted(colors.middle, tone);
          ctx.fillRect(-wide - 3, -tall - 4, wide * 2 + 6, tall * 2 * lid + 4);
        }
        const top = lid ? -tall + tall * 2 * lid : -tall;
        ctx.strokeStyle = liner;
        ctx.lineWidth = 4.3;
        ctx.beginPath();
        if (level) { ctx.lineWidth = 5.2; ctx.moveTo(-side * (wide + 1.5), top + 2.2); ctx.lineTo(side * (wide + 4.2), top - 1.4); }
        else if (lid) { ctx.moveTo(-wide - 1.5, top + 2.5); ctx.quadraticCurveTo(0, top - 2.5, wide + 1.5, top + 2.5); }
        else { ctx.moveTo(-wide - 1.2, -tall * .20); ctx.bezierCurveTo(-wide * .82, -tall * 1.20, wide * .82, -tall * 1.20, wide + 1.2, -tall * .20); }
        ctx.stroke();
        // Lashes flick outward at the corner.
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        const cornerY = lid ? top + 2.5 : -tall * .20;
        if (level) {
          // No lashes: the lid simply turns down at the outer corner.
          ctx.moveTo(side * (wide + 4.0), top - 1.2);
          ctx.lineTo(side * (wide + 1.2), top + tall * .62);
        } else {
          ctx.moveTo(side * (wide + .8), cornerY);
          ctx.lineTo(side * (wide + 5.6 + wing), cornerY - 5.2 - wing);
          ctx.moveTo(side * (wide - .5), cornerY - tall * .26);
          ctx.lineTo(side * (wide + 3.6), cornerY - tall * .26 - 5);
        }
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#5a3a33";
        ctx.beginPath();
        ctx.moveTo(side * wide * .15, tall + .6);
        ctx.quadraticCurveTo(side * wide * .82, tall * .86, side * (wide + .4), tall * .34);
        ctx.stroke();
        ctx.restore();
      }
    }
    oval(ctx, 128, noseY, 2.4, 1.2, tinted("#cf8d73a8", tone));
    if(eyes==="sick"){oval(ctx,128,mouthY,4.4,5.4,"#6e3a35");return;}
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#8a4a40";
    ctx.beginPath();
    if (mouth === "peace") {
      ctx.moveTo(115, mouthY - 5);
      ctx.quadraticCurveTo(128, mouthY + 18, 141, mouthY - 5);
      ctx.quadraticCurveTo(128, mouthY + 2, 115, mouthY - 5);
      ctx.closePath();
      ctx.fillStyle = "#742c2c";ctx.fill();
      ctx.save();ctx.clip();
      ctx.fillStyle = "#fff4de";ctx.fillRect(116, mouthY - 5, 24, 7);
      ctx.restore();
    } else if (mouth === "grin") {
      // An open smile showing a strip of teeth.
      ctx.moveTo(119, mouthY - 3.5);
      ctx.quadraticCurveTo(128, mouthY + 11, 137, mouthY - 3.5);
      ctx.closePath();
      ctx.fillStyle = "#8f4038";ctx.fill();
      ctx.fillStyle = "#fff6ea";ctx.fillRect(122.4, mouthY - 3.1, 11.2, 2.7);
    } else if (mouth === "calm") {
      ctx.moveTo(123, mouthY);
      ctx.quadraticCurveTo(128, mouthY + 1.8, 133, mouthY);
    } else if (mouth === "cat") {
      ctx.moveTo(120.5, mouthY - 1.5);
      ctx.quadraticCurveTo(124, mouthY + 4, 128, mouthY - .5);
      ctx.quadraticCurveTo(132, mouthY + 4, 135.5, mouthY - 1.5);
    } else if (mouth === "pout") {
      ctx.fillStyle = "#c9665f";
      ctx.ellipse(128, mouthY, 3.4, 2.6, 0, 0, TAU);ctx.fill();ctx.beginPath();
    } else {
      ctx.moveTo(121, mouthY - 2.5);
      ctx.quadraticCurveTo(128, mouthY + 5.5, 135, mouthY - 2.5);
    }
    ctx.stroke();
  });
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
    } else if (style === "hoodie") {
      // Kangaroo pocket and a ribbed hem.
      ctx.strokeStyle = "#5a504e66"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(97,200); ctx.lineTo(104,158); ctx.lineTo(152,158); ctx.lineTo(159,200); ctx.stroke();
      for (let x = 0; x < 256; x += 5) { ctx.fillStyle = "#45352822"; ctx.fillRect(x,224,2,32); }
    } else if (style === "knit") {
      for (let x = 0; x < 256; x += 6) {
        ctx.fillStyle = "#4535281c"; ctx.fillRect(x,0,2,256);
        ctx.fillStyle = "#fffaf038"; ctx.fillRect(x+3,0,1,256);
      }
      // A cable twisting down the front.
      ctx.strokeStyle = "#5a463a55"; ctx.lineWidth = 2.2;
      for (let y = 18; y < 214; y += 14) {
        ctx.beginPath(); ctx.moveTo(120,y); ctx.quadraticCurveTo(136,y+7,120,y+14);
        ctx.moveTo(136,y); ctx.quadraticCurveTo(120,y+7,136,y+14); ctx.stroke();
      }
      for (let x = 0; x < 256; x += 4) { ctx.fillStyle = "#45352826"; ctx.fillRect(x,222,2,34); }
    } else if (style === "shirt") {
      ctx.fillStyle = "#ffffff55"; ctx.fillRect(122,0,12,256);
      ctx.fillStyle = "#5a504e44"; ctx.fillRect(122,0,1,256); ctx.fillRect(133,0,1,256);
      for (let y = 44; y < 240; y += 44) {
        ctx.fillStyle = "#fbf7ee"; ctx.beginPath(); ctx.arc(128,y,3.4,0,TAU); ctx.fill();
        ctx.strokeStyle = "#6b5f5880"; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.strokeStyle = "#6b5f5870"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.roundRect(146,72,19,23,2); ctx.stroke();
    } else if (style === "dress") {
      for (let row = 0; row < 12; row++) for (let column = 0; column < 12; column++) {
        ctx.fillStyle = "#fffaf0a8";
        ctx.beginPath(); ctx.arc(column*22+(row%2)*11+5,row*21+9,2.6,0,TAU); ctx.fill();
      }
    } else if (style === "stripes") {
      for (let y = 6; y < 256; y += 18) { ctx.fillStyle = "#3f587fcc"; ctx.fillRect(0,y,256,8); }
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

// Named hair colours; walkers who have not chosen one get a shade from their name.
const HAIR_COLORS = {black:0x2a2326, dark:0x46312e, brown:0x6a4733, chestnut:0x8b6340, plum:0x3b2d3d, honey:0xa77b4c,
  auburn:0x7d3d2b, blonde:0xd8b473, ash:0x8f8b88, pink:0xd88c9c};
const HAIR_SHADES = ["black","dark","brown","chestnut","plum","honey","dark"];

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
  const makeUtensil=makeDiningUtensil(T);
  const wearables=makeWearables(T),umbrellaTemplate=makeUmbrella(T);
  const sphere = new T.SphereGeometry(1,16,12);
  const head = sculptedHead(T);
  const faceAccessories = makeFaceAccessories(T,head);
  const shadowGeometry = new T.CircleGeometry(.30,24);
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
  // A short jacket worn open over a tee, and the strap of a crossbody bag.
  const jacketShell = coatShell(T,[[.262,-.150],[.276,-.128],[.272,.06],[.286,.262],
    [.296,.366],[.266,.436],[.184,.486],[.146,.489]],.54,.86);
  const jacketCollar = collarPanels(T,SIDE.map(side=>[[.060,.474],[.176,.432],[.186,.330],[.120,.268],[.070,.372]]
    .map(([x,y])=>[x*side,y])));
  const strapGeometry = new T.TorusGeometry(.318,.013,6,36);
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
  for (const style of ["jacket","knit","shirt","dress","overalls","suit","school","shorts"]) torsoGeometry[style] = torsoGeometry.tee;
  torsoGeometry.hoodie = roundedLathe(T,[[0,-.150],[.232,-.150],[.262,-.138],[.270,-.108],[.260,-.088],[.262,.06],
    [.270,.25],[.266,.365],[.232,.432],[.168,.474],[.122,.478],[0,.478]],.76,28);
  torsoGeometry.varsity = torsoGeometry.hoodie;
  const hoodRing = new T.TorusGeometry(.150,.050,10,26).rotateX(Math.PI/2);
  const neckRib = new T.TorusGeometry(.124,.034,8,24).rotateX(Math.PI/2);
  // Collars are drawn around their own base line so they can lean back against the chest.
  const shirtCollar = collarPanels(T,SIDE.map(side=>[[.014,.050],[.150,.040],[.138,-.044],[.026,-.014]].map(([x,y])=>[x*side,y])));
  const roundCollar = collarPanels(T,SIDE.map(side=>[[.010,.048],[.110,.050],[.150,.020],[.146,-.022],[.100,-.050],[.040,-.044],[.010,-.012]]
    .map(([x,y])=>[x*side,y])));
  const bibGeometry = new T.ExtrudeGeometry(new T.Shape([[-.100,.300],[.100,.300],[.112,.282],[.132,-.030],[-.132,-.030],[-.112,.282]]
    .map(([x,y])=>new T.Vector2(x,y))),{depth:.014,bevelThickness:.007,bevelSize:.007,bevelSegments:1,steps:1});
  // Hair is built the first time a style is worn.
  const hairGeometries = new Map(), hairMaterials = new Map();
  const hairGeometry = style => {
    if (!hairGeometries.has(style)) hairGeometries.set(style,makeHairGeometry(T,style));
    return hairGeometries.get(style);
  };
  const hairMaterial = name => {
    if (!hairMaterials.has(name)) hairMaterials.set(name,new T.MeshStandardMaterial({
      color:HAIR_COLORS[name],vertexColors:true,roughness:.66,side:T.DoubleSide}));
    return hairMaterials.get(name);
  };
  const textileStyles = ["puffer","tee","hanbok","hoodie","knit","shirt","dress"];
  const garmentMaps = Object.fromEntries(textileStyles.map(style => [style,garmentTexture(T,style)]));
  const faces = new Map(), clothes = new Map();
  const matte = (color, roughness = .84) => new T.MeshStandardMaterial({color,roughness});
  const details = new T.MeshStandardMaterial({vertexColors:true,roughness:.86});
  // Each skin tone has a plain material, and a multiplier for parts whose colour is baked in.
  const skinBase = new T.Color(0xf0bc99), skinSets = new Map();
  function skinSet(name) {
    if (!skinSets.has(name)) {
      const tone = SKIN_TONES[name], srgb = skinBase.clone().convertLinearToSRGB();
      const colour = new T.Color().setRGB(Math.min(1,srgb.r*tone[0]),Math.min(1,srgb.g*tone[1]),Math.min(1,srgb.b*tone[2]),T.SRGBColorSpace);
      const factor = new T.Color(colour.r/skinBase.r,colour.g/skinBase.g,colour.b/skinBase.b);
      skinSets.set(name,{plain:matte(colour),baked:new T.MeshStandardMaterial({color:factor,vertexColors:true,roughness:.86}),
        ears:Array.from({length:MAX_ALCOHOL_LEVEL+1},(_,level)=>new T.MeshStandardMaterial({
          color:new T.Color(0xffffff).lerp(new T.Color(0xff8f9c),level/MAX_ALCOHOL_LEVEL).multiply(factor),vertexColors:true,roughness:.86
        }))});
    }
    return skinSets.get(name);
  }
  const skin = skinSet("light").plain, earMaterials = skinSet("light").ears;
  const hanbokPants = matte(0xb9b295);
  const trousers = {coat:matte(0x3f4452),puffer:matte(0x4d6787),tee:matte(0xc7b089),hanbok:hanbokPants,jacket:matte(0x5d7193),
    hoodie:matte(0x8d919b),knit:matte(0x6f5b4b),shirt:matte(0x353f58),dress:matte(0xf0e6d6),
    varsity:matte(0x5d7193),shorts:matte(0x6d7f99)};
  const whiteShirt = new T.MeshStandardMaterial({color:0xf7f3ea,map:garmentMaps.shirt,roughness:.9}), navySock = matte(0x2f3a55);
  const stripedTee = new T.MeshStandardMaterial({color:0xf6f0e4,map:garmentTexture(T,"stripes"),roughness:.92});
  const brass = matte(0xd9b25f,.5), beltLeather = matte(0x3a2c26,.6);
  const innerTee = matte(0xf3ede0), bagLeather = matte(0xb98a5a,.7), bagStrap = matte(0x8a6442,.7);
  const pants = trousers.coat;
  const ivory = matte(0xf0debd), hairpin = matte(0xdfb475), scarfCloth = matte(0xf2e4c8,.95);
  const earGeometry = modeledDetails(T,sphere,SIDE.flatMap(side => [
    [0xf0bc99,side*.374,-.100,-.010,.062,.092,.050], [0xd8947e,side*.404,-.098,.022,.024,.050,.017]
  ]));
  const shoe = (sole,upper,toe) => modeledDetails(T,sphere,[
    [sole,0,-.100,.046,.136,.030,.200],[upper,0,-.050,.042,.134,.072,.194],[toe,0,.010,.100,.080,.012,.024]
  ]);
  const footGeometries = {
    coat:shoe(0xcdbda2,0x5a4034,0x7a5a48), puffer:shoe(0xf2efe8,0xf7f4ee,0xd8dde4),
    tee:shoe(0xf2efe8,0xe9695b,0xf7f4ee), hanbok:shoe(0xe9e1cf,0xf6f1e6,0xc65a52),
    jacket:shoe(0xf4f1ea,0xfaf8f3,0xcfd5dc), hoodie:shoe(0xf2efe8,0xf7f4ee,0x9aa3b0), knit:shoe(0xcdbda2,0x6a4a38,0x86624c),
    shirt:shoe(0x2c2a2c,0x3a363b,0x4c484e), dress:shoe(0xf6f1e6,0xa33f43,0xf6f1e6), overalls:shoe(0xf2efe8,0xe2b23f,0xf7f4ee),
    varsity:shoe(0xf2efe8,0xf7f4ee,0xc24f45), suit:shoe(0x2c2a2c,0x3a363b,0x4c484e), school:shoe(0x2c2a2c,0x4a3a34,0x5a4a44),
    shorts:shoe(0xf2efe8,0x4f8fb0,0xf7f4ee)
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
  const peaceGeometry=SIDE.map(side=>modeledDetails(T,sphere,peaceHandParts(side)));
  const knotGeometry = modeledDetails(T,sphere,[
    [0xc97c66,0,0,0,.048,.036,.027],[0xc97c66,-.045,-.017,.007,.062,.023,.016,-.36],
    [0xc97c66,.048,.008,.004,.056,.023,.016,.26],[0xc97c66,.042,-.075,.011,.020,.072,.012,.27],
    [0xf0debd,.073,-.062,.007,.017,.059,.011,.53]
  ]);
  const buttonsGeometry = modeledDetails(T,sphere,[
    [0xc1a184,.095,.10,.217,.016,.016,.011],[0xc1a184,.095,.198,.214,.016,.016,.011],
    [0xc1a184,.095,.285,.213,.016,.016,.011]
  ]);

  function faceMaterial(eye, blink, blush, brows = "soft", mouth = "smile", tone = "light") {
    const key = `${eye}/${blink}/${blush}/${brows}/${mouth}/${tone}`;
    if (!faces.has(key)) faces.set(key, new T.MeshStandardMaterial({
      color:0xffffff, map:faceTexture(T,eye,blink,blush,brows,mouth,tone), roughness:.84
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
    const pelvis = joint(body,0,.705-HIP_DROP), chest = joint(pelvis,0,.045);
    // Clothes are widened around the trunk; the limbs keep their own joints.
    const garb = joint(chest), lower = joint(pelvis);
    garb.scale.set(WIDE,1,WIDE);
    lower.scale.set(WIDE,1,WIDE);
    const palette = outfitMaterials(coat ?? 0xab5947);
    const torso = part(garb,torsoGeometry.coat,palette.lining,0,0,0,1,1,1);
    const waist = part(lower,sphere,pants,0,-.036,0,.190,.108,.132);
    // Skin just inside the collar; kept flat so only the neck itself stands above the clothes.
    const collarbone = part(garb,sphere,skin,0,.462,0,.092,.026,.088);
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
    // Open jacket over a tee, with a small bag slung across the body.
    const jacket = joint(garb), bag = joint(garb);
    part(jacket,jacketShell,palette.outer,0,0,0,1,1,1);
    part(jacket,jacketCollar,palette.trim,0,0,.214,1,1,1);
    const strap = part(bag,strapGeometry,bagStrap,-.012,.214,.004,.84,.60,1);
    // The strap runs from the right shoulder to the left hip.
    strap.rotation.order="ZXY";strap.rotation.set(Math.PI/2,0,.62);
    const pouch = part(bag,sphere,bagLeather,-.236,-.008,.196,.094,.066,.048);
    pouch.rotation.z=.5;
    part(bag,sphere,bagStrap,-.236,.030,.226,.070,.012,.020).rotation.z=.5;
    // Hoodie: the hood bunched behind the neck and two drawstrings.
    const hoodie = joint(garb);
    part(hoodie,hoodRing,palette.sleeve,0,.458,-.016,1,1.2,1);
    part(hoodie,sphere,palette.sleeve,0,.420,-.176,.196,.150,.108).rotation.x = .42;
    for (const side of SIDE) {
      part(hoodie,sphere,ivory,side*.046,.350-side*.008,.236,.010,.074,.010);
      part(hoodie,sphere,brass,side*.046,.272-side*.008,.238,.013,.016,.012);
    }
    // Knit: a ribbed neck and hem in the trim colour.
    const knit = joint(garb);
    part(knit,neckRib,palette.trim,0,.466,.002,1,1.25,1);
    part(knit,sphere,palette.trim,0,-.088,0,.250,.050,.180);
    // Shirt: a pointed collar, tucked in under a belt.
    const shirt = joint(garb);
    const shirtWings = part(shirt,shirtCollar,palette.collar,0,.438,.128,1,1,1);
    shirtWings.rotation.x = -.62;
    const belt = joint(lower);
    part(belt,sphere,beltLeather,0,.050,0,.200,.028,.142);
    part(belt,sphere,brass,0,.050,.136,.026,.022,.010);
    // Dress: a round collar, a ribbon at the waist and a skirt to the knee.
    const dress = joint(garb);
    const dressCollar = part(dress,roundCollar,ivory,0,.440,.128,1,1,1);
    dressCollar.rotation.x = -.62;
    part(dress,sphere,palette.trim,0,-.074,0,.252,.030,.184);
    part(dress,knotGeometry,details,0,-.070,.176,1,1,1);
    const dressSkirt = part(lower,skirtGeometry,palette.chima,0,.094,0,.92,.50,.92);
    // Overalls: a bib and straps over a striped tee.
    const overalls = joint(garb);
    part(overalls,bibGeometry,palette.outer,0,0,.172,1,1,1);
    part(overalls,sphere,palette.outer,0,-.074,0,.254,.060,.186);
    part(overalls,sphere,palette.trim,0,.150,.196,.074,.052,.010);
    for (const side of SIDE) {
      const strap = part(overalls,sphere,palette.outer,side*.108,.392,.092,.030,.118,.020);
      strap.rotation.x = -.74;
      const back = part(overalls,sphere,palette.outer,side*.090,.300,-.176,.030,.200,.020);
      back.rotation.set(.16,0,side*.20);
      part(overalls,sphere,brass,side*.106,.290,.192,.018,.018,.010);
    }
    // Varsity jacket: ribbed neck and hem, snap buttons and a chest patch.
    const varsity = joint(garb);
    part(varsity,neckRib,palette.trim,0,.466,.002,1.04,1.2,1.04);
    part(varsity,sphere,palette.trim,0,-.132,0,.262,.044,.196);
    for (let i = 0; i < 4; i++) part(varsity,sphere,ivory,0,.34-i*.115,.208-(i===0?.012:0),.014,.014,.010);
    part(varsity,sphere,ivory,-.110,.300,.176,.040,.046,.012);
    // Suit and school uniform share a tie; the uniform wears a ribbon-sized one.
    const tie = joint(garb);
    const tieKnot = part(tie,sphere,palette.trim,0,.418,.146,.026,.024,.018);
    const tieBlade = part(tie,sphere,palette.trim,0,.270,.182,.030,.150,.012);
    const hanbokDetails = joint(garb);
    part(hanbokDetails,jeogoriCollar,ivory,0,0,.186,1,1,1);
    part(hanbokDetails,knotGeometry,details,.066,.31,.190,1,1,1);
    const skirt = part(lower,skirtGeometry,palette.chima,0,.259,0,1,1,1);

    // A short neck shows between the collar and the chin.
    const neck = part(chest,sphere,skin,0,.500,.000,.066,.080,.064);
    const headJoint = joint(chest,0,.487,.011);
    headJoint.scale.setScalar(HEAD/BODY);
    const face = joint(headJoint,0,.334,.012);
    // The whole head is a touch narrower than it is deep; hair and hats follow.
    face.scale.set(.93,1,1);
    // Hats were shaped around a plain ball; this fits them to the taller, fuller skull.
    const headwear = joint(face);
    headwear.scale.set(1.14,1.14,1.06);
    const faceMesh = part(face,head,faceMaterial("round",false,0),0,0,0,...FACE_SCALE);
    const ears = part(face,earGeometry,earMaterials[0],0,0,0,1,1,1);
    let offset = 0;
    for (const letter of String(seedName ?? nickname ?? "")) offset = (offset * 31 + letter.charCodeAt(0)) >>> 0;
    const hairMesh = part(face,hairGeometry("short"),hairMaterial(HAIR_SHADES[offset % HAIR_SHADES.length]),0,0,0,1,1,1);
    const pin = part(face,sphere,hairpin,.262,.196,.262,.050,.016,.012);
    pin.rotation.z = .5;
    const accessories = faceAccessories.create(face);

    const legs = SIDE.map(side => {
      const leg = chain(pelvis,side*HIP,-.014,LEG,LIMB.leg,pants);
      leg.foot = part(leg.end,footGeometry,details,0,0,0,...FOOT);
      return leg;
    });
    const arms = SIDE.map((side,i) => {
      const arm = chain(chest,side*SHOULDER,.412,ARM,LIMB.arm,palette.sleeve);
      arm.cuff = part(arm.lower,sphere,palette.trim,0,-.184,0,.084,.034,.084);
      arm.shortSleeve = part(arm.upper,shortSleeve,palette.sleeve,0,0,0,.090,.150,.090);
      arm.hand=part(arm.end,handGeometry[i],details,0,0,0,HAND,HAND,HAND);
      return arm;
    });
    const itemPivots=SIDE.map(()=>{
      const pivot=joint(chest);pivot.scale.setScalar(1/BODY);pivot.visible=false;
      return {pivot,show:createItemProp(pivot)};
    });
    const tray=joint(chest,0,.112,.408);
    tray.name="Two-handed meal tray";tray.scale.setScalar(.91/BODY);tray.visible=false;
    const showTray=createItemProp(tray);
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
    return {group,body,floorY:null,headwear,bag,varsity,tie,tieBlade,hoodie,knit,shirt,belt,dress,dressSkirt,overalls,skinParts:[collarbone,neck],skin:skinSet("light"),teeHem,pelvis,chest,torso,waist,face,garb,faceMesh,ears,headJoint,hairMesh,pin,overcoat,hem,pufferCollar,hanbokDetails,jacket,skirt,legs,arms,label,
      accessories,shadow,emote,chatSprite:null,chatMessage:null,itemPivots,tray,showTray,utensil:null,palette,offset,phase:(offset%100)/100,
      stride:0,sprint:0,seatBlend:0,petBlend:0,appearance:"",lastX:null,lastY:null,bike:null,hat:null,charm:null,umbrella:null};
  }

  const down = new T.Vector3(0,-1,0), forward = new T.Vector3(0,0,1);
  const target = new T.Vector3(), direction = new T.Vector3(), elbow = new T.Vector3(), bend = new T.Vector3();
  const pole = new T.Vector3(), clasp = new T.Vector3(), grip = new T.Vector3(), globalLower = new T.Quaternion();
  const emoteAnchor = new T.Vector3(), chatAnchor = new T.Vector3();
  const pitch = new T.Quaternion(), inverseChest = new T.Quaternion();
  const xAxis = new T.Vector3(1,0,0);
  const peaceWrist = new T.Euler();

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

  function appearance(model, position, blink, blush, woozy, sick, mouthOverride) {
    const look = position.look;
    const hair = HAIR.includes(look?.hair) ? look.hair : position.character === "woman" ? "long" : "short";
    const eyes = EYES.includes(look?.eyes) ? look.eyes : "round";
    const brows = BROWS.includes(look?.brows) ? look.brows : "soft";
    const mouth = mouthOverride ?? (MOUTHS.includes(look?.mouth) ? look.mouth : "smile");
    const tone = LOOK_OPTIONS.skin.includes(look?.skin) ? look.skin : "light";
    const hairColor = Object.hasOwn(HAIR_COLORS,look?.hairColor) ? look.hairColor : HAIR_SHADES[model.offset % HAIR_SHADES.length];
    const woman = position.character === "woman";
    const outfit = OUTFITS.includes(look?.outfit) ? look.outfit : "coat";
    const chima = outfit === "hanbok" && position.character === "woman";
    const headwear=Object.hasOwn(wearables.headwear,look?.headwear)?look.headwear:"none";
    const keepsake=Object.hasOwn(wearables.keepsakes,look?.keepsake)?look.keepsake:"none";
    const glasses=look?.glasses??"none", beard=look?.beard??"none";
    const key = `${hair}/${eyes}/${outfit}/${chima}/${headwear}/${keepsake}/${woman}/${tone}/${hairColor}/${glasses}/${beard}`;
    if (key !== model.appearance) {
      model.appearance = key;
      model.hairMesh.geometry = hairGeometry(hair);
      model.hairMesh.material = hairMaterial(hairColor);
      faceAccessories.apply(model.accessories,glasses,beard,HAIR_COLORS[hairColor]);
      model.tallHair = TALL_HAIR.has(hair);
      model.skin = skinSet(tone);
      for (const mesh of model.skinParts) mesh.material = model.skin.plain;
      for (const arm of model.arms) arm.hand.material = model.skin.baked;
      model.pin.visible = hair === "bob"&&headwear==="none";
      model.hat?.removeFromParent();model.charm?.removeFromParent();
      model.hat=wearables.headwear[headwear]?.clone()??null;
      model.charm=wearables.keepsakes[keepsake]?.clone()??null;
      if(model.hat){model.hat.name=headwear;model.headwear.add(model.hat);}
      if(model.charm){model.charm.name=keepsake;model.garb.add(model.charm);}
      model.torso.geometry = torsoGeometry[outfit];
      const uniform = outfit === "school", pleats = uniform && woman;
      model.torso.material = outfit === "coat" ? model.palette.lining : outfit === "jacket" ? innerTee
        : outfit === "overalls" ? stripedTee : outfit === "varsity" ? model.palette.sleeve
        : outfit === "suit" || uniform ? whiteShirt : model.palette.tops[outfit === "shorts" ? "tee" : outfit];
      model.jacket.visible = outfit === "jacket" || outfit === "suit";
      model.bag.visible = outfit === "jacket";
      model.varsity.visible = outfit === "varsity";
      model.tie.visible = outfit === "suit" || uniform;
      model.tieBlade.scale.y = uniform ? .070 : .150;
      model.tieBlade.position.y = uniform ? .350 : .270;
      model.tieBlade.position.z = uniform ? .166 : .182;
      model.hoodie.visible = outfit === "hoodie";
      model.knit.visible = outfit === "knit";
      model.shirt.visible = outfit === "shirt" || outfit === "suit" || uniform;
      model.belt.visible = outfit === "shirt" || uniform && !woman;
      model.dress.visible = outfit === "dress";
      model.dressSkirt.visible = outfit === "dress" || pleats;
      model.overalls.visible = outfit === "overalls";
      // Men are a little broader across the shoulders, women narrower with slimmer arms.
      const build = woman ? .95 : 1.07;
      model.garb.scale.set(WIDE*build,1,WIDE*(woman ? .96 : 1.02));
      model.arms.forEach((arm,i)=>{arm.upper.position.x=SIDE[i]*SHOULDER*build;});
      model.torso.scale.set(chima ? .94 : 1,1,chima ? .94 : 1);
      model.overcoat.visible = model.hem.visible = outfit === "coat";
      model.pufferCollar.visible = outfit === "puffer";
      model.teeHem.visible = outfit === "tee" || outfit === "shorts";
      model.hanbokDetails.visible = outfit === "hanbok";
      model.skirt.visible = chima;
      model.waist.material = outfit === "overalls" ? model.palette.sleeve : outfit === "suit" || uniform ? model.palette.trim
        : trousers[outfit];
      for (const leg of model.legs) {
        const roomy = outfit === "hanbok" && !chima;
        const bareLegs = outfit === "dress" || pleats;
        leg.top.material = bareLegs ? model.skin.plain : model.waist.material;
        // Shorts leave the shins bare; a uniform skirt comes with knee socks.
        leg.bottom.material = pleats ? navySock : bareLegs || outfit === "shorts" ? model.skin.plain : model.waist.material;
        leg.foot.geometry = footGeometries[outfit];
        const [thigh,calf] = roomy ? LIMB.roomy : outfit === "shorts" ? [LIMB.roomy[0],LIMB.leg[1]*.92] : LIMB.leg;
        leg.top.scale.set(thigh,LEG[0],thigh*.97);
        leg.bottom.scale.set(calf,LEG[1],calf*.97);
        leg.top.visible = !chima;
        leg.bottom.visible = !chima;
      }
      for (const arm of model.arms) {
        const bare = outfit === "tee" || outfit === "dress" || outfit === "shorts", padded = outfit === "puffer";
        const roomy = padded || outfit === "hoodie" || outfit === "varsity";
        arm.top.geometry = arm.bottom.geometry = padded ? paddedSleeve : segment;
        arm.top.material = arm.bottom.material = bare ? model.skin.plain : padded ? model.palette.padded
          : outfit === "overalls" ? stripedTee : outfit === "varsity" || uniform ? innerTee : model.palette.sleeve;
        const slim = woman ? .94 : 1;
        const [upperRadius,lowerRadius] = (bare ? LIMB.bare : roomy ? LIMB.padded : LIMB.arm).map(radius=>radius*slim);
        arm.top.scale.set(upperRadius,ARM[0],upperRadius);
        arm.bottom.scale.set(lowerRadius,ARM[1],lowerRadius);
        arm.cuff.visible = !bare;
        arm.shortSleeve.visible = bare;
      }
    }
    const expression=sick?"sick":woozy?"woozy":eyes;
    model.faceMesh.material = faceMaterial(expression,expression===eyes&&blink,blush,brows,mouth,tone);
    model.ears.material = model.skin.ears[blush];
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

  function update(model, position, {now,clock,delta=1/60,seat,floor=0,jump=0,emojiTexture,chatTexture,turnEase=1,steeringGrips}) {
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
    const {claspSide,feedAge,feeding,petAge,petting:pet,petSide,umbrellaHand,itemFor,feedingSide,tray}=hands;
    const carryingTray=Boolean(tray&&!seat&&!riding);
    const eatingMeal=diningGesture(tray,seat);
    model.tray.visible=carryingTray;model.showTray(carryingTray?tray.item.kind:null);
    if(eatingMeal&&!model.utensil){
      model.utensil=makeUtensil(chest);
      model.utensil.group.name="Eating utensil";
      model.utensil.group.scale.setScalar(1/BODY);
    }
    model.utensil?.show(eatingMeal?.utensil);
    const feedPose = feeding ? smooth(Math.min(feedAge/320,(FEED_MS-feedAge)/360)) : 0;
    const petPose = pet ? smooth(Math.min(petAge/235,(PET_MS-petAge)/275)) : 0;
    const clinkEvent=position.clink,clinkAge=clock-clinkEvent?.startedAt;
    const clinkSide=clinkEvent?.slot==="secondItem"?-1:1;
    const clink=itemFor(clinkSide)?.spec.verb==="마시기"&&!seat&&!claspSide&&clinkAge>=0&&clinkAge<CLINK_DURATION_MS
      ? smooth(Math.min(clinkAge/600,(CLINK_DURATION_MS-clinkAge)/730)) : 0;
    const contact=clink?Math.max(0,1-Math.abs(clinkAge-900)/170)*.045:0;
    const performance=gestureHands(position,clock,hands,{riding,busy:Boolean(clink||carryingTray||eatingMeal)});
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
        .691-HIP_DROP+bob-strideDip+idleRise+breath*.004-seated*.145-crouch*.225+(bodyPose?.y??0)*idleGesture,0);
      chest.rotation.set(.020+sprint*.13+crouch*.34+seated*.03+clink*.22+(eatingMeal?.dip??0)*.13+(bodyPose?.pitch??0)*idleGesture,
        pendulum*sway*.10+(bodyPose?.yaw??0)*idleGesture,pendulum*sway*.065+(bodyPose?.roll??0)*idleGesture+wobble*.41);
      headJoint.rotation.set(-.030-sprint*.070+crouch*.16+(eatingMeal?.dip??0)*.18+(eatingMeal?.lift??0)*.078+(bodyPose?.headPitch??0)*idleGesture,
        -pendulum*sway*.05+wobble*.65,breath*.020-pendulum*sway*.045+(bodyPose?.headRoll??0)*idleGesture+wobble);
    }
    body.rotation.z=-(fall?.weight??0)*1.48;
    model.shadow.visible = !seat;
    model.shadow.position.y = .028-lift-(model.floorY-floor);
    model.shadow.material.opacity = .25 - sprint*bob*1.12 - airborne*.09;
    model.shadow.scale.set(1+sprint*.05-airborne*.18,1+crouch*.13-airborne*.18,1);

    const blinkTick = (now + model.offset%4100) % 4120;
    const smiling = acting?.kind==="peace"&&acting.weight>.26;
    const snack=position[position.itemUse==="secondItem"?"secondItem":"item"];
    const biteAge=clock-snack?.started;
    const taste=biteAge>=410&&biteAge<1250?{bungeoppang:"grin",bungeoppangCustard:"grin",bungeoppangBurnt:"pout",bungeoppangTorn:"cat"}[snack.kind]:null;
    appearance(model,position,blinkTick>3970&&blinkTick<4100,blushLevel,woozy,Boolean(sick?.weight>.38),smiling?"peace":taste);
    if (model.hem.visible) {
      model.hem.scale.set(1+seated*.08,1-seated*.61,1+stride*.10);
      model.hem.rotation.set(-seated*.37-sprint*.12,pendulum*sway*.065,pendulum*sway*.044);
    }
    if (model.skirt.visible) {
      model.skirt.scale.set(1+seated*.12,1-seated*.10-crouch*.24,1+stride*.18+seated*.16);
      model.skirt.rotation.set(-seated*.72-sprint*.085,pendulum*sway*.065,pendulum*sway*.059);
      for (const leg of legs) leg.bottom.visible = seated > .64;
    }
    if (model.dressSkirt.visible) {
      model.dressSkirt.scale.set(.92*(1+seated*.10),.50*(1-seated*.16),.92*(1+stride*.14+seated*.20));
      model.dressSkirt.rotation.set(-seated*.80-sprint*.085,pendulum*sway*.065,pendulum*sway*.059);
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
      const step = clamp(cycleDistance/BODY*stroke*stride,-.31,.31);
      const lift = (.13+sprint*.12)*Math.sin(Math.PI*swing)*stride;
      const dance=acting?.kind==="dance"&&!walking?acting.weight*(1-seated):0;
      const danceStep=dance?Math.sin(acting.time*TAU*1.36+side*Math.PI*.5):0;
      const ankleY = SOLE+lift*(1-seated)+seated*.10+airborne*(.17+i*.05)+Math.max(0,danceStep)*dance*.081;
      leg.target.set(side*(STANCE+crouch*.033+dance*.044)-pelvis.position.x,ankleY-pelvis.position.y,
        mix(step+crouch*.09,.42,seated)+airborne*(.10+i*.05)+danceStep*dance*.10);
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
      const peace=smiling&&performanceHand&&!steeringGrips;
      arm.hand.geometry=peace?peaceGeometry[i]:fist||steeringGrips?fistGeometry[i]:handGeometry[i];
      if(steeringGrips){
        // Convert the grip from the seated driver's local frame into the chest joint's frame.
        inverseChest.copy(chest.quaternion).invert();
        pitch.setFromAxisAngle(xAxis,-.25);
        target.set(0,-.044,.024).applyQuaternion(pitch).multiplyScalar(BODY);
        arm.target.copy(steeringGrips[i]).sub(target).multiplyScalar(1/BODY)
          .addScaledVector(body.position,-1/BODY).sub(pelvis.position).sub(chest.position).applyQuaternion(inverseChest);
        pole.set(side*.58,-.73,-.24);
        solve(arm,arm.target,pole);
        arm.end.quaternion.copy(globalLower).invert().multiply(inverseChest).multiply(pitch);
        show(null);
        continue;
      }
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
      let x = side*.385*REACH, y = .012+seated*.09, z = .020+seated*.19;
      z += side*pendulum*sway*(.17+sprint*.10);
      y += sprint*sway*(.050+Math.max(0,side*pendulum)*.12);
      x += side*airborne*.14; y += airborne*.30; z += airborne*.08;
      pole.set(side*.56,-.12,-1);
      const clasping = side === claspSide;
      if(carryingTray){
        x=side*(DINING_TRAY_WIDTH*.46*.91/BODY);y=.096;z=.37;
        pole.set(side*.67,-.8,-.26);
      } else if(eatingMeal){
        if(side===-1){
          const {lift,dip}=eatingMeal;
          x=side*mix(.150,.085,lift);
          y=mix(.360+(seat.tray.height-.843)/BODY-.039*dip,.500,lift);
          z=mix(.400,.330,lift);
        }else{
          x=.170;y=.215;z=.330;
        }
        pole.set(side*.70,-.74,-.28);
      } else if (clasping) {
        inverseChest.copy(chest.quaternion).invert();
        clasp.set(side*.45/BODY-pelvis.position.x,.75/BODY-pelvis.position.y-chest.position.y,.078).applyQuaternion(inverseChest);
        x = clasp.x; y = clasp.y; z = clasp.z;
      } else if (side === umbrellaSide) {
        x=side*.288*REACH;y=.385+seated*.075;z=.205;
        if(umbrellaHand&&side!==position.sharedUmbrella){x=position.sharedUmbrella*.065;z=.34;}
        pole.set(side*.67,-.32,-.33);
      } else if (toasting) {
        x=mix(side*.370*REACH,side*.055,toasting);
        y=mix(.110,.375,toasting);
        z=mix(.330,.445,toasting)-contact;
        pole.set(side*.8,-.42,-.11);
      } else if (prop) {
        x = side*mix(.370,.170,eat)*REACH; y = mix(.110,.395,eat); z = mix(.330,.440,eat);
        if (spark) { x = side*.440*REACH; y = .150; z = .320; }
        if (serving) {
          x = side*mix(.370,.18,serving)*REACH;
          y = mix(.110,-.215,serving);
          z = mix(.330,.46,serving);
        }
        pole.set(side*.8,-.69,-.16);
      } else if (pet && side === petSide) {
        const pat = Math.sin(petAge*.018)*.041;
        x = mix(x,side*.290*REACH,crouch); y = mix(y,.030+pat,crouch); z = mix(z,.390+pat,crouch);
        pole.set(side*.42,-.48,-.76);
      } else if (performanceHand) {
        // Gestures were posed for a broader body and a larger head.
        x=mix(x,performanceHand.x*GESTURE_REACH,acting.weight);
        y=mix(y,performanceHand.y-(acting.kind==="heart"?.27:0),acting.weight);
        z=mix(z,performanceHand.z,acting.weight);pole.set(side*.96,-.39,-.28);
      }
      const armEase = wasVisible && !clasping ? 1 - Math.exp(-delta*29) : 1;
      arm.target.set(mix(arm.target.x,x,armEase),mix(arm.target.y,y,armEase),mix(arm.target.z,z,armEase));
      solve(arm,arm.target,pole);
      if(peace){
        // Hold the V upright while the elbow swivels into the pose.
        pitch.setFromEuler(peaceWrist.set(performanceHand.bend,0,performanceHand.roll));
        arm.end.quaternion.copy(globalLower).invert().multiply(pitch);
      }else arm.end.rotation.set((performanceHand?.bend??0)*(acting?.weight??0),0,(performanceHand?.roll??0)*(acting?.weight??0));
      if(carryingTray)arm.end.rotation.set(-.26,side*.06,side*.28);
      if(eatingMeal&&side===-1){
        const {lift,dip}=eatingMeal,utensil=model.utensil.group;
        const hand=chest.worldToLocal(arm.end.getWorldPosition(grip));
        arm.end.rotation.set(-.31-.48*lift,.42,side*.31);
        utensil.position.set(hand.x+.013,hand.y+.013,hand.z+.014);
        utensil.rotation.set(mix(.17+dip*.26,-.39,lift),mix(.47,2.89,lift),-.16,"YXZ");
      }
      if(prop){
        const hand=toasting||spec.snack?chest.worldToLocal(arm.end.getWorldPosition(grip)):arm.target;
        pivot.position.set(hand.x,hand.y+(spec.snack?.026:.015),hand.z+(spec.snack?.019:.039));
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
    const labelY = (model.hat ? 1.69 : model.tallHair ? 1.59 : 1.52)+
      (riding ? CYCLING_LIFT : seated*(SEAT_LIFT-.145*BODY)-crouch*.225*BODY);
    if (model.label) model.label.position.y = labelY+(model.labelLift??0);
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
    model.showTray.dispose();
    if (model.label) {
      model.label.material.map.dispose();
      model.label.material.dispose();
    }
  }

  return {create,update,placeChat,clearChat,dispose};
}
