import {addLandmarks,addObstacle} from "./layout.js";
import {BUNGEO_GOOD_MS,BUNGEO_MOLD_COUNT,BUNGEO_STALL,bungeoStep} from "./bungeo-data.js";
import {bungeoppangOutline,makeBungeoppangProps} from "./regional-item-props.js";
import {standSign} from "./regional-stands.js";

const cartWidth=2.62,cartDepth=1.10;
const openAngle=1.97;
const removalDuration=360;
const clamp=value=>Math.min(1,Math.max(0,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};

export function registerBungeoStall(){
  const {body,angle}=BUNGEO_STALL;
  addObstacle(body.x,body.y,cartWidth,cartDepth,angle,2.25);
  addLandmarks([BUNGEO_STALL]);
}

export function addBungeoStall(T,parent,kit,groundHeight){
  const {wx,wz,box,cylinder,shape}=kit;
  const {body,angle,watchRadius}=BUNGEO_STALL;
  const root=new T.Group();root.name=BUNGEO_STALL.name;
  const foot=.021;
  root.position.set(wx(body.x),groundHeight(body)+foot,wz(body.y));
  root.rotation.y=angle;parent.add(root);
  const wood=0x845132,rail=0x4d3530,iron=0x363337,shade=0xa64237,ivory=0xf5d69f;
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
  standSign(T,root,"붕어빵","직접 굽기",1.52,0,1.918,.517,"#973c30","#ffe6b7",.365);
  standSign(T,root,"팥 붕어빵",null,.75,-.75,.66,.537,"#edcf9b","#6f332a",.168);
  for(const x of [-.988,.988]){
    box(0x523a31,x,1.96,.396,.21,.051,.21,root);
    cylinder(0xffcc78,x,1.918,.396,.081,.054,10,root);
  }

  function pan(x,z,inside){
    cylinder(0x769192,x,1.062,z,.163,.071,16,root,1.19);
    cylinder(0x9daaaa,x,1.111,z,.167,.028,16,root);
    cylinder(inside,x,1.127,z,.145,.010,16,root);
  }
  pan(-1.064,.115,0xf6dba3);pan(-1.064,-.212,0x713a2e);
  box(0xacb9ad,-.985,1.198,.131,.021,.20,.021,root).rotation.z=-.52;
  const bags=box(0xe4bd83,.947,1.061,-.325,.36,.068,.23,root);bags.rotation.y=.10;
  for(let i=0;i<3;i++)box(0xebcb96,.947-i*.016,1.102+i*.009,-.327+i*.009,.33,.009,.205,root).rotation.y=.10+i*.042;
  for(const x of [.79,.91]){
    box(0x524f43,x,1.04,.431,.029,.042,.212,root).rotation.y=(x-.85)*1.14;
    cylinder(0x33372f,x,1.07,.515,.023,.032,8,root);
  }
  const tray=new T.Group();tray.name="완성된 붕어빵 쟁반";tray.position.set(.934,1.029,.058);root.add(tray);
  box(0xb6925c,0,.008,0,.627,.026,.395,tray);
  box(0xf3dba8,0,.027,0,.566,.012,.335,tray);
  for(const x of [-.305,.305])box(0xa27849,x,.036,0,.027,.054,.39,tray);
  for(const z of [-.189,.189])box(0xa27849,0,.036,z,.583,.054,.027,tray);

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
  const stockPies=Array.from({length:3},(_,index)=>{
    const fish=new T.Group();fish.name="쟁반의 붕어빵 "+(index+1);
    fish.position.set((index-1)*.178,.046,0);fish.rotation.y=-Math.PI/2+(index-1)*.11;
    fish.scale.setScalar(.92);fish.visible=false;tray.add(fish);pastryProps(fish,"good");
    fish.traverse(object=>{if(object.isMesh)object.userData.dynamic=true;});
    return fish;
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
      const step=bungeoStep(mold,clock),active=step.action!=="pour",first=step.action==="flip";
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
      const rocking=first?0:Math.sin(clamp(age/690)*Math.PI);
      const opening=!active?1:first?1-ease((age-160)/535):Math.max(reveal,rocking*.78);
      hinge.rotation.x=-openAngle*opening;
      dough.visible=active&&first&&opening>.16;
      pour.visible=dough.visible&&age<220;
      const pourHeight=.18*(1-clamp(age/245));
      pour.position.y=.202+pourHeight*.5;pour.scale.y=pourHeight;
      const visibleQuality=active&&!first&&opening>.19?step.quality:removal?.quality;
      for(const [quality,group] of Object.entries(pastries)){
        group.visible=quality===visibleQuality;
        if(!group.visible)continue;
        group.position.set(0,.205+rocking*.099+lift*.32,-.030+lift*.32);
        group.scale.setScalar(fishSize*.96*(1-lift*.65));
        group.rotation.x=rocking*Math.PI*.71-lift*.53;
      }
      const hot=active&&step.quality==="burnt";
      const ready=active&&step.waitMs===0&&!hot;
      const indicator=hot?0xe96b46:ready?0x9cda82:active?0xf7b34d:0x77735e;
      lamp.material.color.setHex(indicator);lamp.material.emissive.setHex(indicator);
      lamp.material.emissiveIntensity=active?.67:.12;
      steam.forEach((puff,i)=>{
        puff.visible=nearby&&active&&age>260;
        if(!puff.visible)return;
        const t=(age/1090+i/steam.length)%1;
        puff.position.set((i-.5)*.084+t*.088,.268+t*.60,.05+Math.sin(t*2.6+i)*.063);
        puff.scale.setScalar(.079+t*.19);
        puff.material.opacity=Math.sin(t*Math.PI)*(hot?.50:.30);
      });
    };
  }

  const cavities=Array.from({length:BUNGEO_MOLD_COUNT},(_,index)=>addCavity(index));
  function update(molds,clock,viewer,stock=0){
    stockPies.forEach((fish,index)=>{fish.visible=index<stock;});
    const nearby=Boolean(viewer&&Math.hypot(viewer.x-body.x,viewer.y-body.y)<=watchRadius);
    cavities.forEach((updateCavity,index)=>updateCavity(molds?.[index]??null,clock,nearby));
  }

  update(null,0,null);
  return {update};
}
