// Layer ribbons in map space before draping them over the shared terrain grid.
const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
const area=points=>points.reduce((sum,p,i)=>{
  const q=points[(i+1)%points.length];return sum+p.x*q.y-p.y*q.x;
},0);
const bounds=points=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),
  minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))});
const overlaps=(a,b)=>a.maxX>b.minX&&a.minX<b.maxX&&a.maxY>b.minY&&a.minY<b.maxY;

function clip(points,a,b,sign){
  const output=[];
  let previous=points.at(-1),distance=cross(a,b,previous)*sign;
  for(const point of points){
    const next=cross(a,b,point)*sign;
    if((distance<0)!==(next<0)){
      const t=distance/(distance-next);
      output.push({x:previous.x+(point.x-previous.x)*t,y:previous.y+(point.y-previous.y)*t});
    }
    if(next>=0)output.push(point);
    previous=point;distance=next;
  }
  return output;
}

export function coverTriangles(triangles){
  return triangles.flatMap(points=>{
    const twiceArea=area(points);
    return Math.abs(twiceArea)>1e-5?[{points,box:bounds(points),sign:Math.sign(twiceArea)}]:[];
  });
}

export function coverRibbon(path){
  return coverTriangles(path.left.slice(1).flatMap((left,i)=>{
    const a=path.left[i],b=path.right[i],c=path.right[i+1];
    return [[a,b,c],[a,c,left]];
  }));
}

export function exposedSurface(points,covered){
  const box=bounds(points);
  let exposed=[points];
  for(const {points:triangle,box:extent,sign} of covered){
    if(!overlaps(box,extent))continue;
    const remaining=[];
    for(let interior of exposed){
      if(!overlaps(bounds(interior),extent)){remaining.push(interior);continue;}
      for(const [i,a] of triangle.entries()){
        const b=triangle[(i+1)%3],outside=clip(interior,a,b,-sign);
        if(outside.length>=3&&Math.abs(area(outside))>1e-5)remaining.push(outside);
        interior=clip(interior,a,b,sign);
        if(interior.length<3)break;
      }
    }
    exposed=remaining;
    if(!exposed.length)break;
  }
  return exposed;
}

export function bukchonPavers(T,{alley=false}={}){
  const size=128,pixels=new Uint8Array(size*size*4);
  const base=alley?[159,150,137]:[176,177,166],shift=alley?8:0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const row=y>>4,across=(x+(row%2)*16)%size,column=across>>5;
    const edgeX=across%32,edgeY=y%16;
    const slab=((row*71+column*131+row*column*47)%29)-14;
    const grain=((x*71+y*89+(x^y)*53)%17-8)*.43;
    const joint=edgeX===0||edgeY===0?-32:edgeX===1||edgeY===1?5:edgeX===31||edgeY===15?-12:0;
    const scuff=(((x+7*row)%11<3&&(y+column*3)%7===0)?-6:0);
    const at=(y*size+x)*4;
    for(let k=0;k<3;k++)pixels[at+k]=base[k]+slab+grain+joint+scuff+(k===0?shift*.35:0);
    pixels[at+3]=255;
  }
  const map=new T.DataTexture(pixels,size,size);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
  return new T.MeshStandardMaterial({map,roughness:.90});
}
