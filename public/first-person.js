import {FEED_MS,avatarHands,jumpLift} from "./activities.js";
import {isBikeDriver,isBikePassenger,isCycling} from "./sejong-bike.js";
import {CLINK_DURATION_MS} from "./social-events.js";
import {gestureHands} from "./avatar-gestures.js";

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const sides=[-1,1];

export function makeFirstPersonView(T,createItemProp){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(57,1,.045,4);
  const ambient=new T.HemisphereLight(0xfff5df,0x807c77,2.12),key=new T.DirectionalLight(0xffe0b9,1.1);
  key.position.set(-.7,1.8,.8);scene.add(ambient,key);
  const matte=(color,roughness=.84)=>new T.MeshStandardMaterial({color,roughness});
  const fabric=matte(0xab5947),trim=matte(0x855446),ivory=matte(0xf0debd),skin=matte(0xf2bd98);
  const trouser=matte(0x3f4452),metal=matte(0xc9d2cb,.60),rubber=matte(0x26312e),bikePaint=matte(0x39ad66,.66);
  const sphere=new T.SphereGeometry(1,12,8),tube=new T.CylinderGeometry(1,1,1,10);
  const make=(parent,geometry,material)=>{const mesh=new T.Mesh(geometry,material);parent.add(mesh);return mesh;};
  const oval=(parent,material,x,y,z,w,h,d)=>{
    const mesh=make(parent,sphere,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);return mesh;
  };
  const forearms=sides.map(side=>{
    const arm=new T.Group(),palm=new T.Group();arm.name=side<0?"Left sleeve and hand":"Right sleeve and hand";
    scene.add(arm);arm.add(palm);
    const sleeve=make(arm,tube,fabric),lower=make(arm,tube,fabric),cuff=make(arm,tube,trim);
    const ribs=[make(arm,tube,trim),make(arm,tube,trim)];
    oval(palm,skin,0,.012,.003,.042,.047,.027);
    const fingers=[-.027,-.010,.009,.026].map((x,i)=>oval(palm,skin,x,.045,.003,.010,.032-Math.abs(i-1.5)*.005,.012));
    const thumb=oval(palm,skin,-side*.037,.015,.013,.017,.034,.016);thumb.rotation.z=side*.52;
    return {side,palm,sleeve,lower,cuff,ribs,fingers,wrist:new T.Vector3(),elbow:new T.Vector3(),shoulder:new T.Vector3()};
  });
  const lap=new T.Group();lap.name="Seated lap";scene.add(lap);
  const knees=sides.map(()=>oval(lap,trouser,0,0,0,.14,.10,.15));
  const handlebar=new T.Group();handlebar.name="Bicycle handlebars";scene.add(handlebar);
  const grips=sides.map(()=>make(handlebar,tube,rubber)),bars=sides.map(()=>make(handlebar,tube,metal));
  const stem=make(handlebar,tube,bikePaint),bell=oval(handlebar,metal,0,0,0,.029,.020,.029);
  const props=sides.map(side=>{
    const pivot=new T.Group();pivot.name=side<0?"First-person primary item":"First-person secondary item";scene.add(pivot);
    return {pivot,show:createItemProp(pivot)};
  });
  const up=new T.Vector3(0,1,0),direction=new T.Vector3(),joint=new T.Vector3(),tip=new T.Vector3();
  let phase=0,stride=0,lookKey="";
  const sand=new T.Color(0xe1cab4);

  function segment(mesh,from,to,radius,overlap=.02){
    const length=direction.subVectors(to,from).length();
    mesh.position.copy(from).lerp(to,.5);
    mesh.quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/Math.max(.001,length)));
    mesh.scale.set(radius,length+overlap,radius);
  }

  function update(position,worldCamera,{now,clock,delta=1/60,seat,clink,night=0}){
    if(camera.fov!==worldCamera.fov||camera.aspect!==worldCamera.aspect){
      camera.fov=worldCamera.fov;camera.aspect=worldCamera.aspect;camera.updateProjectionMatrix();
    }
    const viewHeight=Math.tan(camera.fov*Math.PI/360),viewWidth=viewHeight*camera.aspect;
    const size=clamp(Math.min(1,camera.aspect/.72)*viewHeight/.54,.59,1.17);
    const frame=(vector,x,y,depth)=>vector.set(x*viewWidth*depth,y*viewHeight*depth,-depth);
    ambient.intensity=2.12-.84*night;key.intensity=1.10-.48*night;
    const outfit=position.look?.outfit==="hoodie"?"puffer":position.look?.outfit??"coat";
    const coat=position.coat??0xab5947,keyForLook=`${outfit}/${coat}`;
    if(lookKey!==keyForLook){
      lookKey=keyForLook;
      fabric.color.set(coat).lerp(sand,.19);trim.color.copy(fabric.color).multiplyScalar(.76);
      fabric.roughness=outfit==="puffer"?.63:.86;
      trouser.color.set(({puffer:0x4d6787,tee:0xc7b089,hanbok:0xb9b295})[outfit]??0x3f4452);
    }
    const riding=!seat&&isCycling(position),driving=riding&&isBikeDriver(position),passenger=riding&&isBikePassenger(position);
    const seated=Boolean(seat)||passenger;
    const walking=Boolean(position.stepping&&!seated&&!riding&&jumpLift(position,clock)<.06);
    const motion=walking?(position.blocked?.40:1):0;
    stride=mix(stride,motion,1-Math.exp(-delta*11));
    phase+=delta*(position.running?16:10.4);
    const hands=avatarHands(position,clock,{riding,seated,walking});
    const {claspSide,feedAge,petAge,petting,petSide,itemFor,feedingSide}=hands;
    const cheersEvent=clink??position.clink,clinkAge=clock-cheersEvent?.startedAt;
    const clinkSide=cheersEvent?.slot==="secondItem"?-1:1;
    const cheers=itemFor(clinkSide)?.spec.verb==="마시기"&&!seated&&!claspSide&&clinkAge>=0&&clinkAge<CLINK_DURATION_MS
      ?ease(Math.min(clinkAge/280,(CLINK_DURATION_MS-clinkAge)/420)):0;
    let toastDirection=0;
    if(cheers&&Number.isFinite(cheersEvent.heading)){
      worldCamera.getWorldDirection(direction);
      toastDirection=Math.sin(cheersEvent.heading*Math.PI/180-Math.atan2(direction.x,-direction.z));
    }
    const performance=gestureHands(position,clock,hands,{riding,busy:Boolean(cheers)});
    const {pose:acting,umbrellaSide}=performance;
    lap.visible=seated;handlebar.visible=driving;
    for(const [i,arm] of forearms.entries()){
      const {side,palm,wrist,elbow,shoulder,sleeve,lower,cuff,ribs,fingers}=arm;
      const step=Math.sin(phase+side*Math.PI/2)*stride,bob=seated||riding?0:Math.sin(phase*2)*stride;
      // The camera faces -Z, so its horizontal axis is the reverse of the avatar's.
      const avatarSide=-side;
      const prop=itemFor(avatarSide),item=prop?.item,spec=prop?.spec,itemAge=prop?.itemAge;
      const holding=Boolean(prop),holdingUmbrella=avatarSide===umbrellaSide;
      const spark=item?.kind==="sparkler",drink=spec?.verb==="마시기";
      const use=holding&&!spark&&item.kind!=="churu"?ease(Math.min(itemAge/235,(spec.duration-itemAge)/300)):0;
      const toasting=avatarSide===clinkSide?cheers:0,serving=avatarSide===feedingSide?ease(Math.min(feedAge/270,(FEED_MS-feedAge)/290)):0;
      const performanceHand=performance.hand(avatarSide,true);
      const weight=performanceHand?acting.weight:0;
      let x=side*(seated?.48:.70),y=seated?-.80:-.73,z=seated?.74:.72;
      if(driving){x=side*.62;y=-.63+Math.sin(now*.010)*.014;z=.83;}
      else if(passenger){x=side*.47;y=-.81+Math.sin(now*.008)*.009;z=.70;}
      else if(avatarSide===claspSide){x=side*.83;y=-.68;z=.83;}
      else if(holding){
        const lift=Math.max(use,toasting);
        x=side*mix(.54,.28,lift)+.14*toasting*toastDirection;
        y=mix(-.67,-.39,lift)-.18*serving;z=mix(.76,.62,use)+.13*toasting+.12*serving;
      }else if(holdingUmbrella){x=side*.58;y=-.53;z=.76;}
      else if(petting&&avatarSide===petSide){x=side*.36;y=-.68+Math.sin(petAge*.017)*.06;z=.93;}
      else if(performanceHand){x=mix(x,performanceHand.x,weight);y=mix(y,performanceHand.y,weight);z=mix(z,performanceHand.z,weight);}
      else if(walking){y+=step*(position.running?.15:.095);z+=step*.048;}
      if(acting?.kind==="dance"&&!performanceHand)y+=Math.sin(acting.time*Math.PI*5.44)*.048*acting.weight;
      frame(shoulder,side*1.16,-1.56,.55);
      frame(elbow,side*(riding?.86:.93),-1.13+(performanceHand?Math.max(0,y+.55)*.46*weight:0),.68);
      frame(wrist,x,y+bob*.020,z);
      const short=outfit==="tee",padded=outfit==="puffer";
      lower.material=short?skin:fabric;cuff.material=outfit==="hanbok"?ivory:trim;cuff.visible=!short;
      segment(sleeve,shoulder,elbow,(padded?.072:.060)*size);
      segment(lower,elbow,wrist,(short?.041:padded?.065:.054)*size);
      joint.copy(elbow).lerp(wrist,.91);segment(cuff,joint,wrist,(padded?.067:.056)*size,.018);
      for(const [index,rib] of ribs.entries()){
        rib.visible=padded;
        if(padded){joint.copy(elbow).lerp(wrist,.37+index*.28);tip.copy(elbow).lerp(wrist,.395+index*.28);segment(rib,joint,tip,.067*size,.010);}
      }
      palm.position.copy(wrist);palm.scale.setScalar(size);
      palm.rotation.set(driving?-.93:holding?-.28:mix(-.55,performanceHand?.bend??-.55,weight),
        side*(holding?.39:.21),mix(side*(driving?.08:.32),performanceHand?.roll??side*.32,weight));
      for(const finger of fingers)finger.rotation.x=driving||holding||holdingUmbrella?-1.07:mix(-.52,performanceHand?.curl??-.52,weight);
      const {pivot:itemPivot,show}=props[i];
      itemPivot.visible=holding;
      if(holding){
        itemPivot.position.copy(wrist);itemPivot.position.x-=side*.050*size;
        itemPivot.position.y+=.002*size;itemPivot.position.z-=.036*size;
        itemPivot.scale.setScalar(size*(spark?.76:.85));
        itemPivot.rotation.set(spark?.12:drink?-.76*use:.26*use,side*.09,.05*side);
      }
      show(item?.kind??null,serving?feedAge/1000:spark&&item.started?itemAge/1000:-1);
      if(seated){frame(knees[i].position,side*.44,-1.12,.89);knees[i].scale.set(.125*size,.094*size,.142*size);}
    }
    if(driving){
      frame(joint,0,-.83,.94);frame(tip,0,-1.23,.81);segment(stem,joint,tip,.026*size);
      for(const [i,{wrist}] of forearms.entries()){
        grips[i].position.copy(wrist);grips[i].rotation.z=Math.PI/2;grips[i].scale.set(.024*size,.11*size,.024*size);
        segment(bars[i],joint,wrist,.016*size);
      }
      bell.position.copy(forearms[0].wrist);bell.position.x+=.068*size;bell.position.y+=.028*size;
    }
  }

  function render(renderer,worldCamera,position,options){
    update(position,worldCamera,options);
    const autoClear=renderer.autoClear,info=renderer.info,autoReset=info?.autoReset;
    renderer.autoClear=false;
    if(info)info.autoReset=false;
    try{renderer.clearDepth();renderer.render(scene,camera);}
    finally{renderer.autoClear=autoClear;if(info)info.autoReset=autoReset;}
  }
  return {render};
}
