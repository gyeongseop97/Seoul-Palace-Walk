import {gyeongjuPoint} from "./region-coordinates.js";

// Game racks stand off the travelled lane. The regional map and the server share
// their approach positions so riding up to any rack also permits a return.
const racks=[
 ["hwangnidan","황리단길 포석로",-195.71,-374,86,"포석로 북쪽에서 한옥 골목을 돌아 대릉원 돌담길로 가 보세요."],
 ["daereungwon","대릉원 정문",291,63,145,"정문 밖 돌담길에서 동쪽으로 가면 첨성대 관람길이 이어져요."],
 ["cheomseongdae","첨성대 관람길",613.2,189.15,0,"첨성대 남쪽 갈림길에서 계림과 교촌마을 쪽으로 내려가 보세요."],
 ["woljeong","월정교 북쪽",546.5,683.5,180,"월정교 북문 앞 남천 둑길에서 반납하고 걸어서 다리를 건너 보세요."]
];

export const gyeongjuBikeDocks=racks.map(([id,label,x,z,heading,directions])=>{
 const angle=heading*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),name=label+" 타실라";
 const point=(across,ahead)=>({x:x+across*c+ahead*s,z:z+across*s-ahead*c});
 const access=gyeongjuPoint(point(0,3.2));
 const footprint=[[-2.22,-1.08],[2.22,-1.08],[2.22,1.08],[-2.22,1.08]].map(([u,v])=>point(u,v));
 return {id:"gj-"+id,name,area:"gyeongju",...gyeongjuPoint({x,z}),heading,access,footprint,
  guide:{title:name,description:"경주시 공영자전거 타실라를 경험하는 게임 대여소예요. 어느 경주 대여소에서든 빌리고 반납할 수 있어요.",
   directions:directions+" 도중에 내리면 10분 안에 세워둔 자리에서 다시 탈 수 있어요.",
   source:"https://tasilla.gyeongju.go.kr/Guide/rental.do",sourceLabel:"경주시 타실라 대여 안내"}};
});

// Even a straight path that just clips a corner must go around the parked row.
export function crossesBikeRack(a,b){
 return gyeongjuBikeDocks.some(({footprint})=>{
  let enter=0,leave=1;
  for(let i=0;i<4;i++){
   const p=footprint[i],q=footprint[(i+1)%4],dx=q.x-p.x,dz=q.z-p.z;
   const start=(a.x-p.x)*dz-(a.z-p.z)*dx,end=(b.x-p.x)*dz-(b.z-p.z)*dx;
   if(start<0&&end<0)return false;
   if(start<0)enter=Math.max(enter,start/(start-end));
   if(end<0)leave=Math.min(leave,start/(start-end));
   if(leave<enter)return false;
  }
  return true;
 });
}
