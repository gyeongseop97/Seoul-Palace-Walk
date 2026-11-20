// Each point is in metres relative to a cue's centre. Lane 0/1/2 selects
// a colour from its palette. The renderer supplies the common flight curve.
const TAU = Math.PI * 2;

function seeded(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function drawCue(cue, emit) {
  const {shape, span, lean} = cue;
  const random = seeded(cue.seed * 65713);
  const towards = lean || 1;
  // px, py, pz, vx, vy, vz, delay, life, downward acceleration, point size,
  // palette lane, and visible length of the spark's streak (in seconds).
  if (shape === "comet") {
    for (let i=0;i<75;i++) {
      const x=(random()-.5)*1.4, y=(random()-.5)*1.25;
      emit(x, y, -towards*span*.85, random()-.5, span*.36+random()*2.5,
        towards*(span*1.2+random()*2),i*.009,2.4,3,2,i%3,.6);
    }
    return;
  }

  const n = {chrysanthemum:194, brocade:168, strobe:151, dahlia:112, crossette:126, fan:77, ring:128, flower:180, palm:119, willow:189, bouquet:126, cascade:153, peony:167}[shape];
  if (!n) throw Error("Unknown festival motif: " + shape);
  for (let i=0;i<n;i++) {
    const u=(i+.5)/n, a=TAU*u, spread=span*(.62+.07*random());
    const latitude=1-2*u, radius=Math.sqrt(1-latitude*latitude), azimuth=i*2.39996323;
    let vx=Math.sin(azimuth)*radius*spread, vy=latitude*spread, vz=Math.cos(azimuth)*radius*spread;
    let lane=i%3, life=2.45+random()*.75, gravity=2.1, lag=.23, delay=random()*.055;
    if (shape === "chrysanthemum" || shape === "dahlia" || shape === "strobe") {
      const inner=i%4===0, shell=inner?.52:1.08;
      vx*=shell;vy*=shell;vz*=shell;lane=inner?2:Math.floor(i/9)%2;
      if (shape==="strobe") {delay+=random()*.56;life=1.6+random()*1.2;lag=.38;}
      if (shape==="chrysanthemum") {lag=.69;gravity=2.8;}
      if (shape==="dahlia") {lag=.34;life=2.0+random()*.42;}
    } else if (shape === "ring" || shape === "flower") {
      const r=shape==="ring"?1:.69+.30*Math.cos(5*a);
      vx=.19*Math.cos(a)*spread; vy=Math.sin(a)*spread*r;
      vz=Math.cos(a)*spread*r; lane=Math.floor(u*(shape==="flower"?5:8))%3; gravity=.72;
    } else if (shape === "fan") {
      const ray=i%7, angle=(ray-3)*.26 + (random()-.5)*.04 + towards*.14;
      const speed=span*(.32+.67*Math.floor(i/7)/11);
      vx=(random()-.5)*1.25; vy=Math.cos(angle)*speed; vz=Math.sin(angle)*speed;
      lane=ray%3; gravity=3.7; lag=.4; life=2+random()*.5;
    } else if (shape === "palm" || shape === "cascade" || shape === "willow" || shape === "brocade") {
      const willow=shape==="willow"||shape==="brocade", branches=willow?27:shape==="cascade"?17:9;
      const branch=i%branches, angle=TAU*branch/branches+.11*Math.sin(cue.seed);
      const k=.51+.56*Math.floor(i/branches)/(Math.ceil(n/branches)-1);
      const elevation=.38+.38*Math.sin(branch*4.12+.28*cue.seed);
      vx=Math.sin(angle)*span*k*.52; vz=Math.cos(angle)*span*k*.91;
      vy=span*k*(willow?.52+elevation*.45:.59+elevation*.82);
      gravity=willow?3.85:5.1; life=willow?4.4+random()*.9:3.2+random()*.66;
      lane=willow?Math.floor(3*k)%3:branch%3; lag=willow?.85:.64;delay=random()*.12;
    }
    if (shape==="crossette") {
      life=1.18;
      if (i%6===0) {
        const split=1.0,travel=(1-Math.exp(-.33*split))/.33;
        for (let j=0;j<4;j++) {
          const theta=j*Math.PI/2+azimuth;
          emit(vx*travel,vy*travel-gravity*.5,vz*travel,vx*.3,vy*.25+Math.sin(theta)*span*.38,
            vz*.25+Math.cos(theta)*span*.38,split,1.75,2.2,2.2,(lane+1)%3,.59);
        }
      }
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
