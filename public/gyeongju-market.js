import {cafeFittings} from "./gyeongju-cafe.js";
import {gyeongjuPoint,localGyeongju} from "./region-coordinates.js";
import {parkServices,parkBenches,parkCounters} from "./gyeongju-world-layout.js";

const townMap="https://www.gyeongju.go.kr/design/tour2019/file/HroadMap.pdf";
const bread="https://www.gyeongju.go.kr/tour/page.do?mnu_uid=4824";
const villageMap="https://www.gyeongju.go.kr/design/tour2019/file/tourMap/tourMap2_250821.pdf";
const tableGuide="https://www.gyeongju.go.kr/tour/page.do?mnu_uid=4813";
const guide=(description,directions,source)=>({description,directions,source,sourceLabel:"경주시 문화관광"});

// Each new shop replaces an existing surveyed footprint. The front edge faces its own street.
const shops=[
 {id:"cafe",name:"황남 한옥카페",x:-228.6,z:-304.2,yaw:-2.70,width:9,depth:9.4,street:[-233.6,-309.5],
  stock:["coffee","sikhye","hwangnamBread","bingsu"],actionLabel:"메뉴 보기",board:"식혜 · 황남빵",sign:"#56412e",
  guide:guide("황리단길 골목의 게임 속 한옥 카페입니다. 팥을 채운 황남빵에 식혜나 커피를 곁들여 보세요.","문 안 카운터에서 메뉴를 고르세요. 음식을 손에 들고 빈 의자에 앉거나 산책길로 가져갈 수 있어요.",bread)},
 {id:"restaurant",name:"황남 쌈밥집",x:-207.7,z:-289.425,yaw:1.5053163,width:12.23,depth:11.02,footprint:[-213.6,-283.6],street:[-195.84,-288.54],
  board:"쌈밥 정식 · 한우 장국밥",sign:"#4f644d",
  guide:guide("대릉원 주변 쌈밥집에서 착안한 게임 속 식당입니다. 밥에 쌈장과 제철 잎채소를 곁들이는 한 상을 차립니다.","포석로에서 문으로 들어와 빈 식탁에 앉아 벨을 누르세요. 카운터에서 트레이를 직접 받아 자리로 가져가도 좋아요.",tableGuide)},
 {id:"pub",name:"교촌 술마루",x:444.55,z:608.525,yaw:-2.6934477,width:11.54,depth:10.73,footprint:[441.7,615.9],street:[440.35,600.76],
  stock:["beopju","makgeolli","cheese","yakgwa"],actionLabel:"차림표 보기",board:"법주 · 막걸리 · 약과",sign:"#674137",
  guide:guide("교촌마을의 전통 술 문화를 담은 게임 속 주막입니다. 법주와 막걸리를 잔으로 내고 약과를 안주로 곁들입니다.","월정교 북쪽에서 교촌안길로 들어오세요. 카운터에서 술을 받아 마주 앉아 마실 수 있어요. 건배하려면 잔을 들고 친구 곁에 서세요.",villageMap)},
 {id:"store",name:"황리단길 골목편의점",x:-200.95,z:-347.6,yaw:1.5385494,width:9.30,depth:10.40,footprint:[-206,-352.4],street:[-191.26,-347.11],
  stock:["hwangnamBread","ssambap","sikhye","triangleRice","cupNoodles","cannedBeer","churu"],actionLabel:"상품 보기",board:"여행 간식 · 음료",sign:"#326561",
  guide:guide("황리단길 초입에 마련한 게임 속 작은 편의점입니다. 여행 간식과 식혜, 컵라면, 고양이 간식을 살 수 있어요.","황리단길 북쪽에서 포석로를 따라 조금 내려오세요. 문 안쪽 계산대에서 상품을 골라 들고 나오거나 가방에 담으세요.",townMap)}
];
export const marketRooms=shops.map(shop=>{
 const fit=cafeFittings(shop),entry=fit.point(0,shop.depth/2+.95);
 return {...shop,fit,entry,heading:(360-shop.yaw*180/Math.PI)%360};
});
export const marketCounters=marketRooms.filter(r=>r.stock).map(r=>({...gyeongjuPoint(r.fit.order),
 name:r.name,kind:r.stock[0],stock:r.stock,actionLabel:r.actionLabel})).concat(parkCounters);
export const marketBuilding=p=>marketRooms.find(r=>r.footprint?.[0]===p.x&&r.footprint[1]===p.z);
export function marketRoomAt(p,margin=0){
 for(const room of marketRooms){
  if(Math.abs(p.x-room.x)>13||Math.abs(p.z-room.z)>13)continue;
  const q=room.fit.local(p);
  if(Math.abs(q.x)<room.width/2+margin&&Math.abs(q.z)<room.depth/2+margin)return room;
 }
 return null;
}
export function marketCameraBlocked(p,y){
 if(y<.04||y>5.4)return false;
 const room=marketRoomAt(p,.24);
 if(!room)return false;
 const q=room.fit.local(p),w=room.width/2,d=room.depth/2;
 return y>=2.9||Math.abs(Math.abs(q.x)-w)<.24||Math.abs(q.z+d)<.24||Math.abs(q.z-d)<.24&&Math.abs(q.x)>1.1;
}
export const marketBenches=marketRooms.flatMap(room=>room.fit.tables.map((t,index)=>{
 const seated=room.id==="restaurant";
 return {...gyeongjuPoint(room.fit.point(t.x,t.z)),...(seated?{table:true,tableIndex:index,venueId:"gj-hwangnam-table"}:{}),
  slots:t.seats.map((s,i)=>{
   const heading=(180-(room.yaw+s.yaw)*180/Math.PI+360)%360;
   const chair=gyeongjuPoint(room.fit.point(s.x,s.z)),approach=gyeongjuPoint(s.approach);
   return {...chair,approach,heading,top:.505,cafeFloor:0,...(seated?{tray:{...gyeongjuPoint(room.fit.point(t.x,t.z+(i?1:-1)*.22)),heading,height:.762}}:{})};
  })};
}));

const dining=marketRooms.find(r=>r.id==="restaurant");
const diningBenches=marketBenches.filter(b=>b.table);
const corners=[-1,1].flatMap(x=>[-1,1].map(z=>gyeongjuPoint(dining.fit.point(x*dining.width/2,z*dining.depth/2))));
const staffStation={x:-.68,z:dining.fit.counter.z-.84};
export const marketDining={
 id:"gj-hwangnam-table",name:dining.name,service:"staff",area:"gyeongju",center:gyeongjuPoint(dining),staffStation,
 menuPoint:gyeongjuPoint(dining.fit.order),bounds:{minX:Math.min(...corners.map(c=>c.x)),maxX:Math.max(...corners.map(c=>c.x)),
  minY:Math.min(...corners.map(c=>c.y)),maxY:Math.max(...corners.map(c=>c.y))},
 dishes:[{kind:"ssambapSet",name:"황남 쌈밥 정식",description:"깻잎과 상추에 밥을 올리고 쌈장과 반찬을 곁들이는 한 상이에요."},
  {kind:"jangGukbap",name:"한우 장국밥",description:"소고기와 대파를 넣어 끓인 따뜻한 장국에 밥을 말아 내요."}],
 benches:diningBenches,
 benchAt(seat){const bench=marketBenches[seat];return bench?.venueId===this.id?bench:null;},
 servicePath(table){
  const t=dining.fit.tables[table.index],seat=t.seats[table.side<0?0:1];
  const side=Math.sign(t.x),aisle=side*(dining.fit.counter.width/2+.62),end={x:t.x-side*.87,z:seat.z};
  return {points:[staffStation,{x:aisle,z:staffStation.z},{x:aisle,z:dining.fit.counter.z+.83},
   {x:end.x,z:dining.fit.counter.z+1.06},end],face:side*Math.PI/2};
 }
};
const canyon=parkServices.find(s=>s.type==="restaurant");
const parkTables=parkServices.filter(s=>s.type==="restaurant"||s.type==="cafe").flatMap(s=>[-1,1].map((side,i)=>{
 const x=s.x+side*s.w*.32,z=s.z+s.d*.11,restaurant=s===canyon;
 return {...gyeongjuPoint({x,z}),table:restaurant,tableIndex:i,venueId:restaurant?"gj-canyon":undefined,
  slots:[-1,1].map(end=>({...gyeongjuPoint({x,z:z+end*.87}),heading:end<0?180:0,top:.49,cafeFloor:0,
   approach:gyeongjuPoint({x:x-side*1.08,z:z+end*.93}),
   ...(restaurant?{tray:{...gyeongjuPoint({x,z:z+end*.23}),heading:end<0?180:0,height:.77}}:{})}))};
}));
export const cityBenches=[...marketBenches,...parkTables,...parkBenches.map(b=>{
 const h=b.heading*Math.PI/180,frontX=Math.sin(h),frontZ=-Math.cos(h);
 return {...gyeongjuPoint(b),slots:[-1,1].map(side=>{
  const x=b.x+side*.48*Math.cos(h),z=b.z+side*.48*Math.sin(h);
  return {...gyeongjuPoint({x,z}),heading:(b.heading+360)%360,top:.48,cafeFloor:0,
   approach:gyeongjuPoint({x:x+frontX*.84,z:z+frontZ*.84})};
 })};
})];
const center=gyeongjuPoint(canyon),canyonStation={x:0,z:-canyon.d*.33};
export const canyonDining={id:"gj-canyon",name:canyon.name,service:"staff",area:"gyeongju",center,staffStation:canyonStation,
 bounds:{minX:center.x-canyon.w/2,maxX:center.x+canyon.w/2,minY:center.y-canyon.d/2,maxY:center.y+canyon.d/2+.1},
 menuPoint:{x:center.x,y:center.y-canyon.d*.12},benches:parkTables.filter(b=>b.table),
 dishes:[{kind:"fishcakeUdon",name:"꼬치어묵우동",description:"어묵꼬치와 쑥갓을 올린 따끈한 우동이에요."},
  {kind:"spicyPorkRice",name:"제육불고기덮밥",description:"매콤하게 볶은 제육불고기를 밥 위에 올려요."}],
 benchAt(seat){const b=cityBenches[seat];return b?.venueId===this.id?b:null;},
 servicePath(table){
  const side=table.index?1:-1,end={x:side*(canyon.w*.32-1.02),z:canyon.d*.11+table.side*.47};
  return {points:[canyonStation,{x:-.53*canyon.w+.95,z:canyonStation.z},{x:-.53*canyon.w+.95,z:-.72},{x:end.x,z:-.72},end],face:side*Math.PI/2};
 }};
export function marketDiningAt(p){
 const b=canyonDining.bounds;
 if(p.x>b.minX&&p.x<b.maxX&&p.y>b.minY&&p.y<b.maxY)return canyonDining;
 return marketRoomAt(localGyeongju(p))?.id==="restaurant"?marketDining:null;
}
