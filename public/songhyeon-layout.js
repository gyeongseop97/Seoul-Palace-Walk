import {addLandmarks,addObstacle,addZone} from "./layout.js";

// Mapped footprint and footways in the shared metre projection. © OpenStreetMap contributors.
// https://www.openstreetmap.org/way/424080008 · https://www.openstreetmap.org/copyright
// The planting plan follows the publicly open green plaza and the Seoul city visitor guide.
// https://mediahub.seoul.go.kr/archives/2005988
const pt=([x,y])=>({x,y});
const polygon=vertices=>vertices.map(pt);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const within=(x,y,{minX,maxX,minY,maxY})=>x>=minX&&x<=maxX&&y>=minY&&y<=maxY;
const bounds=(points,margin=0)=>({
  minX:Math.min(...points.map(point=>point.x))-margin,maxX:Math.max(...points.map(point=>point.x))+margin,
  minY:Math.min(...points.map(point=>point.y))-margin,maxY:Math.max(...points.map(point=>point.y))+margin
});
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

export const songhyeonOutline=polygon([
  [746.6,-930.7],[755.4,-930.3],[755,-922.2],[768.7,-924.3],[792.8,-922.8],[802.8,-914],
  [890.6,-903.3],[977.5,-883.2],[983.8,-885.8],[997,-904.9],[1005.4,-908.4],[995.7,-936.3],[981,-932.4],
  [971.6,-962.8],[980.9,-967],[979.5,-973.9],[964.7,-1050.3],[907.9,-1052.1],[898,-1132.6],[880.3,-1130.5],
  [878.6,-1093.6],[858.8,-1062.6],[843,-1066.4],[843.7,-1074],[820.8,-1086.3],[818.1,-1065.9],
  [805.7,-1067.7],[794.6,-1019.6],[762.8,-964.1]
]);
const parkBounds=bounds(songhyeonOutline);

function inside(x,y,outline){
  let hit=false;
  for(let i=0,j=outline.length-1;i<outline.length;j=i++){
    const a=outline[i],b=outline[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
  }
  return hit;
}
export function inSonghyeon(x,y){return within(x,y,parkBounds)&&inside(x,y,songhyeonOutline);}
const region=(name,vertices)=>({name,outline:polygon(vertices)});
export const songhyeonLawns=[
  region("중앙잔디광장",[[859,-1049],[881,-1044],[903,-1038],[916,-1015],[928,-991],[930,-969],[924,-942],
    [915,-922],[893,-922],[871,-925],[851,-930],[827,-937],[819,-946],[817,-972],[825,-1005],[838,-1025]]),
  region("감고당길 잔디",[[941,-961],[966,-966],[974,-938],[984,-934],[990,-917],[974,-908],
    [958,-914],[938,-921],[930,-928]])
];
export const songhyeonBeds=[
  region("율곡로 입구 마당",[[764,-934],[777,-934],[794,-928],[802,-920],[805,-937],[801,-950],[780,-954]]),
  region("서편 들꽃 군락",[[772,-961],[797,-997],[813,-1011],[816,-1001],[807,-980],[803,-950],[785,-949]]),
  region("종친부길 쪽 꽃단지",[[803,-1027],[811,-1059],[831,-1064],[846,-1055],[853,-1047],[838,-1034],[823,-1015]]),
  region("북쪽 소나무 쉼터",[[887,-1124],[896,-1127],[901,-1086],[902,-1064],[888,-1058],[875,-1069],[884,-1091]]),
  region("북쪽 야생화 정원",[[873,-1044],[900,-1041],[905,-1027],[878,-1029],[852,-1027]]),
  region("감고당길 들꽃 군락",[[916,-1048],[940,-1050],[961,-1050],[970,-1000],[975,-977],[954,-976],
    [937,-981],[932,-1006],[922,-1023]]),
  region("남쪽 야생화 화단",[[824,-927],[855,-918],[880,-913],[892,-910],[865,-907],[838,-910],[814,-913]])
].map(bed=>({...bed,bounds:bounds(bed.outline)}));

function path(name,kind,width,vertices){
  const points=polygon(vertices),half=width/2;
  const edge=side=>points.map((p,index)=>{
    const a=points[Math.max(0,index-1)],b=points[Math.min(points.length-1,index+1)],length=distance(a,b);
    return {x:p.x-(b.y-a.y)*side*half/length,y:p.y+(b.x-a.x)*side*half/length};
  });
  const left=edge(-1),right=edge(1);
  return {name,kind,width,points,left,right,outline:[...left,...right.slice().reverse()],bounds:bounds(points,half+.4)};
}
const paths=[
  path("북쪽 산책로","park",4.3,[[828.3,-1083.7],[838.8,-1068.2],[848,-1059.3],[853.1,-1055.8],[859.2,-1053.4],
    [879.6,-1049.2],[892.7,-1046.5],[907.5,-1044.6],[927.3,-1043.8],[941.4,-1045],[955.8,-1047.4],[965.6,-1048.7],[975,-1050.1]]),
  path("서쪽 산책로","park",4.7,[[877.1,-1117.1],[887.4,-1112.3],[892.4,-1100.3],[892.1,-1083.2],[875.3,-1062.8],
    [859.2,-1053.4],[851,-1046],[843.8,-1038.2],[835.8,-1028.4],[825.6,-1017.9],[816.1,-998.7],[812.4,-984.7],
    [812.2,-957.6],[813,-944.7],[808.5,-936.9],[800,-911]]),
  path("남쪽 산책로","park",4.9,[[808.5,-936.9],[823.4,-931.7],[841.5,-926.4],[854.7,-922.4],[867.7,-919.4],
    [880.5,-916.8],[897.4,-916.1],[916.7,-915.8],[943.3,-912.2],[963.6,-908],[977.4,-903.6],[990.5,-895.8],[1009.1,-888.6]]),
  path("율곡로 가운데 진입로","park",4.1,[[879,-898.1],[880.5,-916.8]]),
  path("동쪽 산책로","park",4.7,[[916.7,-915.8],[921.7,-929],[925.7,-940.8],[933.3,-970],[933.2,-983.9],[931.2,-997.1],
    [926.8,-1009.4],[920.9,-1018.9],[909.9,-1030.9],[907.5,-1044.6]]),
  path("소나무와 잔디 사이 길","park",3.8,[[792.7,-1024.7],[825.6,-1017.9],[850.4,-1020.7],[864.5,-1022.3],
    [873.1,-1023.7],[879.7,-1024.7],[891.9,-1026.8],[909.9,-1030.9]]),
  path("감고당길 진입로","park",4.4,[[990.6,-978.5],[963,-971.2],[953.6,-970.5],[942,-968.8],[933.3,-970]])
];
export const songhyeonPaths=[...paths,
  path("율곡로1길 북촌 진입로","link",4,[[718,-1108],[740,-1107.6],[766,-1103.7],[787.4,-1100],[809.2,-1092.5],[828.3,-1083.7]]),
  path("종친부길","link",3.6,[[740,-921],[758.1,-960.5],[791.3,-1019.1],[792.7,-1024.7],[809.2,-1092.5]]),
  path("율곡로1길 안쪽 보도","link",3.9,[[828.3,-1083.7],[845.3,-1074.6],[860.6,-1068.4],
    [875.2,-1093.5],[877.1,-1117.1],[877.6,-1134.1],[878.4,-1166.5]])
];
export const songhyeonBounds=bounds([...songhyeonOutline,...songhyeonPaths.flatMap(path=>path.outline)],12);

function intersection(a,b,c,d){
  const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,det=ux*vy-uy*vx;
  if(Math.abs(det)<.0001)return null;
  const dx=c.x-a.x,dy=c.y-a.y,t=(dx*vy-dy*vx)/det,u=(dx*uy-dy*ux)/det;
  return t>=0&&t<=1&&u>=0&&u<=1?{t,sine:Math.abs(det)/(Math.hypot(ux,uy)*Math.hypot(vx,vy))}:null;
}
export const songhyeonEntrances=[],songhyeonWalls=[];
for(let i=0;i<songhyeonOutline.length;i++){
  const a=songhyeonOutline[i],b=songhyeonOutline[(i+1)%songhyeonOutline.length],length=distance(a,b);
  const cuts=[];
  for(const {points,width,name} of paths)for(let j=1;j<points.length;j++){
    const match=intersection(a,b,points[j-1],points[j]);
    if(!match)continue;
    const gate=mix(a,b,match.t),half=Math.min(5.9,(width/2+.9)/Math.max(.4,match.sine))/length;
    songhyeonEntrances.push({...gate,name});
    cuts.push([Math.max(0,match.t-half),Math.min(1,match.t+half)]);
  }
  let from=0;
  for(const [start,end] of cuts.sort((a,b)=>a[0]-b[0])){
    if((start-from)*length>.28)songhyeonWalls.push([mix(a,b,from),mix(a,b,start)]);
    from=Math.max(from,end);
  }
  if((1-from)*length>.28)songhyeonWalls.push([mix(a,b,from),b]);
}

export const songhyeonLandmarks=[
  {x:867,y:-977,name:"열린송현녹지광장",heading:322,tilt:-5},
  {x:803,y:-918,name:"열린송현 율곡로 입구"},
  {x:955,y:-971,name:"송현 감고당길 입구"},
  {x:837,y:-1069,name:"열린송현 종친부길 입구"}
];
export const songhyeonBenches=[
  [818,-950,1.2],[849,-931,-.18],[897,-923,.13],[925,-945,1.10],[935,-986,-Math.PI/2],
  [922,-1041,Math.PI],[884,-1044,Math.PI],[822,-1004,-1.18],[886.9,-1115,-Math.PI/2]
];
export const songhyeonTrees=[
  [768,-942,6.1],[777,-943,7],[785,-952,5.6],[796,-969,6.1],[790,-984,7.3],[806,-1016,7.5],[812,-1042,7.9],
  [817,-1054,6.3],[832,-1059,7.7],[843,-1053,6.4],[875,-1065,7.2],[892,-1073,6.7],[894,-1097,8.4],
  [889,-1124,7.9],[908,-1048,5.8],[946,-1047,6.5],[959,-1036,7.8],[965,-1017,6.5],[970,-993,5.8],
  [954,-978,6.9],[970,-952,6.3],[978,-925,7.5],[958,-919,5.8],[941,-919,6.8],[913,-911,5.3],
  [867,-912,5.9],[847,-915,7.4],[824,-919,6.2],[818,-927,5.7]
];
export function songhyeonReserved(x,y,margin=0){
  const {minX,maxX,minY,maxY}=parkBounds;
  if(!within(x,y,songhyeonBounds))return false;
  if(inSonghyeon(x,y)||songhyeonPaths.some(path=>path.kind==="link"&&within(x,y,path.bounds)&&inside(x,y,path.outline)))return true;
  if(x<minX-margin||x>maxX+margin||y<minY-margin||y>maxY+margin)return false;
  if(!margin)return false;
  for(let i=0;i<songhyeonOutline.length;i++){
    const a=songhyeonOutline[i],b=songhyeonOutline[(i+1)%songhyeonOutline.length],dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
    if(Math.hypot(x-a.x-dx*t,y-a.y-dy*t)<margin)return true;
  }
  return false;
}

export function songhyeonWalkable(x,y){
  if(!within(x,y,songhyeonBounds))return false;
  if(songhyeonPaths.some(path=>within(x,y,path.bounds)&&inside(x,y,path.outline)))return true;
  return inSonghyeon(x,y)&&!songhyeonBeds.some(bed=>within(x,y,bed.bounds)&&inside(x,y,bed.outline));
}
export function songhyeonGrade(x,y){
  const westLink=.27*Math.max(0,1-Math.abs(y+1108)/15)*Math.max(0,Math.min(1,1-(x-718)/37));
  return .14+(-y-902)*.00285+(x-840)*.00075+westLink;
}
export function songhyeonGroundHeight(x,y){
  if(!within(x,y,songhyeonBounds))return null;
  return (inSonghyeon(x,y)||songhyeonPaths.some(path=>within(x,y,path.bounds)&&inside(x,y,path.outline)))?songhyeonGrade(x,y):null;
}

addZone({name:"열린송현녹지광장",contains:(x,y)=>within(x,y,songhyeonBounds),walkable:songhyeonWalkable});
addLandmarks(songhyeonLandmarks);
let obstaclesRegistered=false;
export function registerSonghyeonNavigation(benches){
  if(!obstaclesRegistered){
    for(const [a,b] of songhyeonWalls)addObstacle((a.x+b.x)/2,(a.y+b.y)/2,distance(a,b),.55,
      Math.atan2(a.y-b.y,b.x-a.x),1.2);
    for(const [x,y] of songhyeonTrees)addObstacle(x,y,.41,.41);
    for(const [x,y,angle] of songhyeonBenches)addObstacle(x,y,2.25,.61,angle,.82);
    obstaclesRegistered=true;
  }
  for(const [x,y,angle] of songhyeonBenches){
    const dx=Math.sin(angle),dy=Math.cos(angle),heading=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
    benches.push({x,y,slots:[-.54,.54].map(offset=>{
      const sx=x+dy*offset,sy=y-dx*offset;
      return {x:sx,y:sy,heading,approach:{x:sx+dx*.9,y:sy+dy*.9}};
    }),catPerch:{x,y,height:.49,heading:angle,approach:{x:x+dx,y:y+dy}}});
  }
}
