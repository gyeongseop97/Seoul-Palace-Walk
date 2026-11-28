import {ITEMS,diningTray} from "./activities.js";
import {freeItemSlot,itemAnimating,validItemSlot} from "./held-items.js";
import {plushItems} from "./plush-items.js";
import {inCoastSpace} from "./region-coordinates.js";

export const BAG_SIZE=15, PARK_LOCKER_SIZE=6;
export const wearSlots=["plushHead","plushBack"];
export const portable=kind=>Object.hasOwn(ITEMS,kind)&&!ITEMS[kind].meal;
export const packedBoard={kind:"surfboard",remaining:1,started:0};
export const canPackBoard=a=>inCoastSpace(a)&&Boolean(a.coast)&&a.coast.mode!=="surf";
export const validPacked=p=>p&&(p.kind==="surfboard"?p.remaining===1:portable(p.kind)&&Number.isInteger(p.remaining)&&p.remaining>0&&p.remaining<=ITEMS[p.kind].uses);
const pack=p=>({kind:p.kind,remaining:p.remaining,started:0});
export function belongings(a){
  return {parkLocker:(Array.isArray(a?.parkLocker)?a.parkLocker:[]).slice(0,PARK_LOCKER_SIZE).filter(p=>validPacked(p)&&p.kind!=="surfboard").map(pack),bag:(Array.isArray(a?.bag)?a.bag:[]).slice(0,BAG_SIZE).filter(validPacked).map(pack),
    plushHead:Object.hasOwn(plushItems,a?.plushHead)?a.plushHead:null,
    plushBack:Object.hasOwn(plushItems,a?.plushBack)?a.plushBack:null};
}
export function inventoryAction(a,cmd,now,recipient){
  const bag=a.bag??=[],i=cmd.index,slot=cmd.slot,wear=cmd.wear;
  if(cmd.action==="deposit"||cmd.action==="withdraw"){
    const locker=a.parkLocker??[];
    if(cmd.action==="deposit"){
      const held=validItemSlot(slot)&&a[slot];
      if(!validPacked(held)||!portable(held.kind)||held.kind!==cmd.kind||held.remaining!==cmd.remaining||itemAnimating(held,now))return "손에 든 물건을 확인해 주세요.";
      if(locker.length>=PARK_LOCKER_SIZE)return "보관함이 가득 찼어요.";
      a.parkLocker=[...locker,pack(held)];a[slot]=null;
    }else{
      const held=locker[i],dest=freeItemSlot(a,now);
      if(!Number.isInteger(i)||!held||held.kind!==cmd.kind||held.remaining!==cmd.remaining)return "보관한 물건을 다시 골라 주세요.";
      if(!dest)return "물건을 받을 손을 비워 주세요.";
      a[dest]=pack(held);a.parkLocker=locker.filter((_,n)=>n!==i);
    }
    return;
  }
  if(cmd.kind==="surfboard"){
    if(!canPackBoard(a))return "포항에서 보드를 탄 상태를 끝낸 뒤 옮길 수 있어요.";
    if(cmd.action==="storeBoard"&&a.coast.board&&!bag.some(p=>p.kind==="surfboard")){
      if(bag.length>=BAG_SIZE)return "가방을 한 칸 비워 주세요.";
      a.bag=[...bag,{...packedBoard}];a.coast.board=false;return;
    }
    if(cmd.action==="unpackBoard"&&!a.coast.board&&Number.isInteger(i)&&bag[i]?.kind==="surfboard"){
      a.bag=bag.filter((_,index)=>index!==i);a.coast.board=true;return;
    }
    return "보드 위치를 다시 확인해 주세요.";
  }
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
