import * as T from "three";
import {makeTreeBuilder,treePalettes} from "./lowpoly-trees.js";
import {geo,shore,promenade,route,station,train,beachStop,boardRack,pier,pavilion,tables,seatSpot,dock,mooring,segmentDistance} from "./pohang-layout.js";
const boxGeo=new T.BoxGeometry(),ovalGeo=new T.SphereGeometry(1,14,9),tubeGeo=new T.CylinderGeometry(1,1,1,12),coneGeo=new T.ConeGeometry(1,1,12),mats=new Map();
function mat(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.76}));return mats.get(color);}
export function part(parent,g,color,x,y,z,w,h,d){
 const mesh=new T.Mesh(g,typeof color==="object"?color:mat(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
}
const box=(...a)=>part(a[0],boxGeo,...a.slice(1)),oval=(...a)=>part(a[0],ovalGeo,...a.slice(1)),post=(...a)=>part(a[0],tubeGeo,...a.slice(1));
function rod(parent,a,b,r,color){
 const va=new T.Vector3(...a),vb=new T.Vector3(...b),m=post(parent,color,...va.clone().lerp(vb,.5).toArray(),r,va.distanceTo(vb),r);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return m;
}
function sign(parent,text,x,y,z,w,h,background="#184748",angle=0){
 const c=document.createElement("canvas");c.width=768;c.height=144;const ctx=c.getContext("2d");
 ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="#fff5d9";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 83px sans-serif";ctx.fillText(text,384,76,734);
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
 const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tx}));m.position.set(x,y,z);m.rotation.y=angle;parent.add(m);
 const rear=m.clone();rear.rotation.y+=Math.PI;rear.translateZ(.013);parent.add(rear);return m;
}
function ribbon(parent,a,b,color){
 const v=[],ix=[];for(let i=0;i<a.length;i++){v.push(...a[i],...b[i]);if(i){const n=2*i;ix.push(n-2,n-1,n,n-1,n+1,n);}}
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.9}));parent.add(m);return m;
}
function street(parent,a,b,w,h,y,color){
 const len=Math.hypot(a.x-b.x,a.z-b.z),m=box(parent,color,(a.x+b.x)/2,y,(a.z+b.z)/2,w,h,len+.06);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);return m;
}
function consolidate(root){
 root.updateMatrixWorld(true);const groups=new Map(),items=[];
 root.traverse(o=>{if(!o.isMesh||o.material.map||o.geometry.type==="BufferGeometry")return;
 const k=o.geometry.uuid+o.material.uuid;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o);});
 for(const meshes of groups.values()){
  if(meshes.length<3)continue;
  const batch=new T.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);
  meshes.forEach((o,i)=>{batch.setMatrixAt(i,o.matrixWorld);items.push(o);});root.add(batch);
 }
 for(const m of items)m.removeFromParent();
}
function facades(root){
 const chunks=new Map();
 for(const block of geo.blocks){const ring=block[1];
  const cx=ring.reduce((v,p)=>v+p[0],0)/ring.length,cz=ring.reduce((v,p)=>v+p[1],0)/ring.length;
  if(Math.hypot(cx-pavilion.x,cz-pavilion.z)<32||cx>shore(cz)-.5)continue;
  const key=Math.floor(ring[0][0]/250)+","+Math.floor(ring[0][1]/250);
  if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(block);}
 const surface=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide});
 for(const blocks of chunks.values()){
 const pos=[],colors=[];const palette=[0xd8c6aa,0xecdfd1,0xabb9bc,0xae9e91,0xbbb9a9].map(n=>new T.Color(n)),glass=new T.Color(0x526f79);
 function quad(a,b,c,d,col){for(const p of [a,b,c,a,c,d]){pos.push(...p);colors.push(col.r,col.g,col.b);}}
 for(let j=0;j<blocks.length;j++){
  const [h,ring]=blocks[j];if(ring.length<3)continue;const col=palette[j%5],top=1.85+h;
  const vs=ring.map(([x,z])=>new T.Vector2(x,z));
  for(const [a,b,c] of T.ShapeUtils.triangulateShape(vs,[]))quad([vs[a].x,top,vs[a].y],[vs[b].x,top,vs[b].y],[vs[c].x,top,vs[c].y],[vs[c].x,top,vs[c].y],col);
  for(let i=0;i<ring.length;i++){const [x,z]=ring[i],[u,v]=ring[(i+1)%ring.length];quad([x,1.84,z],[u,1.84,v],[u,top,v],[x,top,z],col);
   const len=Math.hypot(u-x,v-z);if(len<3)continue;const n=Math.min(18,Math.max(1,Math.floor(len/3.7)));
   for(let y=3.3;y+1.45<top;y+=3.35)for(let k=0;k<n;k++){
    const a=(k+.14)/n,b=(k+.84)/n,dx=(v-z)/len*.035,dz=(x-u)/len*.035;
    // Both sides of arbitrarily wound OSM outlines share the same window band.
    for(const side of [1,-1]){const X=x+dx*side,Z=z+dz*side;quad([X+(u-x)*a,y,Z+(v-z)*a],[X+(u-x)*b,y,Z+(v-z)*b],[X+(u-x)*b,y+1.45,Z+(v-z)*b],[X+(u-x)*a,y+1.45,Z+(v-z)*a],glass);}
   }
  }
 }
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(pos,3));g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
 root.add(new T.Mesh(g,surface));
 }
}
export function buildCoast(scene){
 const root=new T.Group();scene.add(root);const zList=[...new Set([...Array.from({length:171},(_,i)=>-3700+i*32),...geo.beach.map(p=>p[1]),...geo.pier.map(p=>p[1])])].sort((a,b)=>a-b);
 const row=(x,y)=>zList.map(z=>[x(z),y,z]);
 ribbon(root,row(()=>-6100,1.85),row(z=>promenade(z)+4,1.85),0x9da88a);
 const sand=ribbon(root,row(z=>promenade(z)+4,1.85),row(z=>shore(z),-.18),0xc4ab83);
 sand.material.onBeforeCompile=shader=>{
  shader.vertexShader="varying vec3 beachPos;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nbeachPos=position;");
  shader.fragmentShader="varying vec3 beachPos;\n"+shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
   float wet=1.-smoothstep(-.10,.52,beachPos.y+.052*sin(beachPos.z*.14)+.037*sin(beachPos.z*.51));
   float grain=fract(sin(dot(floor(beachPos.xz*28.),vec2(32.61,13.27)))*24817.3);
   float ripples=sin(beachPos.x*3.9+beachPos.z*.93+sin(beachPos.z*.79))*sin(beachPos.x*2.1+beachPos.z*.55);
   float detail=1.-smoothstep(2.,26.,length(cameraPosition.xz-beachPos.xz));
   diffuseColor.rgb*=mix(vec3(1.03,.98,.90),vec3(.52,.56,.51),wet)*(.98+detail*((grain-.5)*.13+.035*ripples));`);
 };
 ribbon(root,row(z=>shore(z),-.18),row(z=>shore(z)+25,-3.5),0xbaac89);
 const beachZ=zList.filter(z=>z>=-1000&&z<=390),strip=(offset,h)=>beachZ.map(z=>[promenade(z)+offset,h,z]);
 const walk=ribbon(root,strip(-5,1.89),strip(4,1.89),0xc4b6a4);
 walk.material.onBeforeCompile=shader=>{
  shader.vertexShader="varying vec2 walkPos;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nwalkPos=position.xz;");
  shader.fragmentShader="varying vec2 walkPos;\n"+shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
   vec2 uv=walkPos/vec2(.54,.31);uv.x+=.5*mod(floor(uv.y),2.);vec2 joint=min(fract(uv),1.-fract(uv))/max(fwidth(uv),.003);
   float detail=1.-smoothstep(6.,26.,length(cameraPosition.xz-walkPos));diffuseColor.rgb*=.98+.02*sin(floor(uv.x)*11.+floor(uv.y)*7.)-.23*(1.-smoothstep(0.,1.,min(joint.x,joint.y)))*detail;`);
 };ribbon(root,strip(-2.1,1.90),strip(-.7,1.90),0xbd806b);
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i];street(root,a,b,13,.09,1.90,0x555d60);
  const l=Math.hypot(a.x-b.x,a.z-b.z),n=Math.max(1,Math.floor(l/16));
  for(let k=0;k<n;k++){const u=(k+.18)/n,v=(k+.55)/n;street(root,{x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u},{x:a.x+(b.x-a.x)*v,z:a.z+(b.z-a.z)*v},.15,.018,1.96,0xe7c17d);}
 }
 // The beachfront carriageway continues past the bus terminus to the pavilion.
 for(const way of geo.coastRoads)for(let i=1;i<way.length;i++){
  const a={x:way[i-1][0],z:way[i-1][1]},b={x:way[i][0],z:way[i][1]},mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
  if(mid.z< -1090||mid.z>400||route.some((v,j)=>j&&segmentDistance(mid,route[j-1],v)<4.9))continue;
  street(root,a,b,12,.06,1.90,0x525b60);street(root,a,b,.22,.012,1.945,0xe0bf77);
 }
 facades(root);
 let seed=9423;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const green=new T.Group();green.position.y=1.85;root.add(green);
 const trees=makeTreeBuilder(T,green,{rand:random,clearance:{meshFits:()=>true,trim:()=>true}});
 for(let z=-880;z<280;z+=16){
  const x=promenade(z)-3.5,y=1.86;
  trees.grow(x,z,{height:4.8+random()*1.8,spread:3.9+random()*1.5,palette:treePalettes.pine,style:random()<.6?"cloud":"branchy"});
  if(z%3===0){post(root,0x465a59,x+2,y+2,z, .07,4,.07);oval(root,0xffdda1,x+2,y+4,z,.24,.28,.24);}
 }
 function shelter(p,name){
  const x=p.x,z=p.z;box(root,0x25696c,x,4.7,z,5.8,.19,2.2);for(const dx of [-2.6,2.6])post(root,0x486267,x+dx,3.25,z-.7,.09,2.8,.09);
  box(root,0x8eafae,x,3.23,z-.8,5.1,2,.12);box(root,0xab764b,x,2.4,z,3.4,.15,.55);sign(root,name,x,4.4,z+.3,4.7,.66);
 }
 shelter({x:arrivalSide().x,z:arrivalSide().z-4},"포항역  ·  영일대행");shelter({x:beachStop.x+7,z:beachStop.z},"영일대해수욕장");
 function arrivalSide(){return {x:station.x-6,z:station.z+3};}
 const sr=geo.station,center=sr.reduce((a,[x,z])=>({x:a.x+x/sr.length,z:a.z+z/sr.length}),{x:0,z:0});
 const st=new T.Group();st.position.set(center.x,1.85,center.z);st.rotation.y=-1.99;root.add(st);
 box(st,0xdae0dc,0,5,0,91,10,38);box(st,0x47707e,0,5.8,-19.15,84,6,.25);
 for(let x=-42;x<=42;x+=4)box(st,0xc6d3d3,x,5.8,-19.4,.23,6.5,.3);
 for(let x=-47;x<48;x+=3.6){
  const height=10.4+1.85*Math.cos(x/50*Math.PI/2);
  box(st,0x9eacb1,x,height,0,3.66,.58,45.5);
  if(Math.abs(x%7.2)<.2)rod(st,[x,4.6,-17.9],[x,height-.24,-21],.13,0xc0cccb);
 }
 sign(st,"포항역   POHANG",0,9,-19.8,26,2, "#265162",Math.PI);
 // The forecourt gallery opens toward the bus bays. The stair and glazing remain visible from outside.
 const entrance=new T.Group();entrance.position.set(train.x,1.85,train.z+5);root.add(entrance);
 for(let i=0;i<13;i++)box(entrance,0xa9a9a3,0,(i+1)*.093,i*.32,6.35,(i+1)*.186,.33);
 for(const side of [-1,1]){
  for(let i=0;i<4;i++)post(entrance,0x72848b,side*3.25,2.7,-1+i*2.1,.09,5.4,.09);
  rod(entrance,[side*3.02,1.07,-.2],[side*3.02,3.36,4],.076,0xc29162);
  box(entrance,0x668899,side*3.4,3.05,3.2,.12,5.35,6.1);
 }
 box(entrance,0xb9c7cd,0,5.6,2.7,8.2,.32,9.7);
 sign(entrance,"포항역  ·  KTX 서울행",0,4.95,-1.1,6.25,.74,"#294e76",Math.PI);
 // A timber bridge follows the surveyed diagonal between the seawall and pavilion.
 const a=pier[0],b=pavilion;street(root,a,b,4.8,.4,2.06,0xa28b71);
 const len=Math.hypot(b.x-a.x,b.z-a.z),nx=(b.z-a.z)/len,nz=(a.x-b.x)/len;
 for(const s of [-1,1]){
  rod(root,[a.x+nx*s*2.25,3.15,a.z+nz*s*2.25],[b.x+nx*s*2.25,3.15,b.z+nz*s*2.25],.085,0x815d47);
  for(let k=0;k<=22;k++){const u=k/22;post(root,0xb29b83,a.x+(b.x-a.x)*u+nx*s*2.25,2.61,a.z+(b.z-a.z)*u+nz*s*2.25,.09,1.15,.09);}
 }
 const pg=new T.Group();pg.position.set(b.x,2.25,b.z);pg.rotation.y=.84;root.add(pg);
 box(pg,0xdac7ad,0,-.23,0,17,.47,15);
 for(const x of [-6,-2,2,6])for(const z of [-4.7,4.7]){post(pg,0xad5840,x,2,z,.3,4,.3);box(pg,0x398076,x,3.9,z,1.5,.58,1.1);}
 for(let layer=0;layer<2;layer++){const u=layer? .66:1,y=4+layer*2.8;
  box(pg,0x985444,0,y,0,15*u,.45,12*u);
  const vv=[],idx=[];for(let i=0;i<=18;i++){const x=(i/18-.5)*18*u,lift=Math.pow(Math.abs(i/9-1),5)*.92*u;
   for(const z of [-1,-.5,0,.5,1])vv.push(x,y+.42+Math.pow(1-Math.abs(z),1.45)*2.8*u+lift*Math.abs(z),z*7.4*u);
   if(i)for(let k=0;k<4;k++){const n=i*5+k;idx.push(n-5,n,n+1,n-5,n+1,n-4);}
  }const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(vv,3));g.setIndex(idx);g.computeVertexNormals();pg.add(new T.Mesh(g,new T.MeshStandardMaterial({color:0x374c56,side:T.DoubleSide})));
  box(pg,0x40545b,0,y+3.15*u,0,15*u,.24,.34);
 }
 sign(pg,"迎 日 臺",0,4.27,-5.9,2.3,.76,"#374537",Math.PI);
 street(root,{x:promenade(dock.z),z:dock.z},dock,4.4,.45,1.62,0xa07b57);
 for(let x=promenade(dock.z)+2;x<=dock.x;x+=5)for(const z of [dock.z-1.8,dock.z+1.8])post(root,0x64594b,x,.52,z,.15,2.7,.15);
 sign(root,"영일만 크루즈",promenade(dock.z)+4,3.05,dock.z-2.3,3.1,.49,"#31515b",Math.PI/2);
 for(let i=0;i<5;i++){const s=surfboard(i);s.position.set(boardRack.x+i*.56,3.04,boardRack.z);s.rotation.x=1.36;root.add(s);}
 sign(root,"서핑보드 대여",boardRack.x,3.95,boardRack.z,3.8,.6);
 tables.forEach((t,i)=>{
  const g=new T.Group();root.add(g);g.position.set(t.x,1.87,t.z);
  box(g,0xab8863,0,-.28,0,6.2,.55,6.2);
  for(const x of [-2.3,2.3])for(const z of [-2.7,2.7])post(g,0x6e5b46,x,1.35,z,.048,2.7,.048);
  for(let k=0;k<8;k++){let m=box(g,k%2?0xecad7b:0xaf5341,0,2.77,-2.7+k*.74,5.1,.1,.75);m.rotation.z=.09;}
  for(let k=0;k<6;k++)oval(g,0xffdb92,2.3,2.47,-2.5+k,.09,.13,.09);
  for(const x of [-.48,.48])for(const z of [-.98,.98])box(g,0x694f40,x,.34,z,.095,.68,.095);
  rod(g,[2.3,2.63,-2.7],[2.3,2.63,2.7],.016,0x685746);
  for(let k=0;k<6;k++)post(g,0x54493f,2.3,2.565,-2.5+k,.029,.15,.029);
  box(g,0x965f42,0,.73,0,1.25,.17,2.36);box(g,0x575450,0,.84,0,.65,.06,.62);
  for(let k=0;k<6;k++)box(g,0xb8a38a,-.25+k*.10,.885,0,.025,.025,.56);
  for(let k=0;k<4;k++){const s=seatSpot(i,k);post(root,0xab5443,s.x,2.33,s.z,.33,.095,.33);
   for(const dx of [-.17,.17])for(const dz of [-.17,.17])rod(root,[s.x+dx*1.35,1.88,s.z+dz*1.35],[s.x+dx,2.3,s.z+dz],.046,0x965342);}
  oval(g,0xf3e7d6,0,.86,-.75,.37,.045,.24);for(let k=0;k<5;k++){const f=oval(g,k%2?0xf9d7bd:0xe9a09a,-.23+k*.11,.92,-.74,.095,.035,.16);f.rotation.y=.45;}
  post(g,0x348457,.32,1,.76,.075,.38,.075);post(g,0x276940,.32,1.22,.76,.038,.12,.038);
  if(!i)sign(g,"영일대 바다야장",0,2.45,2.73,4,.52,"#973f32");
 });
 for(let i=0;i<18;i++){
  const z=-520+i*39,x=(shore(z)+promenade(z))/2,base=.84;
  post(root,0x80654d,x,base+1.24,z,.042,2.48,.042);
  const shades=[0xdca674,0x759c95,0xd58475],edge=i%3;
  for(let k=0;k<10;k++){
   const a=k*Math.PI/5,b=(k+1)*Math.PI/5,r=1.74,va=[x,base+2.74,z,x+Math.sin(a)*r,base+2.2,z+Math.cos(a)*r,x+Math.sin(b)*r,base+2.2,z+Math.cos(b)*r];
   const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(va,3));g.computeVertexNormals();
   const m=mat(k%2?shades[edge]:0xe8d8b7);m.side=T.DoubleSide;root.add(new T.Mesh(g,m));
  }
  post(root,0xaf825b,x,base+.65,z,.58,.075,.58);
  for(const side of [-1,1]){box(root,0xb3936b,x+side*.94,base+.4,z,.49,.07,.53);const back=box(root,0xc6ae85,x+side*1.17,base+.68,z,.055,.55,.54);back.rotation.z=side*-.17;}
  post(root,0x87b8b5,x+.19,base+.78,z+.16,.051,.17,.051);
 }
 // Industrial silhouette across the bay, seen behind the moving water.
 for(let i=0;i<33;i++){const x=440+i*28,z=680+Math.sin(i)*29;
  box(root,i%3?0x8d9b9d:0xb1a29a,x,6,z,18+i%7,12+i%9,17);post(root,0x8d8281,x+8,15+i%9,z,1.2,34+i%14,1.2);post(root,0xc99579,x+8,28+i%9,z,1.23,3,1.23);}
 consolidate(root);
 const lamps=[],colors=[];
 const dot=(x,y,z,c)=>{lamps.push(x,y,z);const col=new T.Color(c);colors.push(col.r,col.g,col.b);};
 for(let z=-880;z<280;z+=16)if(z%3===0)dot(promenade(z)-1.5,5.86,z,0xffda96);
 for(const t of tables)for(let k=0;k<6;k++)dot(t.x+2.3,4.34,t.z-2.5+k,0xffce80);
 for(let i=0;i<130;i++)dot(360+i*8.6,3+(i%6===0?17:0),680+Math.sin(i)*25,i%8?0xffd28b:0xd69173);
 const lp=new T.BufferGeometry();lp.setAttribute("position",new T.Float32BufferAttribute(lamps,3));lp.setAttribute("color",new T.Float32BufferAttribute(colors,3));
 const disk=document.createElement("canvas");disk.width=disk.height=32;const ctx=disk.getContext("2d"),fade=ctx.createRadialGradient(16,16,0,16,16,16);
 fade.addColorStop(0,"#fff");fade.addColorStop(.18,"rgba(255,245,224,.8)");fade.addColorStop(1,"rgba(255,238,200,0)");ctx.fillStyle=fade;ctx.fillRect(0,0,32,32);
 const lightMat=new T.PointsMaterial({map:new T.CanvasTexture(disk),size:.52,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
 scene.add(new T.Points(lp,lightMat));return night=>{lightMat.opacity=.08+night*.92;};
}
export function surfboard(index=0){
 const g=new T.Group();oval(g,[0xf3b76d,0x58b8ae,0xe28680][index%3],0,0,0,.37,.088,1.2);
 oval(g,0xf6eee0,0,.048,0,.075,.054,1.12);return g;
}
export function busModel(){
 const g=new T.Group();box(g,0x317b96,0,1.35,0,2.65,2.3,9);
 box(g,0xf2e8cf,0,2.72,0,2.7,.31,9.06);
 for(const s of [-1,1]){for(let k=0;k<7;k++)box(g,0x53808c,s*1.335,1.92,-3.72+k*1.22,.035,.97,1.03);
  for(const z of [-2.85,2.85]){const m=post(g,0x303a3c,s*1.25,.53,z,.48,.32,.48);m.rotation.z=Math.PI/2;}}
 box(g,0x587e88,0,1.88,4.51,2.36,1.02,.04);sign(g,"포항역 ↔ 영일대",0,2.53,4.54,2.11,.3);
 for(const s of [-1,1])box(g,0xffe9ae,.93*s,.78,4.52,.4,.15,.05);return g;
}
export {makeCruise as cruiseModel} from "./pohang-cruise.js";
