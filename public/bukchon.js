import {bukchonPaths,bukchonGroundHeight,bukchonSurfaceGrade,bukchonTerrain,bukchonShopPlots,bukchonLawns,bukchonStreetTrees,dongsipjagak,folkMuseumEastDoor} from "./bukchon-layout.js";
import {gbEastWallX,insideGbWall} from "./gyeongbok-perimeter.js";
import {bikeDocks} from "./sejong-bike.js";
import {bukchonBusRoads,busStopById} from "./sejong-bus.js";
import {gradePalaceMeshes,sampleMeshHeight} from "./gyeongbok-terrain.js";
import {mmcaReserved} from "./mmca-layout.js";
import {buildMmca} from "./mmca.js";

const stone=0x9a9385, mortar=0x6e6559, charcoal=0x393b3c;
const timber=0x573c2c, darkWood=0x352c27, brass=0xbc9052, asphalt=0x4b4a4a;
const pave=0xaaa9a0, plaster=0xd9cbb4;
const park=0x687657, streetGrass=0x717953, brick=0x977463;
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),level:lerp(a.level,b.level,t)});
const fit=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,level:(a.level+b.level)/2});
const direction=(a,b)=>Math.atan2(a.y-b.y,b.x-a.x);
const apart=(point,angle,distance)=>({x:point.x+Math.sin(angle)*distance,y:point.y+Math.cos(angle)*distance,level:point.level});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function* buildBukchon(T,root,kit){
  const {wx,wz,box,shape,cylinder,matte}=kit;
  let seed=60325;
  const random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
  const colorFrom=colors=>colors[Math.floor(random()*colors.length)];
  const material=(mesh,shadows=true)=>{
    mesh.castShadow=shadows;mesh.receiveShadow=true;return mesh;
  };
  const create=(color,x,y,z,w,h,d,parent=root)=>material(box(color,x,y,z,w,h,d,parent));
  function groupAt(point,angle=0){
    const group=new T.Group();
    group.position.set(wx(point.x),point.level,wz(point.y));
    group.rotation.y=angle;
    root.add(group);return group;
  }
  const graded=[];
  function meshFromTriangles(color,triangles,{terrain=true,follow=true,twoSided=false}={}){
    if(!triangles.length)return;
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(triangles,3));
    geometry.computeVertexNormals();
    const mesh=material(shape(geometry,color,0,0,0,root),false);
    mesh.userData.terrainSurface=terrain;
    if(follow){mesh.userData.followTerrain=true;graded.push(mesh);}
    if(twoSided){
      mesh.material=mesh.material.clone();
      mesh.material.side=T.DoubleSide;
    }
  }
  const vertex=(values,point,offset)=>values.push(wx(point.x),point.level+offset,wz(point.y));
  function quad(values,a,b,c,d,offset=0,follow=true){
    const flip=(b.y-a.y)*(c.x-a.x)<(b.x-a.x)*(c.y-a.y);
    for(const p of flip?[a,c,b,a,d,c]:[a,b,c,a,c,d]){
      if(follow)values.push(wx(p.x),offset,wz(p.y));
      else vertex(values,p,offset);
    }
  }
  function band(path,color,offset=.002){
    let values=[],length=0;
    for(let i=1;i<path.left.length;i++){
      const a=path.left[i-1],b=path.right[i-1],c=path.right[i],d=path.left[i];
      const run=distance(a,d);
      const parts=Math.ceil(run/32);
      for(let part=0;part<parts;part++){
        const t=part/parts,u=(part+1)/parts;
        quad(values,mix(a,d,t),mix(b,c,t),mix(b,c,u),mix(a,d,u),offset);
        length+=run/parts;
        if(length>36){meshFromTriangles(color,values);values=[];length=0;}
      }
    }
    meshFromTriangles(color,values);
  }
  function beam(color,a,b,h,d,raise=0){
    const p=fit(a,b),run=distance(a,b);
    const mesh=create(color,wx(p.x),p.level+raise,wz(p.y),Math.hypot(run,b.level-a.level),h,d);
    mesh.rotation.set(0,direction(a,b),Math.atan2(b.level-a.level,run),"YXZ");
    return mesh;
  }
  const grid=8,patch=grid*8;
  const stairs=bukchonPaths.find(path=>path.kind==="stairs");
  const avenue=bukchonPaths[0],eastWalk=bukchonPaths[2],northWestWalk=bukchonPaths[8];
  for(const ring of bukchonBusRoads){
    const vertices=[];
    const contour=ring.map(({x,y})=>new T.Vector2(x,y));
    for(const [a,b,c] of T.ShapeUtils.triangulateShape(contour,[])){
      const direction=(ring[b].x-ring[a].x)*(ring[c].y-ring[a].y)-(ring[b].y-ring[a].y)*(ring[c].x-ring[a].x);
      for(const i of direction<0?[a,b,c]:[a,c,b]){
        const point=ring[i];
        vertices.push(wx(point.x),-.016,wz(point.y));
      }
    }
    meshFromTriangles(asphalt,vertices);
  }
  // Stop the east-side terrain at the shared palace wall. Its floor and this
  // verge meet at the same grade as the sidewalk.
  for(let left=620;left<1220;left+=patch){
    for(let top=-2079;top<-850;top+=patch){
      const earth=[],plants=[];
      const node=(x,y)=>{
        const wall=gbEastWallX(y);
        if(wall!=null&&y< -908)x=Math.max(x,wall+.12);
        const stairGap=Math.hypot(Math.max(936-x,0,x-958),Math.max(-1843-y,0,y+1830));
        const recess=Math.max(0,1-stairGap/14)*2.85;
        return {x,y,level:sampleMeshHeight(bukchonSurfaceGrade,{x,y})-.6-recess};
      };
      const vertexRows=Array.from({length:9},(_,i)=>Array.from({length:9},(_,j)=>node(left+j*grid,top+i*grid)));
      for(let i=0;i<8;i++)for(let j=0;j<8;j++){
        const a=vertexRows[i][j],b=vertexRows[i][j+1],c=vertexRows[i+1][j+1],d=vertexRows[i+1][j];
        if(b.x-a.x+c.x-d.x<.02||insideGbWall((a.x+b.x+c.x+d.x)/4,(a.y+b.y+c.y+d.y)/4))continue;
        // Use the same diagonal as the draped road in each cell.
        quad(random()<.16?plants:earth,b,c,d,a,0,false);
      }
      meshFromTriangles(streetGrass,earth,{follow:false});meshFromTriangles(park,plants,{follow:false});
      if((top+2079)%(patch*4)===patch*3)yield;
    }
  }
  // Keep the road and its shoulders in view at the playable boundary.
  // The extension is scenery only and bends into the row of trees below.
  for(const [path,color] of [[avenue,asphalt],[eastWalk,pave],[northWestWalk,pave]]){
    const left=path.left.at(-1),right=path.right.at(-1);
    const bend=[{x:5,y:-16},{x:16,y:-37},{x:38,y:-65},{x:63,y:-106}];
    const edge=(point,offset)=>({...point,x:point.x+offset.x,y:point.y+offset.y});
    band({left:[left,...bend.map(offset=>edge(left,offset))],right:[right,...bend.map(offset=>edge(right,offset))]},
      color,path.kind==="road"?0:.055);
  }
  const walkingColor={road:asphalt,pavement:pave,alley:0x77726c,lane:0x68686a,crosswalk:asphalt,entrance:0xb4ab94};
  for(let i=1;i<avenue.right.length;i++){
    const joints=[];
    quad(joints,avenue.right[i-1],eastWalk.left[i-1],eastWalk.left[i],avenue.right[i],-.002);
    meshFromTriangles(0x9b9287,joints);
  }
  for(const path of bukchonPaths){
    if(path.kind==="stairs")continue;
    const layer={road:0,pavement:.055,alley:.035,lane:.028,crosswalk:.072,entrance:.082}[path.kind];
    band(path,walkingColor[path.kind],layer);
    const edgeTrim=[];
    if(path.kind==="pavement"){
      for(const side of [path.left,path.right]){
        for(let i=1;i<side.length;i++){
          const a=side[i-1],b=side[i],across=direction(a,b);
          const width=.23;
          const from=apart(a,across,-width),to=apart(b,across,-width);
          quad(edgeTrim,from,apart(a,across,width),apart(b,across,width),to,.027);
        }
      }
      meshFromTriangles(0x969487,edgeTrim);
    }
    if(path.kind==="alley"){
      for(const side of [path.left,path.right]){
        let frontage=[];
        for(let i=1;i<side.length;i++){
          if(path.name==="북촌로5나길"&&i===1)continue;
          const a=side[i-1],b=side[i],start=path.points[i-1],end=path.points[i];
          const outward=(edge,centre)=>({x:edge.x+(edge.x-centre.x)*.83,y:edge.y+(edge.y-centre.y)*.83});
          quad(frontage,a,b,outward(b,end),outward(a,start),-.003);
          if(frontage.length>140){meshFromTriangles(0x8c8070,frontage);frontage=[];}
        }
        meshFromTriangles(0x8c8070,frontage);
      }
    }
    for(const {a,b} of path.segments){
      const length=distance(a,b),angle=direction(a,b);
      if(path.kind==="road"){
        const marks=[];
        for(let metre=0;metre<length-2;metre+=7.4){
          const start=mix(a,b,metre/length),end=mix(a,b,Math.min(1,(metre+3.2)/length));
          quad(marks,apart(start,angle,-.065),apart(start,angle,.065),apart(end,angle,.065),apart(end,angle,-.065),.016);
        }
        meshFromTriangles(0xcaa75e,marks);
      }
      if(path.kind==="crosswalk"){
        const paint=[];
        for(let metre=.6;metre<length-1;metre+=1.27){
          const start=mix(a,b,metre/length),end=mix(a,b,(metre+.64)/length),width=path.width/2-.22;
          quad(paint,apart(start,angle,-width),apart(start,angle,width),apart(end,angle,width),apart(end,angle,-width),.091);
        }
        meshFromTriangles(0xe2ddd1,paint);
      }
      if(path.kind==="alley"||path.kind==="lane"){
        const drain=[];
        for(let metre=0;metre<length-1;metre+=1.45){
          const start=mix(a,b,metre/length),end=mix(a,b,Math.min(1,(metre+1.4)/length)),edge=path.width/2-.36;
          quad(drain,apart(start,angle,edge-.11),apart(start,angle,edge+.11),apart(end,angle,edge+.11),apart(end,angle,edge-.11),layer+.016);
        }
        meshFromTriangles(path.kind==="alley"?0x9b8f80:0xb6a061,drain);
      }
    }
    yield;
  }
  for(const {outline} of bukchonLawns){
    const positions=[];
    const contours=outline.map(({x,y})=>new T.Vector2(x,y));
    for(const [a,b,c] of T.ShapeUtils.triangulateShape(contours,[])){
      const normal=(outline[b].x-outline[a].x)*(outline[c].y-outline[a].y)-
        (outline[b].y-outline[a].y)*(outline[c].x-outline[a].x);
      for(const index of normal<0?[a,b,c]:[a,c,b])vertex(positions,outline[index],.011);
    }
    meshFromTriangles(0x738953,positions,{follow:false});
  }
  yield* gradePalaceMeshes(T,graded,bukchonSurfaceGrade);
  for(const [index,{a,b}] of stairs.segments.entries()){
    const treads=[],skirting=[],underpinning=[];
    const left=stairs.left[index],right=stairs.right[index],nextLeft=stairs.left[index+1],nextRight=stairs.right[index+1];
    const run=distance(a,b);
    const count=Math.max(1,Math.ceil(Math.abs(a.level-b.level)/.16));
    for(let i=0;i<count;i++){
      const before=i/count,after=(i+1)/count,level=mix(a,b,(before+after)/2).level;
      const l0={...mix(left,nextLeft,before),level},r0={...mix(right,nextRight,before),level};
      const l1={...mix(left,nextLeft,after),level},r1={...mix(right,nextRight,after),level};
      quad(treads,l0,r0,r1,l1,.006,false);
      const baseLevel=level-.19;
      for(const [one,two] of [[l0,r0],[l0,l1],[r1,r0]]){
        for(const p of [one,two,{...two,level:baseLevel},one,{...two,level:baseLevel},{...one,level:baseLevel}])vertex(skirting,p,0);
      }
      for(const [one,two] of [[l0,l1],[r1,r0]]){
        const bottom=p=>({...p,level:Math.min(p.level-.19,bukchonTerrain(p.x,p.y)-2.82)});
        for(const p of [one,two,bottom(two),one,bottom(two),bottom(one)])vertex(underpinning,p,0);
      }
    }
    meshFromTriangles(index%2?0xb1a999:0xa9a191,treads,{follow:false});
    meshFromTriangles(0x81776b,skirting,{terrain:false,follow:false,twoSided:true});
    meshFromTriangles(0x8c8272,underpinning,{terrain:false,follow:false,twoSided:true});
    if(index===0||index===stairs.segments.length-1)continue;
    for(const [start,end] of [[left,nextLeft],[right,nextRight]]){
      const outside=(edge,center)=>({...edge,x:edge.x+(edge.x-center.x)*.55,y:edge.y+(edge.y-center.y)*.55});
      const first=outside(start,a),last=outside(end,b);
      beam(0x9c9382,first,last,.47,.29,.20);
      beam(0x494742,first,last,.065,.06,.91);
      const posts=Math.ceil(run/1.9);
      for(let i=0;i<posts;i++){
        const p=mix(first,last,i/posts);
        create(0x484742,wx(p.x),p.level+.54,wz(p.y),.055,.9,.055);
      }
    }
  }
  yield;

  const roofPanels=8;
  const roofFinish=matte(charcoal).clone(),wallFinish=matte(mortar).clone();
  if(typeof document!=="undefined"){
    const canvas=document.createElement("canvas");canvas.width=96;canvas.height=96;
    const ctx=canvas.getContext("2d");
    if(ctx){
      const wave=ctx.createLinearGradient(0,0,96,0);
      for(const [offset,color] of [[0,"#8b8480"],[.13,"#c1b8b0"],[.30,"#8d8988"],[.49,"#5c5a59"],[.70,"#545252"],[.90,"#646263"],[1,"#8b8480"]])wave.addColorStop(offset,color);
      ctx.fillStyle=wave;ctx.fillRect(0,0,96,96);
      ctx.fillStyle="rgba(24,22,21,.38)";ctx.fillRect(0,88,96,6);
      ctx.fillStyle="rgba(226,212,199,.18)";ctx.fillRect(0,94,96,2);
      const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
      map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;
      roofFinish.map=map;roofFinish.color.setHex(0x858181);
    }
    const masonry=document.createElement("canvas");masonry.width=256;masonry.height=192;
    const brush=masonry.getContext("2d");
    if(brush){
      brush.fillStyle="#6c6257";brush.fillRect(0,0,256,192);
      for(let row=0;row<4;row++)for(let col=-1;col<6;col++){
        const x=col*52+(row%2)*24,y=row*48,w=46+(row*7+col*3+14)%7;
        brush.fillStyle=["#a49988","#8f8473","#aea18d","#988d80"][(col+row+5)%4];
        brush.beginPath();brush.moveTo(x+3,y+7);brush.lineTo(x+w-4,y+4);
        brush.lineTo(x+w,y+13);brush.lineTo(x+w-2,y+41);brush.lineTo(x+6,y+44);
        brush.lineTo(x,y+33);brush.lineTo(x+3,y+7);brush.fill();
        brush.fillStyle="rgba(224,203,170,.26)";brush.fillRect(x+6,y+8,w-12,2);
      }
      const map=new T.CanvasTexture(masonry);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
      wallFinish.map=map;wallFinish.color.setHex(0xe1d9c8);
    }
  }
  function tiledRoof(group,w,d,eave,rise){
    const geometry=new T.BufferGeometry(),vertices=[],indices=[],uv=[];
    const lip=w/2,ridge=w*.31;
    for(const side of [-1,1])for(let slope=0;slope<=5;slope++)for(let panel=0;panel<=roofPanels;panel++){
      const t=slope/5,u=panel/roofPanels*2-1;
      const x=u*lerp(lip,ridge,t),z=side*d/2*(1-t);
      const y=eave+rise*(.42*t+.58*t*t)+(Math.abs(u)*.27+.08)*(1-t)**3;
      vertices.push(x,y,z);uv.push((u+1)*w/.68,t*d/.96);
    }
    const row=roofPanels+1,sideSize=row*6;
    for(let side=0;side<2;side++)for(let y=0;y<5;y++)for(let x=0;x<roofPanels;x++){
      const a=side*sideSize+y*row+x,b=a+row;
      if(side===0)indices.push(a,b,a+1,b,b+1,a+1);
      else indices.push(a,a+1,b,b,a+1,b+1);
    }
    // End hips close the space between the two curved slopes.
    for(const side of [-1,1]){
      const edge=side===-1?0:roofPanels;
      for(let i=0;i<5;i++){
        const a=i*row+edge,b=a+row,c=b+sideSize,d=a+sideSize;
        if(side===-1)indices.push(a,d,c,a,c,b);
        else indices.push(a,c,d,a,b,c);
      }
    }
    geometry.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    group.add(material(new T.Mesh(geometry,roofFinish)));
    // The timber head and lime infill meet the roof inside the overhang.
    create(darkWood,0,eave+.08,0,w-.98,.25,d-1.21,group);
    create(darkWood,0,eave+.08,0,w-.19,.055,d-.21,group);
    create(0x323333,0,eave+rise+.075,0,ridge*2+.35,.18,.27,group);
    create(0xa9a497,0,eave+rise+.01,0,ridge*2+.27,.065,.31,group);
    for(const side of [-1,1]){
      create(darkWood,0,eave-.035,side*d*.49,w*.93,.18,.12,group);
      const count=Math.ceil(w/.44);
      for(let i=0;i<count;i++){
        const u=(i+.5)/count*2-1;
        const tile=cylinder(i%4===0?0x686361:0x545152,u*w/2,eave+.075+Math.abs(u)*.27,side*d*.501,.096,.215,6,group);
        tile.rotation.x=Math.PI/2;
      }
    }
  }
  function buildDongsipjagak(){
    const {x,y}=dongsipjagak,level=.025,base=groupAt({x,y,level},-.13);
    const plot=(color,width,depth,height,top)=>{
      const mesh=cylinder(color,0,top-height/2,0,width/2,height,24,base);
      mesh.scale.z*=depth/width;material(mesh);
    };
    create(asphalt,0,-.22,0,46,.30,50,base);
    plot(0xb1a899,14.8,12,.25,.13);plot(0x657747,14.3,11.5,.16,.21);
    const levels=[[6.15,.21,.27],[5.95,.48,.28],[5.70,.76,3.28],[5.51,4.04,.27],[5.77,4.31,.16]];
    for(const [size,bottom,height] of levels)create(stone,0,bottom+height/2,0,size,height,size,base);
    for(const side of [-1,1])for(let row=0;row<5;row++)for(let col=0;col<7;col++){
      const height=1.09+row*.60,across=(col-3)*.78+(row%2?.13:-.13);
      const tint=colorFrom([0x9c978c,0xb8b0a0,0xa5a094,0xaaa08e,0x938c80]);
      const size=.69+random()*.05;
      create(tint,across,height,side*2.86,size,.53,.06,base);
      create(tint,side*2.86,height,across,.06,.53,size,base);
    }
    const eave=6.9,pillarHeight=2.38;
    create(0x8d8070,0,4.58,0,5.36,.24,5.36,base);
    for(const px of [-2.06,2.06])for(const pz of [-2.06,2.06]){
      create(0x9b9488,px,4.68,pz,.46,.21,.46,base);
      material(cylinder(0x8f4839,px,4.75+pillarHeight/2,pz,.17,pillarHeight,9,base,.90));
      create(0x466454,px,eave-.14,pz,.68,.29,.60,base);
      create(0x975541,px,eave+.02,pz,.88,.11,.80,base);
    }
    for(const side of [-1,1]){
      create(0x425d4e,0,eave,side*2.06,4.53,.23,.23,base);
      create(0x425d4e,side*2.06,eave,0,.23,.23,4.53,base);
      create(0x824939,0,5.32,side*2.06,4.10,.105,.13,base);
      create(0x824939,side*2.06,5.32,0,.13,.105,4.10,base);
      for(let n=-3;n<=3;n++){
        create(0x804839,n*.51,5.09,side*2.06,.071,.46,.07,base);
        create(0x804839,side*2.06,5.09,n*.51,.07,.46,.071,base);
      }
      for(let n=-4;n<=4;n++){
        create(n%2?0x99523a:0x6b8963,n*.48,eave+.04,side*2.22,.15,.105,.20,base);
        create(n%2?0x99523a:0x6b8963,side*2.22,eave+.04,n*.48,.20,.105,.15,base);
      }
    }
    const hip=new T.CylinderGeometry(.12,4.44,1,4,5);
    const positions=hip.getAttribute("position");
    for(let i=0;i<positions.count;i++){
      const t=positions.getY(i)+.5;
      positions.setY(i,1.88*(.39*t+.61*t*t)+.28*Math.pow(1-t,5));
    }
    hip.computeVertexNormals();
    const roof=new T.Mesh(hip,roofFinish);
    roof.position.y=eave+.16;roof.rotation.y=Math.PI/4;base.add(material(roof));
    material(cylinder(charcoal,0,eave+2.14,0,.15,.33,8,base,.58));
    for(const side of [-1,1])for(let n=-10;n<=10;n++){
      const p=n*.28,up=eave+.375+Math.abs(n)*.014;
      const front=cylinder(0x57514d,p,up,side*3.13,.089,.23,7,base);
      front.rotation.x=Math.PI/2;
      const flank=cylinder(0x57514d,side*3.13,up,p,.089,.23,7,base);
      flank.rotation.z=Math.PI/2;
    }
  }
  buildDongsipjagak();
  yield;
  function windows(group,w,h,front,dark=false){
    const bays=Math.max(2,Math.round(w/1.65)),bay=w/bays;
    for(let i=0;i<bays;i++){
      const x=(i+.5)*bay-w/2;
      create(darkWood,x,h*.57,front,bay*.81,h*.54,.08,group);
      create(dark?0x55605c:0xc0af8d,x,h*.57,front+.05,bay*.70,h*.43,.04,group);
      for(const side of [-1,0,1])create(timber,x+side*bay*.22,h*.57,front+.083,.034,h*.44,.035,group);
      create(timber,x,h*.56,front+.083,bay*.71,.041,.035,group);
    }
  }
  const fasciaNames=["차와 골목","북촌 공방","삼청 다방","작은 찻집","도자기 공방"];
  function sign(group,name,y,z,width){
    const panel=create(darkWood,0,y,z,width,.42,.07,group);
    if(typeof document==="undefined")return panel;
    const canvas=document.createElement("canvas");canvas.width=224;canvas.height=40;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#392f29";ctx.fillRect(0,0,224,40);
    ctx.strokeStyle="#b99464";ctx.strokeRect(3,3,218,34);
    ctx.font="bold 21px serif";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="#eadbc2";ctx.fillText(name,112,21);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const face=new T.Mesh(new T.PlaneGeometry(width,.42),new T.MeshStandardMaterial({map,roughness:.86}));
    face.position.set(0,y,z+.04);group.add(face);
  }
  function hanok(point,angle,w,d,shop){
    const group=groupAt(point,angle),h=2.55+random()*.68;
    foundation(group,point,angle,w+.27,d+.29,mortar,.23);
    create(stone,0,.12,0,w+.34,.38,d+.36,group);
    create(colorFrom([plaster,0xcbbd9f,0xe0d6bd,0xbfb6a4]),0,h/2+.30,0,w,h,d,group);
    const front=d/2;
    for(const x of [-w/2,-w/6,w/6,w/2])create(timber,x,h/2+.31,front+.026,.135,h+.04,.13,group);
    create(timber,0,h+.19,front,w+.15,.18,.14,group);
    create(timber,0,.39,front,w,.14,.14,group);
    windows(group,w-.52,h+.36,front,shop);
    tiledRoof(group,w+1.10,d+1.30,h+.43,1.05+random()*.54);
    if(shop){
      sign(group,colorFrom(fasciaNames),h+.10,front+.13,Math.min(w*.8,2.55));
      create(0x9b8c79,0,.10,front+.51,w*.59,.20,.86,group);
    }else{
      const wall=front+.74,gate=Math.min(1.3,w*.22),margin=(w-gate)/2;
      for(const side of [-1,1]){
        create(mortar,side*(w+gate)/4,.56,wall,margin,1.08,.31,group);
        const face=new T.Mesh(new T.PlaneGeometry(margin,1.05),wallFinish);
        face.position.set(side*(w+gate)/4,.56,wall+.157);
        group.add(material(face,false));
        create(charcoal,side*(w+gate)/4,1.15,wall,margin+.10,.15,.52,group);
      }
      create(darkWood,0,.72,wall,gate,1.42,.12,group);
      for(const side of [-1,1]){
        create(timber,side*(gate/2+.06),.76,wall,.14,1.52,.21,group);
        create(brass,side*.115,.72,wall+.08,.05,.095,.035,group);
      }
      create(charcoal,0,1.52,wall,gate+.35,.18,.67,group);
    }
  }
  function masonryHouse(point,angle,w,d,h,shop=false){
    const group=groupAt(point,angle),wall=colorFrom([brick,0xad9182,0x9c8c78,0xb0a99c,0xd0c5b0]);
    foundation(group,point,angle,w+.12,d+.14,0x807466,.11);
    create(wall,0,h/2,0,w,h,d,group);
    create(0x6f6860,0,h+.14,0,w+.23,.32,d+.21,group);
    const floors=Math.max(1,Math.floor(h/2.72)),front=d/2;
    for(let floor=0;floor<floors;floor++){
      const height=h/floors,base=floor*height;
      const count=Math.ceil(w/(shop&&floor===0?3.6:2.75));
      for(let i=0;i<count;i++){
        const size=w/count,x=(i+.5)*size-w/2;
        create(0x504d47,x,base+height*.55,front+.025,size*.69,height*.58,.09,group);
        create(colorFrom([0x647575,0x7b8988,0x868d83]),x,base+height*.55,front+.083,size*.59,height*.46,.038,group);
        create(0x51463a,x,base+height*.55,front+.106,.055,height*.46,.034,group);
        create(0xbcb1a0,x,base+height*.25,front+.075,size*.74,.11,.16,group);
      }
    }
    if(shop)sign(group,colorFrom(fasciaNames),Math.min(2.65,h-.3),front+.15,Math.min(w*.75,3.8));
  }
  const foliageGeo=new T.IcosahedronGeometry(1,1);
  function foundation(group,point,angle,w,d,color,top){
    const sine=Math.sin(angle),cosine=Math.cos(angle);
    let bottom=point.level-1;
    for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){
      bottom=Math.min(bottom,bukchonTerrain(point.x+x*cosine+z*sine,point.y-x*sine+z*cosine)-.8);
    }
    const height=point.level+top-bottom;
    create(color,0,top-height/2,0,w,height,d,group);
  }
  function tree(point,height,autumn){
    const group=groupAt(point),leaf=matte(autumn?0xc48f49:0x62794e);
    const bottom=.8;
    const mesh=cylinder(0x66564a,0,height*.45-bottom/2,0,height*.046,height*.9+bottom,7,group,.55);
    material(mesh);
    for(let i=0;i<6;i++){
      const angle=i*2.4,r=height*(.13+random()*.14),spread=height*(.19+random()*.10);
      const crown=new T.Mesh(foliageGeo,leaf);
      crown.position.set(Math.cos(angle)*r,height*(.59+random()*.33),Math.sin(angle)*r);
      crown.scale.set(spread,spread*.75,spread);group.add(material(crown));
    }
  }
  yield* buildMmca(T,root,kit,tiledRoof);
  const limits={alley:15,lane:21,pavement:33};
  const occupied=[
    ...Object.values(bukchonShopPlots).map(({x,y,w,d})=>({x,y,radius:Math.hypot(w,d)/2+1.4})),
    ...bikeDocks.filter(dock=>dock.area==="bukchon").map(({x,y})=>({x,y,radius:4.6})),
    ...["bukchon-upper","bukchon-terminal"].map(id=>({...busStopById(id).shelter,radius:5.5})),
    ...bukchonStreetTrees.map(([x,y])=>({x,y,radius:3.5})),
    ...bukchonLawns.map(({outline})=>{
      const middle={x:outline.reduce((sum,p)=>sum+p.x,0)/outline.length,y:outline.reduce((sum,p)=>sum+p.y,0)/outline.length};
      return {...middle,radius:Math.max(...outline.map(p=>distance(p,middle)))+3};
    })
  ];
  const closeToStreet=(point,radius)=>{
    for(const path of bukchonPaths){
      if(point.x<path.minX-radius||point.x>path.maxX+radius||point.y<path.minY-radius||point.y>path.maxY+radius)continue;
      for(const {a,dx,dy,squared} of path.segments){
        const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/squared));
        if(Math.hypot(point.x-a.x-dx*t,point.y-a.y-dy*t)<path.width/2+radius)return true;
      }
    }
    return false;
  };
  for(const path of bukchonPaths){
    if(!limits[path.kind]||path.name==="경복궁 동쪽 담장길"||path.name==="광화문 동편 인도")continue;
    const sides=path.kind==="pavement"?[1]:[-1,1];
    for(const side of sides)for(const {a,b} of path.segments){
      const length=distance(a,b),angle=direction(a,b);
      const lots=Math.max(1,Math.round(length/limits[path.kind]));
      for(let i=0;i<lots;i++){
        const roadPoint=mix(a,b,(i+.52)/lots),urban=path.kind==="pavement";
        // The curb opposite the palace and the north side of Yulgok-ro have storefronts.
        const offsetSide=path.name==="율곡로 북쪽 인도"?-side:side;
        const w=urban?9+random()*6:4.5+random()*3.7,d=urban?7+random()*4:4.6+random()*2.6;
        const radius=Math.hypot(w/2+.42,d/2+1.10),point=apart(roadPoint,angle,offsetSide*(path.width/2+radius+1.08));
        if(point.x<735||point.y< -1878||point.x>1155||mmcaReserved(point.x,point.y,radius))continue;
        if(closeToStreet(point,radius)||occupied.some(lot=>distance(point,lot)<(radius+lot.radius)*.81))continue;
        occupied.push({...point,radius});
        point.level=bukchonTerrain(point.x,point.y);
        const facing=angle+(offsetSide===1?Math.PI:0);
        if(urban&&random()<.67)masonryHouse(point,facing,w,d,4.8+random()*7.4,true);
        else hanok(point,facing,w,d,urban||path.name==="팔판길"&&random()<.48);
        if(random()<.18){
          const shrub=apart(point,angle,offsetSide*(d*.54+1.85));
          shrub.level=bukchonTerrain(shrub.x,shrub.y);
          if(!closeToStreet(shrub,2.4))tree(shrub,3.7+random()*2.4,random()>.36);
        }
      }
    }
    yield;
  }
  // Low off-street blocks keep the sightlines around the real walking routes urban,
  // with the greener spaces around the library and the Folk Museum left open.
  const blocks=[
    [789,-1020,94,130],[842,-1136,94,77],[845,-1325,101,94],[913,-1494,82,64],
    [875,-1578,62,67],[901,-1730,73,102],[1097,-1774,82,100],
    [1067,-1095,91,120],[1050,-1241,97,117],[1051,-1407,110,98],
    [1091,-1550,96,119],[1090,-1667,83,58]
  ];
  for(const [x,y,w,d] of blocks){
    for(let z=-d/2+13;z<d/2;z+=22)for(let offset=-w/2+12;offset<w/2;offset+=22){
      const point={x:x+offset+random()*5,y:y+z+random()*5};
      if(point.x>1135||mmcaReserved(point.x,point.y,11)||closeToStreet(point,10)||occupied.some(lot=>distance(point,lot)<lot.radius+8))continue;
      if((point.x>863&&point.x<937&&point.y< -1478&&point.y> -1608)||random()<.18)continue;
      const width=8+random()*7,depth=7+random()*7,h=4+random()*7,angle=(random()-.5)*.43;
      occupied.push({...point,radius:Math.hypot(width,depth)/2});
      point.level=bukchonTerrain(point.x,point.y);
      const group=groupAt(point,angle);
      const wall=colorFrom([brick,0xa58c7b,0xbdb5a7,0xc7c0b5,0x97968b]);
      foundation(group,point,angle,width,depth,wall,-.54);
      create(wall,0,h/2-.27,0,width,h+.55,depth,group);
      create(colorFrom([0x746760,0x64615c,0x8c8881]),0,h+.025,0,width+.27,.15,depth+.22,group);
      create(0xa6a095,-width*.22,h+.52,-depth*.24,width*.29,.93,depth*.27,group);
      for(let floor=1;floor<h;floor+=2.5){
        for(const sign of [-1,1]){
          create(0x646c6a,0,floor,sign*(depth/2+.03),width*.68,.69,.09,group);
          create(wall,0,floor,sign*(depth/2+.065),width*.047,.75,.04,group);
        }
      }
    }
    yield;
  }
  // Additional park greenery stands between the avenues rather than inside the alley.
  for(const [x,y,h] of bukchonStreetTrees)tree({x,y,level:bukchonTerrain(x,y)},h,true);
  for(const [x,y,h] of [[795,-1351,7],[857,-1405,8.5],[895,-1552,8.6],[915,-1601,7.9],[926,-1650,8],
    [824,-1536,6.3],[876,-1676,7.2],[950,-1738,8.3],[1089,-1748,7.4],[1081,-1822,7.8],
    [747,-1359,6.3],[748,-1411,8.2],[736,-1528,7.1],[754,-1571,8.6],[771,-1633,7.5]]){
    const point={x,y,level:bukchonTerrain(x,y)-.05};
    if(!mmcaReserved(x,y,h*.45)&&!closeToStreet(point,h*.57)&&!occupied.some(lot=>distance(point,lot)<lot.radius+h*.29))tree(point,h,random()>.26);
  }
  const mainWalk=bukchonPaths[2],lights=0x3b4546;
  for(const {a,b} of mainWalk.segments){
    const n=Math.max(1,Math.round(distance(a,b)/32));
    const angle=direction(a,b);
    for(let i=0;i<n;i++){
      const p=apart(mix(a,b,(i+.48)/n),angle,3.42);
      if(Math.abs(p.y-folkMuseumEastDoor.y)<4.5||mmcaReserved(p.x,p.y))continue;
      const group=groupAt(p,angle);
      material(cylinder(lights,0,1.63,0,.051,3.26,7,group,.75));
      create(lights,0,3.20,-.28,.085,.07,.60,group);
      create(0xd3cbb6,0,3.17,-.58,.28,.095,.27,group);
      create(lights,0,3.24,-.58,.30,.08,.28,group);
    }
  }
  const entrance=groupAt({...folkMuseumEastDoor,level:bukchonGroundHeight(folkMuseumEastDoor)??0},Math.PI/2);
  for(const x of [-3.48,3.48]){
    create(stone,x,.81,0,.56,1.62,.52,entrance);
    create(charcoal,x,1.68,0,.71,.15,.65,entrance);
  }
  const museumSign={x:folkMuseumEastDoor.x+2.8,y:folkMuseumEastDoor.y+4.9};
  const visitorSign=groupAt({...museumSign,level:bukchonGroundHeight(museumSign)??entrance.position.y},Math.PI/2);
  create(0x605950,0,.72,-.025,.15,1.5,.11,visitorSign);
  sign(visitorSign,"국립민속박물관",1.53,.03,1.94);
  const stairFoot={x:941,y:-1839};
  const stairSign=groupAt({x:944.6,y:-1836.1,level:bukchonGroundHeight(stairFoot)??bukchonTerrain(stairFoot.x,stairFoot.y)},-Math.PI/2);
  create(0x605950,0,.72,-.025,.15,1.5,.11,stairSign);
  sign(stairSign,"북촌 8경 · 돌계단길",1.53,.03,2.04);
  // A wooded rise beyond the terminal hides the distant edge of the ground apron.
  for(let row=0;row<3;row++)for(let index=0;index<15;index++){
    const x=787+index*21+(row%2)*9+(random()-.5)*7,y=-1932-row*28+(random()-.5)*15;
    const mainRoad=951+(y+1903)*-.73;
    if(Math.abs(mainRoad-x)<14&&y> -1995)continue;
    tree({x,y,level:bukchonTerrain(x,y)},6+random()*5,row===0&&index%3===0);
  }
  yield;
}
