import {
  gwanghwamun,gbSites,gbSite,gbCourts,gbLake,gbPond,gbPaths,gbLawns,gbStation,subwayStops,
  gbFrontApron,gbWoldae,gbHaetae,gbPhotoZone,gbRoyalPavilion,gyeongbokWater,at
} from "./gyeongbok-layout.js";
import {solidAt} from "./layout.js";
import {plazaAt} from "./plaza-layout.js";
import {bukchonPavers,coverTriangles,crosswalkPaintBands,exposedSurface} from "./bukchon-surfaces.js";
import {makeStreetSurfaceCut} from "./street-surface-cuts.js";
import {gardenSidewalk,gardenVerge,sajikEastRoad,uijeongbuBusPavement,uijeongbuConnections,uijeongbuCrossings,uijeongbuOutline,uijeongbuPavedConnections,uijeongbuRemains,
  uijeongbuSideRoad,uijeongbuWalks} from "./uijeongbu-layout.js";
import {gbEastOpenings,gbEastWall,gbMuseumWestGate,gbOuterWallRuns,gbWallOutline,gbWestPaths,insideGbWall,clipGbGround} from "./gyeongbok-perimeter.js";
import {buildGyeongbokCompounds,inGyeongbokCompound} from "./gyeongbok-compounds.js";

// Survey models can replace these hand-built halls later: drop "<id>.glb" into public/ and
// add the id here. world3d loads each file and hides the modeled group when it arrives.
export const gbSurveyModels=[];
// Materials that glow after dark; world3d fades them in with the night.
export const gbNightGlow=[];

export function* buildGyeongbok(T,scene,kit,tools){
  const {box,cylinder,shape,wx,wz,rand,matte}=kit;
  const {pavilion:timberHall,roof,wall,coveredWall,plot,ribbon,tree,treeMix,treeFits,bench,nameplate,block,flat,uvScale,
    treeKit,treeClearance,waterMaterial,pathClear,materials}=tools;
  const world=(east,north)=>({x:wx(gwanghwamun.x+east),z:wz(gwanghwamun.y-north)});
  const rect=(west,east,south,north)=>[at(west,south),at(east,south),at(east,north),at(west,north)];
  const stoneTint=0xb7ae99,groups=new Map();
  function anchorParts(from,anchor){
    for(let i=from;i<scene.children.length;i++)scene.children[i].userData.terrainAnchor=anchor;
  }
  // Solid box in palace coordinates; top defaults to a full-height wall.
  function solid(east,north,width,depth,top){
    const p=world(east,north);
    block(p.x,p.z,width,depth,0,top);
  }
  function slab(color,east,north,width,depth,height,base=0){
    const p=world(east,north);
    return box(color,p.x,base+height/2,p.z,width,height,depth);
  }
  gbNightGlow.length=0;
  const glow=(color,emissive,strength,rest=0)=>{
    const material=new T.MeshStandardMaterial({color,emissive,emissiveIntensity:rest,roughness:.8});
    gbNightGlow.push({material,rest,strength});
    return material;
  };
  // Paper windows lit from inside, and the red-and-blue silk of cheongsachorong lanterns.
  const paper=glow(0xd9d0b6,0xffb260,.95),silkRed=glow(0xb5382f,0xff5a3c,1.5,.05),silkBlue=glow(0x2f4f9a,0x4a7dff,1.4,.05);
  const unitBox=new T.BoxGeometry(1,1,1),shade=new T.CylinderGeometry(1,1,1,8);
  // Dancheong: the painted band of lotus medallions that runs under palace eaves.
  function dancheongTexture(){
    const c=document.createElement("canvas");c.width=256;c.height=64;
    const ctx=c.getContext("2d");
    ctx.fillStyle="#2f6f58";ctx.fillRect(0,0,256,64);
    for(let i=0;i<4;i++){
      const x=i*64,disc=(radius,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x+32,32,radius,0,7);ctx.fill();};
      ctx.fillStyle="#b7402f";ctx.fillRect(x,0,64,9);ctx.fillRect(x,55,64,9);
      ctx.fillStyle="#e9dfc4";ctx.fillRect(x,9,64,3);ctx.fillRect(x,52,64,3);
      ctx.fillStyle="#46966f";
      ctx.beginPath();ctx.moveTo(x,14);ctx.lineTo(x+15,32);ctx.lineTo(x,50);ctx.fill();
      ctx.beginPath();ctx.moveTo(x+64,14);ctx.lineTo(x+49,32);ctx.lineTo(x+64,50);ctx.fill();
      disc(16,"#2d5fa8");disc(11,"#e9dfc4");disc(7,"#c8452f");disc(3,"#e2b43c");
    }
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=T.RepeatWrapping;map.anisotropy=4;
    return map;
  }
  const dancheong=new T.MeshStandardMaterial({map:dancheongTexture(),roughness:.82});
  function band(group,x,y,z,length,turn=0){
    const mesh=new T.Mesh(new T.BoxGeometry(length,.36,.05),dancheong);
    mesh.position.set(x,y,z);mesh.rotation.y=turn;group.add(uvScale(mesh,length/3.2,1));
  }
  const xAxis=new T.Vector3(1,0,0),upAxis=new T.Vector3(0,1,0),run=new T.Vector3();
  const plaster=0xe6e0d0;
  // White-plastered hip ridges with their row of japsang guardian figures.
  function hips(group,width,depth,ridge,y,rise,upto,figures){
    const point=(sx,sz,t)=>[sx*(width/2*(1-t)+ridge*t),y+rise*(.36*t+.64*t*t)+.43*(1-t)**2+.12,sz*depth/2*(1-t)];
    for(const sx of [-1,1])for(const sz of [-1,1]){
      for(let i=0;i<6;i++){
        const a=point(sx,sz,upto*i/6),b=point(sx,sz,upto*(i+1)/6);
        run.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
        const piece=box(plaster,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,run.length()+.06,.24,.3,group);
        piece.quaternion.setFromUnitVectors(xAxis,run.normalize());
      }
      for(let i=0;i<figures;i++){
        const [x,height,z]=point(sx,sz,upto*(.08+i*.06));
        cylinder(0x77736a,x,height+.28,z,.085,.34,5,group,.45);
        box(0x6b675f,x,height+.5,z,.13,.11,.13,group);
      }
      const [x,height,z]=point(sx,sz,0);
      box(0x565a55,x,height+.14,z,.3,.36,.3,group);
    }
  }
  // Palace finish on top of the shared timber hall: plastered ridges, ridge-end ornaments,
  // japsang, a dancheong band under the eaves and paper-backed lattice doors.
  function pavilion(spec){
    const group=timberHall(spec),{w,d,h,bays}=spec,raised=spec.raised??.39;
    if(!spec.lift&&!spec.noCollision){
      if(spec.gate){
        const width=(w-w/bays)/2;
        for(const side of [-1,1])box(0xa9a394,side*(w-width)/2,-.44,0,width,.9,d+1.08,group);
      }else box(0xa9a394,0,-.69,0,w+1.38,1.4,d+1.08,group);
    }
    const width=w+(spec.open?3.2:2.5),depth=d+2.36,y=raised+h+.54;
    const rise=spec.rise??(spec.mainHall?3.05:spec.open?2.35:2.04),hip=spec.gate||spec.mainHall||Boolean(spec.hip);
    const ridge=width*(hip?.30:.42),figures=w>26?5:w>15?4:3;
    box(plaster,0,y+rise+.24,0,ridge*2+.5,.46,.4,group);
    box(0x2f3a3b,0,y+rise+.5,0,ridge*2+.56,.09,.46,group);
    for(const side of [-1,1])box(0x4b504c,side*(ridge+.3),y+rise+.5,0,.34,.78,.42,group);
    hips(group,width,depth,ridge,y,rise,1,figures);
    if(spec.stories===2)hips(group,w+2.0,d+1.95,(w+2.0)*.42,raised+h*.52,1.22,1-.8*d/(d+1.95),Math.max(2,figures-2));
    if(spec.kind==="museum")return group;
    for(const side of [-1,1]){
      band(group,0,raised+h+.2,side*(d*.52+.21),w+.7);
      box(0x356c56,side*(w/2+.02),raised+h+.2,0,.34,.31,d*1.04,group);
      band(group,side*(w/2+.22),raised+h+.2,0,d*1.04+.4,Math.PI/2);
    }
    const door=group.userData.door;
    if(!spec.gate&&!spec.hollow&&!spec.open)for(const side of [-1,1])for(let i=0;i<bays;i++){
      if(door&&side===1&&i>=door.a&&i<=door.b)continue;
      const pane=new T.Mesh(unitBox,paper);
      pane.position.set(-w/2+(i+.5)*w/bays,raised+h*.55,side*(d*.50+.075));
      pane.scale.set(w/bays*.82-.06,h*.5,.012);group.add(pane);
    }
    return group;
  }
  function masonry(east,north,width,depth,height,base=0){
    const p=world(east,north);
    const mesh=flat(new T.BoxGeometry(width,height,depth),materials.stone,p.x,base+height/2,p.z);
    return uvScale(mesh,Math.max(width,depth)/5.1,height/2.55);
  }

  // ---- Ground -------------------------------------------------------------------------
  const centre=world(0,410);
  // This distant backing plane overlaps part of the avenue's sloping road.
  box(0x677253,centre.x,-8.36,centre.z,900,.65,1280).userData.flatBackground=true;
  plot(rect(-326,-177,2,880),materials.garden.grove,-.12);
  plot(gbWallOutline,materials.earth,.008);
  plot(gbFrontApron,materials.paving,.028).name="광화문 앞 보도";
  // Hyoja-ro shares the palace's grade. Give the narrow path a continuous shoulder next to the wall.
  for(const {points,width} of gbWestPaths)ribbon(points,-width/2-5,width/2+5,materials.earth,-.04);
  for(const {kind,west,east,south,north} of gbLawns){
    const grass=clipGbGround(west,east,south,north);
    if(grass.length>=3)plot(grass,materials.garden[kind],.017);
    yield;
  }
  const outerCourt=gbCourts.heungnye,throneCourt=gbCourts.geunjeong;
  plot(rect(outerCourt.west+1,outerCourt.east-1,outerCourt.south+1,outerCourt.north-1),materials.gravel,.022);
  const royalPath=gbPaths.find(path=>path.ceremonial),halfWay=royalPath.width/2;
  const stairFront=gwanghwamun.y-royalPath.points.at(-1).y;
  const {west,east,south,north}=throneCourt;
  for(const [w,e,s,n] of [[west+1,-halfWay,south+1,stairFront],[halfWay,east-1,south+1,stairFront],
    [west+1,east-1,stairFront,north-1]])plot(rect(w,e,s,n),materials.court,.022);
  // Keep the surface of the higher path at a junction, and trim the lower ribbon.
  // Two almost coplanar ribbons exchange places in the depth buffer at distance.
  const groundPaths=gbPaths.map((path,i)=>({...path,level:(path.surface==="stone"?.054:.030)+i*.0004}));
  const covered=[];
  for(const {name,points,width,surface,level,ceremonial} of groundPaths.sort((a,b)=>b.level-a.level)){
    const material=ceremonial?materials.royalWay:surface==="stone"?materials.paving:materials.gravel;
    const footpath=ribbon(points,-width/2,width/2,material,level);
    footpath.name=name;
    const old=footpath.geometry,{index,attributes:{position,uv}}=old;
    const vertices=Array.from({length:position.count},(_,i)=>({x:position.getX(i),y:position.getZ(i),u:uv.getX(i),v:uv.getY(i)}));
    const triangles=Array.from({length:index.count/3},(_,i)=>[0,1,2].map(j=>vertices[index.getX(i*3+j)]));
    const positions=[],texels=[];
    for(const piece of coverTriangles(triangles)){
      const [a,b,c]=piece.points,ux=b.x-a.x,uy=b.y-a.y,vx=c.x-a.x,vy=c.y-a.y,area=ux*vy-uy*vx;
      for(const [first,...rest] of exposedSurface(piece.points,covered))for(let i=1;i<rest.length;i++){
        const triangle=[first,rest[i-1],rest[i]],turn=piece.sign;
        for(const {x,y} of turn<0?triangle:[triangle[0],triangle[2],triangle[1]]){
          const u=((x-a.x)*vy-(y-a.y)*vx)/area,v=(ux*(y-a.y)-uy*(x-a.x))/area;
          positions.push(x,level,y);
          texels.push(a.u+u*(b.u-a.u)+v*(c.u-a.u),a.v+u*(b.v-a.v)+v*(c.v-a.v));
        }
      }
      covered.push(piece);
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(texels,2));geometry.computeVertexNormals();
    footpath.geometry=geometry;old.dispose();
  }
  yield;

  // ---- Palace wall and its gates ---------------------------------------------------------
  const wallHeight=4.7;
  for(const run of gbOuterWallRuns)for(let i=1;i<run.length;i++){
    wall(run[i-1],run[i],wallHeight,false,false);
    if(i%4===0)yield;
  }
  const [westEntryNorth,westEntrySouth]=gbMuseumWestGate.jambs;
  const westEntryAngle=-Math.atan2(westEntrySouth.y-westEntryNorth.y,westEntrySouth.x-westEntryNorth.x);
  for(const {x,y} of gbMuseumWestGate.jambs){
    box(stoneTint,wx(x),1.52,wz(y),.72,3.04,.86).rotation.y=westEntryAngle;
    box(0x414b45,wx(x),3.15,wz(y),.92,.23,1.07).rotation.y=westEntryAngle;
    block(wx(x),wz(y),.72,.86,westEntryAngle,3.27);
  }
  const gates=gbEastOpenings.map(({y,width})=>[y-width/2,y+width/2]).sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<gbEastWall.length;i++){
    const a=gbEastWall[i-1],b=gbEastWall[i],dy=b.y-a.y;
    if(!dy){
      if(!gates.some(([low,high])=>a.y>low&&a.y<high))wall(a,b,wallHeight,false,false);
      continue;
    }
    const point=y=>({x:a.x+(b.x-a.x)*(y-a.y)/dy,y});
    const end=Math.max(a.y,b.y);
    let start=Math.min(a.y,b.y);
    for(const [low,high] of gates){
      if(high<=start||low>=end)continue;
      if(low-start>.35)wall(point(start),point(low),wallHeight,false,false);
      start=Math.max(start,high);
    }
    if(end-start>.35)wall(point(start),point(end),wallHeight,false,false);
    if(i%4===0)yield;
  }

  // Gwanghwamun: a stone base with three arched passages carrying a two-storey gatehouse.
  const gateParts=scene.children.length;
  const baseHeight=6.6,piers=[[-15.6,-10.6],[-6.2,-2.9],[2.9,6.2],[10.6,15.6]];
  for(const [west,east] of piers){
    masonry((west+east)/2,0,east-west,11.4,baseHeight);
    solid((west+east)/2,0,east-west,11.4);
  }
  for(const [west,east] of [[-10.6,-6.2],[-2.9,2.9],[6.2,10.6]]){
    const span=east-west,spring=west===-2.9?4.5:3.9;
    masonry((west+east)/2,0,span,11.4,baseHeight-spring-span*.28,spring+span*.28);
    // Rounded head of the passage.
    const arch=world((west+east)/2,0);
    const shell=new T.CylinderGeometry(span/2,span/2,11.2,18,1,true,0,Math.PI);
    shell.rotateZ(Math.PI/2);shell.rotateY(Math.PI/2);
    const vault=flat(shell,matte(0x8d897c),arch.x,spring,arch.z);
    vault.material.side=T.DoubleSide;
    slab(0x6f6a5e,(west+east)/2,0,span,11.2,.05,spring+span*.28-.03);
  }
  for(const north of [-5.5,5.5])slab(stoneTint,0,north,31.6,.42,.95,baseHeight);
  slab(0xa7a091,0,0,31.4,11.6,.2,baseHeight-.1);
  const gateSpec=gbSite.gwanghwamun;
  const gatehouse=pavilion({...gateSpec,h:6.6,raised:.3,rise:3.1,hip:true,noCollision:true});
  gatehouse.position.y=baseHeight;groups.set("gwanghwamun",gatehouse);
  anchorParts(gateParts,gwanghwamun);
  // Haetae statues guard the square: seated granite beasts with a curled mane, bulging eyes,
  // a wide grin, a neck bell and scales, each on a stepped pedestal, heads turned to the road.
  const granite=new Map();
  // Large rounded masses are smooth; curls, scales and toes stay faceted like chiselled stone.
  const carved=(color,flatShading)=>{
    const key=color*2+(flatShading?1:0);
    if(!granite.has(key))granite.set(key,new T.MeshStandardMaterial({color,roughness:.95,flatShading}));
    return granite.get(key);
  };
  const ball=new T.SphereGeometry(1,20,14),bead=new T.SphereGeometry(1,7,5),cube=new T.BoxGeometry(1,1,1);
  const post=new T.CylinderGeometry(.8,1,1,12),curl=new T.TorusGeometry(.27,.1,8,16,Math.PI*1.55);
  const collar=new T.TorusGeometry(.45,.055,5,14);
  const stone={body:0xb7b1a2,light:0xc7c1b2,shade:0x9a9486,dark:0x625e55};
  function haetae(headTurn){
    const statue=new T.Group(),head=new T.Group(),aim=new T.Vector3();
    const part=(geometry,color,x,y,z,sx,sy=sx,sz=sx,parent=statue)=>{
      const mesh=new T.Mesh(geometry,carved(color,geometry===bead||geometry===cube));
      mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
    };
    // Flat discs laid on an ellipsoid in staggered rows read as scales.
    const scales=(cx,cy,cz,rx,ry,rz,rows)=>{
      rows.forEach(([polar,from,to,count],row)=>{
        for(let i=0;i<count;i++){
          const turn=(from+(to-from)*(i+(row%2)*.5)/count)*Math.PI/180,tilt=polar*Math.PI/180;
          const dx=Math.sin(tilt)*Math.sin(turn),dy=Math.cos(tilt),dz=Math.sin(tilt)*Math.cos(turn);
          const scale=part(bead,row%2?stone.light:stone.body,cx+dx*rx,cy+dy*ry,cz+dz*rz,.115,.115,.045);
          scale.lookAt(aim.set(cx+dx*rx+dx/rx,cy+dy*ry+dy/ry,cz+dz*rz+dz/rz));
        }
      });
    };
    // Haunches, torso and chest of a beast sitting upright.
    part(ball,stone.body,0,.52,-.5,.72,.56,.78);
    part(ball,stone.body,0,.84,-.04,.62,.6,.72).rotation.x=-.5;
    part(ball,stone.body,0,1.03,.36,.56,.58,.46);
    part(ball,stone.body,0,1.3,.4,.46,.4,.42);
    scales(0,.52,-.5,.72,.56,.78,[[28,70,290,7],[52,60,300,10],[76,55,305,11]]);
    scales(0,.84,-.04,.62,.6,.72,[[40,50,130,3],[40,230,310,3],[66,50,130,3],[66,230,310,3]]);
    for(let i=0;i<7;i++){
      const t=i/6;
      part(bead,stone.light,0,1.42-t*.36+Math.sin(t*Math.PI)*.1,.02-t*1.0,.09,.075,.12).rotation.x=.5-t*.9;
    }
    for(const side of [-1,1]){
      part(post,stone.body,side*.34,.5,.62,.2,.98,.22);
      part(ball,stone.body,side*.37,.98,.5,.24,.3,.26);
      part(ball,stone.light,side*.34,.11,.76,.22,.12,.3);
      part(ball,stone.body,side*.56,.44,-.36,.3,.45,.5);
      part(ball,stone.light,side*.6,.1,.16,.2,.11,.34);
      for(const toe of [-1,0,1]){
        part(bead,stone.light,side*.34+toe*.13,.085,1.0-Math.abs(toe)*.04,.075);
        part(bead,stone.light,side*.6+toe*.12,.08,.46-Math.abs(toe)*.04,.07);
      }
      // Flame-shaped tufts at the shoulders.
      part(bead,stone.light,side*.5,.98,.3,.1,.2,.16).rotation.x=-.5;
      part(bead,stone.light,side*.54,.84,.16,.08,.16,.13).rotation.x=-.7;
    }
    // Tail curled up against the back with a flame tuft.
    const tail=part(curl,stone.body,0,.98,-1.1,1);
    tail.rotation.set(0,Math.PI/2,0);tail.rotateZ(-.9);
    for(const [y,z,size] of [[1.3,-.92,.13],[1.44,-.84,.1],[1.26,-.74,.09]])part(bead,stone.light,0,y,z,size*.8,size*1.3,size);
    // Collar and bell.
    part(collar,stone.shade,0,1.2,.44,1).rotation.x=Math.PI/2-.45;
    part(ball,stone.light,0,.99,.86,.13);
    part(bead,stone.dark,0,.93,.96,.05,.03,.05);
    // Head.
    head.position.set(0,1.64,.56);statue.add(head);
    const face=(geometry,color,x,y,z,sx,sy,sz)=>part(geometry,color,x,y,z,sx,sy,sz,head);
    face(ball,stone.body,0,0,0,.56,.5,.52);
    face(ball,stone.light,0,-.14,.36,.44,.26,.3);
    face(ball,stone.shade,0,-.3,.3,.38,.14,.26);
    face(ball,stone.dark,0,-.235,.35,.452,.034,.312);
    for(let i=0;i<7;i++){
      const x=(i-3)*.085,z=.35+.3*Math.sqrt(Math.max(0,1-(x/.44)**2))-.012;
      face(cube,0xdad4c5,x,-.235,z,.06,.075,.045).rotation.y=x*1.9;
    }
    for(const side of [-1,1]){
      // Fangs at the corners of the grin.
      face(bead,0xdad4c5,side*.31,-.2,.55,.04,.085,.04);
      face(ball,stone.light,side*.25,.14,.38,.135);
      face(bead,stone.dark,side*.27,.14,.49,.062,.062,.04);
      face(ball,stone.shade,side*.25,.28,.36,.2,.07,.15).rotation.z=-side*.28;
      face(bead,stone.body,side*.47,.2,-.04,.1,.17,.2);
      face(bead,stone.dark,side*.085,-.05,.735,.038,.03,.03);
      face(bead,stone.light,side*.33,-.36,.14,.09,.15,.1);
    }
    face(ball,stone.body,0,-.02,.63,.2,.12,.12);
    face(bead,stone.light,0,.5,-.02,.11,.17,.13);
    face(bead,stone.light,0,-.44,.2,.13,.17,.11);
    // Mane: two rings of curls behind the face and a ridge down the neck.
    for(let i=0;i<12;i++){
      const angle=(-48+i*276/11)*Math.PI/180;
      face(bead,i%2?stone.light:stone.body,Math.cos(angle)*.56,Math.sin(angle)*.5+.02,-.1,.16,.16,.14);
    }
    for(let i=0;i<9;i++){
      const angle=(-36+i*252/8)*Math.PI/180;
      face(bead,i%2?stone.body:stone.light,Math.cos(angle)*.45,Math.sin(angle)*.41+.02,-.34,.15,.15,.14);
    }
    for(const [x,y,z] of [[0,.2,-.5],[-.2,.02,-.5],[.2,.02,-.5],[0,-.16,-.48],[-.17,-.32,-.4],[.17,-.32,-.4]])face(bead,stone.light,x,y,z,.14);
    head.rotation.set(.06,headTurn,0);
    return statue;
  }
  for(const {side,east,north} of gbHaetae){
    const parts=scene.children.length;
    slab(0xa29c8e,east,north,3.1,4.3,.55,-.15);
    slab(0xb1ab9c,east,north,2.6,3.8,.72,.4);
    slab(0xbab4a5,east,north,2.8,4.0,.14,1.12);
    solid(east,north,3.1,4.3,3.4);
    const p=world(east,north),statue=haetae(-side*.5);
    statue.position.set(p.x,1.26,p.z);statue.scale.setScalar(1.2);statue.name="광화문 해태상";
    scene.add(statue);
    anchorParts(parts,at(east,north));
    yield;
  }

  // Woldae: a low two-step stone terrace with railings and the raised royal path, leading
  // from the square up to the three arches.
  {
    const {half,south,north,tier}=gbWoldae,mid=(south+north)/2,length=north-south;
    const parts=scene.children.length;
    slab(0xa7a192,0,mid-.3,half*2+1.2,length+.6,tier+.10,-.10);
    solid(0,mid-.3,half*2+1.2,length+.6,tier);
    slab(stoneTint,0,mid,half*2,length,tier,tier);
    solid(0,mid,half*2,length,tier*2);
    slab(0xcbc4b1,0,mid,7.2,length,.03,tier*2);
    for(const edge of [-3.6,3.6])slab(0x9d978a,edge,mid,.16,length,.035,tier*2);
    // One more step inside the arches, where the terrace meets the gate floor.
    slab(0xa7a192,0,north+.45,21.2,.9,tier);
    solid(0,north+.45,21.2,.9,tier);
    for(const side of [-1,1]){
      const east=side*(half-.2),count=Math.round(length/2.3);
      for(let i=0;i<=count;i++){
        const n=south+.2+i*(length-.4)/count;
        slab(0xbdb6a4,east,n,.26,.26,.95,tier*2);
        slab(0xc8c1af,east,n,.34,.34,.1,tier*2+.95);
      }
      slab(0xb5ae9c,east,mid,.16,length-.4,.14,tier*2+.66);
      slab(0xb5ae9c,east,mid,.14,length-.4,.3,tier*2+.1);
      solid(east,mid,.3,length,tier*2+1.1);
    }
    anchorParts(parts,at(0,mid));
  }

  yield;
  // ---- Buildings ------------------------------------------------------------------------
  const built=spec=>{groups.set(spec.id,pavilion(spec));return groups.get(spec.id);};
  // What each hall was used for decides how its room is furnished.
  const rooms={sajeongjeon:"council",manchunjeon:"plain",cheonchujeon:"plain",sujeongjeon:"library",bihyeongak:"library",jibokjae:"library"};
  for(const spec of gbSites){
    if(spec.kind==="gate")built({...spec,gate:true,raised:.12,h:spec.stories===2?spec.h*1.9:spec.h,rise:spec.stories===2?2.9:2.0});
    else if(spec.kind==="hall")built({...spec,raised:.55,rise:2.0+spec.w*.02,interior:rooms[spec.id]??"living"});
    else if(spec.kind==="sideGate"&&(spec.id==="geonchunmun"||spec.id==="yeongchumun")){
      built({...spec,gate:true,raised:.16,rise:2.1});
    }else if(spec.kind==="sideGate"){
      const g=built({...spec,raised:.3,rise:2.1,noCollision:true});
      const p=world(spec.east,spec.north);
      box(0xa9a394,0,-.25,0,spec.w+1.38,.56,spec.d+1.08,g);
      block(p.x,p.z,spec.w+1.6,spec.d+1.4,spec.angle);
      g.position.y=0;
    }else if(spec.kind==="museum"){
      const g=built({...spec,raised:1.1,rise:4.6,hip:true});
      g.name=spec.name;
    }
    yield;
  }

  // Throne hall on a two-tier stone terrace. The terrace and its steps are low boxes, so
  // walkers climb them a step at a time (or hop up the side).
  const throne=gbSite.geunjeongjeon,tier=.85,riser=.17,tread=.38;
  const throneParts=scene.children.length;
  const tiers=[{half:29,south:276,north:323,top:tier,base:0},{half:22.6,south:283,north:317,top:tier*2,base:tier}];
  for(const {half,south,north,top,base} of tiers){
    const footing=base||-.15;
    // The box supplies the four vertical faces. Tile only its top, using the hall axis.
    const sides=new T.BoxGeometry(half*2,top-footing,north-south);
    const triangles=Array.from(sides.index.array);
    sides.setIndex([...triangles.slice(0,12),...triangles.slice(18)]);
    const p=world(0,(south+north)/2);
    flat(sides,matte(stoneTint),p.x,(top+footing)/2,p.z);
    const topSurface=flat(new T.PlaneGeometry(half*2,north-south),materials.terraceStone,p.x,top,p.z);
    topSurface.rotation.x=-Math.PI/2;topSurface.receiveShadow=true;
    uvScale(topSurface,half*2/3.2,(north-south)/3.2);
    solid(0,(south+north)/2,half*2,north-south,top);
    // Steps: front (wide, on the royal road), back and both sides.
    const flights=[[0,south,0,-1,9],[0,north,0,1,5],[-half,300,-1,0,5],[half,300,1,0,5]];
    for(const [east,northAt,dx,dn,width] of flights)for(let step=0;step<5;step++){
      const height=base+(step+1)*riser,out=(4.5-step)*tread;
      const e=east+dx*out,n=northAt+dn*out;
      const w=dx?tread:width,d=dx?width:tread;
      slab(0xb0ab9a,e,n,w,d,height-footing,footing);
      solid(e,n,w,d,height);
    }
    // Stone balustrade posts along the edge.
    for(let i=-6;i<=6;i++){
      if(Math.abs(i)<2)continue;
      for(const n of [south+.3,north-.3])slab(0xc1b9a6,i*half/6.2,n,.3,.3,.8,top);
    }
    for(const n of [south+.3,north-.3])for(const side of [-1,1])slab(0xc1b9a6,side*half*4/6.2,n,half*4/6.2,.14,.12,top+.56);
    for(const side of [-1,1]){
      const count=Math.round((north-south-.6)/3.4);
      for(let i=0;i<=count;i++){
        const n=south+.3+i*(north-south-.6)/count;
        if(Math.abs(n-300)>=3.3)slab(0xc1b9a6,side*(half-.3),n,.3,.3,.8,top);
      }
      for(const [a,b] of [[south+.3,296.7],[303.3,north-.3]])slab(0xc1b9a6,side*(half-.3),(a+b)/2,.14,b-a,.12,top+.56);
    }
    yield;
  }
  // Bronze water vats at the terrace corners and incense burners before the hall.
  for(const sx of [-1,1]){
    for(const n of [285.6,314.4]){
      const p=world(sx*20,n);
      cylinder(0xa9a394,p.x,tier*2+.12,p.z,.66,.24,8);
      cylinder(0x4b4a40,p.x,tier*2+.5,p.z,.5,.52,14,scene,1.16);
      cylinder(0x2a2c29,p.x,tier*2+.765,p.z,.52,.02,14);
      solid(sx*20,n,1.3,1.3,tier*2+.8);
    }
    const p=world(sx*11.5,285);
    for(let leg=0;leg<3;leg++)cylinder(0x4b4a40,p.x+Math.cos(leg*2.094)*.26,tier*2+.2,p.z+Math.sin(leg*2.094)*.26,.05,.4,6);
    cylinder(0x54524a,p.x,tier*2+.62,p.z,.3,.48,12,scene,1.25);
    cylinder(0x4b4a40,p.x,tier*2+.95,p.z,.4,.18,12,scene,.35);
    cylinder(0x6a675c,p.x,tier*2+1.1,p.z,.07,.14,8);
    solid(sx*11.5,285,.8,.8,tier*2+1.1);
  }
  const hallGroup=pavilion({...throne,h:12.4,raised:.5,rise:4.1,hip:true,interior:"throne",lift:tier*2});
  hallGroup.position.y=tier*2;groups.set(throne.id,hallGroup);
  anchorParts(throneParts,throne);
  yield;
  // Rank stones line the royal road in the court.
  for(const side of [-1,1])for(let i=0;i<12;i++){
    slab(0x9d9e91,side*6.4,242+i*2.7,.34,.28,.62);
    solid(side*6.4,242+i*2.7,.34,.28,.62);
  }

  // Covered corridors around the courts, with gateways left open.
  function* corridor(a,b,gaps=[]){
    const vertical=a[0]===b[0],from=vertical?a[1]:a[0],to=vertical?b[1]:b[0];
    let cursor=Math.min(from,to);
    const end=Math.max(from,to);
    for(const [low,high] of [...gaps].sort((p,q)=>p[0]-q[0]).concat([[end,end]])){
      if(low-cursor>.6){
        coveredWall(vertical?at(a[0],cursor):at(cursor,a[1]),vertical?at(a[0],low):at(low,a[1]),3.5);
        yield;
      }
      cursor=Math.max(cursor,high);
    }
  }
  const {heungnye,geunjeong,sajeong}=gbCourts;
  yield* corridor([heungnye.west,heungnye.south],[heungnye.east,heungnye.south],[[-10,10]]);
  for(const east of [heungnye.west,heungnye.east])yield* corridor([east,heungnye.south],[east,heungnye.north],[[190,198]]);
  yield* corridor([heungnye.west,geunjeong.south],[heungnye.east,geunjeong.south],[[-9.6,9.6]]);
  for(const east of [geunjeong.west,geunjeong.east])yield* corridor([east,geunjeong.south],[east,geunjeong.north],[[244,251],[330,337]]);
  yield* corridor([geunjeong.west,geunjeong.north],[geunjeong.east,geunjeong.north],[[-6.4,6.4]]);
  for(const east of [sajeong.west,sajeong.east])yield* corridor([east,sajeong.south],[east,sajeong.north],[[366,372]]);
  yield* corridor([sajeong.west,sajeong.north],[sajeong.east,sajeong.north],[[-14,-9],[9,14]]);

  // Yeongjegyo: the stone bridge over the stream that crosses the first court.
  const streamNorth=180,streamWidth=5.2,bridgeHalf=5.2;
  for(const side of [-1,1]){
    const length=heungnye.east-1.2-bridgeHalf,east=side*(bridgeHalf+length/2);
    slab(0x4f7377,east,streamNorth,length,streamWidth,.05,.02).material=waterMaterial;
    for(const edge of [-1,1])slab(0xa5a79e,east,streamNorth+edge*(streamWidth/2+.2),length,.4,.36);
    solid(east,streamNorth,length,streamWidth+.8,.36);
    slab(0xa2a49a,side*bridgeHalf,streamNorth,.34,streamWidth+2.2,.95);
    solid(side*bridgeHalf,streamNorth,.34,streamWidth+2.2,.95);
  }
  slab(0xb1b1a4,0,streamNorth,bridgeHalf*2,streamWidth+2.4,.08);

  yield;
  // ---- Gyeonghoeru and its pond ----------------------------------------------------------
  const lake=gbLake;
  plot(rect(lake.west,lake.east,lake.south,lake.north),waterMaterial,.043);
  for(const [a,b] of [[[lake.west,lake.south],[lake.east,lake.south]],[[lake.west,lake.north],[lake.east,lake.north]],
    [[lake.west,lake.south],[lake.west,lake.north]],[[lake.east,lake.south],[lake.east,lake.north]]]){
    const length=Math.hypot(b[0]-a[0],b[1]-a[1])+.6,vertical=a[0]===b[0];
    slab(0xa9a698,(a[0]+b[0])/2,(a[1]+b[1])/2,vertical?.6:length,vertical?length:.6,.3);
  }
  const {island}=lake;
  slab(0xb3ad9d,(island.west+island.east)/2,(island.south+island.north)/2,island.east-island.west,island.north-island.south,.09);
  for(const bridge of lake.bridges){
    slab(0xb8b2a2,(bridge.west+bridge.east)/2,bridge.north,bridge.east-bridge.west+1.2,bridge.width,.1);
    solid((bridge.west+bridge.east)/2,bridge.north,bridge.east-bridge.west+1.2,bridge.width,.1);
    for(const edge of [-1,1]){
      const n=bridge.north+edge*(bridge.width/2+.12);
      slab(0xa7a394,(bridge.west+bridge.east)/2,n,bridge.east-bridge.west,.22,.8);
      solid((bridge.west+bridge.east)/2,n,bridge.east-bridge.west,.22,.8);
    }
  }
  // Gyeonghoeru: 48 stone pillars (square outside, round inside) carry an open banquet floor
  // under one great roof. The ground floor is open to walk through; two timber stairs lead up.
  {
    const {centre,long,short,floor,base,norths,easts,stairs,columns}=gbRoyalPavilion;
    const parts=scene.children.length;
    const hall=new T.Group(),middle=world(centre.east,centre.north);
    // The group's x axis runs north along the long side; z runs east.
    hall.position.set(middle.x,0,middle.z);hall.rotation.y=Math.PI/2;hall.name="경회루";scene.add(hall);
    groups.set("gyeonghoeru",hall);
    const beam=(color,a,b,thick,tall)=>{
      run.set(b.x-a.x,b.y-a.y,b.z-a.z);
      const piece=box(color,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,run.length(),tall,thick);
      piece.quaternion.setFromUnitVectors(xAxis,run.normalize());
    };
    slab(0xa9a393,centre.east,centre.north,short+3.2,long+3.2,.19);
    solid(centre.east,centre.north,short+3.2,long+3.2,.19);
    slab(stoneTint,centre.east,centre.north,short+2,long+2,.19,.19);
    solid(centre.east,centre.north,short+2,long+2,base);
    for(const [i,north] of norths.entries()){
      for(const [j,east] of easts.entries()){
        const outer=i===0||i===7||j===0||j===5,p=world(east,north);
        if(outer)slab(0xb5af9f,east,north,.74,.74,4.5,base);
        else cylinder(0xb0aa9a,p.x,base+2.25,p.z,.4,4.5,12,scene,.86);
        slab(0xa39d8e,east,north,.98,.98,.14,base+4.5);
        solid(east,north,.74,.74,floor-.2);
        // Upper-floor columns stand on the same grid.
        if(outer)cylinder(0x8f4936,p.x,floor+1.9,p.z,.25,3.8,12);
      }
      yield;
    }
    for(const {east,north} of columns){
      const p=world(east,north);
      cylinder(0x8f4936,p.x,floor+1.9,p.z,.27,3.8,12);
      slab(0xb7ab95,east,north,.7,.7,.12,floor);
    }
    // Floor frame: beams on every pillar line, then the boards, leaving the two stairwells open.
    for(const east of easts)slab(0x8a4a36,east,centre.north,.44,long+1.8,.32,base+4.64);
    for(const north of norths)slab(0x356c56,centre.east,north,short+1.8,.38,.3,base+4.65);
    const west=centre.east-short/2-.9,east=centre.east+short/2+.9,south=centre.north-long/2-.9,north=centre.north+long/2+.9;
    const board=(w,e,s,n)=>slab(0x8a6243,(w+e)/2,(s+n)/2,e-w,n-s,.16,floor-.16);
    const [first,second]=stairs;
    board(west,east,south,first.south);
    board(west,Math.min(first.foot,first.head),first.south,first.north);board(Math.max(first.foot,first.head),east,first.south,first.north);
    board(west,east,first.north,second.south);
    board(west,Math.min(second.foot,second.head),second.south,second.north);board(Math.max(second.foot,second.head),east,second.south,second.north);
    board(west,east,second.north,north);
    for(const side of [-1,1]){
      band(hall,0,floor-.34,side*(short/2+.93),long+1.8);
      band(hall,side*(long/2+.93),floor-.34,0,short+1.8,Math.PI/2);
      // Balustrade round the banquet floor.
      for(const [level,thick] of [[.92,.09],[.5,.06],[.14,.06]]){
        box(0x7b4b38,0,floor+level,side*(short/2+.78),long+1.6,thick,.09,hall);
        box(0x7b4b38,side*(long/2+.78),floor+level,0,.09,thick,short+1.6,hall);
      }
      for(let i=0;i<=28;i++)box(0x8a5a44,-long/2-.78+i*(long+1.56)/28,floor+.5,side*(short/2+.78),.07,.9,.07,hall);
      for(let i=0;i<=24;i++)box(0x8a5a44,side*(long/2+.78),floor+.5,-short/2-.78+i*(short+1.56)/24,.07,.9,.07,hall);
      // Lintels and the painted band under the eaves.
      box(0x884d37,0,floor+3.62,side*short/2,long+.5,.34,.3,hall);
      box(0x884d37,side*long/2,floor+3.62,0,.3,.34,short+.5,hall);
      band(hall,0,floor+3.28,side*(short/2+.18),long+.4);
      band(hall,side*(long/2+.18),floor+3.28,0,short+.4,Math.PI/2);
      box(0x356c56,0,floor+3.98,side*(short/2+.3),long+1.2,.4,.6,hall);
      box(0x356c56,side*(long/2+.3),floor+3.98,0,.6,.4,short+1.2,hall);
      yield;
    }
    // Coffered ceiling over the banquet floor.
    box(0x2f5a4a,0,floor+3.82,0,long+.4,.08,short+.4,hall);
    for(let i=1;i<7;i++)box(0x9c5a3f,-long/2+i*long/7,floor+3.74,0,.22,.14,short,hall);
    for(let i=1;i<5;i++)box(0x9c5a3f,0,floor+3.74,-short/2+i*short/5,long,.14,.22,hall);
    const eaves=floor+4.2,rise=5.1,width=long+5.6,depth=short+5.6;
    roof(hall,width,depth,eaves,rise,false);
    box(plaster,0,eaves+rise+.26,0,width*.84+.5,.5,.44,hall);
    box(0x2f3a3b,0,eaves+rise+.54,0,width*.84+.56,.09,.5,hall);
    for(const side of [-1,1])box(0x4b504c,side*(width*.42+.3),eaves+rise+.56,0,.38,.9,.46,hall);
    hips(hall,width,depth,width*.42,eaves,rise,1,6);
    nameplate("慶會樓",hall,0,floor+3.0,short/2+.34,3.4,.85);
    yield;
    // Timber stairs: open treads between two stringers, with handrails.
    for(const {south:low,north:high,foot,head} of stairs){
      const mid=(low+high)/2,steps=27,stride=(head-foot)/steps;
      for(let k=0;k<steps;k++)slab(0x8a6243,foot+stride*(k+.5),mid,Math.abs(stride)+.03,high-low-.24,.06,base+(floor-base)*(k+1)/steps-.06);
      for(const edge of [low+.08,high-.08]){
        const a=world(foot,edge),b=world(head,edge);
        beam(0x6e3f30,{x:a.x,y:base-.05,z:a.z},{x:b.x,y:floor-.05,z:b.z},.1,.3);
        beam(0x7b4b38,{x:a.x,y:base+.95,z:a.z},{x:b.x,y:floor+.95,z:b.z},.07,.08);
        for(let k=0;k<=9;k++){
          const p=world(foot+(head-foot)*k/9,edge);
          box(0x8a5a44,p.x,base+(floor-base)*k/9+.48,p.z,.07,.96,.07);
        }
        // Rail along the stairwell on the upper floor.
        slab(0x7b4b38,(foot+head)/2,edge+(edge<mid?-.12:.12),Math.abs(head-foot),.07,.07,floor+.9);
      }
      slab(0x7b4b38,foot+Math.sign(foot-head)*.06,mid,.07,high-low,.07,floor+.9);
      for(const lift of [.3,.62])slab(0x8a5a44,foot+Math.sign(foot-head)*.06,mid,.05,high-low,.04,floor+lift);
      yield;
    }
    // Stone railing round the island, open at the three bridges.
    const {island}=gbLake;
    function railing(from,to){
      const length=Math.hypot(to[0]-from[0],to[1]-from[1]),count=Math.max(1,Math.round(length/2.3)),alongNorth=from[0]===to[0];
      for(let i=0;i<=count;i++){
        const e=from[0]+(to[0]-from[0])*i/count,n=from[1]+(to[1]-from[1])*i/count;
        slab(0xbdb6a4,e,n,.26,.26,.9,.09);slab(0xc8c1af,e,n,.34,.34,.1,.99);
      }
      const e=(from[0]+to[0])/2,n=(from[1]+to[1])/2;
      slab(0xb5ae9c,e,n,alongNorth?.16:length,alongNorth?length:.16,.14,.72);
      slab(0xb5ae9c,e,n,alongNorth?.14:length,alongNorth?length:.14,.3,.16);
      solid(e,n,alongNorth?.3:length,alongNorth?length:.3,1.15);
    }
    const inset=.5,iw=island.west+inset,ie=island.east-inset,is=island.south+inset,inn=island.north-inset;
    railing([iw,is],[iw,inn]);railing([iw,is],[ie,is]);railing([iw,inn],[ie,inn]);
    yield;
    let cursor=is;
    for(const bridge of gbLake.bridges){
      railing([ie,cursor],[ie,bridge.north-bridge.width/2-.3]);
      cursor=bridge.north+bridge.width/2+.3;
    }
    railing([ie,cursor],[ie,inn]);
    anchorParts(parts,at(centre.east,centre.north));
  }
  for(const isle of lake.isles){
    const ring=Array.from({length:14},(_,i)=>at(isle.east+Math.cos(i*Math.PI/7)*isle.radius,isle.north+Math.sin(i*Math.PI/7)*isle.radius));
    plot(ring,materials.garden.lawn,.11);
  }

  yield;
  // ---- Hyangwonjeong ---------------------------------------------------------------------
  const pond=gbPond;
  const ring=(radius,sides=28)=>Array.from({length:sides},(_,i)=>
    at(pond.east+Math.cos(i*2*Math.PI/sides)*radius,pond.north+Math.sin(i*2*Math.PI/sides)*radius));
  plot(ring(pond.radius+.8),matte(0x8a8878),.03);
  plot(ring(pond.radius),waterMaterial,.043);
  plot(ring(pond.island),materials.garden.lawn,.1);
  const {bridge}=pond;
  slab(0xb8a48c,bridge.east,(bridge.south+bridge.north)/2,bridge.width,bridge.north-bridge.south+1,.1,.06);
  solid(bridge.east,(bridge.south+bridge.north)/2,bridge.width,bridge.north-bridge.south+1,.16);
  for(const edge of [-1,1]){
    const east=bridge.east+edge*(bridge.width/2+.1);
    slab(0x7b4b38,east,(bridge.south+bridge.north)/2,.14,bridge.north-bridge.south,.85,.1);
    solid(east,(bridge.south+bridge.north)/2,.14,bridge.north-bridge.south,.95);
  }
  // A two-storey hexagonal pavilion: curved tile roofs with lifted corners, a railed
  // veranda on each floor and paper-backed lattice windows all round.
  const hex=world(pond.east,pond.north),tower=new T.Group();
  tower.position.set(hex.x,0,hex.z);scene.add(tower);
  const tile=0x384344,timber=0x864d39,hexCorner=(i,radius)=>[Math.cos(i*Math.PI/3+Math.PI/6)*radius,Math.sin(i*Math.PI/3+Math.PI/6)*radius];
  function hexRoof(radius,y,rise,inner){
    const data=[],levels=5,cols=6;
    const surface=(i,t,u)=>{
      const [ax,az]=hexCorner(i,1),[bx,bz]=hexCorner(i+1,1),r=radius*(1-t)+inner*t;
      return [(ax+(bx-ax)*u)*r,y+rise*(.3*t+.7*t*t)+Math.abs(u*2-1)**3*.55*(1-t)**2,(az+(bz-az)*u)*r];
    };
    const rib=(a,b,radius,color)=>{
      run.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
      const piece=cylinder(color,(a[0]+b[0])/2,(a[1]+b[1])/2+.04,(a[2]+b[2])/2,radius,run.length()+.04,6,tower);
      piece.quaternion.setFromUnitVectors(upAxis,run.normalize());
    };
    for(let i=0;i<6;i++){
      for(let a=0;a<levels;a++)for(let b=0;b<cols;b++){
        const v1=surface(i,a/levels,b/cols),v2=surface(i,(a+1)/levels,b/cols);
        const v3=surface(i,(a+1)/levels,(b+1)/cols),v4=surface(i,a/levels,(b+1)/cols);
        data.push(...v1,...v2,...v3,...v1,...v3,...v4);
      }
      for(let a=0;a<4;a++){
        rib(surface(i,a/4,0),surface(i,(a+1)/4,0),.11,0x2f3a3b);
        for(let b=1;b<8;b++)if(a<3)rib(surface(i,a*.3,b/8),surface(i,(a+1)*.3,b/8),.06,b%3?0x394543:0x53615f);
      }
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(data,3));geometry.computeVertexNormals();
    shape(geometry,tile,0,0,0,tower).material.side=T.DoubleSide;
  }
  // One storey: a hexagonal room with windows, six pillars and a railing around its veranda.
  function hexFloor(base,height,room,posts,deck){
    cylinder(0x6a4a3a,0,base+.1,0,deck,.2,6,tower);
    cylinder(timber,0,base+.2+height/2,0,room,height,6,tower);
    for(let i=0;i<6;i++){
      const middle=i*Math.PI/3+Math.PI/3,apothem=room*Math.cos(Math.PI/6),side=room*.78;
      const turn=Math.PI/2-middle,cx=Math.cos(middle),cz=Math.sin(middle);
      const pane=new T.Mesh(unitBox,paper);
      pane.position.set(cx*(apothem+.03),base+.2+height*.56,cz*(apothem+.03));pane.scale.set(side,height*.6,.02);pane.rotation.y=turn;tower.add(pane);
      for(let bar=-3;bar<=3;bar++){
        const lattice=box(0x285548,cx*(apothem+.05)-cz*bar*side/7,base+.2+height*.56,cz*(apothem+.05)+cx*bar*side/7,.05,height*.6,.04,tower);
        lattice.rotation.y=turn;
      }
      for(const level of [.3,.56,.82]){
        const lattice=box(0x4f7662,cx*(apothem+.05),base+.2+height*level,cz*(apothem+.05),side,.05,.04,tower);
        lattice.rotation.y=turn;
      }
      box(0x476e5b,cx*(apothem+.02),base+.2+height*.14,cz*(apothem+.02),side,height*.24,.05,tower).rotation.y=turn;
      const [px,pz]=hexCorner(i,posts);
      cylinder(0x8f4936,px,base+.2+height/2,pz,.16,height,8,tower);
      box(0x35664f,px,base+.2+height-.1,pz,.5,.3,.5,tower);
      const rail=deck*Math.cos(Math.PI/6)-.12;
      for(const [level,thick] of [[.92,.07],[.5,.05]]){
        box(0x7b4b38,cx*rail,base+.2+level,cz*rail,deck*.98,thick,.07,tower).rotation.y=turn;
      }
      for(let bar=-3;bar<=3;bar++)box(0x8a5a44,cx*rail-cz*bar*deck/7.2,base+.66,cz*rail+cx*bar*deck/7.2,.05,.5,.05,tower);
    }
  }
  cylinder(0xb4ae9e,0,.35,0,5.6,.7,6,tower);
  cylinder(0xa59f90,0,.76,0,5.3,.12,6,tower);
  hexFloor(.8,3.3,3.1,4.25,4.7);
  hexRoof(6.5,4.35,1.5,2.7);
  hexFloor(5.2,2.5,2.45,2.75,3.2);
  hexRoof(5.3,7.95,2.7,.2);
  cylinder(0x4b504c,0,10.72,0,.42,.3,6,tower,.6);
  cylinder(0x9c8a52,0,11.1,0,.3,.5,8,tower,.45);
  cylinder(0x9c8a52,0,11.45,0,.12,.24,8,tower,.2);
  block(hex.x,hex.z,8.2,8.2);
  groups.set("hyangwonjeong",tower);

  yield;
  // ---- Cheongsachorong lanterns ----------------------------------------------------------
  // Red-over-blue silk lanterns on wooden posts line the royal road and both ponds.
  function chorong(east,north){
    const point=at(east,north);
    if(solidAt(point.x,point.y))return;
    const p=world(east,north),hang=p.x+(east<0?.4:-.4);
    cylinder(0x5a4334,p.x,1.22,p.z,.05,2.44,6);
    box(0x5a4334,(p.x+hang)/2,2.4,p.z,.52,.05,.05);
    for(const [material,y] of [[silkRed,2.08],[silkBlue,1.86]]){
      const silk=new T.Mesh(shade,material);
      silk.position.set(hang,y,p.z);silk.scale.set(.15,.22,.15);scene.add(silk);
    }
    cylinder(0xc9a64a,hang,2.21,p.z,.1,.04,8);
    cylinder(0xc9a64a,hang,1.74,p.z,.1,.04,8);
    box(0xb5382f,hang,1.6,p.z,.03,.24,.03);
    block(p.x,p.z,.2,.2,0,2.5);
  }
  for(const side of [-1,1]){
    for(let north=14;north<=124;north+=12.2)chorong(side*6.3,north);
    for(let north=147;north<=225;north+=13)chorong(side*6.6,north);
    for(let north=240;north<=272;north+=10.5)chorong(side*10.5,north);
    for(let north=466;north<=600;north+=22)chorong(side*4.4-6,north+20);
  }
  for(let north=373;north<=480;north+=11.6)chorong(gbLake.east+3.2,north);
  for(let east=gbLake.west+10;east<gbLake.east;east+=14.5)chorong(east,gbLake.south-3.4);
  for(let i=0;i<16;i++){
    const angle=i*Math.PI/8+.2;
    chorong(gbPond.east+Math.cos(angle)*(gbPond.radius+3.4),gbPond.north+Math.sin(angle)*(gbPond.radius+3.4));
  }

  // ---- Photo spot in the throne-hall court -------------------------------------------------
  {
    const spot={x:wx(gbPhotoZone.x),z:wz(gbPhotoZone.y)},lens=gbPhotoZone.tripod;
    cylinder(0xe2c36a,spot.x,.045,spot.z,1.15,.02,28);
    cylinder(0xb7ab95,spot.x,.05,spot.z,.92,.022,28);
    const x=wx(lens.x),z=wz(lens.y);
    for(let leg=0;leg<3;leg++){
      const stick=cylinder(0x2e3336,x+Math.cos(leg*2.094+.5)*.2,.56,z+Math.sin(leg*2.094+.5)*.2,.022,1.16,6);
      stick.rotation.set(Math.sin(leg*2.094+.5)*.33,0,-Math.cos(leg*2.094+.5)*.33);
    }
    box(0x25292c,x,1.2,z,.26,.18,.16);
    cylinder(0x15181a,x,1.2,z-.13,.07,.12,12).rotation.x=Math.PI/2;
    box(0xc9a64a,x+.08,1.31,z,.06,.04,.06);
    block(x,z,.5,.5,0,1.4);
    const board=world(3.4,262.4);
    box(0x5a4334,board.x,.55,board.z,.07,1.1,.07);
    box(0x2f4b3f,board.x,1.25,board.z,1.2,.5,.06);
    nameplate("포토존",scene,board.x,1.25,board.z-.04,1.1,.42,"#2f4b3f","#f0dca8").rotation.y=Math.PI;
    nameplate("포토존",scene,board.x,1.25,board.z+.04,1.1,.42,"#2f4b3f","#f0dca8");
    block(board.x,board.z,.3,.3,0,1.5);
  }

  buildSubwayExit(T,scene,kit,tools,gbStation,"경복궁 Gyeongbokgung",0xef7c1c);
  yield;

  yield* buildGyeongbokCompounds(T,scene,kit,tools,groups);

  // ---- Planting --------------------------------------------------------------------------
  let surveyed=0;
  for(const group of groups.values()){
    treeClearance.addModel(group);
    if(++surveyed%3===0)yield;
  }
  const awayFromRoads=(x,y)=>gbPaths.every(({points,width})=>pathClear(points,x,y,width/2+1.6));
  function plant(east,north,height,choice){
    const point=at(east,north),x=wx(point.x),z=wz(point.y);
    if(north>=0&&!insideGbWall(point.x,point.y)||inGyeongbokCompound(east,north)||solidAt(point.x,point.y)||
      gyeongbokWater(point.x,point.y)||!awayFromRoads(point.x,point.y)||!treeFits(x,z,height))return false;
    return Boolean(tree(x,z,height,choice));
  }
  for(const {kind,west,east,south,north} of gbLawns){
    if(kind==="parterre"){
      for(let i=0;i<26;i++){
        const p=world(west+rand()*(east-west),south+rand()*(north-south));
        treeKit.shrub(p.x,p.z,.5+rand()*.5,["deep","fresh","olive","maple","amber"][Math.floor(rand()*5)]);
      }
    }else{
      const area=(east-west)*(north-south);
      const wanted=Math.min(22,Math.round(area/(kind==="grove"?330:900)));
      for(let attempt=0,planted=0;attempt<wanted*5&&planted<wanted;attempt++){
        if(plant(west+rand()*(east-west),south+rand()*(north-south),6+rand()*6.5,treeMix.garden()))planted++;
        if((attempt+1)%3===0&&planted<wanted)yield;
      }
    }
    yield;
  }
  for(const isle of gbLake.isles)plant(isle.east,isle.north,6.5,{style:"branchy",palette:"pine"});
  for(const [east,north] of [[-48,60],[48,60],[-40,110],[40,110],[-150,240],[150,360],[-44,520],[44,540],[70,446],[-70,360]]){
    plant(east,north,8+rand()*4,rand()<.5?{style:"round",palette:"ginkgo"}:treeMix.garden());
    yield;
  }
  for(const [east,north,turn] of [[-88,48,Math.PI/2],[-30,104,0],[30,104,0],[-62,470,-Math.PI/2],[-30,690,0],[52,690,0]]){
    const p=world(east,north);
    if(!solidAt(p.x+300,p.z+225))bench(p.x,p.z,turn);
  }
  yield;
  yield* buildUijeongbu();
  return {stops:subwayStops,groups};

  function* buildUijeongbu(){
    const stone=0xb1aca0,curb=0xc5c1b6;
    const xyz=(e,n)=>{const p=plazaAt(e,n);return {x:wx(p.x),z:wz(p.y)};};
    const piece=(color,e,n,w,d,h,base=0,turn=0)=>{
      const p=xyz(e,n),mesh=box(color,p.x,base+h/2,p.z,w,h,d);
      mesh.rotation.y=turn;return mesh;
    };
    const collide=(e,n,w,d,top,turn=0)=>{const p=xyz(e,n);block(p.x,p.z,w,d,turn,top);};
    const sign=(text,e,n,width=2.4,turn=Math.PI/2)=>{
      const p=xyz(e,n),board=new T.Group();
      board.position.set(p.x,0,p.z);board.rotation.y=turn;scene.add(board);
      box(0x414747,0,.38,0,.1,.76,.10,board);
      box(0x333e3c,0,.865,0,width,.55,.11,board).rotation.x=-.17;
      nameplate(text,board,0,.875,.061,width-.12,.42,"#333e3c","#f1eee0").rotation.x=-.17;
      collide(e,n,width,.2,1.2,turn);
    };

    // The same dark asphalt as the square to the west and the junction to the east.
    const carriageway=matte(0x49494a);
    plot(sajikEastRoad,carriageway,-.012).name="사직로 동편";
    plot(uijeongbuSideRoad,carriageway,-.015).name="사직로8길과 종로1길";
    // Street pavements here are laid in the same slabs as the junction they run into,
    // on the same grid, so the pattern carries across from one stretch to the next.
    const streetPaving=bukchonPavers(T),streetPaved=[5,7,8];
    const pavement=(points,height)=>{
      const surface=plot(points,streetPaving,height),{position,uv}=surface.geometry.attributes;
      for(let i=0;i<uv.count;i++)uv.setXY(i,position.getX(i)/2.16,-position.getY(i)/2.40);
      return surface;
    };
    plot(uijeongbuOutline,materials.garden.lawn,.02).name="의정부지 역사유적광장 잔디";
    const streetCoverage=[sajikEastRoad,uijeongbuSideRoad,gbFrontApron];
    function fillPavement(outline,height,name,texturedStreet=false){
      const available=makeStreetSurfaceCut(T,streetCoverage);
      for(const part of available(outline)){
        const tile=texturedStreet?pavement(part,height):plot(part,materials.paving,height);
        tile.name=name;
      }
      streetCoverage.push(outline);
    }
    fillPavement(uijeongbuBusPavement,.025,"경복궁 정류장 보도",true);
    for(const index of uijeongbuPavedConnections){
      fillPavement(uijeongbuConnections[index],.032+index*.006,"의정부지 연결 보도",streetPaved.includes(index));
    }
    for(const {name,outline} of uijeongbuCrossings){
      fillPavement(outline,.037,`${name} 진입 보도`);
    }
    fillPavement(gardenSidewalk,.038,"종로1길 유적광장 쪽 보도",true);
    const vergePieces=makeStreetSurfaceCut(T,[...streetCoverage,uijeongbuOutline])(gardenVerge);
    for(const piece of vergePieces)plot(piece,materials.garden.lawn,.02).name="종로1길 잔디";
    const walkCoverage=streetCoverage.map(outline=>outline.map(({x,y})=>({x:wx(x),y:wz(y)})));
    for(const [index,{points,width}] of uijeongbuWalks.entries()){
      ribbon(points,-width/2,width/2,index<2?materials.paving:materials.gravel,.037+index*.012,walkCoverage);
    }
    function paint(color,e,n,w,d,turn,height){
      const c=Math.cos(turn),s=Math.sin(turn);
      return plot([[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,y])=>
        plazaAt(e+x*c-y*s,n+x*s+y*c)),matte(color),height);
    }
    for(const {name,left,right,road} of uijeongbuCrossings){
      const keepRoad=makeStreetSurfaceCut(T,[road],{keepInside:true});
      const paintHeight=road===sajikEastRoad?-.008:-.011;
      const positions=[];
      for(const band of crosswalkPaintBands(left,right))for(const [a,...rest] of keepRoad(band)){
        for(let i=1;i<rest.length;i++){
          const b=rest[i-1],c=rest[i],turn=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
          if(Math.abs(turn)<1e-6)continue;
          for(const {x,y} of turn<0?[a,b,c]:[a,c,b])positions.push(wx(x),paintHeight,wz(y));
        }
      }
      const geometry=new T.BufferGeometry();
      geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
      const markings=flat(geometry,matte(0xe7e3d6),0,0,0);
      markings.name=name;markings.userData.followTerrain=true;
    }
    // The centre line follows the middle of the widened carriageway.
    for(let e=47;e<=170;e+=9){
      const n=e<78?546+(e-47)*.667:566.7+(e-78)*.132;
      paint(0xc3bba4,e,n,4.3,.11,Math.atan(e<78?.667:.132),.007);
    }
    yield;

    // Granite edging and squat padstones mark the footprints in the modern park.
    const angle=.18,c=Math.cos(angle),s=Math.sin(angle);
    function foundation(e,n,w,d,columns,rows){
      const xy=(x,y)=>[e+x*c-y*s,n+x*s+y*c];
      plot([xy(-w/2,-d/2),xy(w/2,-d/2),xy(w/2,d/2),xy(-w/2,d/2)].map(p=>plazaAt(...p)),
        materials.garden.lawn,.101);
      for(const side of [-1,1]){
        piece(curb,...xy(0,side*d/2),w+.16,.24,.12,.028,angle);
        piece(curb,...xy(side*w/2,0),.24,d,.12,.028,angle);
      }
      for(let i=0;i<columns;i++)for(let j=0;j<rows;j++){
        const [se,sn]=xy(-w/2+.78+i*(w-1.56)/(columns-1),-d/2+.78+j*(d-1.56)/(rows-1));
        piece(stone,se,sn,.64,.61,.14,.028,angle);
        piece(curb,se,sn,.44,.45,.038,.168,angle);
      }
    }
    for(const {name,east,north,width,length,columns,rows} of uijeongbuRemains){
      foundation(east,north,width,length,columns,rows);
      sign(name,east-width/2-2.15,north-.2,1.94);
    }
    const innerCorridor=[plazaAt(39.5,493.2),plazaAt(46.3,460.7),plazaAt(77.8,467)];
    ribbon(innerCorridor,-1.15,1.15,materials.court,.118).name="내행랑 터";
    for(let i=0;i<11;i++){
      const along=i/10;
      piece(stone,39.5+6.8*along,493.2-32.5*along,.55,.54,.13,.089);
      piece(stone,46.3+31.5*along,460.7+6.3*along,.55,.54,.13,.089);
    }
    sign("내행랑 터",43.3,478,1.63);
    const well=xyz(82,460.1);
    cylinder(0x8d897f,well.x,.21,well.z,.99,.42,20);
    cylinder(0xb5b0a5,well.x,.49,well.z,1.08,.16,20);
    cylinder(0x3e4745,well.x,.576,well.z,.76,.021,20);
    collide(82,460.1,1.9,1.9,.6);
    sign("우물 터",79.9,460.5,1.22,0);
    yield;

    const pond=[plazaAt(88.5,506),plazaAt(106.2,509.2),plazaAt(111.5,499.8),plazaAt(107,488.7),plazaAt(89.4,487.9),plazaAt(85.5,493.9)];
    plot(pond,materials.gravel,.126).name="연지 터";
    for(let i=0;i<pond.length;i++){
      const a=pond[i],b=pond[(i+1)%pond.length],dx=b.east-a.east,dn=b.north-a.north;
      piece(stone,(a.east+b.east)/2,(a.north+b.north)/2,Math.hypot(dx,dn),.42,.165,.032,Math.atan2(dn,dx));
    }
    foundation(106.2,480.7,6.4,5.5,2,2);
    sign("연지 · 정자 터",111.4,490.4,2.28);
    sign("의정부지 역사유적광장",38.4,450.2,3.7);
    sign("후원 산책로",118.6,535,1.77,0);

    // The October 2026 exhibition is the low contemporary building on the museum side.
    piece(0x907f70,104.5,460,7.45,26,3.05).name="의정부지 유적전시관";
    piece(0xc09364,103.9,460,9.13,27.4,.26,2.91);
    piece(0x53575a,103.84,460,9.29,27.56,.16,3.17);
    piece(0xc9bdb0,104.5,460,8.05,26.5,.19);
    piece(0x5d777c,100.72,460,.09,24.8,2.57,.25);
    for(let i=0;i<13;i++){
      const n=447.8+i*2.03;
      piece(i%3===1?0x627e84:0x52676c,100.64,n+.45,.05,1.75,2.48,.285);
      piece(i%3===0?0xd5a971:0x525958,100.59,n,.2,i%3===0?.18:.066,2.75,.24);
      if(i%3===0)piece(0xc99763,99.85,n,.2,.2,.27,2.86);
    }
    const vestibule=piece(0xae873e,100.49,465.94,.035,1.06,.84,.58);
    vestibule.name="유적전시관 입구 안내";
    sign("의정부지 유적전시관",99.4,465.5,2.85);
    collide(104.5,460,7.45,26,Infinity);
    yield;

    // The April Revolution monument stands at the northeast garden entrance.
    const e=127.7,n=546.6;
    piece(0x8f8c82,e,n,3.05,2.18,.175);
    piece(0xa9a496,e,n,1.87,1.36,.38,.175);
    for(const side of [-1,1]){
      const blade=piece(0xb7b5ad,e+side*.23,n,.34,.64,4.65,.555);
      blade.rotation.z=-side*.035;
    }
    piece(0xc6c2b5,e,n,.95,.88,.16,5.15);
    collide(e,n,3.05,2.18,5.31);
    sign("4월민주혁명 50주년",130.5,545.2,2.38);
    for(const [east,north] of [[116,516],[119,528.3]]){
      for(const side of [-1,1])for(const end of [-1,1]){
        piece(0x424c46,east+side*1.6,north+end*2.42,.11,.11,2.30);
        collide(east+side*1.6,north+end*2.42,.13,.13,2.30);
      }
      piece(0xc5ae84,east,north,3.45,5.08,.085,2.29);
      for(const side of [-1,0,1])piece(0xb6a385,east,north+side*1.62,3.47,.048,.041,2.377);
    }
    for(const [east,north,turn] of [[52,518.5,0],[80,536,Math.PI],[100,541.2,Math.PI],
      [119,520,-Math.PI/2],[120,505.2,-Math.PI/2],[87.5,452.5,0],[54,449,0],[115,483.2,Math.PI/2]]){
      const p=xyz(east,north);bench(p.x,p.z,turn);
    }
    for(const [east,north] of [[42,457],[41.3,469.1],[41.4,484],[48,511],[59,518],[77,533],
      [87.5,533.8],[103.8,536],[115,540],[119.1,523.6],[123.7,510.1],[113.5,496.4],[89,474]]){
      const p=plazaAt(east,north);
      plant(p.x-gwanghwamun.x,gwanghwamun.y-p.y,6.4+rand()*2.6,
        rand()<.36?{style:"round",palette:"ginkgo"}:treeMix.garden());
      yield;
    }
  }
}

export function buildSubwayExit(T,scene,{wx,wz,box},{nameplate,block},station,title,stripe){
    const x=wx(station.x),z=wz(station.y),g=new T.Group();
    g.position.set(x,0,z);g.rotation.y=station.angle;scene.add(g);g.name=station.name;
    const steel=0x56646a,glass=0x9cc2c2;
    box(0x23282b,0,.03,0,2.3,.06,5.2,g);
    for(let step=0;step<6;step++)box(step%2?0x30373a:0x3a4246,0,.04+step*.012,1.9-step*.62,2.1,.03,.6,g);
    for(const side of [-1,1]){
      box(steel,side*1.28,.14,0,.2,.28,5.5,g);
      box(glass,side*1.28,.72,0,.07,.92,5.4,g);
      box(steel,side*1.28,1.2,0,.12,.08,5.5,g);
      for(const end of [-2.65,0,2.65])box(steel,side*1.28,1.3,end,.11,2.6,.11,g);
    }
    box(steel,0,.14,-2.7,2.7,.28,.2,g);
    box(glass,0,.72,-2.7,2.5,.92,.07,g);
    box(0xd8dfdc,0,2.66,-.05,3.1,.1,5.9,g);
    box(steel,0,2.58,-.05,3.2,.09,6.0,g);
    box(stripe,0,2.3,2.86,2.9,.42,.1,g);
    nameplate(title,g,0,2.3,2.92,2.6,.36,"#f4f4ee","#1e2a30");
    // Pole sign beside the entrance.
    box(steel,1.9,1.8,2.6,.14,3.6,.14,g);
    box(stripe,1.9,3.5,2.6,1.05,.5,.16,g);
    nameplate("지하철",g,1.9,3.5,2.69,.95,.36,"#fbfbf6","#1e2a30");
    block(x,z,2.9,5.7,station.angle);
    g.updateMatrixWorld(true);
    const pole=g.localToWorld(new T.Vector3(1.9,0,2.6));
    block(pole.x,pole.z,.2,.2,0,3.7);
  }
