import * as T from "three";
import {beachStop,shore,festivalDuration} from "./pohang-layout.js";
const colors=[0xffba68,0xff6f93,0x78cedf,0xd4a2ff,0xffdd99,0xa6e5ab];
function rng(seed){return ()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);}
const TAU=2*Math.PI;
export function fireworks(scene,water){
 const origin={x:shore(beachStop.z)+215,z:beachStop.z-80};
 const points=[],color=[],starts=[],speeds=[],gravity=[],lifes=[],sizes=[],events=[];
 const rand=rng(82369);
 function add(x,y,z,vx,vy,vz,t,life,g,sz,c){
  points.push(x,y,z);speeds.push(vx,vy,vz);starts.push(t);lifes.push(life);gravity.push(g);sizes.push(sz);color.push(c.r,c.g,c.b);
 }
 for(let beat=0,t=1;t<festivalDuration-4;beat++,t+=t>61?.85:t>24?1.86:2.65){
  const count=t>60?3:beat%4===2?3:1;
  for(let j=0;j<count;j++){
   const at=t+j*.14,x=origin.x+rand()*34,z=origin.z+(j-(count-1)/2)*51+(rand()-.5)*104,y=34+rand()*42+(beat%5===3?15:0);
   const type=beat%5,col=new T.Color(colors[(beat+j)%colors.length]),gold=new T.Color(0xffc980);
   events.push({at:at+1.32,x,y,z,col});
   for(let k=0;k<27;k++){const u=k/27;add(x,.6+y*u,z,0,3.5,0,at+1.32*u,.38,.8,1.1,gold);}
   const n=type===2?110:142;
   for(let k=0;k<n;k++){
    const az=TAU*k*.6180339887,up=1-2*(k+.5)/n,sp=type===1?24:18+rand()*10;
    let dx=Math.sqrt(1-up*up)*Math.sin(az),dy=up,dz=Math.sqrt(1-up*up)*Math.cos(az);
    if(type===2){dx=.24*Math.cos(az);dy=Math.sin(az);dz=Math.cos(az);}
    if(type===3){dy=.1+.88*rand();dx*=1.25;dz*=1.25;}
    for(let trail=0;trail<(type===3?9:5);trail++){
     const u=1-trail*.057;add(x,y,z,dx*sp*u,dy*sp*u,dz*sp*u,at+1.32+trail*.022,2.65+rand()*.65+(type===3?1.0:0),type===3?4.9:3.0,trail?1.05:2.35,type===3?gold:col);
    }
   }
  }
 }
 const geometry=new T.BufferGeometry();
 for(const [key,values,n] of [["position",points,3],["color",color,3],["start",starts,1],["vel",speeds,3],["gravity",gravity,1],["life",lifes,1],["size",sizes,1]])geometry.setAttribute(key,new T.Float32BufferAttribute(values,n));
 const uniforms={t:{value:-10},pixels:{value:800}};
 const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexColors:true,
 vertexShader:`attribute float start,gravity,life,size;attribute vec3 vel;uniform float t,pixels;varying vec4 tint;
 void main(){float a=t-start;if(a<0.||a>=life){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=0.;return;}
 vec3 p=position+vel*(1.-exp(-.33*a))/.33;p.y-=gravity*a*a*.5;
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
 gl_PointSize=clamp(size*pixels/max(10.,-mv.z),1.,13.);
 tint=vec4(color,(1.-smoothstep(life*.48,life,a))*(.82+.18*sin(position.y*3.+a*22.)));}`,
 fragmentShader:`varying vec4 tint;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(tint.rgb*(1.+.4*(1.-r)),tint.a*(1.-smoothstep(.08,1.,r)));}`});
 // Link the visible heads to their recent positions, retaining the fine streaks of a falling ember.
 const tails={position:[],color:[],vel:[],start:[],life:[],gravity:[],lag:[]};
 for(let i=0;i<starts.length;i++){
  if(sizes[i]<2)continue;
  for(const delay of [.30,0]){
   for(const [name,values] of [["position",points],["color",color],["vel",speeds]])tails[name].push(...values.slice(i*3,i*3+3));
   tails.start.push(starts[i]);tails.life.push(lifes[i]);tails.gravity.push(gravity[i]);tails.lag.push(delay);
  }
 }
 const trails=new T.BufferGeometry();
 for(const [name,v] of Object.entries(tails))trails.setAttribute(name,new T.Float32BufferAttribute(v,["position","color","vel"].includes(name)?3:1));
 const lineMat=new T.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:`attribute float start,life,gravity,lag;attribute vec3 vel;uniform float t;varying vec4 tint;
 void main(){float age=t-start;if(age<0.||age>=life){gl_Position=vec4(2.,2.,2.,1.);return;}
 float a=max(0.,age-lag);vec3 p=position+vel*(1.-exp(-.33*a))/.33;p.y-=gravity*a*a*.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
 tint=vec4(color,(1.-smoothstep(.45*life,life,age))*(.52-lag));}`,fragmentShader:`varying vec4 tint;void main(){gl_FragColor=tint;}`});
 const streamers=new T.LineSegments(trails,lineMat);streamers.frustumCulled=false;scene.add(streamers);
 const spark=new T.Points(geometry,material);spark.frustumCulled=false;scene.add(spark);
 let last=-1,audio=null,noise=null,surf=null,gain=null;
 function unlock(){
  if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=new Audio();
   noise=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const samples=noise.getChannelData(0);let smooth=0;
   for(let i=0;i<samples.length;i++){smooth=(smooth+(Math.random()*2-1)*.12)/1.04;samples[i]=smooth;}
   surf=audio.createBufferSource();surf.buffer=noise;surf.loop=true;gain=audio.createGain();gain.gain.value=0;surf.connect(gain).connect(audio.destination);surf.start();}
  if(audio.state==="suspended")audio.resume().catch(()=>{});
 }
 function boom(e,p){
  if(!audio||audio.state!=="running")return;
  const dist=Math.hypot(e.x-p.x,e.z-p.z);if(dist>1300)return;
  const when=audio.currentTime+dist/340,src=audio.createBufferSource(),amp=audio.createGain(),filter=audio.createBiquadFilter();src.buffer=noise;src.playbackRate.value=.56;
  filter.type="lowpass";filter.frequency.setValueAtTime(850,when);filter.frequency.exponentialRampToValueAtTime(80,when+.85);
  amp.gain.setValueAtTime(.0001,when);amp.gain.exponentialRampToValueAtTime(Math.max(.04,.68/(1+dist/270)),when+.025);amp.gain.exponentialRampToValueAtTime(.001,when+1.35);src.connect(filter).connect(amp).connect(audio.destination);src.start(when);src.stop(when+1.4);
 }
 return {unlock,update(age,p,clock,height){
  spark.visible=streamers.visible=age>=0;uniforms.t.value=age;uniforms.pixels.value=height*.73;
  water.burst.value.setRGB(0,0,0);
  if(gain&&audio)gain.gain.setTargetAtTime(Math.max(0,1-Math.abs(p.x-shore(p.z))/85)*(.18+.09*Math.sin(clock*1.2)),audio.currentTime,.15);
  if(age>=0)for(const e of events){const t=age-e.at;
   if(last>=0&&age>=last&&age-last<.6&&last<e.at&&age>=e.at)boom(e,p);
   if(t<0||t>2.8)continue;// Color intensity follows the longest glowing tail.
   const amount=Math.exp(-t*1.6)*.66;water.burst.value.r+=e.col.r*amount;water.burst.value.g+=e.col.g*amount;water.burst.value.b+=e.col.b*amount;water.lightX.value=e.x;water.lightZ.value=e.z;}
  last=age;
 }};
}
