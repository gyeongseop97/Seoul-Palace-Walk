import {gradePalaceMeshes,palaceMeshHeight} from "./gyeongbok-terrain.js";
import {
  route,entranceWalk,pavilions,city,estateOutline,stonewallVerge,palacePaths,palaceCourts,palaceGardens,palacePlantings,palacePond,palaceWalls,
  gate,ticket,ticketGuide,ticketForecourt,bridge,middle,hall,stoneHall,stoneFountain,court,courtAngle,fountain,garden,spawn,addObstacle,solidAt,withObstacleScope
} from "./layout.js";
import {buildWestern} from "./western.js";
import {fromBuilding,pavilionStairAccess} from "./museum.js";
import {standPlantingFootprints} from "./street-stands.js";
import {diningVenues} from "./dining-data.js";
import {makePalaceClearance} from "./palace-plantings.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {tickWater} from "./water-shader.js";
import {buildPalacePond} from "./palace-pond-model.js";
import {buildGyeongbok,buildSubwayExit} from "./gyeongbok.js";
import {cityHallStation,cityHallExit3} from "./gyeongbok-layout.js";
import {gyeongbokObstacles,gyeongbokBenches} from "./gyeongbok-obstacles.js";
import {furnishHall} from "./palace-interiors.js";
import {makeStreetSurfaceCut} from "./street-surface-cuts.js";
import {makePavingMaterial,pavingRepeat} from "./palace-paving.js";
// Rooms people can walk into, for the lighting: centre (map), size, turn and floor height.
export const hallRooms=[];

export function buildJeongdong(T,scene,kit,{deferGyeongbok=false}={}) {
  const {wx,wz,matte}=kit;
  let target=scene,activeRand=kit.rand,drawBenchesOnly=false;
  const rand=()=>activeRand();
  const box=(color,x,y,z,w,h,d,parent=target)=>kit.box(color,x,y,z,w,h,d,parent);
  const cylinder=(color,x,y,z,r,h,sides=12,parent=target,top=1)=>kit.cylinder(color,x,y,z,r,h,sides,parent,top);
  const shape=(geometry,color,x,y,z,parent=target)=>kit.shape(geometry,color,x,y,z,parent);
  const benches=[],trees=[],catWalls=[];
  const treeClearance=makePalaceClearance(T);
  const autumn=[0xe9b940,0xd6a736,0xc99728,0xffcb52,0xba8731,0xe5a943];
  const leaf=new T.IcosahedronGeometry(1,1);
  const up=new T.Vector3(0,1,0);
  const singleLeaf=new T.PlaneGeometry(1,1);
  const buildingPlots=[
    ...standPlantingFootprints,
    ...diningVenues.filter(venue=>venue.area==="jeongdong").map(({plot})=>({...plot,w:plot.w+1,d:plot.d+1,h:4.6})),
    ...city.slice(1).map(spec=>({...spec,w:spec.w+.5,d:spec.d+.5})),
    ...pavilions.map(spec=>({...spec,w:spec.w+2.7,d:spec.d+2.5,h:spec.h+2.8})),
    {...gate,w:16.7,d:10.46,h:7.4,angle:Math.PI/2},
    {...ticket,w:ticket.w+.82,d:ticket.d+.88,h:4.2},
    {...middle,w:13.4,d:9.26,h:6.6,angle:courtAngle},
    {...hall,w:21.1,d:19.96,h:10.4,angle:courtAngle},
    {...stoneHall,w:55.2,d:21.8,h:15.6}
  ].map(spec=>({...spec,c:Math.cos(spec.angle??0),s:Math.sin(spec.angle??0)}));
  const placed=(point)=>({x:wx(point.x),z:wz(point.y)});
  const block=(x,z,w,d,angle=0,top)=>addObstacle(x+300,z+225,w,d,angle,top);
  function blockLocal(site,x,z,w,d,top){
    const position=fromBuilding(site,x,z);
    addObstacle(position.x,position.y,w,d,site.angle??0,top);
  }
  const orient=(object,angle)=>{object.rotation.y=angle;return object;};
  const flat=(geometry,material,x,y,z)=>{
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(x,y,z);target.add(mesh);return mesh;
  };
  function grain(colors,{stones=false,red=false,random=rand}={}) {
    const canvas=document.createElement("canvas");
    canvas.width=512;canvas.height=256;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle=colors[0];ctx.fillRect(0,0,512,256);
    if(stones){
      for(let row=0;row<6;row++)for(let j=-1;j<10;j++){
        const x=j*55+row%2*24,y=row*43;
        ctx.fillStyle=colors[1+(row*7+(j+10)*3)%(colors.length-1)];
        ctx.beginPath();
        ctx.moveTo(x+2,y+8);ctx.lineTo(x+10,y+2);ctx.lineTo(x+50,y+2);
        ctx.lineTo(x+54,y+8);ctx.lineTo(x+53,y+34);ctx.lineTo(x+48,y+40);
        ctx.lineTo(x+7,y+40);ctx.lineTo(x+2,y+34);ctx.fill();
        ctx.fillStyle=red?"#d49b822e":"#f9e5c449";ctx.fillRect(x+9,y+3,38,2);
        ctx.fillStyle="#24252648";ctx.fillRect(x+6,y+37,43,3);
      }
    }
    const pixels=ctx.getImageData(0,0,512,256);
    for(let i=0;i<pixels.data.length;i+=4){
      const variation=(random()-.5)*(stones?29:22);
      for(let c=0;c<3;c++)pixels.data[i+c]+=variation;
    }
    ctx.putImageData(pixels,0,0);
    const tex=new T.CanvasTexture(canvas);
    tex.wrapS=tex.wrapT=T.RepeatWrapping;
    tex.colorSpace=T.SRGBColorSpace;
    tex.anisotropy=4;
    return tex;
  }
  const wallMap=grain(["#504c45","#9f9a89","#9b988d","#a5a194","#908b81","#817e74"],{stones:true});
  const brickMap=grain(["#82746a","#a1644d","#aa6b55","#9a5d48","#ac6c51"],{stones:true,red:true});
  const stoneFloor=grain(["#938d7b","#b5ad9a","#b9b09c","#b1ab9d","#bfb8a8"],{stones:true});
  const groundMap=grain(["#9b9688"]);
  let groundSeed=87149;
  function groundNoise(){groundSeed=(Math.imul(groundSeed,1664525)+1013904223)>>>0;return groundSeed/4294967296;}
  function courtyardStone(){
    const canvas=document.createElement("canvas");canvas.width=512;canvas.height=256;
    const ctx=canvas.getContext("2d"),colors=["#a8a598","#bab5a6","#b5b3a6","#afa99a","#c0bbad","#a6a396"];
    const cols=6,rows=4;
    const corners=Array.from({length:cols*rows},()=>[groundNoise()*25-12.5,groundNoise()*14-7]);
    function corner(col,row){
      const [dx,dy]=corners[(row+rows)%rows*cols+(col+cols)%cols];
      return [col*canvas.width/cols+dx,row*canvas.height/rows+dy];
    }
    ctx.fillStyle="#a18b6a";ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let row=-1;row<=rows;row++)for(let col=-1;col<=cols;col++){
      const vertices=[corner(col,row),corner(col+1,row),corner(col+1,row+1),corner(col,row+1)];
      const cx=vertices.reduce((sum,p)=>sum+p[0],0)/4,cy=vertices.reduce((sum,p)=>sum+p[1],0)/4;
      ctx.fillStyle=colors[((row+rows)%rows*11+(col+cols)%cols*5)%colors.length];ctx.beginPath();
      vertices.forEach(([x,y],index)=>{
        const [px,py]=vertices[(index+3)%4],[nx,ny]=vertices[(index+1)%4];
        const fx=x+(px-x)*.055,fy=y+(py-y)*.055;
        ctx[index?"lineTo":"moveTo"](fx+(cx-fx)*.033,fy+(cy-fy)*.045);
        const tx=x+(nx-x)*.073,ty=y+(ny-y)*.073;
        ctx.lineTo(tx+(cx-tx)*.033,ty+(cy-ty)*.045);
      });ctx.fill();
    }
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    for(let i=0;i<pixels.data.length;i+=4){
      const noise=(groundNoise()-.5)*21;
      for(let channel=0;channel<3;channel++)pixels.data[i+channel]+=noise;
    }
    ctx.putImageData(pixels,0,0);
    const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.055,roughness:.96});
  }
  const courtStoneMaterial=courtyardStone();
  const royalWay=makePavingMaterial(T,"samdo"),terraceStone=makePavingMaterial(T,"royal");
  const gravelMaterial=new T.MeshStandardMaterial({map:grain(["#b8a78e"],{random:groundNoise}),roughness:1});
  const asphalt=grain(["#747670"]);
  const gardenMaterials={
    lawn:new T.MeshStandardMaterial({map:grain(["#677849"]),roughness:1}),
    grove:new T.MeshStandardMaterial({map:grain(["#656e4a"]),roughness:1}),
    parterre:new T.MeshStandardMaterial({map:grain(["#738254"]),roughness:1})
  };
  // The painted joints double as a height map, so stones catch the light with a little relief.
  const stoneMaterial=new T.MeshStandardMaterial({map:wallMap,bumpMap:wallMap,bumpScale:1.6,roughness:.93});
  const pavingMaterial=new T.MeshStandardMaterial({map:stoneFloor,bumpMap:stoneFloor,bumpScale:.9,roughness:.91});
  const roadMaterial=new T.MeshStandardMaterial({map:asphalt,roughness:1});
  const earthMaterial=new T.MeshStandardMaterial({map:groundMap,roughness:1});
  gardenMaterials.lawn.userData.seasonFoliage="ground";
  const brickMaterial=new T.MeshStandardMaterial({map:brickMap,bumpMap:brickMap,bumpScale:1.2,roughness:.89});
  const wallWalkMap=grain(["#817a70","#9e8271","#9a887d","#a08c80","#a48b77","#a09285"],
    {stones:true,red:true,random:groundNoise});
  const wallWalkMaterial=new T.MeshStandardMaterial({map:wallWalkMap,bumpMap:wallWalkMap,bumpScale:.46,roughness:.94});
  function uvScale(mesh,u,v){
    const uv=mesh.geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*u,uv.getY(i)*v);
    return mesh;
  }
  function paved(x,z,w,d,y=.024,angle=0,material=pavingMaterial){
    const surface=flat(new T.PlaneGeometry(w,d),material,x,y,z);
    surface.rotation.order="YXZ";surface.rotation.set(-Math.PI/2,angle,0);
    uvScale(surface,w/6,d/2.5);
    surface.userData.followTerrain=true;
    return surface;
  }
  const floor=box(0x677253,0,-.36,0,1320,.65,1140);
  floor.userData.flatBackground=true;
  floor.receiveShadow=true;
  function plots(pieces,material,height,turn=0){
    const footprints=pieces.map(points=>new T.Shape(points.map(point=>new T.Vector2(point.x,-point.y))));
    const geometry=new T.ShapeGeometry(footprints);
    // Shape coordinates are east and north. Unrotate into the hall's local grid.
    const uv=geometry.attributes.uv,c=Math.cos(turn),s=Math.sin(turn);
    for(let i=0;i<uv.count;i++){
      const x=uv.getX(i),north=uv.getY(i);
      uv.setXY(i,(x*c+north*s)*.19,(-x*s+north*c)*.19);
    }
    const surface=flat(geometry,material,0,height,0);
    surface.rotation.x=-Math.PI/2;
    surface.userData.followTerrain=true;
    return surface;
  }
  const plot=(points,material,height)=>plots([points.map(point=>({x:wx(point.x),y:wz(point.y)}))],material,height);
  function ribbon(points,min,max,material,height,higherRibbons){
    const coords=[],uv=[],indices=[];
    let metres=0;
    const last=points.length-1,closed=points[0]===points[last];
    for(let i=0;i<points.length;i++){
      const p=points[i],a=points[i===0&&closed?last-1:Math.max(0,i-1)],b=points[i===last&&closed?1:Math.min(last,i+1)];
      if(i)metres+=Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y);
      const length=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=(b.y-a.y)/length,nz=-(b.x-a.x)/length;
      for(const offset of [min,max]){
        coords.push(wx(p.x)+nx*offset,height,wz(p.y)+nz*offset);
        if(material===royalWay)uv.push((offset-min)/(max-min),metres/pavingRepeat("samdo"));
        else uv.push(metres/5,(offset-min)/2.5);
      }
      if(i){const j=i*2;indices.push(j-2,j,j-1,j-1,j,j+1);}
    }
    if(higherRibbons){
      const outline=[];
      for(let i=0;i<coords.length;i+=3)outline.push({x:coords[i],y:coords[i+2]});
      const cut=makeStreetSurfaceCut(T,higherRibbons);
      const pieces=[];
      for(let i=2;i<outline.length;i+=2){
        const segment=[outline[i-2],outline[i],outline[i+1],outline[i-1]];
        pieces.push(...cut(segment));
        higherRibbons.push(segment);
      }
      if(pieces.length)return plots(pieces,material,height);
      return;
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute("position",new T.Float32BufferAttribute(coords,3));
    geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
    if(geo.attributes.normal.getY(0)<0){geo.setIndex(indices.reverse());geo.computeVertexNormals();}
    const surface=flat(geo,material,0,0,0);
    surface.userData.followTerrain=true;
    return surface;
  }
  const curb=matte(0xc5bcaa),stonewallCurb=matte(0x696a63),gold=matte(0xc5a35a);
  ribbon(route,-2.85,2.85,roadMaterial,.012);
  ribbon(route,-5.30,-2.85,wallWalkMaterial,.044);
  ribbon(route,2.85,5.36,wallWalkMaterial,.045);
  ribbon(route,-2.95,-2.78,stonewallCurb,.060);
  ribbon(route,2.78,2.95,stonewallCurb,.060);
  ribbon(route,-2.65,-2.57,gold,.020);
  ribbon(route,2.57,2.65,gold,.020);
  // Keep the entrance paving above the adjoining avenue pavement where their footprints meet.
  ribbon(entranceWalk,-7.2,7.2,pavingMaterial,.054);
  plot(estateOutline,earthMaterial,.008);
  plot(stonewallVerge,gardenMaterials.lawn,.010);
  for(const {outline,kind} of palaceGardens)plot(outline,gardenMaterials[kind],.017);
  const royalEnd=fromBuilding({...hall,angle:courtAngle},-.25,29.06);
  const royalAxis=[middle,royalEnd],halfWay=2.7;
  const dx=royalEnd.x-middle.x,dy=royalEnd.y-middle.y,len=Math.hypot(dx,dy);
  const rim=(p,sign)=>({x:wx(p.x)+sign*dy/len*halfWay,y:wz(p.y)-sign*dx/len*halfWay});
  const roadOutline=[rim(middle,-1),rim(royalEnd,-1),rim(royalEnd,1),rim(middle,1)];
  const cutRoyalWay=makeStreetSurfaceCut(T,[roadOutline]);
  for(const {name,outline,kind} of palaceCourts){
    if(name==="중화전 마당"){
      plots(cutRoyalWay(outline.map(p=>({x:wx(p.x),y:wz(p.y)}))),courtStoneMaterial,.022,courtAngle);
    }else plot(outline,kind==="stone"?pavingMaterial:gravelMaterial,.022);
  }
  ribbon(royalAxis,-halfWay,halfWay,royalWay,.050);
  // Keep the existing path priority at forks while giving each point only one path surface.
  const palacePathCoverage=[roadOutline];
  for(const {points,width,surface,edge} of palacePaths.slice().reverse()){
    const half=width/2,height=.039;
    ribbon(points,-half,half,surface==="stone"?pavingMaterial:gravelMaterial,height,palacePathCoverage);
    if(edge){
      ribbon(points,-half-.12,-half+.02,curb,height+.022);
      ribbon(points,half-.02,half+.12,curb,height+.022);
    }
  }
  const s=placed(spawn),forecourt=placed(ticketForecourt);
  paved(forecourt.x,forecourt.z,ticketForecourt.width,ticketForecourt.depth,.025);

  function line(a,b){
    const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);
    return {len,angle,at(t,o=0){return{x:wx(a.x)+dx*t+dz/len*o,z:wz(a.y)+dz*t-dx/len*o};}};
  }
  function wall(a,b,height,tiles,catAccess){
    const segment=line(a,b),mid=segment.at(.5),width=segment.len+(tiles?.46:.24);
    const wallMesh=flat(new T.BoxGeometry(width,height,.55),stoneMaterial,mid.x,height/2,mid.z);
    uvScale(wallMesh,segment.len/5.1,height/2.55);
    orient(wallMesh,segment.angle);
    wallMesh.userData.followTerrain=true;
    for(const [color,y,w,h,d] of [[0x898678,.18,width+.08,.35,.72],
      [0x39413d,height+.08,width+.06,.20,.85],[0x4e5554,height+.22,width+.07,.13,.62]]){
      const course=orient(box(color,mid.x,y,mid.z,w,h,d),segment.angle);
      course.userData.followTerrain=true;course.userData.sharedTerrainGeometry=true;
    }
    const capHeight=height+(tiles?.382:.285);
    block(mid.x,mid.z,width,.62,segment.angle,capHeight);
    if(catAccess&&segment.len>4){
      const toMap=({x,z})=>({x:x+300,y:z+225});
      catWalls.push({a:toMap(segment.at(0)),b:toMap(segment.at(1)),
        height:capHeight,sides:tiles?[1]:[1,-1]});
    }
    if(!tiles)return;
    const count=Math.ceil(segment.len/.46);
    for(let i=0;i<count;i++){
      const p=segment.at((i+.5)/count);
      const tile=cylinder(i%6===0?0x5d6663:0x3d494b,p.x,height+.28,p.z,.102,.91,6);
      tile.rotation.order="YXZ";tile.rotation.set(Math.PI/2,segment.angle,0);
    }
  }
  function coveredWall(a,b,height){
    const segment=line(a,b),mid=segment.at(.5),width=segment.len+.08;
    const support=flat(new T.BoxGeometry(width,.64,.63),stoneMaterial,mid.x,.32,mid.z);
    orient(uvScale(support,width/5.1,.28),segment.angle);
    support.userData.followTerrain=true;
    for(const [color,y,h,d] of [
      [0x967458,height/2+.23,height-.43,.34],[0x80513c,height-.30,.19,.48],
      [0x485250,height+.04,.25,.92],[0x52615d,height+.21,.17,.51]
    ]){
      const beam=orient(box(color,mid.x,y,mid.z,width,h,d),segment.angle);
      beam.userData.followTerrain=true;beam.userData.sharedTerrainGeometry=true;
    }
    const count=Math.max(2,Math.ceil(segment.len/2.6));
    for(let i=0;i<=count;i++){
      const {x,z}=segment.at(i/count);
      orient(box(0x86523c,x,height/2+.06,z,.18,height+.12,.49),segment.angle);
    }
    block(mid.x,mid.z,width,.62,segment.angle,height+.30);
  }
  for(const {a,b,height,kind,tiles} of palaceWalls){
    if(kind==="corridor")coveredWall(a,b,height);
    else wall(a,b,height,tiles,tiles||kind==="court");
  }

  function shade(x,z,rx,rz){
    const canvas=shade.canvas||(shade.canvas=(()=>{
      const c=document.createElement("canvas");c.width=c.height=48;
      const c2=c.getContext("2d"),g=c2.createRadialGradient(24,24,3,24,24,24);
      g.addColorStop(0,"rgba(24,34,23,0.30)");g.addColorStop(.55,"rgba(30,39,28,0.14)");
      g.addColorStop(1,"rgba(30,39,28,0)");c2.fillStyle=g;c2.fillRect(0,0,48,48);return c;
    })());
    if(!shade.material)shade.material=new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false});
    const shadow=flat(new T.PlaneGeometry(rx*2,rz*2),shade.material,x+rx*.38,.081,z+rz*.34);
    shadow.rotation.x=-Math.PI/2;
    shadow.userData.followTerrain=true;
  }
  function buildingClear(x,z,radius,base=0){
    return buildingPlots.every(plot=>{
      if(base>=plot.h)return true;
      const dx=x+300-plot.x,dz=z+225-plot.y;
      const gapX=Math.max(0,Math.abs(dx*plot.c-dz*plot.s)-plot.w/2);
      const gapZ=Math.max(0,Math.abs(dx*plot.s+dz*plot.c)-plot.d/2);
      return gapX*gapX+gapZ*gapZ>=radius*radius;
    });
  }
  function treeFits(x,z,height){
    const mapX=x+300,mapY=z+225,clearance=height*.135+.18;
    if(solidAt(mapX,mapY)||!buildingClear(x,z,clearance+.26)||!treeClearance.rootFits(x,z,clearance)||
       trees.some(tree=>Math.hypot(x-tree.x,z-tree.z)<Math.max(4.1,(height+tree.height)*.23)))return false;
    for(let i=0;i<16;i++){
      const angle=i*Math.PI/8,dx=Math.cos(angle)*clearance,dz=Math.sin(angle)*clearance;
      if(solidAt(mapX+dx,mapY+dz)||solidAt(mapX+dx*.5,mapY+dz*.5))return false;
    }
    return true;
  }
  const treeKit=makeTreeBuilder(T,{add:object=>target.add(object)},{clearance:treeClearance,rand,
    fits:(x,y,z,radius)=>buildingClear(x,z,radius*1.15,y-radius*.9)});
  const weighted=options=>{
    let roll=rand()*options.reduce((sum,[weight])=>sum+weight,0);
    for(const [weight,value] of options)if((roll-=weight)<=0)return value;
    return options.at(-1)[1];
  };
  const pickOf=list=>list[Math.floor(rand()*list.length)];
  // Autumn in Jeongdong: ginkgo gold along the wall, maples and still-green crowns inside the palace.
  const treeMix={
    avenue:()=>({style:pickOf(["cone","column","cloud","round","cone"]),
      palette:weighted([[58,"ginkgo"],[14,"amber"],[10,"maple"],[10,"fresh"],[8,"olive"]])}),
    garden:()=>{
      const palette=weighted([[20,"fresh"],[17,"deep"],[9,"pine"],[15,"ginkgo"],[12,"amber"],[15,"maple"],[6,"russet"],[6,"olive"]]);
      return {palette,style:palette==="pine"?pickOf(["branchy","cone"]):pickOf(["cloud","branchy","cone","ball","round","column","round","cloud"])};
    },
    edge:()=>({style:pickOf(["round","cloud","cone","branchy","ball"]),
      palette:weighted([[30,"deep"],[26,"fresh"],[12,"pine"],[14,"olive"],[10,"amber"],[8,"ginkgo"]])}),
    specimen:kind=>({
      pine:{style:"branchy",palette:"pine"},
      ginkgo:{style:pickOf(["cone","column"]),palette:"ginkgo"},
      zelkova:{style:pickOf(["round","cloud"]),palette:pickOf(["amber","olive","deep"])},
      maple:{style:"cloud",palette:"maple"}
    })[kind]
  };
  function scatterLeaves(x,z,reach,colors){
    const count=9+Math.floor(rand()*8);
    for(let i=0;i<count;i++){
      const angle=rand()*6.283,radius=reach*(.25+rand()*1.05);
      const px=x+Math.cos(angle)*radius,pz=z+Math.sin(angle)*radius;
      if(solidAt(px+300,pz+225))continue;
      const item=shape(singleLeaf,colors[i%colors.length],px,.078,pz);
      item.rotation.set(-Math.PI/2,0,rand()*6.28);
      item.scale.set(.07+rand()*.09,.05+rand()*.07,1);
    }
  }
  function tree(x,z,height,choice=treeMix.garden(),spread=height*(.52+rand()*.2)){
    const grown=treeKit.grow(x,z,{height,spread,...choice,terrainAnchor:{x:x+300,y:z+225}});
    if(!grown)return 0;
    trees.push({x,z,height,top:grown.top});
    block(x,z,grown.radius*2.2,grown.radius*2.2,0,height*.5);
    shade(x,z,grown.reach*1.05,grown.reach*.92);
    if(grown.autumn)scatterLeaves(x,z,grown.reach,grown.leaf);
    return grown.radius;
  }
  function contains(points,x,y){
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[i],b=points[j];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  }
  function pathClear(points,x,y,clearance){
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
      if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<clearance)return false;
    }
    return true;
  }
  function awayFromPaths(x,y,clearance){
    return palacePaths.every(({points,width})=>pathClear(points,x,y,width/2+clearance));
  }
  function plantAvenue(){
    const shifts=[0,-2.1,2.1,-4.2,4.2,-6.3,6.3,-8.4,8.4];
    for(let i=1;i<route.length;i++){
      const street=line(route[i-1],route[i]);
      const count=Math.ceil(street.len/12);
      for(let j=0;j<count;j++){
        const palaceSide=(i+j)%3===0;
        const offsets=palaceSide?[-7.6,-9.1,6.05,7.5]:[6.05,7.5,-7.6,-9.1];
        const height=6.8+rand()*4.1;
        let planted=false;
        for(const offset of offsets){
          for(const shift of shifts){
            const t=(j+.4)/count+shift/street.len;
            if(t<.04||t>.96)continue;
            const {x,z}=street.at(t,offset);
            if(!pathClear(route,x+300,z+225,5.3)||!awayFromPaths(x+300,z+225,1)||!treeFits(x,z,height))continue;
            if(tree(x,z,height,treeMix.avenue())){planted=true;break;}
          }
          if(planted)break;
        }
      }
    }
  }
  function plantGardens(){
    for(const specimen of palacePlantings){
      const {point,height,spread,kind}=specimen,{x,z}=placed(point);
      if(!treeFits(x,z,height)||!awayFromPaths(point.x,point.y,.65))continue;
      tree(x,z,height,treeMix.specimen(kind),spread);
    }
    for(const {outline,kind} of palaceGardens){
      const xs=outline.map(p=>p.x),ys=outline.map(p=>p.y);
      const minX=Math.min(...xs),minY=Math.min(...ys);
      const w=Math.max(...xs)-minX,d=Math.max(...ys)-minY;
      const spots=[];
      const maxTrees=kind==="grove"?Math.min(7,Math.floor(w*d/140)):kind==="lawn"?2:0;
      for(let i=0;i<maxTrees*5&&spots.length<maxTrees;i++){
        const x=minX+rand()*w,y=minY+rand()*d;
        const height=5.5+rand()*5;
        if(!contains(outline,x,y)||!treeFits(wx(x),wz(y),height)||!awayFromPaths(x,y,1.4)||
           spots.some(spot=>Math.hypot(spot.x-x,spot.y-y)<5))continue;
        if(tree(wx(x),wz(y),height,treeMix.garden()))spots.push({x,y});
      }
      if(kind==="parterre"||kind==="grove"){
        for(let i=0;i<outline.length;i++){
          const a=outline[i],b=outline[(i+1)%outline.length],edge=line(a,b);
          const count=Math.floor(edge.len/(kind==="parterre"?1.7:3.2));
          for(let j=0;j<count;j++){
            const {x,z}=edge.at((j+.50)/count);
            if(solidAt(x+300,z+225)||!awayFromPaths(x+300,z+225,.47))continue;
            treeKit.shrub(x,z,.53+rand()*.45,weighted([[40,"deep"],[34,"fresh"],[14,"olive"],[7,"maple"],[5,"amber"]]));
          }
        }
      }
    }
  }
  let waterMaterial;
  function addPond(){
    waterMaterial=buildPalacePond(T,palacePond,{plot,matte,lawn:gardenMaterials.lawn,placed,line,rand,
      decorate(color,x,y,z,w,h,d,angle){
        const mesh=shape(leaf,color,x,y,z);mesh.scale.set(w,h,d);mesh.rotation.y=angle;
      }});
    return (clock,night)=>tickWater([waterMaterial],clock,night);
  }
  for(let i=1;i<route.length;i++){
    const street=line(route[i-1],route[i]);
    for(let j=0;j<Math.ceil(street.len*2.4);j++){
      const side=j%2===0?1:-1,p=street.at(rand(),side*(3.2+rand()*1.9));
      const item=shape(singleLeaf,autumn[j%autumn.length],p.x,.075,p.z);
      item.rotation.set(-Math.PI/2,0,rand()*6.28);
      item.scale.set(.053+rand()*.075,.037+rand()*.068,1);
    }
  }

  function bench(x,z,angle=0){
    const group=new T.Group();group.position.set(x,0,z);group.rotation.y=angle;target.add(group);
    for(let i=0;i<4;i++)box(0x85593b,0,.47,(i-1.5)*.114,2.18,.075,.105,group);
    for(let i=0;i<3;i++)box(0x976648,0,.62+i*.116,-.24,2.18,.083,.077,group);
    for(const side of [-1,1]){
      box(0x384747,side*.83,.23,0,.088,.48,.58,group);
      box(0x43504b,side*.83,.66,-.25,.077,.71,.092,group);
      box(0x44514d,side*1.06,.66,.021,.071,.075,.44,group);
    }
    // Seat and backrest collide separately so a jump can land on the seat.
    block(x,z,2.21,.61,angle,.52);
    block(x-.24*Math.sin(angle),z-.24*Math.cos(angle),2.21,.13,angle,.98);
    if(drawBenchesOnly)return;
    benches.push(benchPosition(x+300,z+225,angle));
  }
  function benchPosition(xMap,yMap,angle){
    const heading=(Math.atan2(Math.sin(angle),-Math.cos(angle))*180/Math.PI+360)%360;
    const slots=[-.50,.50].map(offset=>{
      const x=xMap+Math.cos(angle)*offset,y=yMap-Math.sin(angle)*offset;
      return {x,y,heading,approach:{x:x+Math.sin(angle)*.87,y:y+Math.cos(angle)*.87}};
    });
    const frontX=Math.sin(angle),frontY=Math.cos(angle);
    return {x:xMap,y:yMap,slots,catPerch:{
      x:xMap+frontX*.132,y:yMap+frontY*.132,height:.5075,heading:angle,
      approach:{x:xMap+frontX*1.23,y:yMap+frontY*1.23}
    }};
  }
  const lampMaterial=new T.MeshStandardMaterial({color:0xf0d6a0,emissive:0xffae53,emissiveIntensity:.03,roughness:.64});
  function lamp(x,z,height=3.42){
    cylinder(0x3d4845,x,height*.465,z,.055,height*.93,8);
    cylinder(0x45534f,x,.15,z,.133,.29,8);
    flat(new T.BoxGeometry(.25,.34,.25),lampMaterial,x,height,z);
    box(0x344745,x,height+.21,z,.36,.11,.36);
    block(x,z,.23,.23,0,height+.27);
  }
  for(const [i,t] of [[1,.27],[2,.62],[4,.40],[6,.49],[8,.30],[10,.46]]){
    const street=line(route[i],route[i+1]),b=street.at(t,4.55),l=street.at(t+.16,4.94);
    bench(b.x,b.z,street.angle);
    lamp(l.x,l.z);
  }
  bench(s.x-5.5,s.z-3.9,-Math.PI/2);
  lamp(s.x-3.9,s.z-6.3);
  const gd=placed(garden);
  paved(gd.x,gd.z,12,10,.035);
  bench(gd.x-2.1,gd.z+2.2,Math.PI);
  bench(gd.x+2.1,gd.z+2.2,Math.PI);

  function nameplate(text,parent,x,y,z,width,height,background="#26322b",color="#ead1a1"){
    const c=document.createElement("canvas");c.width=480;c.height=120;
    const ctx=c.getContext("2d");ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(8,8,464,104);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=color;
    ctx.font='bold 59px "Malgun Gothic", sans-serif';ctx.fillText(text,240,61,430);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,side:T.DoubleSide}));
    sign.position.set(x,y,z);parent.add(sign);return sign;
  }

  function facade(spec){
    const {x,z}=placed(spec),group=new T.Group();
    const {w,d,h}=spec;
    group.position.set(x,0,z);scene.add(group);block(x,z,w,d);
    const primary=spec.brick?0x975c49:0xb5b3a8;
    const shell=box(primary,0,h/2,0,w,h,d,group);
    if(spec.brick){
      shell.geometry=new T.BoxGeometry(w,h,d);
      shell.scale.setScalar(1);shell.material=brickMaterial;uvScale(shell,w/7,h/2.7);
    }
    const trim=spec.brick?0xb98670:0xcec7b8;
    box(trim,0,.35,0,w+.22,.7,d+.24,group);
    box(trim,0,h-.46,0,w+.45,.38,d+.43,group);
    box(spec.brick?0x5b514b:0x6c7876,0,h-.08,0,w+.16,.31,d+.13,group);
    const floors=Math.max(2,Math.floor(h/3.35)),bays=Math.max(3,Math.round(w/3.0));
    const step=(h-1.0)/floors;
    for(const side of [-1,1])for(let floor=0;floor<floors;floor++){
      const y=1.35+floor*step;
      box(trim,0,y-.75,side*(d/2+.025),w,.075,.12,group);
      for(let i=0;i<bays;i++){
        const px=(i-(bays-1)/2)*w/bays;
        box(trim,px,y,side*(d/2+.06),1.51,1.93,.13,group);
        box((i+floor)%3===0?0x73919c:0x516e7a,px,y,side*(d/2+.14),1.23,1.66,.063,group);
        box(trim,px,y,side*(d/2+.183),.047,1.66,.035,group);
        box(trim,px,y+.15,side*(d/2+.184),1.23,.044,.036,group);
      }
    }
    if(spec.church){
      const towerX=-w*.25;
      box(0x9c604b,towerX,h-2,-d*.38,4.35,h+4.7,4.4,group);
      box(0xb6856d,towerX,h+3.9,-d*.38,4.59,.24,4.61,group);
      orient(cylinder(0x5c6267,towerX,h+6.25,-d*.38,3.25,4.45,4,group,0),Math.PI/4);
      box(0x5b4b44,towerX,h+8.75,-d*.38,.11,1.1,.11,group);
      box(0x5b4b44,towerX,h+8.82,-d*.38,.69,.09,.09,group);
    }
  }
  for(const spec of city.slice(1))if(!spec.surveyReplaced)facade(spec);

  function roof(group,w,d,y,rise,hip=true){
    const geometry=new T.BufferGeometry(),data=[];
    const levels=7,rows=13,ridge=w*(hip?.30:.42);
    function surface(face,t,u){
      const horizontal=face<2,side=face%2===0?-1:1;
      const lift=rise*(.36*t+.64*t*t)+Math.abs(u)**5*.43*(1-t)**2;
      if(horizontal)return [u*(w/2*(1-t)+ridge*t),y+lift,side*d/2*(1-t)];
      return [side*(w/2*(1-t)+ridge*t),y+lift,u*d/2*(1-t)];
    }
    for(let f=0;f<4;f++){
      for(let a=0;a<levels;a++)for(let b=0;b<rows;b++){
        const v1=surface(f,a/levels,2*b/rows-1),v2=surface(f,(a+1)/levels,2*b/rows-1);
        const v3=surface(f,(a+1)/levels,2*(b+1)/rows-1),v4=surface(f,a/levels,2*(b+1)/rows-1);
        data.push(...v1,...v2,...v3,...v1,...v3,...v4);
      }
      const count=Math.round((f<2?w:d)/.40);
      for(let b=0;b<=count;b++){
        const u=2*b/count-1;
        for(let a=0;a<4;a++){
          const start=surface(f,a*.23,u),end=surface(f,(a+1)*.23,u);
          const axis=new T.Vector3(end[0]-start[0],end[1]-start[1],end[2]-start[2]);
          const tile=cylinder(b%6===0?0x53615f:0x394543,(start[0]+end[0])/2,(start[1]+end[1])/2+.046,(start[2]+end[2])/2,.074,axis.length()+.04,6,group);
          tile.quaternion.setFromUnitVectors(up,axis.normalize());
        }
      }
    }
    geometry.setAttribute("position",new T.Float32BufferAttribute(data,3));geometry.computeVertexNormals();
    const roofMesh=shape(geometry,0x384344,0,0,0,group);roofMesh.material.side=T.DoubleSide;
    box(0x58605a,0,y+rise+.03,0,ridge*2+.18,.25,.32,group);
    for(const side of [-1,1])for(let i=0;i<Math.floor(w/.39);i++){
      const x=-w*.48+i*.39;
      box(i%3===0?0x915c42:0x31584b,x,y-.15,side*(d/2-.22),.17,.19,.66,group);
    }
  }
  function pavilion(spec){
    const {x,z}=placed(spec),g=new T.Group();
    const {w,d,h,bays,angle=0}=spec;
    g.position.set(x,0,z);g.rotation.y=angle;target.add(g);
    const raised=spec.raised??.39,lo=(n)=>-w/2+n*w/bays;
    // Buildings that stand on a terrace or gate tower leave the ground below them clear.
    const solid=!spec.noCollision;
    box(0xb4ae9e,0,raised/2,0,w+1.4,raised,d+1.1,g);
    // An enterable hall: the middle bay (two when the bay count is even) stands open, the
    // body is a shell of walls round a furnished room, and steps lead up to the floor.
    // spec.fit places the room inside a surveyed model instead: its own size, floor height
    // and the porch in front of the door, measured from that model.
    const fit=spec.fit;
    const room=spec.interior&&!spec.gate&&!spec.open?{a:Math.ceil(bays/2)-1,b:Math.floor(bays/2),
      height:fit?.height??Math.min(h*(spec.stories===2?.5:.9),spec.stories===2?h*.5:5.2)}:null;
    if(room){
      const west=fit?-fit.gap/2:lo(room.a)+.3,east=fit?fit.gap/2:lo(room.b+1)-.3,middle=(west+east)/2,gap=east-west;
      const top=fit?fit.floor:(spec.lift??0)+raised,shift=fit?.z??0,thick=.26,iw=fit?fit.w:w-.55,id=fit?fit.d:d-.55;
      const origin=fromBuilding(spec,0,shift),inside=new T.Group();
      inside.position.set(wx(origin.x),top-raised,wz(origin.y));inside.rotation.y=angle;target.add(inside);
      inside.name=(spec.name||"전각")+" 내부";
      const wallColor=spec.plain?0x8a6a4c:0x864d39,lintel=Math.min(room.height,3.1);
      const wallBlock=(lx,lz,bw,bd,high)=>{if(solid)blockLocal(spec,lx,shift+lz,bw,bd,high);};
      box(0x9b7248,0,raised+.035,0,iw-.3,.07,id-.3,inside);
      box(wallColor,0,raised+room.height/2,-(id/2-thick/2),iw,room.height,thick,inside);
      wallBlock(0,-(id/2-.15),iw,.5);
      for(const side of [-1,1]){
        box(wallColor,side*(iw/2-thick/2),raised+room.height/2,0,thick,room.height,id,inside);
        wallBlock(side*(iw/2-.15),0,.5,id);
        const edge=side<0?west:east,span=iw/2-Math.abs(edge);
        box(wallColor,side*(Math.abs(edge)+span/2),raised+room.height/2,id/2-thick/2,span,room.height,thick,inside);
        wallBlock(side*(Math.abs(edge)+span/2),id/2-.15,span,.5);
        // The door leaves stand folded back inside the opening.
        box(0x476e5b,edge-side*.06,raised+lintel/2,id/2-thick-.62,.07,lintel-.1,1.15,inside);
        box(0xd9d0b6,edge-side*.11,raised+lintel*.58,id/2-thick-.62,.02,lintel*.6,1.0,inside);
      }
      if(room.height>lintel+.1)box(wallColor,middle,raised+(lintel+room.height)/2,id/2-thick/2,gap,room.height-lintel,thick,inside);
      // Coffered ceiling.
      box(0x2f5a4a,0,raised+room.height+.05,0,iw,.1,id,inside);
      for(let i=1;i<bays;i++)box(0x9c5a3f,-iw/2+i*iw/bays,raised+room.height-.06,0,.2,.14,id-.5,inside);
      for(const part of [-.25,.25])box(0x9c5a3f,0,raised+room.height-.05,part*id,iw-.5,.14,.2,inside);
      // The floor platform, then steps down from the doorway (a surveyed model shows its own).
      const lift=top-raised,drop=fit?top:raised,porch=fit?id/2+fit.porch:(d+1.1)/2;
      const steps=Math.max(0,Math.ceil(drop/.19)-1),riser=drop/(steps+1);
      // A hall whose terrace already carries walkers (groundFloor) needs no platform of its own.
      const level=spec.groundFloor?0:top;
      if(spec.groundFloor){
      }else if(fit)wallBlock(0,(porch-id/2)/2,iw+1,id+(porch-id/2),top);
      else wallBlock(0,0,w+1.4,d+1.1,top);
      for(let k=1;k<=steps&&!spec.groundFloor;k++){
        const height=drop-k*riser,front=porch+(k-.5)*.38;
        if(!fit)box(0xb0ab9a,middle,height/2,front,gap+1.3,height,.38,inside);
        wallBlock(middle,front,gap+(fit?3:1.3),.38,top-k*riser);
      }
      furnishHall(T,inside,kit,{style:spec.interior,name:spec.name,w:iw-thick*2,d:id-thick*2,floor:raised+.07,height:room.height-.07,
        glow:lampMaterial,solid:(lx,lz,bw,bd,high)=>wallBlock(lx,lz,bw,bd,high==null?high:level+high)});
      // Paper lanterns hang from the ceiling; the world lights the room while someone is inside.
      if(spec.interior!=="reception")for(const side of [-1,1]){
        box(0x5a4334,side*iw*.24,raised+room.height-.2,0,.03,.4,.03,inside);
        const lantern=new T.Mesh(new T.BoxGeometry(.36,.46,.36),lampMaterial);
        lantern.position.set(side*iw*.24,raised+room.height-.62,0);inside.add(lantern);
      }
      hallRooms.push({x:origin.x,y:origin.y,angle,w:iw,d:id,floor:top,height:room.height});
      g.userData.door={a:room.a,b:room.b};g.userData.inside=inside;
    }
    if(!spec.gate){
      const access=pavilionStairAccess.get(spec.name);
      if(!solid||room){
      }else if(access){
        const width=w+1.40,depth=d+1.10,sideWidth=(width-access.width)/2;
        for(const side of [-1,1])blockLocal(spec,side*(access.width+sideWidth)/2,0,sideWidth,depth);
        blockLocal(spec,0,(access.front-depth/2)/2,access.width,access.front+depth/2);
      }else block(x,z,w+1.40,d+1.10,angle);
      const veranda=spec.open?.82:0;
      // A pillared pavilion such as Gyeonghoeru has no walls under its upper floor.
      if(room){
        // Above the room the body closes again so the roof space cannot be seen into.
        if(h*.92-room.height>.3)box(0x864d39,0,raised+(room.height+.1+h*.92)/2,0,w-.55,h*.92-room.height-.1,d-.55,g);
      }else if(!spec.hollow)box(0x864d39,0,raised+h*.47,-veranda*.5,w-.55,h*.92,d-.55-veranda,g);
    }
    for(const side of [-1,1]){
      for(let i=0;i<=bays;i++){
        const px=lo(i),pz=side*(d*.45),rad=spec.gate?.24:.22;
        cylinder(spec.open?0x988a70:0x8f4936,px,raised+h*.48,pz,rad,h*.96,12,g,.91);
        box(0xb7ab95,px,raised+.13,pz,.79,.27,.80,g);
        box(0x35664f,px,raised+h-.13,pz,.88,.39,.88,g);
        const c=Math.cos(angle),sin=Math.sin(angle);
        if(spec.gate&&solid)block(x+px*c+pz*sin,z-px*sin+pz*c,rad*2+.15,rad*2+.15,angle,raised+h+.2);
      }
      for(let i=0;i<bays;i++){
        const px=(lo(i)+lo(i+1))/2,pz=side*(d*.50);
        if(spec.open){
          const width=w/bays;
          box(0x3c584a,px,raised+.86,pz,width,.075,.075,g);
          box(0x3c584a,px,raised+.32,pz,width,.065,.067,g);
          for(let j=1;j<=7;j++){
            box(j%2===0?0x697957:0x486753,px-width/2+j*width/8,raised+.60,pz,.039,.54,.06,g);
          }
        }else if(!spec.gate&&!(room&&side===1&&i>=room.a&&i<=room.b)){
          const width=w/bays*.82;
          box(0x476e5b,px,raised+h*.46,pz,width,h*.72,.14,g);
          for(let j=1;j<=9;j++)box(0x285548,px-width/2+width*j/10,raised+h*.49,pz+side*.085,.045,h*.58,.043,g);
          for(let j=0;j<6;j++)box(0x4f7662,px,raised+h*.24+j*h*.101,pz+side*.085,width,.044,.043,g);
        }
        for(let j=-2;j<=2;j++){
          const xx=px+j*w/bays*.15;
          box(j%2===0?0x40745c:0x789675,xx,raised+h-.12,pz,.40,.25,.42,g);
          box(0xb87953,xx,raised+h+.095,pz,.34,.10,.39,g);
        }
      }
      box(0x884d37,0,raised+h*.90,side*d*.46,w+.22,.30,.29,g);
      box(0x356c56,0,raised+h+.20,side*d*.52,w+.68,.31,.36,g);
      box(0x9e6347,0,raised+h+.44,side*d*.55,w+.67,.12,.18,g);
    }
    if(spec.gate){
      // Timber wings are closed; the central bay remains a usable passage.
      for(const side of [-1,1]){
        const px=side*w*.325,wings=w*.292;
        box(0x754635,px,raised+h*.42,d*.44,wings,h*.78,.16,g);
        for(let i=0;i<9;i++)box(0x996047,px-wings*.44+i*wings*.11,raised+h*.42,d*.456,.035,h*.76,.035,g);
        for(const frac of [.21,.44,.67])box(0x5f4439,px,raised+h*frac,d*.478,wings,.080,.09,g);
        if(solid)block(x+px*Math.cos(angle)+d*.44*Math.sin(angle),z-px*Math.sin(angle)+d*.44*Math.cos(angle),wings,.30,angle,raised+h*.81);
      }
    }
    const roofGroup=spec.surveyRoof!=null?new T.Group():g;
    if(spec.surveyRoof!=null){
      g.add(roofGroup);g.userData.surveyRoofs=[roofGroup];
      // Measured eaves overhang the rebuilt timber shell. Close the roof
      // cavity behind the brackets without placing a surface over the tiles.
      if(spec.surveyRoof>0){
        const soffit=spec.surveyRoof;
        const base=Math.min(raised+h*.81,soffit-.45);
        box(0x39382c,0,(base+soffit+.58)/2,0,w-.29,soffit+.58-base,d-.31,g);
      }
    }
    if(spec.stories===2){
      box(0x815643,0,raised+h*.76,0,w*.87,h*.46,d*.80,g);
      roof(roofGroup,w+2.0,d+1.95,raised+h*.52,1.22,false);
      for(const side of [-1,1])for(let i=0;i<bays;i++){
        const x=(i+.5-bays/2)*w*.86/bays,z=side*d*.413;
        box(0x74503a,x,raised+h*.78,z,w*.75/bays,h*.24,.16,g);
        for(let j=-2;j<=2;j++)box(0xa18262,x+j*w*.097/bays,raised+h*.78,z+side*.10,.045,h*.22,.034,g);
      }
    }
    if(spec.mainHall){
      box(0xc1b8a5,0,.29,0,w+5.8,.56,d+5.2,g);
      for(let j=0;j<5;j++)box(0xb9b0a0,0,.075+j*.095,d/2+3.1-j*.47,6.1,.18,.66,g);
    }
    roof(roofGroup,w+(spec.open?3.2:2.5),d+2.36,raised+h+.54,spec.rise??(spec.mainHall?3.05:spec.open?2.35:2.04),spec.gate||spec.mainHall||Boolean(spec.hip));
    if(spec.sign||spec.name)nameplate(spec.sign||spec.name,g,0,raised+h-.24,d*.61,Math.min(3.5,w*.25),.79);
    if(spec.surveyRoof!=null){
      const shell=new T.Group();
      // The first child is the walkable foundation. The furnishings are a separate group.
      for(const piece of g.children.slice(1))shell.add(piece);
      g.add(shell);g.userData.surveyShell=shell;
    }
    return g;
  }

  const gp=placed(gate);
  const gateGroup=pavilion({...gate,w:14.2,d:8.1,h:4.35,bays:3,angle:Math.PI/2,gate:true,raised:.29,sign:"門漢大"});
  const plateau=box(0xb6afa0,5.1,.11,0,11.5,.22,16.4,gateGroup);
  plateau.position.set(0,.10,8.0);plateau.scale.set(17.5,.20,10.0);
  for(let j=0;j<3;j++)box(0xaaa69b,0,.055+j*.055,13.2-j*.47,8.0,.10,.61,gateGroup);
  for(const side of [-1,1]){
    for(let i=0;i<8;i++)box(0xaaa79a,side*7.38,.36,4.3+i*1.11,.31,.64,.31,gateGroup);
    box(0x9a9a91,side*7.38,.61,8.2,.33,.16,8.35,gateGroup);
    block(gp.x+8.2,gp.z-side*7.38,8.35,.38,0,.70);
  }
  const tp=placed(ticket);
  const kiosk=new T.Group();kiosk.name=ticket.name;kiosk.position.set(tp.x,0,tp.z);kiosk.rotation.y=ticket.angle;scene.add(kiosk);
  const front=ticket.d/2;
  const threshold=placed(fromBuilding(ticket,0,2.56));
  paved(threshold.x,threshold.z,9.4,5.1,.068,ticket.angle);
  const booth=new T.Mesh(new T.BoxGeometry(ticket.w,3.03,ticket.d),stoneMaterial);
  booth.position.y=1.54;kiosk.add(uvScale(booth,1.75,1.2));
  box(0x8b8c7e,0,.15,0,ticket.w+.11,.28,ticket.d+.12,kiosk);
  blockLocal(ticket,0,0,ticket.w+.11,ticket.d+.12,3.05);
  roof(kiosk,ticket.w+.82,ticket.d+.88,3.12,1.02);
  box(0x65766b,0,2.32,front+.10,7.21,.54,.18,kiosk);
  nameplate("덕수궁 매표소",kiosk,0,2.36,front+.205,4.18,.46,"#e9e6dc","#263e43");
  for(let i=-1;i<=1;i++){
    const x=i*2.28;
    box(0xc4c7bc,x,1.47,front+.09,1.94,1.18,.16,kiosk);
    box(0x536b72,x,1.51,front+.195,1.65,.91,.09,kiosk);
    box(0xe0d9c6,x,.97,front+.26,1.87,.11,.39,kiosk);
    box(0x415754,x,1.22,front+.25,.39,.16,.075,kiosk);
    box(0xb3c3bd,x,1.55,front+.249,.043,.77,.020,kiosk);
    blockLocal(ticket,x,front+.26,1.87,.39,1.03);
  }
  const guide=placed(ticketGuide);
  const board=new T.Group();board.position.set(guide.x,0,guide.z);board.rotation.y=ticket.angle;scene.add(board);
  box(0x4d5b50,0,.87,0,1.52,1.71,.09,board);
  nameplate("관람 안내",board,0,1.18,.053,1.39,.46,"#efe5cd","#263a3d");
  block(guide.x,guide.z,1.54,.16,ticket.angle,1.73);
  const b=placed(bridge);
  const channel=box(0x526f69,b.x,-.035,b.z,2.05,.045,16.5);
  channel.material=matte(0x526f69);
  box(0xa5a79e,b.x,.117,b.z,5.7,.25,6.7);
  for(const side of [-1,1]){
    box(0xa2a49a,b.x,.46,b.z+side*3.21,5.6,.53,.34);
    block(b.x,b.z+side*3.21,5.6,.34,0,1.07);
    for(let i=0;i<5;i++)box(0xb1b1a4,b.x-2.31+i*1.15,.80,b.z+side*3.21,.34,.53,.39);
  }
  for(const edge of [-1,1]){
    block(b.x,b.z+edge*6.1,2.4,4.9,0,.34);
    box(0x989d90,b.x,.16,b.z+edge*6.0,2.7,.34,4.6);
  }
  const middleModel=pavilion({...middle,w:10.9,d:6.9,h:3.72,bays:3,angle:courtAngle,gate:true,raised:.24,sign:"中和門"});
  for(const side of [-1,1]){
    const g=placed(middle),shift=side*6.4;
    block(g.x+shift*Math.cos(courtAngle),g.z-shift*Math.sin(courtAngle),8.6,10.0,courtAngle);
  }
  const hallModel=pavilion({...hall,w:22.5,d:17.6,h:6.0,bays:5,angle:courtAngle,raised:1.01,
    mainHall:true,sign:"殿和中",interior:"throne",lift:1.12,groundFloor:true,surveyRoof:7.72});
  const hallSite={...hall,angle:courtAngle};
  // Block the edges of each raised level and leave both stair openings clear.
  for(const [halfWidth,back,front,top] of [[19.85,-15.3,27.2,1.14],[13.55,-8.5,22.65,2.08]]){
    const halfStair=3.60,sideWidth=halfWidth-halfStair;
    blockLocal(hallSite,-.25,back,halfWidth*2,.28,top);
    for(const side of [-1,1]){
      blockLocal(hallSite,-.25+side*halfWidth,(back+front)/2,.29,front-back,top);
      blockLocal(hallSite,-.25+side*(halfStair+sideWidth/2),front,sideWidth,.29,top);
    }
  }
  for(const side of [-1,1]){
    blockLocal(hallSite,-.25+side*3.66,28.16,.22,1.80,.98);
    blockLocal(hallSite,-.25+side*3.66,23.34,.22,1.43,1.80);
  }
  for(const part of hallModel.children)part.position.y+=.81;
  box(0xaaa591,-.25,.50,5.95,39.7,1,42.5,hallModel);
  box(0xb7ae99,-.25,.91,7.075,27.10,1.82,31.15,hallModel);
  for(const [height,z,width,depth] of [[1.003,5.95,39.7,42.5],[1.823,7.075,27.1,31.15]]){
    const terrace=new T.Mesh(new T.PlaneGeometry(width,depth),terraceStone);
    terrace.rotation.x=-Math.PI/2;terrace.position.set(-.25,height,z);
    terrace.receiveShadow=true;hallModel.add(uvScale(terrace,width/3.2,depth/3.2));
  }
  for(const [start,end,bottom,top] of [[29.06,27.2,0,1],[24.06,22.65,1.05,1.82]]){
    for(let step=0;step<5;step++){
      const depth=(start-end)/5,height=bottom+(top-bottom)*(step+1)/5;
      box(0xb0ab9a,-.25,height/2,start-(step+.5)*depth,7.2,height,depth+.025,hallModel);
    }
  }
  const c=placed(court);

  for(const side of [-1,1])for(let i=0;i<6;i++){
    const dx=side*4.35,dz=10-i*2.93;
    const px=c.x+dx*Math.cos(courtAngle)+dz*Math.sin(courtAngle);
    const pz=c.z-dx*Math.sin(courtAngle)+dz*Math.cos(courtAngle);
    orient(box(0x9d9e91,px,.36,pz,.36,.72,.28),courtAngle);block(px,pz,.36,.29,courtAngle,.72);
  }
  const pavilionModels=new Map();
  const rebuiltPorches={
    함녕전:{width:3.6,landing:1.39,head:8,foot:11.17,body:5.7,soffit:5.38},
    석어당:{width:3.5,landing:1.08,head:4.1,foot:6.55,body:3.7,soffit:0}
  };
  function addSurveyPorch(spec){
    const {width,landing,head,foot,body}=rebuiltPorches[spec.name];
    // These porch coordinates belong to the surveyed landmark, not to one
    // wing's shifted origin.
    const {x,z}=placed(spec),porch=new T.Group();
    porch.position.set(x,0,z);porch.rotation.y=spec.angle;scene.add(porch);
    const depth=Math.max(.4,head-body);
    box(0xb8ad97,0,landing/2,head-depth/2,spec.w,landing,depth,porch);
    const count=Math.ceil(landing/.17),tread=(foot-head)/count;
    for(let step=0;step<count;step++){
      const height=landing*(1-step/count);
      box(0xb2a993,0,height/2,head+(step+.5)*tread,width,height,tread+.01,porch);
    }
  }
  for(const spec of pavilions){
    if(["redBrick","western","westernAnnex"].includes(spec.kind)){
      buildWestern(T,scene,kit,spec);
      if(spec.kind==="westernAnnex")blockLocal(spec,0,0,spec.w,spec.d);
      else{
        const brick=spec.kind==="redBrick",front=spec.d*(brick?.33:.19),back=-spec.d*.46;
        const porticoWidth=brick?spec.w*.24:Math.min(spec.w*.33,15.5);
        const landing=front+spec.d*(brick?.115:.13),stairs=spec.d*(brick?.045:.174);
        const base=spec.h*(brick?.077:.231);
        blockLocal(spec,0,(front+back)/2,spec.w*.91,front-back,spec.h);
        for(const side of [-1,1]){
          blockLocal(spec,side*porticoWidth*.5,(front+landing+stairs)/2,brick?.23:spec.w*.022,
            landing+stairs-front,base);
        }
        const columns=brick?[-.45,-.15,.15,.45]:[-.43,-.258,-.086,.086,.258,.43];
        for(const fraction of columns){
          const width=brick?spec.w*.022:.93;
          blockLocal(spec,porticoWidth*fraction,landing-(brick?.19:.38),width,width,spec.h*.75);
        }
      }
    }else if(spec.kind==="utility"){
      const {x,z}=placed(spec),g=new T.Group();
      g.position.set(x,0,z);g.rotation.y=spec.angle||0;scene.add(g);
      box(0xafa294,0,spec.h*.5,0,spec.w,spec.h,spec.d,g);
      box(0x5b685d,0,spec.h*.39,spec.d*.5+.035,spec.w*.22,spec.h*.73,.09,g);
      box(0x687e7a,-spec.w*.26,spec.h*.58,spec.d*.5+.035,spec.w*.19,spec.h*.32,.09,g);
      roof(g,spec.w+1.0,spec.d+.93,spec.h,1.12,false);
      block(x,z,spec.w,spec.d,spec.angle);
    }else if(spec.outline){
      // The sleeping hall has a short rear wing rather than a rectangular roof plan.
      const {x,y,angle}=spec,c=Math.cos(angle),s=Math.sin(angle);
      const wing=(dx,dz,w,d,bays,sign,interior)=>pavilion({
        ...spec,x:x+dx*c+dz*s,y:y-dx*s+dz*c,w,d,bays,sign,name:"",interior,surveyRoof:rebuiltPorches[spec.name]?.soffit
      });
      pavilionModels.set(spec.name,{spec,groups:[
        wing(1.1,1.95,29.5,11.7,9,spec.sign,spec.interior),wing(-9.5,-5.84,8.4,4.0,3)
      ]});
    }else{
      pavilionModels.set(spec.name,{spec,groups:[pavilion({...spec,surveyRoof:rebuiltPorches[spec.name]?.soffit})]});
    }
    if(rebuiltPorches[spec.name])addSurveyPorch(spec);
  }
  const sh=placed(stoneHall),sf=placed(stoneFountain);
  const classical=new T.Group();classical.position.set(sh.x,0,sh.z);scene.add(classical);
  const cream=0xd6cbb8;
  const w=54.2,d=21;
  block(sh.x,sh.z-2.5,w,d+5);
  box(0xb3aea0,0,.54,0,w+1.0,1.08,d+.70,classical);
  box(cream,0,7.10,-.35,w,12.12,d-1.2,classical);
  box(0x90908a,0,13.39,0,w+.77,.48,d+.76,classical);
  for(let bay=0;bay<17;bay++){
    const x=(bay-8)*3.05;
    for(const y of [2.7,6.37,10.37]){
      box(0xb7ae9a,x,y,d/2-.75,1.54,2.63,.15,classical);
      box(0x667d82,x,y,d/2-.62,1.19,2.21,.082,classical);
      box(0xd2c7b1,x,y,d/2-.56,.055,2.2,.035,classical);
      box(0xd2c7b1,x,y+.18,d/2-.56,1.18,.055,.035,classical);
      box(0xe0d3b9,x,y-1.36,d/2-.54,1.82,.20,.32,classical);
    }
  }
  for(const z of [d/2-.53,-d/2+.49])for(const y of [4.42,8.63,12.72]){
    box(0xc8bda9,0,y,z,w+.32,.18,.26,classical);
  }
  for(let i=0;i<6;i++){
    const x=(i-2.5)*3.38;
    cylinder(0xe3d9c0,x,8.0,d/2+.34,.455,7.45,14,classical,.86);
    box(0xd9cdb3,x,11.82,d/2+.34,1.30,.41,1.33,classical);
    box(0xcac0aa,x,4.25,d/2+.34,1.25,.41,1.26,classical);
    for(const side of [-1,1])cylinder(0xd9cdb3,x+side*.37,11.52,d/2+.79,.21,.12,10,classical).rotation.x=Math.PI/2;
  }
  box(0xd5cbb7,0,12.24,d/2+.39,19.8,.61,2.48,classical);
  const triangle=new T.Shape();triangle.moveTo(-9.90,0);triangle.lineTo(9.90,0);triangle.lineTo(0,3.01);triangle.closePath();
  const pediment=new T.ExtrudeGeometry(triangle,{depth:.83,bevelEnabled:false});
  shape(pediment,cream,0,12.54,d/2+.12,classical);
  box(0xb8b2a3,0,1.425,11.51,14.35,2.85,2.02,classical);
  for(let i=0;i<16;i++){
    const height=(i+1)*2.85/16,z=19.2-(i+.5)*6.7/16;
    box(0xb8b2a3,0,height/2,z,13.3,height,.439,classical);
  }
  for(const side of [-1,1]){
    blockLocal(stoneHall,side*7.04,15.81,.52,6.88,2.88);
  }
  const drawPond=addPond();
  for(const {points,width} of palacePaths.filter(p=>p.surface==="gravel").filter((_,i)=>i%3===1)){
    const edge=line(points[0],points[1]),{x,z}=edge.at(.63,width/2+.85);
    if(edge.len>5&&!solidAt(x+300,z+225)&&awayFromPaths(x+300,z+225,.45))bench(x,z,edge.angle);
  }
  const fp=placed(fountain);
  paved(fp.x,fp.z,23,23,.029);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    lamp(fp.x+Math.cos(a)*7.8,fp.z+Math.sin(a)*7.8,2.73);
  }
  const westernBuildings=new Set(pavilions.filter(spec=>["redBrick","western","westernAnnex"].includes(spec.kind)).map(spec=>spec.name));
  const builtPalaces=[gateGroup,kiosk,middleModel,hallModel,classical,
    ...[...pavilionModels.values()].flatMap(entry=>entry.groups),...scene.children.filter(group=>westernBuildings.has(group.name))];
  for(const group of builtPalaces)treeClearance.addModel(group);
  const surveySites=[["junghwamun",middle,courtAngle],["junghwajeon",hall,courtAngle],["seokjojeon",stoneHall,0]];
  for(const [file,name] of [["jeonggwanheon","정관헌"],["hamnyeongjeon","함녕전"],["seogeodang","석어당"]]){
    const {spec}=pavilionModels.get(name);
    surveySites.push([file,spec,spec.angle]);
  }
  for(const [name,point,angle] of surveySites)treeClearance.addSurvey(name,wx(point.x),wz(point.y),angle);
  plantAvenue();
  plantGardens();
  for(let i=0;i<9;i++){
    const point=estateOutline[Math.min(estateOutline.length-1,i+1)],at=placed(point);
    const height=9+rand()*5;
    for(const [dx,dz] of [[7,3],[8,6],[4,8],[8,-1],[3,10],[11,3]]){
      const x=at.x+dx,z=at.z+dz;
      if(!awayFromPaths(x+300,z+225,1)||!treeFits(x,z,height))continue;
      if(tree(x,z,height,treeMix.edge()))break;
    }
  }
  const districtKit={...kit,box,cylinder,shape,rand};
  const districtTools={pavilion,roof,wall,coveredWall,plot,ribbon,paved,tree,treeMix,treeFits,bench,lamp,
    nameplate,block,flat,uvScale,orient,treeKit,treeClearance,waterMaterial,pathClear,
    materials:{stone:stoneMaterial,paving:pavingMaterial,royalWay,terraceStone,gravel:gravelMaterial,court:courtStoneMaterial,earth:earthMaterial,
      road:roadMaterial,garden:gardenMaterials}};
  for(const station of [cityHallStation,cityHallExit3]){
    buildSubwayExit(T,scene,districtKit,districtTools,station,"시청 City Hall",0x00a84d);
  }

  function* buildGyeongbokDistrict(root){
    const steps=buildGyeongbok(T,root,districtKit,districtTools);
    const scope=deferGyeongbok?new Map():null;
    const firstTree=trees.length;
    // Starting state of the original palace random stream after Jeongdong's build.
    let seed=1574068689;
    const districtRandom=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(;;){
      target=root;activeRand=districtRandom;drawBenchesOnly=deferGyeongbok;
      let step;
      try{step=scope?withObstacleScope(scope,()=>steps.next()):steps.next();}
      finally{target=scene;activeRand=kit.rand;drawBenchesOnly=false;}
      if(step.done){
        if(deferGyeongbok){
          yield* gradePalaceMeshes(T,root.children);
          for(let i=firstTree;i<trees.length;i++){
            const {x,z,top}=trees[i];
            if(top)top.y+=palaceMeshHeight({x:x+300,y:z+225});
          }
        }
        return step.value;
      }
      yield;
    }
  }
  let subwayStations;
  if(deferGyeongbok){
    for(const [x,y,w,d,angle,top] of gyeongbokObstacles)addObstacle(x,y,w,d,angle,top??Infinity);
    for(const [x,y,angle] of gyeongbokBenches)benches.push(benchPosition(x,y,angle));
  }else{
    const steps=buildGyeongbokDistrict(scene);
    let step=steps.next();while(!step.done)step=steps.next();
    subwayStations=step.value;
  }
  return {subwayStations,buildGyeongbokDistrict,benches,trees,catWalls,fountains:[{x:fp.x,z:fp.z,radius:2.32},{x:sf.x,z:sf.z,radius:4.2,scalloped:true}],
    lampMaterial,classical,middleModel,hallModel,drawPond,pavilionModels};
}
