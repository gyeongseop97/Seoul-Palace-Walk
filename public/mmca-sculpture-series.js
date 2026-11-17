const turn=Math.PI*2;
const palettes={
  home:[0x9a7465,0x637e79,0xa86b89,0xbda388],
  colors:[0x54b4b5,0x9164b1,0xe184a1,0xeab771,0x616bbe],
  objects:[0xc2724b,0x68918a,0xe2b467,0x936988,0x85945b],
  weave:[0xcead79,0x967e52,0x596f60,0x567e8c],
  tide:[0xc09254,0x496f80,0x8b5e49,0x31464c],
  wind:[0x416675,0x819c9d,0xb3c5bc,0xdfd5bd],
  hirst:[0x7bb8a7,0xb99168,0x78a5b4,0xeadac2],
};

function sculptureKit(T,root){
  const shapes={box:new T.BoxGeometry(1,1,1),oval:new T.SphereGeometry(1,16,12),
    cylinder:new T.CylinderGeometry(1,1,1,16),stone:new T.DodecahedronGeometry(1),crystal:new T.IcosahedronGeometry(1),
    ring:new T.TorusGeometry(1,.065,7,32)};
  const materials=new Map(),vertical=new T.Vector3(0,1,0);
  function surface(color,metalness=0,opacity=1){
    const key=`${color}-${metalness}-${opacity}`;
    if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness,roughness:opacity<1?.31:.56,
      transparent:opacity<1,opacity,depthWrite:opacity===1,side:opacity<1?T.DoubleSide:T.FrontSide}));
    return materials.get(key);
  }
  function mesh(geometry,color,position,scale,parent=root,metalness=0,opacity=1){
    const object=new T.Mesh(typeof geometry==="string"?shapes[geometry]:geometry,surface(color,metalness,opacity));
    object.position.set(...position);object.scale.set(...scale);parent.add(object);
    return object;
  }
  function group(x,y,z,parent=root){const object=new T.Group();object.position.set(x,y,z);parent.add(object);return object;}
  function rod(color,from,to,r,parent=root,metal=0){
    const a=new T.Vector3(...from),b=new T.Vector3(...to),axis=b.clone().sub(a),center=a.addScaledVector(axis,.5);
    const model=mesh("cylinder",color,center.toArray(),[r,axis.length(),r],parent,metal);
    model.quaternion.setFromUnitVectors(vertical,axis.normalize());
    return model;
  }
  function tube(color,points,r,parent=root,closed=false,metal=0){
    const path=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(...point)),closed);
    const geometry=new T.TubeGeometry(path,points.length*2,r,5,closed);
    return mesh(geometry,color,[0,0,0],[1,1,1],parent,metal);
  }
  function vessel(profile){return new T.LatheGeometry(profile.map(point=>new T.Vector2(...point)),18);}
  function ribbon(color,position,width,height,form,parent=root,opacity=1){
    const geometry=new T.PlaneGeometry(width,height,16,8),vertices=geometry.attributes.position;
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),y=vertices.getY(i);
      vertices.setXYZ(i,...form(x,y));
    }
    geometry.computeVertexNormals();
    const item=mesh(geometry,color,position,[1,1,1],parent,.09,opacity);
    item.material.side=T.DoubleSide;
    return item;
  }
  return {root,mesh,group,rod,tube,vessel,ribbon};
}

function architecture({mesh,rod,ribbon},index){
  const colors=palettes.home;
  function frame(w,h,x,y,z,color){
    for(const side of [-1,1]){
      mesh("box",color,[x+side*w/2,y,z],[.075,h+.12,.13]);
      mesh("box",color,[x,y+side*h/2,z],[w,.075,.13]);
    }
  }
  if(index===0){
    colors.forEach((color,i)=>{
      const w=2.35-i*.43,h=2.56-i*.39,z=-.91+i*.52,y=.40+h/2;
      frame(w,h,(i-1.5)*.18,y,z,color);
      mesh("box",color,[(i-1.5)*.18,y,z-.018],[w-.11,h-.08,.018],undefined,.03,.19);
    });
  }else if(index===1){
    colors.forEach((color,i)=>{
      const y=.88+i*.64,w=2.94-i*.33;
      ribbon(color,[0,y,0],w,1.99-i*.16,(x,z)=>[x,.56-Math.abs(z)*.66+Math.pow(x/w,4)*.77,z]);
      rod(color,[-w/2,y+.56,0],[w/2,y+.56,0],.037);
    });
    for(const x of [-1.22,1.22])rod(0x826b5c,[x,.33,-.30],[x,3.35,-.30],.032);
  }else if(index===2){
    for(const side of [-1,1])for(let step=0;step<7;step++){
      const x=side*(1.43-step*.207);
      mesh("box",colors[(step+side+1)%4],[x,.33+(step+1)*.13,side*.43],[.23,.085,.78]);
      rod(colors[1],[x,.31,side*.43],[x,.29+(step+1)*.13,side*.43],.027);
    }
    frame(.86,1.58,0,1.99,0,colors[2]);
    mesh("box",colors[3],[0,.47,0],[2.83,.08,.075]);
  }else{
    const rooms=[[-.58,1.25,-.31,1.59,1.75],[.58,1.91,.35,1.28,2.25]];
    rooms.forEach(([x,y,z,w,h],i)=>{
      frame(w,h,x,y,z,colors[i]);
      frame(w,h,x,y,z-.36,colors[i+2]);
      mesh("box",0xe5bf89,[x,y,z-.07],[w-.12,h-.10,.024],undefined,.06,.52);
      for(const side of [-1,1])for(const shift of [-1,0,1]){
        mesh("box",colors[i],[x+shift*w*.22,y,z+side*.015],[.029,h-.08,.067]);
        mesh("box",colors[i],[x,y+shift*h*.19,z+side*.015],[w,.030,.055]);
      }
    });
  }
}

function lightStudy({mesh,group,ribbon,rod},index){
  const colors=palettes.colors;
  if(index===0){
    for(let i=0;i<7;i++){
      const x=Math.sin(i*2.30)*.87,z=Math.cos(i*2.30)*.68,height=.53+(i%4)*.32;
      const gem=mesh("crystal",colors[i%5],[x,.37+height,z],[.34,height,.34],undefined,.21,i%2?.68:1);
      gem.rotation.set(i*.22,i*.63,-i*.11);gem.material.flatShading=true;
    }
  }else if(index===1){
    for(let i=0;i<11;i++){
      const angle=Math.PI*i/10,arch=group(Math.cos(angle)*1.06,.81+Math.sin(angle)*1.42,0);
      arch.rotation.z=angle+Math.PI/2;
      mesh("box",colors[i%5],[0,0,.11],[.82,.31,.19],arch,.31,.71);
      mesh("box",colors[(i+2)%5],[0,0,-.29],[.64,.24,.07],arch,.18,.36);
    }
    for(const side of [-1,1])rod(0x77748b,[side*1.08,.32,0],[side*1.08,.87,0],.08);
  }else if(index===2){
    mesh("crystal",0xe9c28a,[0,1.62,0],[.49,.52,.49],undefined,.26).material.flatShading=true;
    for(let i=0;i<6;i++){
      const rotor=group(0,1.62,0);
      rotor.rotation.set(.92+i*.53,i*.80,.30+i*.36);
      const radius=.53+i*.12;
      mesh("ring",colors[i%5],[0,0,0],[radius,radius,radius],rotor,.35);
      mesh("oval",0xf1d7b5,[radius,0,0],[.084,.084,.084],rotor,.31);
    }
    rod(0x778c8e,[0,.34,0],[0,.99,0],.074);
  }else{
    for(let i=0;i<7;i++){
      const blade=group((i-3)*.33,1.42,-.45+Math.abs(i-3)*.18);
      blade.rotation.y=(i-3)*.29;
      ribbon(colors[i%5],[0,0,0],.66,2.1,(x,y)=>[x+(y+1)*.15,y,.30*Math.cos(x*8+y)],blade,.72);
      rod(colors[(i+1)%5],[-.16,-1.04,0],[.16,1.05,0],.016,blade,.28);
    }
  }
}

const bowlProfile=[[0,0],[.43,0],[.52,.10],[.77,.32],[.96,.68],[1,.83],[.93,.83],[.87,.68],[.61,.34],[.38,.16],[0,.15]];
const potProfile=[[0,0],[.59,0],[.63,.08],[.92,.35],[.96,.64],[.73,.87],[.46,.92],[.45,.99],[.31,.99],[.33,.87],[.65,.69],[.45,.18],[0,.16]];

function tableObjects({mesh,group,rod,tube,vessel},index){
  const colors=palettes.objects,dish=vessel(bowlProfile),pot=vessel(potProfile);
  if(index===0){
    for(let i=0;i<8;i++){
      const x=Math.sin(i*.63)*.22,y=.36+i*.305,scale=.77-i*.045;
      const piece=group(x,y,0);piece.rotation.set(.19*Math.sin(i),i*.69,.14*Math.cos(i*.80));
      mesh(dish,colors[i%5],[0,0,0],[scale,.52,scale],piece,.11);
      mesh("ring",colors[i%5],[scale*.78,.23,0],[.26,.22,.23],piece,.11);
    }
  }else if(index===1){
    for(const [i,x,z,height] of [[0,-.92,.37,1.36],[1,.77,.56,1.58],[2,.14,-.39,2.34],[3,-.57,-.69,1.67]]){
      const base=.68-(i%2)*.15,pitcher=group(x,.33,z);pitcher.rotation.y=i*.73;
      mesh(pot,colors[i],[0,0,0],[base,height,base],pitcher,.14);
      mesh("ring",colors[i],[base*.77,height*.56,0],[.36,height*.29,.36],pitcher,.14);
      rod(colors[i],[0,height*.77,base*.40],[0,height*.96,base*.87],.092,pitcher,.12);
    }
  }else if(index===2){
    for(let i=0;i<8;i++){
      const angle=(i-3.5)*.28,y=.90+Math.cos(angle)*1.70,headX=Math.sin(angle)*1.24;
      const spoon=group(headX,y,-.49+(i%3)*.45);spoon.rotation.z=-angle;
      mesh(dish,colors[i%5],[0,.02,0],[.36,.17,.52],spoon,.42).rotation.x=Math.PI/2;
      rod(colors[(i+2)%5],[0,-1.26,0],[0,-.22,0],.049,spoon,.49);
    }
    mesh("box",0x65696b,[0,.53,0],[2.33,.36,.66]);
  }else{
    for(const [i,x,y,z] of [[0,-.81,.64,.35],[1,.78,.92,.47],[2,-.46,1.34,-.49],[3,.48,1.92,-.49]]){
      const piece=group(x,y+.37,z*.86);piece.rotation.set(.92-i*.14,-.25+i*.39,i*.09-.20);
      mesh(i%2?pot:dish,colors[i],[0,0,0],[.62,.70,.62],piece,.19);
      tube(0xc8ac76,[[-.27,-.21,0],[0,-.15,.15],[.27,-.12,0]],.035,piece);
      rod(0x7c7465,[x,.32,z*.86],[x,y+.37,z*.86],.032);
    }
  }
}

function fiberStudies({mesh,group,rod,tube},index){
  const colors=palettes.weave;
  if(index===0){
    for(const side of [-1,1])rod(0x66675c,[side*1.22,.33,-.33],[side*1.09,3,-.33],.052);
    for(let i=0;i<3;i++){
      const panel=group((i-1)*.82,.36,(i-1)*.45);panel.rotation.y=(i-1)*.28;
      for(const h of [.51,2.36])rod(colors[1],[-.48,h,0],[.48,h,0],.046,panel);
      for(let row=0;row<12;row++){
        const x=(row-5.5)*.075;
        tube(colors[(row+i*2)%4],[[x,.52,0],[x+.16,1.16,.04],[x-.12,1.88,-.045],[x,2.33,0]],.020,panel);
      }
    }
  }else if(index===1){
    for(let i=0;i<13;i++){
      const h=.46+i*.168,r=1.16-i*.052;
      tube(colors[i%4],Array.from({length:14},(_,j)=>{
        const a=j*turn/14+i*.17;
        return [Math.cos(a)*r+i*.035-.21,h+.19*Math.sin(a),Math.sin(a)*r];
      }),.049,undefined,true);
    }
    for(let i=0;i<9;i++){
      const a=i*turn/9;
      tube(colors[i%4],[[Math.cos(a)*1.15,.45,Math.sin(a)*1.15],[Math.cos(a+.32)*.85,.96,Math.sin(a+.32)*.85],
        [Math.cos(a+.51)*.66+.20,1.78,Math.sin(a+.51)*.66],[Math.cos(a+.69)*.54+.23,2.49,Math.sin(a+.69)*.54]],.037);
    }
  }else if(index===2){
    for(const side of [-1,1]){
      const knot=group(side*.38,1.67,side*.21);knot.rotation.set(.51*side,.69*side,.21*side);
      for(let i=0;i<12;i++)tube(colors[i%4],Array.from({length:16},(_,j)=>{
        const a=j*turn/16,b=i*turn/12+2*a,r=.85+Math.cos(b)*.19;
        return [Math.cos(a)*r,Math.sin(a)*r,Math.sin(b)*.26];
      }),.034,knot,true);
    }
    rod(colors[2],[0,.35,0],[0,.90,0],.086);
  }else{
    for(let i=0;i<3;i++){
      const z=(i-1)*.65,height=.91+i*.61;
      tube(colors[i],[[ -1.41,.51,z],[-.85,height+.31,z],[0,height-.19,z],[.74,height+.18,z],[1.34,.67,z]],.072);
      for(let slat=0;slat<9;slat++){
        const x=(slat-4)*.25,y=height+Math.cos(slat*.72)*.21;
        rod(colors[(slat+i)%4],[x,y-.38,z-.21],[x+.16,y,z+.24],.033);
      }
    }
  }
}

function movingMetals({mesh,group,rod},index){
  const [brass,blue,copper,iron]=palettes.tide;
  const y=1.89+(index%2)*.12;
  const swing=group(0,y,0);
  rod(iron,[0,.35,0],[0,y+.08,0],.094,undefined,.58);
  rod(iron,[-1.23,.42,0],[1.23,.42,0],.072,undefined,.56);
  mesh("oval",brass,[0,0,0],[.23,.23,.23],swing,.56);
  if(index===0||index===2){
    const count=index===0?8:6;
    mesh("ring",blue,[0,0,0],[1.05,1.05,1.05],swing,.65);
    for(let i=0;i<count;i++){
      const a=i*turn/count,r=.74+i%3*.08;
      rod(brass,[0,0,0],[Math.sin(a)*r,Math.cos(a)*r,0],.046,swing,.61);
      const end=mesh(index===0?"cylinder":"box",i%2?copper:blue,[Math.sin(a)*.91,Math.cos(a)*.91,0],
        index===0?[.16,.18,.16]:[.21,.56,.083],swing,.62);
      end.rotation.z=-a;end.rotation.y=i*.24;
    }
    return seconds=>{swing.rotation.z=seconds*(index===0?.43:-.55);swing.rotation.y=Math.sin(seconds*.39)*.26;};
  }
  if(index===1){
    for(const x of [-1.22,1.22])rod(iron,[x,.33,0],[x,3.32,0],.047,undefined,.56);
    rod(brass,[-1.25,3.28,0],[1.25,3.28,0],.056,undefined,.67);
    const arms=Array.from({length:3},(_,i)=>{
      const pendulum=group((i-1)*.78,3.26,0),h=1.15+i*.32;
      rod(copper,[0,0,0],[0,-h,0],.034,pendulum,.72);
      mesh("oval",i%2?blue:brass,[0,-h,0],[.23,.29,.20],pendulum,.65);
      return pendulum;
    });
    return seconds=>arms.forEach((arm,i)=>{arm.rotation.z=.29*Math.sin(seconds*(1.63-i*.24)+i*.33);});
  }
  for(const side of [-1,1])rod(iron,[side*.85,.33,0],[side*.31,3.21,0],.065,undefined,.64);
  mesh("ring",brass,[0,.34,0],[.65,.65,.65],swing,.66);
  mesh("ring",blue,[0,.34,0],[.82,.82,.82],swing,.63).rotation.y=.92;
  mesh("crystal",copper,[0,.35,0],[.23,.44,.23],swing,.69);
  for(const side of [-1,1]){
    rod(brass,[0,0,0],[side*.99,-.27,0],.031,swing,.56);
    mesh("oval",copper,[side*.97,-.28,0],[.15,.24,.16],swing,.62);
  }
  return seconds=>{swing.rotation.y=seconds*.56;swing.rotation.x=Math.sin(seconds*.93)*.32;};
}

function waterside({mesh,group,rod,ribbon,tube},index){
  const colors=palettes.wind;
  if(index===0){
    for(let i=0;i<3;i++){
      ribbon(colors[i],[0,1.13+i*.62,-.65+i*.52],2.87,.66,(x,y)=>[x,y+.47*Math.cos(x*2.3+i*.68),.38*Math.sin(x*2+y*.9)],undefined,i===2?.83:1);
      for(const side of [-1,1])rod(colors[1],[side*.97,.30,-.65+i*.52],[side*.97,.99+i*.60,-.65+i*.52],.028);
    }
  }else if(index===1){
    for(let i=0;i<6;i++){
      const stone=mesh("stone",colors[i%4],[Math.sin(i*2.31)*.95,.57+i%2*.10,Math.cos(i*2.31)*.61],[.37+i*.035,.20+i%3*.038,.36]);
      stone.rotation.set(Math.sin(i)*.09,i*.90,i*.032);stone.material.flatShading=true;
    }
    for(let a=0;a<3;a++)tube(colors[a+1],[[-1.33,.55+a*.22,.61],[-.55,1.55+a*.31,.28],[.21,2.19+a*.24,-.02],
      [.88,1.43+a*.26,-.42],[1.38,.51+a*.22,-.84]],.039,undefined,false,.29);
  }else if(index===2){
    for(let i=0;i<6;i++){
      const x=(i-2.5)*.43,y=1.73+i%3*.31,z=-.28+i%2*.52;
      rod(colors[0],[x,.33,z],[x+.14,y+.5,z],.023);
      ribbon(colors[(i%3)+1],[x+.17,y,z],.54,.92,(u,v)=>[u+(v+.5)*.08,v,.23*Math.cos(u*9+v*3)],undefined,.78);
    }
  }else{
    for(let i=0;i<4;i++){
      const loop=group(0,1.23+i*.22,(i-1.5)*.14);loop.rotation.set(i*.20,Math.PI*.12*i,i*.31);
      tube(colors[i],Array.from({length:17},(_,p)=>{
        const a=p*5.38/16,r=.64+i*.15+.042*Math.cos(p*.96);
        return [r*Math.cos(a),r*Math.sin(a),.10*Math.sin(a*2)];
      }),.064-i*.012,loop,false,.13);
    }
  }
}

function specimenCases({mesh,group,rod,vessel},index){
  const [green,amber,blue,ivory]=palettes.hirst;
  const w=2.69,d=1.69,h=index===0?2.80:2.46;
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])rod(0x566873,[x,.44,z],[x,h,z],.031,undefined,.57);
  mesh("box",0x4e5a61,[0,.48,0],[w+.12,.14,d+.12],undefined,.42);
  mesh("box",green,[0,(h+.55)/2,0],[w,h-.55,d],undefined,.05,.071).renderOrder=5;
  if(index===0){
    for(let i=0;i<4;i++){
      const x=(i%2-.5)*1.25,y=1.11+Math.floor(i/2)*.99,z=(i%3-1)*.17;
      const body=group(x,y,z),wingColors=[green,amber,blue,ivory];
      body.rotation.y=.17+Math.floor(i/2)*.22;
      mesh("oval",0x4e4a44,[0,0,.012],[.08,.22,.075],body);
      for(const side of [-1,1]){
        const upper=mesh("oval",wingColors[i],[side*.25,.12,0],[.26,.32,.056],body,.22);
        upper.rotation.z=side*-.45;
        mesh("oval",wingColors[(i+2)%4],[side*.16,-.14,-.035],[.18,.20,.048],body,.33).rotation.z=side*.36;
        for(let spot=0;spot<3;spot++)mesh("oval",ivory,[side*(.18+spot*.09),.11+spot*.024,.043],[.037,.047,.018],body,.11);
      }
    }
  }else if(index===1){
    const bottle=vessel([[0,0],[.63,0],[.71,.10],[.71,.67],[.43,.83],[.35,1],[.25,1]]);
    for(let i=0;i<9;i++){
      const x=(i%5-2)*.46,z=-.38+Math.floor(i/5)*.65,size=.52+i%4*.28;
      mesh(bottle,[amber,green,blue][i%3],[x,.56,z],[.26,size,.26],undefined,.07,.63);
      mesh("cylinder",ivory,[x,.55+size,z],[.094,.064,.094],undefined,.31);
      if(i%2===0)mesh("box",0xefe0bc,[x,.57+size*.38,z+.183],[.23,.23,.022]);
    }
  }else if(index===2){
    for(let i=0;i<5;i++){
      const z=(i-2)*.26,r=.56+i*.058;
      const slice=group(0,1.43,z);slice.rotation.y=(i-2)*.15;
      mesh("ring",i%2?amber:blue,[0,0,0],[r,r,r],slice,.44);
      mesh("ring",green,[0,0,.025],[r*.68,r*.68,r*.68],slice,.24);
      mesh("oval",ivory,[0,0,.016],[r*.52,r*.67,.08],slice,.17,.61).rotation.z=Math.PI*i*.16;
    }
  }else{
    for(let i=0;i<8;i++){
      const x=(i%4-1.5)*.62,y=1.04+Math.floor(i/4)*.81+Math.sin(i*2)*.17,z=Math.cos(i*1.8)*.43;
      const shard=mesh(i%2?"stone":"crystal",i%3===0?0xf2ead9:ivory,[x,y,z],[.22,.34+i%3*.045,.19]);
      shard.rotation.set(i*.57,i*.46,i*.83);shard.material.flatShading=true;
    }
  }
}

function humanStudies({mesh,group,rod},index){
  const skin=0xc58e73,cheek=0xad735e,linen=0x7b706c,trim=0xa59280;
  function oval(c,x,y,z,w,h,d,parent){return mesh("oval",c,[x,y,z],[w,h,d],parent);}
  function head(x,y,z,scale,yaw,parent){
    const face=group(x,y,z,parent);
    face.scale.setScalar(scale);face.rotation.y=yaw;
    oval(skin,0,0,-.033,.35,.44,.30,face);
    oval(cheek,0,-.10,.277,.079,.095,.071,face);
    oval(0x52453b,0,.256,-.065,.348,.24,.295,face).rotation.x=-.25;
    for(const side of [-1,1]){
      oval(skin,side*.324,-.038,-.028,.065,.109,.051,face);
      oval(0xf3e3d5,side*.128,.013,.235,.073,.028,.047,face);
      oval(0x645044,side*.128,.013,.276,.030,.024,.023,face);
      oval(0x8a6253,side*.128,.086,.245,.084,.023,.035,face).rotation.z=side*.08;
    }
    oval(0xa87565,0,-.22,.238,.105,.022,.040,face);
  }
  if(index===0){
    const foot=group(-.08,.37,.12);foot.rotation.y=-.78;
    oval(skin,0,.37,-.24,.60,.38,1.01,foot).rotation.x=.09;
    oval(skin,0,.84,-.77,.47,.67,.46,foot).rotation.x=.14;
    for(let i=0;i<5;i++){
      const x=-.47+i*.224,z=.63-i*.066,scale=1-i*.12;
      oval(skin,x,.27,z,.18*scale,.18*scale,.46*scale,foot);
      oval(0xe0a995,x,.403*scale,z+.17*scale,.105*scale,.020,.122*scale,foot);
    }
    oval(cheek,-.28,.48,-.04,.23,.16,.53,foot).rotation.z=.14;
  }else if(index===1){
    const body=group(0,.31,0);body.rotation.y=-.76;
    oval(linen,0,1.10,0,.94,.90,.54,body).rotation.z=-.14;
    oval(linen,-.62,1.44,.05,.51,.45,.48,body);
    oval(skin,.11,1.87,-.06,.27,.53,.25,body).rotation.z=-.11;
    head(.21,2.44,-.095,1.42,1.24,body);
    oval(trim,.15,1.70,.36,.44,.12,.17,body).rotation.z=-.18;
  }else if(index===2){
    const compact=group(0,.32,0);compact.rotation.y=-.38;
    oval(linen,0,1.13,-.41,.69,.82,.49,compact).rotation.x=-.45;
    for(const side of [-1,1]){
      oval(trim,side*.44,.66,.29,.44,.64,.50,compact).rotation.z=side*.34;
      oval(linen,side*.47,.27,.69,.28,.24,.47,compact);
      oval(skin,side*.54,1.19,.35,.23,.43,.25,compact).rotation.x=.75;
    }
    const bowed=group(0,1.71,.18,compact);bowed.rotation.x=.52;
    head(0,0,0,1,-.21,bowed);
  }else{
    for(const side of [-1,1]){
      const standing=group(side*.62,.31,side*.27);
      standing.rotation.y=side*-.39;standing.scale.setScalar(side===1?.84:1.06);
      oval(side===1?0x7b8c86:linen,0,1.24,0,.47,.76,.30,standing);
      for(const sign of [-1,1]){
        rod(trim,[sign*.15,.12,0],[sign*.19,.89,.01],.137,standing);
        oval(0x5f5450,sign*.15,.065,.09,.18,.079,.23,standing);
        oval(side===1?0x7b8c86:linen,sign*.41,1.19,.06,.18,.43,.17,standing).rotation.z=sign*.24;
        oval(skin,sign*.50,.83,.095,.115,.16,.104,standing);
      }
      head(0,2.09,0,.88,side*.27,standing);
    }
  }
}

const builders={home:architecture,colors:lightStudy,objects:tableObjects,weave:fiberStudies,tide:movingMetals,
  wind:waterside,hirst:specimenCases,mueck:humanStudies};

export function addMmcaSculpture(T,root,exhibit){
  return builders[exhibit.gallery](sculptureKit(T,root),exhibit.series);
}
