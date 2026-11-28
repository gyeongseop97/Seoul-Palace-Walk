import {districtMeshes,localFrame,randomSeed,registerDistrictLod,updateDistrictBatches} from "./gyeongju-mesh.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {basinWater,jetTube,jetWater,pondWater,tickWater} from "./water-shader.js";

const tau=2*Math.PI;
const stone=0xe0cba6,ivory=0xffe5b5,bronze=0xb48647,iron=0x354a4b,wood=0x916746;
const palettes={
  coast:[0x337880,0xf0ca78],draken:[0x92402f,0xe3ab51],garden:[0x7263a0,0xe9b5bd]
};
const drakenIds=new Set(["coaster","krake","valkyrie","skoll"]);
const gardenIds=new Set(["cups","carousel","balloon"]);
const regionOf=id=>drakenIds.has(id)?"draken":gardenIds.has(id)?"garden":"coast";
const polygonRing=(x,z,rx,rz,n=40)=>Array.from({length:n},(_,i)=>({x:x+Math.sin(i*tau/n)*rx,z:z+Math.cos(i*tau/n)*rz}));

// Coordinates inside a shop, gateway or bench are measured right/up/toward its front.
function frameTools(k,x,z,yaw){
  const at=localFrame(x,z,yaw);
  return {
    at,
    box(u,y,v,w,h,d,color,pitch=0,roll=0){
      const p=at(u,v);k.piece(p.x,y,p.z,w,h,d,color,yaw,pitch,roll);
    },
    post(u,y,v,w,h,d,color){
      const p=at(u,v);k.column(p.x,y,p.z,w,h,d,color);
    },
    crown(u,y,v,w,h,d,color){
      const p=at(u,v);k.crown(p.x,y,p.z,w,h,d,color,yaw);
    },
    line(a,b,r,color){
      const p=at(a[0],a[2]),q=at(b[0],b[2]);k.beam({...p,y:a[1]},{...q,y:b[1]},r,color);
    },
    sign(text,u,y,v,w,h,bg,ink){
      const p=at(u,v);k.sign(text,p.x,y,p.z,w,h,yaw,bg,ink);
    },
    surface(vertices,indices,color){
      k.face(vertices.map(([u,y,v])=>{const p=at(u,v);return [p.x,y,p.z];}),indices,color);
    }
  };
}

function landscapeHorizon(T,root,k){
  const x=6245,z=-95,count=72,rng=randomSeed(917043);
  const positions=[],colors=[],tone=new T.Color();
  k.polygon([{x:x-1550,z:z-1500},{x:x+1550,z:z-1500},{x:x+1550,z:z+1500},{x:x-1550,z:z+1500}],-.54,0x8c9c72);
  for(let band=0;band<2;band++){
    const rows=[[],[],[]];
    for(let i=0;i<count;i++){
      const a=i*tau/count,r=650+band*200+35*Math.sin(4*a)+35*Math.cos(5*a+band);
      const hill=(43+band*14)*(1+.4*Math.sin(5*a+band)+.31*Math.sin(3*a+1)+.19*Math.sin(13*a));
      for(const [row,s,h] of [[0,.80,-2],[1,.94,hill*.55+rng()*6],[2,1.05,hill+8]]){
        rows[row].push([x+Math.cos(a)*r*s,h,z+Math.sin(a)*r*s]);
      }
    }
    for(let j=0;j<2;j++)for(let i=0;i<count;i++){
      const n=(i+1)%count;
      tone.set((band?[0x758d88,0x80928d,0x839795]:[0x647f65,0x6f865f,0x748964])[Math.floor(rng()*3)]);
      for(const p of [rows[j][i],rows[j+1][i],rows[j][n],rows[j+1][i],rows[j+1][n],rows[j][n]]){
        positions.push(...p);colors.push(tone.r,tone.g,tone.b);
      }
    }
  }
  const hills=new T.BufferGeometry();
  hills.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  hills.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  hills.computeVertexNormals();
  root.add(new T.Mesh(hills,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1})));
}

function bomunShore(T,root,k,materials){
  const rng=randomSeed(197904);
  const near=[],far=[];
  for(let i=0;i<=28;i++){
    const z=-575+i*38;
    const x=5952+Math.max(0,-z)*.285+12*Math.sin(z/94);
    near.push({x,z});far.push({x:x-390-65*Math.cos(z/180),z});
  }
  const shore=near.concat([...far].reverse()),shape=new T.Shape(shore.map(v=>new T.Vector2(v.x,-v.z)));
  const lake=new T.ShapeGeometry(shape);lake.rotateX(-Math.PI/2);
  const water=pondWater(T),surface=new T.Mesh(lake,water);
  surface.position.y=-.19;surface.name="보문호 수면";root.add(surface);materials.push(water);
  k.strip(near,4,-.145,0xb7ad88);k.strip(far,5,-.16,0xafa986);
  for(let i=1;i<near.length-1;i++){
    const p=near[i];
    for(let j=0;j<3;j++){
      const x=p.x+3+rng()*2,z=p.z+(rng()-.5)*15;
      k.crown(x,.11,z,1.1+rng(),.54+rng()*.25,.85+rng()*.6,0x959789);
    }
  }
  // Hotel terraces form an identifiable opposite shore from the wheel and the coaster.
  for(const [index,block] of [[5,6],[10,5],[18,4],[23,6]]){
    const p=far[index],f=frameTools(k,p.x-29,p.z,.34*Math.sin(index)+1.40);
    f.box(0,block*1.5,0,17,block*3,11,0xc6c6b6);
    f.box(-13,block*.9,-3,11,block*1.8,7,0xc6bba4);
    for(let row=0;row<block;row++){
      f.box(0,1.45+row*3,5.53,16.4,1.52,.13,0x719097);
      f.box(0,1+row*3,5.80,17.5,.28,1.12,0xcacabd);
    }
    for(let col=-3;col<=3;col++)f.box(col*2.3,block*1.5,5.73,.17,block*3,.27,0xd1ccbc);
    f.box(0,block*3+.18,0,17.8,.37,11.6,0xa0a399);
  }
}

function entrance(T,k,layout,glow,geometry){
  const p=layout.parkEntrance,yaw=.68,center=localFrame(p.x,p.z,yaw)(0,-9),f=frameTools(k,center.x,center.z,yaw);
  // The central axis stays open through the arch. Ticket windows are in its side wings.
  for(const side of [-1,1]){
    const u=side*10.7;
    f.box(u,1.94,0,6.4,3.88,4.2,0xc4b69c);
    f.box(u,.32,0,6.64,.62,4.44,0x928777);
    f.box(u,3.94,0,6.92,.37,4.64,stone);
    f.box(u,4.25,0,6.65,.32,4.28,0xaa7955);
    for(const dx of [-1.55,1.55]){
      f.box(u+dx,1.97,2.13,2.23,1.69,.11,0x785a44);
      f.box(u+dx,1.98,2.22,1.98,1.35,.11,0x557c7f);
      f.box(u+dx-.63,2.16,2.289,.14,.79,.026,0x87a5a1);
      f.box(u+dx-.41,2.35,2.289,.055,.42,.026,0xa8bcb2);
      f.box(u+dx,1.88,2.29,.058,1.27,.028,bronze);
      f.box(u+dx+.46,1.53,2.29,.45,.30,.03,0x374e50);
      f.box(u+dx+.46,1.54,2.31,.33,.20,.03,0x81a5a0);
      f.box(u+dx,1.32,2.45,2.4,.16,.72,0xdfb06e);
      for(let s=0;s<9;s++){
        const shade=s%2?0xffddb0:side>0?0xbd7544:0x547c6d;
        f.box(u+dx+(s-4)*.267,3.17,2.60,.271,.13,1.20,shade,.22);
        f.box(u+dx+(s-4)*.267,2.97,3.17,.271,.26,.12,shade);
      }
    }
    f.sign("매표소",u,3.76,2.35,3.12,.52,"#355354","#ffe6a3");
    for(const dx of [-2.84,2.84]){
      f.box(u+dx,2.1,2.25,.45,1.12,.09,bronze);
      f.box(u+dx,2.1,2.31,.35,1.00,.05,side>0?0xb46c55:0x53817a);
      for(let j=0;j<4;j++)f.box(u+dx,2.32-.15*j,2.345,.24,.030,.016,ivory);
    }
    for(const dx of [-3.12,3.12]){
      f.box(u+dx,2.05,2.17,.47,3.38,.38,stone);
      for(let j=0;j<6;j++)f.box(u+dx,.75+j*.51,2.28,.55,.07,.38,ivory);
    }
    const pillar=side*5.70;
    f.box(pillar,.40,0,1.72,.80,2.67,bronze);
    f.box(pillar,2.35,0,1.28,3.3,2.29,stone);
    f.box(pillar,3.94,0,1.65,.37,2.6,ivory);
    for(const v of [-1.03,1.03])for(const du of [-.33,.33])f.post(pillar+du,2.30,v,.17,3.1,.17,ivory);
    f.post(u,4.77,0,2.9,.87,2.9,stone);
    const dome=new T.LatheGeometry([new T.Vector2(1.71,0),new T.Vector2(1.67,.28),new T.Vector2(1.53,.60),
      new T.Vector2(1.24,.93),new T.Vector2(.83,1.17),new T.Vector2(.31,1.32),new T.Vector2(.08,1.40)],24);
    const foot=f.at(u,0);k.geo(dome,foot.x,4.91,foot.z,1,1,1,0x668d77);
    for(let i=0;i<12;i++){
      const ang=i*tau/12;
      for(const [r1,h1,r2,h2] of [[1.71,4.97,1.53,5.51],[1.53,5.51,1.24,5.84],[1.24,5.84,.81,6.08],[.81,6.08,.12,6.30]]){
        f.line([u+r1*Math.sin(ang),h1,r1*Math.cos(ang)],[u+r2*Math.sin(ang),h2,r2*Math.cos(ang)],.032,bronze);
      }
    }
    f.post(u,6.42,0,.10,1.22,.10,bronze);
    f.surface([[u,6.92,0],[u+1.02,6.70,.03],[u,6.46,0]],[0,1,2],side>0?0xc16451:0x408182);
  }
  const r=5.04,outer=6.27,base=3.94;
  for(let i=0;i<18;i++){
    const a=i*Math.PI/18+.003,b=(i+1)*Math.PI/18-.003;
    const angle=(radius,t,depth)=>[radius*Math.cos(t),base+radius*Math.sin(t)*.73,depth];
    for(const depth of [1.22,-1.22])f.surface([angle(r,a,depth),angle(outer,a,depth),angle(r,b,depth),angle(outer,b,depth)],
      [0,1,2,1,3,2],i%3===0?0xd2ae7d:i%3===1?0xe7c99c:0xe1c295);
    f.surface([angle(r,a,1.22),angle(r,a,-1.22),angle(r,b,1.22),angle(r,b,-1.22)],[0,1,2,1,3,2],0xc2a681);
    f.surface([angle(outer,a,1.22),angle(outer,a,-1.22),angle(outer,b,1.22),angle(outer,b,-1.22)],[0,1,2,1,3,2],bronze);
  }
  f.box(0,8.12,0,13,.92,2.50,bronze);
  f.box(0,8.20,0,12.61,.82,2.65,0x355859);
  f.sign("GYEONGJU WORLD",0,8.23,1.34,10.1,.86,"#345657","#ffdda1");
  const rear=frameTools(k,center.x,center.z,yaw+Math.PI);rear.sign("경주월드",0,8.23,1.34,6.7,.85,"#345657","#ffdda1");
  // A raised crest and a working park clock sit above the central marquee.
  const clockPoint=f.at(0,1.22),clock=new T.Group();clock.position.set(clockPoint.x,9.51,clockPoint.z);clock.rotation.y=yaw;
  const face=new T.Mesh(new T.CircleGeometry(1.07,32),new T.MeshBasicMaterial({color:0xffe8aa}));clock.add(face);
  const rim=new T.Mesh(new T.TorusGeometry(1.07,.105,6,40),new T.MeshStandardMaterial({color:bronze,roughness:.5}));clock.add(rim);
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,local=f.at(Math.sin(a)*.87,1.245);
    k.piece(local.x,9.51+Math.cos(a)*.87,local.z,.072,i%3?.12:.21,.055,iron,yaw,0,-a);
  }
  const handMaterial=new T.MeshStandardMaterial({color:iron}),hands=[];
  for(const length of [.55,.76]){
    const pivot=new T.Group(),hand=new T.Mesh(new T.BoxGeometry(.074,length,.05),handMaterial);
    hand.position.set(0,length*.45,.09);pivot.add(hand);clock.add(pivot);hands.push(pivot);
  }
  geometry.add(clock);
  for(let i=-9;i<=9;i++){
    const pos=f.at(i*.58,1.36);k.geo(glow.shape,pos.x,7.67,pos.z,.085,.085,.085,0xffd996,0,glow.material);
  }
  for(const side of [-1,1])for(let j=0;j<5;j++){
    const u=side*(1.26+j*.88);
    f.line([u,8.62,0],[u+side*.42,9.11,0],.06,bronze);
    f.line([u+side*.42,9.11,0],[u+side*.84,8.65,0],.06,bronze);
  }
  return hands;
}

function fountain(T,root,k,p,materials){
  k.polygon(polygonRing(p.x,p.z,17.8,17.8),.033,0xdac6a4,"pavers");
  for(const [inner,outer,color] of [[13.6,13.84,0x8f8071],[14.05,14.38,0xb08e66],[7.0,7.3,0x948878]]){
    const a=polygonRing(p.x,p.z,inner,inner),b=polygonRing(p.x,p.z,outer,outer);
    for(let i=0;i<a.length;i++){
      const n=(i+1)%a.length;k.face([a[i],a[n],b[i],b[n]].map(v=>[v.x,.052,v.z]),[0,1,2,2,1,3],color);
    }
  }
  const shell=new T.CylinderGeometry(1,1,1,48),group=new T.Group();
  group.name="분수광장";group.position.set(p.x,0,p.z);root.add(group);
  for(const [r,y,h,c] of [[5.75,.14,.28,0x998878],[5.54,.38,.32,stone],[5.66,.56,.15,ivory]]){
    k.geo(shell,p.x,y,p.z,r,h,r,c);
  }
  const basin=basinWater(T,{bed:[0x96c6be,0xaad1c6],tile:1.7,tint:0x55babe}),jets=jetWater(T);
  const pool=new T.Mesh(new T.CircleGeometry(5.30,48),basin);pool.rotation.x=-Math.PI/2;pool.position.y=.647;group.add(pool);materials.push(basin,jets);
  const bowl=new T.LatheGeometry([new T.Vector2(.24,.61),new T.Vector2(.77,.63),new T.Vector2(.93,.81),
    new T.Vector2(.48,1.11),new T.Vector2(.36,1.95),new T.Vector2(1.34,2.15),new T.Vector2(1.48,2.38),
    new T.Vector2(1.36,2.40),new T.Vector2(.37,2.16),new T.Vector2(.19,2.51)],32);
  k.geo(bowl,p.x,0,p.z,1,1,1,0xd9b477);
  const stream=jetTube(T,(t,v)=>v.set(4.45-3.18*t,.67+Math.sin(t*Math.PI)*2.24+.83*t,0),{from:.047,to:.09,segments:18});
  for(let i=0;i<10;i++)k.geo(stream,p.x,0,p.z,1,1,1,0xffffff,i*tau/10,jets);
  const plume=new T.Mesh(jetTube(T,(t,v)=>v.set(.01*t,t*1.81,.018*Math.sin(t*7)),{from:.11,to:.17}),jets);
  plume.position.y=2.45;group.add(plume);
  return plume;
}

function ridePortal(k,ride,glow,cone){
  const gate=ride.gate,yaw=Math.atan2(gate.x-ride.x,gate.z-ride.z),f=frameTools(k,gate.x,gate.z,yaw);
  const theme=regionOf(ride.id),[paint,accent]=palettes[theme],width=3.18;
  for(const side of [-1,1]){
    const u=side*width;
    f.box(u,.27,0,.85,.54,.9,stone);f.box(u,1.85,0,.42,2.9,.44,theme==="draken"?wood:paint);
    f.box(u,3.44,0,.69,.30,.68,accent);
    if(theme==="draken"){
      f.line([u,2.2,0],[side*(width-1.38),3.52,0],.12,wood);
      const cap=f.at(u,0);k.geo(cone,cap.x,4.0,cap.z,.38,.94,.38,accent);
    }else{
      const cap=f.at(u,0);k.geo(glow.shape,cap.x,3.82,cap.z,.17,.19,.17,0xffe2a5,0,glow.material);
    }
    // Side rails begin behind the boarding marker; the centre aisle stays clear.
    for(let j=0;j<=3;j++)f.post(u,.51,-j*1.55,.13,1.02,.13,paint);
    f.line([u,.91,0],[u,.91,-4.65],.068,accent);
    f.line([u,.49,0],[u,.49,-4.65],.043,paint);
  }
  f.box(0,3.26,0,6.7,.44,.46,paint);f.box(0,3.59,0,6.95,.14,.57,accent);
  f.sign(ride.name,0,3.28,.241,4.85,.65,"#294650","#ffdfa3");
  if(theme==="garden"){
    for(let i=-3;i<=3;i++){
      const loc=f.at(i*.73,0);
      k.crown(loc.x,3.79+(3-Math.abs(i))*.06,loc.z,.40,.21,.27,i%2?accent:paint);
    }
  }
}

function bench(k,seat,shade){
  const f=frameTools(k,seat.x,seat.z,-(seat.heading??0)*Math.PI/180);
  for(const side of [-1,1]){
    const u=side*.80;
    f.box(u,.22,0,.13,.44,.62,iron);f.line([u,.38,.22],[u,.91,.34],.05,iron);
    f.line([u,.63,-.25],[u,.63,.26],.046,iron);
    f.line([u,.42,-.19],[u,.62,-.24],.041,iron);
  }
  for(let j=0;j<4;j++)f.box(0,.46,j*.142-.22,2.15,.082,.127,0xab7f51);
  for(let j=0;j<3;j++)f.box(0,.59+j*.14,.26+j*.034,2.15,.112,.078,0x9e704c,-.18);
  if(!shade)return;
  f.post(0,1.43,.80,.105,2.86,.105,bronze);
  const radius=2.13;
  for(let i=0;i<8;i++){
    const a=i*tau/8,b=(i+1)*tau/8;
    const e=[radius*Math.sin(a),2.50,.80+radius*Math.cos(a)],n=[radius*Math.sin(b),2.50,.80+radius*Math.cos(b)];
    const color=i%2?0xf2cc95:0x67928c;
    f.surface([[0,3.12,.80],e,n],[0,1,2],color);
    f.surface([e,n,[e[0],2.36,e[2]],[n[0],2.36,n[2]]],[0,1,2,1,3,2],color);
    f.line([0,3.04,.80],e,.032,wood);
  }
}

function lantern(k,x,z,yaw,glow,theme){
  const f=frameTools(k,x,z,yaw),[paint,accent]=palettes[theme];
  f.post(0,.14,0,.41,.28,.41,iron);f.post(0,1.91,0,.14,3.58,.14,iron);
  f.line([0,3.50,0],[.68,3.86,0],.066,iron);f.line([.68,3.86,0],[.68,3.55,0],.045,iron);
  f.box(.68,3.14,0,.42,.12,.42,iron);f.box(.68,3.57,0,.47,.11,.47,iron);
  const p=f.at(.68,0);k.geo(glow.shape,p.x,3.37,p.z,.22,.25,.22,0xffe6b5,0,glow.material);
  f.line([.68,3.68,0],[.68,3.59,0],.055,accent);
  f.line([-.07,3.11,0],[-.88,3.11,0],.045,iron);
  f.box(-.49,2.56,0,.66,1.0,.035,paint);
  f.surface([[-.81,2.07,0],[-.17,2.07,0],[-.49,1.83,0]],[0,1,2],paint);
  f.box(-.49,2.40,.027,.23,.23,.03,accent,0,Math.PI/4);
}

function clearOfFeatures(layout,x,z,padding){
  const close=(p,r)=>Math.hypot(x-p.x,z-p.z)<r+padding;
  if(close(layout.parkEntrance,20)||close(layout.parkFountain,18.6))return false;
  if(layout.parkRides.some(ride=>close(ride.gate,7)||close(ride,ride.id==="coaster"?55:Math.max(ride.radius||0,13))))return false;
  if((layout.parkServices??[]).some(s=>Math.abs(x-s.x)<(s.w??12)*.56+padding&&Math.abs(z-s.z)<(s.d??8)*.56+padding))return false;
  if((layout.parkBenches??[]).some(s=>close(s,1.8)))return false;
  for(const path of layout.parkWalkways)for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
    if(Math.hypot(a.x+t*dx-x,a.z+t*dz-z)<4.5+padding)return false;
  }
  return true;
}

function plantPark(T,k,layout,glow){
  const rng=randomSeed(743802),cone=new T.ConeGeometry(1,1,8);
  const trees=makeTreeBuilder(T,null,{snapshotPart:k.treePart,registerCrownLod:registerDistrictLod,rand:rng,
    clearance:{meshFits:()=>true,trim:()=>true}});
  const petals=[0xf09b75,0xe3b441,0xe890ab,0xd4d8ac],used=[];
  let sequence=0;
  function free(x,z,r){
    return clearOfFeatures(layout,x,z,r)&&used.every(p=>Math.hypot(x-p.x,z-p.z)>p.r+r);
  }
  function flowerBed(x,z,yaw){
    const f=frameTools(k,x,z,yaw);
    f.box(0,.10,0,4.64,.20,1.81,stone);f.box(0,.228,0,4.40,.09,1.60,0x684b36);
    for(let i=0;i<7;i++){
      const u=(i-3)*.58;
      f.crown(u,.38,0,.47,.32,.64,i%3?0x619050:0x497d57);
      for(let j=0;j<3;j++)f.crown(u+(rng()-.5)*.53,.60+rng()*.14,(rng()-.5)*.9,.15,.12,.15,petals[(sequence+j%2)%petals.length]);
    }
  }
  for(const path of layout.parkWalkways)for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    const yaw=Math.atan2(dx,dz),samples=Math.max(1,Math.ceil(len/17));
    for(let j=0;j<samples;j++){
      const t=(j+.5)/samples,side=sequence%2?1:-1;sequence++;
      const px=a.x+t*dx,pz=a.z+t*dz,at=localFrame(px,pz,yaw);
      const lamp=at(side*5.4,0),zone=pz< -120?"draken":pz>20?"coast":"garden";
      if(sequence%2===1&&free(lamp.x,lamp.z,.45)){
        lantern(k,lamp.x,lamp.z,yaw,glow,zone);used.push({...lamp,r:.55});
      }
      const bed=at(-side*8.0,0);
      if(sequence%3!==1&&free(bed.x,bed.z,2.5)){
        flowerBed(bed.x,bed.z,yaw+Math.PI/2);used.push({...bed,r:2.55});
      }
      for(const v of [-1,1]){
        const slot=at(v*(12+rng()*5),(rng()-.5)*4);
        if(!free(slot.x,slot.z,3.5))continue;
        const style=["column","cloud","branchy","round","cone"][sequence%5],palette=["fresh","pine","amber","deep","olive"][sequence%5];
        trees.grow(slot.x,slot.z,{style,palette,height:4.9+rng()*3.3});used.push({...slot,r:3.4});
      }
    }
  }
  // Beyond the formal promenade, irregular groves frame nearby rides without masking their entrances.
  function pine(x,z,height){
    k.column(x,height*.32,z,.34,height*.64,.34,0x725b42);
    for(let j=0;j<3;j++){
      const radius=height*(.32-j*.064);
      k.geo(cone,x,height*(.52+j*.18),z,radius,height*(.65-j*.12),radius, [0x40684e,0x527757,0x64845a][j],j*.38);
    }
  }
  const edges=layout.parkBoundary;
  for(let i=0;i<edges.length;i++){
    const a=edges[i],b=edges[(i+1)%edges.length],length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.floor(length/13);
    for(let j=0;j<n;j++){
      const t=(j+.3+rng()*.45)/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
      if(!clearOfFeatures(layout,x,z,3))continue;
      if(x<6060&&j%4===0)continue;
      pine(x+(rng()-.5)*6,z+(rng()-.5)*6,4.8+rng()*5);
    }
  }
  for(let i=0;i<160;i++){
    const x=6004+rng()*462,z=-394+rng()*603;
    if(x<6020+Math.max(0,-z)*.30||!free(x,z,7))continue;
    if(i%3===0)pine(x,z,4.8+rng()*4.8);
    else{
      const h=4.5+rng()*5;k.column(x,h*.36,z,.31,h*.72,.31,0x786045);
      k.crown(x,h*.76,z,h*.32,h*.29,h*.31,0x66935d);
      k.crown(x+h*.16,h*.84,z+h*.10,h*.23,h*.21,h*.21,0x84a86a);
    }
    used.push({x,z,r:5});
  }
  for(const ride of layout.parkRides)ridePortal(k,ride,glow,cone);
}

function arrivalRoad(k,entrance){
  const f=frameTools(k,entrance.x,entrance.z,.68);
  const corners=(w,v,d)=>[f.at(-w,v),f.at(w,v),f.at(w,v+d),f.at(-w,v+d)];
  k.polygon(corners(142,28,10),-.08,0x7c8180);
  k.polygon(corners(123,39,59),-.09,0x939491);
  for(let i=-13;i<=13;i++)f.box(i*10,-.059,33,5,.017,.14,0xe9cf8a);
  for(let i=-2;i<=2;i++)f.box(i*1.1,-.046,33,.53,.018,8.7,0xe1ddd0);
  const cars=[0x71838c,0xc2c2b8,0xc1968a,0xd5d4c8,0x627876,0x985f53];
  for(let i=-14;i<=14;i++){
    const u=i*4.9;f.box(u,-.066,59,.10,.019,13.2,0xdedacb);
    if(i%4===0)continue;
    const v=58+(Math.abs(i)%3)*.38;
    f.box(u+2.5,.46,v,1.80,.66,4.03,cars[Math.abs(i)%cars.length]);
    f.box(u+2.5,.98,v+.12,1.58,.50,2.15,0x65747a);
    f.box(u+2.5,1.26,v+.26,1.60,.10,1.72,cars[Math.abs(i)%cars.length]);
  }
}

// Landmarks sit beside the main promenade. The directions are computed from the
// destinations, so the fingerboards keep pointing at their real entrances.
function wayfinding(k,layout){
  const destinations=[
    ["드라켄밸리",layout.parkRides.find(r=>r.id==="coaster")?.gate,"#814638"],
    ["위자드가든",layout.parkRides.find(r=>r.id==="carousel")?.gate,"#625582"],
    ["정문광장",layout.parkEntrance,"#3e716f"]
  ];
  for(const [x,z] of [[6407,101],[6349,0],[6271,-100]]){
    if(!clearOfFeatures(layout,x,z,.4))continue;
    k.column(x,1.67,z,.23,3.34,.23,0x496164);k.column(x,.17,z,.51,.34,.51,stone);
    for(const [i,[name,to,color]] of destinations.entries()){
      if(!to)continue;
      const yaw=Math.atan2(-(to.z-z),to.x-x),f=frameTools(k,x,z,yaw),y=2.99-i*.45;
      f.box(1.06,y,0,1.94,.40,.14,bronze);
      for(const v of [-.074,.074])f.surface([[1.98,y+.20,v],[2.33,y,v],[1.98,y-.20,v]],[0,1,2],bronze);
      f.sign(name,1.07,y,.078,1.75,.35,color,"#fff0d0");
      const label=f.at(1.07,-.078);
      k.sign(name,label.x,y,label.z,1.75,.35,yaw+Math.PI,color,"#fff0d0");
    }
  }
  // A stylised longship prow marks the turn into Draken Valley.
  const p=layout.parkRides.find(r=>r.id==="krake");
  if(!p)return;
  const shaft=localFrame(p.gate.x,p.gate.z,.4);
  const options=[shaft(12,5),shaft(-11,8),shaft(13,17),shaft(-20,-4)];
  const site=options.find(s=>clearOfFeatures(layout,s.x,s.z,5));
  if(!site)return;
  const f=frameTools(k,site.x,site.z,.52);
  f.box(0,.34,0,4.35,.68,2.2,0x82795e);
  f.box(0,.82,0,3.84,.32,1.62,bronze);
  const spine=[[-1.59,.98,0],[-.86,1.44,0],[-.33,2.23,0],[-.40,3.04,0],[-.94,3.64,0],[-1.15,4.17,0],[-.62,4.59,0],[.37,4.46,0],[.75,4.18,0]];
  for(let i=1;i<spine.length;i++)f.line(spine[i-1],spine[i],i<4?.34:.24,0x9f6a38);
  for(const side of [-1,1]){
    const v=side*.29;
    f.crown(-.50,4.48,v,.117,.125,.065,0xf1ca59);
    f.line([-.55,4.58,v],[-1.11,4.99,side*.52],.09,ivory);
    for(let i=0;i<3;i++)f.line([-.35-i*.18,2.58+i*.40,v],[-.97-i*.23,2.83+i*.38,v],.11,0xb59a59);
    for(let i=0;i<3;i++)f.crown(.05+i*.47,1.17,v*1.72,.33,.33,.06,i%2?0x706c44:0xa04835);
  }
  f.sign("드라켄밸리",0,.53,1.11,2.98,.45,"#4a3930","#ffdaa1");
}

// The historic district builder streams 90 m cells. This park is a single
// compact scene, so combine nearby equal-geometry instance buffers once.
function groupParkInstances(T,root){
  const buckets=new Map();
  for(const child of root.children){
    if(!child.isInstancedMesh)continue;
    const p=child.boundingSphere.center;
    const key=[child.geometry.id,child.material.id,Math.floor(p.x/240),Math.floor(p.z/240)].join("/");
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(child);
  }
  for(const parts of buckets.values()){
    if(parts.length<2)continue;
    const first=parts[0],count=parts.reduce((n,mesh)=>n+mesh.count,0);
    const joined=new T.InstancedMesh(first.geometry,first.material,count);
    joined.instanceColor=new T.InstancedBufferAttribute(new Float32Array(count*3),3);
    let offset=0;
    for(const mesh of parts){
      joined.instanceMatrix.array.set(mesh.instanceMatrix.array,offset*16);
      joined.instanceColor.array.set(mesh.instanceColor.array,offset*3);
      offset+=mesh.count;root.remove(mesh);mesh.dispose();
    }
    joined.matrixAutoUpdate=false;
    joined.receiveShadow=first.receiveShadow;joined.castShadow=first.castShadow;
    joined.userData.viewRange=first.userData.viewRange;joined.computeBoundingSphere();root.add(joined);
  }
}

export function buildParkLandscape(T,root,kit,layout){
  const scenery=new T.Group();scenery.name="경주월드 광장 · 보문호";root.add(scenery);
  const k=districtMeshes(scenery,{lod:true}),materials=[];
  const glow={shape:new T.IcosahedronGeometry(1,1),material:new T.MeshStandardMaterial({
    roughness:.52,color:0xffe6bd,emissive:0xffc978,emissiveIntensity:.12})};
  landscapeHorizon(T,scenery,k);bomunShore(T,scenery,k,materials);arrivalRoad(k,layout.parkEntrance);
  const hands=entrance(T,k,layout,glow,scenery);
  const plume=fountain(T,scenery,k,layout.parkFountain,materials);
  plantPark(T,k,layout,glow);wayfinding(k,layout);
  for(const [index,seat] of (layout.parkBenches??[]).entries())bench(k,seat,[3,5,9,12].includes(index));
  k.finish();groupParkInstances(T,scenery);
  for(const mesh of scenery.children){
    if(mesh.isInstancedMesh&&mesh.boundingSphere.center.x<5840)mesh.userData.viewRange=1150;
  }
  return (clock,night=0,camera)=>{
    const seconds=clock/1000;
    tickWater(materials,seconds%14400,night);
    plume.scale.y=1+.15*Math.sin(seconds*1.8);
    glow.material.emissiveIntensity=.10+night*1.9;
    const hours=seconds/3600+9;
    hands[0].rotation.z=-tau*(hours%12)/12;
    hands[1].rotation.z=-tau*(hours%1);
    if(camera)updateDistrictBatches(scenery,camera,1);
  };
}
