import {gyeongjuPoint} from "./region-coordinates.js";

// Metres in the Gyeongju survey frame. OSM amusement park and ride footprints
// 1001914965, 1523983904, 693915539, 693915515. Draken Valley from the park guide.
export const parkBoundary=[
  {x:5988,z:218},{x:5996,z:20},{x:6156,z:-473},{x:6483,z:-266},
  {x:6501,z:-192},{x:6465,z:-37},{x:6502,z:51},{x:6486,z:148},
  {x:6452,z:192},{x:6308,z:228},{x:5996,z:248}
];
export const parkEntrance={x:6458,z:167,name:"경주월드 정문",heading:315};
export const parkRides=[
  {id:"wheel",name:"타임라이더",x:6237,z:-148,gate:{x:6254,z:-127},radius:12,duration:64},
  {id:"viking",name:"킹바이킹",x:6233,z:-100,gate:{x:6251,z:-84},radius:13,duration:34},
  {id:"bumper",name:"범퍼카",x:6341,z:68,gate:{x:6359,z:75},radius:11,duration:50},
  {id:"coaster",name:"드라켄",x:6417,z:-222,gate:{x:6416,z:-164},radius:0,duration:42}
];
export const parkGuide="https://www.gjw.co.kr/images/contents/guidemap.pdf";
const boardingHelp=[
  "정문을 지나 산책로를 따라가거나, 지도에서 놀이기구 입구를 선택하세요.",
  "친구와 이 입구에서 타면 같은 칸에 앉아요. 보문호를 함께 둘러보세요.",
  "친구와 나란히 앉아 바이킹이 가장 높이 올라가는 순간을 기다려 보세요.",
  "친구와 한 대씩 타고 방향키나 화면 버튼으로 서로 부딪혀 보세요.",
  "친구와 같은 열차를 타요. 정상에서 잠깐 멈춘 뒤 수직으로 떨어져요."
];
export const parkDestinations=[parkEntrance,...parkRides.map(ride=>({
  ...ride.gate,name:ride.name+" 입구",
  heading:(Math.atan2(ride.x-ride.gate.x,ride.gate.z-ride.z)*180/Math.PI+360)%360
}))].map((point,index)=>({
  ...gyeongjuPoint(point),name:point.name,label:point.name,heading:point.heading,
  district:"경주월드",guide:{title:point.name,description:boardingHelp[index],source:parkGuide,sourceLabel:"경주월드 공식 가이드맵"}
}));
export const parkWalkways=[
  [parkEntrance,{x:6429,z:112},{x:6383,z:98},{x:6363,z:59},{x:6362,z:-8},
    {x:6339,z:-62},{x:6306,z:-102},{x:6275,z:-118},parkRides[0].gate],
  [{x:6383,z:98},parkRides[2].gate],
  [{x:6275,z:-118},parkRides[1].gate],
  [{x:6362,z:-8},{x:6402,z:-66},{x:6429,z:-128},parkRides[3].gate]
];
export const parkFountain={x:parkEntrance.x-34,z:parkEntrance.z-29};
export const parkPavilions=[
  {x:6391,z:94},{x:6354,z:-25},{x:6302,z:-72},{x:6373,z:-112},{x:6443,z:-148}
];

export function inAmusementPark({x,z}){
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
    !parkRides.some(ride=>Math.hypot(p.x-ride.x,p.z-ride.z)<ride.radius)&&
    !parkPavilions.some(pavilion=>Math.abs(p.x-pavilion.x)<4.25&&Math.abs(p.z-pavilion.z)<2.65);
}

export function parkRoute(from,to){
  if(!parkWalkable(from)||!parkWalkable(to))return [];
  const nodes=[from,to,...new Set(parkWalkways.flat())];
  const cost=nodes.map(()=>Infinity),previous=[],visited=new Set();
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function crossesPark(a,b){
    const steps=Math.ceil(distance(a,b)/2);
    for(let i=1;i<steps;i++){
      if(!parkWalkable({x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps}))return true;
    }
    return false;
  }
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
