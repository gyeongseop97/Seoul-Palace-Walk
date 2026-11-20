// Each point is in metres relative to a cue's centre. Lane 0/1/2 selects
// a colour from its palette. The renderer supplies the common flight curve.
const TAU = Math.PI * 2;

const outlines = {
  lighthouse: [
    [[-.42,-.77],[.39,-.77],[.23,.25],[-.21,.25],[-.42,-.77]],
    [[-.39,.27],[.39,.27],[.39,.36],[-.39,.36],[-.39,.27]],
    [[-.20,.37],[-.20,.66],[.20,.66],[.20,.37]],
    [[-.31,.67],[0,.91],[.31,.67],[-.31,.67]],
    [[-.34,-.22],[.30,-.05]], [[-.33,-.34],[.32,-.16]],
    [[.26,.53],[1.07,.66]], [[.26,.53],[1.1,.42]]
  ],
  sail: [
    [[-.95,-.39],[-.57,-.71],[.53,-.71],[.98,-.39],[-.95,-.39]],
    [[-.12,-.36],[-.12,.92]],
    [[-.17,.77],[-.77,-.22],[-.17,-.22],[-.17,.77]],
    [[-.04,.76],[.73,-.22],[-.04,-.22],[-.04,.76]],
    [[-.12,.91],[.24,.78],[-.12,.74]]
  ],
  constellation: [
    [[-1,-.14],[-.61,.23],[-.29,.05],[.06,.44],[.43,.17],[.79,.50]],
    [[.06,.44],[.23,-.2],[.66,-.42]]
  ]
};

function seeded(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function drawCue(cue, emit) {
  const {shape, span, lean} = cue;
  const random = seeded(cue.seed * 65713);
  const towards = lean || 1;
  // px, py, pz, vx, vy, vz, delay, life, downward acceleration, point size,
  // palette lane, and visible length of the spark's streak (in seconds).
  function dot(y, z, delay, lane, life = 2.4, size = 1.8) {
    emit((random() - .5) * .27, y * span, z * span, .08, .16, .24 * towards,
      delay, life, .19, size, lane, 0);
  }

  function trace(fn, count, delay, lane, lifetime = 2.9, sweep = .78) {
    for (let i = 0; i <= count; i++) {
      const u = i / count, [z, y] = fn(u);
      dot(y, z, delay + sweep * u, lane, lifetime, i % 6 === 0 ? 2.7 : 1.55);
    }
  }

  function stroke(path, delay, lane, lifetime) {
    const lengths = [0];
    for (let i = 1; i < path.length; i++) {
      lengths.push(lengths[i - 1] + Math.hypot(path[i][0] - path[i-1][0], path[i][1] - path[i-1][1]));
    }
    const total = lengths.at(-1);
    trace(u => {
      const d = u * total;
      let i = 1;
      while (i < path.length - 1 && lengths[i] < d) i++;
      const f = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1]);
      return [0, 1].map(k => path[i - 1][k] + f * (path[i][k] - path[i - 1][k]));
    }, Math.ceil(total * span * 1.35), delay, lane, lifetime);
  }

  function shimmer(z, y, lane, delay) {
    for (let i = 0; i < 12; i++) {
      const a = TAU * i / 12;
      emit(0, y * span, z * span, .2, Math.sin(a)*1.9, Math.cos(a)*1.9,
        delay, 1.7, .5, 2.3, lane, .18);
    }
  }

  if (Object.hasOwn(outlines, shape)) {
    const direction = shape === "constellation" ? towards : 1;
    outlines[shape].forEach((path, i) => {
      const pts = path.map(([z, y]) => [direction * z, y]);
      stroke(pts, .10 * i, i % 3, shape === "constellation" ? 3.6 : 3.3);
      if (shape === "constellation") pts.forEach(([z,y], j) => shimmer(z,y,j % 3,.23*j));
    });
    return;
  }
  if (shape === "gull") {
    for (const side of [-1,1]) {
      trace(u => [side * u, Math.sin(u * Math.PI) * .32 + .13*u + lean*side*u*.12],
        58, .12, side < 0 ? 0 : 2, 2.65);
      trace(u => [side * u, Math.sin(u * Math.PI) * .18 + .13*u + lean*side*u*.12],
        40, .32, 1, 2.4);
    }
    return;
  }
  if (shape === "moon") {
    trace(u => [Math.cos(TAU*(.15 + .70*u))*.77, Math.sin(TAU*(.15 + .70*u))*.99], 102, 0, 0, 3.6);
    trace(u => {
      const y = (.5-u)*1.60;
      return [.46-.73*Math.sin(Math.PI*u),y];
    }, 78, .4, 2, 3.5);
    return;
  }
  if (shape === "star") {
    const path = Array.from({length:11}, (_,i) => {
      const a = Math.PI/2 + TAU*i/10, r = i%2 ? .43 : 1;
      return [Math.cos(a)*r, Math.sin(a)*r];
    });
    stroke(path,0,0,2.8);
    shimmer(0,0,2,.65);
    return;
  }
  if (shape === "wave") {
    for (let row = 0; row < 3; row++) {
      trace(u => [towards * (2*u-1), Math.sin(u*TAU*1.25-row*.46)*.28-row*.15],
        115, row*.24, row, 2.3, 1.05);
    }
    return;
  }
  if (shape === "comet") {
    for (let i=0;i<75;i++) {
      const x=(random()-.5)*1.4, y=(random()-.5)*1.25;
      emit(x, y, -towards*span*.85, random()-.5, span*.36+random()*2.5,
        towards*(span*1.2+random()*2),i*.009,2.4,3,2,i%3,.6);
    }
    return;
  }

  const n = {fan:77, ring:128, flower:180, palm:119, willow:189, bouquet:126, cascade:153, peony:167}[shape];
  if (!n) throw Error("Unknown festival motif: " + shape);
  for (let i=0;i<n;i++) {
    const u=(i+.5)/n, a=TAU*u, spread=span*(.62+.07*random());
    const latitude=1-2*u, radius=Math.sqrt(1-latitude*latitude), azimuth=i*2.39996323;
    let vx=Math.sin(azimuth)*radius*spread, vy=latitude*spread, vz=Math.cos(azimuth)*radius*spread;
    let lane=i%3, life=2.45+random()*.75, gravity=2.1, lag=.23, delay=random()*.055;
    if (shape === "ring" || shape === "flower") {
      const r=shape==="ring"?1:.69+.30*Math.cos(5*a);
      vx=.19*Math.cos(a)*spread; vy=Math.sin(a)*spread*r;
      vz=Math.cos(a)*spread*r; lane=Math.floor(u*(shape==="flower"?5:8))%3; gravity=.72;
    } else if (shape === "fan") {
      const ray=i%7, angle=(ray-3)*.26 + (random()-.5)*.04 + towards*.14;
      const speed=span*(.32+.67*Math.floor(i/7)/11);
      vx=(random()-.5)*1.25; vy=Math.cos(angle)*speed; vz=Math.sin(angle)*speed;
      lane=ray%3; gravity=3.7; lag=.4; life=2+random()*.5;
    } else if (shape === "palm" || shape === "cascade" || shape === "willow") {
      const willow=shape==="willow", branches=willow?27:shape==="cascade"?17:9;
      const branch=i%branches, angle=TAU*branch/branches+.11*Math.sin(cue.seed);
      const k=.51+.56*Math.floor(i/branches)/(Math.ceil(n/branches)-1);
      const elevation=.38+.38*Math.sin(branch*4.12+.28*cue.seed);
      vx=Math.sin(angle)*span*k*.52; vz=Math.cos(angle)*span*k*.91;
      vy=span*k*(willow?.52+elevation*.45:.59+elevation*.82);
      gravity=willow?3.85:5.1; life=willow?4.4+random()*.9:3.2+random()*.66;
      lane=willow?Math.floor(3*k)%3:branch%3; lag=willow?.85:.64;delay=random()*.12;
    }
    emit(0,0,0,vx,vy,vz,delay,life,gravity,2.15+random()*.48,lane,lag);
    if (shape === "bouquet" && i%17===0) {
      const at=.93, travel=(1-Math.exp(-.33*at))/.33;
      for(let j=0;j<26;j++){
        const v=1-2*(j+.5)/26, r=Math.sqrt(1-v*v), b=j*2.39996323;
        emit(vx*travel, vy*travel-gravity*at*at*.5, vz*travel,
          Math.sin(b)*r*7,v*7,Math.cos(b)*r*7,at,2+random()*.36,2.5,1.9,(lane+1)%3,.21);
      }
    }
  }
}
