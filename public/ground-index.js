// Spatial lookup for the same projected polygons used by the map and the 3D ground.
export function groundIndex(surfaces,step=32){
  const index=new Map();
  for(const feature of surfaces){
    const outer=feature.rings[0],xs=outer.map(p=>p[0]),ys=outer.map(p=>p[1]);
    for(let col=Math.floor(Math.min(...xs)/step);col<=Math.floor(Math.max(...xs)/step);col++){
      for(let row=Math.floor(Math.min(...ys)/step);row<=Math.floor(Math.max(...ys)/step);row++){
        const key=row*1000+col;
        if(!index.has(key))index.set(key,[]);
        index.get(key).push(feature);
      }
    }
  }
  function inside(x,y,ring){
    let hit=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const [ax,ay]=ring[i],[bx,by]=ring[j];
      if((ay>y)!==(by>y)&&x<ax+(y-ay)*(bx-ax)/(by-ay))hit=!hit;
    }
    return hit;
  }
  return (x,y)=>index.get(Math.floor(y/step)*1000+Math.floor(x/step))?.find(({rings})=>
    inside(x,y,rings[0])&&!rings.slice(1).some(ring=>inside(x,y,ring)))?.kind;
}
