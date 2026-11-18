export const PHOTO_REACH=24;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const normal=angle=>(angle%360+360)%360;
const rad=Math.PI/180;

export function bindPhotoMode(panel,{getAvatar,getView,getClock,getRoster,canMove,onOpen,onClose,onCapture,onShare,notice}){
  const root=panel.ownerDocument,byId=id=>root.getElementById(id);
  const controls=Object.fromEntries(["photo-group","photo-shoot","photo-raise","photo-lower","photo-exit",
    "photo-countdown"].map(id=>[id,byId(id)]));
  let camera=null,shot=null,waiting=false,mode="solo";

  function status(text=""){
    if(controls["photo-countdown"].textContent!==text)controls["photo-countdown"].textContent=text;
  }
  function viewFrom(anchor,heading,distance,height=1.85){
    const yaw=heading*rad;
    const view={x:anchor.x-Math.sin(yaw)*distance,y:anchor.y+Math.cos(yaw)*distance,height,pan:heading,tilt:8,fov:55};
    for(const factor of [1,.72,.44,.18,0]){
      const next={...view,x:anchor.x+(view.x-anchor.x)*factor,y:anchor.y+(view.y-anchor.y)*factor};
      if(canMove(next))return next;
    }
    return {...view,x:anchor.x,y:anchor.y};
  }
  function open(){
    if(camera)return;
    const self=getAvatar(),view=getView();
    camera=viewFrom(self,view.pan,4.3);mode="solo";waiting=false;shot=null;
    panel.hidden=true;status();onOpen();
  }
  function close(){
    if(!camera)return;
    camera=null;shot=null;waiting=false;panel.hidden=true;status();onClose();
  }
  function zoom(change){
    if(camera&&!shot&&!waiting)camera.fov=clamp(camera.fov-change*8,32,82);
  }
  function drag(dx,dy){
    if(!camera||shot||waiting)return;
    camera.pan=normal(camera.pan+dx*.33);camera.tilt=clamp(camera.tilt+dy*.25,-70,70);
  }
  function move(dx,dy,elapsed){
    if(!camera||shot||waiting||!elapsed||!dx&&!dy)return;
    const yaw=camera.pan*rad,speed=3.6*elapsed/Math.max(1,Math.hypot(dx,dy));
    const candidate={...camera,x:camera.x+(Math.cos(yaw)*dx-Math.sin(yaw)*dy)*speed,
      y:camera.y+(Math.sin(yaw)*dx+Math.cos(yaw)*dy)*speed};
    const self=getAvatar();
    if(Math.hypot(candidate.x-self.x,candidate.y-self.y)<=PHOTO_REACH&&canMove(candidate))camera=candidate;
  }
  function height(delta){
    if(!camera||shot||waiting)return;
    const next={...camera,height:clamp(camera.height+delta,.65,5.5)};
    if(canMove(next))camera=next;
  }
  function group(){
    if(!camera||shot||waiting)return;
    const me=getAvatar();
    if(mode==="group"){
      camera=viewFrom(me,getView().pan,4.3);mode="solo";status();return;
    }
    const nearby=getRoster();
    if(!nearby.length){notice("가까이에 있는 친구와 단체 사진을 찍을 수 있어요.");return;}
    const people=[me,...nearby];
    const centre=people.reduce((point,person)=>({x:point.x+person.x/people.length,y:point.y+person.y/people.length}),{x:0,y:0});
    const spread=Math.max(...people.map(person=>Math.hypot(person.x-centre.x,person.y-centre.y)));
    camera=viewFrom(centre,normal(me.heading+180),clamp(4.5+spread*1.15,4.5,15),2.05);
    camera.fov=clamp(53+spread*2,55,76);mode="group";
    status("구도를 맞춘 뒤 함께 촬영을 누르세요.");
  }
  function shoot(){
    if(!camera||shot||waiting)return;
    if(mode==="group"){
      waiting=true;status("촬영 시각을 맞추고 있어요.");
      onShare({...camera});
    }else{
      shot={shootAt:getClock()+1600,mode:"solo"};
    }
  }
  function join(event){
    if(!event||event.shootAt<=getClock())return false;
    open();
    waiting=false;camera={...event.camera};mode="group";shot={...event,mode:"group"};
    return true;
  }
  function shareFailed(){
    waiting=false;status("단체 사진을 준비하지 못했어요. 다시 눌러 주세요.");
  }
  function update(clock){
    const busy=Boolean(shot||waiting);
    for(const id of ["photo-group","photo-shoot","photo-raise","photo-lower"]){
      if(controls[id].disabled!==busy)controls[id].disabled=busy;
    }
    const label=mode==="group"?"함께 촬영":"촬영";
    if(controls["photo-shoot"].textContent!==label)controls["photo-shoot"].textContent=label;
    const framing=mode==="group"?"개인 구도":"단체 구도";
    if(controls["photo-group"].textContent!==framing)controls["photo-group"].textContent=framing;
    if(!shot)return;
    if(clock<shot.shootAt){status(Math.max(1,Math.ceil((shot.shootAt-clock)/1000))+"초 뒤 촬영");return;}
    const capture=shot;shot=null;
    if(clock-capture.shootAt<1600){status("앨범에 사진을 저장하는 중이에요.");onCapture(capture);}
    else status("촬영 시각이 지났어요.");
  }
  controls["photo-exit"].addEventListener("click",close);
  controls["photo-group"].addEventListener("click",group);
  controls["photo-shoot"].addEventListener("click",shoot);
  controls["photo-raise"].addEventListener("click",()=>height(.45));
  controls["photo-lower"].addEventListener("click",()=>height(-.45));
  function toggleTools(){
    if(camera)panel.hidden=!panel.hidden;
  }
  return {open,close,zoom,drag,move,join,shareFailed,update,status,toggleTools,get camera(){return camera;}};
}
