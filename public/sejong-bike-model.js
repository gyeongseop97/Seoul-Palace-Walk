import {addObstacle,platformAt} from "./layout.js";
import {bikeDocks,bikePassengerOffset,bikeRackSize} from "./sejong-bike.js";

const tau=Math.PI*2;
const sides=[-1,1];
const axleY=.29,wheelbase=.54;
const silver=0xdadfd6,green=0x39ad66,deepGreen=0x1e6f4b,rubber=0x232c29;
const steel=0x74837e,black=0x25332f;
const modelCache=new WeakMap();
const dockSurfaces=new WeakMap();
// Finished paving levels under each rack, including the flush street and garden paths.
const dockPaving={
  "city-hall":.039,"cheonggye":.061,"gwanghwamun":.025,"gyeongbokgung":.020,
  "jeongdong-fountain":.044,"seoul-plaza":.039,"city-council":.039,"culture-shelter":.025,
  "plaza-east":.016,"palace-museum":.008,"folk-museum":.017
};
const dockLevel=dock=>Math.max(dockPaving[dock.id]??.024,platformAt(dock.x,dock.y));

// Positions in metres in the rider group's coordinates. Positive Z points forward.
export const bikeFit={saddleY:.59,gripX:.255,gripY:.89,gripZ:.40,crankY:.41,crankZ:.13,pedalX:.17,pedalRadius:.103};
export const bikeRearFit={saddleY:.62,pegX:.194,pegY:.25,pegForward:.29};

export function bikePedal(side,angle){
  const phase=side<0?angle:angle+Math.PI;
  return {x:side*bikeFit.pedalX,y:bikeFit.crankY+Math.cos(phase)*bikeFit.pedalRadius,
    z:bikeFit.crankZ+Math.sin(phase)*bikeFit.pedalRadius};
}

function bikeParts(T){
  if(modelCache.has(T))return modelCache.get(T);
  const unit=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,8),sphere=new T.SphereGeometry(1,12,8);
  const up=new T.Vector3(0,1,0),transform=new T.Object3D();
  const v=coords=>new T.Vector3(...coords);
  const piece=(geometry,color,position,scale=[1,1,1],rotation=[0,0,0])=>{
    transform.position.fromArray(position);transform.scale.fromArray(scale);transform.rotation.fromArray(rotation);
    transform.updateMatrix();return {geometry,color,matrix:transform.matrix.clone()};
  };
  const block=(position,size,color)=>piece(unit,color,position,size);
  const ball=(position,size,color)=>piece(sphere,color,position,size);
  function rod(start,end,radius,color){
    const a=v(start),b=v(end),axis=b.clone().sub(a),length=axis.length();
    transform.position.copy(a).lerp(b,.5);transform.scale.set(radius,length,radius);
    transform.quaternion.setFromUnitVectors(up,axis.normalize());transform.updateMatrix();
    return {geometry:cylinder,color,matrix:transform.matrix.clone()};
  }
  function bend(points,radius,color){
    return piece(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v)),12,radius,7,false),color,[0,0,0]);
  }
  function ring(radius,width,color,y,z,arc=tau){
    return piece(new T.TorusGeometry(radius,width,7,36,arc),color,[0,y,z],[1,1,1],[0,Math.PI/2,0]);
  }
  // Bake the painted parts once, so each rider needs only the frame and moving-part meshes.
  function combine(parts){
    let vertices=0,corners=0;
    for(const {geometry} of parts){
      vertices+=geometry.attributes.position.count;
      corners+=geometry.index?.count??geometry.attributes.position.count;
    }
    const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),colors=new Float32Array(vertices*3);
    const indices=new Uint16Array(corners),vertex=new T.Vector3(),normalMatrix=new T.Matrix3(),tint=new T.Color();
    let vertexOffset=0,indexOffset=0;
    for(const {geometry,color,matrix} of parts){
      const {position,normal}=geometry.attributes;
      normalMatrix.getNormalMatrix(matrix);tint.setHex(color);
      for(let i=0;i<position.count;i++){
        const offset=(vertexOffset+i)*3;
        vertex.fromBufferAttribute(position,i).applyMatrix4(matrix).toArray(positions,offset);
        vertex.fromBufferAttribute(normal,i).applyNormalMatrix(normalMatrix).toArray(normals,offset);
        tint.toArray(colors,offset);
      }
      const count=geometry.index?.count??position.count;
      for(let i=0;i<count;i++)indices[indexOffset+i]=vertexOffset+(geometry.index?.getX(i)??i);
      vertexOffset+=position.count;indexOffset+=count;
    }
    const result=new T.BufferGeometry();
    result.setAttribute("position",new T.BufferAttribute(positions,3));
    result.setAttribute("normal",new T.BufferAttribute(normals,3));
    result.setAttribute("color",new T.BufferAttribute(colors,3));
    result.setIndex(new T.BufferAttribute(indices,1));
    result.computeBoundingSphere();
    return result;
  }

  const {saddleY,gripX,gripY,gripZ,crankY,crankZ,pedalX,pedalRadius}=bikeFit;
  const wheel=[ring(.265,.025,rubber,0,0),ring(.240,.019,green,0,0),ring(.223,.006,deepGreen,0,0),
    rod([-.064,0,0],[.064,0,0],.036,steel)];
  for(let i=0;i<12;i++){
    const angle=tau*i/12;
    wheel.push(rod([i%2?.026:-.026,0,0],[0,.236*Math.cos(angle),.236*Math.sin(angle)],.0034,0x9aa5a0));
  }
  wheel.push(block([0,.20,.09],[.035,.055,.022],0xe5aa58));
  const frame=[
    bend([[0,.69,.47],[0,.60,.45],[0,.48,.36],[0,.43,.26],[0,crankY,crankZ]],.043,silver),
    rod([0,crankY,crankZ],[0,.55,-.032],.038,silver),
    rod([0,.515,.002],[0,.558,-.032],.023,steel),
    ball([0,saddleY-.032,-.028],[.119,.032,.148],black),
    ball([0,saddleY-.028,.061],[.063,.027,.098],rubber),
    ring(.304,.025,green,axleY,-wheelbase,Math.PI),
    block([0,.555,-.559],[.224,.046,.39],deepGreen),
    block([0,.583,-.604],[.146,.029,.205],0x47765e),
    block([0,.522,-.756],[.126,.052,.043],0xb84038),
    rod([-.05,crankY,crankZ],[.05,crankY,crankZ],.052,deepGreen),
    bend([[0,.637,.457],[.045,.629,.41],[.048,.540,.35],[.048,.48,.274]],.005,black),
    block([.036,.501,.264],[.012,.031,.153],green)
  ];
  for(const side of sides){
    frame.push(rod([side*.052,axleY,-wheelbase],[side*.066,crankY,crankZ],.022,silver),
      rod([side*.064,axleY,-wheelbase],[side*.036,.516,.002],.023,silver),
      rod([side*.105,.558,-.405],[side*.056,.291,-.54],.012,steel),
      rod([side*.105,.559,-.735],[side*.105,.559,-.352],.012,silver));
  }
  const rearZ=-bikePassengerOffset;
  const rear=[block([0,.555,rearZ+.10],[.22,.057,.33],deepGreen),
    block([0,bikeRearFit.saddleY-.026,rearZ],[.323,.052,.335],black),
    ball([0,bikeRearFit.saddleY-.022,rearZ-.036],[.164,.028,.117],rubber)];
  for(const side of sides){
    const x=side*bikeRearFit.pegX,z=rearZ+bikeRearFit.pegForward;
    rear.push(rod([side*.06,axleY,-wheelbase],[x,bikeRearFit.pegY,z],.021,steel),
      rod([side*.11,.58,rearZ-.13],[side*.062,axleY,-wheelbase],.018,silver),
      block([x,bikeRearFit.pegY,z],[.114,.023,.09],black));
  }
  const steerZ=.47,steerY=.69;
  const front=[
    rod([0,-.029,0],[0,gripY-steerY,0],.022,steel),
    rod([-.084,gripY-steerY,0],[.084,gripY-steerY,0],.020,silver),
    ring(.304,.021,green,axleY-steerY,wheelbase-steerZ,Math.PI),
    block([0,.663-steerY,.609-steerZ],[.268,.026,.202],black),
    block([0,.651-steerY,.736-steerZ],[.118,.046,.025],0xe1e2bf)
  ];
  for(const side of sides){
    front.push(bend([[side*.084,gripY-steerY,0],[side*.15,gripY-steerY,.005],
      [side*.205,gripY-steerY,gripZ-steerZ]],.018,silver),
    rod([side*.193,gripY-steerY,gripZ-steerZ],[side*(gripX+.029),gripY-steerY,gripZ-steerZ],.026,black),
    rod([side*.057,-.007,-.007],[side*.061,axleY-steerY,wheelbase-steerZ],.027,silver),
    rod([side*.129,.817-steerY,.505-steerZ],[side*.139,.817-steerY,.721-steerZ],.015,black));
    for(const z of [.515,.565,.615,.665,.717])front.push(
      rod([side*.114,.667-steerY,z-steerZ],[side*.139,.816-steerY,z-steerZ],.006,black));
  }
  for(const z of [.509,.724]){
    front.push(rod([-.137,.817-steerY,z-steerZ],[.137,.817-steerY,z-steerZ],.016,black));
    for(const x of [-.098,-.049,0,.049,.098])front.push(rod([x,.666-steerY,z-steerZ],[x,.817-steerY,z-steerZ],.006,black));
  }
  const crank=sides.map(side=>rod([side*.050,0,0],[side*pedalX,-side*pedalRadius,0],.014,steel));
  const pedal=[block([0,0,0],[.124,.022,.078],black),block([0,0,.040],[.095,.017,.006],0xe0a350)];
  const rack=[block([0,.055,0],[3.93,.11,.15],0x969d94),block([0,.055,.59],[3.93,.11,.15],0x969d94)];
  for(const x of [-1.40,-.47,.47,1.40])for(const side of sides)rack.push(
    bend([[x+side*.128,.10,.30],[x+side*.128,.31,.36],[x+side*.128,.43,.57],
      [x+side*.128,.31,.76],[x+side*.128,.10,.80]],.026,steel));
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.69,metalness:.055});
  const result={wheel:combine(wheel),frame:combine(frame),rear:combine(rear),front:combine(front),crank:combine(crank),pedal:combine(pedal),
    rack:combine(rack),material,steerY,steerZ};
  modelCache.set(T,result);return result;
}

function paintedMesh(T,geometry,material){
  const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

export function makeRidingBike(T,{rearSeat=false}={}){
  const parts=bikeParts(T),group=new T.Group(),front=new T.Group(),crank=new T.Group();
  const frame=paintedMesh(T,parts.frame,parts.material),backWheel=paintedMesh(T,parts.wheel,parts.material);
  const frontWheel=paintedMesh(T,parts.wheel,parts.material);
  group.name="따릉이";
  backWheel.position.set(0,axleY,-wheelbase);
  front.position.set(0,parts.steerY,parts.steerZ);
  frontWheel.position.set(0,axleY-parts.steerY,wheelbase-parts.steerZ);
  front.add(paintedMesh(T,parts.front,parts.material),frontWheel);
  crank.position.set(0,bikeFit.crankY,bikeFit.crankZ);
  crank.add(paintedMesh(T,parts.crank,parts.material));
  const pedals=sides.map(side=>{
    const pedal=paintedMesh(T,parts.pedal,parts.material);
    pedal.position.set(side*bikeFit.pedalX,-side*bikeFit.pedalRadius,0);crank.add(pedal);
    return pedal;
  });
  group.add(frame,backWheel,front,crank);
  if(rearSeat){
    const seat=paintedMesh(T,parts.rear,parts.material);
    seat.name="따릉이 뒷좌석";group.add(seat);
  }
  let wheelAngle=0,pedalAngle=0;
  return {group,get pedalAngle(){return pedalAngle;},update(travel,steer=0){
    wheelAngle=(wheelAngle+travel/axleY)%tau;pedalAngle=(pedalAngle+travel*tau/2.6)%tau;
    frontWheel.rotation.x=backWheel.rotation.x=wheelAngle;
    front.rotation.y=steer;crank.rotation.x=pedalAngle;
    for(const pedal of pedals)pedal.rotation.x=-pedalAngle;
    return pedalAngle;
  }};
}

function dockSign(T){
  const canvas=document.createElement("canvas");canvas.width=384;canvas.height=192;
  const context=canvas.getContext("2d");
  context.fillStyle="#e7eed8";context.fillRect(0,0,384,192);
  context.fillStyle="#176447";context.fillRect(7,7,370,178);
  context.textAlign="center";context.textBaseline="middle";context.fillStyle="#f2f6dd";
  context.font="700 74px sans-serif";context.fillText("따릉이",192,74);
  context.font="600 30px sans-serif";context.fillText("대여 · 반납",192,146);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map:texture,roughness:.84});
}

export function registerBikeDocks(docks=bikeDocks){
  for(const dock of docks){
    if(dockSurfaces.has(dock))continue;
    // Capture the sidewalk before the rack itself appears in platform queries.
    const level=dockLevel(dock);
    dockSurfaces.set(dock,level);
    addObstacle(dock.x,dock.y,bikeRackSize.width,bikeRackSize.depth,Math.PI-dock.heading*Math.PI/180,level+1.49);
  }
}

export function buildBikeDocks(T,scene,{wx,wz,box,cylinder},{docks=bikeDocks,register=true,height=()=>0}={}){
  if(register)registerBikeDocks(docks);
  const parts=bikeParts(T),signMaterial=parts.dockSign??=dockSign(T),signPanel=new T.PlaneGeometry(.76,.38);
  for(const dock of docks){
    const group=new T.Group(),angle=Math.PI-dock.heading*Math.PI/180;
    group.name=dock.name;
    const level=(dockSurfaces.get(dock)??dockLevel(dock))+height(dock);
    group.position.set(wx(dock.x),level,wz(dock.y));group.rotation.y=angle;
    scene.add(group);
    group.add(paintedMesh(T,parts.rack,parts.material));
    for(const x of [-1.40,-.47,1.40]){
      const {group:parked}=makeRidingBike(T);
      parked.position.x=x;group.add(parked);
    }
    cylinder(0x759186,1.61,.62,-.61,.043,1.24,8,group);
    box(deepGreen,1.61,1.30,-.61,.80,.42,.058,group);
    for(const side of sides){
      const sign=new T.Mesh(signPanel,signMaterial);
      sign.position.set(1.61,1.30,-.61+side*.031);sign.rotation.y=side<0?Math.PI:0;
      group.add(sign);
    }
  }
}
