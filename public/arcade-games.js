export const CLAW_LIMITS=Object.freeze({x:.55,z:.37,low:.12,high:1.35});
export const CLAW_CHUTE=Object.freeze({x:-.53,z:.3});
export const CLAW_PRIZES=Object.freeze([
  Object.freeze({id:"bear",type:"bear",label:"곰 인형",x:-.39,y:.15,z:-.23,radius:.15}),
  Object.freeze({id:"rabbit",type:"rabbit",label:"토끼 인형",x:-.04,y:.18,z:-.25,radius:.15}),
  Object.freeze({id:"cat",type:"cat",label:"고양이 인형",x:.34,y:.15,z:-.21,radius:.15}),
  Object.freeze({id:"duck",type:"duck",label:"오리 인형",x:-.22,y:.14,z:.11,radius:.15}),
  Object.freeze({id:"panda",type:"panda",label:"판다 인형",x:.14,y:.15,z:.1,radius:.15}),
  Object.freeze({id:"star",type:"star",label:"별 인형",x:.43,y:.12,z:.2,radius:.14})
]);
export const BASKET_HOOP=Object.freeze({x:0,y:1.67,z:-.8});
export const BASKET_BALL=Object.freeze({x:.34,y:.95,z:1.6,radius:.11});

const clawClock=Object.freeze({closed:1000,lifted:1790,returned:2550,released:2770,finished:3220});
const gravity=9.8,basketRimTime=.82,basketGroundTime=1.16,basketReturnTime=1.8;
const basketStarts=[BASKET_BALL.x,-.38,.27,-.28,.42,-.33];
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const mix=(a,b,t)=>a+(b-a)*t;
const fraction=(time,start,end)=>clamp((time-start)/(end-start));
const ease=t=>t*t*(3-2*t);
const resetPrizes=()=>CLAW_PRIZES.map(prize=>({...prize,available:true}));

export function makeArcadeGames(){
  let kind=null,phase="idle",attempts=0,score=0,lastResult=null,lastPrize=null,active=null;
  const claw={...CLAW_CHUTE,y:CLAW_LIMITS.high,grip:0,holding:null,prizes:resetPrizes(),won:[]};
  const basket={...BASKET_BALL};

  function start(next,time){
    if(next!=="claw"&&next!=="basket")return false;
    kind=next;phase="aim";attempts=score=0;lastResult=lastPrize=null;active=null;
    Object.assign(claw,CLAW_CHUTE,{y:CLAW_LIMITS.high,grip:0,holding:null,prizes:resetPrizes(),won:[]});
    Object.assign(basket,BASKET_BALL);
    return true;
  }

  function stop(){kind=null;phase="idle";active=null;}

  function move(dx,dy,elapsed){
    if(phase!=="aim"||!Number.isFinite(elapsed)||elapsed<=0)return false;
    const dt=Math.min(.15,elapsed);
    dx=Number.isFinite(dx)?clamp(dx,-1,1):0;
    dy=Number.isFinite(dy)?clamp(dy,-1,1):0;
    if(kind==="claw"){
      claw.x=clamp(claw.x+dx*dt*.82,-CLAW_LIMITS.x,CLAW_LIMITS.x);
      claw.z=clamp(claw.z+dy*dt*.74,-CLAW_LIMITS.z,CLAW_LIMITS.z);
    }else if(kind==="basket")basket.x=clamp(basket.x+dx*dt*1.08,-.55,.55);
    return true;
  }

  function act(time){
    if(phase!=="aim"||!Number.isFinite(time))return false;
    attempts++;lastResult=lastPrize=null;
    if(kind==="claw"){
      if(!claw.prizes.some(prize=>prize.available))claw.prizes=resetPrizes();
      let candidate=null,best=Infinity;
      for(const prize of claw.prizes){
        const distance=Math.hypot(prize.x-claw.x,prize.z-claw.z);
        if(prize.available&&distance<=prize.radius&&distance<best){candidate=prize;best=distance;}
      }
      const {x,z}=claw;
      active={at:time,x,z,candidate,graspY:candidate?.y===undefined?CLAW_LIMITS.low:candidate.y+.115,settled:false};
      phase="descending";
    }else{
      active={at:time,x:basket.x,settled:false};phase="shooting";
    }
    return true;
  }

  function updateClaw(age){
    const {x,z,candidate,graspY}=active;
    const {closed,lifted,returned,released,finished}=clawClock;
    const reachingTime=690;
    if(age<reachingTime){
      phase="descending";claw.y=mix(CLAW_LIMITS.high,graspY,ease(fraction(age,0,reachingTime)));
    }else if(age<closed){
      phase="closing";claw.y=graspY;claw.grip=ease(fraction(age,reachingTime,closed));
    }else if(age<lifted){
      phase="lifting";claw.y=mix(graspY,CLAW_LIMITS.high,ease(fraction(age,closed,lifted)));
    }else if(age<returned){
      phase="returning";
      const t=ease(fraction(age,lifted,returned));
      claw.x=mix(x,CLAW_CHUTE.x,t);claw.z=mix(z,CLAW_CHUTE.z,t);
    }else{
      phase="releasing";Object.assign(claw,CLAW_CHUTE);
      claw.grip=1-ease(fraction(age,returned,released));
    }
    if(age>=closed){
      claw.grip=age<returned?1:claw.grip;
      if(age>=lifted)claw.y=CLAW_LIMITS.high;
      claw.holding=age<released?candidate?.id??null:null;
      if(candidate){
        candidate.x=claw.x;candidate.z=claw.z;
        candidate.y=age<released?claw.y-.115:mix(CLAW_LIMITS.high-.115,.04,fraction(age,released,finished)**2);
      }
    }
    if(age<finished)return;
    if(candidate){
      candidate.available=false;score++;claw.won.push(candidate.type);lastPrize=candidate.label;
    }
    lastResult=candidate?"success":"miss";
    phase="aim";active=null;
  }

  function updateBasket(age){
    const time=age/1000;
    const speedY=(BASKET_HOOP.y-BASKET_BALL.y+.5*gravity*basketRimTime**2)/basketRimTime;
    if(time>=basketRimTime&&!active.settled){
      active.settled=true;
      const goal=Math.abs(active.x-BASKET_HOOP.x)<=.16;
      if(goal)score++;
      lastResult=goal?"success":"miss";
    }
    if(time<basketGroundTime){
      phase="shooting";
      basket.y=Math.max(BASKET_BALL.radius,BASKET_BALL.y+speedY*time-.5*gravity*time*time);
      basket.z=mix(BASKET_BALL.z,BASKET_HOOP.z,time/basketRimTime);
      if(time>basketRimTime)basket.z=mix(BASKET_HOOP.z,-.98,ease(fraction(time,basketRimTime,basketGroundTime)));
      return;
    }
    const next=basketStarts[attempts%basketStarts.length];
    const t=fraction(time,basketGroundTime,basketReturnTime);
    phase="returning";
    basket.x=mix(active.x,next,ease(t));basket.z=mix(-.98,BASKET_BALL.z,ease(t));
    basket.y=mix(BASKET_BALL.radius,BASKET_BALL.y,t)+Math.sin(t*Math.PI)**2*.16;
    if(t===1){phase="aim";active=null;}
  }

  function tick(time,elapsed){
    if(!active||!Number.isFinite(time))return;
    const age=Math.max(0,time-active.at);
    if(kind==="claw")updateClaw(age);
    else if(kind==="basket")updateBasket(age);
  }

  const state=()=>({kind,phase,attempts,score,lastResult,lastPrize,claw,basket});
  return {start,stop,move,act,tick,state};
}
