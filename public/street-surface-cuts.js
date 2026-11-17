const epsilon=1e-7;

function bounds(points){
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),
    top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
}

function split(points,a,b){
  const inside=[],outside=[];
  const dx=b.x-a.x,dy=b.y-a.y;
  const side=p=>dx*(p.y-a.y)-dy*(p.x-a.x);
  let from=points.at(-1),start=side(from);
  for(const to of points){
    const end=side(to);
    if((start>epsilon&&end< -epsilon)||(start< -epsilon&&end>epsilon)){
      const t=start/(start-end);
      const joint={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
      inside.push(joint);outside.push(joint);
    }
    if(end>=-epsilon)inside.push(to);
    if(end<=epsilon)outside.push(to);
    from=to;start=end;
  }
  return [inside,outside];
}

function subtract(points,{triangle,range}){
  const box=bounds(points);
  if(box.right<=range.left||box.left>=range.right||box.bottom<=range.top||box.top>=range.bottom)return [points];
  const outside=[];
  let remainder=points;
  for(let i=0;i<3;i++){
    const [inner,outer]=split(remainder,triangle[i],triangle[(i+1)%3]);
    if(inner.length<3)return [points];
    if(outer.length>=3)outside.push(outer);
    remainder=inner;
  }
  return outside;
}

// Clip ground layers in plan before giving them height and tile coordinates.
// This also permits a stair cut to reach the edge of a road or sidewalk.
export function makeStreetSurfaceCut(T,outlines){
  function triangles(points){
    const contour=points.map(({x,y})=>new T.Vector2(x,y));
    return T.ShapeUtils.triangulateShape(contour,[]).map(indices=>indices.map(i=>contour[i]));
  }
  const cuts=outlines.flatMap(triangles).map(triangle=>{
    if(T.ShapeUtils.isClockWise(triangle))triangle.reverse();
    return {triangle,range:bounds(triangle)};
  });
  return outline=>{
    const box=bounds(outline);
    const relevant=cuts.filter(({range})=>box.right>range.left&&box.left<range.right&&box.bottom>range.top&&box.top<range.bottom);
    if(!relevant.length)return [outline];
    let pieces=triangles(outline);
    for(const cut of relevant)pieces=pieces.flatMap(piece=>subtract(piece,cut));
    return pieces.filter(piece=>Math.abs(T.ShapeUtils.area(piece))>epsilon);
  };
}
