import * as T from "three";
import {districtMeshes} from "./gyeongju-mesh.js";
import {observatory} from "./gyeongju-landmarks.js";
import {tower} from "./gyeongju-observatory.js";

export function createCheomseongdae(town,{loadGltf,refreshShadows}){
  const fallback=new T.Group(),kit=districtMeshes(fallback);
  observatory(kit,tower);kit.finish();town.add(fallback);
  const variants=[{file:"cheomseongdae-lod"},{file:"cheomseongdae"}];
  let current=fallback,wantDetail=false;
  function request(variant,detail){
    if(!loadGltf||variant.pending||variant.model||Date.now()<(variant.retryAt??0))return;
    variant.pending=true;
    loadGltf("./art/"+variant.file+".glb").then(({scene})=>{
      scene.name=detail?"첨성대 실측":"첨성대 원경";
      scene.position.set(tower.x,0,tower.z);scene.visible=false;
      scene.traverse(mesh=>{
        if(!mesh.isMesh)return;
        mesh.castShadow=mesh.receiveShadow=true;
      });
      town.add(scene);variant.model=scene;
    }).catch(()=>{variant.retryAt=Date.now()+60000;}).finally(()=>{variant.pending=false;});
  }
  return (camera,zoomScale)=>{
    const eye=camera.position,dx=eye.x-tower.x,dz=eye.z-tower.z,dy=eye.y-4.6;
    const d2=dx*dx+dy*dy+dz*dz;
    const detailRange=(wantDetail?56:47)*zoomScale;wantDetail=d2<detailRange*detailRange;
    request(variants[0],false);
    if(wantDetail)request(variants[1],true);
    const next=(wantDetail?variants[1].model:null)??variants[0].model??variants[1].model??fallback;
    if(current!==next){
      current.visible=false;next.visible=true;current=next;refreshShadows?.();
    }
  };
}
