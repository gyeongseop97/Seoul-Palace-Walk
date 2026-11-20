import {makeTreeBuilder} from "./lowpoly-trees.js";
import {stationFrontage,buildStationFront} from "./station-frontage.js";
import {buildOldStation} from "./culture-station-exterior.js";
import {stationSurfaces,stationBuildings,stationTrees,seoulloDeck,forecourtSurfaces} from "./station-survey.js";
import {southWorldSurfaceHeight as ground,southWorldTerrainHeight,gradePalaceMeshes} from "./gyeongbok-terrain.js";
import {standSign} from "./regional-stands.js";
import {buildStationApproaches} from "./station-approach-world.js";
import {stationRise} from "./station-levels.js";
import {gatePose} from "./station-approach-plan.js";
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
    const mesh=new T.Mesh(geo,surfaces[s.kind]);mesh.position.y=forecourtSurfaces.includes(s)?.062:.046;mesh.receiveShadow=true;mesh.userData.followTerrain=true;root.add(mesh);paving.push(mesh);
    if(++count%16===0)yield;
  }
  yield* gradePalaceMeshes(T,paving,southWorldTerrainHeight);
  const bottom=[383,720,1120][band],top=[720,1120,1800][band];
  const support=new T.PlaneGeometry(1000,top-bottom,32,Math.ceil((top-bottom)/22));support.rotateX(-Math.PI/2);
  support.translate(wx(225),0,wz((top+bottom)/2));
  const pos=support.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setY(i,ground({x:pos.getX(i)+300,y:pos.getZ(i)+225})-(band===2?8:1.6));
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
  function sungnyemun(){
    const g=groupAt(gatePose.x,gatePose.y,gatePose.angle);g.name="숭례문";
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
  const dressed=new Set();
  for(const b of stationBuildings){
    const center=b.rings[0].reduce((p,[x,y],_,a)=>({x:p.x+x/a.length,y:p.y+y/a.length}),{x:0,y:0});
    if(bandOf(center.y)!==band)continue;
    if(b.kind==="gate"){if(!dressed.has(b.id))sungnyemun();}
    else if(b.part){if(b.part==="concourse")buildStationFront(T,kit,{groupAt,beam,ground});}
    else if(b.kind==="stationWing")stationFrontage(T,kit,{groupAt,ground},b);
    else{
      const wall=b.kind==="historic"?brick:b.kind==="terminal"?facades[4]:b.kind==="squareOffice"?facades[5]:facades[Number(b.id)%5||0];
      if(b.kind==="historic")buildOldStation(T,kit,{groupAt,beam,ground});
      else shell(b,wall,0x858984,b.height);
    }
    dressed.add(b.id);
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
  const foliage=new T.Group();root.add(foliage);
  let seed=47637+band;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const trees=makeTreeBuilder(T,foliage,{rand,clearance:{meshFits:()=>true,trim:()=>true}});
  for(const [x,y] of stationTrees)if(bandOf(y)===band){
    const start=foliage.children.length,grade=ground({x,y}),height=5.6+rand()*2.3;
    const palette=rand()<.12?"pine":rand()<.64?"ginkgo":rand()<.5?"amber":"olive";
    trees.grow(wx(x),wz(y),{height,spread:height*.54,style:palette==="pine"?"cloud":rand()<.5?"branchy":"round",palette});
    for(let i=start;i<foliage.children.length;i++)foliage.children[i].position.y+=grade;
    if(++count%3===0)yield;
  }
  if(band===2)return buildStationApproaches(T,root,kit,ground);
}
