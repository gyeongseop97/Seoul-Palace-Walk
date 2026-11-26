import {contextActionFamily,groupContextActions} from "./context-action-order.js";
import {createContextActionLayout} from "./context-action-layout.js";

const actionKeys=["E","F","G"];

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
  const layout=grid&&createContextActionLayout();
  let choices=[],featured=null,lastPreferred,lastScope,rows=0,revision=0,layoutDirty=true;
  let keyboardEnabled=false,keyboardOptions=[],keyboardPage=0;
  const layoutInputs=[];
  function contextChanged(available,preferredId,scope){
    let changed=layoutDirty||lastPreferred!==preferredId||lastScope!==scope||layoutInputs.length!==available.length;
    lastPreferred=preferredId;lastScope=scope;layoutDirty=false;
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
    const pressSnapshot=()=>({revision,action:slot.action,label:slot.label.textContent,target:slot.action?.dataset.actionTarget});
    slot.element.addEventListener("pointerdown",event=>{
      slot.press={...pressSnapshot(),id:event.pointerId};
    });
    slot.element.addEventListener("keydown",event=>{
      if(event.key!==" "&&event.key!=="Enter")return;
      if(event.repeat){event.preventDefault();return;}
      slot.press={...pressSnapshot(),key:event.key};
    });
    slot.element.addEventListener("keyup",event=>{if(slot.press?.key===event.key)expirePress(slot);});
    slot.element.addEventListener("blur",()=>{if(slot.press?.key)expirePress(slot);});
    slot.element.addEventListener("click",()=>{
      const {press,action}=slot;
      slot.press=null;
      if(!action||action.hidden||action.disabled)return;
      if(press&&(press.invalid||press.revision!==revision||press.action!==action||press.label!==slot.label.textContent||press.target!==action.dataset.actionTarget))return;
      close();action.click();
    });
  }
  for(const element of grid?grid.querySelectorAll("button"):[primary])addSlot(element);
  function expirePress(slot){
    const press=slot.press;
    setTimeout(()=>{if(slot.press===press)slot.press=null;},0);
  }
  function endPress(event){
    const slot=slots.find(s=>s.press?.id===event.pointerId);
    if(slot)expirePress(slot);
  }
  doc.addEventListener("pointerup",endPress);
  doc.addEventListener("pointercancel",endPress);
  function growGrid(){
    const element=doc.createElement("button"),label=doc.createElement("span"),category=doc.createElement("small");
    element.type="button";element.className="quiet context-choice";element.id=prefix+"-choice-"+(slots.length+1);
    element.hidden=true;element.disabled=true;
    category.id=element.id+"-type";category.setAttribute("data-category-text","");category.setAttribute("aria-hidden","true");
    element.append(label,category);grid.append(element);addSlot(element);
  }
  function show(slot,action,choice){
    slot.action=action;
    slot.target=action?.dataset.actionTarget;
    const {element,label}=slot;
    if(element.hidden===Boolean(action))element.hidden=!action;
    const disabled=!action||action.disabled;
    if(element.disabled!==disabled)element.disabled=disabled;
    const text=actionLabel(action);
    if(slot.press&&(disabled||slot.press.action!==action||slot.press.label!==text||slot.press.target!==action?.dataset.actionTarget))slot.press.invalid=true;
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
  function renderKeyboardPage(){
    const start=keyboardPage*actionKeys.length;
    const page=keyboardOptions.slice(start,start+actionKeys.length);
    for(const slot of slots){
      const key=actionKeys[page.indexOf(slot)];
      if(key===slot.element.dataset.interactionKey)continue;
      if(key){
        slot.element.setAttribute("data-interaction-key",key);
        slot.element.setAttribute("aria-keyshortcuts",key);
      }else{
        slot.element.removeAttribute("data-interaction-key");
        slot.element.removeAttribute("aria-keyshortcuts");
      }
    }
    return page;
  }
  function updateKeyboardOptions(enabled,fresh){
    keyboardEnabled=enabled;
    keyboardOptions=enabled?slots.filter(({action})=>action&&!action.hidden&&!action.disabled):[];
    const primaryIndex=keyboardOptions.findIndex(({action})=>action===featured);
    if(primaryIndex>0)keyboardOptions.unshift(...keyboardOptions.splice(primaryIndex,1));
    grid.toggleAttribute("data-has-key-pages",keyboardOptions.length>actionKeys.length);
    if(fresh||keyboardPage*actionKeys.length>=keyboardOptions.length)keyboardPage=0;
    renderKeyboardPage();
  }
  function useShortcut(code){
    if(code==="KeyR"){
      const pages=Math.ceil(keyboardOptions.length/actionKeys.length);
      if(pages<2)return false;
      keyboardPage=(keyboardPage+1)%pages;
      const items=renderKeyboardPage().map(({element})=>element.getBoundingClientRect());
      const bounds=grid.getBoundingClientRect();
      let top=Math.min(...items.map(item=>item.top)),bottom=Math.max(...items.map(item=>item.bottom));
      if(bottom-top>bounds.height)({top,bottom}=items[0]);
      if(top<bounds.top)grid.scrollTop+=top-bounds.top;
      else if(bottom>bounds.bottom)grid.scrollTop+=bottom-bounds.bottom;
      return true;
    }
    const index=actionKeys.findIndex(key=>code==="Key"+key);
    if(index<0)return false;
    const slot=keyboardOptions[keyboardPage*actionKeys.length+index],action=slot?.action;
    if(!action||action.hidden||action.disabled||slot.target!==action.dataset.actionTarget||slot.label.textContent!==actionLabel(action))return false;
    action.click();
    return true;
  }
  function refresh(preferredId,scope,enableKeyboard=false){
    const available=buttons.filter(button=>!button.hidden);
    const here=position();
    if(pinned&&(pinned.button.hidden||pinned.button.disabled||pinned.button.dataset.actionTarget!==pinned.target||
      (here&&Math.hypot(here.x-pinned.x,here.y-pinned.y)>3)))pinned=null;
    const focused=doc.activeElement;
    if(grid){
      let focusAction,distanceToBottom,changed=false,freshArea=false;
      if(contextChanged(available,preferredId,scope)||layout.leftArea(here)){
        changed=true;
        if(grid.contains(focused)&&focused.matches(":focus-visible"))focusAction=slots.find(slot=>slot.element===focused)?.action;
        const previousCount=choices.length;
        const groups=groupContextActions(available,preferredId);
        const ordered=groups.flatMap(group=>group.buttons.map(button=>({button,group})));
        const {placed,fresh}=layout.arrange(ordered,scope,here);
        freshArea=fresh;
        choices=placed;
        if(fresh)revision++;
        const nextRows=Math.ceil(choices.length/2);
        if(fresh||nextRows!==rows){
          distanceToBottom=fresh?0:Math.max(0,grid.scrollHeight-grid.clientHeight-grid.scrollTop);
          rows=nextRows;
          grid.style.setProperty("--context-rows",String(rows));
        }
        grid.toggleAttribute("data-empty",!rows);
        while(slots.length<choices.length)growGrid();
        const first=ordered[0]?.button??null;
        if(featured!==first){
          featured?.removeAttribute("data-current-action");
          first?.setAttribute("data-current-action","primary");
          featured=first;
        }
        for(let i=0;i<Math.max(previousCount,choices.length);i++){
          const slot=slots[i],choice=choices[i],element=slot.element;
          if(choice){
            const row=String(rows-Math.floor(i/2)),column=String(i%2+1);
            if(element.style.gridRow!==row)element.style.gridRow=row;
            if(element.style.gridColumn!==column)element.style.gridColumn=column;
          }else if(slot.action)show(slot,null);
          if(choice?.button&&choice.button===featured){
            if(element.dataset.currentAction!=="primary")element.setAttribute("data-current-action","primary");
          }else if(element.hasAttribute("data-current-action"))element.removeAttribute("data-current-action");
        }
      }
      choices.forEach((choice,i)=>show(slots[i],choice.button,choice));
      if(changed||enableKeyboard!==keyboardEnabled)updateKeyboardOptions(enableKeyboard,freshArea);
      if(distanceToBottom!==undefined)grid.scrollTop=Math.max(0,grid.scrollHeight-grid.clientHeight-distanceToBottom);
      if(focusAction){
        const former=slots.find(s=>s.element===focused);
        const next=(slots.find(s=>s.action===focusAction&&!s.element.disabled)??
          (former?.action&&!former.element.disabled&&contextActionFamily(former.action)===contextActionFamily(focusAction)?former:null))?.element;
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
  return {refresh,close,useShortcut,reset(){pinned=null;layout?.reset();layoutDirty=true;revision++;if(grid)updateKeyboardOptions(false,true);close();},
    isPrimary:button=>(grid?(keyboardOptions[keyboardPage*actionKeys.length]?.action??featured):slots[0].action)===button,actionFor:element=>slots.find(slot=>slot.element===element)?.action,
    ownsFocus:()=>grid?grid.contains(doc.activeElement)&&doc.activeElement.matches(":focus-visible"):!panel.hidden&&panel.contains(doc.activeElement)};
}
