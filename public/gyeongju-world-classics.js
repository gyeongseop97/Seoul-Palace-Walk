import {batchRideParts,runningPhase} from "./gyeongju-world-attractions.js";
import {standSign} from "./regional-stands.js";

const tau=Math.PI*2,rad=Math.PI/180;
const saddleColors=[0xaa554e,0x397579,0x645677,0x626e48,0x315886];
const horseColors=[0xf7dfad,0xa36a46,0xf2e9d3,0x9b8170,0xdaab77];

export function buildParkClassics(T,root,kit,rides){
  const {box,cylinder,shape}=kit,groups=[],seats={carousel:[],phaethon:[]};
  const pearl=0xf4ddae,gold=0xcd9e55,green=0x487767,russet=0x985956,cream=0xf0e4c3;
  const ball=new T.SphereGeometry(1,14,10),torus=new T.TorusGeometry(1,.065,6,32);
  const up=new T.Vector3(0,1,0),axis=new T.Vector3();
  function group(parent,x=0,y=0,z=0){
    const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;
  }
  function mobile(parent,x=0,y=0,z=0){
    const g=group(parent,x,y,z);groups.push(g);return g;
  }
  function station(id){
    const ride=rides.find(r=>r.id===id),base=mobile(root,ride.x,0,ride.z);
    base.name=ride.name;base.rotation.y=Math.atan2(ride.gate.x-ride.x,ride.gate.z-ride.z);return base;
  }
  function orb(parent,color,x,y,z,w,h,d){
    const m=shape(ball,color,x,y,z,parent);m.scale.set(w,h,d);return m;
  }
  function ring(parent,color,x,y,z,w,h,d){
    const m=shape(torus,color,x,y,z,parent);m.scale.set(w,h,d);return m;
  }
  function beam(parent,color,a,b,r,rect=false){
    axis.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const len=axis.length();
    const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,z=(a[2]+b[2])/2;
    const m=rect?box(color,x,y,z,2*r,len,2*r,parent):cylinder(color,x,y,z,r,len,9,parent);
    m.quaternion.setFromUnitVectors(up,axis.multiplyScalar(1/len));return m;
  }
  function tube(parent,color,points,r){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    return shape(new T.TubeGeometry(curve,points.length*4,r,6,false),color,0,0,0,parent);
  }
  function saddle(k,parent,x,y,z,eye,look,pose){
    const object=group(parent,x,y,z);
    const desc={object,x:0,y:0,z:0,yaw:Math.PI,camera:{eye,look,firstPerson:true}};
    if(pose)desc.pose=pose;
    seats[k].push(desc);return desc;
  }
  function fence(o,x1,z1,x2,z2,n,h=0){
    for(const y of [.45,.94])beam(o,green,[x1,y+h,z1],[x2,y+h,z2],.042);
    for(let i=0;i<=n;i++){
      const t=i/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;
      cylinder(green,x,h+.49,z,.062,.98,8,o);orb(o,gold,x,h+1.02,z,.09,.09,.09);
    }
  }
  function roofSlice(profile,n){
    const points=[],indices=[];
    for(const [radius,y] of profile){
      for(let j=0;j<=4;j++){
        const a=tau/n*(j/4-.5);
        points.push(radius*Math.sin(a),y,radius*Math.cos(a));
      }
    }
    for(let row=0;row<profile.length-1;row++)for(let col=0;col<4;col++){
      const i=row*5+col;indices.push(i,i+5,i+1,i+1,i+5,i+6);
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }

  const carousel=station("carousel"),platform=mobile(carousel,0,.41,0),mounts=[];
  cylinder(0xb5a68d,0,.21,0,8.85,.42,56,carousel);
  cylinder(green,0,.12,0,8.22,.30,56,platform);
  cylinder(gold,0,.31,0,8.27,.11,56,platform);
  cylinder(0xb8875a,0,.405,0,8.13,.16,56,platform);
  for(let i=0;i<32;i++){
    const a=i*tau/32;
    beam(platform,0xc59a6d,[2.13*Math.sin(a),.496,2.13*Math.cos(a)],[7.94*Math.sin(a),.496,7.94*Math.cos(a)],.013);
  }
  for(let i=0;i<5;i++)box(i%2?0xc4ae8e:0xcdbba0,0,.085*(i+1),9.89-i*.36,3.36,.17*(i+1),.39,carousel);
  cylinder(gold,0,5.25,0,8.76,.16,56,carousel);
  cylinder(russet,0,5.65,0,8.67,.67,56,carousel);
  cylinder(gold,0,6.05,0,8.79,.19,56,carousel);
  const crown=roofSlice([[.013,8.65],[.73,8.30],[2.45,7.19],[4.65,6.49],[7.1,6.23],[8.68,6.08]],16);
  for(let i=0;i<16;i++){
    const a=i*tau/16,edge=group(carousel,Math.sin(a)*8.56,5.64,Math.cos(a)*8.56);
    edge.rotation.y=a;
    const segment=shape(crown,i%2===0?pearl:russet,0,0,0,carousel);segment.rotation.y=a;
    orb(edge,gold,0,0,0,1.33,.41,.13);
    orb(edge,i%2?0x78958b:0x809eaa,0,.02,.085,1.14,.30,.12);
    for(const side of [-1,1]){
      orb(edge,pearl,side*1.44,.015,0,.17,.24,.12);
      orb(edge,0xffe3a1,side*.79,-.39,-.02,.075,.079,.075);
    }
    if(i%2===1){
      for(const s of [2.6,7.91])beam(carousel,gold,[Math.sin(a)*s,5.19,Math.cos(a)*s],
        [Math.sin(a)*s*.96,5.91,Math.cos(a)*s*.96],.065);
    }
  }
  cylinder(gold,0,8.67,0,.13,.86,12,carousel);
  orb(carousel,0xd9b469,0,9.12,0,.26,.31,.26);
  const drum=group(platform);
  cylinder(green,0,2.76,0,2.16,4.57,16,drum);
  cylinder(gold,0,.71,0,2.37,.39,20,drum);
  cylinder(gold,0,4.79,0,2.38,.32,20,drum);
  for(let i=0;i<8;i++){
    const a=i*tau/8,mirror=group(drum,Math.sin(a)*2.07,2.67,Math.cos(a)*2.07);
    mirror.rotation.y=a;
    box(0xae864f,0,0,0,1.40,2.95,.17,mirror);
    box(0x80a8aa,0,.10,.1,1.12,2.52,.07,mirror);
    orb(mirror,gold,0,1.34,.10,.62,.37,.11);
    orb(mirror,0xb9cbba,0,1.34,.17,.52,.27,.08);
    for(const side of [-1,1])cylinder(pearl,side*.66,0,.15,.071,2.77,9,mirror);
    for(let j=-2;j<=2;j++){
      const h=.63+.19*(2-Math.abs(j));
      cylinder(gold,j*.17,-1.28+h/2,.23,.063,h,9,mirror);
    }
  }

  // Local -Z is the muzzle. Bent legs, reins, stirrups and saddle rise together.
  function horse(o,i){
    const coat=horseColors[i%5],tack=saddleColors[i%5],mane=i%3===0?0xc29c6d:0x584739;
    orb(o,coat,0,1.02,0,.30,.36,.69);
    const neck=orb(o,coat,0,1.36,-.47,.23,.46,.27);neck.rotation.x=-.37;
    const head=orb(o,coat,0,1.70,-.66,.19,.22,.32);head.rotation.x=.12;
    const nose=orb(o,coat,0,1.52,-.91,.16,.14,.23);nose.rotation.x=-.20;
    for(const s of [-1,1]){
      const ear=orb(o,coat,s*.104,1.93,-.58,.06,.15,.091);ear.rotation.x=.21;ear.rotation.z=-s*.17;
      orb(o,0x372f2d,s*.166,1.73,-.72,.031,.045,.042);
      orb(o,0x5f473b,s*.114,1.55,-1.04,.028,.023,.033);
      const hoofA=[s*.145,.21,-.42+s*.14],kneeA=[s*.18,.46,-.58+s*.10],hipA=[s*.16,.87,-.40];
      const hoofB=[s*.15,.24,.51-s*.18],kneeB=[s*.16,.50,.37+s*.07],hipB=[s*.16,.91,.43];
      for(const [hip,knee,hoof] of [[hipA,kneeA,hoofA],[hipB,kneeB,hoofB]]){
        beam(o,coat,hip,knee,.085);orb(o,coat,...knee,.082,.084,.082);
        beam(o,coat,knee,hoof,.060);orb(o,mane,hoof[0],hoof[1]-.035,hoof[2]-.022,.086,.074,.115);
      }
      const stirrup=ring(o,0xb89551,s*.275,.72,.08,.091,.132,.07);stirrup.rotation.y=Math.PI/2;
      beam(o,tack,[s*.29,1.12,.04],[s*.275,.82,.08],.022);
      beam(o,0x834e39,[s*.132,1.52,-.93],[s*.236,1.37,-.43],.018);
    }
    for(let j=0;j<6;j++)orb(o,mane,0,1.86-j*.10,-.49+j*.037,.129,.099,.11);
    const tail=orb(o,mane,0,.80,.73,.16,.36,.14);tail.rotation.x=-.55;
    orb(o,gold,0,1.30,.055,.31,.127,.35);
    orb(o,tack,0,1.35,.08,.30,.112,.34);
    orb(o,0x875535,0,1.42,.1,.234,.077,.255);
    orb(o,0x875535,0,1.46,.31,.22,.096,.11);
  }
  for(let section=0;section<5;section++){
    for(const row of [0,1]){
      const i=section*2+row,r=row?4.32:6.61,a=section*tau/6+(row?.16:0);
      const x=Math.sin(a)*r,z=Math.cos(a)*r,base=group(platform,x,0,z);
      base.rotation.y=a-Math.PI/2;
      cylinder(gold,.18,2.72,-.31,.054,4.42,12,base);
      for(let j=0;j<10;j++)cylinder(pearl,.18,.81+j*.39,-.31,.062,.11,10,base);
      const mount=mobile(base,0,.54,0);horse(mount,i);mounts.push(mount);
      saddle("carousel",mount,0,.94,.08,[-.12,1.08,.04],[-.32,.76,-4.6],"horse");
    }
  }
  const carriage=group(platform,Math.sin(-tau/6)*6.25,.46,Math.cos(-tau/6)*6.25);
  carriage.rotation.y=-tau/6-Math.PI/2;
  box(green,0,.52,0,1.48,.35,2.09,carriage);
  box(russet,0,.84,.24,1.37,.23,.69,carriage);
  box(russet,0,1.19,.60,1.39,.62,.15,carriage).rotation.x=.12;
  for(const s of [-1,1]){
    for(const z of [-.67,.65]){
      const wheel=ring(carriage,gold,s*.82,.43,z,.33,.33,.33);wheel.rotation.y=Math.PI/2;
      beam(carriage,gold,[s*.82,.17,z],[s*.82,.69,z],.025);
      beam(carriage,gold,[s*.82,.43,z-.27],[s*.82,.43,z+.27],.025);
    }
    tube(carriage,gold,[[s*.67,.9,-.94],[s*.67,1.27,-.63],[s*.67,1.17,-.27],[s*.67,.99,-.13],[s*.67,1.32,.57]],.043);
    saddle("carousel",carriage,s*.33,.4,.25,[0,1.05,0],[.18,.77,-4.1]);
  }
  for(const s of [-1,1])fence(carousel,s*2.2,8.27,s*5.6,6.65,4);
  // The original has an under-slung train, an ivory box spine, a vertical loop
  // and rolling inversions. Rail ties and wheel bogies use the same banked frame.
  const phaethon=station("phaethon"),knots=[];
  const grey=0xa7ad9e,railColor=0xd8c9a0,spineColor=0xcfba8a,navy=0x293d56;
  const add=(x,y,z,bank=0,loopRight=0)=>knots.push({point:new T.Vector3(x,y,z),bank:bank*rad,loopRight});
  add(0,5.9,24);add(-14,5.9,24);add(-24,7.8,24);add(-37,20,22);add(-51,34,18);
  add(-57,40.7,13);add(-59,41.1,7,-14);add(-59,35,-1,-40);add(-53,24,-10,-58);
  add(-45,12,-16,-44);add(-36,6,-20,-17);add(-27,5.9,-21,0,1);
  const loopStart=knots.length;
  for(let i=0;i<=16;i++){
    const a=i*tau/16;
    add(-19+12.8*Math.sin(a)+8*i/16,5.85+13.4*(1-Math.cos(a)),-21+5.2*i/16,0,1);
  }
  const loopEnd=knots.length-1;
  add(.4,6.2,-16,0,1);add(8.5,12,-16,-24);add(15,19,-15,-92);
  add(23,21,-15,-179);add(30,18,-14,-267);add(37,11,-12,-334);
  add(44,6.9,-9,-354);add(51,8,-5,0);add(57,15,1,35);add(57,23,6,98);
  add(51,25,9,175);add(46,22,6,241);add(43,16.5,1,305);add(40,13,-3,352);
  add(35,16,-7,308);add(29,22.2,-9,234);add(25,24.1,-6,174);add(26,21,0,105);
  add(27,14.5,7,45);add(25,7.5,13,13);add(18,6.1,16,1);
  // Two twisted elements wind toward the interior of the course.
  for(let i=1;i<=12;i++){
    const a=i*tau/12;
    add(18-24*i/12,6.1+3.95*(1-Math.cos(a)),16-4.8*Math.sin(a)-4.5*i/12,-360*i/12);
  }
  add(-14,6.3,9,-24);add(-22,8.1,5,-46);add(-22.6,9,-4,-58);add(-16,7.65,-6,-33);
  for(let i=0;i<=12;i++){
    const a=i*tau/12;
    add(-10+25.5*i/12,6.6+4.25*(1-Math.cos(a)),-5+4.5*Math.sin(a)+3.4*i/12,360*i/12);
  }
  add(22,6.8,1,12);add(28,8.3,8,33);add(29,8.0,19,42);
  add(25,6.9,25,24);add(18,5.9,25,4);add(11,5.9,24,0);
  const track=new T.CatmullRomCurve3(knots.map(k=>k.point),true,"centripetal");
  track.arcLengthDivisions=knots.length*16;const length=track.getLength();
  const tip=new T.Vector3(),lateral=new T.Vector3(),normal=new T.Vector3(),back=new T.Vector3(),p=new T.Vector3();
  const lateralLoop=new T.Vector3(),matrix=new T.Matrix4(),spinBasis=new T.Quaternion();
  function trackFrame(t){
    const n=knots.length,t0=((t%1)+1)%1,f=t0*n,i=Math.floor(f),alpha=f-i;
    const a=knots[i],b=knots[(i+1)%n],rollDelta=b.bank-a.bank;
    const roll=a.bank+alpha*Math.atan2(Math.sin(rollDelta),Math.cos(rollDelta));
    track.getPoint(t0,p);track.getTangent(t0,tip);
    const weight=a.loopRight+(b.loopRight-a.loopRight)*alpha;
    lateral.crossVectors(tip,up).normalize();
    if(weight){
      // Maintain the outside of the loop through the two vertical tangents.
      lateralLoop.set(0,0,1).addScaledVector(tip,-tip.z).normalize();
      lateral.lerp(lateralLoop,weight).normalize();
    }
    lateral.applyAxisAngle(tip,roll);
    normal.crossVectors(lateral,tip).normalize();
    back.copy(tip).negate();
    spinBasis.setFromRotationMatrix(matrix.makeBasis(lateral,normal,back));
  }
  const offset=(x,y)=>p.clone().addScaledVector(lateral,x).addScaledVector(normal,y);
  const edgePaths=[[],[]],spineVertices=[],spineIndices=[],samples=knots.length*9;
  for(let i=0;i<=samples;i++){
    trackFrame(i/samples);
    for(const [j,width] of [-.665,.665].entries())edgePaths[j].push(offset(width,0));
    for(const [rx,ry] of [[-.39,.5],[.39,.5],[.39,1.21],[-.39,1.21]])
      spineVertices.push(...offset(rx,ry).toArray());
    if(i){
      for(let j=0;j<4;j++){
        const a=(i-1)*4+j,b=i*4+j,c=(i-1)*4+(j+1)%4,d=i*4+(j+1)%4;
        spineIndices.push(a,b,c,b,d,c);
      }
    }
  }
  const spine=new T.BufferGeometry();
  spine.setAttribute("position",new T.Float32BufferAttribute(spineVertices,3));
  spine.setIndex(spineIndices);spine.computeVertexNormals();shape(spine,spineColor,0,0,0,phaethon);
  for(const path of edgePaths){
    const spline=new T.CatmullRomCurve3(path.slice(0,-1),true);
    shape(new T.TubeGeometry(spline,samples,.137,8,true),railColor,0,0,0,phaethon);
  }
  const ties=Math.ceil(length/1.55);
  for(let i=0;i<ties;i++){
    trackFrame(track.getUtoTmapping(i/ties));
    for(const side of [-1,1])beam(phaethon,cream,offset(side*.675,0).toArray(),offset(side*.28,.6).toArray(),.095,true);
  }
  for(let i=0;i<57;i++){
    const t=track.getUtoTmapping(i/57);
    trackFrame(t);
    if(normal.y<.22||t<.018||t>.977)continue;
    const top=offset(0,1.19),side=i%2?1:-1;
    const plan=new T.Vector3(tip.z,0,-tip.x).normalize();
    const foot=top.clone().addScaledVector(plan,side*(p.y>13?6:4));
    const cap=foot.clone().addScaledVector(plan,-side*.45);
    cap.y=top.y+.45;
    beam(phaethon,grey,[foot.x,.57,foot.z],cap.toArray(),p.y>25?.52:.37);
    beam(phaethon,grey,cap.toArray(),top.toArray(),.32);
    box(0xb4a994,foot.x,.33,foot.z,1.72,.66,1.72,phaethon);
    if(p.y>17){
      const stay=foot.clone().addScaledVector(tip,i%2?5.8:-5.8);
      stay.y=.58;beam(phaethon,grey,stay.toArray(),[cap.x,cap.y-2.6,cap.z],.30);
      box(0xb4a994,stay.x,.29,stay.z,1.38,.58,1.38,phaethon);
    }
  }
  // The outer crown of the vertical loop has its own offset portal bent.
  trackFrame(((loopStart+loopEnd)/2)/knots.length);
  const loopCrown=offset(0,1.18);
  for(const side of [-1,1]){
    const base=[loopCrown.x+side*5.7,.47,loopCrown.z+5.2];
    const head=[loopCrown.x,loopCrown.y+1.65,loopCrown.z+4.3];
    beam(phaethon,grey,base,head,.39);beam(phaethon,grey,head,loopCrown.toArray(),.34);
    box(0xb4a994,base[0],.27,base[2],1.56,.54,1.56,phaethon);
  }

  const stationHall=group(phaethon,0,0,24);
  for(const side of [-1,1]){
    box(0xbda57e,0,1.47,side*4.13,20,2.88,3.64,stationHall);
    box(cream,0,2.97,side*4.13,20,.18,3.7,stationHall);
    for(const x of [-8.85,-3.05,3.05,8.85]){
      cylinder(pearl,x,5.66,side*5.72,.245,5.3,14,stationHall);
      box(gold,x,3.24,side*5.72,.74,.4,.74,stationHall);
      box(cream,x,8.23,side*5.72,.78,.29,.74,stationHall);
    }
    const roofPanel=box(0xa25943,0,9.20,side*3.04,21.2,.28,6.52,stationHall);
    roofPanel.rotation.x=side*.30;
    box(cream,0,8.24,side*6.12,21.3,.42,.38,stationHall);
    fence(stationHall,-9.72,side*5.76,-2.45,side*5.76,6,3.06);
    fence(stationHall,2.45,side*5.76,9.72,side*5.76,6,3.06);
  }
  for(let i=0;i<15;i++)box(i%2?0xc7ae88:0xc2a67e,0,(i+1)*.10,11.65-i*.38,4.2,(i+1)*.20,.4,stationHall);
  standSign(T,stationHall,"파에톤","PHAETHON",5.9,0,8.15,6.36,"#453e3c","#efdaaa",1.12);
  const rows=[];
  const harness=new T.TubeGeometry(new T.CatmullRomCurve3([
    [-.31,.31,.17],[-.31,.77,.18],[-.24,.95,-.01],[-.22,.69,-.28],[-.18,.44,-.37],
    [.18,.44,-.37],[.22,.69,-.28],[.24,.95,-.01],[.31,.77,.18],[.31,.31,.17]
  ].map(p=>new T.Vector3(...p))),25,.069,7,false);
  for(let row=0;row<6;row++){
    const car=mobile(phaethon);rows.push(car);
    box(navy,0,-.29,0,2.97,.36,1.05,car);
    for(const side of [-1,1]){
      const x=side*.69;
      box(0x4c5764,x,-.04,0,.44,.32,1.25,car);
      for(const z of [-.42,.42]){
        const axle=cylinder(0x473d36,x,.16,z,.21,.23,12,car);
        axle.rotation.z=Math.PI/2;
      }
    }
    for(let j=0;j<4;j++){
      const x=(j-1.5)*.76;
      beam(car,0x4f5355,[x,-.36,.06],[x,-1.4,.19],.13,true);
      const chair=group(car,x,-1.75,0);
      box(navy,0,0,0,.70,.21,.66,chair);
      box(0x39506a,0,.40,.21,.67,.77,.20,chair).rotation.x=.08;
      orb(chair,navy,0,.86,.22,.25,.205,.13);
      shape(harness,0xe8a935,0,0,0,chair);
      if(row<2)saddle("phaethon",chair,0,-.49,0,[0,1.24,-.1],[.12,.88,-5.4]);
    }
  }

  // Calculate travel time from track length and height. The chain sets lift
  // speed; the main course gains speed on the descent and sheds it on climbs.
  const timeMap=[0],speeds=[],segments=840,step=length/segments;
  trackFrame(0);
  const previousFrame=spinBasis.clone();
  for(let i=1;i<=segments;i++){
    const t=track.getUtoTmapping((i-.5)/segments),k=t*knots.length;
    const y=track.getPoint(t,p).y;
    let speed;
    if(k<1.3)speed=3.9;
    else if(k<6.2)speed=5.7;
    else if(k>knots.length-3)speed=5.2;
    else speed=Math.sqrt(19.6*Math.max(0,41.8-y)+27);
    // Limit angular speed through the compound twists, then start slowing down
    // before short-radius elements and the station brakes.
    trackFrame(track.getUtoTmapping(i/segments));
    const radians=previousFrame.angleTo(spinBasis);
    speeds.push(Math.min(speed,3.25*step/Math.max(.0001,radians)));
    previousFrame.copy(spinBasis);
  }
  for(let i=segments-2;i>=0;i--)speeds[i]=Math.min(speeds[i],Math.sqrt(speeds[i+1]**2+16*step));
  for(let i=1;i<segments;i++)speeds[i]=Math.min(speeds[i],Math.sqrt(speeds[i-1]**2+18*step));
  for(const speed of speeds)timeMap.push(timeMap.at(-1)+step/speed);
  const movingDuration=46.0,total=timeMap.at(-1);
  function distanceAt(t){
    const steady=runningPhase(Math.max(0,t-.9),movingDuration,1.08);
    const target=steady*total;let lo=0,hi=segments;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(timeMap[mid]<=target)lo=mid;else hi=mid;}
    return (lo+(target-timeMap[lo])/(timeMap[hi]-timeMap[lo]))/segments;
  }
  batchRideParts(T,groups);
  function update(seconds){
    const t=seconds("carousel",40),phase=runningPhase(Math.max(0,t-.6),38.8,4)*tau;
    platform.rotation.y=phase*2;
    const amplitude=Math.max(0,Math.min(1,t/4,(40-t)/4))*.25;
    for(let i=0;i<mounts.length;i++){
      mounts[i].position.y=.62+amplitude*Math.sin(phase*7+i*2.19);
    }
    const distance=distanceAt(seconds("phaethon",48));
    rows.forEach((row,i)=>{
      const u=((distance-i*1.45/length)%1+1)%1;
      trackFrame(track.getUtoTmapping(u));row.position.copy(p);row.quaternion.copy(spinBasis);
    });
  }
  update(()=>0);
  return {seats,update};
}
