import {plazaAt} from "./plaza-layout.js";
import {at as palaceAt} from "./gyeongbok-layout.js";
import {fountain} from "./layout.js";
import {beachMarketStalls,MARKET_ANGLE} from "./beach-market-layout.js";
import {coastPoint} from "./region-coordinates.js";

export const BUNGEO_STALL=Object.freeze({
  ...plazaAt(-51.8,373,"광화문 붕어빵 좌판"),id:"bungeo-stall",area:"gwanghwamun",kind:"bungeo",customer:true,radius:2.4,watchRadius:26,
  body:plazaAt(-53.75,373),angle:Math.PI/2
});
function cookingStall(id,name,area,kind,body,angle){
  const counterDistance=1.85;
  return Object.freeze({id,name,area,kind,body,angle,customer:false,radius:2.4,watchRadius:26,
    x:body.x+Math.sin(angle)*counterDistance,y:body.y+Math.cos(angle)*counterDistance});
}
export const COOKING_STALLS=Object.freeze([
  BUNGEO_STALL,
  ...beachMarketStalls.map(({id,name,kind,spot})=>cookingStall(id,name,"pohang",kind,coastPoint(spot),MARKET_ANGLE)),
  cookingStall("hotteok-deoks","정동 호떡 굽는 곳","jeongdong","hotteok",{x:fountain.x-5.8,y:fountain.y+5},Math.PI/2),
  cookingStall("bungeo-palace","경회루 붕어빵 굽는 곳","gyeongbokgung","bungeo",palaceAt(-60.8,389),Math.PI/2),
  cookingStall("hotteok-palace","소주방 앞 호떡 굽는 곳","gyeongbokgung","hotteok",palaceAt(100,354.0),0),
  cookingStall("bungeo-bukchon","삼청로 붕어빵 굽는 곳","bukchon","bungeo",{x:719.6,y:-1115},-Math.PI/2),
  cookingStall("hotteok-bukchon","가회동 호떡 굽는 곳","bukchon","hotteok",{x:1075.4,y:-1788},-Math.PI/2),
]);
export const cookingStallById=id=>COOKING_STALLS.find(stall=>stall.id===id);
export function nearbyCookingStall(position,{watch=true}={}){
  let closest=null, gap=Infinity;
  for(const stall of COOKING_STALLS){
    const distance=Math.hypot(position.x-stall.x,position.y-stall.y);
    if(distance<gap&&distance<=(watch?stall.watchRadius:stall.radius)){closest=stall;gap=distance;}
  }
  return closest;
}
export const BUNGEO_MOLD_COUNT=3;
export const BUNGEO_STOCK_CAPACITY=12;
export const BUNGEO_TOUCH_MS=700;
export const BUNGEO_GOOD_MS=1800;
export const BUNGEO_BURN_MS=24000;
export const BUNGEO_EXPIRE_MS=80000;
export const BUNGEO_GIFT_REACH=2.7;
export const BUNGEO_ITEMS=Object.freeze({good:"bungeoppang",burnt:"bungeoppangBurnt",torn:"bungeoppangTorn"});
export const HOTTEOK_ITEMS=Object.freeze({good:"hotteok",burnt:"hotteokBurnt",torn:"hotteokTorn"});
export const HOTTEOK_PREPARATION=Object.freeze({
  sugar:{from:"dough",to:"sweetened"},
  seal:{from:"sweetened",to:"sealed"},
  place:{from:"sealed",to:"placed"},
  press:{from:"placed",to:"pressed"}
});
const hotteokNext=Object.fromEntries(Object.entries(HOTTEOK_PREPARATION).map(([action,{from}])=>[from,action]));
export const BUNGEO_CUSTARD_ITEM="bungeoppangCustard";
export const BUNGEO_FILLINGS=Object.freeze(["redBean","custard"]);
export const BUNGEO_CUSTOMER_WALK_MS=2400;
export const BUNGEO_CUSTOMER_NEXT_MS=4000;
export const BUNGEO_CUSTOMER_PATIENCE_MS=180000;

export function bungeoQuality(mold,now){
  if(mold.stage==="filling"||Object.hasOwn(hotteokNext,mold.stage))return;
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
  if(Object.hasOwn(hotteokNext,mold.stage))return {action:hotteokNext[mold.stage],ready:true,waitMs:0};
  return {action:mold.stage==="second"?"take":"flip",ready:age>=BUNGEO_TOUCH_MS,
    waitMs:Math.max(0,BUNGEO_GOOD_MS-age),quality:bungeoQuality(mold,now)};
}
