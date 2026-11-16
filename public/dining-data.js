export function diningPoint(x,y,venue=diningVenue){
  return {x:venue.center.x+x,y:venue.center.y+y};
}

function venue({id,name,area,street,centerX,plotX,plotY,angle,service="staff",cuisine="korean"},dishes){
  const center={x:centerX,y:515},plot={x:plotX,y:plotY,w:13.4,d:9.4,angle};
  const local={center};
  const reach=plot.d/2+1.4;
  return {id,name,area,street,center,plot,dishes,service,cuisine,
    bounds:{minX:center.x-12,maxX:center.x+12,minY:center.y-12,maxY:center.y+12},
    outsideDoor:{x:plot.x+Math.sin(angle)*reach,y:plot.y+Math.cos(angle)*reach,
      heading:(540-angle*180/Math.PI)%360},
    insideDoor:{...diningPoint(0,10.6,local),heading:180},
    insideSpawn:{...diningPoint(0,8.3,local),heading:0},
    menuPoint:diningPoint(0,-7.4,local),guestbookPoint:diningPoint(5.6,9.1,local),
    kioskPoint:service==="robot"?diningPoint(2.7,8.25,local):null,
  };
}

export const diningVenue=venue({id:"bukchon-dining",name:"북촌 작은 식탁",area:"bukchon",street:"삼청로",
  centerX:765,plotX:725,plotY:-1095,angle:-Math.PI/2},[{
  kind:"sujebi",name:"삼청동 손수제비",description:"감자와 애호박, 김가루를 곁들인 손수제비",
  source:"https://english.visitseoul.net/attractions/Samcheong-dongSujebi/ENPqgbap0"
}, {kind:"bibimbap",name:"나물 비빔밥",description:"나물, 달걀, 고추장을 올린 비빔밥이에요."}]);
export const diningVenues=[diningVenue,
  venue({id:"jeongdong-dining",name:"정동 메밀집",area:"jeongdong",street:"덕수궁 돌담길",
    centerX:250,plotX:348.5,plotY:339.6,angle:Math.PI},[{
    kind:"buckwheatNoodles",name:"정동 메밀국수",description:"메밀면에 오이와 달걀을 올리고 매콤한 양념을 곁들인 한 그릇",
    source:"https://korean.visitseoul.net/restaurants/%EC%9C%A0%EB%A6%BC%EB%A9%B4/KOP012801"
  }, {kind:"mushroomSoup",name:"버섯 국밥",description:"표고버섯과 두부를 넣은 따뜻한 국밥이에요."}]),
  venue({id:"plaza-dining",name:"광화문 키친",area:"gwanghwamun",street:"광화문광장",
    centerX:600,plotX:535.8,plotY:-415.7,angle:-Math.PI/2,service:"robot"},[{
    kind:"jangGukbap",name:"피맛골 장국밥",description:"쇠고기 장국에 밥을 말고 파를 얹은 한 그릇",
    source:"https://archives.seoul.go.kr/post/2737"
  }, {kind:"bibimbap",name:"나물 비빔밥",description:"밥에 여러 가지 나물과 고추장을 곁들였어요."}]),
  venue({id:"jeongdong-bistro",name:"정동 비스트로",area:"jeongdong",street:"덕수궁 돌담길",
    centerX:866,plotX:392,plotY:339.6,angle:Math.PI,cuisine:"western"},[
    {kind:"mushroomPasta",name:"버섯 크림 파스타",description:"구운 버섯을 넣고 크림 소스에 버무렸어요."},
    {kind:"chickenSandwich",name:"치킨 샌드위치",description:"닭고기와 채소를 토스트에 담고 감자튀김을 곁들였어요."},
  ]),
  venue({id:"plaza-japanese",name:"세종 우동집",area:"gwanghwamun",street:"세종대로",
    centerX:942,plotX:535.8,plotY:-450,angle:-Math.PI/2,service:"robot",cuisine:"japanese"},[
    {kind:"udon",name:"가케 우동",description:"맑은 국물에 굵은 면과 파를 담았어요."},
    {kind:"beefCurry",name:"소고기 카레라이스",description:"소고기와 채소를 넣고 걸쭉하게 끓인 일본식 카레예요."},
  ]),
  venue({id:"bukchon-chinese",name:"삼청 중화식당",area:"bukchon",street:"삼청로",
    centerX:1018,plotX:725,plotY:-1065,angle:-Math.PI/2,cuisine:"chinese"},[
    {kind:"jjajangmyeon",name:"짜장면",description:"춘장에 양파를 볶아 면 위에 얹었어요."},
    {kind:"friedRice",name:"달걀 볶음밥",description:"달걀과 파를 넣어 볶고 짭짤한 소스를 곁들였어요."},
  ]),
];
export const diningMenu=diningVenues.flatMap(place=>place.dishes);

export const diningCounter={x:0,z:-9.55,w:9.4,d:1.15,h:.97};
export const diningStaffStation={x:-1.24,z:diningCounter.z-diningCounter.d/2-.73};
export const diningRobotDock={x:0,z:-7.22};
export const DINING_SERVICE_SPEED=4.3;

export function diningServiceRoute(table,venue){
  const approach=2.75,aisleOffset=1.06;
  const x=table.x-venue.center.x+table.side*approach,z=table.y-venue.center.y+aisleOffset;
  const end={x,z},face=Math.atan2(table.side*(1.46-approach),-aisleOffset);
  const counterEnd=Math.sign(x)*(diningCounter.w/2+.86);
  const customerSide=diningCounter.z+diningCounter.d/2+.95;
  const points=venue.service==="robot"?[diningRobotDock,{x:0,z},end]:[
    diningStaffStation,{x:counterEnd,z:diningStaffStation.z},{x:counterEnd,z:customerSide},{x,z:customerSide},end
  ];
  const segments=points.slice(1).map((to,index)=>{
    const from=points[index];
    return {from,to,length:Math.hypot(to.x-from.x,to.z-from.z)};
  });
  return {segments,face,length:segments.reduce((sum,segment)=>sum+segment.length,0)};
}

export const diningTables=[[-5.8,-3.0],[5.8,-3.0],[-5.8,4.45],[5.8,4.45]].map(([x,z])=>({x,z,
  chairs:[-1,1].map(side=>({x:x+side*1.46,z,side,heading:side<0?90:270}))
}));

export function diningTrayPose(table){
  return {x:table.x+table.side*.94,y:table.y,heading:table.side<0?90:270,height:.843};
}
