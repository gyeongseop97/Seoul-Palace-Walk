export function bungeoppangOutline(T,scale=1,torn=false){
  const point=(x,y)=>[x*scale,y*scale],outline=new T.Shape();
  outline.moveTo(...point(torn?.061:.103,0));
  if(torn){
    outline.lineTo(...point(.083,.015));outline.lineTo(...point(.065,.028));outline.lineTo(...point(.084,.042));
    outline.bezierCurveTo(...point(.078,.066),...point(.029,.069),...point(-.022,.046));
  }else outline.bezierCurveTo(...point(.089,.055),...point(.039,.073),...point(-.022,.046));
  outline.lineTo(...point(-.100,.069));outline.lineTo(...point(-.087,.012));outline.lineTo(...point(-.104,-.059));
  outline.lineTo(...point(-.021,-.037));
  outline.bezierCurveTo(...point(.034,-.067),...point(.087,-.050),...point(torn?.061:.103,0));
  return outline;
}

export function makeBungeoppangProps(T,{box,shape}){
  const crusts=[false,true].map(torn=>{
    const geometry=new T.ExtrudeGeometry(bungeoppangOutline(T,1,torn),{
      depth:.025,bevelEnabled:true,bevelSegments:2,steps:1,bevelThickness:.009,bevelSize:.009
    });
    return geometry.rotateX(-Math.PI/2);
  });
  const eye=new T.TorusGeometry(.010,.0021,5,12).rotateX(-Math.PI/2);
  const scale=new T.TorusGeometry(.012,.0018,4,9,Math.PI*.70).rotateX(-Math.PI/2);
  const spot=new T.SphereGeometry(1,9,6);
  return (parent,quality="good")=>{
    const torn=quality==="torn",burnt=quality==="burnt",custard=quality==="custard";
    const toast=burnt?0x39231b:0xa46136;
    shape(crusts[Number(torn)],burnt?0x543420:torn?0xd19a55:custard?0xd9a055:0xc27a3b,0,0,0,parent);
    if(!torn){
      shape(eye,burnt?toast:0x86502d,.063,.034,-.012,parent);
      shape(spot,burnt?toast:0x8d512c,.063,.035,-.011,parent).scale.set(.004,.003,.004);
    }else{
      for(const [x,y,z,rx,ry,rz] of [[.056,.029,-.004,.021,.012,.027],[.063,.030,-.016,.016,.008,.016]]){
        shape(spot,0x652a26,x,y,z,parent).scale.set(rx,ry,rz);
      }
    }
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){
      const mark=shape(scale,toast,.028-col*.019+(row%2)*.007,.035,(row-1)*.021,parent);
      mark.rotation.y=-Math.PI/2;
    }
    for(const z of [-.032,.014,.042])box(burnt?toast:0x9a5a32,-.072,.034,z,.043,.002,.003,parent).rotation.y=z*5;
    if(burnt)for(const [x,z,rx,rz] of [[.030,.005,.038,.026],[-.031,-.013,.020,.023],[-.077,.019,.019,.012]]){
      shape(spot,0x281c17,x,.033,z,parent).scale.set(rx,.004,rz);
    }
  };
}

export function makeHotteokProps(T,{shape}){
  const spots=[
    [.054,.035,.024],[-.046,.035,.019],[.007,-.056,.030],[-.038,-.027,.016],
    [.041,-.042,.019],[-.006,.018,.025],[-.067,-.009,.017],[.060,-.012,.013]
  ];
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.76});
  const syrup=new T.SphereGeometry(1,12,7);
  const crusts=Object.fromEntries(["good","burnt","torn","raw"].map(quality=>{
    const torn=quality==="torn",raw=quality==="raw",burnt=quality==="burnt";
    const profile=[[0,-.014],[.059,-.016],[.085,-.014],[.103,-.007],[.107,.002],
      [.104,.011],[.095,.019],[.073,.024],[.044,.026],[0,.025]];
    const geometry=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48);
    const positions=geometry.attributes.position,colors=[];
    const golden=new T.Color(raw?0xf4d79f:burnt?0x79512d:0xd9913e);
    const toasted=new T.Color(raw?0xe8be84:burnt?0x352621:0x8f542c);
    const tornEdge=new T.Color(0xf4c472),color=new T.Color();
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),theta=Math.atan2(z,x);
      const tear=torn&&Math.abs(theta)<.66?Math.cos(theta/.66*Math.PI*.5)**1.5:0;
      const distortion=1+.036*Math.sin(theta*5+.7)+.023*Math.cos(theta*9)-tear*(.43+.045*Math.sin(theta*22));
      const px=x*distortion,pz=z*distortion;
      positions.setXYZ(i,px,y+Math.sin(theta*7+.6)*Math.hypot(x,z)*.018,pz);
      let browning=0;
      for(const [sx,sz,size] of spots){
        const dx=px-sx,dz=pz-sz;
        browning=Math.max(browning,Math.exp(-(dx*dx+dz*dz)/(size*size)));
      }
      const crustShade=.10*Math.sin(theta*11+pz*49)+.13;
      color.copy(golden).lerp(toasted,Math.min(1,crustShade+browning*(raw?.14:burnt?.98:.65)));
      if(tear>.30&&Math.hypot(x,z)>.083)color.lerp(tornEdge,tear*.84);
      colors.push(color.r,color.g,color.b);
    }
    geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    return [quality,geometry];
  }));
  return (root,quality="good")=>{
    const bread=shape(crusts[quality]??crusts.good,0xffffff,0,0,0,root);
    bread.material=material;
    if(quality==="torn"){
      const filling=shape(syrup,0x854019,.061,.002,.005,root);
      filling.scale.set(.028,.014,.034);
      shape(syrup,0xb76d2e,.069,.01,.02,root).scale.set(.014,.010,.015);
    }
  };
}

export function makeRegionalItemProps(T,{box,cylinder,shape}){
  const wedge=new T.Shape();wedge.moveTo(-.075,-.052);wedge.lineTo(.076,-.052);wedge.lineTo(.024,.066);wedge.closePath();
  const cheeseWedge=new T.ExtrudeGeometry(wedge,{depth:.05,bevelEnabled:false});
  const bungeoppang=makeBungeoppangProps(T,{box,shape});
  const hotteok=makeHotteokProps(T,{shape});
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
    cannedBeer(parent){
      cylinder(0xd7b767,0,-.003,0,.058,.165,20,parent);
      cylinder(0x496d76,0,.005,0,.0589,.068,20,parent);
      cylinder(0xc7cfc9,0,.082,0,.054,.01,20,parent);
      cylinder(0xaab5b4,0,-.085,0,.054,.008,20,parent);
      box(0x414d50,-.013,.088,0,.019,.003,.028,parent);
      box(0xb0b8b3,.007,.09,-.001,.018,.005,.024,parent);
    },
    cupNoodles(parent){
      cylinder(0xc3664f,0,-.006,0,.083,.134,22,parent,.75);
      cylinder(0xf1dfb8,0,.060,0,.085,.013,22,parent);
      cylinder(0xbe7840,0,.068,0,.077,.006,22,parent);
      for(let i=0;i<6;i++){
        const angle=i*2.39;
        berry(parent,i%2?0x78a269:0xeec16c,Math.sin(angle)*.044,.073,Math.cos(angle)*.043,.017,.005,.009);
      }
      for(const x of [.029,.041])box(0xc59e75,x,.127,-.035,.006,.143,.006,parent).rotation.x=-.30;
    },
    cheese(parent){
      const piece=shape(cheeseWedge,0xe9b654,0,-.006,0,parent);piece.rotation.x=-Math.PI/2;
      for(const [x,z] of [[-.034,.022],[.021,.007],[.029,-.02]])berry(parent,0xc78e35,x,.049,z,.009,.002,.008);
    },
    soju(parent){
      cylinder(0x38845e,0,-.013,0,.041,.16,14,parent);
      cylinder(0x477d57,0,.075,0,.039,.027,14,parent,.55);
      cylinder(0x336747,0,.118,0,.022,.06,14,parent);
      cylinder(0xf0e9cd,0,-.011,0,.042,.058,14,parent);
    },
    sashimi(parent){
      cylinder(0xe9e3ce,0,-.035,0,.11,.014,18,parent);
      for(let i=0;i<4;i++)berry(parent,i%2?0xf9cbad:0xe59b88,(i-1.5)*.039,-.014,0,.027,.016,.062).rotation.y=.38;
    },
    grilledClam(parent){
      berry(parent,0xb99978,0,-.024,0,.082,.021,.069);
      berry(parent,0xf1bc78,0,-.013,0,.059,.019,.043);
    },
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
    bungeoppang,
    bungeoppangCustard:parent=>bungeoppang(parent,"custard"),
    bungeoppangBurnt:parent=>bungeoppang(parent,"burnt"),
    bungeoppangTorn:parent=>bungeoppang(parent,"torn"),
    hotteok,
    hotteokBurnt:parent=>hotteok(parent,"burnt"),
    hotteokTorn:parent=>hotteok(parent,"torn"),
    triangleRice(parent){
      const outline=new T.Shape();
      outline.moveTo(-.09,-.063);outline.lineTo(-.008,.09);outline.quadraticCurveTo(0,.103,.01,.089);
      outline.lineTo(.091,-.063);outline.closePath();
      const packet=new T.ExtrudeGeometry(outline,{depth:.052,bevelEnabled:true,bevelSize:.008,bevelThickness:.009,bevelSegments:1});
      shape(packet,0x32453a,0,0,-.027,parent);
      box(0xeee7ca,0,-.034,.037,.101,.042,.006,parent);
      box(0xba6151,0,-.027,.041,.069,.008,.004,parent);
    },
    fruitMochi(parent){
      berry(parent,0xfae6df,0,0,0,.092,.083,.094);
      berry(parent,0xca7879,0,.001,.072,.074,.067,.024);
      berry(parent,0xed5457,0,.005,.087,.057,.052,.014);
      for(const [x,y] of [[-.025,.017],[.011,.028],[.03,-.001],[-.012,-.017]])berry(parent,0xffdb99,x,y,.099,.004,.006,.002);
    },
    stationBurger(parent){
      berry(parent,0xc68445,0,-.035,0,.117,.037,.111);
      cylinder(0x5c3928,0,-.003,0,.108,.039,18,parent);
      box(0xf6bf59,0,.018,0,.172,.014,.172,parent).rotation.y=.35;
      for(let i=0;i<7;i++){const a=i*.898;berry(parent,0x74a147,.066*Math.sin(a),.029,.066*Math.cos(a),.053,.014,.049);}
      berry(parent,0xe8a45a,0,.056,0,.115,.057,.11);
      for(let i=0;i<7;i++){const a=i*2.4;berry(parent,0xffe1a7,.066*Math.cos(a),.1,.052*Math.sin(a),.006,.003,.01);}
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
