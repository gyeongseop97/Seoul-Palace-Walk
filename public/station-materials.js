// Finishes shared by the concourse halls and platforms of Seoul Station.
const cache=new WeakMap();
// Four honed slab faces share one image. Each slab is 1.2 m wide.
export const stationGraniteRepeat=2.4;
export function stationGranite(T){
  if(cache.has(T))return cache.get(T);
  const map=new T.TextureLoader().load(new URL("./art/station-granite.webp",import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.wrapS=map.wrapT=T.RepeatWrapping;
  const material=new T.MeshStandardMaterial({roughness:.36,metalness:.05,map});
  cache.set(T,material);return material;
}
// Rectangle of floor at a given height, with texture coordinates in metres.
export function graniteSlab(T,parent,x,height,z,width,depth){
  const geo=new T.PlaneGeometry(width,depth);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+x)/stationGraniteRepeat,(pos.getZ(i)+z)/stationGraniteRepeat);
  const mesh=new T.Mesh(geo,stationGranite(T));mesh.position.set(x,height,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
