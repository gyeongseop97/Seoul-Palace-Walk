// A joint-free crop of the stone plinth in the Bulguksa photographic atlas.
let granite;
export function graniteMaterial(T){
 if(granite)return granite;
 granite=new T.MeshStandardMaterial({color:0xb4aea0,roughness:.98,side:T.DoubleSide});
 if(typeof document!=="undefined"){
  const map=new T.TextureLoader().load(new URL("./art/bulguksa-granite.webp",import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.MirroredRepeatWrapping;
  map.anisotropy=4;
  granite.map=map;
  granite.color.setRGB(.80,.94,1.14);
 }
 return granite;
}
