// Coordinates are in the surveyed courtyard's east–south axes, in metres.
export const templeHallTerraces=[
 {id:244539247,name:"대웅전",u:-.64,v:-17.24,floor:5,w:21.6,d:19.2,plinth:1.18,
  bodyW:15.85,bodyD:13.50,deckW:19.5,deckD:17.05,stairW:3.32,stairRun:1.95,stairCount:7,
  stairs:["south","east","west","north"],frontBays:[8.2,8.7,17.7,8.7,8.2],sideBays:5},
 {id:244539240,name:"극락전",u:-46.70,v:-4.23,floor:3.1,w:15.6,d:15.4,plinth:.99,
  bodyW:10.35,bodyD:9.7,deckW:14.35,deckD:13.15,stairW:2.85,stairRun:1.65,stairCount:6,
  stairs:["south"],frontBays:[1,1.28,1],sideBays:3},
 {id:244539248,name:"자하문",u:.15,v:16.6,floor:5,w:14.7,d:11.5,plinth:0,
  bodyW:9.6,bodyD:6.2,frontBays:[1,1.16,1],sideBays:2},
 {id:949325902,name:"안양문",u:-46.36,v:17.30,floor:3.1,w:10.85,d:10.35,plinth:0,
  bodyW:7.45,bodyD:5.7,frontBays:[1,1.28,1],sideBays:2,gable:true}
];

// Callers share the same stair orientation, height and solid plinth edges as the meshes.
export function hallTerraceAt({u,v}){
 for(const b of templeHallTerraces){
  if(!b.plinth)continue;
  const x=u-b.u,z=v-b.v,halfW=b.deckW/2,halfD=b.deckD/2;
  if(Math.abs(x)>halfW+b.stairRun+.3||Math.abs(z)>halfD+b.stairRun+.3)continue;
  for(const side of b.stairs){
   const across=side==="south"||side==="north"?x:z;
   const along=side==="south"?z-halfD:side==="north"?-z-halfD:side==="east"?x-halfW:-x-halfW;
   if(Math.abs(across)<=b.stairW/2 && along>=-.22 && along<=b.stairRun){
    const step=Math.max(0,Math.min(b.stairCount-1,Math.floor(along*b.stairCount/b.stairRun)));
    return {id:b.id,solid:false,height:b.plinth*(1-step/b.stairCount)};
   }
  }
  if(Math.abs(x)>halfW+.11||Math.abs(z)>halfD+.11)continue;
  const wall=Math.abs(x)<b.bodyW/2+.16&&Math.abs(z)<b.bodyD/2+.16;
  const edge=Math.abs(x)>halfW-.10||Math.abs(z)>halfD-.10;
  return {id:b.id,solid:wall||edge,edge:edge&&!wall,height:b.plinth};
 }
 return null;
}
