// North is -Z. Bearings follow the Jeongdong Observatory panorama and
// Seoul's topographic visitor maps; distances and heights are compressed.
const centre={x:21,z:-14};
const radians=Math.PI/180;
const polar=(bearing,radius)=>({x:centre.x+Math.sin(bearing*radians)*radius,
  z:centre.z-Math.cos(bearing*radians)*radius});

const ridges=[
  {bearing:2,span:64,radius:620,day:0x8da4ad,night:0x263748,heights:[4,23,42,46,66,84,72,99,87,68,77,49,35,21,3]},
  {bearing:319,span:52,radius:492,day:0x758e9a,night:0x223344,heights:[4,15,24,29,44,53,50,70,87,77,72,46,32,18,4]},
  {bearing:358,span:37,radius:481,day:0x81969b,night:0x273746,heights:[4,15,26,35,48,55,62,76,69,59,46,34,28,16,3]},
  {bearing:145,span:56,radius:506,day:0x788d88,night:0x223841,heights:[4,13,24,36,45,49,61,69,64,59,54,42,27,14,4]}
];

function gradientTexture(T,size,draw){
  const canvas=document.createElement("canvas");canvas.width=canvas.height=size;
  draw(canvas.getContext("2d"));
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  return texture;
}

function cloudTexture(T){
  return gradientTexture(T,192,ctx=>{
    const lobes=[[29,112,25,14,.38],[55,107,34,22,.73],[83,113,43,23,.78],[117,110,43,21,.64],
      [149,113,29,14,.49],[169,116,20,11,.30],[57,94,23,18,.58],[81,88,29,23,.78],
      [103,91,27,24,.78],[122,90,29,19,.62],[146,100,23,16,.52],[93,69,22,24,.63]];
    for(const [x,y,w,h,alpha] of lobes){
      ctx.save();ctx.translate(x,y);ctx.scale(w,h);
      const glow=ctx.createRadialGradient(0,-.18,.04,0,0,1);
      glow.addColorStop(0,`rgba(255,253,242,${alpha})`);
      glow.addColorStop(.55,`rgba(249,251,247,${alpha*.74})`);
      glow.addColorStop(.84,`rgba(224,235,243,${alpha*.26})`);
      glow.addColorStop(1,"rgba(220,235,246,0)");
      ctx.fillStyle=glow;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
  });
}

function cloudLayer(T,parent){
  const groups=[
    [11,605,153,173,113,.08],[41,563,186,174,105,-.05],[79,612,147,159,103,.06],
    [102,570,210,177,109,-.05],[136,620,166,174,104,.04],[169,550,188,194,110,.02],
    [202,629,138,160,90,.05],[230,566,181,188,118,-.03],[260,606,146,173,98,.05],
    [289,566,186,181,103,-.07],[312,620,165,149,89,.08],[339,542,210,175,108,-.04]
  ];
  const material=new T.MeshBasicMaterial({map:cloudTexture(T),transparent:true,depthWrite:false,fog:false,toneMapped:false});
  const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),material,groups.length),pose=new T.Object3D();
  groups.forEach(([bearing,distance,y,width,height,tilt],i)=>{
    const {x,z}=polar(bearing,distance);
    pose.position.set(x,y,z);pose.scale.set(width,height,1);
    pose.lookAt(centre.x,y*.68,centre.z);pose.rotateZ(tilt);
    pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);
  });
  mesh.name="Distant daytime clouds";mesh.computeBoundingSphere();parent.add(mesh);
  return mesh;
}

function sunDisk(T,parent,direction){
  const map=gradientTexture(T,128,ctx=>{
    const glow=ctx.createRadialGradient(64,64,0,64,64,63);
    glow.addColorStop(0,"rgba(255,250,208,1)");glow.addColorStop(.17,"rgba(255,251,222,1)");
    glow.addColorStop(.19,"rgba(255,248,202,.64)");glow.addColorStop(.25,"rgba(255,241,186,.30)");
    glow.addColorStop(.49,"rgba(255,236,192,.12)");glow.addColorStop(1,"rgba(255,238,199,0)");
    ctx.fillStyle=glow;ctx.fillRect(0,0,128,128);
  });
  const sun=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
  sun.position.copy(direction??new T.Vector3(-86,97,52)).normalize().multiplyScalar(598);
  sun.position.x+=centre.x;sun.position.z+=centre.z;
  sun.scale.set(48,48,1);sun.name="Daytime sun";parent.add(sun);
  return sun;
}

function ridgeMesh(T,parent,{bearing,span,radius,heights,day,night}){
  const positions=[],colors=[],indices=[];
  for(let i=0;i<heights.length;i++){
    const angle=bearing-span/2+span*i/(heights.length-1),height=heights[i];
    const lip=polar(angle,radius),front=polar(angle,radius-70),back=polar(angle,radius+21);
    positions.push(front.x,-8,front.z,lip.x,height,lip.z,back.x,-7,back.z);
    const tint=.89+.04*Math.sin(i*2.11);
    colors.push(.72,.79,.79,tint,tint,tint,.83,.89,.88);
    if(i){const a=(i-1)*3,b=i*3;indices.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  const material=new T.MeshBasicMaterial({color:day,vertexColors:true,side:T.DoubleSide,fog:false,toneMapped:false});
  parent.add(new T.Mesh(geometry,material));
  return {material,day:new T.Color(day),night:new T.Color(night)};
}

function cityBackdrop(T,parent,sky,{origin,exclusions}={}){
  const buildings=[],roofPieces=[];
  const city=new T.Group();city.name="World-positioned Seoul skyline";
  if(origin){
    city.position.set(origin.x,0,origin.z);
    // The distant towers meet a low, fogged terrain skirt below the playable
    // map. It closes the view under their foundations without adding collision.
    const ground=new T.Mesh(new T.PlaneGeometry(7600,7600),new T.MeshBasicMaterial({color:0x899384}));
    ground.rotation.x=-Math.PI/2;ground.position.set(centre.x,-9,centre.z);
    city.add(ground);
  }
  parent.add(city);
  let seed=78567;
  function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function tower(bearing,distance,width,depth,height,color,angle=0){
    const {x,z}=polar(bearing,distance);
    // The low southeast skyline originally filled the blocks now modeled at
    // street level around Seoul Plaza, Hwangudan and the Sogong-dong hotels.
    const footprint=Math.hypot(width,depth)/2,mapX=x+city.position.x+300,mapY=z+city.position.z+225;
    if(mapX+footprint>621&&mapX-footprint<890&&mapY+footprint>182&&mapY-footprint<439)return;
    if(exclusions?.some(({minX,maxX,minY,maxY})=>mapX+footprint>minX&&mapX-footprint<maxX&&
      mapY+footprint>minY&&mapY-footprint<maxY))return;
    buildings.push({x,z,width,depth,height,color,angle});
    if(height>35)roofPieces.push({x,z,y:height+1.2,width:width*.63,depth:depth*.61,height:2.6+rand()*2.1,color,angle});
  }
  // The northeast office cluster, glass City Hall and hotel south of Seoul Plaza.
  tower(39,408,45,33,100,0x88969e,.02);
  tower(55,380,35,31,85,0xa4aaab,.04);
  tower(76,355,37,33,59,0x829da5,-.05);
  tower(88,356,49,35,45,0x7897a3,-.05);
  tower(105,374,54,31,77,0xb2a6a2,-.13);
  tower(117,445,39,26,99,0x8798a0,.17);
  const sectors=[[15,73,8,84],[78,132,9,76],[133,206,9,54],[210,272,9,60],[276,338,10,58],[340,374,5,56]];
  const colors=[0x9babb3,0x879ba8,0xa7adb1,0xa4a1a0,0x8d9c9f,0x9da7a6];
  for(const [start,end,count,top] of sectors)for(let i=0;i<count;i++){
    const bearing=start+(end-start)*(i+.34+rand()*.32)/count;
    tower(bearing,378+rand()*117,19+rand()*25,17+rand()*21,17+rand()*top,colors[i%colors.length],(rand()-.5)*.5);
  }
  const facade=gradientTexture(T,96,ctx=>{
    ctx.fillStyle="#edeeec";ctx.fillRect(0,0,96,96);
    ctx.fillStyle="#b2bec2";
    for(let y=7;y<94;y+=6)for(let x=5;x<93;x+=10)ctx.fillRect(x,y,7,3);
    ctx.fillStyle="#d3dadd";
    for(let y=7;y<94;y+=12)for(let x=5;x<93;x+=20)ctx.fillRect(x,y,7,3);
  });
  const glass=new T.MeshBasicMaterial({map:facade,fog:false,toneMapped:false}),roofs=new T.MeshBasicMaterial({fog:false,toneMapped:false});
  const unit=new T.BoxGeometry(1,1,1),pose=new T.Object3D();
  function batch(parts,material,name){
    const mesh=new T.InstancedMesh(unit,material,parts.length);
    parts.forEach(({x,z,y,width,depth,height,color,angle},i)=>{
      const base=origin&&y==null?13:0;
      pose.position.set(x,y??(height-base)*.5-1,z);pose.scale.set(width,height+base,depth);pose.rotation.y=angle;
      pose.updateMatrix();mesh.setMatrixAt(i,pose.matrix);mesh.setColorAt(i,new T.Color(color));
    });
    mesh.name=name;mesh.computeBoundingSphere();city.add(mesh);
  }
  batch(buildings,glass,"Distant Seoul skyline");batch(roofPieces,roofs,"Skyline rooftops");
  const hill=polar(145,506),spire=new T.Group();spire.position.set(hill.x,66,hill.z);
  spire.name="Namsan tower silhouette";sky.add(spire);
  const towerMat=new T.MeshBasicMaterial({color:0x8c999d,fog:false,toneMapped:false});
  for(const [radius,tip,height,y] of [[2.6,1.3,32,16],[4.7,4.7,4.8,32],[1.16,.81,6.3,36],[.55,.29,10,43]]){
    const part=new T.Mesh(new T.CylinderGeometry(tip,radius,height,9),towerMat);part.position.y=y;spire.add(part);
  }
  return [glass,roofs,towerMat];
}

export function addPalaceSky(T,scene,{sunDirection,landscape,cityOrigin,cityExclusions}={}){
  const sky=new T.Group();sky.name="Deoksugung sky and distant Seoul";scene.add(sky);
  const hills=ridges.map(ridge=>ridgeMesh(T,sky,ridge)),city=cityBackdrop(T,landscape??sky,sky,{origin:cityOrigin,exclusions:cityExclusions});
  const clouds=cloudLayer(T,sky),sun=sunDisk(T,sky,sunDirection);
  const cityDay=[new T.Color(0xffffff),new T.Color(0xd5dde2),new T.Color(0x8c999d)];
  const cityNight=[new T.Color(0x596a7c),new T.Color(0x536479),new T.Color(0x566673)];
  const cloudDay=new T.Color(0xffffff),cloudNight=new T.Color(0x6b7f99),cloudWarm=new T.Color(0xffc795);
  return function update(now,night,{cloud=.13,fog=0,twilight=0,direction,haze}={}){
    for(const {material,day,night:dark} of hills){
      material.color.copy(day).lerp(dark,night);
      if(haze)material.color.lerp(haze,fog*.83+cloud*.17);
    }
    for(let i=0;i<city.length;i++){
      city[i].color.copy(cityDay[i]).lerp(cityNight[i],night);
      if(haze)city[i].color.lerp(haze,fog*.85+cloud*.13);
    }
    const light=Math.max(0,1-night*1.35);
    if(direction){
      sun.position.copy(direction).multiplyScalar(598);
      sun.position.x+=centre.x;
      sun.position.z+=centre.z;
    }
    sun.material.opacity=light*(1-cloud)**1.65*(1-fog*.92);
    sun.material.color.copy(cloudDay).lerp(cloudWarm,twilight*.76);
    sun.visible=sun.material.opacity>.025&&sun.position.y>0;
    clouds.material.color.copy(cloudDay).lerp(cloudWarm,twilight*.58).lerp(cloudNight,night);
    clouds.material.opacity=(.52+cloud*.48)*(1-night*(.99-cloud*.36))*(1-fog*.45);
    clouds.visible=clouds.material.opacity>.05;
    clouds.position.x=Math.sin(now*.000048)*13;clouds.position.z=Math.sin(now*.000021)*6;
  };
}
