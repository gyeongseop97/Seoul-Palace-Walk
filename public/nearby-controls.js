export function bindNearbyControls(root,focusGame,prefix="nearby"){
  const primary=root.querySelector("#"+prefix+"-primary");
  const label=primary.firstElementChild;
  const toggle=root.querySelector("#"+prefix+"-toggle");
  const panel=root.querySelector("#"+prefix+"-actions");
  const buttons=[...panel.querySelectorAll("button")];
  const doc=root.ownerDocument;
  let action=null,press=null,lastPanelFocus=null;

  doc.addEventListener("focusin",event=>{
    if(panel.contains(event.target))lastPanelFocus=event.target;
    else if(event.target!==doc.body)lastPanelFocus=null;
  });

  function focusControls(){
    const button=!toggle.hidden?toggle:!primary.hidden&&!primary.disabled?primary:null;
    if(button)button.focus({preventScroll:true});
    else focusGame();
  }
  function close(restoreFocus=false){
    if(panel.hidden)return false;
    const hadFocus=panel.contains(doc.activeElement)||(doc.activeElement===doc.body&&lastPanelFocus);
    panel.hidden=true;
    lastPanelFocus=null;
    toggle.setAttribute("aria-expanded","false");
    if(restoreFocus&&hadFocus)focusControls();
    return true;
  }

  toggle.addEventListener("click",()=>{
    if(close(true))return;
    panel.hidden=false;
    toggle.setAttribute("aria-expanded","true");
    if(toggle.matches(":focus-visible")){
      (buttons.find(button=>!button.hidden&&!button.disabled)??panel).focus({preventScroll:true});
    }
  });
  panel.addEventListener("click",event=>{
    if(event.target.closest("button"))close(true);
  });
  primary.addEventListener("pointerdown",event=>{
    press={pointerId:event.pointerId,action,label:label.textContent};
  });
  function endPress(event){
    if(press?.pointerId!==event.pointerId)return;
    const finished=press;
    // A click can follow pointerup on mouse or touch.
    setTimeout(()=>{if(press===finished)press=null;},0);
  }
  doc.addEventListener("pointerup",endPress);
  doc.addEventListener("pointercancel",endPress);
  primary.addEventListener("click",()=>{
    const pressed=press;
    press=null;
    if(!action||action.hidden||action.disabled)return;
    if(pressed&&(pressed.action!==action||pressed.label!==label.textContent))return;
    close();
    action.click();
  });

  function refresh(preferredId){
    const available=buttons.filter(button=>!button.hidden);
    action=available.find(button=>button.id===preferredId)
      ??available.find(button=>!button.disabled)??available[0]??null;
    const focused=doc.activeElement;
    const text=action?.firstChild?.textContent.trim()??"";
    if(primary.hidden===Boolean(action))primary.hidden=!action;
    const disabled=!action||action.disabled;
    if(primary.disabled!==disabled)primary.disabled=disabled;
    if(label.textContent!==text)label.textContent=text;
    const title=action?.title||text;
    if(primary.title!==title)primary.title=title;
    for(const name of ["aria-label","aria-haspopup","aria-controls"]){
      const value=action?.getAttribute(name)??null;
      if(primary.getAttribute(name)===value)continue;
      if(value)primary.setAttribute(name,value);
      else primary.removeAttribute(name);
    }
    const hideToggle=available.length<2;
    if(toggle.hidden!==hideToggle)toggle.hidden=hideToggle;
    if(toggle.hidden){
      close(true);
      if(focused===toggle)focusControls();
    }else if(!panel.hidden&&lastPanelFocus&&(focused===lastPanelFocus||focused===doc.body)&&
      (lastPanelFocus.hidden||lastPanelFocus.disabled)){
      (available.find(button=>!button.disabled)??panel).focus({preventScroll:true});
    }
    if(focused===primary&&(primary.hidden||primary.disabled))focusControls();
  }
  return {refresh,close,isPrimary:button=>action===button,ownsFocus:()=>!panel.hidden&&panel.contains(doc.activeElement)};
}
