import {beachPoolGates,beachServiceAt,inCaliforniaBeach} from "./california-beach-layout.js";
import {beachWaterAt,beachRiver,riverOffset} from "./california-beach-water.js";
import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";
import {swimwearOptions} from "./beach-swimming.js";

export function playerWater(player,clock){
  if(!player||player.bus||player.bikeRide||player.bike&&!player.bike.parked||player.seat!=null)return null;
  return beachWaterAt(localGyeongju(player),clock);
}
export const inSwimmingDepth=water=>water?.kind==="wave"&&water.depth-water.level>.53;
export function beachAppearance(player,clock){
  if(!inCaliforniaBeach(localGyeongju(player)))return player;
  const water=playerWater(player,clock);
  return {...player,beachSuit:player.beachGear?.suit??(water?"tide":null),beachSwimming:inSwimmingDepth(water)};
}
const entryPoints={wave:{x:6331,z:272},river:{x:6299,z:239},kids:{x:6369,z:266}};
const poolLabels={wave:"파도풀 들어가기",river:"유수풀 튜브 타기",kids:"페블비치 들어가기"};
export function createBeachControls({me,available,time,changed,toast,setActivity,walkTo,sound,reset}){
  const get=id=>document.getElementById(id),changing=get("beach-changing"),choices=get("beach-suits");
  function nearby(){
    if(!available()||!inCaliforniaBeach(localGyeongju(me)))return null;
    const water=playerWater(me,time());
    if(water)return {water};
    const service=beachServiceAt(me);
    if(service)return {service};
    const q=localGyeongju(me),pool=beachPoolGates.find(s=>Math.hypot(q.x-s.gate.x,q.z-s.gate.z)<4.9);
    return pool?{pool}:null;
  }
  function gear(delta){
    me.beachGear={...me.beachGear,...delta};changed();
  }
  for(const [id,label] of [[null,"평상복"],...Object.entries(swimwearOptions).map(([k,v])=>[k,v.name])]){
    const b=document.createElement("button");b.type="button";b.className="quiet";b.textContent=label;b.dataset.suit=id??"";
    b.onclick=()=>{if(nearby()?.service?.type==="changing"){gear({suit:id});toast(label+"으로 갈아입었어요.");}changing.close();};
    choices.append(b);
  }
  get("beach-changing-close").onclick=()=>changing.close();
  get("waterpark-action").onclick=()=>{
    const v=nearby();if(!v)return;
    if(v.pool){walkTo(gyeongjuPoint(entryPoints[v.pool.id]));return;}
    if(v.water){
      let exit=beachPoolGates.find(s=>s.id===v.water.kind).gate;
      if(v.water.kind==="river"){
        const p=localGyeongju(me);
        const distance=q=>(q.x-p.x)**2+(q.z-p.z)**2;
        const bend=beachRiver.reduce((best,q)=>distance(q)<distance(best)?q:best);
        exit=riverOffset(bend,bend.half+1.25);
      }
      walkTo(gyeongjuPoint(exit));return;
    }
    if(v.service.type==="rental"){gear({vest:!me.beachGear?.vest});sound.clink();toast(me.beachGear.vest?"구명재킷을 입었어요.":"구명재킷을 반납했어요.");}
    if(v.service.type==="changing"){
      for(const b of choices.children)b.setAttribute("aria-pressed",String(b.dataset.suit===(me.beachGear?.suit??"")));
      reset();changing.showModal();
    }
  };
  get("waterpark-splash").onclick=()=>{
    if(!nearby()?.water||time()-(me.beachSplash??0)<1350)return;
    me.beachSplash=time();sound.splash();changed();
  };
  return {update(){
    const v=nearby();
    const label=v?.water?"풀 밖으로 나오기":v?.pool?poolLabels[v.pool.id]:v?.service?.type==="changing"?"수영복 갈아입기":
      v?.service?.type==="rental"?me.beachGear?.vest?"구명재킷 반납":"구명재킷 대여":null;
    setActivity("waterpark-action",label);
    setActivity("waterpark-splash",v?.water?"물 튀기기":null,time()-(me.beachSplash??0)<1350);
    if(changing.open&&v?.service?.type!=="changing")changing.close();
  }};
}
