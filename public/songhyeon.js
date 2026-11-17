import {coverRibbon,exposedSurface} from "./bukchon-surfaces.js";
import {bukchonSurfaceGrade} from "./bukchon-layout.js";
import {sampleMeshHeight} from "./gyeongbok-terrain.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {standSign} from "./regional-stands.js";
import {inSonghyeon,songhyeonBeds,songhyeonBenches,songhyeonGrade,songhyeonLawns,
  songhyeonOutline,songhyeonPaths,songhyeonTrees,songhyeonWalls} from "./songhyeon-layout.js";

const lawn=0x8a9d58,land=0x7e8d54,earth=0x758049;
const stone=0x9a9589,brown=0x765849;
const size=128;

function materialMap(T,pixel){
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,color=pixel(x,y);
    data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=255;
  }
  const map=new T.DataTexture(data,size,size);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;
  map.needsUpdate=true;
  return new T.MeshStandardMaterial({map,roughness:.94});
}
function contains(x,y,outline){
  let hit=false;
  for(let i=0,j=outline.length-1;i<outline.length;j=i++){
    const a=outline[i],b=outline[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
  }
  return hit;
}

export function* buildSonghyeon(T,parent,{wx,wz,box,matte}){
  const root=new T.Group();root.name="열린송현녹지광장";parent.add(root);
  const at=(x,y,height=0)=>[wx(x),songhyeonGrade(x,y)+height,wz(y)];
  let seed=3610791;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const pathSurface=materialMap(T,(x,y)=>{
    const row=y>>4,col=x>>4,joint=(x%16<1||y%16<1)?-31:0;
    const tone=(row*23+col*43+row*col*31)%22-11;
    const grit=(x*13+y*79+x*y)%19-9;
    const inlay=(col+row*5)%23===4?28:0;
    const shade=tone+joint+grit+inlay;
    return [145+shade,144+shade,134+shade];
  });
  const grass=materialMap(T,(x,y)=>{
    const grassGrain=(x*37+y*79+x*y*23)%26-13;
    const blades=(x%5===0&&y%7>2)?7:0;
    const clear=Math.sin(x*.098)*Math.sin(y*.049)*7;
    return [134+grassGrain+clear,148+grassGrain+blades+clear,76+grassGrain*.5];
  });
  function mesh(points,material,lift,name,uvSize=4.5){
    const positions=[],uv=[];
    for(const triangle of points){
      const [a,b,c]=triangle,turn=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
      if(Math.abs(turn)<1e-6)continue;
      for(const point of turn<0?[a,b,c]:[a,c,b]){
        positions.push(...at(point.x,point.y,lift));
        uv.push(point.x/uvSize,point.y/uvSize);
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    geometry.computeVertexNormals();
    const surface=new T.Mesh(geometry,material);
    surface.name=name;surface.receiveShadow=true;
    root.add(surface);
  }
  function ground(outline,material,lift,name,uvSize){
    const verts=outline.map(({x,y})=>new T.Vector2(x,y));
    mesh(T.ShapeUtils.triangulateShape(verts,[]).map(face=>face.map(index=>outline[index])),material,lift,name,uvSize);
  }
  function joinGround(edges,lift,color,name){
    const positions=[];
    const ground=(x,y)=>sampleMeshHeight(bukchonSurfaceGrade,{x,y})-.65;
    for(const [a,b] of edges){
      const sections=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3.2));
      const aHeight=songhyeonGrade(a.x,a.y)+lift,bHeight=songhyeonGrade(b.x,b.y)+lift;
      function edgePoint(t){
        const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,high=aHeight+(bHeight-aHeight)*t;
        return {top:[wx(x),high,wz(y)],bottom:[wx(x),Math.min(high-.10,ground(x,y)),wz(y)]};
      }
      let previous=edgePoint(0);
      for(let section=1;section<=sections;section++){
        const next=edgePoint(section/sections);
        positions.push(...previous.top,...previous.bottom,...next.bottom,...previous.top,...next.bottom,...next.top);
        previous=next;
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geometry.computeVertexNormals();
    const material=matte(color).clone();material.side=T.DoubleSide;
    const seam=new T.Mesh(geometry,material);seam.name=name;seam.receiveShadow=true;root.add(seam);
  }
  ground(songhyeonOutline,matte(land),.006,"송현녹지");
  for(const {outline,name} of songhyeonLawns)ground(outline,grass,.019,name,5.2);
  for(const {outline,name} of songhyeonBeds)ground(outline,matte(earth),.024,name);
  joinGround(songhyeonOutline.map((a,i)=>[a,songhyeonOutline[(i+1)%songhyeonOutline.length]]),.004,0x706c55,"송현녹지 경계 지반");
  yield;

  const drawn=[];
  for(const path of songhyeonPaths){
    const pieces=coverRibbon(path),triangles=[];
    for(const piece of pieces)for(const [first,...rest] of exposedSurface(piece.points,drawn)){
      for(let i=1;i<rest.length;i++)triangles.push([first,rest[i-1],rest[i]]);
    }
    mesh(triangles,pathSurface,.046,path.name,3.7);
    drawn.push(...pieces);
  }
  const links=songhyeonPaths.filter(path=>path.kind==="link").flatMap(({left,right})=>[left,right]);
  joinGround(links.flatMap(edge=>edge.slice(1).map((point,i)=>[edge[i],point])),.043,0x8c887b,"송현 진입로 기초");
  yield;

  const blockMatrix=new T.Object3D(),tint=new T.Color();
  const stones=[],caps=[],stoneTones=[0xa4a095,0xa6a295,0x98978e,0x929187,0xaaa696,0x8f8d82];
  for(const [a,b] of songhyeonWalls){
    const dx=b.x-a.x,dy=b.y-a.y,run=Math.hypot(dx,dy),angle=Math.atan2(-dy,dx);
    const add=(list,fraction,width,height,depth,base,color)=>{
      const x=a.x+dx*fraction,y=a.y+dy*fraction;
      list.push({x,y,base,width,height,depth,color,angle});
    };
    add(stones,.5,run,.932,.489,.437,0x696961);
    add(caps,.5,run,.16,.611,1.118,stone);
    const count=Math.max(1,Math.ceil(run/1.24)),width=run/count;
    for(let row=0;row<3;row++){
      const shift=row%2?.43:0;
      for(let n=-1;n<count;n++){
        const from=Math.max(0,(n+shift)*width),to=Math.min(run,(n+shift+1)*width);
        if(to-from<=.055)continue;
        add(stones,(from+to)/(2*run),to-from-.026,.295+random()*.011,.535+random()*.037,
          .145+row*.315,stoneTones[Math.floor(random()*stoneTones.length)]);
      }
    }
  }
  function stoneBatch(parts,name){
    const batch=new T.InstancedMesh(new T.BoxGeometry(1,1,1),matte(0xffffff),parts.length);
    parts.forEach(({x,y,base,width,height,depth,color,angle},index)=>{
      blockMatrix.position.set(...at(x,y,base));blockMatrix.rotation.set(0,angle,0);
      blockMatrix.scale.set(width,height,depth);blockMatrix.updateMatrix();
      batch.setMatrixAt(index,blockMatrix.matrix);batch.setColorAt(index,tint.setHex(color));
    });
    batch.name=name;batch.castShadow=true;batch.receiveShadow=true;
    batch.computeBoundingSphere();root.add(batch);
  }
  stoneBatch(stones,"송현 낮은 돌담");stoneBatch(caps,"송현 돌담 덮개");
  yield;

  const flowers=[];
  const palettes=[[0xe7ae50,0xf7c758,0xc77b54,0xecd896],[0xe4acd4,0xf7d2d6,0xb187b3,0xe1b1ad],
    [0x9b83bb,0xc698c6,0xe7d3dd,0xd4a154],[0xbfc68b,0x8fa55d,0x819153,0xc4cf94]];
  for(const [index,{outline,bounds}] of songhyeonBeds.entries()){
    const {minX,maxX,minY,maxY}=bounds,w=maxX-minX,d=maxY-minY;
    const count=Math.min(230,Math.round(w*d*.13));
    const palette=palettes[index%palettes.length];
    const field=drawn.filter(({box})=>box.minX<maxX+1&&box.maxX>minX-1&&box.minY<maxY+1&&box.maxY>minY-1);
    for(let n=0;n<count;n++){
      const x=minX+w*random(),y=minY+d*random();
      if(!inSonghyeon(x,y)||!contains(x,y,outline)||field.some(part=>contains(x,y,part.points)))continue;
      const height=.24+random()*.74;
      flowers.push({x,y,height,color:palette[Math.floor(random()*palette.length)],turn:random()*Math.PI*2});
    }
  }
  const stems=new T.InstancedMesh(new T.ConeGeometry(1,1,4),matte(0x698048),flowers.length);
  const petals=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),matte(0xffffff),flowers.length);
  flowers.forEach(({x,y,height,color,turn},index)=>{
    blockMatrix.position.set(...at(x,y,height*.4));blockMatrix.rotation.set(.12,turn,.10);
    blockMatrix.scale.set(.1,height*.93,.09);blockMatrix.updateMatrix();stems.setMatrixAt(index,blockMatrix.matrix);
    blockMatrix.position.set(...at(x+.032,y,height*.86));blockMatrix.rotation.set(.14,turn,.3);
    blockMatrix.scale.set(height*.145,height*.062,height*.16);blockMatrix.updateMatrix();
    petals.setMatrixAt(index,blockMatrix.matrix);petals.setColorAt(index,tint.setHex(color));
  });
  for(const batch of [stems,petals]){batch.computeBoundingSphere();root.add(batch);}
  yield;

  const treePieces=new T.Group();treePieces.name="송현 소나무·가로수";root.add(treePieces);
  const trees=makeTreeBuilder(T,treePieces,{rand:random,clearance:{meshFits:()=>true,trim:()=>true}});
  for(const [i,[x,y,height]] of songhyeonTrees.entries()){
    const anchor={x,y},previous=treePieces.children.length;
    trees.grow(wx(x),wz(y),{height,style:i%5===0?"branchy":"cloud",
      palette:i%5===0?"ginkgo":"pine",terrainAnchor:anchor});
    for(let j=previous;j<treePieces.children.length;j++)treePieces.children[j].position.y+=songhyeonGrade(x,y);
    if(i%6===5)yield;
  }
  for(const [x,y,angle] of songhyeonBenches){
    const bench=new T.Group();bench.position.set(...at(x,y));bench.rotation.y=angle;root.add(bench);
    for(const side of [-1,1]){
      box(0x51605c,side*.80,.22,0,.085,.44,.54,bench);
      box(0x51605c,side*.80,.65,-.22,.079,.42,.064,bench);
    }
    for(const z of [-.18,-.059,.062,.183])box(brown,0,.462,z,2.25,.062,.104,bench);
    for(const y of [.665,.777])box(brown,0,y,-.259,2.25,.083,.055,bench);
  }
  for(const [x,y,angle] of [[804.8,-923,.12],[973.6,-1043,-Math.PI/2],[949,-974,-Math.PI/2]]){
    const marker=new T.Group();marker.name="열린송현녹지광장 안내";marker.position.set(...at(x,y));
    marker.rotation.y=angle;root.add(marker);
    for(const side of [-1,1])box(0x53463b,side*1.05,.904,-.019,.118,1.810,.115,marker);
    box(0x382f2a,0,1.607,0,2.72,.734,.12,marker);
    standSign(T,marker,"열린송현녹지광장","SONGHYEON GREEN PLAZA",2.55,0,1.607,.074,"#41362d","#fff0c9",.61);
  }
}
