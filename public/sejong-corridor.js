import {addObstacle} from "./layout.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {plazaAt,eastCurb,eastRoadWidth} from "./plaza-layout.js";
import {corridorProfile,corridorProfileAt,corridorSidewalks,corridorEastLanding,corridorEastLandingKerb,seoulPlazaCrossingLanding,corridorMainRoad,corridorBranches,corridorCrossings,
  insideCorridorPolygon} from "./sejong-corridor-layout.js";

export function buildSejongCorridor(T,scene,kit){
  const {wx,wz,box,cylinder,matte}=kit;
  const group=new T.Group();group.name="세종대로 사람숲길";scene.add(group);
  let seed=6417827;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

  function block(color,x,y,w,d,h,base=0,angle=0){
    const mesh=box(color,wx(x),base+h/2,wz(y),w,h,d,group);
    mesh.rotation.y=angle;
    return mesh;
  }
  function obstacle(x,y,w,d,height=Infinity,angle=0){
    addObstacle(x,y,w,d,angle,height);
  }
  function strip(color,a,b,width,height,base=0){
    const mesh=block(color,(a.x+b.x)/2,(a.y+b.y)/2,Math.hypot(b.x-a.x,b.y-a.y)+.01,width,height,base,
      Math.atan2(a.y-b.y,b.x-a.x));
    mesh.userData.followTerrain=true;mesh.userData.sharedTerrainGeometry=true;
    return mesh;
  }
  const rectangle=(x,y,w,d)=>[
    {x:x-w/2,y:y-d/2},{x:x+w/2,y:y-d/2},{x:x+w/2,y:y+d/2},{x:x-w/2,y:y+d/2}
  ];
  function surface(outline,material,height,tile=2.6){
    const path=new T.Shape(outline.map(p=>new T.Vector2(wx(p.x),-wz(p.y))));
    const geometry=new T.ShapeGeometry(path),uv=geometry.attributes.uv,p=geometry.attributes.position;
    for(let i=0;i<uv.count;i++)uv.setXY(i,p.getX(i)/tile,p.getY(i)/tile);
    geometry.rotateX(-Math.PI/2);
    const mesh=new T.Mesh(geometry,material);mesh.position.y=height;mesh.receiveShadow=true;
    mesh.userData.followTerrain=true;group.add(mesh);
    return mesh;
  }
  function granite(){
    const size=96,pixels=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const band=Math.floor(y/24),stagger=band%2*16;
      const joint=y%24===0||(x+stagger)%32===0;
      const tone=(joint?114:154+((band*7+Math.floor((x+stagger)/32)*13)%19))+Math.round(random()*11-5);
      pixels.set([tone+2,tone,tone-4,255],(y*size+x)*4);
    }
    const map=new T.DataTexture(pixels,size,size);
    map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
    map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
    return new T.MeshStandardMaterial({map,roughness:.95});
  }
  const paved=granite(),asphalt=matte(0x45494c),darker=matte(0x474a47),cycle=matte(0x816762);
  const stone=0xb7b7ad,curb=0xb1b0a6,white=0xe4e1d7;

  surface(rectangle(507,6,326,610),matte(0x71766b),-.071);
  for(const walk of corridorSidewalks){
    const landing=walk===corridorEastLanding||walk===seoulPlazaCrossingLanding;
    surface(walk,paved,landing?.033:.039);
  }
  surface(corridorMainRoad,asphalt,.021);
  const [,southWest,southEast]=corridorProfileAt(-292),northWest=eastCurb(0);
  surface([{x:southWest,y:-291.8},{x:southEast,y:-291.8},plazaAt(northWest+eastRoadWidth,.3),plazaAt(northWest,.3)],asphalt,.009);
  for(const {outline} of corridorBranches)surface(outline,asphalt,.053);
  const cycleBand=[...corridorProfile.map(([y,,west])=>({x:west-2.25,y})),
    ...corridorProfile.slice().reverse().map(([y,,west])=>({x:west-.26,y}))];
  surface(cycleBand,cycle,.048);

  const crossingAt=(x,y)=>corridorCrossings.some(({outline})=>insideCorridorPolygon(x,y,outline));
  const branchAt=(x,y)=>corridorBranches.some(({outline})=>insideCorridorPolygon(x,y,outline));
  // The east sidewalk follows the moved lane line north of the intersection.
  // Leave the north end of the zebra level and taper the new kerb into the plaza.
  for(let i=2;i<corridorEastLandingKerb.length-1;i++){
    const a=corridorEastLandingKerb[i],b=corridorEastLandingKerb[i+1];
    strip(curb,a,b,.17,.075,.021);
    strip(0xc6a44c,{x:a.x+1.44,y:a.y},{x:b.x+1.44,y:b.y},.23,.009,.038);
  }
  for(let y=-289;y<311;y+=2.6){
    const [,west,east]=corridorProfileAt(y),[,nextWest,nextEast]=corridorProfileAt(y+2.59);
    for(const [x,next] of [[west,nextWest],[east,nextEast]]){
      if(x===east&&insideCorridorPolygon(x,y+1.3,seoulPlazaCrossingLanding))continue;
      if(!crossingAt(x,y)&&!branchAt(x,y)&&!branchAt(x,y+2.59))strip(curb,{x,y},{x:next,y:y+2.59},.18,.082,.024);
    }
  }
  for(let y=-242;y<310;y+=7.3){
    const [,west,east]=corridorProfileAt(y);
    for(let i=1;i<8;i++){
      const x=west+(east-west)*i/8;
      if(crossingAt(x,y)||branchAt(x,y))continue;
      if(i===4){
        for(const offset of [-.12,.12]){
          const lane=x+offset;
          strip(0xc9ab55,{x:lane,y:y-3.64},{x:lane,y:y+3.64},.075,.012,.03);
        }
      }else strip(white,{x,y:y-1.61},{x,y:y+1.61},.095,.012,.03);
    }
  }
  for(let y=-235;y<315;y+=16.8){
    const [,west]=corridorProfileAt(y),x=west-1.25;
    if(branchAt(x,y)||crossingAt(x,y)||Math.abs(y-205)<12)continue;
    for(const [offset,radius] of [[-.36,.23],[.36,.23]]){
      const tire=new T.Mesh(new T.RingGeometry(radius-.041,radius,14),matte(0xd8cec1));
      tire.rotation.x=-Math.PI/2;tire.position.set(wx(x),.065,wz(y+offset));
      tire.userData.followTerrain=true;group.add(tire);
    }
    strip(0xd8cec1,{x:x-.16,y:y-.32},{x:x+.18,y:y+.34},.045,.007,.061);
    strip(0xd8cec1,{x:x+.18,y:y-.11},{x:x-.15,y:y+.29},.045,.007,.061);
  }
  for(let y=-237;y<308;y+=6.6){
    const [,kerb]=corridorProfileAt(y),x=kerb-2.35;
    if(branchAt(x,y)||crossingAt(x,y)||Math.abs(y-205)<10)continue;
    cylinder(0x414946,wx(x),.39,wz(y),.072,.78,8,group);
    cylinder(0xd0ccc0,wx(x),.65,wz(y),.075,.082,8,group);
    obstacle(x,y,.15,.15,.80);
  }
  for(const {a,b,width} of corridorCrossings){
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
    const angle=Math.atan2(-ux,-uy);
    for(let k=1;k<length-.54;k+=1.15){
      const stripe=block(white,a.x+ux*k,a.y+uy*k,width-.28,.52,.015,.071,angle);
      stripe.userData.followTerrain=true;stripe.userData.sharedTerrainGeometry=true;
    }
    for(const end of [a,b]){
      const tactile=block(0xc69e40,end.x,end.y,width-.05,.46,.029,.049,angle);
      tactile.userData.followTerrain=true;tactile.userData.sharedTerrainGeometry=true;
      for(let i=1;i<width-.2;i+=.38){
        const side=i-width/2;
        block(0xd1b159,end.x-uy*side,end.y+ux*side,.09,.09,.012,.080);
      }
    }
  }

  function label(text,x,y,height,width,angle=0,background=null,ink="#ebe4d5"){
    if(typeof document==="undefined")return;
    const canvas=document.createElement("canvas");canvas.width=640;canvas.height=144;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    if(background){ctx.fillStyle=background;ctx.fillRect(0,0,640,144);}
    ctx.fillStyle=ink;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font='600 65px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';ctx.fillText(text,320,74,606);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const mesh=new T.Mesh(new T.PlaneGeometry(width,width*.225),new T.MeshStandardMaterial({map,
      transparent:!background,roughness:.88}));
    mesh.position.set(wx(x),height,wz(y));mesh.rotation.y=angle;group.add(mesh);
    return mesh;
  }
  const lampGlow=new T.MeshStandardMaterial({color:0xf0e8ca,emissive:0xffdb9d,emissiveIntensity:.18});
  const pedestrianGlow=new T.MeshStandardMaterial({color:0x90c979,emissive:0x79b65e,emissiveIntensity:.42});
  function pole(x,y,height=6.1){
    cylinder(0x555d5b,wx(x),height/2,wz(y),.071,height,8,group);
    cylinder(0x565b58,wx(x),.15,wz(y),.139,.30,8,group);
  }
  function lamp(x,y,side){
    pole(x,y);
    block(0x565f5c,x+side*.48,y,1.00,.095,.085,5.99);
    const glass=block(0xffffff,x+side*.96,y,.39,.24,.075,5.94);glass.material=lampGlow;
  }
  for(let y=-226;y<303;y+=24){
    const [,west,east]=corridorProfileAt(y);
    for(const [x,side] of [[west-.43,1],[east+.45,-1]]){
      if(crossingAt(x,y)||branchAt(x,y)||Math.abs(y-205)<6)continue;
      lamp(x,y,side);obstacle(x,y,.19,.19);
    }
  }
  function signal(x,y,angle){
    pole(x,y,3.25);
    block(0x283234,x,y,.31,.24,.65,2.66,angle);
    const face=block(0xffffff,x+.123*Math.sin(angle),y+.123*Math.cos(angle),.13,.025,.14,2.81,angle);
    face.material=pedestrianGlow;
    block(0x393e3b,x,y,.36,.30,.11,3.23,angle);
    obstacle(x,y,.20,.20);
  }
  for(const [x,y,angle] of [[472.5,-254,Math.PI],[481,-285,0],[515.2,-247,Math.PI],[522,-289,0],
    [481,108,Math.PI/2],[523.4,94.6,-Math.PI/2],[481.6,292,Math.PI/2],[524.2,282.9,-Math.PI/2]])signal(x,y,angle);

  const trees=makeTreeBuilder(T,group,{rand:random,clearance:{meshFits:()=>true,trim:()=>true}});
  function plantBed(x,y,w,d,shade){
    block(0x93998e,x,y,w+.27,d+.25,.14,.04);
    block(0x615e4d,x,y,w,d,.047,.181);
    obstacle(x,y,w,d,.18);
    for(let i=0;i<9;i++){
      const px=x+(random()-.5)*(w-.39),py=y+(random()-.5)*(d-.42);
      const radius=.22+random()*.33;
      const shrub=trees.shrub(wx(px),wz(py),radius,random()>.55?"olive":"deep");
      shrub.position.y+=.14;
      if(i%2===0){
        const bloom=cylinder(shade,wx(px)+.08,radius*.61+.21,wz(py)-.06,.073,.038,6,group);
        bloom.rotation.z=.22;
      }
    }
  }
  const autumn=["ginkgo","olive","ginkgo","amber","maple","deep"];
  const plantingRows=[-239,-225,-208,-191,-171,-156,-118,-104,-54,-40,-24,-8,14,34,53,91,117,149,164,256,273,301];
  for(const [i,y] of plantingRows.entries()){
    const [westFront,westKerb,eastKerb,eastFront]=corridorProfileAt(y);
    for(const [side,x] of [[1,westKerb-3.55],[-1,eastKerb+4.8]]){
      if(side===-1&&y>137&&y<170)continue;
      if(x<westFront+2||x>eastFront-2||crossingAt(x,y)||branchAt(x,y))continue;
      const w=side===1?2.34:2.72,d=i%3===0?6.3:4.72;
      plantBed(x,y,w,d,[0xdb9b67,0xdbbb60,0xb97e75][i%3]);
      const height=5.3+random()*4.1;
      trees.grow(wx(x),wz(y),{height,terrainAnchor:{x,y},style:i%4===2?"branchy":"round",palette:autumn[i%autumn.length]});
      obstacle(x,y,.53,.55,height*.78);
    }
  }
  for(const [x,y] of [[450,-225],[447,-198],[448,-175],[453,-149],[468,-106],[467,-17],
    [474.1,37],[474.5,55],[473.4,87],[474.9,114],[473.9,152],[531,-151],[531,-120],[533,115],[545,190],[541,261]]){
    if(branchAt(x,y)||crossingAt(x,y))continue;
    trees.grow(wx(x),wz(y),{height:5.7+random()*3.2,terrainAnchor:{x,y},style:y===55?"cloud":"branchy",palette:y===55?"pine":"ginkgo"});
    obstacle(x,y,.50,.50,4.2);
  }
  for(const [x,y] of [[471,-225],[471,-205],[471,-182],[471,-112],[473,34],[474,93],[473,131],[472,265],[528,-152],[527,127]]){
    if(branchAt(x,y)||crossingAt(x,y))continue;
    for(const side of [-1,1])block(0x797b71,x,y+side*.9,.52,.14,.45,.04);
    for(let i=0;i<4;i++)block(0x957052,x+(i-1.5)*.125,y,.117,2.15,.063,.49);
    obstacle(x,y,.55,2.18,.56);
  }
  for(const [x,y,title] of [[479,267,"광화문광장 ↑"],[475,119,"서울도시건축전시관"],[473,-34,"세종대로 사람숲길"],[471,-240,"광화문광장 ↑"]]){
    cylinder(0x4e5a56,wx(x),1.48,wz(y),.052,2.96,8,group);
    block(0x344740,x,y,2.85,.11,.61,2.29);
    label(title,x,y+.063,2.58,2.73,0,"#344740");
    obstacle(x,y,.20,.20,3);
  }

  // The east side opens onto the stone steps and start of the Cheonggyecheon channel.
  surface(rectangle(575,-155,88,23),paved,.061);
  surface(rectangle(615,-154,119,6.5),matte(0x42666a),.069);
  for(const side of [-1,1]){
    strip(0x9b9b8d,{x:554.5,y:-154+side*3.8},{x:673.5,y:-154+side*3.8},.80,.31,.055);
    strip(0xa6a79b,{x:554.5,y:-154+side*4.9},{x:673.5,y:-154+side*4.9},1.4,.14,.055);
  }
  block(0xa9a69a,553,-154,4.6,7.1,.46,.062);
  block(0x748d8d,553,-154,4.2,6.75,.035,.524);
  label("청계광장",534,-151,1.25,4.3,-Math.PI/2,"#3f514b");

  buildCorridorFacades({T,group,wx,wz,box,matte,block,obstacle,label,surface,rectangle,paved,darker,stone});
  return group;
}

function buildCorridorFacades({T,group,wx,wz,box,matte,block:buildBlock,obstacle,label:buildLabel,surface,rectangle,paved,darker,stone}){
  const granite=0xb4ad9b,ivory=0xd0c7b4,glass=0x486871,deep=0x384b50;
  let terrainAnchor;
  const at=(x,y)=>{terrainAnchor={x,y};};
  function anchored(mesh){
    if(mesh&&terrainAnchor)mesh.userData.terrainAnchor=terrainAnchor;
    return mesh;
  }
  const block=(...args)=>anchored(buildBlock(...args));
  const label=(...args)=>anchored(buildLabel(...args));
  function mass(color,x,y,w,d,h,base=0,angle=0,collide=base===0){
    block(color,x,y,w,d,h,base,angle);
    if(base<=.05&&h>2)block(color,x,y,w,d,.80,base-.80,angle);
    if(collide)obstacle(x,y,w,d,Infinity,angle);
  }
  function windows({x,y,w,d,base=1,levels,columns,pitch,side=1,colors=[glass,deep],ratio=.63,gap=.65}){
    const front=x+side*(w/2+.04),cell=d/columns;
    for(let level=0;level<levels;level++)for(let col=0;col<columns;col++){
      const color=colors[(col*3+level*7+Math.floor(col/3))%colors.length];
      block(color,front,y-d/2+(col+.5)*cell,.11,cell*ratio,pitch*gap,base+(level+.16)*pitch).userData.streamDetail=true;
    }
  }
  function roofTile(color,x,y,w,d,base){
    const thickness=.18;
    for(const side of [-1,1]){
      const tile=block(color,x+side*w*.245,y,w*.545,d,thickness,base+1.27);
      tile.rotation.z=-side*.27;
    }
    block(color,x,y,.34,d+.19,.36,base+2.32);
  }

  // Seoul Hall of Urbanism and Architecture: broad shallow Seoul Maru roof above the glazed hall.
  at(458.9,100.2);
  surface(rectangle(459,100,27,51),paved,.046);
  mass(0xb7b9ad,458.9,100.2,21.9,43.3,2.85,.045,0,true);
  block(0xcecabf,458.7,100.2,22.55,44.2,.43,2.89);
  block(0x636f70,470.02,100.0,.12,36.8,2.32,.33);
  for(let y=83;y<118;y+=2.35)block(0xa7a99e,470.10,y,.18,.086,2.37,.31);
  block(0x797e6e,456.3,98.2,12,25.8,.21,3.31);
  for(let step=0;step<6;step++)block(0xb1b4ab,468.8-step*.75,120.4,1.5,4.24,.16,step*.18);
  block(0xc9c8be,460.5,80.1,14.4,1.16,.54,3.31);
  label("서울도시건축전시관",470.30,99.9,2.91,11.3,Math.PI/2,"#444e4b");

  // The old Bumingwan has a narrow cream frontage, a restored clock tower and an L-shaped wing.
  at(460.45,15.9);
  mass(0xbab09b,460.45,15.9,22.3,58.7,15.2);
  mass(0xb5aa95,441.6,42.5,34.9,34.6,13.7);
  block(ivory,460.45,15.9,22.8,59.5,.54,15.18);
  block(0xb0a894,471.9,16.0,.47,59.1,.72,2.03);
  windows({x:460.45,y:15.9,w:22.3,d:57.8,base:3,levels:3,columns:13,pitch:3.55,colors:[0x63716d,deep],ratio:.40,gap:.72});
  for(let y=-12.4;y<44;y+=4.43)block(0xcec4ad,471.85,y,.29,.29,10.15,3.17);
  block(0x777a6d,472,25,.6,9.5,3.6,.24);
  for(let y=21;y<=29;y+=2.05)block(0x4e5550,472.4,y,.17,1.38,2.93,.35);
  mass(0xc7bca4,461.8,35.6,8.4,9.0,24.8);
  block(0xd3c7ae,461.8,35.6,9.05,9.64,.48,24.76);
  block(0xada48e,461.8,35.6,5.7,6.2,1.33,25.23);
  for(const face of [0,Math.PI/2,Math.PI]){
    const dx=Math.sin(face),dy=Math.cos(face);
    const clock=new T.Mesh(new T.CircleGeometry(1.03,24),matte(0xe8dec4));
    clock.rotation.y=face;clock.position.set(wx(461.8+dx*4.23),21.9,wz(35.6+dy*4.53));group.add(clock);
    const hands=new T.Group();hands.position.copy(clock.position);hands.rotation.y=face;group.add(hands);
    anchored(clock);anchored(hands);
    box(0x4e5147,0,.26,.036,.067,.55,.034,hands).rotation.z=-.27;
    box(0x4e5147,.25,-.02,.039,.48,.06,.035,hands).rotation.z=-.31;
  }
  label("서울특별시의회",472.28,24.9,4.58,12.3,Math.PI/2,"#777767");

  // Romanesque brick cathedral behind the gallery, with a cross plan and tiled gables.
  at(409.8,88.1);
  mass(0x9b5f49,398.8,84.2,53.8,17.2,10.35,0,-.38);
  mass(0xa0664e,409.8,88.1,17,39.5,12.1,0,-.38);
  block(0xc5ac8b,408.5,91.1,21.5,22.8,.47,8.35,-.38);
  const cathedralRoof=block(0x4f5349,399,84.2,55,18.8,2.2,10.25,-.38);
  cathedralRoof.scale.y*=.67;
  roofTile(0x6b5548,409.9,89.4,18.6,39.8,11.65);
  mass(0xa76c53,419.8,83.7,12.4,13.3,19.3,0,-.38);
  block(0xceb38f,419.8,83.7,12.85,13.9,.46,18.7,-.38);
  block(0x66564a,419.8,83.7,12.9,13.9,1.0,19.3,-.38);
  for(let i=0;i<6;i++){
    const y=68.4+i*6.5;
    block(0x593d34,418.5,y,.26,1.61,3.07,5.22,-.38);
    block(0xc5a687,419.2,y,.47,2.07,.22,4.94,-.38);
  }

  // Koreana's slim tower and repeated horizontal ribbons are visible from the whole street.
  const hotel={x:454.8,y:-47.8,w:20.4,d:59.2};
  at(hotel.x,hotel.y);
  mass(0xa6a59a,hotel.x,hotel.y,hotel.w+3.0,hotel.d+2.8,7.2);
  mass(0x779398,hotel.x,hotel.y,hotel.w,hotel.d,76.4,7.2);
  for(let i=0;i<21;i++){
    const level=8+i*3.55;
    block(i%5?0xd2cbc0:0xbdbbb1,465.12,hotel.y,.27,59.15,.65,level);
    block(0xb9bbb3,444.47,hotel.y,.20,59.15,.55,level);
    for(const side of [-1,1])block(0xc0beb4,hotel.x,hotel.y+side*29.70,20.5,.17,.57,level);
  }
  windows({...hotel,base:8.6,levels:20,columns:17,pitch:3.55,colors:[0x4f7185,0x638899,0x46687e],ratio:.93,gap:.63});
  block(0xd6cec1,hotel.x,hotel.y,20.9,59.5,1.1,83.4);
  block(0x7f8985,hotel.x-2.7,hotel.y+3.4,13,18.6,3.25,84.45);
  block(0x393f3f,466.73,-47.8,.17,24.2,5.05,.32);
  block(0xd9d7cb,467.71,-47.8,2.5,17.4,.43,4.78);
  block(0x3d484a,467.65,-47.8,2.29,16.9,.085,4.72);
  label("HOTEL KOREANA",469.01,-47.8,5.20,16.8,Math.PI/2,"#dedbd0","#404641");
  for(const y of [-68,-62,-32,-26]){
    block(0x454c49,466.52,y,.14,4.74,2.75,.21);
    block(0xa55c45,467.35,y,1.65,4.95,.19,3.07).rotation.z=-.16;
  }
  for(let y=-67;y<-27;y+=1.30)buildBlock(0xc5a747,475.06,y,.28,1.28,.020,.055);

  const press={x:560.2,y:44.5,w:33.6,d:63.2};
  at(press.x,press.y);
  mass(0xa7aba1,press.x,press.y,press.w,press.d,78.5);
  windows({...press,base:5.7,levels:20,columns:12,pitch:3.53,side:-1,colors:[0x5d7275,0x516d74,0x647e83],ratio:.69,gap:.69});
  for(let level=6;level<78;level+=3.55)block(0xc2c5b9,543.25,press.y,.22,63.18,.31,level);
  for(let y=15;y<=75;y+=5.26)block(0xc0c0b4,543.2,y,.28,.21,72.2,5.3);
  block(0x969f98,press.x,press.y,33.9,63.6,1.55,78.5);
  label("한국프레스센터",543.1,43.2,5.85,17.2,-Math.PI/2,"#4b5a5c");

  // The library's west wing sits behind the curb. Its frontage follows the mapped
  // setback instead of extending the wider southern wing through the footway.
  at(530.55,151.75);
  mass(0xb9b4a4,530.55,151.75,16.0,27.3,17.25);
  block(0xc5c0b0,530.55,151.75,16.54,27.64,.43,17.22);
  block(0xa29e91,530.55,151.75,16.21,27.44,.40,.21);
  windows({x:530.55,y:151.75,w:16.0,d:27.3,base:2.0,levels:4,columns:7,pitch:3.55,side:-1,
    colors:[0x5d6f6e,0x6d7c77],ratio:.45,gap:.66});
  for(const y of [138.38,164.99])block(0xc0b9a8,522.50,y,.38,.48,16.5,.68);

  // City hall sits behind the older library, its southern wave rising over a glass grid.
  at(609.7,123.0);
  mass(0x638d93,609.7,123.0,100.4,47.5,42.3);
  for(let i=0;i<20;i++){
    const x=561.9+i*5.0,height=40+Math.sin((i+3)/24*Math.PI)*15.2;
    const edge=147.2+Math.sin(i*.17)*3.55;
    block(i%3?0x69959b:0x739fa3,x,(edge+104)/2,4.99,edge-104,height-35.1,35.1);
    block(0xc1c7b8,x,edge+.34,4.94,.52,.30,height-.15);
    for(let row=1;row<=10;row++){
      const floor=row*3.61;
      block(0x7aa2a2,x,147.1,4.84,.13,2.85,floor);
      block(0xa5bcad,x,147.22,4.87,.14,.11,floor+2.92);
    }
  }
  for(let x=559;x<662;x+=3.6)block(0x8aa9a4,x,147.33,.10,.11,36.4,.5);
  label("서울특별시청",560.25,150.2,6.8,18.3,0,"#526966");

  // Dongwha Duty Free occupies the dark granite base of the taller Gwanghwamun Building.
  const duty={x:410.8,y:-196.1,w:33.8,d:51.4};
  at(duty.x,duty.y);
  mass(0x696e6a,414.3,-196.1,42.4,58.2,10.6);
  mass(0x989a92,duty.x,duty.y,duty.w,duty.d,73.5,10.6);
  windows({...duty,base:11.6,levels:18,columns:13,pitch:3.86,colors:[0x586c71,0x496169,0x61777a],ratio:.56,gap:.81});
  for(let y=-220;y<=-172;y+=3.97)block(0xc0bcb0,427.8,y,.18,.37,70.5,11.15);
  block(0x444e4d,435.60,-195.5,.31,48.5,4.3,.45);
  for(let y=-219;y<=-172;y+=3.0)block(0x8a928b,435.8,y,.15,.15,4.37,.39);
  block(0xbdb7aa,437.2,-196.3,4.3,42.5,.46,5.1);
  surface(rectangle(442.4,-197,14.4,62),paved,.049);
  label("동화면세점",436.2,-197,7.4,18.4,Math.PI/2,"#5b6158");
  label("광화문빌딩",427.9,-196,82.1,23.8,Math.PI/2,"#848880");

  // The original newspaper frontage across the road and rounded newer Donga Media Center.
  const ilmin={x:539.3,y:-226.0,w:13.7,d:36.4};
  at(ilmin.x,ilmin.y);
  mass(0xbab39c,ilmin.x,ilmin.y,ilmin.w,ilmin.d,21.6);
  windows({...ilmin,base:1.8,levels:5,columns:7,pitch:3.45,side:-1,colors:[0x455b59,0x5d706a],ratio:.52,gap:.75});
  for(const level of [4.7,11.9,18.6,21.15])block(0xd1c5aa,532.11,ilmin.y,.56,36.55,.31,level);
  label("일민미술관",532.17,-225,5.3,8,-Math.PI/2,"#a59c88","#3c4841");
  const donga={x:570.9,y:-191.5,w:47.8,d:19.0};
  at(donga.x,donga.y);
  mass(0x778e90,donga.x,donga.y,donga.w,donga.d,97.0);
  for(let i=0;i<10;i++){
    const angle=i*Math.PI*2/10;
    block(0x5f838c,545.2+Math.cos(angle)*5.7,-191.3+Math.sin(angle)*7.9,3.7,4.2,93.0,2.5,angle);
  }
  windows({...donga,base:4.1,levels:21,columns:5,pitch:4.1,side:-1,colors:[0x436f7c,0x5b8591,0x4f7f8e],ratio:.81,gap:.83});
  label("동아일보",545.4,-191.8,7.2,12,-Math.PI/2,"#435653");

  // The adjacent towers fill sightlines from the main pavement in their real block order.
  const backdrop=[
    [391,-51,39,35,35,0x797e72,1,"TV조선"],[397,1,43,34,30,0x989789,1,"조선일보"],
    [429,-127,13,13,8.4,0x9d9c91,1,"세종로파출소"],[441,-223,5.0,7.2,3.6,0x737c72,1,"관광안내"],
    [572,-222,46,37,51,0xb2b7aa,-1,"광화문우체국"],[592,-69,69,27,124,0x8faaa8,-1,"서울파이낸스센터"],
    [583,-18,22,29,60,0xb6af9d,-1,"뉴서울호텔"],[591,-114,40,19,65,0xa6ab9f,-1,"청계청사"],
    [643,-186,30,22,72,0x7b8b87,-1,"청계11빌딩"],[649,-222,46,22,70,0x9ba89d,-1,""],
    [370,-216,39,42,58,0xa6a694,1,""],[377,-155,41,35,43,0x8e9183,1,""],[364,-91,41,27,38,0xa4a392,1,""],
    [636,-16,31,37,72,0x84958c,-1,""],[643,50,39,34,55,0x96a098,-1,""]
  ];
  for(const [x,y,w,d,h,color,side,name] of backdrop){
    at(x,y);
    mass(color,x,y,w,d,h);
    const levels=Math.max(1,Math.min(25,Math.floor((h-2.6)/3.5)));
    windows({x,y,w,d,base:1.4,levels,columns:Math.max(2,Math.floor(d/4.3)),pitch:3.5,side,
      colors:[glass,deep,0x5e7578],ratio:.69,gap:.68});
    block(0xacac9e,x,y,w+.35,d+.35,.61,h-.61);
    if(name)label(name,x+side*(w/2+.13),y,Math.min(7,h*.72),Math.min(16,d*.64),side*Math.PI/2,"#555e55");
  }
  // Keep the paved rear frontage clear where the palace walkway reaches Sejong-daero.
  surface(rectangle(426.9,118.5,35,12),darker,.048);
}
