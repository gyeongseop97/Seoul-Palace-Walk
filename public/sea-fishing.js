import {dock} from "./pohang-layout.js";
import {coastPoint} from "./region-coordinates.js";

export const fishingDock={x:dock.x-3,z:dock.z+1};
export const fishingSpot={...coastPoint(fishingDock),name:"영일대 바다낚시"};
export const fishSpecies=[
  {name:"멸치",min:8,max:17,weight:13},
  {name:"전갱이",min:13,max:38,weight:15},
  {name:"망둑어",min:11,max:27,weight:13},
  {name:"고등어",min:20,max:47,weight:13},
  {name:"보리멸",min:14,max:31,weight:12},
  {name:"볼락",min:17,max:37,weight:11},
  {name:"쥐노래미",min:21,max:51,weight:9},
  {name:"감성돔",min:25,max:57,weight:7},
  {name:"광어",min:30,max:84,weight:5},
  {name:"농어",min:35,max:97,weight:4},
  {name:"삼치",min:40,max:106,weight:3},
  {name:"방어",min:45,max:120,weight:2}
];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function rollFish(random=Math.random,zone=1){
  const weights=fishSpecies.map(fish=>fish.weight*(zone===1?1:zone===2?(.5+fish.max/65):(1.6-fish.max/90)));
  const totalWeight=weights.reduce((sum,weight)=>sum+weight,0);
  let selection=random()*totalWeight;
  const species=fishSpecies.find((fish,index)=>(selection-=weights[index])<0)??fishSpecies.at(-1);
  const size=Math.round(species.min+(species.max-species.min)*random()**[2.15,1.35,.76][zone]);
  return {name:species.name,size};
}

export function startFight(fish){
  const strength=clamp((fish.size-8)/112,0,1);
  return {fish,strength,time:0,tension:.26,landed:0,outcome:null,surge:false};
}

export function advanceFight(fight,seconds,reeling){
  if(fight.outcome)return;
  const strength=fight.strength;
  fight.time+=seconds;
  const cycle=3.5-strength*.75;
  fight.surge=fight.time%cycle>cycle-(.65+strength*.7);
  const force=fight.surge ? .12+strength*.20 : .02+strength*.06;
  const change=reeling ? .14+strength*.15+force : force-(fight.surge ? .53 : .50);
  fight.tension=clamp(fight.tension+seconds*change,0,1);
  fight.landed=clamp(fight.landed+seconds*(reeling
    ?(.26-strength*.095)*(fight.surge ? .55 : 1)
    :-(.013+strength*.026)*(fight.surge?1.8:1)),0,1);
  if(fight.tension>=1)fight.outcome="snapped";
  else if(fight.landed>=1)fight.outcome="caught";
  else if(fight.time>=24+strength*18)fight.outcome="escaped";
}
