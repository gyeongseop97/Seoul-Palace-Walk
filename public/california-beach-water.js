// Local metres in the Gyeongju game district. This module is shared with the
// movement simulation and contains no Three.js or browser dependencies.
const tau=Math.PI*2,clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const smooth=x=>x*x*(3-2*x);
const point=(x,z)=>({x,z});
export const beachWaveStart=249.4,beachWaveEnd=304.8;
const waveBanks=[[249.4,6329.5,6332.5],[250,6322,6339],[251.9,6315.5,6345.5],[256.7,6312.5,6352.5],
  [265,6310.8,6354.4],[273,6313.8,6354.1],[283,6318.1,6353.2],[291,6319.6,6351.5],[300,6320,6350.3],[304.8,6320,6350.3]];

export function waveSection(z){
  let i=1;while(i<waveBanks.length-1&&waveBanks[i][0]<z)i++;
  const [a,l,r]=waveBanks[i-1],[b,m,n]=waveBanks[i],t=smooth(clamp((z-a)/(b-a),0,1));
  return {left:l+(m-l)*t,right:r+(n-r)*t};
}

// Start at the entry on the northern bend and follow the water clockwise.
const guide=[[6299,239],[6305,246],[6304,259],[6306.5,272],[6308,289],[6304,305],[6305.5,319],
  [6301,329.5],[6292,333],[6284,326.5],[6281.5,316],[6284.3,303],[6282,290],[6284,275],[6281.5,263],[6283.5,249],[6289,241]];
function spline(a,b,c,d,t){return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
const river=[];
for(let i=0;i<guide.length;i++){
  const n=guide.length,a=guide[(i+n-1)%n],b=guide[i],c=guide[(i+1)%n],d=guide[(i+2)%n];
  for(let j=0;j<8;j++)river.push(point(spline(a[0],b[0],c[0],d[0],j/8),spline(a[1],b[1],c[1],d[1],j/8)));
}
let length=0;
for(let i=0;i<river.length;i++){
  const p=river[i],prev=river[(i+river.length-1)%river.length],next=river[(i+1)%river.length];
  const dx=next.x-prev.x,dz=next.z-prev.z,l=Math.hypot(dx,dz);
  p.tx=dx/l;p.tz=dz/l;p.half=2.75+.34*Math.cos(i*tau/river.length*3)+.12*Math.sin(i*tau/river.length*5);
  p.d=length;length+=Math.hypot(next.x-p.x,next.z-p.z);
}
export const beachRiver=river,beachRiverLength=length;
export function riverOffset(p,lateral){return point(p.x+p.tz*lateral,p.z-p.tx*lateral);}

export function kidsRim(a,f=1){
  const r=1+.075*Math.cos(3*a+.5)+.055*Math.sin(2*a-.4);
  return point(6369+12.15*Math.cos(a)*r*f,269.4+10.47*Math.sin(a)*r*f);
}
const kidsOutline=Array.from({length:80},(_,i)=>kidsRim(i*tau/80));
const waveLeft=[],waveRight=[];
for(let i=0;i<=74;i++){
  const z=beachWaveStart+(beachWaveEnd-beachWaveStart)*i/74,{left,right}=waveSection(z);
  waveLeft.push(point(left,z));waveRight.push(point(right,z));
}
export const beachPools=[
  {id:"wave",kind:"wave",name:"산타모니카비치",gate:point(6331,246),center:point(6331,278),outline:[...waveLeft,...waveRight.reverse()],holes:[]},
  {id:"river",kind:"river",name:"웨이브캐년",gate:point(6299,234),center:point(6299,239),outline:river.map(p=>riverOffset(p,p.half)),holes:[river.map(p=>riverOffset(p,-p.half)).reverse()]},
  {id:"kids",kind:"kids",name:"페블비치",gate:point(6369,257),center:point(6369,269.4),outline:kidsOutline,holes:[]}
];

// Vertices in the pool surfaces carry exactly these attributes. The phase
// repeats after 128 seconds so clients can use epoch clocks without GPU drift.
const period=128,omega=tau/period;
export function beachSeconds(clock){return ((clock/1000)%period+period)%period;}
export function beachWaveHeight(kind,phase,amplitude,t){
  if(kind==="kids")return .23+amplitude*Math.sin(phase-t*omega*37);
  const angle=phase+t*omega*(kind==="wave"?27:-34);
  const crest=(1+Math.sin(angle))*.5;
  return (kind==="wave"?.205:.25)+amplitude*(crest*crest*.84+.16*(.5+.5*Math.sin(angle*2-.65)));
}
export function waveSample(x,z){
  const t=clamp((z-beachWaveStart)/(beachWaveEnd-beachWaveStart),0,1),deep=smooth(clamp(t*1.22,0,1));
  return {phase:(z-beachWaveStart)*.345+.24*Math.sin((x-6331)*.17),amplitude:.035+.94*deep,depth:.15+1.78*deep};
}
export function riverSample(distance,lateral){
  return {phase:distance/beachRiverLength*tau*10,amplitude:.25+.07*Math.cos(distance/beachRiverLength*tau*3),depth:1.16-.25*lateral*lateral};
}
export function kidsSample(x,z,frac){
  return {phase:(x-6369)*.62+(z-269.4)*.29,amplitude:.026,depth:.23+.13*(1-frac*frac)};
}
const buckets=new Map(),cell=7;
for(let i=0;i<river.length;i++){
  const p=river[i],q=river[(i+1)%river.length],r=Math.max(p.half,q.half)+.4;
  for(let x=Math.floor((Math.min(p.x,q.x)-r)/cell);x<=Math.floor((Math.max(p.x,q.x)+r)/cell);x++){
    for(let z=Math.floor((Math.min(p.z,q.z)-r)/cell);z<=Math.floor((Math.max(p.z,q.z)+r)/cell);z++){
      const key=x*1000+z,list=buckets.get(key)??[];list.push(i);buckets.set(key,list);
    }
  }
}
export function beachWaterAt({x,z},clock=0){
  if(x<6277||x>6384||z<234||z>338)return null;
  const t=beachSeconds(clock);
  if(z>=beachWaveStart&&z<=beachWaveEnd){
    const {left,right}=waveSection(z);
    if(x>=left&&x<=right){
      const {phase,amplitude,depth}=waveSample(x,z),level=beachWaveHeight("wave",phase,amplitude,t);
      const surge=Math.cos(phase+t*omega*27);
      return {kind:"wave",level,depth:depth+level-.205,vx:.065*amplitude*Math.sin((x-6331)*.19),vz:-surge*amplitude*.78};
    }
  }
  if(x>6354&&z<282){
    const dx=(x-6369)/12.15,dz=(z-269.4)/10.47,a=Math.atan2(dz,dx);
    const frac=Math.hypot(dx,dz)/(1+.075*Math.cos(3*a+.5)+.055*Math.sin(2*a-.4));
    if(frac<=1){
      const {phase,amplitude,depth}=kidsSample(x,z,frac),level=beachWaveHeight("kids",phase,amplitude,t);
      return {kind:"kids",level,depth:depth+level-.23,vx:0,vz:0};
    }
  }
  const near=buckets.get(Math.floor(x/cell)*1000+Math.floor(z/cell));if(!near)return null;
  let best=Infinity,nearest=null;
  for(const i of near){
    const p=river[i],q=river[(i+1)%river.length],dx=q.x-p.x,dz=q.z-p.z;
    const s=clamp(((x-p.x)*dx+(z-p.z)*dz)/(dx*dx+dz*dz),0,1),rx=x-p.x-s*dx,rz=z-p.z-s*dz,sq=rx*rx+rz*rz;
    if(sq>=best)continue;
    const half=p.half+(q.half-p.half)*s;if(sq>half*half)continue;
    const vx=p.tx+(q.tx-p.tx)*s,vz=p.tz+(q.tz-p.tz)*s,l=Math.hypot(vx,vz),tx=vx/l,tz=vz/l;
    best=sq;nearest={d:p.d+s*Math.hypot(dx,dz),lateral:(rx*tz-rz*tx)/half,tx,tz};
  }
  if(!nearest)return null;
  const {d,lateral,tx,tz}=nearest,{phase,amplitude,depth}=riverSample(d,lateral);
  const level=beachWaveHeight("river",phase,amplitude,t),speed=1.26+.49*(1+Math.sin(phase-t*omega*34))*.5;
  const drift=lateral*.33;
  return {kind:"river",level,depth:depth+level-.25,vx:tx*speed-tz*drift,vz:tz*speed+tx*drift};
}
