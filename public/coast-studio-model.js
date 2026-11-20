import * as T from "three";
import {studioWall,studioDoor,studioStairs,studioConsole,studioLadder,studioFloor,studioInRoom} from "./coast-studio-layout.js";
import {seaPoint} from "./region-coordinates.js";

function paintedSky(){
 const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=256;
 const c=canvas.getContext("2d"),sky=c.createLinearGradient(0,0,0,256);
 sky.addColorStop(0,"#67a5d2");sky.addColorStop(.62,"#9dc9e2");sky.addColorStop(1,"#c8dde6");
 c.fillStyle=sky;c.fillRect(0,0,1024,256);
 for(const [x,y,width] of [[80,89,100],[248,152,113],[452,55,95],[630,112,132],[842,71,114],[989,148,90]]){
  for(let i=0;i<8;i++){
   const dx=(i-3.5)*width*.16,scale=1-Math.abs(i-3.5)*.12;
   c.save();c.translate(x+dx,y+Math.sin(i*2.7)*6);c.scale(width*.31*scale,21*scale);
   const cloud=c.createRadialGradient(0,0,0,0,0,1);cloud.addColorStop(0,"rgba(248,249,238,.76)");cloud.addColorStop(.59,"rgba(245,247,238,.38)");cloud.addColorStop(1,"rgba(250,248,235,0)");
   c.fillStyle=cloud;c.fillRect(-1,-1,2,2);c.restore();
  }
 }
 // Faint seams reveal the painted flats when they are seen at arm's length.
 for(let x=0;x<1024;x+=91){c.fillStyle="rgba(77,113,128,.13)";c.fillRect(x,0,1,256);}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 return new T.MeshBasicMaterial({map,side:T.DoubleSide});
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
 function panel(z1,z2,y1,y2){
  const data=new T.BufferGeometry();
  data.setAttribute("position",new T.Float32BufferAttribute([0,y1,z1,0,y1,z2,0,y2,z2,0,y2,z1],3));
  data.setAttribute("uv",new T.Float32BufferAttribute([(z1+span)/(2*span),(y1+1)/(wallH+1),(z2+span)/(2*span),(y1+1)/(wallH+1),
   (z2+span)/(2*span),(y2+1)/(wallH+1),(z1+span)/(2*span),(y2+1)/(wallH+1)],2));
  data.setIndex([0,1,2,0,2,3]);data.computeVertexNormals();group.add(new T.Mesh(data,paint));
 }
 panel(-span,doorZ-.73,-1,wallH);panel(doorZ+.73,span,-1,wallH);
 panel(doorZ-.73,doorZ+.73,-1,studioDoor.h);panel(doorZ-.73,doorZ+.73,studioDoor.h+2.23,wallH);
 // A working quay, a narrow flight of white set stairs, and a dark exit in the sky.
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
 const stairX=studioStairs.x-studioWall.x,baseZ=studioStairs.start-studioWall.z;
 for(let i=0;i<studioStairs.treads;i++){
  const y=1.85+i*.18,z=baseZ-(i+.5)*.45;
  slab(0xe5e7dd,stairX,y-.10,z,studioStairs.width,.20,.46);
  slab(0xb7c1bc,stairX,y-.016,z+.204,studioStairs.width,.034,.036);
 }
 for(const side of [-1,1]){
  const x=stairX+side*.84;
  rod([x,1.58,baseZ+.04],[x,7.06,baseZ-13.58],.064,0x8f9f9e);
  rod([x,2.72,baseZ+.05],[x,8.12,baseZ-13.51],.043,0xdce4dd);
  for(let i=0;i<=30;i+=5)rod([x,1.73+i*.18,baseZ-i*.45],[x,2.73+i*.18,baseZ-i*.45],.027,0xbdcbc6);
 }
 slab(0xd4dbd3,-1.64,7.13,-17.95,3.28,.24,2.90);
 rod([-3.2,8.10,-16.50],[-3.2,8.10,-19.38],.041,0xcfdad6);
 for(const z of [-16.6,-19.3])rod([-3.2,7.19,z],[-3.2,8.11,z],.038,0xc6cfc8);
 const door=new T.Group();door.position.set(.02,studioDoor.h,doorZ-.69);group.add(door);
 slab(0x233944,0,1.075,.69,.085,2.15,1.38,door);
 for(const z of [doorZ-.74,doorZ+.74])slab(0x344a51,-.016,studioDoor.h+1.1,z,.14,2.23,.085);
 slab(0x344a51,-.016,studioDoor.h+2.19,doorZ,.14,.10,1.55);
 slab(0xb8b39c,-.071,.94,1.16,.10,.042,.21,door);
 // The opposite side is a windowless television control room, built in the same coordinates.
 const roomZ=-17.6,floor=studioDoor.h,roomWall=0x485952;
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
  open+=(Number(approach)-open)*.18;set.door.rotation.y=open*1.36;
 };
}
