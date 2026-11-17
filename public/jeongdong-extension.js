import {makeTreeBuilder} from "./lowpoly-trees.js";
import {
  extensionBoundaryDepth,extensionEdge,extensionRibbon,extensionSegments,jeongdongBoundaryWalls,
  jeongdongExtensionPaths,jeongdongParkCourt,pyeongseongGate
} from "./jeongdong-extension-layout.js";

const stoneColors=[0xa29f92,0xb4b0a3,0x9b9c91,0xc1b9a8,0xaaa598,0x96978c];
const grill=0x303b35, granite=0xb2afa1, curb=0xa6a294;

function tileMaterial(T,style){
  const size=128,pixels=new Uint8Array(size*size*4);
  const options={
    stone:{base:[157,151,138],w:32,h:24,joint:21},
    fieldstone:{base:[163,157,144],w:37,h:22,joint:16},
    brick:{base:[145,117,99],w:24,h:16,joint:23},
    deck:{base:[138,110,78],w:128,h:8,joint:29},
    brickWall:{base:[163,107,86],w:32,h:16,joint:22}
  };
  const {base,w,h,joint}=options[style];
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const row=Math.floor(y/h),offset=x+row%2*w/2,split=Math.floor(offset/w);
      const seam=y%h===0||offset%w===0;
      const noise=((x*371+y*209+(x^y)*53)%17)-8,block=(split*11+row*5)%15-7;
      const shade=noise*.62+block-(seam?joint:0);
      pixels.set(seam&&style==="brickWall"?[127,115,103,255]:
        [base[0]+shade,base[1]+shade,base[2]+shade,255],(y*size+x)*4);
    }
  }
  const map=new T.DataTexture(pixels,size,size);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
  return new T.MeshStandardMaterial({map,roughness:.93});
}

function makeSign(T,lines,width,height){
  const canvas=document.createElement("canvas");
  canvas.width=384;canvas.height=136;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#333b33";ctx.fillRect(0,0,384,136);
  ctx.strokeStyle="#bbac89";ctx.lineWidth=3;ctx.strokeRect(5,5,374,126);
  ctx.textAlign="center";ctx.textBaseline="middle";
  for(const [index,line] of lines.entries()){
    ctx.fillStyle=index===0?"#f2e9d7":"#d5caad";
    ctx.font=`600 ${index===0?41:25}px "Malgun Gothic", sans-serif`;
    ctx.fillText(line,192,index===0?51:101,345);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  return new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,side:T.DoubleSide}));
}

export function buildJeongdongExtension(T,root,{wx,wz,box,cylinder,matte}){
  const group=new T.Group();group.name="덕수궁 서·북쪽 돌담길";root.add(group);
  const ground=new T.Group(),boundaries=new T.Group(),park=new T.Group(),details=new T.Group();
  ground.name="돌담길 포장";boundaries.name="정동 돌담과 철제 격자";park.name="정동공원";details.name="돌담길 표지와 조명";
  for(const wrapper of [group,ground,boundaries,park,details])wrapper.userData.gradeChildren=true;
  group.add(ground,boundaries,park,details);
  const surfaces={stone:tileMaterial(T,"stone"),brick:tileMaterial(T,"brick"),deck:tileMaterial(T,"deck")};

  function strip(points,half,material,height){
    const coords=[],uv=[],indices=[];
    const edges=[extensionEdge(points,half),extensionEdge(points,-half)];
    let distance=0;
    for(const [index,p] of points.entries()){
      if(index){const a=points[index-1];distance+=Math.hypot(p.x-a.x,p.y-a.y);}
      for(const side of [0,1]){
        const p=edges[side][index];
        coords.push(wx(p.x),height,wz(p.y));uv.push(distance/4.8,side*half/1.8);
      }
      if(index){const j=index*2;indices.push(j-2,j,j-1,j-1,j,j+1);}
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(coords,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    if(geometry.attributes.normal.getY(0)<0){geometry.setIndex(indices.reverse());geometry.computeVertexNormals();}
    const mesh=new T.Mesh(geometry,material);mesh.receiveShadow=true;mesh.userData.followTerrain=true;ground.add(mesh);
  }
  function surface(outline,material,height,parent=ground){
    const footprint=new T.Shape(outline.map(p=>new T.Vector2(wx(p.x),-wz(p.y))));
    const geometry=new T.ShapeGeometry(footprint),uv=geometry.attributes.uv,positions=geometry.attributes.position;
    for(let index=0;index<uv.count;index++)uv.setXY(index,positions.getX(index)/4,positions.getY(index)/4);
    geometry.rotateX(-Math.PI/2);
    const mesh=new T.Mesh(geometry,material);mesh.position.y=height;mesh.receiveShadow=true;
    mesh.userData.followTerrain=true;parent.add(mesh);
  }

  for(const [index,path] of jeongdongExtensionPaths.entries()){
    const {points,width,surface:kind}=path;
    // These layered edge heights avoid coplanar tiles at the fountain and avenue seams.
    const height=.046+index*.002;
    strip(points,width/2,surfaces[kind],height);
    if(kind==="deck"){
      strip(points,width/2+.20,matte(0x71553f),height-.016);
    }else{
      const edging=extensionRibbon(points,width/2+.19);
      surface(edging,matte(curb),height-.016);
    }
  }
  surface(jeongdongParkCourt,surfaces.stone,.044,park);

  function place(parent,color,x,y,width,depth,height,base=0,angle=0){
    const mesh=box(color,wx(x),base+height/2,wz(y),width,height,depth,parent);
    mesh.rotation.y=angle;
    return mesh;
  }
  function wallFrame(segment){
    const frame=new T.Group();
    frame.position.set(wx(segment.x),0,wz(segment.y));frame.rotation.y=segment.angle;
    frame.userData.terrainWallSpan={a:segment.a,b:segment.b,length:segment.length};
    boundaries.add(frame);
    return frame;
  }
  const rounded=new T.IcosahedronGeometry(1,1);
  const redBrick=tileMaterial(T,"brickWall");
  const fieldstone=tileMaterial(T,"fieldstone");
  function masonry(frame,length,depth,height,{brick=false}={}){
    const footing=Math.min(.36,height*.28);
    // Carry the wall below the exposed verge while keeping its upper courses unchanged.
    box(0x8e8b80,0,-.145,0,length+.15,.33,depth+.022,frame);
    box(granite,0,footing*.27,0,length+.15,footing*.51,depth+.035,frame);
    box(0xa5a295,0,footing*.73,0,length+.15,footing*.43,depth+.016,frame);
    if(brick){
      const geometry=new T.BoxGeometry(length+.11,height-footing,depth-.035),uv=geometry.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(i<8?depth:length)/1.5,uv.getY(i)*(height-footing)/1.2);
      const body=new T.Mesh(geometry,redBrick);body.position.y=(height+footing)/2;frame.add(body);
    }else{
      const geometry=new T.BoxGeometry(length+.11,height-footing,depth-.046),uv=geometry.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(i<8?depth:length)/1.6,uv.getY(i)*(height-footing)/1.35);
      const body=new T.Mesh(geometry,fieldstone);body.position.y=(height+footing)/2;frame.add(body);
      const rows=Math.ceil((height-footing)/.267),count=Math.ceil(length/.54),cell=length/count;
      for(let row=0;row<rows;row++){
        const rowY=footing+(row+.5)*(height-footing)/rows;
        for(let i=0;i<=count;i++){
          const left=Math.max(-length/2,-length/2+(i-(row%2)*.49)*cell);
          const right=Math.min(length/2,-length/2+(i+1-(row%2)*.49)*cell);
          const width=right-left;
          if(width<.052)continue;
          const shade=(row*13+i*7+Math.round(length))%stoneColors.length;
          const wobble=((i*17+row*13)%11-5)/5;
          const rock=new T.Mesh(rounded,matte(stoneColors[shade]));
          rock.position.set((left+right)/2+wobble*.028,rowY+wobble*.032,0);
          rock.scale.set(width*(.55+wobble*.07),(height-footing)/rows*(.61+wobble*.11),depth*.51);
          rock.rotation.z=((i*3+row)%7-3)*.063;frame.add(rock);
        }
      }
    }
    box(0x535953,0,height+.045,0,length+.18,.10,depth+.21,frame);
    box(0x626660,0,height+.121,0,length+.13,.10,depth+.12,frame);
  }
  function ironBars(frame,length,bottom,height){
    const top=bottom+height,count=Math.ceil(length/.115),spacing=length/count;
    box(grill,0,bottom+.074,0,length+.06,.051,.057,frame);
    box(grill,0,top-.108,0,length+.06,.049,.061,frame);
    for(let i=0;i<=count;i++){
      const x=-length/2+i*spacing,post=i%20===0||i===count;
      const width=post?.069:.027;
      box(grill,x,bottom+height*.50,0,width,height,post?.084:.034,frame);
      if(post){
        const topCap=box(grill,x,top-.016,0,width*.83,width*.83,width*.83,frame);
        topCap.rotation.z=Math.PI/4;
      }
    }
  }
  function rail(frame,length){
    const height=1.04,count=Math.max(1,Math.ceil(length/2.15));
    box(0x785a3f,0,height-.045,0,length+.04,.11,.14,frame);
    box(0x71543b,0,.49,0,length+.04,.083,.09,frame);
    for(let i=0;i<=count;i++){
      const x=length*(i/count-.5);
      box(0x73543b,x,(height*.96-.27)/2,0,.15,height*.96+.27,.15,frame);
      box(0x9a7854,x,height-.017,0,.19,.065,.19,frame);
    }
  }
  for(const {kind,height,points} of jeongdongBoundaryWalls){
    for(const segment of extensionSegments(points)){
      const frame=wallFrame(segment),length=segment.length,depth=extensionBoundaryDepth(kind);
      if(kind==="rail"){rail(frame,length);continue;}
      const base=kind==="residence-grille"?1.66:height-.17;
      masonry(frame,length,depth,base,{brick:kind==="brick"});
      if(kind==="residence-grille")ironBars(frame,length,base+.16,height-base-.16);
    }
  }

  const gate=pyeongseongGate;
  const entry=new T.Group();entry.position.set(wx(gate.x),0,wz(gate.y));entry.rotation.y=gate.angle;
  entry.name="평성문";boundaries.add(entry);
  for(const side of [-1,1]){
    box(granite,side*2.75,.21,0,.82,.42,1.02,entry);
    box(0x85523f,side*2.75,1.54,0,.34,2.75,.39,entry);
    box(0x814d3c,side*1.36,1.39,0,2.63,2.47,.24,entry);
    for(let i=0;i<11;i++)box(0x714536,side*(.23+i*.223),1.43,.137,.016,2.3,.022,entry);
    box(0x4b3930,side*.25,1.34,.167,.087,.22,.071,entry);
  }
  box(0x814e3a,0,2.72,0,5.57,.37,.48,entry);
  box(0x456353,0,2.96,0,5.82,.20,.74,entry);
  for(const side of [-1,1]){
    const roof=box(0x404944,0,3.24,side*.49,6.33,.17,1.21,entry);roof.rotation.x=side*.31;
    for(let i=0;i<27;i++){
      const tile=cylinder(0x525b55,(i-13)*.227,3.25,side*.51,.054,1.11,6,entry);
      tile.rotation.x=Math.PI/2+side*.31;
    }
  }
  box(0x5e645c,0,3.54,0,6.39,.19,.18,entry);
  const gateSign=makeSign(T,["平成門","평성문"],1.23,.44);
  gateSign.position.set(0,2.68,.35);entry.add(gateSign);

  for(const [x,y,first,second,angle] of [
    [171.8,171.5,"평성문","덕수궁 서쪽 돌담길",Math.PI/2],
    [153.4,75.6,"고종의 길","정동공원 ←",0],
    [327.3,114.9,"덕수궁 돌담길","세종대로 →",0],
    [450.0,124.1,"세종대로19길","← 덕수궁 돌담길",0],
    [16.6,16.5,"정동공원","서울 구 러시아공사관",0]
  ]){
    cylinder(0x545249,wx(x),.81,wz(y),.046,1.62,8,details);
    const sign=makeSign(T,[first,second],1.20,.43);
    sign.position.set(wx(x),1.54,wz(y));sign.rotation.y=angle;details.add(sign);
  }
  for(const [x,y,angle] of [[174.5,251,Math.PI/2],[174.5,219,Math.PI/2],[174.5,187,Math.PI/2],[174.2,138,Math.PI/2],
    [166.1,102,Math.PI/2],[155,34,0],[196,23,0],[258,83,0],[296,102,0],[382,125,0],[432,124,0]]){
    place(details,0x62695f,x,y,.32,.44,.07,.015,angle);
    place(details,0xc9bb8e,x,y,.20,.22,.018,.086,angle);
  }

  const bluff=[{x:-31,y:8},{x:6,y:8},{x:9,y:16},{x:5,y:32},{x:10,y:45},{x:-32,y:47}];
  const lawn=new T.MeshStandardMaterial({color:0x68784c,roughness:1});
  lawn.userData.seasonFoliage="ground";surface(bluff,lawn,.026,park);
  const tower=new T.Group();tower.name="서울 구 러시아공사관 탑";tower.position.set(wx(-13),0,wz(23));park.add(tower);
  const stucco=0xddd8cc,trim=0xc2bdad,roof=0x555d5d;
  box(0x868880,0,.32,0,11,.64,10.3,tower);
  box(stucco,0,3.45,0,6.4,6.20,6.8,tower);
  box(stucco,0,7.55,0,5.6,2.34,5.9,tower);
  box(trim,0,6.36,0,6.72,.29,7.11,tower);
  box(trim,0,8.66,0,5.94,.31,6.35,tower);
  const pyramidal=new T.ConeGeometry(4.59,2.91,4);
  pyramidal.rotateY(Math.PI/4);
  const towerRoof=new T.Mesh(pyramidal,matte(roof));towerRoof.position.y=10.19;tower.add(towerRoof);
  for(let side=0;side<4;side++){
    const face=new T.Group();face.rotation.y=side*Math.PI/2;tower.add(face);
    for(const x of [-1.45,0,1.45]){
      box(0x6f7470,x,7.52,3.00,.68,1.41,.058,face);
      const arch=cylinder(0x6f7470,x,8.19,3.03,.34,.056,14,face);
      arch.rotation.x=Math.PI/2;
    }
    for(const x of [-2.85,2.85])box(0xd2cbb8,x,3.46,3.42,.35,5.98,.18,face);
  }

  // Canopies overhang the walkway, but trunks stay behind the public boundary.
  let seed=46387;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const greenery=new T.Group();greenery.name="정동 골목 가로수";group.add(greenery);
  greenery.userData.gradeChildren=true;
  const {grow,shrub}=makeTreeBuilder(T,greenery,{rand,clearance:{meshFits:()=>true,trim:()=>true}});
  for(const [x,y,height,spread,palette,style] of [
    [158,237,10.2,6.9,"ginkgo","branchy"],[162,206,9.2,5.6,"maple","cloud"],[160,173,12.7,8.4,"russet","branchy"],
    [155,135,11.7,7.3,"olive","cloud"],[148,108,10.8,6.2,"ginkgo","round"],[147,54,9.3,5.4,"maple","round"],
    [178,17,10.2,5.9,"ginkgo","branchy"],[204,18,8.9,5.7,"amber","cloud"],[236,26,11.5,6.4,"ginkgo","round"],
    [260,59,9.8,6.0,"deep","cloud"],[282,89,9.4,6.7,"maple","branchy"],
    [312,99,10.1,6.1,"amber","cloud"],[351,113,9.6,5.2,"olive","branchy"],[381,119,8.3,4.7,"ginkgo","column"],
    [80,48,9.8,6.4,"russet","round"],[62,37,10.2,6.5,"ginkgo","cloud"],
    [31,18,8.5,5.3,"maple","round"],[4,22,11.6,6.8,"ginkgo","branchy"],[-23,12,8.1,5.2,"deep","cloud"],
    [-24,34,9.6,6.1,"russet","branchy"]
  ]){
    const first=greenery.children.length;
    grow(wx(x),wz(y),{height,spread,palette,style});
    for(let index=first;index<greenery.children.length;index++)greenery.children[index].userData.terrainAnchor={x,y};
  }
  for(const [x,y] of [[14,18],[9,19],[11,35],[14,38],[21,40],[25,38],[31,34],[32,23],[6,35],[-1,11],[-26,18],[-28,29]]){
    shrub(wx(x),wz(y),.37+rand()*.44,rand()<.5?"pine":"olive");
  }
  return group;
}
