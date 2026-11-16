export function makeDiningDishes(T,{shape,cylinder,box}){
  const bowlGeometry=new T.LatheGeometry([
    [0,-.056],[.068,-.056],[.073,-.047],[.076,-.035],[.105,-.011],[.127,.039],[.129,.048],
    [.117,.051],[.109,.030],[.082,-.005],[.062,-.018],[0,-.018]
  ].map(([radius,height])=>new T.Vector2(radius,height)),20);
  const sphere=new T.IcosahedronGeometry(1,1);
  const pepper=[0x922e19,0xbd4824,0xab3922];

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
  return {bibimbap,mushroomSoup};
}
