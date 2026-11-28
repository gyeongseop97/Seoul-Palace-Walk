import {parkWalkways,inAmusementPark,parkWalkable} from "./gyeongju-world-layout.js";
import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";

const coats=["#ba785c","#56817d","#dbb068","#6c8199","#a2687c","#73885e"];
// Visitors linger at either end of a clear stretch of midway before heading back.
const lanes=parkWalkways.flatMap((path,route)=>path.slice(1).flatMap((b,i)=>{
  const a=path[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  if(length<11)return [];
  for(let d=0;d<=length;d+=1.25){
    const p={x:a.x+dx*d/length,z:a.z+dz*d/length};
    if(![-.55,.55].every(s=>parkWalkable({x:p.x+s*dz/length,z:p.z-s*dx/length})))return [];
  }
  return [{a,dx:dx/length,dz:dz/length,length,seed:route*41+i*17}];
}));
export function parkVisitors(clock,anchor,limit){
  const p=localGyeongju(anchor);
  if(!inAmusementPark(p))return [];
  const groups=[];
  for(const [i,{a,dx,dz,length,seed}] of lanes.entries()){
    const span=length-3,pace=.83+seed%5*.07,lap=2*(span+4);
    const at=(clock/1000*pace+seed*3.1)%lap,back=at>span+4,leg=back?at-span-4:at;
    const distance=1.5+(back?span-Math.min(span,leg):Math.min(span,leg));
    const x=a.x+dx*distance,z=a.z+dz*distance,d=(p.x-x)**2+(p.z-z)**2;
    if(d>74**2)continue;
    const heading=(Math.atan2(back?-dx:dx,back?dz:-dz)*180/Math.PI+360)%360;
    for(let j=0;j<(i%3===0?2:1);j++){
      const id=i*2+j,side=j?.49:-.49;
      groups.push({d,actor:{...gyeongjuPoint({x:x+dz*side,z:z-dx*side}),id:"park-visitor-"+id,
        heading,stepping:leg<span,character:id%2?"woman":"man",coat:coats[id%coats.length],
        look:{hair:["bun","bob","part","short"][id%4],outfit:["coat","tee","puffer","overalls"][id%4],eyes:"soft"},
        ...(id%5===1?{item:{kind:"churros",remaining:2,started:0}}:{})}});
    }
  }
  return groups.sort((a,b)=>a.d-b.d).slice(0,limit).map(p=>p.actor);
}
