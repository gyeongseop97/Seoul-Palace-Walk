// Queue the full survey only when the camera needs it. Keep the last available
// model on screen while the next one loads, including when an optional fetch fails.
export function createSurveyLod(fallback,center,span,streamRange,loadFar,wakeQueue){
  let near=null,far=null,visible=fallback,wantsFar=null,requested=false,failed=false;
  return {
    get needsNear(){return wantsFar===false||failed;},
    setNear(model){model.visible=false;near=model;},
    update(camera){
      const distance=camera.position.distanceTo(center);
      const screenFraction=span*camera.projectionMatrix.elements[5]/(2*Math.max(distance,.01));
      const threshold=wantsFar ? .20 : .17;
      const useFar=screenFraction<threshold;
      if(!useFar&&wantsFar!==false)wakeQueue();
      wantsFar=useFar;
      if(useFar&&!requested&&(near||distance<=streamRange)){
        requested=true;
        loadFar().then(model=>{
          model.visible=false;far=model;
        }).catch(()=>{failed=true;wakeQueue();});
      }
      const next=(useFar ? far??near : near??far)??fallback;
      if(next===visible)return false;
      visible.visible=false;next.visible=true;visible=next;
      return true;
    }
  };
}
