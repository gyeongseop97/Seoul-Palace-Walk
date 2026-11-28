import {advanceFight,fishSpecies,rollFish,startFight} from "./sea-fishing.js";

const storageKey="yuram-sea-fishing:v1";

export function createSeaFishing(dialog,splash){
  const status=dialog.querySelector("[role=status]");
  const action=dialog.querySelector("[data-cast]");
  const reel=dialog.querySelector("[data-reel]");
  const twitch=dialog.querySelector("[data-twitch]");
  const bobber=dialog.querySelector(".fishing-bobber");
  const zones=Array.from(dialog.querySelectorAll("[data-fishing-zone]"));
  const gauges=dialog.querySelector("[data-gauges]");
  const tension=dialog.querySelector("[data-tension]");
  const progress=dialog.querySelector("[data-progress]");
  const tally=dialog.querySelector("[data-tally]");
  const records=dialog.querySelector("[data-records]");
  let phase="ready",deadline=0,fight=null,frame=0,lastTime=0,recordBook={};
  let heldPointer=null,heldSpace=false,zone=1,lastTwitch=0;
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey));
    if(saved&&typeof saved==="object"&&!Array.isArray(saved))recordBook=saved;
  }catch{}

  function refreshRecords(){
    const entries=fishSpecies.filter(fish=>Number.isFinite(recordBook[fish.name]?.size));
    tally.textContent=`어종 기록 ${entries.length}/${fishSpecies.length}`;
    records.replaceChildren(...entries.map(({name})=>{
      const item=document.createElement("li"),record=recordBook[name];
      item.textContent=`${name} · 최대 ${record.size} cm · ${record.count}마리`;
      return item;
    }));
  }
  function setPhase(next,message,label){
    phase=next;
    dialog.dataset.phase=next;
    status.textContent=message;
    gauges.hidden=reel.hidden=next!=="fight";
    action.hidden=next==="fight";
    action.disabled=next==="waiting";
    twitch.hidden=next!=="waiting";
    for(const button of zones)button.disabled=next!=="ready";
    action.textContent=label??"낚싯대 던지기";
    if(next==="fight")reel.focus({preventScroll:true});
    else if(next!=="waiting"&&dialog.open)action.focus({preventScroll:true});
  }
  function saveFish(fish){
    const previous=recordBook[fish.name];
    recordBook[fish.name]={size:Math.max(fish.size,previous?.size??0),count:(previous?.count??0)+1};
    try{localStorage.setItem(storageKey,JSON.stringify(recordBook));}catch{}
    refreshRecords();
  }
  function release(){
    heldPointer=null;heldSpace=false;
    reel.classList.remove("reeling");
  }
  function update(now){
    if(!dialog.open)return;
    if(phase==="waiting"&&now>=deadline){
      deadline=now+2000;
      setPhase("bite","찌가 잠겼어요! 지금 챔질하세요.","챔질하기");
      splash();
    }else if(phase==="bite"&&now>=deadline){
      setPhase("ready","물고기가 미끼를 놓고 갔어요. 다시 던져 보세요.");
    }else if(phase==="fight"){
      advanceFight(fight,Math.min(.07,(now-lastTime)/1000),heldSpace||heldPointer!==null);
      tension.value=fight.tension;
      progress.value=fight.landed;
      if(fight.outcome){
        release();
        if(fight.outcome==="caught"){
          saveFish(fight.fish);
          setPhase("ready",`${fight.fish.size} cm ${fight.fish.name}을(를) 낚았어요!`);
        }else setPhase("ready",fight.outcome==="snapped"?"줄이 끊어졌어요. 팽팽해지면 잠깐 놓아 주세요.":"물고기가 달아났어요. 힘이 빠질 때 줄을 감아 보세요.");
      }else{
        const message=fight.surge?"물고기가 힘껏 당겨요! 잠깐 놓아 주세요.":"줄이 느슨할 때 감아 올리세요.";
        if(status.textContent!==message)status.textContent=message;
      }
    }
    lastTime=now;
    frame=requestAnimationFrame(update);
  }
  function act(){
    if(phase==="ready"){
      deadline=performance.now()+1800+Math.random()*2600;
      lastTwitch=0;
      setPhase("waiting","찌를 지켜보세요. 물고기가 물면 챔질할 수 있어요.","입질 기다리는 중");
      splash();
    }else if(phase==="bite"){
      fight=startFight(rollFish(Math.random,zone));
      lastTime=performance.now();
      tension.value=fight.tension;progress.value=0;
      setPhase("fight","줄을 감아 올리세요.");
    }
  }
  function moveLure(){
    const now=performance.now();
    if(phase!=="waiting"||now-lastTwitch<650)return;
    lastTwitch=now;
    deadline=Math.max(now+250,deadline-430);
    bobber.animate([{translate:"0 0"},{translate:"7px 3px"},{translate:"0 0"}],{duration:300});
  }
  for(const [index,button] of zones.entries())button.addEventListener("click",()=>{
    zone=index;
    dialog.dataset.zone=String(index);
    for(const [i,option] of zones.entries())option.setAttribute("aria-pressed",String(i===zone));
  });
  twitch.addEventListener("click",moveLure);
  action.addEventListener("click",act);
  reel.addEventListener("pointerdown",event=>{
    if(event.button!==0||heldPointer!==null)return;
    event.preventDefault();
    heldPointer=event.pointerId;reel.setPointerCapture(event.pointerId);reel.classList.add("reeling");
  });
  for(const type of ["pointerup","pointercancel","lostpointercapture"]){
    reel.addEventListener(type,event=>{
      if(heldPointer!==event.pointerId)return;
      heldPointer=null;reel.classList.toggle("reeling",heldSpace);
    });
  }
  dialog.addEventListener("keydown",event=>{
    if(event.code==="KeyE"&&phase==="waiting"&&!event.repeat){event.preventDefault();event.stopPropagation();moveLure();return;}
    if(event.code!=="Space"||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.target.closest("summary, [data-fishing-close]")&&phase!=="fight")return;
    event.preventDefault();event.stopPropagation();
    if(event.repeat)return;
    if(phase==="fight"){heldSpace=true;reel.classList.add("reeling");}
    else act();
  });
  dialog.addEventListener("keyup",event=>{
    if(event.code!=="Space")return;
    heldSpace=false;reel.classList.toggle("reeling",heldPointer!==null);
  });
  window.addEventListener("blur",release);
  dialog.addEventListener("close",()=>{cancelAnimationFrame(frame);release();fight=null;});
  return {open(){
    if(dialog.open)return;
    refreshRecords();
    setPhase("ready","낚싯대를 던져 바닷속에 뭐가 있는지 확인해 보세요.");
    dialog.showModal();
    lastTime=performance.now();
    frame=requestAnimationFrame(update);
  }};
}
