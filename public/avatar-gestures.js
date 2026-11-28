import {isCycling} from "./sejong-bike.js";
export const GESTURE_DURATIONS=Object.freeze({wash:3000,wave:2450,clap:2250,punch:2100,dance:3600,heart:2500,cheer:2450,peace:2700,
  templeBow:5200,churchPrayer:4400});
export const SICK_DURATION_MS=2150;
export const MAX_ALCOHOL_LEVEL=8;
export const MAX_ALCOHOL_DRINKS=8;
export const ALCOHOL_DURATION_MS=120000;
export const BIKE_FALL_DURATION_MS=2750;

const TAU=Math.PI*2;
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};

// Palm, extended index and middle fingers, two folded fingers, and thumb.
export const peaceHandParts=side=>[
  [0xf2bd98,0,.047,.004,.078,.077,.052,0],
  [0xf2bd98,-side*.055,.144,.004,.027,.095,.029,side*.38],
  [0xf2bd98,side*.042,.158,.004,.028,.105,.029,-side*.35],
  [0xeeb58f,side*.050,.069,.040,.031,.037,.024,-side*.28],
  [0xeeb58f,side*.073,.047,.037,.025,.034,.023,-side*.34],
  [0xf2bd98,-side*.026,.076,.051,.026,.058,.024,-side*.68]
];

export function gestureAt(avatar,clock){
  const event=avatar.gesture;
  const explicit=Object.hasOwn(GESTURE_DURATIONS,event?.kind)&&Number.isFinite(event.at);
  const legacy=Number.isFinite(avatar.wave)?avatar.wave:0;
  const kind=explicit&&event.at>=legacy?event.kind:"wave",at=explicit&&event.at>=legacy?event.at:legacy;
  const duration=GESTURE_DURATIONS[kind],age=clock-at;
  if(!at||!Number.isFinite(age)||age< -240||age>=duration)return null;
  const time=Math.max(0,age)/1000;
  const weight=ease(Math.min(time/.235,(duration/1000-time)/.32));
  if(kind==="templeBow"){
    // Join the palms, kneel, lower the forehead, then rise in reverse order.
    const kneel=ease((time-.36)/.88)*ease((4.95-time)/.84);
    const bow=ease((time-1.22)/.92)*ease((4.07-time)/.86);
    return {kind,time,weight,worship:true,kneel,bow};
  }
  if(kind==="churchPrayer"){
    return {kind,time,weight:ease(Math.min(time/.65,(duration/1000-time)/.68)),worship:true,kneel:0,bow:0};
  }
  return {kind,time,weight};
}

export function alcoholLevel(avatar,clock){
  return avatar.blushUntil>clock?clamp(Math.trunc(Number(avatar.blushLevel))||1,1,MAX_ALCOHOL_LEVEL):0;
}

export function alcoholGlasses(avatar,clock){
  return avatar.blushUntil>clock?clamp(avatar.alcoholGlasses??0,0,MAX_ALCOHOL_DRINKS):0;
}

export function alcoholGait(avatar,clock,fast){
  const level=alcoholLevel(avatar,clock);
  if(!level||avatar.bus||isCycling(avatar)||avatar.seat!=null||avatar.groundSit||
    avatar.coast?.mode&&avatar.coast.mode!=="walk"&&avatar.coast.mode!=="deck")return null;
  const left=avatar.blushUntil-clock;
  if(left>ALCOHOL_DURATION_MS)return null;
  const strength=(.25+.75*level/MAX_ALCOHOL_LEVEL)*ease(left/4000);
  const phase=clock*.0027,sway=strength*(.76*Math.sin(phase)+.24*Math.sin(phase*2+.55));
  return {speedScale:1-strength*(fast?.56:.42),turn:sway*.28,lean:sway*.14};
}

// Try the staggered direction through the same collision checks as the intended step.
// A wall or a narrow path can leave room for the user's original direction.
export function staggeredStep(from,x,y,gait,advance){
  if(gait?.turn){
    const dx=x-from.x,dy=y-from.y,c=Math.cos(gait.turn),s=Math.sin(gait.turn);
    if(advance(from.x+dx*c-dy*s,from.y+dx*s+dy*c))return true;
  }
  return advance(x,y);
}

export function finishAlcoholSip(avatar,clock,empty){
  const level=alcoholLevel(avatar,clock),glasses=alcoholGlasses(avatar,clock);
  return {
    blushLevel:Math.min(MAX_ALCOHOL_LEVEL,level+1),
    blushUntil:clock+ALCOHOL_DURATION_MS,
    alcoholGlasses:Math.min(MAX_ALCOHOL_DRINKS,glasses+Number(empty)),
    sickAt:empty&&glasses>=2?clock:0
  };
}

export function bikeFallChance(avatar,clock,distance){
  if(distance<=0||!alcoholLevel(avatar,clock))return 0;
  const rate=.003+.003*Math.min(3,alcoholGlasses(avatar,clock));
  return 1-Math.exp(-distance*rate);
}

export function bikeFallAt(avatar,clock){
  const age=clock-avatar.bikeFallAt;
  if(!avatar.bikeFallAt||age<0||age>=BIKE_FALL_DURATION_MS)return null;
  const weight=ease(age/410)*(1-ease((age-1510)/(BIKE_FALL_DURATION_MS-1510)));
  return {kind:"bikeFall",time:age/1000,weight};
}

export function sickPoseAt(avatar,clock){
  const age=clock-avatar.sickAt;
  if(!avatar.sickAt||!Number.isFinite(age)||age<0||age>=SICK_DURATION_MS)return null;
  const time=Math.max(0,age)/1000;
  const weight=ease(Math.min(time/.24,(SICK_DURATION_MS/1000-time)/.44));
  const heave=(Math.sin((time-.19)*TAU*2.05)*.5+.5)**3;
  return {kind:"sick",time,weight,heave};
}

export function gestureHands(avatar,clock,hands,{riding,busy}){
  const {claspSide,itemFor,petting,feeding,petSide,waveSide,umbrellaHand}=hands;
  const grounded=!riding&&!avatar.bus;
  const sick=grounded?sickPoseAt(avatar,clock):null,fall=grounded?bikeFallAt(avatar,clock):null;
  const gesture=grounded&&!busy&&!petting&&!feeding&&!sick&&!fall?hands.gesture:null;
  const umbrellaOpen=Boolean(grounded&&avatar.umbrella&&!fall&&!gesture?.worship);
  const needsBoth=gesture?.kind==="wash"||gesture?.kind==="clap"||gesture?.kind==="heart"||gesture?.worship;
  const centreUmbrella=needsBoth&&!avatar.sharedUmbrella&&!claspSide&&!itemFor(1)&&!itemFor(-1);
  const umbrellaSide=umbrellaOpen&&!centreUmbrella?umbrellaHand||[1,-1].find(side=>side!==claspSide&&!itemFor(side)&&side!==petSide&&
    (gesture?.kind!=="wave"||side!==waveSide)):0;
  const free=side=>side!==claspSide&&side!==umbrellaSide&&!itemFor(side);
  const left=free(1),right=free(-1),gestureSide=left?1:right?-1:0;
  const allowed=gesture&&(gesture.kind==="dance"||(needsBoth?left&&right:gestureSide));
  const pose=fall??sick??(allowed?gesture:null);
  return {pose,sick,fall,umbrellaOpen,umbrellaSide,hand(side,firstPerson=false){
    return pose&&free(side)?gestureHand(pose,firstPerson?-side:side,firstPerson?-gestureSide:gestureSide,firstPerson):null;
  }};
}

export function gestureBody(pose){
  const {kind,time,weight,heave}=pose;
  const sway=Math.sin(time*TAU*1.36),bounce=Math.cos(time*TAU*2.72);
  switch(kind){
    case "templeBow":return {x:0,y:-.286*pose.kneel-.018*pose.bow,pitch:.065*weight+1.365*pose.bow,
      yaw:0,roll:0,headPitch:.10*weight+.19*pose.bow,headRoll:0};
    case "churchPrayer":return {x:0,y:0,pitch:.07*weight,yaw:0,roll:0,headPitch:.24*weight,headRoll:0};
    case "dance":return {x:sway*.061*weight,y:(bounce*.023-.025)*weight,pitch:.045*weight,
      yaw:sway*.21*weight,roll:-sway*.17*weight,headPitch:bounce*.06*weight,headRoll:sway*.13*weight};
    case "punch":return {x:0,y:0,pitch:.07*weight,yaw:Math.sin(time*TAU*1.75)*.21*weight,
      roll:Math.sin(time*TAU*1.75)*.052*weight,headPitch:-.04*weight,headRoll:0};
    case "clap":return {x:0,y:0,pitch:(.06+Math.cos(time*TAU*2.55)*.045)*weight,yaw:0,roll:0,headPitch:-.07*weight,headRoll:0};
    case "heart":return {x:0,y:0,pitch:-.025*weight,yaw:0,roll:0,headPitch:-.045*weight,headRoll:-.13*weight};
    case "peace":return {x:0,y:0,pitch:-.02*weight,yaw:0,roll:0,headPitch:-.045*weight,headRoll:-.115*weight};
    case "cheer":return {x:0,y:(-.02+.026*Math.sin(time*TAU*2.15))*weight,pitch:-.055*weight,yaw:0,
      roll:sway*.052*weight,headPitch:-.085*weight,headRoll:0};
    case "sick":return {x:0,y:(-.055-heave*.035)*weight,pitch:(.35+heave*.23)*weight,yaw:0,roll:sway*.035*weight,
      headPitch:(.12+heave*.14)*weight,headRoll:sway*.025*weight};
    case "bikeFall":return {x:0,y:0,pitch:.16*weight,yaw:0,roll:0,headPitch:.22*weight,headRoll:-.15*weight};
    default:return null;
  }
}

export function gestureHand(pose,side,waveSide,firstPerson=false){
  const {kind,time,weight,heave}=pose;
  switch(kind){
    case "templeBow":
    case "churchPrayer":{
      const bow=pose.bow;
      return firstPerson?{x:side*(.052+.29*bow),y:-.47-.27*bow,z:.67+.22*bow,bend:-.09-1.17*bow,roll:-side*(.22-.17*bow)}:
        {x:side*(.042+.20*bow),y:.34+.15*bow,z:.29+.090*bow,bend:-.18-.75*bow,roll:-side*.21*(1-bow)};
    }
    case "wave":{
      if(side!==waveSide)return null;
      const swing=Math.sin(time*17),lift=Math.cos(time*17);
      return firstPerson?{x:side*(.57+swing*.048),y:-.05+lift*.055,z:.74,bend:-.09,roll:side*.29+swing*.40,curl:-.16}:
        {x:side*(.590+swing*.075),y:.640+lift*.034,z:.150,bend:0,roll:side*swing*.20,curl:0};
    }
    case "wash":{
      const rub=Math.sin(time*TAU*2.3);
      return firstPerson?{x:side*.083,y:-.45+rub*side*.032,z:.68+side*rub*.045,bend:-.50,roll:side*.8}:
        {x:side*.065,y:.23+rub*side*.024,z:.35+side*rub*.037,bend:-.29,roll:side*.75};
    }
    case "clap":{
      const gap=(1-Math.cos(time*TAU*2.55))*.5;
      return firstPerson?{x:side*(.095+gap*.27),y:-.19-gap*.045,z:.77,bend:-.21,roll:side*.80,curl:-.18}:
        {x:side*(.085+gap*.235),y:.425-gap*.035,z:.369,bend:0,roll:side*.74,curl:0};
    }
    case "punch":{
      const extension=Math.max(0,Math.sin(time*TAU*1.75+(side<0?Math.PI:0)))**2.1;
      return firstPerson?{x:side*(.37-extension*.16),y:-.43+extension*.24,z:.66+extension*.31,bend:-1.08,roll:side*.17,curl:-1.31}:
        {x:side*(.246-extension*.044),y:.412+extension*.052,z:.232+extension*.227,bend:-.30,roll:side*.13,curl:-1};
    }
    case "dance":{
      const swing=Math.sin(time*TAU*1.36+side*Math.PI*.5),lift=Math.cos(time*TAU*1.36+side*.64);
      return firstPerson?{x:side*(.54+lift*.20),y:-.21+swing*.43,z:.77,bend:-.16,roll:side*(.48+lift*.27),curl:-.26}:
        {x:side*(.49+lift*.18),y:.45+swing*.24,z:.21,bend:-.05,roll:side*(.42+lift*.29),curl:0};
    }
    case "heart":{
      const lift=Math.sin(time*TAU*.68)*.016*weight;
      return firstPerson?{x:side*.105,y:.22+lift,z:.78,bend:-.13,roll:-side*.78,curl:-.50}:
        {x:side*.104,y:.700+lift,z:.233,bend:-.15,roll:-side*.78,curl:0};
    }
    case "peace":{
      if(side!==waveSide)return null;
      const lift=Math.sin(time*TAU*.74)*.013;
      return firstPerson?{x:side*.58,y:-.035+lift,z:.72,bend:-.16,roll:-side*.27}:
        {x:side*.51,y:.657+lift,z:.22,bend:-.12,roll:-side*.24};
    }
    case "cheer":{
      const pump=(1+Math.cos(time*TAU*2.15+side*.31))*.5;
      return firstPerson?{x:side*(.56+pump*.065),y:.44-pump*.34,z:.73,bend:-.41,roll:side*.26,curl:-1.15}:
        {x:side*(.47+pump*.11),y:.779-pump*.19,z:.115,bend:-.14,roll:side*.26,curl:-1};
    }
    case "sick":return side!==waveSide?null:firstPerson?
      {x:side*(.13+heave*.045),y:-.19-heave*.22,z:.54,bend:-.77,roll:side*.74,curl:-.40}:
      {x:side*(.122+heave*.03),y:.599-heave*.123,z:.294,bend:-.50,roll:side*.66,curl:0};
    case "bikeFall":return firstPerson?
      {x:side*.52,y:-.43,z:.76,bend:-.30,roll:side*.72,curl:0}:
      {x:side*.42,y:.16,z:.32,bend:-.16,roll:side*.28,curl:0};
    default:return null;
  }
}
