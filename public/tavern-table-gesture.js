import {CLINK_DURATION_MS} from "./social-events.js";
import {ITEMS} from "./activities.js";

const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export function tavernGesture(player,clock,seat){
 if(!seat?.plate)return null;
 const {tasting,tableGlass}=player.coast,toast=player.clink,age=clock-toast?.startedAt;
 if(tableGlass&&Number.isFinite(toast?.targetX)&&Number.isFinite(toast.targetY)&&age>=0&&age<CLINK_DURATION_MS){
  return {kind:"toast",toast,lift:smooth(age/650)*smooth((CLINK_DURATION_MS-age)/580)};
 }
 if(tasting){
  const phase=(clock-tasting.at)/(ITEMS[tasting.kind]?.duration??1);
  if(phase>=0&&phase<1){
   if(tasting.kind==="sashimi")return {kind:"sashimi",lift:smooth((phase-.24)/.39)*smooth((1-phase)/.23),
    dip:1-smooth(phase/.18),slice:phase>=.18&&phase<.68};
   if(tasting.kind==="soju")return {kind:"sip",lift:smooth(phase/.42)*smooth((1-phase)/.28)};
   return null;
  }
 }
 return tableGlass?{kind:"glass",lift:0}:null;
}

export function makeTavernDining(T,{wx,wz},solve,bodyScale,handScale){
 const forward=new T.Vector3(0,0,1),aim=new T.Vector3(),wrist=new T.Vector3(),mouth=new T.Vector3();
 const tip=new T.Vector3(),direction=new T.Vector3(),delta=new T.Vector3(),offset=new T.Vector3(),pole=new T.Vector3();
 const rotation=new T.Quaternion(),chestRotation=new T.Quaternion(),orientation=new T.Quaternion();
 const pickupRotation=new T.Quaternion(),biteRotation=new T.Quaternion(),handRotation=new T.Quaternion();
 const palmOffset=new T.Vector3(0,-.044,.024).multiplyScalar(bodyScale*handScale);
 function toastPoint(model,seat,gesture){
  const {targetX,targetY}=gesture.toast;
  direction.set(targetX-seat.x,0,targetY-seat.y).normalize();
  // Neighbours on one bench reach in over the tabletop together.
  delta.set(seat.plate.tableX-targetX,0,seat.plate.tableY-targetY).clampLength(0,.215);
  return tip.set(wx(targetX),model.group.position.y+.899,wz(targetY)).add(delta).addScaledVector(direction,-.033);
 }
 function lean(model,seat,gesture){
  const {group,chest,pelvis}=model;
  const lift=gesture.lift;
  if(gesture.kind!=="toast"){
   chest.rotation.x+=gesture.kind==="sashimi"?.26-.15*lift:.10*lift;
   if(gesture.kind==="sip"){
    model.headJoint.rotation.x+=.51*lift;model.headJoint.rotation.y+=.39*lift;
   }
   return;
  }
  aim.copy(group.worldToLocal(toastPoint(model,seat,gesture)));
  gesture.side=aim.x>=0?1:-1;
  const bearing=Math.atan2(aim.x,aim.z);
  chest.rotation.y+=bearing*.32*lift;
  chest.rotation.x+=Math.cos(bearing)*.29*lift;
  chest.rotation.z-=Math.sin(bearing)*.10*lift;
  model.headJoint.rotation.z+=Math.sin(bearing)*.36*lift;
  model.headJoint.rotation.x-=.22*lift;
  const shoulder=model.arms[gesture.side<0?0:1].upper.getWorldPosition(delta);
  group.worldToLocal(shoulder);
  delta.subVectors(aim,shoulder);delta.y=0;
  const stretch=Math.max(0,delta.length()-.224)*lift/bodyScale;
  delta.normalize().multiplyScalar(stretch);
  pelvis.position.x+=delta.x;pelvis.position.z+=delta.z;
 }
 function hold(model,seat,gesture,index){
  const {group,chest,arms,itemPivots}=model,side=index===0?-1:1,{kind,lift}=gesture;
  const arm=arms[index],{pivot,show}=itemPivots[index],sticks=kind==="sashimi";
  group.getWorldQuaternion(rotation);
  model.faceMesh.localToWorld(mouth.set(0,-.615,.943));
  group.localToWorld(wrist.set(side*.157,.843,.192));
  if(sticks){
   tip.set(wx(seat.plate.x),seat.plate.h+.043*gesture.dip,wz(seat.plate.y)).lerp(mouth,lift);
   pickupRotation.setFromUnitVectors(forward,direction.set(-side*.42,-.53,.73).normalize());
   biteRotation.setFromUnitVectors(forward,direction.set(-side*.70,.63,-.34).normalize());
   orientation.copy(pickupRotation).slerp(biteRotation,lift).premultiply(rotation);
   wrist.copy(tip).sub(offset.set(0,0,.189).applyQuaternion(orientation));
  }else if(kind==="toast"){
   wrist.lerp(toastPoint(model,seat,gesture),lift);orientation.copy(rotation);
  }else{
   orientation.setFromAxisAngle(delta.set(1,0,0),-1.14*lift).premultiply(rotation);
   wrist.lerp(mouth.sub(offset.set(0,.035,-.031).applyQuaternion(orientation)),lift);
  }
  handRotation.setFromAxisAngle(delta.set(1,0,0),sticks?-.80:-.52).premultiply(rotation);
  if(!sticks)wrist.sub(offset.set(-side*.018,.027,.010).applyQuaternion(orientation));
  wrist.sub(offset.copy(palmOffset).applyQuaternion(handRotation));
  chest.worldToLocal(arm.target.copy(wrist));pole.set(side*.73,-.67,-.42);
  solve(arm,arm.target,pole);
  arm.end.parent.getWorldQuaternion(chestRotation).invert();
  arm.end.quaternion.copy(chestRotation).multiply(handRotation);
  arm.end.getWorldPosition(wrist).add(offset.copy(palmOffset).applyQuaternion(handRotation));
  if(!sticks)wrist.add(offset.set(-side*.018,.027,.010).applyQuaternion(orientation));
  const held=sticks?model.utensil.group:pivot;
  held.position.copy(chest.worldToLocal(wrist));
  chest.getWorldQuaternion(chestRotation).invert();held.quaternion.copy(chestRotation).multiply(orientation);
  pivot.visible=!sticks;
  show(sticks?null:"soju");
 }
 return {lean,hold};
}
