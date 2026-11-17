// MMCA Seoul campus, aligned to the former command building's brick façade.
// The public routes and major footprints follow the museum plan and surveyed footways.
export const mmcaFrame={x:772.9,y:-1283.4,angle:-.17};
const cosine=Math.cos(mmcaFrame.angle),sine=Math.sin(mmcaFrame.angle);
export const mmcaAt=(east,south)=>({
  x:mmcaFrame.x+east*cosine+south*sine,
  y:mmcaFrame.y-east*sine+south*cosine
});
const local=(x,y)=>{
  const dx=x-mmcaFrame.x,dy=y-mmcaFrame.y;
  return [dx*cosine-dy*sine,dx*sine+dy*cosine];
};
const area=(name,vertices)=>({name,vertices,outline:vertices.map(([x,y])=>mmcaAt(x,y))});
const rect=(west,east,north,south)=>[[west,north],[east,north],[east,south],[west,south]];
export const mmcaEducationCore={west:-9.75,east:25.80,north:-51.80,south:-25.4,vertices:rect(-9.75,25.80,-51.80,-25.4)};
export const mmcaEducationColumns=[[-9.6,-49.3],[24.5,-49.3],[-.6,-8.5],[24.5,-8.5]];
export const mmcaCourtyards=[
  area("열린마당",[[-43,-14],[-18,-17],[-11,-10],[24,-10],[44,-4],[55,4],[58,24],[38,30],[-14,31],[-25,31],[-43,23]]),
  area("미술관마당",[[21,4],[82,4],[85,13],[84,40],[78,47],[47,47],[39,53],[11,51],[10,29]]),
  area("종친부 마당",[[82,4],[119,4],[123,19],[125,57],[116,65],[92,64],[77,50],[78,30]]),
  area("삼청로 진입마당",[[-37,29],[-12,29],[-10,113],[9,113],[15,126],[0,140],[-33,148],[-34,127],[-30,109],[-32,82],[-38,60]]),
  area("교육동 아래 통로",rect(-1.9,25.87,-25.2,-7))
];
export const mmcaLawns=[
  area("열린마당 잔디",[[-34,12],[-26,10],[-18,12],[-9,16],[-7,23],[-9,27],[-19,29],[-29,26],[-34,21]]),
  area("미술관마당 잔디",[[62,14],[72,12],[79,16],[80,23],[74,28],[64,27],[60,22]])
];
const building=(id,name,west,east,north,south,height,vertices=rect(west,east,north,south))=>({
  id,...area(name,vertices),west,east,north,south,height
});
export const mmcaBuildings=[
  building("education","교육동",-11,26,-52,-7,8.9,[[-10,-52],[26,-52],[26,-7],[-2,-7],[-2,-25],[-11,-25]]),
  building("gallery","전시동",26,81,-48,-5,9.1),
  building("glass","서울박스",81,112,-49,-6,10.9),
  building("lobby","전시동 로비",52,80,42,72,8.1),
  building("cafe","카페테리아",2,52,49,63,4.7),
  building("brick","구 국군기무사령부 본관",-16,2,27,113,12.7,[
    [-10.7,27],[-7,27],[2,28],[2,113],[-15.4,113],[-16,36],[-15.9,33.1],[-15.2,30.6],[-14,28.7],[-12.5,27.5]
  ]),
  building("brickWing","구 기무사 본관 동쪽 날개",2,41,66,113,11),
  building("brickRear","전시동 남쪽 날개",44,72,73,112,9.2),
  building("gyeonggeundang","종친부 경근당",92,108,7,30,5.6),
  building("okcheopdang","종친부 옥첩당",103,115,35,54,4.6)
];
export const mmcaTrees=[[-25,16,8.8],[-18,22,9.1],[-10,23,8.5],[70,19,6.8],[113,59,6.1]];
export const mmcaPlanters=[[-4,14,4.2,2.0],[10,14,4.6,2.3],[22,20,3.8,1.8],[61,29,5.1,2.1],[-19,114,5.2,2.3]];
export const mmcaLamps=[[-27,6],[-25,32],[-27,59],[-23,107],[19,12],[56,34],[85,37]];
export const mmcaBenches=[[29,14],[60,18],[79,42]];
export const mmcaSign=[-26,3];
export const mmcaLandmarks=[
  {...mmcaAt(-7,6),name:"국립현대미술관 서울 · 열린마당",heading:90,tilt:-7},
  {...mmcaAt(51,12),name:"미술관마당"},
  {...mmcaAt(83,24),name:"종친부 마당"}
];

function contains(x,y,vertices){
  let inside=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
    const [ax,ay]=vertices[i],[bx,by]=vertices[j];
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }
  return inside;
}
function nearBuilding(x,y,{west,east,north,south,vertices},margin){
  if(x<west-margin||x>east+margin||y<north-margin||y>south+margin)return false;
  return contains(x,y,vertices)||vertices.some(([ax,ay],i)=>{
    const [bx,by]=vertices[(i+1)%vertices.length],dx=bx-ax,dy=by-ay;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(x-ax-t*dx,y-ay-t*dy)<margin;
  });
}
function onCampus(x,y){
  return x>=-44&&x<=126&&y>=-58&&y<=149;
}
export function mmcaReserved(x,y,margin=0){
  const [east,south]=local(x,y);
  return east>=-43-margin&&east<=125+margin&&south>=-57-margin&&south<=148+margin;
}
function isGroundBuilding(east,south){
  return mmcaBuildings.some(building=>nearBuilding(east,south,building.id==="education"?mmcaEducationCore:building,.28))||
    mmcaEducationColumns.some(([x,z])=>Math.hypot(east-x,south-z)<.58);
}
export function mmcaBlocked(x,y){return isGroundBuilding(...local(x,y));}
export function mmcaWalkable(x,y){
  const [east,south]=local(x,y);
  return onCampus(east,south)&&mmcaCourtyards.some(({vertices})=>contains(east,south,vertices))&&
    !isGroundBuilding(east,south)&&
    !mmcaTrees.some(([tx,ty])=>Math.hypot(east-tx,south-ty)<.72)&&
    !mmcaLamps.some(([tx,ty])=>Math.hypot(east-tx,south-ty)<.34)&&
    !mmcaBenches.some(([px,py])=>Math.abs(east-px)<1.66&&Math.abs(south-py)<.56)&&
    !mmcaPlanters.some(([px,py,w,d])=>Math.abs(east-px)<w/2+.28&&Math.abs(south-py)<d/2+.28)&&
    (Math.abs(east-mmcaSign[0])>.63||Math.abs(south-mmcaSign[1])>1.68);
}
export function mmcaGround(east,south){
  return 2.20-.00885*south+.001*Math.max(0,east+31);
}
export function mmcaGroundHeight(x,y){
  const [east,south]=local(x,y);
  return onCampus(east,south)&&mmcaCourtyards.some(({vertices})=>contains(east,south,vertices))?mmcaGround(east,south):null;
}
