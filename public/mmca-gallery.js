import {mmcaExhibits,mmcaGalleryRooms,mmcaVenue,mmcaWalls} from "./mmca-gallery-layout.js";

const finish={walls:0xe8e6e1,ceiling:0x5d6064,metal:0x353a41,trim:0x777c7e};
const exhibitColors={home:0xa2c7c1,colors:0xd0a3bc,objects:0xe3ba70,weave:0x7bafac,tide:0x448ead,wind:0x92a3bb};
const ceilingHeight=6.7;

export function* buildMmcaGallery(T,root,{wx,wz}){
  const gallery=new T.Group();gallery.name="국립현대미술관 서울";gallery.visible=false;
  root.add(gallery);
  const materials=new Map(),boxGeometry=new T.BoxGeometry(1,1,1);
  const cylinderGeometry=new T.CylinderGeometry(1,1,1,24);
  const sphereGeometry=new T.SphereGeometry(1,14,10);
  const torusGeometry=new T.TorusGeometry(1,.035,7,48);
  const animated=[];
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
  label(["전시실 안내","여섯 개의 작품을 따라 걸어 보세요"],centerX,2.45,minY+.177,7.5,1.0);
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
  for(const [x1,y1,x2,y2] of mmcaWalls){
    wall((x1+x2)/2,(y1+y2)/2,Math.max(.28,Math.abs(x2-x1)),Math.max(.28,Math.abs(y2-y1)));
  }
  for(const room of mmcaGalleryRooms){
    yield;
    const {minX:left,maxX:right,minY:front,maxY:back,doorX,doorY}=room;
    const west=doorX<centerX,roomX=(left+right)/2;
    const id=room.exhibitId??room.id;
    const exhibit=byId.get(id)??mmcaExhibits.find(item=>item.x>left&&item.x<right&&item.y>front&&item.y<back);
    if(!exhibit)continue;
    const accent=exhibitColors[exhibit.id],stripe=`#${accent.toString(16).padStart(6,"0")}`;
    block(0x424953,doorX,5.32,doorY,.32,2.76,6.1);
    label([room.name??exhibit.title,"아카이브 전시 · 오마주"],doorX+(west?.176:-.176),4.56,doorY,5.7,.91,
      west?Math.PI/2:-Math.PI/2,stripe,true);
    block(accent,doorX,.028,doorY,.36,.022,5.68);
    block(0xcdd0cc,roomX,ceilingHeight-.22,(front+back)/2,right-left-.66,.14,back-front-.62);
    for(const y of [front+2.2,back-2.2]){
      block(finish.metal,roomX,ceilingHeight-.43,y,right-left-5,.104,.18);
      block(0xf7f3e3,roomX,ceilingHeight-.50,y,right-left-5.1,.041,.105);
    }
    block(accent,west?left+.17:right-.17,2.82,(front+back)/2,.06,3.46,Math.min(10,back-front-3));
    label([exhibit.title,exhibit.credit],west?left+.215:right-.215,2.72,(front+back)/2,6.9,1.45,
      west?Math.PI/2:-Math.PI/2,stripe);
  }

  const key=new T.DirectionalLight(0xffedda,2.5);key.position.set(-9,14,6);gallery.add(key);
  const fill=new T.DirectionalLight(0xcae4ff,1.35);fill.position.set(9,12,-8);gallery.add(fill);
  for(const exhibit of mmcaExhibits){
    yield;
    const art=group(wx(exhibit.x),0,wz(exhibit.y));art.name=exhibit.title;
    if(exhibit.id==="home"){
      block(0x748b86,exhibit.x,.024,exhibit.y,4.74,.018,4.83);
      block(0xb4c1b8,exhibit.x,.036,exhibit.y,1.86,.014,4.89);
    }else{
      block(0x303b42,exhibit.x,.115,exhibit.y,5.75,.23,5.52);
      block(exhibitColors[exhibit.id],exhibit.x,.235,exhibit.y,5.61,.028,5.38);
      block(0xdedbd2,exhibit.x,.276,exhibit.y,5.49,.087,5.27);
    }
    switch(exhibit.id){
      case "home": makeHome(art);batchArt(art);break;
      case "colors": makeColorLight(art);break;
      case "objects": makeObjects(art);batchArt(art);break;
      case "weave": makeWeave(art);batchArt(art);break;
      case "tide": makeTide(art);break;
      case "wind": makeWind(art);break;
    }
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

  function makeHome(parent){
    const glassColors=[0x5d9c98,0x86c5be,0xccad87,0x8184a3,0x86b2ad];
    for(let i=0;i<glassColors.length;i++){
      const frame=group((i-2)*.067,0,(i-2)*.85,parent);
      frame.rotation.y=(i-2)*.058;frame.scale.setScalar(1-i*.035);
      const color=glassColors[i];
      const pane=new T.MeshStandardMaterial({color,transparent:true,opacity:.36,side:T.DoubleSide,
        depthWrite:false,roughness:.94,metalness:0});
      for(const side of [-1,1]){
        box(0x576967,side*1.48,.10,0,.71,.14,.31,frame);
        box(color,side*1.58,1.56,0,.11,2.5,.13,frame);
        box(color,side*.83,3.25,0,1.67,.12,.13,frame).rotation.z=side*-.47;
        mesh(new T.PlaneGeometry(.65,2.37),pane,side*1.25,1.58,0,frame);
        for(let seam=0;seam<4;seam++)box(color,side*(1.56-seam*.15),1.53,.009,.022,2.30,.021,frame);
      }
      box(color,0,2.80,0,3.21,.10,.13,frame);
      mesh(new T.PlaneGeometry(2.84,.23),pane,0,2.65,0,frame);
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
    update(clock,lightMode){
      if(!gallery.visible)return;
      const seconds=clock/1000;
      const mode=Number.isInteger(lightMode)&&lightMode>=0&&lightMode<=2?lightMode:0;
      for(const animate of animated)animate(seconds,mode);
    },
    setVisible(visible){gallery.visible=visible;}
  };
}
