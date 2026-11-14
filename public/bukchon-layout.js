import {addLandmarks,addObstacle,addZone,project} from "./layout.js";
import {gbEastOpenings,gbEastWall,gbEastWallX} from "./gyeongbok-perimeter.js";
import {gyeongbokTerrainHeight,samcheongLevel,sampleMeshHeight} from "./gyeongbok-terrain.js";
import {mmcaGroundHeight,mmcaLandmarks,mmcaWalkable} from "./mmca-layout.js";

// Read in the common map projection. The street bends and ridgeline follow the Seoul
// Hanok Portal walking map and Google Earth. Individual residential lots are interpreted.
export const bukchonBounds={minX:555,maxX:1160,minY:-1890,maxY:-844};
const point=([x,y,level=0])=>({x,y,level});
export const folkMuseumEastDoor=gbEastOpenings.find(({id})=>id==="folk-museum");
export const dongsipjagak=project("동십자각",37.5761083333,126.9794222222);

function makePath(name,kind,width,vertices){
  const points=vertices.map(point),half=width/2;
  function edge(side){
    return points.map((p,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      return {...p,x:p.x-side*dy/length*half,y:p.y+side*dx/length*half};
    });
  }
  const left=edge(-1),right=edge(1);
  const segments=points.slice(1).map((b,i)=>{
    const a=points[i],dx=b.x-a.x,dy=b.y-a.y;
    return {a,b,dx,dy,squared:dx*dx+dy*dy};
  });
  return {name,kind,width,points,left,right,outline:[...left,...right.slice().reverse()],segments,
    minX:Math.min(...points.map(p=>p.x))-half-3,maxX:Math.max(...points.map(p=>p.x))+half+3,
    minY:Math.min(...points.map(p=>p.y))-half-3,maxY:Math.max(...points.map(p=>p.y))+half+3};
}

// Samcheong-ro and Cheongwadae-ro centre lines follow OSM. The smooth street
// profile is relative to the palace forecourt and uses 30 m SRTM elevations.
function atY(y,rows){
  for(let i=1;i<rows.length;i++){
    const [start,value]=rows[i-1],[end,next]=rows[i];
    if(y>=end)return value+(next-value)*Math.max(0,(y-start)/(end-start));
  }
  return rows.at(-1)[1];
}
const mainAxis=[
  [-891,708],[-925.36,712.94],[-954.6,708.92],[-979.65,707.87],[-1013.42,706.55],[-1075.38,706.99],
  [-1148.96,707.87],[-1203.03,710.52],[-1241.63,712.9],[-1269.65,715.81],[-1306.47,725.87],
  [-1349.54,737.88],[-1382.01,746.35],[-1452.92,768.24],[-1466.25,773.41],[-1490,810],
  [-1511,840],[-1554,871.16],[-1590.63,891.01],[-1626.15,911.76],[-1679.43,911.23],
  [-1731.60,917.41],[-1831.5,930.29],[-1887,937.88]
];
const northAxis=[[-1466.25,773.41],[-1492.95,773.68],[-1568,773.8],[-1611,771.7],[-1660,765.2],
  [-1703,731.5],[-1724.9,714]];
const crosswalkSurvey=[
  ["동십자각 북쪽 횡단보도",-954.6,5.6,mainAxis],
  ["건춘문 앞 횡단보도",-1148.96,5.8,mainAxis],
  ["민속박물관 앞 횡단보도",-1349.54,5.6,mainAxis],
  ["청와대로 초입 횡단보도",-1492.95,5.6,northAxis],
  ["팔판길 입구 횡단보도",-1573,5.1,mainAxis],
  ["삼청로 위쪽 횡단보도",-1839,5.1,mainAxis]
];
const mainRows=[...new Set([...mainAxis.map(([y])=>y),-1030,-1145,-1280,-1400,-1515,-1660,-1780])].sort((a,b)=>b-a);
const section=(rows,offset=0)=>rows.map(y=>[atY(y,mainAxis)+offset,y,samcheongLevel(y)+(offset?.14:0)]);
const avenue=section(mainRows);
const eastPavement=section(mainRows,10);
const oldWallSamples=gbEastWall.map(({y})=>y).filter(y=>y< -949&&y> -1595);
const wallWalkRows=[...new Set([...oldWallSamples,...mainRows.filter(y=>y> -1467),
  ...northAxis.map(([y])=>y).filter(y=>y< -1467&&y> -1595),-1595])].sort((a,b)=>b-a);
function westEdges(y){
  const curb=atY(y,y>=-1466.25?mainAxis:northAxis)-6.8;
  const wall=y< -944?gbEastWallX(y):null;
  return [wall!=null?Math.min(curb-2.7,wall+.22):curb-6.3,curb];
}
const westCentre=y=>westEdges(y).reduce((sum,x)=>sum+x,0)/2;
function wallPavement(){
  const level=y=>samcheongLevel(y)+.14;
  const path=makePath("경복궁 동쪽 담장길","pavement",6.3,wallWalkRows.map(y=>[westCentre(y),y,level(y)]));
  const left=wallWalkRows.map(y=>point([westEdges(y)[0],y,level(y)]));
  const right=wallWalkRows.map(y=>point([westEdges(y)[1],y,level(y)]));
  return {...path,left,right,outline:[...left,...right.slice().reverse()],
    minX:Math.min(...left.map(({x})=>x))-3,maxX:Math.max(...right.map(({x})=>x))+3};
}
const northRoad=northAxis.map(([y,x])=>[x,y,samcheongLevel(y)]);
const northEastWalk=northAxis.map(([y,x])=>[x+10,y,samcheongLevel(y)+.14]);
const northWestWalk=[-1593,...northAxis.map(([y])=>y).filter(y=>y< -1593)].map(y=>[atY(y,northAxis)-10,y,samcheongLevel(y)+.14]);
const northMainWest=section([-1464,...mainRows.filter(y=>y< -1464)],-10);
const northLanding=[941,-1839,samcheongLevel(-1839)+.14],stoneStepsTop=[952,-1834,21.2],stairExit=[957,-1832,21.2];
const crosswalks=crosswalkSurvey.map(([name,y,width,axis])=>{
  const street=atY(y,axis),level=samcheongLevel(y);
  const west=axis===northAxis||y> -1466?westEdges(y)[1]-1.6:street-10;
  return makePath(name,"crosswalk",width,[[west,y,level+.14],[street,y,level],[street+11,y,level+.14]]);
});
const entrancePaths=gbEastOpenings.map(({id,name,x,y})=>{
  const pavement=westCentre(y),level=samcheongLevel(y)+.14;
  const west=x-(id==="palace-parking"?27:19);
  const height=x=>gyeongbokTerrainHeight({x,y})+.025;
  return makePath(name,"entrance",id==="palace-parking"?9.6:5.8,
    [[west,y,height(west)],[x-5,y,height(x-5)],[x,y,height(x)],[pavement+.5,y,level]]);
});
const geonchunCross=crosswalks[1],museumCross=crosswalks[2];
const crossingApproach=({points})=>points.at(-1);
const ridgeNorth=[970,-1820,17],ridgeJunction=[1009,-1792,13.2];
const ridgeSouth=[988,-1700,10.7],libraryNorth=[958,-1606,7.4];
const westLink=[755,-1370,samcheongLevel(-1370)+.14],libraryLink=[881,-1465,4.9],gamgodangTop=[914,-1414,4.1];
const angukJunction=[1059,-938,.35];
const stairs=makePath("삼청동 돌계단길","stairs",3.3,[
  [937,-1839,northLanding[2]],northLanding,[945,-1841,18.1],[947.2,-1840.1,18.1],[950,-1838,19.55],stoneStepsTop,stairExit
]);
const ridgeAlley=makePath("북촌로5나길","alley",5.2,[
  stairExit,[963,-1825,19.5],ridgeNorth,[984,-1811,15],
  [997,-1804,13.3],ridgeJunction,[1007,-1765,13],[998,-1734,12],ridgeSouth,[980,-1660,9.1],libraryNorth,
  [936,-1583,6.5],[908,-1562,5.7],libraryLink
]);
// Share the stair's final edge before the alley opens to its normal width.
ridgeAlley.left[0]=stairs.left.at(-1);
ridgeAlley.right[0]=stairs.right.at(-1);
ridgeAlley.outline=[...ridgeAlley.left,...ridgeAlley.right.slice().reverse()];
const lawnGrade=y=>samcheongLevel(-1735)+.14+(-1735-y)*.026;
const lawn=(name,vertices,height)=>({name,height,outline:vertices.map(([x,y])=>({x,y,level:height(y)}))});
export const bukchonLawns=[
  lawn("율곡로 쉼터",[[876,-948],[887,-944],[906,-944],[909,-938],[902,-930],[881,-931],[875,-938]],()=>.32),
  lawn("삼청로 위쪽 쉼터",[[928,-1726],[938,-1724],[948,-1730],[948,-1742],[939,-1749],[928,-1747]],lawnGrade)
];
// Street trees at the outer edge of public lawns and alley shoulders.
export const bukchonStreetTrees=[
  [878,-932,5.2],[903,-931,6.1],[945,-1731,6.5],[943,-1745,5.6],[856,-1400,7.2],[1069,-1741,6.4]
];

export const bukchonPaths=[
  makePath("삼청로","road",13.8,avenue),
  wallPavement(),
  makePath("삼청로 동편 인도","pavement",6.3,eastPavement),
  makePath("광화문 동편 인도","pavement",7.4,[
    [555.2,-878,0],[592,-878,0],[624,-880,0],[669,-883,0],[698,-892,0]
  ]),
  makePath("율곡로 북쪽 인도","pavement",8.1,[
    [717,-898,.14],[733,-900,.14],[753,-894,.14],[778,-915,.14],[807,-932,.22],[847,-946,.29],
    [889,-952,.31],[937,-951,.34],[984,-948,.35],[1020,-943,.35],angukJunction,
    [1095,-929,.35],[1138,-925,.35],[1150,-925,.35]
  ]),
  makePath("청와대로","road",12.2,northRoad),
  makePath("청와대로 동편 인도","pavement",4.5,northEastWalk),
  makePath("청와대로 서편 인도","pavement",4.5,northWestWalk),
  makePath("삼청로 북쪽 서편 인도","pavement",5,northMainWest),
  ...entrancePaths,...crosswalks,
  stairs,ridgeAlley,
  makePath("북촌로11나길","alley",4,[
    ridgeNorth,[977,-1831,15.8],[987,-1832,15],[1002,-1829,14.2],[1015,-1819,13.75],[1027,-1808,13.6]
  ]),
  makePath("북촌로11가길","alley",4.5,[
    ridgeJunction,[1023,-1792,13.55],[1035,-1794,13.85],[1043,-1786,14.05],[1046,-1766,13.75],[1049,-1746,13.12],
    [1048,-1731,12.6],[1040,-1718,12.1],[1028,-1715,11.75],[1008,-1713,11.45],ridgeSouth
  ]),
  makePath("가회동 한옥 골목","alley",3.8,[
    [1027,-1808,13.6],[1043,-1805,13.95],[1049,-1799,14.2],[1064,-1795,13.8],[1074,-1788,13.55],
    [1077,-1767,13.15],[1073,-1745,12.55],[1060,-1731,12.2],[1048,-1731,12.6]
  ]),
  makePath("화개길","lane",5.5,[
    westLink,[789,-1399,2.1],[819,-1430,2.9],[850,-1446,3.8],libraryLink,
    [903,-1478,5.2],[926,-1493,5.2],[944,-1507,5.2]
  ]),
  makePath("팔판길","lane",5.1,[
    [907,-1730,samcheongLevel(-1730)+.14],[888,-1727,9],[860,-1724,4.5],[868,-1692,4],[865,-1658,3.8],
    [846,-1624,3.25],[821,-1589,3.8],[807,-1569,5.1],[793,-1551,7.12],
    [785,-1544,samcheongLevel(-1544)+.14],[775,-1530,samcheongLevel(-1530)+.14],[767,-1520,samcheongLevel(-1520)+.14]
  ]),
  makePath("감고당길","lane",6,[
    angukJunction,[1037,-987,.6],[1016,-1045,1],[996,-1102,1.5],[978,-1160,2.05],[959,-1221,2.55],
    [946,-1280,2.95],[929,-1340,3.4],gamgodangTop,[902,-1434,4.4],libraryLink
  ])
];

function inPath(x,y,path){
  if(x<path.minX||x>path.maxX||y<path.minY||y>path.maxY)return false;
  const vertices=path.outline;
  let inside=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
    const a=vertices[i],b=vertices[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function inBukchon(x,y){
  return x>=bukchonBounds.minX&&x<=bukchonBounds.maxX&&y>=bukchonBounds.minY&&y<=bukchonBounds.maxY;
}
function lawnAt(x,y){
  return bukchonLawns.find(({outline})=>{
    let inside=false;
    for(let i=0,j=outline.length-1;i<outline.length;j=i++){
      const a=outline[i],b=outline[j];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  });
}
// Broad Samcheong-ro is crossed at the marked crossings. Narrower mixed-use lanes are
// continuous pedestrian space; stairs are a signed public link between the two levels.
export function bukchonWalkable(x,y){
  return bukchonPaths.some(path=>path.kind!=="road"&&inPath(x,y,path))||mmcaWalkable(x,y)||Boolean(lawnAt(x,y));
}
function samplePath(x,y,path){
  let nearest=Infinity,level=0;
  for(const {a,b,dx,dy,squared} of path.segments){
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/squared));
    const gap=(x-a.x-dx*t)**2+(y-a.y-dy*t)**2;
    if(gap>=nearest)continue;
    nearest=gap;level=a.level+(b.level-a.level)*t;
  }
  return {nearest,level};
}
const gradePaths=bukchonPaths.filter(path=>path.kind!=="crosswalk"&&path.kind!=="stairs"&&path.kind!=="entrance");
function levelLanding(x,y){
  const distance=Math.hypot(x-stoneStepsTop[0],y-stoneStepsTop[1]);
  return Math.max(0,Math.min(1,1-(distance-3.4)/5));
}
function streetGrade(x,y){
  if(y> -891||y< -1890)return 0;
  const mainGap=Math.abs(x-atY(y,mainAxis));
  const northGap=y>=northAxis.at(-1)[0]&&y<=northAxis[0][0]?Math.abs(x-atY(y,northAxis)):Infinity;
  const gap=Math.min(mainGap,northGap);
  // Let feeder lanes meet the same road profile before their slopes diverge.
  const weight=Math.max(0,Math.min(1,(19-gap)/12));
  return weight*weight*(3-2*weight);
}
export function bukchonSurfaceGrade({x,y}){
  let total=0,weight=0;
  for(const path of gradePaths){
    if(x<path.minX-64||x>path.maxX+64||y<path.minY-64||y>path.maxY+64)continue;
    const {nearest,level}=samplePath(x,y,path);
    const proximity=1/(1+(nearest/9)**2);
    total+=proximity*level;weight+=proximity;
  }
  const mainRoad=streetGrade(x,y),street=samcheongLevel(y);
  const natural=weight>0.00001?total/weight:street;
  let level=natural+(street-natural)*mainRoad;
  const landing=levelLanding(x,y);
  level+=(stoneStepsTop[2]-level)*landing;
  const wall=gbEastWallX(y);
  if(wall!==null){
    const distance=x-wall;
    const edge=Math.max(0,Math.min(1,1-distance/7));
    if(edge>0)level+=(gyeongbokTerrainHeight({x,y})-level)*edge;
  }
  return level;
}
export function bukchonGroundHeight({x,y}){
  if(!inBukchon(x,y))return null;
  const step=inPath(x,y,stairs)?stairLevel(x,y,stairs):null;
  const path=bukchonPaths.find(path=>path!==stairs&&inPath(x,y,path));
  const campus=mmcaGroundHeight(x,y),lawn=lawnAt(x,y);
  if(!path)return step??campus??lawn?.height(y);
  const height=sampleMeshHeight(bukchonSurfaceGrade,{x,y});
  return Math.max(height,step??-Infinity,campus??-Infinity,lawn?.height(y)??-Infinity);
}
// The two edges turn together at landings. Sampling the same quadrilateral as the
// renderer keeps the player's feet on its individual stone treads, even on a bend.
function stairLevel(x,y,path){
  for(const [i,{a,b}] of path.segments.entries()){
    const l0=path.left[i],r0=path.right[i],l1=path.left[i+1],r1=path.right[i+1];
    const uX=r0.x-l0.x,uY=r0.y-l0.y,vX=l1.x-l0.x,vY=l1.y-l0.y;
    const twistX=r1.x-l1.x-uX,twistY=r1.y-l1.y-uY;
    let u=.5,v=.5;
    for(let step=0;step<4;step++){
      const errX=l0.x+uX*u+vX*v+twistX*u*v-x,errY=l0.y+uY*u+vY*v+twistY*u*v-y;
      const acrossX=uX+twistX*v,acrossY=uY+twistY*v,alongX=vX+twistX*u,alongY=vY+twistY*u;
      const det=acrossX*alongY-acrossY*alongX;
      if(Math.abs(det)<.001)break;
      u-=(errX*alongY-errY*alongX)/det;
      v-=(acrossX*errY-acrossY*errX)/det;
    }
    if(u<-.001||u>1.001||v<-.001||v>1.001)continue;
    const count=Math.max(1,Math.ceil(Math.abs(a.level-b.level)/.16));
    const step=Math.max(0,Math.min(count-1,Math.floor(v*count)));
    return a.level+(b.level-a.level)*(step+.5)/count;
  }
  return samplePath(x,y,path).level;
}
// Ground details and building foundations use the same levels as the street meshes.
export function bukchonTerrain(x,y){
  return mmcaGroundHeight(x,y)??lawnAt(x,y)?.height(y)??
    sampleMeshHeight(bukchonSurfaceGrade,{x,y});
}
export const bukchonLandmarks=[
  {...point([697,-891]),name:"동십자각 앞"},
  {...geonchunCross.points[0],name:"건춘문 앞 횡단보도"},
  {...crossingApproach(geonchunCross),name:"국립현대미술관 서울 앞"},
  {...folkMuseumEastDoor},
  {...crossingApproach(museumCross),name:"국립민속박물관 앞 삼청로"},
  {...point([860,-1724]),name:"팔판길"},
  {...point([940,-1839]),name:"삼청동 돌계단길 아래"},
  {...point([955,-1832]),name:"삼청동 돌계단길 · 북촌 8경"},
  {...point([1009,-1791]),name:"북촌로5나길"},
  {...point([1050,-1746]),name:"가회동 한옥 골목"},
  {...point([914,-1414]),name:"감고당길"},
  {...point([1136,-925]),name:"안국역 1번 출구 앞"},
  ...gbEastOpenings.filter(({id})=>id!=="folk-museum"),
  ...crosswalks.filter(path=>path!==geonchunCross&&path!==museumCross).map(path=>({...crossingApproach(path),name:path.name})),
  ...bukchonLawns.map(({name,outline})=>({name,x:outline.reduce((sum,p)=>sum+p.x,0)/outline.length,
    y:outline.reduce((sum,p)=>sum+p.y,0)/outline.length}))
];
export const bukchonShortcuts=[
  {label:"삼청로",aria:"삼청로로 순간이동",...bukchonLandmarks[4],heading:0},
  {label:"북촌 8경",aria:"삼청동 돌계단길로 순간이동",...bukchonLandmarks[7],heading:144},
  {label:"한옥 골목",aria:"가회동 한옥 골목으로 순간이동",...bukchonLandmarks[9],heading:20}
];
// These fronts are fictional shops. Their door thresholds are on the corresponding lane.
export const bukchonShopPlots={
  churu:{x:724.3,y:-970.3,w:7.8,d:5.7,angle:-Math.PI/2,level:.72},
  coffee:{x:799.7099,y:-1418.6517,w:7.8,d:5.6,angle:.8018,level:2.5},
  crepe:{x:872.1877,y:-1673.8129,w:7.8,d:5.6,angle:-1.6588,level:3.896},
  beer:{x:989.1470,y:-1676.0586,w:7.8,d:5.6,angle:-1.7682,level:9.788}
};

addZone({name:"삼청동 · 북촌",contains:inBukchon,walkable:bukchonWalkable});
addLandmarks([...bukchonLandmarks,...mmcaLandmarks]);
export function registerBukchonTrees(){
  for(const [x,y,height] of bukchonStreetTrees)addObstacle(x,y,height*.092,height*.092);
}
