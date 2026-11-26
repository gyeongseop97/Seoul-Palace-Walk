import {groupContextActions} from "./context-action-order.js";

export function bindNearbyControls(root,focusGame,prefix="nearby",position=()=>null){
  const primary=root.querySelector("#"+prefix+"-primary");
  const grid=root.querySelector("#"+prefix+"-grid");
  const toggle=root.querySelector("#"+prefix+"-toggle");
  const panel=root.querySelector("#"+prefix+"-actions");
  const buttons=[...panel.querySelectorAll("button")];
  const labels=new Map([...panel.querySelectorAll("[data-primary-label]")].map(label=>[label.closest("button"),label]));
  const actionLabel=button=>(labels.get(button)??button?.firstChild)?.textContent.trim()??"";
  const handDetails=new Map([...labels.keys()].map(button=>[button,button.querySelector("small")]));
  const slots=[];
  const doc=root.ownerDocument;
  let lastPanelFocus=null,pinned=null;
  let choices=[],lastPreferred;
  const layoutInputs=[];
  function contextChanged(available,preferredId){
    let changed=lastPreferred!==preferredId||layoutInputs.length!==available.length;
    lastPreferred=preferredId;
    layoutInputs.length=available.length;
    for(let i=0;i<available.length;i++){
      const button=available[i],disabled=button.disabled,target=button.dataset.actionTarget,label=actionLabel(button);
      const last=layoutInputs[i];
      if(last?.button===button&&last.disabled===disabled&&last.target===target&&last.label===label)continue;
      layoutInputs[i]={button,disabled,target,label};changed=true;
    }
    return changed;
  }
  const firstMenuAction=()=>buttons.find(button=>!button.hidden&&!button.disabled);
  panel.addEventListener("click",event=>{
    const button=event.target.closest("button");
    if(!grid&&button&&!button.hidden&&!button.disabled){
      const here=position();
      pinned={button,target:button.dataset.actionTarget,x:here?.x,y:here?.y};
    }
  },true);
  doc.addEventListener("focusin",event=>{
    if(panel.contains(event.target))lastPanelFocus=event.target;
    else if(event.target!==doc.body)lastPanelFocus=null;
  });
  function focusControls(){
    const button=toggle&&!toggle.hidden?toggle:slots.find(slot=>slot.action&&!slot.element.disabled)?.element;
    if(button)button.focus({preventScroll:true});
    else focusGame();
  }
  function close(restoreFocus=false){
    if(grid||panel.hidden)return false;
    const hadFocus=panel.contains(doc.activeElement)||(doc.activeElement===doc.body&&lastPanelFocus);
    panel.hidden=true;lastPanelFocus=null;
    toggle.setAttribute("aria-expanded","false");
    if(restoreFocus&&hadFocus)focusControls();
    return true;
  }
  toggle?.addEventListener("click",()=>{
    if(close(true)||toggle.hidden)return;
    panel.hidden=false;
    toggle.setAttribute("aria-expanded","true");
    if(toggle.matches(":focus-visible"))(firstMenuAction()??panel).focus({preventScroll:true});
  });
  panel.addEventListener("click",event=>{
    if(event.target.closest("button"))close(true);
  });
  function addSlot(element){
    const slot={element,label:element.firstElementChild,category:element.querySelector("[data-category-text]"),action:null,press:null};
    slots.push(slot);
    slot.element.addEventListener("pointerdown",event=>{
      slot.press={id:event.pointerId,action:slot.action,label:slot.label.textContent,target:slot.action?.dataset.actionTarget};
    });
    slot.element.addEventListener("click",()=>{
      const {press,action}=slot;
      slot.press=null;
      if(!action||action.hidden||action.disabled)return;
      if(press&&(press.action!==action||press.label!==slot.label.textContent||press.target!==action.dataset.actionTarget))return;
      close();action.click();
    });
  }
  for(const element of grid?grid.querySelectorAll("button"):[primary])addSlot(element);
  function endPress(event){
    const slot=slots.find(s=>s.press?.id===event.pointerId);
    if(!slot)return;
    const press=slot.press;
    setTimeout(()=>{if(slot.press===press)slot.press=null;},0);
  }
  doc.addEventListener("pointerup",endPress);
  doc.addEventListener("pointercancel",endPress);
  function growGrid(){
    const element=doc.createElement("button"),label=doc.createElement("span"),category=doc.createElement("small");
    element.type="button";element.className="quiet context-choice";element.id=prefix+"-choice-"+(slots.length+1);
    category.id=element.id+"-type";category.setAttribute("data-category-text","");category.setAttribute("aria-hidden","true");
    element.append(label,category);grid.append(element);addSlot(element);
  }
  function show(slot,action,choice){
    slot.action=action;
    const {element,label}=slot;
    if(element.hidden===Boolean(action))element.hidden=!action;
    const disabled=!action||action.disabled;
    if(element.disabled!==disabled)element.disabled=disabled;
    const text=actionLabel(action);
    if(label.textContent!==text)label.textContent=text;
    if(choice){
      const category=handDetails.get(action)?.textContent.trim()||choice.group.label;
      if(slot.category.textContent!==category)slot.category.textContent=category;
      if(element.dataset.category!==choice.group.key)element.setAttribute("data-category",choice.group.key);
      const description=[slot.category.id,action.getAttribute("aria-describedby")].filter(Boolean).join(" ");
      if(element.getAttribute("aria-describedby")!==description)element.setAttribute("aria-describedby",description);
    }
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
    const focused=doc.activeElement;
    if(grid){
      let focusAction;
      if(contextChanged(available,preferredId)){
        if(grid.contains(focused)&&focused.matches(":focus-visible"))focusAction=slots.find(slot=>slot.element===focused)?.action;
        const previousCount=choices.length;
        const groups=groupContextActions(available,preferredId);
        choices=groups.flatMap(group=>group.buttons.map(button=>({button,group})));
        while(slots.length<choices.length)growGrid();
        const first=choices[0]?.button??null;
        if(slots[0].action!==first){
          slots[0].action?.removeAttribute("data-current-action");
          first?.setAttribute("data-current-action","primary");
        }
        for(let i=choices.length;i<previousCount;i++)show(slots[i],null);
      }
      choices.forEach((choice,i)=>show(slots[i],choice.button,choice));
      if(focusAction){
        const next=slots.find(s=>s.action===focusAction&&!s.element.disabled)?.element;
        if(!next)focusControls();
        else if(next!==focused)next.focus();
      }
      return;
    }
    const preferred=available.find(button=>button.id===preferredId);
    const main=pinned?.button??(preferred?.disabled?null:preferred)??available.find(button=>!button.disabled)??preferred??available[0]??null;
    show(slots[0],main);
    const hideToggle=available.length<2;
    if(toggle.hidden!==hideToggle)toggle.hidden=hideToggle;
    if(toggle.hidden){
      close(true);
      if(focused===toggle)focusControls();
    }else if(!panel.hidden&&lastPanelFocus&&lastPanelFocus!==panel&&
      (focused===lastPanelFocus||focused===doc.body)&&(lastPanelFocus.hidden||lastPanelFocus.disabled)){
      (firstMenuAction()??panel).focus({preventScroll:true});
    }
    if(slots.some(({element})=>focused===element&&(element.hidden||element.disabled)))focusControls();
  }
  return {refresh,close,reset(){pinned=null;for(const slot of slots)slot.press=null;close();},
    isPrimary:button=>slots[0].action===button,actionFor:element=>slots.find(slot=>slot.element===element)?.action,
    ownsFocus:()=>grid?grid.contains(doc.activeElement)&&doc.activeElement.matches(":focus-visible"):!panel.hidden&&panel.contains(doc.activeElement)};
}
