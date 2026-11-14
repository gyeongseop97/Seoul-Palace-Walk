import {addObstacle} from "./layout.js";
import {BUS_COUNT, BUS_FLOOR, BUS_LENGTH, BUS_SEATS, BUS_WIDTH, busAt, busLocalPose, busSeatOffset, busStops} from "./sejong-bus.js";

export function buildSejongBusModels(T,scene,kit,height=()=>0,shelterHeight=height){
  const {wx,wz,box,matte}=kit;
  const stopGroup=new T.Group();stopGroup.name="세종대로 순환버스 정류장";scene.add(stopGroup);
  const busGroup=new T.Group();busGroup.name="세종대로 순환버스";scene.add(busGroup);
  const signBackground="#15253b",lightInk="#fff0be";

  function placard(text,width,height,{background=signBackground,ink=lightInk,sub=""}={}){
    const material=new T.MeshBasicMaterial({color:0x17304d,toneMapped:false});
    if(typeof document!=="undefined"){
      const canvas=document.createElement("canvas");canvas.width=640;canvas.height=sub?180:120;
      const ctx=canvas.getContext("2d");
      if(ctx){
        ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle=ink;ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.font='700 64px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
        ctx.fillText(text,320,sub?55:61,612);
        if(sub){ctx.font='500 37px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';ctx.fillText(sub,320,126,602);}
        material.color.set(0xffffff);material.map=new T.CanvasTexture(canvas);material.map.colorSpace=T.SRGBColorSpace;
      }
    }
    return new T.Mesh(new T.PlaneGeometry(width,height),material);
  }

  const shelterGlass=new T.MeshStandardMaterial({color:0x92b4bd,transparent:true,opacity:.27,roughness:.42,depthWrite:false});
  const shade=0x5f686b,roofColor=0xb1b6b8,blue=0x305ca8;
  for(const stop of busStops){
    const shelter=new T.Group();shelter.name=stop.name;
    shelter.position.set(wx(stop.shelter.x),shelterHeight(stop.shelter),wz(stop.shelter.y));shelter.rotation.y=(180-stop.shelter.heading)*Math.PI/180;
    stopGroup.add(shelter);
    const part=(color,x,y,z,w,h,d)=>box(color,x,y,z,w,h,d,shelter);
    part(shade,0,.12,-.49,5.36,.20,.16);
    part(shade,0,2.31,-.49,5.36,.10,.10);
    const pane=part(0xffffff,0,1.27,-.49,5.30,2.03,.055);pane.material=shelterGlass;
    for(const x of [-2.61,0,2.61])part(shade,x,1.32,-.49,.08,2.57,.10);
    for(const x of [-2.61,2.61]){
      part(shade,x,1.31,.61,.08,2.57,.09);
      part(shade,x,.34,.06,.073,.065,1.16);
    }
    part(roofColor,0,2.68,.08,5.64,.14,1.58);
    part(shade,0,2.585,.06,5.72,.058,1.67);
    part(0x826b53,-.58,.477,-.18,2.85,.085,.41);
    for(const x of [-1.69,.52])part(shade,x,.239,-.18,.081,.46,.36);
    part(blue,2.26,2.23,.03,.57,.56,.20);
    const type=placard("버스",.49,.30,{background:"#305ca8",ink:"#fff9e7"});type.position.set(2.26,2.23,.136);shelter.add(type);
    const name=placard(stop.name,4.24,.42,{sub:stop.direction});name.position.set(-.37,2.40,.925);shelter.add(name);
    const routes=placard("세종대로 순환버스",1.33,.59,{sub:"덕수궁 · 광화문광장 · 경복궁"});
    routes.position.set(1.35,1.53,-.45);shelter.add(routes);
    const obstacle=(side,forward,width,depth,height)=>{
      const p=busLocalPose(stop.shelter,side,forward);
      addObstacle(p.x,p.y,width,depth,shelter.rotation.y,height);
    };
    obstacle(0,-.49,5.33,.10,2.33);
    obstacle(-.58,-.18,2.86,.41,.54);
    for(const x of [-2.61,2.61])obstacle(x,.61,.11,.13,2.64);
  }

  // The east end of Sajik-ro widens beside the north edge of the existing bus island.
  box(0x42464b,wx(648.2),-.019,wz(-826.4),64,.023,4.9,stopGroup);
  box(0x42464b,wx(668.3),-.022,wz(-834.2),15.8,.019,17.8,stopGroup);
  for(const [x,y] of [[625,-827.9],[631,-827.0],[638,-826.9],[656,-826.9],[663,-827.2]]){
    box(0xd0cec2,wx(x),-.0003,wz(y),3.2,.016,.083,stopGroup);
  }

  const transform=new T.Object3D(),unit=new T.BoxGeometry(1,1,1);
  const tireShape=new T.CylinderGeometry(.465,.465,.28,15).rotateZ(Math.PI/2);
  const wheelHub=new T.CylinderGeometry(.258,.258,.294,12).rotateZ(Math.PI/2);
  const hubNut=new T.CylinderGeometry(.111,.111,.319,8).rotateZ(Math.PI/2);
  const windowGlass=new T.MeshStandardMaterial({color:0x7ba5b4,transparent:true,opacity:.29,roughness:.44,depthWrite:false});
  const windGlass=new T.MeshStandardMaterial({color:0x648b9d,transparent:true,opacity:.36,roughness:.4,depthWrite:false});
  const headlight=new T.MeshStandardMaterial({color:0xf6ead0,emissive:0xf2dca3,emissiveIntensity:.6,roughness:.55});
  const taillight=new T.MeshStandardMaterial({color:0xc9473d,emissive:0xc93b2b,emissiveIntensity:.38,roughness:.6});
  const interiorGlow=new T.MeshStandardMaterial({color:0xecf1d8,emissive:0xe6eac7,emissiveIntensity:.26,roughness:.58});
  const driverSeat={x:.59,z:4.41},uniform=0x294969,lapel=0x8cadd0,skin=0xe9b389,hair=0x2d2729;
  const driverSphere=new T.SphereGeometry(1,14,10),sleeveShape=new T.CylinderGeometry(.86,1,1,9);
  const steeringRim=new T.TorusGeometry(.178,.018,8,30);
  const driverPaint=new T.MeshStandardMaterial({roughness:.83});
  const steeringPaint=matte(0x252e36),driverTint=new T.Color();
  const up=new T.Vector3(0,1,0),axis=new T.Vector3(),grip=new T.Vector3(),elbow=new T.Vector3();
  const shoulder=new T.Vector3(),wrist=new T.Vector3();

  function driverRig(bus){
    const driver=new T.Group();driver.name="운전기사";driver.position.set(driverSeat.x,0,driverSeat.z);bus.add(driver);
    const shell=[
      [uniform,0,1.302,-.071,.184,.222,.125,-.14],
      [0x273a51,0,1.113,-.036,.176,.091,.171],
      [skin,0,1.531,-.050,.065,.089,.063],
      [skin,0,1.667,-.017,.168,.184,.143],
      [hair,0,1.720,-.068,.173,.137,.116],
      [0x244462,0,1.812,-.031,.185,.094,.153],
      [0x1e303f,0,1.770,.091,.157,.025,.116,.10],
      [0xd89975,0,1.641,.128,.024,.027,.025],
      [0x9a5f52,0,1.597,.113,.034,.007,.010]
    ];
    const details=[
      [0xc9d8e0,0,1.450,.046,.091,.136,.029,-.13],
      [0x3d5670,0,1.400,.067,.027,.105,.022,-.13],
      [0xeac978,.101,1.422,.039,.065,.031,.019],
      [0xe4bd69,0,1.832,.116,.046,.029,.023]
    ];
    for(const side of [-1,1]){
      shell.push([0x263d55,side*.096,1.083,.103,.083,.087,.171],
        [0x233749,side*.104,.929,.235,.066,.151,.065,-.14],
        [0x20262f,side*.104,.779,.279,.077,.057,.111],
        [skin,side*.162,1.657,-.016,.034,.044,.028],
        [0x3b2e2a,side*.065,1.670,.113,.020,.026,.012],
        [0xffeedd,side*.064-.006,1.680,.124,.005,.005,.004],
        [0xd99073,side*.107,1.629,.090,.030,.014,.012]);
      details.push([lapel,side*.055,1.474,.066,.055,.069,.022,-.13,0,side*.38]);
    }
    function poseBatch(geometry,poses){
      const batch=new T.InstancedMesh(geometry,driverPaint,poses.length);
      poses.forEach(([color,x,y,z,w,h,d,rx=0,ry=0,rz=0],i)=>{
        transform.position.set(x,y,z);transform.rotation.set(rx,ry,rz);transform.scale.set(w,h,d);
        transform.updateMatrix();batch.setMatrixAt(i,transform.matrix);batch.setColorAt(i,driverTint.setHex(color));
      });
      batch.computeBoundingSphere();driver.add(batch);
    }
    poseBatch(driverSphere,shell);poseBatch(unit,details);

    const column=new T.Group(),wheel=new T.Group();wheel.name="운전대";
    column.position.set(0,1.491,.357);column.rotation.x=.92;column.add(wheel);driver.add(column);
    const shaft=new T.Mesh(sleeveShape,steeringPaint);
    shaft.position.set(0,1.405,.390);shaft.scale.set(.033,.190,.033);shaft.rotation.x=-.40;driver.add(shaft);
    wheel.add(new T.Mesh(steeringRim,steeringPaint));
    for(const [w,h] of [[.322,.030],[.035,.170]]){
      const spoke=new T.Mesh(unit,steeringPaint);spoke.scale.set(w,h,.034);wheel.add(spoke);
    }
    const hub=new T.Mesh(driverSphere,steeringPaint);hub.scale.set(.055,.055,.032);wheel.add(hub);

    const sleeves=new T.InstancedMesh(sleeveShape,matte(uniform),4);
    const hands=new T.InstancedMesh(driverSphere,matte(skin),2);hands.name="운전기사 양손";
    for(const mesh of [sleeves,hands]){
      mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);driver.add(mesh);
    }
    function sleeve(index,from,to,radius){
      const length=axis.subVectors(to,from).length();
      transform.position.copy(from).lerp(to,.5);
      transform.quaternion.setFromUnitVectors(up,axis.multiplyScalar(1/length));
      transform.scale.set(radius,length+.032,radius);
      transform.updateMatrix();sleeves.setMatrixAt(index,transform.matrix);
    }
    function placeHands(steering){
      wheel.rotation.z=steering;
      for(let i=0;i<2;i++){
        const side=i*2-1;
        grip.set(side*.152,.092,0).applyEuler(wheel.rotation).applyEuler(column.rotation).add(column.position);
        shoulder.set(side*.163,1.428,-.057);
        elbow.set(side*.196,1.345,.102);
        wrist.copy(grip);wrist.y-=.023;wrist.z-=.035;
        sleeve(i*2,shoulder,elbow,.066);sleeve(i*2+1,elbow,wrist,.053);
        transform.position.copy(grip);transform.rotation.set(-.32,side*.28,steering);
        transform.scale.set(.043,.044,.055);transform.updateMatrix();hands.setMatrixAt(i,transform.matrix);
      }
      sleeves.instanceMatrix.needsUpdate=hands.instanceMatrix.needsUpdate=true;
    }
    let angle=0;placeHands(angle);
    return target=>{
      const eased=Math.abs(target-angle)<.002?target:angle+(target-angle)*.20;
      if(eased!==angle)placeHands(angle=eased);
    };
  }

  function model(index){
    const bus=new T.Group();bus.name=`세종대로 순환버스 ${index+1}호`;
    bus.visible=false;busGroup.add(bus);
    const frame=0x26333e,roof=0xe0e4e3,coat=index%2===0?0x3677b8:0x2f6fae,body=0x2d597f;
    const trim=0x9cabb4,seatBlue=0x4d7395,cushion=0x587f9f,aisle=0x696b66;
    const wide=BUS_WIDTH/2,front=BUS_LENGTH/2;
    const parts=new Map();
    function piece(color,x,y,z,w,h,d,rx=0,ry=0,rz=0){
      const material=color?.isMaterial?color:matte(color);
      if(!parts.has(material))parts.set(material,[]);
      parts.get(material).push({x,y,z,w,h,d,rx,ry,rz});
    }
    function small(parent,material,x,y,z,w,h,d){
      const mesh=new T.Mesh(unit,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
    }
    function fixedSign(mesh,x,y,z,angle=0){mesh.position.set(x,y,z);mesh.rotation.y=angle;bus.add(mesh);}

    // A hollow body and clear window openings keep seated passengers visible from the road.
    piece(body,0,.52,0,2.45,.28,BUS_LENGTH-.22);
    piece(aisle,0,BUS_FLOOR-.055,0,2.28,.109,BUS_LENGTH-.58);
    piece(roof,0,2.94,0,2.52,.19,BUS_LENGTH-.06);
    piece(0xa6b0b2,0,3.058,-.74,1.47,.085,2.76);
    piece(roof,0,3.128,-.74,1.16,.061,2.32);
    piece(interiorGlow,0,2.818,-.54,.19,.022,7.85);
    piece(frame,0,.632,front-.01,2.54,.176,.155);
    piece(frame,0,.632,-front+.01,2.54,.176,.155);
    piece(coat,0,1.046,front-.075,2.50,.61,.13);
    piece(coat,0,1.043,-front+.076,2.50,.57,.13);
    piece(0x52636c,0,1.34,front-.042,2.27,.085,.115);
    piece(coat,0,2.727,front-.078,2.49,.252,.15);
    piece(coat,0,2.724,-front+.078,2.49,.249,.15);
    piece(windGlass,0,2.035,front-.11,2.25,1.19,.071);
    piece(windGlass,0,2.033,-front+.115,2.26,1.11,.076);
    piece(frame,0,2.03,front-.056,.073,1.23,.12);
    piece(frame,0,1.43,front-.086,2.28,.091,.071);
    piece(frame,0,2.023,-front+.06,.061,1.18,.09);
    for(const side of [-1,1]){
      piece(coat,side*(wide-.062),.963,-1.08,.119,.56,8.37);
      if(side>0)piece(coat,side*(wide-.062),.963,4.25,.119,.56,2.12);
      piece(body,side*(wide-.064),2.713,0,.125,.298,BUS_LENGTH-.16);
      piece(frame,side*(wide-.058),1.432,-.54,.123,.115,9.36);
      piece(trim,side*(wide+.002),1.244,-1.07,.035,.112,8.31);
      for(const z of [-5.16,-3.93,-2.58,-1.20,.18,1.56,2.92,5.14]){
        piece(frame,side*(wide-.060),2.037,z,.121,1.16,.083);
      }
      const panes=side>0?[-4.55,-3.27,-1.89,-.51,.87,2.25,3.63,4.61]:[-4.55,-3.27,-1.89,-.51,.87,2.25,4.76];
      for(const z of panes){
        piece(windowGlass,side*(wide-.066),2.021,z,.039,1.10,z===4.76?.70:1.22);
      }
      piece(frame,side*1.11,2.018,front-.092,.168,1.23,.11);
      piece(frame,side*1.11,2.014,-front+.096,.168,1.23,.11);
      piece(headlight,side*.933,1.041,front+.014,.33,.206,.058);
      piece(taillight,side*1.043,1.041,-front-.012,.196,.304,.051);
      piece(0x2d3944,side*1.29,2.09,front-.48,.38,.074,.10);
      piece(0x344a58,side*1.47,2.089,front-.49,.19,.36,.20);
      piece(0xd7bd54,side*(wide+.009),.845,-4.49,.034,.095,.18);
    }
    // The driver's enclosure, fare reader and two low steps at the passenger door.
    piece(0x4c5453,driverSeat.x,.884,driverSeat.z,.73,.34,.55);
    piece(0x283943,driverSeat.x,1.12,driverSeat.z-.24,.55,.38,.109,-.12);
    piece(0x31474d,driverSeat.x,1.30,driverSeat.z+.36,.71,.15,.45);
    piece(0x4d5853,-.88,.424,3.46,.72,.20,1.23);
    piece(0x63675f,-.84,.542,3.46,.69,.14,1.20);
    piece(0xb9a357,-1.20,.603,3.46,.071,.05,1.21);
    piece(0xd6b758,-.50,1.637,4.00,.05,1.69,.05);
    piece(0xd6b758,-.49,1.657,2.88,.05,1.77,.05);
    piece(0x3c4b4d,-.63,1.308,2.96,.16,.236,.13);
    piece(0x708a73,-.65,1.386,2.987,.087,.072,.035);
    for(let seat=0;seat<BUS_SEATS;seat++){
      const {side,forward}=busSeatOffset(seat);
      piece(frame,side,BUS_FLOOR+.197,forward,.18,.382,.21);
      piece(cushion,side,BUS_FLOOR+.414,forward,.61,.104,.562);
      piece(seatBlue,side,BUS_FLOOR+.659,forward-.274,.61,.560,.122);
      piece(0x6c858f,side,BUS_FLOOR+.992,forward-.291,.55,.104,.113);
    }
    for(const side of [-1,1]){
      piece(0xd9bd64,side*.53,2.562,-.42,.045,.045,6.50);
      for(const z of [-2.54,-.69,1.22])piece(0xaaa27a,side*.53,2.47,z,.032,.19,.031);
    }
    piece(0x5d625a,0,1.213,-4.58,1.41,.236,.17);
    piece(0x687b79,0,.912,front+.007,.89,.22,.047);
    piece(0xf2e9cb,0,.836,-front-.021,.405,.107,.039);

    for(const [material,items] of parts){
      const batch=new T.InstancedMesh(unit,material,items.length);
      items.forEach(({x,y,z,w,h,d,rx,ry,rz},i)=>{
        transform.position.set(x,y,z);transform.rotation.set(rx,ry,rz);transform.scale.set(w,h,d);
        transform.updateMatrix();batch.setMatrixAt(i,transform.matrix);
      });
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();
      batch.castShadow=!material.transparent;batch.receiveShadow=!material.transparent;
      bus.add(batch);
    }

    const doors=[-.28,.28].map(offset=>{
      const panel=new T.Group();panel.position.set(-wide+.057,1.64,3.49+offset);bus.add(panel);
      for(const side of [-1,1]){
        small(panel,matte(frame),0,0,side*.244,.088,1.99,.047);
        small(panel,matte(frame),0,side*.965,0,.088,.06,.535);
      }
      small(panel,windowGlass,-.047,.189,0,.035,1.33,.453);
      small(panel,matte(coat),-.047,-.733,0,.034,.43,.484);
      small(panel,matte(0xccb059),-.052,-.066,offset*.33,.039,.347,.064);
      return {panel,offset};
    });

    const wheels=[];
    for(const side of [-1,1])for(const z of [-3.15,3.04]){
      const wheel=new T.Group();wheel.position.set(side*(wide-.083),.474,z);bus.add(wheel);
      for(const [geometry,color] of [[tireShape,0x252928],[wheelHub,0x929998],[hubNut,0x5f6667]]){
        const mesh=new T.Mesh(geometry,matte(color));mesh.castShadow=true;wheel.add(mesh);
      }
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3;
        small(wheel,matte(0xb2b8b7),side*.154,Math.cos(angle)*.172,Math.sin(angle)*.172,.023,.043,.044);
      }
      wheels.push(wheel);
    }
    const number=`순환 0${index+1}`;
    fixedSign(placard(number,1.97,.29,{sub:"덕수궁 · 경복궁"}),0,2.70,front+.021);
    fixedSign(placard(number,1.19,.28),0,2.68,-front-.016,Math.PI);
    fixedSign(placard(number,1.25,.32,{sub:"세종대로"}),-wide-.018,2.52,3.00,-Math.PI/2);
    const steer=driverRig(bus);
    bus.traverse(object=>{if(object.isMesh)object.userData.dynamic=true;});
    return {bus,doors,wheels,steer,previous:null,spin:0};
  }

  const vehicles=Array.from({length:BUS_COUNT},(_,i)=>model(i));
  function update(time,anchor){
    for(const [index,entry] of vehicles.entries()){
      const {bus,doors,wheels,steer,previous}=entry,state=busAt(index,time);
      bus.visible=Boolean(state&&anchor&&Math.hypot(anchor.x-state.x,anchor.y-state.y)<145);
      if(!bus.visible){entry.previous=null;continue;}
      bus.position.set(wx(state.x),height(state)+.015,wz(state.y));bus.rotation.y=(180-state.heading)*Math.PI/180;
      const moved=previous?Math.hypot(previous.x-state.x,previous.y-state.y):0;
      if(moved<14&&state.traveling)entry.spin=(entry.spin+moved/.465)%(Math.PI*2);
      for(const wheel of wheels)wheel.rotation.x=entry.spin;
      const ahead=state.traveling?busAt(index,time+400):null;
      const turn=ahead?.traveling?((ahead.heading-state.heading+540)%360-180)*Math.PI/180:0;
      steer(Math.max(-.46,Math.min(.46,turn*1.35)));
      const open=state.stopId?Math.max(0,Math.min(1,state.elapsed/650,state.remaining/700)):0;
      for(const {panel,offset} of doors)panel.position.z=3.49+offset*(1+open*1.57);
      entry.previous=state;
    }
  }
  return {update};
}
