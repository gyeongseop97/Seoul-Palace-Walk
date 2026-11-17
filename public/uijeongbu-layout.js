import {insidePlazaPolygon,plazaAt} from "./plaza-layout.js";

const points=pairs=>pairs.map(([east,north])=>plazaAt(east,north));
// Footprint reference: © OpenStreetMap contributors (way 26268329), with pedestrian
// access checked against https://mediahub.seoul.go.kr/archives/2011545.
export const uijeongbuOutline=points([
  [43,441],[109.9,446],[108.4,474.4],[119,475.4],[118.8,486],[129.4,486.9],
  [125.2,545],[124,552.9],[87.9,547.7],[78.6,543.9],[70.6,538.7],[64.1,532.7],
  [55,523.3],[39.6,507.8],[34.4,492.2],[34.5,449.9]
]);
// Positions read off the map and aerial survey directly, in the world's own metres.
const origin=plazaAt(0,0);
const surveyed=pairs=>pairs.map(([x,y])=>plazaAt(x-origin.x,origin.y-y));
// Sajik-ro between Gwanghwamun and Dongsipjagak. Its north kerb swings up to the palace wall
// once it is clear of the woldae, and the carriageway is some 34 m wide from there on.
export const sajikNorthKerb=surveyed([[512.1,-855.1],[530.6,-870.5],[552.1,-881.3],[576.7,-887.4],
  [607.5,-890.5],[638.3,-894.5],[655,-899]]);
export const sajikEastRoad=[
  ...points([[20,529],[35,527],[56,539],[74,548],[96,551],[131,555],[173,560]]),
  ...sajikNorthKerb.slice().reverse(),...points([[20,551]])
];
export const uijeongbuSideRoad=[
  ...points([[34,431],[108.5,434.5],[128.5,435],[134.2,440.6],[137.5,453.5],
    [146.5,478],[157.3,495.2],[174,519],[190.1,538.3]]),
  // Jongno 1-gil fans out to four lanes where it meets the Dongsipjagak junction.
  ...surveyed([[686,-843.6],[700.8,-851.3],[704,-862],[706.6,-870.6],[682.5,-868.5]]),
  ...points([[196.2,565.1],[183.4,543.7],[166.2,523.7],[149.1,499.9],[139,483.7],
    [129.8,459],[126,449.1],[122.3,444.8],[107.2,443.1],[34,439]])
];
export const uijeongbuEntry=plazaAt(42.1,448.4,"의정부지 역사유적광장");
export const uijeongbuGarden=plazaAt(114.6,528,"의정부지 후원");
export const uijeongbuBusBerth=plazaAt(166,569.8);
export const uijeongbuBusPavement=points([
  [133,559.5],[153,563.1],[172.4,566.25],[190,568.7],[191,556.5],[174,553.2],
  [151,550.6],[136,548.3],[129,543.8],[124.9,537.6],[121.5,539.8],[124.3,548.9]
]);

// The main entrance opens from the avenue. The north crossing reaches the
// palace apron and the south edge footpath reaches the arcade across Jongno 1-gil.
export const uijeongbuConnections=[
  points([[29,490],[40,490],[40.6,509],[44,513],[39,519],[33,513],[29,512]]),
  points([[36.4,505.6],[45.4,509.5],[34.5,563.4],[23.5,560.3]]),
  points([[38.6,428.8],[49.3,429.8],[48.9,445.6],[40.2,443.7]]),
  points([[124,534],[135.5,536.3],[139.7,552.5],[130,553.9],[121.5,542.5]]),
  points([[120.5,483.9],[154.1,472.2],[157.3,480.2],[125,490.2]]),
  // The east pavement of Jongno 1-gil, bending round the widened mouth to the junction corner.
  [...points([[137.5,443.6],[144.4,442.1],[160.5,477],[173.9,495.9],[190.6,521]]),
    ...surveyed([[681,-830],[692.5,-838.8],[706.3,-849],[700.5,-851.5],[686.5,-843.2],[674,-833.6]]),
    ...points([[174,519],[157.3,495.2],[146.5,478],[137.5,453.5],[134.2,440.6]])],
  points([[47,434],[128,440],[135.7,442],[137.5,446.7],[125,446],[47,440]]),
  // The broad pavement under the palace wall, from the woldae to where Bukchon's survey takes over.
  surveyed([[514.5,-857.5],[530.6,-871],[552.1,-881.8],[556,-882.4],[556,-901.2],[514.5,-900.2]]),
  // The west pavement of Jongno 1-gil, from the bus stop to its crossing.
  surveyed([[672.4,-868.6],[678.6,-865.6],[664.6,-840.9],[659.6,-843.5]])
];
// The marked crossing over Jongno 1-gil just south of the junction.
export const jongnoCrossing={from:{x:663.3,y:-844.6},to:{x:678.9,y:-835.3},width:4.8};
const crossingStrip=(({from,to,width})=>{
  const length=Math.hypot(to.x-from.x,to.y-from.y),nx=-(to.y-from.y)/length*width/2,ny=(to.x-from.x)/length*width/2;
  return surveyed([[from.x-nx,from.y-ny],[from.x+nx,from.y+ny],[to.x+nx,to.y+ny],[to.x-nx,to.y-ny]]);
})(jongnoCrossing);
const markedCrossing=(name,outline,road)=>({name,outline,road,left:[outline[0],outline[3]],right:[outline[1],outline[2]]});
const [eastNear,eastFar,eastFarRight,eastNearRight]=uijeongbuConnections[4];
export const uijeongbuCrossings=[
  markedCrossing("광화문 동쪽 사직로 횡단보도",uijeongbuConnections[1],sajikEastRoad),
  markedCrossing("의정부지 남쪽 횡단보도",uijeongbuConnections[2],uijeongbuSideRoad),
  markedCrossing("의정부지 동쪽 횡단보도",[eastNear,eastNearRight,eastFarRight,eastFar],uijeongbuSideRoad),
  markedCrossing("종로1길 횡단보도",crossingStrip,uijeongbuSideRoad)
];
export const uijeongbuPavedConnections=[0,3,5,6,7,8];

export const arcadeForecourt=points([[146.5-9*10.2/24.5,467.8],[170.5,467.8],[170.5,470],[159.5,470],
  [159.5,486],[170.5,486],[170.5,488.2],[146.5+10.8*10.2/17.2,488.2],[146.5,478]]);

export const uijeongbuWalks=[
  {width:4.2,points:points([[40,450],[38,477],[38.5,494],[44.7,508.6],[45.1,512.7],[53.2,515.9],
    [63.4,526.4],[78.1,538.2],[95.1,542.8],[119.8,547.5]])},
  {width:4.2,points:points([[45,447.1],[71,450.3],[96.2,449.8],[96.3,469.2],[98.6,475.2],
    [101,478],[111.5,477.8],[116.1,481.6],[116.3,485.8],[124.6,491.5],[121.7,519],
    [123.1,529.5],[123,535.2],[119.4,544.9]])},
  {width:4.0,points:points([[38,490.5],[53.8,492.6],[60.9,495.9],[72.2,495.7],[89,499],[95.5,503.1]])},
  {width:3.9,points:points([[45.8,466.5],[57.4,469],[73,471.3],[86.6,472],[91.8,472.2],[103.2,478.1]])},
  {width:3.5,points:points([[84,452.2],[92.4,462.4],[94.5,475.2],[99.7,487],[112,496.4],[117.2,507.4]])},
  {width:3.8,points:points([[55.3,517.8],[59.1,515.3],[71.2,517.5],[85.5,520.4],[96.2,526.8],
    [108,531.1],[113.9,532.5],[122.1,532.5]])}
];
export const uijeongbuRemains=[
  {name:"협선당 터",east:61.2,north:508.3,width:20,length:9.1,columns:6,rows:3},
  {name:"정본당 터",east:66.4,north:486.1,width:25.2,length:12.2,columns:7,rows:4},
  {name:"석획당 터",east:71.5,north:465.4,width:20.4,length:9.2,columns:6,rows:3}
];

export function isUijeongbuWalkable(x,y){
  return [uijeongbuOutline,uijeongbuBusPavement,arcadeForecourt,crossingStrip,...uijeongbuConnections].some(outline=>insidePlazaPolygon(x,y,outline));
}
