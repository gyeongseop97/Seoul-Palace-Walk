import * as T from "three";
import {oceanSurface} from "./pohang-water.js";

// Leave samples in sea coordinates. Foam from an earlier turn stays behind the
// yacht and dissipates even after the skipper has released the wheel.
export function createWake(root){
 const count=42,positions=new Float32Array(count*6),marks=new Float32Array(count*6),indices=[];
 for(let i=0;i<count-1;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
 const geo=new T.BufferGeometry(),pos=new T.BufferAttribute(positions,3),attr=new T.BufferAttribute(marks,3);
 pos.setUsage(T.DynamicDrawUsage);attr.setUsage(T.DynamicDrawUsage);
 geo.setAttribute("position",pos);geo.setAttribute("mark",attr);geo.setIndex(indices);
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
  uniforms:{night:{value:0},clock:{value:0}},
  vertexShader:`attribute vec3 mark; varying vec3 m; varying vec2 sea;
   void main(){m=mark;sea=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 m; varying vec2 sea; uniform float night,clock;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
   void main(){float side=abs(m.x),n=noise(sea*.54+vec2(clock*.27,0.))*.59+noise(sea*1.72)*.41;
    float outside=1.-smoothstep(.79,1.,side);
    float crests=exp(-abs(side-.76+.09*(n-.5))*14.)+.34*exp(-abs(side-.49)*13.);
    float churn=(1.-smoothstep(.12,.87,side))*.84*exp(-m.y*.115);
    float a=(crests+churn)*outside*smoothstep(.18,.69,n)*m.z;
    if(a<.012)discard; gl_FragColor=vec4(mix(vec3(.78,.95,.99),vec3(.30,.50,.58),night),min(.86,a));
    #include <colorspace_fragment>
   }`});
 const object=new T.Mesh(geo,material);object.frustumCulled=false;object.renderOrder=3;root.add(object);
 let last=null,lastTime=0,lastCrewTime=0,knots=[],signed=0,turn=0;
 return function update(ship,clock,night,water){
  const now=clock/1000,t=now%14400,dt=now-lastTime;
  const dx=last?ship.x-last.x:0,dz=last?ship.z-last.z:0;
  if(last&&dt>0&&dt<2&&Math.hypot(dx,dz)<35){
   const ease=1-Math.exp(-dt*2.7),a=ship.yaw,c=Math.cos(a),s=Math.sin(a);
   const velocity=Number.isFinite(ship.speed)?ship.speed:(dx*s+dz*c)/dt;
   signed+=(velocity-signed)*ease;
   turn+=(Math.atan2(Math.sin(a-last.yaw),Math.cos(a-last.yaw))/dt-turn)*ease;
  }else{signed=0;turn=0;knots=[];}
  water.speed.value=Math.min(1,Math.abs(signed)/11)*Math.sign(signed);
  water.turn.value=Math.max(-1,Math.min(1,turn*1.8));water.wake.value.set(ship.x,ship.z,ship.yaw);
  last={x:ship.x,z:ship.z,yaw:ship.yaw};lastTime=now;
  material.uniforms.clock.value=t;material.uniforms.night.value=night;
  const forward=signed>=0,dir=forward?1:-1,s=Math.sin(ship.yaw)*dir,c=Math.cos(ship.yaw)*dir;
  const x=ship.x-s*(forward?23:25),z=ship.z-c*(forward?23:25),speed=Math.abs(signed);
  while(knots.length&&now-knots.at(-1).at>18)knots.pop();
  if(speed>.55&&(!knots.length||Math.hypot(x-knots[0].x,z-knots[0].z)>2.05)){
   if(knots[0]&&Math.hypot(x-knots[0].x,z-knots[0].z)>20)knots=[];
   knots.unshift({x,z,s,c,at:now,power:Math.min(1,speed/9)});if(knots.length>count-1)knots.pop();
  }
  if(now-lastCrewTime<.082)return;lastCrewTime=now;
  const trail=speed>.55&&knots.length?[{x,z,s,c,at:now,power:knots[0].power},...knots]:knots;
  object.visible=trail.length>1;if(!object.visible)return;
  for(const [i,k] of trail.entries()){
   const age=now-k.at,width=3.6+(1-Math.exp(-age*.09))*11,fade=(1-Math.min(1,age/18))**1.4*k.power;
   for(let side=0;side<2;side++){
    const sign=side*2-1,px=k.x+sign*k.c*width,pz=k.z-sign*k.s*width,j=i*2+side;
    pos.setXYZ(j,px,oceanSurface(px,pz,t)+.072,pz);attr.setXYZ(j,sign,age,fade);
   }
  }
  geo.setDrawRange(0,(trail.length-1)*6);pos.needsUpdate=attr.needsUpdate=true;
 };
}
