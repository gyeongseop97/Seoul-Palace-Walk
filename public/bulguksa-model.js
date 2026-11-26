import * as T from "three";
import {districtMeshes,localFrame,randomSeed,registerDistrictLod} from "./gyeongju-mesh.js";
import {roof,buildingFrame} from "./gyeongju-architecture.js";
import {busShelter} from "./gyeongju-landmarks.js";
import {makeTreeBuilder} from "./lowpoly-trees.js";
import {templeOrigin,templePoint,templeAxis,templeAxes,templePaths,templeHalls,templeBridges,templePonds,templeCourtBounds,templePagodas,templeSites,templeGallery,templeBridgeHeight,templeHeight,templeWalkable,templeSolid} from "./bulguksa-layout.js";

const stone=0xb4ab99,tile=0x485458,timber=0x8e4937,green=0x496c58,sand=0xc9b391;
function quad(k,points,color,surface,offset=0){
 k.face(points.map(p=>[p.x,templeHeight(p)+offset,p.z]),[0,1,2,0,2,3],color,surface);
}
function ribbon(k,path){
 const sides=path.points.map((p,i,line)=>{
  const a=line[Math.max(0,i-1)],b=line[Math.min(i+1,line.length-1)];
  const d=Math.hypot(b.x-a.x,b.z-a.z)||1,dx=(b.z-a.z)/d*path.width/2,dz=(a.x-b.x)/d*path.width/2;
  return [{x:p.x+dx,z:p.z+dz},{x:p.x-dx,z:p.z-dz}];
 });
 for(let i=1;i<sides.length;i++)quad(k,[...sides[i-1],sides[i][1],sides[i][0]],path.kind==="steps"?stone:sand,path.kind==="steps"?"pavers":"dirt",.047);
}
const plaqueFace=new T.PlaneGeometry(1,1);
function sacredHall(k,b,frame){
 let {x,z,width:w,depth:d,yaw}=frame;
 if(Math.abs(Math.sin(yaw))>.7){[w,d]=[d,w];yaw+=Math.PI/2;}
 if(Math.cos(yaw)<0)yaw+=Math.PI;
 const at=localFrame(x,z,yaw),base=templeHeight({x,z});
 const great=b.id===244539247,bays=great?5:3,plinth=great?1.14:.85,beamY=great?6.65:5.05;
 const part=(u,y,v,width,height,depth,color)=>{const p=at(u,v);k.piece(p.x,base+y,p.z,width,height,depth,color,yaw);};
 part(0,plinth*.43,0,w*.94,plinth*.86,d*.80,0xa59f93);part(0,plinth*.93,0,w*.96,plinth*.14,d*.82,0xc0b9a6);
 for(let i=0;i<5;i++)part(0,(5-i)*plinth/10,d*(.414+i*.021),w*.24,(5-i)*plinth/5,d*.025+.05,stone);
 const colW=w*.84,colD=d*.68,bay=colW/bays;
 part(0,(plinth+beamY)/2-.3,0,colW-.20,beamY-plinth-.6,colD-.18,0xbca178);
 for(const side of [-1,1]){
  for(let i=0;i<=bays;i++){
   const u=colW*(i/bays-.5),v=side*colD/2,p=at(u,v);
   k.column(p.x,base+plinth+.13,p.z,.65,.26,.65,stone);
   k.column(p.x,base+(beamY+plinth)/2-.15,p.z,.43,beamY-plinth-.28,.43,timber);
   if(i<bays){
    const center=u+bay/2,doors=great?4:3;
    for(let leaf=0;leaf<doors;leaf++){
     const mid=center+((leaf+.5)/doors-.5)*(bay-.42),width=(bay-.42)/doors-.045;
     part(mid,(plinth+beamY)/2-.31,v,width,beamY-plinth-1,.13,green);
     for(let rail=0;rail<5;rail++)part(mid,plinth+1.2+rail*.46,v+side*.08,width,.034,.035,0xb9916d);
     for(const slat of [-1,0,1])part(mid+slat*width*.27,plinth+2.1,v+side*.085,.034,1.98,.04,0xb9916d);
    }
   }
  }
  // Alternating bracket arms repeat above the columns and between each pair.
  for(let j=0;j<=bays*3;j++){
   const u=colW*(j/(bays*3)-.5);
   for(let level=0;level<3;level++){
    part(u,beamY-.50+level*.20,side*(colD/2+.12+level*.20),.66+level*.22,.16,.45+level*.14,
     [0x6c8f77,0xa45541,0x3e776c][level]);
   }
  }
  for(let j=1;j<bays;j++){
   const p=at(side*colW/2,colD*(j/bays-.5));k.column(p.x,base+(plinth+beamY)/2-.13,p.z,.42,beamY-plinth-.26,.42,timber);
  }
 }
 for(const [dy,col] of [[-.59,0x487a70],[-.38,0xaf5949],[-.18,0x476c59],[.04,0xbe8460]]){
  part(0,beamY+dy,0,colW+1.15,.16,colD+1.05,col);
 }
 const rise=great?3.45:2.6;
 roof(k,x,base+beamY+.19,z,w+1.22,rise*.74,d+1.3,yaw,tile);
 const gableU=w*.325,half=d*.245,shoulder=base+beamY+rise*.55,peak=base+beamY+rise+.74;
 const vertex=(u,y,v)=>{const p=at(u,v);return [p.x,y,p.z];};
 for(const side of [-1,1]){
  k.face([vertex(-gableU,shoulder,side*half),vertex(gableU,shoulder,side*half),
   vertex(gableU,peak,0),vertex(-gableU,peak,0)],[0,1,2,0,2,3],tile);
  k.face([vertex(side*gableU,shoulder,-half),vertex(side*gableU,shoulder,half),
   vertex(side*gableU,peak,0)],[0,1,2],0xb17f61);
  for(let j=0;j<=24;j++){
   const u=(j/24-.5)*gableU*2,a=at(u,side*half),b=at(u,0);
   k.beam({...a,y:shoulder+.045},{...b,y:peak+.045},.038,0x677272);
  }
 }
 part(0,peak-base+.09,0,gableU*2+.24,.18,.26,0x77807d);
 const p=at(0,colD/2+.85);
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=152;
 const ctx=canvas.getContext("2d");
 ctx.fillStyle="#262b25";ctx.fillRect(0,0,512,152);ctx.strokeStyle="#a37e42";ctx.lineWidth=6;ctx.strokeRect(5,5,502,142);
 ctx.fillStyle="#f3db95";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font='bold 107px Batang,"Noto Serif CJK KR",serif';
 ctx.fillText(great?"殿雄大":"殿樂極",256,77,454);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshStandardMaterial({map,roughness:.85});
 k.geo(plaqueFace,p.x,base+beamY-.57,p.z,great?3.65:3.05,1.08,1,0xffffff,yaw,material);
}
function hall(k,b){
 const frame=buildingFrame(b.points);
 if(b.id===244539247||b.id===244539240){sacredHall(k,b,frame);return;}
 const {x,z,width:w,depth:d,yaw}=frame,at=localFrame(x,z,yaw),h=templeHeight({x,z});
 const gate=b.kind==="gatehouse",eave=gate?4.1:3.25;
 const bays=Math.max(2,Math.min(5,Math.round(w/3)));
 k.piece(x,h+.10,z,w*.96,.20,d*.95,stone,yaw);
 if(!gate){
  k.piece(x,h+eave*.46,z,w*.88,eave*.88,d*.84,0xd0b78d,yaw);
  for(const side of [-1,1])for(let i=0;i<bays;i++){
   const door=at((i+.5-bays/2)*w*.86/bays,side*d*.425),panelW=w*.74/bays;
   k.piece(door.x,h+eave*.45,door.z,panelW,eave*.70,.12,green,yaw);
   for(let n=-1;n<=1;n++){
    const slat=at((i+.5-bays/2)*w*.86/bays+n*panelW*.26,side*(d*.425+.07));
    k.piece(slat.x,h+eave*.51,slat.z,.048,eave*.53,.07,0xaf8b62,yaw);
   }
  }
 }
 for(const side of [-1,1])for(let i=0;i<=bays;i++){
  if(gate&&i!==0&&i!==bays&&Math.abs(i/bays-.5)<.26)continue;
  const p=at((i/bays-.5)*w*.87,side*d*.39);
  k.column(p.x,h+eave*.48,p.z,.29,eave*.96,.29,timber);
  k.piece(p.x,h+eave-.18,p.z,1.0,.26,.86,green,yaw);
 }
 for(const [dy,col] of [[-.27,green],[.0,timber],[.14,0x467c70]])k.piece(x,h+eave+dy,z,w+.3,.15,d+.24,col,yaw);
 roof(k,x,h+eave+.26,z,w+1.35,Math.min(d*.33,4.3),d+1.45,yaw,tile);
}
const cloisters={
 244539236:[[-32,-17],[-66,-12],[-60,27],[-50,25]],
 244539237:[[8,-47],[16,-49],[26,13],[11,15]],
 244539238:[[-25,-44],[-31,-43],[-21,20],[-4,17]]
};
function gallery(k,line){
 const pts=line.map(templePoint);
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],w=Math.hypot(a.x-b.x,a.z-b.z),yaw=Math.atan2(a.z-b.z,b.x-a.x);
  const n=Math.max(1,Math.ceil(Math.abs(templeHeight(a)-templeHeight(b))/.65));
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,h=templeHeight({x,z});
   roof(k,x,h+2.7,z,w/n+.25,1.25,5.0,yaw,tile);
   const at=localFrame(x,z,yaw);
   const columns=Math.ceil(w/n/3.1);
   for(let col=0;col<columns;col++)for(const side of [-1,1]){
    const p=at((col/columns-.5)*w/n,side*1.72);k.column(p.x,h+1.36,p.z,.22,2.72,.22,timber);
   }
  }
 }
}
function stoneBridges(k){
 const counts={"청운교":16,"백운교":18,"칠보교":8,"연화교":10};
 for(const b of templeBridges){
  const points=b.points.map(templeAxes),us=points.map(p=>p.u),vs=points.map(p=>p.v);
  const u=(Math.min(...us)+Math.max(...us))/2,w=Math.max(...us)-Math.min(...us);
  const start=Math.min(...vs),end=Math.max(...vs),d=end-start,n=counts[b.name];
  const upper=b.name==="청운교"||b.name==="칠보교",east=b.name==="청운교"||b.name==="백운교";
  const joint=upper?end:start,radius=east?2.05:1.35,rise=east?1.65:1.2;
  for(let i=0;i<n;i++){
   const v=start+(i+.5)*d/n,p=templeAxis(u,v),top=Math.max(.22,templeBridgeHeight(p)+.16);
   const underside=rise*Math.sqrt(Math.max(0,1-((v-joint)/radius)**2));
   k.piece(p.x,(top+underside)/2,p.z,w,top-underside,d/n+.02,i%4===0?0xbfb8a6:stone,.15);
  }
  for(const side of [-1,1]){
   for(let i=0;i<4;i++){
    const p=templeAxis(u+side*(w/2+.11),start+d*i/3),y=templeBridgeHeight(p);
    k.piece(p.x,y+.43,p.z,.38,.86,.44,0xb8afa0,.15);
   }
   const a=templeAxis(u+side*(w/2+.11),start),b=templeAxis(u+side*(w/2+.11),end);
   k.beam({...a,y:templeBridgeHeight(a)+.7},{...b,y:templeBridgeHeight(b)+.7},.14,stone);
   if(upper)continue;
   const vertex=(angle,border)=>{
    const p=templeAxis(u+side*(w/2+.035),joint+Math.cos(angle)*(radius+border));
    return [p.x,Math.sin(angle)*(rise+border),p.z];
   };
   for(let i=0;i<11;i++){
    const a=i*Math.PI/11+.006,b=(i+1)*Math.PI/11-.006;
    k.face([vertex(a,0),vertex(b,0),vertex(b,.29),vertex(a,.29)],[0,1,2,0,2,3],i%2?0xb5aea0:0xc6bba9);
   }
  }
 }
 // The two courtyards stand on a stone terrace above the southern forecourt.
 for(const [start,end] of [[-69,-50],[-43,-5],[4,27]]){
  for(let u=start;u<end;u+=2.6){
   const width=Math.min(2.6,end-u),p=templeAxis(u+width/2,21.3),h=templeHeight(templeAxis(u+width/2,20));
   for(let j=0;j<5;j++)k.piece(p.x,(j+.5)*h/5,p.z,width-.043,h/5-.037,1.55,j%2?0xa39b8e:0xbab0a0,.15);
   const post=templeAxis(u,21.95);k.piece(post.x,h*.69,post.z,.25,h*.61,.36,0xc4bbab,.15);
   k.piece(p.x,h+.04,p.z,width,.23,1.77,0xc9c1ad,.15);
   k.piece(p.x,h*.38,p.z,width,.22,1.73,0xc0b7a6,.15);
  }
 }
 const pavilion=templeAxis(-24,21),h=templeHeight(templeAxis(-24,20));
 for(const side of [-1,1]){
  const foot=templeAxis(-24+side*2.15,24.3);
  for(let j=0;j<11;j++)k.piece(foot.x,(j+.5)*h/11,foot.z,j%2?1.15:1.52,h/11,1.46,stone,.15);
  k.column(foot.x,h+1.33,foot.z,.38,2.66,.38,timber);
 }
 k.piece(pavilion.x,h+.07,pavilion.z,6.55,.29,7.35,0x876c50,.15);
 roof(k,pavilion.x,h+2.74,pavilion.z,7.05,2.22,7.85,.15,tile);
}
function pagodaFallback(k,p,dabo){
 const h=templeHeight(p),part=(base,w,height,offset=0)=>k.piece(p.x,h+base+height/2,p.z,w,height,w,stone,.15+offset);
 part(0,5.4,.43);part(.43,4.75,.52);part(.95,4.3,.8);part(1.75,4.85,.25);
 if(dabo){
  for(const side of [-1,1])for(const end of [-1,1])k.column(p.x+side*1.35,h+3.17,p.z+end*1.35,.5,2.35,.5,stone);
  part(4.34,4.12,.42);part(4.76,2.85,.38,Math.PI/4);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4;k.column(p.x+Math.cos(a)*1.27,h+5.82,p.z+Math.sin(a)*1.27,.24,1.39,.24,stone);
  }
  part(6.5,2.75,.34,Math.PI/4);part(6.84,1.52,1.25);part(8.09,2.18,.38,Math.PI/4);
 }else{
  let y=2;
  for(const [w,height] of [[2.9,2.12],[2.3,1.25],[1.72,1.0]]){
   part(y,w,height);y+=height;
   for(let j=0;j<5;j++){part(y,w+.2+j*.16,.067);y+=.067;}
   part(y,w+1.04,.18);y+=.18;part(y,w+.35,.12);y+=.12;
  }
  for(const [width,height] of [[1.02,.38],[.63,.37],[.84,.31],[.47,.35],[.63,.26],[.31,.34],[.46,.19],[.18,.24]]){
   k.column(p.x,h+y+height/2,p.z,width,height,width,stone);y+=height;
  }
  const tip=10.75-y;k.column(p.x,h+y+tip/2,p.z,.11,tip,.11,stone);return;
 }
 for(const [base,width,height] of [[8.48,1.05,.49],[8.97,.7,.66],[9.63,.29,.66]])k.column(p.x,h+base+height/2,p.z,width,height,width,stone);
}
function pavement(k,us,vs,color,surface,offset){
 for(let i=1;i<us.length;i++)for(let j=1;j<vs.length;j++){
  quad(k,[templeAxis(us[i-1],vs[j-1]),templeAxis(us[i],vs[j-1]),templeAxis(us[i],vs[j]),templeAxis(us[i-1],vs[j])],color,surface,offset);
 }
}
export function buildBulguksa(root,k,kit,drawPond){
 const rng=randomSeed(10763);
 const us=[-200,-90,-68,-56,-49.5,-44.1,-32,-24,-4.3,3.0,19,31,72,160];
 const vs=[-155,-58,-34,20,20.99,21.02,40,105,245,460];
 pavement(k,us,vs,0x969f6a,"grass",-.07);
 for(const [left,top,right,bottom] of templeCourtBounds){
  pavement(k,[left,...us.filter(x=>x>left&&x<right),right],[top,...vs.filter(z=>z>top&&z<bottom),bottom],sand,"dirt",.017);
 }
 for(const pond of templePonds)drawPond(k,pond,rng);
 for(const path of templePaths)ribbon(k,path);
 for(const b of templeHalls){
  if(templeGallery(b.id))gallery(k,cloisters[b.id]);
  else hall(k,b);
 }
 stoneBridges(k);busShelter(k,templeSites[0],-.42,"불국사");
 const trees=makeTreeBuilder(T,null,{snapshotPart(mesh){mesh.position.y+=templeHeight(mesh.position);k.treePart(mesh);},registerCrownLod:registerDistrictLod,rand:rng,
  clearance:{meshFits:()=>true,trim:()=>true}});
 for(let i=0;i<470;i++){
  const p=templePoint([-140+rng()*260,-117+rng()*539]);
  if(p.z<templeOrigin.z+60&&p.z>templeOrigin.z-107&&Math.abs(p.x-templeOrigin.x+18)<104)continue;
  if(templeWalkable(p)||templeSolid(p)||templePaths.some(r=>r.points.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<5)))continue;
  if(templePonds.some(r=>Math.hypot(r[0].x-p.x,r[0].z-p.z)<42))continue;
  trees.grow(p.x,p.z,{height:5+rng()*6,palette:i%5===0?"maple":i%3===0?"pine":"deep",style:i%3===0?"cone":"branchy"});
 }
 k.finish();
 const statues=templePagodas.map((p,i)=>{
  const fallback=new T.Group(),meshKit=districtMeshes(fallback);pagodaFallback(meshKit,p,i===0);meshKit.finish();root.add(fallback);
  return {p,fallback,model:null,near:false,pending:false,tried:false};
 });
 return eye=>{
  for(const entry of statues){
   const {p,fallback}=entry;
   if(!p.file)continue;
   const near=Math.hypot(p.x-eye.x,p.z-eye.z)<(entry.near?150:125);
   if(entry.near!==near){
    entry.near=near;
    if(!near)entry.tried=false;
    if(entry.model){entry.model.visible=near;fallback.visible=!near;kit.refreshShadows?.();}
   }
   if(!near||entry.model||entry.pending||entry.tried||!kit.loadGltf)continue;
   entry.pending=entry.tried=true;
   kit.loadGltf("./art/"+p.file+".glb").then(({scene})=>{
    const bounds=new T.Box3().setFromObject(scene),height=bounds.max.y-bounds.min.y;
    if(!(height>0))return;
    const verticalScale=p.height/height;
    scene.scale.y*=verticalScale;
    scene.position.set(p.x,templeHeight(p)-bounds.min.y*verticalScale,p.z);scene.rotation.y=p.yaw;scene.name=p.name;
    scene.traverse(m=>{if(m.isMesh)m.castShadow=m.receiveShadow=true;});
    root.add(scene);entry.model=scene;scene.visible=entry.near;fallback.visible=!entry.near;kit.refreshShadows?.();
   }).catch(()=>{}).finally(()=>{entry.pending=false;});
  }
 };
}
