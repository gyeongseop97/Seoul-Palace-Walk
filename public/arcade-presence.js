import {CLAW_PRIZES} from "./arcade-games.js";
import {TARGET_LANES,readTargetSnapshot,targetSnapshot} from "./arcade-targets.js";

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
  if(Object.hasOwn(TARGET_LANES,kind))return targetSnapshot(state);
  if(kind==="baseball")return state;
  if(kind==="basket")return {kind,phase,score,level,ball:sample(ballFields,basket),rimX:round(rimX)};
  if(kind==="bowling")return {kind,roll:state.bowling?.roll??null};
  if(kind==="mole"){
    const {target,height,swingAt,finished,remaining}=state;
    return {kind,score,target,height:round(height),swingAt,finished,remaining};
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
  if(state?.kind==="claw"){
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
    const swing=age>=0&&age<520?Math.sin(Math.PI*age/520):0;
    const arm=model.arms[1];
    arm.upper.rotateX(bowl?-.25-1.55*swing:-.48-.95*swing);
    arm.lower.rotateX(bowl?-.33+.25*swing:-.62-1.00*swing);
    if(swing){
      const turn=-Math.PI/2-(roll?.angle??0)-model.group.rotation.y;
      model.group.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,swing*2.8);
      model.chest.rotateX(.20*swing);
    }
  }else if(state?.kind==="baseball"){
    const elapsed=clock-(state.swingAt??-Infinity);
    const swing=elapsed>=0&&elapsed<410?Math.sin(Math.PI*elapsed/410):0;
    model.chest.rotateY(.21-1.12*swing);
    model.arms[0].upper.rotateX(-.85-.54*swing);
    model.arms[0].lower.rotateX(-.84+.62*swing);
    model.arms[1].upper.rotateX(-.90-.56*swing);
    model.arms[1].lower.rotateX(-.94+.50*swing);
  }else if(state?.kind&&Object.hasOwn(TARGET_LANES,state.kind)){
    const recoil=state.phase==="flying"?.30:0;
    model.arms[0].upper.rotateX(-1.15+recoil);model.arms[0].lower.rotateX(-.71);
    model.arms[1].upper.rotateX(-1.46+recoil);model.arms[1].lower.rotateX(state.kind==="archery"?-.20:-.63);
  }
}
