import {ITEMS,JUMP_MS} from "./activities.js";
import {isCycling} from "./sejong-bike.js";
import {ITEM_SLOTS,itemAnimating} from "./held-items.js";

export const HAND_SPACING=.69;
export const isKiss=id=>typeof id==="string"&&id.startsWith("kiss-");
export const canKiss=(avatar,time)=>Boolean(avatar?.kissReady&&!avatar.groundSit&&avatar.seat==null&&
  !isCycling(avatar)&&!avatar.bus&&!avatar.arcade&&time-(avatar.jump??0)>=JUMP_MS);
export const CLINK_REACH=1.35;
export const CLINK_INVITE_MS=15_000;
export const CLINK_LEAD_MS=500;
export const CLINK_DURATION_MS=2_200;

export const CLINK_DRINKS=Object.fromEntries(Object.entries(ITEMS)
  .filter(([,item])=>item.verb==="마시기").map(([kind,item])=>[kind,item.duration]));

export function clinkItemSlot(avatar,time){
  if(!avatar||avatar.groundSit||avatar.seat!=null||time-(avatar.jump??0)<JUMP_MS||avatar.bus||isCycling(avatar)||
    ITEM_SLOTS.some(slot=>itemAnimating(avatar[slot],time)))return null;
  return ITEM_SLOTS.find(slot=>avatar[slot]?.remaining>0&&Object.hasOwn(CLINK_DRINKS,avatar[slot].kind))??null;
}
export const canClink=(avatar,time)=>Boolean(clinkItemSlot(avatar,time));
