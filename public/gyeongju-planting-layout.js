// Rendering and pedestrian clearance use the same seeded positions in local metres.
const cache=new WeakMap();
export function gyeongjuPlantings(parks,roads,stationExit,mounds=[]){
 if(cache.has(parks))return cache.get(parks);
 let seed=817204;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const trees=[],trunks=new Map(),lanes=new Map(),unit=16;
 const key=(x,z)=>Math.floor(x/unit)+","+Math.floor(z/unit);
 function add(tree){
  const k=key(tree.x,tree.z);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)
   for(const other of trunks.get(key(tree.x+dx*unit,tree.z+dz*unit))??[])
    if(Math.hypot(tree.x-other.x,tree.z-other.z)<Math.min(tree.height,other.height)*.43)return;
  trees.push(tree);if(!trunks.has(k))trunks.set(k,[]);trunks.get(k).push(tree);
 }
 for(const road of roads){
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,clear=road.width/2+1.4,den=dx*dx+dz*dz||1;
   const segment={a,dx,dz,den,clear};
   for(let x=Math.floor((Math.min(a.x,b.x)-clear)/unit);x<=Math.floor((Math.max(a.x,b.x)+clear)/unit);x++)
    for(let z=Math.floor((Math.min(a.z,b.z)-clear)/unit);z<=Math.floor((Math.max(a.z,b.z)+clear)/unit);z++){
     const k=x+","+z;if(!lanes.has(k))lanes.set(k,[]);lanes.get(k).push(segment);
    }
  }
 }
 const onPath=(x,z)=>(lanes.get(key(x,z))??[]).some(({a,dx,dz,den,clear})=>{
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/den));
  return Math.hypot(x-a.x-dx*t,z-a.z-dz*t)<clear;
 });
 function contains(x,z,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];
   if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }
  return inside;
 }
 for(const p of parks){
  if(p.kind!=="wood")continue;
  const xs=p.points.map(v=>v.x),zs=p.points.map(v=>v.z),x0=Math.min(...xs),z0=Math.min(...zs);
  const w=Math.max(...xs)-x0,d=Math.max(...zs)-z0,grove=p.name?.includes("계림");
  const samples=Math.min(720,Math.ceil(w*d/(grove?86:114)));
  for(let i=0;i<samples;i++){
   const x=x0+rand()*w,z=z0+rand()*d;
   if(!contains(x,z,p.points)||onPath(x,z))continue;
   const height=(grove?9:5)+rand()*(grove?6:5),style=["cloud","round","branchy","column"][i%4];
   add({x,z,height,spread:height*(grove?.92:.77),style,palette:["deep","fresh","olive","deep","russet"][i%5]});
  }
 }
 const river=parks.find(p=>p.name==="남천"&&p.kind==="water");
 if(river){
  let next=7;
  for(let i=1;i<river.points.length;i++){
   const a=river.points[i-1],b=river.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
   if(len<.01)continue;
   while(next<len){
    const f=next/len,px=a.x+dx*f,pz=a.z+dz*f;
    const bank=contains(px+dz/len*1.3,pz-dx/len*1.3,river.points)?-1:1;
    const offset=bank*(5+8*rand()),x=px+dz/len*offset,z=pz-dx/len*offset;
    if(Math.abs(x-554)>25&&x>310&&x<820&&!contains(x,z,river.points)&&!onPath(x,z)){
     const height=6.1+rand()*4.8;
     add({x,z,height,spread:height*.92,style:rand()<.5?"cloud":"round",palette:rand()<.6?"deep":"fresh"});
    }
    next+=10+rand()*9;
   }
   next-=len;
  }
 }
 if(stationExit){
  const yaw=2.53,c=Math.cos(yaw),s=Math.sin(yaw);
  for(const side of [-1,1])for(let i=0;i<6;i++){
   const u=side*(18+i*5.7),v=9+(i%2)*2;
   add({x:stationExit.x+u*c+v*s,z:stationExit.z-u*s+v*c,height:4+rand()*2,style:"round",palette:"deep"});
  }
 }
 // Older pines frame the pond and the approach to Michu; keep the sightline across the water open.
 const groups=[[-75,-344],[-68,-275],[-103,-282],[-59,-348],[92,-85],[156,-92],[158,-62],[116,-61],[235,23],[213,10]];
 for(const [cx,cz] of groups)for(let i=0;i<4;i++){
  const x=cx+(rand()-.5)*18,z=cz+(rand()-.5)*16;
  if(onPath(x,z)||parks.some(p=>p.kind==="water"&&contains(x,z,p.points))||
   mounds.some(m=>((x-m.x)/(m.rx+2))**2+((z-m.z)/(m.rz+3))**2<1.08))continue;
  const height=6.4+rand()*3.9;
  add({x,z,height,spread:height*.80,style:i===2?"branchy":"cloud",palette:i===2?"deep":"pine"});
 }
 function blocked(p){
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)
   for(const t of trunks.get(key(p.x+dx*unit,p.z+dz*unit))??[])
    if(Math.hypot(p.x-t.x,p.z-t.z)<t.height*.042+.13)return true;
  return false;
 }
 const result={trees,blocked};cache.set(parks,result);return result;
}
