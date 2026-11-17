import {CLAW_PRIZES} from "./arcade-games.js";
import {baseballBatterSide} from "./arcade-baseball.js";
import {TARGET_LANES,readTargetSnapshot,targetSnapshot} from "./arcade-targets.js";
import {classicSnapshot,isClassic} from "./arcade-classics.js";
import {MOLE_HOLES,moleSwing} from "./arcade-mole.js";

const headFields=["x","y","z","grip","swingX","swingZ","tiltX","tiltZ"];
const figureFields=["x","y","z","rotX","rotY","rotZ"];
const ballFields=["x","y","z"];
const round=value=>Math.round(value*1000)/1000;
const clamp=value=>Math.min(1,Math.max(0,value));
const fields=(keys,values)=>Object.fromEntries(keys.map((key,index)=>[key,values[index]]));
const sample=(keys,object)=>keys.map(key=>round(object[key]));
const blend=(a,b,portion)=>a+(b-a)*portion;

export function arcadeSnapshot(state){
  if(!state)return null;
  const {kind,phase,score,level,basket,claw,pump,rimX}=state;
  if(isClassic(kind))return classicSnapshot(state);
  if(Object.hasOwn(TARGET_LANES,kind))return targetSnapshot(state);
  if(kind==="baseball")return state;
  if(kind==="basket")return {kind,phase,score,level,ball:sample(ballFields,basket),rimX:round(rimX)};
  if(kind==="bowling")return {kind,roll:state.bowling?.roll??null};
  if(kind==="mole"){
    const {target,height,swingAt,swingHole,hit,finished,remaining}=state;
    return {kind,score,target,height:round(height),swingAt,swingHole,hit,finished,remaining};
  }
  if(kind==="claw"){
    const prizes=[];
    for(const [index,prize] of claw.prizes.entries()){
      const original=CLAW_PRIZES[index];
      if(!prize.available)prizes.push([index,false]);
      else if(figureFields.some(key=>round(prize[key])!==round(original[key])))prizes.push([index,...sample(figureFields,prize)]);
    }
    return {kind,head:sample(headFields,claw),holding:CLAW_PRIZES.findIndex(prize=>prize.id===claw.holding),prizes};
  }
  if(!pump)return null;
  return {kind,active:pump.active,score:pump.score,readyLane:pump.readyLane,litLane:pump.litLane,
    notes:pump.notes.slice(0,4).map(({lane,progress})=>[lane,round(progress)])};
}

function decode(packet,at){
  if(isClassic(packet.kind))return {...packet,at};
  if(Object.hasOwn(TARGET_LANES,packet.kind))return {...readTargetSnapshot(packet),at};
  if(packet.kind==="baseball")return {...packet,at};
  if(packet.kind==="bowling")return {kind:packet.kind,at,bowling:{roll:packet.roll}};
  if(packet.kind==="mole")return {...packet,at};
  if(packet.kind==="pump"){
    const {active,score,readyLane,litLane,notes}=packet;
    return {at,kind:packet.kind,pump:{active,finished:!active,score,readyLane,litLane,notes}};
  }
  if(packet.kind==="basket"){
    return {at,kind:packet.kind,phase:packet.phase,score:packet.score,level:packet.level,
      basket:fields(ballFields,packet.ball),rimX:packet.rimX};
  }
  const prizes=CLAW_PRIZES.map(prize=>({...prize,available:true}));
  for(const [index,...change] of packet.prizes){
    if(change[0]===false)prizes[index].available=false;
    else Object.assign(prizes[index],fields(figureFields,change));
  }
  return {at,kind:packet.kind,claw:{...fields(headFields,packet.head),holding:CLAW_PRIZES[packet.holding]?.id??null,prizes}};
}

export function receiveArcade(previous,packet,at){
  if(!packet)return null;
  if(previous?.next.at===at)return previous;
  const next=decode(packet,at),prior=previous?.next;
  return {next,prior:prior?.kind===next.kind&&at-prior.at<650?prior:null};
}

function interpolate(before,after,keys,portion){
  return Object.assign({...after},fields(keys,keys.map(key=>blend(before[key],after[key],portion))));
}
export function visibleArcade(samples,now){
  if(!samples||now-samples.next.at>5000)return null;
  const {next,prior}=samples;
  if(next.kind==="shooting")return {...next,clock:now};
  if(Object.hasOwn(TARGET_LANES,next.kind)||next.kind==="baseball")return next;
  if(next.kind==="bowling")return next;
  if(next.kind==="pump"){
    const {pump}=next;
    const delay=Math.max(0,Math.min(280,now-next.at));
    return {...next,pump:{...pump,litLane:delay>=250?-1:pump.litLane,readyLane:delay>=230?-1:pump.readyLane,
      notes:pump.notes.map(([lane,progress])=>({lane,progress:progress+delay/1450})).filter(note=>note.progress<1.16)}};
  }
  if(!prior)return next;
  const portion=clamp((now-155-prior.at)/(next.at-prior.at)),display=portion<.5?prior:next;
  if(portion===1)return next;
  if(isClassic(next.kind)){
    if(prior.phase!==next.phase)return next;
    const point=key=>next[key].map((value,index)=>blend(prior[key][index],value,portion));
    return {...display,ball:point("ball"),paddle:point("paddle"),rival:point("rival"),flippers:point("flippers")};
  }
  if(next.kind==="mole")return prior.target===next.target?{...display,height:blend(prior.height,next.height,portion)}:display;
  if(next.kind==="basket")return {...display,rimX:blend(prior.rimX,next.rimX,portion),
    basket:interpolate(prior.basket,next.basket,ballFields,portion)};
  const claw=interpolate(prior.claw,next.claw,headFields,portion),held=display.claw.holding;
  claw.holding=held;
  claw.prizes=display.claw.prizes.map((prize,index)=>{
    const before=prior.claw.prizes[index],after=next.claw.prizes[index];
    if(!before.available||!after.available||figureFields.every(key=>before[key]===after[key]))return prize;
    return interpolate(before,after,figureFields,portion);
  });
  return {...display,claw};
}

export function poseArcade(state,model,clock){
  if(isClassic(state?.kind)){
    if(state.kind==="airHockey"){
      const arm=model.arms[1];
      arm.upper.rotateX(-.79);arm.upper.rotateZ(state.paddle[0]*.36);arm.lower.rotateX(-.64-state.paddle[1]*.11);
    }else{
      model.arms.forEach((arm,i)=>{
        const motion=state.kind==="pinball"?state.flippers[i]:i===1?Math.abs(state.paddle[0]):0;
        arm.upper.rotateX(-.58-motion*.19);arm.lower.rotateX(-.58-motion*.34);
      });
    }
  }else if(state?.kind==="claw"){
    const [button,stick]=model.arms;
    stick.upper.rotateX(-.66);stick.lower.rotateX(-.56);
    const press=Math.min(1,Math.max(0,(1.72-state.claw.y)*3));
    button.upper.rotateX(-.29-.47*press);button.lower.rotateX(-.32-.32*press);
  }else if(state?.kind==="basket"){
    const flight=state.phase==="shooting";
    const release=flight?Math.max(.42,Math.min(1,(state.basket.y-1.25)*1.65)):0;
    for(const arm of model.arms){
      arm.upper.rotateX(-.72-release*.93);
      arm.lower.rotateX(-.80+release*.63);
    }
  }else if(state?.kind==="bowling"||state?.kind==="mole"){
    const bowl=state.kind==="bowling";
    const roll=bowl?state.bowling?.roll:null;
    const age=clock-(bowl?roll?.at:state.swingAt);
    const swing=bowl?(age>=0&&age<520?Math.sin(Math.PI*age/520):0):moleSwing(clock,state.swingAt);
    const arm=model.arms[bowl?1:0];
    arm.upper.rotateX(bowl?-.25-1.55*swing:-.48-.95*swing);
    arm.lower.rotateX(bowl?-.33+.25*swing:-.62-1.00*swing);
    if(swing){
      const shift=bowl?-(roll?.angle??0):Math.atan2(MOLE_HOLES[state.swingHole]?.x??0,1.43);
      const turn=-Math.PI/2+shift-model.group.rotation.y;
      model.group.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,Math.max(0,swing*2.8));
      model.chest.rotateX(.20*swing);
    }
  }else if(state?.kind==="baseball"&&state.hand){
    poseBatter(model,baseballBatterSide(state.hand),clock-(state.swingAt??-Infinity));
  }else if(state?.kind&&Object.hasOwn(TARGET_LANES,state.kind)){
    const recoil=state.phase==="flying"?.30:0;
    model.arms[0].upper.rotateX(-1.15+recoil);model.arms[0].lower.rotateX(-.71);
    model.arms[1].upper.rotateX(-1.46+recoil);model.arms[1].lower.rotateX(state.kind==="archery"?-.20:-.63);
  }
}

// ---- The batter ---------------------------------------------------------------------------
// Positions are in the chest's own space: x to the model's left, y up, z forward. rear is the
// side away from the pitcher, where the bat is held. Each key is the grip's place, the way the
// bat points from knob to barrel, and how far the chest has turned.
const SWING_MS=410,upperArm=.228,foreArm=.206;
const batterKeys=rear=>[
  {grip:[rear*.34,.44,.10],bat:[rear*.62,.74,-.28],turn:rear*.42},    // set: hands off the rear shoulder, bat up and clear of the head
  {grip:[rear*.05,.27,.40],bat:[rear*.52,-.10,.85],turn:-rear*.38},   // contact: arms out, barrel over the plate
  {grip:[-rear*.30,.42,.14],bat:[-rear*.85,.35,-.38],turn:-rear*1.08} // finish: carried round past the front shoulder
];
const mix3=(a,b,t)=>a.map((value,i)=>value+(b[i]-value)*t);
const smooth=t=>t*t*(3-2*t);
function batterPose(rear,elapsed){
  const [set,contact,finish]=batterKeys(rear),t=elapsed>=0&&elapsed<SWING_MS?elapsed/SWING_MS:1;
  const [from,to,portion]=t<.30?[set,contact,smooth(t/.30)]:t<.62?[contact,finish,smooth((t-.30)/.32)]:
    t<1?[finish,set,smooth((t-.62)/.38)]:[set,set,0];
  return {grip:mix3(from.grip,to.grip,portion),bat:mix3(from.bat,to.bat,portion),turn:from.turn+(to.turn-from.turn)*portion};
}
// Bends an arm so its hand reaches a point; pole says which way the elbow should stick out.
function reachArm(arm,target,pole,Vector,Quaternion){
  const shoulder=arm.upper.position,reach=new Vector(target[0]-shoulder.x,target[1]-shoulder.y,target[2]-shoulder.z);
  const span=Math.min(upperArm+foreArm-.004,Math.max(.06,reach.length())),aim=reach.clone().normalize();
  const hint=new Vector(...pole);
  hint.addScaledVector(aim,-hint.dot(aim)).normalize();
  const lift=Math.acos(Math.max(-1,Math.min(1,(upperArm*upperArm+span*span-foreArm*foreArm)/(2*upperArm*span))));
  const along=aim.clone().multiplyScalar(Math.cos(lift)).addScaledVector(hint,Math.sin(lift));
  const elbow=along.clone().multiplyScalar(upperArm),fore=aim.clone().multiplyScalar(span).sub(elbow).normalize();
  // The upper arm hangs along -y and the elbow folds toward its own +z, so that axis is turned to face the forearm.
  const down=new Vector(0,-1,0),aimed=new Quaternion().setFromUnitVectors(down,along);
  const facing=new Vector(0,0,1).applyQuaternion(aimed),wanted=fore.clone().addScaledVector(along,-fore.dot(along)).normalize();
  const twist=Math.atan2(new Vector().crossVectors(facing,wanted).dot(along),facing.dot(wanted));
  arm.upper.quaternion.copy(new Quaternion().setFromAxisAngle(along,twist).multiply(aimed));
  arm.lower.quaternion.setFromAxisAngle(new Vector(1,0,0),-Math.acos(Math.max(-1,Math.min(1,along.dot(fore)))));
}
function poseBatter(model,side,elapsed){
  const Vector=model.group.position.constructor,Quaternion=model.group.quaternion.constructor;
  // A right-handed batter stands with the left shoulder to the pitcher, so the bat is held on the right.
  const rear=side,{grip,bat,turn}=batterPose(rear,elapsed);
  const top=model.arms[rear<0?0:1],bottom=model.arms[rear<0?1:0];
  const axis=new Vector(...bat).normalize(),hold=(offset)=>grip.map((value,i)=>value+axis.getComponent(i)*offset);
  model.chest.rotateY(turn);
  reachArm(top,hold(.05),[rear,-.45,-.35],Vector,Quaternion);
  reachArm(bottom,hold(-.05),[-rear*.55,-1,.15],Vector,Quaternion);
  // The eyes stay on the pitcher while the body turns under them.
  model.headJoint.rotateY(Math.max(-1.15,Math.min(1.15,-rear*.9-turn)));
  const gear=model.arcadeGear;
  if(gear?.kind==="baseball"){
    const hand=top.upper.quaternion.clone().multiply(top.lower.quaternion).multiply(top.end.quaternion).invert();
    gear.group.quaternion.copy(hand.multiply(new Quaternion().setFromUnitVectors(new Vector(0,1,0),axis)));
  }
}
