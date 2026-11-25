import {ITEMS} from "./activities.js";
import {BAG_SIZE,portable,wearSlots,packedBoard,canPackBoard} from "./walk-inventory.js";
import {ITEM_SLOTS,handLabel} from "./held-items.js";
const icons={bear:"🧸",rabbit:"🐰",cat:"🐱",duck:"🐤",panda:"🐼",star:"⭐",frog:"🐸",penguin:"🐧",
  coffee:"☕",cannedBeer:"🍺",cupNoodles:"🍜",cheese:"🧀",beer:"🍺",wine:"🍷",fruitWine:"🍷",highball:"🥃",makgeolli:"🍶",crepe:"🥞",cake:"🍰",
  triangleRice:"🍙",fruitMochi:"🍓",stationBurger:"🍔",churu:"🐾",riceCake:"🍡",sparkler:"🎇",yakgwa:"🌼",bingsu:"🍧"};

export function bindWalkBag({avatar,peers,busy,command,openGame}){
  const el=id=>document.getElementById(id),dialog=el("walk-bag");
  let selected=null,signature="",friend="";
  el("bag-open").onclick=()=>{openGame();dialog.showModal();render(true);};
  el("bag-close").onclick=()=>dialog.close();
  const wearName=key=>key==="plushHead"?"머리":"등";
  function render(force=false){
    if(!dialog.open)return;
    const bag=avatar.bag??[],near=peers();
    const board=avatar.coast?.board?packedBoard:null;
    const stamp=JSON.stringify([bag,...ITEM_SLOTS.map(s=>avatar[s]),avatar.plushHead,avatar.plushBack,board,canPackBoard(avatar),near,busy(),selected]);
    if(!force&&signature===stamp)return;
    signature=stamp;el("bag-count").textContent=bag.length+" / "+BAG_SIZE;
    const grid=el("bag-grid"),equip=el("bag-equipped"),actions=el("bag-actions");
    grid.replaceChildren();equip.replaceChildren();actions.replaceChildren();
    function cell(root,key,p,label){
      const b=document.createElement("button");b.className="bag-cell";b.type="button";b.disabled=!p;
      b.setAttribute("aria-pressed",String(key===selected&&!!p));
      b.textContent=p?.kind==="surfboard"?"서핑보드":p?ITEMS[p.kind]?.name??"물건":label||"";
      if(p){
        const icon=document.createElement("i");icon.setAttribute("aria-hidden","true");
        icon.textContent=p.kind==="surfboard"?"🏄":icons[ITEMS[p.kind]?.type??p.kind]??(p.kind.startsWith("bungeo")?"🐟":p.kind.startsWith("hotteok")?"🥞":"🍽️");
        b.prepend(icon);
      }
      if(label&&p){const s=document.createElement("span");s.textContent=label;b.prepend(s);}
      if(!p)b.setAttribute("aria-label",label||"빈칸");
      b.onclick=()=>{selected=key;render();};root.append(b);
    }
    for(let i=0;i<BAG_SIZE;i++)cell(grid,i,bag[i]);
    for(const s of ITEM_SLOTS)cell(equip,s,avatar[s],handLabel(s));
    for(const w of wearSlots)cell(equip,w,avatar[w]&&{kind:avatar[w]},wearName(w));
    if(board)cell(equip,"surfboard",board,"대여 장비");
    const packed=Number.isInteger(selected),worn=wearSlots.includes(selected);
    const p=packed?bag[selected]:selected==="surfboard"?board:worn&&avatar[selected]?{kind:avatar[selected]}:avatar[selected];
    const spec=ITEMS[p?.kind];
    el("bag-detail").textContent=spec?spec.name+(spec.plush?"":(" · 남은 횟수 "+p.remaining)):"옮기거나 건넬 물건을 선택하세요.";
    function action(text,fields,disabled=false){
      const b=document.createElement("button");b.type="button";b.textContent=text;b.disabled=busy()||disabled;
      b.onclick=()=>command({...fields,kind:p.kind,remaining:p.remaining,...(fields.action==="give"?{to:friend}:{})});actions.append(b);
    }
    if(p?.kind==="surfboard"){
      el("bag-detail").textContent=canPackBoard(avatar)?"영일대 대여 서핑보드":avatar.coast?.mode==="surf"?"보드에서 내리면 가방에 넣을 수 있어요.":"포항에서 다시 꺼낼 수 있어요.";
      if(packed)action("서핑보드 꺼내기",{action:"unpackBoard",index:selected},!canPackBoard(avatar));
      else action("가방에 넣기",{action:"storeBoard"},!canPackBoard(avatar)||bag.length>=BAG_SIZE);
      return;
    }
    if(!spec)return;
    if(worn){action("가방에 넣기",{action:"remove",wear:selected},bag.length>=BAG_SIZE);return;}
    if(packed){
      for(const s of ITEM_SLOTS)action(handLabel(s)+"에 들기",{action:"hold",index:selected,slot:s},!!avatar[s]?.remaining);
      if(spec.plush)for(const w of wearSlots)action(w==="plushHead"?"머리에 얹기":"등에 메기",{action:"wear",index:selected,wear:w});
    }else if(portable(p.kind)){
      action("가방에 넣기",{action:"store",slot:selected},bag.length>=BAG_SIZE);
      if(near.length){
        const select=document.createElement("select");select.setAttribute("aria-label","받을 친구");
        for(const [id,name] of near)select.add(new Option(name,id));
        if(near.some(([id])=>id===friend))select.value=friend;friend=select.value;
        select.onchange=()=>{friend=select.value;};actions.append(select);
        action("건네기",{action:"give",slot:selected});
      }else el("bag-detail").textContent+=" · 친구 곁에서 건넬 수 있어요.";
    }else el("bag-detail").textContent+=" · 식탁에서 먹는 트레이예요.";
  }
  return {render,open:slot=>{if(slot)selected=slot;el("bag-open").click();},close:()=>{dialog.close();selected=null;signature="";}};
}
