import {buildKtx} from "./ktx-model.js";
import {stationHall,railPlatform,railShopPlots,seatRows,seatOffsets,waitingRows,extraWaitingRows,hallColumns} from "./rail-station-layout.js";
import {hallBow} from "./station-levels.js";
import {standSign} from "./regional-stands.js";
import {stationGranite} from "./station-materials.js";
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
  const paintMap=(w,h,draw,repeat=true)=>{
    const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    if(repeat)map.wrapS=map.wrapT=T.RepeatWrapping;
    return map;
  };
  const granite=stationGranite(T);
  function stoneFloor(outline,altitude=.004){
    const shape=new T.Shape(outline.map(([x,z])=>new T.Vector2(x,-z))),geo=new T.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position,uv=geo.attributes.uv;
    for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/4.8,pos.getZ(i)/4.8);
    const mesh=new T.Mesh(geo,granite);mesh.position.y=altitude;mesh.receiveShadow=true;room.add(mesh);
  }
  room.add(new T.HemisphereLight(0xfff4df,0xcbc8bd,.98));
  function ceilingLight(x,y,z,power,reach){
    const light=new T.PointLight(0xfff0d5,power,reach,1.65);
    light.position.set(x,y,z);room.add(light);
  }
  if(venue===stationHall){
    ceilingLight(7,5,15,52,27);ceilingLight(0,7,-15,60,32);
    box(0xb9b6ac,0,-.12,0,42,.24,58);stoneFloor([[-21,-29],[21,-29],[21,29],[-21,29]]);
    for(const side of [-1,1]){
      for(const [z,len] of (side<0?[[24,10]]:[]))box(0xb7c6c9,side*21,4.25,z,.27,8.5,len);
      if(side>0)box(0xd3d6d0,0,4.25,29,42,8.5,.27);
      else box(0xb4c6c8,0,7.6,-29,42,1.8,.22);
      for(let z=-26;z<=26;z+=4)if(side<0&&z>19)box(0x778d92,side*20.79,5.5,z,.14,4.6,.115);
      for(let z=-25;z<=25;z+=5){
        if(z>=0&&z<=10)continue;
        if(side>0||z<21)continue;
        box(0x9db7bd,side*20.84,6.35,z,.1,2.35,4.81);
        box(0xe0dcd1,side*20.8,3.1,z,.2,.28,5);
      }
    }
    // Walkable bow, facade and minimap use the same survey-guide outline.
    function surface(coordinates,altitude,color){
      const geom=new T.BufferGeometry();
      geom.setAttribute("position",new T.Float32BufferAttribute(coordinates.flatMap(([x,z])=>[x,altitude,z]),3));
      geom.setIndex(altitude===0?[0,2,1,0,3,2]:[0,1,2,0,2,3]);geom.computeVertexNormals();
      room.add(new T.Mesh(geom,kit.matte(color)));
    }
    const glazing=new T.MeshStandardMaterial({color:0x72979f,roughness:.34,transparent:true,opacity:.45,depthWrite:false});
    for(let i=1;i<hallBow.length;i++){
      const a=hallBow[i-1],b=hallBow[i],length=Math.hypot(b.x-a.x,b.z-a.z);
      const midX=(a.x+b.x)/2,midZ=(a.z+b.z)/2,angle=Math.atan2(b.x-a.x,b.z-a.z);
      const opening=a.z===2&&b.z===10;
      const pane=(color,y,height,thickness)=>{
        const panel=box(color,midX,y,midZ,thickness,height,length+.018);
        panel.rotation.y=angle;return panel;
      };
      const deck=[[21,a.z],[a.x,a.z],[b.x,b.z],[21,b.z]];
      if(!opening)stoneFloor(deck,.006);
      surface(deck,9.23,0xc6d2d1);
      const low=opening?4.10:.6;
      pane(0x839fa8,(9.2+low)/2,9.2-low,.095).material=glazing;
      if(!opening)pane(0xbec5c4,.29,.58,.27);
      for(const y of [4.18,6.64,9.10])pane(0x8c9da0,y,.12,.26);
      box(0x819497,a.x,(9.25+low)/2,a.z,.21,9.25-low,.21);
      if(!opening)box(0x8d9fa3,midX,4.65,midZ,.10,9.1,.11);
    }
    box(0xb3b1a4,65,-.64,-4,78,.75,84);
    for(const [u,z,width,height,depth] of [[74,-30,24,19,17],[90,-7,20,30,19],[75,15,22,14,21],[98,36,23,22,16]]){
      box(0xb0b4ae,u,height/2-.36,z,width,height,depth);
      for(let level=2;level<height-1;level+=3.15)box(0x82979b,u-width/2-.04,level,z,.12,1.47,depth-.5);
    }
    // At the end of the hall only the signed stair and lift openings are open.
    for(const [a,b] of [[-21,-19.8],[-12.2,-8.65],[-5.85,-3.8],[3.8,21]]){
      box(0xc6c9c1,(a+b)/2,3.40,-29,b-a,6.8,.24);
      for(let x=a+1.15;x<b-1;x+=2.75)box(0x8da7ae,x,4.75,-28.85,2.1,1.49,.09);
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
    box(0xc6a262,4.9,.020,-13,15.82,.016,.35);
    box(0xc6a262,-12,.020,6,18,.016,.35);
    // Tied steel arches span the public hall. Alternating clerestory and acoustic
    // panels follow the upper chord so the roof has real depth from the gallery.
    const crown=x=>9.20+4.85*(1-(x/21)**2);
    const skylight=new T.MeshBasicMaterial({color:0xe6f3f8});
    for(let z=-29;z<29;z+=5.8){
      const mid=z+2.90;
      for(let j=0;j<8;j++){
        const x0=-21+j*5.25,x1=x0+5.25,y0=crown(x0),y1=crown(x1);
        const roof=box(0xf0f2ee,(x0+x1)/2,(y0+y1)/2+.17,mid,Math.hypot(x1-x0,y1-y0)+.045,.18,5.84);
        roof.rotation.z=Math.atan2(y1-y0,x1-x0);
        if(j===3||j===4)roof.material=skylight;
        girder(room,[x0,y0,z],[x1,y1,z],.24,0xf3f5f3);
        girder(room,[x0,y0-.95,z],[x1,y1-.95,z],.17,0xe6ebea);
        girder(room,[x0,y0-.95,z],[x1,y1,z],.12,0xd5dddc);
        box(0xb2bfc0,x0,y0-.07,mid,.13,.15,5.84);
      }
      for(const x of [-10.5,10.5])box(0xffefd4,x,crown(x)-1.02,mid,.13,.08,4.75);
    }
    for(const z of [-29,29]){
      for(let i=0;i<12;i++){
        const x=-19.25+i*3.5,top=crown(x)-.12;
        box(0x92aeb6,x,(top+8.45)/2,z,3.49,top-8.45,.13);
        box(0x768b92,x-1.72,(top+8.45)/2,z,.09,top-8.45,.24);
      }
    }
    // A continuous curved fascia ties the retail bays together on each side of
    // the shopping passage. The public corridor remains open at ground level.
    const curve=z=>-16.9+.0096*z*z;
    for(const [start,end] of [[-26.8,-2.25],[9.2,26.8]]){
      for(let z=start;z<end-.01;z+=3){
        const next=Math.min(z+3,end),x0=curve(z),x1=curve(next),mid=(z+next)/2,angle=Math.atan2(x1-x0,next-z);
        const len=Math.hypot(x1-x0,next-z),front=(x0+x1)/2+1.8,back=-20.9;
        box(0xdad7cb,(front+back)/2,4.28,mid,front-back,.34,next-z+.01);
        const fascia=box(0xd8d2c4,front,4.33,mid,.23,.67,len+.035);fascia.rotation.y=angle;
        const strip=box(0xffe5ad,front+.11,4.12,mid,.05,.09,len+.035);strip.rotation.y=angle;
      }
    }
    for(const [x,z] of hallColumns){
      box(0xa07155,x,.66,z,1.08,1.32,1.08);box(0xc3a386,x,1.39,z,1.17,.12,1.17);
      const top=crown(x)-.85;
      for(const d of [-.18,.18])for(const e of [-.18,.18])rod(0xe0e4dc,x+d,(top+1.4)/2,z+e,.15,top-1.4);
    }
    for(const [x,z] of [...waitingRows,...extraWaitingRows])seats(room,x,z,2.1,2,0x648085);
    const tickets=group(16,-13,-Math.PI/2);
    box(0xe9e6dc,0,1.9,0,9,3.8,6,tickets);box(0x1f4f86,0,3.38,3.06,9.04,.84,.16,tickets);
    box(0xd8d4c8,0,.55,3.12,8.7,1.1,.36,tickets);box(0xf4f1e8,0,1.12,3.22,8.8,.07,.62,tickets);
    for(const x of [-3.2,-1.07,1.07,3.2]){
      box(0x86a9b4,x,1.98,3.05,1.86,1.62,.07,tickets);box(0x3b5f6e,x,2.64,3.1,1.9,.3,.05,tickets);
      box(0xcfd6d6,x+1.065,1.98,3.1,.07,1.66,.14,tickets);box(0x2b3b44,x,1.24,3.4,.5,.16,.3,tickets);
    }
    box(0xcfd6d6,-4.26,1.98,3.1,.07,1.66,.14,tickets);
    const ticketSign=paintMap(1024,96,(ctx,w,h)=>{
      ctx.fillStyle="#1f4f86";ctx.fillRect(0,0,w,h);ctx.fillStyle="#ffffff";ctx.textBaseline="middle";
      ctx.font="bold 56px sans-serif";ctx.fillText("승차권 매표소",34,50);ctx.font="600 34px sans-serif";ctx.fillStyle="#d9e6f4";ctx.fillText("Tickets  ·  乘车券  ·  きっぷうりば",430,52);
    },false);
    const ticketBoard=new T.Mesh(new T.PlaneGeometry(8.9,.83),new T.MeshBasicMaterial({map:ticketSign}));ticketBoard.position.set(0,3.38,3.15);tickets.add(ticketBoard);
    for(const x of [-3.2,-1.07,1.07,3.2])for(const z of [4.4,5.6]){rod(0xc7cfd0,x-1.05,.5,z,.035,1,tickets);box(0x2456a4,x-1.05,.93,z+.6,.04,.05,1.2,tickets);}
    // Self-service ticket machines stand beside the counters.
    for(let i=0;i<5;i++){
      const kiosk=group(13.9+i*1.05,-7.55,0);
      box(0xeef0ec,0,.86,0,.86,1.72,.62,kiosk);box(0x1f4f86,0,1.8,0,.9,.18,.66,kiosk);box(0x20303a,0,1.18,.32,.6,.46,.03,kiosk);
      box(0x5fb3c8,0,1.18,.335,.52,.38,.01,kiosk);box(0xc9cfce,0,.74,.33,.5,.16,.04,kiosk);box(0xf2c54b,.24,.5,.32,.12,.06,.03,kiosk);
    }
    sign(room,"자동발매기","Ticket Machines",3.4,16,2.5,-7.2,"#1f4f86","#ffffff",.56);
    // Round information desk inside the entrance.
    const desk=group(10.5,21.5);
    kit.cylinder(0xf2f0e8,0,.52,0,1.12,1.04,28,desk);kit.cylinder(0x1f4f86,0,1.07,0,1.2,.07,28,desk);kit.cylinder(0xdedad0,0,.05,0,1.22,.1,28,desk);
    rod(0xc7cfd0,0,1.9,0,.05,1.7,desk);
    for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){const face=group(0,0,a,desk);sign(face,"안내","Information",1.5,0,2.84,.03,"#1f4f86","#ffffff",.5);}
    const entry=group(0,28.77,Math.PI);
    for(const x of [-14,-7,0,7,14]){
      box(0x677e88,x,1.55,.06,2.13,3.15,.22,entry);box(0xabc8c8,x,1.55,.21,1.89,2.89,.1,entry);
    }
    sign(entry,"서울역광장 출구","EXIT",5.9,0,3.9,.25);
    // Departure board above the way to the platforms, drawn like the station's LED panel.
    const departures=group(1.5,-16);
    const rows=[["10:00","KTX","029","부산","3","탑승 중"],["10:12","KTX-산천","407","목포","4","탑승 준비"],["10:25","ITX-새마을","1003","부산","6",""],
      ["10:31","KTX-이음","705","강릉","12",""],["10:40","무궁화호","1211","부산","8",""],["10:55","KTX","211","포항","5","5분 지연"]];
    const led=paintMap(1280,400,(ctx,w,h)=>{
      ctx.fillStyle="#0c1114";ctx.fillRect(0,0,w,h);ctx.fillStyle="#17384f";ctx.fillRect(0,0,w,64);
      ctx.textBaseline="middle";ctx.font="bold 36px sans-serif";ctx.fillStyle="#f3f6f4";ctx.fillText("열차 출발 안내   Departures",26,34);
      ctx.font="bold 28px sans-serif";ctx.fillStyle="#9fc4d8";
      for(const [x,title] of [[26,"시각"],[190,"열차"],[520,"행선지"],[790,"타는 곳"],[980,"상태"]])ctx.fillText(title,x,92);
      rows.forEach(([time,train,number,to,track,note],i)=>{
        const y=142+i*47;ctx.fillStyle=i%2?"#10181c":"#141e23";ctx.fillRect(0,y-23,w,46);
        ctx.font="bold 34px sans-serif";ctx.fillStyle="#f6d86b";ctx.fillText(time,26,y);
        ctx.fillStyle=train.startsWith("KTX")?"#7fd3f0":"#b7e08a";ctx.fillText(train,190,y);ctx.fillStyle="#cfd8d6";ctx.font="28px sans-serif";ctx.fillText(number,430,y+2);
        ctx.font="bold 34px sans-serif";ctx.fillStyle="#ffffff";ctx.fillText(to,520,y);ctx.fillStyle="#f6d86b";ctx.fillText(track,830,y);
        ctx.fillStyle=note.includes("지연")?"#ff8a6a":"#8be0a0";ctx.fillText(note,980,y);
      });
    },false);
    box(0x20272a,0,6.1,0,12.9,4.2,.34,departures);
    for(const face of [1,-1]){
      const panel=new T.Mesh(new T.PlaneGeometry(12.5,3.9),new T.MeshBasicMaterial({map:led}));
      panel.position.set(0,6.1,face*.18);panel.rotation.y=face>0?0:Math.PI;departures.add(panel);
    }
    box(0x1f4f86,0,3.72,0,12.9,.56,.2,departures);
    sign(departures,"타는 곳  Tracks  1 – 14",null,7.6,0,3.72,.11,"#1f4f86","#ffffff",.5);
    const reverse=group(0,0,Math.PI,departures);
    sign(reverse,"나가는 곳  ·  서울역광장",null,7.6,0,3.72,.11,"#1f4f86","#ffffff",.5);
    for(const x of [-5.6,5.6])rod(silver,x+1.5,(crown(x+1.5)+8.2)/2,-16,.055,crown(x+1.5)-8.2);
    sign(room,"3 · 4   ↓   타는 곳","TRACKS    /    KTX",6,0,3.6,-28);
    sign(room,"3층  ↑  식당가","FOOD HALL",5.2,-16,3.6,-28);
    sign(room,"승강기  ↕","LIFT",2.5,-7.25,3.1,-28);
    const props=makeRegionalItemProps(T,kit);
    for(const p of railShopPlots){
      const g=group(p.x,p.z,p.angle),w=p.w,d=p.d;
      g.position.y=p.level??0;
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
    box(0xb4b1a7,0,-.12,0,8.7,.24,97);stoneFloor([[-4.35,-48.5],[4.35,-48.5],[4.35,48.5],[-4.35,48.5]]);
    box(0x818981,0,-1.25,3.75,23,.26,104.5);
    sign(room,"↓  전철 직통환승","Metro transfer",4.5,0,3.10,-46);
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
    sign(room,"3 · 4    서울","열차 타는 곳",3.5,0,3.3,2);
    const returnSign=group(0,39.1,Math.PI);
    sign(returnSign,"↑ 나가는 곳","2층 맞이방",4.1,0,2.72,0);

    yield;
    const train=buildKtx(T,group(7.09,0),{box,rod,group,girder,paintMap});
    yield;
    buildKtx(T,group(-7.09,0,Math.PI),{box,rod,group,girder,paintMap},"classic",false);
    // The open door of car 2, with a boarding plate over the gap.
    box(0x1b2227,-1.71,1.05,12,.05,2.26,1.04,train);box(0xa3b2b2,-1.88,-.02,12,.5,.06,1.2,train);
    for(const dz of [-.56,.56])box(0xe0b84c,-1.7,1.05,12+dz,.08,2.28,.06,train);
    const led=paintMap(512,96,(ctx,w,h)=>{
      ctx.fillStyle="#0b0f12";ctx.fillRect(0,0,w,h);ctx.fillStyle="#f6c443";ctx.font="bold 54px sans-serif";ctx.textBaseline="middle";
      ctx.fillText("KTX 029",18,50);ctx.fillStyle="#f3f6f4";ctx.fillText("부산",300,50);ctx.fillStyle="#8be0a0";ctx.font="bold 30px sans-serif";ctx.fillText("Busan",404,54);
    },false);
    const display=new T.Mesh(new T.PlaneGeometry(1.5,.28),new T.MeshBasicMaterial({map:led}));
    display.position.set(-1.682,2.52,13.6);display.rotation.y=-Math.PI/2;train.add(display);
    const doorLabel=group(-1.76,12,-Math.PI/2,train);
    sign(doorLabel,"2호차  ·  일반실","KTX  ·  승차 체험",2.3,0,2.95,0,"#1d4f91","#ffffff",.46);
  }else{
    // KTX standard car. The cabin and platform are separate streamed rooms; the view beyond
    // the glass uses platform scenery.
    ceilingLight(0,2.2,5.5,10,13);ceilingLight(0,2.2,-5.5,10,13);
    const glow=color=>new T.MeshBasicMaterial({color});
    const lit=(color,x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),glow(color));m.position.set(x,y,z);room.add(m);return m;};
    const windowMaterial=new T.MeshStandardMaterial({color:0xb1d2d5,transparent:true,opacity:.2,depthWrite:false});
    for(const side of [-1,1]){
      box(0xb9bab0,side*6,-.19,0,7,.36,62);
      box(0xabb5b3,side*6,3.97,0,8,.24,62);
      for(let z=-28;z<30;z+=7)rod(0x819394,side*6.3,1.87,z,.10,3.74);
      box(0xa1aea9,side*20,4.5,0,5,10,65);
      for(let j=-5;j<=5;j++)box(0x75868a,side*17.45,3,j*5,.1,2.8,4.45);
    }
    // Carpet with a woven check and a darker runner along the aisle.
    const carpet=new T.MeshStandardMaterial({roughness:.96,map:paintMap(64,64,(ctx,n)=>{
      ctx.fillStyle="#3b4862";ctx.fillRect(0,0,n,n);
      for(let j=0;j<8;j++)for(let i=0;i<8;i++){ctx.fillStyle=(i+j)%2?"#43516f":"#34405a";ctx.fillRect(i*8+1,j*8+1,6,6);}
    })});
    const rug=new T.PlaneGeometry(3.9,23.8);rug.rotateX(-Math.PI/2);
    for(let i=0;i<rug.attributes.uv.count;i++)rug.attributes.uv.setXY(i,rug.attributes.uv.getX(i)*6.5,rug.attributes.uv.getY(i)*39.6);
    box(0x565b63,0,-.08,0,3.9,.16,23.8);const floor=new T.Mesh(rug,carpet);floor.position.y=.004;room.add(floor);
    box(0x2c3548,0,.008,-.4,.9,.006,21.4);
    const pillars=Array.from({length:10},(_,k)=>-8.825+k*1.95);
    for(const side of [-1,1]){
      box(0xe7e8e3,side*1.93,.4,0,.1,.8,23.8);box(0xb7bcb8,side*1.868,.13,0,.05,.18,22.8);box(0xcfd3cf,side*1.885,.815,0,.17,.05,23.8);
      box(0xe7e8e3,side*1.93,1.3,-10.36,.1,1,3.07);box(0xe7e8e3,side*1.93,1.3,10.31,.1,1,3.17);
      for(const z of pillars)box(0xecede8,side*1.915,1.3,z,.13,1,.4);
      for(let k=1;k<pillars.length;k++){
        const z=(pillars[k]+pillars[k-1])/2;
        box(0xb6cdd2,side*1.955,1.3,z,.04,.96,1.56).material=windowMaterial;
        box(0xd9d2bd,side*1.925,1.74-(k*7%4)*.035,z,.02,.1+(k*7%4)*.07,1.5);
        box(0x9aa5a8,side*1.9,.87,z,.06,.03,1.5);
      }
      box(0xeeefea,side*1.9,1.86,0,.16,.14,23.8);
      const cove=box(0xf3f4ef,side*1.6,2.2,0,.86,.05,23.8);cove.rotation.z=-side*.66;
      // Glass luggage shelf with its rail, brackets and reading light.
      box(0xc3d2d4,side*1.53,1.985,0,.72,.025,20.8);box(0xccd3d3,side*1.17,2.0,0,.045,.05,20.8);
      for(const z of pillars)box(0xc2c9c9,side*1.55,1.92,z,.7,.1,.04);
      lit(0xfff3d6,side*1.3,1.955,0,.09,.02,20.4);lit(0xfffbe9,side*.62,2.465,0,.2,.02,22.4);
    }
    box(0xf5f5f0,0,2.5,0,2.6,.06,23.8);
    // Bulkheads with the sliding vestibule door and the passenger information display.
    for(const end of [-1,1]){
      const wall=group(0,end*11.86,end<0?0:Math.PI);
      box(0xe9eae5,0,1.27,0,3.9,2.54,.1,wall);box(0xa9b4b6,0,1.06,.07,1.0,2.12,.05,wall);box(0x223540,0,1.16,.1,.8,1.8,.02,wall);
      box(0xc9d0d0,.3,1.08,.12,.03,.5,.03,wall);box(0xd8d4c8,-1.35,.5,.14,.5,1,.18,wall);box(0xc23a2f,1.42,.62,.12,.22,.5,.14,wall);
      const info=paintMap(512,112,(ctx,w,h)=>{
        ctx.fillStyle="#0b0f12";ctx.fillRect(0,0,w,h);ctx.textBaseline="middle";ctx.font="bold 50px sans-serif";
        ctx.fillStyle="#f6c443";ctx.fillText("1호차",16,58);ctx.fillStyle="#f3f6f4";ctx.fillText("서울 → 부산",170,58);ctx.fillStyle="#8be0a0";ctx.font="bold 28px sans-serif";ctx.fillText("KTX 029",398,60);
      },false);
      const board=new T.Mesh(new T.PlaneGeometry(1.5,.33),new T.MeshBasicMaterial({map:info}));board.position.set(0,2.3,.12);wall.add(board);
      box(0x2b3136,0,2.3,.08,1.62,.42,.05,wall);
    }
    for(const z of [-4.9,4.9]){
      box(0x22272b,0,2.24,z,.66,.4,.07);rod(0xb9c1c2,0,2.46,z,.025,.1);
      const screen=paintMap(256,144,(ctx,w,h)=>{
        ctx.fillStyle="#12324a";ctx.fillRect(0,0,w,h);ctx.fillStyle="#ffffff";ctx.font="bold 30px sans-serif";ctx.fillText("서울역 정차 중",22,52);
        ctx.fillStyle="#9fd0e8";ctx.font="bold 20px sans-serif";ctx.fillText("Seoul Station",24,88);ctx.fillStyle="#f6c443";ctx.fillText("다음 역  광명",24,120);
      },false);
      for(const face of [-1,1]){
        const lcd=new T.Mesh(new T.PlaneGeometry(.58,.33),new T.MeshBasicMaterial({map:screen}));lcd.position.set(0,2.24,z+face*.04);lcd.rotation.y=face>0?0:Math.PI;room.add(lcd);
      }
    }
    const exit=group(-1.87,9.5,Math.PI/2);box(0xdfe2de,0,1.08,0,1.18,2.16,.08,exit);box(0x223540,0,1.5,.05,.56,.8,.02,exit);
    for(const u of [-.6,.6])box(0xe0b84c,u,1.08,.05,.05,2.16,.03,exit);
    sign(exit,"승강장","내리는 문",.97,0,2.36,.08,"#1d6a52","#fff4d9",.4);
    // Luggage stack by the door.
    for(const [y,w] of [[.5,1],[1.05,1],[1.6,1]])box(0xb9c1c2,1.5,y,10.4,.8,.04,1.5);
    for(const z of [9.68,11.12])box(0xa9b2b3,1.5,.82,z,.8,1.64,.05);
    box(0x48607e,1.5,.76,10.1,.5,.46,.3);box(0x7a4b3f,1.48,.2,10.65,.46,.36,.7);
    // One upholstered shell, profiled from the side and extruded across the seat.
    const outline=new T.Shape([[-.45,.34],[-.47,.44],[-.43,.5],[-.06,.485],[.11,.5],[.17,.58],[.275,1.0],[.325,1.3],[.37,1.345],[.435,1.33],[.45,1.26],[.4,.62],[.34,.4],[.22,.34]].map(([z,y])=>new T.Vector2(z,y)));
    const shell=new T.ExtrudeGeometry(outline,{depth:.44,bevelEnabled:true,bevelSize:.028,bevelThickness:.028,bevelSegments:2,curveSegments:1});
    shell.rotateY(-Math.PI/2);shell.translate(.22,0,0);shell.computeVertexNormals();
    const fabric=new T.MeshStandardMaterial({color:0x34508c,roughness:.93});
    for(const [i,z] of seatRows.entries()){
      for(const side of [-1,1]){
        for(const u of seatOffsets){
          const x=u*side,seat=new T.Mesh(shell,fabric);seat.position.set(x,0,z);seat.castShadow=true;room.add(seat);
          const cover=box(0xf2f0e9,x,1.21,z+.318,.42,.21,.022);cover.rotation.x=.23;
          const back=box(0x4c535b,x,.87,z+.418,.47,.9,.03);back.rotation.x=.155;
          const tray=box(0x737a82,x,.93,z+.447,.36,.25,.02);tray.rotation.x=.155;box(0x2b3035,x,.6,z+.4,.36,.15,.02);
          box(0x9aa2a6,x,1.08,z+.47,.05,.03,.02);
        }
        for(const u of [seatOffsets[0]-.3,(seatOffsets[0]+seatOffsets[1])/2,seatOffsets[1]+.3]){
          box(0x353a41,u*side,.66,z-.1,.055,.05,.4);box(0x353a41,u*side,.56,z+.08,.05,.2,.05);
        }
        const mid=(seatOffsets[0]+seatOffsets[1])/2*side;
        box(0x5a6068,mid,.3,z-.08,1.12,.07,.36);box(0x5a6068,mid,.14,z-.08,.14,.28,.3);box(0x6c7379,mid,.1,z-.52,1.0,.03,.05);
      }
      if(i%2===0)yield;
    }
  }
  return {};
}
