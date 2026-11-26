import {makeTreeBuilder,treePalettes} from "./lowpoly-trees.js";
import {extensionRibbon} from "./jeongdong-extension-layout.js";
import {makeStreetSurfaceCut} from "./street-surface-cuts.js";
import {makeCrosswalkMarkings} from "./crosswalk-markings.js";
import {
  hwangudanBuildings,hwangudanBounds,hwangudanGround,hwangudanPaths,hwangudanPlantingBeds,hwangudanGate,
  hwangunggu,hwangudanStoneGate,hwangudanHotelPorch,hwangudanDrums,hwangudanRelics,hwangudanPlantings,hwangudanRails,
  registerHwangudanNavigation,seoulPlazaOutline,seoulPlazaLawn,hwangudanGateApron,hwangudanGateApronHeight
} from "./seoul-hwangudan-layout.js";

import {finishStoneCarving} from "./seoul-carved-stone.js";

const hotelColors={
  "plaza-hotel":[0x96918a,0x8e8b81,0x406579,0x5a7887,0xaaa99f],
  "president-hotel":[0xa29181,0xa38a76,0x465460,0x637078,0xc4a68d],
  "president-annex":[0x937e6e,0x9e8171,0x56636b,0x6f7777,0xbb9a86],
  "president-service":[0xa28e7b,0xb7a591,0x535856,0x687477,0xc4b4a2],
  "sogong-office":[0x8c8b81,0xa09e92,0x4b575e,0x66797f,0xafac9c],
  westin:[0x9e9a8b,0x8d8d7f,0x4c6066,0x6f8282,0xc1b8a5],
  "westin-wing":[0x8f877a,0xa79f8e,0x4e5c5d,0x607777,0xc6b8a5],
  "westin-ballroom":[0x9f9586,0xa39b8c,0x4f5d62,0x69787b,0xc1b4a4],
  "lotte-hotel":[0x8b8880,0x888a85,0x3a566a,0x577283,0xaaa799],
  "lotte-office":[0x898d84,0x7b827f,0x3e575f,0x5e787d,0xa5ada3]
};
const palette={
  stone:0xb8b3a6,stoneDark:0x969287,step:0xccc5b3,joint:0x797971,
  red:0x6f3025,lightRed:0x974735,green:0x28493a,celadon:0x476e55,
  ochre:0xb18a4b,blue:0x334f51,roof:0x2c3032,tile:0x3e4142,ridge:0x43403a
};

export function buildHwangudan(T,root,kit){
  const build=assembleHwangudan(T,root,kit);
  let step=build.next();
  while(!step.done)step=build.next();
  return step.value;
}

export function* assembleHwangudan(T,root,kit){
  registerHwangudanNavigation();
  const {wx,wz,box,cylinder,matte}=kit;
  const group=new T.Group();
  group.name="환구단과 소공동";
  root.add(group);
  let seed=901731;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const up=new T.Vector3(0,1,0),axis=new T.Vector3();
  const lighting=new T.MeshStandardMaterial({color:0xdca771,emissive:0xffb364,emissiveIntensity:.05,roughness:.63});
  const lightGold=new T.MeshStandardMaterial({color:0xd7bc7a,emissive:0xffaa4d,emissiveIntensity:.08});

  function localGroup(site,name){
    const node=new T.Group();
    node.name=name;node.position.set(wx(site.x),0,wz(site.y));node.rotation.y=site.angle??0;
    group.add(node);
    return node;
  }
  function block(parent,color,x,z,width,depth,height,base=0,angle=0){
    const node=box(color,x,base+height/2,z,width,height,depth,parent);
    node.rotation.y=angle;
    return node;
  }
  function round(parent,color,x,z,radius,height,base=0,sides=12,top=1){
    return cylinder(color,x,base+height/2,z,radius,height,sides,parent,top);
  }
  function line(parent,color,a,b,radius,sides=6){
    axis.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const object=cylinder(color,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,radius,axis.length(),sides,parent);
    object.quaternion.setFromUnitVectors(up,axis.normalize());
    return object;
  }
  function strip(parent,color,a,b,width,height,base=0){
    return block(parent,color,(a[0]+b[0])/2,(a[1]+b[1])/2,Math.hypot(b[0]-a[0],b[1]-a[1]),width,height,base,
      Math.atan2(a[1]-b[1],b[0]-a[0]));
  }
  function faces(parent,vertices,material){
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geometry.computeVertexNormals();
    const node=new T.Mesh(geometry,material);
    node.receiveShadow=true;
    parent.add(node);
    return node;
  }
  const triangle=(vertices,a,b,c)=>vertices.push(...a,...b,...c);
  function quad(vertices,a,b,c,d){triangle(vertices,a,b,c);triangle(vertices,a,c,d);}
  const plan=points=>new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));
  function planes(parent,footprints,material,level,uvTile=2.6){
    const geometry=new T.ShapeGeometry(footprints);
    const p=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,p.getX(i)/uvTile,p.getY(i)/uvTile);
    geometry.rotateX(-Math.PI/2);
    const object=new T.Mesh(geometry,material);
    object.position.y=level;object.receiveShadow=true;object.userData.followTerrain=true;
    parent.add(object);
    return object;
  }
  const plane=(parent,points,material,level)=>planes(parent,[plan(points)],material,level);
  const localPoints=points=>points.map(p=>[wx(p.x),wz(p.y)]);
  function prism(parent,points,base,height,sideMaterial,topMaterial=sideMaterial){
    const area=points.reduce((sum,[x,y],i)=>{const [nx,ny]=points[(i+1)%points.length];return sum+x*ny-y*nx;},0);
    const ring=area>0?points:[...points].reverse(),vertices=[];
    for(let i=0;i<ring.length;i++){
      const [x,z]=ring[i],[nx,nz]=ring[(i+1)%ring.length];
      quad(vertices,[x,base,z],[x,base+height,z],[nx,base+height,nz],[nx,base,nz]);
    }
    const side=faces(parent,vertices,sideMaterial);
    side.castShadow=true;
    side.userData.followTerrain=true;
    plane(parent,ring,topMaterial,base+height);
  }
  function groundTexture(size,pixel){
    const pixels=new Uint8Array(size*size*4);
    for(let z=0;z<size;z++)for(let x=0;x<size;x++){
      pixels.set(pixel(x,z),(z*size+x)*4);
    }
    const map=new T.DataTexture(pixels,size,size);
    map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
    map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
    return map;
  }
  const granite=groundTexture(96,(x,z)=>{
    const row=Math.floor(z/24),column=Math.floor((x+(row%2)*16)/32);
    const mortar=z%24===0||(x+(row%2)*16)%32===0;
    const tone=(mortar?130:170+(row*13+column*7)%16)+Math.floor(random()*11);
    return [tone+4,tone+2,tone-2,255];
  });
  const turf=groundTexture(128,(x,z)=>{
    const tuft=(Math.imul(x+813,46439)^Math.imul(z+139,642517))&31;
    const variation=Math.sin((x+z)*Math.PI/32)*Math.cos(z*Math.PI/64)*7;
    const tone=215+tuft+variation;
    return [tone,tone,tone,255];
  });
  const paving=new T.MeshStandardMaterial({map:granite,roughness:.98}),grass=matte(0x85945e),asphalt=matte(0x474b4c);
  const plazaGrass=new T.MeshStandardMaterial({map:turf,color:0x748b4c,roughness:1});
  plazaGrass.userData.seasonFoliage="ground";
  const plaza=plan(localPoints(seoulPlazaOutline)),lawn=plan(localPoints(seoulPlazaLawn));
  plaza.holes.push(lawn);
  planes(group,[plaza],paving,.051);
  planes(group,[lawn],plazaGrass,.051,3.55);
  const {minX,maxX,minY,maxY}=hwangudanBounds;
  plane(group,localPoints([{x:612,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:572,y:maxY},{x:532,y:335},{x:minX+20,y:313},{x:592,y:277}]),matte(0x777d6d),-.083);
  for(const {kind,outline} of hwangudanGround){
    if(outline===seoulPlazaOutline)continue;
    const material=kind==="road"?asphalt:kind==="garden"?grass:paving;
    const height=kind==="road"?.025:kind==="garden"?.059:.046;
    plane(group,localPoints(outline),material,height);
  }
  const roads=hwangudanGround.filter(({kind})=>kind==="road").map(({outline})=>outline);
  const pavedAreas=hwangudanGround.filter(({kind})=>kind==="paving").map(({outline})=>outline);
  const crossingMarkings=makeCrosswalkMarkings(T,roads);
  const crossingApproaches=makeStreetSurfaceCut(T,[...roads,...pavedAreas]);
  const mapShapes=parts=>parts.map(piece=>plan(localPoints(piece)));
  const walkFootprints=[],coveredWalks=[];
  for(const {name,width,points,kind} of hwangudanPaths){
    if(name.startsWith("서울광장 동쪽"))continue;
    const outline=extensionRibbon(points,width/2);
    if(kind==="crossing"){
      const {paint,tactile}=crossingMarkings(points[0],points[1],width);
      planes(group,mapShapes(crossingApproaches(outline)),paving,.057);
      planes(group,mapShapes(paint),matte(0xe3ded0),.034);
      planes(group,mapShapes(tactile),matte(0xbba05a),.069);
      continue;
    }
    const cut=makeStreetSurfaceCut(T,coveredWalks);
    walkFootprints.push(...mapShapes(cut(outline)));
    coveredWalks.push(outline);
  }
  planes(group,walkFootprints,paving,.064);
  for(const {outline} of hwangudanPlantingBeds){
    prism(group,localPoints(outline),.043,.28,matte(palette.stoneDark),matte(0x77844d));
  }
  yield;

  const instanceBox=new T.BoxGeometry(1,1,1),sample=new T.Object3D();
  function facadeDetail(entries,material,parent){
    if(!entries.length)return;
    const node=new T.InstancedMesh(instanceBox,material,entries.length);
    node.receiveShadow=true;
    node.userData.streamStatic=true;node.userData.streamDetail=true;
    entries.forEach(([x,y,z,width,height,depth,angle],index)=>{
      sample.position.set(x,y,z);sample.rotation.y=angle;sample.scale.set(width,height,depth);
      sample.updateMatrix();node.setMatrixAt(index,sample.matrix);
    });
    parent.add(node);
  }
  function sign(parent,caption,x,y,z,width,height,{color="#ede4c4",background="#432e22",angle=0}={}){
    const canvas=document.createElement("canvas");
    canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    ctx.fillStyle=background;ctx.fillRect(0,0,512,128);
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(6,6,500,116);
    ctx.fillStyle=color;ctx.font="bold 67px serif";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(caption,256,66,470);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const node=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,side:T.DoubleSide}));
    node.position.set(x,y,z);node.rotation.y=angle;parent.add(node);
  }
  const captions={
    "plaza-hotel":["THE PLAZA",576,85,340.2,Math.PI],
    "president-hotel":["PRESIDENT HOTEL",684,86,244.1,-2.2],
    westin:["THE WESTIN JOSUN SEOUL",744.4,6.4,361.3,Math.PI],
    "lotte-hotel":["LOTTE HOTEL",798,144,271.3,Math.PI]
  };
  function tower(spec){
    const {id,outline,height,levels}=spec,[baseTone,wallTone,blue,lightBlue,bandTone]=hotelColors[id];
    const towerGroup=new T.Group();
    towerGroup.name=spec.name||id;group.add(towerGroup);
    const border=localPoints(outline);
    const center=border.reduce(([x,z],[nx,nz])=>[x+nx/border.length,z+nz/border.length],[0,0]);
    towerGroup.userData.terrainAnchor={x:center[0]-wx(0),y:center[1]-wz(0)};
    const inset=id==="westin"?.84:id==="plaza-hotel"?.82:id==="lotte-hotel"?.76:levels>3?.91:.96;
    const topRing=border.map(([x,z])=>[center[0]+(x-center[0])*inset,center[1]+(z-center[1])*inset]);
    const podium=Math.min(height*.37,levels>4?6.6:3.3);
    prism(towerGroup,border,-1.20,podium+1.25,matte(baseTone));
    prism(towerGroup,topRing,podium+.05,height-podium,matte(wallTone));
    prism(towerGroup,topRing,height+.05,.36,matte(bandTone));
    const windows=[[],[],[]],trim=[];
    for(const [ring,floors,bottom,top] of [[border,1,.7,podium-.52],[topRing,Math.max(1,levels-1),podium+.25,height-.57]]){
      const winding=ring.reduce((sum,[x,z],i)=>{const [nx,nz]=ring[(i+1)%ring.length];return sum+x*nz-z*nx;},0);
      const outward=Math.sign(winding);
      for(let edge=0;edge<ring.length;edge++){
        const [x,z]=ring[edge],[nx,nz]=ring[(edge+1)%ring.length];
        const dx=nx-x,dz=nz-z,length=Math.hypot(dx,dz);
        if(length<4.5)continue;
        const ex=outward*dz/length,ez=-outward*dx/length;
        const angle=Math.atan2(-dz,dx),columns=Math.max(1,Math.round(length/(floors===1?4.8:3.1)));
        const pitch=(top-bottom)/floors,cell=length/columns;
        for(let floor=0;floor<floors;floor++){
          const y=bottom+pitch*(floor+.51);
          if(id!=="lotte-office")trim.push([(x+nx)/2+ex*.076,y-pitch*.43,(z+nz)/2+ez*.076,length,.17,.18,angle]);
          for(let i=0;i<columns;i++){
            const t=(i+.5)/columns;
            const material=random()<.1?2:random()<.37?1:0;
            windows[material].push([x+dx*t+ex*.07,y,z+dz*t+ez*.07,cell*(id==="westin"?.89:.73),pitch*.68,.13,angle]);
          }
        }
      }
    }
    facadeDetail(windows[0],matte(blue),towerGroup);facadeDetail(windows[1],matte(lightBlue),towerGroup);
    facadeDetail(windows[2],lighting,towerGroup);facadeDetail(trim,matte(bandTone),towerGroup);
    if(levels>4)block(towerGroup,baseTone,center[0],center[1],8.6,5.2,1.1,height+.35);
    if(captions[id]){
      const [caption,x,y,z,angle]=captions[id];
      sign(towerGroup,caption,wx(x),y,wz(z),id==="westin"?11:13,id==="westin"?1.05:1.65,{angle,background:"#495350"});
    }
  }
  for(const building of hwangudanBuildings){
    tower(building);
    yield;
  }

  function sampleRing(ring,offset){
    const index=Math.floor(offset),a=ring[index%ring.length],b=ring[(index+1)%ring.length],t=offset-index;
    return a.map((coordinate,i)=>coordinate+(b[i]-coordinate)*t);
  }
  function tiledRoof(parent,rings,tiles){
    const vertices=[],sides=rings[0].length;
    const material=new T.MeshStandardMaterial({color:palette.roof,roughness:.89,side:T.DoubleSide});
    for(let row=1;row<rings.length;row++){
      const outer=rings[row-1],inner=rings[row];
      for(let i=0;i<sides;i++){
        const next=(i+1)%sides;
        quad(vertices,outer[i],inner[i],inner[next],outer[next]);
      }
    }
    faces(parent,vertices,material).castShadow=true;
    for(let side=0;side<sides;side++){
      const count=Array.isArray(tiles)?tiles[side]:tiles;
      for(let i=0;i<count;i++){
        const u=side+(i+.48)/count;
        let before;
        for(const ring of rings){
          const p=sampleRing(ring,u);p[1]+=.03;
          if(before)line(parent,i%4===0?palette.ridge:palette.tile,before,p,.031,5);
          before=p;
        }
      }
      const first=rings[0],a=[...first[side]],b=[...first[(side+1)%sides]];
      a[1]+=.01;b[1]+=.01;
      line(parent,palette.ridge,a,b,.083);
      for(let r=1;r<rings.length;r++)line(parent,palette.ridge,rings[r-1][side],rings[r][side],.066);
    }
  }

  const hipRoofRing=(width,depth,height,tip)=>[
    [-width,height+tip,-depth],[-width*.8,height,-depth],[width*.8,height,-depth],[width,height+tip,-depth],
    [width,height+tip,depth],[width*.8,height,depth],[-width*.8,height,depth],[-width,height+tip,depth]
  ];
  function woodenGate(){
    const node=localGroup(hwangudanGate,"환구단 정문");
    const {halfWidth,rampEnd,end:apronEnd}=hwangudanGateApron;
    const levels=[[rampEnd,.05],[2.5,.38],[-2.5,.38],[-rampEnd,.05]];
    const vertices=[];
    for(let i=1;i<levels.length;i++){
      const [az,ah]=levels[i-1],[bz,bh]=levels[i];
      quad(vertices,[-halfWidth,ah,az],[halfWidth,ah,az],[halfWidth,bh,bz],[-halfWidth,bh,bz]);
    }
    for(const [start,end] of [[apronEnd,rampEnd],[-rampEnd,-apronEnd]]){
      const sample=(x,z)=>[x,hwangudanGateApronHeight(x,z),z];
      for(let i=0;i<4;i++){
        const a=start+(end-start)*i/4,b=start+(end-start)*(i+1)/4;
        for(let j=0;j<8;j++){
          const left=halfWidth*(j/4-1),right=halfWidth*((j+1)/4-1);
          quad(vertices,sample(left,a),sample(right,a),sample(right,b),sample(left,b));
        }
      }
    }
    faces(node,vertices,matte(palette.stone));
    for(const side of [-1,1]){
      for(let i=0;i<3;i++){
        const z=side*(4.79-i*.82);
        block(node,palette.step,-1.15,z,10.76,.77,.107*(i+1),.055);
      }
    }
    // The outer bays have wooden side rails while the middle stays open.
    for(const x of [-5.72,5.72]){
      block(node,palette.red,x,0,.16,3.68,.14,.94);
      block(node,palette.red,x,0,.18,3.68,.17,1.54);
    }
    for(const z of [-1.85,1.85]){
      for(const x of [-5.72,-2.68,2.68,5.72]){
        block(node,palette.stone,x,z,.72,.72,.2,.38);
        round(node,palette.red,x,z,.25,2.68,.58,12,.86);
        for(const [height,width,depth,color] of [[2.87,.58,.49,palette.green],[3.02,.83,.58,palette.celadon],
          [3.16,1.02,.69,palette.green],[3.29,1.16,.83,palette.ochre]]){
          block(node,color,x,z,width,depth,.14,height);
        }
      }
      block(node,palette.red,0,z,12.2,.44,.27,3.22);
      block(node,palette.green,0,z,12.35,.49,.22,3.43);
      block(node,palette.celadon,0,z,12.46,.61,.16,3.61);
      for(let x=-5.85;x<6;x+=.58)block(node,palette.ochre,x,z*1.17,.28,.13,.077,3.49);
    }
    for(const x of [-5.72,5.72]){
      block(node,palette.red,x,0,.44,4.1,.21,3.29);
      block(node,palette.green,x,0,.54,4.27,.22,3.47);
    }
    const ring=hipRoofRing;
    tiledRoof(node,[ring(6.91,2.91,3.63,.22),ring(6.54,2.12,3.96,.12),ring(5.9,1.28,4.46,.09),
      ring(5.08,.55,5.01,.045),ring(4.54,.06,5.3,.02)],[4,32,4,12,4,32,4,12]);
    line(node,palette.ridge,[-4.72,5.36,0],[4.72,5.36,0],.14,8);
    for(const x of [-4.72,4.72])round(node,palette.ridge,x,0,.17,.27,5.35,7,.65);
  }

  const oct=(radius,height)=>Array.from({length:8},(_,i)=>{
    const angle=(i+.5)*Math.PI/4;
    return [Math.cos(angle)*radius,height,Math.sin(angle)*radius];
  });
  function octagonShrine(){
    const node=localGroup(hwangunggu,"황궁우");
    const slabs=[[8.48,.12,.32],[7.96,.44,.39],[7.47,.83,.45],[6.86,1.28,.17]];
    for(const [radius,base,height] of slabs)prism(node,oct(radius,0).map(([x,,z])=>[x,z]),base,height,
      matte(palette.stone),matte(palette.step));
    const corners=oct(7.51,1.28);
    for(let side=0;side<8;side++){
      const a=corners[side],b=corners[(side+1)%8];
      block(node,palette.stone,a[0],a[2],.4,.4,1.05,1.17);
      round(node,palette.step,a[0],a[2],.32,.21,2.15,8,.75);
      if(side===1){
        for(let i=0;i<6;i++)block(node,palette.step,0,7.56-i*.245,2.1,.31,.23*(i+1),.069);
        continue;
      }
      for(const y of [1.36,1.93])strip(node,palette.step,[a[0],a[2]],[b[0],b[2]],.2,.20,y);
      for(let i=1;i<5;i++){
        const x=a[0]+(b[0]-a[0])*i/5,z=a[2]+(b[2]-a[2])*i/5;
        round(node,palette.stone,x,z,.11,.62,1.45,8);
      }
    }
    const tiers=[
      {base:1.45,wall:5.4,eave:6.99,beams:4.45,crown:6.88,tiles:11},
      {base:5.54,wall:3.86,eave:5.28,beams:7.36,crown:9.21,tiles:9},
      {base:8.43,wall:2.65,eave:4.06,beams:10.38,crown:13.85,tiles:7}
    ];
    for(const {base,wall,eave,beams,crown,tiles} of tiers){
      const posts=oct(wall,0),edges=oct(wall*.88,0);
      prism(node,edges.map(([x,,z])=>[x,z]),base,beams-base,matte(palette.green));
      for(let side=0;side<8;side++){
        const a=posts[side],b=posts[(side+1)%8];
        const [ax,,az]=a,[bx,,bz]=b;
        round(node,palette.red,ax,az,base<2?.24:.16,beams-base+.15,base,10,.88);
        strip(node,palette.red,[ax,az],[bx,bz],.23,.22,base);
        strip(node,palette.celadon,[ax,az],[bx,bz],.4,.24,beams-.38);
        strip(node,palette.green,[ax,az],[bx,bz],.48,.24,beams-.16);
        strip(node,palette.ochre,[ax,az],[bx,bz],.5,.076,beams+.075);
        const angle=Math.atan2(az-bz,bx-ax);
        for(let i=1;i<8;i++){
          const t=i/8,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
          block(node,i%2?palette.blue:palette.ochre,x,z,.22,.57,.105,beams-.27,angle);
          if(base>=2)continue;
          block(node,i%3?palette.celadon:palette.lightRed,x*.991,z*.991,.106,.084,1.89,base+.3,angle);
        }
        if(base<2)for(const y of [base+.49,base+1.03,base+1.57,base+2.13]){
          strip(node,palette.celadon,[ax*.99,az*.99],[bx*.99,bz*.99],.09,.081,y);
        }
      }
      const ridge=(radius,height,tip)=>oct(radius,height+tip);
      tiledRoof(node,[ridge(eave,beams+.1,.18),ridge(eave*.83,beams+.43,.06),
        ridge(eave*.63,beams+.88,.025),ridge(eave*.38,beams+(crown-beams)*.66,.02),
        ridge(base>8?.48:eave*.12,crown,0)],tiles);
    }
    round(node,0x9c7336,0,0,.36,.17,13.84,12,.7);
    round(node,0xc59c4d,0,0,.26,.38,13.96,10,.26);
    const finial=new T.Mesh(new T.SphereGeometry(.18,12,8),matte(0xbb8c42));
    finial.position.y=14.38;node.add(finial);
    sign(node,"宇穹皇",0,4.05,5.18,1.86,.47,{color:"#e1c578",background:"#433025"});
  }

  function archedGate(){
    const node=localGroup(hwangudanStoneGate,"환구단 삼문");
    const bottom=.105,width=hwangudanStoneGate.width,archLevel=.34;
    const structure=new T.Group();structure.position.y=archLevel;node.add(structure);
    block(node,palette.step,0,0,10.8,1.56,.36,.062);
    for(const side of [-1,1])for(let i=0;i<3;i++){
      block(node,palette.stone,0,side*(1.86-i*.46),10.8,.46,.09*(i+1),.062);
    }
    const piers=[[-5.19,1.27],[-2.02,.7],[2.02,.7],[5.19,1.27]];
    const arches=[[-3.62,1.2,1.72],[0,1.67,1.83],[3.62,1.2,1.72]];
    for(const [x,w] of piers){
      block(structure,palette.stone,x,0,w,1.48,.38,bottom);
      for(let row=0;row<6;row++)block(structure,row%2?0x88847d:0x999287,x,0,w-.013,1.23,.275,.48+row*.288);
    }
    const vertices=[],segments=16;
    for(const [x,r,spring] of arches){
      for(let i=0;i<segments;i++){
        const a=i*Math.PI/segments,b=(i+1)*Math.PI/segments;
        const ax=x+r*Math.cos(a),bx=x+r*Math.cos(b),ay=spring+r*.54*Math.sin(a),by=spring+r*.54*Math.sin(b);
        for(const z of [-.61,.61]){
          if(z>0)quad(vertices,[bx,by,z],[ax,ay,z],[ax,3.08,z],[bx,3.08,z]);
          else quad(vertices,[ax,ay,z],[bx,by,z],[bx,3.08,z],[ax,3.08,z]);
          line(structure,palette.step,[ax,ay,z*1.07],[bx,by,z*1.07],.088);
        }
        quad(vertices,[ax,ay,-.61],[bx,by,-.61],[bx,by,.61],[ax,ay,.61]);
      }
    }
    faces(structure,vertices,matte(0x8e8a7e)).castShadow=true;
    block(structure,palette.stone,0,0,width,1.49,.26,2.94);
    block(structure,palette.stoneDark,0,0,width+.3,1.65,.15,3.2);
    for(const z of [-.62,.62])for(let i=0;i<22;i++){
      block(structure,i%3?0x928e84:0x857d71,-5.5+i*.51,z,.49,.043,.16,2.75+(i%2)*.16);
    }
    const ring=hipRoofRing;
    tiledRoof(structure,[ring(6.18,1.01,3.32,.14),ring(5.96,.70,3.51,.08),ring(5.64,.33,3.76,.038),
      ring(5.26,.052,4.03,.014)],[2,26,2,4,2,26,2,4]);
    line(structure,palette.ridge,[-5.37,4.045,0],[5.37,4.045,0],.115,8);
    for(const side of [-1,1]){
      round(structure,palette.ridge,side*5.37,0,.13,.22,4.043,8,.53);
    }
    batchLocal(structure);
  }

  function artefacts(){
    const drumBody=new T.SphereGeometry(.8,22,10),rim=new T.TorusGeometry(.656,.052,6,22);
    const stud=new T.SphereGeometry(.043,6,5);
    for(const {x,y} of hwangudanDrums){
      const node=localGroup({x,y,angle:.414},"환구단 석고");
      block(node,palette.stoneDark,0,0,1.88,1.5,.31,.065);
      block(node,palette.stone,0,0,1.49,1.14,.23,.375);
      for(const z of [-.27,.27]){
        const shaft=cylinder(palette.stone,0,1.36,z,.77,.44,20,node,.96);
        shaft.rotation.x=Math.PI/2;
      }
      const body=new T.Mesh(drumBody,matte(palette.stone));
      body.position.y=1.35;body.scale.z=.55;node.add(body);
      for(const side of [-1,1]){
        const border=new T.Mesh(rim,matte(palette.stoneDark));
        border.position.set(0,1.36,.513*side);node.add(border);
        for(let i=0;i<16;i++){
          const theta=i*Math.PI/8;
          const rivet=new T.Mesh(stud,matte(palette.step));
          rivet.position.set(Math.cos(theta)*.643,1.36+Math.sin(theta)*.643,.55*side);
          node.add(rivet);
        }
        const curl=Array.from({length:12},(_,i)=>{
          const theta=(i/11)*4.8+.25,r=.43-i*.022;
          return [Math.cos(theta)*r,1.36+Math.sin(theta)*r,.541*side];
        });
        for(let i=1;i<curl.length;i++)line(node,palette.stoneDark,curl[i-1],curl[i],.044);
      }
      finishStoneCarving(T,node);
    }
    for(const {x,y} of hwangudanRelics){
      const node=localGroup({x,y,angle:-.24},"환구단 석조 부재");
      block(node,palette.stoneDark,0,0,.9,.88,.17,.067);
      block(node,palette.stone,0,0,.56,.64,.59,.23);
      round(node,palette.step,0,0,.35,.18,.82,7,.77);
    }
  }
  woodenGate();
  yield;
  octagonShrine();
  yield;
  archedGate();
  yield;
  artefacts();
  yield;

  for(const [[ax,ay],[bx,by]] of hwangudanRails){
    const a=[wx(ax),wz(ay)],b=[wx(bx),wz(by)],length=Math.hypot(bx-ax,by-ay);
    const count=Math.ceil(length/1.46);
    for(let i=0;i<=count;i++)block(group,0x534c40,a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count,.098,.098,.86,.064);
    for(const h of [.48,.82]){
      const rail=strip(group,0x534c40,a,b,.07,.068,h);
      rail.userData.followTerrain=true;rail.userData.sharedTerrainGeometry=true;
    }
  }
  function batchLocal(parent){
    const entries=new Map();
    for(const mesh of parent.children){
      if(!mesh.isMesh||mesh.isInstancedMesh||mesh.userData.followTerrain||!mesh.material?.isMeshStandardMaterial||mesh.material.map)continue;
      if(mesh.material===lighting||mesh.material===lightGold)continue;
      const key=[mesh.geometry.uuid,mesh.material.uuid,mesh.castShadow,mesh.receiveShadow].join("/");
      if(!entries.has(key))entries.set(key,[]);
      entries.get(key).push(mesh);
    }
    for(const parts of entries.values()){
      if(parts.length<3)continue;
      const [first]=parts,instance=new T.InstancedMesh(first.geometry,first.material,parts.length);
      instance.castShadow=first.castShadow;instance.receiveShadow=first.receiveShadow;
      parts.forEach((mesh,index)=>{mesh.updateMatrix();instance.setMatrixAt(index,mesh.matrix);});
      instance.computeBoundingSphere();
      parent.remove(...parts);parent.add(instance);
    }
  }
  const treeGroups=[new T.Group(),new T.Group(),new T.Group()];
  group.add(...treeGroups);
  const clearance={meshFits:()=>true,trim:()=>true};
  const trees=treeGroups.map(node=>makeTreeBuilder(T,node,{rand:random,clearance}));
  for(const [x,y,height,kind] of hwangudanPlantings){
    const tree=trees[x<628?0:x<694?1:2];
    tree.grow(wx(x),wz(y),{height,terrainAnchor:{x,y},palette:treePalettes[kind],
      style:kind==="pine"?"cloud":kind==="ginkgo"?"column":"branchy"});
  }
  yield;
  const lamps=[[650.4,291.9],[667.5,302.5],[685.5,305.7],[699.9,320.9],[713.9,325],[727.9,324.9],[702.1,340.3],[723.8,339.2]];
  for(const [x,y] of lamps){
    round(group,0x564c38,wx(x),wz(y),.14,.42,.065,8);
    const lamp=round(group,0x564c38,wx(x),wz(y),.12,.13,.48,8);
    lamp.material=lightGold;
    round(group,0x5d5039,wx(x),wz(y),.16,.077,.6,8,.48);
  }
  const hotelPorch=localGroup(hwangudanHotelPorch,"웨스틴 조선 서울 차량 진입부");
  for(const z of [-3.8,3.8])for(const x of [-3.6,3.6])round(hotelPorch,0x968675,x,z,.24,4.2,.064,8);
  block(hotelPorch,0x7a796e,0,0,8.6,9.3,.45,4.14);
  block(hotelPorch,0x99937e,0,0,9,9.7,.19,4.57);
  sign(hotelPorch,"THE WESTIN JOSUN",0,4.39,4.81,7.6,.46,{color:"#eee2c2",background:"#575449"});
  for(const part of group.children)if(part.isGroup&&!treeGroups.includes(part))batchLocal(part);
  batchLocal(group);

  return {update(night){
    const amount=typeof night==="number"?T.MathUtils.clamp(night,0,1):Number(Boolean(night));
    lighting.emissiveIntensity=.05+amount*.54;
    lightGold.emissiveIntensity=.08+amount*.83;
  }};
}
