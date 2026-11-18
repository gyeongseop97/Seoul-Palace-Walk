import {westSurfaces,westBuildings,palaceRoof,westGround} from "./west-district-layout.js";
import {gradePalaceMeshes,southWorldTerrainHeight,southWorldSurfaceHeight as elevation} from "./gyeongbok-terrain.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {westStreetTrees} from "./west-district-data.js";
import {makePavingMaterial,pavingRepeat} from "./palace-paving.js";
import {standSign} from "./regional-stands.js";

function surfaceShape(T,rings){
  const contour=ring=>ring.map(([x,y])=>new T.Vector2(x-300,225-y));
  const shape=new T.Shape(contour(rings[0]));
  for(const ring of rings.slice(1))shape.holes.push(new T.Path(contour(ring)));
  return shape;
}

function tile(T,color,kind){
  const canvas=document.createElement("canvas");canvas.width=canvas.height=128;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle=color;ctx.fillRect(0,0,128,128);
  if(kind==="windows"||kind==="brick"){
    ctx.fillStyle=kind==="brick"?"#8b7567":"#6f7a79";ctx.fillRect(0,0,128,3);
    ctx.fillStyle="#43575d";ctx.fillRect(21,20,86,72);
    ctx.fillStyle="#677e83";ctx.fillRect(24,23,37,65);
    ctx.fillStyle=color;ctx.fillRect(62,20,3,73);ctx.fillRect(20,48,89,3);
    ctx.fillStyle="#aaa394";ctx.fillRect(17,92,94,5);
  }else if(kind==="crossing"){
    ctx.fillStyle="#e4e0d2";ctx.fillRect(0,0,57,128);
  }else if(kind==="path"||kind==="stone"||kind==="street"){
    for(let row=0;row<4;row++){
      ctx.fillStyle="rgba(65,53,43,.22)";ctx.fillRect(0,row*32,128,1.5);
      for(let x=row%2*32;x<128;x+=64)ctx.fillRect(x,row*32,1.5,32);
    }
  }else if(kind==="tiles"){
    ctx.fillStyle="#5b6664";ctx.fillRect(0,0,15,128);ctx.fillStyle="#222b2c";ctx.fillRect(109,0,19,128);
    ctx.fillStyle="#505b59";ctx.fillRect(0,0,128,4);
  }
  let seed=2850;
  for(let i=0;i<1600;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    ctx.fillStyle=i%2?"rgba(45,40,33,.06)":"rgba(245,239,228,.07)";ctx.fillRect(seed%128,(seed>>>16)%128,1,1);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
  return new T.MeshStandardMaterial({map:texture,roughness:.93,side:T.DoubleSide});
}

export function* buildWestDistrict(T,root,kit,anisotropy){
  const {wx,wz,box,cylinder,shape,matte}=kit;
  const colors={backdrop:"#878973",grove:"#73815c",grass:"#8c9e67",verge:"#a59e8d",road:"#666969",crossing:"#666969",street:"#a49683",path:"#b6aa95",stone:"#b7b0a0"};
  const materials=Object.fromEntries(Object.entries(colors).map(([k,c])=>[k,tile(T,c,k)]));
  // Keep a continuous terrain surface behind the surveyed plots and their foundations.
  const underlay=new T.PlaneGeometry(810,740,102,93);
  underlay.rotateX(-Math.PI/2);
  underlay.translate(wx(-270),0,wz(-330));
  const terrainPoints=underlay.attributes.position;
  for(let i=0;i<terrainPoints.count;i++){
    terrainPoints.setY(i,elevation({x:terrainPoints.getX(i)+300,y:terrainPoints.getZ(i)+225})-1.45);
  }
  underlay.computeVertexNormals();
  const groundSupport=new T.Mesh(underlay,materials.backdrop);
  groundSupport.receiveShadow=true;root.add(groundSupport);
  const ground=[];
  for(const item of westSurfaces){
    const geometry=new T.ShapeGeometry(surfaceShape(T,item.rings)),pos=geometry.attributes.position,uv=geometry.attributes.uv;
    const finish=item.finish??item.kind,angle=item.angle??0,c=Math.cos(angle),s=Math.sin(angle);
    const repeat=item.kind==="crossing"?1.32:pavingRepeat(finish);
    if(!materials[finish]){materials[finish]=makePavingMaterial(T,finish,anisotropy);yield;}
    for(let i=0;i<pos.count;i++){
      const east=pos.getX(i)+(finish==="royal"?603.445:0),south=-pos.getY(i)+(finish==="royal"?628.16:0);
      uv.setXY(i,finish==="royal"?(east*c+south*s)/4+.5:(east*c+south*s)/repeat,(-east*s+south*c)/repeat);
    }
    geometry.rotateX(-Math.PI/2);
    const mesh=new T.Mesh(geometry,materials[finish]);mesh.position.y=item.kind==="backdrop"?-.34:.062;
    mesh.receiveShadow=true;mesh.userData.followTerrain=true;ground.push(mesh);root.add(mesh);
  }
  yield* gradePalaceMeshes(T,ground,southWorldTerrainHeight);
  const walls=[tile(T,"#a69a88","windows"),tile(T,"#b39e8b","windows"),tile(T,"#aa8775","brick"),tile(T,"#afb8b4","windows")];
  const roofFinish=tile(T,"#394443","tiles");
  function shell(b,top,wall,cap){
    const coords=[],uv=[];
    for(const ring of b.rings)for(const [i,[x,y]] of ring.entries()){
      const [xx,yy]=ring[(i+1)%ring.length],dx=xx-x,dy=yy-y;
      const length=Math.hypot(dx,dy),sections=Math.max(1,Math.ceil(length/4));
      for(let j=0;j<sections;j++){
        const t=j/sections,next=(j+1)/sections;
        const a={x:x+t*dx,y:y+t*dy},b={x:x+next*dx,y:y+next*dy};
        const lowA=elevation(a)-1.0,lowB=elevation(b)-1.0;
        for(const [point,h,u] of [[a,lowA,t],[b,lowB,next],[b,top,next],[a,lowA,t],[b,top,next],[a,top,t]]){
          coords.push(wx(point.x),h,wz(point.y));uv.push(u*length/3.1,(h-top)/3.45);
        }
      }
    }
    const geom=new T.BufferGeometry();
    geom.setAttribute("position",new T.Float32BufferAttribute(coords,3));geom.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    geom.computeVertexNormals();const body=new T.Mesh(geom,wall);body.castShadow=body.receiveShadow=true;root.add(body);
    const roof=new T.ShapeGeometry(surfaceShape(T,b.rings));roof.rotateX(-Math.PI/2);
    const mesh=new T.Mesh(roof,matte(cap));mesh.position.y=top;mesh.receiveShadow=true;root.add(mesh);
  }
  function templeRoof(group,w,d,h,rise){
    const vertices=[],uv=[],ridge=w*.28;
    for(let face=0;face<4;face++){
      const horizontal=face<2,side=face%2?1:-1;
      function vertex(t,u){
        const extent=w/2*(1-t)+ridge*t;
        const lift=rise*(.32*t+.68*t*t)+.58*(1-t)**2*Math.abs(u)**4;
        vertices.push(horizontal?u*extent:side*extent,h+lift,horizontal?side*d/2*(1-t):u*d/2*(1-t));
        uv.push(u*(horizontal?w:d)*1.3,t*d*.8);
      }
      for(let row=0;row<6;row++)for(let col=0;col<14;col++){
        const a=row/6,b=(row+1)/6,c=col/7-1,e=(col+1)/7-1;
        for(const [t,u] of [[a,c],[a,e],[b,e],[a,c],[b,e],[b,c]])vertex(t,u);
      }
    }
    const geom=new T.BufferGeometry();geom.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geom.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geom.computeVertexNormals();
    const roof=new T.Mesh(geom,roofFinish);roof.castShadow=roof.receiveShadow=true;group.add(roof);
    box(0x66716b,0,h+rise+.04,0,ridge*2+.38,.2,.27,group);
  }
  function hall(b){
    const {x,y,w,d,angle,base,steps}=palaceRoof(b),gate=b.kind==="gate",main=b.name==="숭정전";
    const group=new T.Group();group.position.set(wx(x),elevation({x,y})+.065,wz(y));group.rotation.y=-angle;root.add(group);
    const h=gate?4.65:main?7.1:4.9;
    if(!gate){
      box(0xb1aba0,0,(base-.55)/2,0,w*.86,base+.55,d*.83,group);
      box(0xc4bdad,0,base,0,w*.89,.19,d*.87,group);
      for(let k=1;k<=steps;k++)box(0xb4b0a4,0,k*base/(2*steps),d*.42+(steps-k+.5)*.38,
        w*.24,k*base/steps,.4,group);
      box(0x75453b,0,base+h*.42,0,w*.73,h*.83,d*.61,group);
    }
    const bays=main||b.name==="태령전"?5:3;
    for(const side of [-1,1])for(let i=0;i<=bays;i++){
      const u=(i/bays-.5)*w*.76;
      cylinder(0xafaa9b,u,base+.16,side*d*.32,.44,.36,8,group);
      cylinder(0x8c493d,u,base+h*.45,side*d*.32,.30,h*.88,12,group);
      box(0x336254,u,base+h*.86,side*d*.32,1.1,.35,.95,group);
      if(i<bays&&!gate){
        const mid=u+w*.38/bays;box(0x50685a,mid,base+h*.45,side*d*.314,w*.70/bays,h*.58,.15,group);
        for(let m=-2;m<=2;m++)box(0x84735a,mid+m*w*.115/bays,base+h*.45,side*d*.321,.09,h*.55,.1,group);
      }
    }
    for(const side of [-1,1]){
      box(0x386657,0,base+h*.90,side*d*.35,w*.88,.5,.48,group);
      box(0x9b5543,0,base+h*.97,side*d*.39,w*.93,.25,.55,group);
    }
    templeRoof(group,w,d,base+h,main?4.7:2.9);
    standSign(T,group,b.name,null,main?4.5:3.0,0,base+h-.48,d*.39+.29,"#243d36","#efe7be",.89);
    if(main){
      for(const sign of [-1,1])for(let i=0;i<12;i++){
        const u=sign*6.55,v=15+i*2.45,px=x+u*Math.cos(angle)-v*Math.sin(angle),py=y+u*Math.sin(angle)+v*Math.cos(angle);
        const low=elevation({x:px,y:py});
        const stone=box(0xa8a595,wx(px),low+.39,wz(py),.54,.78,.26);stone.rotation.y=-angle;
        const foot=box(0x959184,wx(px),low+.075,wz(py),.77,.15,.43);foot.rotation.y=-angle;
      }
    }
  }
  function gallery(b){
    const vertices=[],uv=[];
    const roofLevel=(x,y)=>elevation({x,y})+3.5;
    for(const tri of b.roof??[])for(const [x,y,d] of tri){
      vertices.push(wx(x),roofLevel(x,y)+Math.min(3.6,d)*.53,wz(y));uv.push(x*1.6,y*.56);
    }
    const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const roof=new T.Mesh(geo,roofFinish);
    roof.castShadow=true;root.add(roof);
    for(const [i,[x,y]] of b.rings[0].entries()){
      const [xx,yy]=b.rings[0][(i+1)%b.rings[0].length],length=Math.hypot(xx-x,yy-y);
      if(length<3)continue;
      for(let j=0;j<Math.ceil(length/3.4);j++){
        const t=(j+.5)/Math.ceil(length/3.4),px=x+t*(xx-x),py=y+t*(yy-y),low=elevation({x:px,y:py});
        cylinder(0x854a3b,wx(px),low+1.79,wz(py),.17,3.58,8);
      }
    }
  }
  function museum(b,base){
    shell(b,base+14.2,walls[2],0x78817d);
    const facade=new T.Group();facade.position.set(wx(202.19),base,wz(383.35));facade.rotation.y=Math.PI+.037;
    root.add(facade);
    box(0x807b72,0,7.9,.08,17.7,15.8,.36,facade);
    box(0xafa996,0,3.5,.34,17.85,7.1,.44,facade);
    function arch(cx,bottom,r,straight,z){
      const opening=new T.Shape();opening.moveTo(-r,0);opening.lineTo(r,0);opening.lineTo(r,straight);
      opening.absarc(0,straight,r,0,Math.PI,false);opening.closePath();
      const panel=new T.Mesh(new T.ShapeGeometry(opening),matte(0x394c50));panel.position.set(cx,bottom,z);facade.add(panel);
      for(let i=0;i<=12;i++){
        const angle=i*Math.PI/12,stone=box(0xc7bfb0,cx+Math.cos(angle)*(r+.1),bottom+straight+Math.sin(angle)*(r+.1),z+.04,.28,.34,.17,facade);
        stone.rotation.z=angle;
      }
      for(const sign of [-1,1])box(0xc0b7a6,cx+sign*(r+.13),bottom+straight/2,z+.03,.3,straight,.18,facade);
      box(0xaf9b77,cx,bottom+straight/2,z+.05,.075,straight,.08,facade);
      box(0x968c74,cx,bottom+straight,z+.05,2*r,.1,.08,facade);
    }
    for(const cx of [-5.05,0,5.05])arch(cx,.1,1.78,2.8,.61);
    for(const cx of [-4.8,-1.6,1.6,4.8])arch(cx,9.4,1.17,1.85,.36);
    for(const y of [7.1,8.85,14.9,15.8])box(0xc2b8a6,0,y,.36,18.25,.24,.65,facade);
    standSign(T,facade,"SEOUL MUSEUM OF ART",null,10.9,0,7.9,.35,"#796f60","#f3d38f",.72);
  }
  for(const [i,b] of westBuildings.entries()){
    if(b.kind==="gate"||b.kind==="hall")hall(b);
    else if(b.kind==="gallery")gallery(b);
    else{
      const heights=b.rings[0].map(([x,y])=>elevation({x,y})),base=Math.max(...heights);
      if(b.kind==="sema")museum(b,base);
      else shell(b,base+b.height,walls[b.id%walls.length],0x79807b);
    }
    if(i%6===0)yield;
  }
  let seed=19287;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const trees=makeTreeBuilder(T,root,{rand,clearance:{meshFits:()=>true,trim:()=>true}});
  const places=[...westStreetTrees];
  for(let y=-498;y<-215;y+=14)for(let x=-425;x<-158;x+=15){
    const px=x+rand()*8,py=y+rand()*8;
    if([[0,0],[6,0],[-6,0],[0,6],[0,-6]].every(([a,b])=>westGround(px+a,py+b)==="grove"))places.push([px,py]);
  }
  for(const [x,y] of [[182,316],[182,326],[192,343],[193,357],[212,344],[180,374],[219,374]])if(westGround(x,y)==="grove")places.push([x,y]);
  for(const [i,[x,y]] of places.entries()){
    const trunk=new T.Group();trunk.position.y=elevation({x,y});root.add(trunk);

    // Build in the shared tree kit, then anchor the entire tree at its trunk site.
    const start=root.children.length;
    trees.grow(wx(x),wz(y),{height:6+rand()*4,spread:4+rand()*2,palette:["ginkgo","olive","maple","deep"][i%4],style:"branchy"});
    for(const child of root.children.slice(start))trunk.add(child);
    if(i%4===0)yield;
  }
}
