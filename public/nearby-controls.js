import {groupContextActions} from "./context-action-order.js";

// Keep a pair together, but share a row when two successive groups have only one action.
function contextLayout(groups,actionLabel){
  const choices=[],labels=new Set();
  const actionable=groups.some(group=>group.buttons.some(button=>!button.disabled));
  let row=1,column=1;
  for(const group of groups){
    const selected=[];
    for(const button of group.buttons){
      if(actionable&&button.disabled)continue;
      const label=actionLabel(button);
      if(labels.has(label))continue;
      labels.add(label);selected.push(button);
      if(!actionable||selected.length===(groups.length===1?4:2))break;
    }
    if(!selected.length)continue;
    if(column===2&&selected.length>=2){row++;column=1;}
    for(const button of selected){
      if(row>2)return choices;
      choices.push({button,group,row,column});
      if(column===1)column=2;
      else{row++;column=1;}
    }
    if(!actionable||row>2)break;
  }
  return choices;
}

export function bindNearbyControls(root,focusGame,prefix="nearby",position=()=>null){
  const primary=root.querySelector("#"+prefix+"-primary");
  const grid=root.querySelector("#"+prefix+"-grid");
  const menuGroups=root.querySelector("#"+prefix+"-more-groups");
  const toggle=root.querySelector("#"+prefix+"-toggle");
  const panel=root.querySelector("#"+prefix+"-actions");
  const buttons=[...panel.querySelectorAll("button")];
  const labels=new Map([...panel.querySelectorAll("[data-primary-label]")].map(label=>[label.closest("button"),label]));
  const actionLabel=button=>(labels.get(button)??button?.firstChild)?.textContent.trim()??"";
  const slots=(grid?[...grid.querySelectorAll("button")]:[primary]).map(element=>({
    element,label:element.firstElementChild,category:element.querySelector("[data-category-text]"),action:null,press:null
  }));
  const doc=root.ownerDocument;
  let lastPanelFocus=null,pinned=null,forwarding=null;
  const inMenu=button=>!button.hidden&&(!grid||!button.hasAttribute("data-current-action"));
  let moreGroups=[],menuButtons=buttons,choices=[],lastPreferred,lastPinned;
  const layoutInputs=[];
  function contextChanged(available,preferredId){
    const pin=pinned?.button;
    let changed=lastPreferred!==preferredId||lastPinned!==pin||layoutInputs.length!==available.length;
    lastPreferred=preferredId;lastPinned=pin;
    layoutInputs.length=available.length;
    for(let i=0;i<available.length;i++){
      const button=available[i],disabled=button.disabled,target=button.dataset.actionTarget,label=actionLabel(button);
      const last=layoutInputs[i];
      if(last?.button===button&&last.disabled===disabled&&last.target===target&&last.label===label)continue;
      layoutInputs[i]={button,disabled,target,label};changed=true;
    }
    return changed;
  }
  const sections=new Map();
  const firstMenuAction=()=>menuButtons.find(button=>inMenu(button)&&!button.disabled);
  function renderMenu(){
    if(!grid)return;
    const ordered=moreGroups.flatMap(group=>group.buttons);
    if(menuButtons.length===ordered.length&&ordered.every((button,i)=>button===menuButtons[i])&&
       moreGroups.every(group=>group.buttons.every(button=>button.parentNode===sections.get(group.key))))return;
    const focused=doc.activeElement;
    for(const section of sections.values())section.hidden=true;
    for(const group of moreGroups){
      let section=sections.get(group.key);
      if(!section){
        section=doc.createElement("section");section.className="context-menu-group";
        section.setAttribute("aria-label",group.label);
        const heading=doc.createElement("strong");heading.textContent=group.label;
        section.append(heading);sections.set(group.key,section);
      }
      section.hidden=false;
      // Reuse the real controls so hand/item details, events and keyboard order stay together.
      section.append(...group.buttons);menuGroups.append(section);
    }
    menuButtons=ordered;
    if(ordered.includes(focused)&&!focused.disabled&&doc.activeElement!==focused)focused.focus({preventScroll:true});
  }
  panel.addEventListener("click",event=>{
    const button=event.target.closest("button");
    // Only a deliberate overflow choice can change which action is featured in its group.
    if(button&&!button.hidden&&!button.disabled&&(!grid||!forwarding)){
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
    renderMenu();
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
  function show(slot,action,choice){
    slot.action=action;
    const {element,label}=slot;
    if(element.hidden===Boolean(action))element.hidden=!action;
    const disabled=!action||action.disabled;
    if(element.disabled!==disabled)element.disabled=disabled;
    const text=actionLabel(action);
    if(label.textContent!==text)label.textContent=text;
    if(choice){
      if(slot.category.textContent!==choice.group.label)slot.category.textContent=choice.group.label;
      if(element.dataset.category!==choice.group.key)element.setAttribute("data-category",choice.group.key);
      if(element.dataset.row!==String(choice.row))element.setAttribute("data-row",choice.row);
      if(element.dataset.column!==String(choice.column))element.setAttribute("data-column",choice.column);
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
    let hideToggle;
    if(grid){
      if(contextChanged(available,preferredId)){
        const groups=groupContextActions(available,preferredId,pinned?.button);
        choices=contextLayout(groups,actionLabel);
        if(slots.some((slot,i)=>slot.action!==(choices[i]?.button??null))){
          for(const slot of slots)slot.action?.removeAttribute("data-current-action");
          choices.forEach(({button},i)=>button.setAttribute("data-current-action",slots[i].element.id.slice(prefix.length+1)));
        }
        moreGroups=groups.map(group=>({...group,buttons:group.buttons.filter(inMenu)})).filter(group=>group.buttons.length);
        if(!panel.hidden&&moreGroups.length)renderMenu();
      }
      slots.forEach((slot,i)=>show(slot,choices[i]?.button??null,choices[i]));
      hideToggle=moreGroups.length===0;
    }else{
      const preferred=available.find(button=>button.id===preferredId);
      const main=pinned?.button??(preferred?.disabled?null:preferred)??available.find(button=>!button.disabled)??preferred??available[0]??null;
      show(slots[0],main);
      hideToggle=available.length<2;
    }
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
