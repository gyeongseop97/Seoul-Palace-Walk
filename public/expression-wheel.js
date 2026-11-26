const gestureIcons={wave:"👋",peace:"✌️",clap:"👏",punch:"👊",dance:"🕺",heart:"🫶",cheer:"🙌"};

export function bindExpressionWheel(dialog,scene,{menus,prepare,onOpen}){
  const ring=dialog.querySelector(".expression-ring"),options=dialog.querySelector(".expression-options");
  const switches=[...dialog.querySelectorAll("[data-mode]")];
  const hint=dialog.querySelector(".expression-instruction");
  const triggers=[...scene.querySelectorAll(".play-social [aria-expanded]")];
  let mode="emote",held=false,selected=-1,entries=[],lastPointer,centerX=0,centerY=0,radius=0;

  function select(index){
    if(entries[index]?.button.disabled)index=-1;
    if(index===selected)return;
    entries[selected]?.button.removeAttribute("data-selected");
    selected=index;
    ring.toggleAttribute("data-selected",index>=0);
    if(index>=0){
      entries[index].button.setAttribute("data-selected","");
      ring.style.setProperty("--sector-start",((index-.5)*360/entries.length)+"deg");
    }
  }
  function refresh(){
    if(!dialog.open)return;
    for(const {source,button,label} of entries){
      if(button.disabled!==source.disabled)button.disabled=source.disabled;
      const name=source.getAttribute("aria-label")||source.textContent.trim();
      if(label.textContent!==name)label.textContent=name;
    }
    if(entries[selected]?.button.disabled)select(-1);
  }
  function showMode(next){
    select(-1);mode=next;prepare(mode);
    for(const trigger of triggers)trigger.setAttribute("aria-expanded",String(trigger.id===mode+"-open"));
    for(const button of switches)button.setAttribute("aria-pressed",String(button.dataset.mode===mode));
    const sources=[...menus[mode].querySelectorAll("button")];
    entries=sources.map((source,i)=>{
      const angle=i*2*Math.PI/sources.length;
      const button=document.createElement("button"),icon=document.createElement("span"),label=document.createElement("span");
      button.type="button";button.className="expression-choice";button.dataset.index=String(i);
      icon.className="expression-icon";icon.setAttribute("aria-hidden","true");
      icon.textContent=source.dataset.emoji||gestureIcons[source.dataset.gesture]||"🧘";
      button.style.left=(50+36*Math.sin(angle))+"%";
      button.style.top=(50-36*Math.cos(angle))+"%";
      button.append(icon,label);
      return {source,button,label};
    });
    options.replaceChildren(...entries.map(entry=>entry.button));
    ring.style.setProperty("--sector",360/entries.length+"deg");
    refresh();
  }
  for(const button of switches)button.addEventListener("click",()=>showMode(button.dataset.mode));
  function pointIndex(x,y){
    const dx=x-centerX,dy=y-centerY,distance=Math.hypot(dx,dy);
    if(distance<radius*.36||distance>radius)return -1;
    const turn=Math.atan2(dx,-dy)/(2*Math.PI);
    return (Math.round(turn*entries.length)+entries.length)%entries.length;
  }
  function finish(index){
    if(!dialog.open)return;
    const source=entries[index]?.source;
    dialog.close();
    if(source&&!source.disabled)source.click();
  }
  scene.addEventListener("pointermove",event=>{
    if(event.pointerType==="mouse")lastPointer={x:event.clientX,y:event.clientY};
  },{passive:true});
  function open(next=mode,hold=false){
    if(dialog.open)return;
    onOpen();held=hold;
    dialog.showModal();
    showMode(next);
    hint.textContent=hold?"마우스로 고르고 T를 떼세요":"원하는 표현을 클릭하세요";
    const sceneBounds=scene.getBoundingClientRect();
    radius=ring.getBoundingClientRect().width/2;
    const place=(value,low,high)=>Math.max(low,Math.min(high,value));
    const left=Math.max(0,sceneBounds.left),right=Math.min(innerWidth,sceneBounds.right);
    const top=Math.max(0,sceneBounds.top),bottom=Math.min(innerHeight,sceneBounds.bottom);
    const anchor=hold&&lastPointer&&lastPointer.x>=left&&lastPointer.x<=right&&lastPointer.y>=top&&lastPointer.y<=bottom?lastPointer:null;
    centerX=place(anchor?.x??(left+right)/2,Math.max(radius+4,left+radius),Math.min(innerWidth-radius-4,right-radius));
    centerY=place(anchor?.y??(top+bottom)/2,Math.max(radius+4,top+radius),Math.min(innerHeight-radius-32,bottom-radius-28));
    dialog.style.left=centerX+"px";dialog.style.top=centerY+"px";
    switches.find(button=>button.dataset.mode===mode).focus({preventScroll:true});
  }
  dialog.addEventListener("pointermove",event=>select(pointIndex(event.clientX,event.clientY)));
  dialog.addEventListener("pointerout",event=>{if(!event.relatedTarget)select(-1);});
  dialog.addEventListener("click",event=>{
    if(event.target.closest(".expression-switch"))return;
    const index=event.target.closest(".expression-choice")?.dataset.index;
    finish(index===undefined?pointIndex(event.clientX,event.clientY):Number(index));
  });
  dialog.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowUp","ArrowRight","ArrowDown"].includes(event.key))return;
    event.preventDefault();
    const direction=event.key==="ArrowRight"||event.key==="ArrowDown"?1:-1;
    for(let n=1;n<=entries.length;n++){
      const i=((selected<0?(direction>0?-1:0):selected)+n*direction+entries.length)%entries.length;
      if(!entries[i].button.disabled){select(i);entries[i].button.focus();break;}
    }
  });
  window.addEventListener("keyup",event=>{
    const releaseT=event.code?event.code==="KeyT":event.key.toLowerCase()==="t";
    if(!dialog.open||!held||!releaseT)return;
    event.preventDefault();
    finish(document.hasFocus()&&dialog.contains(document.activeElement)&&!event.altKey&&!event.ctrlKey&&!event.metaKey?selected:-1);
  });
  const cancel=()=>{if(dialog.open)dialog.close();};
  dialog.addEventListener("close",()=>{
    if(!dialog.open)for(const trigger of triggers)trigger.setAttribute("aria-expanded","false");
  });
  window.addEventListener("blur",cancel);
  window.addEventListener("resize",cancel);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancel();});
  return {open,refresh,cancel,get showingGestures(){return dialog.open&&mode==="gesture";}};
}
