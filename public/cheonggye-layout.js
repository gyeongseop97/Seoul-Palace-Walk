import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {insideCorridorPolygon} from "./sejong-corridor-layout.js";

const point=(x,y)=>({x,y});
const ring=vertices=>vertices.map(([x,y])=>point(x,y));
const clamp=value=>Math.max(0,Math.min(1,value));
const between=(a,b,t)=>a+(b-a)*t;
const depth=3.75;
export const cheonggyeBounds={minX:520,maxX:1056,minY:-188,maxY:-83};

// Projected metres along the water and the inner banks. Sources: OpenStreetMap
// ways 368276771, 156922847 and 377289811, checked against the waterway map
// and access guide published by Seoul Facilities Corporation.
const profile=[
  [624,-151.5,8.9,8.1],[645,-150.6,8.6,7.2],[688,-148.2,8.8,6.5],
  [724,-145.6,8.0,6.5],[765,-141.9,8.0,7.0],[803,-138.2,8.5,7.2],
  [842,-134.4,8.2,7.0],[868,-131.8,8.0,7.2],[912,-127.1,9.1,7.5],
  [949,-123.5,9.4,7.6],[976,-120.2,10.1,8.0],[1017,-115.1,9.0,8.0],
  [1056,-110.2,8.3,8.1]
];
export const cheonggyeStations=profile.map(([x])=>x);
export function riverAt(x){
  const end=profile.findIndex(row=>row[0]>=x);
  if(end===0)return profile[0].slice(1);
  if(end<0)return profile.at(-1).slice(1);
  const a=profile[end-1],b=profile[end],t=(x-a[0])/(b[0]-a[0]);
  return a.slice(1).map((value,i)=>between(value,b[i+1],t));
}
export function bankAt(x,side,inset=0){
  const [y,north,south]=riverAt(x);
  return point(x,y+side*((side<0?north:south)+inset));
}
export function streamBand(sides,x1=624,x2=1056){
  const xs=[x1,...cheonggyeStations.filter(x=>x>x1&&x<x2),x2];
  return [...xs.map(x=>bankAt(x,...sides[0])),...xs.reverse().map(x=>bankAt(x,...sides[1]))];
}
const plaza=ring([[518.1,-167.8],[531.3,-171.8],[548.5,-170.7],[591,-166.85],[604,-165.1],
  [610,-161.3],[622.9,-159.6],[627.2,-156.1],[624,-152.8],[621,-146.9],[619.8,-144.75],
  [599.6,-145],[580,-146.62],[573,-147.0],[568,-147.1],[555.3,-144.9],
  [535.6,-140.6],[524.4,-132.6],[519.7,-133.3],[522.4,-144.6],[519.2,-152.6]]);
const walkersNorth=streamBand([[-1,-3.35],[-1,.2]]);
const walkersSouth=streamBand([[1,-3.15],[1,.2]]);
const water=streamBand([[-1,-3.26],[1,-3.08]]);
const northWalk=streamBand([[-1,3.5],[-1,6.9]]);
const southWalk=streamBand([[1,4],[1,7.6]]);
const northRoad=streamBand([[-1,6.9],[-1,12.1]]);
const southRoad=streamBand([[1,7.6],[1,12.3]]);
const northFrontage=streamBand([[-1,12.05],[-1,16.7]]);
const southFrontage=streamBand([[1,12.25],[1,17.0]]);
export const cheonggyeRoadLeads=[
  {name:"청계천로 북쪽",outline:ring([[514.6,-185.4],[536,-179.6],[578,-176.2],
    [624,-172.65],[624,-167.3],[578,-170.65],[536,-174.3],[517.3,-179.3]])},
  {name:"청계천로 남쪽",outline:ring([[515.9,-132.8],[535.5,-145.6],[578,-141.6],
    [624,-135.8],[624,-130.6],[578,-136.9],[537,-140.3],[519.6,-127.6]])}
];

const ribbon=(points,width)=>{
  const offset=points.map((p,i)=>{
    const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
    const dx=next.x-prev.x,dy=next.y-prev.y,scale=width/(2*Math.hypot(dx,dy));
    const cap=i===0?-.27:i===points.length-1?.27:0,along=cap/Math.hypot(dx,dy);
    const x=p.x+dx*along,y=p.y+dy*along;
    return {a:point(x-dy*scale,y+dx*scale),b:point(x+dy*scale,y-dx*scale)};
  });
  return [...offset.map(({a})=>a),...offset.reverse().map(({b})=>b)];
};
function access(name,vertices,width,kind){
  const points=ring(vertices);
  return {name,kind,points,width,outline:ribbon(points,width)};
}
export const cheonggyeAccess=[
  access("청계광장 남쪽 경사로",[[570.7,-145.9],[580,-145.3],[600,-143.3],[620,-143.1],[635,-144.1]],2.55,"ramp"),
  access("청계광장 북쪽 계단",[[609,-164.2],[623.5,-162.6],[630.7,-162],[639,-157.7]],2.7,"steps"),
  access("모전교 하류 북쪽 경사로",[[704,-166],[710,-165.6],[733.5,-163.8],[750,-162.3],[753,-157],[751,-151]],2.45,"ramp"),
  access("모전교 남쪽 계단",[[749,-128.8],[751.5,-132.8],[756,-136.1]],3.0,"steps"),
  access("광통교 북쪽 계단",[[855,-151.7],[861.2,-150.8],[870,-146],[873.4,-138.5]],2.5,"steps"),
  access("광교 북쪽 계단",[[951.5,-143.6],[963,-142.8],[968.7,-138.7],[960.5,-131]],2.6,"steps"),
  access("광교 동편 출입계단",[[1025,-98.5],[1031,-99.8],[1040,-101.7],[1046,-105.1]],3.15,"steps")
];

const approachNorth=access("청계광장 북쪽 보도",[[537.4,-170.8],[568,-169.7],[609.8,-165.7],[624,-165.35]],3.25,"paving");
const approachSouth=access("청계광장 남쪽 보도",[[525.3,-132.9],[538.6,-138.3],[563.4,-138.7],[595,-137.7],[624,-137.6],[638,-137.6]],4.2,"paving");
const startRamp=access("청계광장 경사로 입구",[[561,-151],[566,-148.1],[570.83,-145.86]],3.65,"paving");
const sidePlaza=access("청계광장 보도 연결",[[536,-165],[540,-169],[548,-172.05],[559,-171]],3.7,"paving");
// Both levels overlap under the street bridges. The low pedestrian arch,
// with approaches right at the water, belongs to the lower route.
export const cheonggyeBridges=[
  {name:"모전교",style:"mojeon",x:688,north:-168.3,south:-127.9,width:17,skew:-2.6},
  {name:"광통교",style:"stone",x:841.7,north:-155.2,south:-116.7,width:12.2,skew:-1.35},
  {name:"수변 보행교",style:"wood",x:912.3,north:-134.8,south:-121.4,width:3.05,skew:-1.1},
  {name:"광교",style:"road",x:994.6,north:-142.1,south:-100.5,width:44,skew:-2.7}
].map(bridge=>{
  const {x,north,south,width,skew,style}=bridge;
  const footprint=ribbon([point(x,north),point(x+skew,south)],width);
  const offsets=style==="wood"||style==="stone"?[0]:[width/2-1.45,1.45-width/2];
  const lane=(centre,width)=>({centre,width,outline:ribbon(centre,width)});
  const lanes=offsets.map(offset=>lane([point(x+offset,north-.7),point(x+offset+skew,south+.7)],
    style==="wood"?3.15:style==="stone"?width-1:2.9));
  return {...bridge,footprint,paths:lanes.map(({outline})=>outline),lanes};
});
const footbridge=cheonggyeBridges.find(({style})=>style==="wood");
const decks=cheonggyeBridges.filter(({style})=>style!=="wood");
const deckLanes=decks.flatMap(({lanes})=>lanes);
const crossings=deckLanes.flatMap(({centre:[a,b],width})=>[-1,1].map(side=>{
  const p=side<0?a:b;
  const inside=bankAt(p.x,side,4.8),outside=bankAt(p.x,side,15.6);
  return access("청계천로 횡단 연결",[[inside.x,inside.y],[p.x,p.y],[outside.x,outside.y]],Math.max(3.55,Math.min(6.1,width)),"crossing");
}));
export const stepStoneXs=[654,657.1,660.2,663.3,666.4,669.5];
const stepping=stepStoneXs.map(x=>{
  const north=bankAt(x,-1,-3.22),south=bankAt(x,1,-3.05);
  return ribbon([north,south],1.05);
});
const steppingWay=ribbon([bankAt(660,-1,-3.6),bankAt(660,1,-3.55)],1.8);
export const cheonggyeSurfaces=[
  {kind:"road",outline:northRoad},{kind:"road",outline:southRoad},
  {kind:"plaza",outline:plaza},approachNorth,approachSouth,startRamp,sidePlaza,
  {kind:"paving",outline:northWalk},{kind:"paving",outline:southWalk},
  {kind:"paving",outline:northFrontage},{kind:"paving",outline:southFrontage},...crossings,
  {kind:"lower",outline:walkersNorth},{kind:"lower",outline:walkersSouth},
  {kind:"water",outline:water},{kind:"wood",outline:footbridge.footprint},
  {kind:"stones",outline:steppingWay},...cheonggyeAccess,
  ...decks.map(({footprint})=>({kind:"bridge",outline:footprint}))
];

const inside=(outline,x,y)=>insideCorridorPolygon(x,y,outline);
const surfaceKinds=kinds=>cheonggyeSurfaces.filter(({kind})=>kinds.includes(kind)).map(({outline})=>outline);
const accessWalks=cheonggyeAccess.map(({outline})=>outline);
const upperWalks=surfaceKinds(["plaza","paving","crossing"]);
const lowerWalks=surfaceKinds(["lower","wood","stones"]);
const walkPolygons=[...accessWalks,...upperWalks,...lowerWalks];
const polygonTest=(outline=>{
  const xs=outline.map(p=>p.x),ys=outline.map(p=>p.y),lowX=Math.min(...xs),highX=Math.max(...xs),lowY=Math.min(...ys),highY=Math.max(...ys);
  return (x,y)=>x>=lowX&&x<=highX&&y>=lowY&&y<=highY&&inside(outline,x,y);
});
const onWalk=walkPolygons.map(polygonTest),onDeck=deckLanes.map(({outline})=>polygonTest(outline));
const onLower=lowerWalks.map(polygonTest),onUpper=upperWalks.map(polygonTest);
export function inCheonggye(x,y){
  const {minX,maxX,minY,maxY}=cheonggyeBounds;
  return x>=minX&&x<=maxX&&y>=minY&&y<=maxY;
}
export function cheonggyeWalkable(x,y){
  return inCheonggye(x,y)&&onWalk.some(contains=>contains(x,y));
}
export const cheonggyeRailOpening=(x,y)=>cheonggyeAccess.some(({outline})=>inside(outline,x,y));

function accessProgress({points,width,outline},x,y){
  if(!inside(outline,x,y))return null;
  let best=width*width,elapsed=0,progress=0;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    const u=clamp(((x-a.x)*dx+(y-a.y)*dy)/(length*length));
    const gap=(x-a.x-dx*u)**2+(y-a.y-dy*u)**2;
    if(gap<best){best=gap;progress=elapsed+length*u;}
    elapsed+=length;
  }
  return progress/elapsed;
}
export function cheonggyeLevel({x,y,up}){
  if(!inCheonggye(x,y))return null;
  if(up&&onDeck.some(contains=>contains(x,y)))return .12;
  for(const route of cheonggyeAccess){
    const t=accessProgress(route,x,y);
    if(t!=null)return -depth*(route.kind==="steps"?Math.floor(t*23)/23:t)+.04;
  }
  if(inside(footbridge.footprint,x,y)){
    const t=clamp((y-footbridge.north)/(footbridge.south-footbridge.north));
    return -depth+.25+Math.sin(t*Math.PI)*.71;
  }
  if(onLower.some(contains=>contains(x,y)))return -depth;
  return onUpper.some(contains=>contains(x,y))?.04:null;
}
export const cheonggyeBedLevel=-depth;
export function cheonggyeDeckStep(from,x,y){
  if(!inCheonggye(x,y)&&!inCheonggye(from.x,from.y))return undefined;
  const bridge=onDeck.some(contains=>contains(x,y));
  const onBridge=from.up&&onDeck.some(contains=>contains(from.x,from.y));
  if(onBridge){
    if(bridge)return {up:true};
    return onUpper.some(contains=>contains(x,y))?{up:false}:null;
  }
  if(bridge&&(cheonggyeLevel(from)??0)>-.28&&(cheonggyeLevel({x,y})??0)<.2)return {up:true};
  return undefined;
}
export function cheonggyeDeckExits({x,y,up}){
  if(!up||!inCheonggye(x,y))return null;
  const index=onDeck.findIndex(contains=>contains(x,y));
  if(index===-1)return null;
  const [a,b]=deckLanes[index].centre;
  const length=Math.hypot(a.x-b.x,a.y-b.y),ux=(b.x-a.x)/length,uy=(b.y-a.y)/length;
  return [point(a.x-ux*.62,a.y-uy*.62),point(b.x+ux*.62,b.y+uy*.62)];
}
export function cheonggyeConnection(from,to){
  const a=cheonggyeLevel(from),b=cheonggyeLevel(to);
  return a==null||b==null||Math.abs(a-b)<=.36;
}

const place=(name,x,y,description)=>({name,x,y,description});
export const cheonggyeLandmarks=[
  place("청계광장",558,-159,"세종대로와 청계천이 만나는 광장입니다. 동쪽의 분수와 폭포에서 물길이 시작되며, 남쪽 경사로와 북쪽 계단으로 수변에 내려갈 수 있습니다."),
  place("팔석담",652,-145.3,"청계천 상류에 전국 여덟 지역의 돌을 놓아 만든 얕은 못입니다. 모전교 방향으로 걷다 보면 폭포 아래에 펼쳐집니다."),
  place("모전교",682.1,-163.4,"청계광장 쪽에서 만나는 첫 번째 다리입니다. 과일을 파는 가게가 있던 자리에서 이름을 얻었습니다."),
  place("광통교",834.5,-148.8,"조선 시대에 놓인 돌다리입니다. 교각에는 신덕왕후의 옛 능에서 가져온 석물과 구름무늬가 남아 있습니다."),
  place("광교",977.1,-106.9,"남대문로가 청계천을 건너는 곳입니다. 광교 아래와 양쪽 수변길에서 물길을 따라 걸을 수 있습니다.")
];
export const cheonggyeTrees=[
  [538,-167.4,6.4],[552,-166.5,6.8],[584,-161.7,6.3],[603,-156.6,6.9],[549,-146.3,6.5],
  [564,-143,5.8],[612,-144.4,5.6],[653,-164.2,6.3],[711,-160.0,5.7],[785,-152.5,5.5],
  [817,-148.2,6.2],[881,-143.6,6.8],[929,-138.9,6.4],[947,-134.2,5.1],[1042,-124,5.9]
];
export const cheonggyeAnimalTrails=[
  ring([[534,-160],[555,-160],[575,-155],[591,-154],[605,-152]]),
  cheonggyeStations.filter(x=>x>=645&&x<=949).map(x=>bankAt(x,1,-1.3)),
  cheonggyeStations.filter(x=>x>=645&&x<=949).map(x=>bankAt(x,-1,-1.5))
];
let registered=false;
export function registerCheonggyeNavigation(){
  if(registered)return;
  registered=true;
  addObstacle(553.8,-157.2,4.5,4.3);
  for(const [x,y] of cheonggyeTrees)addObstacle(x,y,.38,.38);
}
addZone({name:"청계천",contains:inCheonggye,walkable:cheonggyeWalkable,connects:cheonggyeConnection});
addLandmarks(cheonggyeLandmarks);
