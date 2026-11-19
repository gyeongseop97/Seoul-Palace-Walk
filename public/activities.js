import {plushItems} from "./plush-items.js";
export const PET_MS=1450;
export const FEED_MS=5000;
export const JUMP_MS=740;
export const JUMP_HEIGHT=.88;
export const WOLDAE_VAULT_HEIGHT=1.80;
export const jumpDuration=avatar=>avatar.vaultBase==null?JUMP_MS:1150;
export function jumpLift(avatar,clock){
  const age=clock-avatar.jump;
  const duration=jumpDuration(avatar);
  if(!avatar.jump||age<=0||age>=duration)return 0;
  const phase=age/duration;
  const height=avatar.vaultBase==null?JUMP_HEIGHT:WOLDAE_VAULT_HEIGHT;
  return height*4*phase*(1-phase);
}
export function renderedJumpLift(avatar,clock,floor){
  const lift=jumpLift(avatar,clock);
  if(!lift||avatar.vaultBase==null)return lift;
  return Math.max(0,avatar.vaultBase+lift-floor);
}
const crepe={name:"크레페",verb:"먹기",uses:3,duration:1300};
const bungeoppang={name:"붕어빵",verb:"먹기",uses:3,duration:1300,snack:true};
const hotteok={name:"호떡",verb:"먹기",uses:3,duration:1300,snack:true};
const meal=(name,utensil="spoon")=>({name,verb:"먹기",uses:3,duration:1800,meal:true,utensil});
export const ITEMS={
  ...plushItems,
  sparkler:{name:"스파클",verb:"사용하기",uses:1,duration:8000},
  coffee:{name:"커피",verb:"마시기",uses:3,duration:1150},
  crepe,parfait:crepe,
  beer:{name:"맥주",verb:"마시기",uses:3,duration:1350,alcohol:true},
  yakgwa:{name:"약과",verb:"먹기",uses:3,duration:1300,snack:true},
  cake:{name:"조각 케이크",verb:"먹기",uses:3,duration:1300},
  bingsu:{name:"팥빙수",verb:"먹기",uses:3,duration:1300},
  bungeoppang,
  bungeoppangCustard:{...bungeoppang,name:"슈크림 붕어빵"},
  bungeoppangBurnt:{...bungeoppang,name:"탄 붕어빵"},
  bungeoppangTorn:{...bungeoppang,name:"속이 터진 붕어빵"},
  hotteok,
  hotteokBurnt:{...hotteok,name:"탄 호떡"},
  hotteokTorn:{...hotteok,name:"속이 터진 호떡"},
  triangleRice:{name:"삼각김밥",verb:"먹기",uses:3,duration:1250,snack:true},
  fruitMochi:{name:"딸기 과일모찌",verb:"먹기",uses:3,duration:1300,snack:true},
  stationBurger:{name:"그릴 햄버거",verb:"먹기",uses:3,duration:1300,snack:true},
  riceCake:{name:"꿀떡",verb:"먹기",uses:3,duration:1300},
  bibimbap:meal("나물 비빔밥"),
  mushroomSoup:meal("버섯 국밥"),
  buckwheatNoodles:meal("메밀국수","chopsticks"),
  jangGukbap:meal("장국밥"),
  sujebi:meal("수제비"),
  mushroomPasta:meal("버섯 크림 파스타","fork"),
  beefCurry:meal("소고기 카레라이스"),
  chickenSandwich:meal("치킨 샌드위치","fork"),
  udon:meal("가케 우동","chopsticks"),
  jjajangmyeon:meal("짜장면","chopsticks"),
  friedRice:meal("달걀 볶음밥"),
  makgeolli:{name:"막걸리",verb:"마시기",uses:3,duration:1350,alcohol:true},
  wine:{name:"와인",verb:"마시기",uses:3,duration:1350,alcohol:true},
  fruitWine:{name:"매실주",verb:"마시기",uses:3,duration:1350,alcohol:true},
  highball:{name:"하이볼",verb:"마시기",uses:3,duration:1350,alcohol:true},
  churu:{name:"츄르",verb:"간식 주기",uses:3,duration:FEED_MS}
};

function heldProp(item,clock,slot,side){
  const spec=ITEMS[item?.kind];
  if(!spec)return null;
  const itemAge=item.started?Math.max(0,clock-item.started):Infinity;
  if(item.remaining<=0&&itemAge>=spec.duration)return null;
  return {slot,side,item,spec,itemAge};
}

export function diningTray(avatar,clock){
  if(avatar.diningMeal)return heldProp(avatar.diningMeal,clock,null,1);
  const first=ITEMS[avatar.item?.kind]?.meal?heldProp(avatar.item,clock,"item",1):null;
  return first??(ITEMS[avatar.secondItem?.kind]?.meal?heldProp(avatar.secondItem,clock,"secondItem",-1):null);
}

export function avatarHands(avatar,clock,{riding,seated,walking}){
  const claspSide=!riding&&(avatar.hand===-1||avatar.hand===1)?avatar.hand:0;
  const tray=riding?null:diningTray(avatar,clock);
  const first=riding||tray?null:heldProp(avatar.item,clock,"item",1);
  const second=riding||tray?null:heldProp(avatar.secondItem,clock,"secondItem",-1);
  const itemFor=side=>side===1?first:second;
  const feedAge=clock-avatar.feed?.at,petAge=clock-avatar.pet?.at;
  const feedActive=feedAge>=0&&feedAge<FEED_MS;
  const using=(feedActive?avatar.feed.slot??"item":avatar.itemUse)==="secondItem"?second:first;
  const main=using??first??second,carrying=Boolean(main);
  const canInteract=!seated&&!riding&&!walking&&!claspSide;
  const feeding=canInteract&&using?.item.kind==="churu"&&feedActive;
  const freeSide=tray?0:[1,-1].find(side=>side!==claspSide&&!itemFor(side))??0;
  const petSide=canInteract&&!feeding&&petAge>=0&&petAge<PET_MS?freeSide:0;
  const sharedSide=avatar.sharedUmbrella;
  const umbrellaHand=!tray&&(sharedSide===1||sharedSide===-1)
    ?[sharedSide,-sharedSide].find(side=>side!==claspSide&&!itemFor(side)&&side!==petSide)??0:0;
  return {claspSide,item:main?.item,spec:main?.spec,itemAge:main?.itemAge??Infinity,carrying,tray,feedAge,feeding,
    petAge,petting:Boolean(petSide),petSide,itemSide:main?.side??1,waveSide:freeSide,umbrellaHand,itemFor,
    feedingSide:feeding?using.side:0};
}
