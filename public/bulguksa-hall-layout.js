import {templeAxis,templeAxes} from "./bulguksa-ground.js";
import {gyeongjuPoint} from "./region-coordinates.js";

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

// The open centre pair of door leaves and the worship cushions use the same
// local frame for the visible hall, walkers, the camera and the action prompt.
export const worshipHalls=templeHallTerraces.filter(hall=>hall.plinth);
const pads=[];
for(const hall of worshipHalls){
 const great=hall.name==="대웅전",columnWidth=great?.49:.43;
 const central=hall.frontBays[(hall.frontBays.length-1)/2],total=hall.frontBays.reduce((a,b)=>a+b,0);
 const leaf=(hall.bodyW*central/total-columnWidth*.85)/4;
 const screenZ=-hall.bodyD*.29,padZ=hall.bodyD*.08;
 const cushionXs=great?[-2.25,0,2.25]:[-1.55,0,1.55];
 hall.interior={columnWidth,leaf,screenZ,altarW:great?5.4:3.4,padZ,cushionXs,eave:great?6.28:4.98};
 const target=templeAxis(hall.u,hall.v+screenZ+.55);
 for(const x of cushionXs){
  const local=templeAxis(hall.u+x,hall.v+padZ);
  pads.push({...gyeongjuPoint(local),name:"불국사 "+hall.name,h:hall.floor+hall.plinth+.14,
   heading:(360+Math.atan2(target.x-local.x,local.z-target.z)*180/Math.PI)%360});
 }
}
export function templeWorshipAt(p){
 let best=null,distance=.94**2;
 for(const pad of pads){
  const d=(p.x-pad.x)**2+(p.y-pad.y)**2;
  if(d<=distance){distance=d;best=pad;}
 }
 return best;
}
export function templeRoomAt(p){
 const {u,v}=templeAxes(p);
 return worshipHalls.find(b=>Math.abs(u-b.u)<b.bodyW/2&&v-b.v>b.interior.screenZ&&v-b.v<b.bodyD/2);
}
function hallObstacle(b,x,z){
 const halfW=b.bodyW/2,halfD=b.bodyD/2,across=Math.abs(x);
 if(across>halfW+.24||Math.abs(z)>halfD+.24)return false;
 const {screenZ,altarW,leaf,columnWidth}=b.interior;
 if(across>halfW-.24||z<screenZ+.24)return true;
 if(z>halfD-.25&&across>leaf*.82-.16)return true;
 if(z>halfD-leaf-.20&&Math.abs(across-leaf*.98)<.20+leaf*.11)return true;
 if(across<altarW/2+.22&&z<screenZ+1.35)return true;
 return (across-halfW*.56)**2+(z+halfD*.25)**2<(columnWidth*.76+.2)**2;
}

// Callers share the same stair orientation, height and solid plinth edges as the meshes.
export function hallTerraceAt({u,v}){
 for(const b of worshipHalls){
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
  const wall=hallObstacle(b,x,z);
  const onFloor=Math.abs(x)<b.bodyW/2&&Math.abs(z)<b.bodyD/2;
  const edge=Math.abs(x)>halfW-.10||Math.abs(z)>halfD-.10;
  return {id:b.id,solid:wall||edge,edge:edge&&!wall,height:b.plinth+(onFloor?.09:0),
   ceiling:b.interior.eave-b.plinth-(onFloor?.24:.15)};
 }
 return null;
}
