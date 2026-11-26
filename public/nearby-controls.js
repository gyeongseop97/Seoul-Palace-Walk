export function bindNearbyControls(root,focusGame,prefix="nearby",position=()=>null){
  const primary=root.querySelector("#"+prefix+"-primary");
  const label=primary.firstElementChild;
  const toggle=root.querySelector("#"+prefix+"-toggle");
  const panel=root.querySelector("#"+prefix+"-actions");
  const allActions=panel.hasAttribute("data-all-actions");
  const buttons=[...panel.querySelectorAll("button:not([data-action-tool])")];
  const firstMenuAction=()=>[...panel.querySelectorAll("button")].find(button=>
    !button.hidden&&!button.disabled&&!(allActions&&button===action));
  const doc=root.ownerDocument;
  let action=null,press=null,lastPanelFocus=null,pinned=null;
  // Remember deliberate selections, including a primary press forwarded into the menu.
  panel.addEventListener("click",event=>{
    const button=event.target.closest("button");
    if(button&&!button.hasAttribute("data-action-tool")&&!button.hidden&&!button.disabled){
      const here=position();
      pinned={button,target:button.dataset.actionTarget,x:here?.x,y:here?.y};
    }
  },true);

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
      (firstMenuAction()??panel).focus({preventScroll:true});
    }
  });
  panel.addEventListener("click",event=>{
    if(event.target.closest("button"))close(true);
  });
  primary.addEventListener("pointerdown",event=>{
    press={pointerId:event.pointerId,action,label:label.textContent,target:action?.dataset.actionTarget};
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
    if(pressed&&(pressed.action!==action||pressed.label!==label.textContent||pressed.target!==action.dataset.actionTarget))return;
    close();
    action.click();
  });

  function refresh(preferredId){
    const available=buttons.filter(button=>!button.hidden);
    const here=position();
    if(pinned&&(pinned.button.hidden||pinned.button.disabled||pinned.button.dataset.actionTarget!==pinned.target||
      (here&&Math.hypot(here.x-pinned.x,here.y-pinned.y)>3)))pinned=null;
    const next=pinned?.button??available.find(button=>button.id===preferredId)
      ??available.find(button=>!button.disabled)??available[0]??null;
    if(allActions&&next!==action){
      action?.removeAttribute("data-current-action");
      next?.setAttribute("data-current-action","");
    }
    action=next;
    const focused=doc.activeElement;
    const text=(action?.querySelector("[data-primary-label]")??action?.firstChild)?.textContent.trim()??"";
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
    const hideToggle=!allActions&&available.length<2;
    if(toggle.hidden!==hideToggle)toggle.hidden=hideToggle;
    if(toggle.hidden){
      close(true);
      if(focused===toggle)focusControls();
    }else if(!panel.hidden&&lastPanelFocus&&(focused===lastPanelFocus||focused===doc.body)&&
      (lastPanelFocus.hidden||lastPanelFocus.disabled||(allActions&&lastPanelFocus===action))){
      (firstMenuAction()??panel).focus({preventScroll:true});
    }
    if(focused===primary&&(primary.hidden||primary.disabled))focusControls();
  }
  return {refresh,close,reset(){pinned=press=null;close();},isPrimary:button=>action===button,ownsFocus:()=>!panel.hidden&&panel.contains(doc.activeElement)};
}
