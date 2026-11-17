import {ARCADE_UPPER_SITE,ARCADE_STAIRS} from "./arcade-layout.js";
import {addArcadeStairwell} from "./arcade-stairs-world.js";
import {addArcadeTargets} from "./arcade-targets-world.js";
import {addBaseballLane} from "./arcade-baseball-world.js";
import {standSign} from "./regional-stands.js";

export function* buildArcadeUpper(T,parent,kit){
  const {wx,wz,box}=kit,floor=ARCADE_UPPER_SITE;
  const room=new T.Group();
  room.name=floor.name;room.position.set(wx(floor.center.x),0,wz(floor.center.y));room.rotation.y=floor.insideAngle;
  parent.add(room);
  const {insideWidth:w,insideDepth:d}=floor;
  const block=(color,x,y,z,width,height,depth)=>box(color,x,y,z,width,height,depth,room);
  block(0x313e48,0,-.04,0,w,.08,d);
  block(0x354a57,0,2,-d/2,w,4,.16);
  block(0x354a57,0,2,d/2,w,4,.16);
  block(0x2c3a48,0,4,0,w,.19,d);
  for(const side of [-1,1]){
    block(0x354a57,side*w/2,2,0,.16,4,d);
    block(0x587575,side*(w/2-.13),1.28,0,.05,.11,d-.33);
  }
  for(const x of [-6.5,0,6.5]){
    const light=new T.PointLight(0xffead2,14,12);
    light.position.set(x,3.63,1.6);room.add(light);
    block(0xb9b994,x,3.9,2.02,4.3,.04,.15);
  }
  for(const x of [-3.22,3.17]){
    block(0x3c565a,x,.78,-.88,.12,1.56,8.06);
    block(0x71958a,x,1.58,-.88,.14,.08,8.06);
  }
  for(let index=0;index<17;index++)block(index%2?0x52616b:0x5b6a70,(index-8)*1.14,.009,5.23,1.07,.017,.52);
  standSign(T,room,"광화문 오락실 2층","사격 · 양궁 · 스크린 야구",5.18,.55,2.98,-6.8,"#293e51","#ffe6ae",.56);
  for(const stairs of ARCADE_STAIRS[floor.id])addArcadeStairwell(T,room,kit,stairs);
  yield;
  const targets=addArcadeTargets(T,room,kit);
  yield;
  const baseball=addBaseballLane(T,room,kit);
  function updateArcade(local,_clock,peers,serverClock){
    const active=new Map();
    for(const peer of peers){
      const state=peer.arcade;
      if(state&&(!active.has(state.kind)||peer.id<active.get(state.kind).id))active.set(state.kind,peer);
    }
    const activity=kind=>local?.kind===kind?local:active.get(kind)?.arcade;
    targets.update(activity("shooting"),activity("archery"));
    baseball.update(activity("baseball"),serverClock);
  }
  return {updateArcade};
}
