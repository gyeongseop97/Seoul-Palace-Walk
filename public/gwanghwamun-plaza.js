import {addObstacle} from "./layout.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {makeCrosswalkMarkings} from "./crosswalk-markings.js";
import {makeStreetSurfaceCut} from "./street-surface-cuts.js";
import {fountainImpact} from "./fountain-impact.js";
import {basinWater,tickWater} from "./water-shader.js";
import {assemblePlazaCity,registerPlazaCity} from "./plaza-city.js";
import {addPlazaMonuments,plazaMonumentFootprints} from "./plaza-monuments.js";
import {sajikEastRoad,uijeongbuConnections,uijeongbuOutline} from "./uijeongbu-layout.js";
import {plazaAt,plazaOutline,plazaBeds,plazaSites,plazaTransitStops,insidePlazaPolygon,
  plazaRoadProfile,plazaAvenueOutline,plazaEastSidewalks,plazaCrossings,plazaCrossingApronHalf,plazaCrossingLandings,plazaSideForecourts,
  plazaUijeongbuApproach,plazaSideJunction,eastCurb,eastRoadWidth,sajikRoad,haechiBasin,
  sejongParkOutline,sejongParkCourt,sejongParkStage,sejongParkFountain,sejongParkMonoliths,sejongParkBenches} from "./plaza-layout.js";
import {PLAZA_SHOW_VIEW_METRES,plazaShowFrame,plazaShowJet} from "./plaza-show.js";

const between=(a,b,t)=>a+(b-a)*t;
const rect=(left,right,bottom,top)=>[[left,bottom],[right,bottom],[right,top],[left,top]].map(([e,n])=>plazaAt(e,n));
const westLamps=[33,96,137,174,227,309,369,401,444,493];
const benchSites=[[-24,26,1.57],[-23,43,1.57],[-23,58,1.57],[-44,83,1.57],[-34,93,0],
  [-39,157,1.57],[-32,188,-1.57],[-37,205,1.57],[-37,254,0],[-20,287,1.57],[-43,300,-1.57],
  [-32,340,1.57],[-27,398,1.57],[-29,434,1.57],[-7,466,1.57],[-40,479,-1.57],[-32,514,0],
  [-79,337.1,0],[60.7,492.7,-Math.PI/2],...sejongParkBenches];
const shadeSites=[[-33,174,4,1.22],[-35,177,4,1.22],[-38,209,4,1.22]];
const gratitudeColumns=Array.from({length:23},(_,i)=>[-43.2,285.9+i*1.01]);
const [station]=plazaTransitStops;
const eastLamps=[],railings=[];
const byCrossing=n=>plazaCrossings.some(cross=>Math.abs(cross-n)<6);
for(let n=28;n<518;n+=21.5)if(!byCrossing(n))eastLamps.push(n);
for(let n=18;n<518;n+=3.15)if(!byCrossing(n)&&Math.abs(358-n)>=8)railings.push(n);

// Clip the outer sidewalk against the west edge of the square. The square and
// sidewalk use the same paving material, so only one surface should own each tile.
export function plazaWestPavement(){
  const west=-55,east=-45,start=0,end=430;
  const edges=plazaOutline.map((to,index)=>[plazaOutline[(index+plazaOutline.length-1)%plazaOutline.length],to]);
  const eastAt=(a,b,north)=>between(a.east,b.east,(north-a.north)/(b.north-a.north));
  const edgeAt=north=>Math.min(...edges.filter(([a,b])=>a.north!==b.north&&
    north>=Math.min(a.north,b.north)&&north<=Math.max(a.north,b.north)).map(([a,b])=>eastAt(a,b,north)));
  const knots=new Set([start,end,...plazaOutline.filter(point=>point.north>start&&point.north<end).map(point=>point.north)]);
  for(const [a,b] of edges)for(const boundary of [west,east]){
    if(a.east===b.east)continue;
    const t=(boundary-a.east)/(b.east-a.east),north=between(a.north,b.north,t);
    if(t>0&&t<1&&north>start&&north<end)knots.add(north);
  }
  const samples=[...knots].sort((a,b)=>a-b).map(north=>plazaAt(Math.max(west,Math.min(east,edgeAt(north))),north));
  const strips=[];
  let front=[];
  for(let index=1;index<samples.length;index++){
    const a=samples[index-1],b=samples[index];
    if(a.east===west&&b.east===west)continue;
    if(!front.length)front.push(a);
    front.push(b);
    if(b.east===west||index===samples.length-1){
      const first=front[0],last=front.at(-1);
      strips.push([...(first.east!==west?[plazaAt(west,first.north)]:[]),...front,
        ...(last.east!==west?[plazaAt(west,last.north)]:[])]);
      front=[];
    }
  }
  return strips;
}

// The pathfinder and seat IDs are available before the plaza's meshes are built.
export function registerPlazaNavigation(benches){
  registerPlazaCity();
  function obstacle(e,n,w,d,top=Infinity,angle=0){
    const {x,y}=plazaAt(e,n);addObstacle(x,y,w,d,angle,top);
  }
  for(const n of eastLamps)obstacle(eastCurb(n)-.9,n,.30,.30);
  for(const n of westLamps)obstacle(-49,n,.30,.30);
  for(const n of railings)obstacle(eastCurb(n)-.32,n+1.54,.12,3.11,.87);
  for(const [e,n,angle] of benchSites){
    const {x,y}=plazaAt(e,n),dx=Math.sin(angle),dy=Math.cos(angle);
    obstacle(e,n,2.28,.54,.515,angle);
    const heading=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
    const slots=[-.56,.56].map(offset=>{
      const sx=x+dy*offset,sy=y-dx*offset;
      return {x:sx,y:sy,heading,approach:{x:sx+dx*.86,y:sy+dy*.86}};
    });
    benches.push({x,y,slots,catPerch:{x,y,height:.515,heading:angle,approach:{x:x+dx*1.12,y:y+dy*1.12}}});
  }
  obstacle(station.east-.55,station.north,7.8,4.04);
  const {west,east,south,north}=haechiBasin;
  for(const side of [west,east])obstacle(side,(north+south)/2,.33,north-south,1.02);
  obstacle((west+east)/2,south,east-west,.48,1.02);
  for(let i=0;i<4;i++)obstacle(west+1.05+i*.98,108,.96,17.2,1.02);
  obstacle(plazaSites.ruins.east,plazaSites.ruins.north,10.9,14.0);
  obstacle(-34,404,9.2,.48,1.36);
  obstacle(-34,402.5,9.3,2.14,.255);
  for(const [e,n,w,d] of shadeSites)obstacle(e,n,w,d,.83);
  for(const [e,n] of gratitudeColumns)obstacle(e,n,.78,.53,6.25);
  for(const [e,n] of sejongParkMonoliths)obstacle(e,n,1.28,1.28,1.13);
  for(const name of ["yi","sejong"]){
    const site=plazaSites[name],size=plazaMonumentFootprints[name];
    obstacle(site.east,site.north,size.width,size.depth);
  }
}

export function buildGwanghwamunPlaza(T,scene,kit,{benches}){
  registerPlazaNavigation(benches);
  const build=assembleGwanghwamunPlaza(T,scene,kit);
  let step=build.next();
  while(!step.done)step=build.next();
  return step.value;
}
export function* assembleGwanghwamunPlaza(T,scene,kit,{birdPerches,terrainHeight=()=>0,onMonuments}={}){
  const group=new T.Group();group.name="광화문광장";scene.add(group);
  const {wx,wz,box,cylinder,matte}=kit;
  let seed=3720957;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const glow=[];
  const lamp=(color,emissive,day,strength)=>{
    const material=new T.MeshStandardMaterial({color,emissive,emissiveIntensity:day,roughness:.65});
    glow.push({material,day,strength});return material;
  };
  const lampGlass=lamp(0xf1e8c8,0xffcb81,.05,1.8);
  // Shallow water over dark granite, for the old channel, the basins and the water wall.
  const water=basinWater(T,{bed:[0x4d5552,0x77807b],tile:1.25,tint:0x2e8fa6,depth:.12});
  const world=(e,n)=>{const point=plazaAt(e,n);return {x:wx(point.x),z:wz(point.y)};};
  function block(color,e,n,w,d,h,base=0,rotation=0){
    const {x,z}=world(e,n),mesh=box(color?.isMaterial?0xffffff:color,x,base+h/2,z,w,h,d,group);
    if(color?.isMaterial)mesh.material=color;
    mesh.rotation.y=rotation;
    return mesh;
  }
  function segments(points,visit){
    for(let i=1;i<points.length;i++)visit(points[i-1],points[i]);
  }
  function line(color,a,b,width,height,base=0){
    const dx=b.east-a.east,dn=b.north-a.north;
    const mesh=block(color,(a.east+b.east)/2,(a.north+b.north)/2,Math.hypot(dx,dn)+.015,width,height,base,Math.atan2(dn,dx));
    mesh.userData.followTerrain=true;mesh.userData.sharedTerrainGeometry=true;
    return mesh;
  }
  function marking(color,e,n,w,d,h,base){
    const mesh=block(color,e,n,w,d,h,base);
    mesh.userData.followTerrain=true;mesh.userData.sharedTerrainGeometry=true;
    return mesh;
  }

  function stoneTexture(){
    const size=128,pixels=new Uint8Array(size*size*4),shades=[155,162,149,169,157,154,166,160];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const row=Math.floor(y/32),shift=row%2*16,col=Math.floor(((x+shift)%128)/32);
      const joint=y%32===0||(x+shift)%32===0;
      const tone=(joint?113:shades[(row*3+col*5)%shades.length])+Math.floor(random()*13-6);
      const i=(y*size+x)*4;
      pixels.set([tone+3,tone+1,tone-5,255],i);
    }
    const texture=new T.DataTexture(pixels,size,size);
    texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
    texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;
    texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;
    return new T.MeshStandardMaterial({map:texture,roughness:.94});
  }
  const stone=stoneTexture(),road=matte(0x42464b),soil=matte(0x59554a);
  const outlinePath=(outline,Path)=>new Path(outline.map(p=>new T.Vector2(wx(p.x),-wz(p.y))));
  function surface(outline,material,height=0,holes=[],pieces=[outline]){
    if(!pieces.length)return;
    const paths=pieces.map(piece=>outlinePath(piece,T.Shape));
    if(holes.length)paths[0].holes=holes.map(hole=>outlinePath(hole,T.Path));
    const geometry=new T.ShapeGeometry(paths),uv=geometry.attributes.uv,positions=geometry.attributes.position;
    for(let i=0;i<uv.count;i++)uv.setXY(i,positions.getX(i)/3.6,positions.getY(i)/3.6);
    geometry.rotateX(-Math.PI/2);
    const mesh=new T.Mesh(geometry,material);mesh.position.y=height;mesh.receiveShadow=true;
    mesh.userData.followTerrain=true;group.add(mesh);
    return mesh;
  }

  const basin=haechiBasin,basinHole=rect(basin.west,basin.east,basin.south,basin.north);
  const terrainBase=matte(0x696e60);
  surface(rect(-137,126,-27,635),terrainBase,-.059,[basinHole]);
  // Flush extensions carry both outer rows of buildings without spilling over
  // onto the palace side of Sajik-ro.
  surface(rect(-260,-137,-27,sajikRoad.north),terrainBase,-.059);
  surface(rect(126,225,-27,sajikRoad.north),terrainBase,-.059);
  surface(basinHole,terrainBase,-2.24);
  surface(plazaOutline,stone,.025,[basinHole]);
  for(const outline of plazaWestPavement())surface(outline,stone,.025);
  const westPaved=[plazaOutline,...plazaWestPavement()];
  surface(sejongParkOutline,stone,.025,[],makeStreetSurfaceCut(T,westPaved)(sejongParkOutline));
  const forecourtCut=makeStreetSurfaceCut(T,[...westPaved,sejongParkOutline,...plazaEastSidewalks]);
  for(const outline of plazaSideForecourts)surface(outline,stone,.025,[],forecourtCut(outline));
  const westSajik=rect(-310,20,sajikRoad.south,sajikRoad.north);
  surface(westSajik,road,-.012);
  const roadProfile=[...plazaRoadProfile.filter(([n])=>n<sajikRoad.south),[sajikRoad.south,eastCurb(sajikRoad.south)]];
  const avenueOutsideSajik=makeStreetSurfaceCut(T,[westSajik,sajikEastRoad]);
  surface(plazaAvenueOutline,road,-.012,[],avenueOutsideSajik(plazaAvenueOutline));
  const parkBoundary=makeStreetSurfaceCut(T,[uijeongbuOutline,sajikEastRoad]);
  for(const sidewalk of plazaEastSidewalks){
    surface(sidewalk,stone,.016,[],parkBoundary(sidewalk));
  }
  const openApproach=makeStreetSurfaceCut(T,[...plazaEastSidewalks,uijeongbuOutline,sajikEastRoad,...uijeongbuConnections]);
  surface(plazaUijeongbuApproach,stone,.016,[],openApproach(plazaUijeongbuApproach)).name="의정부지 광장 연결 보도";
  surface(plazaSideJunction,road,-.012);
  for(const offset of [0,eastRoadWidth]){
    const openings=plazaCrossings.map(n=>[n-plazaCrossingApronHalf,n+plazaCrossingApronHalf]);
    if(offset)openings.push([430.9,439.8]);
    const slots=[...new Set([0,sajikRoad.south,...roadProfile.map(([n])=>n),...openings.flat()])].sort((a,b)=>a-b);
    for(let i=1;i<slots.length;i++){
      const a=slots[i-1],b=slots[i],mid=(a+b)/2;
      if(openings.some(([start,end])=>mid>start&&mid<end))continue;
      line(0xb2b2a8,plazaAt(eastCurb(a)+offset,a),plazaAt(eastCurb(b)+offset,b),.19,.12,-.03);
    }
  }
  for(let n=1;n<524;n+=7.4){
    if(plazaCrossings.some(cross=>Math.abs(cross-n)<7.3))continue;
    for(const lane of [3.6,7.2,10.8,17.4,21,24.6]){
      marking(0xc9c9bb,eastCurb(n)+lane,n,.09,3.5,.012,0);
    }
    for(const side of [-.17,.17])marking(0xd3a944,eastCurb(n)+14+side,n,.09,7.35,.012,0);
  }
  const crosswalkWhite=matte(0xe8e7dd),tactileYellow=matte(0xc9a14a);
  const avenueMarkings=makeCrosswalkMarkings(T,[plazaAvenueOutline]);
  const fillWestApproach=makeStreetSurfaceCut(T,[plazaOutline]);
  for(const {north,west} of plazaCrossingLandings){
    const curb=eastCurb(north),end=curb+eastRoadWidth;
    const {paint,tactile}=avenueMarkings(plazaAt(curb-2,north),plazaAt(end+2,north),7.05);
    surface(paint[0],crosswalkWhite,-.008,[],paint).name="광화문광장 횡단보도";
    surface(west,stone,.025,[],fillWestApproach(west));
    surface(tactile[0],tactileYellow,.047,[],tactile);
  }
  const {paint:sajikPaint}=makeCrosswalkMarkings(T,[westSajik])(
    plazaAt(sajikRoad.crossX,sajikRoad.south-2),plazaAt(sajikRoad.crossX,sajikRoad.north+2),sajikRoad.crossWidth);
  surface(sajikPaint[0],crosswalkWhite,-.008,[],sajikPaint).name="광화문 월대 횡단보도";
  for(let e=-116;e<20;e+=7.5){
    if(Math.abs(e-sajikRoad.crossX)<10)continue;
    block(0xc9c5b5,e,539.5,3.6,.11,.012,.003);
  }

  const trees=makeTreeBuilder(T,group,{rand:random,clearance:{meshFits:()=>true,trim:()=>true}});
  for(const bed of plazaBeds){
    yield;
    const lawn=bed.kind==="lawn",pine=bed.kind==="pine";
    surface(bed.outline,lawn?matte(bed.id==="yukjo-lawn"?0x8c9b53:0x768849):soil,lawn?.039:.22);
    const closed=[...bed.outline,bed.outline[0]];
    segments(closed,(a,b)=>line(lawn?0xa5a58e:0x96988e,a,b,lawn?.15:.25,lawn?.07:.22,.02));
    if(lawn){
      if(bed.id==="yukjo-lawn")for(let n=454;n<=494;n+=4)block(n%8===2?0x84934d:0x8e9c57,-22.5,n,25.5,3.95,.013,.043);
      continue;
    }
    const east=bed.outline.map(p=>p.east),north=bed.outline.map(p=>p.north),minE=Math.min(...east),minN=Math.min(...north);
    const width=Math.max(...east)-minE,length=Math.max(...north)-minN,planted=[];
    const target=Math.max(2,Math.min(17,Math.ceil(width*length/58)));
    for(let i=0;i<target*9&&planted.length<target;i++){
      const e=minE+1+random()*(width-2),n=minN+1+random()*(length-2),p=plazaAt(e,n);
      if(!insidePlazaPolygon(p.x,p.y,bed.outline)||planted.some(a=>Math.hypot(a.east-e,a.north-n)<4.6))continue;
      const {x,z}=world(e,n),r=random(),style=pine?"cloud":r<.4?"branchy":r<.73?"round":"column";
      const tree=trees.grow(x,z,{height:pine?6+random()*3:3.8+random()*4.9,style,terrainAnchor:p,
        palette:pine?"pine":r<.22?"ginkgo":r<.39?"amber":r<.52?"maple":r<.73?"olive":"deep"});
      if(birdPerches&&tree?.top){
        const x=tree.top.x-wx(0),y=tree.top.z-wz(0);
        birdPerches.push({x,y,height:tree.top.y+.015+terrainHeight(p),kind:"tree"});
      }
      planted.push(p);
    }
    for(let i=0;i<target*5;i++){
      const e=minE+random()*width,n=minN+random()*length,p=plazaAt(e,n);
      if(!insidePlazaPolygon(p.x,p.y,bed.outline))continue;
      const {x,z}=world(e,n),shrub=trees.shrub(x,z,.29+random()*.56,random()<.67?"deep":"olive");
      if(shrub)shrub.position.y+=.18;
    }
  }

  function label(text,width,height,{color="#eee9dc",background="#26363c",sub=""}={}){
    const canvas=document.createElement("canvas");canvas.width=640;canvas.height=160;
    const ctx=canvas.getContext("2d");ctx.fillStyle=background;ctx.fillRect(0,0,640,160);
    ctx.fillStyle=color;ctx.textBaseline="middle";ctx.textAlign="center";
    ctx.font=`700 ${sub?57:66}px "Malgun Gothic",sans-serif`;
    ctx.fillText(text,320,sub?60:81,605);
    if(sub){ctx.font='28px "Malgun Gothic",sans-serif';ctx.fillText(sub,320,115,605);}
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const mat=new T.MeshStandardMaterial({map:texture,roughness:.86,side:T.DoubleSide});
    return new T.Mesh(new T.PlaneGeometry(width,height),mat);
  }
  function sign(text,e,n,y,angle,width,height,opts){
    const {x,z}=world(e,n),mesh=label(text,width,height,opts);
    mesh.position.set(x,y,z);mesh.rotation.y=angle;group.add(mesh);return mesh;
  }
  function pole(e,n,height=6.3,side=-1){
    const {x,z}=world(e,n);
    cylinder(0x565e5e,x,height/2,z,.087,height,8,group);
    cylinder(0x535b5a,x,.20,z,.16,.4,8,group);
    block(0x5b6361,e+side*.48,n,1.03,.082,.083,height-.12);
    block(lampGlass,e+side*1.03,n,.46,.21,.083,height-.16);
  }
  for(const n of eastLamps)pole(eastCurb(n)-.9,n);
  for(const n of westLamps)pole(-49,n,4.1,1);
  for(const n of railings){
    const e=eastCurb(n)-.32;
    block(0x666f6d,e,n,.076,.076,.82,.03);
    block(0x707876,e,n+1.54,.053,3.10,.052,.74);
    block(0x707876,e,n+1.54,.045,3.10,.044,.37);
  }

  function bench(e,n,angle=0){
    const p=plazaAt(e,n),x=wx(p.x),z=wz(p.y),seat=new T.Group();
    seat.position.set(x,.025,z);seat.rotation.y=angle;group.add(seat);
    for(const side of [-1,1])box(0x8d9390,side*.86,.23,0,.17,.46,.54,seat);
    for(let k=0;k<5;k++)box(k%2===0?0xa17650:0x986f4d,0,.483,(k-2)*.103,2.30,.061,.095,seat);
  }
  function addSejongnoPark(){
    const court=sejongParkCourt;
    const letteringBase=new T.MeshStandardMaterial({color:0x626368,roughness:.93});
    const lettering=letteringBase.clone();
    if(typeof document!=="undefined"){
      const canvas=document.createElement("canvas");
      canvas.width=512;canvas.height=512;
      const ink=canvas.getContext("2d");
      if(ink){
        const shades=["#7c8282","#878783","#6c7376","#8c8c8c","#777a74"];
        ink.font='bold 33px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
        ink.textAlign="center";ink.textBaseline="middle";
        for(let row=0;row<12;row++)for(let col=0;col<12;col++){
          const x=col*43,y=row*43;
          ink.fillStyle=shades[(row*13+col*3)%shades.length];ink.fillRect(x,y,43,43);
          ink.fillStyle="#2b3032";
          ink.fillText(String.fromCharCode(0xac00+(row*997+col*157)%11172),x+21,y+22);
        }
        const texture=new T.CanvasTexture(canvas);
        texture.colorSpace=T.SRGBColorSpace;
        lettering.map=texture;lettering.color.setHex(0xffffff);
      }
    }
    surface(rect(court.east-court.width/2,court.east+court.width/2,court.north-court.length/2,court.north+court.length/2),
      matte(0xb4a48b),.047).name="한글글자마당";
    for(const [e,n] of sejongParkMonoliths){
      block(letteringBase,e,n,1.28,1.28,1.03,.047);
      block(0x484e50,e,n,1.34,1.34,.11,1.077);
      for(const turn of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
        block(lettering,e+.649*Math.sin(turn),n-.649*Math.cos(turn),1.24,.014,.98,.067,turn);
      }
      // Small bronze letter pads sit flush with the courtyard paving.
      block(lettering,e+1.72,n-1.21,1.45,1.12,.025,.056);
    }
    sign("한글글자마당",-76.5,313.2,.79,Math.PI/2,2.16,.48,{background:"#424c49"});

    const stage=sejongParkStage,{x:sx,z:sz}=world(stage.east,stage.north);
    cylinder(0x9b9c93,sx,.063,sz,stage.radius,.126,40,group).name="세종로공원 원형무대";
    cylinder(0xb2ae9e,sx,.137,sz,stage.radius-.78,.080,40,group);
    cylinder(0xd1c7ae,sx,.183,sz,stage.radius-1.48,.040,40,group);
    sign("세종로공원",-55.7,330.9,.94,Math.PI/2,2.17,.54,{background:"#43574a",sub:"SEJONGNO PARK"});

    const fountain=sejongParkFountain,{x:fx,z:fz}=world(fountain.east,fountain.north);
    cylinder(0x8e928c,fx,.195,fz,fountain.radius,.39,40,group).name="세종로공원 분수";
    cylinder(0xb3b1a3,fx,.405,fz,fountain.radius+.11,.085,40,group);
    cylinder(0x6cabc2,fx,.452,fz,fountain.radius-.25,.029,40,group).material=water;
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      cylinder(0x4c5858,fx+Math.sin(angle)*1.77,.49,fz+Math.cos(angle)*1.77,.084,.09,8,group);
    }
    cylinder(0x617276,fx,.57,fz,.17,.25,12,group);
    for(const p of [[-119.4,307],[-117.2,341],[-93,387.4],[-65,384.2]])pole(p[0],p[1],3.2,-1);
  }
  for(const [e,n,angle] of benchSites)bench(e,n,angle);
  addSejongnoPark();
  yield;

  // The subway exit canopy stands outside the walking lane.
  const sx=station.east,sn=station.north;
  block(0xb7b7ae,sx,sn,8.7,4.1,.15,.02);
  block(0x596967,sx-1.1,sn,6.3,4.1,2.48,.17);
  block(0x415455,sx-.70,sn,7.55,4.37,.22,2.65);
  for(const side of [-1,1]){
    block(0x738c93,sx+.3,sn+side*1.78,6.3,.08,1.66,.50);
    block(0x3b494d,sx+3.5,sn+side*1.78,.15,.15,2.60,.06);
  }
  block(0x293a3e,sx+2.10,sn,3.22,2.92,.08,.17);
  for(let i=0;i<8;i++)block(0x657471,sx+1.0+i*.30,sn,.28,2.88,.035,.255);
  sign("광화문역 7",sx+3.73,sn,2.89,Math.PI/2,4.03,.50,{background:"#4e318b",sub:"Gwanghwamun  ·  Line 5"});

  // The media ramp is set down into the plaza, with a real sloped walking surface.
  const {west,east,south,north,rampEnd,depth}=basin;
  surface(rect(west,east,south,rampEnd),stone,-depth);
  const positions=[];
  for(const [e,n,y] of [[west,rampEnd,-depth],[east,rampEnd,-depth],[east,north,0],
    [west,rampEnd,-depth],[east,north,0],[west,north,0]]){
    const p=world(e,n);positions.push(p.x,y,p.z);
  }
  const rampGeometry=new T.BufferGeometry();rampGeometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  rampGeometry.setAttribute("uv",new T.Float32BufferAttribute([0,0,4,0,4,5,0,0,4,5,0,5],2));rampGeometry.computeVertexNormals();
  const ramp=new T.Mesh(rampGeometry,stone);ramp.receiveShadow=true;ramp.userData.followTerrain=true;group.add(ramp);
  const basinLength=north-south,centre=(north+south)/2;
  const basinWall=(...args)=>{
    const mesh=block(...args);
    mesh.userData.followTerrain=true;mesh.userData.sharedTerrainGeometry=true;
  };
  for(const side of [west,east]){
    basinWall(0x8b9290,side,centre,.31,basinLength,depth,-depth);
    basinWall(0x596864,side,centre,.08,basinLength,.07,.90);
    basinWall(0xa2a7a1,side,centre,.45,basinLength,.21,.02);
    for(let n=south+.4;n<north;n+=2.2)block(0x697570,side,n,.09,.09,.92,.02);
  }
  basinWall(0x8d9291,(west+east)/2,south,east-west,.48,depth+.95,-depth);
  for(let i=0;i<4;i++){
    const e=west+1.05+i*.98;
    basinWall(0xb2b0a6,e,108,.93,17.2,.20+i*.16,-depth);
    basinWall(0x8e6a51,e,108,.84,16.9,.055,-depth+.20+i*.16);
  }
  const mediaMaterials=[];
  for(let i=0;i<15;i++){
    const panel=lamp(0x213d4d,0x4da0b5,.28,.75);
    mediaMaterials.push(panel);block(panel,east-.18,98.5+i*1.28,.04,1.22,1.55,-1.92);
  }
  sign("해치마당",-23,94,1.1,0,2.45,.52,{sub:"HAECHI MADANG"});

  // Historic channel, courtyard shade and the protected archaeological remains.
  for(const [start,end] of [[155,186],[202,248],[283,306],[345,380],[397,434],[456,513]]){
    const e=-19.6,n=(start+end)/2;
    basinWall(0x777e79,e,n,.96,end-start,.045,.03);
    basinWall(water,e,n,.63,end-start-.18,.04,.074);
    for(const side of [-1,1])basinWall(0xa3a7a0,e+side*.47,n,.16,end-start,.064,.041);
  }
  const ruins=plazaSites.ruins;
  block(0x6b665a,ruins.east,ruins.north,10.7,13.8,.13,.02);
  for(const [e,n,w,d] of [[-40,362,1,10],[-35,358,7,1],[-34,366,4,1],[-38,365,2,1],[-33,363,1,7]]){
    block(0xa3947e,e,n,w,d,.37,.14);
  }
  for(const e of [-42.6,-31.4])for(const n of [355,369])block(0x6d4c37,e,n,.26,.26,2.65,.02);
  for(let i=0;i<11;i++){
    const distance=Math.abs(i-5)/5;
    block(0x635e52,ruins.east+(i-5)*1.14,ruins.north,1.17,15.4,.21,2.68+distance*distance*.40,
      0);
  }
  sign("사헌부 문터",-36,354.6,.81,0,2.3,.45);
  block(0x777b74,-34,404,9.2,.48,1.31,.05);
  block(water,-34,403.71,8.45,.034,.95,.21);
  block(0x93948a,-34,402.5,9.3,2.14,.21,.045);
  block(water,-34,402.44,8.78,1.74,.027,.264);
  for(const [e,n,w,d] of shadeSites){
    block(0x8e7154,e,n,w,d,.10,.73);
    for(const dx of [-1.65,1.65])block(0x6a7065,e+dx,n,.15,d-.20,.73);
  }

  // The tiled enclosure on the opposite south-east corner houses the commemorative stele.
  const stele={east:52,north:12};
  block(0xa19a89,stele.east,stele.north,6.0,5.2,.45,.018);
  block(0x777268,stele.east,stele.north,1.13,.55,2.45,.46);
  for(const ex of [-2.1,2.1])for(const nz of [-1.74,1.74]){
    block(0x999184,stele.east+ex,stele.north+nz,.66,.66,.28,.46);
    block(0x803f36,stele.east+ex,stele.north+nz,.31,.31,2.75,.74);
  }
  for(const side of [-1,1]){
    const roof=block(0x424841,stele.east,stele.north+side*1.22,5.66,2.66,.17,3.80);
    roof.rotation.x=-side*.39;
    block(0x426c59,stele.east,stele.north+side*2.32,5.47,.21,.30,3.30);
  }
  block(0x414840,stele.east,stele.north,5.42,.22,.22,4.34);

  const granite=[0xa3a8a2,0xb6afa0,0x8c9498,0xc3c0b1,0x928984,0xa6a5ae,0x9d9990];
  for(const [i,[e,n]] of gratitudeColumns.entries()){
    block(0x747c77,e,n,1.17,.91,.10,.024);
    block(granite[i%granite.length],e,n,.78,.57,6.13,.124);
    block(0x555a56,e+.398,n,.033,.37,1.04,.81);
    block(granite[(i+3)%granite.length],e+.425,n-.04,.04,.29,.81,.95);
    const inset=lamp(0xd7dde2,0xd0e7ff,.08,1.12);
    block(inset,e,n,.21,.28,.038,6.255);
  }
  sign("감사의 정원",-43.2,283.9,.72,0,2.28,.52,{sub:"GARDEN OF GRATITUDE"});

  yield;
  const monuments=addPlazaMonuments(T,group,kit,{yi:plazaSites.yi,sejong:plazaSites.sejong});
  onMonuments?.(monuments);
  yield;
  yield* assemblePlazaCity(T,group,kit);
  yield;
  const fountains=addPlazaFountains({T,group,world,block,water,random,terrainHeight});
  return function updatePlaza(now,night,anchor,showStart=0,clock=now){
    if(!anchor){fountains(now,night,null);return;}
    for(const item of glow)item.material.emissiveIntensity=item.day+night*item.strength;
    tickWater([water],now*.001,night);
    for(const [i,material] of mediaMaterials.entries()){
      material.emissive.setHSL(.51+Math.sin(now*.00036+i*.09)*.095,.48,.43+Math.sin(now*.0012-i*.45)*.17);
    }
    fountains(now,night,anchor,showStart,clock);
  };
}


function addPlazaFountains({T,group,world,block,water,random,terrainHeight}){
  const sources=[];
  const jet=(e,n,h,dx=0,dn=0)=>({e,n,h,dx,dn,phase:random()});
  const myeongnyang=[];
  for(const [row,radius] of [4.4,6.1,8.2,10.3].entries()){
    for(let i=0;i<11;i++){
      const angle=(i/10-.5)*2.84;
      myeongnyang.push({...jet(-1+radius*Math.sin(angle),38-radius*Math.cos(angle),1.4+(11-radius)*.16+(5-Math.abs(5-i))*.24),row,arc:i/10});
    }
  }
  const showFountain={centre:plazaSites.myeongnyang,jets:myeongnyang};
  sources.push(showFountain);
  const hangeul=[];
  const characters=[[[0,0],[0,1],[0,2],[0,3],[1,3],[2,3]],
    [[0,0],[1,0],[2,0],[1,1],[1,2],[1,3]],[[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[2,2],[0,3],[1,3],[2,3]]];
  for(const [i,shape] of characters.entries())for(const [x,y] of shape){
    hangeul.push(jet(-43.0+i*4.4+x*1.15,77-y*1.22,1.65+(3-y)*.15));
  }
  for(let i=0;i<28;i++){
    const angle=i/28*Math.PI*2;
    const a=plazaAt(-36.7+6.75*Math.cos(angle),75+6.75*Math.sin(angle));
    const b=plazaAt(-36.7+6.75*Math.cos(angle+.23),75+6.75*Math.sin(angle+.23));
    block(0x838986,(a.east+b.east)/2,(a.north+b.north)/2,1.55,.16,.021,.043,Math.atan2(b.north-a.north,b.east-a.east));
  }
  sources.push({centre:plazaSites.hangeul,jets:hangeul});
  const tunnel=[];
  for(let n=100;n<=134;n+=2.35){
    tunnel.push(jet(-11.8,n,2.63,2.7,.18),jet(-6.4,n,2.63,-2.7,-.18));
  }
  sources.push({centre:plazaSites.tunnel,jets:tunnel});
  const falls=[];
  for(let i=0;i<18;i++)falls.push({...jet(-38.1+i*.48,403.68,1.04,0,-.88),fall:true});
  sources.push({centre:plazaSites.cascade,jets:falls});
  const park=sejongParkFountain;
  const parkJets=Array.from({length:8},(_,i)=>{
    const angle=i*Math.PI/4,dx=Math.sin(angle),dn=Math.cos(angle);
    return jet(park.east+1.77*dx,park.north+1.77*dn,1.18,-dx,-dn);
  });
  parkJets.push(jet(park.east,park.north,2.12));
  sources.push({centre:plazaAt(park.east,park.north,"세종로공원 분수"),jets:parkJets,basin:true});
  const droplet=new T.SphereGeometry(1,7,6),dropColor=new T.MeshBasicMaterial({color:0xc4ecf4,transparent:true,opacity:.58,depthWrite:false});
  const transform=new T.Object3D(),nightColor=new T.Color(0x8bc6ff),dayColor=new T.Color(0xc4eaf4),white=new T.Color(0xffffff);
  // Enough drops, each drawn out along its flight, that a jet reads as one unbroken stream.
  const droplets=18,upward=new T.Vector3(0,1,0),flight=new T.Vector3();
  for(const source of sources){
    const mesh=new T.InstancedMesh(droplet,dropColor,source.jets.length*droplets);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.visible=false;
    mesh.userData.dynamic=true;
    mesh.name=source.centre.name+" 물줄기";
    if(source===showFountain){
      for(let i=0;i<mesh.count;i++)mesh.setColorAt(i,white);
      mesh.instanceColor.setUsage(T.DynamicDrawUsage);
    }
    group.add(mesh);source.mesh=mesh;
    for(const value of source.jets){
      const {x,z}=world(value.e,value.n);value.x=x;value.z=z;
      value.base=terrainHeight(plazaAt(value.e,value.n));
      if(!value.fall&&!value.dx&&!value.dn){
        value.dx=Math.cos(value.phase*6.283)*.32;value.dn=Math.sin(value.phase*6.283)*.32;
      }
      if(!value.fall&&!source.basin){
        block(0x6f7775,value.e,value.n,.21,.21,.026,.039);
        block(water,value.e,value.n,.072,.071,.022,.065);
      }
    }
    source.splash=fountainImpact(T,group,source.jets.map(j=>{
      const floor=terrainHeight(plazaAt(j.e+j.dx,j.n+j.dn));
      return [j.x+j.dx,floor+(source.basin?.47:j.fall?.292:.044),j.z-j.dn,j.fall?.92:.74];
    }));
  }
  const lights=addMyeongnyangShowLights(T,group,myeongnyang,world);
  const palette=[[0x47dcff,0xa8e0ff],[0x77b6ff,0xffbd64],[0x9cf5e4,0xff9ed1],[0xffc879,0xb3ebff]]
    .map(row=>row.map(color=>new T.Color(color)));
  const color=new T.Color();
  let showed=false;

  return (now,night,anchor,showStart=0,clock=now)=>{
    const closeToShow=anchor&&Math.hypot(showFountain.centre.x-anchor.x,showFountain.centre.y-anchor.y)<PLAZA_SHOW_VIEW_METRES;
    const frame=closeToShow?plazaShowFrame(showStart,clock):null;
    lights.visible=Boolean(frame);
    if(!anchor){
      for(const {mesh,splash} of sources)mesh.visible=splash.mesh.visible=false;
      return;
    }
    dropColor.color.copy(dayColor).lerp(nightColor,night);
    for(const source of sources){
      const {centre,jets,mesh}=source,isShow=source===showFountain;
      mesh.visible=Boolean(anchor&&Math.hypot(centre.x-anchor.x,centre.y-anchor.y)<85);
      source.splash.mesh.visible=mesh.visible&&Math.hypot(centre.x-anchor.x,centre.y-anchor.y)<52;
      if(!mesh.visible)continue;
      let index=0;
      const performance=isShow?frame:null;
      const flowTime=performance?.elapsed??now;
      source.splash.update(flowTime*.001,night,1+(performance?.envelope??0)*.48);
      for(let jetIndex=0;jetIndex<jets.length;jetIndex++){
        const {x,z,h,dx,dn,phase,fall,row,arc,base}=jets[jetIndex];
        let pulse=fall?1:.72+Math.sin(flowTime*.0021+phase*6.3)*.18;
        if(performance){
          const level=plazaShowJet(performance,row,arc);
          pulse=between(pulse,.13+1.72*level,performance.envelope);
          const [a,b]=palette[performance.section],variation=.50+Math.sin(performance.beat*.48+arc*3.14+row*.84)*.46;
          color.copy(a).lerp(b,variation);
          lights.setColorAt(jetIndex,color);
          const energy=(.31+level*.66)*performance.envelope;
          const glowSize=.63+energy*.62;
          transform.position.set(x,base+.096,z);transform.scale.set(glowSize,1,glowSize);transform.rotation.set(0,0,0);
          transform.updateMatrix();lights.setMatrixAt(jetIndex,transform.matrix);
          color.lerp(white,.16+(1-performance.envelope)*.72);
        }
        for(let i=0;i<droplets;i++){
          const time=(flowTime*.00145+phase+i/droplets)%1;
          const drift=fall?time:time*time;
          const floor=source.basin?.47:.044;
          const y=fall?between(1.19,.292,time):floor+(source.basin?.21:.035)*(1-time)+4*h*pulse*time*(1-time);
          transform.position.set(x+dx*drift,base+y,z-dn*drift);
          // The water thins as it climbs and breaks into heavier drops on the way down.
          const thickness=(fall?.030:.034-.012*Math.sin(Math.PI*time)+time*.020)+(performance?.envelope??0)*.019;
          if(fall)flight.set(0,-1.01,-dn);
          else flight.set(dx*2*time,4*h*pulse*(1-2*time),-dn*2*time);
          const reach=flight.length();
          transform.scale.set(thickness,Math.max(.05,reach/droplets*.60),thickness);
          transform.quaternion.setFromUnitVectors(upward,flight.multiplyScalar(1/(reach||1)));
          transform.updateMatrix();mesh.setMatrixAt(index,transform.matrix);
          if(performance)mesh.setColorAt(index,color);else if(isShow&&showed)mesh.setColorAt(index,white);
          index++;
        }
      }
      mesh.instanceMatrix.needsUpdate=true;
      if(isShow&&(performance||showed))mesh.instanceColor.needsUpdate=true;
      if(isShow)showed=Boolean(performance);
      if(performance){
        lights.instanceMatrix.needsUpdate=true;lights.instanceColor.needsUpdate=true;
        lights.material.opacity=(.73+night*.22)*performance.envelope;
      }
    }
  };
}

function addMyeongnyangShowLights(T,group,jets,world){
  const size=32,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const radius=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));
    const ring=Math.exp(-(((radius-.40)/.083)**2)),halo=Math.max(0,1-radius)*.43;
    pixels.set([255,255,255,Math.round(Math.min(1,ring+halo)*255)],(y*size+x)*4);
  }
  const texture=new T.DataTexture(pixels,size,size);
  texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false});
  const geometry=new T.PlaneGeometry(1.29,1.29).rotateX(-Math.PI/2);
  const lights=new T.InstancedMesh(geometry,material,jets.length),transform=new T.Object3D(),white=new T.Color(0xffffff);
  lights.name="명량분수 공연 조명";lights.visible=false;lights.frustumCulled=false;
  lights.userData.dynamic=true;
  for(const [i,jet] of jets.entries()){
    const {x,z}=world(jet.e,jet.n);
    transform.position.set(x,.096,z);transform.updateMatrix();
    lights.setMatrixAt(i,transform.matrix);lights.setColorAt(i,white);
  }
  lights.instanceMatrix.setUsage(T.DynamicDrawUsage);lights.instanceColor.setUsage(T.DynamicDrawUsage);
  group.add(lights);
  return lights;
}
