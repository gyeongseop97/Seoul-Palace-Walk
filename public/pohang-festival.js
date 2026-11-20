import * as T from "three";
import {getGameSound} from "./sound.js";
import {shore} from "./pohang-layout.js";
import {festivalCues,festivalFocus} from "./pohang-festival-score.js";
import {drawCue} from "./pohang-festival-shapes.js";

const palettes = {
  beacon: [0xffac44,0xffdc89,0xfff5d4], pearl: [0xccf4ff,0x9baef6,0xfff3dc],
  sunrise: [0xff8a47,0xffc576,0xff7096], tide: [0x37c5c5,0x66f4e0,0x5092f6],
  storm: [0x525eff,0xb48aff,0x8edfff], lagoon: [0x31d8a3,0x3aaaf4,0xa3ffe0],
  rose: [0xff678b,0xfea8b0,0xffc258], garden: [0x7be57e,0xff77a5,0xf8e070],
  orchid: [0xb277ff,0xff63bf,0x84a7ff], moon: [0xffe497,0xdac6ff,0xf5f8ff],
  twilight: [0x728aff,0xc5abff,0xbff8ff], coral: [0xff584d,0xff8e61,0xffc36e],
  gold: [0xffaa39,0xffd66d,0xfff3c1]
};
const colors = Object.fromEntries(Object.entries(palettes).map(([key, value]) => [key, value.map(hex => new T.Color(hex))]));
const rise = 1.85;
const sectionLength = 8;
const events = festivalCues.map(cue => ({
  ...cue, tones: colors[cue.palette],bank:cue.side < -15 ? 0 : cue.side > 15 ? 2 : 1
}));

function attributes(line) {
  const data = {position: [], color: [], afterglow: [], vel: [], flight: [], width: []};
  if (line) data.tail = [];
  return data;
}

function geometry(data) {
  const geo = new T.BufferGeometry();
  for (const [name, values] of Object.entries(data)) {
    const size = name === "width" || name === "tail" ? 1 : 3;
    geo.setAttribute(name, new T.Float32BufferAttribute(values, size));
  }
  return geo;
}

function makeSection(section, scene, pointMat, trailMat) {
  const points = attributes(false), lines = attributes(true);
  function vertex(data,x,y,z,vx,vy,vz,start,life,gravity,size,color,afterglow) {
    data.position.push(x,y,z); data.vel.push(vx,vy,vz);
    data.flight.push(start,life,gravity); data.width.push(size);
    data.color.push(color.r,color.g,color.b);
    data.afterglow.push(afterglow.r,afterglow.g,afterglow.b);
  }
  for (const e of section.events) {
    const emit = (x,y,z,vx,vy,vz,delay,life,gravity,size,lane,tail) => {
      const s=e.size;
      // Scale existing trajectories, not the number of sparks, to keep mobile geometry bounded.
      const args = [e.x+x*s,e.y+y*s,e.z+z*s,vx*s,vy*s,vz*s,e.at+delay,life,gravity*s,
        size*s,e.tones[lane],e.tones[(lane+1)%3]];
      vertex(points,...args);
      if (tail>0) {
        for (const offset of [Math.min(life*.84,tail*2.5+.13), 0]) {vertex(lines,...args);lines.tail.push(offset);}
      }
    };
    const startHeight = e.shape === "fan" ? .75 : 1.2;
    // One travelling ember and its fading wake follow the full ascent.
    const launchSpeed=(e.height-startHeight)*.33/(1-Math.exp(-.33*rise));
    emit(0,startHeight-e.height,-e.lean*2.5,0,launchSpeed,e.lean*2.5/rise,
      -rise,rise,0,2.1,2,.32);
    drawCue(e,emit);
  }
  const sparks = new T.Points(geometry(points),pointMat);
  const streaks = new T.LineSegments(geometry(lines),trailMat);
  sparks.frustumCulled = streaks.frustumCulled = false;
  scene.add(sparks,streaks);
  return [sparks,streaks];
}

const flightShader = `
  attribute vec3 vel,flight,afterglow; attribute float width;
  uniform float t,pixels; varying vec4 tint;
  #ifdef STREAK
  attribute float tail;
  #endif
  void main(){
    float age=t-flight.x,life=flight.y;
    if(age<0. || age>=life){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=0.;return;}
    float a=age;
    #ifdef STREAK
    a=max(0.,age-tail);
    #endif
    vec3 p=position+vel*(1.-exp(-.33*a))/.33;
    p.y-=flight.z*a*a*.5;
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp(width*pixels/max(10.,-mv.z),1.,12.);
    vec3 hue=mix(color,afterglow,smoothstep(.27,.87,age/life)*.78);
    float fade=1.-smoothstep(life*.52,life,age);
    float twinkle=.91+.09*sin(dot(position,vec3(.41,.87,.23))+vel.y*.6+age*13.);
    #ifdef STREAK
    tint=vec4(hue,fade*mix(.80,.12,min(tail/2.3,1.)));
    #else
    tint=vec4(hue,fade*twinkle);
    #endif
  }`;

function festivalSound() {
  const sound=getGameSound();
  let noise,shoreGain,surf;
  function setupNoise(audio) {
    if (!noise) {
      noise = audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);
      const samples = noise.getChannelData(0);
      let smooth = 0;
      for (let i=0;i<samples.length;i++) {
        smooth=(smooth+(Math.random()*2-1)*.12)/1.04;samples[i]=smooth;
      }
    }
  }
  function play(e,p) {
    const output=sound.output;
    if(!output)return;
    const audio=output.context;
    const dist = Math.hypot(e.x-p.x,e.z-p.z);
    if (dist>2650) return;
    setupNoise(audio);
    const when=audio.currentTime+dist/340;
    const quiet=["crossette","dahlia","ring","strobe"].includes(e.shape);
    const duration=quiet?.65:e.shape==="willow"?1.75:1.18;
    const src=audio.createBufferSource(),amp=audio.createGain(),filter=audio.createBiquadFilter();
    src.buffer=noise;src.playbackRate.value=quiet?.94:.51;
    filter.type="lowpass";filter.frequency.setValueAtTime(quiet?1500:940,when);
    filter.frequency.exponentialRampToValueAtTime(85,when+duration*.8);
    amp.gain.setValueAtTime(.0001,when);
    amp.gain.exponentialRampToValueAtTime((quiet?.19:.56)/(1+dist/275),when+.025);
    amp.gain.exponentialRampToValueAtTime(.001,when+duration);
    src.connect(filter).connect(amp).connect(output);src.start(when);src.stop(when+duration+.02);
    src.onended=()=>{src.disconnect();filter.disconnect();amp.disconnect();};
    // A returning two-note call ties the opening to the finale.
    if (e.shape==="chrysanthemum" || e.shape==="brocade") {
      const notes = e.shape==="brocade" ? [440,330] : [330,440];
      notes.forEach((hz,i)=>{
        const at=when+.15+i*.35, note=audio.createOscillator(), volume=audio.createGain();
        note.frequency.value=hz;volume.gain.setValueAtTime(.0001,at);
        volume.gain.exponentialRampToValueAtTime(.048/(1+dist/300),at+.055);
        volume.gain.exponentialRampToValueAtTime(.0001,at+1.22);
        note.connect(volume).connect(output);note.start(at);note.stop(at+1.24);
        note.onended=()=>{note.disconnect();volume.disconnect();};
      });
    }
  }
  function surfLevel(value) {
    const output=sound.output;
    if(!output||value<=0){
      if(surf){surf.stop();surf.disconnect();shoreGain.disconnect();surf=shoreGain=null;}
      return;
    }
    const audio=output.context;
    if(!surf){
      setupNoise(audio);surf=audio.createBufferSource();
      surf.buffer=noise;surf.loop=true;shoreGain=audio.createGain();shoreGain.gain.value=0;
      surf.connect(shoreGain).connect(output);surf.start();
    }
    shoreGain.gain.setTargetAtTime(value,audio.currentTime,.15);
  }
  return {play,surfLevel};
}

export function fireworks(scene,water) {
  const uniforms={t:{value:-10},pixels:{value:800},daylight:{value:1}};
  // Tint bright skies at the core of each spark, and add pure light against dark skies.
  // Both use the same world lighting throughout the performance.
  const options={uniforms,transparent:true,depthWrite:false,blending:T.CustomBlending,
    blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,vertexColors:true,vertexShader:flightShader};
  const composite=`
    #include <colorspace_fragment>
    gl_FragColor.rgb*=gl_FragColor.a;
    gl_FragColor.a*=daylight;
  `;
  const pointMat=new T.ShaderMaterial({...options,fragmentShader:`
    uniform float daylight;varying vec4 tint;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
    gl_FragColor=vec4(tint.rgb*(1.+.4*(1.-r)),tint.a*(1.-smoothstep(.15,1.,r)));
    ${composite}}`});
  const trailMat=new T.ShaderMaterial({...options,defines:{STREAK:1},fragmentShader:`
    uniform float daylight;varying vec4 tint;void main(){gl_FragColor=tint;
    ${composite}}`});
  const sections=new Map();
  for (const e of events) {
    const id=Math.floor((e.at-rise)/sectionLength);
    if (!sections.has(id)) sections.set(id,{from:e.at-rise,until:0,events:[],meshes:null});
    const section=sections.get(id);
    section.events.push(e);
    section.until=Math.max(section.until,e.at+5.45);
  }
  const sound=festivalSound();
  const weights=new Float32Array(3);
  let last=-1;
  return {update(age,p,clock,height) {
    uniforms.t.value=age;uniforms.pixels.value=height*.73;
    uniforms.daylight.value=1-water.night.value;
    weights.fill(0);water.glow.value=0;
    for(let i=0;i<3;i++){water.burst.value[i].setRGB(0,0,0);water.lightSite.value[i].set(0,0);}
    sound.surfLevel(Math.max(0,1-Math.abs(p.x-shore(p.z))/85)*(.18+.09*Math.sin(clock*1.2)));
    const nearby=Math.hypot(p.x-festivalFocus.x,p.z-festivalFocus.z)<2450;
    for (const section of sections.values()) {
      const needed=nearby&&age>=0&&age>=section.from-.8&&age<section.until;
      if (!needed) {
        if (section.meshes) {
          for (const mesh of section.meshes) {mesh.removeFromParent();mesh.geometry.dispose();}
          section.meshes=null;
        }
        continue;
      }
      section.meshes??=makeSection(section,scene,pointMat,trailMat);
      for (const e of section.events) {
        const dt=age-e.at;
        if (last>=0&&age-last<.65&&last<e.at&&dt>=0) sound.play(e,p);
        if(dt<0||dt>4.6) continue;
        const w=.54*Math.exp(-dt*1.18);
        const c=e.tones[dt>1.5?1:0],bank=e.bank,tint=water.burst.value[bank],site=water.lightSite.value[bank];
        tint.r+=w*c.r;tint.g+=w*c.g;tint.b+=w*c.b;
        site.x+=w*e.x;site.y+=w*e.z;weights[bank]+=w;
      }
    }
    for(let i=0;i<3;i++)if(weights[i]>0){
      water.lightSite.value[i].multiplyScalar(1/weights[i]);water.glow.value=1;
    }
    last=age;
  }};
}
