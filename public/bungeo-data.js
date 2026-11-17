import {plazaAt} from "./plaza-layout.js";

export const BUNGEO_STALL=Object.freeze({
  ...plazaAt(-51.8,373,"광화문 붕어빵 좌판"),id:"bungeo-stall",radius:2.4,watchRadius:26,
  body:plazaAt(-53.75,373),angle:Math.PI/2
});
export const BUNGEO_MOLD_COUNT=3;
export const BUNGEO_STOCK_CAPACITY=12;
export const BUNGEO_TOUCH_MS=700;
export const BUNGEO_GOOD_MS=1800;
export const BUNGEO_BURN_MS=24000;
export const BUNGEO_EXPIRE_MS=80000;
export const BUNGEO_GIFT_REACH=2.7;
export const BUNGEO_ITEMS=Object.freeze({good:"bungeoppang",burnt:"bungeoppangBurnt",torn:"bungeoppangTorn"});
export const BUNGEO_CUSTARD_ITEM="bungeoppangCustard";
export const BUNGEO_FILLINGS=Object.freeze(["redBean","custard"]);
export const BUNGEO_CUSTOMER_WALK_MS=2400;
export const BUNGEO_CUSTOMER_NEXT_MS=4000;
export const BUNGEO_CUSTOMER_PATIENCE_MS=180000;

export function bungeoQuality(mold,now){
  if(mold.stage==="filling")return;
  const first=(mold.flippedAt??now)-mold.pouredAt;
  const second=mold.flippedAt==null?null:now-mold.flippedAt;
  if(first>BUNGEO_BURN_MS||second>BUNGEO_BURN_MS)return "burnt";
  if(first<BUNGEO_GOOD_MS||second!==null&&second<BUNGEO_GOOD_MS)return "torn";
  return "good";
}

export function bungeoStep(mold,now){
  if(!mold)return {action:"pour",ready:true,waitMs:0};
  const age=now-(mold.flippedAt??mold.pouredAt);
  if(age>=BUNGEO_EXPIRE_MS)return {action:"pour",ready:true,waitMs:0};
  if(mold.stage==="filling")return {action:"fill",ready:true,waitMs:0};
  return {action:mold.stage==="second"?"take":"flip",ready:age>=BUNGEO_TOUCH_MS,
    waitMs:Math.max(0,BUNGEO_GOOD_MS-age),quality:bungeoQuality(mold,now)};
}
