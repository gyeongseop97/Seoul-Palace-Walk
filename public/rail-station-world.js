import {buildKtx} from "./ktx-model.js";
import {stationHall,railPlatform,railShopPlots,seatRows,seatOffsets,waitingRows,extraWaitingRows,hallColumns,hallBays,hallDoors,ticketOffice,ticketMachines,infoDesk,departureBoard,ktxStairs,ktxBerths} from "./rail-station-layout.js";
import {hallOrigin,hallSpan,concourseParts,boardingIslands,ktxIsland} from "./station-levels.js";
import {standSign} from "./regional-stands.js";
import {stationGranite} from "./station-materials.js";
import {makeRegionalItemProps} from "./regional-item-props.js";

const navy=0x234967,blue=0x336990,silver=0xb5c2c5,ivory=0xeee8d9,slate=0x546576;
export function* buildRailRoom(T,root,kit,venue){
  const room=new T.Group();room.name=venue.name;room.position.set(kit.wx(venue.center.x),venue===railPlatform?-6.3:0,kit.wz(venue.center.y));root.add(room);
  // The platform is modelled with its stairs at +z; in the station they are at its north end.
  if(venue===railPlatform)room.rotation.y=Math.PI;
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
  function seats(p,x,z,width,count,color,angle=0){
    const g=group(x,z,angle,p);
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
    // One long hall above the tracks: doors to the square at the east end, the west plaza at
    // the other, platform gates along the glazed south wall and shops along the north wall.
    const {x0,x1,z0,z1}=hallSpan,length=x1-x0,depth=z1-z0,midX=(x0+x1)/2,eave=9.2,gate=4.2;
    for(const x of [6,-40,-86])ceilingLight(x,7.4,0,66,48);
    box(0xb9b6ac,midX,-.12,0,length,.24,depth);stoneFloor([[x0,z0],[x1,z0],[x1,z1],[x0,z1]]);
    const crown=z=>eave+4.4*(1-(z/z1)**2);
    // Openings follow the walkable plan, so every gap in a wall is a real way through.
    const level=(p,z)=>p.back==null?p.h:p.h+(p.back-p.h)*(z-p.z0)/(p.z1-p.z0);
    const openings=z=>concourseParts.filter(p=>p.style!=="hall"&&(z>0?p.z0===z:p.z1===z)&&Math.abs(level(p,z))<.05)
      .map(p=>({a:p.x0,b:p.x1,p})).sort((m,n)=>m.a-n.a);
    const between=gaps=>{
      const solid=[];let from=x0;
      for(const {a,b} of gaps){if(a-from>.05)solid.push([from,a]);from=Math.max(from,b);}
      if(x1-from>.05)solid.push([from,x1]);return solid;
    };
    const south=openings(z1),north=openings(z0);
    const glazing=new T.MeshStandardMaterial({color:0x7fa3ab,roughness:.3,transparent:true,opacity:.4,depthWrite:false});
    const frame=0x8c9da0,mullion=0x7d8f93;
    // South curtain wall over the platforms.
    box(0x839fa8,midX,(eave+gate)/2,z1-.05,length,eave-gate,.09).material=glazing;
    for(const [a,b] of between(south)){
      box(0x839fa8,(a+b)/2,(gate+.6)/2,z1-.05,b-a,gate-.6,.09).material=glazing;
      box(0xbec5c4,(a+b)/2,.3,z1-.1,b-a,.6,.3);
    }
    for(const y of [gate,6.7,eave-.08])box(frame,midX,y,z1-.12,length,.14,.26);
    for(let x=x0;x<=x1+.01;x+=length/30){
      const open=south.some(({a,b})=>x>a+.05&&x<b-.05),low=open?gate:0;
      box(mullion,x,(eave+low)/2,z1-.12,.12,eave-low,.24);
    }
    for(const {a,b} of south)for(const x of [a,b])box(0x6f8288,x,gate/2,z1-.12,.2,gate,.3);
    yield;
    // North wall: stone-clad below, with a clerestory above the shopfronts.
    for(const [a,b] of between(north))box(0xe3ded2,(a+b)/2,2.3,z0+.1,b-a,4.6,.24);
    for(const {a,b} of north){
      box(0xe3ded2,(a+b)/2,(4.6+gate)/2,z0+.1,b-a,4.6-gate,.24);
      for(const x of [a,b])box(0xcfc8b8,x,gate/2,z0+.14,.26,gate,.34);
    }
    // The clerestory is left out where an upper gallery looks down into the hall.
    const galleries=concourseParts.filter(p=>p.z1===z0&&p.h>3&&p.style!=="stairs").map(p=>({a:p.x0,b:p.x1,p})).sort((m,n)=>m.a-n.a);
    for(const [a,b] of between(galleries)){
      box(0x9db7bd,(a+b)/2,(eave+4.6)/2,z0+.08,b-a,eave-4.6,.12);
      for(const y of [6.9,eave-.08])box(frame,(a+b)/2,y,z0+.15,b-a,.12,.22);
    }
    for(const {a,b,p} of galleries){
      box(0xe3ded2,(a+b)/2,(p.h+4.6)/2,z0+.1,b-a,p.h-4.6+.02,.24);
      for(const x of [a,b])box(0xcfc8b8,x,(eave+p.h)/2,z0+.14,.3,eave-p.h,.36);
      box(0xd9d3c5,(a+b)/2,eave-.2,z0+.14,b-a,.4,.36);
      sign(room,"3층  식당가  ·  전망 카페","RESTAURANTS   /   CAFE",Math.min(8,b-a-1),(a+b)/2,eave-.2-.62,z0+.34,"#294655","#f7efdc",.6);
    }
    box(0xd9d3c5,midX,4.6,z0+.16,length,.3,.36);
    for(let x=x0;x<=x1+.01;x+=length/30)if(!galleries.some(({a,b})=>x>a-.05&&x<b+.05))box(mullion,x,(eave+4.75)/2,z0+.15,.11,eave-4.75,.22);
    // Glazed end walls with their doors.
    const ends=[[x1,-1,"나가는 곳  ·  서울역광장","EXIT   /   Seoul Station Square",hallDoors.map(d=>d.inside.y-stationHall.center.y)],
      [x0,1,"서부광장  ·  서부역 방면","WEST EXIT",[-2.2,2.2]]];
    for(const [x,inward,title,sub,doors] of ends){
      box(0x839fa8,x-inward*-.05,eave/2,0,.09,eave,depth).material=glazing;
      for(const y of [3.3,6.4,eave-.08])box(frame,x+inward*.12,y,0,.26,.14,depth);
      for(let z=z0;z<=z1+.01;z+=depth/10)box(mullion,x+inward*.12,eave/2,z,.24,eave,.12);
      for(let j=0;j<8;j++){
        const a=z0+j*depth/8,mid=a+depth/16,top=crown(mid)-.1;
        box(0x92aeb6,x,(top+eave)/2,mid,.13,top-eave,depth/8-.02);box(0x768b92,x+inward*.06,(top+eave)/2,a,.24,top-eave,.09);
      }
      const wall=group(x+inward*.22,0,inward*Math.PI/2);
      for(const z of doors){
        const u=-inward*z;
        box(0x677e88,u,1.55,.02,2.13,3.15,.22,wall);box(0xabc8c8,u,1.5,.12,1.89,2.86,.1,wall);box(0x4f6470,u,1.5,.18,.07,2.86,.05,wall);
        box(0xc6a262,u,.012,1.5,.36,.018,2.6,wall);
      }
      sign(wall,title,sub,7.4,0,3.95,.2,"#1f4f86","#ffffff",.66);
    }
    // The square and the city beyond the east glass.
    box(0xb3b1a4,x1+39.5,-.64,-4,78,.75,84);
    for(const [u,z,width,height,span] of [[74,-30,24,19,17],[90,-7,20,30,19],[75,15,22,14,21],[98,36,23,22,16]]){
      box(0xb0b4ae,u,height/2-.36,z,width,height,span);
      for(let floor=2;floor<height-1;floor+=3.15)box(0x82979b,u-width/2-.04,floor,z,.12,1.47,span-.5);
    }
    box(0xb3b1a4,x0-22,-.64,0,43,.75,70);
    for(const [u,z,width,height,span] of [[x0-34,-16,18,16,22],[x0-40,14,20,24,18]]){
      box(0xa9aeaa,u,height/2-.36,z,width,height,span);
      for(let floor=2;floor<height-1;floor+=3.15)box(0x82979b,u+width/2+.04,floor,z,.12,1.47,span-.5);
    }
    yield;
    // The roof is a shallow vault on white steel ribs, with a skylight along the ridge.
    const skylight=new T.MeshBasicMaterial({color:0xe6f3f8});
    for(let j=0;j<8;j++){
      const a=z0+j*depth/8,b=a+depth/8,ya=crown(a),yb=crown(b);
      const roof=box(0xf0f2ee,midX,(ya+yb)/2+.17,(a+b)/2,length,.18,Math.hypot(b-a,yb-ya)+.045);
      roof.rotation.x=-Math.atan2(yb-ya,b-a);
      if(j===3||j===4)roof.material=skylight;
    }
    for(let j=0;j<=8;j++){const z=z0+j*depth/8;box(0xb2bfc0,midX,crown(z)-.07,z,length,.15,.13);}
    for(const z of [-9,9])box(0xffefd4,midX,crown(z)-1.12,z,length-8,.08,.14);
    for(let k=0;k<22;k++){
      const x=hallBays[0]-k*17/3,main=k%3===0;
      for(let j=0;j<8;j++){
        const a=z0+j*depth/8,b=a+depth/8,ya=crown(a),yb=crown(b);
        girder(room,[x,ya,a],[x,yb,b],main?.26:.15,0xf3f5f3);
        if(!main)continue;
        girder(room,[x,ya-1,a],[x,yb-1,b],.17,0xe6ebea);
        girder(room,j<4?[x,ya-1,a]:[x,ya,a],j<4?[x,yb,b]:[x,yb-1,b],.12,0xd5dddc);
      }
      if(k%6===2)yield;
    }
    for(const [x,z] of hallColumns){
      box(0xc9c6bb,x,.66,z,1.08,1.32,1.08);box(0xdedbd0,x,1.39,z,1.17,.12,1.17);
      const top=crown(z)-.85;
      for(const d of [-.18,.18])for(const e of [-.18,.18])rod(0xe0e4dc,x+d,(top+1.4)/2,z+e,.15,top-1.4);
    }
    yield;
    // Tactile route from the doors along the gates, with a branch to every stair.
    box(0xc6a262,midX,.011,7,length-6,.018,.36);
    const stairs=[{x:ktxStairs.x,tracks:ktxIsland.tracks,ktx:true},...boardingIslands];
    for(const {x,tracks,ktx} of stairs){
      const lane=x-(ktx?1:1.5);
      box(0xc6a262,lane,.012,(7+z1)/2,.36,.018,z1-7);
      const head=group(x,z1-.3,Math.PI);
      sign(head,tracks,"포항행 KTX 타는 곳",ktx?4.4:5.6,0,gate-.42,0,"#1f4f86","#ffffff",.78);
      box(0x1f4f86,0,gate+.02,-.02,ktx?5.2:7.7,.12,.3,head);
    }
    const liftHead=group(-4.2,z1-.3,Math.PI);sign(liftHead,"승강기  ↕","LIFT  ·  3 · 4",2.5,0,gate-.42,0,"#294d61","#fff3c8",.6);
    for(const {a,b,p} of north){
      const title=p.style==="stairs"?["3층  ↑  식당가","FOOD HALL"]:p.name.includes("승강기")?["승강기  ↕","LIFT"]:
        p.name.includes("쇼핑")?["쇼핑  ·  마트","SHOPPING   /   MART"]:["지하철 1·4호선  ·  공항철도  ↓","SUBWAY   /   AIRPORT RAILROAD"];
      sign(room,title[0],title[1],Math.min(7.6,b-a-.2),(a+b)/2,gate-.42,z0+.32,"#1f4f86","#ffffff",.66);
    }
    for(const [x,z] of [...waitingRows,...extraWaitingRows])seats(room,x,z,2.1,2,0x648085,Math.PI);
    // Staffed ticket windows under a blue fascia, as in the station.
    const {w:officeW,d:officeD}=ticketOffice,front=officeD/2,tickets=group(ticketOffice.x,ticketOffice.z);
    box(0xe9e6dc,0,1.9,0,officeW,3.8,officeD,tickets);box(0x1f4f86,0,3.38,front+.06,officeW+.04,.84,.16,tickets);
    box(0xd8d4c8,0,.55,front+.12,officeW-.3,1.1,.36,tickets);box(0xf4f1e8,0,1.12,front+.22,officeW-.2,.07,.62,tickets);
    const windows=Array.from({length:6},(_,i)=>(i-2.5)*2.08);
    for(const x of windows){
      box(0x86a9b4,x,1.98,front+.05,1.86,1.62,.07,tickets);box(0x3b5f6e,x,2.64,front+.1,1.9,.3,.05,tickets);
      box(0xcfd6d6,x+1.04,1.98,front+.1,.07,1.66,.14,tickets);box(0x2b3b44,x,1.24,front+.4,.5,.16,.3,tickets);
    }
    box(0xcfd6d6,windows[0]-1.04,1.98,front+.1,.07,1.66,.14,tickets);
    const ticketSign=paintMap(1024,72,(ctx,w,h)=>{
      ctx.fillStyle="#1f4f86";ctx.fillRect(0,0,w,h);ctx.fillStyle="#ffffff";ctx.textBaseline="middle";
      ctx.font="bold 44px sans-serif";ctx.fillText("승차권 매표소",30,38);ctx.font="600 27px sans-serif";ctx.fillStyle="#d9e6f4";ctx.fillText("Tickets  ·  乘车券  ·  きっぷうりば",360,40);
    },false);
    const ticketBoard=new T.Mesh(new T.PlaneGeometry(officeW-.1,.83),new T.MeshBasicMaterial({map:ticketSign}));ticketBoard.position.set(0,3.38,front+.15);tickets.add(ticketBoard);
    // Self-service ticket machines stand beside the counters.
    for(let i=0;i<ticketMachines.count;i++){
      const kiosk=group(ticketMachines.x+(i-(ticketMachines.count-1)/2)*ticketMachines.pitch,ticketMachines.z);
      box(0xeef0ec,0,.86,0,.86,1.72,.62,kiosk);box(0x1f4f86,0,1.8,0,.9,.18,.66,kiosk);box(0x20303a,0,1.18,.32,.6,.46,.03,kiosk);
      box(0x5fb3c8,0,1.18,.335,.52,.38,.01,kiosk);box(0xc9cfce,0,.74,.33,.5,.16,.04,kiosk);box(0xf2c54b,.24,.5,.32,.12,.06,.03,kiosk);
    }
    sign(room,"자동발매기","Ticket Machines",3.4,ticketMachines.x,2.5,ticketMachines.z+.36,"#1f4f86","#ffffff",.56);
    // Round information desk inside the entrance.
    const desk=group(infoDesk.x,infoDesk.z);
    kit.cylinder(0xf2f0e8,0,.52,0,1.12,1.04,28,desk);kit.cylinder(0x1f4f86,0,1.07,0,1.2,.07,28,desk);kit.cylinder(0xdedad0,0,.05,0,1.22,.1,28,desk);
    rod(0xc7cfd0,0,1.9,0,.05,1.7,desk);
    for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){const face=group(0,0,a,desk);sign(face,"안내","Information",1.5,0,2.84,.03,"#1f4f86","#ffffff",.5);}
    // Departure board above the gates, drawn like the station's LED panel. The seats face it.
    const departures=group(departureBoard.x,departureBoard.z,Math.PI),boardY=6.75,boardW=departureBoard.w;
    const rows=[["10:00","KTX","029","부산","3","탑승 중"],["10:12","KTX-산천","407","목포","4","탑승 준비"],["10:25","ITX-새마을","1003","부산","6",""],
      ["10:31","KTX-이음","705","강릉","12",""],["10:40","무궁화호","1211","부산","8",""],["10:55","KTX","211","포항","1–14","탑승 중"]];
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
    box(0x20272a,0,boardY,0,boardW,4.2,.34,departures);
    const panel=new T.Mesh(new T.PlaneGeometry(boardW-.4,3.9),new T.MeshBasicMaterial({map:led}));
    panel.position.set(0,boardY,.18);departures.add(panel);
    for(const x of [-5.6,5.6])rod(silver,x,(crown(departureBoard.z)+boardY+2.1)/2,0,.055,crown(departureBoard.z)-boardY-2.1,departures);
    // Overhead direction signs, read from either end of the hall.
    for(const x of [13.5,-57]){
      const top=crown(0)-1.2;
      box(0x1f4f86,x,4.55,0,.2,.9,15.2);for(const z of [-6.8,6.8])rod(silver,x,(top+5)/2,z,.05,top-5);
      const west=group(x+.11,0,Math.PI/2),east=group(x-.11,0,-Math.PI/2);
      sign(west,"←  타는 곳  1 – 14","Tracks",5.4,-4.6,4.55,0,"#1f4f86","#ffffff",.62);
      sign(west,"매표소  ·  식당가  →","Tickets   /   Food Hall",5.8,4.5,4.55,0,"#1f4f86","#ffffff",.62);
      sign(east,"←  매표소  ·  쇼핑","Tickets   /   Shopping",5.4,-4.6,4.55,0,"#1f4f86","#ffffff",.62);
      sign(east,"타는 곳  1 – 14  →","Tracks",5.8,4.5,4.55,0,"#1f4f86","#ffffff",.62);
    }
    yield;
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
    const long=railPlatform.bounds.maxY-railPlatform.bounds.minY,end=long/2,track=6.2;
    box(0xb4b1a7,0,-.12,0,8.7,.24,long);stoneFloor([[-4.35,-end],[4.35,-end],[4.35,end],[-4.35,end]]);
    box(0x9c9a90,0,-.78,0,8.46,1.1,long);
    for(const side of [-1,1]){
      box(0xd5ac54,side*3.74,.012,0,.31,.018,long-.2);
      box(0xf5e8ba,side*4.20,.016,0,.12,.025,long);
      // Each track runs on under the concourse and out past the end of the platform.
      box(0x757879,side*track,-.97,.5,4.3,.38,132);
      for(const offset of [-.72,.72])box(0x858b90,side*track+offset,-.65,.5,.075,.19,132);
      for(let z=-65;z<66.5;z+=1.3)box(0x6b655b,side*track,-.8,z,2.35,.13,.19);
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
    const tools={box,rod,group,girder,paintMap};
    const led=paintMap(512,96,(ctx,w,h)=>{
      ctx.fillStyle="#0b0f12";ctx.fillRect(0,0,w,h);ctx.fillStyle="#f6c443";ctx.font="bold 54px sans-serif";ctx.textBaseline="middle";
      ctx.fillText("KTX",18,50);ctx.fillStyle="#f3f6f4";ctx.fillText("포항",207,50);ctx.fillStyle="#8be0a0";ctx.font="bold 30px sans-serif";ctx.fillText("Pohang",342,53);
    },false);
    for(const side of [-1,1]){
      const train=buildKtx(T,new T.Group(),tools,side<0?"sancheon":"classic");
      box(0x1b2227,-1.71,1.05,12,.05,2.26,1.04,train);
      box(0xa3b2b2,-1.95,-.02,12,.66,.06,1.2,train);
      for(const dz of [-.56,.56])box(0xe0b84c,-1.7,1.05,12+dz,.08,2.28,.06,train);
      const display=new T.Mesh(new T.PlaneGeometry(1.5,.28),new T.MeshBasicMaterial({map:led}));
      display.position.set(-1.682,2.52,13.6);display.rotation.y=-Math.PI/2;train.add(display);
      const doorLabel=group(-1.76,12,-Math.PI/2,train);
      sign(doorLabel,"2호차  ·  일반실","포항행 KTX",2.3,0,2.95,0,"#1d4f91","#ffffff",.46);
      // Reuse the two train models, their textures and their repeated parts across the yard.
      train.updateMatrixWorld(true);
      const batches=new Map();
      train.traverse(part=>{
        if(!part.isMesh)return;
        const key=part.geometry.id+"/"+part.material.id;
        if(!batches.has(key))batches.set(key,{part,matrices:[]});
        batches.get(key).matrices.push(part.matrixWorld);
      });
      const berths=ktxBerths.filter(berth=>berth.side===side);
      for(const {part,matrices} of batches.values()){
        const batch=new T.InstancedMesh(part.geometry,part.material,berths.length*matrices.length);
        const placement=new T.Matrix4(),transform=new T.Matrix4();
        let index=0;
        for(const berth of berths){
          placement.makeRotationY(side>0?Math.PI:0);
          placement.setPosition(ktxIsland.x-berth.x,0,railPlatform.center.y-hallOrigin.y-berth.z);
          for(const matrix of matrices)batch.setMatrixAt(index++,transform.multiplyMatrices(placement,matrix));
        }
        batch.castShadow=part.castShadow;batch.receiveShadow=part.receiveShadow;
        batch.computeBoundingSphere();room.add(batch);
      }
      yield;
    }
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
        ctx.fillStyle="#f6c443";ctx.fillText("2호차",16,58);ctx.fillStyle="#f3f6f4";ctx.fillText("서울 → 포항",170,58);ctx.fillStyle="#8be0a0";ctx.font="bold 28px sans-serif";ctx.fillText("KTX",423,60);
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
