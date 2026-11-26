import {mapFormat} from "./map-format.js";

const slop=7,tapMs=420;
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const gap=(a,b)=>Math.max(12,Math.hypot(a.x-b.x,a.y-b.y));

export function bindMapGestures(surface,{getView,setView,onTap}){
  const contacts=new Map(),mouseEvents=surface.ownerDocument??surface;
  let touchEnded=-Infinity,blockedMouse=null;
  const point=event=>({x:event.clientX,y:event.clientY});
  const moved=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)>=slop;
  function updateCursor(){
    surface.classList?.toggle("map-panning",contacts.size>1||[...contacts.values()].some(contact=>contact.drag));
  }
  function projected({x,y}){
    const matrix=surface.getScreenCTM();
    if(!matrix)return null;
    const result=new DOMPoint(x,y).matrixTransform(matrix.inverse());
    return Number.isFinite(result.x)&&Number.isFinite(result.y)?result:null;
  }
  function zoom({view,base,minWidth=base.w*mapFormat.minZoom,maxWidth=base.w*mapFormat.maxZoom},scale,start,end=start){
    const ratio=Math.max(minWidth/view.w,Math.min(maxWidth/view.w,scale));
    setView({x:start.x-(end.x-view.x)*ratio,y:start.y-(end.y-view.y)*ratio,w:view.w*ratio,h:view.h*ratio});
  }
  surface.addEventListener("wheel",event=>{
    const state=getView(),delta=event.deltaY;
    if(!state||!Number.isFinite(delta)||!delta||event.ctrlKey||event.metaKey||contacts.size)return;
    const anchor=projected(point(event));
    if(!anchor)return;
    event.preventDefault();
    const unit=event.deltaMode===1?16:event.deltaMode===2?surface.clientHeight:1;
    const amount=Math.max(-.65,Math.min(.65,delta*unit*.0025));
    zoom(state,Math.exp(amount),anchor);
  },{passive:false});
  surface.addEventListener("dragstart",event=>event.preventDefault());
  surface.addEventListener("pointerdown",event=>{
    const {pointerType,pointerId}=event;
    if(event.button!==0||(pointerType!=="mouse"&&pointerType!=="touch"))return;
    if(pointerType==="mouse"){
      blockedMouse=pointerId;
      if(contacts.size)return;
    }else{
      event.preventDefault();
      if(contacts.size>=2||[...contacts.values()].some(contact=>contact.type==="mouse"))return;
    }
    const start=point(event);
    contacts.set(pointerId,{type:pointerType,start,current:start,at:event.timeStamp,target:event.target,drag:false,pinch:false});
    if(contacts.size===2)for(const contact of contacts.values())contact.pinch=true;
    if(pointerType==="touch")surface.setPointerCapture(pointerId);
    if(contacts.size===2)updateCursor();
  });
  function move(event){
    const contact=contacts.get(event.pointerId);
    if(!contact)return;
    if(contact.type==="mouse"&&event.buttons!==undefined&&!(event.buttons&1)){
      finish(event,false);
      if(surface.hasPointerCapture(event.pointerId))surface.releasePointerCapture(event.pointerId);
      return;
    }
    const state=getView();
    if(!state)return;
    const before=contact.current,after=point(event);
    contact.current=after;
    const {view}=state;
    if(contacts.size===2){
      const other=[...contacts.values()].find(value=>value!==contact).current;
      const start=projected(midpoint(before,other)),end=projected(midpoint(after,other));
      if(!start||!end)return;
      zoom(state,gap(before,other)/gap(after,other),start,end);
      return;
    }
    if(!contact.drag&&!moved(after,contact.start))return;
    const start=projected(contact.drag?before:contact.start),end=projected(after);
    if(!contact.drag){
      contact.drag=true;
      // A press under the drag threshold keeps the browser's original landmark click.
      if(contact.type==="mouse")surface.setPointerCapture(event.pointerId);
      updateCursor();
    }
    if(start&&end)setView({...view,x:view.x+start.x-end.x,y:view.y+start.y-end.y});
  }
  surface.addEventListener("pointermove",event=>{if(event.pointerType==="touch")move(event);});
  mouseEvents.addEventListener("pointermove",event=>{if(event.pointerType==="mouse")move(event);},true);
  function finish(event,activate){
    const {pointerId,timeStamp}=event,contact=contacts.get(pointerId);
    if(contact?.type==="touch"||event.pointerType==="touch")touchEnded=timeStamp;
    if(!contact)return;
    contacts.delete(pointerId);
    // A finger still on the map can pan immediately after the other finger lifts.
    if(contact.pinch)for(const remaining of contacts.values())remaining.drag=true;
    updateCursor();
    const tapped=activate&&!contact.drag&&!contact.pinch&&!moved(point(event),contact.start);
    if(contact.type==="mouse"){
      if(tapped)blockedMouse=null;
    }else if(tapped&&timeStamp-contact.at<tapMs)onTap(event,contact.target);
  }
  surface.addEventListener("pointerup",event=>{if(event.pointerType==="touch")finish(event,true);});
  mouseEvents.addEventListener("pointerup",event=>{if(event.pointerType==="mouse")finish(event,event.button===0);},true);
  for(const name of ["pointercancel","lostpointercapture"])surface.addEventListener(name,event=>finish(event,false));
  surface.addEventListener("click",event=>{
    if(!event.isTrusted)return;
    const touch=event.pointerType==="touch"||event.sourceCapabilities?.firesTouchEvents;
    const mouse=event.detail>0&&blockedMouse!==null&&!touch&&(!event.pointerType||event.pointerType==="mouse")&&
      (event.pointerId===undefined||event.pointerId<0||event.pointerId===blockedMouse);
    const legacyTouch=event.detail>0&&!event.pointerType&&event.sourceCapabilities?.firesTouchEvents!==false&&
      ([...contacts.values()].some(contact=>contact.type==="touch")||event.timeStamp-touchEnded<700);
    if(!touch&&!legacyTouch&&!mouse)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(mouse)blockedMouse=null;
  },true);
  function clearMapGestures(){
    if(!contacts.size)return;
    if([...contacts.values()].some(contact=>contact.type==="touch"))touchEnded=performance.now();
    const ids=[...contacts.keys()];contacts.clear();updateCursor();
    for(const id of ids)if(surface.hasPointerCapture(id))surface.releasePointerCapture(id);
  }
  surface.ownerDocument?.defaultView?.addEventListener("blur",clearMapGestures);
  return clearMapGestures;
}
