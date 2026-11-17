import {addLandmarks,addObstacle} from "./layout.js";
import {BUNGEO_GOOD_MS,BUNGEO_MOLD_COUNT,BUNGEO_STALL,BUNGEO_STOCK_CAPACITY,COOKING_STALLS,bungeoStep} from "./bungeo-data.js";
import {bungeoppangOutline,makeBungeoppangProps} from "./regional-item-props.js";
import {standSign} from "./regional-stands.js";
import {addHotteokGriddle} from "./hotteok-griddle.js";

const cartWidth=2.62,cartDepth=1.10;
const openAngle=1.97;
const removalDuration=360;
const clamp=value=>Math.min(1,Math.max(0,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};

export function registerBungeoStall(){
  for(const {body,angle} of COOKING_STALLS)addObstacle(body.x,body.y,cartWidth,cartDepth,angle,2.25);
  addLandmarks(COOKING_STALLS);
}

export function addBungeoStall(T,parent,kit,groundHeight,stall=BUNGEO_STALL){
  const {wx,wz,box,cylinder,shape}=kit;
  const {body,angle,watchRadius}=stall,hotteok=stall.kind==="hotteok";
  const root=new T.Group();root.name=stall.name;
  const foot=.021;
  root.position.set(wx(body.x),groundHeight(body)+foot,wz(body.y));
  root.rotation.y=angle;parent.add(root);
  const wood=0x845132,rail=0x4d3530,iron=0x363337,shade=hotteok?0x506d55:0xa64237,ivory=0xf5d69f;
  box(wood,0,.540,0,2.47,.76,1.00,root);
  box(rail,0,.179,.008,2.51,.127,1.05,root);
  box(0xc49459,0,.965,.006,cartWidth,.115,cartDepth,root).receiveShadow=true;
  box(0x634031,0,.892,.559,2.55,.080,.057,root);
  for(let i=0;i<11;i++){
    const x=(i-5)*.214;
    box(i%2===0?0x9b5738:0xa6613e,x,.527,.511,.198,.58,.035,root);
  }
  box(rail,0,.240,.542,2.42,.075,.064,root);
  for(const x of [-1.205,1.205]){
    for(const z of [-.42,.42]){
      box(rail,x,.110,z,.135,.224,.137,root);
      box(0x5a4840,x,1.586,z,.099,1.19,.093,root);
    }
    box(wood,x,2.156,.0,.125,.092,.99,root);
  }
  box(wood,0,2.17,.425,2.64,.092,.110,root);
  box(wood,0,2.17,-.45,2.64,.092,.110,root);
  for(let k=0;k<9;k++){
    const strip=new T.BufferGeometry(),vertices=[],index=[];
    const left=-1.41+k*.313,right=left+.318;
    for(let row=0;row<=6;row++){
      const fraction=row/6,z=-.62+fraction*1.27,y=2.207+Math.sin(fraction*Math.PI)*.16-fraction*.025;
      vertices.push(left,y,z,right,y,z);
      if(row<6){const i=row*2;index.push(i,i+2,i+1,i+1,i+2,i+3);}
    }
    strip.setAttribute("position",new T.Float32BufferAttribute(vertices,3));strip.setIndex(index);strip.computeVertexNormals();
    const color=k%2?shade:ivory;
    const fabric=shape(strip,color,0,0,0,root);
    fabric.material=new T.MeshStandardMaterial({color,roughness:.92,side:T.DoubleSide});fabric.castShadow=true;
    box(color,(left+right)/2,2.124,.647,.318,.124,.028,root);
  }
  box(shade,0,1.918,.47,1.58,.39,.081,root);
  standSign(T,root,hotteok?"호떡":"붕어빵","직접 굽기",1.52,0,1.918,.517,hotteok?"#3d654f":"#973c30","#ffe6b7",.365);
  standSign(T,root,hotteok?"철판에 굽기":"팥 · 슈크림",null,.75,-.75,.66,.537,"#edcf9b","#6f332a",.168);
  for(const x of [-.988,.988]){
    box(0x523a31,x,1.96,.396,.21,.051,.21,root);
    cylinder(0xffcc78,x,1.918,.396,.081,.054,10,root);
  }

  const targets=[],toolLights=new Map();
  const proxyMaterial=new T.MeshBasicMaterial();
  function hit(parent,key,x,y,z,width,height,depth){
    const proxy=new T.Mesh(new T.BoxGeometry(width,height,depth),proxyMaterial);
    proxy.position.set(x,y,z);proxy.userData.bungeoTarget=key;proxy.visible=false;
    parent.add(proxy);targets.push(proxy);
    return proxy;
  }
  function counterLabel(text,x,z,color,y=1.025){
    const before=root.children.length;
    standSign(T,root,text,null,.17,x,y,z,color,"#fff3d7",.061);
    if(root.children.length>before)root.children.at(-1).rotation.x=-Math.PI/2;
  }
  const lightGeometry=new T.TorusGeometry(.131,.009,6,24).rotateX(-Math.PI/2);
  const toolLightMaterial=new T.MeshBasicMaterial({color:0xffd36f,toneMapped:false});
  function highlight(tool,x,z){
    const light=new T.Mesh(lightGeometry,toolLightMaterial);
    light.position.set(x,1.026,z);light.visible=false;root.add(light);toolLights.set(tool,light);
  }
  const targetCenter=new T.Vector3();
  function pick(ray){
    root.updateWorldMatrix(true,true);
    let target=null,best=Infinity;
    // At a shallow angle, use the target nearest the centre of the touch ray.
    for(const {object} of ray.intersectObjects(targets,false)){
      const offset=ray.ray.distanceSqToPoint(object.getWorldPosition(targetCenter));
      if(offset<best){best=offset;target=object.userData.bungeoTarget;}
    }
    return target;
  }
  if(hotteok){
    const grill=addHotteokGriddle(T,root,kit,{hit,highlight,counterLabel,watchRadius,body});
    function update(molds,clock,viewer,_stock,baking){
      for(const [tool,light] of toolLights)light.visible=baking?.tool===tool;
      grill.update(molds,clock,viewer,baking);
    }
    update(null,0,null);
    return {update,pick};
  }
  const pitcherX=-1.185,pitcherZ=.291;
  const pitcherProfile=[[0,.025],[.090,.025],[.114,.07],[.117,.182],[.103,.254],
    [.093,.279],[.083,.279],[.088,.249],[.096,.180],[.091,.084],[0,.051]];
  const pitcher=new T.Group();pitcher.name="반죽 주전자";pitcher.position.set(pitcherX,1.024,pitcherZ);root.add(pitcher);
  shape(new T.LatheGeometry(pitcherProfile.map(([r,y])=>new T.Vector2(r,y)),24),0x90c7bd,0,0,0,pitcher);
  cylinder(0xf9dfac,0,.218,0,.087,.012,20,pitcher);
  shape(new T.TorusGeometry(.070,.018,7,16),0x7cb7ab,0,.16,-.119,pitcher).rotation.y=Math.PI/2;
  cylinder(0x9ed4c7,0,.255,.097,.044,.082,12,pitcher,1.2).rotation.x=Math.PI*.37;
  box(0x609f95,0,.062,.077,.157,.024,.085,pitcher);
  pitcher.traverse(object=>{if(object.isMesh)object.userData.dynamic=true;});
  counterLabel("반죽",pitcherX,.482,"#346c66");highlight("batter",pitcherX,pitcherZ);
  const pitcherHit=hit(root,{tool:"batter"},pitcherX,1.16,pitcherZ,.28,.33,.27);

  const fillingProfile=[[0,.009],[.058,.009],[.094,.034],[.118,.083],[.116,.103],
    [.104,.103],[.103,.086],[.083,.047],[.056,.027],[0,.021]];
  const bowlGeometry=new T.LatheGeometry(fillingProfile.map(([r,y])=>new T.Vector2(r,y)),20);
  const beanGeometry=new T.SphereGeometry(1,8,5);
  const fillingColors={redBean:0x743531,custard:0xffce70};
  for(const [tool,label,z,bodyColor,labelColor] of [["redBean","팥",-.042,0xa85e61,"#843b4d"],
    ["custard","슈크림",-.338,0xefd59a,"#795423"]]){
    const x=-1.052,bowl=new T.Group();bowl.name=label+" 그릇";bowl.position.set(x,1.024,z);root.add(bowl);
    shape(bowlGeometry,bodyColor,0,0,0,bowl);
    cylinder(fillingColors[tool],0,.080,0,.101,.024,18,bowl);
    if(tool==="redBean")for(let i=0;i<9;i++){
      const angle=i*2.399,radius=Math.sqrt((i+1)/10)*.079;
      shape(beanGeometry,i%3?0x6d2a2a:0x93514a,Math.cos(angle)*radius,.097,Math.sin(angle)*radius,bowl).scale.set(.012,.006,.008);
    }else{
      const curl=new T.TorusGeometry(.039,.008,5,18,Math.PI*1.7).rotateX(-Math.PI/2);
      shape(curl,0xffe6a0,-.015,.095,.009,bowl);
    }
    shape(beanGeometry,0xbabcb1,.039,.102,.008,bowl).scale.set(.025,.010,.044);
    box(0x776454,.069,.141,-.057,.018,.125,.017,bowl).rotation.x=.68;
    counterLabel(label,x,z+.144,labelColor);highlight(tool,x,z);
    // Keep bowl targets close to the rims so the foreground one can't mask the custard at a shallow angle.
    hit(root,{tool},x,1.084,z,.244,.128,.248);
  }

  const tray=new T.Group();tray.name="완성된 붕어빵 쟁반";tray.position.set(.938,1.029,.029);root.add(tray);
  for(const [height,depth] of [[0,.141],[.184,-.239]]){
    box(0xb6925c,0,height+.008,depth,.627,.030,.356,tray);
    box(0xf3dba8,0,height+.028,depth,.568,.012,.306,tray);
    for(const x of [-.305,.305])box(0xa27849,x,height+.035,depth,.027,.048,.349,tray);
    for(const z of [depth-.166,depth+.166])box(0xa27849,0,height+.035,z,.583,.048,.023,tray);
  }
  for(const x of [-.28,.28])for(const z of [-.369,-.110])box(0x9c7246,x,.096,z,.041,.191,.041,tray);

  const work=new T.Group();work.name="붕어빵 틀";work.position.set(-.127,1.019,.003);root.add(work);
  box(0x7f8580,0,.056,0,1.45,.111,.739,work);
  box(iron,0,.092,.355,1.415,.145,.041,work);
  box(0x302e2d,0,.106,-.035,1.405,.056,.67,work);

  // One engraved plate geometry is shared by all three lids and bases.
  const fishSize=1.68;
  const plateOutline=new T.Shape([[-.216,-.233],[.216,-.233],[.216,.233],[-.216,.233]].map(p=>new T.Vector2(...p)));
  plateOutline.holes.push(bungeoppangOutline(T,fishSize));
  const plateGeometry=new T.ExtrudeGeometry(plateOutline,{depth:.043,bevelEnabled:false,curveSegments:6}).rotateX(-Math.PI/2);
  const recessGeometry=new T.ShapeGeometry(bungeoppangOutline(T,fishSize),7).rotateX(-Math.PI/2);
  const ring=new T.TorusGeometry(.014,.0034,5,10).rotateX(-Math.PI/2);
  function plate(parent,y,z,flipped=false){
    const face=new T.Group();face.position.set(0,y,z);if(flipped)face.scale.y=-1;parent.add(face);
    box(0x2d2a28,0,-.012,0,.446,.033,.483,face);
    shape(plateGeometry,0x545358,0,0,0,face);
    shape(recessGeometry,0x302d2c,0,.006,0,face);
    shape(ring,0x4c4640,.106,.007,-.019,face);
    for(const z of [-.047,.016,.061])box(0x4c4640,-.121,.007,z,.073,.005,.005,face).rotation.y=z*5;
    box(0x474446,0,.022,.254,.057,.033,.102,face);
    box(0x985c39,0,.022,.322,.076,.047,.124,face);
  }
  const pastryProps=makeBungeoppangProps(T,kit);
  // One instance batch per pastry part keeps twelve visible pieces inexpensive.
  const stockPrototype=new T.Group(),stockParts=new Map(),stockPose=new T.Object3D(),stockMatrix=new T.Matrix4();
  if(stall.customer)pastryProps(stockPrototype,"good");
  stockPrototype.updateMatrixWorld(true);
  stockPrototype.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const id=`${mesh.geometry.id}/${mesh.material.id}`;
    if(!stockParts.has(id))stockParts.set(id,[]);
    stockParts.get(id).push(mesh);
  });
  const stockPies=[...stockParts.values()].map(parts=>{
    const {geometry,material}=parts[0],instances=new T.InstancedMesh(geometry,material,BUNGEO_STOCK_CAPACITY*parts.length);
    instances.name="쟁반의 붕어빵";instances.userData.dynamic=true;instances.frustumCulled=false;tray.add(instances);
    for(let index=0;index<BUNGEO_STOCK_CAPACITY;index++){
      const top=index>=6,row=Math.floor(index%6/3),column=index%3;
      stockPose.position.set((column-1)*.182,top?.230:.046,(top?-.239:.141)+(row-.5)*.154);
      stockPose.rotation.y=-Math.PI/2+(column-1)*.09;stockPose.scale.setScalar(.66);stockPose.updateMatrix();
      parts.forEach((part,i)=>instances.setMatrixAt(index*parts.length+i,stockMatrix.multiplyMatrices(stockPose.matrix,part.matrixWorld)));
    }
    instances.instanceMatrix.needsUpdate=true;
    return {instances,perPastry:parts.length};
  });
  function steamMap(){
    if(typeof document==="undefined")return null;
    const canvas=document.createElement("canvas");canvas.width=canvas.height=32;
    const ctx=canvas.getContext("2d");
    if(!ctx)return null;
    const gradient=ctx.createRadialGradient(16,16,1,16,16,16);
    gradient.addColorStop(0,"#fbefdbb0");gradient.addColorStop(1,"#fbefdb00");
    ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
    return new T.CanvasTexture(canvas);
  }
  const vaporMap=steamMap();

  function placeNumber(parent,number){
    if(typeof document==="undefined")return;
    const canvas=document.createElement("canvas");canvas.width=canvas.height=64;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    ctx.fillStyle="#383335";ctx.fillRect(0,0,64,64);
    ctx.lineWidth=2;ctx.strokeStyle="#d3b477";ctx.strokeRect(3,3,58,58);
    ctx.fillStyle="#fff1cd";ctx.font="bold 45px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(String(number),32,34);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const tag=new T.Mesh(new T.PlaneGeometry(.088,.088),new T.MeshBasicMaterial({map}));
    tag.position.set(-.112,.096,.379);parent.add(tag);
  }

  function addCavity(index){
    const bay=new T.Group();bay.name=`${index+1}번 붕어빵 틀`;
    bay.position.x=(index-(BUNGEO_MOLD_COUNT-1)/2)*.477;work.add(bay);
    hit(bay,{cavity:index},0,.203,.021,.455,.163,.70);
    hit(bay,{cavity:index},0,.428,-.268,.455,.374,.22);
    const hinge=new T.Group();hinge.name="주물 틀 뚜껑";hinge.position.set(0,.248,-.260);bay.add(hinge);
    plate(bay,.157,-.030);plate(hinge,0,.230,true);
    cylinder(0x6b6256,.006,.209,-.265,.036,.439,10,bay).rotation.z=Math.PI/2;
    hinge.traverse(object=>{if(object.isMesh)object.userData.dynamic=true;});

    placeNumber(bay,index+1);
    const lamp=cylinder(0xffffff,.108,.096,.385,.025,.017,10,bay);
    lamp.name="철판 상태등";lamp.rotation.x=Math.PI/2;lamp.userData.dynamic=true;
    lamp.material=new T.MeshStandardMaterial({color:0x77735e,emissive:0x77735e,emissiveIntensity:.12,roughness:.48});
    const knob=cylinder(iron,.177,.096,.391,.024,.035,10,bay);knob.rotation.x=Math.PI/2;
    const dough=shape(recessGeometry,0xffd8a1,0,.201,-.030,bay);
    dough.name="붕어빵 반죽";dough.scale.set(.94,1,.92);dough.userData.dynamic=true;
    const pour=cylinder(0xf2cd94,0,.35,-.030,.021,.18,9,bay,1.30);
    pour.userData.dynamic=true;
    const paste=shape(beanGeometry,0x743531,.018,.207,-.034,bay);paste.name="붕어빵 속";
    paste.material=new T.MeshStandardMaterial({color:0x743531,roughness:.69});paste.userData.dynamic=true;
    const drop=shape(beanGeometry,0x743531,.018,.292,-.034,bay);drop.name="떨어지는 붕어빵 속";
    drop.material=paste.material;drop.userData.dynamic=true;
    const pastries=Object.fromEntries(["good","torn","burnt"].map(quality=>{
      const group=new T.Group();group.name=quality+" 붕어빵";group.visible=false;bay.add(group);pastryProps(group,quality);
      group.traverse(object=>{if(object.isMesh)object.userData.dynamic=true;});
      return [quality,group];
    }));
    const steam=vaporMap?Array.from({length:2},()=>{
      const sprite=new T.Sprite(new T.SpriteMaterial({map:vaporMap,color:0xffffff,depthWrite:false,opacity:0}));
      sprite.visible=false;bay.add(sprite);return sprite;
    }):[];

    let previous=null,removal=null;
    return (mold,clock,nearby)=>{
      const step=bungeoStep(mold,clock),active=step.action!=="pour",needsFilling=step.action==="fill",first=step.action==="flip";
      if(!nearby||active)removal=null;
      else if(!mold&&previous?.stage==="second"){
        const removed=bungeoStep(previous,clock);
        if(removed.action==="take")removal={quality:removed.quality,at:clock};
      }
      previous=nearby?mold:null;
      if(removal&&clock-removal.at>=removalDuration)removal=null;
      const lift=removal?ease((clock-removal.at)/removalDuration):0;
      const age=active?Math.max(0,clock-(mold.flippedAt??mold.pouredAt)):0;
      const reveal=ease((age-BUNGEO_GOOD_MS+280)/360);
      const rocking=first||needsFilling?0:Math.sin(clamp(age/690)*Math.PI);
      const opening=!active||needsFilling?1:first?1-ease((age-210)/535):Math.max(reveal,rocking*.78);
      hinge.rotation.x=-openAngle*opening;
      dough.visible=active&&(first||needsFilling)&&opening>.16;
      pour.visible=needsFilling&&age<245;
      const pourHeight=.18*(1-clamp(age/245));
      pour.position.y=.202+pourHeight*.5;pour.scale.y=pourHeight;
      paste.visible=first&&dough.visible&&age>=155;
      drop.visible=first&&dough.visible&&age<155;
      if(paste.visible||drop.visible){
        paste.material.color.setHex(fillingColors[mold.filling]??fillingColors.redBean);
        const swell=ease((age-155)/185),dropProgress=ease(age/155);
        paste.scale.set(.033+swell*.025,.012+swell*.028,.028+swell*.011);
        drop.position.y=.403-dropProgress*.179;drop.scale.set(.028,.035,.023);
      }
      const visibleQuality=active&&!first&&!needsFilling&&opening>.19?step.quality:removal?.quality;
      for(const [quality,group] of Object.entries(pastries)){
        group.visible=quality===visibleQuality;
        if(!group.visible)continue;
        group.position.set(0,.205+rocking*.099+lift*.32,-.030+lift*.32);
        group.scale.setScalar(fishSize*.96*(1-lift*.65));
        group.rotation.x=rocking*Math.PI*.71-lift*.53;
      }
      const hot=active&&step.quality==="burnt";
      const ready=active&&step.waitMs===0&&!hot&&!needsFilling;
      const indicator=hot?0xe96b46:ready?0x9cda82:needsFilling?0xffe2ae:active?0xf7b34d:0x77735e;
      lamp.material.color.setHex(indicator);lamp.material.emissive.setHex(indicator);
      lamp.material.emissiveIntensity=active?.67:.12;
      steam.forEach((puff,i)=>{
        puff.visible=nearby&&active&&!needsFilling&&age>260;
        if(!puff.visible)return;
        const t=(age/1090+i/steam.length)%1;
        puff.position.set((i-.5)*.084+t*.088,.268+t*.60,.05+Math.sin(t*2.6+i)*.063);
        puff.scale.setScalar(.079+t*.19);
        puff.material.opacity=Math.sin(t*Math.PI)*(hot?.50:.30);
      });
    };
  }

  const cavities=Array.from({length:BUNGEO_MOLD_COUNT},(_,index)=>addCavity(index));
  let lastClock=0,pitcherLift=0;
  function update(molds,clock,viewer,stock=0,baking=null){
    const stocked=Math.max(0,Math.min(BUNGEO_STOCK_CAPACITY,stock));
    for(const {instances,perPastry} of stockPies){instances.count=stocked*perPastry;instances.visible=stocked>0;}
    for(const [tool,light] of toolLights)light.visible=baking?.tool===tool;
    const pickingUp=baking?.tool==="batter"?1:0,elapsed=Math.max(0,Math.min(64,clock-lastClock));
    pitcherLift+=(pickingUp-pitcherLift)*(1-Math.exp(-elapsed*.024));
    lastClock=clock;
    pitcher.position.y=1.024+.17*pitcherLift;pitcher.position.z=pitcherZ+.032*pitcherLift;
    pitcher.rotation.z=-.18*pitcherLift;pitcherHit.position.y=1.16+.17*pitcherLift;pitcherHit.position.z=pitcher.position.z;
    const nearby=Boolean(viewer&&Math.hypot(viewer.x-body.x,viewer.y-body.y)<=watchRadius);
    cavities.forEach((updateCavity,index)=>updateCavity(molds?.[index]??null,clock,nearby));
  }

  update(null,0,null);
  return {update,pick};
}
