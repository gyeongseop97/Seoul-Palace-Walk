import {ARCADE_GAMES} from "./arcade-layout.js";
import {BASKET_CHARGE_MS,BASKET_REST_POWER,makeArcadeGames} from "./arcade-games.js";
import {makeArcadeRhythm} from "./arcade-rhythm.js";
import {drawPumpTrack} from "./arcade-pump-track.js";
import {makeBowling} from "./arcade-bowling.js";
import {makeArcadeMoles} from "./arcade-mole.js";

const titles={claw:"인형뽑기",pump:"펌프",basket:"농구 슛",bowling:"볼링",mole:"두더지 잡기"};
const canCharge=kind=>kind==="basket"||kind==="bowling";
const useAvatar=kind=>kind==="pump"||kind==="mole";
const directions={left:[-1,0],up:[0,-1],down:[0,1],right:[1,0]};
const keyDirection={ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down",ArrowRight:"right",a:"left",w:"up",s:"down",d:"right"};
const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};

export function bindArcade({root,getAvatar,getAim,getClock,onAim,onStart,onStop,playBeat,playBasketImpact}){
  const $=id=>root.ownerDocument.getElementById(id);
  const panel=$("arcade-panel"),title=$("arcade-title"),status=$("arcade-status"),track=$("arcade-pump-track"),moves=$("arcade-move"),act=$("arcade-act");
  const trackContext=track.getContext("2d",{alpha:false});
  const games=makeArcadeGames({playBasketImpact}),rhythm=makeArcadeRhythm(playBeat);
  const bowling=makeBowling(),moles=makeArcadeMoles(ARCADE_GAMES.mole);
  const chargeGauge=$("arcade-charge");
  const pads=[...moves.querySelectorAll("[data-arcade-move]")];
  const keys=new Set(),pointers=new Map();
  let kind=null,charge=null,bowlingState=null,pumpDrawAt=-Infinity;

  function start(next){
    if(kind||!ARCADE_GAMES[next]||!onStart(next,ARCADE_GAMES[next]))return;
    const now=performance.now();kind=next;
    if(next==="pump")rhythm.start(now,getAvatar());
    else if(next==="mole")moles.start(getClock(now));
    else if(next==="bowling")bowling.reset();
    else games.start(next,now);
    pumpDrawAt=-Infinity;
    panel.hidden=false;root.classList.toggle("arcade-avatar-active",useAvatar(next));
    root.classList.toggle("arcade-machine-active",!useAvatar(next));
    moves.hidden=next!=="claw";track.hidden=next!=="pump";
    chargeGauge.hidden=!canCharge(next);
    text(title,titles[next]);update(now,0);
  }
  function clear(){keys.clear();pointers.clear();charge=null;}
  function stop(){
    if(!kind)return;
    kind=null;clear();games.stop();rhythm.stop();panel.hidden=true;
    root.classList.remove("arcade-avatar-active","arcade-machine-active");onStop();
  }
  for(const mode of Object.keys(titles))$("arcade-"+mode).addEventListener("click",()=>start(mode));
  $("arcade-exit").addEventListener("click",stop);
  const powerAt=time=>charge?Math.min(1,Math.max(.05,(time-charge.at)/BASKET_CHARGE_MS)):BASKET_REST_POWER;
  function startCharge(source){
    if(!canCharge(kind)||charge||(kind==="bowling"?bowlingState?.rolling:games.state().phase!=="aim"))return false;
    charge={source,at:performance.now()};return true;
  }
  function endCharge(source,shoot){
    if(charge?.source!==source)return;
    const now=performance.now(),power=powerAt(now);
    charge=null;
    if(shoot)release(now,power);
  }
  function release(now,power){
    const view=getAim();
    if(kind==="bowling")bowling.throw(view.pan,power,getClock(now));
    else{games.aim(view,power);games.act(now,power);}
  }
  function press(event){
    const now=performance.now();
    if(kind==="pump"&&rhythm.state(now)?.finished)rhythm.start(now,getAvatar());
    else if(kind==="claw")games.act(now);
    else if(kind==="mole")moles.strike(getClock(now),getAvatar());
    else if(canCharge(kind)&&event?.detail===0&&!charge)release(now,BASKET_REST_POWER);
  }
  act.addEventListener("click",press);
  act.setAttribute("data-native-touch","");
  act.addEventListener("pointerdown",event=>{
    if(event.button!==0||!startCharge(event.pointerId))return;
    event.preventDefault();act.setPointerCapture(event.pointerId);
  });
  for(const type of ["pointerup","pointercancel","lostpointercapture"]){
    act.addEventListener(type,event=>endCharge(event.pointerId,type==="pointerup"));
  }
  for(const pad of pads){
    pad.setAttribute("data-native-touch","");
    const direction=pad.dataset.arcadeMove;
    pad.addEventListener("pointerdown",event=>{
      if(event.button!==0||!kind||kind==="pump")return;
      event.preventDefault();pad.setPointerCapture(event.pointerId);pointers.set(event.pointerId,direction);
      games.move(...directions[direction],.05);
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"])pad.addEventListener(type,event=>pointers.delete(event.pointerId));
    pad.addEventListener("click",event=>{if(event.detail===0)games.move(...directions[direction],.12);});
  }
  function keyName(event){return keyDirection[event.key.length===1?event.key.toLowerCase():event.key];}
  function keydown(event){
    if(!kind||event.target.closest("input,textarea,[contenteditable]"))return false;
    if(event.key==="Escape"){event.preventDefault();stop();return true;}
    if(kind==="pump")return false;
    if(kind==="mole"){
      if(event.code!=="Space"||event.target.closest("button")&&event.target!==act)return false;
      event.preventDefault();
      if(!event.repeat)press();
      return true;
    }
    const direction=keyName(event);
    if(direction){event.preventDefault();keys.add(direction);}
    else if(event.code==="Space"&&(!event.target.closest("button")||event.target===act)){
      event.preventDefault();
      if(!event.repeat){
        if(canCharge(kind))startCharge("keyboard");
        else press();
      }
    }
    return Boolean(direction||event.code==="Space");
  }
  function update(now,elapsed){
    if(!kind)return;
    if(kind==="pump"){
      rhythm.update(now,getAvatar(),elapsed*1000);const state=rhythm.state(now);
      if(trackContext&&now-pumpDrawAt>=31){drawPumpTrack(trackContext,state);pumpDrawAt=now;}
      act.hidden=!state.finished;act.disabled=false;text(act,"다시 하기");
      text(status,state.finished?`점수 ${state.score} · 최고 연속 ${state.best}`:
        state.result?`${state.result} · ${state.score}점${state.combo>1?` · ${state.combo}연속`:""}`:
          "화살표가 선에 겹칠 때 발판을 밟아요.");
      return;
    }
    if(kind==="mole"){
      const state=moles.state(getClock(now));
      act.hidden=false;act.disabled=false;text(act,state.finished?"다시 하기":"망치 치기");
      text(status,state.finished?`${state.score}마리 잡았어요`:`${state.score}마리 · ${state.remaining}초 · 두더지 앞으로 이동`);
      return;
    }
    let x=0,z=0;
    for(const direction of new Set([...keys,...pointers.values()])){
      x+=directions[direction][0];z+=directions[direction][1];
    }
    if(canCharge(kind)){
      if(x||z)onAim(Math.sign(x)*57*elapsed,Math.sign(z)*42*elapsed);
      if(kind==="basket")games.aim(getAim(),powerAt(now));
      chargeGauge.value=charge?powerAt(now):0;
    }else games.move(Math.sign(x),Math.sign(z),elapsed);
    if(kind==="bowling"){
      bowlingState=bowling.state(getClock(now));
      const {rolling,knocked,result,roll}=bowlingState;
      const finished=result==="strike"?"스트라이크!":result==="spare"?"스페어!":result==="miss"?"넘어간 핀이 없어요":
        result==="hit"?`${knocked}핀 · ${roll.attempt===1?"두 번째 투구":"다음 프레임"}`:"화면을 돌려 조준";
      act.hidden=false;act.disabled=rolling;text(act,charge?"놓아서 굴리기":"꾹 눌러 굴리기");
      text(status,rolling?`${knocked}핀 · 공 굴러가는 중`:finished);
      return;
    }
    games.tick(now,elapsed);
    const state=games.state(),aiming=state.phase==="aim";
    act.hidden=false;act.disabled=!aiming;text(act,kind==="claw"?"집게 내리기":charge?"놓아서 던지기":"꾹 눌러 던지기");
    if(kind==="claw")text(status,state.lastResult==="success"?`${state.lastPrize} 획득 · ${state.score}개`:
      state.lastResult==="miss"?"집게를 인형 위로 다시 옮겨 보세요.":aiming?"집게를 인형 위로 옮기세요.":"집게가 움직이고 있어요.");
    else text(status,`${state.level}단계 · ${state.score}/${state.attempts} 성공 · ${aiming?"화면을 돌려 조준":"공이 날아가는 중"}`);
  }
  return {get kind(){return kind;},get frozen(){return Boolean(kind&&!useAvatar(kind));},clear,keyDown:keydown,
    keyUp:event=>{keys.delete(keyName(event));if(event.code==="Space")endCharge("keyboard",true);},
    update,stop,state:now=>kind==="pump"?{kind,pump:rhythm.state(now)}:
      kind==="mole"?moles.state(getClock(now)):kind==="bowling"?{kind,bowling:bowlingState}:kind?games.state():null};
}
