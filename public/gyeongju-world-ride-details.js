import {standSign} from "./regional-stands.js";

const tau=Math.PI*2,brass=0xc99048,gilt=0xe7bc65,cream=0xf8dcac,teal=0x32777b,iron=0x38484e;
const timber=0x825236,oak=0xac7545,red=0xa94f40,leather=0x443e3b,steel=0x778a8c;

// Bake the solid parts in each vehicle's own frame. The cabin, car and train
// groups stay independent so rider poses and the ride cameras follow them.
function rideWorkshop(T,kit){
  const white=new T.MeshStandardMaterial({vertexColors:true,roughness:.76,metalness:.12});
  const lamps=new T.MeshBasicMaterial({vertexColors:true,color:0xffffff});
  const sphere=new T.SphereGeometry(1,12,8),disc=new T.CylinderGeometry(1,1,1,32);
  const rings=new Map(),lit=new WeakSet(),v=new T.Vector3(),n=new T.Vector3(),nm=new T.Matrix3(),up=new T.Vector3(0,1,0);
  function batch(group){
    const parts=new Map();
    for(const m of [...group.children]){
      if(!m.isMesh||m.isInstancedMesh||!m.material.isMeshStandardMaterial||m.material.map||m.material.transparent||m.children.length)continue;
      const material=lit.has(m)?lamps:white;
      if(!parts.has(material))parts.set(material,{xyz:[],normals:[],colors:[],indices:[]});
      const {xyz,normals,colors,indices}=parts.get(material),color=m.material.color;
      const p=m.geometry.attributes.position,normal=m.geometry.attributes.normal,index=m.geometry.index,offset=xyz.length/3;
      m.updateMatrix();nm.getNormalMatrix(m.matrix);
      for(let i=0;i<p.count;i++){
        v.fromBufferAttribute(p,i).applyMatrix4(m.matrix);xyz.push(v.x,v.y,v.z);
        n.fromBufferAttribute(normal,i).applyNormalMatrix(nm);normals.push(n.x,n.y,n.z);colors.push(color.r,color.g,color.b);
      }
      for(let i=0;i<(index?.count??p.count);i++)indices.push(offset+(index?index.getX(i):i));
      group.remove(m);
    }
    for(const [material,part] of parts){
      const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(part.xyz,3));
      g.setAttribute("normal",new T.Float32BufferAttribute(part.normals,3));g.setAttribute("color",new T.Float32BufferAttribute(part.colors,3));
      g.setIndex(part.indices);g.computeBoundingSphere();const mesh=new T.Mesh(g,material);
      mesh.castShadow=mesh.receiveShadow=material===white;group.add(mesh);
    }
  }
  function tools(parent){
    function box(x,y,z,w,h,d,c,rx=0,ry=0,rz=0){
      const m=kit.box(c,x,y,z,w,h,d,parent);m.rotation.set(rx,ry,rz,"YXZ");return m;
    }
    function geo(geometry,x,y,z,w,h,d,c,rx=0,ry=0,rz=0){
      const m=kit.shape(geometry,c,x,y,z,parent);m.scale.set(w,h,d);m.rotation.set(rx,ry,rz,"YXZ");return m;
    }
    function beam(a,b,r,c){
      const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
      const m=kit.cylinder(c,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,v.length(),8,parent);
      m.quaternion.setFromUnitVectors(up,v.normalize());return m;
    }
    function ring(x,y,z,r,thickness,c,rx=0,ry=0){
      const ratio=thickness/r;
      if(!rings.has(ratio))rings.set(ratio,new T.TorusGeometry(1,ratio,6,r>5?64:32));
      return geo(rings.get(ratio),x,y,z,r,r,r,c,rx,ry);
    }
    const bulb=(x,y,z,w,h,d,c)=>{const m=geo(sphere,x,y,z,w,h,d,c);lit.add(m);return m;};
    return {box,beam,ring,bulb,oval:(...a)=>geo(sphere,...a),disc:(...a)=>geo(disc,...a)};
  }
  return {tools,batch,lamps};
}

function timeRider(T,work,{wheelBase,wheel,cabins}){
  const w=work.tools(wheel),base=work.tools(wheelBase),indigo=0x665175;
  base.disc(0,.075,0,12.72,.12,7.84,0xb29776);
  base.disc(0,.141,0,11.98,.025,7.36,0xcbaf86);
  for(const side of [-1,1]){
    base.box(side*8.25,.44,1.08,5.36,.62,1.66,0xc5ae8e);
    for(let j=-2;j<=2;j++){
      const x=side*8.25+j*.94;base.oval(x,.86,1.08,.61,.43,.62,0x617b51);
      for(const z of [.70,1.42])base.oval(x+.18,.89,z,.12,.14,.13,j%2?0xdf986b:0xe2bfb6);
    }
    for(const u of [3.4,7.6,11.4]){
      base.disc(side*u,.82,-5.0,.091,1.34,.091,teal);base.oval(side*u,1.50,-5,.16,.13,.16,gilt);
    }
    base.beam([side*3.4,1.26,-5],[side*11.4,1.26,-5],.059,brass);
    base.beam([side*3.4,.68,-5],[side*11.4,.68,-5],.050,teal);
  }
  for(const s of [-1,1]){
    w.ring(0,0,s*1.16,19.4,.10,brass);w.ring(0,0,s*1.22,4.2,.27,brass);
    w.disc(0,0,s*1.32,3.12,.42,3.12,indigo,Math.PI/2);
    w.ring(0,0,s*1.61,2.77,.19,gilt);
    for(let i=0;i<32;i++){
      const a=tau*i/32,b=a+tau/32,polar=(r,t,z)=>[r*Math.cos(t),r*Math.sin(t),z];
      w.box(...polar(3.27,a,s*1.4),.76,.37,.28,brass,0,0,a);
      const p=polar(23,a,s*1.26),q=polar(19.4,b,s*1.25);
      w.beam(p,q,.065,gilt);w.bulb(...p,.19,.19,.12,0xffdda0);
      if(i%2===0)w.beam(p,polar(4.32,a+tau/16,s*1.19),.095,brass);
    }
    base.disc(0,26,s*1.91,1.87,.38,1.87,brass,Math.PI/2);
    base.disc(0,26,s*2.14,1.56,.13,1.56,cream,Math.PI/2);
    for(let i=0;i<12;i++){
      const a=i*tau/12;base.box(Math.sin(a)*1.32,26+Math.cos(a)*1.32,s*2.23,.10,.27,.06,iron,0,0,-a);
    }
    base.beam([0,26,s*2.29],[s*.83,26.48,s*2.29],.092,iron);
    base.beam([0,26,s*2.30],[-s*.12,27.12,s*2.30],.066,red);
    for(const x of [-11,11]){
      base.disc(x,.39,s*4,1.04,.78,1.04,0xa79e86);base.ring(x,.75,s*4,.72,.09,brass,Math.PI/2);
    }
  }
  // Art Nouveau loading canopy sits entirely behind the path of the gondolas.
  for(const x of [-5.6,0,5.6]){
    for(const z of [2.45,5.15]){
      base.disc(x,3,z,.13,3.45,.13,teal);base.disc(x,1.62,z,.25,.50,.25,brass);
      for(const s of [-1,1])base.beam([x,3.65,z],[x+s*.83,4.53,z],.075,brass);
    }
    base.beam([x,4.55,2.22],[x,5.47,3.8],.1,cream);base.beam([x,5.47,3.8],[x,4.55,5.38],.1,cream);
  }
  for(const s of [-1,1])base.box(0,5.04,3.80+s*.83,12.45,.15,1.95,teal,s*.52);
  base.box(0,5.57,3.8,12.66,.20,.18,gilt);base.box(0,4.53,5.53,12.5,.26,.21,gilt);
  for(let i=0;i<5;i++)base.box(6.25+i*.37,.65-i*.13,3.8,.46,1.30-i*.26,2.22,0xc6aa85);
  standSign(T,wheelBase,"타임라이더","TIME RIDER",4.7,0,4.23,5.58,"#4e485d","#ffe4ab",.88);
  for(const cabin of cabins){
    const k=work.tools(cabin);
    k.oval(0,.49,0,1.30,.36,1.05,indigo);k.disc(0,.86,0,.19,.20,.19,brass);
    for(const s of [-1,1]){
      k.box(0,-1.13,s*1.018,2.38,.11,.065,brass);k.box(0,-.48,s*.98,2.28,.075,.065,gilt);
      k.box(0,.30,s*1.05,2.55,.09,.08,brass);
      for(const x of [-1.14,1.14])k.oval(x,-.56,s*.96,.10,.10,.10,gilt);
      k.box(s*1.218,-.76,0,.06,.14,1.40,brass);k.oval(s*1.249,-.76,0,.045,.17,.17,cream);
    }
    work.batch(cabin);
  }
  work.batch(wheelBase);work.batch(wheel);
}

function kingViking(T,work,{vikingBase,ship}){
  const k=work.tools(ship),base=work.tools(vikingBase);
  base.disc(0,.075,0,6.55,.12,10.40,0x99977a);
  base.disc(0,.142,0,5.68,.025,9.83,0x8a8a73);
  const hull=[[-8.62,.20,1.91],[-7.79,1.12,1.06],[-6.46,1.68,.44],[-4.98,1.94,.29],[0,1.97,.26],[4.98,1.94,.29],[6.46,1.68,.44],[7.79,1.12,1.06],[8.62,.20,1.91]];
  for(const side of [-1,1]){
    for(let j=1;j<hull.length;j++){
      const [az,aw,ah]=hull[j-1],[bz,bw,bh]=hull[j];
      for(let plank=0;plank<4;plank++){
        const w=1-plank*.032,y=-plank*.25;
        k.beam([side*aw*w,ah+y,az],[side*bw*w,bh+y,bz],plank===0?.13:.17,[gilt,oak,timber,0x6b4937][plank]);
      }
    }
    for(let i=-3;i<=3;i++){
      const z=i*1.45;k.disc(side*1.98,.07,z,.43,.09,.43,i%2?teal:red,0,0,Math.PI/2);
      k.ring(side*2.035,.07,z,.40,.036,gilt,0,Math.PI/2);
      k.disc(side*2.06,.07,z,.105,.10,.105,gilt,0,0,Math.PI/2);
      k.box(side*1.42,.46,z-.37,.08,.49,.12,brass);
    }
    base.disc(side*3,14,0,1.0,.53,1,brass,0,0,Math.PI/2);
    base.ring(side*3.30,14,0,.77,.09,iron,0,Math.PI/2);
    for(const end of [-1,1])base.disc(side*3,.24,end*7,.81,.48,.81,0xaf9a83);
    base.box(side*3.05,.49,0,2.18,.96,12,timber);
    for(let j=0;j<18;j++)base.box(side*3.05,.985,(j-8.5)*.65,2.23,.05,.60,oak);
    base.beam([side*4.02,2.02,-5.7],[side*4.02,2.02,5.7],.07,cream);
    for(const z of [-5.7,-3,0,3,5.7])base.beam([side*4.02,.95,z],[side*4.02,2.04,z],.09,iron);
    for(const end of [-1,1]){
      const x=side*4.92,z=end*6.33;
      base.oval(x,.56,z,.44,.62,.44,oak);
      for(const y of [.33,.74])base.ring(x,y,z,.404,.037,iron,Math.PI/2);
      base.disc(x,1.12,z,.34,.045,.34,timber);
      base.beam([side*3,11.6,end*1.24],[side*4.52,3.28,end*7.32],.047,brass);
      for(let i=1;i<=5;i++){
        const t=i/6,px=side*(3+1.52*t),py=11.6-8.32*t,pz=end*(1.24+6.08*t);
        base.box(px,py-.30,pz,.07,.62,.42,i%2?teal:red,-end*.36);
        base.box(px,py-.23,pz,.085,.085,.39,cream,-end*.36);
      }
    }
  }
  for(let i=-3;i<=3;i++){
    const z=i*1.45;k.beam([-1.4,.62,z-.37],[1.4,.62,z-.37],.072,leather);
    k.box(0,.44,z+.22,2.95,.32,.09,0x76553d);
  }
  for(const end of [-1,1]){
    k.beam([0,1.65,end*8.28],[0,2.78,end*8.77],.26,brass);
    k.oval(0,2.95,end*8.84,.30,.43,.48,gilt,-end*.28);
    k.oval(0,2.86,end*9.22,.24,.18,.44,gilt);
    k.beam([0,3.16,end*8.72],[0,3.62,end*8.46],.09,oak);
    for(const s of [-1,1])k.oval(s*.268,3.01,end*8.88,.048,.07,.07,iron);
    k.beam([0,1.5,end*7.15],[0,1.78,end*8.25],.12,gilt);
  }
  work.batch(ship);work.batch(vikingBase);
}

function bumperPavilion(T,work,{arena,cars}){
  const k=work.tools(arena),paint=[red,0x4caab5,0xe8ba66,0x8269a3,0x7c9a6e];
  for(const r of [3.15,3.32,8.92])k.ring(0,.165,0,r,.024,0x84928c,Math.PI/2);
  for(let i=0;i<24;i++){
    const a=i*tau/24,r=8.56,s=Math.sin(a),c=Math.cos(a);
    k.box(s*r,.168,c*r,.095,.006,.42,0xc3ac81,0,a+.49);
  }
  for(const [r,y,tint,size] of [[10.42,.37,leather,.18],[10.52,.68,brass,.07],[10.83,4.48,teal,.14],[10.83,5.01,red,.13],[5.0,4.40,steel,.04]]){
    k.ring(0,y,0,r,size,tint,Math.PI/2);
  }
  for(let i=0;i<48;i++){
    const a=i*tau/48,c=Math.cos(a),s=Math.sin(a),tint=i%2?0xffbc73:0xa4e5de;
    k.bulb(10.89*c,4.73,10.89*s,.105,.17,.105,tint);
    if(i%4===0){
      k.beam([0,4.4,0],[10.5*c,4.4,10.5*s],.046,steel);
      k.beam([10.5*c,3.54,10.5*s],[9.46*c,4.43,9.46*s],.065,brass);
      k.disc(10.55*c,.63,10.55*s,.26,.90,.26,teal);
    }
  }
  // Fine overhead contact lines align with the pickup pole on each car.
  for(let i=-4;i<=4;i++){
    const p=i*1.90,len=Math.sqrt(10.32*10.32-p*p);
    k.beam([p,4.36,-len],[p,4.36,len],.014,steel);k.beam([-len,4.36,p],[len,4.36,p],.014,steel);
  }
  k.disc(0,5.06,0,1.07,.40,1.07,red);
  const sign=new T.Group();sign.rotation.y=1.18;arena.add(sign);
  standSign(T,sign,"범퍼카","BUMPER CARS",5.0,0,4.81,11.04,"#295b63","#ffe6ac",1.02);
  for(const [i,car] of cars.entries()){
    const c=work.tools(car),t=paint[i%paint.length];
    c.oval(0,.49,-.40,.71,.28,.56,t);c.oval(0,.38,.44,.70,.25,.40,t);
    c.box(0,.71,-.62,.15,.032,.46,cream,-.26);
    c.oval(0,.64,.09,.43,.075,.40,leather);
    c.oval(0,.80,.40,.44,.24,.14,leather);c.oval(0,1.00,.38,.27,.09,.12,t);
    for(const s of [-1,1]){
      c.oval(s*.47,.55,-.75,.14,.09,.069,cream);c.bulb(s*.47,.55,-.786,.10,.065,.045,0xffdfaa);
      c.oval(s*.46,.45,.74,.16,.071,.055,0x8e3f35);c.bulb(s*.46,.45,.768,.10,.047,.043,0xef7158);
      c.box(s*.677,.43,-.02,.05,.07,.93,gilt);c.oval(s*.70,.68,.15,.075,.07,.34,t);
    }
    c.ring(0,.245,0,.912,.066,leather,Math.PI/2);c.ring(0,.31,0,.863,.023,steel,Math.PI/2);
    c.beam([0,.53,-.42],[0,.81,-.275],.049,iron);c.ring(0,.80,-.27,.202,.036,iron,-.64);
    c.beam([-.16,.83,-.30],[.16,.83,-.30],.024,steel);c.beam([0,.80,-.28],[0,.66,-.18],.023,steel);
    c.beam([.28,1.84,.58],[.28,4.17,.70],.025,steel);c.beam([.15,4.18,.70],[.42,4.18,.70],.05,iron);
    work.batch(car);
  }
  work.batch(arena);
}

function draken(T,work,{coaster,track,train}){
  const k=work.tools(coaster),v=work.tools(train),trackSteel=0x946e44,rail=0x657172;
  function frame(t){
    const p=track.getPoint(t),tangent=track.getTangent(t),len=Math.hypot(tangent.x,tangent.z)||1;
    return (side,y)=>[p.x+side*tangent.z/len,p.y+y,p.z-side*tangent.x/len];
  }
  // The far side is kept clear of the riders' crest and drop sightline.
  const length=track.getLength(),ties=Math.ceil(length/2.38);
  let prev=null;
  for(let i=0;i<=ties;i++){
    const t=track.getUtoTmapping((i%ties)/ties),at=frame(t),onLift=t>0&&t<.245;
    if(i<ties){
      k.beam(at(-.78,-.14),at(.78,-.14),.116,trackSteel);
      if(i%2===0)k.beam(at(-.59,-.20),at(0,-.81),.11,trackSteel);
      else k.beam(at(.59,-.20),at(0,-.81),.11,trackSteel);
      if(onLift){
        k.beam(at(1.06,-.30),at(2.0,-.30),.09,rail);
        k.beam(at(1.97,-.35),at(1.97,.89),.058,rail);
        k.beam(at(-.22,-.12),at(.22,-.12),.108,iron);
      }
    }
    if(prev){
      k.beam(prev.at(0,-.83),at(0,-.83),.205,trackSteel);
      if(onLift&&prev.onLift){
        for(const side of [1.14,1.38,1.64,1.89])k.beam(prev.at(side,-.30),at(side,-.30),.122,rail);
        k.beam(prev.at(1.97,.89),at(1.97,.89),.054,cream);
        k.beam(prev.at(1.97,.46),at(1.97,.46),.040,rail);
        k.beam(prev.at(0,-.17),at(0,-.17),.106,iron);
      }
    }
    prev={at,onLift};
  }
  const origin=track.getPoint(0),direction=track.getTangent(0),station=new T.Group();
  station.position.copy(origin);station.rotation.y=Math.atan2(-direction.x,-direction.z);coaster.add(station);
  const s=work.tools(station),roof=0x4d6968;
  for(const side of [-1,1]){
    const x=side*3.34;s.box(x,-.22,0,2.48,.44,9.4,0x9c8874);
    for(const z of [-4.18,0,4.18]){
      for(const offset of [-.86,.86]){
        const foot=x+offset;s.box(foot,-1.73,z,.26,3.05,.26,iron);
        s.box(foot,-2.87,z,.61,.52,.64,0xb4a48a);
      }
      s.beam([x-.86,-2.55,z],[x+.86,-.42,z],.088,rail);
      s.box(x,-.48,z,2.41,.24,.27,rail);
    }
    for(const z of [-4.18,0])s.beam([x+side*.86,-2.58,z],[x+side*.86,-.48,z+4.18],.085,rail);
    for(let j=0;j<18;j++)s.box(x,.025,(j-8.5)*.51,2.41,.052,.48,j%3?oak:timber);
    s.box(side*2.18,.078,0,.16,.05,9.4,gilt);
    for(const z of [-4.38,0,4.38]){
      s.box(side*4.44,1.84,z,.23,3.77,.23,iron);
      s.beam([side*4.44,2.56,z],[side*3.15,3.95,z],.13,oak);
      s.beam([side*4.46,3.70,z],[0,5.09,z],.15,gilt);
    }
    s.box(side*2.40,4.46,0,5.04,.20,10.16,roof,0,0,-side*.30);
    s.box(side*4.68,3.72,0,.16,.30,10.19,oak);
    for(const z of [-3.05,-1.52,0,1.52,3.05]){
      s.box(side*2.37,.50,z,.09,1.02,.11,rail);
      s.beam([side*2.37,.93,z],[side*2.37,.93,z+1.06],.055,brass);
      s.beam([side*2.37,.48,z],[side*2.37,.48,z+1.06],.035,rail);
    }
    for(const z of [-3.55,1.25])s.bulb(side*3.30,3.68,z,.14,.13,.18,0xffdf9a);
    for(const z of [-3.7,-1.85,0,1.85,3.7])s.disc(side*.90,-.30,z,.26,.15,.26,leather,0,0,Math.PI/2);
  }
  s.box(0,5.20,0,.24,.25,10.30,gilt);
  for(let i=0;i<13;i++){
    const y=-.12-i*.22;s.box(3.3,y-.11,4.83+i*.34,2.06,.22,.39,0xb79772);
  }
  s.beam([4.35,.98,4.83],[4.35,-1.69,8.91],.07,brass);
  s.beam([2.25,.98,4.83],[2.25,-1.69,8.91],.07,brass);
  standSign(T,station,"드라켄","DRAKEN VALLEY",3.77,0,4.14,5.05,"#514644","#f4ca81",.87);
  for(let row=0;row<3;row++){
    const z=row*1.02;
    for(const side of [-1,1]){
      v.box(side*1.65,.13,z,.13,.34,.91,red);v.box(side*1.70,.15,z,.045,.051,.81,gilt);
      v.disc(side*.72,-.37,z,.22,.16,.22,leather,0,0,Math.PI/2);
      v.disc(side*.82,-.37,z,.097,.045,.097,steel,0,0,Math.PI/2);
    }
    v.beam([-.79,-.37,z],[.79,-.37,z],.12,iron);
    for(let col=0;col<4;col++){
      const x=(col-1.5)*.76;
      v.oval(x,.19,z-.035,.285,.095,.285,leather);
      v.oval(x,.83,z+.29,.24,.18,.12,red);
      v.box(x,.065,z-.28,.46,.05,.25,steel);
      for(const side of [-1,1]){
        const sx=x+side*.195;
        v.beam([sx,.78,z+.22],[sx,.78,z+.01],.047,gilt);
        v.beam([sx,.78,z+.01],[sx,.43,z-.21],.060,leather);
      }
      v.beam([x-.195,.43,z-.21],[x+.195,.43,z-.21],.044,gilt);
    }
  }
  v.box(0,.07,-.52,3.32,.32,.19,red);v.box(0,.13,-.624,2.58,.08,.029,gilt);
  for(const side of [-1,1])v.bulb(side*1.37,.12,-.628,.096,.058,.032,0xffd890);
  work.batch(train);work.batch(station);work.batch(coaster);
}

export function addRideDetails(T,kit,objects){
  const work=rideWorkshop(T,kit);
  timeRider(T,work,objects);kingViking(T,work,objects);bumperPavilion(T,work,objects);draken(T,work,objects);
  return (_clock,night=0)=>{work.lamps.color.setScalar(.76+.54*night);};
}
