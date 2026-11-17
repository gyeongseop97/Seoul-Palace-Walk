import {ARCADE_GAMES,ARCADE_PADS} from "./arcade-layout.js";
import {makeArcadeGames} from "./arcade-games.js";
import {makeArcadeRhythm} from "./arcade-rhythm.js";

const titles={claw:"인형뽑기",pump:"펌프",basket:"농구 슛"};
const directions={left:[-1,0],up:[0,-1],down:[0,1],right:[1,0]};
const keyDirection={ArrowLeft:"left",ArrowUp:"up",ArrowDown:"down",ArrowRight:"right",a:"left",w:"up",s:"down",d:"right"};
const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};

export function bindArcade({root,getAvatar,onStart,onStop,playBeat}){
  const $=id=>root.ownerDocument.getElementById(id);
  const panel=$("arcade-panel"),title=$("arcade-title"),status=$("arcade-status"),beat=$("arcade-beat"),moves=$("arcade-move"),act=$("arcade-act");
  const games=makeArcadeGames(),rhythm=makeArcadeRhythm(playBeat);
  const pads=[...moves.querySelectorAll("[data-arcade-move]")];
  const keys=new Set(),pointers=new Map();
  let kind=null;

  function start(next){
    if(kind||!ARCADE_GAMES[next]||!onStart(next,ARCADE_GAMES[next]))return;
    const now=performance.now();kind=next;
    if(next==="pump")rhythm.start(now,getAvatar());
    else games.start(next,now);
    panel.hidden=false;root.classList.toggle("arcade-pump-active",next==="pump");
    root.classList.toggle("arcade-machine-active",next!=="pump");
    moves.hidden=next==="pump";beat.hidden=next!=="pump";
    for(const pad of pads)pad.hidden=next==="basket"&&["up","down"].includes(pad.dataset.arcadeMove);
    text(title,titles[next]);update(now,0);
  }
  function clear(){keys.clear();pointers.clear();}
  function stop(){
    if(!kind)return;
    kind=null;clear();games.stop();rhythm.stop();panel.hidden=true;
    root.classList.remove("arcade-pump-active","arcade-machine-active");onStop();
  }
  for(const mode of Object.keys(titles))$("arcade-"+mode).addEventListener("click",()=>start(mode));
  $("arcade-exit").addEventListener("click",stop);
  function press(){
    if(kind==="pump"&&rhythm.state(performance.now())?.finished)rhythm.start(performance.now(),getAvatar());
    else if(kind&&kind!=="pump")games.act(performance.now());
  }
  act.addEventListener("click",press);
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
    const direction=keyName(event);
    if(direction){event.preventDefault();keys.add(direction);}
    else if(event.code==="Space"&&!event.target.closest("button")){
      event.preventDefault();if(!event.repeat)press();
    }
    return Boolean(direction||event.code==="Space");
  }
  function update(now,elapsed){
    if(!kind)return;
    if(kind==="pump"){
      rhythm.update(now,getAvatar());const state=rhythm.state(now);
      beat.value=state.pulse;act.hidden=!state.finished;act.disabled=false;text(act,"다시 하기");
      text(status,state.finished?`점수 ${state.score} · 최고 연속 ${state.best}`:
        `${ARCADE_PADS[state.dueLane]?.arrow??""} 발판을 밟아요 · ${state.score}점${state.combo>1?` · ${state.combo}연속`:""}`);
      return;
    }
    let x=0,z=0;
    for(const direction of new Set([...keys,...pointers.values()])){
      x+=directions[direction][0];z+=directions[direction][1];
    }
    games.move(Math.sign(x),Math.sign(z),elapsed);games.tick(now,elapsed);
    const state=games.state(),aiming=state.phase==="aim";
    act.hidden=false;act.disabled=!aiming;text(act,kind==="claw"?"집게 내리기":"공 던지기");
    if(kind==="claw")text(status,state.lastResult==="success"?`${state.lastPrize} 획득 · ${state.score}개`:
      state.lastResult==="miss"?"집게를 인형 위로 다시 옮겨 보세요.":aiming?"집게를 인형 위로 옮기세요.":"집게가 움직이고 있어요.");
    else text(status,`성공 ${state.score}/${state.attempts} · ${aiming?"좌우로 조준하고 던지세요.":"공이 날아가고 있어요."}`);
  }
  return {get kind(){return kind;},get frozen(){return Boolean(kind&&kind!=="pump");},clear,keyDown:keydown,
    keyUp:event=>keys.delete(keyName(event)),update,stop,state:now=>kind==="pump"?{kind,pump:rhythm.state(now)}:kind?games.state():null};
}
