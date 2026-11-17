import {addLandmarks,addZone,project} from "./layout.js";
import {eastCurb,eastRoadWidth,plazaAt} from "./plaza-layout.js";

const point=(x,y)=>({x,y});
const outline=vertices=>vertices.map(([x,y])=>point(x,y));
export const corridorBounds={minX:342,maxX:682,minY:-310,maxY:316};

// The west and east pavements follow the mapped street bends. Coordinates use the same
// projected metres as the palace and plaza, with x increasing east and y increasing south.
// [y, west building line, west kerb, east kerb, east building line]
export const corridorProfile=[
  [-292,466.4,482.1,515.2,539],[-270,467.5,482.4,515.7,537],[-247,467.3,481.3,516.1,535],
  [-222,450.2,479.8,516.1,532],[-176,451.1,478.9,516.3,539],[-147,452,478.7,516.5,539],
  [-134,454,479,516.7,536],[-88,461,480.2,515.8,536],[-73,465.3,480.7,515.9,536],
  [-20,466.6,482.1,516.3,538],[26,472.4,484.4,517,542],[62,473.1,485.7,518.1,542],
  [78,471.7,486,518.4,545],[124,471.7,486.2,518.4,543],[144,469.8,484.7,518.6,543],
  [177,468.9,483.1,519,537],[204,467.8,482,518.7,536],[238,468.2,482.3,518.6,538],
  [271,467.3,485.2,518.3,541],[287,462,487.4,518.9,558],[316,455,486.7,522.2,558]
];
export function corridorProfileAt(y){
  const first=corridorProfile[0],last=corridorProfile.at(-1);
  if(y<=first[0])return first.slice(1);
  if(y>=last[0])return last.slice(1);
  const right=corridorProfile.findIndex(row=>row[0]>=y);
  const before=corridorProfile[right-1],after=corridorProfile[right],t=(y-before[0])/(after[0]-before[0]);
  return before.slice(1).map((x,i)=>x+(after[i+1]-x)*t);
}
const profileBand=(from,to)=>outline([
  ...corridorProfile.map(row=>[row[from],row[0]]),
  ...corridorProfile.slice().reverse().map(row=>[row[to],row[0]])
]);
const plazaKerb=eastCurb(0)+eastRoadWidth;
export const corridorEastLandingKerb=outline([
  [515.2,-291.8],[517.1,-295.0],[518.8,-297.4],
  [plazaAt(plazaKerb,0).x,plazaAt(plazaKerb,0).y],[plazaAt(plazaKerb,7.2).x,plazaAt(plazaKerb,7.2).y]
]);
export const corridorEastLanding=[...corridorEastLandingKerb,
  plazaAt(48,7.2),plazaAt(48,0),point(533.7,-296.0),point(537.2,-293.0),point(538.8,-291.8)];
export const seoulPlazaCrossingLanding=outline([[518.8,280.8],[525.8,280.8],[525.8,294.6],
  [519.3,294.6],[517.5,290],[517.5,284.2]]);
const corridorForecourts=[
  outline([[445.5,74.5],[472.5,74.5],[472.5,125.5],[445.5,125.5]]),
  outline([[435.2,-228],[452.7,-228],[452.7,-166],[435.2,-166]]),
  // The rear passage runs around the south side of the exhibition hall.
  outline([[409.4,112.5],[438.9,112.5],[448.5,121.9],[448.5,125.5],[409.4,125.5]])
];
export const corridorSidewalks=[
  profileBand(1,2),profileBand(3,4),
  // The north landing flares west into the plaza while the avenue continues on its east side.
  outline([[448,-307],[475,-307],[480,-297],[481.6,-286.5],[469,-286.5],[461,-291],[448,-292]]),
  corridorEastLanding,
  // The lower Seoul Plaza frontage and the east approach to Cheonggye Plaza.
  outline([[518,174],[532,170],[553,188],[600,199],[610,244],[569,272],[548,297],[519,299]]),
  seoulPlazaCrossingLanding,
  outline([[516,-174],[523,-174],[526,-167],[525,-150],[519,-132]]),
  ...corridorForecourts
];
export const corridorMainRoad=profileBand(2,3);

const street=(name,vertices)=>({name,outline:outline(vertices)});
export const corridorBranches=[
  street("세종대로사거리",[[339,-288],[520,-288],[610,-283],[610,-249],[518,-249],[421,-252],[338,-252]]),
  street("세종대로21길 북쪽 진입부",[[413,-147],[486,-144],[492,-137],[480,-133],[412,-135]]),
  street("코리아나호텔 남쪽 진입부",[[423,-116],[489,-72],[484,-64],[417,-109]]),
  street("세종대로21길",[[420,63],[445,68],[489,68],[494,75],[484,78],[444,77],[417,69]]),
  street("세종대로20길",[[507,83],[594,83.3],[613,85],[613,93.4],[550,93.8],[508,94.1]])
];

const crossing=(name,x1,y1,x2,y2,width,street="avenue")=>{
  const a=point(x1,y1),b=point(x2,y2),length=Math.hypot(x2-x1,y2-y1);
  const dx=(y2-y1)*width/(length*2),dy=(x1-x2)*width/(length*2);
  return {name,a,b,width,street,outline:outline([[x1+dx,y1+dy],[x2+dx,y2+dy],[x2-dx,y2-dy],[x1-dx,y1-dy]])};
};
export const corridorCrossings=[
  crossing("세종대로사거리 서측 횡단보도",476.7,-247.8,476.8,-290.2,7.0,corridorBranches[0]),
  crossing("세종대로사거리 남측 횡단보도",480.1,-246,517.4,-246.3,6.0),
  crossing("세종대로사거리 북측 횡단보도",477,-290.5,517.9,-290.3,6.0),
  crossing("세종대로사거리 동측 횡단보도",521.0,-244,521.8,-295.1,6.0,corridorBranches[0]),
  crossing("세종대로21길 북쪽 횡단보도",472.4,-131,472.2,-146.9,5.2,corridorBranches[1]),
  crossing("코리아나호텔 앞 횡단보도",473.2,-70,472.1,-89.2,5.1,corridorBranches[2]),
  crossing("서울시의회 앞 골목 횡단보도",478.2,80.2,478.1,65.9,6.0,corridorBranches[3]),
  crossing("청계천로 북쪽 횡단보도",524.2,-168.8,522.9,-187.0,5.0,"stream-north"),
  crossing("청계천로 남쪽 횡단보도",524.1,-124.8,521.4,-146.1,5.0,"stream-south"),
  crossing("서울시청 북측 횡단보도",522.1,97.2,522.2,80.4,5.8,corridorBranches[4]),
  crossing("서울도시건축전시관 앞 횡단보도",483,104,522,99.3,6.6),
  crossing("대한문 앞 횡단보도",484.7,288.4,521.4,286.9,7.4)
];

export const corridorLandmarks=[
  project("서울도시건축전시관",37.56690,126.97674),
  project("대한성공회 서울주교좌성당",37.567064,126.976086),
  project("서울특별시의회",37.56763,126.97667),
  project("코리아나호텔",37.56823,126.97665),
  project("프레스센터",37.56743,126.97786),
  project("광화문빌딩",37.56957,126.97615),
  project("세종대로사거리",37.57021,126.97690)
];

export const corridorWalkSpine=outline([
  [474,287],[477.9,253],[477.5,218],[480,208],[480,200],[477.7,191],
  [476.6,168],[477.4,137],[477.4,103],[478.1,74],[478,47],[477,12],
  [473.8,-55],[473.2,-72.4],[472.1,-89],[472.3,-132],[472.2,-148],[472.7,-194],
  [473.1,-235],[476.7,-254],[476.8,-290],[472.5,-298],[469.5,-307]
]);

export const seoulPlazaApproach={...point(553.35,213),name:"서울광장"};
export const corridorEastWalkSpine=[seoulPlazaApproach,...outline([
  [553.35,217],[541,217],[530,202],[526,181],[520.8,169],[520.8,136],[524.5,125],[524.5,114],
  [524,98],[522.1,95],[522.2,82],[524,80],
  [526,0],[526,-111],[524,-125],[522.7,-137],[522,-145],[526,-150],[525,-168],[523.8,-179],
  [525,-187],[525,-231],[521,-244],[521.1,-250],[521.6,-284],[521.75,-292],[520.5,-297]
]),plazaAt(43,7.2)];

export function insideCorridorPolygon(x,y,vertices){
  let inside=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
    const a=vertices[i],b=vertices[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

export function inSejongCorridor(x,y){
  const {minX,maxX,minY,maxY}=corridorBounds;
  return x>=minX&&x<=maxX&&y>=minY&&y<=maxY;
}

export function corridorWalkable(x,y){
  if(corridorCrossings.some(({outline})=>insideCorridorPolygon(x,y,outline)))return true;
  if(corridorBranches.some(({outline})=>insideCorridorPolygon(x,y,outline)))return false;
  return corridorSidewalks.some(outline=>insideCorridorPolygon(x,y,outline));
}

addZone({name:"세종대로",contains:inSejongCorridor,walkable:corridorWalkable});
addLandmarks([seoulPlazaApproach,...corridorLandmarks]);
