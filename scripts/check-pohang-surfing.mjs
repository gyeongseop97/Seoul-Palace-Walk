import assert from "node:assert/strict";
import {boardAttitude,newSurfRide,stepSurfRide,surferPose} from "../public/coast-surfing.js";
import {surfHeight,surfLineup,surfSample} from "../public/pohang-surf-waves.js";
import {createOceanGrid} from "../public/pohang-ocean-grid.js";
import {dock,mooring,pavilion,shore,wave} from "../public/pohang-layout.js";

const dt=1/60,calm={drive:0,dx:-1,dz:0};
const idle=newSurfRide();
for(let i=0;i<480;i++)stepSurfRide(idle,270,-1,0,calm,dt);
assert(idle.speed>2&&idle.speed<3&&!idle.riding,"paddling on flat water");

// Depart at different points in a real swell set. The moving board must actually
// intercept a face, stand up, carry speed into a turn, and settle back on flat water.
for(const start of [0,1,4,12,25,31,47]){
 const p={x:surfLineup.x+25,z:surfLineup.z};
 const ride=newSurfRide();
 let heading=90,maxSpeed=0,stood=false;
 for(let i=0;i<720&&!stood;i++){
  const step=stepSurfRide(ride,heading,-.65,.76,surfSample(p.x,p.z,start+i*dt),dt);
  p.x+=step.x;p.z+=step.z;heading=step.heading;
  maxSpeed=Math.max(maxSpeed,ride.speed);stood=ride.rise>.95&&ride.speed>3.5;
 }
 assert(stood&&maxSpeed>3.5,"caught a moving swell at "+start);
 for(let i=0;i<18;i++)heading=stepSurfRide(ride,heading,0,-1,{drive:.6,dx:-1,dz:0},dt).heading;
 assert(Math.abs(ride.bank)>.28,"bank while carving");
 for(let i=0;i<550;i++)heading=stepSurfRide(ride,heading,0,0,calm,dt).heading;
 assert(ride.rise<.001&&ride.speed<.15,"returned to the board after losing the wave");
}
const planeslope=(x,z)=>x*.2+z*.4;
const noseNorth=boardAttitude({x:0,z:0},Math.PI,0,planeslope);
const noseEast=boardAttitude({x:0,z:0},Math.PI*.5,0,planeslope);
assert(Math.abs(noseNorth.pitch-Math.atan(.4))<1e-10);
assert(Math.abs(noseEast.pitch+Math.atan(.2))<1e-10);
assert(Math.abs(noseNorth.roll+Math.atan(.2))<1e-10);

// Lightweight copy of the walker's joint dimensions for the forward kinematics
// check. Read angles before Euler reordering, which preserves orientation.
const vector=()=>({set(x,y,z){Object.assign(this,{x,y,z});},reorder(){}});
const quaternion={copy(){return this;},multiply(){return this;},invert(){return this;}};
const joint=()=>({rotation:vector(),position:vector(),quaternion,rotateY(){}});
const limb=()=>({upper:joint(),lower:joint(),end:joint(),lengths:[.284,.268]});
const model={body:joint(),pelvis:joint(),chest:joint(),headJoint:joint(),arms:[limb(),limb()],legs:[limb(),limb()],itemPivots:[],tray:{}};
for(const leg of model.legs)leg.upper.position.y=-.014;
for(const bank of [-1,0,1]){
 surferPose(model,{rise:1,bank,speed:6},0);
 for(const leg of model.legs){
  const {x:hip,z:spread}=leg.upper.rotation,knee=leg.lower.rotation.x;
  const [a,b]=leg.lengths,ankle=model.pelvis.position.y+leg.upper.position.y-(a*Math.cos(hip)+b*Math.cos(hip+knee))*Math.cos(spread);
  assert(Math.abs(ankle-.096)<1e-8,"both soles remain planted through the carve");
 }
}
surferPose(model,{rise:0,bank:0,speed:2},.4);
assert(Math.abs(model.arms[0].upper.rotation.x-model.arms[1].upper.rotation.x)>1.5,"alternating paddle strokes");
console.log("Surfing: caught seven moving swells, carved, settled, aligned both rails and kept both feet planted.");

// Compare the board height to an interior point of the indexed triangles, including
// all four edges where the detailed breaker mesh joins the original offshore grid.
const grid=createOceanGrid(),weights=[.19,.34,.47];
const blend=values=>values.reduce((sum,value,i)=>sum+weights[i]*value,0);
const vertexY=(id,t)=>{
 const x=grid.positions[3*id],z=grid.positions[3*id+2],d=grid.uv[2*id];
 const w=Math.max(0,Math.min(1,(d+5)/15)),field=4*id;
 return wave(x,z,t)*w*w*(3-2*w)+surfHeight(grid.fields[field],grid.fields[field+1],grid.fields[field+2],t);
};
let triangles=0;
for(let i=0;i<grid.indices.length;i+=3){
 const a=grid.indices[i],d=grid.uv[2*a],z0=grid.positions[3*a+2];
 if(d< -5||d>130||z0< -180||z0>140)continue;
 const ids=grid.indices.slice(i,i+3),x=blend(ids.map(id=>grid.positions[3*id])),z=blend(ids.map(id=>grid.positions[3*id+2]));
 for(const t of [0,3.7,47]){
  const surface=blend(ids.map(id=>vertexY(id,t)));
  assert(Math.abs(grid.height(x,z,t)-surface)<1e-8,"board matches a displaced water triangle at "+[x,z,t]);
 }
 triangles++;
}
assert(triangles>0);
for(const p of [dock,mooring,pavilion,{x:shore(surfLineup.z)+2,z:surfLineup.z}]){
 for(const t of [0,3.7,47])assert.equal(surfSample(p.x,p.z,t).height,0,"sheltered water stays clear of the surf break");
}
console.log(`Verified the rider's waterline on ${triangles} triangles and the sheltered pier, landing and beach edge.`);
