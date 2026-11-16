export function makeRegionalItemProps(T,{box,cylinder,shape}){
  const berryGeometry=new T.SphereGeometry(1,10,7);
  const sliceFootprint=new T.Shape([[-.100,.074],[.100,.074],[.012,-.111],[-.010,-.111]]
    .map(([x,z])=>new T.Vector2(x,-z)));
  const sliceGeometry=new T.ExtrudeGeometry(sliceFootprint,{depth:1,bevelEnabled:false});
  sliceGeometry.rotateX(-Math.PI/2);
  const flower=new T.Shape(Array.from({length:56},(_,i)=>{
    const angle=i*Math.PI/28,radius=.080+Math.cos(angle*8)*.010;
    return new T.Vector2(Math.cos(angle)*radius,Math.sin(angle)*radius);
  }));
  const pastryGeometry=new T.ExtrudeGeometry(flower,{depth:.019,bevelEnabled:true,bevelSegments:1,bevelThickness:.004,bevelSize:.004});
  pastryGeometry.rotateX(-Math.PI/2);
  const flowerStamp=new T.TorusGeometry(.024,.0035,5,20);flowerStamp.rotateX(-Math.PI/2);
  const bowlProfile=[[0,-.059],[.060,-.059],[.073,-.046],[.096,-.023],[.116,.025],[.119,.046],[.115,.050],
    [.109,.047],[.108,.027],[.089,-.013],[.067,-.032],[0,-.038]];
  const bowlGeometry=new T.LatheGeometry(bowlProfile.map(([radius,y])=>new T.Vector2(radius,y)),24);
  const bowlHandle=new T.TorusGeometry(.034,.009,7,16);
  const wineProfile=[[0,.019],[.034,.020],[.062,.043],[.075,.080],[.070,.125],[.056,.166],
    [.053,.166],[.067,.125],[.072,.080],[.059,.044],[.031,.023],[0,.022]];
  const glassGeometry=new T.LatheGeometry(wineProfile.map(([radius,y])=>new T.Vector2(radius,y)),24);
  const wineGeometry=new T.LatheGeometry([[0,.025],[.035,.026],[.060,.047],[.070,.079],[.069,.103],[0,.103]]
    .map(([radius,y])=>new T.Vector2(radius,y)),24);
  const wineRim=new T.TorusGeometry(.054,.002,6,20);wineRim.rotateX(-Math.PI/2);
  const glassMaterial=new T.MeshStandardMaterial({color:0xf6cfd6,roughness:.15,transparent:true,opacity:.32,depthWrite:false});
  const clearGlass=new T.MeshStandardMaterial({color:0xe8eee3,roughness:.12,transparent:true,opacity:.32,depthWrite:false});
  const tumbler=new T.LatheGeometry([[0,-.101],[.058,-.101],[.064,-.092],[.072,.105],[.070,.109],
    [.068,.106],[.060,-.089],[0,-.089]].map(([radius,y])=>new T.Vector2(radius,y)),24);
  const tumblerRim=new T.TorusGeometry(.069,.002,6,24);tumblerRim.rotateX(-Math.PI/2);
  const fishShape=new T.Shape();
  fishShape.moveTo(.103,0);
  fishShape.bezierCurveTo(.089,.055,.039,.073,-.022,.046);
  fishShape.lineTo(-.100,.069);fishShape.lineTo(-.087,.012);fishShape.lineTo(-.104,-.059);
  fishShape.lineTo(-.021,-.037);
  fishShape.bezierCurveTo(.034,-.067,.087,-.050,.103,0);
  const fishGeometry=new T.ExtrudeGeometry(fishShape,{depth:.025,bevelEnabled:true,bevelSegments:2,steps:1,bevelThickness:.009,bevelSize:.009});
  fishGeometry.rotateX(-Math.PI/2);
  const fishEye=new T.TorusGeometry(.010,.0021,5,12);fishEye.rotateX(-Math.PI/2);
  const fishScale=new T.TorusGeometry(.012,.0018,4,9,Math.PI*.70);fishScale.rotateX(-Math.PI/2);
  const plumCup=new T.LatheGeometry([[0,-.068],[.039,-.068],[.043,-.055],[.060,-.031],[.066,.018],
    [.063,.067],[.060,.067],[.059,.057],[.061,.021],[.054,-.029],[0,-.044]].map(([r,y])=>new T.Vector2(r,y)),24);
  const limeGeometry=new T.CylinderGeometry(.037,.037,.008,18,1,false,0,Math.PI);
  limeGeometry.rotateX(Math.PI/2);
  const iceGeometry=new T.BoxGeometry(.040,.043,.041);
  const frost=new T.MeshStandardMaterial({color:0xf8f6df,roughness:.27,transparent:true,opacity:.58});

  function berry(parent,color,x,y,z,w,h,d){
    const mesh=shape(berryGeometry,color,x,y,z,parent);
    mesh.scale.set(w,h,d);return mesh;
  }
  function drinkGlass(parent){
    const glass=new T.Mesh(tumbler,clearGlass);glass.renderOrder=1;parent.add(glass);
    shape(tumblerRim,0xdfebe4,0,.106,0,parent);
  }
  return {
    yakgwa(parent){
      shape(pastryGeometry,0xb5632a,0,-.010,0,parent);
      shape(flowerStamp,0x8d441e,0,.014,0,parent);
      for(let i=0;i<8;i++){
        const angle=i*Math.PI/4;
        berry(parent,i%2?0xf0c581:0xe2a260,Math.cos(angle)*.049,.013,Math.sin(angle)*.049,.007,.004,.005);
      }
    },
    cake(parent){
      cylinder(0xead9cb,0,-.055,0,.137,.017,20,parent,.90);
      for(const [color,y,h] of [[0xf4b979,-.046,.043],[0xf4e8cc,-.003,.021],[0xf0ad73,.018,.036],[0xedaaae,.054,.018]]){
        shape(sliceGeometry,color,0,y,0,parent).scale.y=h;
      }
      for(const [x,z,radius] of [[-.049,.039,.024],[.018,.021,.025],[.054,.045,.021]]){
        berry(parent,0xc73552,x,.084,z,radius,radius*.80,radius*.76).rotation.z=.18;
        berry(parent,0x5d7851,x,.101,z,.014,.004,.009);
      }
      berry(parent,0xffe7d9,.005,.081,-.059,.018,.012,.017);
    },
    bingsu(parent){
      shape(bowlGeometry,0x527c7c,0,0,0,parent);
      cylinder(0x6e9994,0,.048,0,.116,.010,24,parent);
      berry(parent,0xf6f4e6,0,.057,0,.105,.048,.104);
      berry(parent,0xfbf6de,0,.078,0,.083,.041,.079);
      for(let i=0;i<12;i++){
        const angle=i*2.399,radius=.017+.055*Math.sqrt(i/12);
        const bean=berry(parent,i%3===0?0x8c5248:0x6f3d36,Math.cos(angle)*radius,.119-radius*.41,Math.sin(angle)*radius,.014,.011,.009);
        bean.rotation.y=angle+.6;
      }
      for(const [x,z] of [[-.040,.034],[.045,-.032],[.025,.048]]){
        box(0xf1e4b8,x,.109,z,.026,.023,.026,parent).rotation.y=x*12;
      }
      box(0xc8ceca,-.066,.079,-.057,.014,.013,.103,parent).rotation.x=.48;
      berry(parent,0x9ea9a9,-.066,.105,-.103,.022,.009,.033);
    },
    bungeoppang(parent){
      shape(fishGeometry,0xc27a3b,0,0,0,parent);
      shape(fishEye,0x86502d,.063,.034,-.012,parent);
      berry(parent,0x8d512c,.063,.035,-.011,.004,.003,.004);
      for(let row=0;row<3;row++)for(let col=0;col<4;col++){
        const imprint=shape(fishScale,0xa46136,.028-col*.019+(row%2)*.007,.035,(row-1)*.021,parent);
        imprint.rotation.y=-Math.PI/2;
      }
      for(const z of [-.032,.014,.042])box(0x9a5a32,-.072,.034,z,.043,.002,.003,parent).rotation.y=z*5;
    },
    riceCake(parent){
      cylinder(0xe7d8bf,0,-.044,0,.113,.023,24,parent,.94);
      cylinder(0xbfb492,0,-.029,0,.102,.008,24,parent);
      for(const [x,z,color] of [[-.052,.036,0xf4e1c4],[.049,.032,0xc97685],[.006,-.047,0x8ea670]]){
        berry(parent,color,x,-.001,z,.035,.032,.034);
        berry(parent,0xf5e0ad,x-.009,.020,z+.012,.008,.006,.007);
      }
      box(0x917153,0,-.016,.084,.137,.009,.009,parent).rotation.y=.08;
      box(0x917153,0,-.014,.098,.137,.009,.009,parent).rotation.y=.14;
    },
    makgeolli(parent){
      shape(bowlGeometry,0xc99755,0,0,0,parent);
      cylinder(0xf8eccc,0,.037,0,.109,.008,24,parent);
      shape(bowlHandle,0xbc8847,.132,.014,0,parent).scale.x=.75;
      for(const [x,z,radius] of [[-.032,.061,.009],[.045,.016,.007],[-.061,-.020,.006],[.025,-.052,.006]]){
        cylinder(0xfff6dd,x,.042,z,radius,.002,8,parent);
      }
    },
    wine(parent){
      cylinder(0xd6c1bc,0,-.087,0,.061,.010,20,parent,1.04);
      cylinder(0xf4e2d9,0,-.034,0,.009,.104,12,parent);
      shape(wineGeometry,0x7b1f3e,0,0,0,parent);
      const glass=new T.Mesh(glassGeometry,glassMaterial);glass.renderOrder=1;parent.add(glass);
      shape(wineRim,0xe6bfc3,0,.166,0,parent);
    },
    fruitWine(parent){
      shape(plumCup,0xe6dcc2,0,0,0,parent);
      cylinder(0xad7131,0,.050,0,.061,.010,24,parent);
      cylinder(0x557263,0,-.062,0,.042,.010,24,parent);
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3;
        berry(parent,0x5c7963,Math.cos(angle)*.061,.028,Math.sin(angle)*.061,.006,.009,.006);
      }
      berry(parent,0xdabc64,.022,.056,.003,.017,.011,.017);
      berry(parent,0x7c8852,.027,.066,-.009,.009,.004,.004);
    },
    highball(parent){
      cylinder(0xcb8c46,0,-.0135,0,.058,.153,24,parent,1.13);
      cylinder(0xf7c781,0,.064,0,.065,.004,24,parent);
      drinkGlass(parent);
      for(const [x,y,z,angle] of [[-.025,.057,.022,.3],[.026,.046,-.023,-.27],[.020,.073,.024,.47]]){
        const ice=new T.Mesh(iceGeometry,frost);ice.position.set(x,y,z);ice.rotation.y=angle;parent.add(ice);
      }
      const lime=shape(limeGeometry,0x77964d,.046,.114,.041,parent);
      lime.rotation.y=.44;lime.rotation.z=-.54;
      const pulp=shape(limeGeometry,0xd8ca6c,.046,.114,.044,parent);
      pulp.scale.set(.81,.81,.72);pulp.rotation.copy(lime.rotation);
      const stir=box(0x374745,-.038,.073,-.029,.009,.165,.009,parent);stir.rotation.z=.18;
    }
  };
}
