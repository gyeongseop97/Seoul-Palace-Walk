import {beachWaterAt} from "./california-beach-water.js";
import {beachWalkways,beachSolid,inCaliforniaBeach} from "./california-beach-layout.js";
import {gyeongjuPoint} from "./region-coordinates.js";

// Local metres. Existing landmarks and additions use OSM footprints where mapped.
// The official visitor map supplies the district and pedestrian relationships.
export const parkGuide="https://www.gjw.co.kr/images/contents/guidemap.pdf";
const point=(x,z)=>({x,z});
export const parkBoundary=[[5988,218],[5996,20],[6156,-473],[6483,-266],[6501,-192],[6465,-37],[6502,51],[6486,148],[6452,192],[6308,228],[5996,248]].map(([x,z])=>point(x,z));
export const parkEntrance={x:6458,z:167,name:"경주월드 정문",heading:315};
export const parkFountain=point(6424,138);
export const parkRides=[
  ["wheel","타임라이더",6237,-148,6254,-127,13,64,4,"친구와 한 곤돌라에 앉아 보문호와 파크의 전경을 둘러보세요."],
  ["viking","킹바이킹",6233,-100,6251,-84,13,34,14,"친구와 나란히 앉으면 배가 점점 더 높이 올라가요."],
  ["bumper","범퍼카",6341,68,6359,75,11,50,5,"각자 운전대를 잡고 방향키나 화면 버튼으로 서로 부딪혀 보세요."],
  ["coaster","드라켄",6417,-222,6416,-164,0,42,12,"리프트 끝에서 열차가 잠시 멈춘 뒤 급강하해요."],
  ["krake","크라크",6354,-232,6375,-210,15,46,12,"원형 좌석이 돌면서 거대한 팔이 머리 위까지 한 바퀴 돌아요."],
  ["cups","댄싱컵",6208,-47,6223,-39,10,36,12,"친구와 컵에 앉아 손잡이를 돌리면 우리 컵이 더 돌아요."],
  ["splash","섬머린스플래쉬",6255,43,6280,43,19,50,8,"보트가 리프트를 지나 32m 높이에서 수로로 떨어져요."],
  ["carousel","페기의 캐로셀",6282,-20,6295,-18,9,40,12,"천천히 도는 회전목마에서 오르내리는 말을 타 보세요."],
  ["phaethon","파에톤",6160,14,6194,16,17,48,8,"매달린 열차에서 발밑을 내려다보며 루프를 통과하세요."]
].map(([id,name,x,z,gx,gz,radius,duration,capacity,description])=>({id,name,x,z,gate:point(gx,gz),radius,duration,capacity,description}));
export const parkServices=[
 ["canyon","restaurant","캐니언빌리지",6189,-101,14,9,"엑스존 식당에서 식사를 주문하고 식탁에서 먹을 수 있어요."],
 ["splash-shop","snack","스플래쉬 매점",6275,75,7,5,"창구에서 츄러스와 아이스아메리카노, 슬러쉬를 골라 보세요."],
 ["glinda","cafe","글린다의 커피팔러",6380,113,10,7,"커피와 녹차라떼를 들고 광장의 벤치에서 쉬어 가세요."],
 ["center","info","고객센터",6449,132,8,6,"안내 데스크에서 파크 지도를 열 수 있어요."],
 ["restroom","restroom","가족 화장실",6307,-37,7.2,5.8,"위자드가든 산책로의 화장실과 세면대예요."],
 ["lockers","locker","정문 물품보관소",6430,111,7,5,"보관함에 손에 든 물건을 맡기고 돌아와 꺼낼 수 있어요."],
 ["firstaid","firstaid","의무실",6443,117,7,5.5,"정문 옆 의무실의 의자에 앉아 쉬어 가세요."]
].map(([id,type,name,x,z,w,d,description])=>({id,type,name,x,z,w,d,heading:0,description,gate:point(x,z+d/2+1.1)}));
const restroom=parkServices.find(s=>s.type==="restroom");
export const parkWashbasin=gyeongjuPoint(point(restroom.x+restroom.w*.29,restroom.z+.93));
export function parkServiceNear(world,kind){
  return parkServices.find(s=>{
    if(kind&&s.type!==kind)return false;
    const p=gyeongjuPoint(s.gate);
    return Math.hypot(p.x-world.x,p.y-world.y)<3.6||s.type==="restroom"&&Math.hypot(parkWashbasin.x-world.x,parkWashbasin.y-world.y)<2;
  });
}
const service=id=>parkServices.find(s=>s.id===id);
export const parkCounters=[
 [service("splash-shop"),["churros","icedAmericano","blueSlush"]],
 [service("glinda"),["icedAmericano","greenLatte","coffee"]]
].map(([s,stock])=>({...gyeongjuPoint(s.type==="cafe"?point(s.x,s.z-.15*s.d):s.gate),name:s.name,kind:stock[0],stock,actionLabel:s.name+" 메뉴 보기"}));
export const parkBenches=[
 [6412,141,65],[6423,153,0],[6434,143,-65],[6389,96,-35],[6348,89,25],[6303,63,105],
 [6279,12,40],[6267,-56,90],[6247,-119,65],[6204,-90,-80],[6355,-114,12],[6384,-182,60],
 [6338,-170,-35],[6312,-22,20],[6336,11,-80],[6441.5,122.5,0]
].map(([x,z,heading])=>({x,z,heading}));
const rideGate=id=>parkRides.find(r=>r.id===id).gate;
const east=point(6436,135),main=point(6404,112),mid=point(6369,91),garden=point(6315,-17),family=point(6265,-85);
const cross=point(6338,-65),north=point(6301,-108),fork=point(6371,-101),valley=point(6392,-191),lake=point(6209,-11);
export const parkWalkways=[
 [parkEntrance,east,main,mid,point(6360,32),point(6355,-5),cross,north,point(6277,-118),rideGate("wheel")],
 [east,service("center").gate],[main,service("lockers").gate,service("firstaid").gate,service("center").gate],
 [main,service("glinda").gate,mid],[mid,rideGate("bumper")],
 [mid,point(6324,83),point(6305,65),service("splash-shop").gate,point(6283,61),rideGate("splash")],
 [rideGate("splash"),point(6287,12),rideGate("carousel"),garden,cross],
 [garden,point(6307,-27),service("restroom").gate],[garden,point(6270,-40),rideGate("cups"),lake,rideGate("phaethon")],
 [lake,point(6190,-45),service("canyon").gate,point(6212,-90),family,rideGate("viking")],
 [family,point(6262,-108),rideGate("wheel")],[family,point(6255,-52),rideGate("cups")],
 [cross,fork,point(6402,-130),rideGate("coaster"),valley,rideGate("krake")],
 [rideGate("krake"),point(6327,-184),point(6315,-144),north]
];
export const parkDestinations=[{...parkEntrance,description:"보문호 옆 놀이공원이에요. 분수광장을 지나 위자드가든, 엑스존과 드라켄밸리로 갈 수 있어요."},...parkRides.map(r=>({...r.gate,name:r.name+" 입구",description:r.description,heading:(Math.atan2(r.x-r.gate.x,r.gate.z-r.z)*180/Math.PI+360)%360})),...parkServices.map(s=>({...s.gate,name:s.name,description:s.description,heading:0}))].map(p=>({...gyeongjuPoint(p),name:p.name,label:p.name,heading:p.heading,district:"경주월드",guide:{title:p.name,description:p.description,source:parkGuide,sourceLabel:"경주월드 공식 가이드맵"}}));

export function inAmusementPark({x,z}){
  if(inCaliforniaBeach({x,z}))return true;
  if(x<5988||x>6502||z< -473||z>248)return false;
  let inside=false;
  for(let i=0,j=parkBoundary.length-1;i<parkBoundary.length;j=i++){
    const a=parkBoundary[j],b=parkBoundary[i];
    if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }
  return inside;
}
export function parkWalkable(p){
  return inAmusementPark(p)&&Math.hypot(p.x-parkFountain.x,p.z-parkFountain.z)>5.8&&
    !parkSolid(p,.4);
}
export function parkSolid(p,height){
  if(inCaliforniaBeach(p))return beachSolid(p,height);
  const gateDx=p.x-parkEntrance.x,gateDz=p.z-parkEntrance.z;
  const u=gateDx*Math.cos(.68)-gateDz*Math.sin(.68),v=9+gateDx*Math.sin(.68)+gateDz*Math.cos(.68);
  if(height<3.4&&Math.abs(Math.abs(u)-10.7)<3.35&&Math.abs(v)<2.25)return true;
  for(const s of parkServices){
    const x=Math.abs(p.x-s.x),z=p.z-s.z;
    if(x>s.w/2+.18||Math.abs(z)>s.d/2+.18||height>5.1)continue;
    if(s.type==="restroom"){
      if(x>s.w/2-.22||z< -s.d/2+.78||height>2.94)return true;
      if(Math.abs(z-s.d/2)<.42&&x>s.w*.16)return true;
      if(Math.abs(x-s.w*.29)<.49&&Math.abs(z-.14)<.40)return true;
      continue;
    }
    if(!["restaurant","cafe"].includes(s.type))return true;
    if(s.type==="cafe"&&Math.abs(z-s.d/2)<.38&&x>1.65)return true;
    if(s.type==="restaurant"&&height<.7&&Math.abs(z-s.d/2)<.18&&x>s.w*.12&&x<s.w*.47)return true;
    if(x>s.w/2-.16||z< -s.d*.22+.13||height>3.12)return true;
    if(height<.84&&Math.abs(x-s.w*.32)<.81&&Math.abs(z-s.d*.11)<.54)return true;
  }
  return height<3&&parkRides.some(r=>{
    if(r.id==="splash")return Math.abs(p.x-r.x)<18.5&&Math.abs(p.z-r.z)<38;
    return Math.hypot(p.x-r.x,p.z-r.z)<r.radius;
  });
}

export function parkRoute(from,to){
  if(!parkWalkable(from)||!parkWalkable(to))return [];
  const nodes=[from,to,...new Set([...parkWalkways.flat(),...beachWalkways.flat()])];
  const cost=nodes.map(()=>Infinity),previous=[],visited=new Set();
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const dryRoute=!beachWaterAt(from,0)&&!beachWaterAt(to,0);
  function crossesPark(a,b){
    const steps=Math.ceil(distance(a,b)/2);
    for(let i=1;i<steps;i++){
      const p={x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps};
      if(!parkWalkable(p)||dryRoute&&beachWaterAt(p,0))return true;
    }
    return false;
  }
  if(!crossesPark(from,to))return [to];
  cost[0]=0;
  while(visited.size<nodes.length){
    let index=-1;
    for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&cost[i]<(cost[index]??Infinity))index=i;
    if(index<0)return [];
    if(index===1){
      const route=[];
      for(let cursor=1;cursor!==0;cursor=previous[cursor])route.push(nodes[cursor]);
      return route.reverse();
    }
    visited.add(index);
    for(let i=1;i<nodes.length;i++){
      if(visited.has(i))continue;
      const next=cost[index]+distance(nodes[index],nodes[i]);
      if(next>=cost[i]||crossesPark(nodes[index],nodes[i]))continue;
      cost[i]=next;previous[i]=index;
    }
  }
  return [];
}
