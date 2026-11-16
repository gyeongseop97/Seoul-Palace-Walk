const tau=Math.PI*2;
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));

function workKit(T,root){
  const boxGeometry=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,24,16);
  const cylinder=new T.CylinderGeometry(1,1,1,20),surfaces=new Map();
  const vector=point=>new T.Vector3(...point);
  function matte(color,roughness=.72,metalness=0){
    const key=color+":"+roughness+":"+metalness;
    if(!surfaces.has(key))surfaces.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));
    return surfaces.get(key);
  }
  function mesh(geometry,material,x,y,z,parent=root){
    const object=new T.Mesh(geometry,material);
    object.position.set(x,y,z);parent.add(object);return object;
  }
  function block(color,x,y,z,w,h,d,parent=root){
    const object=mesh(boxGeometry,matte(color),x,y,z,parent);
    object.scale.set(w,h,d);return object;
  }
  function oval(color,x,y,z,w,h,d,parent=root){
    const object=mesh(sphere,matte(color),x,y,z,parent);
    object.scale.set(w,h,d);return object;
  }
  function round(color,x,y,z,r,h,parent=root){
    const object=mesh(cylinder,matte(color),x,y,z,parent);object.scale.set(r,h,r);return object;
  }
  function tube(color,points,radius,parent=root){
    const curve=new T.CatmullRomCurve3(points.map(vector));
    return mesh(new T.TubeGeometry(curve,points.length*3,radius,6,false),matte(color),0,0,0,parent);
  }
  function group(x,y,z,parent=root){
    const object=new T.Group();object.position.set(x,y,z);parent.add(object);return object;
  }
  return {T,root,matte,mesh,block,oval,round,tube,group,vector};
}

function spinPigment(T){
  const size=320,paint=new Uint8Array(size*size*4);
  const pigments=[[11,43,75],[50,167,178],[219,80,73],[246,192,91],
    [78,43,125],[199,52,111],[239,224,189],[37,91,142],[27,146,133]];
  for(let row=0;row<size;row++){
    for(let column=0;column<size;column++){
      const x=(column+.5)*2/size-1.035,y=(row+.5)*2/size-.972;
      const radius=Math.hypot(x,y),ray=Math.atan2(y,x)+Math.PI;
      const whirl=ray+.21*radius+.23*radius**2+.056*Math.sin(ray*7+radius*12);
      const sector=(whirl/tau*pigments.length+pigments.length)%pigments.length;
      const index=Math.floor(sector),fraction=sector-index;
      const nearColor=pigments[index],next=pigments[(index+1)%pigments.length];
      const grain=((column*61+row*79+((column*row*19)%97))%109)/109;
      const filaments=.55+.29*Math.sin(whirl*117+radius*14)+.16*Math.cos(whirl*243-radius*17);
      const paintEdge=.51+.33*Math.sin(radius*24+index*2.3)+.07*grain;
      const spread=clamp((fraction-paintEdge)*12+.5);
      const darkLine=clamp((.36-filaments)*3)*.28;
      const brightLine=clamp((filaments-.84)*5)*(.26+.38*Math.sin(radius*31+ray)**2);
      const streaks=Math.exp(-(((fraction-.17-.13*Math.sin(radius*11+index))/.044)**2))*
        clamp((radius-.26)*2)*(.58+.42*Math.sin(whirl*27)**2);
      const paintBody=clamp(radius*18)*(.87+.11*Math.sin(radius*17+ray*5)+.064*grain);
      const seam=clamp((Math.abs(Math.sin(whirl*28))-.973)*25)*clamp(radius-.38)*(.6+.4*grain);
      const at=(row*size+column)*4;
      for(let band=0;band<3;band++){
        const shade=mix(nearColor[band],next[band],spread)*paintBody*(1-darkLine);
        const glaze=brightLine*.29+streaks*.32+seam*.51;
        paint[at+band]=clamp(mix(shade,[252,235,199][band],glaze)+grain*5,0,255);
      }
      paint[at+3]=255;
    }
  }
  const texture=new T.DataTexture(paint,size,size);
  texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=true;
  texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
  return texture;
}

function spinPainting({T,matte,mesh,block}){
  for(const side of [-1,1]){
    block(0x353437,side*.97,.375,-.16,.47,.11,1.37);
    block(0x4c4b4d,side*.96,1.09,-.27,.13,1.40,.14).rotation.z=side*.24;
  }
  const backing=mesh(new T.CylinderGeometry(2.03,2.03,.17,80),matte(0x77523b),0,2.43,0);
  backing.rotation.x=Math.PI/2;
  mesh(new T.TorusGeometry(2.026,.054,10,80),matte(0x52403a,.53),0,2.43,.091);
  mesh(new T.CircleGeometry(2.007,80),new T.MeshBasicMaterial({map:spinPigment(T),toneMapped:false}),0,2.43,.101);
  for(const turn of [-.24,.24]){
    block(0xbf956a,0,2.43,-.119,2.32,.13,.13).rotation.z=turn;
  }
}

function pharmacyCabinet(kit){
  const {T,root,matte,mesh,block}=kit;
  const frame=0xb4b8b0,grip=0x525a59;
  block(0x313b3b,0,.42,0,4.34,.20,1.16);
  block(0x344947,0,2.23,-.49,4.22,3.64,.11);
  block(frame,0,4.11,0,4.38,.19,1.14);
  for(const side of [-1,1]){
    block(frame,side*2.11,2.30,0,.14,3.60,1.07);
    block(0x939d98,side*2.05,2.32,.535,.034,3.51,.058);
  }
  const shelfLevels=[.77,1.57,2.37,3.17];
  for(const y of shelfLevels){
    block(0x74827b,0,y,0,4.1,.108,1.0);
    block(0xc9d0be,0,y+.025,.498,4.08,.049,.043);
    block(0x606b60,0,y+.061,-.34,3.99,.030,.235);
  }
  const glass=new T.MeshPhysicalMaterial({color:0x9bd4c9,roughness:.10,metalness:.24,
    transparent:true,opacity:.065,depthWrite:false});
  mesh(new T.BoxGeometry(4.12,3.33,.035),glass,0,2.318,.557).renderOrder=4;
  for(const side of [-1,1])block(grip,side*.17,2.34,.602,.046,.37,.069);
  block(frame,0,2.31,.555,.037,3.52,.046);

  const profile=[
    [.89,0],[1,.06],[1,.67],[.95,.73],[.63,.83],[.52,.88],[.52,.97],
  ].map(point=>new T.Vector2(...point));
  const bottle=new T.LatheGeometry(profile,16);
  const cap=new T.CylinderGeometry(1,1,1,16),box=new T.BoxGeometry(1,1,1);
  const batches=new Map(),dummy=new T.Object3D();
  const palette=[0x9a5839,0x24727b,0x456b53,0xa67343,0x704d62,0xc7c2a4];
  function batch(geometry,material,x,y,z,w,h,d){
    const key=geometry.id+":"+material.id;
    if(!batches.has(key))batches.set(key,{geometry,material,transforms:[]});
    dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();
    batches.get(key).transforms.push(dummy.matrix.clone());
  }
  for(const [row,floor] of shelfLevels.entries()){
    for(let slot=0;slot<9;slot++){
      if((row*2+slot)%11===6)continue;
      const x=(slot-4)*.425,y=floor+.057,z=.122;
      const color=palette[(row*3+slot*2)%palette.length],r=.112+.019*((row+slot)%4);
      const height=.34+.044*((row*7+slot*3)%5);
      if((row+slot)%5===1){
        batch(box,matte(0xe6d9bb),x,y+height/2,z,.27,height,.22);
        batch(box,matte(color),x,y+height*.67,z+.115,.28,.066,.016);
        batch(box,matte(0x5f7b72),x-.035,y+height*.38,z+.119,.124,.019,.011);
      }else{
        batch(bottle,matte(color,.28,.12),x,y,z,r,height,r);
        batch(cap,matte((row+slot)%2?0xd7bd87:0x52585b,.38,.28),x,y+height*.995,z,r*.63,.075,r*.63);
        batch(box,matte(0xe8ddba),x,y+height*.39,z+r+.003,r*1.52,.103,.023);
        batch(box,matte(0x516b66),x,y+height*.39+.013,z+r+.018,r*.86,.012,.009);
      }
    }
  }
  for(const {geometry,material,transforms} of batches.values()){
    const bottles=new T.InstancedMesh(geometry,material,transforms.length);
    transforms.forEach((matrix,index)=>bottles.setMatrixAt(index,matrix));
    bottles.computeBoundingSphere();root.add(bottles);
  }
}

const gaussian=(x,y,px,py,dx,dy)=>Math.exp(-(((x-px)/dx)**2+((y-py)/dy)**2));
function sleepingMask(kit){
  const {T,mesh,matte,block,oval,tube,group}=kit;
  const clothColor=0x87958d;
  block(0x766961,0,.386,0,2.56,.132,1.96);
  oval(clothColor,0,.565,0,1.27,.225,1.00);
  for(let fold=0;fold<7;fold++){
    const x=(fold-3)*.307;
    tube(fold%2?0x77867e:0x9ca7a0,[[x,.522,.83],[x+.08,.568,.72],[x+.10,.590,.55]],.017);
  }
  const face=group(-.06,1.66,.012);
  face.rotation.set(-.51,.22,-.15,"YXZ");
  const shape=new T.SphereGeometry(1,56,36),points=shape.getAttribute("position"),tints=[];
  const tint=new T.Color(),skin=new T.Color(0xca9a86),flush=new T.Color(0xb77c6b);
  const rX=.79,rY=1.13,rZ=.66;
  const widthAt=y=>rX*(1-.13*Math.max(0,-y/rY));
  const raised=(x,y)=>.25*gaussian(x,y,.045,.015,.142,.23)+.085*gaussian(x,y,.017,.269,.107,.31)+
    .066*gaussian(x,y,.00,-.46,.37,.19)+.040*gaussian(Math.abs(x),y,.36,-.095,.24,.28)-
    .081*gaussian(Math.abs(x),y,.335,.236,.179,.15);
  const faceZ=(x,y)=>rZ*Math.sqrt(Math.max(0,1-(x/widthAt(y))**2-(y/rY)**2))+raised(x,y);
  for(let i=0;i<points.count;i++){
    const ux=points.getX(i),uy=points.getY(i),uz=points.getZ(i),y=uy*rY,x=ux*widthAt(y);
    const front=Math.max(0,uz),z=rZ*uz+front**.52*raised(x,y);
    points.setXYZ(i,x,y,z);
    const blush=gaussian(Math.abs(x),y,.43,-.071,.23,.28);
    const tone=.98+.025*Math.sin(x*121+y*111)+.022*Math.cos(y*89-z*60)-
      .047*gaussian(Math.abs(x),y,.322,.23,.34,.12);
    tint.copy(skin).lerp(flush,blush*.39*front).multiplyScalar(tone);
    tints.push(tint.r,tint.g,tint.b);
  }
  shape.setAttribute("color",new T.Float32BufferAttribute(tints,3));shape.computeVertexNormals();
  mesh(shape,new T.MeshStandardMaterial({vertexColors:true,roughness:.82}),0,0,0,face);
  const temple=new T.SphereGeometry(1,32,16,0,tau,0,1.43);
  const hair=mesh(temple,matte(0x423937,.89),0,.33,-.015,face);
  hair.scale.set(.711,.84,.613);
  for(let comb=0;comb<18;comb++){
    const a=comb/18*tau;
    const strand=[];
    for(const t of [.16,.43,.74,1.04,1.31]){
      strand.push([Math.cos(a+t*.18)*Math.sin(t)*.714,.33+Math.cos(t)*.847,
        -.014+Math.sin(a+t*.18)*Math.sin(t)*.62]);
    }
    tube(comb%3===0?0x655754:0x534745,strand,.012,face);
  }
  for(const side of [-1,1]){
    oval(0xc38473,side*.742,-.016,-.025,.151,.239,.126,face).rotation.z=side*.15;
    oval(0xa47063,side*.799,-.004,.066,.041,.14,.024,face);
    const pointsOnFace=(xs,ys,depth)=>xs.map((value,index)=>{
      const x=side*value,y=ys[index];return [x,y,faceZ(x,y)+depth];
    });
    tube(0x956857,pointsOnFace([.141,.232,.347,.431,.531],[.205,.178,.169,.182,.223],.013),.016,face);
    tube(0x785548,pointsOnFace([.137,.251,.347,.468,.534],[.335,.384,.392,.368,.334],.013),.021,face);
    oval(0x8d6257,side*.085,-.111,faceZ(side*.085,-.111)-.017,.038,.018,.019,face);
  }
  const lipPoints=[[-.213,-.31],[-.124,-.337],[.008,-.34],[.125,-.332],[.22,-.306]];
  tube(0x7d5b54,lipPoints.map(([x,y])=>[x,y,faceZ(x,y)+.022]),.013,face);
  tube(0xb77e77,lipPoints.slice(1,4).map(([x,y])=>[x,y-.033,faceZ(x,y-.033)+.021]),.026,face);
}

function taperedFinger(kit,coordinates,radii,color,parent){
  const {T,vector,mesh,matte}=kit;
  const path=new T.CatmullRomCurve3(coordinates.map(vector),false,"catmullrom",.40);
  const segments=18,sides=12,vertices=[],indices=[],frames=path.computeFrenetFrames(segments,false);
  for(let step=0;step<=segments;step++){
    const t=step/segments,at=t*(radii.length-1),part=Math.min(radii.length-2,Math.floor(at));
    const radius=mix(radii[part],radii[part+1],at-part),center=path.getPointAt(t);
    for(let radial=0;radial<sides;radial++){
      const turn=radial/sides*tau;
      const point=center.clone().addScaledVector(frames.normals[step],Math.cos(turn)*radius)
        .addScaledVector(frames.binormals[step],Math.sin(turn)*radius*.79);
      vertices.push(point.x,point.y,point.z);
      if(step===segments)continue;
      const a=step*sides+radial,b=step*sides+(radial+1)%sides;
      indices.push(a,b,a+sides,b,b+sides,a+sides);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(geometry,matte(color),0,0,0,parent);
}

function openHand(kit){
  const {oval,round,tube,group}=kit;
  const skin=0xcba183,crease=0xad8168;
  const hand=group(0,.13,0);hand.rotation.z=.27;
  round(0x516260,0,.46,0,.58,.28);
  oval(skin,0,.82,-.012,.36,.51,.253,hand);
  oval(skin,-.015,1.47,.005,.636,.78,.302,hand);
  oval(0xcfaa8a,.355,1.352,.12,.270,.453,.201,hand).rotation.z=-.22;
  oval(0xc69a7b,-.349,1.425,.115,.220,.466,.169,hand).rotation.z=.13;
  const digits=[
    [[-.449,1.85,-.036],[-.600,2.12,-.044],[-.655,2.359,.068],[-.677,2.414,.199]],
    [[-.153,2.029,-.049],[-.25,2.466,-.085],[-.299,2.681,.047],[-.332,2.732,.193]],
    [[.129,2.042,-.067],[.113,2.522,-.087],[.097,2.818,.021],[.101,2.869,.165]],
    [[.388,1.978,-.043],[.454,2.390,-.061],[.488,2.682,.047],[.497,2.708,.180]],
    [[.426,1.237,-.027],[.746,1.343,.021],[.892,1.501,.141],[.903,1.648,.211]],
  ];
  for(const [index,points] of digits.entries()){
    const big=index===4?.174:index===0?.117:.138;
    taperedFinger(kit,points,[big,big*.89,big*.72,.002],skin,hand);
    const [x,y,z]=points[2];
    const nail=oval(0xd6ae98,x,y+.018,z+.046,big*.57,big*.58,.026,hand);
    nail.rotation.x=-.28;
    tube(crease,[[x-big*.48,y-.062,z+.081],[x,y-.050,z+.103],
      [x+big*.50,y-.059,z+.080]],.009,hand);
  }
  for(const coordinates of [
    [[.305,1.852,.198],[.195,1.650,.287],[.195,1.420,.294],[.381,1.208,.231]],
    [[-.421,1.686,.204],[-.124,1.639,.296],[.079,1.495,.313],[.338,1.331,.275]],
    [[-.384,1.885,.189],[-.131,1.911,.253],[.112,1.846,.271],[.404,1.779,.208]],
    [[-.236,1.014,.197],[-.023,.985,.250],[.194,1.003,.209]],
  ])tube(crease,coordinates,.010,hand);
}

function cornerFigure(kit){
  const {block,oval,tube,group}=kit;
  block(0x626463,0,.454,-.09,2.46,.268,1.88);
  block(0xb1aaa1,-.89,1.02,-.174,.155,1.21,1.62);
  block(0x9d9791,-.368,1.02,-.886,1.18,1.21,.156);
  for(let joint=0;joint<4;joint++){
    block(0x918c85,-.804,.652+joint*.229,-.174,.012,.015,1.61);
    block(0x777873,-.37,.652+joint*.229,-.797,1.05,.014,.016);
  }
  const figure=group(-.28,.588,-.213);
  figure.rotation.set(0,-.42,.07);figure.scale.setScalar(.72);
  const cloth=0x8c7859,pants=0x555450,skin=0xbb9278,scarf=0x574e47;
  for(const side of [-1,1]){
    const x=side*.075;
    taperedFinger(kit,[[x,.67,-.032],[x+side*.013,.36,.007],[x+side*.022,.083,.027]],[.068,.057,.050],pants,figure);
    oval(0x3f3c36,x+side*.02,.039,.084,.064,.039,.118,figure);
  }
  taperedFinger(kit,[[0,.365,0],[-.008,.64,-.015],[.021,.891,-.005],[.037,1.002,.018]],[.163,.168,.185,.071],cloth,figure);
  oval(0x73664f,.009,.822,.107,.133,.107,.041,figure);
  tube(0x605844,[[.014,.47,.128],[.018,.61,.138],[.026,.752,.138],[.037,.901,.088]],.010,figure);
  oval(scarf,.04,.970,.019,.106,.053,.089,figure);
  oval(skin,.041,1.104,.032,.086,.107,.084,figure);
  oval(0x514a41,.025,1.159,.008,.094,.074,.087,figure);
  oval(skin,.068,1.100,.111,.021,.024,.021,figure);
  for(const side of [-1,1]){
    taperedFinger(kit,[[side*.132,.906,.013],[side*.164,.743,.066],[side*.091,.623,.138],
      [side*.044,.634,.159]],[.062,.055,.041,.036],cloth,figure);
    oval(skin,side*.040,.633,.155,.041,.031,.033,figure);
  }
  const bag=group(.13,.055,.203,figure);bag.rotation.y=-.15;
  block(0x645749,0,.147,0,.228,.280,.128,bag);
  block(0x9b8667,0,.213,.069,.225,.098,.019,bag);
  block(0xb9a071,0,.187,.083,.033,.018,.016,bag);
  tube(0x5e4d3e,[[-.049,.281,0],[-.025,.343,0],[.032,.346,0],[.061,.278,0]],.010,bag);
}

const builders={"hirst-spin":spinPainting,"hirst-cabinet":pharmacyCabinet,"mueck-mask":sleepingMask,
  "mueck-hand":openHand,"mueck-scale":cornerFigure};

export function addGuestMuseumWork(T,art,exhibit){
  const build=builders[exhibit.id];
  if(build)build(workKit(T,art));
}
