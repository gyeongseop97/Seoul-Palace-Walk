import * as T from "three";
import {studioWall,studioDoor,studioStairs,studioLanding,studioConsole,studioLadder,studioFloor,studioInRoom} from "./coast-studio-layout.js";
import {seaPoint} from "./region-coordinates.js";

function paintedSky(){
 const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
 const c=canvas.getContext("2d"),sky=c.createLinearGradient(0,0,0,256);
 sky.addColorStop(0,"#6391cc");sky.addColorStop(.62,"#89b6df");sky.addColorStop(1,"#c3d7e4");
 c.fillStyle=sky;c.fillRect(0,0,1024,256);
 let seed=314159;
 const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 for(const [x,y,width,depth] of [[70,91,152,16],[227,163,142,12],[424,47,120,20],[628,126,181,18],[879,74,157,22],[981,169,120,11],[573,211,162,9],[810,197,138,13]]){
  for(let i=0;i<48;i++){
   const t=random()*2-1,scale=.35+.65*(1-t*t),height=depth*scale;
   c.save();c.translate(x+t*width*.68,y-(random()-.30)*height);
   c.scale(9+random()*width*.19,2+random()*height*.67);
   const cloud=c.createRadialGradient(0,0,0,0,0,1);cloud.addColorStop(0,"rgba(250,242,237,.43)");cloud.addColorStop(.50,"rgba(248,243,242,.30)");cloud.addColorStop(1,"rgba(245,240,239,0)");
   c.fillStyle=cloud;c.fillRect(-1,-1,2,2);c.restore();
  }
 }
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 return new T.MeshBasicMaterial({map,side:T.DoubleSide,vertexColors:true});
}

// Rectangles on the wall, stair fascia and closed door sample the same mural
// in set coordinates. Moving the door carries its patch of sky with it.
function muralPanels(root,paint,rectangles,hingeZ=0,hingeY=0){
 const positions=[],uv=[],indices=[],colors=[];
 for(const [x,z1,z2,y1,y2,baseShade=1,topShade=1] of rectangles){
  const first=positions.length/3;
  for(const [z,y] of [[z1,y1],[z2,y1],[z2,y2],[z1,y2]]){
   positions.push(x,y-hingeY,z-hingeZ);
   const shade=y===y1?baseShade:topShade;
   colors.push(shade,shade,shade);
   uv.push((z+studioWall.half)/(2*studioWall.half),(y+1)/(studioWall.height+1));
  }
  indices.push(first,first+1,first+2,first,first+2,first+3);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
 geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 root.add(new T.Mesh(geometry,paint));
}

function addExitMark(door,offset){
 const canvas=document.createElement("canvas");canvas.width=canvas.height=128;
 const ctx=canvas.getContext("2d");
 ctx.fillStyle="#94aec3";ctx.beginPath();ctx.arc(64,64,57,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#718ca4";ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle="#405971";ctx.font="bold 32px sans-serif";ctx.textAlign="center";
 ctx.fillText("EXIT",64,75);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const mark=new T.Mesh(new T.PlaneGeometry(.17,.17),new T.MeshStandardMaterial({map,alphaTest:.45,roughness:.76}));
 mark.rotation.y=-Math.PI/2;mark.position.set(-.032,1.04,offset);door.add(mark);
}

function makeSet(parent){
 const group=new T.Group();group.position.set(studioWall.x,0,studioWall.z);parent.add(group);
 const box=new T.BoxGeometry(),cylinder=new T.CylinderGeometry(1,1,1,10),palette=new Map();
 const color=n=>{if(!palette.has(n))palette.set(n,new T.MeshStandardMaterial({color:n,roughness:.70}));return palette.get(n);};
 function part(geometry,tint,x,y,z,w,h,d,root=group){
  const mesh=new T.Mesh(geometry,typeof tint==="number"?color(tint):tint);
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);root.add(mesh);return mesh;
 }
 const slab=(...args)=>part(box,...args);
 const post=(tint,x,y,z,r,h)=>part(cylinder,tint,x,y,z,r,h,r);
 const up=new T.Vector3(0,1,0);
 function rod(a,b,r,tint){
  const end=new T.Vector3(...b),start=new T.Vector3(...a),delta=end.clone().sub(start),m=post(tint,...start.lerp(end,.5).toArray(),r,delta.length());
  m.quaternion.setFromUnitVectors(up,delta.normalize());return m;
 }
 const paint=paintedSky(),wallH=studioWall.height,span=studioWall.half,doorZ=studioDoor.z-studioWall.z;
 const floor=studioDoor.h,doorH=2.22,left=doorZ-.50,right=doorZ+.50;
 const mural=[[0,-span,left,-1,wallH],[0,right,span,-1,wallH],
  [0,left,right,-1,floor],[0,left,right,floor+doorH,wallH]];
 slab(0x777e7b,-5.5,1.61,2,11,.48,14);
 for(let z=-4;z<=8;z+=3)for(const x of [-10.58,-.63]){
  post(0x635d4c,x,-.30,z,.17,3.80);slab(0x4e5552,x,1.51,z,.28,.37,.42);
 }
 for(let x=-10.4;x<-.1;x+=1.15)slab(0x666e69,x,1.854,2,.018,.007,13.98);
 const ladderZ=studioLadder.z-studioWall.z;
 for(const dz of [-.31,.31]){
  rod([-11.12,-1.35,ladderZ+dz],[-11.12,2.34,ladderZ+dz],.041,0xb3bbb4);
  rod([-11.12,2.34,ladderZ+dz],[-10.76,2.34,ladderZ+dz],.041,0xb3bbb4);
  rod([-10.76,2.34,ladderZ+dz],[-10.76,1.85,ladderZ+dz],.041,0xb3bbb4);
 }
 for(let i=0;i<10;i++)rod([-11.12,-1.15+i*.31,ladderZ-.31],[-11.12,-1.15+i*.31,ladderZ+.31],.032,0xafb7b2);
 const {start,treads,run,rise,base}=studioStairs;
 const outer=studioLanding.minX-studioWall.x,inner=studioLanding.maxX-studioWall.x;
 const positions=[],indices=[];
 for(let i=1;i<=treads;i++){
  // The first tread is level with the existing quay.
  const z=start+i*run-studioWall.z,y=base+i*rise;
  const end=i===treads?studioLanding.maxZ-studioWall.z:z+run;
  const index=positions.length/3;
  positions.push(outer,y,z, outer,y,end, inner,y,end, inner,y,z,
   outer,y-rise,z, outer,y,z, inner,y,z, inner,y-rise,z);
  for(const first of [index,index+4])indices.push(first,first+1,first+2,first,first+2,first+3);
  mural.push([outer,z,end,-1,y,1,.72]);
  // Baked contact shadows keep the outline visible even from below at sea level.
  // Stop at the head of the flight, leaving the opening clear.
  if(i<treads){
   const shadowEnd=i===treads-1?end:end-.28;
   mural.push([-.016,z-.28,shadowEnd,y-.9,y+.16,.43,.61]);
  }
 }
 const stairs=new T.BufferGeometry();
 stairs.setAttribute("position",new T.Float32BufferAttribute(positions,3));
 stairs.setIndex(indices);stairs.computeVertexNormals();
 const flight=new T.Mesh(stairs,color(0x89b3ce));flight.receiveShadow=true;group.add(flight);
 const end=studioLanding.maxZ-studioWall.z;
 // Wrap the mural around the end of the landing down to the waterline.
 const cap=new T.PlaneGeometry(inner-outer,floor+1);
 const capColor=[],capUV=cap.getAttribute("uv");
 for(let i=0;i<capUV.count;i++){
  const top=capUV.getY(i),shade=top ? .57 : 1;
  capColor.push(shade,shade,shade);
  capUV.setXY(i,(end+span)/(2*span),top*(floor+1)/(wallH+1));
 }
 cap.setAttribute("color",new T.Float32BufferAttribute(capColor,3));
 const capMesh=new T.Mesh(cap,paint);capMesh.position.set((outer+inner)/2,(floor-1)/2,end);group.add(capMesh);
 muralPanels(group,paint,mural);

 const door=new T.Group();door.position.set(0,floor,right);group.add(door);
 const width=right-left-.022;
 slab(0x455563,.018,doorH/2,-(right-left)/2,.058,doorH-.022,width,door);
 muralPanels(door,paint,[[-.013,left+.011,right-.011,floor+.011,floor+doorH-.011]],right,floor);
 addExitMark(door,-width+.15);
 // A one-sided dark reveal gives the exterior its black silhouette. The view
 // out to sea stays open from the working control room behind it.
 const reveal=new T.Mesh(new T.PlaneGeometry(right-left+.04,doorH+.04),new T.MeshBasicMaterial({color:0x080c10}));
 reveal.rotation.y=-Math.PI/2;reveal.position.set(.26,floor+doorH/2,doorZ);group.add(reveal);
 // The opposite side is a windowless television control room, built in the same coordinates.
 const roomZ=studioConsole.z-studioWall.z,roomWall=0x485952;
 slab(0x555b53,4.61,floor-.12,roomZ,8.78,.24,8);
 slab(0x777b70,.135,floor-.08,doorZ,.27,.16,1.39);
 slab(roomWall,9,floor+1.44,roomZ,.20,2.88,8);
 for(const z of [roomZ-4,roomZ+4])slab(roomWall,4.61,floor+1.44,z,8.78,2.88,.20);
 for(const z of [roomZ-2.40,roomZ+2.40])slab(0x40514c,.23,floor+1.44,z,.16,2.88,3);
 slab(0x40514c,.23,floor+2.59,roomZ,.16,.58,2.15);
 slab(0x606b61,4.61,floor+2.91,roomZ,8.78,.14,8);
 const lamp=new T.MeshBasicMaterial({color:0xf5ebc5});
 for(const x of [2.1,6.15])slab(lamp,x,floor+2.79,roomZ,.39,.06,1.68);
 const cz=studioConsole.z-studioWall.z;
 slab(0x313f3d,7.80,floor+.48,cz,1.58,.96,3.05);
 slab(0x66756a,7.70,floor+1.01,cz,1.66,.10,3.12);
 for(let row=0;row<2;row++)for(let col=-1;col<=1;col++){
  const z=cz+col*.90,y=floor+1.40+row*.61;
  slab(0x293834,7.98,y,z,.42,.58,.85);
  slab(new T.MeshBasicMaterial({color:[0x71978b,0x6a9092,0x769385][(col+row+1)%3]}),7.756,y,z,.018,.415,.66);
  for(let line=0;line<5;line++)slab(0x667f73,7.742,y+.127-line*.057,z+.025*(line%2),.008,.009,.57-line*.047);
 }
 for(const col of [-1,0,1])for(let n=0;n<4;n++)slab(n===0?0xcc9263:0x9aab96,7.11,floor+1.096,cz+col*.82+n*.105,.11,.026,.07);
 return {group,paint,door};
}

export function buildCoastStudio(root){
 let set=null,open=0;
 return (p,players,night)=>{
  const near=Math.hypot(p.x-studioWall.x,p.z-studioWall.z)<170;
  if(!near){if(set)set.group.visible=false;return;}
  set??=makeSet(root);set.group.visible=true;
  set.paint.color.setRGB(1-night*.88,1-night*.84,1-night*.72);
  const approach=players.some(player=>{
   const q=seaPoint(player);
   return (studioInRoom(q)||studioFloor(q)===studioDoor.h)&&Math.hypot(q.x-studioDoor.x,q.z-studioDoor.z)<1.58;
  });
  open+=(Number(approach)-open)*.18;set.door.rotation.y=-open*1.54;
 };
}
