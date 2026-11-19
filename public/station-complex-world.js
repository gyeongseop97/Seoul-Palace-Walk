import {concourseParts,metroInsidePoint,hallOrigin,liftAt,liftBanks,floorName,partAt,railPoint,storeys} from "./station-levels.js";
import {stationHall,railPlatform} from "./rail-station-layout.js";
import {stationDining} from "./dining-data.js";
import {buildRailRoom} from "./rail-station-world.js";
import {buildDiningInterior} from "./dining-world.js";
import {standSign} from "./regional-stands.js";

export function* buildStationComplex(T,root,kit,venue,walkerModels){
  yield* buildRailRoom(T,root,kit,stationHall);
  yield* buildRailRoom(T,root,kit,railPlatform);
  const food=new T.Group();food.position.y=storeys[2];
  const restaurant=yield* buildDiningInterior(T,food,kit,stationDining,walkerModels);
  const hall=new T.Group();hall.position.set(kit.wx(hallOrigin.x),0,kit.wz(hallOrigin.y));root.add(hall);
  const moving=new T.Group(),rails=0x677b82,metal=0xbac8c9,tiles=0xc6c4b9;
  const box=(c,x,h,z,w,d,l,p=hall)=>kit.box(c,x,h,z,w,d,l,p);
  const group=(x,h,z,p=hall)=>{const g=new T.Group();g.position.set(x,h,z);p.add(g);return g;};
  function sign(x,h,z,title,sub,angle=0,w=5){
    const g=group(x,h,z);g.rotation.y=angle;standSign(T,g,title,sub,w,0,0,0,"#26465a","#fff5d7",.84);
  }
  function beam(a,b,width,color){
    const v=new T.Vector3(...a),distance=new T.Vector3(...b).sub(v);
    box(color,v.x+distance.x/2,v.y+distance.y/2,v.z+distance.z/2,width,distance.length(),width)
      .quaternion.setFromUnitVectors(new T.Vector3(0,1,0),distance.normalize());
  }
  // Enclose the stepped halls in a common glazed atrium. A clear span remains above the tracks.
  box(0x727978,-3,-12.1,-28,98,.8,245);
  for(let z=-69;z<=-29;z+=5){
    const ridge=12.4+.7*Math.cos((z+49)/24);
    for(const [a,b] of [[-41,-17],[-12,10]]){
      box(0xcdD7d5,(a+b)/2,ridge,z,b-a,.20,5.04);
      box(0x72868b,(a+b)/2,ridge-.3,z,b-a,.24,.18);
    }
    box(0xbed4d6,-14.5,ridge+.25,z,5.2,.16,5.03);
    for(const u of [-40,9]){
      if(u===-40&&z>=-69&&z<=-64)continue;
      box(0x9fbac0,u,2.7,z,.23,18.5,5.04);
      box(0x667e85,u,3.05,z-2.48,.32,19.2,.14);
      for(const level of [-4,-.4,3.2,6.8,10.4])box(0xd0d7d3,u+(u<0?.15:-.15),level,z,.13,.14,5);
    }
    for(const u of [-38,6])if(z%10===-9){
      box(0x9aacac,u,2.3,z,.45,19,.45);
      beam([u,10.3,z],[u+(u<0?4:-4),ridge-.35,z],.22,metal);
    }
  }
  for(let z=-22;z<2;z+=4.4){
    box(0x9db5bc,-31,1.9,z,.24,14.6,4.44);box(metal,-30.8,1.9,z-2.13,.18,14.8,.10);
    box(0xd4dbd5,-26,9.1,z,10,.18,4.45);
  }
  for(let z=-65;z<-45;z+=6)for(const u of [-34,-15]){
    box(0xa3aeab,u,-.5,z,.72,11.2,.72);
    beam([u,2.1,z],[u+(u< -25?2:-2),4.8,z],.24,metal);
  }
  const belts=[];
  for(const p of concourseParts){
    const {x0,x1,z0,z1,h,style}=p,w=x1-x0,d=z1-z0,x=(x0+x1)/2,z=(z0+z1)/2;
    if(style==="lift")continue;
    if(style==="stairs"){
      const n=Math.ceil(Math.abs(h-p.back)/.16),dz=d/n,rise=p.back-h;
      for(let i=0;i<n;i++){
        const level=h+rise*(i+.5)/n,mid=z0+(i+.5)*dz;
        box(i%2?tiles:0xbab9ad,x-w*.2,level-.13,mid,w*.60,.26,dz+.012);
        box(0xeee4c7,x-w*.2,level+.008,mid-Math.sign(rise)*dz*.46,w*.60,.019,.047);
      }
      for(const u of [x0,x0+w*.60,x1])beam([u,h+.98,z0],[u,p.back+.98,z1],.115,rails);
      const escalatorWidth=w*.4;
      const colors=[0x536572,0xc8a454];
      for(const dir of [-1,1]){
        const stepGeometry=new T.BoxGeometry(escalatorWidth/2-.09,.19,dz+.006);
        const tread=new T.InstancedMesh(stepGeometry,kit.matte(colors[0]),n);
        const nose=new T.InstancedMesh(new T.BoxGeometry(escalatorWidth/2-.09,.012,.044),kit.matte(colors[1]),n);
        for(const m of [tread,nose]){m.frustumCulled=false;moving.add(m);}
        belts.push({p,tread,nose,n,dz,dir,x:x1-escalatorWidth*(dir<0?.75:.25)});
      }
      for(const u of [x0+w*.60,x1]){
        const bal=box(0x8faeb3,u,h+rise*.5+.44,z,.10,.83,Math.hypot(d,rise));bal.rotation.x=-Math.atan2(rise,d);
        for(const t of [.03,.5,.97])box(rails,u,h+rise*t+.48,z0+d*t,.11,.96,.11);
      }
    }else if(!["hall","platform","dining"].includes(style)){
      box(style==="garden"?0xa8a994:style==="bridge"?0xbac5c2:tiles,x,h-.17,z,w,.34,d);
      for(let v=z0+2;v<z1;v+=2)box(0xa1a79f,x,h+.004,v,w,.008,.025);
      if(["west","retail","transfer","arcade","terminal","gates","metro","arexPlatform"].includes(style)){
        box(0xdadbd3,x,h+5.8,z,w,.22,d);
        for(let v=z0+2;v<z1;v+=5)box(0xffeed0,x,h+5.63,v,Math.min(5,w*.65),.065,.22);
        for(const u of [x0+.25,x1-.25])for(const v of [z0+.4,z1-.4])box(metal,u,h+2.85,v,.28,5.7,.28);
        if(style==="retail"||style==="arcade"){
          for(let u=x0+2;u<x1-1;u+=3.5){
            box(0x55717a,u,h+1.7,z0+.16,3.25,3.4,.2);box(0xd1aa76,u,h+3.68,z0+.27,3.32,.37,.43);
          }
        }
      }
    }
    // Leave adjoining slabs open. Railings bound the actual drops, including on the mezzanine.
    if(style!=="stairs"&&style!=="platform"){
      const exterior=(u,v)=>{const at=railPoint(u,v),q=partAt(at.x,at.y);
        if(!q)return true;if(q.style==="lift")return false;
        const next=q.back==null?q.h:q.h+(q.back-q.h)*(v-q.z0)/(q.z1-q.z0);return Math.abs(next-h)>.65;};
      for(const [ax,az,bx,bz,nx,nz] of [[x0,z0,x1,z0,0,-1],[x0,z1,x1,z1,0,1],[x0,z0,x0,z1,-1,0],[x1,z0,x1,z1,1,0]]){
        const count=Math.ceil(Math.hypot(bx-ax,bz-az)/1.6);
        for(let i=0;i<count;i++){
          const t=(i+.5)/count,u=ax+(bx-ax)*t,v=az+(bz-az)*t;
          if(!exterior(u+nx*.28,v+nz*.28))continue;
          if(h< -9)box(0xb1bab7,u,h+2.65,v,Math.max(.16,(bx-ax)/count),5.3,Math.max(.16,(bz-az)/count));
          box(rails,u,h+.55,v,.073,1.10,.073);
          box(metal,u,h+1.09,v,Math.max(.095,(bx-ax)/count),.10,Math.max(.095,(bz-az)/count));
        }
      }
    }
    if(style==="terminal"){
      sign(x,h+3.25,z0+1,"도심공항터미널","CITY AIRPORT TERMINAL",0,7);
      for(let u=x0+2;u<x1-2;u+=3){box(0x648288,u,h+1.02,z0+1.5,2.8,1.98,.55);box(0x283b44,u,h+2.35,z0+1.7,1.35,.71,.12);}
    }
    if(style==="gates"){
      sign(x,h+3.5,z0+2,"일반열차 개찰구","ALL STOP TRAIN",0,6);
      for(let u=x0+3;u<x1-2;u+=2.4)box(0x719192,u,h+.49,z0+2.6,.29,.98,1.85);
    }
    if(style==="arexPlatform"){
      for(const u of [x0,x1])for(let v=z0+1.5;v<z1;v+=3){
        if(u===x0&&Math.abs(v+81)<3)continue;
        box(0x899da0,u,h+1.45,v,.16,2.9,2.96);box(0x475d67,u,h+1.72,v,.23,1.43,2.68);
        box(0xe8c36f,u+(u===x0?.34:-.34),h+.014,v,.23,.026,3);
      }
      sign(x,h+3.4,z0+6,"공항철도 서울역","직통 · 일반열차",0,4);
    }
    if(style==="atrium"){
      box(0xd9ddd7,x,10.85,z,w,.25,d);
      for(let u=x0+2;u<x1;u+=5.4){
        beam([u,8.8,z0],[u,10.45,z1],.24,0x3066a2);
        for(let k=0;k<3;k++)beam([u,8.9+k*.49,z0+k*d/3],[u,10.52,z0+(k+1)*d/3],.16,0xe4e4db);
      }
      if(z1===19)for(let u=x0+1;u<x1;u+=3.6){
        box(0x90afb9,u,5.34,z1-.1,3.51,10.4,.16);box(0xdce2df,u-1.76,5.34,z1-.14,.14,10.6,.30);
      }
      box(0xc2a56d,x,.023,z,w,.024,.32);
    }
    if(style==="atrium"&&x0===-56&&z0===10){
      box(0x233e49,x,4.35,z1-.4,23,1.65,.24);
      for(const [index,title] of ["KTX  타는 곳","열차 출발 안내","서부광장  →"].entries())sign(x+(index-1)*7.45,4.35,z1-.58,title,"SEOUL STATION",Math.PI,6.9);
    }
    if(style==="metro"){
      for(let v=z0+3;v<z1;v+=6){
        kit.cylinder(0xe3e3db,x,h+2.55,v,.44,5.1,16,hall);
        box(0xe9c467,x-3.5,h+.018,v,.28,.024,6);
      }
      for(const number of [2,3,4,5,6,7,8,9,"9-1",10,11,12,13,14]){
        const pt=metroInsidePoint(number),xx=pt.x-hallOrigin.x,zz=pt.y-hallOrigin.y,left=xx<x;
        const doorX=left?x0+.26:x1-.26;
        box(0x4b6168,doorX,h+1.55,zz,.21,3.1,2.2);
        sign(doorX+(left?.20:-.20),h+3.42,zz,number+"번 출구","EXIT",left?Math.PI/2:-Math.PI/2,2.7);
      }
    }
    if(style==="garden")for(let i=0;i<6;i++){
      const u=x0+1.8+(i%3)*4.8,v=z0+2+Math.floor(i/3)*8;
      box(0xb0aba0,u,h+.31,v,2.8,.62,2.1);
      kit.cylinder(0x765e49,u,h+1.37,v,.12,2.2,9,hall);
      const crown=new T.Mesh(new T.IcosahedronGeometry(1.45,1),kit.matte(i%2?0x7a916e:0x8f9a6e));
      crown.position.set(u,h+2.8,v);hall.add(crown);
    }
    yield;
  }
  sign(-23,3.1,6,"서부 맞이방  ·  공항철도","WEST EXIT   /   AIRPORT RAILROAD",Math.PI/2,6);
  sign(35,3.1,6,"쇼핑 · 마트","MARKET", -Math.PI/2);
  sign(44,2.95,10,"쇼핑동 데크 출입구","PLAZA EXIT",Math.PI);
  sign(-72,3.15,-5.6,"↓ 공항철도 · 환승통로","AREX   /   METRO",0,6);
  sign(-98,2.95,11,"서부 출입구","WEST EXIT",Math.PI/2);
  sign(-72,-7.5,-44.8,"지하철 1 · 4호선   공항철도","환승통로",0,7.3);
  sign(-101,-7.7,-42,"15번 출구","서부광장",0,3.7);
  sign(45,3.2,0,"경의중앙선","지상 출입구",0,3.6);
  sign(38,3,0,"마트 서쪽 출입구","WEST PLAZA",0,4.0);
  sign(38,3,15,"북측 보행육교","PEDESTRIAN BRIDGE",Math.PI,3.8);
  sign(-19,8.25,-49,"3F 식당가","FOOD HALL",0);
  sign(-31,8.4,-70,"4F ↑ 옥상정원 · 상가","ROOF GARDEN",0);
  sign(-21,12.8,-100,"옥상정원  →","THE ROOF ATELIER",0);
  const cars=[];
  for(const bank of liftBanks){
    const cx=bank.center.x-hallOrigin.x,cz=bank.center.y-hallOrigin.y;
    const car=group(cx,0,cz,moving);
    box(0x646e70,0,-.12,0,2.98,.24,2.98,car);box(0xc1cdcc,0,2.76,0,3,.16,3,car);
    box(0xffefd0,0,2.66,0,2,.045,1.8,car);
    const doors=[];
    for(const [index,stop] of bank.stops.entries()){
      const {dx,dz,floor}=stop,h=bank.levels[index],a=Math.atan2(dx,dz);
      const frame=group(cx+dx*1.62,h,cz+dz*1.62);frame.rotation.y=a;
      for(const u of [-1.53,1.53])box(rails,u,1.44,0,.13,2.9,.15,frame);
      box(metal,0,2.86,0,3.16,.21,.26,frame);
      standSign(T,frame,floorName(floor)+"  승강기",stop.name,1.62,0,3.22,.12,"#294d61","#fff3c8",.57);
      const mounts=group(frame.position.x,h,frame.position.z,moving);mounts.rotation.y=a;
      for(const side of [-1,1]){
        const leaf=group(side*.73,0,0,mounts);
        box(0x718892,0,.52,0,1.42,1.04,.09,leaf);
        box(0xa9c6cb,0,1.75,0,1.33,1.36,.07,leaf);
        box(rails,0,2.51,0,1.42,.14,.09,leaf);
        doors.push({leaf,side,floor});
        const cabinSide=group(dx*1.40,0,dz*1.40,car);cabinSide.rotation.y=a;
        const sliding=group(side*.71,0,0,cabinSide);
        box(0x8d9f9f,0,.41,0,1.36,.82,.055,sliding);
        box(0x6b8187,side*.64,1.51,0,.048,1.5,.064,sliding);
        doors.push({leaf:sliding,side,floor});
      }
    }
    for(const u of [-1.46,1.46])for(const z of [-1.46,1.46]){
      box(rails,u,1.4,z,.1,2.8,.1,car);
      const lo=Math.min(...bank.levels),hi=Math.max(...bank.levels)+2.9;
      box(metal,cx+u,(lo+hi)/2,cz+z,.12,hi-lo,.12);
    }
    cars.push({car,doors,bank});
  }
  const matrix=new T.Matrix4();
  let lastTreadFrame=-Infinity;
  return {afterBatch(){hall.add(moving);root.add(food);},update(clock,light,tickets,anchor){
    restaurant.update(clock,light,tickets,anchor);
    const now=clock;
    for(const {car,doors,bank} of cars){
      const lift=liftAt(clock,bank);car.position.y=lift.height;
      for(const {leaf,side,floor} of doors)leaf.position.x=side*(.73+(floor===lift.floor?lift.open:0)*1.37);
    }
    if(!anchor||now-lastTreadFrame<33&&now>=lastTreadFrame)return;
    lastTreadFrame=now;
    for(const belt of belts){
      const {p,tread,nose,n,dz,x,dir}=belt;
      const close=Math.abs(anchor.x-hallOrigin.x-x)<68&&Math.abs(anchor.y-hallOrigin.y-(p.z0+p.z1)/2)<68;
      if(belt.placed&&!close)continue;
      belt.placed=true;
      const phase=(now*.001*.95/dz)%1;
      for(let i=0;i<n;i++){
        const t=(i+(dir<0?1-phase:phase))/n,z=p.z0+t*(p.z1-p.z0),h=p.h+t*(p.back-p.h);
        tread.setMatrixAt(i,matrix.makeTranslation(x,h-.095,z));nose.setMatrixAt(i,matrix.makeTranslation(x,h+.005,z-dz*.43));
      }
      tread.instanceMatrix.needsUpdate=nose.instanceMatrix.needsUpdate=true;
    }
  }};
}
