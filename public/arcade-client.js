import {ARCADE_GAMES} from "./arcade-layout.js";
import {BASKET_CHARGE_MS,BASKET_REST_POWER,makeArcadeGames} from "./arcade-games.js";
import {makeArcadeRhythm} from "./arcade-rhythm.js";
import {drawPumpTrack} from "./arcade-pump-track.js";
import {bowlingScore,bowlingTurn} from "./arcade-bowling.js";
import {makeArcadeMoles} from "./arcade-mole.js";
import {makeArcadeTargets,TARGET_CHARGE_MS} from "./arcade-targets.js";
import {makeArcadeBaseball} from "./arcade-baseball.js";

export const arcadeTitles={claw:"인형뽑기",pump:"펌프",basket:"농구 슛",bowling:"볼링",mole:"두더지 잡기",shooting:"사격",archery:"양궁",baseball:"스크린 야구"};
const canCharge=kind=>kind==="basket"||kind==="bowling"||kind==="archery";
const isTarget=kind=>kind==="shooting"||kind==="archery";
const baseballText={miss:"헛스윙",foul:"파울",single:"안타",double:"2루타",home:"홈런"};
const useAvatar=kind=>kind==="pump"||kind==="mole";
const directions={left:[-1,0],up:[0,-1],down:[0,1],right:[1,0]};
const keyDirection={ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down",ArrowRight:"right",a:"left",w:"up",s:"down",d:"right"};
const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};

export function bindArcade({root,getAvatar,getAim,getClock,getBowling,getPlayerId,bowlingPending,commandBowling,
  onBowlMove,onAim,onStart,onStop,playBeat,playBasketImpact}){
  const $=id=>root.ownerDocument.getElementById(id);
  const panel=$("arcade-panel"),title=$("arcade-title"),status=$("arcade-status"),track=$("arcade-pump-track"),moves=$("arcade-move"),act=$("arcade-act");
  const trackContext=track.getContext("2d",{alpha:false});
  const games=makeArcadeGames({playBasketImpact}),rhythm=makeArcadeRhythm(playBeat);
  const moles=makeArcadeMoles(ARCADE_GAMES.mole);
  const targets=makeArcadeTargets(),baseball=makeArcadeBaseball();
  const chargeGauge=$("arcade-charge");
  const pads=[...moves.querySelectorAll("[data-arcade-move]")];
  const keys=new Set(),pointers=new Map();
  let kind=null,charge=null,pumpDrawAt=-Infinity;
  const mayBowl=()=>{
    const match=getBowling();
    return match?.phase==="playing"&&match.turn===getPlayerId()&&!match.roll&&!bowlingPending();
  };

  function start(next){
    if(kind||!ARCADE_GAMES[next]||!onStart(next,ARCADE_GAMES[next]))return;
    const now=performance.now();kind=next;
    if(next==="pump")rhythm.start(now,getAvatar());
    else if(next==="mole")moles.start(getClock(now));
    else if(next==="bowling")commandBowling({action:"join"});
    else if(isTarget(next))targets.start(next);
    else if(next==="baseball")baseball.start(getClock(now));
    else games.start(next,now);
    pumpDrawAt=-Infinity;
    panel.hidden=false;root.classList.toggle("arcade-avatar-active",useAvatar(next));
    root.classList.toggle("arcade-machine-active",!useAvatar(next));
    root.classList.toggle("arcade-target-active",isTarget(next));
    moves.hidden=next!=="claw"&&next!=="bowling";track.hidden=next!=="pump";
    moves.setAttribute("aria-label",next==="bowling"?"투구 위치":"기계 조작");
    for(const pad of pads)pad.hidden=next==="bowling"&&["up","down"].includes(pad.dataset.arcadeMove);
    chargeGauge.hidden=!canCharge(next);
    act.toggleAttribute("data-native-touch",canCharge(next));
    text(title,arcadeTitles[next]);update(now,0);
  }
  function clear(){keys.clear();pointers.clear();charge=null;}
  function stop(){
    if(!kind)return;
    if(kind==="bowling"){onBowlMove(0,0);commandBowling({action:"leave"});}
    kind=null;clear();games.stop();rhythm.stop();targets.stop();panel.hidden=true;
    root.classList.remove("arcade-avatar-active","arcade-machine-active","arcade-target-active");onStop();
  }
  for(const mode of Object.keys(arcadeTitles))$("arcade-"+mode).addEventListener("click",()=>start(mode));
  $("arcade-exit").addEventListener("click",stop);
  function powerAt(time){
    if(!charge)return BASKET_REST_POWER;
    const cycle=Math.max(0,time-charge.at)/(kind==="archery"?TARGET_CHARGE_MS:BASKET_CHARGE_MS)%2;
    return Math.max(.05,1-Math.abs(cycle-1));
  }
  function startCharge(source){
    if(!canCharge(kind)||charge)return false;
    if(kind==="bowling"?!mayBowl():kind==="archery"?targets.state(performance.now())?.phase!=="aim":
      games.state().phase!=="aim"||games.state().finished)return false;
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
    if(kind==="bowling"){
      if(mayBowl())commandBowling({action:"throw",pan:view.pan,power});
    }else if(kind==="archery")targets.shoot(now,view,power);
    else{games.aim(view,power);games.act(now,power);}
  }
  function press(event){
    const now=performance.now();
    if(kind==="pump"&&rhythm.state(now)?.finished)rhythm.start(now,getAvatar());
    else if(kind==="claw")games.act(now);
    else if(kind==="mole")moles.strike(getClock(now),getAvatar());
    else if(kind==="baseball"){
      const clock=getClock(now);
      if(baseball.state(clock).finished)baseball.start(clock);
      else baseball.swing(clock);
    }else if(isTarget(kind)){
      if(targets.state(now)?.phase==="finished")targets.start(kind);
      else if(kind==="shooting"||event?.detail===0)targets.shoot(now,getAim());
    }
    else if(kind==="bowling"){
      const match=getBowling(),playing=match?.phase==="playing"&&match.players.some(player=>player.id===getPlayerId());
      if(!playing&&!bowlingPending())commandBowling({action:"join"});
      else if(event?.detail===0&&!charge)release(now,BASKET_REST_POWER);
    }else if(kind==="basket"){
      if(games.state().finished)games.start(kind,now);
      else if(event?.detail===0&&!charge)release(now,BASKET_REST_POWER);
    }
  }
  act.addEventListener("click",press);
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
      if(kind==="bowling"){if(mayBowl())onBowlMove(directions[direction][0],.055);}
      else games.move(...directions[direction],.05);
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"])pad.addEventListener(type,event=>pointers.delete(event.pointerId));
    pad.addEventListener("click",event=>{
      if(event.detail!==0)return;
      if(kind==="bowling"){if(mayBowl())onBowlMove(directions[direction][0],.12);}
      else games.move(...directions[direction],.12);
    });
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
        if(kind==="bowling"&&!mayBowl())press();
        else if(kind==="basket"&&games.state().finished)press();
        else if(kind==="archery"&&targets.state(performance.now())?.phase==="finished")press();
        else if(canCharge(kind))startCharge("keyboard");
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
    if(kind==="baseball"){
      const state=baseball.state(getClock(now));
      act.hidden=false;act.disabled=false;text(act,state.finished?"다시 하기":"스윙");
      text(status,state.finished?`타격 종료 · ${state.hits}안타 · ${state.score}점`:
        `${state.pitchNo}구 · ${baseballText[state.result]??"공이 홈플레이트에 오면 스윙"} · ${state.score}점`);
      return;
    }
    let x=0,z=0;
    for(const direction of new Set([...keys,...pointers.values()])){
      x+=directions[direction][0];z+=directions[direction][1];
    }
    if(isTarget(kind)){
      if(x||z)onAim(Math.sign(x)*42*elapsed,Math.sign(z)*36*elapsed);
      targets.aim(getAim(),powerAt(now));targets.update(now);
      const state=targets.state(now),finished=state.phase==="finished";
      act.hidden=false;act.disabled=state.phase==="flying";
      chargeGauge.hidden=kind!=="archery"||finished;
      act.toggleAttribute("data-native-touch",kind==="archery"&&!finished);
      chargeGauge.value=charge?powerAt(now):0;
      text(act,finished?"다시 하기":kind==="shooting"?"발사":charge?"놓아서 쏘기":"꾹 눌러 활 당기기");
      text(status,finished?`라운드 종료 · ${state.score}점`:
        `${state.score}점 · ${state.shotsLeft}발 남음${state.lastScore==null?"":` · 방금 ${state.lastScore}점`}`);
      return;
    }
    if(kind==="bowling"){
      const match=getBowling(),self=match?.players.find(player=>player.id===getPlayerId());
      const turn=match&&bowlingTurn(match),ready=mayBowl(),pending=bowlingPending();
      const finished=match?.phase==="finished"&&self,canJoin=!self||finished;
      if(!ready)charge=null;
      const stepped=onBowlMove(ready?Math.sign(x):0,elapsed);
      if(z&&ready)onAim(0,Math.sign(z)*42*elapsed);
      moves.hidden=!ready;
      chargeGauge.hidden=!ready;
      act.toggleAttribute("data-native-touch",ready);
      chargeGauge.value=charge?powerAt(now):0;
      act.hidden=false;act.disabled=pending||!ready&&!canJoin;
      text(act,pending?"확인 중":finished?"다시 하기":canJoin?"참가하기":
        !ready?"차례 기다리는 중":charge?"놓아서 굴리기":"꾹 눌러 굴리기");
      text(status,pending?"볼링 레인에 연결 중…":finished?`게임 종료 · ${bowlingScore(self.frames).total}점`:
        !self?"친구도 이 레인에서 볼링을 누르면 함께 칠 수 있어요.":
        ready?`${turn.frame}프레임 · ${turn.attempt}구 · 내 차례`:
        match.roll?`${match.players.find(player=>player.id===match.rollPlayer)?.nickname??"참가자"} 님이 굴렸어요`:
        `${turn?.player.nickname??"다음 참가자"} 님 차례`);
      return stepped;
    }
    if(kind==="basket"){
      if(x||z)onAim(Math.sign(x)*57*elapsed,Math.sign(z)*42*elapsed);
      games.aim(getAim(),powerAt(now));
      chargeGauge.value=charge?powerAt(now):0;
    }else games.move(Math.sign(x),Math.sign(z),elapsed);
    games.tick(now,elapsed);
    const state=games.state(),aiming=state.phase==="aim";
    act.hidden=false;act.disabled=!aiming;text(act,kind==="claw"?"집게 내리기":state.finished?"다시 하기":charge?"놓아서 던지기":"꾹 눌러 던지기");
    if(kind==="claw")text(status,state.lastResult==="success"?`${state.lastPrize} 획득 · ${state.score}개`:
      state.lastResult==="miss"?"집게를 인형 위로 다시 옮겨 보세요.":aiming?"집게를 인형 위로 옮기세요.":"집게가 움직이고 있어요.");
    else{
      chargeGauge.hidden=state.finished;
      act.toggleAttribute("data-native-touch",!state.finished);
      text(status,state.finished?`게임 종료 · ${state.score}골`:
        `${state.level}단계 · ${state.score}골 · 공 ${state.shotsLeft}개 남음 · ${aiming?"화면을 돌려 조준":"공이 날아가는 중"}`);
    }
  }
  return {get kind(){return kind;},get frozen(){return Boolean(kind&&!useAvatar(kind));},clear,keyDown:keydown,
    keyUp:event=>{keys.delete(keyName(event));if(event.code==="Space")endCharge("keyboard",true);},
    update,stop,state:now=>kind==="pump"?{kind,pump:rhythm.state(now)}:
      kind==="mole"?moles.state(getClock(now)):isTarget(kind)?targets.state(now):
      kind==="baseball"?baseball.state(getClock(now)):kind==="bowling"?
        {kind,canAim:mayBowl(),aimOffset:ARCADE_GAMES.bowling.y-getAvatar().y}:kind?games.state():null};
}
