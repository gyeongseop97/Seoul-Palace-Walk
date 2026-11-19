import {stationHall,railPlatform,railShopPlots,seatRows,waitingRows,hallColumns} from "./rail-station-layout.js";
import {standSign} from "./regional-stands.js";
import {makeRegionalItemProps} from "./regional-item-props.js";

const navy=0x234967,blue=0x336990,silver=0xb5c2c5,ivory=0xeee8d9,slate=0x546576;
export function* buildRailRoom(T,root,kit,venue){
  const room=new T.Group();room.name=venue.name;room.position.set(kit.wx(venue.center.x),venue===railPlatform?-6.3:0,kit.wz(venue.center.y));root.add(room);
  const box=(c,x,y,z,w,h,d,p=room)=>kit.box(c,x,y,z,w,h,d,p);
  const rod=(c,x,y,z,r,h,p=room)=>kit.cylinder(c,x,y,z,r,h,12,p);
  const group=(x,z,angle=0,parent=room)=>{const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;parent.add(g);return g;};
  const sign=(p,title,sub,w,x,y,z,bg="#25435b",ink="#f7f2de",h=.8)=>standSign(T,p,title,sub,w,x,y,z,bg,ink,h);
  function girder(p,a,b,gauge,color){
    const start=new T.Vector3(...a),delta=new T.Vector3(...b).sub(start);
    const m=box(color,start.x+delta.x/2,start.y+delta.y/2,start.z+delta.z/2,gauge,delta.length(),gauge,p);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  }
  function paving(w,d,step,c){
    box(c,0,-.12,0,w,.24,d);
    for(let x=-w/2+step;x<w/2;x+=step)box(0xa19f92,x,.002,0,.016,.004,d);
    for(let z=-d/2+step;z<d/2;z+=step)box(0xaaa89c,0,.002,z,w,.004,.017);
  }
  function seats(p,x,z,width,count,color){
    const g=group(x,z,0,p);
    box(slate,0,.29,0,width,.12,.3,g);
    for(const side of [-1,1])box(silver,side*width*.34,.16,0,.09,.32,.49,g);
    for(let i=0;i<count;i++){
      const u=(i-(count-1)/2)*width/count,w=width/count-.07;
      box(color,u,.47,0,w,.14,.54,g);
      const back=box(color,u,.76,.268,w,.51,.10,g);back.rotation.x=.09;
    }
  }
  room.add(new T.HemisphereLight(0xfff4df,0xcbc8bd,.98));
  function ceilingLight(x,y,z,power,reach){
    const light=new T.PointLight(0xfff0d5,power,reach,1.65);
    light.position.set(x,y,z);room.add(light);
  }
  if(venue===stationHall){
    ceilingLight(7,5,15,52,27);ceilingLight(0,7,-15,60,32);
    paving(42,58,2.2,0xd3cec0);
    for(const side of [-1,1]){
      for(const [z,len] of (side<0?[[20,18]]:[[-14,30],[20,18]]))box(0xb7c6c9,side*21,4.25,z,.27,8.5,len);
      if(side>0)box(0xd3d6d0,0,4.25,29,42,8.5,.27);
      else box(0xb4c6c8,0,7.6,-29,42,1.8,.22);
      for(let z=-26;z<=26;z+=4)if(z<1||z>10)box(0x778d92,side*20.79,5.5,z,.14,4.6,.115);
      for(let z=-25;z<=25;z+=5){
        if(z>=0&&z<=10)continue;
        box(0x9db7bd,side*20.84,6.35,z,.1,2.35,4.81);
        box(0xe0dcd1,side*20.8,3.1,z,.2,.28,5);
      }
    }
    // Curtain wall, tactile route and clerestory lights carry the eye to the platform entrance.
    for(let x=-19;x<=19;x+=3.8){
      for(const z of [28.79]){
        box(0x92afbb,x,5.75,z,3.63,4.05,.08);
        box(silver,x,5.75,z-Math.sign(z)*.07,.085,4.05,.07);
        box(silver,x,5.28,z-Math.sign(z)*.07,3.66,.08,.07);
      }
    }
    box(0xc6a262,-3,.011,-.5,.36,.018,52);
    box(0xc6a262,-7.35,.011,-13,8.72,.018,.35);
    const skylightMaterial=new T.MeshBasicMaterial({color:0xd9e5db});
    for(let z=-27;z<=27;z+=6){
      for(const side of [-1,1]){
        girder(room,[side*20.9,7.9,z],[0,10.1,z],.27,silver);
        girder(room,[side*20.9,7.4,z],[0,9.6,z],.14,silver);
        for(let x=2;x<20;x+=4)girder(room,[side*x,9.75-x*.105,z],[side*(x+2),9.4-(x+2)*.105,z],.08,slate);
        const roof=box(0xc6d2d1,side*10.5,9.16,z,21.2,.12,5.97);roof.rotation.z=-side*.102;
      }
      const lightwell=box(0xe0eff0,0,9.46,z,2.2,.06,5.85);lightwell.material=skylightMaterial;
      box(0xfbf1d4,0,9.39,z,5.5,.06,.16);
    }
    for(const [x,z] of hallColumns){
      rod(silver,x,3.85,z,.33,7.7);rod(0x73838a,x,.38,z,.41,.76);
    }
    for(const [x,z] of waitingRows)seats(room,x,z,2.1,2,0x648085);
    const tickets=group(-16,-13,Math.PI/2);
    box(0xdfd8c5,0,1.65,0,9,3.3,6,tickets);box(navy,0,1.03,3.03,8.6,.97,.28,tickets);
    for(const x of [-3,-1,1,3]){
      box(0x65838d,x,2.06,3.09,1.7,.96,.12,tickets);
      box(0xe4cda7,x,1.5,3.25,1.89,.13,.65,tickets);
    }
    sign(tickets,"표 사는 곳","TICKETS",8,0,3.55,3.12);
    const entry=group(0,28.77,Math.PI);
    for(const x of [-2.25,0,2.25]){
      box(0x677e88,x,1.55,.06,2.13,3.15,.22,entry);box(0xabc8c8,x,1.55,.21,1.89,2.89,.1,entry);
    }
    sign(entry,"서울역광장 출구","EXIT",5.9,0,3.9,.25);
    const departures=group(-2,-16);
    box(0x333d41,0,4.98,0,9.8,2.05,.31,departures);
    sign(departures,"열차 안내     KTX","승강장 ↓     정차 중     ·     서울역",9.52,0,4.98,.17,"#182d36","#f0cf84",1.88);
    for(const x of [-3.8,3.8])rod(silver,x,7.3,-16,.055,2.65);
    sign(room,"1층  ↓  KTX 타는 곳","PLATFORMS",6,0,3.6,-28);
    sign(room,"3층  ↑  식당가","FOOD HALL",5.2,-16,3.6,-28);
    sign(room,"승강기  ↕","LIFT",2.5,-7.25,3.1,-28);
    const props=makeRegionalItemProps(T,kit);
    for(const p of railShopPlots){
      const g=group(p.x,p.z,p.angle),w=p.w,d=p.d;
      box(0xe4d7bd,0,1.78,-d/2+.1,w,3.56,.2,g);
      for(const side of [-1,1])box(0xc1b79e,side*(w/2-.08),1.76,0,.16,3.52,d,g);
      box(p.color,0,.49,d/2-.15,w-.22,.98,.6,g);
      box(0xe7d6b9,0,1.03,d/2-.12,w,.10,.71,g);
      box(p.color,0,3.15,0,w+.14,.20,d+.19,g);
      sign(g,p.name,({fruitMochi:"FRUIT DAIFUKU",stationBurger:"GRILL & BUN",churu:"TRAVEL MART",coffee:"COFFEE BAR"})[p.kind],w-.16,0,3.43,d/2+.05,p.sign,p.ink,.83);
      for(const x of [-w*.31,0,w*.31]){
        box(0xf3cda5,x,2.76,-d/2+.22,w*.25,.22,.12,g);
        if(p.kind==="fruitMochi"||p.kind==="stationBurger"){
          const item=group(x,d/2-.13,0,g);item.position.y=1.22;item.scale.setScalar(1.7);props[p.kind](item);
        }else if(p.kind==="coffee"){
          rod(0xf4e9cf,x,1.22,d/2-.14,.125,.28,g);rod(0x604535,x,1.362,d/2-.14,.102,.01,g);
        }else for(let row=0;row<3;row++){
          box(0xb7b5a4,x,.9+row*.53,-d/2+.43,w*.27,.045,.57,g);
          for(let i=-2;i<=2;i++)rod([0x99845c,0xc1805b,0x6d968c][row],x+i*.22,1.05+row*.53,-d/2+.55,.07,.25,g);
        }
      }
      if(p.kind==="churu"){
        sign(g,"츄르",null,1.63,-1.24,.67,d/2+.18,p.sign,p.ink,.4);
        sign(g,"삼각김밥",null,1.85,1.40,.67,d/2+.18,p.sign,p.ink,.4);
        for(let j=0;j<3;j++){
          const item=group(1.05+.34*j,d/2-.1,0,g);item.position.y=1.18;item.scale.setScalar(1.6);props.triangleRice(item);
        }
      }
      yield;
    }
  }else if(venue===railPlatform){
    paving(8.7,97,1.3,0xbebbb1);
    box(0x818981,0,-1.25,0,23,.26,115);
    for(const side of [-1,1]){
      box(0x999f9f,side*19,-.1,0,6.2,.38,130);
      box(0xaeb8b9,side*19,4.22,0,7.4,.22,121);
      for(let z=-55;z<60;z+=10){rod(silver,side*19,2,z,.13,4);}
      for(let j=0;j<4;j++){
        const z=-71+j*20,h=8+(j*7%15),x=side*(43+j%3*4);
        box(j%3===0?0xa3917e:0xa6a9a7,x,h/2-1,z,13,h,16);
        for(let level=2;level<h-1;level+=3)box(0x768790,x-side*6.53,level,z,.07,1.05,14.5);
      }
    }
    for(const side of [-1,1]){
      box(0xd5ac54,side*3.74,.012,0,.31,.018,96.8);
      box(0xf5e8ba,side*4.20,.016,0,.12,.025,97);
      box(0x757879,side*9,-.97,0,10,.38,123);
      for(const offset of [-.72,.72])box(0x858b90,side*7.09+offset,-.65,0,.075,.19,121);
      for(let z=-58;z<59;z+=1.3)box(0x6b655b,side*7.09,-.8,z,2.35,.13,.19);
      for(let z=-39;z<42;z+=10){
        const roof=box(0xa9b9bb,side*2.5,4.75,z,5.2,.21,9.98);roof.rotation.z=side*.035;
      }
    }
    for(let z=-35;z<=35;z+=10){
      rod(0x879699,-2.55,2.29,z,.15,4.58);
      girder(room,[-2.55,3.65,z],[3.8,4.66,z],.15,silver);
      box(0xf4efd8,.2,4.51,z,3.1,.05,.19);
    }
    const stationBoard=group(-2.55,-12,Math.PI/2);sign(stationBoard,"서울","SEOUL   |   서울역",3.45,0,2.74,0,"#f3efe4","#29485b",.83);
    sign(room,"3  ·  KTX","열차 타는 곳",3.5,0,3.3,2);
    const returnSign=group(0,39.1,Math.PI);
    sign(returnSign,"↑ 나가는 곳","2층 맞이방",4.1,0,2.72,0);

    yield;
    // Cross sections at successive longitudinal stations produce the rounded high-speed nose.
    const train=group(7.09,0);
    const ring=[[-1,.16],[-1,.67],[-.93,.85],[-.63,.97],[0,1],[.63,.97],[.93,.85],[1,.67],[1,.16],[.83,0],[-.83,0]];
    const sections=[[-40,.21,.62,.1],[-38.5,.93,1.13,-.09],[-36,1.39,1.82,-.23],[-32,1.61,3.06,-.26],[-29,1.64,3.45,-.27],[-18,1.64,3.45,-.27]];
    const xyz=[];
    for(let j=1;j<sections.length;j++)for(let i=0;i<ring.length;i++){
      const make=(row,k)=>{const [z,w,h,b]=sections[row],[u,v]=ring[k%ring.length];return [u*w,b+v*h,z];};
      xyz.push(...make(j-1,i),...make(j,i),...make(j,i+1),...make(j-1,i),...make(j,i+1),...make(j-1,i+1));
    }
    for(const end of [sections[0],sections.at(-1)]){
      const [z,w,h,b]=end;
      for(let i=0;i<ring.length;i++){
        const [a,u]=ring[i],[c,v]=ring[(i+1)%ring.length];
        xyz.push(0,b+h/2,z,a*w,b+u*h,z,c*w,b+v*h,z);
      }
    }
    const geom=new T.BufferGeometry();geom.setAttribute("position",new T.Float32BufferAttribute(xyz,3));geom.computeVertexNormals();
    train.add(new T.Mesh(geom,new T.MeshStandardMaterial({color:0xdce4e5,side:T.DoubleSide,roughness:.48})));
    function nosePanel(color,vertices){
      const panel=new T.BufferGeometry();
      panel.setAttribute("position",new T.Float32BufferAttribute(vertices.flat(),3));
      panel.setIndex([0,1,2,0,2,3]);panel.computeVertexNormals();
      train.add(new T.Mesh(panel,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.5})));
    }
    for(const side of [-1,1]){
      nosePanel(0x263e55,[[0,2.03,-34.72],[side*1.24,1.88,-34.72],[side*1.19,2.99,-31.75],[0,3.04,-31.75]]);
      nosePanel(0x324b60,[[side*1.46,1.89,-34.65],[side*1.58,2.55,-31.73],[side*1.64,2.25,-30.52],[side*1.59,1.88,-32.05]]);
      for(let i=1;i<sections.length;i++){
        const a=sections[i-1],b=sections[i],band=(s,v)=>[side*(s[1]+.011),s[3]+s[2]*v,s[0]];
        nosePanel(navy,[band(a,.24),band(b,.24),band(b,.38),band(a,.38)]);
      }
      const headlight=box(0xffe4a3,side*.83,.60,-38.55,.35,.16,.12,train);headlight.rotation.y=side*.60;
    }
    for(const side of [-1,1]){
      box(0x718899,side*1.64,.57,-23.5,.055,.08,10.6,train);
      for(let j=0;j<8;j++)box(slate,side*1.64,1.9,-25+j*.7,.064,.75,.27,train);
    }
    for(const [a,b] of [[-17.8,2.65],[3,23.95],[24.3,45.2]]){
      const len=b-a,m=(a+b)/2;
      box(0x354149,0,-.28,m,2.92,.56,len-.5,train);
      box(0xe1e8e7,0,1.24,m,3.30,2.98,len,train);
      box(0xcad4d6,0,2.87,m,3.04,.35,len,train);
      for(const side of [-1,1]){
        box(navy,side*1.656,.88,m,.035,.42,len,train);
        for(let z=a+1.25;z<b-.65;z+=1.62){
          if(a===3&&Math.abs(z-12)<1.5)continue;
          box(0x3b5365,side*1.66,1.95,z,.05,.76,1.28,train);
        }
      }
      box(0x39444b,0,1.2,b+.15,2.98,2.82,.27,train);
      for(const z of [a+2,b-2])for(const side of [-1,1]){
        const wheel=rod(0x343d42,side*1.07,-.44,z,.32,.22,train);wheel.rotation.z=Math.PI/2;
      }
    }
    box(0x263541,-1.69,1.19,12,.09,2.48,1.66,train);
    box(0xa3b2b2,-1.87,.09,12,.47,.15,1.6,train);
    for(const dz of [-.87,.87])box(0xdab55e,-1.75,1.17,12+dz,.11,2.35,.065,train);
    const doorLabel=group(-1.73,12,-Math.PI/2,train);
    sign(doorLabel,"KTX  ·  1호차","일반실",2.42,0,2.76,0,"#264c67","#f5eddc",.49);
    const wordmark=group(-1.677,-16,-Math.PI/2,train);
    sign(wordmark,"KTX","KOREA TRAIN EXPRESS",2.6,0,1.41,0,"#e0e7e6","#1c5581",.7);
  }else{
    // The cabin and platform are separate streamed rooms. The view beyond the glass uses platform scenery.
    ceilingLight(0,2.55,5,13,15);ceilingLight(0,2.55,-5,13,15);
    const windowMaterial=new T.MeshStandardMaterial({color:0xb1d2d5,transparent:true,opacity:.21,depthWrite:false});
    for(const side of [-1,1]){
      box(0xb9bab0,side*6,-.19,0,7,.36,62);
      box(0xabb5b3,side*6,3.97,0,8,.24,62);
      for(let z=-28;z<30;z+=7)rod(0x819394,side*6.3,1.87,z,.10,3.74);
      box(0xa1aea9,side*20,4.5,0,5,10,65);
      for(let j=-5;j<=5;j++)box(0x75868a,side*17.45,3,j*5,.1,2.8,4.45);
    }
    box(0x777b80,0,-.08,0,3.9,.16,23.8);
    box(0x646d76,0,.006,-.6,.84,.012,20.1);
    for(const side of [-1,1]){
      box(ivory,side*1.95,.58,0,.12,1.16,23.8);
      box(0xc9d0ca,side*1.95,2.53,0,.12,.59,23.8);
      for(let j=-5;j<=5;j++){
        const z=j*2.04;
        box(0xb6cdd2,side*1.95,1.73,z,.06,1.14,1.82).material=windowMaterial;
        box(0xd7d5c8,side*1.95,1.76,z+1,.16,1.32,.18);
        box(0x8098a0,side*1.90,1.17,z,.15,.05,1.86);
        box(0x879a9e,side*1.905,1.62,z,.035,.08,1.8);
        box(0x8d9ea4,side*1.90,1.72,z+.65,.04,.90,.08);
      }
      box(0xa7b0ae,side*1.48,2.42,-.5,.72,.12,20.9);
      box(0xfff1cd,side*.76,2.68,0,.14,.05,23.3);
    }
    for(const end of [-1,1]){
      box(ivory,0,1.38,end*11.9,3.9,2.76,.17);
      box(slate,0,1.28,end*11.76,.9,2.51,.13);
    }
    box(0xe2dfd2,0,2.84,0,4,.18,23.8);
    const label=group(0,-11.64);sign(label,"서울역  ·  정차 중","1호차 일반실",2.42,0,2.22,0,"#24384a","#f5d887",.45);
    const exit=group(-1.84,9.5,Math.PI/2);box(0x84969b,0,1.25,0,1.24,2.5,.12,exit);
    sign(exit,"승강장","내리는 문",.97,0,1.86,.08,"#285a71","#fff4d9",.4);
    for(const [i,z] of seatRows.entries()){
      for(const side of [-1,1])for(const u of [.96,1.56]){
        const x=u*side;
        box(slate,x,.23,z,.34,.44,.42);
        box(0x597588,x,.46,z,.54,.18,.56);
        const back=box(0x4b6c83,x,.85,z+.24,.54,.76,.15);back.rotation.x=.11;
        box(0x96abba,x,1.25,z+.27,.48,.26,.17);
        box(0xf0ece1,x,1.28,z+.17,.31,.16,.03);
        box(0xe8e2cf,x,1.28,z+.359,.32,.16,.025);
        box(0xa1b1b5,x,.88,z+.34,.36,.34,.045);
        box(0x485e6a,x,1.051,z+.37,.07,.025,.02);
        box(0x495561,x-side*.26,.69,z,.05,.09,.37);
      }
      if(i%3===0)yield;
    }
  }
  return {};
}
