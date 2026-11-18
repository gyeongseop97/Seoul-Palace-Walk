import {FEED_MS,avatarHands,jumpLift} from "./activities.js";
import {isBikeDriver,isBikePassenger,isCycling} from "./sejong-bike.js";
import {CLINK_DURATION_MS} from "./social-events.js";
import {gestureHands,peaceHandParts} from "./avatar-gestures.js";
import {DINING_TRAY_WIDTH,diningGesture,makeDiningUtensil} from "./dining-dishes.js";
import {LOOK_OPTIONS,SKIN_TONES} from "./look-options.js";
import {moleSwing} from "./arcade-mole.js";

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
  const skinBase=skin.color.clone().convertLinearToSRGB();
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
    const mitten=oval(palm,skin,0,.019,.004,.045,.058,.031);
    const peaceHand=new T.Group();peaceHand.name="Peace sign";peaceHand.scale.setScalar(.53);peaceHand.visible=false;
    palm.add(peaceHand);
    for(const [,x,y,z,w,h,d,rotation] of peaceHandParts(side))oval(peaceHand,skin,x,y,z,w,h,d).rotation.z=rotation;
    return {side,palm,sleeve,lower,cuff,ribs,mitten,peaceHand,wrist:new T.Vector3(),elbow:new T.Vector3(),shoulder:new T.Vector3()};
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
  const trayPivot=new T.Group();trayPivot.name="First-person two-handed meal tray";scene.add(trayPivot);
  const showTray=createItemProp(trayPivot),utensil=makeDiningUtensil(T)(scene);
  utensil.group.name="First-person eating utensil";
  const mallet=new T.Group();mallet.name="First-person mole mallet";scene.add(mallet);
  const wood=matte(0xd5a471),malletTeal=matte(0x377d7e),caps=matte(0xd4a96f),grip=matte(0x343943);
  for(const [material,x,y,radius,length,crosswise] of [
    [wood,0,.083,.023,.25,false],[grip,0,.010,.028,.105,false],
    [malletTeal,0,.220,.056,.152,true],[caps,-.073,.220,.058,.023,true],[caps,.073,.220,.058,.023,true]
  ]){
    const part=make(mallet,tube,material);part.position.set(x,y,0);part.scale.set(radius,length,radius);
    if(crosswise)part.rotation.z=Math.PI/2;
  }
  const up=new T.Vector3(0,1,0),direction=new T.Vector3(),joint=new T.Vector3(),tip=new T.Vector3();
  const malletDirection=new T.Vector3(),malletPoint=new T.Vector3();
  const mealForward=new T.Vector3(),mealRight=new T.Vector3(),cameraRotation=new T.Quaternion();
  const utensilRotation=new T.Euler(0,0,0,"YXZ");
  let phase=0,stride=0,lookKey="";
  const sand=new T.Color(0xe1cab4);

  function segment(mesh,from,to,radius,overlap=.02){
    const length=direction.subVectors(to,from).length();
    mesh.position.copy(from).lerp(to,.5);
    mesh.quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/Math.max(.001,length)));
    mesh.scale.set(radius,length+overlap,radius);
  }

  function update(position,worldCamera,{now,clock,delta=1/60,seat,clink,night=0,mole=null}){
    if(camera.fov!==worldCamera.fov||camera.aspect!==worldCamera.aspect){
      camera.fov=worldCamera.fov;camera.aspect=worldCamera.aspect;camera.updateProjectionMatrix();
    }
    const viewHeight=Math.tan(camera.fov*Math.PI/360),viewWidth=viewHeight*camera.aspect;
    const size=clamp(Math.min(1,camera.aspect/.72)*viewHeight/.54,.59,1.17);
    const frame=(vector,x,y,depth)=>vector.set(x*viewWidth*depth,y*viewHeight*depth,-depth);
    ambient.intensity=2.12-.84*night;key.intensity=1.10-.48*night;
    const outfit=position.look?.outfit==="hoodie"?"puffer":position.look?.outfit??"coat";
    const tone=LOOK_OPTIONS.skin.includes(position.look?.skin)?position.look.skin:"light";
    const coat=position.coat??0xab5947,keyForLook=`${outfit}/${coat}/${tone}`;
    if(lookKey!==keyForLook){
      lookKey=keyForLook;
      fabric.color.set(coat).lerp(sand,.19);trim.color.copy(fabric.color).multiplyScalar(.76);
      fabric.roughness=outfit==="puffer"?.63:.86;
      trouser.color.set(({puffer:0x4d6787,tee:0xc7b089,hanbok:0xb9b295})[outfit]??0x3f4452);
      const [r,g,b]=SKIN_TONES[tone];
      skin.color.setRGB(Math.min(1,skinBase.r*r),Math.min(1,skinBase.g*g),Math.min(1,skinBase.b*b),T.SRGBColorSpace);
    }
    const riding=!seat&&isCycling(position),driving=riding&&isBikeDriver(position),passenger=riding&&isBikePassenger(position);
    const seated=Boolean(seat)||passenger;
    const walking=Boolean(position.stepping&&!seated&&!riding&&jumpLift(position,clock)<.06);
    const motion=walking?(position.blocked?.40:1):0;
    stride=mix(stride,motion,1-Math.exp(-delta*11));
    phase+=delta*(position.running?16:10.4);
    const hands=avatarHands(position,clock,{riding,seated,walking});
    const {claspSide,feedAge,petAge,petting,petSide,itemFor,feedingSide,tray}=hands;
    const carryingTray=Boolean(tray&&!seated&&!riding);
    const eating=diningGesture(tray,seat);
    let seeingMeal=false;
    if(eating){
      const angle=seat.heading*Math.PI/180;
      mealForward.set(Math.sin(angle),0,-Math.cos(angle));mealRight.set(Math.cos(angle),0,Math.sin(angle));
      seeingMeal=worldCamera.getWorldDirection(direction).dot(mealForward)>.12;
    }
    trayPivot.visible=carryingTray&&!mole;
    const trayScale=Math.min(.90,viewWidth*1.60*.92/DINING_TRAY_WIDTH);
    if(carryingTray){
      const bob=Math.sin(phase*2)*stride*.024;
      frame(trayPivot.position,0,-.72+bob,.94);trayPivot.rotation.y=Math.PI;trayPivot.scale.setScalar(trayScale);
    }
    showTray(carryingTray?tray.item.kind:null);
    utensil.show(seeingMeal&&!mole?eating.utensil:null);
    const cheersEvent=clink??position.clink,clinkAge=clock-cheersEvent?.startedAt;
    const clinkSide=cheersEvent?.slot==="secondItem"?-1:1;
    const cheers=itemFor(clinkSide)?.spec.verb==="마시기"&&!seated&&!claspSide&&clinkAge>=0&&clinkAge<CLINK_DURATION_MS
      ?ease(Math.min(clinkAge/280,(CLINK_DURATION_MS-clinkAge)/420)):0;
    let toastDirection=0;
    if(cheers&&Number.isFinite(cheersEvent.heading)){
      worldCamera.getWorldDirection(direction);
      toastDirection=Math.sin(cheersEvent.heading*Math.PI/180-Math.atan2(direction.x,-direction.z));
    }
    const performance=gestureHands(position,clock,hands,{riding,busy:Boolean(cheers||carryingTray||eating)});
    const {pose:acting,umbrellaSide}=performance;
    lap.visible=seated&&!mole;handlebar.visible=driving&&!mole;mallet.visible=Boolean(mole);
    for(const [i,arm] of forearms.entries()){
      const {side,palm,wrist,elbow,shoulder,sleeve,lower,cuff,ribs,mitten,peaceHand}=arm;
      palm.parent.visible=!mole||side===1;
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
      if(carryingTray){
        wrist.copy(trayPivot.position);
        wrist.x+=side*DINING_TRAY_WIDTH*.465*trayScale;
        wrist.y-=.010*trayScale;wrist.z+=.105*trayScale;
      }else if(seeingMeal){
        const active=side===1,lift=active?eating.lift:0;
        const tableHeight=seat.tray.height+(active?.098-eating.dip*.029:.037);
        const handHeight=mix(tableHeight,(seat.base??0)+1.10,lift);
        wrist.set(worldCamera.position.x,handHeight,worldCamera.position.z);
        wrist.addScaledVector(mealForward,mix(active?.323:.255,.225,lift))
          .addScaledVector(mealRight,side*(active?.123:.192));
        worldCamera.worldToLocal(wrist);
        if(active){
          utensil.group.position.copy(wrist);
          utensilRotation.set(mix(.18+eating.dip*.28,-.43,lift),Math.PI-seat.heading*Math.PI/180+mix(.45,2.87,lift),-.16);
          worldCamera.getWorldQuaternion(cameraRotation).invert();
          utensil.group.quaternion.setFromEuler(utensilRotation).premultiply(cameraRotation);
        }
      }
      if(mole&&side===1){
        const swing=moleSwing(clock,mole.swingAt),strike=Math.max(0,swing);
        frame(shoulder,1.14,-1.30,.53);
        frame(elbow,.93,-.97,.68);
        frame(wrist,.71,-.59+Math.min(0,swing)*.52,.78);
        malletDirection.set(.21*(1-strike),.94-.66*strike,-.26-.67*strike).normalize();
        if(strike&&mole.point){
          malletPoint.copy(mole.point).project(worldCamera);
          frame(malletPoint,malletPoint.x,malletPoint.y,.99);
          // Aim with the striking cap on the forward end of the head.
          wrist.lerp(malletPoint.addScaledVector(malletDirection,-.220*size),strike);
        }
        mallet.position.copy(wrist);mallet.scale.setScalar(size);
        mallet.quaternion.setFromUnitVectors(up,malletDirection);
        mallet.rotateY(Math.PI/2);
      }
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
      if(carryingTray)palm.rotation.set(-.81,side*.19,side*.46);
      else if(seeingMeal&&side===1)palm.rotation.set(-.80,-.34,.32);
      if(mole&&side===1)palm.rotation.set(-.40,-.18,.20);
      peaceHand.visible=!mole&&acting?.kind==="peace"&&weight>.26;
      mitten.visible=!peaceHand.visible;
      const gripping=mole||driving||holding||holdingUmbrella||carryingTray||seeingMeal&&side===1;
      mitten.scale.y=gripping?.042:mix(.058,performanceHand?.curl<-.8?.043:.058,weight);
      const {pivot:itemPivot,show}=props[i];
      itemPivot.visible=holding&&!mole;
      if(holding){
        itemPivot.position.copy(wrist);itemPivot.position.x-=side*(spec.snack?.035:.050)*size;
        itemPivot.position.y+=(spec.snack?.022:.002)*size;itemPivot.position.z-=(spec.snack?.023:.036)*size;
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
