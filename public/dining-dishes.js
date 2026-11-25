export const DINING_TRAY_WIDTH=.62;
const portionProfiles=[
  {width:.68,height:.55,offset:-.011,sides:0},
  {width:.68,height:.55,offset:-.011,sides:1},
  {width:.88,height:.76,offset:-.005,sides:3},
  {width:1,height:1,offset:0,sides:4},
];
export function diningGesture(tray,seat){
  if(!seat?.tray||!tray||tray.itemAge<0||tray.itemAge>=tray.spec.duration)return null;
  const phase=tray.itemAge/tray.spec.duration;
  const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
  return {lift:smooth((phase-.18)/.31)*smooth((1-phase)/.32),
    dip:Math.sin(Math.PI*Math.min(1,phase/.30)),utensil:tray.spec.utensil??"spoon"};
}

export function makeDiningUtensil(T){
  const oval=new T.SphereGeometry(1,14,8),rod=new T.CylinderGeometry(1,1,1,10),block=new T.BoxGeometry(1,1,1);
  const metal=new T.MeshStandardMaterial({color:0xc7d2d4,roughness:.29,metalness:.54});
  const wood=new T.MeshStandardMaterial({color:0x703c27,roughness:.48});
  const salmon=new T.MeshStandardMaterial({color:0xe59883,roughness:.55});
  const grain=new T.MeshStandardMaterial({color:0xffdbbe,roughness:.56});
  function piece(parent,geometry,material,x,y,z,w,h,d){
    const mesh=new T.Mesh(geometry,material);parent.add(mesh);
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);return mesh;
  }
  return parent=>{
    const group=new T.Group(),spoon=new T.Group(),chopsticks=new T.Group(),fork=new T.Group();
    parent.add(group);group.add(spoon,chopsticks,fork);group.visible=false;
    const handle=piece(spoon,rod,metal,0,0,.043,.008,.18,.008);handle.rotation.x=Math.PI/2;
    piece(spoon,oval,metal,0,-.006,.158,.029,.010,.038);
    for(const side of [-1,1]){
      const stick=piece(chopsticks,rod,wood,side*.010,0,.062,.0047,.265,.0047);
      stick.rotation.set(Math.PI/2,0,side*.035,"YXZ");
    }
    const slice=new T.Group();slice.name="젓가락에 집은 회";chopsticks.add(slice);slice.position.z=.189;
    piece(slice,oval,salmon,0,0,0,.038,.010,.018);
    for(const x of [-.015,.008])piece(slice,oval,grain,x,.007,0,.0018,.002,.013).rotation.y=.33;
    piece(fork,block,metal,0,0,.038,.019,.009,.145);
    piece(fork,oval,metal,0,-.003,.112,.021,.008,.023);
    for(let tine=0;tine<4;tine++){
      const tip=piece(fork,block,metal,(tine-1.5)*.010,-.004,.143,.0055,.004,.031);
      tip.rotation.x=.095;
    }
    return {group,slice,show(kind,carryingSlice=false){
      group.visible=Boolean(kind);spoon.visible=kind==="spoon";chopsticks.visible=kind==="chopsticks";fork.visible=kind==="fork";
      slice.visible=carryingSlice;
    }};
  };
}

export function makeDiningDishes(T,{shape,cylinder,box}){
  const bowlGeometry=new T.LatheGeometry([
    [0,-.056],[.068,-.056],[.073,-.047],[.076,-.035],[.105,-.011],[.127,.039],[.129,.048],
    [.117,.051],[.109,.030],[.082,-.005],[.062,-.018],[0,-.018]
  ].map(([radius,height])=>new T.Vector2(radius,height)),20);
  const plateGeometry=new T.LatheGeometry([
    [0,-.056],[.089,-.056],[.094,-.051],[.101,-.042],[.130,-.022],[.146,-.015],
    [.151,-.006],[.144,.001],[.130,-.005],[.105,-.025],[.088,-.034],[0,-.034],
  ].map(([radius,height])=>new T.Vector2(radius,height)),24);
  const breadOutline=new T.Shape([
    new T.Vector2(-.047,-.046),new T.Vector2(.054,-.046),new T.Vector2(-.047,.057),
  ]);
  const breadGeometry=new T.ExtrudeGeometry(breadOutline,{
    depth:.013,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,
  });
  breadGeometry.rotateX(-Math.PI/2);
  const sphere=new T.IcosahedronGeometry(1,1);
  const pepper=[0x922e19,0xbd4824,0xab3922];
  const makeUtensil=makeDiningUtensil(T);

  function topping(group,color,x,y,z,a,b,c){
    const item=shape(sphere,color,x,y,z,group);
    item.scale.set(a,b,c);
    return item;
  }
  function bibimbap(group){
    cylinder(0xffecbf,0,.020,0,.087,.022,16,group,1.11);
    const fillings=[0xd4763a,0x6f8435,0xd7b064,0x593825,0x3a6a40];
    for(let side=0;side<fillings.length;side++){
      for(let index=0;index<5;index++){
        const angle=side*Math.PI*.4+(index-2)*.19,d=.063+(index%3)*.008;
        const piece=box(fillings[side],Math.cos(angle)*d,.038+(index%2)*.006,Math.sin(angle)*d,.026,.014,.006,group);
        piece.rotation.y=-angle+.43;
      }
    }
    topping(group,0xfff0d6,0,.048,.003,.049,.015,.038);
    topping(group,0xe7a724,-.007,.059,.005,.022,.014,.022);
    topping(group,0x963622,.042,.049,-.018,.022,.011,.017);
  }
  function mushroomSoup(group){
    cylinder(0xa96836,0,.023,0,.111,.018,20,group,1.01);
    for(let index=0;index<9;index++){
      const angle=index*2.399,d=.03+(index%4)*.015,x=Math.cos(angle)*d,z=Math.sin(angle)*d;
      if(index%3===0){
        cylinder(0x9b613b,x,.032,z,.023,.010,11,group,.86);
        box(0xe5c9a6,x,.033,z+.012,.01,.013,.017,group).rotation.y=angle;
      }else{
        box(index%3===1?0xf1dec2:0x588a4a,x,.032,z,.017,.015,.021,group).rotation.y=angle;
      }
      topping(group,pepper[index%3],z,.034,-x,.003,.002,.003);
    }
  }

  function noodleLayers(y,thickness){
    return Array.from({length:10},(_,loop)=>{
      const radius=.047+(loop%5)*.011,points=[];
      for(let segment=0;segment<=20;segment++){
        const angle=segment*.285+loop*.73,reach=radius+Math.sin(segment*.87+loop)*.011;
        points.push(new T.Vector3(Math.cos(angle)*reach,y+Math.sin(segment*.54+loop)*.005+loop*.001,
          Math.sin(angle)*reach));
      }
      return new T.TubeGeometry(new T.CatmullRomCurve3(points),18,thickness,4,false);
    });
  }
  const buckwheatLayers=noodleLayers(.045,.0036),pastaLayers=noodleLayers(.006,.005);

  function buckwheatNoodles(group){
    cylinder(0x604c3b,0,.025,0,.112,.016,20,group,1.025);
    buckwheatLayers.forEach((noodles,i)=>shape(noodles,i%3===0?0xbfa279:0x9f7d5e,0,0,0,group));
    for(let i=0;i<6;i++){
      const cucumber=box(i%2?0xa7b46f:0x6b8b54,-.045+i*.011,.070,.035,.009,.013,.064,group);
      cucumber.rotation.y=i*.25-.55;
    }
    topping(group,0xf7f1d5,.039,.057,-.04,.032,.016,.037);
    topping(group,0xe7bb51,.041,.068,-.037,.017,.012,.017);
    topping(group,0xb84331,-.021,.068,-.039,.019,.011,.024);
  }

  function jangGukbap(group){
    cylinder(0x9d633f,0,.025,0,.112,.020,20,group,1.01);
    const rice=topping(group,0xe4cdad,-.012,.049,.015,.067,.013,.054);
    rice.rotation.y=.31;
    for(let i=0;i<12;i++){
      const angle=i*2.399,radius=.050+(i%4)*.014;
      const piece=box(i%3===0?0x725039:i%3===1?0x566f42:0xc5a985,
        Math.cos(angle)*radius,.050,Math.sin(angle)*radius,.032,.013,.012,group);
      piece.rotation.y=angle*.88;piece.rotation.z=Math.sin(angle)*.3;
    }
  }

  function sujebi(group){
    cylinder(0xaea17a,0,.024,0,.112,.020,20,group,1.01);
    for(let i=0;i<10;i++){
      const angle=i*2.399,radius=.017+(i%4)*.022;
      const dough=topping(group,i%2?0xe0cfa6:0xf3e2ba,Math.cos(angle)*radius,.039+(i%3)*.007,
        Math.sin(angle)*radius,.032+(i%2)*.007,.010,.020);
      dough.rotation.set(Math.sin(i)*.22,angle,.20*Math.cos(i));
    }
    for(let i=0;i<7;i++){
      const angle=i*.87,radius=.067+(i%2)*.024;
      box(i%3===0?0xbd5f3f:0x647346,Math.cos(angle)*radius,.049,Math.sin(angle)*radius,.024,.011,.012,group).rotation.y=angle;
    }
  }

  function mushroomPasta(group){
    topping(group,0xe1c78d,0,-.020,0,.109,.013,.101);
    pastaLayers.forEach((noodles,i)=>shape(noodles,i%3===0?0xf3d782:0xeac17a,0,0,0,group));
    for(const [x,z,angle] of [[-.060,-.020,.8],[.041,.052,-.5],[.048,-.051,1.5],[-.030,.054,-.2]]){
      const cap=topping(group,0xbb8c67,x,.021,z,.024,.008,.016);
      cap.rotation.y=angle;
      box(0xdcc9a7,x-Math.sin(angle)*.016,.020,z-Math.cos(angle)*.016,.012,.011,.022,group).rotation.y=angle;
    }
    for(let i=0;i<11;i++){
      const angle=i*2.399,radius=.026+(i%5)*.014;
      box(i%3?0x527347:0xffeed0,Math.cos(angle)*radius,.023,Math.sin(angle)*radius,.009,.005,.006,group).rotation.y=angle;
    }
  }

  function beefCurry(group){
    const rice=topping(group,0xffefce,-.053,-.003,.010,.066,.033,.091);
    rice.rotation.y=-.13;
    topping(group,0x855025,.042,-.020,-.005,.089,.016,.097);
    topping(group,0xa2673a,.045,-.011,-.009,.078,.015,.081);
    for(let i=0;i<16;i++){
      const angle=i*2.399,radius=.024+(i%5)*.007;
      const grain=topping(group,i%2?0xfff5de:0xe6d4ac,-.052+Math.cos(angle)*radius,.018+(i%3)*.004,
        .010+Math.sin(angle)*radius*1.6,.004,.004,.009);
      grain.rotation.y=angle;
    }
    for(const [x,z,color,size,rotation] of [[.025,-.066,0x65412b,.033,.8],[.080,-.030,0xa57a51,.024,.2],
      [.065,.026,0x64402e,.030,.5],[.038,.058,0xcb883d,.024,.4],[.100,.007,0xb65129,.024,.9]]){
      box(color,x,.002,z,size,.024,size*.78,group).rotation.set(.12,rotation,.14);
    }
  }

  function chickenSandwich(group){
    for(const [x,z,angle] of [[-.043,-.029,-.12],[.043,.023,3.00]]){
      const piece=new T.Group();
      piece.position.set(x,0,z);piece.rotation.y=angle;group.add(piece);
      shape(breadGeometry,0xb96b35,0,-.033,0,piece);
      const lettuce=shape(breadGeometry,0x65964e,-.004,-.019,.002,piece);
      lettuce.scale.set(1.05,.32,1.07);
      const cheese=shape(breadGeometry,0xf6c45c,.003,-.010,-.002,piece);
      cheese.scale.y=.24;
      const chicken=shape(breadGeometry,0xe7bc91,0,-.006,0,piece);
      chicken.scale.set(.94,.63,.94);
      shape(breadGeometry,0xc38243,0,.005,0,piece);
      const toast=shape(breadGeometry,0xe6ad64,-.002,.008,.001,piece);
      toast.scale.set(.91,1,.91);
      for(let i=0;i<3;i++){
        box(0xa7673d,-.025+i*.017,.023,.020-i*.016,.038,.0025,.003,piece).rotation.y=-.47;
      }
    }
  }

  function udon(group){
    cylinder(0xb78243,0,.024,0,.112,.018,20,group,1.02);
    pastaLayers.forEach((noodles,i)=>shape(noodles,i%3===0?0xffedc9:0xf1d8a8,0,.034,0,group));
    for(const [x,z] of [[.039,.039],[.054,.008]]){
      topping(group,0xe7b0a8,x,.061,z,.035,.012,.019).rotation.y=.6;
      topping(group,0xffefdd,x-.002,.066,z,.029,.008,.015).rotation.y=.6;
      topping(group,0xe7859c,x+.003,.073,z-.002,.009,.003,.005).rotation.y=.6;
    }
    box(0xc68944,-.056,.058,-.010,.059,.024,.087,group).rotation.y=-.46;
    for(let i=0;i<11;i++){
      const angle=i*2.399,radius=.043+(i%4)*.016;
      box(i%2?0x6a9548:0xa0b25c,Math.cos(angle)*radius,.053,Math.sin(angle)*radius,.011,.005,.015,group).rotation.y=angle;
    }
  }

  function jjajangmyeon(group){
    topping(group,0xe4bd7d,0,.015,0,.111,.027,.106);
    pastaLayers.forEach((noodles,i)=>shape(noodles,i%3===0?0xe8bd6d:0xf4d17d,0,.028,0,group));
    topping(group,0x4b3022,-.013,.038,-.008,.089,.022,.077);
    topping(group,0x694531,-.018,.052,-.014,.068,.014,.069);
    for(let i=0;i<12;i++){
      const angle=i*2.399,radius=.019+(i%5)*.013;
      box(i%3?0x64402d:0x95643a,-.015+Math.cos(angle)*radius,.059,Math.sin(angle)*radius,.027,.015,.019,group).rotation.y=angle;
    }
    for(let i=0;i<7;i++){
      box(i%2?0x639053:0x9ab169,.020+i*.008,.067,.033,.007,.007,.044,group).rotation.y=.43+i*.065;
    }
  }

  function friedRice(group){
    topping(group,0xcf9e5d,0,.009,0,.104,.041,.097);
    for(let i=0;i<39;i++){
      const angle=i*2.399,radius=.021+(i%9)*.009;
      const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,h=.052-radius*.28+Math.sin(i)*.003;
      topping(group,i%3?0xe3bb77:0xf2cd8e,x,h,z,.0048,.0035,.0087).rotation.y=angle;
      if(i%3===0)box(i%2?0xe8b84c:0xd77e40,x+.004,h+.004,z+.002,.009,.006,.011,group).rotation.y=angle+.42;
      if(i%5===0)topping(group,0x689143,x-.010,h+.004,z,.0068,.005,.0067);
    }
  }

  function tray(dish,color,{plate=false,utensilKind="spoon",fries=false}={}){
    return group=>{
      const trayColor=0x663b27,w=DINING_TRAY_WIDTH,d=.43;
      box(trayColor,0,.018,0,w,.036,d,group);
      box(0x925b3e,0,.038,0,w-.041,.008,d-.036,group);
      for(const edge of [-1,1]){
        box(trayColor,edge*(w/2-.010),.041,0,.020,.020,d,group);
        box(trayColor,0,.041,edge*(d/2-.010),w,.020,.020,group);
      }
      const bowl=new T.Group(),food=new T.Group();
      bowl.position.set(-.048,.100,.024);group.add(bowl);bowl.add(food);
      shape(plate?plateGeometry:bowlGeometry,color,0,0,0,bowl);
      food.name="meal food";dish(food);
      cylinder(0xf1ead7,.189,.055,.083,.072,.025,16,group,1.06);
      const sides=[];
      for(let i=0;i<4;i++){
        const side=fries?box(i%2?0xeeb85d:0xd49a51,.189+(i-1.5)*.020,.073,.083+(i%2)*.023,.012,.014,.068,group):
          box(i%2?0xb04b2c:0xc36c40,.189+(i-1.5)*.019,.076,.083+(i%2)*.026,.027,.015,.029,group);
        side.rotation.y=.68*i;
        sides.push(side);
      }
      const utensil=makeUtensil(group);
      utensil.group.position.set(.212,.052,-.153);
      utensil.group.rotation.y=-.27;
      utensil.show(utensilKind);
      let shownPortions=3,utensilInHand=false;
      return {update(age,remaining){
        const eating=age>=0;
        if(eating!==utensilInHand){
          utensilInHand=eating;utensil.show(eating?null:utensilKind);
        }
        const portions=remaining===undefined?3:Math.min(3,Math.max(0,remaining+Number(eating&&age<.65)));
        if(portions===shownPortions)return;
        shownPortions=portions;
        const {width,height,offset,sides:sideCount}=portionProfiles[portions];
        food.visible=portions>0;
        food.scale.set(width,height,width);
        food.position.y=offset;
        sides.forEach((pickle,index)=>{pickle.visible=index<sideCount;});
      }};
    };
  }
  function ssambap(group){
    for(let i=0;i<5;i++){
      const angle=i*2.4,x=Math.cos(angle)*.059,z=Math.sin(angle)*.054;
      const leaf=topping(group,i%2?0x6c8f47:0x829b4c,x,-.012+i*.004,z,.054,.012,.036);
      leaf.rotation.y=-angle;
      box(0xa9b96b,x,.008+i*.003,z,.067,.003,.003,group).rotation.y=-angle;
    }
    for(const [x,z] of [[.04,.033],[-.037,-.032],[.010,-.055]]){
      topping(group,0xf4e4c5,x,.018,z,.032,.016,.027);
      topping(group,0x96623b,x+.004,.031,z+.004,.012,.007,.014);
    }
  }
  return {ssambapSet:tray(ssambap,0xd9ceac,{plate:true,utensilKind:"chopsticks"}),
    bibimbap:tray(bibimbap,0x453c32),mushroomSoup:tray(mushroomSoup,0xdccca5),
    buckwheatNoodles:tray(buckwheatNoodles,0x393635,{utensilKind:"chopsticks"}),jangGukbap:tray(jangGukbap,0x4c4138),
    sujebi:tray(sujebi,0xd7ccb1),mushroomPasta:tray(mushroomPasta,0x576a65,{plate:true,utensilKind:"fork"}),
    beefCurry:tray(beefCurry,0xeadbc3,{plate:true}),chickenSandwich:tray(chickenSandwich,0xeee4ca,{plate:true,utensilKind:"fork",fries:true}),
    udon:tray(udon,0x455946,{utensilKind:"chopsticks"}),jjajangmyeon:tray(jjajangmyeon,0xe3d5bd,{utensilKind:"chopsticks"}),
    friedRice:tray(friedRice,0x5e7994,{plate:true})};
}
