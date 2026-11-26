import {addLandmarks,addObstacle,addZone,fountain} from "./layout.js";
import {fixedOutlineTest} from "./ground-index.js";

const point=([x,y])=>({x,y});
const points=coordinates=>coordinates.map(point);
const site=(name,x,y)=>({name,x,y});

// Public routes follow the existing, georeferenced palace perimeter. The northern
// through-route is divided into the alley, open deck and Sejong-daero approach.
// https://news.seoul.go.kr/safe/archives/500255
// https://mediahub.seoul.go.kr/archives/1258463
export const jeongdongExtensionLandmarks=[
  site("평성문 앞",177.5,159),
  site("고종의 길 입구",155.3,79),
  site("정동공원",18,24),
  site("영국대사관 옆 돌담길",305,111.5),
  site("덕수궁 북쪽 보행로",371,127),
  site("세종대로19길",450,129)
];

const [pyeongseong,gojongGate,park]=jeongdongExtensionLandmarks;
const path=(name,width,surface,coordinates)=>({name,width,surface,points:points(coordinates)});
const northWalkwayEdges=[
  points([[323.3,114.6],[324,114.7],[334.5,115.8],[349.6,118.8],[360.7,122.4],[374.4,125.4],[387,125.9],[388.2,126]]),
  points([[323.3,119.7],[324.2,119.8],[334,120.6],[348.3,123.5],[359.4,127.3],[373.8,130.4],[386.7,131.1],[388.2,131.2]])
];
export const jeongdongExtensionPaths=[
  path("덕수궁 서쪽 돌담길",6.1,"stone",[
    [fountain.x+5.4,fountain.y+2.6],[fountain.x+9.3,fountain.y-3.4],
    [176,270],[177.4,254],[177.4,223],[177.5,192],[178.3,174],[pyeongseong.x,pyeongseong.y],
    [177.6,143],[174.5,126],[170.2,110],[165.1,91],[160.3,76],[155.4,60],
    [155.1,48],[155.7,37],[162.1,30.8],[179,28.8],[208,28.1],[217.8,29.5]
  ]),
  path("영국대사관 옆 돌담길",4.5,"stone",[
    [216.8,29.3],[225.1,33.5],[232.5,40.8],[242.2,54.7],[248.8,70.3],
    [252.8,86.3],[259.4,93.7],[284.1,101.1],[297,107.7],[311.5,114.5],[325,117.6]
  ]),
  {...path("덕수궁 북쪽 보행로",5.1,"deck",[
    [323.4,117.2],[334.2,118.2],[348.8,121.1],[360,124.9],[374.1,127.9],[388.1,128.6]
  ]),edges:northWalkwayEdges},
  path("세종대로19길",5.4,"brick",[
    [387,128.4],[402.1,129],[423.4,128.6],[442.1,127.9],[453,128.2],[466,127.8],[478.4,127.9]
  ]),
  path("고종의 길",3.8,"stone",[
    [162.1,81.7],[gojongGate.x,gojongGate.y],[141.6,75.1],[127,70],[109.5,65.2],
    [88.6,58],[69.4,47.8],[52.9,37.3],[33.2,30.5],[park.x,park.y]
  ])
];
export const jeongdongExtensionBounds={minX:-35,maxX:483,minY:8,maxY:293};

function basis(points,index){
  const before=points[Math.max(0,index-1)],after=points[Math.min(points.length-1,index+1)];
  const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy);
  return {x:dy/length,y:-dx/length};
}
export function extensionEdge(points,offset){
  return points.map(({x,y},index)=>{
    const normal=basis(points,index);
    return {x:x+normal.x*offset,y:y+normal.y*offset};
  });
}
export const extensionRibbon=(points,half)=>[...extensionEdge(points,half),...extensionEdge(points,-half).reverse()];

const parkCourt=points([[8,17],[24,15],[33,20],[35,34],[27,43],[12,39],[6,30]]);
const footprints=[parkCourt,...jeongdongExtensionPaths.map(({points,width,edges})=>
  edges?[...edges[0],...edges[1].slice().reverse()]:extensionRibbon(points,width/2))];
const pathTests=footprints.map(fixedOutlineTest);
export const jeongdongParkCourt=parkCourt;

const wall=(kind,height,coordinates)=>({kind,height,points:points(coordinates)});
export const jeongdongBoundaryWalls=[
  // The path-facing exterior around the U.S. ambassador's residence has both
  // high stone panels and grille bays over the stone base. The public road stays open.
  wall("residence-stone",2.35,[[171.8,265],[173.8,251],[173.8,228],[173.7,191],[174.0,174]]),
  wall("residence-grille",2.95,[[174,174],[173.5,158],[173.8,141],[170.8,125],[166.3,107],[161.6,92]]),
  wall("residence-stone",2.28,[[161.6,92],[151.3,88.1],[137.4,83.2],[124.7,78.8]]),
  wall("brick",2.15,[[150.5,73],[149,60],[147.9,47],[148.6,34],[158.2,23.7],[180,22],[208.6,21.7],
    [220.9,23.5],[230.1,28],[239.3,37.4],[249.6,51.8],[255,67],[259.7,83],[264.2,88.2],
    [286.8,94.7],[301,102.2],[313.2,108.7],[325,112.8]]),
  ...northWalkwayEdges.map(edge=>({kind:"rail",height:1.04,points:edge.slice(1,-1)})),
  wall("brick",1.62,[[385.9,124.1],[401.9,124.5],[422.7,124.2],[441.5,123.9]]),
  wall("stone",1.75,[[151.2,75.3],[138.2,70.8],[123,65.6],[109.8,61.4],[90.6,54.5],[71,44.8],
    [55.3,34],[34,26.3]]),
  wall("brick",1.9,[[123.8,76.6],[108.2,69.7],[86.9,62.3],[67.6,51.8],[50.5,40.5],[31.8,35]])
];

export function extensionSegments(points){
  return points.slice(1).map((b,index)=>{
    const a=points[index],dx=b.x-a.x,dy=b.y-a.y;
    return {a,b,x:(a.x+b.x)/2,y:(a.y+b.y)/2,length:Math.hypot(dx,dy),angle:-Math.atan2(dy,dx)};
  });
}

export const extensionBoundaryDepth=kind=>kind==="rail"?.18:kind==="residence-grille"?.54:.58;
export const pyeongseongGate={x:183.42,y:159,angle:Math.PI/2};
let registered=false;
export function registerJeongdongExtension(){
  if(registered)return;
  registered=true;
  const {minX,maxX,minY,maxY}=jeongdongExtensionBounds;
  addZone({
    name:"덕수궁 돌담길",
    contains:(x,y)=>x>=minX&&x<=maxX&&y>=minY&&y<=maxY,
    walkable:(x,y)=>pathTests.some(contains=>contains(x,y))
  });
  addLandmarks(jeongdongExtensionLandmarks);
  for(const {points,kind} of jeongdongBoundaryWalls){
    for(const segment of extensionSegments(points)){
      addObstacle(segment.x,segment.y,segment.length+.13,extensionBoundaryDepth(kind),segment.angle);
    }
  }
  addObstacle(pyeongseongGate.x,pyeongseongGate.y,6.25,1.72,pyeongseongGate.angle);
}
