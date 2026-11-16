import {buildMuseumRelic} from "./museum-relics.js";

// Reference: National Museum of Korea, 증616, 덕수2182, 접수702 and 동원420.
// Profile pairs give radius and height as fractions of each object's display height.
const celadonProfile = [
  [0,0],[.151,0],[.167,.008],[.169,.028],[.163,.065],[.153,.127],
  [.152,.205],[.157,.276],[.175,.342],[.208,.426],[.244,.509],
  [.278,.600],[.298,.686],[.305,.760],[.302,.810],[.289,.863],
  [.266,.903],[.230,.928],[.168,.950],[.102,.958],[.073,.964],
  [.073,.979],[.084,.985],[.088,.997],[.086,1],[.071,1]
];
const moonProfile = [
  [0,0],[.179,0],[.194,.009],[.195,.047],[.199,.068],[.233,.086],
  [.292,.119],[.353,.183],[.405,.256],[.451,.347],[.477,.432],
  [.487,.514],[.483,.591],[.458,.673],[.413,.752],[.358,.828],
  [.299,.887],[.243,.929],[.226,.947],[.232,.959],[.243,.978],
  [.244,.990],[.238,1],[.220,1]
];
const buncheongProfile = [
  [0,0],[.108,0],[.119,.009],[.118,.039],[.119,.051],[.147,.068],
  [.196,.100],[.241,.152],[.276,.218],[.298,.292],[.299,.339],
  [.288,.397],[.264,.462],[.232,.522],[.193,.584],[.153,.650],
  [.120,.710],[.091,.765],[.070,.822],[.065,.873],[.073,.920],
  [.090,.963],[.112,.987],[.118,.995],[.113,1],[.099,1]
];

function ceramicMaterial(T, map, tint, roughness, glaze) {
  return new T.MeshPhysicalMaterial({
    color: tint, map, roughness, metalness: 0, clearcoat: glaze,
    clearcoatRoughness: .28, emissive: tint, emissiveMap: map,
    emissiveIntensity: .12
  });
}

function lathe(T, group, profile, material, height, deform, arc = [0, Math.PI * 2]) {
  const curve = new T.SplineCurve(profile.map(([radius, y]) => new T.Vector2(radius * height, y * height)));
  const rings = curve.getPoints((profile.length - 1) * 3);
  for (const ring of rings) ring.set(Math.max(0, ring.x), Math.max(0, Math.min(height, ring.y)));
  const full = arc[1] === Math.PI * 2;
  const geometry = new T.LatheGeometry(rings, full ? 72 : 8, ...arc);
  const {position, uv} = geometry.attributes;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    uv.setY(i, y / height);
    if (deform) {
      const t = y / height, angle = Math.atan2(x, z);
      const body = Math.sin(Math.PI * t);
      const taper = 1 + deform * body * (.50 * Math.sin(angle * 2 + .4) + .32 * Math.sin(angle - t * 3));
      position.setXYZ(i, x * taper + height * deform * body * t * .4, y, z * taper);
    }
  }
  if (deform) {
    geometry.computeVertexNormals();
    // The UV seam is duplicated. Smooth its two normals together.
    const normals = geometry.attributes.normal;
    for (let i = 0; i < rings.length; i++) {
      const j = position.count - rings.length + i;
      const n = new T.Vector3().fromBufferAttribute(normals, i)
        .add(new T.Vector3().fromBufferAttribute(normals, j)).normalize();
      normals.setXYZ(i, n.x, n.y, n.z);
      normals.setXYZ(j, n.x, n.y, n.z);
    }
  }
  const mesh = new T.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}

function surface(T, palette, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(canvas.width, canvas.height);
  let seed = 23117;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < canvas.height; y++) {
    const grain = Math.sin(y * .28) * 1.6 + Math.sin(y * 2.4) * .9;
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width * Math.PI * 2;
      const patch = Math.sin(u * 3 + y * .022) * Math.sin(u * 5 - y * .013) * 3.2;
      const light = patch + grain + (random() - .5) * palette.grit;
      const pixel = (y * canvas.width + x) * 4;
      const kiln = Math.max(0, Math.sin(u * 2 + y * .011)) * palette.kiln;
      image.data[pixel] = palette.rgb[0] + light + kiln;
      image.data[pixel + 1] = palette.rgb[1] + light + kiln * .45;
      image.data[pixel + 2] = palette.rgb[2] + light - kiln * .36;
      image.data[pixel + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  paint?.(ctx, random);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = T.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}

function stroke(ctx, color, width, draw) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  draw();
  ctx.stroke();
}

function crackle(ctx, random, count, color) {
  stroke(ctx, color, .66, () => {
    for (let i = 0; i < count; i++) {
      const x = random() * 1024, y = 20 + random() * 479;
      const d = 3 + random() * 13, bend = random() < .5 ? 1 : -1;
      ctx.moveTo(x,y); ctx.lineTo(x+d*.35,y+d*bend*.25);
      ctx.lineTo(x+d*.53,y+d*bend*.68); ctx.lineTo(x+d,y+d*bend);
    }
  });
}

function thunderBand(ctx, y, height) {
  const ink = "#405345b8";
  stroke(ctx, ink, 1.7, () => {
    ctx.moveTo(0,y); ctx.lineTo(1024,y);
    ctx.moveTo(0,y+height); ctx.lineTo(1024,y+height);
    for (let x = 0; x < 1024; x += 32) {
      ctx.moveTo(x,y+height*.21); ctx.lineTo(x+21,y+height*.21);
      ctx.lineTo(x+21,y+height*.60); ctx.lineTo(x+10,y+height*.60);
      ctx.lineTo(x+10,y+height*.41); ctx.lineTo(x+16,y+height*.41);
      ctx.moveTo(x+3,y+height*.36); ctx.lineTo(x+3,y+height*.81);
      ctx.lineTo(x+29,y+height*.81); ctx.lineTo(x+29,y+height*.44);
    }
  });
}

function cloud(ctx, x, y, scale) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  stroke(ctx, "#d6ddc4", 3, () => {
    ctx.moveTo(22,-24); ctx.bezierCurveTo(32,-38,42,-26,36,-21);
    ctx.bezierCurveTo(27,-16,27,-12,39,-12);
    ctx.bezierCurveTo(53,-11,54,-1,39,-1);
    ctx.bezierCurveTo(28,-1,15,-8,7,0); ctx.quadraticCurveTo(0,4,-4,1);
    ctx.moveTo(12,-1); ctx.bezierCurveTo(3,11,23,11,33,10);
    ctx.bezierCurveTo(55,9,49,23,28,24);
    ctx.bezierCurveTo(13,24,14,35,33,37);
    ctx.bezierCurveTo(50,38,29,52,39,60);
    ctx.moveTo(26,23); ctx.bezierCurveTo(6,20,1,14,-7,20);
    ctx.moveTo(43,13); ctx.bezierCurveTo(49,0,61,4,67,10);
  });
  ctx.fillStyle = "#d6ddc4";
  for (const [cx,cy,rx] of [[-1,0,6],[31,-28,6],[-7,20,4],[63,9,6],[15,-3,5]]) {
    ctx.beginPath(); ctx.ellipse(cx,cy,rx,2.6,-.19,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function crane(ctx, x, y, scale, angle, flip) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(flip * scale,scale);
  const cream = "#e0e2c6", ink = "#344a3d";
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.moveTo(-22,1); ctx.bezierCurveTo(-18,-14,-1,-13,19,-2);
  ctx.bezierCurveTo(13,5,1,12,-13,10); ctx.bezierCurveTo(-20,8,-24,4,-22,1);
  ctx.fill();
  stroke(ctx, cream, 4.7, () => {
    ctx.moveTo(-12,1); ctx.bezierCurveTo(-25,-1,-22,-17,-32,-20);
    ctx.bezierCurveTo(-39,-22,-46,-17,-45,-12);
  });
  ctx.beginPath(); ctx.ellipse(-45,-14,4,3.8,-.35,0,Math.PI*2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-9,2); ctx.bezierCurveTo(-15,-11,-18,-19,-31,-33);
  ctx.bezierCurveTo(-15,-31,0,-22,11,-4); ctx.lineTo(7,2);
  ctx.bezierCurveTo(9,17,2,32,-15,47);
  ctx.bezierCurveTo(-8,24,-16,11,-9,2); ctx.fill();
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(-9+i*1.5,-2-i*.4); ctx.quadraticCurveTo(-14+i*1.1,-25-i*.9,-42+i*4,-45+i*.4);
    ctx.quadraticCurveTo(-18+i*1.7,-28-i*.6,-6+i*1.6,-4); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10+i*1.7,3+i*.48); ctx.quadraticCurveTo(-6+i*2,22+i*.63,-18+i*3.8,55-i*.7);
    ctx.quadraticCurveTo(-3+i*2,31,-6+i*1.4,5); ctx.fill();
  }
  stroke(ctx, ink, 1.25, () => {
    ctx.moveTo(-48,-12); ctx.lineTo(-56,-6); ctx.lineTo(-50,-12);
    ctx.moveTo(13,2); ctx.lineTo(35,-.5); ctx.lineTo(44,1);
    ctx.moveTo(12,-1); ctx.lineTo(35,-4); ctx.lineTo(45,-3);
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(7+i*2.4,1+i*.32); ctx.quadraticCurveTo(14+i*2,4+i*.62,18+i*2,9+i*.55);
    }
  });
  ctx.fillStyle = ink;
  ctx.beginPath(); ctx.arc(-46,-15,1.02,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function celadonPaint(ctx, random) {
  crackle(ctx, random, 560, "#4d5e4730");
  thunderBand(ctx, 4, 10);
  thunderBand(ctx, 489, 15);
  for (let i = 0; i < 4; i++) {
    const x = 128 + i * 256;
    crane(ctx,x+27,109+i%2*31,1.10,-.27+i*.28,i%2 ? -1 : 1);
    crane(ctx,x-67,241+i%2*24,.89,.45-i*.21,i%2 ? 1 : -1);
    cloud(ctx,x-91,108+i%2*39,.66);
    cloud(ctx,x+27,301-i%2*30,.72);
  }
}

function moonPaint(ctx, random) {
  const join = ctx.createLinearGradient(0,236,0,278);
  join.addColorStop(0,"#af9a7200"); join.addColorStop(.52,"#af9a7215"); join.addColorStop(1,"#af9a7200");
  ctx.fillStyle = join;
  ctx.fillRect(0,236,1024,42);
  const foot = ctx.createLinearGradient(0,472,0,512);
  foot.addColorStop(0,"#95784800"); foot.addColorStop(1,"#95784866");
  ctx.fillStyle = foot;
  ctx.fillRect(0,472,1024,40);
  crackle(ctx,random,184,"#87786024");
  for (let i = 0; i < 166; i++) {
    ctx.fillStyle = i % 12 === 0 ? "#79685062" : "#8c7c5830";
    ctx.fillRect(random()*1024,random()*512,.5+random()*1.5,.5+random()*1.2);
  }
}

function fish(ctx, x, y, scale, mirror) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale * mirror,scale);
  const ink = "#5a3928e8";
  stroke(ctx,ink,5.4,() => {
    ctx.moveTo(-69,6); ctx.bezierCurveTo(-45,-31,-3,-39,35,-29);
    ctx.quadraticCurveTo(64,-18,63,-1); ctx.bezierCurveTo(57,34,8,40,-29,27);
    ctx.quadraticCurveTo(-52,21,-69,6);
    ctx.moveTo(59,-10); ctx.bezierCurveTo(80,-26,89,-30,113,-32);
    ctx.bezierCurveTo(97,-19,100,-6,94,7); ctx.quadraticCurveTo(75,4,60,18);
    ctx.moveTo(-26,-23); ctx.bezierCurveTo(-25,-10,-16,-7,-1,-8);
    ctx.moveTo(-5,30); ctx.quadraticCurveTo(10,52,28,60); ctx.quadraticCurveTo(29,42,41,28);
    ctx.moveTo(13,-30); ctx.quadraticCurveTo(34,-47,55,-49); ctx.quadraticCurveTo(42,-39,47,-25);
  });
  stroke(ctx,ink,2.9,() => {
    for (let i = 0; i < 7; i++) {
      const a = -55 + i * 14;
      ctx.moveTo(a,10-i*.9); ctx.bezierCurveTo(a+6,13,a+14,19,a+20,24-i*.55);
      ctx.moveTo(a+4,-7-i*.55); ctx.quadraticCurveTo(a+15,-2,a+22,1-i*.4);
    }
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(62,3-i*2.9); ctx.quadraticCurveTo(79,-8-i*3.1,95+i*2,-8-i*3);
    }
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(i*7,32); ctx.quadraticCurveTo(11+i*5,45-i*2,28+i*.6,54-i*5);
    }
  });
  ctx.fillStyle = ink;
  ctx.beginPath(); ctx.ellipse(-40,-5,5.6,4.8,-.4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function lotus(ctx, x, y, size, flip) {
  ctx.save(); ctx.translate(x,y); ctx.scale(size*flip,size);
  stroke(ctx,"#573929d8",4.3,() => {
    ctx.moveTo(-5,72); ctx.bezierCurveTo(-35,47,-24,20,3,-5);
    ctx.moveTo(3,-6); ctx.bezierCurveTo(-14,-2,-33,-16,-29,-31);
    ctx.bezierCurveTo(-11,-37,-4,-19,3,-6);
    ctx.bezierCurveTo(4,-28,16,-40,31,-29); ctx.bezierCurveTo(28,-17,18,-4,3,-6);
    ctx.moveTo(1,-7); ctx.quadraticCurveTo(-14,-33,-5,-46); ctx.quadraticCurveTo(9,-41,10,-17);
    ctx.moveTo(-17,51); ctx.bezierCurveTo(-13,22,14,22,22,43);
    ctx.bezierCurveTo(21,55,12,61,3,60);
    ctx.moveTo(-6,64); ctx.quadraticCurveTo(9,76,26,68);
  });
  ctx.restore();
}

function buncheongPaint(ctx, random) {
  for (let y = 8; y < 510; y += 4) {
    ctx.fillStyle = y % 3 ? "#715e4012" : "#f4e7c331";
    const x = random()*1024, w = 120+random()*420;
    ctx.fillRect(x,y,w,1.2); ctx.fillRect(x-1024,y,w,1.2);
  }
  for (const y of [141,191,224,400]) {
    stroke(ctx,"#746b54a0",2.2,()=>{
      ctx.moveTo(0,y); ctx.bezierCurveTo(315,y-2,660,y+2,1024,y);
      ctx.moveTo(0,y+3.8); ctx.bezierCurveTo(315,y+1.5,660,y+6,1024,y+3.8);
    });
  }
  for (const [x, flip] of [[256,1],[768,-1]]) {
    fish(ctx,x,315,1.35,flip);
    lotus(ctx,x-flip*124,310,1.24,flip);
    lotus(ctx,x+flip*154,310,.94,-flip);
  }
  const foot = ctx.createLinearGradient(0,476,0,512);
  foot.addColorStop(0,"#8c6a3800"); foot.addColorStop(1,"#725b3a91");
  ctx.fillStyle = foot; ctx.fillRect(0,476,1024,36);
  crackle(ctx,random,270,"#655b4428");
}

function pot(T, group, profile, inside, height, palette, paint, gloss, deform, turn = Math.PI / 2) {
  const map = surface(T,palette,paint);
  const outside = ceramicMaterial(T,map,0xffffff,gloss[0],gloss[1]);
  const insideGlaze = ceramicMaterial(T,null,palette.interior,.51,gloss[1]);
  const exterior = lathe(T,group,profile,outside,height,deform);
  const interior = lathe(T,group,inside,insideGlaze,height,deform);
  exterior.rotation.y = interior.rotation.y = turn;
}

function cupFoot(T, group, profile, material, height, phase) {
  const span = Math.PI * .245;
  for (let i = 0; i < 4; i++) {
    const start = phase + i * Math.PI / 2;
    const section = [...profile,...profile.slice().reverse().map(([r,y])=>[r-.029,y]),profile[0]];
    lathe(T,group,section,material,height,null,[start,span]);
    const shape = new T.Shape(section.map(([r,y])=>new T.Vector2(r*height,y*height)));
    const geometry = new T.ShapeGeometry(shape);
    const uv = geometry.attributes.uv, position = geometry.attributes.position;
    for (let j = 0; j < uv.count; j++) uv.setXY(j,.28,position.getY(j)/height);
    for (const angle of [start,start+span]) {
      const cap = new T.Mesh(geometry,material);
      cap.rotation.y = angle - Math.PI / 2;
      group.add(cap);
    }
  }
}

function mergeCupParts(T, group, material) {
  const parts = group.children.filter(mesh => mesh.material === material);
  const vertices = parts.reduce((total, mesh) => total + mesh.geometry.attributes.position.count,0);
  const indexCount = parts.reduce((total, mesh) => total + mesh.geometry.index.count,0);
  const positions = new Float32Array(vertices * 3), normals = new Float32Array(vertices * 3);
  const uvs = new Float32Array(vertices * 2), indices = new Uint16Array(indexCount);
  let vertexOffset = 0, indexOffset = 0;
  for (const mesh of parts) {
    mesh.updateMatrix();
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix);
    const {position, normal, uv} = geometry.attributes;
    positions.set(position.array, vertexOffset * 3);
    normals.set(normal.array, vertexOffset * 3);
    uvs.set(uv.array, vertexOffset * 2);
    for (let i = 0; i < geometry.index.count; i++) {
      indices[indexOffset + i] = vertexOffset + geometry.index.getX(i);
    }
    vertexOffset += position.count;
    indexOffset += geometry.index.count;
    geometry.dispose();
  }
  group.remove(...parts);
  for (const geometry of new Set(parts.map(mesh => mesh.geometry))) geometry.dispose();
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position",new T.BufferAttribute(positions,3));
  geometry.setAttribute("normal",new T.BufferAttribute(normals,3));
  geometry.setAttribute("uv",new T.BufferAttribute(uvs,2));
  geometry.setIndex(new T.BufferAttribute(indices,1));
  group.add(new T.Mesh(geometry,material));
}

function sillaCup(T, group) {
  const height = 1.04;
  const map = surface(T,{rgb:[122,121,119],grit:30,kiln:9},(ctx,random)=>{
    for (let i = 0; i < 310; i++) {
      ctx.fillStyle = i%3 ? "#d4c4a945" : "#3935306e";
      ctx.fillRect(random()*1024,random()*512,1+random()*2,.7+random()*1.3);
    }
  });
  const cup = ceramicMaterial(T,map,0xbdb8b0,.88,0);
  const lid = ceramicMaterial(T,map,0xe7dfca,.84,0);
  const foot = ceramicMaterial(T,map,0xdad4c8,.88,0);
  foot.side = T.DoubleSide;
  lathe(T,group,[[.223,0],[.272,0],[.281,.009],[.281,.028],[.272,.049],[.250,.058],[.223,.047],[.223,0]],foot,height);
  cupFoot(T,group,[[.260,.038],[.228,.086],[.208,.137],[.195,.175]],foot,height,.05);
  lathe(T,group,[[.165,.169],[.196,.169],[.204,.179],[.204,.197],[.193,.216],[.171,.219],[.165,.199],[.165,.169]],foot,height);
  cupFoot(T,group,[[.192,.206],[.164,.270],[.142,.335],[.134,.421]],foot,height,Math.PI/4+.05);
  lathe(T,group,[[.103,.401],[.134,.402],[.143,.423],[.144,.447],[.111,.461],[.103,.442],[.103,.401]],foot,height);
  lathe(T,group,[[0,.421],[.112,.423],[.174,.446],[.235,.486],[.299,.551],[.347,.620],[.372,.636],[.373,.651],[.360,.662],[.336,.654],[.291,.576],[.208,.486],[.104,.454],[0,.452]],cup,height);
  lathe(T,group,[[0,.648],[.310,.648],[.370,.652],[.378,.697],[.382,.709],[.384,.717],[.369,.732],[.348,.774],[.303,.836],[.250,.879],[.189,.909],[.111,.935],[.061,.949],[.059,.962],[.075,.971],[.078,.985],[.065,.998],[.036,1],[0,1]],lid,height);
  for (let i = 0; i < 3; i++) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(.286,.599,0),new T.Vector3(.342,.596,0),
      new T.Vector3(.361,.550,0),new T.Vector3(.321,.507,0),new T.Vector3(.245,.498,0)
    ].map(point=>point.multiplyScalar(height)));
    const geometry = new T.TubeGeometry(curve,18,.026,10);
    geometry.scale(1,1,1.55);
    const loop = new T.Mesh(geometry,foot);
    loop.rotation.y = Math.PI/2 + i*Math.PI*2/3;
    group.add(loop);
  }
  mergeCupParts(T,group,foot);
}

// Met 1981.401. The shoulders carry two small loop handles above the cord marks.
function gayaJar(T, group) {
  const height=1.10;
  const profile=[
    [0,0],[.115,0],[.182,.015],[.263,.061],[.349,.136],[.425,.221],
    [.476,.309],[.515,.400],[.535,.485],[.530,.554],[.515,.630],
    [.487,.703],[.441,.764],[.385,.820],[.304,.875],[.243,.897],
    [.236,.931],[.249,.966],[.272,.990],[.270,1],[.245,1]
  ];
  const interior=[
    [.245,1],[.229,.975],[.217,.923],[.240,.889],[.307,.858],
    [.414,.775],[.494,.645],[.510,.486],[.451,.311],[.346,.163],
    [.229,.091],[.122,.065],[0,.061]
  ];
  const map=surface(T,{rgb:[125,122,115],grit:21,kiln:8},(ctx,random)=>{
    stroke(ctx,"#534a3e83",.8,()=>{
      for(let y=88;y<478;y+=9){
        const wave=Math.sin(y*.06)*1.5;
        ctx.moveTo(0,y);ctx.bezierCurveTo(280,y+wave,728,y-wave,1024,y);
        for(let x=0;x<1024;x+=3.9){
          const shift=Math.sin(x*.015+y*.018)*1.4;
          const start=y+shift+random()*2;
          ctx.moveTo(x,start);ctx.quadraticCurveTo(x-.6,start+3,x-1.0,start+5+random()*2.6);
        }
      }
    });
    const band=ctx.createLinearGradient(0,166,0,180);
    band.addColorStop(0,"#403a3100");band.addColorStop(.54,"#403a3166");band.addColorStop(1,"#403a3100");
    ctx.fillStyle=band;ctx.fillRect(0,166,1024,14);
  });
  const clay=ceramicMaterial(T,map,0xc4c0b6,.91,0);
  lathe(T,group,profile,clay,height,.018);
  lathe(T,group,interior,ceramicMaterial(T,null,0x4b4640,.87,0),height,.018);
  const handleMaterial=ceramicMaterial(T,null,0x777168,.89,0);
  for(const side of [-1,1]){
    const curve=new T.CatmullRomCurve3([
      [.354,.849],[.370,.883],[.398,.907],[.425,.899],[.444,.868],[.425,.826],[.390,.814]
    ].map(([x,y])=>new T.Vector3(x*side*height,y*height,0)));
    group.add(new T.Mesh(new T.TubeGeometry(curve,20,.017*height,8),handleMaterial));
  }
  group.rotation.y=.27;
}

function lotusPetalHeight(t,sector,amount){
  if(t<=0||t>=1)return 0;
  const center=Math.abs(sector-Math.floor(sector)-.5);
  const halfWidth=.045+.36*Math.sin(Math.PI*(.28+.72*t))**.72;
  const edge=(center-halfWidth)/.095;
  const ridge=Math.exp(-edge*edge);
  return ridge*Math.sin(Math.PI*t)**.65*amount;
}

// Cleveland 1918.493. Sculpt the overlapping lotus petals into the cup exterior.
function goryeoBurner(T, group) {
  const height=.99;
  const profile=[
    [0,0],[.233,0],[.286,.008],[.309,.032],[.311,.073],[.304,.121],
    [.285,.166],[.254,.219],[.200,.276],[.150,.307],[.142,.330],[.145,.361],
    [.171,.379],[.217,.398],[.260,.426],[.292,.464],[.308,.518],[.315,.568],
    [.311,.612],[.301,.657],[.295,.717],[.299,.787],[.314,.858],
    [.342,.915],[.376,.953],[.415,.979],[.419,.993],[.407,1],[.389,1]
  ];
  const inside=[
    [.389,1],[.379,.978],[.347,.946],[.316,.901],[.291,.846],
    [.270,.771],[.267,.710],[.270,.640],[.282,.580],[.275,.532],
    [.239,.483],[.194,.459],[.110,.445],[0,.440]
  ];
  const map=surface(T,{rgb:[141,153,119],grit:9,kiln:12},(ctx,random)=>{
    crackle(ctx,random,585,"#695a3a35");
    crackle(ctx,random,110,"#c1b18d3c");
  });
  const glaze=ceramicMaterial(T,map,0xffffff,.29,.50);
  const bowl=lathe(T,group,profile,glaze,height,.008);
  lathe(T,group,inside,ceramicMaterial(T,null,0x7a8866,.34,.50),height,.008);
  const points=bowl.geometry.attributes.position;
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),y=points.getY(i),z=points.getZ(i),radius=Math.hypot(x,z);
    if(radius<.001)continue;
    const h=y/height,angle=Math.atan2(x,z)/(2*Math.PI);
    const relief=lotusPetalHeight((h-.373)/.281,angle*12,.018)+
      lotusPetalHeight((h-.411)/.234,angle*12+.5,.010)+
      lotusPetalHeight((h-.058)/.216,angle*12+.20,.007);
    const scale=1+relief*height/radius;
    points.setXYZ(i,x*scale,y,z*scale);
  }
  bowl.geometry.computeVertexNormals();
  const normals=bowl.geometry.attributes.normal;
  const verticesPerRing=points.count/73;
  const normal=new T.Vector3(),acrossSeam=new T.Vector3();
  for(let i=0;i<verticesPerRing;i++){
    const j=points.count-verticesPerRing+i;
    normal.fromBufferAttribute(normals,i).add(acrossSeam.fromBufferAttribute(normals,j)).normalize();
    normals.setXYZ(i,normal.x,normal.y,normal.z);
    normals.setXYZ(j,normal.x,normal.y,normal.z);
  }
}

export function createMuseumObject(T, id) {
  const group = new T.Group();
  group.name = id;
  switch (id) {
    case "silla-cup":
      sillaCup(T,group);
      break;
    case "early-gaya-jar":
      gayaJar(T,group);
      break;
    case "early-goryeo-burner":
      goryeoBurner(T,group);
      break;
    case "goryeo-celadon":
      pot(T,group,celadonProfile,[[.071,1],[.067,.983],[.059,.965],[.107,.942],[.238,.880],[.276,.801],[.281,.721],[.229,.499],[.148,.302],[.130,.151],[.113,.077],[0,.067]],
        1.20,{rgb:[131,156,137],grit:9,kiln:6,interior:0x677b68},celadonPaint,[.31,.48],.008,.86);
      break;
    case "joseon-moon":
      pot(T,group,moonProfile,[[.220,1],[.217,.980],[.203,.958],[.246,.901],[.368,.781],[.449,.613],[.462,.494],[.404,.296],[.271,.131],[.158,.077],[0,.068]],
        1.28,{rgb:[223,220,201],grit:7,kiln:8,interior:0xa7a28c},moonPaint,[.35,.4],.043);
      break;
    case "joseon-buncheong":
      pot(T,group,buncheongProfile,[[.099,1],[.096,.985],[.073,.955],[.057,.894],[.053,.837],[.084,.749],[.126,.660],[.211,.519],[.272,.367],[.271,.251],[.214,.145],[.119,.068],[0,.061]],
        1.18,{rgb:[194,181,153],grit:16,kiln:13,interior:0x8f8266},buncheongPaint,[.54,.23],.015);
      break;
    default:
      buildMuseumRelic(T,group,id);
  }
  return group;
}
