import {ARCADE_BASKET,ARCADE_CLAW,ARCADE_MOLE,ARCADE_PADS,ARCADE_PUMP,ARCADE_SITE,ARCADE_STAIRS} from "./arcade-layout.js";
import {BASKET_BALL,BASKET_HOOP,CLAW_CHUTE,CLAW_LIMITS,CLAW_PRIZES,basketTrajectory} from "./arcade-games.js";
import {BASKET_BACKBOARD,BASKET_BACKING,BASKET_RAMP} from "./arcade-basket-physics.js";
import {standSign} from "./regional-stands.js";
import {drawPumpTrack} from "./arcade-pump-track.js";
import {addBowlingLane} from "./arcade-bowling-world.js";
import {MOLE_BOARD,MOLE_HOLES,MOLE_HOLE_RADIUS,MOLE_WHACK_MS} from "./arcade-mole.js";
import {addArcadeStairwell} from "./arcade-stairs-world.js";

const ink=0x202c33,cream=0xf2d5ab,teal=0x458f84,orange=0xd5835e;
const padColors=[0x68c8d8,0xf0bc6e,0xef89a9,0x9ed0a3];
const plushColors={
  bear:[0xc49357,0xb47756,0xe3bb7c],rabbit:[0xddafc9,0xb49cd7,0xe9d5ca],cat:[0xa9a7d4,0xd69262,0x8da9bf],
  duck:[0xf6ce68,0xeaa85f,0xffdc8b],panda:[0xe4ded4,0xd2cbd6,0xdadeda],star:[0xf9d783,0xefadad,0x90c9bc],
  frog:[0x9cc487,0x78b395,0xb2cc71],penguin:[0x647889,0x8682a6,0x6397a5]
};
const plushPreview=CLAW_PRIZES.map(prize=>({...prize,available:true}));

export function* buildArcadeInterior(T,parent,kit){
  const {wx,wz,box,cylinder,shape}=kit;
  const arcade=new T.Group();arcade.name=ARCADE_SITE.name;
  arcade.position.set(wx(ARCADE_SITE.center.x),0,wz(ARCADE_SITE.center.y));
  arcade.rotation.y=ARCADE_SITE.insideAngle;parent.add(arcade);
  const {insideWidth:width,insideDepth:depth}=ARCADE_SITE;
  const sphere=new T.SphereGeometry(1,16,12),thinPipe=new T.CylinderGeometry(1,1,1,8),vertical=new T.Vector3(0,1,0);
  const torus=(r,t)=>new T.TorusGeometry(r,t,6,24);
  const meshMaterial=(color,{opacity=1,emissive=0,metalness=0}={})=>new T.MeshStandardMaterial({color,
    emissive,emissiveIntensity:emissive?.58:0,roughness:opacity<1?.12:.56,metalness,
    transparent:opacity<1,opacity,depthWrite:opacity===1});
  function group(x,y,z,base=arcade){const g=new T.Group();g.position.set(x,y,z);base.add(g);return g;}
  function block(color,x,y,z,w,h,d,base=arcade){return box(color,x,y,z,w,h,d,base);}
  function oval(color,x,y,z,w,h,d,base=arcade){
    const model=shape(sphere,color,x,y,z,base);model.scale.set(w,h,d);return model;
  }
  function beam(color,from,to,r,base){
    const a=new T.Vector3(...from),b=new T.Vector3(...to),v=b.clone().sub(a),mid=a.addScaledVector(v,.5);
    const mesh=shape(thinPipe,color,mid.x,mid.y,mid.z,base);mesh.scale.set(r,v.length(),r);
    mesh.quaternion.setFromUnitVectors(vertical,v.normalize());return mesh;
  }
  function dynamic(base){base.traverse(node=>{if(node.isMesh)node.userData.dynamic=true;});}
  function panel(base,title,subtitle,w,x,y,z,dark="#1c373a",height=.34){
    standSign(T,base,title,subtitle,w,x,y,z,dark,"#f9dfb1",height);
  }
  function glow(x,y,z,w,h,d,color,base=arcade){
    const mesh=block(color,x,y,z,w,h,d,base);mesh.material=meshMaterial(color,{emissive:color});return mesh;
  }
  function window(base,x,y,z,w,h,d){
    const glass=block(0x93c8cd,x,y,z,w,h,d,base);
    glass.material=meshMaterial(0x94c5ce,{opacity:.11,metalness:.22});glass.renderOrder=3;
    return glass;
  }
  function screenSurface(base,w,h,x,y,z){
    block(0x101a1b,x,y,z-.04,w+.12,h+.11,.10,base);
    if(typeof document==="undefined")return null;
    const canvas=document.createElement("canvas");canvas.width=256;canvas.height=128;
    const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)return null;
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const surface=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,toneMapped:false}));
    surface.position.set(x,y,z+.016);base.add(surface);
    return {ctx,map};
  }
  function screen(base,w,h,x,y,z,label){
    const display=screenSurface(base,w,h,x,y,z);
    if(!display)return ()=>{};
    const {ctx,map}=display;
    let previous="";
    return (text,sub="",color="#9de4c0")=>{
      const key=text+"/"+sub+"/"+color;if(previous===key)return;previous=key;
      ctx.fillStyle="#17252c";ctx.fillRect(0,0,256,128);
      ctx.fillStyle="#223942";
      for(let py=1;py<128;py+=4)ctx.fillRect(0,py,256,1);
      ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.font='bold 19px "Malgun Gothic", sans-serif';ctx.fillText(label,128,19,241);
      ctx.font='bold 42px "Malgun Gothic", sans-serif';ctx.fillText(text,128,63,239);
      ctx.fillStyle="#f4d6ad";ctx.font='bold 16px "Malgun Gothic", sans-serif';ctx.fillText(sub,128,107,240);
      map.needsUpdate=true;
    };
  }

  block(0x565758,0,-.022,0,width,.044,depth,arcade);
  block(0x40515a,0,2.04,-depth/2,width,4.18,.17,arcade);
  block(0x344651,0,1.99,depth/2,width,4.0,.17,arcade);
  for(const side of [-1,1]){
    block(0x415963,side*(width/2-.05),1.98,0,.17,3.99,depth,arcade);
    block(0x32484d,side*(width/2-.17),1.95,depth/2-.10,.32,3.90,.34,arcade);
    glow(side*(width/2-.36),1.87,depth/2-.08,.055,3.47,.052,side>0?orange:teal);
    for(let i=0;i<24;i++)block(i%2?0x526a6a:0x4f6367,side*(width/2-.19),1.24,-6.62+i*.57,.038,2.22,.52,arcade);
  }
  for(let i=0;i<26;i++){
    const x=(i-12.5)*.77;
    block(i%2?0x384f58:0x3d555d,x,1.87,-depth/2+.11,.70,3.48,.05,arcade);
    block(i%2?0x62676a:0x536168,x,.016,5.76,.71,.018,.59,arcade);
  }
  block(0x394f56,0,4.07,-.10,width+.36,.22,depth+.37,arcade);
  const entry=group(-.82,0,depth/2-.16);entry.rotation.y=Math.PI;
  block(ink,0,1.42,0,2.61,2.78,.10,entry);
  for(const side of [-1,1]){
    block(0x435f68,side*.62,1.42,.06,1.13,2.58,.08,entry);
    block(0x6a9396,side*.62,1.71,.111,.94,1.6,.025,entry);
    block(cream,side*.2,1.25,.155,.065,.32,.073,entry);
  }
  panel(entry,"출구","",.83,0,3.09,.06,"#245849",.32);
  for(const stairs of ARCADE_STAIRS[ARCADE_SITE.id])addArcadeStairwell(T,arcade,kit,stairs);
  for(const [center,color] of [[ARCADE_CLAW.localX,0x9cdcca],[ARCADE_PUMP.localX,0xe3b586],[ARCADE_BASKET.localX,0xffb49a],[ARCADE_MOLE.localX,0xe6be83]]){
    glow(center,3.89,-.72,2.08,.033,.14,color);
    block(0x283c44,center,.051,-.15,2.62,.022,3.91,arcade);
  }
  for(const z of [-4.9,1.45,4.65])glow(0,3.93,z,18.6,.032,.045,cream);
  for(const x of [-6,0,6]){
    const light=new T.PointLight(0xffe6cd,13,12);
    light.position.set(x,3.52,1.6);arcade.add(light);
  }
  yield;

  const clawBase=group(ARCADE_CLAW.localX,.055,ARCADE_CLAW.localZ),bedY=.91;
  clawBase.name="인형 뽑기 기계";
  const caseX=1.20,caseZ=.89,railY=2.75;
  const chuteLeft=CLAW_CHUTE.x-CLAW_CHUTE.width/2,chuteRight=CLAW_CHUTE.x+CLAW_CHUTE.width/2;
  const chuteBack=CLAW_CHUTE.z-CLAW_CHUTE.depth/2,chuteFront=CLAW_CHUTE.z+CLAW_CHUTE.depth/2;
  block(ink,0,.095,0,2.48,.19,1.88,clawBase);
  block(0x304a4b,0,.48,-.83,2.43,.78,.17,clawBase);
  for(const side of [-1,1])block(0x304a4b,side*1.185,.48,0,.12,.77,1.77,clawBase);
  block(0x304a4b,.355,.51,.896,1.75,.725,.116,clawBase);
  block(teal,.347,.407,.958,1.69,.41,.03,clawBase);
  block(0x304a4b,CLAW_CHUTE.x,.73,.896,.66,.285,.116,clawBase);
  block(0x182526,CLAW_CHUTE.x,.409,.892,.55,.29,.068,clawBase);
  block(0x1a2929,CLAW_CHUTE.x,.302,.69,.54,.035,.50,clawBase);
  panel(clawBase,"상품 출구","",.48,CLAW_CHUTE.x,.638,.958,"#203a3e",.117);
  const deckColor=0x64877b;
  block(deckColor,(chuteLeft-caseX)/2,bedY-.025,0,chuteLeft+caseX,.05,1.78,clawBase);
  block(deckColor,(caseX+chuteRight)/2,bedY-.025,0,caseX-chuteRight,.05,1.78,clawBase);
  block(deckColor,CLAW_CHUTE.x,bedY-.025,(chuteBack-caseZ)/2,CLAW_CHUTE.width,.05,chuteBack+caseZ,clawBase);
  block(deckColor,CLAW_CHUTE.x,bedY-.025,(chuteFront+caseZ)/2,CLAW_CHUTE.width,.05,caseZ-chuteFront,clawBase);
  for(const x of [chuteLeft,chuteRight])block(0xd4a16e,x,bedY+.013,CLAW_CHUTE.z,.033,.036,CLAW_CHUTE.depth,clawBase);
  for(const z of [chuteBack,chuteFront])block(0xd4a16e,CLAW_CHUTE.x,bedY+.013,z,CLAW_CHUTE.width,.036,.033,clawBase);
  block(0x1c5650,.33,.77,1.019,1.73,.17,.317,clawBase).rotation.x=.12;
  beam(cream,[.31,.829,1.044],[.31,.967,1.044],.032,clawBase);
  oval(orange,.31,.966,1.044,.064,.062,.066,clawBase);
  cylinder(0xf1b878,.82,.858,1.042,.098,.037,16,clawBase);
  block(0x4d8075,0,2.96,0,2.47,.32,1.87,clawBase);
  glow(0,2.807,.907,2.29,.04,.056,0x90e0d0,clawBase);
  panel(clawBase,"인형 뽑기","",1.87,0,2.957,.941,"#24524d",.229);
  const chamberMid=(bedY+railY)/2,chamberHeight=railY-bedY+.12;
  for(const x of [-caseX,caseX]){
    for(const z of [-caseZ,caseZ])glow(x,chamberMid,z,.056,chamberHeight,.054,0x407869,clawBase);
    window(clawBase,x,chamberMid,0,.022,chamberHeight,1.73);
    glow(x*.958,2.729,0,.049,.045,1.71,0xe0eed8,clawBase);
  }
  window(clawBase,0,chamberMid,.896,2.36,chamberHeight,.016);
  block(0x446a67,0,chamberMid,-.908,2.42,chamberHeight+.055,.071,clawBase);
  for(const x of [-1.07,1.07])beam(0xa5ada3,[x,railY+.01,-.79],[x,railY+.01,.79],.028,clawBase);
  const claw=group(0,railY,0,clawBase);
  block(cream,0,0,0,2.25,.043,.086,claw);
  const carriage=group(0,0,0,claw);
  block(0x7b8a85,0,.004,0,.193,.097,.176,carriage);
  const cable=block(0x57696a,0,1.58,0,.018,1,.018,clawBase);
  const cableSpan=new T.Vector3(),cableAnchor=new T.Vector3();
  const gripper=group(0,1.94,0,clawBase);gripper.name="인형 집게";
  const gripHub=cylinder(0xb7c3bb,0,.024,0,.101,.143,16,gripper);
  gripHub.material=meshMaterial(0xd5d8c7,{metalness:.48});
  cylinder(0x4a5c5a,0,.094,0,.063,.046,16,gripper);
  const hooks=Array.from({length:3},(_,index)=>{
    const pivot=group(0,0,0,gripper);pivot.rotation.y=index*2*Math.PI/3-.23;
    const joint=group(.071,-.018,0,pivot);
    beam(0xc4cbbe,[0,0,0],[.105,-.117,0],.020,joint);
    beam(0xbfcbc5,[.105,-.117,0],[.068,-.205,0],.019,joint);
    beam(0xb4c0b2,[.068,-.205,0],[-.007,-.233,0],.020,joint);
    oval(0x819591,-.013,-.232,0,.032,.019,.022,joint);
    return joint;
  });
  dynamic(claw);dynamic(cable);dynamic(gripper);
  const prizes=new Map(),plushGeometries=new Map();
  const plushMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.94});
  const plushOval=new T.SphereGeometry(1,10,8);
  const starchip=new T.Shape();
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+Math.PI/2,rad=i%2?.094:.177;
    if(i===0)starchip.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);
    else starchip.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
  }
  starchip.closePath();
  const star=new T.ExtrudeGeometry(starchip,{depth:.082,bevelEnabled:true,bevelThickness:.016,bevelSize:.014,bevelSegments:1});
  const ear=new T.ConeGeometry(1,1,12);
  function makePlushGeometry(type,variant){
    const parts=new T.Group();
    const color=plushColors[type][variant];
    const stuffed=(tint,x,y,z,w,h,d)=>{
      const model=shape(plushOval,tint,x,y,z,parts);
      model.scale.set(w,h,d);return model;
    };
    const starFace=type==="star",penguin=type==="penguin",frog=type==="frog";
    const panda=type==="panda",duck=type==="duck";
    if(starFace)shape(star,color,0,.165,-.037,parts);
    else{
      stuffed(color,0,.115,0,.109,.117,.098);
      stuffed(panda||penguin?0xece4db:cream,0,.112,.082,.067,.078,.019);
      stuffed(color,0,.241,-.003,frog?.131:.118,frog?.085:.103,.103);
      for(const s of [-1,1]){
        const feet=panda?0x525456:penguin||duck?0xe5a25c:color;
        stuffed(feet,s*.081,.047,.061,.041,.049,.050);
        stuffed(panda?0x56595f:color,s*.101,.126,.017,.043,.079,.044).rotation.z=s*.42;
        if(!duck&&!penguin){
          if(type==="cat"){
            shape(ear,color,s*.071,.321,-.031,parts).scale.set(.038,.096,.035);
            stuffed(0xe8b6ad,s*.072,.321,-.006,.023,.035,.009);
          }else{
            const rabbit=type==="rabbit",earY=rabbit?.352:frog?.296:.308;
            stuffed(panda?0x525456:color,s*.077,earY,-.027,.043,rabbit?.093:.047,.041).rotation.z=s*-.24;
            if(rabbit||type==="bear")stuffed(0xe6acaa,s*.079,earY,.006,.024,rabbit?.069:.024,.013).rotation.z=s*-.24;
          }
        }
        if(panda||penguin)stuffed(panda?0x55585b:0xeee3d5,s*.049,.242,.082,.042,.041,.029).rotation.z=s*.24;
      }
      stuffed(duck||penguin?0xd88353:frog?0x6c966d:0x775750,0,.211,.103,duck?.055:penguin?.035:.023,.018,.030);
      if(type==="bear"||type==="rabbit")stuffed(0xaa665b,-.083,.089,.091,.018,.025,.006).rotation.z=-.18;
    }
    for(const s of [-1,1]){
      const eyeY=starFace?.175:frog?.265:.251,eyeZ=starFace?.055:panda||penguin?.110:.101;
      stuffed(0x453d40,s*.051,eyeY,eyeZ,.013,.018,.011);
      stuffed(0xf6ece7,s*.051-.005,eyeY+.006,eyeZ+.010,.005,.005,.004);
      stuffed(0xe69183,s*.070,eyeY-.033,eyeZ-.001,.018,.010,.009);
    }
    const positions=[],normals=[],colors=[],indices=[];
    const point=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
    for(const part of parts.children){
      part.updateMatrix();
      normalMatrix.getNormalMatrix(part.matrix);
      const geometry=part.geometry,{position,normal:sourceNormal}=geometry.attributes;
      const offset=positions.length/3;
      const tint=part.material.color;
      for(let i=0;i<position.count;i++){
        point.fromBufferAttribute(position,i).applyMatrix4(part.matrix);
        normal.fromBufferAttribute(sourceNormal,i).applyNormalMatrix(normalMatrix);
        positions.push(point.x,point.y,point.z);normals.push(normal.x,normal.y,normal.z);
        colors.push(tint.r,tint.g,tint.b);
        if(!geometry.index)indices.push(offset+i);
      }
      if(geometry.index)for(const index of geometry.index.array)indices.push(offset+index);
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
    geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);
    return geometry;
  }
  function makePlush(prize){
    const key=prize.type+"-"+prize.variant;
    if(!plushGeometries.has(key))plushGeometries.set(key,makePlushGeometry(prize.type,prize.variant));
    const plush=new T.Mesh(plushGeometries.get(key),plushMaterial);
    plush.name=`뽑기 인형 · ${prize.label}`;
    plush.scale.setScalar(prize.scale);
    clawBase.add(plush);dynamic(plush);return plush;
  }

  const pumpBase=group(ARCADE_PUMP.localX,.058,ARCADE_PUMP.localZ);pumpBase.name="펌프 발판";
  block(0x465865,0,.012,0,2.32,.034,2.31,pumpBase);
  block(0x263638,0,.120,-1.63,2.10,.22,.49,pumpBase);
  block(0x405860,0,1.28,-1.68,2.12,2.34,.36,pumpBase);
  glow(0,2.53,-1.58,2.22,.07,.16,0xeac18b,pumpBase);
  panel(pumpBase,"펌프","",.92,0,2.38,-1.48,"#484057",.22);
  const pumpScreen=screenSurface(pumpBase,1.48,.80,0,1.70,-1.475);
  let pumpDisplayMode=null,pumpDisplayAt=-Infinity;
  for(const s of [-1,1]){
    const speaker=cylinder(ink,s*.867,1.22,-1.469,.155,.033,17,pumpBase);speaker.rotation.x=Math.PI/2;
    beam(0xa6a6b0,[s*1.16,.12,.88],[s*1.16,1.01,.88],.043,pumpBase);
    beam(0xb57b86,[s*1.16,1.01,.88],[s*1.16,1.01,.44],.048,pumpBase);
  }
  const footLights=ARCADE_PADS.map(({dx,dz,arrow},lane)=>{
    block(ink,dx,.044,dz,.626,.029,.628,pumpBase);
    const tread=block(padColors[lane],dx,.061,dz,.572,.015,.568,pumpBase);
    tread.name=`펌프 ${arrow}`;
    const off=meshMaterial(padColors[lane]),on=meshMaterial(padColors[lane],{emissive:padColors[lane]});tread.material=off;
    const count=pumpBase.children.length;
    panel(pumpBase,arrow,"",.46,dx,.071,dz,"#243a48",.446);
    if(pumpBase.children.length>count)pumpBase.children.at(-1).rotation.x=-Math.PI/2;
    dynamic(tread);return {tread,on,off};
  });
  block(0xa4adb2,0,.060,0,.488,.019,.488,pumpBase);
  const centerBadge=shape(torus(.155,.031).rotateX(-Math.PI/2),teal,0,.080,0,pumpBase);
  centerBadge.scale.setScalar(.84);

  const basketBase=group(ARCADE_BASKET.localX,.055,ARCADE_BASKET.localZ);basketBase.name="농구 슈팅 기계";
  block(0x714952,0,.17,.13,2.04,.29,1.36,basketBase);
  function basketBox(color,{x,y,z,width,height,depth}){
    return block(color,x,y,z,width,height,depth,basketBase);
  }
  basketBox(0x866861,BASKET_RAMP).rotation.x=BASKET_RAMP.tilt;
  basketBox(0x653d49,BASKET_BACKING);
  basketBox(0x241f2c,BASKET_BACKBOARD);
  const boardFront=BASKET_BACKBOARD.z+BASKET_BACKBOARD.depth/2;
  panel(basketBase,"농구","",1.26,0,2.55,boardFront+.009,"#5a3548",.28);
  const basketScreen=screen(basketBase,.60,.26,0,2.34,boardFront+.005,"득점");
  for(const edge of [-1,1]){
    block(cream,edge*.285,1.895,boardFront+.002,.024,.37,.003,basketBase);
    block(cream,0,1.895+edge*.175,boardFront+.002,.57,.021,.003,basketBase);
  }
  for(const side of [-1,1]){
    const x=side*1.02;
    beam(cream,[x,.34,1.16],[x,1.13,1.09],.035,basketBase);
    beam(orange,[x,1.13,1.09],[x,2.23,-.85],.032,basketBase);
    for(let i=0;i<8;i++){
      const dz=i/7;
      beam(0x9e756d,[x,.53+dz*.19,1.12-1.86*dz],[x,1.10+dz*1.11,1.10-1.96*dz],.008,basketBase);
    }
  }
  const hoop=group(BASKET_HOOP.x,BASKET_HOOP.y,BASKET_HOOP.z,basketBase);
  block(0xb04e35,0,-.035,-.375,.115,.083,.24,hoop);
  const basketRing=shape(torus(BASKET_HOOP.majorRadius,BASKET_HOOP.tubeRadius).rotateX(-Math.PI/2),0xb84e35,0,0,0,hoop);
  basketRing.material=meshMaterial(0xd66a45,{metalness:.43});
  for(let n=0;n<10;n++){
    const a=n*Math.PI/5,b=a+Math.PI/5;
    const upper=[Math.cos(a)*.279,-.02,Math.sin(a)*.279],lower=[Math.cos(b)*.205,-.35,Math.sin(b)*.205];
    beam(cream,upper,lower,.010,hoop);
    beam(cream,lower,[Math.cos(a)*.205,-.35,Math.sin(a)*.205],.008,hoop);
  }
  dynamic(hoop);
  const dotMaterial=new T.MeshBasicMaterial({color:0xffe09b});
  const aimDots=Array.from({length:14},(_,index)=>{
    const radius=.039-index*.0012;
    const dot=oval(cream,0,0,0,radius,radius,radius,basketBase);
    dot.material=dotMaterial;dot.visible=false;return dot;
  });
  const basketball=group(BASKET_BALL.x,BASKET_BALL.y,BASKET_BALL.z,basketBase);basketball.name="게임 농구공";
  const radius=BASKET_BALL.radius;
  oval(0xc77340,0,0,0,radius,radius,radius,basketball);
  const seam=torus(radius-.001,.004);
  shape(seam,0x744b32,0,0,0,basketball).rotation.x=Math.PI/2;
  shape(seam,0x744b32,0,0,0,basketball).rotation.y=Math.PI/2;
  shape(seam,0x744b32,0,0,0,basketball).rotation.y=.48;
  dynamic(basketball);
  yield;

  const bowling=addBowlingLane(T,arcade,kit);
  const mole=group(ARCADE_MOLE.localX,.025,ARCADE_MOLE.localZ);
  mole.name="두더지 잡기";
  const tableTop=MOLE_BOARD.top-mole.position.y;
  block(0x39384e,0,.35,0,2.01,.65,1.24,mole);
  block(0x6a5b77,0,.697,0,MOLE_BOARD.width,.087,MOLE_BOARD.depth,mole);
  for(const x of [-1.015,1.015])block(0x5f516c,x,.786,0,.10,.09,MOLE_BOARD.depth,mole);
  block(0x5f516c,0,.786,.61,2.02,.09,.06,mole);
  const tableShape=new T.Shape(),halfWidth=MOLE_BOARD.width/2,halfDepth=MOLE_BOARD.depth/2;
  for(const [index,[x,z]] of [[-halfWidth,-halfDepth],[halfWidth,-halfDepth],[halfWidth,halfDepth],[-halfWidth,halfDepth]].entries()){
    if(index===0)tableShape.moveTo(x,-z);else tableShape.lineTo(x,-z);
  }
  tableShape.closePath();
  for(const {x,z} of MOLE_HOLES){
    const hole=new T.Path();hole.absarc(x,-z,MOLE_HOLE_RADIUS,0,Math.PI*2,true);tableShape.holes.push(hole);
  }
  shape(new T.ShapeGeometry(tableShape,16).rotateX(-Math.PI/2),0x31534e,0,tableTop,0,mole);
  glow(0,.56,.632,1.97,.040,.027,0xa2dec5,mole);
  block(0x564560,0,1.37,-.57,2.10,1.24,.17,mole);
  panel(mole,"두더지 잡기","튀어나온 두더지를 눌러요",1.84,0,1.86,-.47,"#4d3d5b",.34);
  const moleMeter=screen(mole,.70,.36,0,1.34,-.455,"잡은 두더지");
  const wells=MOLE_HOLES.map(({x,z})=>{
    cylinder(0x241f2c,x,tableTop-.055,z,MOLE_HOLE_RADIUS+.012,.020,18,mole);
    const ring=shape(torus(MOLE_HOLE_RADIUS+.004,.015).rotateX(-Math.PI/2),0xe4b387,x,tableTop+.005,z,mole);
    const defaultMaterial=ring.material,litMaterial=meshMaterial(0xf5c762,{emissive:0x8c602c}),
      hitMaterial=meshMaterial(0x86e0ae,{emissive:0x367e55});
    const head=group(x,tableTop,z,mole);head.visible=false;
    oval(0x916850,0,.060,0,.088,.104,.092,head);
    oval(0xcda384,0,.079,.070,.062,.052,.034,head);
    for(const side of [-1,1]){
      oval(0x5b3e36,side*.060,.132,-.013,.025,.035,.025,head);
      oval(0x261f2b,side*.034,.095,.081,.010,.014,.008,head);
    }
    oval(0xd19087,0,.068,.104,.023,.017,.012,head);
    dynamic(head);dynamic(ring);
    return {head,ring,defaultMaterial,litMaterial,hitMaterial};
  });
  const molePlane=new T.Plane(new T.Vector3(0,1,0),-MOLE_BOARD.top);
  const moleTap=new T.Vector3();
  function pickMole(ray){
    mole.updateWorldMatrix(true,true);
    const active=wells.findIndex(({head})=>head.visible);
    if(active>=0&&ray.intersectObject(wells[active].head,true).length)return active;
    if(!ray.ray.intersectPlane(molePlane,moleTap))return null;
    mole.worldToLocal(moleTap);
    const hole=MOLE_HOLES.findIndex(({x,z})=>Math.hypot(moleTap.x-x,moleTap.z-z)<.137);
    return hole<0?null:hole;
  }
  let showPreview=true,previousAim=null;
  function update(local,clock,peers=[],serverClock=0,view,bowlingMatch){
    const spectators=new Map();
    for(const peer of peers){
      const activity=peer.arcade;
      if(activity&&(!spectators.has(activity.kind)||peer.id<spectators.get(activity.kind).id)){
        spectators.set(activity.kind,peer);
      }
    }
    const game=kind=>local?.kind===kind?local:spectators.get(kind)?.arcade;
    const clawState=game("claw")?.claw,prizeList=clawState?.prizes??plushPreview;
    if(clawState||showPreview){
      const x=clawState?.x??CLAW_CHUTE.x,z=clawState?.z??CLAW_CHUTE.z,y=bedY+(clawState?.y??CLAW_LIMITS.high);
      claw.position.z=z;carriage.position.x=x;
      gripper.position.set(x+(clawState?.swingX??0),y,z+(clawState?.swingZ??0));
      gripper.rotation.set(clawState?.tiltX??0,0,clawState?.tiltZ??0);
      cableAnchor.set(x,railY-.014,z);
      cable.position.set(0,.096,0).applyEuler(gripper.rotation).add(gripper.position);
      cableSpan.subVectors(cableAnchor,cable.position);
      cable.position.addScaledVector(cableSpan,.5);
      cable.scale.y=Math.max(.01,cableSpan.length());
      if(cableSpan.lengthSq()>.000001)cable.quaternion.setFromUnitVectors(vertical,cableSpan.normalize());
      for(const joint of hooks)joint.rotation.z=(clawState?.grip??0)*-.78+.30;
      for(const prize of prizeList){
        if(!prizes.has(prize.id))prizes.set(prize.id,makePlush(prize));
        const model=prizes.get(prize.id);
        model.visible=prize.available;
        model.position.set(prize.x,bedY+prize.y,prize.z);
        model.rotation.set(prize.rotX,prize.rotY,prize.rotZ);
      }
      showPreview=Boolean(clawState);
    }
    const pump=game("pump")?.pump,lit=pump?.litLane>=0?pump.litLane:pump?.readyLane;
    footLights.forEach(({tread,on,off},lane)=>{tread.material=lane===lit?on:off;});
    const mode=pump?.active?"playing":pump?.finished?"finished":"idle";
    if(pumpScreen&&(mode!==pumpDisplayMode||pump?.active&&(clock<pumpDisplayAt||clock-pumpDisplayAt>=32))){
      drawPumpTrack(pumpScreen.ctx,pump);
      pumpScreen.map.needsUpdate=true;
      pumpDisplayMode=mode;pumpDisplayAt=clock;
    }
    const basketballGame=game("basket"),shot=basketballGame?.basket??BASKET_BALL;
    hoop.position.x=basketballGame?.rimX??BASKET_HOOP.x;
    const aim=local?.kind==="basket"&&local.phase==="aim"&&!local.finished?local.basketAim:null;
    if(aim!==previousAim){
      const dots=aim?basketTrajectory(aim):null;
      aimDots.forEach((dot,index)=>{
        const point=dots?.[index];
        dot.visible=Boolean(point);
        if(point)dot.position.set(point.x,point.y,point.z);
      });
      previousAim=aim;
    }
    basketball.position.set(shot.x,shot.y,shot.z);
    basketball.rotation.x=basketballGame&&basketballGame.phase!=="aim"?clock*.016:0;
    basketScreen(String(basketballGame?.score??0),basketballGame?basketballGame.level+"단계":"자유투");
    bowling.update(bowlingMatch?bowlingMatch.roll:game("bowling")?.bowling?.roll??null,
      serverClock,local?.kind==="bowling"&&local.canAim?view?.pan:undefined,bowlingMatch,local?.aimOffset);
    const moleGame=game("mole");
    wells.forEach(({head,ring,defaultMaterial,litMaterial,hitMaterial},index)=>{
      const rise=index===moleGame?.target?moleGame.height:0;
      head.visible=rise>.015;
      if(head.visible)head.position.y=tableTop-.167*(1-rise);
      const age=serverClock-(moleGame?.swingAt??0);
      ring.material=moleGame?.hit&&index===moleGame.swingHole&&age>=0&&age<MOLE_WHACK_MS?hitMaterial:
        head.visible?litMaterial:defaultMaterial;
    });
    moleMeter(String(moleGame?.score??0),moleGame?(moleGame.finished?"끝":moleGame.remaining+"초"):"망치 준비");
  }
  update(null,0);
  return {updateArcade:update,pickMole};
}
