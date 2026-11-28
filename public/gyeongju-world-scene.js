import {parkBoundary,parkEntrance,parkFountain,parkPavilions,parkRides,parkWalkways} from "./gyeongju-world-layout.js";
import {standSign} from "./regional-stands.js";

export function buildGyeongjuWorld(T,root,kit){
  const steel=0x4b647a,cream=0xf3d79e,blue=0x387188,brick=0xb8624e;
  const {box,cylinder,shape}=kit;
  function beam(parent,a,b,r,color=steel){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(start);
    const middle=start.addScaledVector(axis,.5);
    const pole=cylinder(color,middle.x,middle.y,middle.z,r,axis.length(),8,parent);
    pole.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
    return pole;
  }
  function ground(points,color,height){
    const outline=new T.Shape(points.map(({x,z})=>new T.Vector2(x,-z)));
    const geo=new T.ShapeGeometry(outline);
    geo.rotateX(-Math.PI/2);
    shape(geo,color,0,height,0,root).receiveShadow=true;
  }
  function at(parent,x,y,z){
    const group=new T.Group();group.position.set(x,y,z);parent.add(group);return group;
  }
  function sign(parent,text,x,y,z,width){
    standSign(T,parent,text,null,width,x,y,z,"#244954","#fff0ca",width*.21);
  }
  ground(parkBoundary,0x8f9b68,0);
  box(0x477680,5817,-.4,-137,320,.25,760,root);
  for(const path of parkWalkways){
    for(const p of path)cylinder(0xd3bb96,p.x,.024,p.z,4.3,.04,16,root);
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i];
      const slab=box(0xd3bb96,(a.x+b.x)/2,.024,(a.z+b.z)/2,8.6,.04,Math.hypot(b.x-a.x,b.z-a.z),root);
      slab.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
    }
  }
  const gate=at(root,parkEntrance.x-5,0,parkEntrance.z-7);
  gate.rotation.y=.68;
  for(const x of [-9,9]){
    box(brick,x,3.25,0,3.7,6.5,3.9,gate);
    cylinder(blue,x,7.3,0,2.85,2.2,4,gate,0);
  }
  box(blue,0,5.2,0,16,1.56,2.8,gate);
  sign(gate,"경주월드",0,5.25,1.42,8);
  cylinder(0xd9c5a1,parkEntrance.x-22,.03,parkEntrance.z-27,23,.055,40,root);
  const fountain=at(root,parkFountain.x,0,parkFountain.z);
  cylinder(cream,0,.24,0,5.7,.48,28,fountain);
  cylinder(0x65a5ad,0,.49,0,5.25,.05,28,fountain);
  cylinder(0x6f847f,0,1.42,0,.26,1.9,10,fountain,.54);
  for(const {x,z} of parkPavilions){
    const pavilion=at(root,x,0,z);
    box(cream,0,1.65,0,8,3.3,4.8,pavilion);
    box(blue,0,3.32,0,8.8,.32,5.5,pavilion);
    box(brick,0,2.9,2.53,8,.22,.39,pavilion);
    for(const dx of [-2.28,2.28])box(0x577784,dx,1.82,2.42,1.9,1.1,.08,pavilion);
  }
  for(const ride of parkRides){
    const signGroup=at(root,ride.gate.x+4,0,ride.gate.z-4);
    signGroup.rotation.y=.55;
    box(steel,-1.45,1.18,0,.09,2.36,.09,signGroup);
    box(steel,1.45,1.18,0,.09,2.36,.09,signGroup);
    sign(signGroup,ride.name,0,2.45,0,3.36);
  }
  for(const path of parkWalkways){
    for(const p of path.slice(1,-1)){
      cylinder(steel,p.x+5,1.7,p.z,.09,3.4,8,root);
      cylinder(cream,p.x+5,3.42,p.z,.28,.34,8,root);
    }
  }
  for(let i=0;i<parkBoundary.length;i++){
    const a=parkBoundary[i],b=parkBoundary[(i+1)%parkBoundary.length];
    const count=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/12);
    for(let j=1;j<count;j++){
      const x=a.x+(b.x-a.x)*j/count,z=a.z+(b.z-a.z)*j/count;
      const height=3.5+(i*3+j*7)%5;
      cylinder(0x695340,x,height*.29,z,.27,height*.58,6,root);
      cylinder(j%2?0x486a55:0x5f784a,x,height*.66,z,height*.31,height*.72,7,root,.18);
    }
  }

  const [wheelRide,vikingRide,bumperRide,coasterRide]=parkRides;
  const wheelBase=at(root,wheelRide.x,0,wheelRide.z);wheelBase.rotation.y=-.26;
  const wheel=at(wheelBase,0,26,0),cabins=[];
  for(const side of [-1,1]){
    for(const x of [-11,11])beam(wheelBase,[x,0,side*4],[0,26,side*1.3],.45);
    const rim=shape(new T.TorusGeometry(23,.28,7,72),0xe6b84c,0,0,side*1.12,wheel);
    rim.castShadow=true;
  }
  for(let i=0;i<16;i++){
    const angle=i*Math.PI/8,x=23*Math.sin(angle),y=-23*Math.cos(angle);
    beam(wheel,[0,0,0],[x,y,0],.16,0xe6b84c);
    const cabin=at(wheel,x,y,0);
    const cabinColor=i%2?0x795691:0xddae4c;
    box(cabinColor,0,-1.17,0,2.45,.26,2,cabin);
    for(const side of [-1,1]){
      box(cabinColor,side*1.15,-.77,0,.12,.61,1.95,cabin);
      for(const end of [-1,1])box(cabinColor,side*1.15,-.57,end*.93,.15,1.81,.15,cabin);
    }
    box(cabinColor,0,-.77,-.96,2.25,.62,.10,cabin);
    for(const side of [-1,1])box(cream,0,-.72,side*.61,2.04,.15,.62,cabin);
    box(cream,0,.39,0,2.65,.17,2.15,cabin);
    box(cabinColor,0,-.93,.96,2.23,.28,.1,cabin);
    cabins.push(cabin);
  }
  box(0xe0c29f,0,.65,2.7,12,1.3,5,wheelBase);

  const vikingBase=at(root,vikingRide.x,0,vikingRide.z);vikingBase.rotation.y=-.76;
  const swing=at(vikingBase,0,14,0),ship=at(swing,0,-12.5,0);
  for(const side of [-1,1]){
    beam(vikingBase,[side*3,0,-7],[side*3,14,0],.33);
    beam(vikingBase,[side*3,0,7],[side*3,14,0],.33);
    beam(swing,[side*2,0,0],[side*1.5,-12.5,0],.18);
  }
  box(0x813e36,0,-.5,0,3.65,1.3,12,ship);
  for(let i=-3;i<=3;i++)box(cream,0,.26,i*1.45,3,.21,.46,ship);
  for(const end of [-1,1]){
    const prow=box(0xb87e43,0,.04,end*6.27,3.1,.88,2.75,ship);
    prow.rotation.x=-end*.62;
    box(cream,0,.82,end*7,2.45,.15,.34,ship);
  }

  const arena=at(root,bumperRide.x,0,bumperRide.z),cars=[];
  cylinder(0x526570,0,.08,0,10.7,.16,32,arena);
  cylinder(0xd6a15b,0,4.74,0,11,.48,32,arena);
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6;
    cylinder(blue,10.55*Math.cos(angle),2.4,10.55*Math.sin(angle),.13,4.72,8,arena);
  }
  for(const color of [brick,0x4caab5,0xe8ba66,0x8269a3,0x7c9a6e]){
    const car=at(arena,0,.15,0);
    cylinder(0x242f36,0,.19,0,.92,.28,14,car);
    box(color,0,.42,0,1.37,.38,1.5,car);
    box(cream,0,.72,.34,.92,.5,.28,car);
    cylinder(steel,.28,1,.58,.025,1.87,6,car);
    cars.push(car);
  }

  const coaster=at(root,coasterRide.x,0,coasterRide.z);
  const track=new T.CatmullRomCurve3([
    [-31,3,35],[-26,5,18],[-12,22,-9],[3,47,-35],[10,61,-55],[24,61,-64],
    [36,56,-65],[39,27,-65],[44,7,-61],[69,9,-47],[87,32,-27],[70,36,-10],
    [46,20,2],[55,12,24],[75,20,48],[48,14,69],[8,6,65],[-24,4,52]
  ].map(p=>new T.Vector3(...p)),true,"centripetal");
  for(const side of [-1,1]){
    const points=Array.from({length:161},(_,i)=>{
      const t=(i%160)/160,p=track.getPoint(t),d=track.getTangent(t);
      const length=Math.hypot(d.x,d.z)||1;
      return p.add(new T.Vector3(d.z/length*side*.63,0,-d.x/length*side*.63));
    });
    const rail=new T.CatmullRomCurve3(points.slice(0,-1),true);
    shape(new T.TubeGeometry(rail,196,.25,7,true),0xe5ac37,0,0,0,coaster);
  }
  for(let i=0;i<33;i++){
    const p=track.getPoint(i/33);
    beam(coaster,[p.x-2.6,0,p.z],[p.x,p.y-.23,p.z],.23,0x32596c);
    if(p.y>18)beam(coaster,[p.x+3.6,0,p.z],[p.x,p.y-.23,p.z],.23,0x32596c);
  }
  const train=at(coaster,0,0,0);
  for(let row=0;row<3;row++){
    box(blue,0,-.04,row*1.02,3.25,.28,.96,train);
    for(let seat=0;seat<4;seat++)box(brick,(seat-1.5)*.76,.44,row*1.02+.26,.44,.65,.38,train);
  }
  const eye=new T.Vector3(),target=new T.Vector3(),forward=new T.Vector3(),up=new T.Vector3(0,1,0);
  const trainFrame=new T.Matrix4(),facing=new T.Quaternion();
  const seats={
    wheel:Array.from({length:4},(_,i)=>({object:cabins[0],x:i<2?-.46:.46,y:-1.13,z:i%2?-.59:.59,yaw:i%2?0:Math.PI})),
    viking:Array.from({length:14},(_,i)=>({object:ship,x:i%2?.73:-.73,y:-.19,z:[0,-1,1,-2,2,-3,3][i>>1]*1.45,yaw:Math.PI})),
    coaster:Array.from({length:12},(_,i)=>({object:train,x:(i%4-1.5)*.76,y:-.28,z:Math.floor(i/4)*1.02,yaw:Math.PI})),
    bumper:cars.map(object=>({object,x:0,y:.02,z:.12,yaw:Math.PI}))
  };
  const timings=[[0,0],[11,.275],[13,.319],[14.6,.319],[17,.40],[21,.55],[29,.74],[38,.93],[42,1]];
  function coasterProgress(seconds){
    const i=timings.findIndex(([time])=>time>=seconds);
    if(i<=0)return i===0?0:1;
    const [start,a]=timings[i-1],[end,b]=timings[i];
    return a+(b-a)*(seconds-start)/(end-start);
  }
  function pose(camera,object,seat,look){
    camera.position.copy(object.localToWorld(eye.set(...seat)));
    camera.lookAt(object.localToWorld(target.set(...look)));
  }
  return function update(camera,active,clock,sessions,models){
    function seconds(kind,duration){
      const shared=sessions.find(ride=>ride.kind===kind);
      return shared?Math.max(0,(clock-shared.starts)/1000):(clock/1000)%duration;
    }
    wheel.rotation.z=seconds("wheel",64)/64*Math.PI*2;
    for(const cabin of cabins)cabin.rotation.z=-wheel.rotation.z;
    const swingTime=seconds("viking",34);
    swing.rotation.x=Math.sin(swingTime*1.02)*1.13*Math.max(0,Math.min(1,swingTime/8,(34-swingTime)/6));
    const t=coasterProgress(seconds("coaster",42));
    train.position.copy(track.getPoint(t));
    forward.copy(train.position).add(track.getTangent(t));
    train.quaternion.setFromRotationMatrix(trainFrame.lookAt(train.position,forward,up));
    const sharedCars=sessions.find(ride=>ride.kind==="bumper")?.cars;
    cars.forEach((car,i)=>{
      if(sharedCars){
        const {x,z,yaw}=sharedCars[i];car.position.set(x,.15,z);car.rotation.y=yaw;return;
      }
      const path=(clock/1000)*(.34+i*.06)+i*1.48,distance=3+i*1.35;
      car.position.x=Math.cos(path)*distance;car.position.z=Math.sin(path)*distance;
      car.rotation.y=-path;
    });
    for(const session of sessions){
      for(const rider of session.riders){
        const model=models.get(rider.id);
        if(!model?.group.parent)continue;
        const {object,x,y,z,yaw}=seats[session.kind][rider.seat];
        object.localToWorld(model.group.position.set(x,y,z));
        object.getWorldQuaternion(model.group.quaternion);
        model.group.quaternion.multiply(facing.setFromAxisAngle(up,yaw));
        model.ridePose=true;
      }
    }
    if(!active)return;
    const {object,x,z}=seats[active.id][active.seat];
    if(active.id==="wheel"){
      const side=Math.sign(z);
      pose(camera,object,[x,.04,z],[x+.32,-.22,z-side*3.4]);
    }else if(active.id==="bumper")pose(camera,object,[0,2.2,3.6],[0,.72,-3.4]);
    else pose(camera,object,[x*.62,2.04,z+2.55],[x*.55,.95,z-3.4]);
  };
}
