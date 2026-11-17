import {ARCADE_BASKET,ARCADE_CLAW,ARCADE_PADS,ARCADE_PUMP,ARCADE_SITE} from "./arcade-layout.js";
import {BASKET_BALL,BASKET_HOOP,CLAW_CHUTE,CLAW_LIMITS,CLAW_PRIZES} from "./arcade-games.js";
import {standSign} from "./regional-stands.js";

const wall=0x34464e,ink=0x202c33,cream=0xf2d5ab,teal=0x458f84,orange=0xd5835e;
const padColors=[0x68c8d8,0xf0bc6e,0xef89a9,0x9ed0a3];
const plushColors={bear:0xc49357,rabbit:0xdbaec9,cat:0xa9a7d4,duck:0xf5c769,panda:0xceccd0,star:0xf9d783};
const plushPreview=CLAW_PRIZES.map(prize=>({...prize,available:true}));

export function addArcade(T,parent,{wx,wz,box,cylinder,shape},groundHeight){
  const arcade=new T.Group();arcade.name=ARCADE_SITE.name;
  arcade.position.set(wx(ARCADE_SITE.body.x),groundHeight(ARCADE_SITE.body),wz(ARCADE_SITE.body.y));
  arcade.rotation.y=ARCADE_SITE.angle;parent.add(arcade);
  const {width,depth}=ARCADE_SITE;
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
  function screen(base,w,h,x,y,z,label){
    block(0x101a1b,x,y,z-.04,w+.12,h+.11,.10,base);
    if(typeof document==="undefined")return ()=>{};
    const canvas=document.createElement("canvas");canvas.width=256;canvas.height=128;
    const ctx=canvas.getContext("2d");if(!ctx)return ()=>{};
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const surface=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,toneMapped:false}));
    surface.position.set(x,y,z+.016);base.add(surface);
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

  block(0x565758,0,.014,0,width,.067,depth,arcade);
  block(0x40515a,0,2.04,-depth/2,width,4.18,.17,arcade);
  for(const side of [-1,1]){
    block(0x415963,side*(width/2-.05),1.98,0,.17,3.99,depth,arcade);
    block(0x32484d,side*(width/2-.17),1.95,depth/2-.10,.32,3.90,.34,arcade);
    glow(side*(width/2-.36),1.87,depth/2-.08,.055,3.47,.052,side>0?orange:teal);
    for(let i=0;i<11;i++)block(i%2?0x526a6a:0x4f6367,side*(width/2-.19),1.24,-2.45+i*.53,.038,2.22,.49,arcade);
  }
  for(let i=0;i<14;i++){
    const x=(i-6.5)*.74;
    block(i%2?0x384f58:0x3d555d,x,1.87,-depth/2+.11,.70,3.48,.05,arcade);
    block(i%2?0x62676a:0x536168,x,.052,2.79,.68,.018,.59,arcade);
  }
  block(0x394f56,0,4.07,-.10,width+.36,.22,depth+.37,arcade);
  block(ink,0,3.71,depth/2-.008,width+.23,.65,.35,arcade);
  glow(0,3.394,depth/2+.188,width+.11,.041,.042,teal);
  glow(0,3.989,depth/2+.188,width+.11,.036,.041,orange);
  panel(arcade,"광화문 오락실","인형 뽑기 · 펌프 · 농구",5.30,0,3.7,depth/2+.179,"#263642",.58);
  for(const [center,caption,color] of [[ARCADE_CLAW.localX,"인형 뽑기",0x9cdcca],[ARCADE_PUMP.localX,"펌프",0xe3b586],[ARCADE_BASKET.localX,"농구",0xffb49a]]){
    glow(center,3.89,-.72,2.08,.033,.14,color);
    panel(arcade,caption,"",1.91,center,2.99,-depth/2+.23,"#24343d",.31);
    block(0x283c44,center,.051,-.15,2.62,.022,3.91,arcade);
  }
  for(const z of [-1.98,1.45])glow(0,3.93,z,9.61,.032,.045,cream);

  const clawBase=group(ARCADE_CLAW.localX,.055,ARCADE_CLAW.localZ),bedY=.86;
  clawBase.name="인형 뽑기 기계";
  block(ink,0,.44,0,1.49,.88,1.06,clawBase);
  block(teal,0,.224,.539,1.40,.34,.054,clawBase);
  block(0x263636,0,bedY-.03,0,1.30,.097,.89,clawBase);
  block(0x597f74,0,bedY+.026,-.026,1.18,.022,.81,clawBase);
  block(0x263b3c,-.47,.42,.574,.45,.24,.12,clawBase);
  panel(clawBase,"상품 출구","",.37,-.47,.414,.64,"#243f43",.139);
  block(0x185451,0,.75,.616,1.42,.17,.235,clawBase).rotation.x=.14;
  beam(cream,[.17,.79,.661],[.17,.90,.661],.027,clawBase);
  oval(orange,.17,.898,.661,.053,.050,.052,clawBase);
  cylinder(0xf1b878,.49,.824,.651,.076,.034,14,clawBase);
  block(0x477f78,0,2.62,0,1.48,.33,1.07,clawBase);
  glow(0,2.46,.521,1.36,.046,.057,0x8ce0d2,clawBase);
  panel(clawBase,"인형 뽑기","",1.32,0,2.618,.541,"#21504c",.224);
  for(const x of [-.697,.697]){
    for(const z of [-.477,.477])glow(x,1.668,z,.053,1.68,.052,0x376b61,clawBase);
    window(clawBase,x,1.67,0,.024,1.60,.94);
  }
  window(clawBase,0,1.67,.496,1.37,1.60,.017);
  block(0x406360,0,1.67,-.515,1.40,1.67,.071,clawBase);
  for(const x of [-.57,.57])beam(0xa5ada3,[x,2.391,-.397],[x,2.391,.397],.028,clawBase);
  const claw=group(0,2.38,0,clawBase);
  block(cream,0,0,0,1.27,.038,.085,claw);
  const carriage=group(0,0,0,claw);
  block(0x7b8a85,0,.004,0,.171,.091,.16,carriage);
  const cable=block(0x57696a,0,1.58,0,.021,.56,.021,clawBase);
  const gripper=group(0,1.94,0,clawBase);gripper.name="인형 집게";
  cylinder(0xb2b6aa,0,.035,0,.104,.14,14,gripper);
  const hooks=Array.from({length:4},(_,index)=>{
    const pivot=group(0,0,0,gripper);pivot.rotation.y=index*Math.PI/2;
    const joint=group(.066,0,0,pivot);
    beam(0xc4cbbe,[0,0,0],[.099,-.105,0],.021,joint);
    beam(0xbfcbc5,[.099,-.105,0],[.062,-.182,0],.021,joint);
    beam(0xb4c0b2,[.062,-.182,0],[-.004,-.197,0],.022,joint);
    return joint;
  });
  dynamic(claw);dynamic(cable);dynamic(gripper);
  const prizes=new Map();
  const starchip=new T.Shape();
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+Math.PI/2,rad=i%2?.094:.177;
    if(i===0)starchip.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);
    else starchip.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
  }
  starchip.closePath();
  const star=new T.ExtrudeGeometry(starchip,{depth:.082,bevelEnabled:true,bevelThickness:.016,bevelSize:.014,bevelSegments:1});
  const ear=new T.ConeGeometry(1,1,12);
  function makePlush(type){
    const plush=group(0,0,0,clawBase);plush.name=`뽑기 인형 · ${type}`;
    const color=plushColors[type]??plushColors.bear;
    if(type==="star")shape(star,color,0,.165,-.037,plush);
    else{
      const panda=type==="panda",duck=type==="duck";
      oval(color,0,.115,0,.104,.107,.086,plush);
      oval(cream,0,.102,.071,.057,.063,.015,plush);
      oval(color,0,.232,-.003,.117,.098,.098,plush);
      for(const s of [-1,1]){
        oval(panda?0x525456:color,s*.077,.044,.058,.038,.046,.044,plush);
        oval(panda?0x56595f:color,s*.093,.123,.02,.045,.063,.039,plush).rotation.z=s*.38;
        if(!duck){
          if(type==="cat")shape(ear,color,s*.068,.317,-.034,plush).scale.set(.034,.074,.032);
          else oval(panda?0x525456:color,s*.076,type==="rabbit"?.350:.302,-.025,.032,type==="rabbit"?.087:.038,.028,plush).rotation.z=s*-.24;
        }
        if(panda)oval(0x55585b,s*.048,.238,.079,.035,.035,.024,plush).rotation.z=s*.24;
      }
      oval(duck?0xd88353:0x775750,0,.202,.092,duck?.050:.022,.019,.024,plush);
    }
    for(const s of [-1,1]){
      const eyeY=type==="star"?.172:.245;
      oval(0x453d40,s*.047,eyeY,.092,.013,.017,.012,plush);
      oval(0xe69183,s*.067,eyeY-.033,.092,.019,.010,.008,plush);
    }
    dynamic(plush);return plush;
  }

  const pumpBase=group(ARCADE_PUMP.localX,.058,ARCADE_PUMP.localZ);pumpBase.name="펌프 발판";
  block(0x465865,0,.012,0,2.32,.034,2.31,pumpBase);
  block(0x263638,0,.120,-1.63,2.10,.22,.49,pumpBase);
  block(0x405860,0,1.28,-1.68,2.12,2.34,.36,pumpBase);
  glow(0,2.53,-1.58,2.22,.07,.16,0xeac18b,pumpBase);
  panel(pumpBase,"펌프","",.92,0,2.38,-1.48,"#484057",.22);
  const pumpScreen=screen(pumpBase,1.48,.80,0,1.70,-1.475,"발판을 밟으세요");
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
  block(0x714952,0,.17,.13,1.52,.29,1.36,basketBase);
  const ramp=block(0x866861,0,.34,.39,1.35,.11,1.83,basketBase);ramp.rotation.x=.17;
  block(0x653d49,0,1.38,-.947,1.56,2.76,.21,basketBase);
  block(0x241f2c,0,2.10,-.826,1.32,.93,.034,basketBase);
  panel(basketBase,"농구","",1.26,0,2.55,-.812,"#5a3548",.28);
  const basketScreen=screen(basketBase,.63,.31,0,2.14,-.803,"득점");
  for(const side of [-1,1]){
    const x=side*.74;
    beam(cream,[x,.34,1.16],[x,1.13,1.09],.035,basketBase);
    beam(orange,[x,1.13,1.09],[x,2.23,-.85],.032,basketBase);
    for(let i=0;i<8;i++){
      const dz=i/7;
      beam(0x9e756d,[x,.53+dz*.19,1.12-1.86*dz],[x,1.10+dz*1.11,1.10-1.96*dz],.008,basketBase);
    }
  }
  const basketRing=shape(torus(.285,.026).rotateX(-Math.PI/2),0xb84e35,BASKET_HOOP.x,BASKET_HOOP.y,BASKET_HOOP.z,basketBase);
  basketRing.material=meshMaterial(0xd66a45,{metalness:.43});
  for(let n=0;n<10;n++){
    const a=n*Math.PI/5,b=a+Math.PI/5;
    const upper=[Math.cos(a)*.279,1.65,-.80+Math.sin(a)*.279],lower=[Math.cos(b)*.205,1.32,-.80+Math.sin(b)*.205];
    beam(cream,upper,lower,.010,basketBase);
    beam(cream,lower,[Math.cos(a)*.205,1.32,-.80+Math.sin(a)*.205],.008,basketBase);
  }
  const basketball=group(BASKET_BALL.x,BASKET_BALL.y,BASKET_BALL.z,basketBase);basketball.name="게임 농구공";
  const radius=BASKET_BALL.radius;
  oval(0xc77340,0,0,0,radius,radius,radius,basketball);
  const seam=torus(radius-.001,.004);
  shape(seam,0x744b32,0,0,0,basketball).rotation.x=Math.PI/2;
  shape(seam,0x744b32,0,0,0,basketball).rotation.y=Math.PI/2;
  shape(seam,0x744b32,0,0,0,basketball).rotation.y=.48;
  dynamic(basketball);

  let showPreview=true;
  function update(state,clock,viewer){
    const play=viewer&&Math.hypot(viewer.x-ARCADE_SITE.x,viewer.y-ARCADE_SITE.y)<23?state:null;
    const clawState=play?.kind==="claw"?play.claw:null,prizeList=clawState?.prizes??plushPreview;
    if(clawState||showPreview){
      const x=clawState?.x??CLAW_CHUTE.x,z=clawState?.z??CLAW_CHUTE.z,y=bedY+(clawState?.y??CLAW_LIMITS.high);
      claw.position.z=z;carriage.position.x=x;gripper.position.set(x,y,z);
      cable.position.set(x,(claw.position.y+y+.055)/2,z);cable.scale.y=Math.max(.02,claw.position.y-y-.055);
      for(const joint of hooks)joint.rotation.z=(clawState?.grip??0)*-.51+.23;
      const storage=new Set();
      for(const prize of prizeList){
        if(!prize.available&&prize.id!==clawState?.holding)continue;
        storage.add(prize.id);
        if(!prizes.has(prize.id))prizes.set(prize.id,makePlush(prize.type));
        const model=prizes.get(prize.id),held=prize.id===clawState?.holding;
        model.position.set(prize.x,bedY+.028+Math.max(.15,prize.y)-.15,prize.z);
        model.rotation.y=held?0:prize.x*2.12+prize.z;
      }
      for(const [id,model] of prizes)if(!storage.has(id)){model.removeFromParent();prizes.delete(id);}
      showPreview=Boolean(clawState);
    }
    const pump=play?.pump,lit=pump?.litLane>=0?pump.litLane:pump?.dueLane;
    footLights.forEach(({tread,on,off},lane)=>{tread.material=pump?.active&&lane===lit?on:off;});
    pumpScreen(pump?.active?ARCADE_PADS[pump.dueLane]?.arrow??"♪":"READY",pump?.active?`점수 ${pump.score??0}`:"네 방향에 맞춰 밟기");
    const shot=play?.kind==="basket"?play.basket:BASKET_BALL;
    basketball.position.set(shot.x,shot.y,shot.z);
    basketball.rotation.x=play?.kind==="basket"&&play.phase!=="aim"?clock*.016:0;
    basketScreen(String(play?.kind==="basket"?play.score:0),"자유투");
  }
  update(null,0,null);
  return {update};
}
