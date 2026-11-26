import {contextActionFamily} from "./context-action-order.js";

// These controls can follow the player across unrelated places.
const portable=new Set(["use-item","use-second-item","umbrella","picnic","coast-festival","bike-park","coast-parkScooter","coast-surf"]);
// On a moving cruise ship, the relevant distance is along its deck.
function localPoint(position){
  const deck=position?.coast;
  return deck?.mode==="deck"?{x:deck.deckX,y:deck.deckZ}:position;
}

export function createContextActionLayout(){
  let remembered=[],previousLocal=new Set(),previousScope,origin=null,door=null,awayFromActions=false;
  function reset(){
    remembered=[];previousLocal=new Set();previousScope=undefined;origin=null;door=null;awayFromActions=false;
  }
  function outsideArea(point){
    return point&&origin&&Math.hypot(point.x-origin.x,point.y-origin.y)>12;
  }
  function arrange(choices,scope,position){
    const local=new Set(choices.filter(({button})=>!portable.has(button.id)).map(({button})=>contextActionFamily(button)));
    const overlap=[...local].some(family=>previousLocal.has(family));
    const point=localPoint(position);
    const localChanged=local.size!==previousLocal.size||[...local].some(family=>!previousLocal.has(family));
    // A moment without a local action can be a cooking timer or an empty bike rack.
    // Keep its places until another location supplies the next set of actions.
    const fresh=scope!==previousScope||localChanged&&
      (outsideArea(point)||local.size>0&&previousLocal.size>0&&!overlap);
    const nextDoor=choices.find(({button})=>button.id==="museum-door")?.button;
    const doorway=nextDoor?.dataset.actionTarget?.replace(/-(enter|exit)$/,"");
    const crossing=scope!==previousScope&&doorway&&door?.venue===doorway?door:null;
    if(fresh)reset();
    previousScope=scope;
    if(local.size)previousLocal=local;
    awayFromActions=!local.size&&previousLocal.size>0;
    if(!origin&&Number.isFinite(point?.x)&&Number.isFinite(point?.y))origin={x:point.x,y:point.y};

    // Reserve the bottom pair before sitting, even when the full meal is already served on arrival.
    if(!remembered.length&&choices.some(({button})=>button.id==="coast-table"||button.id==="coast-stand"||button.id==="coast-bell")){
      remembered=[{id:"coast-bell"},{id:"coast-stand"}].map(button=>({id:button.id,family:contextActionFamily(button)}));
    }
    if(crossing)remembered[crossing.index]={id:nextDoor.id,family:contextActionFamily(nextDoor)};
    const placed=[],pending=new Set(choices);
    function assign(choice,index){
      placed[index]=choice;remembered[index]={id:choice.button.id,family:contextActionFamily(choice.button)};
      pending.delete(choice);
    }
    // Keep every surviving original first. A successor can then reuse its family's vacant place.
    for(const choice of pending){
      const index=remembered.findIndex(cell=>cell?.id===choice.button.id);
      if(index>=0)assign(choice,index);
    }
    for(const choice of pending){
      const family=contextActionFamily(choice.button);
      const index=remembered.findIndex((cell,i)=>!placed[i]&&cell?.family===family);
      if(index>=0)assign(choice,index);
    }
    for(const choice of pending){
      const hole=remembered.findIndex(cell=>!cell);
      assign(choice,hole<0?remembered.length:hole);
    }
    door=doorway?{venue:doorway,index:placed.findIndex(choice=>choice?.button===nextDoor)}:null;
    return {placed,fresh};
  }
  return {arrange,reset,leftArea:position=>awayFromActions&&outsideArea(localPoint(position))};
}
