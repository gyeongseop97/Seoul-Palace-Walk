// Finishes shared by the concourse halls and platforms of Seoul Station.
const cache=new WeakMap();
// Honed granite in 1.2 m slabs. One texture tile covers four slabs each way (4.8 m).
export function stationGranite(T){
  if(cache.has(T))return cache.get(T);
  const c=document.createElement("canvas");c.width=c.height=256;
  const ctx=c.getContext("2d"),n=256;
  let seed=9;const rnd=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){
    const v=206+Math.floor(rnd()*13);ctx.fillStyle=`rgb(${v},${v-2},${v-8})`;ctx.fillRect(i*64,j*64,64,64);
  }
  for(let k=0;k<2800;k++){ctx.fillStyle=k%3?"rgba(70,66,60,.11)":"rgba(255,255,255,.17)";ctx.fillRect(rnd()*n,rnd()*n,1.4,1.4);}
  ctx.fillStyle="rgba(116,112,104,.5)";for(let i=0;i<=4;i++){ctx.fillRect(i*64-1,0,2,n);ctx.fillRect(0,i*64-1,n,2);}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.wrapS=map.wrapT=T.RepeatWrapping;
  const material=new T.MeshStandardMaterial({roughness:.36,metalness:.05,map});
  cache.set(T,material);return material;
}
// Rectangle of floor at a given height, with texture coordinates in metres.
export function graniteSlab(T,parent,x,height,z,width,depth){
  const geo=new T.PlaneGeometry(width,depth);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+x)/4.8,(pos.getZ(i)+z)/4.8);
  const mesh=new T.Mesh(geo,stationGranite(T));mesh.position.set(x,height,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
