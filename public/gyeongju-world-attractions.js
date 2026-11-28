const tau=Math.PI*2;
const clamp=t=>Math.min(1,Math.max(0,t));
const ease=t=>t*t*(3-2*t);

// A trapezoidal speed profile reaches zero velocity at the loading platform.
export function runningPhase(t,duration,ramp){
  t=Math.min(duration,Math.max(0,t));
  if(t<ramp)return t*t/(2*ramp*(duration-ramp));
  if(t>duration-ramp)return 1-(duration-t)**2/(2*ramp*(duration-ramp));
  return (t-ramp/2)/(duration-ramp);
}
const swingStops=[[0,0],[2,0],[5,34],[8.1,-64],[11.7,98],[15.7,-137],[20.2,176],
  [25.6,544],[31,171],[35.4,420],[39,332],[42.2,373],[45,360],[46,360]];
function swingDegrees(t){
  for(let i=1;i<swingStops.length;i++){
    const [end,b]=swingStops[i],[start,a]=swingStops[i-1];
    if(t<=end)return a+(b-a)*ease(clamp((t-start)/(end-start)));
  }
  return 360;
}
function boatTiming(keys,t){
  const index=keys.findIndex(([time])=>time>=t);
  if(index<=0)return index<0?1:0;
  const slope=(a,b)=>(keys[b][1]-keys[a][1])/(keys[b][0]-keys[a][0]);
  const tangent=i=>{
    if(i===0||i===keys.length-1)return 0;
    const a=slope(i-1,i),b=slope(i,i+1);
    return a&&b?2*a*b/(a+b):0;
  };
  const [t0,y0]=keys[index-1],[t1,y1]=keys[index],dt=t1-t0,u=(t-t0)/dt,v=1-u;
  return (v*v*(1+2*u)*y0+u*v*v*tangent(index-1)*dt+u*u*(3-2*u)*y1-u*u*v*tangent(index)*dt);
}

export function buildParkAttractions(T,root,kit,rides){
  const {box,cylinder,shape}=kit;
  const groups=[],seats={krake:[],cups:[],splash:[]};
  const shade=0x303e46,iron=0x465e65,bronze=0xc49350,ivory=0xf6dfb0,red=0xa2473c,gold=0xeaba68;
  const v=new T.Vector3(),up=new T.Vector3(0,1,0);
  const sphere=new T.SphereGeometry(1,12,9),ring=new T.TorusGeometry(1,.055,6,36);
  const slimRing=new T.TorusGeometry(1,.017,6,48);
  function group(parent,x=0,y=0,z=0){
    const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;
  }
  function mobile(parent,x=0,y=0,z=0){
    const g=group(parent,x,y,z);groups.push(g);return g;
  }
  function station(id){
    const ride=rides.find(r=>r.id===id);
    const base=mobile(root,ride.x,0,ride.z);
    base.name=ride.name;
    base.rotation.y=Math.atan2(ride.gate.x-ride.x,ride.gate.z-ride.z);
    return base;
  }
  function orb(parent,color,x,y,z,w,h,d){
    const m=shape(sphere,color,x,y,z,parent);m.scale.set(w,h,d);return m;
  }
  function loop(parent,color,x,y,z,r){
    const m=shape(r>2?slimRing:ring,color,x,y,z,parent);m.scale.setScalar(r);return m;
  }
  function rim(parent,color,x,y,z,r){
    const m=loop(parent,color,x,y,z,r);m.rotation.x=Math.PI/2;return m;
  }
  function beam(parent,color,a,b,r,rectangular=false){
    v.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const h=v.length(),x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,z=(a[2]+b[2])/2;
    const m=rectangular?box(color,x,y,z,r*2,h,r*2,parent):cylinder(color,x,y,z,r,h,10,parent);
    m.quaternion.setFromUnitVectors(up,v.multiplyScalar(1/h));return m;
  }
  function pipe(parent,color,points,r){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    return shape(new T.TubeGeometry(curve,Math.max(10,points.length*4),r,7,false),color,0,0,0,parent);
  }
  function rail(parent,a,b,count,color=iron){
    for(let i=0;i<=count;i++){
      const f=i/count,x=a[0]+(b[0]-a[0])*f,z=a[2]+(b[2]-a[2])*f;
      cylinder(color,x,a[1]+.53,z,.055,1.06,8,parent);
    }
    for(const h of [.48,1.02])beam(parent,color,[a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],.048);
  }
  function stairs(parent,x,z,width,count){
    for(let i=0;i<count;i++)box(0xc7b78f,x,.095*(i+1),z-.38*i,width,.19*(i+1),.4,parent);
    for(const side of [-1,1]){
      const dx=x+side*(width/2-.12);
      beam(parent,iron,[dx,.9,z],[dx,.9+count*.19,z-.38*(count-1)],.045);
      for(const i of [0,count-1])cylinder(iron,dx,.54+i*.19,z-.38*i,.048,.9,8,parent);
    }
  }
  // Every seat is a local frame looking down -Z. Both the rider and camera
  // inherit the gondola's full quaternion, including roll through an inversion.
  function seat(kind,parent,x,y,z,heading,eye,look){
    const g=group(parent,x,y,z);g.rotation.y=heading;
    seats[kind].push({object:g,x:0,y:0,z:0,yaw:Math.PI,camera:{eye,look,firstPerson:true}});
    return g;
  }

  const krake=station("krake");
  box(0x8e816b,0,.2,0,27,.4,19,krake);
  box(0xaf926a,0,.57,4.3,19,.75,8.4,krake);
  stairs(krake,0,10.3,3.3,5);
  for(const z of [-7.2,7.2]){
    for(const side of [-1,1]){
      const x=side*11;
      box(0x807569,x,.35,z,2.7,.7,2.8,krake);
      beam(krake,0x594b41,[x,.5,z],[0,21,z*.68],.58);
      beam(krake,bronze,[x*.82,3.8,z*.95],[x*.28,15.55,z*.74],.28);
      for(const f of [.26,.58,.82]){
        const a=[x*(1-f),.5+20.5*f,z*(1-.32*f)];
        const b=[x*(1-f-.03),.5+20.5*(f+.03),z*(1-.32*(f+.03))];
        beam(krake,0xa06d42,a,b,.68);
      }
    }
    beam(krake,iron,[-7.8,6.5,z*.9],[7.8,6.5,z*.9],.23);
    box(0x8e6851,0,21,z*.68,2.55,2.6,1.2,krake).rotation.z=Math.PI/4;
  }
  beam(krake,iron,[0,21,-5.8],[0,21,5.8],.61);
  for(const x of [-8.1,-4.65])for(const z of [5.65,8.2]){
    box(0x64534c,x,2.22,z,.15,2.68,.16,krake);
  }
  box(0x976d53,-6.38,1.58,6.93,3.68,1.27,2.85,krake);
  box(0x455558,-6.38,3.65,6.93,4.15,.23,3.35,krake);
  box(0x5e7c7c,-6.38,2.59,8.23,3.12,.75,.07,krake);
  for(const x of [-7.76,-6.38,-5.0])box(bronze,x,2.76,8.29,.065,1.11,.09,krake);
  for(const x of [-9,9])rail(krake,[x,.95,1.7],[x,.95,8.1],4);
  for(const x of [-5.35,5.35])rail(krake,[x-3.4,.95,8.15],[x+3.4,.95,8.15],5);
  const arm=mobile(krake,0,21,0),wheel=mobile(arm,0,-18.6,0);
  for(const z of [-.68,.68]){
    for(const x of [-.64,.64])beam(arm,bronze,[x,3.45,z],[x*.72,-17.9,z*.75],.21);
    for(let i=0;i<8;i++){
      const y=1.8-i*2.48;
      beam(arm,i%2?red:gold,[-.6,y,z],[.6,y-2.48,z],.12);
      beam(arm,iron,[.6,y,z],[-.6,y-2.48,z],.1);
    }
  }
  box(0x7d4536,0,3.85,0,3.65,2.4,2.6,arm);
  for(let i=0;i<5;i++)box(i%2?bronze:shade,0,2.97+i*.42,0,3.8,.14,2.72,arm);
  cylinder(0x685144,0,.08,0,2.7,.65,24,wheel);
  cylinder(0xb17d49,0,.46,0,1.55,.7,24,wheel,.69);
  rim(wheel,bronze,0,.06,0,4.55);
  const restraint=new T.TubeGeometry(new T.CatmullRomCurve3([
    [-.31,.38,.24],[-.31,.85,.04],[-.25,1.13,-.28],[-.19,.80,-.48],[-.19,.62,-.5],
    [.19,.62,-.5],[.19,.80,-.48],[.25,1.13,-.28],[.31,.85,.04],[.31,.38,.24]
  ].map(p=>new T.Vector3(...p))),32,.062,6,false);
  for(let i=0;i<30;i++){
    const a=i*tau/30,holder=group(wheel,Math.sin(a)*4.52,-.28,Math.cos(a)*4.52);
    holder.rotation.y=a+Math.PI;
    if(i%2===0)beam(wheel,shade,[0,.13,0],[holder.position.x,-.01,holder.position.z],.11);
    box(shade,0,.09,0,.71,.26,.70,holder);
    box(i%3?red:0xac593d,0,.60,.28,.64,.87,.22,holder).rotation.x=.12;
    box(0x453831,0,.25,-.045,.61,.18,.58,holder);
    orb(holder,shade,0,1.02,.29,.23,.21,.13);
    shape(restraint,0xe1ab41,0,.04,0,holder);
    if(i<12)seat("krake",holder,0,-.27,0,0,[0,1.31,-.1],[.3,.97,-5.5]);
  }

  const cups=station("cups"),turntable=mobile(cups,0,.4,0),cupVehicles=[];
  const mint=0x6cb5a4,rose=0xd87c80,blush=0xf2c1af,lemon=0xe8b953;
  cylinder(0xc4ac93,0,.17,0,9.4,.34,48,cups);
  cylinder(0x679589,0,.1,0,8.15,.29,48,turntable);
  cylinder(0xf0d9aa,0,.28,0,7.9,.1,48,turntable);
  rim(turntable,0xdcb678,0,.344,0,7.8);
  const awningGeometry=new T.BufferGeometry();
  const strip=[0,6.76,0, -1.96,5.15,8.79,1.96,5.15,8.79, -1.96,5.15,8.79,-1.96,4.74,8.79,1.96,5.15,8.79,
    -1.96,4.74,8.79,0,4.46,9.01,1.96,4.74,8.79,-1.96,4.74,8.79,1.96,4.74,8.79,1.96,5.15,8.79];
  // Both faces remain lit when looking up from inside the pavilion.
  const awningPositions=[...strip];
  for(let i=0;i<strip.length;i+=9)awningPositions.push(...strip.slice(i+6,i+9),...strip.slice(i+3,i+6),...strip.slice(i,i+3));
  awningGeometry.setAttribute("position",new T.Float32BufferAttribute(awningPositions,3));awningGeometry.computeVertexNormals();
  for(let i=0;i<14;i++){
    const a=i*tau/14;
    const panel=shape(awningGeometry,i%2?ivory:mint,0,0,0,cups);panel.rotation.y=a;
    const x=Math.sin(a)*8.83,z=Math.cos(a)*8.83;
    if(i%2===0&&i!==0){
      box(0xd3b894,x,.34,z,.63,.66,.63,cups);
      cylinder(mint,x,2.63,z,.14,4.57,12,cups);
      beam(cups,gold,[x*.91,4.93,z*.91],[x,3.92,z],.075);
    }
    orb(cups,0xffdfa1,x,4.75,z,.11,.13,.11);
  }
  cylinder(0x9a916c,0,6.96,0,.085,.78,10,cups);
  orb(cups,gold,0,7.37,0,.22,.25,.22);
  stairs(cups,0,9.55,3.6,2);
  const cupProfile=[[.1,0],[.65,0],[.8,.14],[1.03,.28],[1.3,.65],[1.43,1.09],[1.40,1.18],
    [1.31,1.19],[1.29,1.04],[1.18,.72],[.93,.36],[.62,.19],[.10,.19]];
  const porcelain=new T.LatheGeometry(cupProfile.map(([x,y])=>new T.Vector2(x,y)),32);
  const handleGeo=new T.TorusGeometry(1,.18,7,24);
  const teapot=group(turntable,0,.38,0);
  orb(teapot,ivory,0,.94,0,1.65,1.08,1.3);
  cylinder(mint,0,1.85,0,.81,.2,20,teapot,.68);
  orb(teapot,gold,0,2.07,0,.19,.17,.19);
  pipe(teapot,ivory,[[.92,.76,0],[1.46,.93,0],[1.7,1.27,0],[1.95,1.52,0],[2.17,1.56,0]],.19);
  const teaHandle=shape(handleGeo,mint,-1.38,1.13,0,teapot);teaHandle.scale.set(.57,.65,.63);
  const surfaces=[rose,mint,lemon,0x78a9c6,0xb59bcb,0xe49c70];
  for(let i=0;i<6;i++){
    const a=i*tau/6,vehicle=mobile(turntable,Math.sin(a)*5.25,.39,Math.cos(a)*5.25);cupVehicles.push(vehicle);
    cylinder(0xc5aa89,0,.02,0,1.65,.15,32,vehicle);
    cylinder(ivory,0,.13,0,1.68,.13,32,vehicle,.96);
    shape(porcelain,surfaces[i],0,.18,0,vehicle);
    rim(vehicle,ivory,0,1.34,0,1.4);rim(vehicle,0xf5ca8a,0,.52,0,1.07);
    const handle=shape(handleGeo,surfaces[i],1.38,.94,0,vehicle);handle.scale.set(.47,.40,.55);
    for(let j=0;j<12;j++){
      const angle=j*tau/12;
      orb(vehicle,ivory,Math.sin(angle)*1.34,1.05,Math.cos(angle)*1.34,.076,.065,.076);
    }
    cylinder(shade,0,.73,0,.1,.76,12,vehicle);
    rim(vehicle,bronze,0,1.06,0,.43);
    for(const dx of [-.33,.33])beam(vehicle,bronze,[0,1.06,0],[dx,1.06,.17],.03);
    for(const side of [-1,1]){
      box(blush,0,.69,side*.73,.91,.23,.48,vehicle);
      seat("cups",vehicle,0,.27,side*.75,side===1?0:Math.PI,[0,1.05,.025],[.25,.72,-2.85]);
    }
  }
  const splash=station("splash");
  const lagoon=0x408f99,steel=0x37747d,white=0xf4e6c2,boatRed=0xa84739;
  const routePoints=[[0,1,14],[-14,1,14],[-29,1.2,12],[-35,1.3,5],[-35,1.6,-3],
    [-30,4.1,-9],[-16,14.8,-12],[6,29.3,-12],[13.2,33,-11.5],[19,33,-9.8],
    [24,31.1,-6.8],[26,20,-4.8],[27.3,7,0],[27.8,1,6],[24.8,.84,12.4],[17,.85,14.9],[9,.97,14.4]];
  const flume=new T.CatmullRomCurve3(routePoints.map(p=>new T.Vector3(...p)),true,"centripetal");
  const timing=[[0,0],[2,0],[7,1.55],[13,4.3],[17,5.5],[26.2,7.65],[31.7,9.15],
    [33.3,9.95],[35.2,11.05],[36.6,13],[38.2,14.1],[44,15.75],[49.3,17],[50,17]].map(([t,i])=>[t,i/17]);
  const atTrack=(u,across=0,raise=0)=>{
    const p=flume.getPoint(u),d=flume.getTangent(u),len=Math.hypot(d.x,d.z)||1;
    p.x-=d.z/len*across;p.z+=d.x/len*across;p.y+=raise;return p;
  };
  function sweep(profile,color){
    const points=[],indices=[],steps=230;
    for(let i=0;i<=steps;i++){
      for(const [across,raise] of profile)points.push(...atTrack(i/steps,across,raise).toArray());
      if(!i)continue;
      for(let j=0;j+1<profile.length;j++){
        const a=(i-1)*profile.length+j,b=a+profile.length;
        indices.push(a,a+1,b,a+1,b+1,b);
      }
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(points,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    shape(geometry,color,0,0,0,splash);
  }
  sweep([[-2.7,-.42],[-2.68,.82],[-2.44,.94],[-2.28,.1],[2.28,.1],[2.44,.94],[2.68,.82],[2.7,-.42],[-2.7,-.42]],0x91a7a2);
  sweep([[-2.34,.29],[2.34,.29]],lagoon);
  for(const side of [-1,1]){
    const outline=Array.from({length:140},(_,i)=>atTrack(i/140,side*2.53,.93));
    shape(new T.TubeGeometry(new T.CatmullRomCurve3(outline,true),155,.084,6,true),0xcad6bc,0,0,0,splash);
  }
  // Lattice bents carry the high section. Their interval follows distance on the rail.
  let previousBent=null;
  for(let i=0;i<55;i++){
    const u=flume.getUtoTmapping(i/55),p=atTrack(u);
    if(p.y<2.3){previousBent=null;continue;}
    const sides=[-1,1].map(side=>atTrack(u,side*2.84,-.45));
    beam(splash,steel,sides[0].toArray(),sides[1].toArray(),.25,true);
    for(const [j,b] of sides.entries()){
      box(0xbeb39b,b.x,.29,b.z,1.6,.58,1.6,splash);
      beam(splash,steel,[b.x,.35,b.z],b.toArray(),.31);
      if(previousBent&&p.y>7){
        const a=previousBent[j],height=Math.min(a.y,b.y);
        for(let bottom=.8;bottom<height-1.4;bottom+=7){
          const top=Math.min(height,bottom+6.5);
          beam(splash,0x719a94,[a.x,bottom,a.z],[b.x,top,b.z],.095);
          beam(splash,0x719a94,[b.x,bottom,b.z],[a.x,top,a.z],.085);
        }
      }
    }
    if(p.y>6){
      const [a,b]=sides;
      beam(splash,steel,[a.x,.8,a.z],[b.x,Math.min(8,p.y-.7),b.z],.13);
    }
    previousBent=sides;
  }
  for(let i=0;i<61;i++){
    const u=(4.7+i*.075)/17,a=atTrack(u,-.41,.36),b=atTrack(u,.41,.36);
    beam(splash,0x90a29c,a.toArray(),b.toArray(),.065,true);
  }
  // Maintenance stairs follow the chain lift up to the viewing deck at its crest.
  for(let i=0;i<49;i++){
    const u=(4.82+i*.077)/17,a=atTrack(u,2.79,.2),b=atTrack(u,3.64,.2);
    beam(splash,0xa7ad96,a.toArray(),b.toArray(),.13,true);
    if(i%4===0){
      const top=atTrack(u,3.64,1.34);beam(splash,iron,b.toArray(),top.toArray(),.061);
      if(i<48){
        const end=atTrack((4.82+(i+4)*.077)/17,3.64,1.34);
        beam(splash,0xe1b461,top.toArray(),end.toArray(),.064);
      }
    }
  }
  const basin=cylinder(0x6a9692,24.8,.16,10.2,1,.24,48,splash);basin.scale.x=8.8;basin.scale.z=8.4;
  const basinWater=cylinder(0x68a8ab,24.8,.294,10.2,1,.04,48,splash);basinWater.scale.x=8.56;basinWater.scale.z=8.2;
  const landing=group(splash,0,0,14);
  box(0xb3a181,0,.55,4.19,18,1.1,3.22,landing);
  box(0xad9a7d,0,.55,-4.18,18,1.1,3.2,landing);
  for(const x of [-8,-2.66,2.66,8]){
    for(const z of [-5.2,5.2]){box(steel,x,2.67,z,.26,5.34,.26,landing);box(bronze,x,.4,z,.62,.8,.62,landing);}
    for(const z of [-1,1])beam(landing,0x849486,[x,4.88,z*5.28],[x,6.38,0],.13);
  }
  for(const side of [-1,1]){
    const canopy=box(0x527f80,0,5.74,side*2.72,19.5,.18,5.78,landing);
    canopy.rotation.x=side*.24;
    for(let j=0;j<18;j++)beam(landing,0x9aab96,[-9+j*1.06,6.47,0],[-9+j*1.06,5.08,side*5.58],.044);
  }
  box(white,0,4.95,5.4,19.55,.46,.15,landing);
  for(const x of [-5,0,5])orb(landing,0xffdb91,x,4.42,0,.22,.13,.22);
  rail(landing,[-8.8,1.12,-5.6],[8.8,1.12,-5.6],10);
  rail(landing,[-8.8,1.12,5.6],[-2.6,1.12,5.6],4);
  rail(landing,[2.6,1.12,5.6],[8.8,1.12,5.6],4);
  stairs(landing,0,7.8,4.3,6);
  // Two lines of wooden rub rails protect the hull as it enters the shed.
  for(const side of [-1,1])box(0x7a614d,0,1.65,side*2.21,17,.16,.15,landing);
  const boat=mobile(splash),hullProfile=[[-3.22,.04,.74],[-2.55,.94,.47],[-1.85,1.30,.09],
    [.4,1.37,.03],[2.35,1.17,.1],[2.76,1.0,.24]];
  function hullBand(y1,y2,lowerWidth,upperWidth,color){
    const vertices=[],faces=[];
    for(let i=0;i<hullProfile.length;i++){
      const [z,w,raise]=hullProfile[i];
      vertices.push(-w*lowerWidth,raise+y1,z,-w*upperWidth,raise+y2,z,w*upperWidth,raise+y2,z,w*lowerWidth,raise+y1,z);
      if(!i)continue;
      for(let j=0;j<4;j++){
        const a=(i-1)*4+j,b=i*4+j,c=(i-1)*4+(j+1)%4,d=i*4+(j+1)%4;
        faces.push(a,b,c,b,d,c);
      }
    }
    const n=vertices.length/3-4;faces.push(0,2,1,0,3,2,n,n+1,n+2,n,n+2,n+3);
    const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geometry.setIndex(faces);geometry.computeVertexNormals();shape(geometry,color,0,0,0,boat);
  }
  hullBand(-.36,-.04,.63,.91,0x4c7376);
  hullBand(-.035,.21,.91,1,white);
  hullBand(.215,.36,1,1.025,boatRed);
  for(const side of [-1,1]){
    pipe(boat,0xceab74,hullProfile.map(([z,w,h])=>[w*side*1.025,h+.37,z]),.058);
    box(boatRed,side*1.14,.57,.27,.11,.55,3.85,boat);
  }
  for(let row=0;row<4;row++){
    const z=-1.17+.88*row;
    for(const side of [-1,1]){
      const x=side*.48;
      box(0xc89f59,x,.47,z,.83,.19,.57,boat);
      box(0x946543,x,.76,z+.30,.86,.61,.14,boat).rotation.x=.09;
      beam(boat,iron,[x-.4,.83,z-.31],[x+.4,.83,z-.31],.045);
      seat("splash",boat,x,.015,z,0,[0,1.31,-.025],[.12,.76,-5.75]);
    }
  }
  const bow=group(boat,0,0,-1.5);
  for(const side of [-1,1]){
    const outline=[[.78,.02,-.34],[1.28,0,0],[1.67,-.04,.65],[1.96,-.06,1.6]]
      .map(([x,y,z])=>[side*x,y,z]);
    pipe(bow,0xf0f1d9,outline,.052);
  }

  const impact=atTrack(13/17),tangent=flume.getTangent(13/17);
  const forward=new T.Vector3(tangent.x,0,tangent.z).normalize(),across=new T.Vector3(-forward.z,0,forward.x);
  const sprayFan=mobile(splash,impact.x,impact.y+.29,impact.z);
  sprayFan.rotation.y=Math.atan2(forward.x,forward.z);
  const sprayMaterial=new T.MeshStandardMaterial({
    vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.72,roughness:.37,depthWrite:false
  });
  for(const side of [-1,1]){
    const pos=[],col=[],tri=[];
    for(let i=0;i<=20;i++){
      const u=i/20,envelope=Math.sin(Math.PI*u)**.65;
      const peak=(4.8+1.1*Math.sin(13*u+side)+.6*Math.cos(36*u+side))*envelope;
      for(let level=0;level<5;level++){
        const h=level/4;
        pos.push(side*(.68+h*(2.5+3.4*envelope)+Math.sin(Math.PI*h)*1.2),
          h*peak+.17*Math.sin(8*u),-1+u*8.6+h*.7);
        const tint=new T.Color(0x76b6bf).lerp(new T.Color(0xf1f6ef),h**.8);col.push(tint.r,tint.g,tint.b);
        if(i&&level){
          const n=i*5+level;tri.push(n-6,n-1,n-5,n-1,n,n-5);
        }
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(pos,3));
    geo.setAttribute("color",new T.Float32BufferAttribute(col,3));geo.setIndex(tri);geo.computeVertexNormals();
    sprayFan.add(new T.Mesh(geo,sprayMaterial));
  }
  const droplets=[],capacity=130,stamp=new T.Object3D();
  const foam=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({
    color:0xdfefdf,roughness:.39,transparent:true,opacity:.88,depthWrite:false
  }),capacity);
  foam.name="착수 물보라";foam.frustumCulled=false;splash.add(foam);
  const fraction=i=>{const f=Math.sin(i*127.1+311.7)*43758.5453;return f-Math.floor(f);};
  for(let i=0;i<capacity;i++){
    const side=i%2?1:-1;
    droplets.push({side,delay:fraction(i+1)*.8,reach:3.4+fraction(i+33)*7.6,vy:4.7+fraction(i+51)*9.7,
      vz:1+fraction(i+82)*8.8,lead:fraction(i+98)*2.6,r:.18+fraction(i+109)*.43});
  }
  function spray(time){
    foam.visible=time>35.97&&time<39.84;
    const crest=clamp((time-36.02)/2.8);
    sprayFan.visible=crest>0&&crest<1;
    if(sprayFan.visible){
      sprayFan.scale.set(.35+crest*1.4,Math.sin(Math.PI*crest)**.75,.55+crest);
      sprayMaterial.opacity=.86*(1-crest*crest);
    }
    if(!foam.visible)return;
    const age=time-35.97;let count=0;
    for(const drop of droplets){
      const t=age-drop.delay,life=2*drop.vy/9.81;
      if(t<0||t>life)continue;
      stamp.position.copy(impact).addScaledVector(forward,drop.lead+drop.vz*t)
        .addScaledVector(across,drop.side*(.75+drop.reach*t));
      stamp.position.y+=.42+drop.vy*t-4.905*t*t;
      const size=drop.r*(1-.76*t/life);
      stamp.scale.set(size*1.1,size*(1.25+Math.max(0,1-t)),size);
      stamp.rotation.set(t*1.6,drop.reach,t*drop.side);stamp.updateMatrix();
      foam.setMatrixAt(count++,stamp.matrix);
    }
    foam.count=count;foam.instanceMatrix.needsUpdate=true;
  }

  batchRideParts(T,groups);
  const frame=new T.Matrix4(),point=new T.Vector3(),direction=new T.Vector3();
  function update(seconds,clock,sessions=[]){
    const k=seconds("krake",46),c=seconds("cups",36),s=seconds("splash",50);
    arm.rotation.z=swingDegrees(k)*Math.PI/180;
    wheel.rotation.y=tau*4*runningPhase(Math.max(0,k-1),44,5);
    const spin=runningPhase(Math.max(0,c-1),34,4)*tau;
    turntable.rotation.y=3*spin;
    const boosts=sessions.find(session=>session.kind==="cups")?.cupSpins;
    cupVehicles.forEach((vehicle,i)=>{
      const boost=boosts?.[i],elapsed=(clock-boost)/3000;
      const manual=Number.isFinite(boost)&&elapsed>=0&&elapsed<1?tau*ease(elapsed):0;
      vehicle.rotation.y=i*tau/6+spin*(i%2?3:-4)+manual;
    });
    const u=boatTiming(timing,s);
    flume.getPoint(u,point);flume.getTangent(u,direction);
    boat.position.copy(point);boat.position.y+=.31;
    boat.quaternion.setFromRotationMatrix(frame.lookAt(point,direction.add(point),up));
    bow.visible=s>33.7&&s<40.6;
    spray(s);
  }
  update(()=>0,0);
  return {seats,update};
}

export function batchRideParts(T,groups){
  const moving=new Set(groups);
  // Batch the station and each independently moving part in its own coordinate
  // system. The seat anchors remain available as ordinary Object3D instances.
  const batchMaterial=new T.MeshStandardMaterial({color:0xffffff,roughness:.76,metalness:.08});
  for(const base of groups){
    base.updateWorldMatrix(true,true);
    const inverse=base.matrixWorld.clone().invert(),pieces=new Map();
    function collect(node){
      if(moving.has(node)||node.isInstancedMesh)return;
      if(node.isMesh){
        const list=pieces.get(node.geometry)??[];pieces.set(node.geometry,list);list.push(node);
      }else for(const child of node.children)collect(child);
    }
    for(const child of base.children)collect(child);
    for(const [geometry,list] of pieces){
      if(list.length<2){list[0].receiveShadow=true;continue;}
      const mesh=new T.InstancedMesh(geometry,batchMaterial,list.length),local=new T.Matrix4();
      list.forEach((original,i)=>{
        mesh.setMatrixAt(i,local.multiplyMatrices(inverse,original.matrixWorld));
        mesh.setColorAt(i,original.material.color);
        original.removeFromParent();
      });
      mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
      mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.computeBoundingSphere();base.add(mesh);
    }
  }
}
