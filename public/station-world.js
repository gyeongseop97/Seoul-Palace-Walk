import {stationSurfaces,stationBuildings,stationTrees,seoulloDeck} from "./station-data.js";
import {southWorldSurfaceHeight as ground,southWorldTerrainHeight,gradePalaceMeshes} from "./gyeongbok-terrain.js";
import {standSign} from "./regional-stands.js";
import {buildStationApproaches} from "./station-approach-world.js";
import {stationRise} from "./station-levels.js";
import {terminalPose} from "./rail-station-layout.js";
import {districtTile} from "./district-material.js";

const colors={shared:"#575b5b",stone:"#b6b2a9",path:"#aaa49a",grass:"#83906b",road:"#575b5b",crossing:"#686a68",verge:"#9b9987"};
const stationMaterials=new WeakMap();
function finishes(T){
  if(stationMaterials.has(T))return stationMaterials.get(T);
  const surfaces=Object.fromEntries(Object.entries(colors).map(([kind,color])=>[kind,districtTile(T,color,kind==="stone"?"path":kind)]));
  const facades=["#b5aaa0","#a5ada9","#9e8c80","#b7af9e","#768c93","#ae795d"].map(color=>districtTile(T,color,"windows"));
  const materials={surfaces,facades,brick:districtTile(T,"#a36550","brick")};
  stationMaterials.set(T,materials);return materials;
}
const bandOf=y=>y<720?0:y<1120?1:2;
export function* buildStationBand(T,root,kit,band){
  const {box,cylinder,matte,wx,wz}=kit,{surfaces,facades,brick}=finishes(T);
  function footprint(rings){
    const contour=ring=>ring.map(([x,y])=>new T.Vector2(wx(x),-wz(y)));
    const shape=new T.Shape(contour(rings[0]));
    for(const hole of rings.slice(1))shape.holes.push(new T.Path(contour(hole)));
    const geometry=new T.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
    return geometry;
  }
  const paving=[];
  let count=0;
  for(const s of stationSurfaces){
    // Pieces may straddle a band boundary. Assign each whole piece to one band.
    if(bandOf(s.rings[0][0][1])!==band)continue;
    const geo=footprint(s.rings),{position,uv}=geo.attributes;
    const a=s.angle??0,c=Math.cos(a),k=Math.sin(a),repeat=s.kind==="crossing"?1.32:2.6;
    for(let i=0;i<position.count;i++){
      const x=position.getX(i),z=position.getZ(i);
      uv.setXY(i,(x*c+z*k)/repeat,(-x*k+z*c)/repeat);
    }
    const mesh=new T.Mesh(geo,surfaces[s.kind]);mesh.position.y=.046;mesh.receiveShadow=true;mesh.userData.followTerrain=true;root.add(mesh);paving.push(mesh);
    if(++count%16===0)yield;
  }
  yield* gradePalaceMeshes(T,paving,southWorldTerrainHeight);
  const bottom=[383,720,1120][band],top=[720,1120,1660][band];
  const support=new T.PlaneGeometry(1000,top-bottom,32,Math.ceil((top-bottom)/22));support.rotateX(-Math.PI/2);
  support.translate(wx(225),0,wz((top+bottom)/2));
  const pos=support.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setY(i,ground({x:pos.getX(i)+300,y:pos.getZ(i)+225})-1.6);
  support.computeVertexNormals();root.add(new T.Mesh(support,matte(0x838374)));
  function groupAt(x,y,angle=0){
    const group=new T.Group();group.position.set(wx(x),ground({x,y}),wz(y));group.rotation.y=angle;root.add(group);return group;
  }
  function shell(b,wall,roof,height){
    const r=b.rings[0],ceiling=Math.max(...r.map(([x,y])=>ground({x,y})))+height;
    const xyz=[],tex=[];
    for(const ring of b.rings)for(let i=0;i<ring.length;i++){
      const a=ring[i],z=ring[(i+1)%ring.length],length=Math.hypot(z[0]-a[0],z[1]-a[1]);
      for(const [p,high,u] of [[a,false,0],[z,false,1],[z,true,1],[a,false,0],[z,true,1],[a,true,0]]){
        const h=high?ceiling:ground({x:p[0],y:p[1]})-2.6;
        xyz.push(wx(p[0]),h,wz(p[1]));tex.push(u*length/3.35,(h-ceiling)/3.5);
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(xyz,3));geo.setAttribute("uv",new T.Float32BufferAttribute(tex,2));geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,wall);mesh.receiveShadow=mesh.castShadow=true;root.add(mesh);
    const cover=new T.Mesh(footprint(b.rings),matte(roof));cover.position.y=ceiling;cover.receiveShadow=true;root.add(cover);
  }
  function beam(g,a,b,width,color){
    const u=new T.Vector3(...a),v=new T.Vector3(...b),delta=v.sub(u);
    const mesh=box(color,u.x+delta.x/2,u.y+delta.y/2,u.z+delta.z/2,width,delta.length(),width,g);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  }
  function dome(g,x,y,z,rx,ry,rz,color){
    const mesh=new T.Mesh(new T.SphereGeometry(1,30,13,0,Math.PI*2,0,Math.PI/2),matte(color));
    mesh.position.set(x,y,z);mesh.scale.set(rx,ry,rz);mesh.castShadow=true;g.add(mesh);
  }
  function oldStation(){
    const g=groupAt(16.4,1323);g.name="문화역서울284";
    const stone=0xd4c0a7,bronze=0x537e75,window=0x354a50;
    for(const side of [-1,1]){
      for(let j=0;j<8;j++){
        const z=side*(15+j*5.25);
        box(stone,-2.15,4.45,z,.8,7.4,2.8,g);box(window,-1.68,4.35,z,.23,6.55,2.05,g);
        box(stone,-1.48,4.4,z,.18,6.6,.13,g);
      }
      box(stone,-5.2,9.85,side*38,9.1,.6,46,g);
      cylinder(stone,-9.7,9.92,side*53,7.02,.62,24,g);
      dome(g,-9.7,10.21,side*53,7,5.6,7,bronze);
    }
    // The centre bay projects beyond the brick wings. Its fanlight sits under the copper dome.
    box(stone,2.9,10.65,0,10.2,.68,21.6,g);
    box(stone,7.3,9.85,0,1.4,4.85,18.8,g);
    dome(g,8.08,8.7,0,.22,4.55,6.5,window);
    for(let i=0;i<9;i++){
      const t=Math.PI*i/8;
      beam(g,[8.36,8.7,0],[8.36,8.7+4.45*Math.sin(t),6.38*Math.cos(t)],.14,stone);
    }
    for(const side of [-1,1]){
      for(const z of [7.9,10.1]){box(stone,7.9,5.3,side*z,1.1,10.5,.8,g);box(0xe0cfb6,8.2,10.25,side*z,1.35,.53,1.3,g);}
      for(const z of [20,36,49]){
        const bay=new T.Group();bay.position.set(-.1,0,side*z);g.add(bay);
        box(0xab7160,0,6.5,0,4,13,8.2,bay);
        box(stone,2.1,7.85,0,.6,.5,8.55,bay);box(stone,2.12,12.8,0,.7,.85,8.9,bay);
        for(const dz of [-2.55,0,2.55]){box(window,2.17,9.9,dz,.15,3.4,1.65,bay);box(stone,2.27,10,dz,.12,3.38,.12,bay);}
        const drum=cylinder(stone,0,13.12,0,1,.48,24,bay);
        drum.scale.x=3.2;drum.scale.z=4.6;
        dome(bay,0,13.34,0,3.1,2.2,4.55,bronze);
      }
    }
    for(const z of [-8.2,-4.1,0,4.1,8.2]){
      box(0x53433f,7.52,4.2,z,.45,6.2,2.86,g);box(stone,7.94,3.57,z-1.63,.57,7.1,.47,g);
      dome(g,7.52,7.23,z,.31,1.45,1.43,window);
    }
    box(0x975d4c,-1.4,12.2,0,13,4.8,17.6,g);
    box(stone,-1.4,14.46,0,14.2,.56,18.4,g);
    const drum=cylinder(stone,-1.4,14.27,0,1,.64,32,g);
    drum.scale.x=8.53;drum.scale.z=10.44;
    dome(g,-1.4,14.52,0,8.5,8.8,10.4,0x70988b);
    for(let i=0;i<12;i++){
      const t=i*Math.PI/6,pts=[];
      for(let j=0;j<=8;j++){const h=j*Math.PI/16;pts.push([-1.4+8.56*Math.cos(h)*Math.cos(t),14.5+8.85*Math.sin(h),10.46*Math.cos(h)*Math.sin(t)]);}
      for(let j=1;j<pts.length;j++)beam(g,pts[j-1],pts[j],.12,bronze);
    }
    cylinder(bronze,-1.4,24,0,.62,2.1,12,g);
    dome(g,-1.4,24.92,0,.76,.68,.76,bronze);cylinder(bronze,-1.4,26,0,.10,1.2,10,g);
    const front=new T.Group();front.position.set(8.65,7.65,0);front.rotation.y=Math.PI/2;g.add(front);
    standSign(T,front,"문화역서울284",null,7.8,0,0,0,"#57493e","#fff0cf",1.05);
  }
  function terminal(){
    const g=groupAt(terminalPose.x,terminalPose.y,terminalPose.angle);g.name="서울역";
    g.position.y+=stationRise;
    box(0xa4aaa9,0,-stationRise/2,0,47,stationRise,8,g);
    const silver=0xc1c9c8,glaze=0x597b87;
    const span=47,half=span/2;
    box(glaze,0,9.4,0,span,18.8,8,g);
    for(let row=0;row<5;row++)for(let col=0;col<12;col++){
      const tint=[0x517682,0x70909b,0x688a94,0x436473][(col+row+(col%3)*row)%4];
      box(tint,(col-5.5)*3.84,4+row*2.87,4.04,3.72,2.76,.09,g);
    }
    for(const x of [-14,-7,0,7,14]){
      box(0xc1cbcc,x,2.05,4.26,5.68,4.08,.21,g);
      for(const side of [-1,1]){box(0x314d5c,x+side*1.33,1.91,4.43,2.49,3.65,.10,g);box(0xa6b7b8,x+side*.35,1.25,4.54,.08,.72,.08,g);}
    }
    for(let j=0;j<8;j++){
      const z0=-20+3*j,z1=z0+3,roofAt=z=>20.9+2.4*Math.cos((z+10)*Math.PI/27);
      const cover=box(silver,0,(roofAt(z0)+roofAt(z1))/2,(z0+z1)/2,span+2,.39,3.1,g);
      cover.rotation.x=-Math.atan2(roofAt(z1)-roofAt(z0),3);
    }
    for(let i=-half;i<=half;i+=3.9){
      box(silver,i,9.65,4.08,.19,18.9,.28,g);
      beam(g,[i,20,-11],[i,16.6,8.8],.28,silver);
    }
    for(let h=2;h<19;h+=3.2)box(silver,0,h,4.16,span,.17,.22,g);
    const canopy=box(silver,0,17.6,7.4,span+2,.55,7,g);canopy.rotation.x=.14;
    for(const z of [-7,4.1])for(const x of [-20,-8,8,20])cylinder(0x98a6a5,x,7.9,z,.45,16,10,g);
    standSign(T,g,"서울역","SEOUL STATION",11.6,0,14.2,4.4,"#274965","#ffffff",2.35);
    buildStationApproaches(T,root,kit,ground);
  }
  function sungnyemun(){
    const g=groupAt(340.7,867.1,-.733);g.name="숭례문";
    const stone=0xb0a593,tile=0x3c4143,green=0x4e7363,red=0x975344;
    // A genuine opening through the masonry vault, visible from either side.
    const shape=new T.Shape();shape.moveTo(-22,0);shape.lineTo(-3.65,0);shape.lineTo(-3.65,3.2);
    shape.absarc(0,3.2,3.65,Math.PI,0,true);shape.lineTo(3.65,0);shape.lineTo(22,0);shape.lineTo(20,8.1);shape.lineTo(-20,8.1);shape.closePath();
    const masonry=new T.ExtrudeGeometry(shape,{depth:13,bevelEnabled:false});masonry.translate(0,0,-6.5);
    const wall=new T.Mesh(masonry,matte(stone));wall.castShadow=true;g.add(wall);
    for(const side of [-1,1]){
      box(stone,side*26,2.1,0,10,4.2,7,g);
      for(let i=0;i<6;i++)box(0xb4ab96,side*(22.7+i*1.55),4.55,0,1.05,.9,6.9,g);
    }
    for(const side of [-1,1]){
      for(let course=1;course<10;course++)for(let i=-8;i<=8;i++){
        const x=i*2.35+(course%2)*1.15,y=course*.79;
        if(Math.abs(x)>19||Math.abs(x)<4.1&&y<7.1)continue;
        box((i+course)%3?0xa89c8a:0xbbaf98,x,y,side*6.54,2.28,.73,.14,g);
      }
      for(let i=0;i<15;i++){
        const a=(i+.5)*Math.PI/15,r=4;
        const wedge=box(i%3?0xc3b5a0:0xafa48f,r*Math.cos(a),3.2+r*Math.sin(a),side*6.66,.78,.68,.33,g);
        wedge.rotation.z=a+Math.PI/2;
      }
      for(let j=-9;j<=9;j++)box(0xbdb4a1,j*1.95,8.48,side*6.0,1.55,.74,.78,g);
      box(0x364940,0,14.02,side*5,23,2.7,.16,g);
      for(let j=-11;j<=11;j++)box(0x92725a,j,14.0,side*5.17,.065,2.36,.09,g);
    }
    for(const [width,depth,base,rise] of [[32,15.8,12,3.5],[25.1,12.1,16.8,3.4]]){
      box(green,0,base-.35,0,width*.9,.8,depth*.9,g);
      for(const z of [-1,1])for(let i=-3;i<=3;i++)cylinder(red,i*width*.132,base-1.88,z*depth*.37,.38,3.15,12,g);
      const v=[];
      for(const side of [-1,1])for(let j=0;j<10;j++)for(let i=0;i<24;i++){
        const vertex=(u,t)=>[u*(width*.54-t*3),base+rise*t**1.55+.85*(1-t)**2*Math.abs(u)**4,side*(1-t)*depth*.57];
        const u=i/12-1,n=(i+1)/12-1,t=j/10,h=(j+1)/10;
        for(const p of [vertex(u,t),vertex(n,t),vertex(n,h),vertex(u,t),vertex(n,h),vertex(u,h)])v.push(...p);
      }
      for(const end of [-1,1])for(let i=0;i<16;i++){
        const u=i/8-1,n=(i+1)/8-1;
        v.push(end*(width*.54-3),base+rise,0,end*width*.54,base+.85*Math.abs(u)**4,depth*.57*u,end*width*.54,base+.85*Math.abs(n)**4,depth*.57*n);
      }
      for(const side of [-1,1]){
        box(0x648174,0,base-.15,side*depth*.51,width*1.05,.31,.48,g);
        for(let i=-12;i<=12;i++)box(i%2?0xa7724e:0x466a5c,i*width/24.5,base-.46,side*depth*.46,.37,.58,1.2,g);
      }
      const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(v,3));geo.computeVertexNormals();
      const roof=new T.Mesh(geo,new T.MeshStandardMaterial({color:tile,side:T.DoubleSide}));roof.castShadow=true;g.add(roof);
      box(0x686863,0,base+rise,0,width*.88,.36,.48,g);
    }
    standSign(T,g,"崇禮門",null,3.5,0,14.7,5.1,"#312f27","#e8dcc0",1.05);
  }
  for(const b of stationBuildings){
    const center=b.rings[0].reduce((p,[x,y],_,a)=>({x:p.x+x/a.length,y:p.y+y/a.length}),{x:0,y:0});
    if(bandOf(center.y)!==band)continue;
    if(b.kind==="gate")sungnyemun();
    else{
      const wall=b.kind==="historic"?brick:b.kind==="terminal"?facades[4]:b.kind==="squareOffice"?facades[5]:facades[Number(b.id)%5||0];
      shell(b,wall,b.kind==="historic"?0x495b59:b.kind==="terminal"?0x9aa8a7:0x858984,b.kind==="historic"?9.8:b.height);
      if(b.kind==="historic")oldStation();
      if(b.kind==="terminal")terminal();
    }
    if(++count%6===0)yield;
  }
  if(band===2){
    const planter=0xafb5a9;
    for(let i=1;i<seoulloDeck.length;i++){
      const [ax,ay]=seoulloDeck[i-1],[bx,by]=seoulloDeck[i];
      if((ax+bx)/2< -185||(ax+bx)/2>290)continue;
      const x=(ax+bx)/2,y=(ay+by)/2,l=Math.hypot(bx-ax,by-ay);
      const g=groupAt(x,y,Math.atan2(bx-ax,by-ay));
      box(0x9ca29f,0,14.3,0,9.7,1.3,l+.03,g);
      for(const side of [-1,1])box(0xbec4bb,side*4.78,15.55,0,.13,1.2,l,g);
      if(l>15){cylinder(0xa6aaa3,0,6.5,0,.96,14,12,g);cylinder(planter,-2.8,15.4,0,1.15,.92,16,g);dome(g,-2.8,16,0,1.8,2.2,1.75,0x6d805d);}
    }
  }
  for(const [x,y] of stationTrees)if(bandOf(y)===band){
    const g=groupAt(x,y);cylinder(0x685746,0,2,0,.19,4,7,g);
    dome(g,0,3.2,0,2.1,3.2,2,0x849155);
  }
}
