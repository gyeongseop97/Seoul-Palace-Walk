import * as T from "three";
import {districtMeshes} from "./gyeongju-mesh.js";
import {RAFT_DECK_HEIGHT,RAFT_DOCK_WIDTH,RAFT_LENGTH,RAFT_SEAT_HEIGHT,RAFT_WIDTH,raftAt,raftHeave,
 raftPierHeight,raftSeatOffsets,raftStops} from "./gyeongju-raft-layout.js";
import {localGyeongju} from "./region-coordinates.js";

const p=(x,y,z)=>({x,y,z});
const bark=[0x816443,0x735435,0x8b6846,0x6d503a,0x957150];
const cedar=[0xaa865c,0xb49368,0x987652,0xaf8a63];
const hemp=0xb99c6f,weathered=0x755a40;

function rope(k,points,r,color=hemp){
 for(let i=1;i<points.length;i++)k.beam(points[i-1],points[i],r,color);
}
export function drawRaftPiers(k){
 for(const stop of raftStops){
  const {land,dockEnd}=stop,dx=dockEnd.x-land.x,dz=dockEnd.z-land.z,length=Math.hypot(dx,dz);
  const yaw=Math.atan2(dx,dz),nx=dz/length,nz=-dx/length,half=RAFT_DOCK_WIDTH/2;
  const at=(u,v)=>({x:land.x+u*nx+dx*v/length,z:land.z+u*nz+dz*v/length});
  const deck=v=>raftPierHeight(at(0,Math.max(.01,Math.min(length-.01,v))));
  const pt=(u,h,v)=>{const q=at(u,v);return p(q.x,h,q.z);};
  const n=Math.ceil(length/.24),depth=length/n;
  for(let i=0;i<n;i++){
   const v=(i+.5)*depth,q=at(0,v),pitch=-Math.atan2(deck(v+depth/2)-deck(v-depth/2),depth);
   k.piece(q.x,deck(v)-.048,q.z,RAFT_DOCK_WIDTH,.098,depth-.012,cedar[(i*7)%cedar.length],yaw,pitch);
  }
  for(const u of [-half*.72,half*.72]){
   for(const v of [length*.30,length*.66,length-.22]){
    const q=at(u,v);k.column(q.x,-.02,q.z,.17,.61,.17,weathered);
   }
   k.beam(pt(u,deck(2.5)-.16,2.5),pt(u,deck(length)-.16,length),.096,weathered);
  }
  // One rope handrail guides the approach. The other side and the tip stay open for boarding.
  const positions=[.45,length*.42,length-.6],side=half+.07;
  for(const v of positions){
   const q=at(side,v),h=deck(v);
   k.column(q.x,h+.26,q.z,.13,.98,.13,weathered);
   k.column(q.x,h+.67,q.z,.15,.055,.15,hemp);
  }
  for(let i=1;i<positions.length;i++){
   const a=positions[i-1],b=positions[i],m=(a+b)/2;
   rope(k,[pt(side,deck(a)+.66,a),pt(side,deck(m)+.51,m),pt(side,deck(b)+.66,b)],.024);
  }
  const bollard=at(-half-.035,length-.48);
  k.column(bollard.x,.32,bollard.z,.19,.65,.19,weathered);
  for(let j=0;j<3;j++)k.column(bollard.x,.50+j*.042,bollard.z,.22,.035,.22,hemp);
 }
}

function buildLogRaft(parent){
 const hull=new T.Group(),parts=new T.Group();hull.name="남천 나룻뗏목";hull.add(parts);parent.add(hull);
 const k=districtMeshes(parts),count=9,spacing=RAFT_WIDTH/count,half=RAFT_LENGTH/2;
 // Exposed, uneven pine ends frame a narrow flush deck of sawn planks.
 for(let i=0;i<count;i++){
  const x=(i-(count-1)/2)*spacing,r=spacing*(.53+(i%3)*.012);
  const h=RAFT_DECK_HEIGHT-.10-r,front=half-((i*3)%5)*.036,back=-half+(i%4)*.035;
  k.beam(p(x,h,back),p(x,h,front),r,bark[i%bark.length]);
  for(const [z,direction] of [[back,-1],[front,1]]){
   for(const [order,radius,color] of [[1,.9,0xc19766],[2,.62,0xae8052],[3,.43,0xc99e70],[4,.15,0x93683e]]){
    const edge=z+direction*order*.0022;
    k.beam(p(x,h,edge),p(x,h,edge+direction*.0021),r*radius,color);
   }
  }
 }
 for(const z of [-1.62,1.62]){
  k.beam(p(-1.13,.251,z),p(1.13,.251,z),.061,weathered);
  // Separate lashings cinch each pair of float logs to the crossbar.
  for(let i=0;i<count;i+=2){
   const x=(i-(count-1)/2)*spacing;
   for(const offset of [-.025,.025])rope(k,[p(x-.085,.19,z-.115+offset),p(x-.056,.309,z-.052+offset),
    p(x+.06,.309,z+.047+offset),p(x+.085,.18,z+.105+offset)],.019);
  }
 }
 for(const z of [-1.14,0,1.14])k.beam(p(-1.08,.249,z),p(1.08,.249,z),.044,weathered);
 const plankCount=9,deckLength=2.83,each=deckLength/plankCount;
 for(let i=0;i<plankCount;i++){
  const z=-deckLength/2+(i+.5)*each;
  k.piece(0,RAFT_DECK_HEIGHT-.034,z,RAFT_WIDTH-.20,.068,each-.012,cedar[(i*7)%cedar.length]);
 }
 for(const {side:x,forward:z,headingOffset} of raftSeatOffsets){
  const h=RAFT_SEAT_HEIGHT,yaw=-headingOffset*Math.PI/180;
  for(const offset of [-.21,.21])k.piece(x+offset,(RAFT_DECK_HEIGHT+h-.064)/2,z,.088,h-.064-RAFT_DECK_HEIGHT,.29,weathered,yaw);
  k.piece(x,h-.045,z,.61,.08,.37,0x88704c,yaw);
  k.piece(x,h-.012,z,.56,.024,.32,0xbda46b,yaw);
  for(const strip of [-.19,.19])k.piece(x+strip,h+.0006,z,.022,.003,.32,0x8e754f,yaw);
 }
 // A wooden sweep rests in its fork at the stern, outside the passage between the seats.
 k.beam(p(.92,.31,-1.16),p(.92,.68,-1.16),.037,weathered);
 for(const u of [-1,1])k.beam(p(.92,.63,-1.16),p(.92+u*.085,.75,-1.16),.025,weathered);
 const grip=p(.59,.93,-.25),tip=p(1.31,.37,-2.18);
 k.beam(grip,tip,.032,0xa87f50);
 const blade=p(1.39,.31,-2.4);
 k.beam(tip,blade,.059,0x9a744b);
 k.piece(blade.x,blade.y,blade.z,.145,.05,.45,0xa17a4e,-.36,-.30);
 k.finish();
 return hull;
}

export function createRaftScene(town){
 let hull;
 return function update(time,eye){
  const berth=raftStops[0].berth;
  if(Math.hypot(eye.x-berth.x,eye.z-berth.z)>420){if(hull)hull.visible=false;return;}
  hull??=buildLogRaft(town);
  const pose=raftAt(time),local=localGyeongju(pose);
  hull.visible=true;hull.position.set(local.x,raftHeave(time),local.z);
  hull.rotation.y=(180-pose.heading)*Math.PI/180;
 };
}
