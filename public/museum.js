import {addObstacle,courtAngle,gate,hall,pavilions,stoneHall} from "./layout.js";
import {isInsideMuseum,museumBounds,museumHall,museumGalleries,museumGalleryAt,museumInteriorOffsetY} from "./visit-layout.js";
import {museumArtUrl,museumExhibits} from "./museum-catalog.js";
import {createMuseumObject} from "./museum-objects.js";

export {isInsideMuseum,museumBounds};

const museum=pavilions.find(pavilion=>pavilion.kind==="western");
const donneok=pavilions.find(pavilion=>pavilion.kind==="redBrick");
const pavilionNamed=name=>pavilions.find(pavilion=>pavilion.name===name);

export function fromBuilding(site,x,z,angle=site.angle??0){
  const c=Math.cos(angle),s=Math.sin(angle);
  return {x:site.x+x*c+z*s,y:site.y-x*s+z*c};
}
function toBuilding(site,point,angle=site.angle??0){
  const dx=point.x-site.x,dy=point.y-site.y,c=Math.cos(angle),s=Math.sin(angle);
  return [dx*c-dy*s,dx*s+dy*c];
}

export const museumOutsideDoor={
  ...fromBuilding(museum,0,museum.d*.19+.75),
  heading:(museum.angle*180/Math.PI+360)%360
};
export const museumInsideDoor={x:80,y:92.5+museumInteriorOffsetY,heading:180};
export const museumInsideSpawn={x:80,y:89.4+museumInteriorOffsetY,heading:0};

function ramp(profile,z){
  for(let i=1;i<profile.length;i++){
    const [a,low]=profile[i-1],[b,high]=profile[i];
    if(z>=a&&z<=b)return low+(high-low)*(z-a)/(b-a);
  }
  return null;
}

// Local z values follow the modeled and surveyed front treads, in metres.
const stoneSteps=[[10.3,2.91],[12.5,2.85],[14.5,1.93],[16.5,.97],[18.5,.14],[19.2,0]];
const museumSteps=[[museum.d*.19, museum.h*.231],[museum.d*.32,museum.h*.231],[museum.d*.494,0]];
const porch=donneok.d*.445;
const donneokSteps=[[donneok.d*.33,donneok.h*.077],[porch,donneok.h*.077],[porch+donneok.d*.045,0]];
const doorSteps=[[-4.65,0],[-4.30,.29],[4.30,.29],[4.65,.20],[12.8,.20],[13.53,0]];
const outerHallSteps=[[27.15,1],[27.5,.95],[28,.63],[28.5,.35],[29.06,0]];
const upperHallSteps=[[22.65,1.82],[23.48,1.34],[24.06,1.06]];
export const hallTerraceHeight=(upper,z)=>upper?1.82+(22.65-z)*.022:1+(27.2-z)*.014;
const steps=[
  {site:stoneHall,half:6.65,profile:stoneSteps},
  {site:museum,half:6.92,profile:museumSteps},
  {site:donneok,half:3.4,profile:donneokSteps},
  {site:gate,angle:Math.PI/2,half:3.95,profile:doorSteps},
  {site:pavilionNamed("정관헌"),half:1.85,profile:[[6.1,.89],[8,.86],[8.5,.56],[9.1,.18],[9.65,0]]},
  {site:pavilionNamed("석어당"),half:1.75,profile:[[4.1,1.08],[5,1.06],[5.5,.62],[6,.38],[6.55,0]]},
  {site:pavilionNamed("함녕전"),half:1.8,profile:[[8,1.39],[9.5,1.36],[10,.87],[10.5,.60],[11.17,0]]},
  ...["광명문","융안문"].map(name=>{
    const site=pavilionNamed(name);
    return {site,half:site.w/6-.28,
      profile:[[-site.d/2-.8,0],[-site.d/2-.35,.39],[site.d/2+.35,.39],[site.d/2+.8,0]]};
  })
];

export const pavilionStairAccess=new Map([
  ["정관헌",{width:4.0,front:6.1}],
  ["석어당",{width:3.8,front:4.1}]
]);

export function stairHeight(point){
  const [hallX,hallZ]=toBuilding(hall,point,courtAngle),absX=Math.abs(hallX+.25);
  if(absX<=3.58){
    const y=ramp(outerHallSteps,hallZ)??ramp(upperHallSteps,hallZ);
    if(y!==null)return y;
  }
  // Inside the throne hall the floor is level.
  if(Math.abs(hallX)<=9.1&&Math.abs(hallZ)<=8.6)return 2.2;
  if(absX<=19.87&&hallZ>=-15.3&&hallZ<=27.2){
    return hallTerraceHeight(absX<=13.55&&hallZ>=-8.5&&hallZ<=22.65,hallZ);
  }
  for(const {site,angle,half,profile} of steps){
    if(Math.abs(point.x-site.x)>45||Math.abs(point.y-site.y)>45)continue;
    const [x,z]=toBuilding(site,point,angle);
    if(Math.abs(x)<=half){
      const y=ramp(profile,z);
      if(y!==null)return y;
    }
  }
  return null;
}

const galleryColors={
  silla:{wall:0xded1bb,rug:0x8c614e,sign:"#624337"},
  goryeo:{wall:0xd4dfd1,rug:0x5c796b,sign:"#3c6557"},
  joseon:{wall:0xeee4d2,rug:0x9a7650,sign:"#795741"},
  modern:{wall:0xdadfe1,rug:0x536c7a,sign:"#3e576b"}
};
const framedExhibits=[
  ["goryeo-avalokiteshvara","goryeo",61.6,48.20,2.00,3.90,0],
  ["inwang","joseon",91.9,48.20,5.10,2.94,0],
  ["irwol","joseon",103.9,48.20,6.31,2.73,0],
  ["ssireum","joseon",110.80,58.9,2.68,3.19,-Math.PI/2],
  ["chochung","joseon",101.6,68.80,2.76,3.08,Math.PI],
  ["imperial-banquet","modern",110.80,81.9,4.27,3.70,-Math.PI/2],
  ["baegak","modern",98.1,93.80,1.49,3.90,Math.PI]
];
const casedExhibits=[
  ["silla-cup","silla",61.5,77.6],
  ["goryeo-celadon","goryeo",63.8,55.6],
  ["joseon-moon","joseon",93.0,62.8],
  ["joseon-buncheong","joseon",102.3,57.5]
];

const wallSpots={
  silla:[[55.6,69.2,4.5,0],[65.4,69.2,4.5,0],[56.8,93.8,5.8,Math.PI],[67.2,93.8,5.7,Math.PI],
    [49.2,73.3,4.8,Math.PI/2],[49.2,89.2,4.8,Math.PI/2]],
  goryeo:[[49.2,54.0,5.6,Math.PI/2],[49.2,63.3,5.6,Math.PI/2],[56.9,68.8,5.8,Math.PI],
    [67.3,68.8,5.8,Math.PI],[69.5,48.2,5.0,0],[54.5,48.2,5.0,0]],
  joseon:[[110.8,52.6,5.5,-Math.PI/2],[92.4,68.8,6.5,Math.PI],[110.8,65.0,5.5,-Math.PI/2],
    [85.5,52.8,5.8,Math.PI/2],[85.5,65.0,5.4,Math.PI/2],[107.1,68.8,3.9,Math.PI],[97.6,48.2,5.6,0]],
  modern:[[91.5,69.2,6.1,0],[102.6,69.2,6.6,0],[110.8,73.9,5.3,-Math.PI/2],
    [110.8,89.7,5.2,-Math.PI/2],[91.0,93.8,5.5,Math.PI],[105.0,93.8,6.0,Math.PI]]
};
const floorSpots={
  silla:[[54,74],[67.7,74],[53.5,82],[63,84],[68,87],[53.5,90],[61,90]],
  goryeo:[[59.8,61.7],[65.9,63.0],[55.3,55.8]],
  joseon:[[99.4,64.1],[94.4,54.7],[105.7,62.4]],
  modern:[[96.0,80.1],[101.1,86.5],[104.4,77.0]]
};
for(const {id:gallery} of museumGalleries){
  let wall=0,floor=0;
  for(const [id,exhibit] of Object.entries(museumExhibits)){
    if(exhibit.gallery!==gallery)continue;
    if(exhibit.object){
      casedExhibits.push([id,gallery,...floorSpots[gallery][floor++]]);
    }else{
      const [x,z,width,rotation]=wallSpots[gallery][wall++];
      const ratio=exhibit.ratio??1,height=Math.min(3.44,width/ratio);
      framedExhibits.push([id,gallery,x,z,height*ratio,height,rotation]);
    }
  }
}

const {minX,maxX,minY,maxY}=museumBounds;
const midX=(minX+maxX)/2,midY=(minY+maxY)/2,width=maxX-minX,depth=maxY-minY;
const doorHalf=museumHall.doorWidth/2,wallHeight=5.2;
const museumWalls=[
  [midX,minY,width,.34,0xe9dfcb],[midX,maxY,width,.34,0xe9dfcb],
  [minX,midY,.34,depth,0xe9dfcb],[maxX,midY,.34,depth,0xe9dfcb],
  ...[(minX+museumHall.minX)/2,(museumHall.maxX+maxX)/2].map(x=>
    [x,museumHall.splitY,museumHall.minX-minX,.32,0xdfd5c3]),
  ...museumGalleries.flatMap(({id,doorX,doorY,minY:front,maxY:back})=>
    [[front,doorY-doorHalf],[doorY+doorHalf,back]].map(([start,end])=>
      [doorX,(start+end)/2,.32,end-start,galleryColors[id].wall]))
];

export function addMuseum(T,scene,{wx,wz}){
  registerMuseumNavigation();
  const build=assembleMuseum(T,scene,{wx,wz});
  let step=build.next();
  while(!step.done)step=build.next();
  return step.value;
}

export function registerMuseumNavigation(){
  for(const [x,z,w,d] of museumWalls)addObstacle(x,z,w,d,0,wallHeight);
  for(const [, ,x,z] of casedExhibits)addObstacle(x,z+museumInteriorOffsetY,2.48,2.28,0,2.60);
}

export function* assembleMuseum(T,scene,{wx,wz}){
  const room=new T.Group();room.name="덕수궁 미술관";room.visible=false;scene.add(room);
  const boxGeometry=new T.BoxGeometry(1,1,1),colors=new Map(),exhibits=[],artworkMeshes=[];
  const relicGroups=new Map(museumGalleries.map(({id})=>{
    const group=new T.Group();room.add(group);return [id,group];
  }));
  function block(color,x,y,z,w,h,d,rotation=0){
    if(!colors.has(color))colors.set(color,new T.MeshBasicMaterial({color,toneMapped:false}));
    const mesh=new T.Mesh(boxGeometry,colors.get(color));room.add(mesh);
    mesh.position.set(wx(x),y,wz(z));mesh.scale.set(w,h,d);mesh.rotation.y=rotation;
    return mesh;
  }
  function panel(map,x,y,z,w,h,rotation=0){
    const material=new T.MeshBasicMaterial({color:0xffffff,map,toneMapped:false});
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),material);room.add(mesh);
    mesh.position.set(wx(x),y,wz(z));mesh.rotation.y=rotation;return mesh;
  }
  function artworkLabel(lines,back,ink,x,y,z,w,h,rotation=0){
    const canvas=document.createElement("canvas");
    canvas.width=512;canvas.height=160;
    const context=canvas.getContext("2d");
    context.fillStyle=back;context.fillRect(0,0,512,160);
    context.textAlign="center";context.textBaseline="middle";
    context.fillStyle=ink;context.font='600 46px "Malgun Gothic", sans-serif';
    context.fillText(lines[0],256,lines.length===1?81:60,474);
    if(lines.length>1){
      context.font='27px "Malgun Gothic", sans-serif';
      context.fillText(lines[1],256,115,474);
    }
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    return panel(map,x,y,z,w,h,rotation);
  }
  const canvas=document.createElement("canvas");canvas.width=canvas.height=256;
  const ctx=canvas.getContext("2d"),oak=["#966648","#936247","#8c5b41","#a1704c","#996846","#916344"];
  for(let row=0;row<8;row++){
    for(let col=-1;col<4;col++){
      const left=col*86+(row%2)*43,top=row*32;
      ctx.fillStyle=oak[(row*7+col+1)%oak.length];ctx.fillRect(left,top,86,32);
      ctx.fillStyle="#775038";ctx.fillRect(left,top,86,1);ctx.fillRect(left,top,1,32);
      ctx.fillStyle="#b17d534f";
      for(let i=0;i<5;i++)ctx.fillRect(left+((i*17+row*3)%26),top+4+i*5,45+(i%3)*8,1);
    }
  }
  const floorMap=new T.CanvasTexture(canvas);floorMap.colorSpace=T.SRGBColorSpace;
  floorMap.wrapS=floorMap.wrapT=T.RepeatWrapping;floorMap.repeat.set(17,13);floorMap.anisotropy=4;
  panel(floorMap,midX,.012,midY,width+.25,depth+.25).rotation.x=-Math.PI/2;
  block(0xf0e8d9,midX,5.2,midY,width,.16,depth);
  for(const [x,z,w,d,color] of museumWalls){
    block(color,x,wallHeight/2,z,w,wallHeight,d);
    block(0x635346,x,.14,z,w+.05,.28,d+.05);
    block(0xf4ebda,x,4.94,z,w+.07,.21,d+.07);
  }
  for(const gallery of museumGalleries){
    const {id,doorX,doorY,minY:front,maxY:back}=gallery,theme=galleryColors[id];
    const centerX=(gallery.minX+gallery.maxX)/2,centerY=(front+back)/2;
    block(theme.rug,centerX,.028,centerY,19.2,.026,14.1);
    block(0xb5986e,centerX,.029,centerY,18.65,.027,13.55);
    block(theme.rug,centerX,.031,centerY,18.43,.028,13.33);
    for(const direction of [-1,1]){
      block(theme.rug,doorX,2.1,doorY+direction*(doorHalf+.09),.44,4.20,.23);
    }
    block(theme.rug,doorX,3.98,doorY,.36,.96,museumHall.doorWidth+.37);
    const signRotation=gallery.side==="west"?Math.PI/2:-Math.PI/2;
    const signFace=gallery.side==="west"?.195:-.195;
    artworkLabel([gallery.name,gallery.theme],theme.sign,"#fff2d7",doorX+signFace,3.98,doorY,5.5,.84,signRotation);
    artworkLabel([gallery.name],theme.sign,"#fff2d7",doorX-signFace,3.98,doorY,5.5,.84,signRotation+Math.PI);
    for(const x of [centerX-6.2,centerX+6.2])for(const z of [centerY-4.5,centerY+4.5]){
      block(0x65594b,x,4.90,z,2.50,.14,.24);
      block(0xffedd0,x,4.81,z,2.39,.07,.16);
    }
  }
  // The doorway is a visual marker for the shared room transition.
  block(0x413930,midX,1.76,maxY-.23,2.75,3.52,.20);
  block(0x8e6246,midX-.66,1.57,maxY-.35,1.27,2.95,.10);
  block(0x8e6246,midX+.66,1.57,maxY-.35,1.27,2.95,.10);
  block(0xc9a971,midX-.17,1.34,maxY-.43,.10,.26,.12);
  block(0xc9a971,midX+.17,1.34,maxY-.43,.10,.26,.12);
  artworkLabel(["정원으로 나가기"],"#395046","#fff4da",midX,3.81,maxY-.24,2.85,.52,Math.PI);
  block(0x334d44,midX,4.16,84.7+museumInteriorOffsetY,9.1,1.0,.27);
  artworkLabel(["덕수궁 전시관","삼국·통일신라부터 근대까지"],"#334d44","#fff1d1",midX,4.16,84.85+museumInteriorOffsetY,8.8,.9);
  artworkLabel(["← 고려관   조선관 →"],"#e9dfcb","#473b2d",midX,2.8,minY+.20,8.0,.70);

  const keyLight=new T.DirectionalLight(0xffe5c4,2.3);
  keyLight.position.set(8,16,10);room.add(keyLight);
  const fillLight=new T.DirectionalLight(0xdce8f5,.74);
  fillLight.position.set(-10,8,-5);room.add(fillLight);
  for(const [index,[id,gallery,x,localZ,w,h,rotation]] of framedExhibits.entries()){
    if(index%8===0)yield;
    const z=localZ+museumInteriorOffsetY;
    const exhibit=museumExhibits[id],{file,title,credit}=exhibit;
    const y=h>3.5?2.85:2.64,s=Math.sin(rotation),c=Math.cos(rotation);
    block(0x78654e,x,y,z,w+.34,h+.34,.11,rotation);
    block(0x3d3027,x+s*.075,y,z+c*.075,w+.22,h+.22,.09,rotation);
    block(0xcbb186,x+s*.13,y,z+c*.13,w+.10,h+.10,.07,rotation);
    const picture=panel(null,x+s*.179,y,z+c*.179,w,h,rotation);
    picture.material.color.setHex(0xe8ddc6);
    artworkMeshes.push({file,picture});
    artworkLabel([title,credit],"#f5eedf","#3f362a",x+s*.060,y-h/2-.39,z+c*.060,
      Math.max(2.7,w*.59),.58,rotation);
    exhibits.push({...exhibit,id,gallery,x:x+s*2.7,y:z+c*2.7,radius:2.25});
  }
  const glassGeometry=new T.BoxGeometry(1.88,1.66,1.88);
  const edges=new T.EdgesGeometry(glassGeometry);
  const glassMaterial=new T.MeshBasicMaterial({color:0xc9e3e0,transparent:true,opacity:.09,depthWrite:false});
  const edgeMaterial=new T.LineBasicMaterial({color:0xa6bbb1,transparent:true,opacity:.53});
  for(const [index,[id,gallery,x,localZ]] of casedExhibits.entries()){
    if(index%6===0)yield;
    const z=localZ+museumInteriorOffsetY;
    const exhibit=museumExhibits[id],theme=galleryColors[gallery];
    block(0x3b3d37,x,.12,z,2.48,.24,2.28);
    block(theme.rug,x,.47,z,2.32,.70,2.10);
    block(0xf2e8d5,x,.85,z,2.40,.15,2.18);
    const object=createMuseumObject(T,exhibit.object);
    object.position.set(wx(x),.93,wz(z));relicGroups.get(gallery).add(object);
    const glass=new T.Mesh(glassGeometry,glassMaterial);
    glass.position.set(wx(x),1.756,wz(z));room.add(glass);
    const outline=new T.LineSegments(edges,edgeMaterial);
    outline.position.copy(glass.position);room.add(outline);
    artworkLabel([exhibit.title,"확대 재현 · "+exhibit.credit],theme.sign,"#fff1d1",x,.59,z+1.073,2.20,.43).rotation.x=-.10;
    exhibits.push({...exhibit,id,gallery,x,y:z,radius:3.15});
  }
  let loaded=false;
  function setVisible(visible){
    room.visible=visible;
    if(!visible||loaded)return;
    loaded=true;
    const loader=new T.TextureLoader();
    for(const {file,picture} of artworkMeshes)loader.load(museumArtUrl(file),map=>{
      map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
      picture.material.map=map;picture.material.color.setHex(0xffffff);picture.material.needsUpdate=true;
    },undefined,error=>console.warn("Artwork unavailable",file,error));
  }
  return {
    outsideDoor:museumOutsideDoor,insideDoor:museumInsideDoor,insideSpawn:museumInsideSpawn,
    isInside:isInsideMuseum,floorAt:stairHeight,setVisible,exhibits,
    update(_clock,_light,_service,visitor){
      if(!visitor)return;
      const nearby=museumGalleryAt(visitor.x,visitor.y)?.id;
      for(const gallery of museumGalleries){
        relicGroups.get(gallery.id).visible=nearby===gallery.id||Math.hypot(visitor.x-gallery.doorX,visitor.y-gallery.doorY)<18;
      }
    }
  };
}
