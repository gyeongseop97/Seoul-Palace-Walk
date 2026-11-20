// Former Seoul Station (1925), now Culture Station Seoul 284. Its massing follows the NGII
// orthophoto: a two-storey brick range with gabled end pavilions, a deep entrance block with
// the great lunette, the domed hall behind it and single-storey annexes at both ends.
import {lettering} from "./station-frontage.js";
import {oldStationCentre} from "./station-survey.js";

function paint(T,width,height,draw){
  const c=document.createElement("canvas");c.width=width;c.height=height;draw(c.getContext("2d"),width,height);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.wrapS=map.wrapT=T.RepeatWrapping;
  return map;
}
export function buildOldStation(T,kit,{groupAt,beam,ground}){
  const {box,cylinder,matte}=kit,g=groupAt(0,0);g.name="문화역서울284";g.position.y=ground({x:32,y:1323});
  const {y:cy}=oldStationCentre;
  let seed=1925;const rnd=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  const brick=new T.MeshStandardMaterial({roughness:.92,side:T.DoubleSide,map:paint(T,128,128,(ctx,n)=>{
    ctx.fillStyle="#b9a595";ctx.fillRect(0,0,n,n);
    for(let row=0;row<16;row++)for(let i=-1;i<5;i++){
      const tone=150+Math.floor(rnd()*26);ctx.fillStyle=`rgb(${tone},${Math.floor(tone*.47)},${Math.floor(tone*.37)})`;
      ctx.fillRect(i*32+(row%2?16:0)+1,row*8+1,30,6);
    }
  })});
  const granite=new T.MeshStandardMaterial({roughness:.88,side:T.DoubleSide,map:paint(T,128,128,(ctx,n)=>{
    ctx.fillStyle="#cdc6b8";ctx.fillRect(0,0,n,n);
    for(let i=0;i<1700;i++){ctx.fillStyle=i%2?"rgba(80,72,62,.10)":"rgba(255,252,244,.14)";ctx.fillRect(rnd()*n,rnd()*n,1.5,1.5);}
    ctx.fillStyle="rgba(96,88,76,.5)";
    for(let row=0;row<4;row++){ctx.fillRect(0,row*32,n,2);for(let x=row%2?32:0;x<n;x+=64)ctx.fillRect(x,row*32,2,32);}
  })});
  const slate=new T.MeshStandardMaterial({roughness:.8,side:T.DoubleSide,map:paint(T,64,64,(ctx,n)=>{
    ctx.fillStyle="#3f4649";ctx.fillRect(0,0,n,n);
    for(let row=0;row<8;row++)for(let x=row%2?4:0;x<n;x+=8){ctx.fillStyle=["#454d50","#3a4144","#4b5356"][Math.floor(rnd()*3)];ctx.fillRect(x,row*8,7,7);}
  })});
  const copper=0x5fa390,copperDark=0x4d8b79,stone=0xd3ccbe,frame=0x4d7a63,pane=0x27363b,wood=0x4b3829;
  // Flat mesh from explicit triangles, with planar texture coordinates.
  function plane(points,material,scale=2.4){
    const xyz=[],uv=[];
    const [a,b]=points,ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],len=Math.hypot(ux,uy,uz)||1;
    for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]]){
      xyz.push(...p);
      const along=((p[0]-a[0])*ux+(p[1]-a[1])*uy+(p[2]-a[2])*uz)/len;
      uv.push(along/scale,(p[1]+Math.hypot(p[0]-a[0]-ux/len*along,p[2]-a[2]-uz/len*along)*.6)/scale);
    }
    const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(xyz,3));
    geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;
  }
  // Wall between two plan points: [x,y] pairs in game coordinates.
  const face=(a,b,low,high,material)=>plane([[a[0],low,a[1]],[b[0],low,b[1]],[b[0],high,b[1]],[a[0],high,a[1]]],material);
  function prism(ring,low,high,material){for(let i=0;i<ring.length;i++)face(ring[i],ring[(i+1)%ring.length],low,high,material);}
  function flat(ring,height,material){
    const shape=new T.Shape(ring.map(([x,y])=>new T.Vector2(x,-y))),geo=new T.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/2.4,pos.getZ(i)/2.4);
    const mesh=new T.Mesh(geo,material);mesh.position.y=height;g.add(mesh);
  }
  const rect=(x0,x1,y0,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
  // Hipped slate roof over a rectangle, ridge along the long (north-south) axis.
  function hipped(x0,x1,y0,y1,eave,rise){
    const mid=(x0+x1)/2,inset=Math.min((y1-y0)/2,(x1-x0)/2),top=eave+rise;
    plane([[x1,eave,y0],[x1,eave,y1],[mid,top,y1-inset],[mid,top,y0+inset]],slate,1.6);
    plane([[x0,eave,y1],[x0,eave,y0],[mid,top,y0+inset],[mid,top,y1-inset]],slate,1.6);
    plane([[x0,eave,y0],[x1,eave,y0],[mid,top,y0+inset]],slate,1.6);plane([[x1,eave,y1],[x0,eave,y1],[mid,top,y1-inset]],slate,1.6);
    box(0x596164,mid,top+.08,(y0+y1)/2,.3,.18,y1-y0-inset*2+.3,g);
  }
  // East-facing window with granite surround and green sashes. `arched` adds a round head.
  function windowEast(x,y,sill,width,height,arched=false){
    box(stone,x+.05,sill+height/2,y,.2,height+.36,width+.36,g);box(pane,x+.12,sill+height/2,y,.1,height,width,g);
    box(frame,x+.19,sill+height/2,y,.06,height,.09,g);box(frame,x+.19,sill+height*.62,y,.06,.08,width,g);
    for(const side of [-1,1])box(frame,x+.19,sill+height/2,y+side*(width/2-.04),.06,height,.08,g);
    box(stone,x+.14,sill-.12,y,.4,.2,width+.6,g);
    if(arched){
      const head=new T.Mesh(new T.CircleGeometry(width/2,18,0,Math.PI),matte(pane));head.rotation.y=Math.PI/2;head.position.set(x+.18,sill+height,y);g.add(head);
      for(let i=0;i<=8;i++){const a=Math.PI*i/8;box(stone,x+.1,sill+height+Math.sin(a)*(width/2+.18),y+Math.cos(a)*(width/2+.18),.22,.3,.34,g).rotation.x=a-Math.PI/2;}
    }
  }
  // Two-storey bay rhythm along an east wall at `x` between y0 and y1.
  function eastRange(x,y0,y1,storeys=2){
    const count=Math.max(1,Math.round((y1-y0)/3.4)),step=(y1-y0)/count;
    for(let i=0;i<count;i++){
      const y=y0+step*(i+.5);
      windowEast(x,y,1.25,1.5,2.7);
      if(storeys>1){windowEast(x,y-.62,6.35,1.02,2.95);windowEast(x,y+.62,6.35,1.02,2.95);}
    }
    box(stone,x+.14,5.25,(y0+y1)/2,.5,.42,y1-y0,g);
    if(storeys>1){
      for(const h of [6.9,7.9,8.9])box(stone,x+.04,h,(y0+y1)/2,.14,.26,y1-y0,g);
      box(stone,x+.26,10.38,(y0+y1)/2,.86,.5,y1-y0+.5,g);box(0xbdb6a8,x+.12,9.98,(y0+y1)/2,.5,.3,y1-y0+.2,g);
    }
  }
  const west=-2.2;
  // ---- two-storey range ----
  prism(rect(west,15.3,1297.2,1350.2),-.3,5.2,granite);prism(rect(west,15.3,1297.2,1350.2),5.2,10.4,brick);
  for(const [y0,y1] of [[1287.6,1297.2],[1350.2,1359.7]]){
    prism(rect(west,18.4,y0,y1),-.3,5.2,granite);prism(rect(west,18.4,y0,y1),5.2,10.9,brick);
    eastRange(18.4,y0+.4,y1-.4);
    // Segmental gable with a round-headed window above the cornice.
    const mid=(y0+y1)/2,half=(y1-y0)/2,gable=[[18.4,10.9,y0],[18.4,10.9,y1]];
    for(let i=0;i<=10;i++){const a=Math.PI*i/10;gable.push([18.4,10.9+Math.sin(a)*3.1,mid+Math.cos(a)*half]);}
    plane(gable,granite);windowEast(18.42,mid,11.05,1.7,.5,true);
    hipped(west,18.4,y0-.3,y1+.3,10.95,2.9);
    for(const side of [-1,1])box(stone,18.5,5.2,mid+side*(half-.3),.34,10.6,.7,g);
  }
  eastRange(15.3,1297.2,1310.5);eastRange(15.3,1336.1,1350.2);
  hipped(west-.4,15.7,1296.9,1350.5,10.6,3.1);
  for(const y of [1301.5,1306,1340.5,1345])box(0x4b5356,13.4,11.9,y,1.5,.7,1.5,g).rotation.z=-.5;
  // ---- entrance block with the great lunette ----
  const y0=1310.5,y1=1336.1,front=30.5,arch=6.7;
  prism(rect(15.3,front,y0,y1),-.3,5.4,granite);prism(rect(15.3,front,y0,y1),5.4,12.6,brick);
  // Granite frontispiece: the wall is built around the arch opening as a fan of quads.
  const ring=[],glass=[];
  for(let i=0;i<=20;i++){
    const a=Math.PI*i/20,c=Math.cos(a),s=Math.sin(a);
    ring.push([[front+.02,7.3+s*arch,cy+c*arch],[front+.02,7.3+Math.min(7.9,s*20+.0)*1,cy+Math.sign(c)*Math.min(9.4,Math.abs(c)*20)]]);
    glass.push([front+.04,7.3+s*(arch-.1),cy+c*(arch-.1)]);
  }
  for(let i=1;i<ring.length;i++)plane([ring[i-1][0],ring[i-1][1],ring[i][1],ring[i][0]],granite);
  plane([[front+.02,-.3,cy+9.4],[front+.02,-.3,cy-9.4],[front+.02,7.3,cy-9.4],[front+.02,7.3,cy+9.4]],granite);
  plane([[front+.04,7.3,cy+arch],...glass.slice().reverse()],new T.MeshStandardMaterial({color:0x3a5560,roughness:.25,metalness:.35,side:T.DoubleSide}));
  for(let i=1;i<10;i++){const a=Math.PI*i/10;beam(g,[front+.1,7.3,cy],[front+.1,7.3+Math.sin(a)*arch,cy+Math.cos(a)*arch],.16,frame);}
  for(const r of [arch*.5,arch])for(let i=0;i<16;i++){
    const a=Math.PI*i/16,b=Math.PI*(i+1)/16;
    beam(g,[front+.12,7.3+Math.sin(a)*r,cy+Math.cos(a)*r],[front+.12,7.3+Math.sin(b)*r,cy+Math.cos(b)*r],r===arch?.5:.16,r===arch?stone:frame);
  }
  box(stone,front+.3,15.5,cy,1.1,.6,19.6,g);box(0xbdb6a8,front+.14,15.05,cy,.6,.34,19.2,g);box(stone,front+.2,7.15,cy,.7,.5,19,g);
  for(const side of [-1,1]){
    // Brick shoulders with banded quoins and the small copper-roofed turrets.
    const y=cy+side*11.1;
    plane([[front+.02,-.3,cy+side*9.4],[front+.02,-.3,cy+side*12.8],[front+.02,5.4,cy+side*12.8],[front+.02,5.4,cy+side*9.4]],granite);
    plane([[front+.02,5.4,cy+side*9.4],[front+.02,5.4,cy+side*12.8],[front+.02,12.6,cy+side*12.8],[front+.02,12.6,cy+side*9.4]],brick);
    for(const h of [6.6,7.8,9,10.2,11.4])box(stone,front+.06,h,y,.14,.3,3.4,g);
    windowEast(front+.03,y,1.3,1.3,2.6);windowEast(front+.03,y,7.3,1.2,2.9);
    box(stone,front-1.4,13.0,y,3.6,.8,3.8,g);box(0xb9ad9c,front-1.4,14.2,y,2.5,1.6,2.5,g);box(stone,front-1.4,15.1,y,2.9,.24,2.9,g);
    for(const dz of [-1,1])box(pane,front-.13,14.2,y+dz*.55,.06,1,.5,g);
    const cap=new T.Mesh(new T.SphereGeometry(1.5,16,8,0,Math.PI*2,0,Math.PI/2),matte(copper));cap.position.set(front-1.4,15.2,y);cap.scale.y=1.05;g.add(cap);
    cylinder(copperDark,front-1.4,16.95,y,.1,.7,8,g);
  }
  // Clock in its granite aedicule at the foot of the lunette.
  box(stone,front+.34,8.4,cy,.5,2.5,2.4,g);box(stone,front+.44,9.75,cy,.7,.24,2.8,g);
  const dial=new T.Mesh(new T.CircleGeometry(.86,32),matte(0xf6efe0));dial.rotation.y=Math.PI/2;dial.position.set(front+.6,8.45,cy);g.add(dial);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;box(0x33302b,front+.62,8.45+Math.cos(a)*.7,cy+Math.sin(a)*.7,.02,.14,.05,g).rotation.x=-a;}
  box(0x33302b,front+.63,8.62,cy-.12,.02,.42,.05,g).rotation.x=.6;box(0x33302b,front+.63,8.56,cy+.2,.02,.6,.04,g).rotation.x=-1.05;
  // Three round-headed doors under an iron and glass canopy.
  for(const dz of [-4.05,0,4.05]){
    box(0x2b2622,front-.06,2.1,cy+dz,.3,4.2,3,g);
    for(const side of [-1,1]){box(wood,front+.1,1.6,cy+dz+side*.72,.1,3.2,1.34,g);box(0x7f8b86,front+.16,2.1,cy+dz+side*.72,.04,1.5,.9,g);}
    const fan=new T.Mesh(new T.CircleGeometry(1.5,18,0,Math.PI),matte(0x3b4d50));fan.rotation.y=Math.PI/2;fan.position.set(front+.12,3.25,cy+dz);g.add(fan);
    for(let i=0;i<=10;i++){const a=Math.PI*i/10;box(stone,front+.12,3.25+Math.sin(a)*1.68,cy+dz+Math.cos(a)*1.68,.3,.34,.56,g).rotation.x=a-Math.PI/2;}
  }
  for(const dz of [-6.2,-2.03,2.03,6.2])box(stone,front+.2,2.55,cy+dz,.5,5.1,.9,g);
  const awning=new T.Mesh(new T.BoxGeometry(3.6,.08,15.4),new T.MeshStandardMaterial({color:0xa9c8c6,roughness:.2,transparent:true,opacity:.42,depthWrite:false}));
  awning.position.set(front+1.9,5.55,cy);awning.rotation.z=-.07;g.add(awning);
  for(const dz of [-7.6,-3.8,0,3.8,7.6]){beam(g,[front+.1,5.7,cy+dz],[front+3.7,5.45,cy+dz],.1,0x23282a);beam(g,[front+.1,4.2,cy+dz],[front+2.6,5.5,cy+dz],.08,0x23282a);}
  beam(g,[front+3.7,5.45,cy-7.7],[front+3.7,5.45,cy+7.7],.12,0x23282a);
  const title=new T.Group();title.position.set(front+3.74,6.25,cy);title.rotation.y=Math.PI/2;g.add(title);
  lettering(T,title,"문화역서울 284",0,0,0,8.6,1.05,"#f7f4ea");
  box(0xbdb6a8,front+1.2,.1,cy,2.6,.2,17,g);box(0xcfc8ba,front+2.9,.05,cy,1,.1,17.8,g);
  // Barrel vault from the lunette back to the domed hall.
  const vault=new T.Mesh(new T.CylinderGeometry(arch+1.1,arch+1.1,front-15.2,24,1,true,0,Math.PI),slate);
  vault.rotation.z=Math.PI/2;vault.position.set((front+15.2)/2,7.3,cy);vault.castShadow=true;g.add(vault);
  flat(rect(15.3,front,y0,y1),12.62,matte(0x8b8478));
  // ---- domed hall ----
  const t0=1.9,t1=15.4,ty0=cy-6.75,ty1=cy+6.75,tx=(t0+t1)/2;
  prism(rect(t0,t1,ty0,ty1),10.4,18.2,brick);
  for(const h of [12.4,13.6,14.8,16,17.2])for(const [x,y,w,d] of [[tx,ty0-.04,13.7,.14],[tx,ty1+.04,13.7,.14],[t0-.04,cy,.14,13.7],[t1+.04,cy,.14,13.7]])box(stone,x,h,y,w,.28,d,g);
  for(const [x,y] of [[t0,ty0],[t0,ty1],[t1,ty0],[t1,ty1]]){box(stone,x,14.7,y,1.5,8.6,1.5,g);box(stone,x,19.5,y,1.1,1.1,1.1,g);cylinder(copperDark,x,20.4,y,.34,.8,8,g,.1);}
  for(const [nx,ny] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const lun=new T.Mesh(new T.CircleGeometry(4.5,24,0,Math.PI),new T.MeshStandardMaterial({color:0x4a6a66,roughness:.3,side:T.DoubleSide}));
    lun.position.set(tx+nx*6.82,12.6,cy+ny*6.82);lun.rotation.y=nx?nx*Math.PI/2:ny>0?0:Math.PI;g.add(lun);
    for(let i=0;i<=12;i++){
      const a=Math.PI*i/12,r=4.75,u=Math.cos(a)*r,h=12.6+Math.sin(a)*r;
      const block=box(stone,tx+nx*6.9+(nx?0:u),h,cy+ny*6.9+(ny?0:u),nx?.3:.62,.62,ny?.3:.62,g);block.rotation[nx?"x":"z"]=(nx?nx:-ny)*(a-Math.PI/2);
    }
    for(let i=1;i<6;i++){const a=Math.PI*i/6;beam(g,[tx+nx*6.86,12.6,cy+ny*6.86],[tx+nx*6.86+(nx?0:Math.cos(a)*4.4),12.6+Math.sin(a)*4.4,cy+ny*6.86+(ny?0:Math.cos(a)*4.4)],.1,frame);}
  }
  box(stone,tx,18.5,cy,14.9,.6,14.9,g);box(0xbdb6a8,tx,18.05,cy,14.2,.34,14.2,g);
  cylinder(stone,tx,19.3,cy,7.3,1,32,g);
  const dome=new T.Mesh(new T.SphereGeometry(7.15,36,14,0,Math.PI*2,0,Math.PI/2),matte(copper));dome.position.set(tx,19.8,cy);dome.scale.y=.92;dome.castShadow=true;g.add(dome);
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8;let last=null;
    for(let k=0;k<=8;k++){const p=Math.PI/2*k/8,point=[tx+Math.cos(a)*Math.cos(p)*7.2,19.8+Math.sin(p)*6.62,cy+Math.sin(a)*Math.cos(p)*7.2];if(last)beam(g,last,point,.13,copperDark);last=point;}
  }
  cylinder(copperDark,tx,26.9,cy,1.25,1.1,16,g);cylinder(copper,tx,27.9,cy,1.05,1.3,12,g);
  const cap=new T.Mesh(new T.SphereGeometry(1.2,16,8,0,Math.PI*2,0,Math.PI/2),matte(copper));cap.position.set(tx,28.5,cy);g.add(cap);
  cylinder(copperDark,tx,30.4,cy,.07,1.6,8,g);
  // ---- single-storey annexes ----
  const north=[[-4.75,1241.9],[7.2,1241.7],[7.4,1254.2],[10.95,1254.3],[10.95,1266.1],[9.2,1266.1],[9.2,1287.6],[-4.75,1287.6]];
  const south=[[-3.4,1359.7],[10.5,1359.7],[10.5,1368],[18.2,1368],[18.2,1375],[10.5,1375],[10.5,1380.1],[-3.4,1380.1]];
  for(const ringOf of [north,south]){prism(ringOf,-.3,1.3,granite);prism(ringOf,1.3,5.6,brick);flat(ringOf,5.62,matte(0xa7a397));prism(ringOf,5.6,6.2,granite);}
  for(const [x,a,b] of [[9.2,1267,1287],[10.95,1255,1265.6],[7.3,1242.4,1253.6],[10.5,1360.2,1367.6]]){
    const count=Math.max(1,Math.round((b-a)/3.6)),step=(b-a)/count;
    for(let i=0;i<count;i++){const y=a+step*(i+.5);if(Math.abs(y-1259)>2.2)windowEast(x,y,1.3,1.4,2.1,true);}
    box(stone,x+.1,5.3,(a+b)/2,.4,.36,b-a+.4,g);
  }
  // Door of the former Railroad Transportation Office.
  box(stone,11.05,2.5,1259,.3,5,4.1,g);box(0x2b2622,11.16,2,1259,.12,4,3.1,g);
  for(const side of [-1,1])box(wood,11.24,1.8,1259+side*.78,.08,3.6,1.46,g);
  const rto=new T.Group();rto.position.set(11.3,4.5,1259);rto.rotation.y=Math.PI/2;g.add(rto);lettering(T,rto,"RTO",0,0,0,2,.6,"#f7f4ea");
  // Porch of the former VIP room.
  for(const dz of [-2.2,2.2])box(stone,18.3,2.8,1371.5+dz,.5,5.6,.8,g);
  box(0x2b2622,18.22,2,1371.5,.1,4,2.6,g);box(wood,18.3,1.6,1371.5,.08,3.2,2.2,g);box(stone,18.4,4.5,1371.5,.6,.5,4.6,g);
  box(0xbdb6a8,19.3,.08,1371.5,2,.16,5.4,g);
  return g;
}
