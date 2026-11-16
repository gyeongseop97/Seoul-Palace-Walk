const artResources=new WeakMap();
const brass=0xb28550,graphite=0x344455,porcelain=0xd8d5bf;

function resources(T){
  if(!artResources.has(T))artResources.set(T,{
    box:new T.BoxGeometry(1,1,1),ball:new T.IcosahedronGeometry(1,2),
    rod:new T.CylinderGeometry(1,1,1,10),materials:new Map(),
  });
  return artResources.get(T);
}

function kitFor(T,root){
  const cache=resources(T),up=new T.Vector3(0,1,0);
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  function matter(color,metalness=0){
    const key=color+":"+metalness;
    if(!cache.materials.has(key))cache.materials.set(key,new T.MeshStandardMaterial({color,metalness,roughness:metalness?.34:.77}));
    return cache.materials.get(key);
  }
  function group(x,y,z,parent=root){
    const piece=new T.Group();piece.position.set(x,y,z);parent.add(piece);return piece;
  }
  function mesh(shape,surface,x,y,z,parent=root){
    const piece=new T.Mesh(shape,surface);piece.position.set(x,y,z);parent.add(piece);return piece;
  }
  function box(color,x,y,z,w,h,d,parent=root,metal=0){
    const piece=mesh(cache.box,matter(color,metal),x,y,z,parent);piece.scale.set(w,h,d);return piece;
  }
  function ball(color,x,y,z,w,h=w,d=w,parent=root,metal=0){
    const piece=mesh(cache.ball,matter(color,metal),x,y,z,parent);piece.scale.set(w,h,d);return piece;
  }
  function rod(color,a,b,r,parent=root,metal=0){
    const [x,y,z]=a,[tx,ty,tz]=b,line=V(tx-x,ty-y,tz-z);
    const piece=mesh(cache.rod,matter(color,metal),(x+tx)/2,(y+ty)/2,(z+tz)/2,parent);
    piece.scale.set(r,line.length(),r);piece.quaternion.setFromUnitVectors(up,line.normalize());
    return piece;
  }
  function vessel(profile,steps=22){
    return new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),steps);
  }
  function curve(color,points,width,parent=root,metal=0,closed=false){
    const spline=new T.CatmullRomCurve3(points.map(point=>V(...point)),closed,"centripetal");
    const shape=new T.TubeGeometry(spline,Math.min(90,points.length*4),width,5,closed);
    return mesh(shape,matter(color,metal),0,0,0,parent);
  }
  function screen(shape,color,opacity,x=0,y=0,z=0,parent=root){
    const surface=new T.MeshStandardMaterial({color,opacity,transparent:true,depthWrite:false,
      side:T.DoubleSide,roughness:.31,emissive:color,emissiveIntensity:.32});
    return mesh(shape,surface,x,y,z,parent);
  }
  return {T,root,cache,V,group,mesh,box,ball,rod,vessel,curve,screen,matter};
}

function spectra({T,mesh,box,screen,rod,root}){
  const colors=[0x60b8b5,0xa5a9d8,0xcc839e,0xecc477,0x7cbec8,0x7895cd];
  for(let i=0;i<colors.length;i++){
    const positions=[],indices=[];
    for(let j=0;j<=32;j++){
      const t=j/32;
      for(const edge of [-1,1]){
        const a=i*Math.PI/3+t*1.45+edge*(.16+.16*Math.sin(t*Math.PI));
        const r=1.25+Math.sin(t*Math.PI*1.55+i*.32)*.36;
        positions.push(Math.cos(a)*r,.72+t*3.25,Math.sin(a)*r);
      }
      if(j>0){const at=j*2;indices.push(at-2,at-1,at,at-1,at+1,at);}
    }
    const ribbon=new T.BufferGeometry();
    ribbon.setAttribute("position",new T.Float32BufferAttribute(positions,3));ribbon.setIndex(indices);ribbon.computeVertexNormals();
    screen(ribbon,colors[i],.72);
    const a=i*Math.PI/3+.12;
    rod(graphite,[Math.cos(a)*1.12,.43,Math.sin(a)*1.12],[Math.cos(a)*1.12,1.60,Math.sin(a)*1.12],.025);
  }
  const disk=new T.CylinderGeometry(1.66,1.72,.14,48);
  mesh(disk,new T.MeshStandardMaterial({color:0x354e60,roughness:.38,metalness:.48}),0,.40,0,root);
  box(0x92cbc8,0,.49,0,.30,.045,2.59);
}

function clay({T,root,cache,box,curve}){
  box(0x4b3f39,0,.47,0,3.96,.30,3.38);
  box(0xa96749,0,.64,0,3.88,.10,3.27);
  const body=new T.InstancedMesh(cache.ball,new T.MeshStandardMaterial({roughness:.93}),30);
  const pose=new T.Object3D(),color=new T.Color();
  const tones=[0x845847,0xe4c4a3,0xcb9b74,0x8e765e,0xb36a4f,0xab8f83];
  for(let i=0;i<30;i++){
    const row=Math.floor(i/6),col=i%6,r=.13+((i*7)%11)*.014;
    pose.position.set((col-2.5)*.57+Math.sin(i)*.08,.69+r*.71,(row-2)*.55+Math.cos(i*.76)*.07);
    pose.scale.set(r,r*.75,r*(.90+Math.sin(i)*.08));pose.rotation.set(i*.13,i*1.77,i*.41);
    pose.updateMatrix();body.setMatrixAt(i,pose.matrix);body.setColorAt(i,color.setHex(tones[(i*11+row)%tones.length]));
  }
  body.computeBoundingSphere();root.add(body);
  for(let i=0;i<3;i++){
    curve(0x754e45,Array.from({length:13},(_,j)=>[j*.267-1.62,.697,-1.26+i*1.19+Math.sin(j*.43+i)*.19]),.015);
  }
}

function rays({T,box,rod,screen,mesh,matter}){
  const frameColor=0x556678;
  for(const side of [-1,1]){
    box(frameColor,side*1.53,2.03,-.78,.13,3.30,.21);
    box(frameColor,side*1.53,.39,-.78,.49,.13,.53);
  }
  box(frameColor,0,3.69,-.78,3.22,.15,.21);
  for(const side of [-1,1])rod(0xbac7ca,[side*1.46,3.64,-.78],[side*.22,2.55,-.62],.020);
  const prism=mesh(new T.OctahedronGeometry(.94),matter(0x9dc2c4,.45),0,2.50,-.54);
  prism.rotation.set(.26,.63,.17);prism.scale.set(.87,1.09,.70);
  const colors=[0xc86e83,0xd6a36a,0xd4ca74,0x80bf9b,0x63b3c3,0x869acf];
  for(let i=0;i<colors.length;i++){
    const x=(i-2.5)*.49;
    const pane=new T.BufferGeometry();
    pane.setAttribute("position",new T.Float32BufferAttribute([
      -.06,2.47,-.47,x-.17,.40,1.60,x+.17,.40,1.60
    ],3));pane.computeVertexNormals();
    screen(pane,colors[i],.47);
    box(colors[i],x,.363,1.58,.35,.055,.89);
  }
}

const bowlProfile=[[0,0],[.40,0],[.46,.08],[.66,.23],[.78,.40],[.78,.45],[.73,.45],[.58,.26],[.39,.12],[0,.12]];

function wireMobile({T,box,group,rod,ball,vessel,mesh,matter}){
  const colors=[0xb87954,0x456a72,0xc5a07a,0xc78d8b,0xe6b560,0x709477];
  box(graphite,0,.42,0,1.44,.20,1.44);
  rod(graphite,[0,.5,0],[0,3.92,0],.065);
  const layers=[];
  const dish=vessel(bowlProfile);
  for(let level=0;level<3;level++){
    const beam=group(0,1.43+level*1.05,0);layers.push(beam);
    rod(brass,[-1.67,0,0],[1.67,0,0],.031,beam,.5);
    for(const side of [-1,1]){
      const x=side*(1.13+level*.23),z=side*.24;
      rod(brass,[x,0,0],[x,-.38,z],.012,beam,.45);
      const bowl=mesh(dish,matter(colors[(level*2+(side+1)/2)%colors.length],.24),x,-.50,z,beam);
      bowl.scale.set(.48,.61,.48);bowl.rotation.z=side*.27;ball(0xe5d9bd,x,-.41,z,.105,.068,.105,beam);
      rod(graphite,[x,-.44,z],[x+side*.46,-.55,z-.03],.028,beam,.2);
    }
  }
  return seconds=>layers.forEach((layer,i)=>{layer.rotation.y=i*1.84+Math.sin(seconds*(.39+i*.13)+i)*.72;});
}

function kitchenFlowers({group,rod,ball,vessel,mesh,matter,box}){
  const tones=[0xc17659,0xe3b071,0x70a392,0xc8a48d,0x9b7eb0,0x688f9c];
  box(0x4b5c61,0,.41,0,3.45,.17,2.21);
  const dish=vessel(bowlProfile,18);
  for(const [i,x,z] of [[0,-1.04,.30],[1,0,-.43],[2,1.05,.36]]){
    const y=2.24+(i===1?.86:.12),flower=group(x,y,z);
    flower.rotation.set(.12+i*.22,.30*i,-.14+i*.14);
    rod(0x62604b,[x*.65,.49,z],[x,y,z],.069,undefined,.4);
    for(let j=0;j<7;j++){
      const a=j*2*Math.PI/7;
      const petal=group(Math.cos(a)*.51,Math.sin(a)*.51,0,flower);
      petal.rotation.set(Math.PI/2,-a,0);
      const spoon=mesh(dish,matter(tones[(j+i*2)%tones.length],.50),0,0,0,petal);
      spoon.scale.set(.42,.38,.72);
    }
    ball(0xb87d49,0,0,.19,.31,.30,.16,flower,.52);
    for(let j=0;j<7;j++){
      const a=j*2*Math.PI/7;
      ball(porcelain,Math.cos(a)*.18,Math.sin(a)*.18,.31,.04,.04,.03,flower);
    }
  }
}

function cabinet({T,box,vessel,mesh,matter}){
  const wood=0x665046,tones=[0xac7d63,0x7b9d9e,0xdbca9b,0xd48b73,0xa2a9bd];
  for(const x of [-1.76,1.76])box(wood,x,1.77,-.13,.15,2.9,.72);
  box(wood,0,3.19,-.13,3.64,.15,.76);
  box(graphite,0,1.77,-.50,3.45,2.81,.12);
  const cup=vessel([[0,0],[.32,0],[.35,.08],[.41,.67],[.40,.71],[.35,.71],[.34,.19],[0,.17]]);
  const handle=new T.TorusGeometry(.19,.035,8,18);
  for(let row=0;row<3;row++){
    const y=.54+row*.82;
    box(wood,0,y,-.13,3.55,.102,.77);
    for(let col=0;col<4;col++){
      const x=(col-1.5)*.78,color=tones[(row*3+col*2)%tones.length];
      const ceramics=mesh(cup,matter(color,.12),x,y+.057,-.04);
      const height=.54+((row+col)%3)*.12;
      ceramics.scale.set(.49,height,.48);
      mesh(handle,matter(color,.12),x+.20,y+height*.41,-.04).scale.set(.65,.81,.62);
      if((row+col)%3===0){
        box(0xd9bb8a,x+.14,y+.069,.23,.46,.037,.25);
      }
    }
  }
}

function wovenScreen({box,group,rod}){
  const fibers=[0xe0c594,0x766d57,0x8d7965,0xa9b6a0,0x506b6e];
  const panels=[];
  for(let i=0;i<3;i++){
    const frame=group((i-1)*1.06,0,-.63+i%2*.63);panels.push(frame);
    box(0x85745f,0,.45,0,1.41,.19,.37,frame);
    for(const side of [-1,1]){
      box(0x5e5c4d,side*.61,1.79,0,.065,2.59,.090,frame);
      box(0x5e5c4d,0,side*1.19+1.76,0,1.26,.055,.075,frame);
    }
    for(let row=0;row<24;row++){
      const y=.63+row*.100;
      rod(fibers[(row+i*2)%fibers.length],[-.55,y,-.012],[.55,y,.011],.019,frame);
    }
    for(let col=0;col<13;col++){
      const x=(col-6)*.081;
      rod(fibers[(col*2+i)%fibers.length],[x,.61,.033],[x+.032,2.89,.032],.015,frame);
    }
  }
  return seconds=>panels.forEach((panel,i)=>{panel.rotation.y=(i-1)*.51+Math.sin(seconds*.70+i)*.11;});
}

function bells({box,group,rod,vessel,mesh,matter,ball}){
  const bronze=0xa98c68,tones=[0x718f8a,0x497186,0xcaba83,0xa06f68,0x839178];
  for(const x of [-1.66,1.66])rod(graphite,[x,.35,-.50],[x,3.87,-.50],.052);
  rod(graphite,[-1.66,3.86,-.50],[1.66,3.86,-.50],.052);
  box(0x62645a,0,.42,-.50,3.67,.19,.52);
  const profile=[[.04,0],[.18,-.03],[.23,-.23],[.29,-.33],[.43,-.62],[.41,-.63],[.32,-.56],[.23,-.30],[.14,-.09],[0,-.07]];
  const bell=vessel(profile),pieces=[];
  for(let i=0;i<7;i++){
    const x=(i-3)*.42,z=Math.sin(i*2.32)*.39,h=1.56+((i*3)%5)*.35;
    const hanger=group(x,3.82,-.5);pieces.push(hanger);
    rod(bronze,[0,0,0],[0,-h,z],.010,hanger,.36);
    const shape=mesh(bell,matter(tones[i%tones.length],.44),0,-h,z,hanger);
    shape.scale.setScalar(.66+(i%3)*.16);
    rod(bronze,[0,-h-.09,z],[0,-h-.61,z],.015,hanger);
    ball(bronze,0,-h-.66,z,.082,.108,.082,hanger,.50);
  }
  return seconds=>pieces.forEach((piece,i)=>{piece.rotation.z=Math.sin(seconds*(.63+i*.021)+i*.76)*.18;});
}

function wovenVessel({box,curve,mesh,matter,vessel}){
  const tones=[0xac8864,0xcfbb90,0x778c7a,0x476269];
  const radiusAt=t=>.72+.56*Math.sin(t*Math.PI*.93);
  box(0x686c5d,0,.40,0,2.88,.15,2.88);
  const foot=vessel([[0,0],[.64,0],[.76,.15],[.73,.17],[0,.17]]);
  mesh(foot,matter(0x82775b),0,.49,0);
  for(let row=0;row<15;row++){
    const t=row/14,r=radiusAt(t);
    curve(tones[(row*3)%tones.length],Array.from({length:32},(_,i)=>{
      const a=i*2*Math.PI/32,grain=.025*Math.sin(a*16+(row%2)*Math.PI);
      return [Math.cos(a)*(r+grain),.67+t*2.36,Math.sin(a)*(r+grain)];
    }),.043,undefined,0,true);
  }
  for(let i=0;i<17;i++){
    const a=i*2*Math.PI/17;
    curve(tones[i%tones.length],Array.from({length:16},(_,row)=>{
      const t=row/15,b=a+t*.74,r=radiusAt(t)+.042*Math.cos(row*Math.PI);
      return [Math.cos(b)*r,.64+t*2.39,Math.sin(b)*r];
    }),.026);
  }
}

function sails({T,box,rod,group,mesh,matter}){
  const colors=[0xb28a56,0x7d9eaa,0xa56b58,0x637b83,0xd8b175];
  box(graphite,0,.44,0,3.96,.22,2.31);
  const fins=[];
  const sheet=new T.Shape([[-.32,0],[-.25,.96],[.10,1.45],[.35,.99],[.22,.11]].map(([x,y])=>new T.Vector2(x,y)));
  const leaf=new T.ExtrudeGeometry(sheet,{depth:.033,bevelEnabled:true,bevelThickness:.011,bevelSize:.015,bevelSegments:1});
  for(let i=0;i<5;i++){
    const x=(i-2)*.67,z=i%2*.15-.075;
    rod(graphite,[x,.54,z],[x,1.19,z],.055);
    const pivot=group(x,1.10,z);fins.push(pivot);
    mesh(leaf,matter(colors[i],.50),0,0,0,pivot);
    rod(brass,[0,0,0],[.03,1.18,0],.028,pivot,.48);
  }
  rod(0xa98a66,[-1.81,.71,.04],[1.81,.71,.04],.045,undefined,.5);
  return seconds=>fins.forEach((fin,i)=>{fin.rotation.set(.35+Math.sin(seconds*1.8-i*.66)*.75,Math.sin(seconds*.92+i)*.32,(i-2)*.10);});
}

function balance({box,group,rod,ball,vessel,mesh,matter}){
  box(graphite,0,.42,0,3.84,.19,2.41);
  rod(0x647482,[0,.52,0],[0,2.06,0],.132,undefined,.48);
  ball(brass,0,2.05,0,.23,.23,.23,undefined,.50);
  const bar=group(0,2.05,0);
  rod(brass,[-1.67,0,0],[1.67,0,0],.067,bar,.54);
  const pans=[];
  const dish=vessel(bowlProfile);
  for(const side of [-1,1]){
    const pan=group(side*1.37,0,0,bar);pans.push(pan);
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;
      rod(graphite,[0,0,0],[Math.cos(a)*.43,-.82,Math.sin(a)*.43],.017,pan,.58);
    }
    const cup=mesh(dish,matter(porcelain,.37),0,-.92,0,pan);cup.scale.set(.65,.47,.65);
    if(side<0)ball(0x526b82,0,-.72,0,.25,.34,.25,pan,.35);
    else for(let i=0;i<3;i++)ball(0xd5ac77,(i-1)*.155,-.77,.039,.096,.17,.10,pan,.48);
  }
  return seconds=>{
    const tilt=Math.sin(seconds*1.22)*.21;
    bar.rotation.z=tilt;pans.forEach(pan=>{pan.rotation.z=-tilt;});
  };
}

function gears({T,box,rod,group,mesh,matter}){
  const cogOutline=new T.Shape();
  for(let i=0;i<=48;i++){
    const a=i*Math.PI*2/48,r=i%4<2?.315:.369;
    if(i===0)cogOutline.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    else cogOutline.lineTo(Math.cos(a)*r,Math.sin(a)*r);
  }
  const hole=new T.Path();hole.absarc(0,0,.111,0,Math.PI*2,true);cogOutline.holes.push(hole);
  const cog=new T.ExtrudeGeometry(cogOutline,{depth:.093,bevelEnabled:false});
  box(0x465c6a,0,.43,0,3.90,.20,2.02);
  box(0x516971,0,.57,0,3.78,.095,1.34);
  const links=[];
  for(let i=0;i<5;i++){
    const x=(i-2)*.67;
    const rotor=mesh(cog,matter(i%2?0xb57d52:brass,.55),x,1.03,.57);
    rod(graphite,[x,.57,.36],[x,1.05,.63],.04);
    const fin=group(x,1.03,.07);
    box(i%2?0x82a1a9:0x588795,0,.49,0,.61,1.01,.12,fin,.25);
    box(0xcac2a8,0,.96,.015,.61,.075,.11,fin,.36);
    links.push({rotor,fin});
  }
  return seconds=>links.forEach(({rotor,fin},i)=>{
    rotor.rotation.z=seconds*(i%2?.64:-.64)+i*.13;
    fin.rotation.x=.35+Math.sin(seconds*1.88-i*.78)*.64;
  });
}

function pigment(T,side){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=704;
  const ctx=canvas.getContext("2d"),{width:w,height:h}=canvas;
  const fade=ctx.createLinearGradient(0,0,w,h);
  fade.addColorStop(0,"#e5d9bd");fade.addColorStop(.53,side<0?"#c8d1cb":"#dbd2c5");fade.addColorStop(1,"#6b8f9c");
  ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);ctx.lineCap="round";
  const pigments=["#1b394e6f","#44657692","#4f819d70","#b86b5469","#f4e3b6c4"];
  for(let i=0;i<54;i++){
    const x=i*67%532-15,y=250+((i*137)%430),swell=Math.sin(i*.91+side)*75;
    ctx.strokeStyle=pigments[(i*3+Math.floor(i/8))%pigments.length];
    ctx.lineWidth=1.2+(i%9)*.91;
    ctx.beginPath();ctx.moveTo(x-117,y+swell);
    ctx.bezierCurveTo(x-52,y+swell*.2,x+23,y-swell,x+181,y+swell*.14);ctx.stroke();
  }
  const moon=ctx.createRadialGradient(w*.72,177,6,w*.72,177,61);
  moon.addColorStop(0,"#fff2ceed");moon.addColorStop(1,"#fff2ce00");
  ctx.fillStyle=moon;ctx.fillRect(w*.54,110,170,145);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  return texture;
}

function paintedWaves({T,box,group,mesh}){
  box(0x877c6f,0,.43,-.08,3.81,.20,1.34);
  for(const side of [-1,1]){
    const panel=group(side*.92,1.99,-.18);
    panel.rotation.y=side*-.17;
    box(0x554f47,0,0,0,1.72,2.74,.11,panel);
    box(0xab9d85,0,0,.061,1.65,2.66,.025,panel);
    const canvas=new T.PlaneGeometry(1.55,2.53);
    mesh(canvas,new T.MeshBasicMaterial({map:pigment(T,side),toneMapped:false}),0,0,.079,panel);
  }
}

function driftwood({T,curve,box,rod,screen}){
  box(0x9a8771,0,.40,0,3.86,.15,2.48);
  const forms=[
    [[-.71,.48,.10],[-.64,1.17,.05],[-.05,2.07,.14],[-.36,2.84,-.01],[-.21,3.27,.01]],
    [[-.13,1.81,.12],[.58,2.11,.16],[1.02,2.70,.16],[1.25,3.03,.02]],
    [[-.58,1.30,.08],[-.92,1.72,.06],[-1.50,1.88,.16],[-1.69,2.27,.04]],
    [[-.32,1.55,.13],[.14,1.87,.38],[.83,1.70,.56],[1.51,1.83,.73]],
  ];
  forms.forEach((points,i)=>curve(i%2?0x5d5e55:0x786653,points,i===0?.118:.061));
  rod(0x747570,[-1.55,.48,-.89],[-1.55,3.27,-.89],.024);
  rod(0x747570,[1.59,.48,-.89],[1.59,3.27,-.89],.024);
  rod(0x747570,[-1.55,3.27,-.89],[1.59,3.27,-.89],.024);
  const veil=new T.PlaneGeometry(3.10,2.66,16,8);
  const verts=veil.attributes.position;
  for(let i=0;i<verts.count;i++)verts.setZ(i,Math.sin(verts.getX(i)*5.4+verts.getY(i)*.79)*.08);
  veil.computeVertexNormals();screen(veil,0xafb596,.54,0,1.91,-.86);
}

function impressions({T,box,vessel,mesh,matter,curve}){
  const wood=0x7a6251;
  box(wood,0,1.16,0,2.98,.14,1.62);
  for(const lx of [-1.18,1.18])for(const lz of [-.61,.61])box(wood,lx,.71,lz,.105,.79,.107);
  for(const [x,z] of [[-1.58,1.04],[1.54,-1.02]]){
    box(0x9b886c,x,.73,z,.64,.09,.58);
    for(const dx of [-.24,.24])for(const dz of [-.20,.20])box(wood,x+dx,.51,z+dz,.058,.37,.063);
  }
  box(0x8e967d,0,1.261,0,2.23,.056,1.06);
  for(let row=0;row<3;row++){
    for(let col=0;col<5;col++){
      const x=(col-2)*.37,z=(row-1)*.29;
      const shape=new T.TorusGeometry(.097,.016,5,15,Math.PI*(1.09+(row+col)%3*.27));
      shape.rotateX(-Math.PI/2);
      const print=mesh(shape,matter([0x6d7c73,0x8d755d,0xa9a080][(row+col*2)%3]),x,1.299,z);
      print.rotation.y=Math.sin(row*4+col)*1.47;print.scale.x=.83+row*.11;
    }
  }
  const bowl=vessel(bowlProfile);
  mesh(bowl,matter(0xc6ab7d),1.21,1.23,-.42).scale.set(.27,.44,.27);
  curve(0x9d885c,[[.81,1.33,.60],[1.02,1.34,.48],[1.11,1.41,.36]],.032);
}

const builders={
  "color-spectra":spectra,"color-clay":clay,"color-rays":rays,
  "objects-wire":wireMobile,"objects-flower":kitchenFlowers,"objects-lattice":cabinet,
  "weave-screen":wovenScreen,"weave-bell":bells,"weave-vessel":wovenVessel,
  "tide-sail":sails,"tide-beam":balance,"tide-step":gears,
  "wind-returns":paintedWaves,"wind-tree":driftwood,"wind-trace":impressions,
};

export function addExtraMuseumWork(T,art,exhibit){
  const build=builders[exhibit.id];
  if(!build)return;
  const animation=build(kitFor(T,art));
  const groups=[];
  art.traverse(parent=>{if(parent.isGroup)groups.push(parent);});
  for(const parent of groups){
    const repeats=new Map();
    for(const object of parent.children){
      if(!object.isMesh||object.isInstancedMesh||object.material.transparent)continue;
      const key=object.geometry.id+":"+object.material.id;
      if(!repeats.has(key))repeats.set(key,[]);
      repeats.get(key).push(object);
    }
    for(const items of repeats.values()){
      if(items.length<3)continue;
      // Keep batches on their original hinges so articulated work still moves.
      const {geometry,material}=items[0];
      const batch=new T.InstancedMesh(geometry,material,items.length);
      items.forEach((object,i)=>{
        object.updateMatrix();batch.setMatrixAt(i,object.matrix);object.removeFromParent();
      });
      batch.computeBoundingSphere();parent.add(batch);
    }
  }
  return animation;
}
