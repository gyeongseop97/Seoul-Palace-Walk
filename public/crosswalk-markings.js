import {insideCorridorPolygon} from "./sejong-corridor-layout.js";
import {makeStreetSurfaceCut} from "./street-surface-cuts.js";

const interpolate=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

// The segment is split at each paving edge, including an oblique kerb.
export function streetSegmentParts(a,b,outlines,inside=true){
  const dx=b.x-a.x,dy=b.y-a.y,breaks=[0,1],tolerance=1e-8;
  for(const outline of outlines){
    let p=outline.at(-1);
    for(const q of outline){
      const sx=q.x-p.x,sy=q.y-p.y,det=dx*sy-dy*sx;
      if(Math.abs(det)>tolerance){
        const px=p.x-a.x,py=p.y-a.y,t=(px*sy-py*sx)/det,u=(px*dy-py*dx)/det;
        if(t>0&&t<1&&u>=-tolerance&&u<=1+tolerance)breaks.push(t);
      }
      p=q;
    }
  }
  breaks.sort((a,b)=>a-b);
  const result=[];
  for(let i=1;i<breaks.length;i++){
    const start=breaks[i-1],end=breaks[i];
    if(end-start<tolerance)continue;
    const p=interpolate(a,b,(start+end)/2);
    if(outlines.some(polygon=>insideCorridorPolygon(p.x,p.y,polygon))!==inside)continue;
    if(result.length&&Math.abs(result.at(-1)[1]-start)<tolerance)result.at(-1)[1]=end;
    else result.push([start,end]);
  }
  return result.map(([start,end])=>[interpolate(a,b,start),interpolate(a,b,end)]);
}

export function makeCrosswalkMarkings(T,roads){
  const keepRoad=makeStreetSurfaceCut(T,roads,{keepInside:true});
  const clearRoad=makeStreetSurfaceCut(T,roads);
  return (a,b,width)=>{
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
    function stripe({x,y},wide,deep){
      return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([side,end])=>
        ({x:x-side*uy*wide/2+end*ux*deep/2,y:y+side*ux*wide/2+end*uy*deep/2}));
    }
    const parts=streetSegmentParts(a,b,roads);
    const paint=[],tactile=[];
    for(const [start,end] of parts){
      const span=Math.hypot(end.x-start.x,end.y-start.y);
      if(span<1.6)continue;
      const count=Math.max(1,Math.round(span/1.1));
      for(let i=0;i<count;i++){
        const rectangle=stripe(interpolate(start,end,(i+.5)/count),width-.28,.48);
        paint.push(...keepRoad(rectangle));
      }
      for(const [p,side] of [[start,-1],[end,1]]){
        const centre={x:p.x+ux*.44*side,y:p.y+uy*.44*side};
        tactile.push(...clearRoad(stripe(centre,width-.52,.44)));
      }
    }
    return {paint,tactile};
  };
}
