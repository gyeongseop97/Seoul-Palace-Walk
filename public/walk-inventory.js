import {ITEMS,diningTray} from "./activities.js";
import {freeItemSlot,itemAnimating,validItemSlot} from "./held-items.js";
import {plushItems} from "./plush-items.js";

export const BAG_SIZE=15;
export const wearSlots=["plushHead","plushBack"];
export const portable=kind=>Object.hasOwn(ITEMS,kind)&&!ITEMS[kind].meal;
export const validPacked=p=>p&&portable(p.kind)&&Number.isInteger(p.remaining)&&p.remaining>0&&p.remaining<=ITEMS[p.kind].uses;
const pack=p=>({kind:p.kind,remaining:p.remaining,started:0});
export function belongings(a){
  return {bag:(Array.isArray(a?.bag)?a.bag:[]).slice(0,BAG_SIZE).filter(validPacked).map(pack),
    plushHead:Object.hasOwn(plushItems,a?.plushHead)?a.plushHead:null,
    plushBack:Object.hasOwn(plushItems,a?.plushBack)?a.plushBack:null};
}
export function inventoryAction(a,cmd,now,recipient){
  const bag=a.bag??=[],i=cmd.index,slot=cmd.slot,wear=cmd.wear;
  if(cmd.action==="prize"||cmd.action==="collect"){
    if(!portable(cmd.kind)||cmd.action==="prize"&&!Object.hasOwn(plushItems,cmd.kind)||bag.length>=BAG_SIZE)return "가방을 한 칸 비워 주세요.";
    a.bag=[...bag,{kind:cmd.kind,remaining:ITEMS[cmd.kind].uses,started:0}];return;
  }
  if(cmd.action==="remove"){
    if(!wearSlots.includes(wear)||!a[wear]||a[wear]!==cmd.kind)return "착용한 인형을 다시 선택해 주세요.";
    if(bag.length>=BAG_SIZE)return "가방을 한 칸 비워 주세요.";
    a.bag=[...bag,{kind:a[wear],remaining:1,started:0}];a[wear]=null;return;
  }
  if(cmd.action==="store"||cmd.action==="give"){
    const held=validItemSlot(slot)&&a[slot];
    if(!validPacked(held)||held.kind!==cmd.kind||held.remaining!==cmd.remaining||itemAnimating(held,now))return "손에 든 물건을 다시 확인해 주세요.";
    if(cmd.action==="give"){
      if(!recipient||Math.hypot(a.x-recipient.x,a.y-recipient.y)>3.6||!!a.up!==!!recipient.up||
        a.bus||recipient.bus||a.bikeRide||recipient.bikeRide||a.bike&&!a.bike.parked||recipient.bike&&!recipient.bike.parked)
        return "친구 곁에 서서 건네 주세요.";
      const dest=freeItemSlot(recipient,now);
      if(!dest)return "친구가 받을 손을 비워야 해요.";
      recipient[dest]=pack(held);
    }else{
      if(bag.length>=BAG_SIZE)return "가방이 가득 찼어요.";
      a.bag=[...bag,pack(held)];
    }
    a[slot]=null;return;
  }
  const selected=bag[i];
  if(!Number.isInteger(i)||!selected||selected.kind!==cmd.kind||selected.remaining!==cmd.remaining)return "가방에서 물건을 다시 선택해 주세요.";
  const next=bag.slice();
  if(cmd.action==="hold"){
    if(!validItemSlot(slot)||diningTray(a,now)||a[slot]?.remaining||itemAnimating(a[slot],now))return "선택한 손을 비워 주세요.";
    a[slot]=pack(selected);next.splice(i,1);
  }else if(cmd.action==="wear"&&wearSlots.includes(wear)&&ITEMS[selected.kind].plush){
    if(a[wear])next[i]={kind:a[wear],remaining:1,started:0};else next.splice(i,1);
    a[wear]=selected.kind;
  }else return "물건을 다시 선택해 주세요.";
  a.bag=next;
}
