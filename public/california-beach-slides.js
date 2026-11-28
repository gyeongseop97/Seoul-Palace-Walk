import {batchRideParts} from "./gyeongju-world-attractions.js";
import {standSign} from "./regional-stands.js";

const turn=Math.PI*2,half=Math.PI/2,clamp=x=>Math.max(0,Math.min(1,x));
const pink=0xbd377e,blue=0x276eab,mint=0x20a9b2,white=0xe5e9d7;
const steel=0x7c9793,rail=0xc2d0c3,apricot=0xd89755,water=0x54cdd4;

// Smooth monotone interpolation through launch, splashdown and the stopped raft.
function progress(keys,time){
  if(time<=keys[0][0])return keys[0][1];
  const last=keys.length-1;
  if(time>=keys[last][0])return keys[last][1];
  const slope=i=>(keys[i+1][1]-keys[i][1])/(keys[i+1][0]-keys[i][0]);
  const tangent=i=>{
    if(i===0||i===last)return 0;
    const a=slope(i-1),b=slope(i);return a*b>0?2*a*b/(a+b):0;
  };
  const j=keys.findIndex(([end])=>end>=time),i=j-1;
  const [t0,v0]=keys[i],[t1,v1]=keys[j],dt=t1-t0,s=(time-t0)/dt,h=1-s;
  return h*h*(1+2*s)*v0+s*h*h*dt*tangent(i)+s*s*(1+2*h)*v1-s*s*h*dt*tangent(j);
}

export function buildBeachSlides(T,root,kit,rides){
  const {shape,box,cylinder}=kit,groups=[],seats={},sprays=[];
  const sphere=new T.SphereGeometry(1,14,10),tubeRing=new T.TorusGeometry(1,.25,12,40);
  const narrowRing=new T.TorusGeometry(1,.022,6,48);
  const up=new T.Vector3(0,1,0),p=new T.Vector3(),d=new T.Vector3(),right=new T.Vector3(),normal=new T.Vector3();
  const scratch=new T.Vector3(),frame=new T.Matrix4(),back=new T.Vector3();
  const shellMaterial=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.49,
    metalness:.045,emissive:0x362f3c,emissiveIntensity:.31});
  const wettedMaterial=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.24,
    metalness:.07,emissive:0x244142,emissiveIntensity:.22});
  const flowTime={value:0};
  wettedMaterial.onBeforeCompile=shader=>{
    shader.uniforms.slideFlowTime=flowTime;
    shader.vertexShader="varying vec2 vSlideFlow;\n"+shader.vertexShader
      .replace("#include <uv_vertex>","#include <uv_vertex>\nvSlideFlow = uv;");
    shader.fragmentShader="varying vec2 vSlideFlow;\nuniform float slideFlowTime;\n"+shader.fragmentShader
      .replace("#include <color_fragment>",`#include <color_fragment>
        float s = vSlideFlow.y - 2.9 * slideFlowTime;
        float x = vSlideFlow.x;
        float crest = pow(max(0.0, sin(3.9*s + 2.5*x + 1.4*sin(1.2*s+x))), 13.0);
        float streak = pow(max(0.0, sin(17.0*x + 1.1*sin(1.7*s))), 5.0);
        diffuseColor.rgb += (0.09 + 0.24*streak) * crest * vec3(0.75,0.97,0.92);
        diffuseColor.rgb *= 1.0 - 0.13*abs(x);`);
  };
  function group(parent,x=0,y=0,z=0,moving=false){
    const g=new T.Group();g.position.set(x,y,z);parent.add(g);if(moving)groups.push(g);return g;
  }
  function buildBase(id){
    const ride=rides.find(r=>r.id===id),g=group(root,ride.x,0,ride.z,true);
    g.name=ride.name;seats[id]=[];return g;
  }
  function beam(g,a,b,r,color=steel,rect=false){
    scratch.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const length=scratch.length();
    const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,z=(a[2]+b[2])/2;
    const m=rect?box(color,x,y,z,2*r,length,2*r,g):cylinder(color,x,y,z,r,length,8,g);
    m.quaternion.setFromUnitVectors(up,scratch.multiplyScalar(1/length));return m;
  }
  function barrier(g,a,b,posts=3){
    for(let i=0;i<=posts;i++){
      const s=i/posts;
      cylinder(steel,a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s+.54,a[2]+(b[2]-a[2])*s,.052,1.08,8,g);
    }
    for(const h of [.48,1.03])beam(g,[a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],.052,rail);
  }
  function shade(g,x,y,z,w,depth,color){
    for(const dx of [-1,1])for(const dz of [-1,1])
      cylinder(white,x+dx*(w/2-.24),y+1.64,z+dz*(depth/2-.24),.09,3.24,9,g);
    for(const side of [-1,1]){
      const cloth=box(color,x+side*w/4,y+3.25,z,w*.523,.13,depth+.32,g);cloth.rotation.z=-side*.24;
    }
  }
  // Alternating stair flights join an outside entrance landing to the dispatch deck.
  function tower(g,x,z,height,width,name,subtitle,color){
    const deckZ=z-2.55,left=x-width/2,rightX=x+width/2;
    const levels=Math.round(height/3.5),rise=height/levels,far=x+width*.48,near=x-width*.48;
    const stairZ=deckZ-2.5,steps=12;
    for(const a of [left,rightX])for(const b of [deckZ-3.6,deckZ+2.35]){
      cylinder(0xaebeb0,a,height/2,b,.18,height,10,g);
      box(0xd8cfb1,a,.20,b,.92,.4,.92,g);
    }
    for(let j=0;j<levels;j++){
      const y=j*rise,x0=j%2?near:far,x1=j%2?far:near,z0=stairZ+(j%2)*1.67;
      for(let i=0;i<steps;i++){
        const s=(i+.5)/steps;
        box(0xbba883,x0+(x1-x0)*s,y+rise*s,z0,Math.abs(x1-x0)/steps+.04,.115,1.45,g);
      }
      for(const side of [-1,1]){
        const zz=z0+side*.73;
        beam(g,[x0,y-.11,zz],[x1,y+rise-.11,zz],.094,steel,true);
        barrier(g,[x0,y,zz],[x1,y+rise,zz],4);
      }
      box(0xbab397,x1,y+rise-.08,stairZ+.8,1.16,.16,3.45,g);
      beam(g,[left,y+.38,deckZ-3.56],[rightX,y+rise-.12,deckZ-3.56],.07,steel);
    }
    box(0xd2b780,x,height-.13,deckZ,width+.68,.26,4.9,g);
    barrier(g,[left,height,deckZ-2.38],[rightX,height,deckZ-2.38],6);
    barrier(g,[rightX,height,deckZ-2.38],[rightX,height,deckZ+2.37],4);
    shade(g,x,height,deckZ,width+1.0,5.10,color);
    standSign(T,g,name,subtitle,Math.min(5.6,width),x,height-.61,z-.06,"#245856","#ffeab1",1.02);
    box(0x769e8b,rightX-.72,height+.57,deckZ+.62,.85,1.14,.67,g);
  }
  function curve(points){return new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),false,"centripetal");}
  function basis(path,t){
    path.getPoint(t,p);path.getTangent(t,d);
    right.crossVectors(d,up).normalize();normal.crossVectors(right,d).normalize();
  }
  function colouredMesh(g,vertices,colors,normals,flow){
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    if(normals)geometry.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
    else geometry.computeVertexNormals();
    if(flow)geometry.setAttribute("uv",new T.Float32BufferAttribute(flow,2));
    const mesh=new T.Mesh(geometry,flow?wettedMaterial:shellMaterial);
    mesh.receiveShadow=true;mesh.castShadow=!flow;g.add(mesh);return mesh;
  }
  // A floor centreline defines both the wetted glass-fibre flume and the rider.
  // The tunnel runs around this floor, so the camera keeps its head clearance on a bend.
  function flume(g,path,{from=0,to=1,r,closed=false,spread=closed?Math.PI:1.50,palette,bank,joints=true,samples=72}){
    const segments=closed?20:14,vertices=[],colors=[],normals=[];
    const paletteRGB=palette.map(c=>new T.Color(c)),lip=new T.Color(white),stream=new T.Color(water);
    let previous;
    function floorFrame(t){
      basis(path,t);
      if(bank){right.applyAxisAngle(d,bank(t));normal.crossVectors(right,d).normalize();}
    }
    for(let i=0;i<=samples;i++){
      const t=from+(to-from)*i/samples;floorFrame(t);
      const ring=[];
      for(let j=0;j<=segments;j++){
        const a=-spread+2*spread*j/segments;
        ring.push({v:p.clone().addScaledVector(right,r*Math.sin(a)).addScaledVector(normal,r*(1-Math.cos(a))),
          n:right.clone().multiplyScalar(Math.sin(a)).addScaledVector(normal,-Math.cos(a))});
      }
      if(previous){
        for(let j=0;j<segments;j++){
          const band=Math.floor((i-1)/6)%palette.length;
          const seam=joints&&(i-1)%6===0;
          const c=(!closed&&(j===0||j===segments-1))?lip:paletteRGB[band];
          const rgb=c.clone();if(seam)rgb.multiplyScalar(.75);
          for(const {v,n} of [previous[j],ring[j],previous[j+1],previous[j+1],ring[j],ring[j+1]]){
            vertices.push(v.x,v.y,v.z);colors.push(rgb.r,rgb.g,rgb.b);normals.push(n.x,n.y,n.z);
          }
        }
      }
      previous=ring;
    }
    colouredMesh(g,vertices,colors,normals);
    if(closed){
      for(let i=0;i<=samples;i+=12){
        floorFrame(from+(to-from)*i/samples);
        const center=p.clone().addScaledVector(normal,r);
        const flange=shape(narrowRing,steel,center.x,center.y,center.z,g);
        flange.scale.set(r*1.019,r*1.019,2.5);flange.quaternion.setFromUnitVectors(back.set(0,0,1),d);
        for(let j=0;j<8;j++){
          const a=turn*j/8;
          const b=center.clone().addScaledVector(right,r*1.041*Math.sin(a)).addScaledVector(normal,r*1.041*Math.cos(a));
          const bolt=shape(sphere,rail,b.x,b.y,b.z,g);bolt.scale.setScalar(.042);
        }
      }
    }
    // Surface UVs follow distance along each bend, giving the water a continuous current.
    const wet=[],tints=[],flow=[];let prior,length=0;
    const prevPoint=new T.Vector3();
    for(let i=0;i<=samples;i++){
      floorFrame(from+(to-from)*i/samples);
      if(i)length+=p.distanceTo(prevPoint);prevPoint.copy(p);
      const row=[-.39,-.24,.23,.39].map(s=>({
        v:p.clone().addScaledVector(right,r*s).addScaledVector(normal,r*(1-Math.sqrt(1-s*s))+.036),s:s/.39,length}));
      if(prior)for(let j=0;j<3;j++){
        for(const {v,s,length:l} of [prior[j],row[j],prior[j+1],prior[j+1],row[j],row[j+1]]){
          wet.push(v.x,v.y,v.z);tints.push(stream.r,stream.g,stream.b);flow.push(s,l);
        }
      }
      prior=row;
    }
    colouredMesh(g,wet,tints,undefined,flow);
  }
  function supports(g,path,ts,r){
    for(const [i,t] of ts.entries()){
      basis(path,t);if(p.y<1.55)continue;
      const s=i%2?1:-1,foot=p.clone().addScaledVector(right,s*(r+1.0));foot.y=.18;
      const cap=foot.clone();cap.y=p.y-.25;
      beam(g,foot.toArray(),cap.toArray(),p.y>9?.19:.135);
      beam(g,cap.toArray(),[p.x,p.y-.19,p.z],.13);
      box(0xc8c0a4,foot.x,.15,foot.z,.89,.30,.89,g);
    }
  }
  function pool(g,x,z,w,h){
    box(0xd8d4b6,x,.16,z,w+.8,.32,h+.8,g);
    box(0x459daa,x,.31,z,w+.05,.22,h+.05,g);
    box(water,x,.436,z,w,.05,h,g);
    for(let j=0;j<8;j++){
      const dx=Math.sin(j*8.33)*w*.39,dz=Math.cos(j*4.33)*h*.37;
      box(j%3?0x81dfe1:0xd1efdc,x+dx,.47,z+dz,.48+.33*(j%4),.015,.037,g);
    }
    for(let i=0;i<4;i++)
      box(0xc9dacd,x+w*.32,.49+i*.095,z+h*.43+i*.27,2.5,.12,.32,g);
    const ladder=group(g,x-w*.50,0,z+h*.14);
    for(const dz of [-.29,.29]){
      beam(ladder,[-.44,.31,dz],[-.44,1.43,dz],.049,rail);
      beam(ladder,[-.44,1.43,dz],[.18,1.43,dz],.052,rail);
      beam(ladder,[.18,1.43,dz],[.18,.35,dz],.049,rail);
    }
    beam(ladder,[.18,.80,-.29],[.18,.80,.29],.043,rail);
  }
  function entryQueue(id,g,towerX,towerZ,width,subtitle){
    const ride=rides.find(r=>r.id===id),x=ride.gate.x-ride.x,z=ride.gate.z-ride.z;
    const aisle=Math.max(towerX+width/2+2.45,x-2.85),stairZ=towerZ-5.05;
    const points=[[x,.11,z],[aisle,.11,z-2.2],[aisle,.11,stairZ],[towerX+width*.48,.11,stairZ]];
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[2]-a[2];
      const paving=box(0xe2cfaa,(a[0]+b[0])/2,.105,(a[2]+b[2])/2,1.87,.08,Math.hypot(dx,dz)+.25,g);
      paving.rotation.y=Math.atan2(dx,dz);
    }
    for(const side of [-1,1])
      barrier(g,[aisle+side*.99,.14,z-3],[aisle+side*.99,.14,stairZ+1.23],Math.ceil((z-4.23-stairZ)/3.6));
    const sign=group(g,x-1.47,.05,z+1.3);sign.rotation.y=.43;
    for(const xx of [-.78,.78])cylinder(steel,xx,.8,0,.057,1.60,8,sign);
    standSign(T,sign,ride.name,subtitle,1.89,0,1.54,.05,"#306664","#fff2c7",.67);
  }
  function anchor(id,g,x,y,z,yaw,pose,view,companion){
    const object=group(g,x,y,z);object.rotation.y=yaw;
    seats[id].push({object,x:0,y:0,z:0,yaw:Math.PI,pose,camera:{eye:view[0],look:view[1],
      firstPerson:true,companion:{eye:companion[0],look:companion[1]}}});
  }
  function inflatable(g,r,color,clover=false){
    const e=shape(tubeRing,color,0,.25,0,g);e.rotation.x=half;e.scale.set(r,.99*r,.78*r);
    const floor=cylinder(0x458e8a,0,.12,0,r*.86,.16,20,g);
    if(clover)floor.scale.z*=.95;
    for(let k=0;k<(clover?8:2);k++){
      const a=clover?turn*(k+.5)/8:(k?1:-1)*half,dx=Math.sin(a),dz=Math.cos(a);
      const m=shape(sphere,0x344e58,dx*r,.44,dz*r,g);m.scale.set(.18,.047,.055);m.rotation.y=a;
    }
  }
  const triple=buildBase("beach-triple"),twist=buildBase("beach-twist"),funnel=buildBase("beach-x");
  const triplePaths=[],bodyAnchors=[];
  tower(triple,0,-11.5,12.8,10.1,"트리플다운","TRIPLE DOWN",0x4b9c9d);
  pool(triple,0,13.7,11.8,9.4);
  for(let lane=0;lane<3;lane++){
    const x=(lane-1)*3.18;
    let points;
    if(lane===0)points=[[x,12.85,-11.7],[x,12.78,-9.5],[x,12.53,-8.1],[x,11.78,-7.3],
      [x,7.1,-5.2],[x,2.4,-2.5],[x,1.34,0],[x,.91,4.0],[x,.78,8.9],[x,.49,12.8],[x,.49,16.1]];
    else if(lane===1)points=[[x,12.85,-11.7],[x,12.8,-9.5],[x,11.92,-7.35],[x,10.93,-5.5],
      [x,10.68,-3.8],[x,10.16,-2.2],[x,6,0],[x,2.15,2.15],[x,1.05,5],[x,.75,9.0],[x,.48,12.95],[x,.49,16.05]];
    else points=[[x,12.85,-11.7],[x+.05,12.77,-9.6],[x+.88,12.03,-7.5],[x+2.35,10.7,-5.4],
      [x+3.75,9.3,-3.0],[x+4.16,7.9,-.65],[x+3.25,6.6,1.25],[x+1.23,5.4,1.85],
      [x-.19,4.5,3.6],[x-.44,3.09,5.59],[x-.16,1.76,7.35],[x,.80,9.28],[x,.48,13.0],[x,.49,16.05]];
    const path=curve(points),end=(points.length-3)/(points.length-1);
    triplePaths.push(path);
    const palette=lane===0?[0xb93379]:lane===1?[0xeb8c41]:[0x3469a4,white];
    if(lane===2){
      flume(triple,path,{from:0,to:.18,r:1.04,palette,samples:14});
      flume(triple,path,{from:.18,to:.67,r:1.04,closed:true,palette,samples:54});
      flume(triple,path,{from:.67,to:end,r:1.04,palette,samples:17});
    }else flume(triple,path,{to:end,r:1.02,palette,samples:63});
    supports(triple,path,[.12,.27,.41,.56,.70],1.05);
    const rider=group(triple,0,0,0,true);bodyAnchors.push(rider);
    anchor("beach-triple",rider,0,.13,0,0,"bodySlide",[[0,.66,-.04],[0,.30,-3.4]],
      [[.42,1.18,1.0],[0,.51,.01]]);
  }
  tower(twist,8,-9.0,14.45,7.1,"터보트위스트","TURBO TWIST",0x67a482);
  pool(twist,4.6,13.5,8.4,11.2);
  const twistKnots=[[8,14.5,-9.2],[8,14.48,-6],[8.4,14.14,-3.1],[10.7,13.55,.75],
    [11.4,12.74,4.65],[9.5,12,7.7],[6,11.35,8.8],[2.4,10.65,7.2],[.55,10,4.0],
    [.35,9.45,.5],[-1.15,8.82,-3.25],[-4.6,8.15,-5.75],[-8.8,7.38,-5.1],
    [-10.65,6.65,-1.1],[-10.0,5.89,2.95],[-7.55,5.28,6.7],[-4.1,4.62,7.95],
    [-.58,3.75,7.1],[1.55,3.03,4.87],[3.46,2.2,4.58],[4.6,1.52,6.65],
    [4.6,.86,9.15],[4.6,.48,12.65],[4.6,.48,17.82]];
  const twistPath=curve(twistKnots),twistRafts=[];
  flume(twist,twistPath,{to:.082,r:1.35,palette:[0xde4d42],samples:12});
  flume(twist,twistPath,{from:.082,to:.866,r:1.35,closed:true,palette:[0xef553d,white,0xf1954e,0xc44837],samples:171});
  flume(twist,twistPath,{from:.866,to:.918,r:1.35,palette:[0xed6150],samples:15});
  supports(twist,twistPath,[.10,.20,.30,.39,.48,.55,.65,.74,.83],1.35);
  for(let i=0;i<2;i++){
    const raft=group(twist,0,0,0,true);twistRafts.push(raft);
    inflatable(raft,.60,i?0xe2bc49:0x9cc86e);
    anchor("beach-twist",raft,0,-.07,0,0,"tube",[[0,.99,-.08],[0,.66,-3.8]],
      [[.45,1.32,1.00],[0,.67,-.05]]);
  }

  // The real X has a magenta and blue cone with a broad upstream mouth.
  // Concentric cross-sections give both the ride shell and the lateral raft sweeps.
  const radius=u=>9.1-7.1*u,hubHeight=u=>radius(u)+1.55+2.9*(1-u);
  const coneZ=u=>-5+18*u;
  function onCone(u,angle,inset=0){
    const r=radius(u)-inset;
    return [r*Math.sin(angle),hubHeight(u)-r*Math.cos(angle),coneZ(u)];
  }
  const coneAngle=u=>1.10*Math.pow(1-u,.85)*Math.cos(turn*2.05*u+.11);
  const conePoint=u=>onCone(u,coneAngle(u),.41);
  tower(funnel,12.2,-12.5,17.1,7.1,"엑스","TORNADO X",0xdb9755);
  const coneV=[],coneColors=[],panels=24,bays=11,funnelColors=[new T.Color(blue),new T.Color(pink)];
  for(let i=0;i<bays;i++)for(let j=0;j<panels;j++){
    const a=j*turn/panels,b=(j+1)*turn/panels,u=i/bays,v=(i+1)/bays;
    const paint=funnelColors[(Math.floor(j/3)+Math.floor(i/4))%2];
    for(const pt of [onCone(u,a),onCone(v,a),onCone(u,b),onCone(u,b),onCone(v,a),onCone(v,b)]){
      coneV.push(...pt);coneColors.push(paint.r,paint.g,paint.b);
    }
  }
  colouredMesh(funnel,coneV,coneColors);
  for(let i=0;i<=bays;i++){
    const u=i/bays,r=radius(u);
    const hoop=shape(narrowRing,i===0||i===bays?white:steel,0,hubHeight(u),coneZ(u),funnel);
    hoop.scale.set(r+.08,r+.08,.44);
    if(i%3===0)for(const side of [-1,1]){
      const a=onCone(u,side*1.07,-.12),x=a[0]+side*.72;
      beam(funnel,[x,.25,a[2]],a,.18);box(0xc4b99d,x,.16,a[2],1.09,.32,1.09,funnel);
    }
  }
  for(let j=0;j<18;j++){
    const a=j*turn/18;
    beam(funnel,onCone(0,a,-.16),onCone(1,a,-.16),.053,steel);
    if(j%2===0)for(let i=0;i<6;i++)
      beam(funnel,onCone(i/6,a,-.13),onCone((i+1)/6,a+turn/18,-.13),.035,rail);
  }
  const entry=[[12.2,17.16,-12.75],[9.6,17.02,-12.65],[6.25,16.6,-12.1],
    [3.05,15.35,-13.55],[2.68,13.7,-16.4],[4.95,11.98,-18.05],[7.8,10.55,-16.4],
    [8.75,9.94,-12.5],[8.34,9.65,-8.15]];
  const funnelKnots=[...entry];for(let i=0;i<=36;i++)funnelKnots.push(conePoint(i/36));
  const outletIndex=funnelKnots.length-1;
  funnelKnots.push([0,1.58,14.9],[.09,.81,16.8],[.35,.48,19.1],[.54,.49,23.0]);
  const funnelPath=curve(funnelKnots),fTotal=funnelKnots.length-1;
  flume(funnel,funnelPath,{to:2/fTotal,r:2.05,palette:[mint],samples:15});
  flume(funnel,funnelPath,{from:2/fTotal,to:(entry.length-2)/fTotal,r:2.05,closed:true,palette:[mint,blue,pink],samples:66});
  flume(funnel,funnelPath,{from:(entry.length-2)/fTotal,to:entry.length/fTotal,r:2.7,spread:.66,
    bank:t=>coneAngle(0)*clamp((t*fTotal-entry.length+2)/1.8),palette:[mint,blue],samples:18});
  flume(funnel,funnelPath,{from:outletIndex/fTotal,to:(fTotal-2)/fTotal,r:1.98,palette:[mint],samples:23});
  supports(funnel,funnelPath,[.025,.07,.115,.155],2.05);
  pool(funnel,0,20.9,9.6,9.5);
  const xRaft=group(funnel,0,0,0,true);
  inflatable(xRaft,1.27,0xe8b63d,true);
  for(let i=0;i<4;i++){
    const a=i*half+Math.PI/4;
    anchor("beach-x",xRaft,Math.sin(a)*.86,-.02,Math.cos(a)*.86,a,"tube",
      [[.11,1.08,-.04],[-.20,.69,-3.0]],[[.34,1.60,.43],[0,.73,-1.05]]);
  }
  entryQueue("beach-x",funnel,12.2,-12.5,7.1,"TORNADO X");
  entryQueue("beach-twist",twist,8,-9.0,7.1,"TURBO TWIST");
  entryQueue("beach-triple",triple,0,-11.5,10.1,"TRIPLE DOWN");
  function mist(g,x,z,times,width){
    const mesh=new T.InstancedMesh(sphere,new T.MeshBasicMaterial({color:0xe1f9ed,transparent:true,
      opacity:.78,depthWrite:false}),36);
    g.add(mesh);mesh.frustumCulled=false;sprays.push({mesh,x,z,times,width});
  }
  mist(funnel,.15,18.6,[27.75],2.0);
  mist(twist,4.6,11.2,[20.2,22.65],1.26);
  for(let i=0;i<3;i++)mist(triple,(i-1)*3.18,10.7,[14.40+i*.45],.89);
  const foamDummy=new T.Object3D();
  function sprayAt(spray,t){
    const {mesh,x,z,times,width}=spray;let n=0;
    for(const start of times){
      const elapsed=t-start;if(elapsed<0||elapsed>2.14)continue;
      for(let i=0;i<36&&n<36;i++){
        const flight=elapsed-(i%7)*.058,life=.51+(i%8)*.11;
        if(flight<0||flight>life)continue;
        const u=flight/life,a=i*2.3999,size=Math.sin(Math.PI*u)*(.045+.018*(i%5));
        const rad=width*(.21+u*(.9+.16*(i%5)));
        foamDummy.position.set(x+Math.sin(a)*rad,.48+4*u*(1-u)*width*(.37+.15*(i%5)),z+Math.cos(a)*rad+u*.72);
        foamDummy.scale.set(size*1.08,size*(.9+.18*(i%4)),size);
        foamDummy.updateMatrix();mesh.setMatrixAt(n++,foamDummy.matrix);
      }
    }
    mesh.count=n;mesh.visible=n>0;
    if(n)mesh.instanceMatrix.needsUpdate=true;
  }
  function follow(g,path,t,bank=0){
    basis(path,t);g.position.copy(p);right.applyAxisAngle(d,bank);
    normal.crossVectors(right,d).normalize();back.copy(d).negate();
    g.quaternion.setFromRotationMatrix(frame.makeBasis(right,normal,back));
  }
  const xTiming=[[1.5,0],[4.8,2/fTotal],[9.15,8/fTotal],[10.2,entry.length/fTotal],
    [14.0,18/fTotal],[18.1,26/fTotal],[21.1,33/fTotal],[25.2,outletIndex/fTotal],
    [27.75,(fTotal-1.1)/fTotal],[31.3,1]];
  const twistTiming=[[1.7,0],[4,.085],[7.2,.25],[11.6,.46],[15.4,.64],[19,.856],[20.2,.929],[23.85,1]];
  const bodyTiming=triplePaths.map((path,i)=>{
    const n=path.points.length-1;
    return [[2.25,0],[4.5,1/n],[7.1,(i===1?4.2:2.55)/n],[9.25,(i===2?6:4.1)/n],
      [12.68,(n-2.7)/n],[14.4+i*.45,(n-1.5)/n],[20.25+i*.19,1]];
  });
  const target=new T.Quaternion(),surfaceUp=new T.Vector3(),forward=new T.Vector3();
  batchRideParts(T,groups);
  function update(seconds,clock){
    const tx=seconds("beach-x",32),tt=seconds("beach-twist",27),tb=seconds("beach-triple",22);
    flowTime.value=Number.isFinite(clock)?clock*.001%4096:tx;
    const xf=progress(xTiming,tx),u=clamp((xf*fTotal-entry.length)/36);
    follow(xRaft,funnelPath,xf);
    const knot=xf*fTotal;
    if(knot>entry.length-2&&knot<outletIndex+1){
      // Lay the raft flat on the curved wall, including the approach to its lip.
      // Its heading stays continuous when the raft changes lateral direction.
      const a=coneAngle(u),heading=.58*Math.sin(turn*1.05*u);
      const blend=clamp(Math.min((knot-entry.length+2)/1.8,outletIndex+1-knot));
      surfaceUp.set(-Math.sin(a),Math.cos(a),.065).normalize();
      forward.set(Math.sin(heading),0,Math.cos(heading));
      right.crossVectors(forward,surfaceUp).normalize();forward.crossVectors(surfaceUp,right).normalize();
      target.setFromRotationMatrix(frame.makeBasis(right,surfaceUp,back.copy(forward).negate()));
      xRaft.quaternion.slerp(target,blend);
    }
    for(let i=0;i<twistRafts.length;i++){
      const phase=progress(twistTiming,tt-i*2.45);
      // Two individual tubes queue and finish a tube length apart in the same runout.
      const t=i?phase*.974:.039+phase*.961;
      follow(twistRafts[i],twistPath,t,.13*Math.sin(phase*turn*2.5)*Math.sin(phase*Math.PI));
    }
    for(let i=0;i<triplePaths.length;i++){
      const t=progress(bodyTiming[i],tb);
      follow(bodyAnchors[i],triplePaths[i],t,i===2?.18*Math.sin(2*turn*t)*Math.sin(Math.PI*t):0);
    }
    for(const [i,spray] of sprays.entries())sprayAt(spray,i===0?tx:i===1?tt:tb);
  }
  update(()=>0);
  return {seats,update};
}
