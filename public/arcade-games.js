import {advanceBasketShot, BASKET_BALL, createBasketShot} from "./arcade-basket-physics.js";
export {BASKET_BALL, BASKET_HOOP, basketTrajectory} from "./arcade-basket-physics.js";

export const CLAW_LIMITS=Object.freeze({x:.985,z:.695,low:.25,high:1.74});
export const CLAW_CHUTE=Object.freeze({x:-.874,z:.604,width:.52,depth:.51});
const prizeTypes=[
  ["bear","곰 인형"],["rabbit","토끼 인형"],["cat","고양이 인형"],["duck","오리 인형"],
  ["panda","판다 인형"],["star","별 인형"],["frog","개구리 인형"],["penguin","펭귄 인형"]
];
export const CLAW_PRIZES=Object.freeze([
  ...[-.68,-.36,-.03,.30,.64].flatMap((z,row)=>
    [-.94,-.56,-.18,.19,.55,.91].flatMap((x,column)=>
      (row===4&&column<2)||(row===3&&column===0)?[]:[[x,0,z,(row*5+column*3)%prizeTypes.length]])),
  [-.77,.21,-.51,0],[-.34,.19,-.58,3],[.05,.20,-.41,1],[.73,.20,-.49,4],
  [-.55,.19,-.18,6],[-.05,.18,.10,5],[.43,.20,.12,2],[.82,.19,.41,7],[.11,.16,.56,0]
].map(([x,y,z,kind],index)=>{
  const [type,label]=prizeTypes[kind];
  const scale=.83+(index*17%29)*.01;
  return Object.freeze({id:type+"-"+index,type,label,x,y,z,scale,variant:index*7%3,
    radius:.122*scale+(type==="star"?.043:.010),rotX:y?.26*Math.sin(index*2):.19*Math.sin(index*5),
    rotY:1.04*Math.sin(index*7),rotZ:y?.49*Math.cos(index*2):.16*Math.cos(index*3)});
}));
export const BASKET_CHARGE_MS=940;
export const BASKET_REST_POWER=.6;
export const BASKET_SHOT_LIMIT=10;

const clawClock=Object.freeze({reaching:760,closed:1110,lifted:2060,returned:3130,released:3430,finished:4260});
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const mix=(a,b,t)=>a+(b-a)*t;
const fraction=(time,start,end)=>clamp((time-start)/(end-start));
const ease=t=>t*t*(3-2*t);
const resetPrizes=()=>CLAW_PRIZES.map(prize=>({...prize,available:true}));

const clawRest={x:CLAW_CHUTE.x,z:CLAW_CHUTE.z,y:CLAW_LIMITS.high,grip:0,
  swingX:0,swingZ:0,tiltX:0,tiltZ:0,holding:null};

function findClawContact(prizes,x,z,random){
  let grab=null,best=-Infinity;
  for(const prize of prizes){
    if(!prize.available)continue;
    const dx=prize.x-x,dz=prize.z-z,distance=Math.hypot(dx,dz);
    if(distance>prize.radius+.095)continue;
    if(prizes.some(other=>other.available&&other.y>prize.y+.105&&
      Math.hypot(other.x-x,other.z-z)<other.radius+.078))continue;
    const closeness=1-distance/(prize.radius+.095);
    const priority=closeness+prize.y*.5;
    if(priority>best){grab={prize,dx,dz,closeness};best=priority;}
  }
  if(!grab)return null;
  const {prize,closeness}=grab;
  const stability=closeness+(random()-.5)*.27-.12*Math.abs(prize.rotZ);
  let release=clawClock.released;
  if(stability<.19)release=mix(1220,1580,clamp(stability/.19));
  else if(stability<.53)release=mix(2040,2820,fraction(stability,.19,.53));
  return {...grab,release,rotX:prize.rotX,rotY:prize.rotY,rotZ:prize.rotZ};
}

function clawPose(active,age){
  const {reaching,closed,lifted,returned,released}=clawClock;
  const start=active.graspY;
  const t=fraction(age,lifted,returned),travel=ease(t);
  const x=mix(active.x,CLAW_CHUTE.x,travel),z=mix(active.z,CLAW_CHUTE.z,travel);
  const y=age<reaching?mix(CLAW_LIMITS.high,start,ease(fraction(age,0,reaching))):
    mix(start,CLAW_LIMITS.high,ease(fraction(age,closed,lifted)));
  const grip=age<returned?ease(fraction(age,reaching,closed)):1-ease(fraction(age,returned,released));
  const vibration=age>=reaching?Math.sin((age-reaching)*.022)*Math.exp(-(age-reaching)*.004)*.028:0;
  const liftSwing=age>=closed?Math.sin((age-closed)*.010)*Math.exp(-(age-closed)*.0028)*.058:0;
  const damping=Math.exp(-Math.max(0,age-returned)*.008);
  const travelSwing=-Math.sin(2*Math.PI*t)*.087*damping;
  const stopSwing=age>=returned?Math.sin((age-returned)*.018)*damping*.053:0;
  const decay=Math.exp(-age*.006);
  const swingX=active.swingX*decay+(active.contact?.dx??.08)*liftSwing*3+vibration
    +(CLAW_CHUTE.x-active.x)*(travelSwing+stopSwing);
  const swingZ=active.swingZ*decay+(active.contact?.dz??-.07)*liftSwing*3-vibration*.53
    +(CLAW_CHUTE.z-active.z)*(travelSwing+stopSwing);
  return {x,y,z,grip,swingX,swingZ,tiltX:swingZ*2.5,tiltZ:-swingX*2.5};
}

function heldPrizePose(active,age,pose){
  const {contact}=active;
  const {prize,dx,dz,closeness,rotX,rotY,rotZ}=contact;
  const lift=ease(fraction(age,clawClock.closed,clawClock.lifted));
  const gripGap=.39*prize.scale;
  const sag=(1-closeness)*lift;
  return {
    x:pose.x+pose.swingX+dx*(1-.28*lift),
    z:pose.z+pose.swingZ+dz*(1-.28*lift),
    y:pose.y-gripGap-.047*sag,
    rotX:rotX+pose.tiltX*1.4-dz*sag*2.1,
    rotY:rotY+sag*.24,
    rotZ:rotZ+pose.tiltZ*1.4+dx*sag*2.1,
  };
}

function prepareClawDrop(prizes,active){
  const {contact}=active;
  const pose=heldPrizePose(active,contact.release,clawPose(active,contact.release));
  const previous=heldPrizePose(active,contact.release-18,clawPose(active,contact.release-18));
  const vx=(pose.x-previous.x)/.018,vz=(pose.z-previous.z)/.018;
  const vy=clamp((pose.y-previous.y)/.018,-.2,1);
  const horizontal=(seconds)=>({
    x:clamp(pose.x+vx*(1-Math.exp(-seconds*3))/3,-1.02,1.02),
    z:clamp(pose.z+vz*(1-Math.exp(-seconds*3))/3,-.72,.72),
  });
  const fallTime=y=>(vy+Math.sqrt(vy*vy+18*Math.max(0,pose.y-y)))/9;
  const crossing=horizontal(fallTime(0));
  const won=Math.abs(crossing.x-CLAW_CHUTE.x)<CLAW_CHUTE.width*.41&&
    Math.abs(crossing.z-CLAW_CHUTE.z)<CLAW_CHUTE.depth*.41;
  let floor=won?-.54:0;
  if(!won){
    for(const other of prizes){
      const height=Math.min(.46,other.y+.17*other.scale);
      if(other===contact.prize||!other.available||height<=floor||height>pose.y)continue;
      const atHeight=horizontal(fallTime(height));
      if(Math.hypot(other.x-atHeight.x,other.z-atHeight.z)<other.radius*.87)floor=height;
    }
  }
  const duration=fallTime(floor);
  return {pose,vy,horizontal,duration,floor,won,vx,vz};
}

function fallingPrizePose(drop,seconds){
  const {pose,vy,horizontal,duration,floor,won,vx,vz}=drop;
  const motionTime=Math.min(seconds,duration);
  const bounce=won?0:Math.min(.29,Math.max(0,seconds-duration));
  const rotationTime=Math.min(seconds,.46);
  const recoil=Math.sin(bounce/.29*Math.PI)*Math.min(.092,duration*.13);
  return {...horizontal(motionTime),y:Math.max(floor,pose.y+vy*motionTime-4.5*motionTime**2)+recoil,
    rotX:pose.rotX+rotationTime*(-.60+vz*1.8),rotY:pose.rotY+rotationTime*vx*.61,
    rotZ:pose.rotZ+rotationTime*(.54-vx*1.5)};
}

export function makeArcadeGames({random=Math.random,playBasketImpact=()=>{}}={}){
  let kind=null,phase="idle",attempts=0,score=0,lastResult=null,lastPrize=null,active=null;
  const claw={...clawRest,prizes:resetPrizes(),won:[]};
  const basket={...BASKET_BALL};
  let rimX=0,rimStart=0,level=1,lastRimX=0,basketAim={pan:270,tilt:0,power:BASKET_REST_POWER};

  function start(next,time){
    if(next!=="claw"&&next!=="basket")return false;
    kind=next;phase="aim";attempts=score=0;lastResult=lastPrize=null;active=null;
    Object.assign(claw,clawRest,{prizes:resetPrizes(),won:[]});
    Object.assign(basket,BASKET_BALL);
    rimX=lastRimX=0;rimStart=time;level=1;basketAim={pan:270,tilt:0,power:BASKET_REST_POWER};
    return true;
  }

  function stop(){kind=null;phase="idle";active=null;}

  function move(dx,dy,elapsed){
    if(phase!=="aim"||!Number.isFinite(elapsed)||elapsed<=0)return false;
    const dt=Math.min(.15,elapsed);
    dx=Number.isFinite(dx)?clamp(dx,-1,1):0;
    dy=Number.isFinite(dy)?clamp(dy,-1,1):0;
    if(kind==="claw"){
      const stepX=clamp(claw.x+dx*dt*.94,-CLAW_LIMITS.x,CLAW_LIMITS.x)-claw.x;
      const stepZ=clamp(claw.z+dy*dt*.86,-CLAW_LIMITS.z,CLAW_LIMITS.z)-claw.z;
      claw.x+=stepX;claw.z+=stepZ;
      const settle=1-Math.exp(-dt*14);
      claw.swingX=mix(claw.swingX,-stepX/dt*.048,settle);
      claw.swingZ=mix(claw.swingZ,-stepZ/dt*.048,settle);
      claw.tiltX=claw.swingZ*2.5;claw.tiltZ=-claw.swingX*2.5;
    }
    return true;
  }

  function act(time,power=basketAim.power){
    if(phase!=="aim"||!Number.isFinite(time)||kind==="basket"&&attempts>=BASKET_SHOT_LIMIT)return false;
    attempts++;lastResult=lastPrize=null;
    if(kind==="claw"){
      if(!claw.prizes.some(prize=>prize.available))claw.prizes=resetPrizes();
      const {x,z,swingX,swingZ}=claw;
      const contact=findClawContact(claw.prizes,x,z,random);
      const graspY=contact?contact.prize.y+.39*contact.prize.scale:CLAW_LIMITS.low;
      active={at:time,x,z,swingX,swingZ,contact,graspY,drop:null};
      if(contact)active.drop=prepareClawDrop(claw.prizes,active);
      phase="descending";
    }else{
      active=createBasketShot(time,basketAim,power);phase="shooting";
    }
    return true;
  }

  function updateClaw(age){
    const {contact,drop}=active;
    const {reaching,closed,lifted,returned,finished}=clawClock;
    Object.assign(claw,clawPose(active,age));
    phase=age<reaching?"descending":age<closed?"closing":age<lifted?"lifting":age<returned?"returning":"releasing";
    if(contact&&age>=closed){
      const {prize,release}=contact;
      const holding=age<release;
      claw.holding=holding?prize.id:null;
      Object.assign(prize,holding?heldPrizePose(active,age,claw):fallingPrizePose(drop,(age-release)/1000));
      if(!holding&&release<returned){
        const recoil=(age-release)/1000;
        claw.grip=clamp(claw.grip-.23*Math.sin(recoil*25)*Math.exp(-recoil*7));
      }
      if(drop.won&&(age-release)/1000>=drop.duration)prize.available=false;
    }
    if(age<Math.max(finished,contact?contact.release+drop.duration*1000:0))return;
    if(drop?.won){score++;claw.won.push(contact.prize.type);lastPrize=contact.prize.label;}
    lastResult=drop?.won?"success":"miss";
    phase="aim";active=null;
  }

  function hoopX(time){
    if(level===1)return 0;
    const elapsed=(time-rimStart)/1000;
    return clamp(lastRimX*Math.exp(-elapsed*4)+Math.sin(elapsed*(1.65+(level-2)*.22))*Math.min(.62,.32+(level-2)*.09),-.63,.63);
  }
  function updateBasket(now){
    if(active?.endedAt===null){
      advanceBasketShot(active,now,hoopX,(event,time,strength)=>{
        if(event==="score"){
          lastResult="success";
          if(++score%3===0){lastRimX=hoopX(time);rimStart=time;level++;}
        }
        if(now-time<150)playBasketImpact(event,strength);
      });
      if(active.endedAt!==null){
        phase="returning";
        if(!active.scored)lastResult="miss";
      }
    }
    rimX=hoopX(now);
    if(!active)return;
    const t=active.endedAt===null?0:fraction(now,active.endedAt,active.endedAt+690);
    basket.x=mix(active.x,BASKET_BALL.x,ease(t));basket.z=mix(active.z,BASKET_BALL.z,ease(t));
    basket.y=mix(active.y,BASKET_BALL.y,ease(t))+Math.sin(t*Math.PI)*.13;
    if(t===1){phase="aim";active=null;}
  }

  function tick(time,elapsed){
    if(!Number.isFinite(time))return;
    if(kind==="basket"){updateBasket(time);return;}
    if(!active)return;
    const age=Math.max(0,time-active.at);
    if(kind==="claw")updateClaw(age);
  }

  const aim=({pan,tilt},power)=>{
    if(kind==="basket"&&(pan!==basketAim.pan||tilt!==basketAim.tilt||power!==basketAim.power))basketAim={pan,tilt,power};
  };
  const state=()=>{
    const shotsLeft=kind==="basket"?BASKET_SHOT_LIMIT-attempts:null;
    return {kind,phase,attempts,score,lastResult,lastPrize,claw,basket,rimX,level,basketAim,shotsLeft,
      finished:shotsLeft===0&&phase==="aim"};
  };
  return {start,stop,move,act,tick,state,aim};
}
