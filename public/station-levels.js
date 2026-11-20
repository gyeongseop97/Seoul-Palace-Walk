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
export const liftCenter=railPoint(-7.25,-50),liftHalf=1.5;
export const liftStops=[
  {floor:1,name:"승강장",dx:1,dz:0},{floor:2,name:"맞이방",dx:0,dz:1},
  {floor:3,name:"식당가",dx:-1,dz:0},{floor:4,name:"옥상정원",dx:0,dz:-1}
];
export const mainLift={id:"main",center:liftCenter,stops:liftStops,levels:storeys};
export const airportLift={id:"airport",center:railPoint(-90,-81),levels:[-14.4,-18.2,-29.6,-33.4],stops:[
  {floor:-2,name:"도심공항터미널",dx:0,dz:1},{floor:-3,name:"일반열차 개찰구",dx:-1,dz:0},
  {floor:-6,name:"연결층",dx:0,dz:-1},{floor:-7,name:"공항철도 승강장",dx:1,dz:0}
]};
export const liftBanks=[mainLift,airportLift];
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
// Bounds are in metres from the east waiting hall. Adjoining edges are real walking connections.
const slab=(id,name,x0,x1,z0,z1,h,style="hall")=>({id,name,x0,x1,z0,z1,h,style});
const flight=(name,x0,x1,z0,z1,front,back)=>({...slab("station-hall",name,x0,x1,z0,z1,front,"stairs"),back});
// Glazed perimeter of the public waiting hall, in the same frame as its floor.
export const hallBow=[-29,-23,-16,-9,-3,2,10,16,23,29].map(z=>({z,x:21+7.5*(1-(z/29)**2)}));
const waitingHall=slab("station-hall","서울역 2층 맞이방",-21,21,-29,29,0);
function inBow(u,z){
  if(u<=21||u>28.5||z< -29||z>29)return false;
  for(let i=1;i<hallBow.length;i++){
    const a=hallBow[i-1],b=hallBow[i];
    if(z<=b.z)return u<=a.x+(b.x-a.x)*(z-a.z)/(b.z-a.z);
  }
  return false;
}
export const roofBeds=[{x:-28.5,z:-135.5,w:17},{x:-33,z:-113.5,w:8},{x:-20.7,z:-113.5,w:2}];
// Paired island entrances branch off the public concourse above the tracks.
export const boardingIslands=[
  {x:-28,tracks:"5 · 6"},{x:-45,tracks:"7 · 8"},{x:-62,tracks:"9 · 10"},
  {x:-79,tracks:"11 · 12"},{x:-96,tracks:"13 · 14"}
];
export const concourseParts=[
  waitingHall,
  flight("1층 승강장 계단",-3.8,3.8,-47,-29,-6.3,0),
  slab("ktx-platform","서울역 1층 KTX 승강장",-4.35,4.35,-144,-47,-6.3,"platform"),
  flight("4번 승강장 전철 직통환승 계단",-3.8,3.8,-158,-144,-10.8,-6.3),
  slab("station-hall","열차·전철 직통환승통로",-76.45,3.8,-162,-158,-10.8,"passage"),
  slab("station-hall","전철 환승 연결로",-76.45,-74.05,-158,-46,-10.8,"passage"),
  flight("3층 식당가 계단",-19.8,-12.2,-47,-29,5.1,0),
  slab("station-foodhall","서울역 3층 식당가",-36,-12,-71,-47,5.1,"dining"),
  slab("station-hall","3층 맞이방 발코니",-29,-21,-47,1,5.1,"balcony"),
  slab("station-hall","3층 중앙 회랑",-38.5,-29,-30,-23,5.1,"balcony"),
  flight("맞이방 중앙 에스컬레이터",-38.5,-31,-23,2,5.1,0),
  ...boardingIslands.flatMap(({x,tracks})=>[
    flight(tracks+"번 타는 곳 계단",x-3.75,x+3.75,19,37,0,-6.3),
    slab("ktx-platform",tracks+"번 승강장",x-4.3,x+4.3,37,74,-6.3,"island")
  ]),
  flight("4층 올라가는 계단",-34,-28,-87,-71,9.6,5.1),
  slab("station-hall","4층 다이닝·아울렛",-37,-10,-102,-87,9.6,"arcade"),
  slab("station-hall","4층 주차동 보행로",-10,-4.35,-111,-87,9.6,"parkLink"),
  slab("station-hall","옥상정원 연결 데크",-26,-10,-111,-104,9.6,"parkLink"),
  slab("station-hall","더 루프 아틀리에 · 옥상정원",-38,-19,-138,-111,9.6,"garden"),
  slab("station-hall","2층 엘리베이터 통로",-8.65,-5.85,-48.5,-29,0,"bridge"),
  slab("station-hall","1층 엘리베이터 통로",-5.75,-4.35,-51.4,-48.6,-6.3,"bridge"),
  slab("station-hall","3층 엘리베이터 통로",-12,-8.75,-51.4,-48.6,5.1,"bridge"),
  slab("station-hall","4층 엘리베이터 통로",-8.65,-5.85,-87,-51.5,9.6,"bridge"),
  slab("station-hall","서울역 승강기",-8.75,-5.75,-51.5,-48.5,0,"lift"),
  slab("station-hall","2층 동서 자유통로",-56,-21,2,10,0,"atrium"),
  slab("station-hall","중앙 맞이방",-56,-21,10,19,0,"atrium"),
  slab("station-hall","서부 출입홀",-101,-77,2,19,0,"atrium"),
  slab("station-hall","1·4호선 출입구 연결통로",-58,-39,-46,-35,-10.8,"transfer"),
  slab("station-hall","서울역 지하 보행홀",-56,-39,-35,0,-10.8,"metro"),
  slab("station-hall","서울역 서부 맞이방",-77,-56,-7,19,0,"west"),
  flight("공항철도 환승 계단",-74,-66,-34,-7,-10.8,0),
  slab("station-hall","지하 환승통로",-81,-58,-46,-34,-10.8,"transfer"),
  slab("station-hall","공항철도 연결통로",-105,-81,-43,-37,-10.8,"bridge"),
  slab("station-hall","공항철도 지하 1층",-106,-96,-48,-31,-10.8,"transfer"),
  flight("도심공항터미널 계단",-104,-98,-59,-48,-14.4,-10.8),
  slab("station-hall","지하 2층 도심공항터미널",-118,-94,-75,-59,-14.4,"terminal"),
  flight("일반열차 개찰구 계단",-111,-105,-87,-75,-18.2,-14.4),
  slab("station-hall","지하 3층 일반열차 개찰구",-117,-94,-101,-87,-18.2,"gates"),
  slab("station-hall","공항철도 승강기",-91.5,-88.5,-82.5,-79.5,0,"lift"),
  slab("station-hall","B2 승강기 통로",-91.4,-88.6,-79.5,-67,-14.4,"bridge"),
  slab("station-hall","B2 연결로",-94,-91.4,-70,-67,-14.4,"bridge"),
  slab("station-hall","B3 연결로",-98.5,-95.5,-87,-79.6,-18.2,"bridge"),
  slab("station-hall","B3 승강기 통로",-95.5,-91.5,-82.4,-79.6,-18.2,"bridge"),
  slab("station-hall","B6 승강기 통로",-91.4,-88.6,-108,-82.5,-29.6,"bridge"),
  slab("station-hall","지하 6층 연결층",-98,-82,-118,-108,-29.6,"transfer"),
  slab("station-hall","B7 승강기 통로",-88.5,-81.5,-82.4,-79.6,-33.4,"bridge"),
  slab("station-hall","지하 7층 공항철도 승강장",-81.5,-76.5,-143,-69,-33.4,"arexPlatform"),
  slab("station-hall","2층 주차동 보행로",21,34,2,10,0,"parkLink"),
  slab("station-hall","서울역 2층 쇼핑·마트 입구",34,48,-3,17,0,"retail"),
  slab("station-hall","3층 상가 연결통로",-60,-36,-68,-62,5.1,"bridge"),
  slab("station-hall","서울역 3층 상가",-74,-60,-73,-57,5.1,"retail")
];
export const westExit={inside:railPoint(-98,9),outside:{x:-165.4,y:1516.2,heading:270,up:true}};
export const northBridgeExit={inside:railPoint(38,14),outside:{x:-155.8,y:1390.5,heading:270}};
export const rearMarketExit={inside:railPoint(38,1),outside:{x:-183.2,y:1322.2,heading:270}};
export const marketExit={inside:railPoint(44,8),outside:{x:-62.7,y:1408.4,heading:180,up:true}};
export const subwayExit={inside:railPoint(-78,-39),outside:{x:33.4,y:1408.25,heading:290}};
const metroNumbers=[2,3,4,5,6,7,8,9,"9-1",10,11,12,13,14,15,"경의1"];
export function metroInsidePoint(number){
  if(number==="경의1")return railPoint(45,1);
  if(number===15)return railPoint(-101,-41);
  const i=metroNumbers.indexOf(number);
  return railPoint(i<7?-54:-41,-32+(i%7)*4.6);
}
export function partAt(x,y){
  const u=x-hallOrigin.x,z=y-hallOrigin.y;
  if(u< -118.01||u>48.01||z< -162.01||z>74.01)return null;
  for(const p of concourseParts)if(u>=p.x0-1e-6&&u<=p.x1+1e-6&&z>=p.z0-1e-6&&z<=p.z1+1e-6)return p;
  return inBow(u,z)?waitingHall:null;
}
export function railHeight(x,y,time=stationClock()){
  const p=partAt(x,y);if(!p)return null;
  if(p.style==="lift")return liftAt(time,p.x0< -80?airportLift:mainLift).height;
  return p.back==null?p.h:p.h+(p.back-p.h)*(y-hallOrigin.y-p.z0)/(p.z1-p.z0);
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
    const car=liftAt(time,(pa.style==="lift"?pa:pb).x0< -80?airportLift:mainLift),landing=pa.style==="lift"?pb:pa;
    return landing.style==="bridge"&&car.open>.84&&Math.abs(landing.h-car.height)<.05;
  }
  return Math.abs(railHeight(a.x,a.y,time)-railHeight(b.x,b.y,time))<=.55;
}
