// Independently modeled game works. No photograph or mesh of the originals is used.
const hirstBuilders=new Map([["skull",buildSkull],["shark",buildShark],["hirst-cow-head",buildCowCase]]);
export function addHirstWork(T,root,{wx,wz},exhibit){
  const build=hirstBuilders.get(exhibit.id);
  if(!build)return null;
  const group=new T.Group();group.name=exhibit.title;
  group.position.set(wx(exhibit.x),0,wz(exhibit.y));
  root.add(group);
  build(T,group,exhibitionKit(T,group));
  return group;
}

function exhibitionKit(T,root){
  const unit=new T.BoxGeometry(1,1,1);
  const surface=(color,metalness=.12,roughness=.55)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const glow=color=>new T.MeshBasicMaterial({color,toneMapped:false});
  function mesh(geometry,material,x=0,y=0,z=0,parent=root){
    const object=new T.Mesh(geometry,material);
    object.position.set(x,y,z);parent.add(object);return object;
  }
  function box(material,x,y,z,w,h,d,parent=root){
    const block=mesh(unit,material,x,y,z,parent);block.scale.set(w,h,d);return block;
  }
  function glass(color,opacity){
    return new T.ShaderMaterial({
      uniforms:{tint:{value:new T.Color(color)},opacity:{value:opacity}},
      side:T.DoubleSide,transparent:true,depthWrite:false,
      vertexShader:[
        "varying vec2 panelUv;",
        "varying vec3 panelNormal,panelCamera;",
        "void main(){",
        "  vec4 view=modelViewMatrix*vec4(position,1.0);",
        "  panelNormal=normalMatrix*normal;panelCamera=-view.xyz;panelUv=uv;",
        "  gl_Position=projectionMatrix*view;",
        "}"
      ].join("\n"),
      fragmentShader:[
        "uniform vec3 tint;uniform float opacity;",
        "varying vec2 panelUv;varying vec3 panelNormal,panelCamera;",
        "void main(){",
        "  float edge=pow(1.0-abs(dot(normalize(panelNormal),normalize(panelCamera))),3.0);",
        "  float line=panelUv.x+panelUv.y*0.19;",
        "  float shine=(1.0-smoothstep(0.0,0.025,abs(line-0.28)))*0.20+(1.0-smoothstep(0.0,0.011,abs(line-0.34)))*0.17;",
        "  float light=shine*mix(0.33,1.0,panelUv.y)+edge*0.19;",
        "  gl_FragColor=vec4(mix(tint,vec3(0.77,0.93,0.98),light*1.5),opacity+light*0.68);",
        "  #include <colorspace_fragment>",
        "}"
      ].join("\n")
    });
  }
  function vitrine({width,depth,bottom,top,frame,pane,rail}){
    const height=top-bottom,y=(top+bottom)/2,sides=[-1,1];
    for(const direction of sides){
      const front=mesh(new T.PlaneGeometry(width,height),pane,0,y,direction*depth/2);
      front.rotation.y=direction>0?0:Math.PI;
      const flank=mesh(new T.PlaneGeometry(depth,height),pane,direction*width/2,y,0);
      flank.rotation.y=direction*Math.PI/2;
      for(const z of sides)box(frame,direction*width/2,y,z*depth/2,rail,height,rail);
      for(const level of [bottom,top]){
        box(frame,0,level,direction*depth/2,width+rail,rail,rail);
        box(frame,direction*width/2,level,0,rail,rail,depth);
      }
    }
  }
  return {surface,glow,mesh,box,vitrine,glass};
}

function skullSculpture(x,y,z){
  x=Math.abs(x);
  const ellipsoid=(cx,cy,cz,rx,ry,rz)=>
    (Math.hypot((x-cx)/rx,(y-cy)/ry,(z-cz)/rz)-1)*Math.min(rx,ry,rz);
  const soften=(a,b,r)=>{
    const overlap=Math.max(0,r-Math.abs(a-b))/r;
    return Math.min(a,b)-overlap*overlap*r*.25;
  };
  let shape=ellipsoid(0,.23,-.18,.67,.725,.77);
  shape=soften(shape,ellipsoid(0,.22,.239,.602,.623,.475),.14);
  shape=soften(shape,ellipsoid(.424,-.17,.295,.237,.257,.320),.12);
  shape=soften(shape,ellipsoid(0,-.207,.453,.235,.348,.272),.10);
  shape=soften(shape,ellipsoid(0,-.405,.365,.409,.20,.344),.11);
  shape=Math.max(shape,-y-.546);
  const orbital=ellipsoid(.276,-.081,.638,.211,.197,.33);
  const nostril=ellipsoid(0,-.265,.678,.097,.158,.21);
  const lowerNostril=ellipsoid(0,-.355,.690,.119,.104,.217);
  const temples=ellipsoid(.484,-.30,-.045,.178,.138,.205);
  return Math.max(shape,-orbital,-Math.min(nostril,lowerNostril),-temples);
}

function skullNormal(T,x,y,z){
  const h=.0016;
  return new T.Vector3(
    skullSculpture(x+h,y,z)-skullSculpture(x-h,y,z),
    skullSculpture(x,y+h,z)-skullSculpture(x,y-h,z),
    skullSculpture(x,y,z+h)-skullSculpture(x,y,z-h)
  ).normalize();
}

function skullMesh(T){
  // Split each cell into tetrahedra to retain the modeled eye sockets and nasal cavity.
  const size=[27,29,28],lo=[-.75,-.585,-.965],hi=[.75,.99,.76];
  const step=hi.map((end,i)=>(end-lo[i])/(size[i]-1)),[nx,ny,nz]=size;
  const values=new Float32Array(nx*ny*nz);
  const offset=(i,j,k)=>i+nx*(j+ny*k);
  for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    values[offset(i,j,k)]=skullSculpture(lo[0]+i*step[0],lo[1]+j*step[1],lo[2]+k*step[2]);
  }
  const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const cells=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const triNormal=new T.Vector3(),edgeA=new T.Vector3(),edgeB=new T.Vector3();
  const positions=[],normals=[],indices=[],vertexPositions=[],vertexNormals=[],edgeIndices=new Map();
  function face(a,b,c){
    const p=vertexPositions[a];
    triNormal.crossVectors(edgeA.subVectors(vertexPositions[b],p),edgeB.subVectors(vertexPositions[c],p));
    if(triNormal.dot(vertexNormals[a])>=0)indices.push(a,b,c);
    else indices.push(a,c,b);
  }
  for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
    const cornerIndices=corners.map(([dx,dy,dz])=>offset(i+dx,j+dy,k+dz));
    const scalar=cornerIndices.map(index=>values[index]);
    if(scalar.every(value=>value<0)||scalar.every(value=>value>=0))continue;
    const points=corners.map(([dx,dy,dz])=>new T.Vector3(lo[0]+(i+dx)*step[0],lo[1]+(j+dy)*step[1],lo[2]+(k+dz)*step[2]));
    const edge=(a,b)=>{
      const p=cornerIndices[a],q=cornerIndices[b],key=Math.min(p,q)*values.length+Math.max(p,q);
      const known=edgeIndices.get(key);
      if(known!==undefined)return known;
      const vertex=points[a].clone().lerp(points[b],scalar[a]/(scalar[a]-scalar[b]));
      const normal=skullNormal(T,vertex.x,vertex.y,vertex.z),index=vertexPositions.length;
      edgeIndices.set(key,index);vertexPositions.push(vertex);vertexNormals.push(normal);
      positions.push(vertex.x,vertex.y,vertex.z);normals.push(normal.x,normal.y,normal.z);
      return index;
    };
    for(const tetrahedron of cells){
      const inner=tetrahedron.filter(vertex=>scalar[vertex]<0),outer=tetrahedron.filter(vertex=>scalar[vertex]>=0);
      if(inner.length===1)face(...outer.map(vertex=>edge(inner[0],vertex)));
      else if(outer.length===1)face(...inner.map(vertex=>edge(outer[0],vertex)));
      else if(inner.length===2){
        const a=edge(inner[0],outer[0]),b=edge(inner[0],outer[1]);
        const c=edge(inner[1],outer[0]),d=edge(inner[1],outer[1]);
        face(a,b,c);face(c,b,d);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
  geometry.setIndex(indices);
  return geometry;
}

function brilliantCut(T){
  const segments=8,vertices=[];
  const circle=(i,r,z)=>[Math.cos(i*Math.PI/4)*r,Math.sin(i*Math.PI/4)*r,z];
  const triangle=(a,b,c)=>vertices.push(...a,...b,...c);
  for(let i=0;i<segments;i++){
    const outer=circle(i,1,.04),next=circle(i+1,1,.04);
    const crown=circle(i+.5,.54,.53),previous=circle(i-.5,.54,.53);
    triangle(outer,next,crown);
    triangle(outer,crown,previous);
    triangle(previous,crown,[0,0,.53]);
    triangle(next,outer,[0,0,-.48]);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
  return geometry;
}

function gemSurface(T){
  return new T.ShaderMaterial({
    vertexShader:[
      "varying vec3 facet,eye,worldFacet,tint;",
      "void main(){",
      "  vec4 model=instanceMatrix*vec4(position,1.0);",
      "  vec4 view=modelViewMatrix*model;",
      "  worldFacet=mat3(modelMatrix)*mat3(instanceMatrix)*normal;",
      "  facet=normalMatrix*mat3(instanceMatrix)*normal;",
      "  eye=-view.xyz;tint=instanceColor;gl_Position=projectionMatrix*view;",
      "}"
    ].join("\n"),
    fragmentShader:[
      "varying vec3 facet,eye,worldFacet,tint;",
      "void main(){",
      "  vec3 n=normalize(facet),v=normalize(eye),w=normalize(worldFacet);",
      "  float lamp=max(0.0,dot(w,normalize(vec3(0.35,0.81,0.48))));",
      "  float shine=pow(max(0.0,dot(n,normalize(v+vec3(-0.42,0.68,0.60)))),23.0);",
      "  float refraction=pow(max(0.0,dot(n,normalize(v+vec3(0.65,0.31,0.42)))),14.0);",
      "  vec3 base=tint*(0.16+0.79*lamp);",
      "  vec3 sparkle=shine*vec3(1.0,0.94,0.77)+refraction*vec3(0.37,0.68,1.0);",
      "  gl_FragColor=vec4(base+sparkle,1.0);",
      "  #include <colorspace_fragment>",
      "}"
    ].join("\n")
  });
}

function dressSkull(T,head){
  const forward=new T.Vector3(0,0,1),axis=new T.Vector3(),point=new T.Vector3();
  const origin=new T.Vector3(0,.155,.019),normal=new T.Vector3(),rotation=new T.Quaternion();
  const spin=new T.Quaternion(),scale=new T.Vector3(),matrix=new T.Matrix4(),color=new T.Color();
  const gemstones=new T.InstancedMesh(brilliantCut(T),gemSurface(T),1560);
  const icy=[0xdde7fa,0xc4d8ef,0xf6f8ff,0xb8d2e3,0xc8d4ff,0x91bad5];
  const blue=[0x79d4da,0x8eabf0,0x337d9f,0x5d8dca];
  let count=0;
  function gem(position,surface,radius,index,tones){
    rotation.setFromUnitVectors(forward,surface);
    rotation.multiply(spin.setFromAxisAngle(forward,index*.73));
    scale.setScalar(radius);
    matrix.compose(position,rotation,scale);
    gemstones.setMatrixAt(count,matrix);
    gemstones.setColorAt(count,color.setHex(tones[index%tones.length]));
    count++;
  }
  for(let i=0;i<1450;i++){
    const y=1-2*(i+.5)/1450,radial=Math.sqrt(1-y*y),angle=i*2.3999632297;
    axis.set(Math.cos(angle)*radial,y,Math.sin(angle)*radial);
    let low=0,high=1.4;
    for(let step=0;step<15;step++){
      const span=(low+high)/2;
      point.copy(origin).addScaledVector(axis,span);
      if(skullSculpture(point.x,point.y,point.z)<0)low=span;
      else high=span;
    }
    point.copy(origin).addScaledVector(axis,(low+high)/2);
    normal.copy(skullNormal(T,point.x,point.y,point.z));
    if(normal.dot(axis)<.48||point.y<-.495)continue;
    const orbital=Math.hypot((Math.abs(point.x)-.273)/.204,(point.y+.080)/.186);
    if(point.z>.39&&(orbital<1.0||Math.abs(point.x)<.103&&point.y<-.17))continue;
    const stripe=point.x*.9+point.y*.56+point.z*.18;
    const band=stripe>.29&&stripe<.51;
    point.addScaledVector(normal,.010);
    gem(point,normal,.024+((i*157)%97)*.000137,i,band?blue:icy);
  }
  for(let row=0;row<3;row++)for(let col=0;col<32;col++){
    const angle=-1.66+col*.107+(row%2)*.051;
    normal.set(Math.sin(angle),0,Math.cos(angle));
    point.set(Math.sin(angle)*.425,-.657-row*.038,Math.cos(angle)*.42+.25);
    gem(point,normal,.025+row*.001,col+row,icy);
  }
  for(const [x,y,radius] of [[.455,.497,.069],[.504,.430,.048],[.526,.369,.039]]){
    let z=.635;
    while(z>.30&&skullSculpture(x,y,z)>0)z-=.002;
    normal.copy(skullNormal(T,x,y,z));point.set(x,y,z).addScaledVector(normal,.025);
    gem(point,normal,radius,count,blue);
  }
  gemstones.count=count;gemstones.computeBoundingSphere();head.add(gemstones);
}

function buildSkull(T,root,{surface,glow,mesh,box,glass,vitrine}){
  const midnight=surface(0x192933,.34,.31),top=surface(0x3b525b,.39,.43),trim=surface(0x627e83,.66,.38);
  box(midnight,0,.11,0,3.34,.2,2.39);
  box(midnight,0,.48,0,2.88,.64,1.90);
  box(top,0,.83,0,3.11,.085,2.12);
  box(glow(0x79adb3),0,.795,0,3.12,.025,2.128);
  box(top,0,.89,0,2.97,.036,1.995);
  vitrine({width:2.96,depth:2,bottom:.89,top:2.88,frame:trim,pane:glass(0x83b8ce,.045),rail:.033});
  box(top,0,.98,-.14,.62,.17,.68);
  box(midnight,0,1.15,-.18,.29,.32,.38);
  const head=new T.Group();head.position.y=1.80;root.add(head);
  const silver=new T.MeshPhongMaterial({color:0x96aeb6,specular:0xe2fdff,shininess:43,emissive:0x1c2733});
  mesh(skullMesh(T),silver,0,0,0,head);
  const corners=[];
  for(let i=0;i<=26;i++){
    const theta=-1.8+i*3.6/26;
    corners.push(new T.Vector3(Math.sin(theta)*.374,-.686+Math.max(0,Math.abs(theta)-.95)*.135,Math.cos(theta)*.37+.245));
  }
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(corners),40,.090,10,false),silver,0,0,0,head);
  const oral=new T.MeshBasicMaterial({color:0x192330});
  const shadow=mesh(new T.SphereGeometry(1,20,12),oral,0,-.583,.449,head);
  shadow.scale.set(.37,.063,.245);
  const porcelain=new T.MeshPhongMaterial({color:0xcac6ae,shininess:35,specular:0xfff5e2});
  const tooth=new T.SphereGeometry(1,12,8);
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const offset=(i+.5)*.049,slope=offset*offset*1.19;
    const upper=mesh(tooth,porcelain,side*offset,-.534,.679-slope,head);
    upper.scale.set(i>4?.035:.028,i<3?.078:.064,.045);upper.rotation.z=side*.11;
    const lower=mesh(tooth,porcelain,side*offset*.97,-.612,.657-slope*.98,head);
    lower.scale.set(.026,.058,.037);lower.rotation.z=side*-.09;
  }
  dressSkull(T,head);
}

const sharkProfiles=[
  [-3.28,.002,.065,.058],[-3.08,.01,.095,.085],[-2.69,.015,.123,.136],
  [-2.08,.012,.224,.267],[-1.39,.018,.346,.435],[-.53,.041,.471,.615],
  [.34,.033,.562,.749],[1.15,.014,.587,.744],[1.77,-.031,.533,.657],
  [2.23,-.073,.469,.518],[2.62,-.12,.350,.414],[2.94,-.15,.219,.299],
  [3.15,-.167,.123,.187],[3.26,-.16,.019,.033]
];

function sharkProfile(x){
  let right=1;
  while(right<sharkProfiles.length-1&&x>sharkProfiles[right][0])right++;
  const a=sharkProfiles[Math.max(0,right-2)],b=sharkProfiles[right-1],c=sharkProfiles[right];
  const d=sharkProfiles[Math.min(sharkProfiles.length-1,right+1)];
  const t=(x-b[0])/(c[0]-b[0]),t2=t*t,t3=t2*t;
  return b.slice(1).map((value,i)=>{
    const [start,end,after]=[a[i+1],c[i+1],d[i+1]];
    return .5*((2*value)+(-start+end)*t+(2*start-5*value+4*end-after)*t2+(-start+3*value-3*end+after)*t3);
  });
}

function sharkPoint(T,x,angle,extra=0){
  const [axis,width,height]=sharkProfile(x);
  return new T.Vector3(x,axis+Math.cos(angle)*(height+extra),Math.sin(angle)*(width+extra));
}

function sharkBody(T){
  const lengths=64,angles=46,positions=[],colors=[],indices=[];
  const base=new T.Color(0x608496),belly=new T.Color(0xdce1d6),shade=new T.Color(0x293a52),swatch=new T.Color();
  for(let i=0;i<=lengths;i++)for(let j=0;j<=angles;j++){
    const x=-3.28+6.54*i/lengths,angle=Math.PI*2*j/angles,point=sharkPoint(T,x,angle);
    const top=Math.cos(angle);
    const stripe=Math.max(0,Math.cos(x*9+top*1.6+Math.sin(x*12)*.22));
    const strength=(.28+Math.max(0,stripe-.4)*.48)*T.MathUtils.smoothstep(top,-.36,.74);
    swatch.copy(base).lerp(shade,strength).lerp(belly,1-T.MathUtils.smoothstep(top,-.76,-.22));
    swatch.multiplyScalar(.963+Math.cos(x*54+top*63)*.020+Math.sin(x*93+angle*57)*.017);
    positions.push(point.x,point.y,point.z);colors.push(swatch.r,swatch.g,swatch.b);
    if(i<lengths&&j<angles){
      const p=i*(angles+1)+j;
      indices.push(p,p+1,p+angles+1,p+1,p+angles+2,p+angles+1);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  geometry.computeVertexNormals();return geometry;
}

function fin(T,edge,thickness,spreadAxis){
  const points=edge.map(corner=>new T.Vector3(...corner));
  const loop=new T.CatmullRomCurve3(points,true,"centripetal");
  const perimeter=loop.getPoints(30).slice(0,-1),positions=[],colors=[],indices=[];
  const center=perimeter.reduce((result,p)=>result.add(p),new T.Vector3()).multiplyScalar(1/perimeter.length);
  const upper=new T.Color(0x4a6582),lower=new T.Color(0x839ca2);
  const direction=new T.Vector3();direction[spreadAxis]=thickness/2;
  for(const side of [-1,1]){
    const middle=center.clone().addScaledVector(direction,side);
    const cornerStart=positions.length/3;
    positions.push(...middle);colors.push(...(side<0?lower:upper));
    for(const vertex of perimeter){
      positions.push(...vertex);
      colors.push(...(side<0?lower:upper));
      const current=positions.length/3-1;
      const next=current===cornerStart+perimeter.length?cornerStart+1:current+1;
      if(side<0)indices.push(cornerStart,next,current);
      else indices.push(cornerStart,current,next);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function buildShark(T,root,{surface,glow,mesh,box,glass,vitrine}){
  const frame=surface(0x2d4550,.46,.32),platform=surface(0x1f333a,.23,.44),lit=glow(0xa1dfe0);
  const frameWidth=9.06,frameDepth=4.55,bottom=.37,top=4.06;
  box(platform,0,.115,0,9.16,.21,4.68);
  box(frame,0,.289,0,9.10,.22,4.64);
  box(surface(0x507a83,.31,.41),0,.414,0,8.95,.045,4.46);
  vitrine({width:frameWidth,depth:frameDepth,bottom,top,frame,pane:glass(0x71c8d6,.105),rail:.095});
  for(const sign of [-1,1]){
    box(lit,0,top-.12,sign*(frameDepth/2-.14),frameWidth-.25,.025,.038);
    box(lit,sign*(frameWidth/2-.14),top-.12,0,.038,.025,frameDepth-.25);
    box(lit,0,top-.31,sign*(frameDepth/2-.023),frameWidth-.12,.021,.02);
    box(lit,sign*(frameWidth/2-.02),top-.31,0,.02,.021,frameDepth-.12);
  }
  const liquid=new T.MeshBasicMaterial({color:0xa0dce3,transparent:true,opacity:.20,depthWrite:false,side:T.DoubleSide});
  mesh(new T.PlaneGeometry(frameWidth-.12,frameDepth-.12),liquid,0,top-.309,0).rotation.x=-Math.PI/2;
  const overhead=new T.MeshBasicMaterial({color:0x6ea2a9,opacity:.20,transparent:true,side:T.DoubleSide,depthWrite:false});
  mesh(new T.PlaneGeometry(frameWidth-.14,frameDepth-.14),overhead,0,top,0).rotation.x=-Math.PI/2;
  const specimen=new T.Group();specimen.name="회청빛 상어 표본";
  specimen.position.set(.32,2.05,.04);specimen.rotation.y=-.08;root.add(specimen);
  const skin=new T.MeshStandardMaterial({vertexColors:true,roughness:.56,metalness:.05,emissive:0x142e3d,emissiveIntensity:.15,side:T.DoubleSide});
  mesh(sharkBody(T),skin,0,0,0,specimen);
  const plates=[
    [[.55,.715,0],[-.035,1.28,0],[-.88,1.60,0],[-.71,1.105,0],[-.79,.63,0]],
    [[-3.20,.05,0],[-3.89,1.13,0],[-4.23,1.28,0],[-3.96,.47,0],[-3.52,.04,0],[-3.83,-.58,0],[-3.93,-.87,0],[-3.53,-.71,0],[-3.15,-.06,0]],
    [[-1.93,.328,0],[-2.21,.57,0],[-2.50,.54,0],[-2.45,.245,0]]
  ];
  for(const edge of plates)mesh(fin(T,edge,.11,"z"),skin,0,0,0,specimen);
  for(const side of [-1,1]){
    const mirrored=points=>points.map(([x,y,z])=>[x,y,side*z]);
    const pectoral=mirrored([[1.21,-.35,.49],[.55,-.49,.97],[-.45,-.63,1.63],[-.40,-.52,1.22],[-.32,-.36,.39]]);
    const pelvic=mirrored([[-1.39,-.26,.24],[-1.81,-.45,.64],[-2.15,-.51,.71],[-1.97,-.30,.26]]);
    mesh(fin(T,pectoral,.093,"y"),skin,0,0,0,specimen);
    mesh(fin(T,pelvic,.064,"y"),skin,0,0,0,specimen);
  }
  const ink=new T.MeshPhongMaterial({color:0x131f2a,specular:0x6fc6cd,shininess:75});
  const liner=new T.MeshBasicMaterial({color:0x36515e});
  const eye=new T.SphereGeometry(1,16,10);
  for(const side of [-1,1]){
    const at=sharkPoint(T,2.42,side*1.10,.013);
    const rim=mesh(eye,liner,at.x,at.y,at.z,specimen);rim.scale.set(.116,.088,.055);
    const pupil=mesh(eye,ink,at.x+.014,at.y+.012,at.z+side*.043,specimen);
    pupil.scale.set(.075,.067,.046);
    const gleam=mesh(eye,glow(0xc0dfd9),at.x+.037,at.y+.043,at.z+side*.075,specimen);
    gleam.scale.setScalar(.012);
    for(let gill=0;gill<5;gill++){
      const points=[];
      for(let i=0;i<=9;i++){
        const t=i/9,x=1.69-gill*.153+.105*Math.sin(t*Math.PI);
        points.push(sharkPoint(T,x,side*(1.13+t*.86),.013));
      }
      const slit=new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.016-gill*.0011,4,false);
      mesh(slit,liner,0,0,0,specimen);
    }
  }
  const mouth=[];
  for(let i=0;i<=32;i++){
    const t=i/16-1;
    mouth.push(sharkPoint(T,2.88-1.13*Math.abs(t)**1.69,Math.PI+1.05*t,.012));
  }
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(mouth),36,.030,5,false),ink,0,0,0,specimen);
  const tether=surface(0x83b4bb,.30,.46);
  for(const [x,y] of [[-1.7,2.64],[1.5,2.80]]){
    box(tether,x,(y+top)/2,.08,.015,top-y,.015);
  }
  const particles=[];
  for(let i=0;i<112;i++)particles.push(((i*193)%887)/100-4.43,.45+((i*271)%326)/100,((i*137)%439)/100-2.19);
  const points=new T.BufferGeometry();points.setAttribute("position",new T.Float32BufferAttribute(particles,3));
  root.add(new T.Points(points,new T.PointsMaterial({color:0xa2d5d7,size:.031,transparent:true,opacity:.23,depthWrite:false})));
}

const cowProfiles=[
  [-.61,.045,.006,.008],[-.56,.032,.218,.223],[-.43,.021,.341,.318],
  [-.27,.014,.337,.327],[-.09,-.013,.292,.298],[.09,-.059,.236,.237],
  [.24,-.098,.185,.179],[.43,-.140,.187,.120],[.57,-.15,.120,.071],[.61,-.15,.008,.009]
];

function cowHeadSurface(T){
  const positions=[],colors=[],indices=[];
  const rings=38,sections=36;
  const brown=new T.Color(0x523630),black=new T.Color(0x241e24),cream=new T.Color(0xd5b796),tone=new T.Color();
  const profile=new T.CatmullRomCurve3(cowProfiles.map(([z,y,w,h])=>new T.Vector3(z,w,h)),false,"catmullrom");
  const center=new T.CatmullRomCurve3(cowProfiles.map(([z,y])=>new T.Vector3(z,y,0)),false,"catmullrom");
  for(let i=0;i<=rings;i++){
    const t=i/rings,shape=profile.getPoint(t),axis=center.getPoint(t);
    for(let j=0;j<sections;j++){
      const angle=j/sections*2*Math.PI,top=Math.cos(angle),lateral=Math.sin(angle),z=axis.x;
      const brow=Math.exp(-((z+.072)**2)/.018)*Math.max(0,1-Math.abs(top-.42)*2.3);
      const x=lateral*(shape.y+.025*brow),y=axis.y+top*shape.z;
      positions.push(x,y,z);
      const stripe=Math.abs(lateral+.13+.11*Math.sin(z*12)),border=.31+.079*Math.sin(z*10)+.06*Math.cos(z*25);
      const blaze=(1-T.MathUtils.smoothstep(stripe,border-.036,border+.034))*T.MathUtils.smoothstep(top,.26,.58);
      const cheek=T.MathUtils.smoothstep(top,-.87,.66)*.53+Math.max(0,Math.sin(z*22+lateral*3))*.12;
      tone.copy(black).lerp(brown,cheek).lerp(cream,blaze*.93);
      tone.multiplyScalar(.92+.10*Math.sin(z*81+x*87+y*42)+.07*Math.cos(z*140+x*115-y*70));
      colors.push(tone.r,tone.g,tone.b);
      if(i<rings){
        const a=i*sections+j,b=i*sections+(j+1)%sections;
        indices.push(a,a+sections,b,b,a+sections,b+sections);
      }
    }
  }
  // The tiny end rings close the sculpture all the way around the muzzle and the crown.
  for(let i=1;i<sections-1;i++)indices.push(0,i,i+1,rings*sections,rings*sections+i+1,rings*sections+i);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}

function taperedHorn(T,side){
  const path=new T.CatmullRomCurve3([
    new T.Vector3(side*.226,.224,-.32),new T.Vector3(side*.337,.289,-.338),
    new T.Vector3(side*.451,.390,-.325),new T.Vector3(side*.515,.482,-.275)
  ]);
  const rings=16,sections=10,frames=path.computeFrenetFrames(rings,false);
  const positions=[],indices=[],colors=[],point=new T.Vector3();
  const rootColor=new T.Color(0x726155),ivory=new T.Color(0xe9d4b2),tipColor=new T.Color(0x514742),tone=new T.Color();
  for(let i=0;i<=rings;i++){
    const t=i/rings,center=path.getPointAt(t);
    const radius=.077*(1-t)**1.06+.002;
    for(let j=0;j<sections;j++){
      const angle=Math.PI*2*j/sections,groove=.92+.08*Math.cos(i*1.45);
      point.copy(center).addScaledVector(frames.normals[i],radius*groove*Math.cos(angle))
        .addScaledVector(frames.binormals[i],radius*groove*Math.sin(angle));
      positions.push(point.x,point.y,point.z);
      tone.copy(rootColor).lerp(ivory,T.MathUtils.smoothstep(t,.10,.47)).lerp(tipColor,T.MathUtils.smoothstep(t,.62,1));
      colors.push(tone.r,tone.g,tone.b);
      if(i<rings){
        const a=i*sections+j,b=i*sections+(j+1)%sections;
        indices.push(a,b,a+sections,b,b+sections,a+sections);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}

function buildCowCase(T,root,{surface,glow,mesh,box,glass,vitrine}){
  const width=3.20,depth=1.68,bottom=.118,top=1.72,rail=.043;
  const frame=surface(0x29333c,.51,.37),floor=surface(0x333839,.20,.58),edge=surface(0x686969,.48,.43);
  const pane=glass(0xa3bbbd,.018);
  box(floor,0,.055,0,3.26,.11,1.74);
  box(edge,0,.119,0,3.195,.034,1.67);
  box(floor,0,.141,0,3.153,.012,1.632);
  vitrine({width,depth,bottom,top,frame,pane,rail});
  mesh(new T.PlaneGeometry(width-rail,depth-rail),pane,0,top,0).rotation.x=-Math.PI/2;
  mesh(new T.PlaneGeometry(depth-rail,top-bottom),glass(0x9eb6b3,.010),-.06,(top+bottom)/2,0).rotation.y=Math.PI/2;
  for(const side of [-1,1])box(frame,-.06,(top+bottom)/2,side*depth/2,rail,top-bottom,rail);
  for(const level of [bottom,top])box(frame,-.06,level,0,rail,rail,depth);
  const lamp=glow(0xc5e4de);
  for(const side of [-1,1])box(lamp,0,top-.075,side*.71,3.08,.021,.03);

  const cabinet=surface(0xd9d8ca,.09,.51),fitting=surface(0x454b56,.36,.39),tube=glow(0x8ed1f7);
  box(cabinet,-.90,.425,-.18,.74,.555,.68);
  box(surface(0xb0b1a9),-.90,.677,-.18,.77,.065,.71);
  box(fitting,-.90,.578,.165,.142,.029,.012);
  for(const x of [-1.18,-.62])box(fitting,x,1.451,-.39,.014,.49,.014);
  box(fitting,-.90,1.207,-.39,.64,.246,.095);
  for(const y of [1.15,1.24])box(tube,-.90,y,-.339,.552,.031,.014);
  for(let i=0;i<14;i++)box(frame,-1.189+i*.044,1.207,-.321,.008,.19,.015);

  const head=new T.Group();head.name="소머리 모형";
  head.position.set(.76,0,-.04);head.rotation.set(.235,.26,-.11,"YXZ");root.add(head);
  const coat=new T.MeshStandardMaterial({vertexColors:true,roughness:.69,metalness:.02});
  mesh(cowHeadSurface(T),coat,0,0,0,head);
  const earLeather=surface(0x3a292b,.07,.7),earInner=surface(0x775151,.04,.66);
  const muzzle=surface(0x392d36,.08,.49),lid=surface(0x382426,.04,.55),eye=new T.MeshPhongMaterial({color:0x15141b,specular:0x805f5a,shininess:25});
  const detailSphere=new T.SphereGeometry(1,20,12);
  const oval=(material,x,y,z,scale,parent=head)=>{
    const part=mesh(detailSphere,material,x,y,z,parent);part.scale.set(...scale);return part;
  };
  oval(muzzle,0,-.139,.501,[.217,.120,.134]);
  const mouth=new T.CatmullRomCurve3([[-.18,-.224,.552],[-.12,-.236,.583],[0,-.242,.595],[.12,-.236,.583],[.18,-.224,.552]]
    .map(point=>new T.Vector3(...point)));
  mesh(new T.TubeGeometry(mouth,18,.007,5,false),lid,0,0,0,head);
  for(const side of [-1,1]){
    mesh(taperedHorn(T,side),coat,0,0,0,head);
    const ear=new T.Group();ear.position.set(side*.355,.125,-.28);ear.rotation.set(-.16,side*.3,side*.26);head.add(ear);
    oval(earLeather,side*.100,0,0,[.221,.083,.071],ear);
    oval(earInner,side*.115,.007,.051,[.168,.049,.028],ear);
    const socket=new T.Group();socket.position.set(side*.24,.065,.077);socket.rotation.y=side*1.182;head.add(socket);
    oval(lid,0,0,0,[.081,.043,.049],socket);
    oval(eye,0,.001,.041,[.057,.024,.019],socket);
    oval(surface(0x9d7868),-.012,.011,.057,[.014,.006,.003],socket);
    const nostril=oval(lid,side*.127,-.123,.608,[.045,.022,.015]);
    nostril.rotation.y=side*.56;nostril.rotation.z=side*.24;
  }
  const bounds=new T.Box3().setFromObject(head,true);
  head.position.y+=.148-bounds.min.y;

  const dish=new T.CylinderGeometry(.124,.096,.029,20),dishInterior=new T.CylinderGeometry(.095,.095,.007,20);
  for(const [x,z] of [[.23,.50],[1.29,-.41]]){
    mesh(dish,edge,x,.161,z);
    mesh(dishInterior,x<.5?surface(0x555246):surface(0xa4a6a0),x,.177,z);
  }
}
