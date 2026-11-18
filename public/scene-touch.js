const tapDuration=420;
const dragSlop=8;
const buttonSlop=15;
const surfaceControl="button,a,input,textarea,[contenteditable],#joystick,.emote-menu";
const editable="input,textarea,[contenteditable]";
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function bindSceneTouch(scene,shell,{canTap,allowHeldTap,onBegin,onTap,onDrag,onPinch,onTwoFingerPan}){
  const pointers=new Map(),buttons=new Map(),handledClicks=new WeakMap();
  let pinch=null,recentButtonTap=null;

  function resetPinch(){
    const pair=[...pointers.values()].filter(pointer=>pointer.touch);
    pinch=pair.length===2?{pair,gap:Math.max(12,distance(...pair))}:null;
    if(pinch)for(const pointer of pair)pointer.pinched=true;
  }

  scene.addEventListener("pointerdown",event=>{
    if((event.button!==0&&event.button!==2)||event.target.closest(surfaceControl))return;
    const touch=event.pointerType==="touch";
    if(pointers.size&&(!touch||pointers.size>=2||!pointers.values().next().value.touch))return;
    if(!pointers.size)onBegin();
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,
      began:event.timeStamp,touch,tap:event.button===0&&!buttons.size&&canTap(event.timeStamp)});
    scene.setPointerCapture(event.pointerId);
    resetPinch();
  });

  scene.addEventListener("pointermove",event=>{
    const pointer=pointers.get(event.pointerId);
    if(!pointer)return;
    const {x:previousX,y:previousY}=pointer;
    pointer.x=event.clientX;pointer.y=event.clientY;
    if(pinch){
      const gap=Math.max(12,distance(...pinch.pair));
      onPinch(Math.log(gap/pinch.gap)*7);
      onTwoFingerPan?.((pointer.x-previousX)/2,(pointer.y-previousY)/2);
      pinch.gap=gap;
      return;
    }
    if(!pointer.dragged){
      if(Math.hypot(pointer.x-pointer.startX,pointer.y-pointer.startY)<dragSlop)return;
      pointer.dragged=true;
      onDrag(pointer.x-pointer.startX,pointer.y-pointer.startY,pointer.x,pointer.y);
    }else onDrag(pointer.x-previousX,pointer.y-previousY,pointer.x,pointer.y);
  });

  function finishScenePointer(event,activate){
    const pointer=pointers.get(event.pointerId);
    if(!pointer)return;
    const wasPinching=Boolean(pinch);
    pointers.delete(event.pointerId);resetPinch();
    if(wasPinching){
      const remaining=pointers.values().next().value;
      remaining.startX=remaining.x;remaining.startY=remaining.y;remaining.dragged=false;
    }
    if(activate&&pointer.tap&&!pointer.pinched&&!pointer.dragged&&canTap(pointer.began)&&
      (!pointer.touch||event.timeStamp-pointer.began<tapDuration||allowHeldTap?.())&&
      Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)<dragSlop)onTap(event.clientX,event.clientY);
  }
  scene.addEventListener("pointerup",event=>finishScenePointer(event,true));

  shell.addEventListener("pointerdown",event=>{
    if(event.pointerType==="touch")recentButtonTap=null;
    const button=event.target.closest("button:not([data-key])");
    // Native gestures can keep their own capture, including a map close that reveals
    // the minimap at the same position and a minigame charge that lasts until release.
    if(event.pointerType!=="touch"||event.button!==0||!button||button.disabled||button.closest("[data-native-touch]"))return;
    for(const pointer of pointers.values())pointer.tap=false;
    buttons.set(event.pointerId,{button,x:event.clientX,y:event.clientY,moved:false});
    // Let a swipe beginning on an action row scroll the panel.
    if(!button.closest("[data-scroll-actions]")){
      button.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  });
  shell.addEventListener("pointermove",event=>{
    const press=buttons.get(event.pointerId);
    if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>buttonSlop)press.moved=true;
  });
  function finishButton(event,activate){
    const press=buttons.get(event.pointerId);
    if(!press)return;
    buttons.delete(event.pointerId);
    const {button}=press;
    handledClicks.set(button,event.timeStamp);
    if(activate&&!press.moved&&!button.disabled&&
      Math.hypot(event.clientX-press.x,event.clientY-press.y)<=buttonSlop&&
      button.contains(button.ownerDocument.elementFromPoint(event.clientX,event.clientY))){
      recentButtonTap={x:event.clientX,y:event.clientY,at:event.timeStamp};
      button.click();
    }
  }
  shell.addEventListener("pointerup",event=>finishButton(event,true));
  for(const type of ["pointercancel","lostpointercapture"]){
    scene.addEventListener(type,event=>finishScenePointer(event,false));
    shell.addEventListener(type,event=>finishButton(event,false));
  }

  // A native touch click can follow pointerup even after preventDefault.
  shell.addEventListener("click",event=>{
    const touch=event.pointerType==="touch"||event.sourceCapabilities?.firesTouchEvents;
    if(!event.isTrusted||(!touch&&event.detail===0))return;
    const button=event.target.closest("button");
    const handledAt=button&&handledClicks.get(button);
    // Opening a panel can put a different control under the same physical tap.
    const retargeted=recentButtonTap&&event.timeStamp-recentButtonTap.at<750&&
      Math.hypot(event.clientX-recentButtonTap.x,event.clientY-recentButtonTap.y)<=buttonSlop;
    if(!retargeted&&(handledAt==null||event.timeStamp-handledAt>750))return;
    if(touch||(!event.pointerType&&event.sourceCapabilities?.firesTouchEvents!==false)){
      recentButtonTap=null;
      event.preventDefault();event.stopImmediatePropagation();
    }
  },true);

  for(const type of ["contextmenu","dragstart","selectstart"]){
    shell.addEventListener(type,event=>{if(!event.target.closest(editable))event.preventDefault();});
  }

  return function clearSceneTouch(){
    const sceneIds=[...pointers.keys()],pressed=[...buttons];
    pointers.clear();buttons.clear();pinch=null;
    for(const id of sceneIds)if(scene.hasPointerCapture(id))scene.releasePointerCapture(id);
    for(const [id,{button}] of pressed){
      handledClicks.set(button,performance.now());
      if(button.hasPointerCapture(id))button.releasePointerCapture(id);
    }
  };
}
