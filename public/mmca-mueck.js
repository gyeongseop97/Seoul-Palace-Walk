// An original figure made for the gallery. The sculpted planes and garment folds
// are built in local coordinates so the same mesh can be lit from every side.
export function buildMueckSculpture(T,parent){
  const figure=new T.Group();
  parent.add(figure);
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  const matte=(color,roughness=.87,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
  const skin=matte(0xc99880,.82),faceMaterial=matte(0xffffff,.83,{vertexColors:true});
  const jacket=matte(0x577373,.96,{vertexColors:true});
  const cuffs=matte(0x466263,.96),trousers=matte(0x5a5554,.96,{vertexColors:true});
  const shoe=matte(0x494441,.81),sole=matte(0x343237,.91),sock=matte(0xa69a80);
  const hair=matte(0xffffff,.88,{vertexColors:true});
  const skinShadow=matte(0x8c635a),skinLine=matte(0x99695d);
  const softSkin=matte(0xc8998b),nail=matte(0xd5a494,.54);
  const lip=matte(0x9c665d,.77),line=matte(0x714c45);
  const lid=matte(0xb17d6a),ivory=matte(0xc2aa97,.52),pupil=matte(0x332a25,.31);
  const iris=matte(0x756256,.54);
  const brows=matte(0x595350);
  const sphereGeometry=new T.SphereGeometry(1,18,12);
  const boxGeometry=new T.BoxGeometry(1,1,1);
  function put(geometry,material,x,y,z,root=figure){
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(x,y,z);root.add(mesh);
    return mesh;
  }
  function oval(material,x,y,z,w,h,d,root=figure){
    const model=put(sphereGeometry,material,x,y,z,root);
    model.scale.set(w,h,d);
    return model;
  }
  function block(material,x,y,z,w,h,d,root=figure){
    const model=put(boxGeometry,material,x,y,z,root);
    model.scale.set(w,h,d);
    return model;
  }
  function geometry(vertices,indices,colors){
    const model=new T.BufferGeometry();
    model.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    if(colors)model.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    model.setIndex(indices);model.computeVertexNormals();
    model.computeBoundingSphere();
    return model;
  }
  function form(rows,sides,point,color,flip=false){
    const vertices=[],indices=[],colors=color?[]:null;
    for(let row=0;row<=rows;row++){
      for(let side=0;side<sides;side++){
        const t=row/rows,a=side/sides*Math.PI*2,p=point(t,a);
        vertices.push(p.x,p.y,p.z);
        if(color){
          const tint=color(t,a,p);
          colors.push(tint.r,tint.g,tint.b);
        }
        if(row===rows)continue;
        const first=row*sides+side,next=row*sides+(side+1)%sides,upper=first+sides,upperNext=next+sides;
        if(flip)indices.push(first,next,upper,next,upperNext,upper);
        else indices.push(first,upper,next,next,upper,upperNext);
      }
    }
    return geometry(vertices,indices,colors);
  }
  const mix=(a,b,t)=>a+(b-a)*t;
  const profile=(pairs,t)=>{
    const at=t*(pairs.length-1),index=Math.min(pairs.length-2,Math.floor(at));
    return [mix(pairs[index][0],pairs[index+1][0],at-index),mix(pairs[index][1],pairs[index+1][1],at-index)];
  };
  function limb(material,sections,{wrinkles=0,tint=false,steps=30,sides=24,root=figure}={}){
    const path=new T.CatmullRomCurve3(sections.map(([x,y,z])=>v(x,y,z)),false,"catmullrom",.36);
    const widths=sections.map(([, , ,w,d])=>[w,d]);
    const color=tint?(t,a)=>{
      const knit=Math.cos(a*34+t*28)*.020+Math.sin(t*115-a*3)*.028;
      const worn=Math.sin(Math.PI*t)*.055;
      const brightness=.89+worn+knit;
      return new T.Color().setRGB(brightness,brightness,brightness);
    }:null;
    const surface=form(steps,sides,(t,a)=>{
      const p=path.getPoint(t),axis=path.getTangent(t).normalize();
      const forward=Math.abs(axis.z)<.90?v(0,0,1):v(0,1,0);
      const right=new T.Vector3().crossVectors(axis,forward).normalize();
      const across=new T.Vector3().crossVectors(right,axis).normalize();
      const [w,d]=profile(widths,t);
      const fold=1+wrinkles*Math.sin(Math.PI*t)*(Math.sin(t*39+Math.cos(a*2)*1.8+a)*.61+Math.sin(t*67-a*3)*.22);
      return p.addScaledVector(right,Math.sin(a)*w*fold).addScaledVector(across,Math.cos(a)*d*fold);
    },color,true);
    return put(surface,material,0,0,0,root);
  }
  const strokes=[];
  function seam(material,points,radius,root=figure){
    strokes.push({material,points,radius,root});
  }
  function drawStrokes(){
    const batches=new Map();
    for(const {material,points,radius,root} of strokes){
      const key=material.uuid+root.uuid;
      const batch=batches.get(key)??{material,root,vertices:[],indices:[]};
      batches.set(key,batch);
      const path=new T.CatmullRomCurve3(points.map(p=>v(...p)));
      const detail=Math.max(4,points.length*3),radial=4;
      const frames=path.computeFrenetFrames(detail,false);
      const offset=batch.vertices.length/3;
      for(let i=0;i<=detail;i++){
        const center=path.getPointAt(i/detail);
        for(let j=0;j<radial;j++){
          const angle=j/radial*2*Math.PI;
          const r=radius*(.55+.45*Math.sin(Math.PI*i/detail));
          const point=center.clone().addScaledVector(frames.normals[i],Math.cos(angle)*r)
            .addScaledVector(frames.binormals[i],Math.sin(angle)*r);
          batch.vertices.push(point.x,point.y,point.z);
          if(i===detail)continue;
          const a=offset+i*radial+j,b=offset+i*radial+(j+1)%radial;
          batch.indices.push(a,b,a+radial,b,b+radial,a+radial);
        }
      }
    }
    for(const {material,root,vertices,indices} of batches.values()){
      put(geometry(vertices,indices),material,0,0,0,root);
    }
  }

  // Powder-coated steel and painted oak bench.
  const bench=matte(0x3d6866,.75),wood=matte(0x59817c,.75),bracket=matte(0x355254,.65);
  const woodGrain=matte(0x436b66,.96),wornWood=matte(0x728781,.94);
  for(const x of [-1.54,1.54]){
    for(const z of [-.83,.37]){
      block(bracket,x,.87,z,.19,1.03,.19);
      block(bracket,x,.376,z,.36,.064,.35);
    }
    block(bench,x,1.20,-.24,.15,.12,1.50);
    block(bench,x,1.73,-1.0,.14,1.57,.16).rotation.x=-.11;
  }
  for(let strip=0;strip<5;strip++){
    const z=-.92+strip*.30;
    block(strip%2?wood:bench,0,1.39,z,3.62,.13,.279);
    block(wood,0,1.447,z,3.63,.022,.255);
    for(let lineIndex=0;lineIndex<3;lineIndex++){
      const shift=(lineIndex-1)*.073;
      seam(lineIndex===1?wornWood:woodGrain,[[-1.68,1.463,z+shift],[-.72,1.465,z+shift+.016],
        [.18,1.461,z+shift-.008],[1.67,1.463,z+shift+.01]],.0035);
    }
  }
  for(let strip=0;strip<3;strip++){
    const y=1.94+strip*.245,z=-1.0-strip*.03;
    block(strip%2?bench:wood,0,y,z,3.62,.209,.13);
  }
  const bag=matte(0x8c7258,.93),bagSeam=matte(0xbda587,.94);
  limb(bag,[[1.12,1.465,-.32,.22,.16],[1.17,1.54,-.34,.32,.24],
    [1.20,1.76,-.39,.27,.20],[1.19,1.87,-.44,.16,.053]],{wrinkles:.13,sides:26});
  for(const z of [-.54,-.34])seam(bagSeam,[[.99,1.82,z],[1.04,2.04,z],[1.28,2.03,z],[1.40,1.82,z]],.023);

  // Pelvis, leaning torso and folded trousers are each continuous surfaces.
  limb(trousers,[[-.24,1.46,-.32,.46,.30],[-.25,1.59,-.30,.66,.37],
    [-.24,1.84,-.34,.62,.32],[-.23,1.97,-.30,.48,.26]],{tint:true,wrinkles:.05});
  limb(jacket,[[-.22,1.78,-.29,.55,.28],[-.27,1.98,-.23,.65,.36],
    [-.19,2.31,-.13,.57,.34],[-.04,2.62,-.005,.61,.38],
    [.05,2.79,.08,.65,.30],[.09,2.94,.11,.51,.269],[.17,3.05,.15,.255,.185]],{tint:true,wrinkles:.068,steps:46,sides:40});
  limb(cuffs,[[.144,2.96,.14,.277,.195],[.17,3.06,.15,.27,.194],[.18,3.13,.17,.238,.171]],{steps:11,sides:28});
  limb(skin,[[.15,3.035,.14,.211,.175],[.19,3.18,.17,.212,.185],[.245,3.35,.23,.237,.212]],{steps:13});
  for(const side of [-1,1]){
    const x=side===-1?-.74:.385,z=side===-1?1.19:1.04;
    limb(trousers,[[x,1.69,-.28,.33,.28],[x,1.64,.16,.45,.37],
      [x+side*.045,1.64,.61,.415,.343],[x+side*.095,1.67,z-.16,.378,.32],
      [x+side*.12,1.62,z+.10,.356,.315],[x+side*.17,1.32,z+.23,.283,.275],
      [x+side*.185,.96,z+.31,.247,.21],[x+side*.18,.60,z+.41,.202,.181]],{tint:true,wrinkles:.13,steps:42});
    const shoeX=x+side*.18;
    limb(sock,[[shoeX,.48,z+.45,.17,.16],[shoeX,.55,z+.44,.19,.166],[shoeX,.635,z+.418,.205,.172]],{steps:8});
    const upper=oval(shoe,shoeX,.456,z+.67,.245,.106,.419);
    upper.rotation.y=side*.12;
    const outsole=oval(sole,shoeX,.358,z+.68,.253,.041,.437);
    outsole.rotation.y=side*.12;
    seam(woodGrain,[[shoeX-.19,.45,z+.75],[shoeX-.15,.479,z+.85],[shoeX,.49,z+.90],
      [shoeX+.15,.479,z+.85],[shoeX+.19,.45,z+.75]],.010);
  }

  // The right arm bears the head's weight and the left hand rests over the knee.
  limb(jacket,[[.53,2.78,.10,.285,.276],[.69,2.60,.13,.315,.29],[.79,2.36,.22,.264,.245],
    [.82,2.22,.42,.239,.211],[.81,2.26,.68,.218,.197],[.75,2.58,.75,.216,.183],
    [.737,2.88,.669,.183,.141],[.714,3.035,.576,.143,.120]],{tint:true,wrinkles:.11,steps:35});
  limb(cuffs,[[.727,2.90,.645,.159,.128],[.713,3.04,.583,.149,.120],[.706,3.11,.553,.130,.108]],{steps:10});
  limb(skin,[[.713,3.079,.558,.108,.090],[.708,3.22,.528,.107,.088],[.679,3.34,.51,.114,.098]],{steps:12});
  limb(jacket,[[-.43,2.755,-.025,.255,.258],[-.63,2.58,.045,.298,.272],[-.81,2.37,.135,.266,.241],
    [-.93,2.14,.31,.222,.215],[-.955,1.96,.58,.196,.175],[-.933,1.89,.82,.184,.154],
    [-.918,1.84,.98,.166,.124]],{tint:true,wrinkles:.10,steps:35});
  limb(cuffs,[[-.938,1.885,.87,.183,.148],[-.924,1.835,.994,.166,.137],[-.922,1.808,1.04,.152,.125]],{steps:10});
  oval(skin,-.926,1.80,1.154,.171,.088,.204).rotation.x=-.20;
  oval(skin,.68,3.33,.477,.116,.205,.129).rotation.z=-.2;
  function finger(points,radius){
    limb(skin,points.map((p,i)=>[...p,radius*[.93,1,.84,.13][i],radius*[.86,.93,.81,.13][i]]),{steps:13,sides:10});
  }
  for(let i=0;i<4;i++){
    const x=-1.055+i*.082,length=[.16,.22,.20,.16][i],z=1.30+(1-Math.abs(i-1.5)/2)*.033;
    finger([[x,1.79,z-.086],[x-.008,1.773,z],[x-.017,1.71,z+length*.72],[x-.01,1.66,z+length]],.042);
    oval(nail,x-.014,1.703,z+length*.78,.024,.011,.033).rotation.x=-.58;
  }
  finger([[-.82,1.805,1.113],[-.759,1.782,1.178],[-.75,1.734,1.27],[-.762,1.717,1.328]],.049);
  for(let i=0;i<4;i++){
    const x=.687+(i-1.5)*.058,y=3.37+(i%2)*.026,z=.456-(i-1.5)*.020;
    const extension=[.17,.26,.245,.21][i];
    finger([[x,y,z],[x-.018,y+.105,z+.003],[x-.055,y+extension*.79,z-.018],[x-.075,y+extension,z-.039]],.034);
    oval(nail,x-.056,y+extension*.86,z+.005,.021,.031,.011).rotation.z=.25;
  }
  finger([[.712,3.24,.552],[.662,3.258,.594],[.611,3.278,.601],[.578,3.306,.574]],.043);
  seam(skinLine,[[-1.032,1.86,1.123],[-.962,1.872,1.165],[-.897,1.874,1.185]],.008);
  seam(skinLine,[[.715,3.213,.607],[.682,3.236,.584],[.671,3.268,.592]],.007);

  // Subtle face relief and painted tones carry the cheekbones, eye sockets and brow.
  const head=new T.Group();
  head.position.set(.26,3.67,.242);head.rotation.set(.10,.045,-.17);
  figure.add(head);
  const headRows=[
    [.015,.018],[.302,.267],[.387,.365],[.422,.413],[.460,.444],[.468,.473],[.464,.488],
    [.440,.452],[.367,.388],[.269,.275],[.08,.091],[.007,.007],
  ];
  const lower=-.585,upper=.615;
  function gaussian(value,center,width){
    const offset=(value-center)/width;
    return Math.exp(-offset*offset);
  }
  function facePoint(t,a){
    const y=mix(lower,upper,t),[rx,rz]=profile(headRows,t),x=Math.sin(a)*rx;
    const front=Math.max(0,Math.cos(a)),absX=Math.abs(x);
    const cheeks=gaussian(absX,.305,.132)*gaussian(y,-.093,.177)*.061;
    const socket=gaussian(absX,.208,.106)*gaussian(y,.103,.112)*.046;
    const brow=gaussian(absX,.204,.15)*gaussian(y,.225,.075)*.028;
    const nose=gaussian(x,0,.093)*gaussian(y,-.025,.172)*.133+gaussian(x,0,.116)*gaussian(y,-.086,.066)*.084;
    const mouth=gaussian(x,.006,.208)*gaussian(y,-.307,.109)*.052;
    const chin=gaussian(x,.01,.215)*gaussian(y,-.465,.096)*.040;
    const z=Math.cos(a)*rz-.034*t+front**4*(cheeks-socket+brow+nose+mouth+chin);
    return v(x,y,z);
  }
  const skinColor=new T.Color(0xcb9a82),redness=new T.Color(0xbb756b),shade=new T.Color(0x967569),light=new T.Color(0xe1ae93);
  function faceColor(t,a,p){
    const front=Math.max(0,Math.cos(a));
    const cheek=gaussian(Math.abs(p.x),.284,.153)*gaussian(p.y,-.102,.14)*front*.42;
    const sockets=gaussian(Math.abs(p.x),.22,.20)*gaussian(p.y,.113,.122)*front*.39;
    const noise=(Math.sin(p.x*121+p.y*199)*Math.cos(p.z*171)-Math.sin(p.y*91+p.z*229))*.015;
    return skinColor.clone().lerp(redness,cheek).lerp(shade,sockets+(1-t)*.13)
      .lerp(light,t*.25+front*.08).multiplyScalar(1+noise);
  }
  put(form(58,88,facePoint,faceColor,true),faceMaterial,0,0,0,head);

  for(const side of [-1,1]){
    const ear=oval(skin,side*.451,-.016,.015,.095,.180,.110,head);
    ear.rotation.x=-.16;ear.rotation.z=side*.13;
    oval(skinShadow,side*.500,.000,.067,.039,.087,.055,head).rotation.z=side*.19;
    seam(softSkin,[[side*.49,-.133,.081],[side*.522,-.056,.112],[side*.522,.055,.111],
      [side*.496,.123,.085],[side*.469,.144,.034]],.017,head);
    oval(skin,side*.482,-.142,.067,.049,.049,.054,head);
    const eyeX=side*.207,y=.098+(side===1?.008:0),z=.397;
    const eye=oval(ivory,eyeX,y,z,.108,.034,.045,head);
    eye.rotation.z=side*.045;
    const irisX=eyeX+side*.009+.004;
    oval(iris,irisX,y+.009,z+.042,.027,.025,.009,head);
    oval(pupil,irisX,y+.010,z+.049,.014,.017,.004,head);
    oval(matte(0xf0dfd0,.22),irisX-.008,y+.019,z+.052,.005,.006,.003,head);
    const a=[eyeX-.105,y-.004,z+.004],b=[eyeX+.101,y-.006,z+.004];
    seam(line,[a,[eyeX-.061,y+.018,z+.042],[eyeX+.025,y+.03,z+.045],b],.009,head);
    seam(lid,[a,[eyeX-.070,y-.025,z+.026],[eyeX+.023,y-.029,z+.044],b],.013,head);
    seam(skinShadow,[[eyeX-.10,y+.049,z-.004],[eyeX-.049,y+.064,z+.033],
      [eyeX+.046,y+.067,z+.023],[eyeX+.106,y+.045,z-.015]],.009,head);
    const x=side*.199;
    for(let i=0;i<17;i++){
      const u=i/16,q=x+side*(u-.5)*.191,height=.219+Math.sin(u*Math.PI)*.022,depth=.419-Math.abs(q)*.081;
      seam(brows,[[q,height,depth],[q+side*.014,height+.016,depth-.004],
        [q+side*.026,height+.022,depth-.011]],.004,head);
    }
    oval(skin,side*.072,-.114,.525,.061,.050,.062,head);
    oval(skinShadow,side*.058,-.145,.563,.032,.013,.013,head).rotation.z=-side*.25;
  }
  oval(lip,.009,-.279,.462,.150,.024,.030,head);
  oval(softSkin,.013,-.310,.474,.127,.029,.029,head);
  seam(line,[[-.141,-.291,.467],[-.064,-.287,.485],[.005,-.299,.499],
    [.072,-.293,.490],[.152,-.304,.463]],.008,head);
  seam(skinLine,[[-.092,-.357,.468],[.006,-.369,.483],[.092,-.356,.467]],.006,head);

  // The cap follows the skull. Fine swept strands and a visible part give it a soft edge.
  function hairLimit(a){
    const front=Math.max(0,Math.cos(a));
    return .37+.33*front**2+.055*Math.sin(a*2+.35)*front;
  }
  function scalp(t,a,gap=.033){
    const p=facePoint(t,a);
    const thick=gap*(.61+.39*Math.sin(Math.PI*t));
    p.x+=Math.sin(a)*thick;p.z+=Math.cos(a)*thick;p.y+=gap*(.36+.64*t);
    return p;
  }
  const charcoal=new T.Color(0x575250),silver=new T.Color(0xa8a29c);
  put(form(29,60,(t,a)=>scalp(mix(hairLimit(a),1,t),a),(t,a)=>{
    const gleam=(Math.sin(a*19+t*14)+Math.sin(a*28+t*8)+2)*.17;
    return charcoal.clone().lerp(silver,gleam*.52+.19);
  },true),hair,0,0,0,head);
  const strands=[matte(0x89827f),matte(0xa49b90),matte(0xc4b9ac),matte(0x514c4d)];
  for(let index=0;index<108;index++){
    const a=(index*.6180339887%1)*2*Math.PI,part=.41;
    const end=hairLimit(a)+.015+(index%4)*.011;
    const wiggle=(index%5-2)*.017;
    const points=Array.from({length:6},(_,i)=>{
      const t=i/5,bend=a+Math.sin(Math.PI*t)*(.25+wiggle)*Math.sign(Math.sin(a-part));
      return scalp(mix(.944-index%7*.007,end,t),bend,.039+(index%9)*.001).toArray();
    });
    seam(strands[index%4],points,.0047+(index%3)*.0014,head);
  }
  drawStrokes();
}
