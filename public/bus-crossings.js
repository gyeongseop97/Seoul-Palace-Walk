import {corridorCrossings} from "./sejong-corridor-layout.js";
import {plazaCrossings,eastCurb,eastRoadWidth,plazaAt} from "./plaza-layout.js";
import {uijeongbuCrossings} from "./uijeongbu-layout.js";
import {bukchonPaths} from "./bukchon-layout.js";

const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
export const streetCrossings=[
  ...corridorCrossings,
  ...plazaCrossings.map(n=>({a:plazaAt(eastCurb(n)-.8,n),b:plazaAt(eastCurb(n)+eastRoadWidth+.8,n),width:6})),
  ...uijeongbuCrossings.map(({left,right})=>({a:mid(left[0],right[0]),b:mid(left[1],right[1]),width:5})),
  ...bukchonPaths.filter(p=>p.kind==="crosswalk").map(p=>({a:p.points[0],b:p.points.at(-1),width:p.width}))
];
export function routeCrossings(path){
  const hits=[];
  for(const crossing of streetCrossings){
    const {a,b}=crossing,dx=b.x-a.x,dy=b.y-a.y;
    for(let i=1;i<path.length;i++){
      const p=path[i-1],q=path[i],sx=q.x-p.x,sy=q.y-p.y,det=sx*dy-sy*dx;
      if(Math.abs(det)<1e-8)continue;
      const x=a.x-p.x,y=a.y-p.y,t=(x*dy-y*dx)/det,u=(x*sy-y*sx)/det;
      if(t<0||t>1||u<0||u>1)continue;
      const distance=p.distance+t*(q.distance-p.distance);
      hits.push({distance,crossing});break;
    }
  }
  return hits.sort((a,b)=>a.distance-b.distance);
}
