import {districtMeshes,randomSeed} from "./gyeongju-mesh.js";
import {jetWater,jetTube,tickWater,waterNoise} from "./water-shader.js";
import {beachPools,beachRiver,beachRiverLength,beachSeconds,beachWaveHeight,beachWaveStart,beachWaveEnd,waveSection,kidsRim,riverOffset,waveSample,riverSample,kidsSample} from "./california-beach-water.js";

const tau=Math.PI*2,ivory=0xffdfac,stone=0xd7bc94,tile=0x408c96,teal=0x307878,coral=0xc46654;
const wood=0x946847,white=0xfff0d2,navy=0x335d71,stem=0x728147,leaf=0x548147;
const V=(x,y,z)=>({x,y,z});

function poolSurface(T,root,kind){
  const positions=[],props=[],indices=[];
  function vertex(x,z,s,edge){positions.push(x,0,z);props.push(s.phase,s.amplitude,s.depth,edge);}
  function grid(rows,cols,make){
    for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
      make(i,j,rows,cols);
      if(i<rows&&j<cols){const a=i*(cols+1)+j;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
    }
  }
  if(kind==="wave")grid(82,44,(i,j,rows,cols)=>{
    const z=beachWaveStart+(beachWaveEnd-beachWaveStart)*i/rows,{left,right}=waveSection(z),x=left+(right-left)*j/cols;
    vertex(x,z,waveSample(x,z),Math.min(x-left,right-x,z-beachWaveStart,beachWaveEnd-z));
  });
  if(kind==="river")grid(beachRiver.length,8,(i,j,rows,cols)=>{
    const p=beachRiver[i%rows],u=(j/cols*2-1),q=riverOffset(p,u*p.half);
    vertex(q.x,q.z,riverSample(i===rows?beachRiverLength:p.d,u),(1-Math.abs(u))*p.half);
  });
  if(kind==="kids")grid(16,80,(i,j,rows,cols)=>{
    const a=j*tau/cols,f=i/rows,p=kidsRim(a,f);vertex(p.x,p.z,kidsSample(p.x,p.z,f),(1-f)*10.5);
  });
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geo.setAttribute("waterData",new T.Float32BufferAttribute(props,4));geo.setIndex(indices);geo.computeBoundingSphere();geo.boundingSphere.radius+=1.3;
  const mode=kind==="wave"?0:kind==="river"?1:2;
  const mat=new T.ShaderMaterial({side:T.DoubleSide,fog:true,defines:{MODE:mode},
    uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{clock:{value:0},night:{value:0}}]),
    vertexShader:`
      uniform float clock;
      attribute vec4 waterData;
      varying vec3 world;
      varying vec2 local;
      varying vec4 surface;
      #include <fog_pars_vertex>
      void main(){
        float phase=waterData.x,amp=waterData.y,angle=phase+clock*.049087385*(MODE==0?27.:-34.);
        float crest=(1.+sin(angle))*.5;
        float h=(MODE==0?.205:.25)+amp*(crest*crest*.84+.16*(.5+.5*sin(2.*angle-.65)));
        if(MODE==2){angle=phase-clock*.049087385*37.;h=.23+amp*sin(angle);}
        vec3 p=position;p.y=h;world=(modelMatrix*vec4(p,1.)).xyz;
        local=p.xz-vec2(6300.,260.);surface=vec4(waterData.z,waterData.w,angle,amp);
        vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      uniform float clock,night;
      varying vec3 world;
      varying vec2 local;
      varying vec4 surface;
      #include <fog_pars_fragment>
      ${waterNoise}
      void main(){
        vec2 p=local;float depth=surface.x,edge=surface.y,angle=surface.z;
        vec3 normal=normalize(cross(dFdx(world),dFdy(world)));normal*=normal.y<0.?-1.:1.;
        vec2 wrinkle=vec2(sin(p.x*2.34+p.y*.67+clock*1.8),cos(p.y*2.62-p.x*.55-clock*1.53));
        normal=normalize(normal+vec3(wrinkle.x*.059,0.,wrinkle.y*.059));
        vec3 eye=normalize(cameraPosition-world);float facing=clamp(dot(normal,eye),.12,1.);
        vec2 bed=p-eye.xz*depth*.38/max(.45,eye.y)+normal.xz*depth*.65;
        vec2 lattice=bed*1.34,frac=abs(fract(lattice)-.5);float mortar=smoothstep(.44,.5,max(frac.x,frac.y));
        float fleck=hash(floor(lattice));
        vec3 shallow=MODE==2?vec3(.28,.75,.70):vec3(.35,.77,.66),deep=MODE==1?vec3(.016,.32,.36):vec3(.018,.34,.46);
        vec3 bedTone=mix(shallow,deep,smoothstep(.2,1.9,depth));
        if(MODE==2){
          vec2 sea=bed-vec2(69.,9.4);float a=atan(sea.y,sea.x);
          float star=1.-smoothstep(-.10,.12,length(sea)-(1.83+.77*cos(5.*a)));
          bedTone=mix(bedTone,vec3(.89,.56,.31),star*.88);
        }
        float pattern=sin(bed.x*2.57+1.48*sin(bed.y*1.73-clock*.67)+clock*.81)+sin(bed.y*2.81+1.65*sin(bed.x*1.57+clock*.49)-clock*.91);
        float caustic=pow(max(0.,1.-abs(pattern)*1.60),3.)*(.22+.08*cos(bed.x*1.1+clock));
        vec3 color=bedTone*(.83+.13*fleck-.15*mortar+caustic);
        float fresnel=.04+.44*pow(1.-facing,3.3);vec3 sky=mix(vec3(.60,.77,.81),vec3(.23,.55,.70),facing);
        color=mix(color,sky,fresnel);
        float roll=sin(angle+.31*sin(p.x*.78)+.14*sin(p.y*1.47+clock*.52));
        float broken=noise(p*2.72+vec2(clock*.27,-clock*.34));
        float foam=smoothstep(.86,.995,roll)*smoothstep(.16,.72,broken)*min(1.,surface.w*1.2);
        foam+= (1.-smoothstep(.06,.49,edge))*(.18+.43*broken);
        if(MODE==2)foam*=.27;
        color=mix(color,vec3(.87,.98,.97),min(.90,foam));
        vec3 sun=normalize(vec3(-.3,.66,.65));float glint=pow(max(0.,dot(reflect(-eye,normal),sun)),107.);
        color+=glint*vec3(.28,.26,.19);color=mix(color,color*vec3(.17,.32,.43)+.018*vec3(.3,.73,1.),night);
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`});
  const mesh=new T.Mesh(geo,mat);mesh.name=beachPools.find(p=>p.kind===kind).name;root.add(mesh);return mat;
}

function poolRim(k,loop,outer,kind){
  let area=0;
  for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length];area+=a.x*b.z-b.x*a.z;}
  const sign=Math.sign(area)*(outer?1:-1),n=loop.length;
  const rings=loop.map((p,i)=>{
    const a=loop[(i+n-1)%n],b=loop[(i+1)%n],l=Math.hypot(p.x-a.x,p.z-a.z),r=Math.hypot(b.x-p.x,b.z-p.z);
    const nx=sign*((p.z-a.z)/l+(b.z-p.z)/r),nz=-sign*((p.x-a.x)/l+(b.x-p.x)/r),normal=Math.hypot(nx,nz)||1;
    const ox=nx/normal,oz=nz/normal;
    const shore=kind==="wave"?Math.max(0,Math.min(1,(p.z-254)/28)):0;
    const h=kind==="wave"?.19+shore*.58:kind==="river"?.58:.34;
    return (dist,y)=>[p.x+dist*ox,y??h,p.z+dist*oz];
  });
  for(let i=0;i<n;i++){
    const a=rings[i],b=rings[(i+1)%n],edge=kind==="wave"?2.86:kind==="river"?1.03:1.85;
    const quad=(u,v,w,x,t)=>k.face([u,v,w,x],[0,1,2,0,2,3],t);
    quad(a(.02,.10),b(.02,.10),b(.02),a(.02),i%3?tile:0x77b9bc);
    quad(a(.02),b(.02),b(.37),a(.37),i%5?ivory:0xe6c9a5);
    quad(a(.37),b(.37),b(.53,.19),a(.53,.19),0x9c9e8b);
    quad(a(.53,.19),b(.53,.19),b(edge,.15),a(edge,.15),i%5?stone:0xceaf8e);
  }
}

function garden(T,k){
  const rng=randomSeed(41019),crag=new T.DodecahedronGeometry(1,0),frondTones=[0x4c854e,0x63914b,0x759e56,0x447548];
  function palm(x,z,h,lean=.7){
    const a=rng()*tau,dx=Math.cos(a)*lean,dz=Math.sin(a)*lean;
    let last=V(x,0,z);
    for(let n=1;n<=7;n++){
      const f=n/7,end=V(x+dx*f*f,h*f,z+dz*f*f);k.beam(last,end,.22*(1-f*.4),n%2?wood:0xab865b);
      k.column(end.x,end.y-.035,end.z,.37*(1-f*.33),.079,.37*(1-f*.33),0x946e47);last=end;
    }
    for(let n=0;n<11;n++){
      const angle=a+n*tau/11+rng()*.20,r=h*(.43+rng()*.14),vx=Math.cos(angle),vz=Math.sin(angle),tone=frondTones[n%4];
      const at=(f,s=0)=>[last.x+vx*f*r-vz*s,last.y+h*(.27*Math.sin(Math.PI*f)-.19*f*f)-Math.abs(s)*.32,last.z+vz*f*r+vx*s];
      for(let j=0;j<5;j++){
        const f=j/5,g=(j+1)/5,w=r*.116*Math.sin(Math.PI*(f+.02)),w2=r*.116*Math.sin(Math.PI*g);
        k.face([at(f),at(g),at(g,w2),at(f,w)],[0,1,2,0,2,3],tone);
        k.face([at(f),at(g),at(g,-w2),at(f,-w)],[0,2,1,0,3,2],frondTones[(n+1)%4]);
      }
      for(let j=1;j<6;j++){
        const f=j/7,w=r*.23*Math.sin(Math.PI*f);
        for(const side of [-1,1])k.face([at(f-.07),at(f+.07),at(f+.24,w*side)],[0,1,2],tone);
      }
    }
    for(let i=0;i<3;i++)k.crown(last.x+.19*Math.sin(i*2.3),h-.19,last.z+.14*Math.cos(i*2.3),.18,.26,.19,0x936c39);
  }
  function planting(x,z,r){
    k.column(x,.12,z,r*2,.20,r*1.72,0xb6a282);k.column(x,.22,z,r*1.88,.11,r*1.58,0x90804f);
    for(let i=0;i<12;i++){
      const a=i*tau/12,reach=(.3+rng()*.57)*r,px=x+Math.cos(a)*reach,pz=z+Math.sin(a)*reach*.8;
      k.crown(px,.48,pz,.41+rng()*.33,.32+rng()*.32,.49,frondTones[i%4],a);
      if(i%2===0)k.crown(px+.17,.85,pz,.13,.16,.12,i%4===0?0xcf775d:0xe6ad59);
    }
  }
  function umbrella(x,z,r,h,color){
    k.column(x,h*.5,z,.12,h,.12,wood);k.column(x,.23,z,.60,.42,.60,0xb39d80);
    const hub=[x,h+.49,z];
    for(let i=0;i<12;i++){
      const a=tau*i/12,b=tau*(i+1)/12,at=(v,rr,y)=>[x+Math.sin(v)*rr,y,z+Math.cos(v)*rr];
      const m=at((a+b)/2,r*.66,h+.27),l=at(a,r,h-.15),q=at(b,r,h-.15),tip=at((a+b)/2,r*1.025,h-.25),tone=i%2?color:ivory;
      k.face([hub,m,l,q,tip],[0,2,1,0,1,3,2,4,1,1,4,3],tone);
      k.beam(V(x,h-.38,z),V(l[0],l[1],l[2]),.024,wood);
    }
    k.crown(x,h+.50,z,.12,.13,.12,ivory);
  }
  function rock(x,z,w,h,d,angle=0,tone=0x9f9879){
    k.geo(crag,x,h*.32,z,w,h*.61,d,tone,angle);
    k.geo(crag,x+.09,h*.63,z-.08,w*.91,h*.30,d*.94,0xb9a78c,angle+.08);
  }
  return {palm,planting,umbrella,rock,rng};
}

function observationTower(T,k,x,z,yaw){
  const ca=Math.cos(yaw),sa=Math.sin(yaw),p=(u,y,v)=>V(x+ca*u+sa*v,y,z-sa*u+ca*v);
  const box=(u,y,v,w,h,d,c)=>{const o=p(u,y,v);k.piece(o.x,y,o.z,w,h,d,c,yaw);};
  const beam=(a,b,r,c)=>k.beam(p(...a),p(...b),r,c);
  for(const u of [-1.02,1.02])for(const v of [-.83,.83]){
    beam([u*1.18,.14,v*1.25],[u,2.48,v],.10,white);
    beam([u,2.46,v],[u,4.42,v],.075,wood);
  }
  box(0,2.48,0,2.48,.18,2.18,wood);box(0,1.63,-.93,2,.55,.08,coral);
  for(const side of [-1,1]){
    beam([side*1.16,.28,-.94],[side*1.02,2.33,.80],.07,white);
    beam([side*1.07,3.12,-.84],[side*1.07,3.12,.88],.055,ivory);
  }
  for(const u of [-.40,.40])beam([u,.13,1.93],[u,2.52,.87],.055,navy);
  for(let j=0;j<6;j++)beam([-.42,.42+j*.36,1.82-j*.16],[.42,.42+j*.36,1.82-j*.16],.052,wood);
  box(0,4.45,0,2.81,.19,2.62,white);
  for(let j=0;j<7;j++)box((j-3)*.4,4.57,0,.39,.08,2.65,j%2?coral:ivory);
  const s=p(0,1.68,-.996);k.sign("LIFEGUARD",s.x,s.y,s.z,1.79,.41,yaw+Math.PI,"#bb564e","#fff5d0");
  box(0,2.85,0,.64,.13,.70,teal);box(0,3.13,.28,.64,.56,.12,teal);
  for(const u of [-.18,.18]){beam([u,3.02,-.04],[u,3.00,-.39],.09,navy);beam([u,3.0,-.39],[u,2.67,-.40],.074,0xbb8a67);}
  const body=p(0,3.31,-.06),head=p(0,3.74,-.07);k.crown(body.x,body.y,body.z,.31,.40,.21,coral,yaw);
  k.crown(head.x,head.y,head.z,.21,.245,.20,0xca9d72,yaw);box(0,3.76,-.236,.34,.068,.056,navy);
  box(0,3.95,-.10,.48,.095,.47,ivory);box(0,3.99,-.04,.36,.11,.33,coral);
  const ring=new T.TorusGeometry(.35,.078,7,28),life=p(.72,2.82,-.94);
  k.geo(ring,life.x,life.y,life.z,1,1,1,coral,yaw);
  for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])box(.72+.34*Math.cos(a),2.82+.34*Math.sin(a),-.94,.13,.13,.135,white);
}

function waveBeach(T,root,k,g){
  const x=6335.15,z=307.65;
  k.piece(x,2.75,z,31.15,5.40,5.62,0xcdaf83);k.piece(x,.66,z,31.56,1.16,5.78,0xa69d85);
  for(let i=0;i<8;i++){
    const xx=x+(i-3.5)*3.62;
    k.piece(xx,2.26,304.78,3.18,3.53,.23,navy);
    for(let j=0;j<7;j++)k.piece(xx,1.08+j*.34,304.62,3.16,.10,.16,0x668888);
    k.piece(xx,4.32,304.77,3.37,.33,.24,ivory);
    for(const side of [-1,1])k.piece(xx+side*1.68,2.48,304.68,.17,4.06,.25,tile);
  }
  k.piece(x,5.32,z,31.86,.32,6.12,white);k.piece(x,5.59,z,31.98,.21,6.04,teal);
  for(const side of [-1,1]){
    k.piece(x,6.12,z+side*1.59,32.28,.23,3.58,0x4d9092,0,side*.31);
    for(let i=0;i<11;i++)k.piece(x+(i-5)*2.96,6.26,z+side*1.59,.085,.12,3.55,0x70a5a2,0,side*.31);
  }
  k.piece(x,6.68,z,32.42,.20,.20,navy);
  k.piece(x,4.91,304.43,12.08,1.24,.21,navy);
  k.sign("SANTA MONICA",x,4.93,304.29,11.83,1.09,Math.PI,"#316a75","#fff1ca");
  for(const px of [6321.6,6348.7]){
    k.column(px,5.86,304.84,.073,2.62,.073,wood);
    k.face([[px,7.17,304.84],[px+.98,6.96,304.87],[px+.74,6.66,304.78],[px,6.70,304.84]],[0,1,2,0,2,3],coral);
  }
  for(const [px,pz,h] of [[6315.6,281,6.2],[6316.3,296.5,5.4],[6356.5,286.2,6.4],[6354.2,299,5.4],[6356.6,259.7,4.9]]){
    g.planting(px,pz,1.68);g.palm(px,pz,h,.75);
  }
  observationTower(T,k,6356.7,276.2,Math.PI/2);
  for(const [px,pz] of [[6319.1,248.2],[6343.6,247.4],[6352.5,251.3]]){
    g.umbrella(px,pz,2.06,2.68,coral);
    for(const side of [-1,1]){
      k.piece(px+side*.78,.35,pz,.63,.11,1.32,wood);k.piece(px+side*.78,.43,pz+.12,.57,.07,.85,ivory);
      k.piece(px+side*.78,.65,pz-.47,.57,.09,.69,tile,0,.62);
      k.piece(px+side*.78,.20,pz,.55,.28,.68,wood);
    }
  }
  const floaters=new T.InstancedMesh(new T.SphereGeometry(1,10,7),new T.MeshStandardMaterial({roughness:.49}),25);
  const wire=new T.BufferGeometry(),linePositions=new T.Float32BufferAttribute(new Float32Array(25*3),3);
  wire.setAttribute("position",linePositions);const cord=new T.Line(wire,new T.LineBasicMaterial({color:0xb69c80}));root.add(cord,floaters);
  const samples=[],tint=new T.Color(),dummy=new T.Object3D();dummy.scale.set(.27,.21,.19);
  for(let i=0;i<25;i++){
    const px=6320.7+i*1.22,pz=296.7+.60*Math.sin(i*Math.PI/24);samples.push({x:px,z:pz,...waveSample(px,pz)});
    floaters.setColorAt(i,tint.set(i%2?0xffefe4:0xdf8062));
  }
  const bounds=new T.Sphere(new T.Vector3(6335.3,1,297.1),16.2);cord.geometry.boundingSphere=bounds;floaters.boundingSphere=bounds;
  return time=>{
    for(const [i,p] of samples.entries()){
      const y=beachWaveHeight("wave",p.phase,p.amplitude,time)+.075;dummy.position.set(p.x,y,p.z);dummy.updateMatrix();floaters.setMatrixAt(i,dummy.matrix);
      linePositions.setXYZ(i,p.x,y,p.z);
    }
    floaters.instanceMatrix.needsUpdate=true;linePositions.needsUpdate=true;
  };
}

function canyon(T,k,g,jet){
  const rockColors=[0xa28b73,0xb19370,0xbba084,0x8e8772];
  for(const [i,p] of beachRiver.entries()){
    if(i%2||i<12||i>128||i>48&&i<68)continue;
    const q=riverOffset(p,-p.half-.95),mound=1.2+1.24*(.5+.5*Math.sin(i*.20));
    g.rock(q.x,q.z,1.34,mound,1.42,i*.23,rockColors[(i>>1)%4]);
    if(i%8===0){
      const v=riverOffset(p,-p.half-2.52);g.rock(v.x,v.z,1.71,mound*.78,1.27,i*.71,rockColors[(i>>2)%4]);
      k.crown(v.x+.49,mound*.65,v.z-.48,1.14,.61,.97,0x6a885b);
    }
  }
  for(const [x,z,h] of [[6292,249,5.7],[6295.6,261,6.9],[6294,275,5.6],[6298,286,7.3],[6291,294,4.8],[6292.3,309,6.3],[6297.7,319,5.3],[6292,325,5.2]]){
    g.planting(x,z,2.42);g.palm(x,z,h,.8);
  }
  // A high timber flume pours into the river and leaves the swimming lane open.
  const stream=beachRiver[34],mouth=riverOffset(stream,-stream.half-.79),yaw=Math.atan2(stream.tz,-stream.tx);
  for(const side of [-1,1]){
    const px=mouth.x+stream.tx*side*.97,pz=mouth.z+stream.tz*side*.97;
    k.beam(V(px,.25,pz),V(px,3.6,pz),.15,wood);
    k.piece(px,3.55,pz,.14,.48,2.15,wood,yaw);
  }
  k.piece(mouth.x,3.36,mouth.z,2.12,.19,2.20,wood,yaw);
  for(let i=0;i<6;i++){
    const dx=(i-2.5)*.30,px=mouth.x+stream.tx*dx,pz=mouth.z+stream.tz*dx;
    k.geo(jet.geom,px,3.46,pz,1.9,3.04,1.93,0xffffff,yaw,jet.material);
  }
  // The lookout is on the outside bank, across the channel from the palm island.
  const p=beachRiver[103],q=riverOffset(p,p.half+2.13);
  observationTower(T,k,q.x,q.z,-1.45);
  const bridge=beachRiver[22],railYaw=Math.atan2(bridge.tx,bridge.tz),span=bridge.half+1.04;
  const at=(u,y,v)=>V(bridge.x+bridge.tz*u+bridge.tx*v,y,bridge.z-bridge.tx*u+bridge.tz*v);
  const height=u=>3.12+.56*(1-(u/span)**2);
  for(const side of [-1,1]){
    for(const v of [-.95,.95]){
      k.beam(at(side*span,.1,v),at(side*span,4.37,v),.13,wood);
      k.beam(at(side*(span+.33),.1,v),at(side*(span-.71),2.99,v),.10,wood);
    }
  }
  for(let i=0;i<22;i++){
    const u0=-span+span*2*i/22,u1=-span+span*2*(i+1)/22,u=(u0+u1)*.5,p=at(u,height(u),0);
    k.piece(p.x,p.y,p.z,span/11*.93,.14,2.11,i%3?wood:0xb88958,railYaw);
    for(const v of [-.94,.94]){
      k.beam(at(u0,height(u0)-.13,v),at(u1,height(u1)-.13,v),.115,wood);
      k.beam(at(u0,height(u0)+1.05,v),at(u1,height(u1)+1.05,v),.066,ivory);
      k.beam(at(u0,height(u0)+.57,v),at(u1,height(u1)+.57,v),.041,wood);
      if(i%3===0)k.beam(at(u0,height(u0),v),at(u0,height(u0)+1.12,v),.065,wood);
    }
  }
  const title=at(0,3.94,-1.06);k.sign("웨이브캐년",title.x,title.y,title.z,3.12,.52,railYaw+Math.PI,"#3c6768","#ffe6af");
  for(const i of [7,68,90]){
    const p=beachRiver[i],q=riverOffset(p,p.half+.61),angle=Math.atan2(p.tz,-p.tx);
    for(const side of [-1,1]){
      const px=q.x+p.tx*side*.47,pz=q.z+p.tz*side*.47;
      const end=riverOffset({x:px,z:pz,tx:p.tx,tz:p.tz},-.96);
      k.beam(V(px,.23,pz),V(px,1.16,pz),.054,ivory);k.beam(V(px,1.16,pz),V(end.x,.65,end.z),.055,ivory);
    }
    k.piece(q.x,.22,q.z,1.56,.12,1.26,0xb59f7b,angle);
  }
}

function pebble(T,k,g,jet){
  const x=6372.8,z=271.3;
  k.column(x,1.55,z,.38,2.97,.38,0x58a696);k.column(x,.46,z,.55,.62,.55,ivory);
  for(let i=0;i<18;i++){
    const a=i*tau/18,b=(i+1)*tau/18,at=(v,r,y)=>[x+Math.sin(v)*r,y,z+Math.cos(v)*r];
    k.face([at(a,0,3.75),at(a,1.38,3.46),at(b,1.38,3.46),at(a,2.04,2.97),at(b,2.04,2.97)],[0,1,2,1,3,2,2,3,4],i%2?0xd96d5b:0xf2a85c);
    k.geo(jet.geom,x+Math.sin(a)*1.98,2.99,z+Math.cos(a)*1.98,.72,2.69,.72,0xffffff,a,jet.material);
  }
  for(const [j,tint] of [0x43a999,0xe1aa4b,coral].entries()){
    const px=6365.7,pz=267.9+j*1.62;
    let prev=V(px-1.13,.23,pz);
    for(let i=1;i<=12;i++){
      const a=Math.PI*i/12,n=V(px-1.13*Math.cos(a),.23+1.96*Math.sin(a),pz);
      k.beam(prev,n,.102,tint);prev=n;
    }
    for(const side of [-1,1])k.column(px+side*1.13,.27,pz,.34,.21,.34,ivory);
    k.geo(jet.geom,px-.73,1.68,pz,.55,1.39,.55,0xffffff,Math.PI*.5,jet.material);
  }
  for(const [xx,zz] of [[6380.7,273.5],[6376.5,279.4],[6364.2,279],[6358,263]])g.planting(xx,zz,1.46);
  g.palm(6376.5,279.4,5.45,-.66);g.palm(6358,263,4.2,.74);
  const corners=[[6359.5,3.20,272.8],[6361.5,4.23,278.4],[6364.5,3.52,277.7]];
  for(const [u,y,v] of corners)k.beam(V(u,.1,v),V(u,y+.18,v),.081,wood);
  k.face(corners.concat([[6361.74,3.27,276.20]]),[0,1,3,1,2,3,2,0,3],0xe5bb72);
}

function beachMarker(k,x,z,name,subtitle,tone){
  const yaw=.10;
  for(const side of [-1,1]){
    k.piece(x+side*1.08,1.20,z,.17,2.28,.16,wood,yaw);k.crown(x+side*1.08,2.37,z,.15,.13,.14,ivory);
  }
  k.piece(x,1.86,z,2.42,.91,.17,ivory,yaw);
  k.sign(name,x-.013,1.99,z-.099,2.25,.47,yaw+Math.PI,tone,"#ffebc3");
  k.sign(subtitle,x-.013,1.57,z-.100,2.25,.25,yaw+Math.PI,"#fff0d0",tone);
  k.piece(x,.81,z,.56,.78,.12,coral,yaw);k.piece(x,.81,z-.072,.13,.47,.04,white,yaw);
  k.piece(x,.81,z-.076,.38,.13,.04,white,yaw);
}

export function buildBeachPools(T,root,kit){
  const fixed=new T.Group();fixed.name="캘리포니아비치 수영장";root.add(fixed);
  const k=districtMeshes(fixed),g=garden(T,k),materials=beachPools.map(p=>poolSurface(T,root,p.kind));
  const jet={material:jetWater(T),geom:jetTube(T,(t,v)=>v.set(0,-t*t,.52*t),{from:.065,to:.092,sides:6,segments:12})};
  materials.push(jet.material);
  for(const p of beachPools){poolRim(k,p.outline,true,p.kind);for(const hole of p.holes)poolRim(k,hole,false,p.kind);}
  const buoys=waveBeach(T,root,k,g);canyon(T,k,g,jet);pebble(T,k,g,jet);
  beachMarker(k,6336.1,248,"산타모니카비치","SANTA MONICA BEACH","#367e85");
  beachMarker(k,6294.1,236,"웨이브캐년","WAVE CANYON","#427064");
  beachMarker(k,6372.7,258,"페블비치","PEBBLE BEACH","#a85946");
  k.finish();
  buoys(0);
  return (clock,night)=>{const t=beachSeconds(clock);tickWater(materials,t,night??0);buoys(t);};
}
