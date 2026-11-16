import {mmcaExhibits,mmcaGalleryRooms,mmcaVenue,mmcaWalls} from "./mmca-gallery-layout.js";
import {addHirstWork} from "./mmca-hirst.js";
import {buildMueckSculpture} from "./mmca-mueck.js";
import {addExtraMuseumWork} from "./mmca-extra-works.js";
import {addGuestMuseumWork} from "./mmca-guest-works.js";

const finish={walls:0xe8e6e1,ceiling:0x5d6064,metal:0x353a41,trim:0x777c7e};
const exhibitColors={home:0xa2c7c1,"home-passage":0xc4a5c8,colors:0xd0a3bc,objects:0xe3ba70,
  weave:0x7bafac,tide:0x448ead,wind:0x92a3bb,skull:0x9cacc3,shark:0x75c8c8,mueck:0xb99584};
const ceilingHeight=6.7;

export function* buildMmcaGallery(T,root,{wx,wz}){
  const gallery=new T.Group();gallery.name="국립현대미술관 서울";gallery.visible=false;
  root.add(gallery);
  const materials=new Map(),boxGeometry=new T.BoxGeometry(1,1,1);
  const cylinderGeometry=new T.CylinderGeometry(1,1,1,24);
  const sphereGeometry=new T.SphereGeometry(1,14,10);
  const torusGeometry=new T.TorusGeometry(1,.035,7,48);
  const animated=[],fabrics=new Map();
  let weaveMap;
  function material(color,flat=false){
    const key=color+(flat?0x1000000:0);
    if(!materials.has(key))materials.set(key,flat?new T.MeshBasicMaterial({color,toneMapped:false}):
      new T.MeshStandardMaterial({color,roughness:.59,metalness:.12}));
    return materials.get(key);
  }
  function mesh(shape,surface,x,h,z,parent=gallery){
    const object=new T.Mesh(shape,surface);object.position.set(x,h,z);parent.add(object);return object;
  }
  function box(color,x,h,z,w,height,d,parent=gallery,flat=false){
    const object=mesh(boxGeometry,material(color,flat),x,h,z,parent);
    object.scale.set(w,height,d);return object;
  }
  function block(color,x,h,z,w,height,d){return box(color,wx(x),h,wz(z),w,height,d,gallery,true);}
  function group(x,h,z,parent=gallery){
    const object=new T.Group();object.position.set(x,h,z);parent.add(object);return object;
  }
  function round(color,x,h,z,r,height,parent){
    const object=mesh(cylinderGeometry,material(color),x,h,z,parent);object.scale.set(r,height,r);return object;
  }
  function ball(color,x,h,z,r,parent){
    const object=mesh(sphereGeometry,material(color),x,h,z,parent);object.scale.setScalar(r);return object;
  }
  function ring(color,x,h,z,r,parent){
    const object=mesh(torusGeometry,material(color),x,h,z,parent);object.scale.setScalar(r);return object;
  }
  function surface(w,h,x,y,z,rotation,makeTexture,parent=gallery){
    const map=new T.CanvasTexture(makeTexture());map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    const art=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,toneMapped:false}),x,y,z,parent);
    art.rotation.y=rotation;return art;
  }
  function sheet(width,height,paint){
    const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
    paint(canvas.getContext("2d"),width,height);return canvas;
  }
  function label(lines,x,h,z,w,height,rotation=0,accent="#509c9d",dark=false){
    const resolution=w>8.5?1024:512;
    return surface(w,height,wx(x),h,wz(z),rotation,()=>sheet(resolution,resolution/4,ink=>{
      ink.scale(resolution/1024,resolution/1024);
      ink.fillStyle=dark?"#263039":"#f5f3ed";ink.fillRect(0,0,1024,256);
      ink.fillStyle=accent;ink.fillRect(0,0,14,256);
      ink.textBaseline="middle";ink.fillStyle=dark?"#fcfaf4":"#232a30";
      ink.font='700 76px "Malgun Gothic", sans-serif';ink.fillText(lines[0],49,lines.length>1?92:128,915);
      if(lines.length>1){
        ink.font='500 43px "Malgun Gothic", sans-serif';ink.fillStyle=dark?"#c2ccd0":"#535c62";
        ink.fillText(lines[1],52,180,912);
      }
    }));
  }

  const {minX,maxX,minY,maxY}=mmcaVenue.bounds;
  const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
  const hallLeft=346,hallRight=356;
  const floor=surface(maxX-minX,maxY-minY,wx(centerX),.012,wz(centerY),0,()=>sheet(256,256,(ink,w,h)=>{
    ink.fillStyle="#b9b8b4";ink.fillRect(0,0,w,h);
    for(let i=0;i<480;i++){
      const x=(i*131)%251,y=(i*197+i%7)%251;
      ink.fillStyle=i%3===0?"#9c9a963c":"#e4e2dd53";
      ink.fillRect(x,y,i%3+1,i%2+1);
    }
    ink.fillStyle="#a7a6a2";ink.fillRect(0,0,w,1);ink.fillRect(0,0,1,h);
  }));
  floor.rotation.x=-Math.PI/2;
  floor.material.map.wrapS=floor.material.map.wrapT=T.RepeatWrapping;
  floor.material.map.repeat.set((maxX-minX)/4,(maxY-minY)/4);
  block(finish.ceiling,centerX,ceilingHeight+.08,centerY,maxX-minX,.16,maxY-minY);
  function wall(x,z,w,d,color=finish.walls){
    block(color,x,ceilingHeight/2,z,w,ceilingHeight,d);
    block(finish.trim,x,.13,z,w+.027,.24,d+.027);
  }
  wall(minX,centerY,.28,maxY-minY);wall(maxX,centerY,.28,maxY-minY);
  wall(centerX,minY,maxX-minX,.28);
  for(const [left,right] of [[minX,centerX-2.4],[centerX+2.4,maxX]]){
    wall((left+right)/2,maxY,right-left,.28,0xc8ced0);
  }
  const exitX=mmcaVenue.insideDoor.x;
  block(0x26323b,exitX,2.12,maxY-.15,4.8,4.25,.24);
  for(const direction of [-1,1]){
    block(0x7894a2,exitX+direction*1.13,2.13,maxY-.29,2.18,3.82,.048);
    block(0xa4b8bc,exitX+direction*1.13,2.72,maxY-.32,2.11,.16,.031);
    block(0xbac6c7,exitX+direction*.26,1.17,maxY-.34,.11,.75,.10);
  }
  block(finish.walls,exitX,5.48,maxY,4.8,2.45,.28);
  label(["삼청로 · 나가기"],exitX,4.65,maxY-.19,4,.55,Math.PI,"#71b094",true);

  const lobbyY=mmcaVenue.insideSpawn.y;
  block(0x30383e,centerX,4.65,lobbyY-5.4,9.25,1.55,.20);
  label(["국립현대미술관 서울","서울관 전시의 기억 · 게임 특별전"],centerX,4.65,lobbyY-5.26,8.9,1.45,0,"#9ac2b3",true);
  label(["왼쪽  데이미언 허스트 관","오른쪽  론 뮤익 관"],centerX,2.45,minY+.177,7.5,1.0);
  for(const x of [hallLeft+.27,hallRight-.27]){
    block(0x646a6e,x,.022,centerY,.08,.016,maxY-minY-1.4);
    block(finish.metal,x,ceilingHeight-.37,centerY,.16,.16,maxY-minY-1);
    block(0xf6efdb,x,ceilingHeight-.46,centerY,.092,.036,maxY-minY-1.35);
  }
  const guestbook=mmcaVenue.guestbookPoint;
  const deskY=guestbook.y+1.5;
  const desk=group(wx(guestbook.x),0,wz(deskY));
  box(0x495862,0,.50,0,2.28,1.0,.95,desk);
  box(0x989089,0,1.05,0,2.4,.12,1.05,desk);
  box(0xab754c,0,1.14,-.19,.80,.06,.53,desk);
  for(const direction of [-1,1])box(0xf3e5cb,direction*.18,1.177,-.19,.355,.025,.48,desk).rotation.z=direction*.055;
  box(0x516870,.15,1.195,-.16,.025,.03,.33,desk).rotation.y=.31;
  label(["방명록","오늘의 감상을 남겨 주세요"],guestbook.x,1.66,deskY-.54,2.35,.55,Math.PI);
  yield;

  const byId=new Map(mmcaExhibits.map(exhibit=>[exhibit.id,exhibit]));
  const roomModels=new Map();
  for(const [x1,y1,x2,y2] of mmcaWalls){
    wall((x1+x2)/2,(y1+y2)/2,Math.max(.28,Math.abs(x2-x1)),Math.max(.28,Math.abs(y2-y1)));
  }
  for(const room of mmcaGalleryRooms){
    yield;
    roomModels.set(room.id,group(0,0,0));
    const {minX:left,maxX:right,minY:front,maxY:back,doorX,doorY}=room;
    const west=doorX<centerX,roomX=(left+right)/2;
    const exhibit=byId.get(room.exhibitId??room.id);
    const accent=exhibitColors[exhibit.id],stripe=`#${accent.toString(16).padStart(6,"0")}`;
    if(room.id==="hirst"){
      block(0x263141,roomX,.024,(front+back)/2,right-left-.22,.022,back-front-.23);
      block(0x243041,left+.20,3.16,(front+back)/2,.14,6.19,back-front-.28);
      for(const y of [front+.24,back-.22])block(0x374457,roomX,3.16,y,right-left-.26,6.19,.12);
    }else if(room.id==="mueck"){
      block(0x9e8d80,roomX,.021,(front+back)/2,right-left-.22,.016,back-front-.23);
      block(0xc9b6a5,right-.18,3.15,(front+back)/2,.13,6.17,back-front-.30);
    }
    block(0x424953,doorX,5.32,doorY,.32,2.76,6.1);
    label([room.name,"게임 오마주"],doorX+(west?.176:-.176),4.56,doorY,5.7,.91,
      west?Math.PI/2:-Math.PI/2,stripe,true);
    block(accent,doorX,.028,doorY,.36,.022,5.68);
    block(0xcdd0cc,roomX,ceilingHeight-.22,(front+back)/2,right-left-.66,.14,back-front-.62);
    for(const y of [front+2.2,back-2.2]){
      block(finish.metal,roomX,ceilingHeight-.43,y,right-left-5,.104,.18);
      block(0xf7f3e3,roomX,ceilingHeight-.50,y,right-left-5.1,.041,.105);
    }
    block(accent,west?left+.17:right-.17,2.82,(front+back)/2,.06,3.46,Math.min(10,back-front-3));
    const roomWorks=mmcaExhibits.filter(work=>work.gallery===room.id);
    const wallCopy=[room.name,`${roomWorks.length}점 · ${exhibit.credit.split(" · ")[0]}`];
    label(wallCopy,west?left+.286:right-.286,2.72,(front+back)/2,6.9,1.45,
      west?Math.PI/2:-Math.PI/2,stripe);
  }

  const key=new T.DirectionalLight(0xffedda,2.5);key.position.set(-9,14,6);gallery.add(key);
  const fill=new T.DirectionalLight(0xcae4ff,1.35);fill.position.set(9,12,-8);gallery.add(fill);
  for(const exhibit of mmcaExhibits){
    yield;
    const artRoom=roomModels.get(exhibit.gallery);
    if(exhibit.id==="skull"||exhibit.id==="shark"){
      addHirstWork(T,artRoom,{wx,wz},exhibit);
      const skull=exhibit.id==="skull";
      label([exhibit.title],exhibit.x,.64,exhibit.y+(skull?1.28:2.57),2.9,.45,0,"#77a7af",true);
      continue;
    }
    const art=group(wx(exhibit.x),0,wz(exhibit.y),artRoom);art.name=exhibit.title;
    if(exhibit.id==="home"||exhibit.id==="home-passage"){
      const house=exhibit.id==="home";
      block(house?0x7f9994:0x9d8eaa,exhibit.x,.022,exhibit.y,house?6.64:4.08,.014,6.48);
      block(house?0xb4c9bf:0xc4bbc5,exhibit.x,.033,exhibit.y,house?1.89:2.26,.012,6.52);
    }else{
      const {x,z}=art.position;
      box(0x303b42,x,.115,z,5.75,.23,5.52,artRoom,true);
      box(exhibitColors[exhibit.id]??exhibitColors[exhibit.gallery]??0xb4a08d,x,.235,z,5.61,.028,5.38,artRoom,true);
      box(0xdedbd2,x,.276,z,5.49,.087,5.27,artRoom,true);
    }
    switch(exhibit.id){
      case "home": makeHome(art);batchArt(art);break;
      case "home-passage": makeHomePassage(art);batchArt(art);break;
      case "home-pockets": case "home-thread": makeHomeStudy(art,exhibit.id==="home-thread");batchArt(art);break;
      case "colors": makeColorLight(art);break;
      case "objects": makeObjects(art);batchArt(art);break;
      case "weave": makeWeave(art);batchArt(art);break;
      case "tide": makeTide(art);break;
      case "wind": makeWind(art);break;
      case "mueck":art.rotation.y=-Math.PI*.28;buildMueckSculpture(T,art);break;
      default:{
        const build=exhibit.gallery==="hirst"||exhibit.gallery==="mueck"?addGuestMuseumWork:addExtraMuseumWork;
        const animate=build(T,art,exhibit);
        if(typeof animate==="function")animated.push(animate);
      }
    }
    if(exhibit.extra)label([exhibit.title],exhibit.x,.63,exhibit.y+2.77,2.9,.48,0,"#7c9f94",false);
  }

  function batchArt(art){
    // Only parts in the same motionless exhibit share a draw call.
    art.updateWorldMatrix(true,true);
    const fromWorld=art.matrixWorld.clone().invert(),matrix=new T.Matrix4(),groups=new Map();
    art.traverse(object=>{
      if(!object.isMesh||object.material.transparent)return;
      const key=object.geometry.id+":"+object.material.id;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(object);
    });
    for(const parts of groups.values()){
      if(parts.length<3)continue;
      const {geometry,material}=parts[0],batch=new T.InstancedMesh(geometry,material,parts.length);
      parts.forEach((part,index)=>{
        batch.setMatrixAt(index,matrix.multiplyMatrices(fromWorld,part.matrixWorld));
        part.removeFromParent();
      });
      batch.computeBoundingSphere();
      art.add(batch);
    }
  }

  function makeHomeStudy(parent,threadRoom){
    if(!threadRoom){
      const color=0x719d94,material=fabric(0x95c6b5,.38);
      for(const side of [-1,1]){
        cloth(1.2,2.65,side*1.62,1.77,0,Math.PI/2,material,parent);
        box(color,side*1.62,1.75,.61,.07,2.61,.08,parent);
        box(color,side*1.62,1.75,-.61,.07,2.61,.08,parent);
      }
      for(const [index,z] of [.10,.28,.51,.77].entries()){
        const y=.70+index*.57;
        framePanel(cloth(3.22,.47,0,y,z,0,material,parent),3.22,.47,color);
        for(const x of [-1.38,1.38])box(color,x,y,z-.28,.05,.05,.67,parent);
        const grip=ring(0xc4a16a,0,y,z+.032,.105,parent);grip.scale.y*=.64;
      }
      box(color,0,3.10,0,3.32,.078,1.31,parent);
      return;
    }
    const wire=[];
    for(let i=0;i<=36;i++){
      const x=-2.03+i*.1128,z=-1.46+i*.081;
      if(Math.abs(x)>.91)wire.push(x,.33,1.45,x,3.18,1.45);
      else wire.push(x,2.28,1.45,x,3.18,1.45);
      wire.push(x,.34,-1.46,x,3.19,-1.46,-2.04,.34,z,-2.04,3.18,z,2.04,.34,z,2.04,3.18,z);
    }
    for(let i=0;i<=26;i++){
      const y=.36+i*.108;
      wire.push(-2.04,y,-1.46,2.04,y,-1.46,-2.04,y,-1.46,-2.04,y,1.45,2.04,y,-1.46,2.04,y,1.45);
      if(y>2.26)wire.push(-2.04,y,1.45,2.04,y,1.45);
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(wire,3));
    parent.add(new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xa26150,opacity:.72,transparent:true})));
    const curtain=cloth(1.88,1.24,0,1.92,-1.41,0,fabric(0xcf9082,.36),parent);
    framePanel(curtain,1.88,1.24,0xa26e61,true);
  }

  function fabric(color,opacity){
    const key=`${color}/${opacity}`;
    if(fabrics.has(key))return fabrics.get(key);
    if(!weaveMap){
      const size=32,data=new Uint8Array(size*size*4);
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        const cell=(y*size+x)*4,dark=x%8<2||y%8===0;
        const fiber=(dark?176:246)+((x*17+y*13)%21)-10;
        data.set([fiber,fiber,fiber,255],cell);
      }
      weaveMap=new T.DataTexture(data,size,size);weaveMap.colorSpace=T.SRGBColorSpace;
      weaveMap.wrapS=weaveMap.wrapT=T.RepeatWrapping;weaveMap.generateMipmaps=true;
      weaveMap.magFilter=T.LinearFilter;weaveMap.minFilter=T.LinearMipmapLinearFilter;weaveMap.needsUpdate=true;
    }
    const surface=new T.MeshBasicMaterial({map:weaveMap,color,transparent:true,opacity,
      side:T.DoubleSide,depthWrite:false,forceSinglePass:true,toneMapped:false});
    fabrics.set(key,surface);return surface;
  }
  function cloth(width,height,x,y,z,turn,material,parent){
    const plane=new T.PlaneGeometry(width,height,6,6);
    const uv=plane.getAttribute("uv"),points=plane.getAttribute("position");
    for(let i=0;i<points.count;i++){
      const u=uv.getX(i),v=uv.getY(i);
      points.setZ(i,.025*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*Math.sin(v*17+u*6));
      uv.setXY(i,u*width*17,v*height*17);
    }
    const panel=mesh(plane,material,x,y,z,parent);panel.rotation.y=turn;return panel;
  }
  function seams(color,paths,parent){
    const positions=[];
    for(const path of paths)for(let index=1;index<path.length;index++)positions.push(...path[index-1],...path[index]);
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    parent.add(new T.LineSegments(geometry,new T.LineBasicMaterial({color,transparent:true,opacity:.84,depthWrite:false})));
  }
  function framePanel(panel,w,h,color,onFabric=false){
    const {parent}=panel,wire=group(panel.position.x,panel.position.y,panel.position.z,parent);
    wire.rotation.copy(panel.rotation);
    for(const side of [-1,1]){
      box(color,side*w/2,0,0,.036,h+.032,.039,wire);
      box(color,0,side*h/2,0,w,.036,.039,wire);
    }
    if(onFabric){
      seams(color,[-.021,.021].flatMap(z=>[-1,1].flatMap(side=>[
        [[side*(w/2-.067),-h/2+.062,z],[side*(w/2-.067),h/2-.062,z]],
        [[-w/2+.062,side*(h/2-.063),z],[w/2-.062,side*(h/2-.063),z]],
      ])),wire);
    }
    return wire;
  }
  function clothRoof(parent,width,depth,eave,rise,material,color){
    for(const side of [-1,1]){
      const point=(across,along)=>[side*across*width,eave+rise*(1-across)**1.52+
        .21*across**5+.17*across**3*along**4,along*depth];
      const positions=[],uvs=[],indices=[],ribs=[];
      for(let j=0;j<=8;j++)for(let i=0;i<=8;i++){
        positions.push(...point(i/8,(j-4)/4));uvs.push(i*width*1.8,j*depth*3.6);
        if(i&&j){const vertex=j*9+i;indices.push(vertex-10,vertex-9,vertex,vertex-10,vertex,vertex-1);}
      }
      const fabricSheet=new T.BufferGeometry();
      fabricSheet.setAttribute("position",new T.Float32BufferAttribute(positions,3));
      fabricSheet.setAttribute("uv",new T.Float32BufferAttribute(uvs,2));fabricSheet.setIndex(indices);
      mesh(fabricSheet,material,0,0,0,parent);
      for(let j=0;j<=16;j++){
        const along=(j-8)/8;
        ribs.push(Array.from({length:13},(_,i)=>{
          const [x,y,z]=point(i/12,along);return [x,y+.018,z];
        }));
      }
      for(const edge of [.017,.96,1]){
        ribs.push(Array.from({length:17},(_,i)=>point(edge,(i-8)/8)));
      }
      seams(color,ribs,parent);
      for(const z of [-.91,0,.91]){
        const x=side*(width-.24);
        box(color,x,eave-.04,z*depth,.24,.10,.25,parent);
        box(color,x,eave-.14,z*depth,.17,.10,.17,parent);
      }
    }
  }
  function makeHome(parent){
    const sea=0x529283,wood=0x80b6a3,stitch=0xb1d0bb,brass=0xccad7d;
    const screen=fabric(0x86bea9,.35),transom=fabric(0x9dcfc0,.43),roof=fabric(0x72b6a6,.45);
    clothRoof(parent,3.30,3.19,3.23,1.06,roof,sea);
    box(sea,0,4.29,0,.065,.07,6.39,parent);
    for(const side of [-1,1]){
      for(const offset of [-2.72,0,2.72]){
        box(sea,side*2.88,1.625,offset,.104,3.25,.149,parent);
        box(wood,side*2.88,.22,offset,.155,.36,.193,parent);
        box(stitch,side*2.88,2.98,offset,.181,.115,.206,parent);
      }
      for(const sideZ of [-1,1]){
        const wall=cloth(2.62,2.64,side*2.88,1.51,sideZ*1.36,Math.PI/2,screen,parent);
        const lattice=framePanel(wall,2.62,2.64,sea,true);
        for(let index=-4;index<=4;index++){
          const track=index*.24;
          box(wood,track,.33,0,.028,1.56,.030,lattice);
          box(stitch,track,-.73,0,.018,.48,.026,lattice);
        }
        for(const y of [-.925,-.53,-.41,.095,.57,1.08])box(wood,0,y,0,2.59,.031,.037,lattice);
        const front=cloth(1.76,2.65,side*1.98,1.51,sideZ*2.72,0,screen,parent);
        const window=framePanel(front,1.76,2.65,sea,true);
        for(let i=-3;i<=3;i++)box(wood,i*.206,.31,0,.023,1.65,.031,window);
        for(const y of [-.56,-.407,.235,.79,1.13])box(wood,0,y,0,1.74,.029,.03,window);
        const pull=ring(brass,-side*.65,-.20,.037,.085,window);
        pull.scale.y*=.85;
      }
      box(sea,side*2.88,3.04,0,.152,.15,5.56,parent);
      box(stitch,side*2.883,2.89,0,.043,.055,5.41,parent);
    }
    for(const end of [-2.72,2.72]){
      const crossbar=cloth(5.66,.39,0,2.97,end,0,transom,parent);
      const frame=framePanel(crossbar,5.66,.39,sea,true);
      for(let i=-11;i<=11;i++)box(wood,i*.234,0,0,.024,.35,.03,frame);
    }
    const inner=group(0,0,.62,parent),innerEdge=0xb39670;
    const gold=fabric(0xdcc298,.42),goldRoof=fabric(0xe2cfa4,.44);
    clothRoof(inner,2.04,1.57,2.42,.67,goldRoof,innerEdge);
    for(const side of [-1,1]){
      const sidePanel=cloth(2.65,2.07,side*1.71,1.3,0,Math.PI/2,gold,inner);
      const lattice=framePanel(sidePanel,2.65,2.07,innerEdge,true);
      for(let i=-5;i<=5;i++)box(innerEdge,i*.22,.22,0,.023,1.51,.022,lattice);
      for(const y of [-.76,-.43,.02,.47,.91])box(innerEdge,0,y,0,2.63,.027,.027,lattice);
      for(const z of [-1.33,1.33])box(innerEdge,side*1.71,1.21,z,.09,2.42,.10,inner);
    }
    for(const z of [-1.33,1.33]){
      box(innerEdge,0,2.37,z,3.48,.115,.102,inner);
      for(const side of [-1,1])box(0xdbca9f,side*1.56,2.24,z,.39,.065,.13,inner);
    }
    // Tension cords draw the outline of the suspended cloth up toward the gallery ceiling.
    seams(0x718c84,[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=>[[x*2.66,3.44,z*2.82],[x*2.66,6.30,z*2.82]]),parent);
  }
  function makeHomePassage(parent){
    const sections=[
      {z:-2.07,h:3.36,trim:0xa96d6b,threads:0xe5bdb0,color:0xeab5a0},
      {z:0,h:3.57,trim:0x80679a,threads:0xc8b3dc,color:0xc1a5d7},
      {z:2.07,h:3.18,trim:0x478a83,threads:0x9ac2ac,color:0x8eb9ab},
    ];
    for(const {z,h,trim,threads,color} of sections){
      const segment=group(0,0,z,parent),pane=fabric(color,.43),shade=fabric(color,.54);
      const ceiling=cloth(3.78,2.06,0,h,.0,0,pane,segment);ceiling.rotation.x=-Math.PI/2;
      for(const edge of [-1,1]){
        const side=cloth(2.06,h-.30,edge*1.89,h/2+.07,0,Math.PI/2,pane,segment);
        framePanel(side,2.06,h-.30,trim,true);
        box(trim,edge*1.89,.18,0,.062,.09,2.08,segment);
        for(const face of [-1,1]){
          box(trim,edge*1.89,h/2,face*1.035,.07,h,.078,segment);
          box(threads,edge*1.84,h/2,face*.988,.022,h-.23,.023,segment);
        }
        const window=cloth(.88,.95,edge*1.86,2.00,edge*.19,Math.PI/2,shade,segment);
        const rail=framePanel(window,.88,.95,trim,true);
        for(const slat of [-1,0,1])box(threads,0,slat*.235,0,.87,.025,.022,rail);
        box(threads,0,0,0,.024,.945,.025,rail);
        const lining=cloth(.72,1.88,edge*1.842,1.262,-edge*.51,Math.PI/2,shade,segment);
        const liningFrame=framePanel(lining,.72,1.88,trim,true);
        box(threads,edge*.18,-.23,.048,.12,.040,.042,liningFrame);
        box(threads,-edge*.23,-.225,-.05,.118,.048,.046,liningFrame);
        for(const [y,depth] of [[1.31,edge*.77],[.49,edge*.62]]){
          box(trim,edge*1.840,y,depth,.03,.155,.103,segment);
          box(threads,edge*1.819,y+.025,depth,.015,.039,.039,segment);
          box(threads,edge*1.819,y-.029,depth,.014,.025,.031,segment);
        }
      }
      for(const end of [-1.032,1.032]){
        box(trim,0,h-.047,end,3.83,.104,.097,segment);
        box(threads,0,h-.124,end,3.72,.021,.097,segment);
        const ribbon=cloth(3.68,.38,0,h-.274,end,0,shade,segment);
        framePanel(ribbon,3.68,.38,trim,true);
      }
      for(const x of [-1.70,1.70]){
        seams(0x9d9ea1,[[[x,h,.0],[x,6.28,.0]]],segment);
        box(threads,x,.04,0,.036,.027,1.99,segment);
      }
    }
    for(const y of [-2.99,-1.045,1.045,2.99]){
      box(0x9d92aa,0,.045,y,3.64,.015,.085,parent);
      for(const x of [-1.58,1.58])box(0xf0d9bf,x,.054,y,.36,.014,.065,parent);
    }
  }

  function makeColorLight(parent){
    const palettes=[[0x39a7aa,0x75d0d1,0xddc5a0,0xd38c99,0xa88cc6],[0xde704e,0xf29554,0xeeb45e,0xdc889f,0x854ea0],
      [0x2a72a0,0x55a2cc,0x8ec7d7,0x85b8b1,0x4b7da5]];
    const glass=palettes[0].map(color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.60,
      metalness:.18,roughness:.32}));
    for(let i=0;i<21;i++){
      const z=(i-10)*.224,h=2.45+Math.sin(i*.51)*.57;
      const x=Math.sin(i*.37)*.48;
      const fin=mesh(boxGeometry,glass[i%5],x,.32+h/2,z,parent);
      fin.scale.set(3.10+Math.cos(i*.24)*.56,h,.075);fin.rotation.y=Math.cos(i*.34)*.35;
      box(0x313c49,x,.39,z,3.15,.13,.13,parent).rotation.y=fin.rotation.y;
    }
    round(0x515365,0,.37,2.19,1.15,.09,parent).scale.z=.41;
    for(let i=0;i<5;i++){
      const orb=mesh(sphereGeometry,glass[i],(i-2)*.39,.49+(i%2)*.05,2.18,parent);
      orb.scale.setScalar(.12+(i%2)*.05);
    }
    let current=-1;
    animated.push((seconds,mode)=>{
      if(current!==mode){
        current=mode;
        glass.forEach((fin,i)=>{fin.color.setHex(palettes[mode][i]);fin.emissive.copy(fin.color);});
      }
      glass.forEach((fin,i)=>{fin.emissiveIntensity=.54+Math.sin(seconds*1.7+i*.7)*.22;});
    });
  }

  function makeObjects(parent){
    const colors=[0x186763,0xa66c45,0xe0b668,0xbe5955,0x7194a5,0xe5bd9c,0xaca0a0];
    const bowl=new T.LatheGeometry([[0,0],[.59,0],[.62,.071],[.84,.22],[1,.50],[.96,.52],[.80,.27],[.55,.10],[0,.10]]
      .map(([x,y])=>new T.Vector2(x,y)),18);
    for(const [index,x,z] of [[0,-1.46,-1.03],[1,1.17,-.56],[2,-.44,1.29]]){
      round(0x444956,x,.41,z,.68,.15,parent);
      for(let row=0;row<8-index;row++){
        const color=colors[(row*2+index*3)%colors.length];
        const radius=(.7-row*.031)*(index===1?.95:1);
        const y=.54+row*.385;
        const cup=mesh(bowl,material(color),x+Math.sin(row*.82)*.24,y,z,parent);
        cup.scale.set(radius,.54,radius);cup.rotation.z=Math.sin(row*1.9)*.24;
        if(row%3===1){
          const wire=ring(0xcdb28e,x+.52,y+.16,z,.22,parent);wire.rotation.y=.42+row*.19;
        }
        round(colors[(row+3)%colors.length],x,y+.29,z,.24,.13,parent);
      }
      const crest=ring(colors[(index+5)%colors.length],x,3.62-index*.38,z,.52,parent);
      crest.rotation.z=index*.3;crest.rotation.y=.61+index*.6;
    }
  }

  function makeWeave(parent){
    const strands=[0x719a94,0xae7d4c,0x334d56,0xd8b38a,0x77836c];
    for(let j=0;j<3;j++){
      const braid=group((j-1)*.90,1.92+(j%2)*.32,(j-1)*.81,parent);
      braid.rotation.set(.23+j*.31,(j-1)*1.04,(j-1)*.51);
      for(let i=0;i<9;i++){
        const thread=ring(strands[(i+j*2)%strands.length],0,0,(i-4)*.065,1.34+(i%3)*.038,braid);
        thread.scale.y*=.70;thread.rotation.z=i*.31;
      }
      for(let i=0;i<19;i++){
        const a=i/19*Math.PI*2;
        const stitch=box(strands[(i+2*j)%strands.length],Math.cos(a)*1.39,Math.sin(a)*.95,0,.082,.065,.58,braid);
        stitch.rotation.z=a;
      }
      box(0x404954,(j-1)*.90,.76,(j-1)*.81,.077,.88,.077,parent);
    }
  }

  function makeTide(parent){
    const hub=group(0,2.82,0,parent),brass=0xcd9a54,rim=0x405263;
    round(rim,0,.51,0,1.14,.36,parent);
    round(0x6a7580,0,1.46,0,.32,1.81,parent);
    round(brass,0,2.41,0,.48,.17,parent);ball(0xe2b985,0,0,0,.35,hub);
    const hoops=[];
    for(let i=0;i<3;i++){
      const rotor=group(0,0,0,hub);hoops.push(rotor);
      const radius=1.46+i*.31,color=[brass,0x94b5c2,0xbd784d][i];
      ring(color,0,0,0,radius,rotor);
      for(let notch=0;notch<16;notch++){
        const angle=notch*Math.PI/8,tick=box(color,Math.cos(angle)*radius,Math.sin(angle)*radius,0,
          notch%4===0?.21:.10,.046,.09,rotor);
        tick.rotation.z=angle;
      }
      const rod=box(rim,0,-radius*.4,0,.039,radius*.81,.046,rotor);rod.rotation.z=.20+i*.27;
      ball(color,radius*.15,-radius*.78,0,.16,rotor);
    }
    animated.push(seconds=>{
      const phase=seconds%900*Math.PI*2/900;
      hoops.forEach((rotor,i)=>{
        rotor.rotation.set(.27+i*.44+Math.sin(phase*(37+i*8)+i)*.27,phase*(16+i*4)+i*.74,
          .25+i*.62+Math.sin(phase*(33+i*6)+i)*.42);
      });
    });
  }

  function makeWind(parent){
    for(const direction of [-1,0,1]){
      const frame=group(direction*1.68,2.08,Math.abs(direction)*.18,parent);
      frame.rotation.y=direction*-.23;
      box(0x414d55,0,0,0,1.59,2.99,.13,frame);
      const image=()=>sheet(384,672,(ink,w,h)=>{
        const wash=ink.createLinearGradient(0,0,0,h);
        wash.addColorStop(0,"#e4ded4");wash.addColorStop(.53,"#ede9df");wash.addColorStop(1,"#abbfc3");
        ink.fillStyle=wash;ink.fillRect(0,0,w,h);
        ink.lineCap="round";
        const pigment=["#334e6550","#476d7966","#73959988","#74858c55","#bf835562"];
        for(let i=0;i<41;i++){
          const startX=(i*227+direction*29+384)%w;
          const startY=133+(i*79+direction*24+396)%399;
          const curl=Math.sin(i*.47+direction)*47;
          ink.strokeStyle=pigment[i%5];ink.lineWidth=1.4+(i%7)*1.35;
          ink.beginPath();ink.moveTo(startX-83,startY+curl*.5);
          ink.bezierCurveTo(startX-21,startY-48,startX+22,startY+curl,startX+103,startY-14);
          ink.stroke();
        }
        ink.fillStyle="#9f6a5b9e";
        ink.beginPath();ink.arc(237+direction*57,141+Math.abs(direction)*42,10+Math.abs(direction)*5,0,2*Math.PI);ink.fill();
      });
      const painting=surface(1.5,2.9,0,0,.071,0,image,frame);
      const reverse=mesh(painting.geometry,painting.material,0,0,-.071,frame);
      reverse.rotation.y=Math.PI;
      box(0x585e60,0,-1.59,0,.086,.34,.078,frame);
      box(0x585e60,0,2.62,0,.038,2.2,.036,frame);
    }
  }

  return {
    update(clock,lightMode,_service,viewer){
      if(!gallery.visible)return;
      if(viewer)for(const room of mmcaGalleryRooms){
        const inside=viewer.x>room.minX&&viewer.x<room.maxX&&viewer.y>room.minY&&viewer.y<room.maxY;
        roomModels.get(room.id).visible=inside||Math.hypot(viewer.x-room.doorX,viewer.y-room.doorY)<26;
      }
      const seconds=clock/1000;
      const mode=Number.isInteger(lightMode)&&lightMode>=0&&lightMode<=2?lightMode:0;
      for(const animate of animated)animate(seconds,mode);
    },
    setVisible(visible){gallery.visible=visible;}
  };
}
