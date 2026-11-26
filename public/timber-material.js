let timber;

// UVs follow the grain: one repeat spans 2 m along a board and 0.4 m across it.
// The neutral grain lets varnished, bare and painted timber keep their existing colors.
export function timberMaterial(T){
 if(timber)return timber;
 timber=new T.MeshStandardMaterial({roughness:.84});
 if(typeof document!=="undefined"){
  const map=new T.TextureLoader().load(new URL("./art/timber-grain.webp",import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;
  map.anisotropy=4;
  timber.map=map;
 }
 return timber;
}
