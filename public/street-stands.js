import {addObstacle,route,stoneFountain} from "./layout.js";
import {sparklerStall} from "./gyeongbok-layout.js";
import {addConvenienceStore,standBatcher,standSign} from "./regional-stands.js";
import {makeRegionalItemProps} from "./regional-item-props.js";
import {makeDiningDishes} from "./dining-dishes.js";

export {addRegionalStands,regionalStations,registerRegionalStands} from "./regional-stands.js";

export const SPARKLER_SECONDS=8;

const shops=[
  {kind:"coffee",name:"돌담 커피",subtitle:"JEONGDONG COFFEE",segment:1,t:.54,width:12.4,depth:8.5,height:6.15,
    walls:0xcdb493,base:0x8d7054,frame:0x456653,roof:0x343d39,glass:0x8a7860,
    shade:0x59766a,stripe:0xe6d2ad,ink:"#f8e3b3",sign:"#344d3d"},
  {kind:"churu",name:"돌담 편의점",segment:2,t:.47,width:7.8,depth:5.7,height:3.62},
  {kind:"crepe",name:"단풍 크레페",subtitle:"DESSERT & CRÊPES",segment:3,t:.37,width:11.1,depth:8,height:5.55,
    walls:0xe4c2b4,base:0xc88f81,frame:0xb7656a,roof:0x5f535c,glass:0xc39b90,
    shade:0xc77780,stripe:0xf9dcc9,ink:"#723c48",sign:"#f5d9c3"},
  {kind:"beer",name:"정동 양조",subtitle:"CRAFT BEER",segment:4,t:.61,width:13.1,depth:9,height:6.35,
    walls:0x92634d,base:0x694e40,frame:0x3c493f,roof:0x393b38,glass:0x9b784f,
    shade:0x69553f,stripe:0xc4965b,ink:"#f5cf83",sign:"#302c24"}
];
const shopPlots=shops.map(shop=>{
  const a=route[shop.segment],b=route[shop.segment+1];
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  const sideX=dy/length,sideY=-dx/length,offset=5.46+shop.depth/2;
  const x=a.x+dx*shop.t,y=a.y+dy*shop.t;
  return {shop,x,y,sideX,sideY,angle:-Math.atan2(dy,dx),centerX:x+sideX*offset,centerY:y+sideY*offset};
});
const sparklerStand={x:stoneFountain.x+8.1,y:stoneFountain.y+9.8};
export function underDoldamAwning(point){
  return shopPlots.some(({shop,centerX,centerY,angle})=>{
    if(shop.kind==="churu")return false;
    const dx=point.x-centerX,dy=point.y-centerY;
    const c=Math.cos(angle),s=Math.sin(angle),front=dx*s+dy*c-shop.depth/2;
    return Math.abs(dx*c-dy*s)<shop.width*.395&&front>.14&&front<1.17;
  });
}
// Include the roof trim, sidewalk platform and awning over the shop's front.
export const standPlantingFootprints=[
  ...shopPlots.map(({shop,centerX,centerY,sideX,sideY,angle})=>({
    x:centerX-sideX*.49,y:centerY-sideY*.49,w:shop.width+.55,d:shop.depth+1.42,h:shop.height+.44,angle
  })),
  {...sparklerStand,w:4.3,d:3.4,h:2.62,angle:Math.PI}
];

function makeCrepeModel(T){
  const group=new T.Group();
  function foldedLayer(points,color,depth,z){
    const outline=new T.Shape(points.map(([x,y])=>new T.Vector2(x,y)));
    const geometry=new T.ExtrudeGeometry(outline,{
      depth,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1
    });
    const layer=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.92}));
    layer.position.z=z;
    group.add(layer);
  }
  foldedLayer([[0,-.133],[-.124,.162],[-.111,.195],[-.060,.218],[.009,.224],[.077,.207],[.125,.173]],
    0xf2c57f,.055,-.029);
  foldedLayer([[-.087,.143],[-.098,.187],[-.052,.208],[.010,.214],[.066,.201],[.091,.181],[.032,.165]],
    0x855336,.015,.028);
  foldedLayer([[-.100,.150],[-.071,.194],[-.022,.208],[-.036,.180],[.016,.192],[.081,.180],[.032,.161]],
    0xffdda1,.012,.041);
  foldedLayer([[-.051,.162],[-.064,.189],[-.052,.213],[-.034,.215],[-.021,.199],[-.028,.169]],
    0xd55049,.020,.050);
  foldedLayer([[.031,.165],[.032,.201],[.052,.214],[.073,.194],[.072,.169]],
    0xe66a59,.015,.050);
  foldedLayer([[.004,-.145],[-.103,.101],[.106,.071]],0xf5dec9,.091,-.045);
  foldedLayer([[.004,-.135],[-.083,.072],[.104,.060],[.087,.033]],0xd7797b,.004,.048);
  return group;
}

export function addStands(T,scene,{wx,wz,box,cylinder}){
  const stations=[];
  const batchDetails=standBatcher(T);
  function glass(parent,shop,x,y,z,width,height){
    box(shop.frame,x,y,z,width+.16,height+.16,.10,parent);
    box(shop.glass,x,y,z+.058,width,height,.025,parent);
    box(shop.stripe,x-width*.30,y,z+.077,width*.032,height*.88,.012,parent);
    box(shop.frame,x,y+height*.21,z+.082,width,.065,.07,parent);
    box(shop.frame,x,y,z+.084,.058,height,.066,parent);
  }
  function planter(parent,x,z){
    box(0x745648,x,.19,z,.91,.37,.62,parent);
    box(0x946d57,x,.385,z,.99,.10,.71,parent);
    for(const [dx,h,r] of [[-.28,.40,.20],[0,.63,.25],[.28,.45,.19]]){
      cylinder(0x648255,x+dx,.39+h*.35,z,r,h,6,parent,.30);
    }
  }
  function shopModel(shop,group){
    const {width:w,depth:d,height:h,base,walls,frame,roof,shade,stripe}=shop,z=d/2;
    box(walls,0,h/2,0,w,h,d,group);
    box(base,0,.22,0,w+.15,.44,d+.15,group);
    box(roof,0,h+.05,0,w+.40,.27,d+.42,group);
    box(frame,0,h-.20,z+.09,w+.14,.17,.24,group);
    box(base,0,h-.50,z+.075,w+.10,.095,.21,group);
    box(base,0,3.36,z+.045,w,.13,.16,group);
    box(0xa49b82,0,.057,z+.54,w+.55,.12,1.2,group);
    for(const x of [-w*.34,-w*.115,w*.115,w*.34]){
      glass(group,shop,x,h*.75,z+.023,w*.129,h*.20);
      box(base,x,h*.65-.04,z+.12,w*.16,.11,.27,group);
    }
    glass(group,shop,0,1.24,z+.034,1.49,2.23);
    box(0xceab70,.48,1.04,z+.17,.06,.27,.073,group);
    for(const side of [-1,1]){
      const x=side*w*.253;
      glass(group,shop,x,1.47,z+.043,w*.282,1.73);
      box(frame,x,.62,z+.16,w*.302,.15,.32,group);
      box(base,side*w*.442,1.51,z+.09,.19,2.9,.24,group);
      planter(group,side*w*.411,z+.61);
    }
    standSign(T,group,shop.name,shop.subtitle,4.05,0,3.39,z+.17,shop.sign,shop.ink);
    const canopyWidth=w*.79,strips=12;
    for(let i=0;i<strips;i++){
      const x=(i+.5)*canopyWidth/strips-canopyWidth/2,color=i%2===0?shade:stripe;
      box(color,x,2.71,z+.61,canopyWidth/strips+.003,.09,1.16,group).rotation.x=.28;
      box(color,x,2.47,z+1.15,canopyWidth/strips+.003,.18,.07,group);
    }
    if(shop.kind==="coffee"){
      box(roof,0,h+.44,-d*.09,w*.88,.25,d*.67,group).rotation.x=.09;
      for(const x of [-w*.43,w*.43])box(base,x,h*.66,0,.16,h*.65,d+.07,group);
    }else if(shop.kind==="crepe"){
      box(0xeac6b5,0,h+.18,z-.08,w*.82,.43,.17,group);
      const display=makeCrepeModel(T);
      for(const side of [-1,1]){
        box(frame,side*w*.253,.91,z+.135,w*.235,.07,.21,group);
        for(let i=0;i<3;i++){
          const sample=display.clone();
          sample.position.set(side*w*.253+(i-1)*.58,1.16,z+.253);
          sample.rotation.z=(i-1)*.12;
          sample.scale.setScalar(1.28);group.add(sample);
        }
      }
    }else{
      for(const side of [-1,1])for(let row=0;row<6;row++){
        box(row%2?base:0xa57860,side*(w*.477-row%2*.065),.61+row*.37,z+.09,.37,.15,.16,group);
      }
      box(base,w*.33,h+.51,-d*.24,.56,1.2,.58,group);
      box(roof,w*.33,h+1.09,-d*.24,.72,.16,.72,group);
    }
  }
  for(const {shop,x,y,sideX,sideY,angle,centerX,centerY} of shopPlots){
    const group=new T.Group();group.position.set(wx(centerX),0,wz(centerY));group.rotation.y=angle;scene.add(group);
    if(shop.kind==="churu")addConvenienceStore(T,group,{box},shop);
    else shopModel(shop,group);
    batchDetails(group);
    addObstacle(centerX,centerY,shop.width,shop.depth,angle,shop.height+.35);
    for(const side of shop.kind==="churu"?[]:[-1,1]){
      const localX=side*shop.width*.411,localZ=shop.depth/2+.61;
      addObstacle(centerX+localX*Math.cos(angle)+localZ*Math.sin(angle),
        centerY-localX*Math.sin(angle)+localZ*Math.cos(angle),.99,.71,angle,1.05);
    }
    // The threshold stays on the walkable sidewalk, in front of the facade collision.
    const approach=4.05;
    stations.push({kind:shop.kind,name:shop.name,x:x+sideX*approach,y:y+sideY*approach});
  }

  sparklerStandAt(sparklerStand,"분수 스파클","분수 스파클 좌판");
  // A second stall beside the Gyeonghoeru pond in Gyeongbokgung.
  sparklerStandAt(sparklerStall,"경회루 스파클","경회루 스파클 좌판");
  return stations;

  function sparklerStandAt({x,y},title,name){
  const stand=new T.Group();stand.position.set(wx(x),0,wz(y));stand.rotation.y=Math.PI;scene.add(stand);
  box(0xbcb6a3,0,.043,0,4.3,.085,3.4,stand);
  box(0x425847,0,.49,0,2.95,.97,1.32,stand);
  box(0xc7a774,0,1.005,0,3.14,.145,1.48,stand);
  for(const side of [-1,1]){
    box(0x725641,side*1.40,1.31,-.59,.12,2.53,.12,stand);
    box(0x725641,side*1.40,1.31,.58,.12,2.53,.12,stand);
    box(0xc4a56b,side*.98,.58,.675,.51,.42,.024,stand);
  }
  for(let i=0;i<10;i++){
    const color=i%2?0xf3d6a1:0x5c775c;
    box(color,(i-4.5)*.35,2.54,.016,.353,.09,1.83,stand).rotation.x=.12;
    box(color,(i-4.5)*.35,2.37,.91,.353,.18,.075,stand);
  }
  standSign(T,stand,title,"SPARKLER",2.46,0,1.92,.735,"#415b44","#ffe6b0");
  for(let i=0;i<3;i++){
    const bundleX=(i-1)*.75;
    cylinder(0x85654f,bundleX,1.17,0,.16,.23,8,stand,.85);
    for(let j=0;j<5;j++){
      const a=j*Math.PI*2/5;
      const stick=cylinder(0xb8a78c,bundleX+Math.cos(a)*.07,1.41,Math.sin(a)*.07,.018,.46,5,stand);
      stick.rotation.x=Math.sin(a)*.15;stick.rotation.z=Math.cos(a)*.15;
    }
  }
  batchDetails(stand);
  addObstacle(x,y,3.08,1.45,Math.PI,2.62);
  stations.push({kind:"sparkler",name,x,y:y-1.85});
  }
}

export function makeItemProps(T,{box,cylinder,shape}){
  const smallBall=new T.IcosahedronGeometry(1,1),mugHandle=new T.TorusGeometry(.079,.022,5,11);
  const crepeModel=makeCrepeModel(T);
  const warm=new T.MeshBasicMaterial({color:0xffc04f,toneMapped:false});
  const glowCanvas=document.createElement("canvas");glowCanvas.width=glowCanvas.height=32;
  const ctx=glowCanvas.getContext("2d"),fade=ctx.createRadialGradient(16,16,0,16,16,16);
  fade.addColorStop(0,"rgba(255,242,172,1)");fade.addColorStop(.24,"rgba(255,175,63,.7)");
  fade.addColorStop(1,"rgba(255,115,25,0)");
  ctx.fillStyle=fade;ctx.fillRect(0,0,32,32);
  const sparkGlow=new T.SpriteMaterial({
    map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false
  });
  const sparkMaterial=new T.LineBasicMaterial({
    vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false
  });
  const churuLabel=document.createElement("canvas");churuLabel.width=100;churuLabel.height=176;
  const label=churuLabel.getContext("2d");
  label.fillStyle="#f47d66";label.fillRect(0,0,100,176);
  label.fillStyle="#ffd27c";label.fillRect(0,7,100,99);
  label.fillStyle="#fff1ca";
  label.beginPath();label.moveTo(24,72);label.lineTo(23,37);label.lineTo(44,52);label.lineTo(58,52);
  label.lineTo(78,37);label.lineTo(76,76);label.closePath();label.fill();
  label.beginPath();label.ellipse(50,73,26,18,0,0,Math.PI*2);label.fill();
  label.fillStyle="#75414b";label.fillRect(35,66,5,6);label.fillRect(61,66,5,6);label.fillRect(47,76,7,4);
  label.font='bold 35px "Malgun Gothic",sans-serif';label.textAlign="center";label.fillStyle="#fff1ca";
  label.fillText("츄르",50,148,88);
  const churuMap=new T.CanvasTexture(churuLabel);churuMap.colorSpace=T.SRGBColorSpace;
  const churuMaterial=new T.MeshBasicMaterial({map:churuMap,side:T.DoubleSide});
  const churuLabelFace=new T.PlaneGeometry(.072,.147);
  function sphere(group,color,x,y,z,a,b,c){
    const object=shape(smallBall,color,x,y,z,group);object.scale.set(a,b,c);return object;
  }
  function coffee(group){
    cylinder(0xf2e0c4,0,.036,0,.074,.233,12,group,1.24);
    cylinder(0xb47d4c,0,.037,0,.082,.116,12,group,1.10);
    cylinder(0xe3b776,0,.037,0,.087,.025,12,group);
    cylinder(0xeae4d4,0,.155,0,.100,.040,12,group,.96);
    box(0x58483a,0,.179,.049,.035,.01,.024,group);
  }
  function crepe(group){
    group.add(crepeModel.clone());
  }
  function beer(group){
    cylinder(0xdbae6d,0,-.082,0,.091,.035,13,group,1.04);
    cylinder(0xc28c38,0,.020,0,.087,.181,13,group,1.16);
    cylinder(0xf2d589,0,.079,0,.097,.042,13,group,1.045);
    cylinder(0xf0ddbc,0,.117,0,.106,.052,13,group,.96);
    sphere(group,0xf5e8cf,.009,.144,-.006,.087,.033,.085);
    box(0xf0c784,-.041,.023,.088,.016,.151,.011,group);
    const handle=shape(mugHandle,0xe4bf80,.111,.013,0,group);handle.scale.x=.81;
  }
  function churu(group){
    const sleeve=new T.Group();group.add(sleeve);
    const tube=cylinder(0xf2836d,0,.03,0,.044,.220,10,sleeve,.84);
    tube.scale.z=.018;
    box(0xf4c86e,0,-.085,0,.087,.021,.028,sleeve);
    box(0xffd38d,0,.143,0,.064,.018,.027,sleeve);
    for(const side of [-1,1]){
      const wrapper=new T.Mesh(churuLabelFace,churuMaterial);
      wrapper.position.set(0,.022,side*.0185);
      if(side===-1)wrapper.rotation.y=Math.PI;
      sleeve.add(wrapper);
    }
    box(0xf28b74,0,.157,0,.026,.018,.020,group);
    box(0x9a594e,0,.167,0,.021,.005,.015,group);
    const paste=sphere(group,0xe4b283,0,.177,0,.010,.012,.007);
    paste.visible=false;
    return {update(age){
      const squeezing=age>=0?(.5-.5*Math.cos(age*12)):0;
      sleeve.scale.z=1-squeezing*.35;
      paste.visible=age>.13;
      paste.scale.y=.008+squeezing*.007;
    }};
  }
  function sparkler(group){
    cylinder(0x8d8376,0,.166,0,.013,.48,8,group,.74);
    cylinder(0xb5a58c,0,.337,0,.024,.162,8,group,.80);
    const ember=new T.Mesh(smallBall,warm);ember.scale.setScalar(.032);group.add(ember);
    const glow=new T.Sprite(sparkGlow);glow.scale.set(.37,.37,1);group.add(glow);
    const count=32,positions=new Float32Array(count*6),colors=new Float32Array(count*6);
    const geometry=new T.BufferGeometry(),data=new T.BufferAttribute(positions,3),tints=new T.BufferAttribute(colors,3);
    data.setUsage(T.DynamicDrawUsage);tints.setUsage(T.DynamicDrawUsage);
    geometry.setAttribute("position",data);geometry.setAttribute("color",tints);
    const shower=new T.LineSegments(geometry,sparkMaterial);shower.frustumCulled=false;group.add(shower);
    let lastTick=-1;
    function update(age){
      const lit=age>=0&&age<SPARKLER_SECONDS;
      glow.visible=ember.visible=shower.visible=lit;
      if(!lit){lastTick=-1;return;}
      const tick=Math.floor(age*36);
      if(tick===lastTick)return;
      lastTick=tick;
      const tip=.414-age/SPARKLER_SECONDS*.13;
      ember.position.y=tip;glow.position.y=tip;
      const flare=1+Math.sin(age*77)*.19+Math.sin(age*38)*.16;
      glow.scale.set(.38*flare,.38*flare,1);
      for(let i=0;i<count;i++){
        const cycle=age*(1.85+i%5*.2)+i/count,fraction=cycle%1;
        const angle=i*2.399+Math.floor(cycle)*.97;
        const strength=.56+(i%9)*.064,fall=.32*fraction*fraction;
        const dx=Math.cos(angle)*strength,dy=.31+(i%7)*.066,dz=Math.sin(angle)*strength;
        const tail=Math.max(0,fraction-.095),at=i*2;
        data.setXYZ(at,dx*tail,tip+dy*tail-fall*.76,dz*tail);
        data.setXYZ(at+1,dx*fraction,tip+dy*fraction-fall,dz*fraction);
        const heat=(1-fraction)*(i%6===0?1.45:1);
        tints.setXYZ(at,.51*heat,.19*heat,.035*heat);
        tints.setXYZ(at+1,heat,.70*heat,.29*heat);
      }
      data.needsUpdate=tints.needsUpdate=true;
    }
    return {update,dispose:()=>geometry.dispose()};
  }
  const models={coffee,crepe,parfait:crepe,beer,sparkler,churu,...makeRegionalItemProps(T,{box,cylinder,shape}),
    ...makeDiningDishes(T,{box,cylinder,shape})};
  return parent=>{
    const instances=new Map();
    let previous=null;
    function update(kind,activeAge=-1){
      if(previous!==kind){
        const old=instances.get(previous);if(old)old.group.visible=false;
        previous=kind;
        if(Object.hasOwn(models,kind)&&!instances.has(kind)){
          const group=new T.Group();parent.add(group);
          instances.set(kind,{group,...models[kind](group)});
        }
      }
      const item=instances.get(kind);
      if(item){item.group.visible=true;item.update?.(activeAge);}
    }
    update.dispose=()=>{for(const item of instances.values())item.dispose?.();};
    return update;
  };
}
