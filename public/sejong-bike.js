// The game racks sit on public sidewalks next to the real neighbourhoods they serve.
export const bikeDocks=[
  {id:"city-hall",name:"시청역 앞 따릉이",x:470.5,y:271,heading:270,access:{x:474,y:271}},
  {id:"cheonggye",name:"청계광장 옆 따릉이",x:548,y:-156,heading:90,access:{x:545,y:-156}},
  {id:"gwanghwamun",name:"광화문광장 따릉이",x:436.8,y:-305,heading:270,access:{x:440,y:-305}},
  {id:"gyeongbokgung",name:"경복궁 앞 따릉이",x:398.8,y:-862.4,heading:270,access:{x:402,y:-862.4}},
  {id:"jeongdong-fountain",name:"정동 분수대 옆 따릉이",x:154,y:275,heading:205,access:{x:152.6,y:278}},
  {id:"seoul-plaza",name:"서울광장 북쪽 따릉이",x:550,y:213,heading:90,access:{x:553.35,y:213}},
  {id:"city-council",name:"서울시의회 앞 따릉이",x:480,y:22,heading:270,access:{x:476.65,y:22}},
  {id:"culture-shelter",name:"문화쉼터 옆 따릉이",x:436,y:-504,heading:90,access:{x:439.35,y:-504}},
  {id:"plaza-east",name:"광화문광장 동편 따릉이",x:529,y:-570,heading:270,access:{x:525.65,y:-570}},
  {id:"palace-museum",name:"국립고궁박물관 앞 따릉이",x:360,y:-957,heading:270,access:{x:356.65,y:-957}},
  {id:"folk-museum",name:"국립민속박물관 앞 따릉이",x:588,y:-1470,heading:90,access:{x:591.35,y:-1470}},
  {id:"bukchon-dongsip",name:"동십자각 북쪽 따릉이",area:"bukchon",x:719.5,y:-1008,heading:270,access:{x:716.5,y:-1008}},
  {id:"bukchon-mmca",name:"국립현대미술관 서울 앞 따릉이",area:"bukchon",x:729.8,y:-1263,heading:270,access:{x:726.8,y:-1263}},
  {id:"bukchon-folk",name:"삼청로 민속박물관 쪽 따릉이",area:"bukchon",x:707.8,y:-1330,heading:90,access:{x:710.8,y:-1330}},
  {id:"bukchon-samcheong",name:"삼청동 위쪽 따릉이",area:"bukchon",x:936,y:-1770,heading:270,access:{x:933,y:-1770}},
  {id:"bukchon-anguk",name:"안국역 쪽 따릉이",area:"bukchon",x:1100,y:-923.2,heading:180,access:{x:1100,y:-926.2}}
];

export const bikeDockReach=3.2;
export const bikeMountReach=2.7;
export const bikePassengerBoardSpeed=.18;
export const bikePassengerOffset=.8;
export const bikeParkDuration=10*60_000;
export const bikeRackSize={width:4.12,depth:1.8};
export const isBikeDriver=position=>Boolean(position?.bike&&!position.bike.parked);
export const isBikePassenger=position=>Boolean(position?.bikeRide?.driver);
export const isCycling=position=>isBikeDriver(position)||isBikePassenger(position);

export function bikePassengerPose(driver){
  const heading=driver.heading??0,angle=heading*Math.PI/180;
  return {x:driver.x-Math.sin(angle)*bikePassengerOffset,y:driver.y+Math.cos(angle)*bikePassengerOffset,heading};
}

function rackApproach(dock,point){
  const angle=(180-dock.heading)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const dx=point.x-dock.x,dy=point.y-dock.y;
  const localX=dx*c-dy*s,localY=dx*s+dy*c;
  // The rack collider adds a pedestrian margin. Aim just outside its nearest edge.
  const halfWidth=bikeRackSize.width/2+.30,halfDepth=bikeRackSize.depth/2+.30;
  let x=Math.max(-halfWidth,Math.min(halfWidth,localX));
  let y=Math.max(-halfDepth,Math.min(halfDepth,localY));
  if(x===localX&&y===localY){
    if(halfWidth-Math.abs(x)<halfDepth-Math.abs(y))x=(Math.sign(x)||1)*halfWidth;
    else y=(Math.sign(y)||1)*halfDepth;
  }
  return {x:dock.x+x*c+y*s,y:dock.y-x*s+y*c};
}

export function nearBikeDock(point,canReach=()=>true){
  if(!point)return null;
  const within=target=>Math.hypot(point.x-target.x,point.y-target.y)<=bikeDockReach;
  return bikeDocks.find(dock=>
    within(dock.access)&&canReach(dock.access)||
    within(dock)&&canReach(rackApproach(dock,point)))??null;
}
