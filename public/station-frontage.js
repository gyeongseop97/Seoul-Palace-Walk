// Seoul Station as it stands today: the crescent concourse over the tracks, the outlet block
// it wraps, the glass rotunda above subway exit 1 and the stepped forecourt. Plan dimensions
// come from station-approach-plan.js and station-survey.js. Heights are estimated from
// Seoul's S-Map city model and street photographs.
import {concourseArc,arcPoint,terminalPose,terminalSpan,terminalDoorOffsets,stationRise,stationApproaches,eastPlazaOutline,
  forecourtPlanters,exitDome,outletRotunda,plazaCafeFront,outletFront} from "./station-approach-plan.js";
import {outletRing,eastWingRing,westWingRing,clockTower,domeOpening,terraceBenches,plazaStatue,plazaMast,exitPylon,stationBeds} from "./station-survey.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {districtTile} from "./district-material.js";

const deg=Math.PI/180;
export function lettering(T,g,title,x,y,z,w,h,ink="#ffffff",weight="bold"){
  const c=document.createElement("canvas");c.width=1024;c.height=192;
  const ctx=c.getContext("2d");ctx.fillStyle=ink;ctx.font=weight+" 121px sans-serif";ctx.textBaseline="middle";ctx.textAlign="center";ctx.fillText(title,512,102,992);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
  panel.position.set(x,y,z);g.add(panel);return panel;
}
function paint(T,width,height,draw,repeat=true){
  const c=document.createElement("canvas");c.width=width;c.height=height;draw(c.getContext("2d"),width,height);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  if(repeat)map.wrapS=map.wrapT=T.RepeatWrapping;
  return map;
}
const looks=new WeakMap();
function finishes(T){
  if(looks.has(T))return looks.get(T);
  // One curtain-wall bay: tinted pane, a soft sky reflection and aluminium mullions.
  const curtain=(top,bottom,frame)=>new T.MeshStandardMaterial({roughness:.3,metalness:.28,side:T.DoubleSide,map:paint(T,128,128,(ctx,n)=>{
    const sky=ctx.createLinearGradient(0,0,0,n);sky.addColorStop(0,top);sky.addColorStop(1,bottom);
    ctx.fillStyle=sky;ctx.fillRect(0,0,n,n);
    ctx.fillStyle="rgba(232,244,244,.16)";ctx.beginPath();ctx.moveTo(0,n*.62);ctx.lineTo(n*.7,0);ctx.lineTo(n,0);ctx.lineTo(n,n*.12);ctx.lineTo(n*.18,n);ctx.lineTo(0,n);ctx.fill();
    ctx.fillStyle=frame;ctx.fillRect(0,0,n,5);ctx.fillRect(0,0,5,n);ctx.fillStyle="rgba(20,32,36,.35)";ctx.fillRect(5,5,n,2);ctx.fillRect(5,5,2,n);
  })});
  const seam=new T.MeshStandardMaterial({roughness:.5,metalness:.2,side:T.DoubleSide,emissive:0x353837,map:paint(T,64,64,(ctx,n)=>{
    ctx.fillStyle="#e3e7e5";ctx.fillRect(0,0,n,n);
    for(let x=0;x<n;x+=16){ctx.fillStyle="#f6f8f6";ctx.fillRect(x,0,2,n);ctx.fillStyle="#bcc5c5";ctx.fillRect(x+2,0,2,n);}
  })});
  const skylight=new T.MeshStandardMaterial({roughness:.25,metalness:.3,side:T.DoubleSide,map:paint(T,64,64,(ctx,n)=>{
    ctx.fillStyle="#233d47";ctx.fillRect(0,0,n,n);ctx.fillStyle="#35596a";ctx.fillRect(6,6,n-10,n-10);
    ctx.fillStyle="#e9eeec";ctx.fillRect(0,0,n,4);ctx.fillRect(0,0,4,n);
  })});
  const panel=new T.MeshStandardMaterial({roughness:.7,metalness:.1,side:T.DoubleSide,map:paint(T,128,128,(ctx,n)=>{
    ctx.fillStyle="#c9cecc";ctx.fillRect(0,0,n,n);ctx.fillStyle="#aab3b3";ctx.fillRect(0,0,n,3);ctx.fillRect(0,0,3,n);
    ctx.fillStyle="#3f5a66";ctx.fillRect(12,40,n-21,46);ctx.fillStyle="#58798a";ctx.fillRect(15,43,n-27,18);
  })});
  // Roof plan of the outlet: gravelled wings, rooftop car park and the planted plant deck.
  const outletRoof=new T.MeshStandardMaterial({roughness:.95,map:paint(T,1040,656,(ctx,w,h)=>{
    const X=x=>(x+134)*8,Y=y=>(y-1429)*8;
    ctx.fillStyle="#9a9c98";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#7d6f5c";ctx.fillRect(X(-134),Y(1429),160,h);ctx.fillRect(X(-33),Y(1429),X(-12)-X(-33),Y(1470)-Y(1429));ctx.fillRect(X(-36),Y(1469),X(-4)-X(-36),h);
    ctx.fillStyle="#6f8f7c";ctx.fillRect(X(-114),Y(1481),X(-33)-X(-114),h);
    ctx.fillStyle="#a9adab";ctx.fillRect(X(-112),Y(1433),X(-35)-X(-112),Y(1478)-Y(1433));
    ctx.fillStyle="#e7e9e4";
    for(const row of [1438,1448,1459,1470])for(let x=-108;x<-40;x+=2.6){ctx.fillRect(X(x),Y(row),2,Y(5)-Y(0));}
    for(const row of [1438,1448,1459,1470])ctx.fillRect(X(-108),Y(row)+20,X(-40)-X(-108),2);
    let seed=77;const rnd=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
    for(let i=0;i<46;i++){
      const x=-107+Math.floor(rnd()*25)*2.6,row=[1438,1448,1459,1470][Math.floor(rnd()*4)];
      ctx.fillStyle=["#e8e8e4","#30353a","#6e7479","#b9bdc0","#8e2f2c","#2f4a66"][Math.floor(rnd()*6)];ctx.fillRect(X(x)+4,Y(row)+3,14,Y(4.3)-Y(0));
    }
    ctx.fillStyle="#c5c9c6";for(const x of [-97,-90,-82,-76,-70])ctx.fillRect(X(x),Y(1487),40,36);
    ctx.fillStyle="#4d5a5c";for(const x of [-97,-90,-82,-76,-70]){ctx.beginPath();ctx.arc(X(x)+20,Y(1487)+18,13,0,7);ctx.fill();}
    for(let i=0;i<5200;i++){ctx.fillStyle=i%2?"rgba(40,34,26,.08)":"rgba(250,246,236,.08)";ctx.fillRect(rnd()*w,rnd()*h,2,2);}
  },false)});
  const set={seam,skylight,panel,outletRoof,
    hall:curtain("#7fb0b8","#3f6f80","#dfe6e4"),outlet:curtain("#31586a","#1b3443","#8fa3aa"),shop:curtain("#6f97a0","#39596a","#c8d2d1"),
    granite:districtTile(T,"#b9b6ad","stone"),stone:districtTile(T,"#a9a69c","stone"),
    glass:new T.MeshStandardMaterial({color:0x79b3b3,roughness:.18,metalness:.25,transparent:true,opacity:.36,depthWrite:false,side:T.DoubleSide})};
  looks.set(T,set);return set;
}
// Vertical wall along a polyline. `top` may vary from point to point.
function wall(T,parent,points,base,top,material,cell=[2.2,1.8]){
  const xyz=[],uv=[],index=[];let run=0;
  for(const [i,p] of points.entries()){
    if(i)run+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);
    const high=typeof top==="function"?top(p,i):top,low=typeof base==="function"?base(p,i):base;
    xyz.push(p[0],low,p[1],p[0],high,p[1]);uv.push(run/cell[0],low/cell[1],run/cell[0],high/cell[1]);
    if(i){const k=i*2;index.push(k-2,k,k-1,k-1,k,k+1);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(xyz,3));
  geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function lid(T,parent,ring,height,material,uv=(x,z)=>[x/3,z/3]){
  const shape=new T.Shape(ring.map(([x,y])=>new T.Vector2(x,-y)));
  const geo=new T.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,map=geo.attributes.uv;
  for(let i=0;i<pos.count;i++)map.setXY(i,...uv(pos.getX(i),pos.getZ(i)));
  const mesh=new T.Mesh(geo,material);mesh.position.y=height;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
const closed=ring=>[...ring,ring[0]];
// Shallow vault across the 44 m width of the crescent, highest a little inside of centre.
export const concourseRoofHeight=s=>20.2+4.6*Math.sin(Math.PI*Math.pow(Math.min(1,Math.max(0,s)),.82));

export function buildStationFront(T,kit,{groupAt,beam,ground}){
  const {box,cylinder,matte}=kit,look=finishes(T),g=groupAt(0,0);g.name="서울역";
  const base=ground({x:0,y:1480});g.position.y=base;
  const deck=stationRise+.07,{inner,outer,from,to}=concourseArc,steel=0xdfe5e3,frame=0xb9c6c8;
  const post=(x,z,low,high,r=.16,color=steel)=>cylinder(color,x,(low+high)/2,z,r,high-low,12,g);
  // ---- crescent concourse ----
  {
    const eave=6.6,rows=14,columns=72,xyz=[],uv=[],index=[];
    for(let j=0;j<=rows;j++){
      const s=j/rows,r=inner+(outer+1.6-inner)*s,height=concourseRoofHeight((r-inner)/(outer-inner));
      const start=from*deg-eave/r,end=to*deg+4.6/r;
      for(let i=0;i<=columns;i++){
        const a=start+(end-start)*i/columns;
        xyz.push(concourseArc.x+r*Math.cos(a),height,concourseArc.y+r*Math.sin(a));uv.push(a*134/2.4,s*8);
        if(i&&j){const k=j*(columns+1)+i;index.push(k-columns-2,k-1,k-columns-1,k-columns-1,k-1,k);}
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(xyz,3));
    geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();
    const roof=new T.Mesh(geo,look.seam);roof.castShadow=true;g.add(roof);
    // Clerestory strip where the roof meets the outlet block.
    const band=[],bandUv=[],bandIndex=[];
    for(let i=0;i<=columns;i++){
      const a=(from+(to-from)*i/columns)*deg;
      for(const [r,h] of [[inner+.1,concourseRoofHeight(0)+.06],[inner+5.2,concourseRoofHeight(5.1/(outer-inner))+.07]]){
        band.push(concourseArc.x+r*Math.cos(a),h,concourseArc.y+r*Math.sin(a));bandUv.push(a*inner/1.9,r>inner+1?2:0);
      }
      if(i){const k=i*2;bandIndex.push(k-2,k-1,k,k,k-1,k+1);}
    }
    const strip=new T.BufferGeometry();strip.setAttribute("position",new T.Float32BufferAttribute(band,3));
    strip.setAttribute("uv",new T.Float32BufferAttribute(bandUv,2));strip.setIndex(bandIndex);strip.computeVertexNormals();
    g.add(new T.Mesh(strip,look.skylight));
    // Outer wall above the tracks and the slab the hall stands on.
    const arc=(radius,a0,a1,n=48)=>Array.from({length:n+1},(_,i)=>arcPoint(radius,a0+(a1-a0)*i/n));
    wall(T,g,arc(outer,from,to),deck-1.2,p=>concourseRoofHeight(1)-.4,look.hall,[2.4,2.1]);
    wall(T,g,arc(outer+.05,from,to),-1.5,deck-1.2,look.panel,[5.2,3.6]);
    for(let a=from+3;a<to;a+=5.4)for(const r of [inner+7,(inner+outer)/2,outer-7]){
      const [x,z]=arcPoint(r,a);box(0x9da3a1,x,(deck-1.4)/2-1,z,1.1,deck+.6,1.1,g).rotation.y=-a*deg;
    }
    lid(T,g,[...arc(inner,from,to,36),...arc(outer,to,from,36)],deck-1.25,matte(0x7c8483));
    // Fascia along both glass ends.
    for(const [edge,lead] of [[from,-eave],[to,4.6]]){
      let last=null;
      for(let j=0;j<=rows;j++){
        const r=inner+(outer+1.6-inner)*j/rows,a=edge*deg+lead/r;
        const p=[concourseArc.x+r*Math.cos(a),concourseRoofHeight((r-inner)/(outer-inner))-.2,concourseArc.y+r*Math.sin(a)];
        if(last)beam(g,last,p,.42,0xeef1ef);last=p;
      }
    }
  }
  // ---- east glass wall, doors and deep eave ----
  {
    const e=groupAt(terminalPose.x,terminalPose.y,terminalPose.angle);e.position.y=base;
    const [x0,x1]=terminalSpan,width=x1-x0,roofAt=x=>concourseRoofHeight((x1-x)/width)-.55,reach=x1-24.2;
    const front=[];for(let x=x0;x<=x1+.01;x+=width/20)front.push([x,-4]);
    // The wall is drawn in the local frame, where the glass stands on z=4.
    wall(T,e,front.map(([x])=>[x,4]),p=>p[0]<reach?-1:deck-.06,p=>roofAt(p[0]),look.hall,[2.2,1.72]);
    box(0xe6ebea,(x0+x1)/2,deck+4.32,4.16,width,.36,.5,e);
    for(let x=x0;x<=x1+.01;x+=4.4)box(frame,x,(deck+roofAt(Math.min(x1,Math.max(x0,x))))/2,4.14,.22,roofAt(Math.min(x1,Math.max(x0,x)))-deck,.34,e);
    for(const x of terminalDoorOffsets){
      box(0xcdd6d6,x,deck+1.62,4.34,3.5,3.24,.32,e);box(0xf0f3f1,x,deck+3.34,4.5,3.9,.2,.9,e);
      for(const side of [-1,1]){
        box(0x24404c,x+side*.82,deck+1.5,4.52,1.52,2.86,.07,e);
        box(0xc0cacb,x+side*.1,deck+1.3,4.6,.06,.9,.07,e);
      }
      box(0x2c5a74,x,deck+2.98,4.55,3.3,.34,.06,e);
    }
    lettering(T,e,"서울역",x1-13.2,deck+11.2,4.24,16.5,4.6);
    lettering(T,e,"Seoul Station",x1-13.2,deck+8.2,4.24,10.4,1.8,"#f4f8f7","600");
    lettering(T,e,"KTX  ·  맞이방  2F",0,deck+3.02,4.62,3,.3);
    // Tapered ribs carry the eave to slender posts in front of the doors.
    const posts=[x1-.4,...terminalDoorOffsets.slice(1).map((door,i)=>(door+terminalDoorOffsets[i])/2),terminalDoorOffsets[0]-2.2];
    for(const x of posts){
      const high=roofAt(x)-.1;
      cylinder(steel,x,(deck+high)/2,9.4,.15,high-deck,12,e);cylinder(0xaab4b4,x,deck+.2,9.4,.26,.4,12,e);
      beam(e,[x,high-.45,4.2],[x,high-.05,10.4],.26,0xe9eeec);
    }
    for(let x=x0+2;x<reach;x+=4.4)beam(e,[x,roofAt(x)-.45,4.2],[x,roofAt(x)-.05,10.4],.26,0xe9eeec);
    // Tactile path from the stairs and a threshold strip at each door.
    for(const x of terminalDoorOffsets)box(0xc9a84f,x,deck+.012,5.3,2.4,.02,.34,e);
  }
  // ---- west glass wall above the airport railroad entrance ----
  {
    const a=to*deg,centre=arcPoint((inner+outer)/2,to),w=groupAt(centre[0],centre[1],-a);w.position.y=base;
    const half=(outer-inner)/2,roofAt=x=>concourseRoofHeight((x+half)/(half*2))-.55;
    const line=[];for(let x=-half;x<=half+.01;x+=half/10)line.push([x,0]);
    wall(T,w,line,deck-.06,p=>roofAt(p[0]),look.hall,[2.2,1.72]);
    wall(T,w,line,-1,deck-.06,look.granite,[2.6,2.6]);
    box(0xe6ebea,0,deck+4.3,.18,half*2,.36,.5,w);
    for(const x of [-2.2,2.3,6.8]){box(0xcdd6d6,x,deck+1.6,.2,3.4,3.2,.3,w);box(0x24404c,x,deck+1.5,.38,3,2.86,.07,w);}
    box(0xf0f3f1,2.3,deck+3.4,1.5,15,.2,3,w);
    lettering(T,w,"서울역  Seoul Station",2.3,deck+9.2,.26,16,2.1);
  }
  // ---- outlet block and its rotunda ----
  {
    const top=30;
    wall(T,g,closed(outletRing),-.6,top,look.outlet,[2.3,1.9]);
    lid(T,g,outletRing,top,look.outletRoof,(x,z)=>[(x+134)/130,1-(z-1429)/82]);
    wall(T,g,closed(outletRing),top,top+.9,look.granite,[3,3]);
    // Shopfront canopy along the terrace and the rooftop station sign seen from the square.
    const shade=new T.Mesh(new T.BoxGeometry(6.8,.42,35.6),new T.MeshStandardMaterial({color:0xdfe4e2,roughness:.7,emissive:0x3a3d3c}));
    shade.position.set(-1.2,deck+6.6,1463.9);shade.castShadow=true;g.add(shade);box(0xb5c0c1,2.05,deck+6.5,1463.9,.24,.7,35.6,g);
    for(let z=1448;z<1482;z+=5.6)post(1.6,z,deck,deck+6.4,.13);
    const outletSign=new T.Group();outletSign.position.set(2.2,deck+6.52,1463.9);outletSign.rotation.y=Math.PI/2;g.add(outletSign);
    lettering(T,outletSign,"LOTTE OUTLETS",0,0,0,11,.58,"#2b4f7a");
    const sign=new T.Group();sign.position.set(-4.4,top+3.9,1475.2);sign.rotation.y=Math.PI/2;g.add(sign);
    box(0x1f4f86,0,0,-.12,13.6,5.2,.24,sign);lettering(T,sign,"서울역",0,.1,.03,11.4,4);
    for(const u of [-5.6,0,5.6])box(0x8b979a,u,-3.25,-.5,.2,1.4,.2,sign);
    for(const [x,z,w,d,h] of [[-123,1441,9,10,3.6],[-124,1476,7,7,4.4],[-29.5,1477.5,6.4,7.5,4.2],[-65,1436,10,5,3]])box(0xc3c7c4,x,top+h/2,z,w,h,d,g);
    // Glass-roofed rotunda: a ring of columns under a shallow cone, open to the terrace.
    const {x:cx,y:cz,radius}=outletRotunda,ringHeight=deck+10.2;
    for(let i=0;i<19;i++){
      const a=(-128+i*10.44)*deg,x=cx+Math.cos(a)*radius,z=cz+Math.sin(a)*radius;
      post(x,z,deck,ringHeight,.2,0xd8dedc);
      const next=(-128+(i+1)*10.44)*deg;
      if(i<18){
        beam(g,[x,ringHeight,z],[cx+Math.cos(next)*radius,ringHeight,cz+Math.sin(next)*radius],.34,0xe4e9e7);
        beam(g,[x,deck+6.4,z],[cx+Math.cos(next)*radius,deck+6.4,cz+Math.sin(next)*radius],.2,0xcfd7d6);
      }
      beam(g,[x,ringHeight,z],[cx-2,ringHeight+3.6,cz+1],.14,0xe4e9e7);
    }
    const cone=new T.Mesh(new T.ConeGeometry(radius+.3,3.7,44,1,true,30*deg,188*deg),look.glass);
    cone.position.set(cx,ringHeight+1.85,cz);g.add(cone);
    const upper=new T.Mesh(new T.CylinderGeometry(radius,radius,3.7,44,1,true,30*deg,188*deg),look.glass);
    upper.position.set(cx,deck+8.3,cz);g.add(upper);
    // Curved canopy over the walk around the rotunda.
    const canopy=new T.Mesh(new T.RingGeometry(radius+.2,radius+7.2,40,1,-70*deg,150*deg),new T.MeshStandardMaterial({color:0xdfe4e2,roughness:.7,side:T.DoubleSide,emissive:0x3a3d3c}));
    canopy.rotation.x=-Math.PI/2;canopy.scale.y=-1;canopy.position.set(cx,deck+6.6,cz);g.add(canopy);
    const o=outletFront,store=groupAt(o.x,o.y,o.angle);store.position.y=base+deck;
    box(0x24404c,0,3.1,-.2,o.w,6.2,.3,store);box(0xdfe4e2,0,6.5,.1,o.w+.6,.6,.9,store);
    for(let u=-o.w/2;u<=o.w/2+.01;u+=3)box(frame,u,3.1,.02,.16,6.2,.2,store);
    lettering(T,store,"LOTTE OUTLETS",0,6.5,.58,12,.9,"#2b4f7a");
  }
  // ---- low wings ----
  {
    wall(T,g,closed(eastWingRing),-.6,12,look.panel,[4.4,4]);lid(T,g,eastWingRing,12,look.seam,(x,z)=>[(x+z*.3)/2.4,z/6]);
    wall(T,g,closed(eastWingRing),12,12.5,look.granite,[3,3]);
    wall(T,g,closed(westWingRing),-.6,17,look.shop,[2.6,2.1]);lid(T,g,westWingRing,17,look.seam,(x,z)=>[z/2.4,x/6]);
    const oval=new T.Mesh(new T.CircleGeometry(1,32),look.skylight);oval.rotation.x=-Math.PI/2;oval.scale.set(3.4,8.6,1);oval.position.set(-166,17.06,1583);g.add(oval);
    const c=plazaCafeFront,cafe=groupAt(c.x,c.y,c.angle);cafe.position.y=base+deck;
    box(0x2d4b55,0,2.1,-.24,c.w,4.2,.3,cafe);box(0xe7ebe8,0,4.5,.2,c.w+.5,.5,1.3,cafe);
    for(let u=-c.w/2;u<=c.w/2+.01;u+=2.3)box(frame,u,2.1,-.04,.12,4.2,.16,cafe);
    box(0x7a5a42,0,.55,.42,5.2,1.1,.7,cafe);box(0xe9dcc3,0,1.13,.42,5.4,.08,.86,cafe);
    lettering(T,cafe,"STARBUCKS",-2.4,4.5,.87,5,.42,"#2e5b46");lettering(T,cafe,"다이소",3.4,4.5,.87,2.6,.42,"#b3352d");
    const arex=groupAt(-189.9,1571,-Math.PI/2);box(0x547580,0,2.1,-1.2,10.6,4.2,2.4,arex);box(steel,0,4.35,-1.2,11.4,.34,3.3,arex);
    lettering(T,arex,"공항철도  AREX",0,3.55,.18,8.5,.79);
  }
  // ---- podium, ground-floor shops and forecourt furniture ----
  {
    const flights=stationApproaches.filter(s=>s.kind!=="deck"&&s.h1===stationRise);
    const landing=(x,y)=>flights.some(s=>{
      const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],len=Math.hypot(dx,dy),t=((x-s.a[0])*dx+(y-s.a[1])*dy)/len;
      return Math.abs(t-len)<1.3&&Math.abs((y-s.a[1])*dx-(x-s.a[0])*dy)/len<s.w/2+.45;
    });
    for(const [i,a] of eastPlazaOutline.entries()){
      const b=eastPlazaOutline[(i+1)%eastPlazaOutline.length];
      if(landing((a[0]+b[0])/2,(a[1]+b[1])/2)&&Math.hypot(b[0]-a[0],b[1]-a[1])<19)continue;
      wall(T,g,[a,b],-.6,deck-.02,look.granite,[2.4,2.4]);
    }
    // Shops under the escalators face the square around the glass rotunda.
    for(const [i,title] of ["태극당","브릭샌드","금옥당"].entries()){
      const shop=groupAt(19.4+i*4.4,1428.5,Math.PI);
      box(0x2f4a52,0,1.7,-.05,4,3.4,.2,shop);box(0xe9dcc3,0,3.72,.12,4.2,.62,.5,shop);
      for(const u of [-1.9,0,1.9])box(frame,u,1.7,.08,.1,3.4,.14,shop);
      lettering(T,shop,title,0,3.72,.39,3,.46,"#4a3a2c");
    }
    const p=forecourtPlanters,depth=(p.maxX-p.minX)/p.steps,foliage=new T.Group();g.add(foliage);
    let seed=5150;const rand=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
    const trees=makeTreeBuilder(T,foliage,{rand,clearance:{meshFits:()=>true,trim:()=>true}});
    for(let i=0;i<p.steps;i++){
      const x=p.minX+depth*(i+.5),top=deck*(1-(i+.35)/p.steps),z=(p.minY+p.maxY)/2,start=foliage.children.length;
      box(0xb7b4aa,x,top/2-.3,z,depth,top+.6,p.maxY-p.minY,g);box(0x6f8558,x,top+.05,z,depth-.5,.1,p.maxY-p.minY-.5,g);
      box(0xcfcbc0,x,top+.02,p.minY+.14,depth,.34,.28,g);box(0xcfcbc0,x,top+.02,p.maxY-.14,depth,.34,.28,g);
      for(const row of [.2,.5,.8]){
        const zz=p.minY+(p.maxY-p.minY)*row+(i%2?1.2:-1.2);
        if((i+Math.round(row*10))%3===0)trees.shrub(x,zz,.7+rand()*.3,"deep");
        else trees.grow(x,zz,{height:2.6+rand()*1.3,spread:1.25,style:"cone",palette:"pine"});
      }
      for(let k=start;k<foliage.children.length;k++)foliage.children[k].position.y+=top;
    }
    trees.grow(31.6,1429.6,{height:6.4,spread:4.2,style:"cloud",palette:"pine"});trees.grow(41.4,1483.6,{height:7,spread:4.6,style:"cloud",palette:"pine"});
    trees.grow(37.6,1486.8,{height:5.6,spread:3.6,style:"round",palette:"olive"});
    // Long timber bench on the terrace and the square's clock column.
    for(const [x,z,w,d] of terraceBenches){box(0x8f8a80,x,deck+.19,z,w-.1,.38,d-.1,g);box(0x8a6a4b,x,deck+.41,z,w,.07,d,g);}
    const clock=groupAt(clockTower.x,clockTower.y);
    cylinder(0xe8ebe8,0,3.3,0,.42,6.6,20,clock);cylinder(0x2456a4,0,5.1,0,.56,1.3,20,clock);cylinder(0xdfe3e0,0,7.3,0,.9,1.5,24,clock);cylinder(0xbcc4c4,0,8.12,0,.98,.14,24,clock);
    for(let k=0;k<4;k++){
      const face=new T.Group();face.rotation.y=k*Math.PI/2;clock.add(face);
      const dial=new T.Mesh(new T.CircleGeometry(.58,28),matte(0xfbfaf4));dial.position.set(0,7.3,.905);face.add(dial);
      box(0x26303a,0,7.46,.92,.05,.34,.02,face);box(0x26303a,.12,7.3,.92,.26,.045,.02,face);
    }
    // Square in front of the old station: memorial statue, light mast, exit pylon and beds.
    const statue=groupAt(plazaStatue.x,plazaStatue.y,Math.PI/2);
    box(0xb9b3a6,0,.2,0,3,.4,3,statue);box(0xc6c0b3,0,1.5,0,2.1,2.2,2.1,statue);box(0xb9b3a6,0,2.7,0,2.4,.22,2.4,statue);
    box(0x3d362c,0,1.6,1.06,1.3,.8,.04,statue);
    const bronze=0x5b4a36;
    cylinder(bronze,0,3.95,0,.42,2.3,12,statue,.72);cylinder(bronze,0,3.2,0,.56,.8,12,statue,.8);
    const head=new T.Mesh(new T.SphereGeometry(.3,14,10),matte(bronze));head.position.set(0,5.42,.02);statue.add(head);
    beam(statue,[.36,4.9,0],[.78,5.75,.2],.17,bronze);beam(statue,[-.36,4.9,0],[-.5,3.95,.16],.17,bronze);box(bronze,.82,5.86,.22,.16,.2,.16,statue);
    const mast=groupAt(plazaMast.x,plazaMast.y);
    cylinder(0xb7bfc0,0,7.6,0,.2,15.2,12,mast,.55);cylinder(0x9aa3a4,0,.3,0,.42,.6,12,mast);cylinder(0x8f9899,0,15.1,0,1.5,.16,20,mast);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const lamp=box(0xf4f1e2,Math.cos(a)*1.5,14.9,Math.sin(a)*1.5,.5,.2,.7,mast);lamp.rotation.y=-a+Math.PI/2;}
    const pylon=groupAt(exitPylon.x,exitPylon.y,Math.PI/2);
    box(0x2d3136,0,2,0,1.25,4,.3,pylon);box(0xf2b632,0,3.62,0,1.25,.76,.32,pylon);
    for(const face of [1,-1]){
      const board=new T.Group();board.position.z=face*.17;board.rotation.y=face>0?0:Math.PI;pylon.add(board);
      lettering(T,board,"1",0,3.62,0,.5,.6,"#22262a");lettering(T,board,"서울역",0,2.7,0,1.05,.42);lettering(T,board,"Seoul Station",0,2.3,0,1.05,.2,"#d9dedc","600");
      for(const [i,[color,line]] of [["#263b96","1"],["#2e9fd8","4"],["#3f8fc9","A"]].entries()){
        const dot=new T.Mesh(new T.CircleGeometry(.17,18),new T.MeshBasicMaterial({color}));dot.position.set(-.36+i*.36,1.72,.005);board.add(dot);
        lettering(T,board,line,-.36+i*.36,1.72,.01,.3,.22);
      }
    }
    for(const [x,z,w,d] of stationBeds){
      box(0xc2bdb1,x,.16,z,w,.32,d,g);box(0x62794f,x,.36,z,w-.4,.1,d-.4,g);
      for(let k=0;k<3;k++)trees.shrub(x+(k-1)*1.4,z+(k%2?1.8:-2.4),.8+rand()*.3,"deep");
      trees.grow(x,z+(d>12?3.4:-3.2),{height:3.4,spread:2,style:"ball",palette:"olive"});
    }
    // Glass rotunda over the escalators of subway exit 1.
    const d=exitDome,dome=groupAt(d.x,d.y),sphere=(d.radius**2+d.height**2)/(2*d.height),drop=sphere-d.height,cap=Math.acos(drop/sphere);
    const shell=new T.Mesh(new T.SphereGeometry(sphere,40,12,0,Math.PI*2,0,cap),look.glass);shell.position.y=-drop+.9;dome.add(shell);
    const node=(angle,level)=>{const polar=cap*level,r=sphere*Math.sin(polar);return [Math.cos(angle)*r,sphere*Math.cos(polar)-drop+.9,Math.sin(angle)*r];};
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8,mid=a+Math.PI/16;
      for(let k=0;k<4;k++){
        const low=1-k/4,high=1-(k+1)/4;
        beam(dome,node(a,low),node(a,high),.13,0xf2f4f2);
        beam(dome,node(a,low),node(a+Math.PI/8,low),.11,0xf2f4f2);
        if(k<3)beam(dome,node(a,low),node(a+Math.PI/8,high),.07,0xe1e7e5);
      }
      if(domeOpening(mid))continue;
      const x=Math.cos(mid)*d.radius,z=Math.sin(mid)*d.radius;
      cylinder(0xd9dfdd,x,.6,z,.17,1.2,10,dome);
      const sill=box(0xbdb9ae,x,.38,z,4.5,.76,.36,dome);sill.rotation.y=Math.PI/2-mid;
    }
    cylinder(0xeef1ef,0,d.height+.75,0,.5,.3,16,dome);
  }
  return g;
}
// Shopping block north of the terrace and the platform sheds south of the concourse.
export function stationFrontage(T,kit,{groupAt,ground},b){
  const {box,matte}=kit,look=finishes(T),g=groupAt(0,0);g.position.y=ground({x:0,y:1480});
  const shed=b.id===170403784,height=shed?13.2:22;
  for(const ring of b.rings){
    wall(T,g,closed(ring),-.6,height,shed?look.panel:look.shop,shed?[5,4.4]:[2.8,2.2]);
    wall(T,g,closed(ring),height,height+.8,look.granite,[3,3]);
  }
  lid(T,g,b.rings[0],height,matte(shed?0x9caaa6:0xa9adab));
  if(!shed||b.rings[0].length<4)return;
  for(let i=0;i<7;i++){
    const x=-117+i*14.3;box(0x879a9d,x,13.42,1628,4.3,.42,139,g);box(0x2f4b57,x,13.66,1628,3.5,.1,137,g);
    box(0xdfe5e3,x+7.1,13.9,1628,9.4,.5,150,g);
  }
}
