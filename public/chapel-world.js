// The two naves share a clear centre aisle. Their windows, roof and sanctuary
// use different forms so they are recognisable from the entrance.
export function* buildChapel(T,root,kit,venue){
  const {width,depth,center,pews,columns}=venue,cathedral=venue.id==="seoul-cathedral";
  const room=new T.Group();
  room.name=venue.name;room.position.set(kit.wx(center.x),0,kit.wz(center.y));root.add(room);
  const box=(color,x,y,z,w,h,d)=>kit.box(color,x,y,z,w,h,d,room);
  const round=(color,x,y,z,r,h)=>kit.cylinder(color,x,y,z,r,h,12,room);
  const wood=cathedral?0x694630:0x825338,trim=0x49362e,stone=0xd2bea6;
  const wall=cathedral?0xead9bd:0xf0e5d3,eave=cathedral?7.4:5.7;
  const front=-depth/2,back=depth/2;
  // This profile lies in the XY plane and faces into the room at the altar.
  function arch(color,x,y,z,w,h,yaw=0,pointed=false){
    const path=new T.Shape(),r=w/2;
    path.moveTo(-r,0);path.lineTo(r,0);path.lineTo(r,h-r);
    if(pointed){
      path.quadraticCurveTo(r*.8,h-r*.4,0,h);
      path.quadraticCurveTo(-r*.8,h-r*.4,-r,h-r);
    }else path.absarc(0,h-r,r,0,Math.PI,false);
    path.closePath();
    const panel=kit.shape(new T.ShapeGeometry(path,12),color,x,y,z,room);panel.rotation.y=yaw;
  }
  function archBand(x,y,z,r,thickness,yaw){
    const shape=new T.Shape();
    shape.absarc(0,0,r+thickness,0,Math.PI,false);
    shape.absarc(0,0,r,Math.PI,0,true);shape.closePath();
    const arch=kit.shape(new T.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:false,curveSegments:12}),stone,x,y,z,room);
    arch.rotation.y=yaw;
  }
  box(cathedral?0xb2a18d:0xb2926a,0,-.13,0,width,.26,depth);
  box(cathedral?0x9f6554:0x986657,0,.011,-.3,2.05,.022,depth-1.1);
  for(const side of [-1,1]){
    box(0xd0aa70,side*.98,.027,-.3,.034,.012,depth-1.1);
    box(wall,side*width/2,eave/2,0,.30,eave,depth);
    box(cathedral?stone:wood,side*(width/2-.17),.61,0,.10,1.22,depth);
  }
  for(const z of [front,back])box(wall,0,eave/2,z,width,eave,.30);
  const rise=cathedral?2.9:2.3,roofAngle=Math.atan2(rise,width/2);
  for(const side of [-1,1]){
    const roof=box(cathedral?0xb39374:0xb78962,side*width/4,eave+rise/2,0,
      Math.hypot(width/2,rise)+.2,.22,depth+.3);
    roof.rotation.z=-side*roofAngle;
  }
  // Close the triangular gables above the end walls.
  const gable=new T.Shape();
  gable.moveTo(-width/2,0);gable.lineTo(width/2,0);gable.lineTo(0,rise);gable.closePath();
  const face=new T.ShapeGeometry(gable);
  kit.shape(face,wall,0,eave,front,room);
  kit.shape(face,wall,0,eave,back,room).rotation.y=Math.PI;
  for(const p of pews){
    box(wood,p.x,.48,p.z,p.w,.15,.72);
    box(wood,p.x,.76,p.z+.31,p.w,.52,.13);
    for(const side of [-1,1]){
      box(trim,p.x+side*(p.w/2-.18),.27,p.z,.15,.48,.59);
      box(wood,p.x+side*(p.w/2-.075),.66,p.z,.15,.55,.78);
    }
  }
  yield;
  const glass=[0x84a7ae,0xbb8870,0xb7a367,0x748fa9];
  const bays=cathedral?[-7.7,-3.1,1.5,6.1,10.3]:[-6.1,-2,2.1,6.2];
  for(const side of [-1,1])for(const [i,z] of bays.entries()){
    const x=side*(width/2-.19),yaw=-side*Math.PI/2,project=delta=>x-side*delta;
    arch(cathedral?stone:wood,x,2.0,z,2.10,3.12,yaw,!cathedral);
    arch(glass[i%4],project(.025),2.12,z,1.78,2.84,yaw,!cathedral);
    box(0x594d44,project(.05),3.33,z,.065,2.40,.067);
    box(0x594d44,project(.05),3.24,z,.065,.075,1.78);
    box(cathedral?stone:wood,project(.025),2.02,z,.22,.14,2.16);
  }
  if(cathedral){
    for(const {x,z} of columns){
      round(stone,x,.14,z,.51,.28);
      round(0xc1b09c,x,2.39,z,.32,4.25);
      round(stone,x,4.56,z,.46,.23);
    }
    for(const side of [-1,1]){
      const zs=columns.filter(col=>Math.sign(col.x)===side).map(col=>col.z);
      for(let i=1;i<zs.length;i++)archBand(side*width*.415,4.65,(zs[i]+zs[i-1])/2,1.01,.23,Math.PI/2);
    }
    arch(0xc1a271,0,.5,front+.17,9.2,6.50);
    arch(0xcc9e53,0,.64,front+.2,8.7,6.12);
    arch(0xd8b368,0,1.02,front+.24,6.8,5.48);
    // Small facets in the gold apse suggest tesserae without an image texture.
    for(let row=0;row<5;row++)for(let col=-5;col<=5;col++){
      const x=col*.61+(row%2)*.23,y=1.9+row*.72;
      if(y>4.5&&Math.abs(x)>2.4)continue;
      box((row+col)%2?0xe3c47f:0xbd914f,x,y,front+.265,.13,.13,.018).rotation.z=Math.PI/4;
    }
  }else{
    for(const z of bays){
      box(wood,0,eave-.12,z,width-.1,.23,.24);
      box(wood,0,eave+rise/2-.20,z,.19,rise,.24);
      for(const side of [-1,1]){
        const beam=box(wood,side*width/4,eave+rise/2-.19,z,Math.hypot(width/2,rise),.20,.25);
        beam.rotation.z=-side*roofAngle;
      }
    }
    for(const side of [-1,1]){
      box(wood,side*3.9,2.20,front+.30,2.5,3.6,.42);
      for(let i=0;i<9;i++){
        const h=1.46+Math.abs(i-4)*.24,x=side*3.9+(i-4)*.23;
        round(0xc4b9a2,x,1.53+h/2,front+.57,.09,h);
      }
    }
  }
  yield;
  const metal=cathedral?0xb38845:trim;
  box(metal,0,3.85,front+.39,.21,2.55,.13);
  box(metal,0,4.29,front+.39,1.45,.20,.13);
  box(wood,0,.57,front+1.55,2.94,1.14,.86);
  box(cathedral?0xeee6d5:wood,0,1.15,front+1.55,3.6,.14,1.10);
  if(cathedral)box(0xe8ddbe,0,.85,front+2.11,1.25,.69,.038);
  for(const side of [-1,1]){
    round(0xb28a51,side*1.23,1.26,front+1.55,.13,.11);
    round(0xffeaca,side*1.23,1.51,front+1.55,.055,.43);
    round(0xf2af56,side*1.23,1.77,front+1.55,.035,.08);
  }
  for(const side of [-1,1]){
    box(wood,side*.54,1.24,back-.18,1.06,2.48,.12);
    box(0xc19b63,side*.16,1.14,back-.28,.07,.19,.07);
  }
}
