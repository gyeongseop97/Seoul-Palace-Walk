import {sculptSejong} from "./plaza-sejong-figure.js";

export const plazaMonumentFootprints={
  yi:{width:7.6,depth:6.9},
  sejong:{width:8.8,depth:7.5}
};

// The two monument figures face south (+Z). Heights are in metres.
export function addPlazaMonuments(T,parent,kit,{yi,sejong}){
  const square=new T.BoxGeometry(1,1,1);
  const sphere=new T.SphereGeometry(1,14,10);
  const column=new T.CylinderGeometry(1,1,1,16);
  const granite=new T.MeshStandardMaterial({color:0x93918b,roughness:.91});
  const darkStone=new T.MeshStandardMaterial({color:0x5c5a51,roughness:.82});
  const lightStone=new T.MeshStandardMaterial({color:0xb7b3a8,roughness:.88});
  const gold=new T.MeshStandardMaterial({color:0xa77e42,roughness:.58,metalness:.31});
  const goldEdge=new T.MeshStandardMaterial({color:0xc0995d,roughness:.50,metalness:.27});
  const goldShade=new T.MeshStandardMaterial({color:0x665137,roughness:.66,metalness:.30});
  const bronze=new T.MeshStandardMaterial({color:0x4c4b3d,roughness:.57,metalness:.23});
  const bronzeEdge=new T.MeshStandardMaterial({color:0x64614a,roughness:.57,metalness:.22});
  const bronzeShade=new T.MeshStandardMaterial({color:0x34362e,roughness:.66,metalness:.20});

  function place(label,point){
    const group=new T.Group();
    group.name=label;
    group.position.set(kit.wx(point.x),.015,kit.wz(point.y));
    parent.add(group);
    return group;
  }

  const yiGroup=place("이순신 장군 동상",yi);
  const sejongGroup=place("세종대왕 동상",sejong);
  const make=group=>makeSculpture(T,group,{square,sphere,column});

  const admiralBase=make(yiGroup);
  admiralBase.box(granite,0,.075,0,plazaMonumentFootprints.yi.width,.15,plazaMonumentFootprints.yi.depth);
  admiralBase.box(lightStone,0,.24,0,6.35,.18,5.65);
  admiralBase.box(granite,0,.54,-.19,5.40,.43,4.85);
  admiralBase.box(lightStone,0,.81,-.38,4.36,.14,3.8);
  admiralBase.frustum(granite,0,-.38,[[.88,3.85,3.36],[1.35,3.7,3.23],[9.81,3.19,2.86]]);
  admiralBase.box(darkStone,0,9.88,-.38,3.27,.15,2.98);
  admiralBase.box(lightStone,0,10.05,-.38,3.67,.2,3.33);
  admiralBase.box(granite,0,10.33,-.38,3.3,.34,3.0);
  for(const h of [2.16,3.26,4.36,5.46,6.56,7.66,8.76]){
    const taper=(h-1.35)/(9.81-1.35);
    const width=3.7-.51*taper,depth=3.23-.37*taper;
    admiralBase.box(darkStone,0,h,-.38,width+.008,.018,depth+.008);
  }
  admiralBase.box(darkStone,0,5.06,1.225,.99,4.65,.15,-.0218);
  admiralBase.box(lightStone,0,1.37,-2.015,1.93,.59,.06);
  admiralBase.finish();
  addInscription(T,yiGroup,["忠","武","公","李","舜","臣","像"],{
    x:0,y:5.06,z:1.307,width:.83,height:4.48,rotation:-.0218,color:"#e5c894"
  });
  addInscription(T,yiGroup,["충무공 이순신"],{
    x:0,y:1.37,z:-2.05,width:1.70,height:.43,facing:Math.PI,color:"#49463e"
  });

  const yiFigure=new T.Group();
  yiFigure.name="이순신 장군상 인물";
  yiFigure.position.set(0,10.50,-.38);
  yiGroup.add(yiFigure);
  const yiFallback=new T.Group();
  yiFigure.add(yiFallback);
  const admiral=make(yiFallback);
  admiral.box(bronzeShade,0,.07,0,2.66,.14,1.98);
  for(const side of [-1,1]){
    admiral.oval(bronze,side*.47,.29,.33,.41,.20,.65);
    admiral.oval(bronzeShade,side*.46,.83,.08,.29,.68,.31);
  }
  admiral.folds(bronze,[[.38,1.08,.62,-.14],[.70,1.09,.66,-.11],[1.45,.94,.60,-.07],
    [2.25,.83,.54,-.02],[2.93,.68,.51,0]],11,.044);
  admiral.folds(bronze,[[2.75,.71,.54,0],[3.29,.78,.57,-.01],[3.92,.94,.61,-.04],
    [4.42,.92,.56,-.055],[4.76,.61,.40,-.06]],8,.034);
  admiral.folds(bronzeShade,[[2.83,.74,.56,0],[2.97,.74,.58,.015],[3.11,.72,.56,.02]],8,.018);
  admiral.oval(bronzeEdge,.15,2.98,.576,.18,.14,.10);
  admiral.oval(bronze,.01,4.57,.30,.48,.33,.34);
  for(let row=0;row<6;row++){
    for(let i=-3;i<=3;i++){
      const x=i*.195+(row%2)*.045;
      const y=3.22+row*.196;
      const z=.589-.22*(x*x);
      admiral.box(row%2?bronzeEdge:bronze,x,y,z,.157,.155,.082,.09,x*.32);
      admiral.oval(bronzeShade,x,y+.027,z+.048,.030,.024,.017);
    }
  }
  for(let row=0;row<5;row++){
    const spread=.66+(4-row)*.048;
    for(const sign of [-1,1]) for(let i=0;i<5;i++){
      const x=sign*(.12+i*.143)*spread/.74;
      admiral.box(bronzeEdge,x,1.65+row*.198,.523-.14*x*x,.12,.151,.072,.14,x*.15);
    }
  }
  for(const side of [-1,1]){
    for(let tier=0;tier<4;tier++){
      admiral.oval(tier%2?bronzeEdge:bronze,side*(.93+tier*.06),4.46-tier*.13,-.045,
        .45-tier*.041,.20,.42-tier*.025,0,0,side*.31);
    }
  }
  admiral.rod(bronze,[.99,4.18,.01],[1.13,3.33,.25],.28);
  admiral.rod(bronze,[1.13,3.33,.25],[.67,3.11,.65],.25);
  admiral.oval(bronzeEdge,.65,3.10,.665,.24,.16,.14,0,0,.21);
  admiral.rod(bronze,[-1.06,4.20,.00],[-1.12,3.14,.34],.27);
  admiral.oval(bronzeShade,-1.12,3.26,.39,.25,.20,.23);
  admiral.oval(bronzeEdge,-1.17,3.02,.47,.18,.23,.17);
  admiral.box(bronzeShade,-1.18,1.41,.52,.125,2.70,.075,0,.06,-.055);
  admiral.box(bronzeEdge,-1.22,1.39,.56,.025,2.64,.017,0,0,-.055);
  admiral.rod(bronzeEdge,[-1.41,2.76,.53],[-.96,2.76,.53],.071);
  admiral.rod(bronzeShade,[-1.18,2.78,.53],[-1.17,3.23,.49],.079);
  admiral.oval(bronzeEdge,-1.17,3.24,.49,.12,.075,.095);
  admiral.oval(bronzeShade,0,4.86,-.01,.41,.35,.40);
  admiral.oval(bronzeEdge,.012,5.33,.115,.43,.52,.37);
  face(admiral,bronzeEdge,bronzeShade,.012,5.32,.115,1.04);
  admiral.folds(bronzeShade,[[4.80,.11,.15,.37],[4.95,.23,.21,.38],[5.15,.25,.19,.37]],6,.028);
  for(const side of [-1,1]) admiral.rod(bronze,[(side)*.02,5.16,.51],[side*.23,5.19,.43],.044);
  admiral.oval(bronzeShade,0,5.77,.023,.55,.19,.52);
  admiral.folds(bronze,[[5.69,.48,.47,.03],[5.85,.48,.43,.009],[6.09,.33,.34,-.02],
    [6.27,.18,.20,-.026],[6.39,.075,.095,-.029]],8,.02);
  admiral.oval(bronzeEdge,0,6.425,-.026,.10,.075,.10);
  for(const side of [-1,1]) admiral.oval(bronzeShade,side*.39,5.39,-.04,.15,.37,.39,0,0,side*.18);
  admiral.finish();

  const ship=make(yiGroup);
  ship.box(darkStone,0,.27,2.65,2.44,.23,1.35);
  ship.oval(bronzeShade,0,.50,2.65,1.18,.24,.47);
  ship.oval(bronze,0,.70,2.65,1.04,.33,.47);
  for(let rib=-4;rib<=4;rib++){
    const x=rib*.2;
    ship.oval(bronzeEdge,x,.72,2.65,.036,.31*Math.sqrt(1-(rib/5)**2),.485*Math.sqrt(1-(rib/5)**2));
    for(const sign of [-1,1]) ship.oval(bronzeShade,x,.71,2.65+sign*.409*Math.sqrt(1-(rib/5)**2),.055,.047,.045);
  }
  ship.rod(bronze,[.94,.65,2.65],[1.16,.94,2.65],.12);
  ship.oval(bronzeEdge,1.20,1.00,2.65,.23,.13,.16);
  ship.oval(bronzeShade,1.34,.98,2.65,.13,.046,.12);
  for(const side of [-1,1]){
    const x=side*2.05;
    ship.box(darkStone,x,.27,2.47,.87,.21,.77);
    ship.rod(bronze,[x,.71,2.2],[x,.71,2.71],.35);
    ship.rod(bronzeEdge,[x,.71,2.715],[x,.71,2.774],.32);
    ship.rod(bronzeShade,[x,.71,2.77],[x,.71,2.79],.245);
    for(let i=0;i<10;i++){
      const angle=i*Math.PI/5;
      ship.oval(bronzeShade,x+Math.cos(angle)*.286,.71+Math.sin(angle)*.286,2.78,.027,.027,.016);
    }
  }
  ship.finish();

  const kingBase=make(sejongGroup);
  const masonryJoint=new T.MeshStandardMaterial({color:0x85817a,roughness:.94});
  const baseY=.29,shoulderY=3.55,baseWidth=8.48,shoulderWidth=6.77,baseDepth=7.06,shoulderDepth=5.66;
  const masonryOffset=-.17;
  const progress=y=>(y-baseY)/(shoulderY-baseY);
  const widthAt=y=>baseWidth+(shoulderWidth-baseWidth)*progress(y);
  const depthAt=y=>baseDepth+(shoulderDepth-baseDepth)*progress(y);
  const faceAt=y=>masonryOffset+depthAt(y)/2;
  kingBase.box(granite,0,.08,0,plazaMonumentFootprints.sejong.width,.16,plazaMonumentFootprints.sejong.depth);
  kingBase.box(granite,0,.223,masonryOffset,8.62,.134,7.26);
  kingBase.frustum(lightStone,0,masonryOffset,[[baseY,baseWidth,baseDepth],[shoulderY,shoulderWidth,shoulderDepth]]);
  kingBase.box(lightStone,0,3.837,masonryOffset,5.72,.574,4.78);
  kingBase.box(granite,0,4.162,masonryOffset,5.83,.076,4.90);
  for(const y of [.98,1.82,2.66,3.47]){
    kingBase.box(masonryJoint,0,y,masonryOffset,widthAt(y)+.014,.012,depthAt(y)+.014);
  }
  for(const side of [-1,1])for(const share of [.16,.36]){
    kingBase.rod(masonryJoint,[side*widthAt(baseY)*share,baseY,faceAt(baseY)+.006],
      [side*widthAt(shoulderY)*share,shoulderY,faceAt(shoulderY)+.006],.009);
  }
  const border=[[-2.77,3.43],[-1.48,.95],[1.48,.95],[2.77,3.43]];
  for(let i=1;i<border.length;i++){
    const [a,b]=[border[i-1],border[i]];
    kingBase.rod(granite,[a[0],a[1],faceAt(a[1])+.021],[b[0],b[1],faceAt(b[1])+.021],.036);
    kingBase.rod(masonryJoint,[a[0]*.975,a[1],faceAt(a[1])+.033],[b[0]*.975,b[1],faceAt(b[1])+.033],.016);
  }
  kingBase.finish();
  addInscription(T,sejongGroup,["세종대왕"],{
    x:0,y:1.99,z:faceAt(1.99)+.026,width:3.76,height:.75,
    rotation:Math.atan((shoulderDepth-baseDepth)/(2*(shoulderY-baseY))),color:"#282620",font:"'Malgun Gothic', sans-serif"
  });

  const kingFigure=new T.Group();
  kingFigure.name="세종대왕 청동 좌상";
  kingFigure.position.set(0,4.20,-.16);
  sejongGroup.add(kingFigure);
  sculptSejong(T,make(kingFigure),{gold,goldEdge,goldShade});

  const instruments=make(sejongGroup);
  for(const x of [-2.81,0,2.81]){
    instruments.box(granite,x,.13,5.98,1.91,.26,1.68);
    instruments.box(darkStone,x,.33,5.98,1.56,.16,1.39);
  }
  instruments.rod(goldShade,[-2.81,.40,5.98],[-2.81,.95,5.98],.19);
  const bowl=new T.SphereGeometry(1,20,12,0,Math.PI*2,Math.PI*.5,Math.PI*.5);
  instruments.part(bowl,gold,-2.81,1.08,5.98,.67,.29,.67);
  instruments.part(new T.TorusGeometry(.65,.042,8,26),goldEdge,-2.81,1.07,5.98,1,1,1,Math.PI/2);
  instruments.rod(goldEdge,[-2.81,.93,5.92],[-2.81,1.36,6.14],.026);
  instruments.rod(goldShade,[0,.4,5.98],[0,.95,5.98],.19);
  const ring=new T.TorusGeometry(.71,.041,8,26);
  instruments.part(ring,goldEdge,0,1.54,5.98,1,1,1,.16,.14);
  instruments.part(ring,gold,0,1.54,5.98,1,1,1,.40,1.13,.25);
  instruments.part(ring,goldEdge,0,1.54,5.98,1,1,1,Math.PI/2,0,.45);
  instruments.oval(goldShade,0,1.54,5.98,.22,.22,.22);
  instruments.rod(lightStone,[2.81,.40,5.98],[2.81,1.05,5.98],.26);
  instruments.rod(gold,[2.81,1.05,5.98],[2.81,1.56,5.98],.22);
  instruments.part(new T.TorusGeometry(.218,.028,8,20),goldEdge,2.81,1.56,5.98,1,1,1,Math.PI/2);
  instruments.finish();

  square.dispose();sphere.dispose();column.dispose();bowl.dispose();ring.dispose();
  return {yi:yiGroup,sejong:sejongGroup,yiFigure,yiFallback};
}

function face(model,metal,shadow,x,y,z,size){
  for(const side of [-1,1]){
    model.oval(shadow,x+side*.17*size,y+.15*size,z+.324*size,.124*size,.04*size,.045*size,0,side*.20,side*.10);
    model.oval(metal,x+side*.162*size,y+.064*size,z+.339*size,.116*size,.042*size,.050*size,0,side*.18);
    model.oval(shadow,x+side*.164*size,y+.053*size,z+.371*size,.043*size,.016*size,.017*size);
  }
  model.oval(metal,x,y+.025*size,z+.366*size,.074*size,.160*size,.108*size,-.22);
  model.oval(metal,x,y-.08*size,z+.420*size,.105*size,.055*size,.064*size);
  model.oval(shadow,x,y-.206*size,z+.369*size,.134*size,.019*size,.039*size);
}

function addInscription(T,group,lines,{x,y,z,width,height,rotation=0,facing=0,color,font="'Noto Serif KR', 'Batang', serif"}){
  if(typeof document==="undefined")return;
  const canvas=document.createElement("canvas");
  canvas.width=lines.length===1?512:128;
  canvas.height=lines.length===1?128:640;
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  const step=canvas.height/lines.length;
  ctx.fillStyle=color;
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.font=`700 ${Math.floor(step*.75)}px ${font}`;
  lines.forEach((line,index)=>ctx.fillText(line,canvas.width/2,(index+.5)*step,canvas.width*.95));
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const label=new T.Mesh(new T.PlaneGeometry(width,height),material);
  label.position.set(x,y,z);
  label.rotation.set(rotation,facing,0);
  group.add(label);
}

function makeSculpture(T,group,{square,sphere,column}){
  const batches=new Map(),matrix=new T.Matrix4(),normalMatrix=new T.Matrix3();
  const point=new T.Vector3(),normal=new T.Vector3(),translation=new T.Vector3(),scale=new T.Vector3();
  const up=new T.Vector3(0,1,0),delta=new T.Vector3(),quaternion=new T.Quaternion(),angles=new T.Euler();

  function append(geometry,material){
    if(!batches.has(material))batches.set(material,{points:[],normals:[],indices:[]});
    const {points,normals,indices}=batches.get(material);
    const pos=geometry.attributes.position,norm=geometry.attributes.normal,offset=points.length/3;
    normalMatrix.getNormalMatrix(matrix);
    for(let i=0;i<pos.count;i++){
      point.fromBufferAttribute(pos,i).applyMatrix4(matrix).toArray(points,points.length);
      normal.fromBufferAttribute(norm,i).applyNormalMatrix(normalMatrix).toArray(normals,normals.length);
    }
    const source=geometry.index;
    if(source)for(let i=0;i<source.count;i++)indices.push(source.getX(i)+offset);
    else for(let i=0;i<pos.count;i++)indices.push(i+offset);
  }

  function part(geometry,material,x,y,z,w,h,d,rx=0,ry=0,rz=0){
    quaternion.setFromEuler(angles.set(rx,ry,rz));
    matrix.compose(translation.set(x,y,z),quaternion,scale.set(w,h,d));
    append(geometry,material);
  }
  function box(material,x,y,z,w,h,d,rx=0,ry=0,rz=0){part(square,material,x,y,z,w,h,d,rx,ry,rz);}
  function oval(material,x,y,z,w,h,d,rx=0,ry=0,rz=0){part(sphere,material,x,y,z,w,h,d,rx,ry,rz);}
  function rod(material,a,b,radius){
    delta.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const height=delta.length();
    quaternion.setFromUnitVectors(up,delta.multiplyScalar(1/height));
    translation.set((a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5);
    matrix.compose(translation,quaternion,scale.set(radius,height,radius));
    append(column,material);
  }

  function addRings(material,rings,sides,vertex){
    const positions=[],indices=[];
    for(let j=0;j<rings.length;j++){
      for(let i=0;i<sides;i++){
        positions.push(...vertex(rings[j],i,j));
        if(j===0)continue;
        const a=(j-1)*sides+i,b=(j-1)*sides+(i+1)%sides;
        indices.push(a,a+sides,b,b,a+sides,b+sides);
      }
    }
    const top=(rings.length-1)*sides;
    for(let i=1;i<sides-1;i++)indices.push(0,i,i+1,top,top+i+1,top+i);
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    matrix.identity();
    append(geometry,material);
    geometry.dispose();
  }

  function folds(material,rings,flutes,depth){
    const sides=48;
    addRings(material,rings,sides,([y,width,depthZ,center],i,j)=>{
      const angle=i*Math.PI*2/sides;
      const ripple=depth*(Math.sin(angle*flutes+j*.42)*.72+Math.sin(angle*(flutes-3)-j*.25)*.28);
      return [Math.cos(angle)*(width+ripple),y,center+Math.sin(angle)*(depthZ+ripple)];
    });
  }

  function frustum(material,x,z,rings){
    const corners=[[1,-1],[1,1],[-1,1],[-1,-1]];
    addRings(material,rings,4,([y,width,depth],i)=>[x+corners[i][0]*width/2,y,z+corners[i][1]*depth/2]);
  }

  function finish(){
    for(const [material,{points,normals,indices}] of batches){
      const geometry=new T.BufferGeometry();
      geometry.setAttribute("position",new T.Float32BufferAttribute(points,3));
      geometry.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      group.add(new T.Mesh(geometry,material));
    }
    batches.clear();
  }
  return {part,box,oval,rod,folds,frustum,finish};
}
