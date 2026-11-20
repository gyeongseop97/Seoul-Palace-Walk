import {liftPose} from "./lift-dispatch.js";
import {eastDoor,stationRise,stationApproaches} from "./station-approach-plan.js";
import {stationTerraces} from "./station-terraces.js";
import {groundIndex} from "./ground-index.js";
export {eastDoor,stationRise,stationApproaches};
const onTerrace=groundIndex(stationTerraces,20);
export function segmentFrame(s){
  const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],len=Math.hypot(dx,dy);
  return {len,ux:dx/len,uy:dy/len};
}
for(const s of stationApproaches)Object.assign(s,segmentFrame(s));
// Flat comb plates meet the moving steps at each end of the escalator.
export const escalatorSpeed=1.55;
export function approachHeight(s,t){
  const flat=s.kind==="escalator"?.8:0;
  const f=Math.max(0,Math.min(1,(t-flat)/(s.len-flat*2)));
  return s.h0+(s.h1-s.h0)*f;
}
export function escalatorDirection(at){
  if(at?.s.kind!=="escalator"||Math.abs(at.side)<.15||Math.abs(at.side)>at.s.w/2-.15)return 0;
  return at.side>0?1:-1;
}
// Capsule clearance in a flight's local frame. A saved avatar inside a rail can step out.
function hitsRail(t0,u0,t1,u1,length,rail){
  const a=u0-rail,b=u1-rail,radius=.23;
  if(t0>=.14&&t0<=length-.14&&Math.abs(a)<radius&&a*b>=0&&Math.abs(b)>Math.abs(a))return false;
  let low=0,high=1;
  for(const [v,delta,min,max] of [[t0,t1-t0,.14,length-.14],[a,b-a,-radius,radius]]){
    if(Math.abs(delta)<1e-9){if(v<min||v>max)return false;continue;}
    const m=(min-v)/delta,n=(max-v)/delta;
    low=Math.max(low,Math.min(m,n));high=Math.min(high,Math.max(m,n));
    if(low>high)return false;
  }
  return true;
}
const outdoorRails=stationApproaches.filter(s=>["stairs","escalator","lowerLanding"].includes(s.kind)).map(s=>({
  s,lines:s.kind==="stairs"&&s.w<=10?[-s.w/2+.1,s.w/2-.1]:[-s.w/2+.1,0,s.w/2-.1]
}));
export function outdoorRailBlocks(a,b){
  if(Math.max(a.y,b.y)<1377||Math.min(a.y,b.y)>1544||Math.min(a.x,b.x)>64||Math.max(a.x,b.x)<-205)return false;
  return outdoorRails.some(({s,lines})=>{
    const tx=a.x-s.a[0],ty=a.y-s.a[1],dx=b.x-a.x,dy=b.y-a.y;
    const t=tx*s.ux+ty*s.uy,u=ty*s.ux-tx*s.uy;
    const end=t+dx*s.ux+dy*s.uy,side=u+dy*s.ux-dx*s.uy;
    if(Math.max(t,end)<0||Math.min(t,end)>s.len||Math.min(u,side)>s.w/2+.3||Math.max(u,side)<-s.w/2-.3)return false;
    return lines.some(r=>hitsRail(t,u,end,side,s.len,r));
  });
}
export function approachAt(x,y){
  if(x< -207||x>60||y<1378||y>1542)return null;
  const deck=onTerrace(x,y);
  let nearest=null,best=Infinity;
  for(const s of stationApproaches){
    const dx=x-s.a[0],dy=y-s.a[1],t=dx*s.ux+dy*s.uy,side=dy*s.ux-dx*s.uy;
    if(s.kind!=="deck"){
      if(t>=-.008&&t<=s.len+.008&&Math.abs(side)<=s.w/2+.008)return {s,t,side,height:approachHeight(s,t)};
    }else if(deck){
      const dist=side*side+Math.max(0,-t,t-s.len)**2;
      if(dist<best){nearest={s,t,side,height:stationRise};best=dist;}
    }
  }
  return nearest;
}
function clearTerraceLine(a,b){
  if(outdoorRailBlocks(a,b))return false;
  const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.28));
  for(let i=0;i<=count;i++){
    const t=i/count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
    if(!onTerrace(x,y)&&Math.abs((approachAt(x,y)?.height??0)-stationRise)>.06)return false;
  }
  return true;
}
// Route over the pedestrian bridges only through connected landings at the same elevation.
let deckNetwork;
function approachNetwork(){
  if(deckNetwork)return deckNetwork;
  const nodes=[],feet=[];
  for(const s of stationApproaches){
    const count=Math.ceil(s.len/2);
    const divided=s.kind==="escalator"||s.kind==="lowerLanding"||s.kind==="stairs"&&s.w>10;
    for(const lane of divided?[-s.w/4,s.w/4]:[0])for(let i=0;i<=count;i++){
      const t=i/count,node={s,lane,x:s.a[0]+s.ux*s.len*t-s.uy*lane,y:s.a[1]+s.uy*s.len*t+s.ux*lane,h:approachHeight(s,s.len*t),edges:[]};
      for(const other of nodes){
        if(other.s===s&&(other.lane!==lane||other!==nodes.at(-1)))continue;
        const d=Math.hypot(other.x-node.x,other.y-node.y);
        if(d>(other.s===s?2.6:4.8)||other.s!==s&&Math.abs(other.h-node.h)>.34||outdoorRailBlocks(other,node))continue;
        node.edges.push([other,d]);other.edges.push([node,d]);
      }
      nodes.push(node);
      if(i===0&&s.h0===0&&s.h1!==0)feet.push(node);
    }
  }
  return deckNetwork={nodes,feet};
}
export function approachRoute(from,to,groundPath){
  const start=approachAt(from.x,from.y),end=approachAt(to.x,to.y);
  const raised=(p,flag)=>p&&(p.s.h0!==p.s.h1||p.s.kind==="lowerLanding"||p.s.kind==="deck"&&flag);
  const onDeck=raised(start,from.up),toDeck=raised(end,to.up!==false);
  if(!onDeck&&!toDeck)return null;
  const {nodes,feet}=approachNetwork();
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function closest(p,s){
    const deck=s.kind==="deck";
    const candidates=nodes.filter(n=>deck?n.s.kind==="deck":n.s===s).sort((a,b)=>gap(a,p)-gap(b,p));
    return candidates.find(n=>deck?clearTerraceLine(p,n):!outdoorRailBlocks(p,n));
  }
  if(onDeck&&toDeck){
    if(start.s.kind==="deck"&&end.s.kind==="deck"&&clearTerraceLine(from,to))return [to];
    if(start.s===end.s&&start.s.kind!=="deck"&&!outdoorRailBlocks(from,to))return [to];
  }
  const first=onDeck?closest(from,start.s):null,last=toDeck?closest(to,end.s):null;
  if(onDeck&&!first||toDeck&&!last)return [];
  const seeds=first?[first]:feet,dist=new Map(),previous=new Map(),before=new Map(),queue=new Set();
  for(const n of seeds){
    const path=first?[]:groundPath(from,{x:n.x,y:n.y});
    if(!first&&(!path.length||gap(path.at(-1),n)>.75))continue;
    before.set(n,path);dist.set(n,gap(from,n));queue.add(n);
  }
  while(queue.size){
    let n=null;
    for(const v of queue)if(!n||dist.get(v)<dist.get(n))n=v;
    queue.delete(n);
    for(const [v,cost] of n.edges){
      const d=dist.get(n)+cost;if(d>=(dist.get(v)??Infinity))continue;
      dist.set(v,d);previous.set(v,n);queue.add(v);
    }
  }
  for(const target of (last?[last]:[...feet].sort((a,b)=>dist.get(a)+gap(a,to)-dist.get(b)-gap(b,to)))){
    if(!dist.has(target))continue;
    const after=last?[to]:groundPath({x:target.x,y:target.y},to);
    if(!after.length||gap(after.at(-1),to)>.75)continue;
    const chain=[];let n=target;
    while(previous.has(n)){chain.push(n);n=previous.get(n);}
    chain.push(n);chain.reverse();
    const bends=chain.filter((v,i)=>!i||i===chain.length-1||chain[i-1].s!==chain[i+1].s);
    return [...before.get(n),...bends.map(({x,y})=>({x,y})),...after];
  }
  return [];
}
export const hallOrigin={x:1640,y:690};
export const railPoint=(x,z)=>({x:hallOrigin.x+x,y:hallOrigin.y+z});
export const storeys=[-6.3,0,5.1,9.6];
// The concourse lies east–west above the tracks, as it does in the station. Metres are
// measured from hallOrigin: +x is east toward the main doors, +z is south toward the
// platforms. Shops, tickets, the food hall and the transfer stairs line the north side.
export const hallSpan={x0:-104,x1:24,z0:-18,z1:18};
const stop=(floor,name,dx,dz)=>({floor,name,dx,dz});
export const mainLift={id:"main",center:railPoint(21.75,-39),levels:[0,5.1,9.6],
  stops:[stop(2,"맞이방",0,1),stop(3,"식당가",-1,0),stop(4,"옥상정원",0,-1)]};
export const platformLift={id:"platform",center:railPoint(-4.2,34.5),levels:[-6.3,0],
  stops:[stop(1,"KTX 승강장",0,1),stop(2,"맞이방",0,-1)]};
export const airportLift={id:"airport",center:railPoint(-90,-100),levels:[-14.4,-18.2,-29.6,-33.4],stops:[
  stop(-2,"도심공항터미널",0,1),stop(-3,"일반열차 개찰구",-1,0),stop(-6,"연결층",0,-1),stop(-7,"공항철도 승강장",1,0)]};
export const liftBanks=[mainLift,platformLift,airportLift];
export const floorName=f=>f>0?f+"층":"지하 "+(-f)+"층";
export const liftLanding=(f,bank=mainLift)=>{
  const s=bank.stops.find(stop=>stop.floor===f);
  return {x:bank.center.x+2.35*s.dx,y:bank.center.y+2.35*s.dz};
};
let stationClock=Date.now;
export function setStationClock(read){stationClock=read;}
let stationLifts={};
export function setStationLifts(states){stationLifts=states??{};}
export function liftStopPending(bank,floor,time){
  return stationLifts[bank.id]?.some(s=>s.floor===floor&&s.at>=time);
}
export function liftAt(time=stationClock(),bank=mainLift){return liftPose(bank,stationLifts[bank.id],time);}
// Bounds are in metres from hallOrigin. Adjoining edges are real walking connections. Where
// two slabs share ground the earlier one is used.
const slab=(id,name,x0,x1,z0,z1,h,style="hall")=>({id,name,x0,x1,z0,z1,h,style});
const flight=(name,x0,x1,z0,z1,front,back)=>({...slab("station-hall",name,x0,x1,z0,z1,front,"stairs"),back});
const waitingHall=slab("station-hall","서울역 2층 맞이방",hallSpan.x0,hallSpan.x1,hallSpan.z0,hallSpan.z1,0);
export const roofBeds=[{x:.5,z:-124.5,w:17},{x:-4,z:-102.5,w:8},{x:8.3,z:-102.5,w:2}];
// Seven island platforms run south from the concourse, numbered from the east as in the
// station. The KTX at tracks 3 and 4 can be boarded; its platform is the longest.
export const ktxIsland={x:-7,tracks:"3 · 4",length:97};
export const boardingIslands=[
  {x:10,tracks:"1 · 2"},{x:-24,tracks:"5 · 6"},{x:-41,tracks:"7 · 8"},
  {x:-58,tracks:"9 · 10"},{x:-75,tracks:"11 · 12"},{x:-92,tracks:"13 · 14"}
];
export const platformGate={z0:18,z1:36,length:60};
export const concourseParts=[
  waitingHall,
  // Lift beside the KTX stairs. Its landings come first so they are found before the platform.
  slab("station-hall","승강장 승강기 통로",-5.6,-2.8,18,33,0,"bridge"),
  slab("station-hall","승강장 승강기",-5.7,-2.7,33,36,0,"lift"),
  {...slab("ktx-platform","1층 승강기 앞",-5.6,-2.8,36,38.4,-6.3,"bridge"),flush:true},
  flight(ktxIsland.tracks+"번 KTX 타는 곳 계단",-11.2,-6.2,18,36,0,-6.3),
  slab("ktx-platform","서울역 KTX 승강장",-11.35,-2.65,36,36+ktxIsland.length,-6.3,"platform"),
  ...boardingIslands.flatMap(({x,tracks})=>[
    flight(tracks+"번 타는 곳 계단",x-3.75,x+3.75,platformGate.z0,platformGate.z1,0,-6.3),
    slab("ktx-platform",tracks+"번 승강장",x-4.3,x+4.3,platformGate.z1,platformGate.z1+platformGate.length,-6.3,"island")
  ]),
  // North side: escalators to the food hall and roof, with their lift.
  flight("3층 식당가 계단",9.2,16.8,-36,-18,5.1,0),
  slab("station-foodhall","서울역 3층 식당가",-7,17,-60,-36,5.1,"dining"),
  // The food hall opens onto a gallery that overlooks the concourse, above the ticket office.
  slab("station-hall","3층 맞이방 발코니",-7,9,-36,-18,5.1,"balcony"),
  flight("4층 올라가는 계단",-5,1,-76,-60,9.6,5.1),
  slab("station-hall","4층 다이닝·아울렛",-8,19,-91,-76,9.6,"arcade"),
  slab("station-hall","4층 주차동 보행로",19,24.65,-100,-76,9.6,"parkLink"),
  slab("station-hall","옥상정원 연결 데크",3,19,-100,-93,9.6,"parkLink"),
  slab("station-hall","더 루프 아틀리에 · 옥상정원",-9,10,-127,-100,9.6,"garden"),
  slab("station-hall","2층 승강기 통로",20.35,23.15,-37.5,-18,0,"bridge"),
  slab("station-hall","3층 승강기 통로",17,20.25,-40.4,-37.6,5.1,"bridge"),
  slab("station-hall","4층 승강기 통로",20.35,23.15,-76,-40.5,9.6,"bridge"),
  slab("station-hall","서울역 승강기",20.25,23.25,-40.5,-37.5,0,"lift"),
  // Shopping block reached through the north wall.
  slab("station-hall","쇼핑·마트 연결통로",-30,-16,-30,-18,0,"link"),
  slab("station-hall","서울역 2층 쇼핑·마트 입구",-36,-10,-50,-30,0,"retail"),
  // Stairs down to the subway and the airport railroad.
  slab("station-hall","환승 계단 입구",-74,-66,-26,-18,0,"link"),
  flight("지하철·공항철도 환승 계단",-74,-66,-53,-26,-10.8,0),
  slab("station-hall","지하 환승통로",-81,-58,-65,-53,-10.8,"transfer"),
  slab("station-hall","1·4호선 출입구 연결통로",-58,-39,-65,-54,-10.8,"transfer"),
  slab("station-hall","서울역 지하 보행홀",-56,-39,-54,-19,-10.8,"metro"),
  slab("station-hall","공항철도 연결통로",-96,-81,-62,-56,-10.8,"bridge"),
  slab("station-hall","공항철도 지하 1층",-106,-96,-67,-50,-10.8,"transfer"),
  flight("도심공항터미널 계단",-104,-98,-78,-67,-14.4,-10.8),
  slab("station-hall","지하 2층 도심공항터미널",-118,-94,-94,-78,-14.4,"terminal"),
  flight("일반열차 개찰구 계단",-111,-105,-106,-94,-18.2,-14.4),
  slab("station-hall","지하 3층 일반열차 개찰구",-117,-94,-120,-106,-18.2,"gates"),
  slab("station-hall","공항철도 승강기",-91.5,-88.5,-101.5,-98.5,0,"lift"),
  slab("station-hall","B2 승강기 통로",-91.4,-88.6,-98.5,-86,-14.4,"bridge"),
  slab("station-hall","B2 연결로",-94,-91.4,-89,-86,-14.4,"bridge"),
  slab("station-hall","B3 연결로",-98.5,-95.5,-106,-98.6,-18.2,"bridge"),
  slab("station-hall","B3 승강기 통로",-95.5,-91.5,-101.4,-98.6,-18.2,"bridge"),
  slab("station-hall","B6 승강기 통로",-91.4,-88.6,-127,-101.5,-29.6,"bridge"),
  slab("station-hall","지하 6층 연결층",-98,-82,-137,-127,-29.6,"transfer"),
  slab("station-hall","B7 승강기 통로",-88.5,-81.5,-101.4,-98.6,-33.4,"bridge"),
  slab("station-hall","지하 7층 공항철도 승강장",-81.5,-76.5,-162,-88,-33.4,"arexPlatform")
];
export const westExit={inside:railPoint(-101.4,0),outside:{x:-152.6,y:1511.6,heading:290,up:true}};
export const northBridgeExit={inside:railPoint(-13,-34),outside:{x:-155.8,y:1390.5,heading:270}};
export const rearMarketExit={inside:railPoint(-33,-34),outside:{x:-183.2,y:1322.2,heading:270}};
export const marketExit={inside:railPoint(-23,-46),outside:{x:-62.7,y:1408.4,heading:180,up:true}};
export const subwayExit={inside:railPoint(-78,-58),outside:{x:33.4,y:1408.25,heading:290}};
const metroNumbers=[2,3,4,5,6,7,8,9,"9-1",10,11,12,13,14,15,"경의1"];
export function metroInsidePoint(number){
  if(number==="경의1")return railPoint(-12,-46);
  if(number===15)return railPoint(-101,-60);
  const i=metroNumbers.indexOf(number);
  return railPoint(i<7?-54:-41,-51+(i%7)*4.6);
}
const reach={x0:Math.min(...concourseParts.map(p=>p.x0)),x1:Math.max(...concourseParts.map(p=>p.x1)),
  z0:Math.min(...concourseParts.map(p=>p.z0)),z1:Math.max(...concourseParts.map(p=>p.z1))};
export function partAt(x,y){
  const u=x-hallOrigin.x,z=y-hallOrigin.y;
  if(u<reach.x0-.01||u>reach.x1+.01||z<reach.z0-.01||z>reach.z1+.01)return null;
  for(const p of concourseParts)if(u>=p.x0-1e-6&&u<=p.x1+1e-6&&z>=p.z0-1e-6&&z<=p.z1+1e-6)return p;
  return null;
}
const heightIn=(p,z)=>p.back==null?p.h:p.h+(p.back-p.h)*(z-p.z0)/(p.z1-p.z0);
export const openAir=p=>p.style==="garden"||p.style==="parkLink";
// Stairs to the platforms stand in the open under a canopy; the others are enclosed stairwells.
export const outdoorFlight=p=>p.style==="stairs"&&Math.min(p.h,p.back)===storeys[0];
// The four sides of a slab, split into runs of one kind: a wall where the building ends and
// a railing at a drop to another floor. Sides that adjoin a floor at the same level are open.
export function slabEdges(p){
  const runs=[];
  for(const [ax,az,bx,bz,nx,nz] of [[p.x0,p.z0,p.x1,p.z0,0,-1],[p.x0,p.z1,p.x1,p.z1,0,1],[p.x0,p.z0,p.x0,p.z1,-1,0],[p.x1,p.z0,p.x1,p.z1,1,0]]){
    const count=Math.max(1,Math.round(Math.hypot(bx-ax,bz-az)/.2));
    let kind=null,start=0;
    for(let i=0;i<=count;i++){
      let next=null;
      if(i<count){
        const t=(i+.5)/count,v=az+(bz-az)*t+nz*.28,q=partAt(hallOrigin.x+ax+(bx-ax)*t+nx*.28,hallOrigin.y+v);
        next=!q?(openAir(p)?"rail":"wall"):q.style==="lift"?null:Math.abs(heightIn(q,v)-p.h)>.65?(p.h< -9?"wall":"rail"):null;
      }
      if(next===kind)continue;
      if(kind){
        const a=start/count,b=i/count;
        runs.push({kind,nx,nz,x0:ax+(bx-ax)*a,z0:az+(bz-az)*a,x1:ax+(bx-ax)*b,z1:az+(bz-az)*b});
      }
      kind=next;start=i;
    }
  }
  return runs;
}
const bankOf=p=>liftBanks.find(b=>Math.abs(b.center.x-hallOrigin.x-(p.x0+p.x1)/2)<.1&&Math.abs(b.center.y-hallOrigin.y-(p.z0+p.z1)/2)<.1);
export function railHeight(x,y,time=stationClock()){
  const p=partAt(x,y);if(!p)return null;
  if(p.style==="lift")return liftAt(time,bankOf(p)).height;
  return heightIn(p,y-hallOrigin.y);
}
export const sameStation=(a,b)=>a===b||[a,b].every(id=>id==="station-hall"||id==="station-foodhall"||id==="ktx-platform");
export function railStepAllowed(a,b,time=stationClock()){
  const pa=partAt(a.x,a.y),pb=partAt(b.x,b.y);
  if(!pa&&!pb)return true;
  if(!pa||!pb)return false;
  for(const p of [pa,...(pa===pb?[]:[pb])]){
    if(p.style!=="stairs")continue;
    const w=p.x1-p.x0,t0=a.y-hallOrigin.y-p.z0,t1=b.y-hallOrigin.y-p.z0;
    const u0=a.x-hallOrigin.x-p.x0,u1=b.x-hallOrigin.x-p.x0;
    if([0,.6,.8,1].some(k=>hitsRail(t0,u0,t1,u1,p.z1-p.z0,w*k)))return false;
  }
  if(pa===pb)return true;
  if(pa.style==="lift"||pb.style==="lift"){
    const car=liftAt(time,bankOf(pa.style==="lift"?pa:pb)),landing=pa.style==="lift"?pb:pa;
    return landing.style==="bridge"&&car.open>.84&&Math.abs(landing.h-car.height)<.05;
  }
  return Math.abs(railHeight(a.x,a.y,time)-railHeight(b.x,b.y,time))<=.55;
}
