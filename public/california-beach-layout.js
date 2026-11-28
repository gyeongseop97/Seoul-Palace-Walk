import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";
const p=(x,z)=>({x,z});
export const beachGuide="https://www.gjw.co.kr/images/contents/CB_map.pdf";
export const beachEntrance={x:6393,z:199,name:"캘리포니아비치 입구",heading:225};
export const beachBoundary=[[6196,201],[6243,189],[6368,188],[6402,194],[6412,226],[6408,331],[6385,358],[6247,366],[6196,345]].map(([x,z])=>p(x,z));
export function inCaliforniaBeach(q){
 if(!q||q.x<6196||q.x>6412||q.z<188||q.z>366)return false;
 let inside=false;
 for(let i=0,j=beachBoundary.length-1;i<beachBoundary.length;j=i++){
  const a=beachBoundary[j],b=beachBoundary[i];
  if((a.z>q.z)!==(b.z>q.z)&&q.x<(b.x-a.x)*(q.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}
export const beachRides=[
 ["beach-x","엑스",6231,287,6251,307,32,4,"네 명이 한 튜브에 둘러앉아 대형 깔때기의 벽을 왕복해요."],
 ["beach-twist","터보트위스트",6254,334,6276,346,27,2,"한 사람씩 튜브를 타고 시차를 두고 어두운 터널로 들어가요."],
 ["beach-triple","트리플다운",6208,247,6221,257,22,3,"서로 다른 세 레인에서 나란히 몸으로 미끄러져요."]
].map(([id,name,x,z,gx,gz,duration,capacity,description])=>({id,name,x,z,gate:p(gx,gz),duration,capacity,description,radius:8}));
export const beachServices=[
 ["rental","종합대여소",6376,218,8,5,"구명재킷을 빌리거나 반납할 수 있어요."],
 ["changing","라커동 · 탈의실",6394,224,11,7,"래시가드와 수영복을 골라 입어요."],
 ["snack","츄러스 · 카페테리아",6364,317,11,6,"츄러스와 시원한 슬러쉬, 커피를 골라 보세요."]
].map(([type,name,x,z,w,d,description])=>({id:"cb-"+type,type,name,x,z,w,d,gate:p(x,z+d/2+1.15),description}));
export const beachBeds=[[6356,241,210],[6360,239,210],[6348,239,202],[6343,236,202],[6361,301,241],[6363,297,241],[6340,318,352],[6344,319,352]].map(([x,z,heading])=>({x,z,heading}));
export const beachPoolGates=[
 {id:"wave",name:"산타모니카비치",gate:p(6331,246),heading:180,description:"완만한 물가로 들어가 파도를 기다려 보세요. 깊은 물에서는 수영할 수 있어요."},
 {id:"river",name:"웨이브캐년",gate:p(6299,234),heading:180,description:"물에 들어가면 튜브가 물살을 따라 흘러요. 방향키로 가장자리로 헤엄쳐 나올 수 있어요."},
 {id:"kids",name:"페블비치",gate:p(6369,257),heading:180,description:"얕은 어린이 풀에서 물을 튀기며 걸어 보세요."}
];
const junction=p(6373,236),west=p(6257,224),south=p(6324,347);
export const beachWalkways=[
 [p(6458,167),p(6449,184),p(6425,183),beachEntrance,junction,beachPoolGates[0].gate,beachPoolGates[1].gate,west,p(6223,224),beachRides[2].gate],
 [beachEntrance,beachServices[0].gate,junction],[beachEntrance,beachServices[1].gate,junction],
 [junction,beachPoolGates[2].gate,p(6391,254),p(6391,289),p(6379,308),beachServices[2].gate,south,beachRides[1].gate],
 [beachPoolGates[1].gate,p(6275,231),p(6269,269),p(6267,299),beachRides[0].gate],
 [beachRides[0].gate,p(6273,314),beachRides[1].gate],[south,p(6317,326),p(6318,309)]
];
export const beachDestinations=[{...beachEntrance,description:"경주월드 매표광장에서 이어지는 워터파크예요."},
 ...beachPoolGates.map(s=>({...s.gate,...s})),
 ...beachRides.map(s=>({...s.gate,name:s.name+" 입구",heading:(Math.atan2(s.x-s.gate.x,s.gate.z-s.z)*180/Math.PI+360)%360,description:s.description})),
 ...beachServices.map(s=>({...s.gate,name:s.name,heading:0,description:s.description})),
 {...p(6358,237),name:"비치 선베드",heading:210,description:"파도풀 옆 선베드에서 쉬어 가세요."}
].map(s=>({...gyeongjuPoint(s),name:s.name,label:s.name,heading:s.heading,district:"캘리포니아비치",guide:{title:s.name,description:s.description,source:beachGuide,sourceLabel:"캘리포니아비치 공식 가이드맵"}}));
export const beachCounter={...gyeongjuPoint(beachServices[2].gate),name:beachServices[2].name,kind:"blueSlush",stock:["blueSlush","churros","icedAmericano"],actionLabel:"카페테리아 메뉴 보기"};
export function beachServiceAt(player){
 const q=localGyeongju(player);
 return beachServices.find(s=>s.type!=="snack"&&Math.abs(s.x-q.x)<s.w/2&&q.z>=s.z-s.d*.26&&q.z<s.gate.z+2.2);
}
export function beachSolid(q,h){
 if(h<6.3&&q.x>6319.7&&q.x<6350.9&&q.z>305&&q.z<310.7)return true;
 for(const s of beachServices){
  const x=Math.abs(q.x-s.x),z=q.z-s.z;
  if(x>s.w*.5+.14||Math.abs(z)>s.d*.5+.16||h>4.8)continue;
  if(s.type==="snack"||h>2.95||x>s.w*.5-.21||z< -s.d*.37||x>1.3&&z<s.d*.12)return true;
 }
 return h<2.7&&beachRides.some(r=>Math.hypot(r.x-q.x,r.z-q.z)<r.radius);
}
