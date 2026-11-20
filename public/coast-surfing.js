const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const radians=Math.PI/180;
const approach=(value,target,rate,dt)=>value+(target-value)*(1-Math.exp(-rate*dt));
const angleBetween=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

export function newSurfRide(){
 return {speed:0,rise:0,bank:0,grip:0,riding:false};
}

// Headings use the map's compass. Travel follows the nose, with a small down-wave slip.
// Grip bridges the gap between the steep face and the shoulder of the same wave.
export function stepSurfRide(ride,heading,inputX,inputZ,wave,dt){
 const power=Math.min(1,Math.hypot(inputX,inputZ));
 let bearing=heading*radians;
 const waterHeading=Math.atan2(wave.dx,-wave.dz);
 const alignment=Math.cos(angleBetween(bearing,waterHeading));
 const face=wave.drive*clamp((alignment+.35)/.75,0,1);
 if(!ride.riding&&power>.16&&ride.speed>.75&&face>.24){ride.riding=true;ride.grip=1;}
 if(ride.riding){
  if(face>.15)ride.grip=Math.min(1,ride.grip+dt*face*2);
  else ride.grip=Math.max(0,ride.grip-dt*(alignment<-.35?.82:.34));
  if(ride.grip<=0)ride.riding=false;
 }
 ride.rise=approach(ride.rise,Number(ride.riding),ride.riding?4.3:2.6,dt);
 const limit=ride.riding?1.28:2.25;
 let turn=power>.03?clamp(angleBetween(bearing,Math.atan2(inputX,-inputZ))*2.8,-limit,limit)*power:0;
 if(ride.riding&&!power)turn+=clamp(angleBetween(bearing,waterHeading),-.6,.6)*.42;
 bearing+=turn*dt;
 ride.bank=approach(ride.bank,clamp(turn/limit,-1,1)*ride.rise,4.5,dt);
 const target=ride.riding?2.2+2.4*ride.grip+4.2*face:power*2.65;
 ride.speed=approach(ride.speed,target,target>ride.speed?1.15:.90,dt);
 if(ride.speed<.015&&!power)ride.speed=0;
 const slip=wave.drive*(ride.riding?.58:.22);
 return {x:(Math.sin(bearing)*ride.speed+wave.dx*slip)*dt,z:(-Math.cos(bearing)*ride.speed+wave.dz*slip)*dt,
  heading:(bearing/radians%360+360)%360};
}

// Sample the same rendered water triangles at the rails, nose and tail, so both
// a local surfer and their companion see the board meet the face of the wave.
export function boardAttitude(p,yaw,t,water,bank=0){
 const s=Math.sin(yaw),c=Math.cos(yaw);
 const height=(across,along)=>water(p.x+c*across+s*along,p.z-s*across+c*along,t);
 const fore=height(0,.93),aft=height(0,-.93),star=height(.32,0),port=height(-.32,0);
 return {height:Math.max(height(0,0),(fore+aft)*.5)+.035,
  pitch:clamp(-Math.atan2(fore-aft,1.86),-1.0,1.0),roll:clamp(Math.atan2(star-port,.64)+bank*.30,-.95,.95)};
}

export function surferPose(model,ride,t){
 const up=clamp(ride?.rise??0,0,1),bank=ride?.bank??0;
 const speed=ride?.speed??0,lean=Math.abs(bank),phase=t*3.85;
 const mix=(a,b)=>a+(b-a)*up;
 model.body.position.set(0,mix(.072,0),mix(-.37,0));
 model.body.rotation.set(mix(1.40,0),1.34*up,0,'YXZ');
 model.pelvis.rotation.set(0,0,0);
 model.pelvis.position.set(0,mix(.57,.53-.065*lean),0);
 model.chest.rotation.set(mix(-.18,.22+.10*lean),-.36*up,-bank*.16);
 model.headJoint.rotation.set(mix(-.58,-.16),-.66*up,bank*.12);
 for(let i=0;i<2;i++){
  const side=i?1:-1,front=i===0,arm=model.arms[i],leg=model.legs[i];
  const stroke=clamp(speed/1.8,0,1),paddle=Math.sin(phase+i*Math.PI)*stroke;
  arm.upper.rotation.set(mix(-.80-1.23*paddle,-.32+(front?-.20:.18)),mix(side*.04,side*.18),side*mix(.45+.20*Math.cos(phase+i*Math.PI)*stroke,1.04+.17*bank*side));
  arm.lower.rotation.set(mix(-.43-.35*Math.max(0,paddle),front?-.35:-.42),0,side*.075);
  arm.end.rotation.set(mix(.19,.05),0,0);
  // Solve a planar bent knee with the ankle fixed on the deck. A wide stance
  // in body space puts one foot toward the nose when the hips turn sideways.
  const [thigh,shin]=leg.lengths,down=model.pelvis.position.y+leg.upper.position.y-.096;
  const spread=front?.20:.22,reach=Math.hypot(down,spread);
  const knee=Math.acos(clamp((reach*reach-thigh*thigh-shin*shin)/(2*thigh*shin),-1,1));
  const hip=-Math.atan2(shin*Math.sin(knee),thigh+shin*Math.cos(knee));
  leg.upper.rotation.set(mix(-.06,hip),0,side*mix(.075,Math.atan2(spread,down)),'ZXY');
  leg.lower.rotation.set(mix(.12,knee),0,0);
  leg.end.quaternion.copy(leg.upper.quaternion).multiply(leg.lower.quaternion).invert();
  leg.end.rotateY((front?-.36:.08)*up);
  // The standard walking and swimming rigs use XYZ Euler angles on the next frame.
  leg.upper.rotation.reorder('XYZ');
 }
 model.body.rotation.reorder('XYZ');
 for(const item of model.itemPivots)item.pivot.visible=false;
 model.tray.visible=false;
}
