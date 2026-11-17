import {addLandmarks,addObstacle} from "./layout.js";
import {at as palaceAt,gbSite} from "./gyeongbok-layout.js";
import {plazaAt,plazaShopPlots} from "./plaza-layout.js";
import {bukchonShopPlots} from "./bukchon-layout.js";
import {makeRegionalItemProps} from "./regional-item-props.js";

// Fictional counters beside visitor paths and between the office buildings.
// The Sojubang counter uses its existing courtyard, clear of the heritage hall and gates.
const kitchen=gbSite.sojubang,archive=gbSite.sujeongjeon;
const palaceShops=[
  {kind:"coffee",name:"기와 아래 커피",subtitle:"COFFEE",east:archive.east-26,north:archive.north-6,angle:Math.PI,
    paint:0x426052,sign:"#315046",ink:"#f8e7c4"},
  {kind:"yakgwa",name:"꽃담 한과",subtitle:"YAKGWA",east:79,north:651,angle:-Math.PI/2,
    paint:0x9e624b,sign:"#7f483a",ink:"#fff0ce"},
  {kind:"makgeolli",name:"소주방 막걸리",subtitle:"MAKGEOLLI",east:kitchen.east-5,north:kitchen.north-14,angle:0,
    paint:0x56716b,sign:"#405d58",ink:"#f0e7d1"},
  {kind:"churu",name:"경복궁 편의점",subtitle:"고양이 간식",east:-45.5,north:79,angle:-Math.PI/2,
    paint:0x47746a,sign:"#365c52",ink:"#fff0c9"}
].map(shop=>({...shop,...palaceAt(shop.east,shop.north,shop.name),area:"gyeongbokgung",w:7.1,d:4.4,h:3.81}));
const storefronts={
  coffee:{subtitle:"COFFEE ROASTERS",wall:0x9c9686,paint:0x3d564a,counter:0xa17b56,glass:0xc5d1a4,sign:"#344c42",ink:"#fff2d0"},
  cake:{subtitle:"CAKE & PATISSERIE",wall:0xd8c2ac,paint:0xaa696e,counter:0xdcaaa0,glass:0xf7d1b4,sign:"#f3d9c9",ink:"#723f4a"},
  wine:{subtitle:"WINE BAR",wall:0x957973,paint:0x543b45,counter:0x80574f,glass:0xe0b490,sign:"#573a48",ink:"#f8dba1"},
  bingsu:{subtitle:"팥빙수",wall:0xc3c4b3,paint:0x537d83,counter:0xa1b6b5,glass:0xe8e3cb,sign:"#335860",ink:"#fff2d5"},
  riceCake:{subtitle:"꿀떡",paint:0x876477,sign:"#75445e",ink:"#fff0d4"},
  fruitWine:{subtitle:"매실주",paint:0x55744b,sign:"#415d3c",ink:"#fff3cc"},
  highball:{subtitle:"HIGHBALL",wall:0xa79786,paint:0x405761,counter:0x9f835f,glass:0xdbd6a9,sign:"#324753",ink:"#fae4af"}
};
const avenueShops=plazaShopPlots.map(([kind,name,east,north,width])=>({
  ...(kind==="churu"?{w:7.8,d:5.7,h:3.62}:{w:width??15.94,d:7.2,h:8.4,...storefronts[kind]}),
  ...plazaAt(east,north,name),kind,area:"gwanghwamun",angle:east<0?Math.PI/2:-Math.PI/2
}));
const bukchonShops=[
  ["churu","삼청로 편의점",bukchonShopPlots.churu],
  ["coffee","화개길 커피",bukchonShopPlots.coffee],
  ["riceCake","팔판길 떡집",bukchonShopPlots.crepe],
  ["fruitWine","가회동 매실주",bukchonShopPlots.beer]
].map(([kind,name,plot])=>({...storefronts[kind],...plot,kind,name,area:"bukchon",h:kind==="churu"?3.62:3.81}));
const shops=[...palaceShops,...avenueShops,...bukchonShops];

export const regionalStations=shops.map(({x,y,d,angle,name,kind,area})=>({kind,name,area,
  x:x+Math.sin(angle)*(d/2+1.75),y:y+Math.cos(angle)*(d/2+1.75)}));

export function registerRegionalStands(){
  for(const {x,y,w,d,angle,h,level=0} of shops)addObstacle(x,y,w,d,angle,level+h);
  addLandmarks(regionalStations.map(({x,y,name})=>({x,y,name:name+" 앞"})));
}

export function standSign(T,parent,text,subtitle,width,x,y,z,background,ink,height=width*160/512){
  if(typeof document==="undefined")return;
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=Math.round(512*height/width);
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  const scale=canvas.height/160;
  ctx.fillStyle=background;ctx.fillRect(0,0,512,canvas.height);
  ctx.strokeStyle=ink;ctx.lineWidth=3*scale;ctx.strokeRect(8,8*scale,496,144*scale);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=ink;
  ctx.font=`bold ${Math.round(67*scale)}px "Malgun Gothic", sans-serif`;
  ctx.fillText(text,256,(subtitle?65:80)*scale,472);
  if(subtitle){
    ctx.font=`bold ${Math.round(19*scale)}px "Segoe UI", sans-serif`;ctx.fillText(subtitle,256,124*scale,462);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map}));
  panel.position.set(x,y,z);parent.add(panel);
}

export function addConvenienceStore(T,group,{box},{name,width:w,depth:d,height:h}){
  const z=d/2,cream=0xe8e4d7,teal=0x146761,trim=0x2d5554,glassTint=0x83a8aa;
  box(cream,0,h/2,-.52,w,h,d-1.04,group);
  box(0xc8c4b6,0,.19,-.44,w+.10,.38,d-.72,group);
  box(cream,0,h-.33,0,w,.66,d,group);
  box(0x525f59,0,h+.055,0,w+.28,.18,d+.21,group);
  box(0xb7b7aa,0,.047,z+.57,w+.30,.094,1.16,group);
  box(teal,0,2.93,z+.16,w+.04,.68,.30,group);
  box(0xf4bf54,0,3.26,z+.318,w+.08,.075,.05,group);
  box(0x77c2a8,0,2.62,z+.315,w+.08,.079,.05,group);
  standSign(T,group,name,null,2.12,-.12,2.94,z+.325,"#146761","#fff4d9");
  standSign(T,group,"24시",null,1.27,w*.371,2.94,z+.326,"#f4c35f","#215c53");

  const panes=new T.MeshBasicMaterial({color:glassTint,transparent:true,opacity:.21,depthWrite:false});
  function pane(x,y,width,height,depth=z+.045){
    const window=new T.Mesh(new T.PlaneGeometry(width,height),panes);
    window.position.set(x,y,depth);group.add(window);
  }
  for(const side of [-1,1]){
    const x=side*2.40,sideWidth=2.40;
    box(0xc8c4b6,x,.20,z-.24,sideWidth+.1,.4,.57,group);
    box(cream,side*(w/2-.16),1.43,z-.02,.34,2.49,.21,group);
    box(trim,side*1.19,1.51,z+.052,.10,2.18,.13,group);
    box(trim,side*3.62,1.51,z+.052,.10,2.18,.13,group);
    box(trim,x,.44,z+.052,sideWidth,.10,.13,group);
    box(trim,x,2.53,z+.052,sideWidth,.10,.13,group);
    box(trim,x,1.49,z+.052,.047,2.14,.08,group);
    pane(x,1.49,sideWidth,2.05);
    for(let row=0;row<3;row++){
      const y=.60+row*.53;
      box(0x514c45,x,y,z-.24,2.26,.07,.56,group);
      for(let i=0;i<8;i++){
        const color=[0xf5c359,0x76bfc0,0xf3927b,0xf6ecce,0x82a66c,0xe99fc1][(i+row+side+1)%6];
        const height=.14+(i+row*2)%3*.055;
        box(color,x+(i-3.5)*.267,y+.044+height/2,z-.13,.16,height,.12,group);
      }
    }
  }
  for(const x of [-.92,0,.92])box(trim,x,1.31,z+.095,.075,2.45,.11,group);
  box(trim,0,2.53,z+.095,1.89,.08,.11,group);
  box(trim,0,.085,z+.095,1.89,.10,.11,group);
  pane(0,1.30,1.81,2.33,z+.101);
  box(0x9baca5,0,1.04,z+.128,1.81,.105,.027,group);
  for(const x of [-.153,.153])box(0xe2e5db,x,1.20,z+.154,.040,.20,.042,group);
  standSign(T,group,"츄르",null,.75,2.85,1.98,z+.094,"#f4c35f","#3d4c47");
}

export function standBatcher(T){
  const finish=new T.MeshStandardMaterial({roughness:.88});
  return function batchStand(group){
    const batches=new Map();
    for(const part of group.children){
      if(part.isInstancedMesh||!part.material?.isMeshStandardMaterial||part.material.transparent||part.material.emissiveIntensity>1)continue;
      if(!batches.has(part.geometry))batches.set(part.geometry,[]);
      batches.get(part.geometry).push(part);
    }
    for(const [geometry,parts] of batches){
      if(parts.length<3)continue;
      const batch=new T.InstancedMesh(geometry,finish,parts.length);
      parts.forEach((part,i)=>{
        part.updateMatrix();batch.setMatrixAt(i,part.matrix);batch.setColorAt(i,part.material.color);
      });
      batch.computeBoundingSphere();group.remove(...parts);group.add(batch);
    }
  };
}

function addBoothRoof(T,group,{matte},w,d){
  const width=w+.86,depth=d+.89,columns=24,rows=12;
  function roofHeight(x,z){
    const side=Math.abs(x)/(width/2),eave=Math.abs(z)/(depth/2);
    const pitch=Math.max(eave,Math.max(0,(side-.73)/.27)*.76);
    return 2.72+.89*(1-pitch)**1.6+.20*side**5*eave**2;
  }
  const positions=[],indices=[];
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
    const x=width*(col/columns-.5),z=depth*(row/rows-.5);
    positions.push(x,roofHeight(x,z),z);
    if(row===rows||col===columns)continue;
    const i=row*(columns+1)+col,j=i+columns+1;
    indices.push(i,j,i+1,j,j+1,i+1);
  }
  const shell=new T.BufferGeometry();shell.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  shell.setIndex(indices);shell.computeVertexNormals();
  const cover=new T.Mesh(shell,matte(0x424944));cover.castShadow=true;cover.receiveShadow=true;group.add(cover);

  const seams=33,sections=10,colors=[0x575d56,0x515854,0x636760,0x4b534f];
  const tiles=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,7),matte(0xffffff),seams*sections);
  const tint=new T.Color(),axis=new T.Vector3(0,1,0),a=new T.Vector3(),b=new T.Vector3(),heading=new T.Vector3();
  const rib=new T.Object3D();
  for(let i=0;i<seams;i++)for(let j=0;j<sections;j++){
    const x=width*(i/(seams-1)-.5),z0=depth*(j/sections-.5),z1=depth*((j+1)/sections-.5);
    a.set(x,roofHeight(x,z0)+.035,z0);b.set(x,roofHeight(x,z1)+.035,z1);
    heading.subVectors(b,a);rib.position.copy(a).lerp(b,.5);
    rib.scale.set(.052,heading.length()+.022,.052);rib.quaternion.setFromUnitVectors(axis,heading.normalize());
    rib.updateMatrix();tiles.setMatrixAt(i*sections+j,rib.matrix);
    tiles.setColorAt(i*sections+j,tint.setHex(colors[(i+Math.floor(j*.5))%colors.length]));
  }
  tiles.computeBoundingSphere();group.add(tiles);
}

export function addRegionalStands(T,root,kit,area){
  const {wx,wz,box,cylinder}=kit;
  const group=new T.Group();
  group.name={gyeongbokgung:"경복궁 산책길 좌판",gwanghwamun:"세종대로 상가",bukchon:"북촌 골목 상점"}[area];
  root.add(group);
  const batch=standBatcher(T),props=makeRegionalItemProps(T,kit);
  for(const shop of shops){
    if(shop.area!==area)continue;
    const building=new T.Group();building.name=shop.name;
    building.position.set(wx(shop.x),shop.level??(area==="gyeongbokgung"?.048:0),wz(shop.y));building.rotation.y=shop.angle;
    group.add(building);
    if(area==="gwanghwamun"){
      // The shell stays level at the entrance; its basement closes the gap to
      // the pavement under all four corners on the graded avenue.
      const width=shop.kind==="churu"?shop.w:15.94;
      box(0x888278,0,-.34,0,width,.69,shop.d,building);
    }
    if(area==="gyeongbokgung")booth(shop,building);
    else if(shop.kind==="churu")addConvenienceStore(T,building,kit,{name:shop.name,width:shop.w,depth:shop.d,height:shop.h});
    else if(area==="bukchon")booth(shop,building);
    else{
      building.scale.x=shop.w/15.94;
      avenue({...shop,w:15.94},building);
    }
    batch(building);
  }

  function sample(kind,parent,x,y,z,size=1){
    if(kind==="coffee"){
      cylinder(0xeee4c6,x,y-.096*size,z,.095*size,.026*size,14,parent);
      cylinder(0xece0be,x,y,z,.070*size,.166*size,14,parent,1.22);
      cylinder(0x7a4b33,x,y+.086*size,z,.078*size,.011*size,14,parent);
      return;
    }
    if(kind==="churu"){
      box(0xe68674,x,y,z,.085*size,.19*size,.035*size,parent);
      box(0xffd388,x,y+.053*size,z+.020*size,.074*size,.065*size,.008*size,parent);
      box(0xf9e3b7,x,y-.069*size,z+.020*size,.064*size,.023*size,.008*size,parent);
      return;
    }
    const display=new T.Group();display.position.set(x,y,z);display.scale.setScalar(size);parent.add(display);props[kind](display);
  }
  function clayJar(parent,x,z,scale=1){
    cylinder(0x8c644a,x,.23*scale,z,.31*scale,.46*scale,14,parent,1.23);
    cylinder(0x956b50,x,.53*scale,z,.38*scale,.19*scale,14,parent,.70);
    cylinder(0xb58c63,x,.64*scale,z,.27*scale,.045*scale,14,parent);
  }
  function booth(shop,parent){
    const {w,d,paint}=shop,front=d/2,wood=0x6a4936,lightWood=0xab7f53;
    box(0xb6af9d,0,-.020,1.28,w+.68,.055,d+3.15,parent);
    for(const x of [-2.24,0,2.24])box(0xa79e8b,x,.008,front+1.16,.024,.006,2.56,parent);
    box(0xa79e8b,0,.008,front+1.45,w+.46,.006,.028,parent);
    box(0xb8ac94,0,.076,0,w,.15,d,parent);
    box(0x6a4a3b,0,.164,0,w-.32,.10,d-.31,parent);
    box(0xd6ba8d,0,1.48,-front+.24,w-.67,2.56,.19,parent);
    for(let i=0;i<7;i++){
      const x=(i-3)*.92;
      box(wood,x,1.50,-front+.35,.068,2.55,.072,parent);
      box(0xe8d5a6,x,1.80,-front+.37,.73,1.03,.043,parent);
      for(let k=-1;k<=1;k++)box(0xa07653,x+k*.17,1.80,-front+.4,.030,1.04,.034,parent);
    }
    for(const y of [.93,1.28,2.28])box(wood,0,y,-front+.39,w-.55,.066,.082,parent);
    for(const side of [-1,1]){
      const x=side*(w/2-.27);
      for(const z of [-front+.25,front-.30]){
        box(0x938373,x,.20,z,.36,.32,.35,parent);
        box(wood,x,1.52,z,.21,2.69,.20,parent);
        box(paint,x,2.57,z,.31,.22,.30,parent);
      }
      box(wood,x,2.62,0,.27,.21,d-.22,parent);
      box(0xc2a178,x,.82,-.82,.11,1.23,2.52,parent);
      for(let i=0;i<6;i++)box(lightWood,x-side*.07,.83,-1.90+i*.41,.036,1.19,.044,parent);
      box(wood,x,.38,-.82,.13,.065,2.56,parent);
      box(wood,x,1.40,-.82,.13,.070,2.56,parent);
      cylinder(0xf0ce89,side*2.54,2.12,front-.15,.15,.30,8,parent,1.05);
      for(const y of [1.96,2.27])cylinder(wood,side*2.54,y,front-.15,.145,.048,8,parent);
      box(wood,side*2.54,2.40,front-.15,.029,.24,.028,parent);
    }
    for(const z of [-front+.26,front-.22])box(paint,0,2.60,z,w+.12,.24,.27,parent);
    const counterFront=front-.26;
    box(paint,0,.57,counterFront-.30,w-1.13,.91,.78,parent);
    box(lightWood,0,1.08,counterFront-.31,w-.87,.14,.95,parent);
    for(let i=0;i<9;i++){
      const x=(i-4)*.61;
      box(wood,x,.58,counterFront+.108,.045,.64,.038,parent);
    }
    box(lightWood,0,.36,counterFront+.11,w-1.16,.095,.07,parent);
    box(wood,0,2.355,front-.09,3.34,.72,.12,parent);
    standSign(T,parent,shop.name,shop.subtitle,3.24,0,2.355,front-.018,shop.sign,shop.ink,.63);
    const trayColor=shop.kind==="yakgwa"?0xb47d4d:0xc3a370;
    for(const x of [-1.36,0,1.36]){
      box(trayColor,x,1.164,front-.50,.89,.035,.62,parent);
      for(const dx of [-.24,.24])sample(shop.kind,parent,x+dx,1.26,front-.52,1.16);
    }
    if(shop.kind==="churu"){
      box(0x705038,1.96,1.40,front-.42,.85,.47,.17,parent);
      standSign(T,parent,"츄르",null,.78,1.96,1.40,front-.327,"#e5bc76","#3b4e43",.40);
    }
    if(shop.kind==="makgeolli")for(const [x,z,s] of [[-2.65,.65,1.22],[2.47,.45,1.46],[2.88,-.51,1.08]])clayJar(parent,x,z,s);
    if(shop.kind==="yakgwa")for(const x of [-2.35,2.35]){
      box(0xb77f56,x,1.24,front-.64,.57,.19,.42,parent);
      box(0xdec49a,x,1.342,front-.64,.58,.037,.43,parent);
    }
    if(shop.kind==="coffee")for(const x of [-2.4,2.4]){
      box(0x574b3e,x,1.38,front-.77,.56,.43,.42,parent);
      cylinder(0xb3aaa0,x,1.63,front-.77,.16,.13,10,parent);
    }
    addBoothRoof(T,parent,kit,w,d);
    box(0x50554e,0,3.65,0,w*.74,.13,.26,parent);
  }

  function avenue(shop,parent){
    const {w,d,wall,paint,counter,glass}=shop,front=d/2,lintel=4.26;
    box(0xbcb2a0,0,.087,0,w,.17,d,parent);
    box(wall,0,2.24,-front+.15,w,4.2,.30,parent);
    for(const side of [-1,1])box(wall,side*(w/2-.205),2.24,0,.41,4.2,d,parent);
    box(wall,0,6.27,0,w,4.26,d,parent);
    box(0xb6ab9b,0,8.30,front+.06,w+.04,.21,.26,parent);
    box(0xa69b8a,0,4.35,front+.058,w,.18,.23,parent);
    for(const x of [-5.6,-2.8,0,2.8,5.6]){
      box(paint,x,6.38,front+.033,2.20,2.63,.075,parent);
      box(0x526867,x,6.38,front+.077,2.03,2.43,.027,parent);
      box(0x7c8e87,x,6.83,front+.096,1.98,1.45,.020,parent);
      box(wall,x,5.02,front+.11,2.32,.11,.24,parent);
      box(0x596867,x,6.38,front+.103,.075,2.44,.045,parent);
    }
    box(paint,0,3.84,front+.027,w-.35,.85,.16,parent);
    standSign(T,parent,shop.name,shop.subtitle,5.0,0,3.84,front+.113,shop.sign,shop.ink,.73);
    box(counter,0,.39,front+.055,w-.43,.45,.20,parent);
    for(const x of [-7.35,-5.25,-3.05,-1.14,1.14,3.05,5.25,7.35])box(paint,x,1.91,front+.07,.14,2.67,.17,parent);
    for(const x of [-4.30,0,4.30])box(paint,x,3.16,front+.07,x===0?2.29:5.9,.085,.17,parent);
    box(paint,0,1.88,front-.016,1.98,2.57,.14,parent);
    box(0x696f66,0,1.87,front+.063,1.73,2.38,.024,parent);
    box(0xd8b77a,0,1.35,front+.12,.24,.079,.075,parent);
    box(0xa79a83,0,.19,front+.08,2.29,.15,.25,parent);

    for(const side of [-1,1]){
      const x=side*4.32;
      box(glass,x,1.95,front-1.25,5.68,2.37,.065,parent);
      box(counter,x,.95,front-.67,5.37,.12,.82,parent);
      box(paint,x,.62,front-.85,5.25,.55,.62,parent);
      for(const dx of [-2,-1,0,1,2])sample(shop.kind,parent,x+dx,1.15,front-.46,1.24);
    }
    const awningColors=shop.kind==="cake"?[0xe0a2a3,0xf5dbcb]:[paint,counter];
    for(let i=0;i<18;i++){
      const x=(i-8.5)*.77,color=awningColors[shop.kind==="cake"?i%2:0];
      box(color,x,3.36,front+.48,.774,.07,1.08,parent).rotation.x=.19;
      if(shop.kind==="cake"){
        const trim=cylinder(color,x,3.26,front+1.02,.387,.052,12,parent);
        trim.rotation.x=Math.PI/2;trim.scale.z=.30;
      }else box(awningColors[1],x,3.25,front+.98,.774,.078,.085,parent);
    }
    if(shop.kind==="wine"){
      for(const y of [1.47,2.12,2.70])for(const side of [-1,1]){
        box(paint,side*4.26,y,front-.98,5.54,.052,.47,parent);
        for(let i=0;i<10;i++){
          const x=side*4.26+(i-4.5)*.52,color=[0x4d5440,0x694638,0x524238][i%3];
          cylinder(color,x,y+.15,front-.85,.081,.25,10,parent,.95);
          cylinder(color,x,y+.29,front-.85,.077,.054,10,parent,.41);
          cylinder(0xb8906b,x,y+.35,front-.85,.033,.085,8,parent);
          box(0xc3aa8a,x,y+.13,front-.763,.103,.092,.011,parent);
        }
      }
    }else if(shop.kind==="coffee"){
      box(0x6e6a5c,-4.46,1.42,front-.85,1.35,.75,.54,parent);
      box(0xa8aaa2,-4.46,1.51,front-.54,1.16,.43,.10,parent);
      for(const dx of [-.35,.35]){
        cylinder(0x463f37,-4.46+dx,1.28,front-.44,.096,.075,10,parent);
        box(0x4a3c31,-4.46+dx,1.30,front-.34,.062,.044,.18,parent);
      }
      for(const x of [3.05,4.30,5.55])box(paint,x,2.55,front-.93,1.03,.65,.043,parent);
    }else{
      for(const x of [-4.1,4.1]){
        box(0xf0d1c4,x,.96,front-.34,4.64,.12,.11,parent);
        box(0xd0a19a,x,1.29,front-.57,4.63,.045,.51,parent);
        box(0xdfb5a7,x,1.56,front-.72,4.63,.045,.40,parent);
      }
    }
    box(wall,0,lintel,front-.09,w-.20,.12,.48,parent);
  }
  return group;
}
