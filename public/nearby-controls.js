export function bindNearbyControls(root,focusGame,prefix="nearby",position=()=>null){
  const primary=root.querySelector("#"+prefix+"-primary");
  const secondary=root.querySelector("#"+prefix+"-secondary");
  const toggle=root.querySelector("#"+prefix+"-toggle");
  const panel=root.querySelector("#"+prefix+"-actions");
  const buttons=[...panel.querySelectorAll("button")];
  const slots=[primary,secondary].filter(Boolean).map(element=>({element,label:element.firstElementChild,action:null,press:null}));
  const doc=root.ownerDocument;
  let lastPanelFocus=null,pinned=null,forwarding=null;
  const actionLabel=button=>(button?.querySelector("[data-primary-label]")??button?.firstChild)?.textContent.trim()??"";
  const inMenu=button=>!button.hidden&&(!secondary||!button.hasAttribute("data-current-action"));
  const firstMenuAction=()=>buttons.find(button=>inMenu(button)&&!button.disabled);
  panel.addEventListener("click",event=>{
    const button=event.target.closest("button");
    // Repeated presses on the second shortcut should keep targeting the same slot.
    if(button&&!button.hidden&&!button.disabled&&(!secondary||forwarding!==secondary)){
      const here=position();
      pinned={button,target:button.dataset.actionTarget,x:here?.x,y:here?.y};
    }
  },true);
  doc.addEventListener("focusin",event=>{
    if(panel.contains(event.target))lastPanelFocus=event.target;
    else if(event.target!==doc.body)lastPanelFocus=null;
  });
  function focusControls(){
    const button=!toggle.hidden?toggle:slots.find(slot=>slot.action&&!slot.element.disabled)?.element;
    if(button)button.focus({preventScroll:true});
    else focusGame();
  }
  function close(restoreFocus=false){
    if(panel.hidden)return false;
    const hadFocus=panel.contains(doc.activeElement)||(doc.activeElement===doc.body&&lastPanelFocus);
    panel.hidden=true;lastPanelFocus=null;
    toggle.setAttribute("aria-expanded","false");
    if(restoreFocus&&hadFocus)focusControls();
    return true;
  }
  toggle.addEventListener("click",()=>{
    if(close(true)||toggle.hidden)return;
    panel.hidden=false;
    toggle.setAttribute("aria-expanded","true");
    if(toggle.matches(":focus-visible"))(firstMenuAction()??panel).focus({preventScroll:true});
  });
  panel.addEventListener("click",event=>{
    if(event.target.closest("button"))close(true);
  });
  for(const slot of slots){
    slot.element.addEventListener("pointerdown",event=>{
      slot.press={id:event.pointerId,action:slot.action,label:slot.label.textContent,target:slot.action?.dataset.actionTarget};
    });
    function endPress(event){
      const press=slot.press;
      if(!press||press.id!==event.pointerId)return;
      setTimeout(()=>{if(slot.press===press)slot.press=null;},0);
    }
    doc.addEventListener("pointerup",endPress);
    doc.addEventListener("pointercancel",endPress);
    slot.element.addEventListener("click",()=>{
      const {press,action}=slot;
      slot.press=null;
      if(!action||action.hidden||action.disabled)return;
      if(press&&(press.action!==action||press.label!==slot.label.textContent||press.target!==action.dataset.actionTarget))return;
      close();forwarding=slot.element;
      try{action.click();}finally{forwarding=null;}
    });
  }
  function show(slot,action){
    slot.action=action;
    const {element,label}=slot;
    if(element.hidden===Boolean(action))element.hidden=!action;
    const disabled=!action||action.disabled;
    if(element.disabled!==disabled)element.disabled=disabled;
    const text=actionLabel(action);
    if(label.textContent!==text)label.textContent=text;
    const title=action?.title||text;
    if(element.title!==title)element.title=title;
    for(const name of ["aria-label","aria-haspopup","aria-controls"]){
      const value=action?.getAttribute(name)??null;
      if(element.getAttribute(name)===value)continue;
      if(value)element.setAttribute(name,value);
      else element.removeAttribute(name);
    }
  }
  function refresh(preferredId){
    const available=buttons.filter(button=>!button.hidden);
    const here=position();
    if(pinned&&(pinned.button.hidden||pinned.button.disabled||pinned.button.dataset.actionTarget!==pinned.target||
      (here&&Math.hypot(here.x-pinned.x,here.y-pinned.y)>3)))pinned=null;
    const preferred=available.find(button=>button.id===preferredId);
    const main=pinned?.button??(preferred?.disabled?null:preferred)??available.find(button=>!button.disabled)??preferred??available[0]??null;
    const mainLabel=actionLabel(main);
    const companion=secondary?(available.find(button=>button!==main&&!button.disabled&&actionLabel(button)!==mainLabel)??null):null;
    const focused=doc.activeElement;
    if(secondary&&(slots[0].action!==main||slots[1].action!==companion)){
      for(const slot of slots)slot.action?.removeAttribute("data-current-action");
      main?.setAttribute("data-current-action","primary");companion?.setAttribute("data-current-action","secondary");
    }
    show(slots[0],main);
    if(secondary)show(slots[1],companion);
    const hideToggle=secondary?!available.some(inMenu):available.length<2;
    if(toggle.hidden!==hideToggle)toggle.hidden=hideToggle;
    if(toggle.hidden){
      close(true);
      if(focused===toggle)focusControls();
    }else if(!panel.hidden&&lastPanelFocus&&lastPanelFocus!==panel&&
      (focused===lastPanelFocus||focused===doc.body)&&(!inMenu(lastPanelFocus)||lastPanelFocus.disabled)){
      (firstMenuAction()??panel).focus({preventScroll:true});
    }
    if(slots.some(({element})=>focused===element&&(element.hidden||element.disabled)))focusControls();
  }
  return {refresh,close,reset(){pinned=null;for(const slot of slots)slot.press=null;close();},
    isPrimary:button=>slots[0].action===button,actionFor:element=>slots.find(slot=>slot.element===element)?.action,
    ownsFocus:()=>!panel.hidden&&panel.contains(doc.activeElement)};
}
