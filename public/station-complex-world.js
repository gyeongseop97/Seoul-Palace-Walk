import {boardingIslands,ktxIsland,hallSpan,roofBeds,escalatorSpeed,concourseParts,slabEdges,openAir,outdoorFlight,metroInsidePoint,hallOrigin,liftAt,liftBanks,floorName,partAt,railPoint,storeys} from "./station-levels.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {stationHall,railPlatform} from "./rail-station-layout.js";
import {stationDining} from "./dining-data.js";
import {buildRailRoom} from "./rail-station-world.js";
import {buildDiningInterior} from "./dining-world.js";
import {standSign} from "./regional-stands.js";
import {graniteSlab} from "./station-materials.js";

export function* buildStationComplex(T,root,kit,venue,walkerModels){
  yield* buildRailRoom(T,root,kit,stationHall);
  const platform=yield* buildRailRoom(T,root,kit,railPlatform);
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
  // The rail yard lies south of the concourse, one storey down. Tracks run on under the hall
  // through dark portals and out past the platform ends.
  const yard={x0:hallSpan.x0,x1:hallSpan.x1,z0:hallSpan.z1,z1:152},yardX=(yard.x0+yard.x1)/2,yardZ=(yard.z0+yard.z1)/2;
  const yardW=yard.x1-yard.x0,yardD=yard.z1-yard.z0,rail=storeys[0];
  box(0x8a8980,yardX,rail-1.54,yardZ,yardW,.62,yardD);
  box(0x9a9f9b,yardX,rail/2-.8,yard.z0-.3,yardW,-rail+1.4,.6);
  for(const x of [yard.x0,yard.x1]){
    const inward=x===yard.x0?1:-1;
    box(0x9daba9,x,rail+1.3,yardZ,.46,5.3,yardD);
    for(let v=yard.z0+5;v<yard.z1-3;v+=7.5)box(0x7c9095,x+inward*.26,rail+2.9,v,.1,1.7,6.8);
  }
  box(0x909d9e,yardX,rail+1.1,yard.z1,yardW,5.8,.42);
  const tracks=[...boardingIslands.map(s=>({x:s.x,gauge:6.4})),{x:ktxIsland.x,gauge:6.2}].flatMap(s=>[s.x-s.gauge,s.x+s.gauge]);
  for(const x of tracks){
    box(0x24292c,x,rail+1.55,yard.z0+.02,3.7,4.4,.1);
    for(const u of [-1.95,1.95])box(0x7f8a8a,x+u,rail+1.4,yard.z0+.08,.26,4.9,.22);
    box(0x7f8a8a,x,rail+3.9,yard.z0+.08,4.16,.3,.22);
  }
  // Roofs and service yards north of the hall hide the underground floors from the upper
  // levels. The sheet is left open where the transfer stairs pass down through it.
  const well=concourseParts.find(p=>p.style==="stairs"&&p.h< -9&&p.back===0);
  for(const [ax,bx,az,bz] of [[-128,well.x0-.2,-172,hallSpan.z0-.2],[well.x1+.2,112,-172,hallSpan.z0-.2],
    [well.x0-.2,well.x1+.2,-172,well.z0-.2],[well.x0-.2,well.x1+.2,well.z1+.2,hallSpan.z0-.2]]){
    box(0x8f948f,(ax+bx)/2,-.5,(az+bz)/2,bx-ax,.2,bz-az);
  }
  // A skyline beyond the yard walls stands in for Yongsan and the Cheongpa-ro blocks.
  let block=91;
  const pick=()=>{block=(Math.imul(block,1103515245)+12345)>>>0;return block/4294967296;};
  for(let i=0;i<14;i++){
    const far=i<6,side=i%2?1:-1,height=14+pick()*(far?46:26),width=15+pick()*12,span=14+pick()*14;
    const x=far?yard.x0+12+i*22:side>0?yard.x1+16+pick()*20:yard.x0-16-pick()*20,z=far?yard.z1+22+pick()*26:yard.z0+26+Math.floor((i-6)/2)*30;
    box([0xa3a9a8,0xb1aa9c,0x97a3a8,0xa9b0ad][i%4],x,rail+height/2-1.2,z,width,height,span);
    for(let floor=rail+2;floor<rail+height-3;floor+=3.2)box(0x7b8f97,x,floor,z+(far?-span/2-.05:0),far?width-1:width+.1,1.2,far?.1:span-1);
  }
  yield;
  const belts=[];
  const open=openAir;
  const headroom=p=>["retail","arcade","transfer","terminal","gates","metro","arexPlatform"].includes(p.style)?5.8:p.style==="dining"?4.9:4.4;
  for(const p of concourseParts){
    const {x0,x1,z0,z1,h,style}=p,w=x1-x0,d=z1-z0,x=(x0+x1)/2,z=(z0+z1)/2;
    if(style==="lift"||p.flush)continue;
    if(style==="stairs"){
      const n=Math.ceil(Math.abs(h-p.back)/.16),dz=d/n,rise=p.back-h,slope=-Math.atan2(rise,d),run=Math.hypot(d,rise),middle=h+rise/2;
      for(let i=0;i<n;i++){
        const level=h+rise*(i+.5)/n,mid=z0+(i+.5)*dz;
        box(i%2?tiles:0xbab9ad,x-w*.2,level-.13,mid,w*.60,.26,dz+.012);
        box(0xeee4c7,x-w*.2,level+.008,mid-Math.sign(rise)*dz*.46,w*.60,.019,.047);
      }
      for(const u of [x0,x0+w*.60,x0+w*.80,x1])beam([u,h+.98,z0],[u,p.back+.98,z1],.115,rails);
      const escalatorWidth=w*.4;
      const colors=[0x536572,0xc8a454];
      for(const dir of [-1,1]){
        const stepGeometry=new T.BoxGeometry(escalatorWidth/2-.09,.19,dz+.006);
        const tread=new T.InstancedMesh(stepGeometry,kit.matte(colors[0]),n);
        const nose=new T.InstancedMesh(new T.BoxGeometry(escalatorWidth/2-.09,.012,.044),kit.matte(colors[1]),n);
        for(const m of [tread,nose]){m.frustumCulled=false;moving.add(m);}
        belts.push({p,tread,nose,n,dz,dir,x:x1-escalatorWidth*(dir<0?.75:.25)});
      }
      for(const u of [x0+w*.60,x0+w*.80,x1]){
        const bal=box(0x8faeb3,u,middle+.44,z,.10,.83,run);bal.rotation.x=slope;
        for(const t of [.03,.5,.97])box(rails,u,h+rise*t+.48,z0+d*t,.11,.96,.11);
      }
      // Truss under the flight, then either an open canopy over the platform stairs or an
      // enclosed stairwell between floors of the building.
      box(0x8d9795,x,middle-.52,z,w,.34,run).rotation.x=slope;
      const outdoors=outdoorFlight(p);
      if(outdoors){
        box(0xb8c5c4,x,middle+4.28,z,w+.9,.18,run+.3).rotation.x=slope;
        for(const u of [x0-.3,x1+.3]){
          beam([u,h+4.12,z0],[u,p.back+4.12,z1],.16,metal);
          for(const t of [.02,.34,.66,.98])box(rails,u,h+rise*t+1.96,z0+d*t,.13,4.3,.13);
          const glass=box(0x9dbac0,u,middle+.52,z,.07,1.04,run);glass.rotation.x=slope;
        }
        box(0xa9aca5,x,storeys[0]-.17,z,w+.9,.34,d);box(0x9c9a90,x,storeys[0]-.82,z,w+.6,1.0,d);
      }else{
        const clear=4.4;
        for(const u of [x0-.09,x1+.09]){const wall=box(0xd9d8cf,u,middle+clear/2-.2,z,.18,clear+.4,run);wall.rotation.x=slope;}
        box(0xe4e4dc,x,middle+clear,z,w+.36,.2,run).rotation.x=slope;
        for(const t of [.12,.37,.63,.88])box(0xffeed0,x-w*.2,h+rise*t+clear-.14,z0+d*t,Math.min(3,w*.4),.06,.22).rotation.x=slope;
      }
    }else if(!["hall","platform","dining"].includes(style)){
      box(style==="garden"?0xa8a994:style==="bridge"?0xbac5c2:tiles,x,h-.17,z,w,.34,d);
      if(style==="garden")for(let v=z0+2;v<z1;v+=2)box(0xa1a79f,x,h+.004,v,w,.008,.025);
      else graniteSlab(T,hall,x,h+.004,z,w,d);
      if(headroom(p)>5){
        box(0xdadbd3,x,h+5.8,z,w,.22,d);
        for(let v=z0+2;v<z1;v+=5)box(0xffeed0,x,h+5.63,v,Math.min(5,w*.65),.065,.22);
        for(const u of [x0+.25,x1-.25])for(const v of [z0+.4,z1-.4])box(metal,u,h+2.85,v,.28,5.7,.28);
        if(style==="retail"||style==="arcade"){
          for(let u=x0+2;u<x1-1;u+=3.5){
            box(0x55717a,u,h+1.7,z0+.16,3.25,3.4,.2);box(0xd1aa76,u,h+3.68,z0+.27,3.32,.37,.43);
          }
        }
      }else if(!open(p)&&style!=="island"){
        box(0xe4e4dc,x,h+4.5,z,w,.2,d);
        const along=d>w;
        for(let v=(along?z0:x0)+1.6;v<(along?z1:x1)-.6;v+=4.2)box(0xffeed0,along?x:v,h+4.37,along?v:z,along?.22:1.6,.06,along?1.6:.22);
      }
    }
    // Upper floors stand on the building below them rather than floating.
    if(h>4&&style!=="stairs")box(0xa9aaa1,x,(h-.74)/2,z,w-.06,h+.06,d-.06);
    if(!["hall","stairs","platform","island"].includes(style)){
      for(const run of slabEdges(p)){
        const cx=(run.x0+run.x1)/2,cz=(run.z0+run.z1)/2,lengthX=run.x1-run.x0,lengthZ=run.z1-run.z0;
        if(run.kind==="wall"){
          const height=h< -9?5.3:headroom(p);
          box(h< -9?0xb1bab7:0xdcdad1,cx,h+height/2,cz,Math.max(.16,lengthX),height,Math.max(.16,lengthZ));
          continue;
        }
        const posts=Math.max(1,Math.round(Math.hypot(lengthX,lengthZ)/1.6));
        for(let i=0;i<=posts;i++)box(rails,run.x0+lengthX*i/posts,h+.55,run.z0+lengthZ*i/posts,.073,1.10,.073);
        box(metal,cx,h+1.09,cz,Math.max(.095,lengthX),.10,Math.max(.095,lengthZ));
      }
    }
    if(style==="island"){
      const tracks=boardingIslands.find(s=>s.x===x).tracks,yardEnd=152,trackZ=(hallSpan.z1+yardEnd)/2,trackD=yardEnd-hallSpan.z1;
      box(0x9c9a90,x,h-.82,z,w-.24,1.0,d);
      for(const side of [-1,1]){
        const edge=x+side*(w/2-.46),track=x+side*(w/2+2.1);
        box(0xe5ba54,edge,h+.018,z,.35,.028,d);
        box(0xe4dabb,edge+side*.30,h+.02,z,.10,.031,d);
        box(0x747774,track,h-1.02,trackZ,3.9,.22,trackD);
        for(const offset of [-.72,.72])box(0xa2aaa9,track+offset,h-.79,trackZ,.075,.15,trackD);
        for(let v=hallSpan.z1+1;v<yardEnd;v+=1.25)box(0x69675f,track,h-.91,v,2.4,.15,.20);
        const hood=box(0xb8c5c4,x+side*2.16,h+4.35,z,4.4,.20,d);
        hood.rotation.z=side*.052;
      }
      for(let v=z0+3;v<z1;v+=9){
        box(rails,x,h+2.09,v,.18,4.18,.20);
        for(const side of [-1,1])beam([x,h+3.23,v],[x+side*2.7,h+4.19,v],.12,metal);
      }
      sign(x,h+3.20,z0+6,tracks+"   서울","SEOUL",Math.PI,3.45);
      sign(x,h+3.15,z1-4,"↑  맞이방","Way out",0,3.5);
    }
    if(style==="parkLink"){
      const stripeZ=z-1.25;
      box(0xc4a969,x,h+.018,stripeZ,w,.025,.16);
      for(let u=x0+1;u<x1-.2;u+=2.7)box(0xeee6c9,u,h+.012,z+1.5,1.35,.019,.095);
      for(const u of [x0+.4,x1-.4])box(0xa1a6a2,u,h+2.15,z0+.32,.34,4.3,.34);
      box(0x84979b,x,h+4.26,z0+.32,w-.4,.22,.33);
      if(p.name.includes("주차동"))sign(x,h+2.88,z0+.8,"←  옥상정원","The Roof Atelier",0,5.2);
    }
    if(style==="arcade"){
      for(const [i,title] of ["카페","다이닝","아울렛"].entries())sign(x0+4.5+i*8.4,h+3.08,z0+.39,title,"4F",0,5.8);
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
      const landing=liftBanks.find(b=>b.id==="airport").center.y-hallOrigin.y;
      for(const u of [x0,x1])for(let v=z0+1.5;v<z1;v+=3){
        if(u===x0&&Math.abs(v-landing)<3)continue;
        box(0x899da0,u,h+1.45,v,.16,2.9,2.96);box(0x475d67,u,h+1.72,v,.23,1.43,2.68);
        box(0xe8c36f,u+(u===x0?.34:-.34),h+.014,v,.23,.026,3);
      }
      sign(x,h+3.4,z0+6,"공항철도 서울역","직통 · 일반열차",0,4);
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
    if(style==="garden"){
      const planting=group(0,h+.58,0);
      let seed=472;
      const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const trees=makeTreeBuilder(T,planting,{rand,clearance:{meshFits:()=>true,trim:()=>true}});
      for(const bed of roofBeds){
        box(0x9b9e93,bed.x,h+.27,bed.z,bed.w,.54,2.25);
        box(0x80916a,bed.x,h+.56,bed.z,bed.w-.20,.09,2.06);
        const count=Math.max(1,Math.floor(bed.w/4));
        for(let i=0;i<count;i++){
          const u=bed.x+((i+.5)/count-.5)*bed.w,evergreen=bed.z>z;
          trees.grow(u,bed.z,{height:3.3+rand()*.7,spread:2.12,style:evergreen?"cloud":"branchy",palette:evergreen?"deep":"ginkgo"});
          if(bed.w>3)trees.shrub(u+1.3,bed.z,.62,"fresh");
        }
      }
      sign(x0+3.35,h+2.25,z+4.6,"옥상정원","The Roof Atelier",Math.PI/2,3.5);
    }
    yield;
  }
  // Way-finding at the heads and feet of the stairs between floors.
  sign(13,storeys[2]+3.2,-36.4,"3F  식당가","FOOD HALL",0);
  sign(-2,storeys[2]+3.3,-60.4,"4F  ↑  옥상정원 · 상가","ROOF GARDEN",0,5.4);
  sign(-23,3.1,-49.6,"쇼핑동 데크 출입구","PLAZA EXIT",0,5);
  sign(-10.4,3.1,-34,"북측 보행육교","PEDESTRIAN BRIDGE",-Math.PI/2,3.8);
  sign(-35.6,3.1,-34,"마트 서쪽 출입구","WEST PLAZA",Math.PI/2,4);
  sign(-10.4,3.1,-46.2,"경의중앙선","지상 출입구",-Math.PI/2,3.4);
  sign(-70,-7.5,-64.6,"←  공항철도        지하철 1 · 4호선  →","환승통로   TRANSFER",0,9);
  sign(-101,-7.7,-66.6,"15번 출구","서부광장",0,3.7);
  const cars=[];
  for(const bank of liftBanks){
    const cx=bank.center.x-hallOrigin.x,cz=bank.center.y-hallOrigin.y;
    const car=group(cx,0,cz,moving),shown=[car];
    box(0x646e70,0,-.12,0,2.98,.24,2.98,car);box(0xc1cdcc,0,2.76,0,3,.16,3,car);
    box(0xffefd0,0,2.66,0,2,.045,1.8,car);
    const doors=[];
    for(const [index,stop] of bank.stops.entries()){
      const {dx,dz,floor}=stop,h=bank.levels[index],a=Math.atan2(dx,dz);
      const frame=group(cx+dx*1.62,h,cz+dz*1.62);frame.rotation.y=a;
      for(const u of [-1.53,1.53])box(rails,u,1.44,0,.13,2.9,.15,frame);
      box(metal,0,2.86,0,3.16,.21,.26,frame);
      standSign(T,frame,floorName(floor)+"  승강기",stop.name,1.62,0,3.22,.12,"#294d61","#fff3c8",.57);
      const mounts=group(frame.position.x,h,frame.position.z,moving);mounts.rotation.y=a;shown.push(mounts);
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
    cars.push({car,doors,bank,shown});
  }
  const matrix=new T.Matrix4();
  let lastTreadFrame=-Infinity;
  return {pickBoardingDoor:platform.pickBoardingDoor,afterBatch(){hall.add(moving);root.add(food);},update(clock,light,tickets,anchor){
    restaurant.update(clock,light,tickets,anchor);
    const now=clock;
    for(const {car,doors,bank,shown} of cars){
      // Cars and door leaves are separate moving meshes, so a distant bank is not drawn.
      const near=!anchor||Math.hypot(anchor.x-bank.center.x,anchor.y-bank.center.y)<85;
      for(const part of shown)part.visible=near;
      if(!near)continue;
      const lift=liftAt(clock,bank);car.position.y=lift.height;
      for(const {leaf,side,floor} of doors)leaf.position.x=side*(.73+(floor===lift.floor?lift.open:0)*1.37);
    }
    if(!anchor||now-lastTreadFrame<33&&now>=lastTreadFrame)return;
    lastTreadFrame=now;
    for(const belt of belts){
      const {p,tread,nose,n,dz,x,dir}=belt;
      const offX=Math.abs(anchor.x-hallOrigin.x-x),offZ=Math.abs(anchor.y-hallOrigin.y-(p.z0+p.z1)/2),close=offX<36&&offZ<36;
      tread.visible=nose.visible=offX<95&&offZ<95;
      if(belt.placed&&!close)continue;
      belt.placed=true;
      const phase=(now*.001*escalatorSpeed/dz)%1;
      for(let i=0;i<n;i++){
        const t=(i+(dir<0?1-phase:phase))/n,z=p.z0+t*(p.z1-p.z0),h=p.h+t*(p.back-p.h);
        tread.setMatrixAt(i,matrix.makeTranslation(x,h-.095,z));nose.setMatrixAt(i,matrix.makeTranslation(x,h+.005,z-dz*.43));
      }
      tread.instanceMatrix.needsUpdate=nose.instanceMatrix.needsUpdate=true;
    }
  }};
}
