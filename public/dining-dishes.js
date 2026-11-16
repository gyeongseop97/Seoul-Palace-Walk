export const DINING_TRAY_WIDTH=.62;
export function diningGesture(tray,seat){
  if(!seat?.tray||!tray||tray.itemAge<0||tray.itemAge>=tray.spec.duration)return null;
  const phase=tray.itemAge/tray.spec.duration;
  const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
  return {lift:smooth((phase-.18)/.31)*smooth((1-phase)/.32),
    dip:Math.sin(Math.PI*Math.min(1,phase/.30)),utensil:tray.spec.utensil==="chopsticks"?"chopsticks":"spoon"};
}

export function makeDiningUtensil(T){
  const oval=new T.SphereGeometry(1,14,8),rod=new T.CylinderGeometry(1,1,1,10);
  const metal=new T.MeshStandardMaterial({color:0xc7d2d4,roughness:.29,metalness:.54});
  const wood=new T.MeshStandardMaterial({color:0x703c27,roughness:.48});
  function piece(parent,geometry,material,x,y,z,w,h,d){
    const mesh=new T.Mesh(geometry,material);parent.add(mesh);
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);return mesh;
  }
  return parent=>{
    const group=new T.Group(),spoon=new T.Group(),chopsticks=new T.Group();
    parent.add(group);group.add(spoon,chopsticks);group.visible=false;
    const handle=piece(spoon,rod,metal,0,0,.043,.008,.18,.008);handle.rotation.x=Math.PI/2;
    piece(spoon,oval,metal,0,-.006,.158,.029,.010,.038);
    for(const side of [-1,1]){
      const stick=piece(chopsticks,rod,wood,side*.010,0,.062,.0047,.265,.0047);
      stick.rotation.set(Math.PI/2,0,side*.035,"YXZ");
    }
    return {group,show(kind){
      group.visible=Boolean(kind);spoon.visible=kind==="spoon";chopsticks.visible=kind==="chopsticks";
    }};
  };
}

export function makeDiningDishes(T,{shape,cylinder,box}){
  const bowlGeometry=new T.LatheGeometry([
    [0,-.056],[.068,-.056],[.073,-.047],[.076,-.035],[.105,-.011],[.127,.039],[.129,.048],
    [.117,.051],[.109,.030],[.082,-.005],[.062,-.018],[0,-.018]
  ].map(([radius,height])=>new T.Vector2(radius,height)),20);
  const sphere=new T.IcosahedronGeometry(1,1);
  const pepper=[0x922e19,0xbd4824,0xab3922];
  const makeUtensil=makeDiningUtensil(T);

  function topping(group,color,x,y,z,a,b,c){
    const item=shape(sphere,color,x,y,z,group);
    item.scale.set(a,b,c);
    return item;
  }
  function bibimbap(group){
    shape(bowlGeometry,0x453c32,0,0,0,group);
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
    shape(bowlGeometry,0xdccca5,0,0,0,group);
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

  function buckwheatNoodles(group){
    shape(bowlGeometry,0x393635,0,0,0,group);
    cylinder(0x604c3b,0,.025,0,.112,.016,20,group,1.025);
    for(let loop=0;loop<10;loop++){
      const radius=.058+(loop%4)*.011,points=[];
      for(let segment=0;segment<=20;segment++){
        const angle=segment*.285+loop*.73,reach=radius+Math.sin(segment*.87+loop)*.011;
        points.push(new T.Vector3(Math.cos(angle)*reach,.045+Math.sin(segment*.54+loop)*.005+loop*.001,
          Math.sin(angle)*reach));
      }
      const noodles=new T.TubeGeometry(new T.CatmullRomCurve3(points),18,.0036,4,false);
      shape(noodles,loop%3===0?0xbfa279:0x9f7d5e,0,0,0,group);
    }
    for(let i=0;i<6;i++){
      const cucumber=box(i%2?0xa7b46f:0x6b8b54,-.045+i*.011,.070,.035,.009,.013,.064,group);
      cucumber.rotation.y=i*.25-.55;
    }
    topping(group,0xf7f1d5,.039,.057,-.04,.032,.016,.037);
    topping(group,0xe7bb51,.041,.068,-.037,.017,.012,.017);
    topping(group,0xb84331,-.021,.068,-.039,.019,.011,.024);
  }

  function jangGukbap(group){
    shape(bowlGeometry,0x4c4138,0,0,0,group);
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
    shape(bowlGeometry,0xd7ccb1,0,0,0,group);
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

  function tray(dish,withSticks=false){
    return group=>{
      const trayColor=0x663b27,w=DINING_TRAY_WIDTH,d=.43;
      box(trayColor,0,.018,0,w,.036,d,group);
      box(0x925b3e,0,.038,0,w-.041,.008,d-.036,group);
      for(const edge of [-1,1]){
        box(trayColor,edge*(w/2-.010),.041,0,.020,.020,d,group);
        box(trayColor,0,.041,edge*(d/2-.010),w,.020,.020,group);
      }
      const bowl=new T.Group();bowl.position.set(-.048,.100,.024);group.add(bowl);dish(bowl);
      cylinder(0xf1ead7,.189,.055,.083,.072,.025,16,group,1.06);
      for(let i=0;i<4;i++){
        const pickle=box(i%2?0xb04b2c:0xc36c40,.189+(i-1.5)*.019,.076,.083+(i%2)*.026,.027,.015,.029,group);
        pickle.rotation.y=.68*i;
      }
      const utensil=makeUtensil(group);
      utensil.group.position.set(.212,.052,-.153);
      utensil.group.rotation.y=-.27;
      const kind=withSticks?"chopsticks":"spoon";
      utensil.show(kind);
      return {update(age){utensil.show(age>=0?null:kind);}};
    };
  }
  return {bibimbap:tray(bibimbap),mushroomSoup:tray(mushroomSoup),buckwheatNoodles:tray(buckwheatNoodles,true),
    jangGukbap:tray(jangGukbap),sujebi:tray(sujebi)};
}
