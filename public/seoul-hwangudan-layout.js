import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {insideCorridorPolygon,seoulPlazaApproach} from "./sejong-corridor-layout.js";
import {southWorldSurfaceHeight} from "./gyeongbok-terrain.js";

const point=(x,y)=>({x,y});
const outline=coordinates=>coordinates.map(([x,y])=>point(x,y));
const ground=(name,kind,coordinates)=>({name,kind,outline:outline(coordinates)});
const path=(name,width,coordinates,kind="walk")=>({name,width,kind,points:outline(coordinates)});
const place=(name,x,y,heading,tilt,description)=>({...point(x,y),name,heading,tilt,description});
const building=(id,name,height,levels,coordinates)=>({id,name,height,levels,outline:outline(coordinates)});

export const hwangudanBounds={minX:519,minY:175,maxX:892,maxY:438};
export const hwangudanGate={x:658.3,y:297,angle:1.17};
export const hwangudanGateApron={halfWidth:6.7,rampEnd:5.25,end:7.65};
export const hwangunggu={x:721.1,y:309.35,radius:8.48};
export const hwangudanStoneGate={x:714.6,y:343.1,angle:.414,width:11.65};
export const hwangudanHotelPorch={x:714.9,y:368,angle:.08};
export const hwangudanDrums=outline([[695.4,333.3],[694.5,336.7],[693.65,339.9]]);
export const hwangudanRelics=outline([[744.4,315.9],[746,316.6],[747.3,318.1]]);

export const hwangudanLandmarks=[
  place("환구단 정문",652.3,294.45,113,-12,"2007년 우이동에서 다시 발견된 환구단의 정문입니다. 2009년 소공동의 지금 자리로 옮겨 복원했고, 주변에는 2025년 열린 정원이 조성됐습니다."),
  place("황궁우",716.3,321.45,22,-25,"1899년에 지은 3층 팔각 건물로, 하늘의 신위를 모셨습니다. 환구단 본단은 일제강점기에 철거됐고 황궁우는 그 자리에 남아 있습니다."),
  place("환구단 석고",698.8,336.7,270,0,"1902년 고종의 즉위 40주년을 기념해 만든 돌북 세 개입니다. 제례에 쓰는 악기를 형상화하고 몸체에 용을 새겼습니다."),
  place("환구단 삼문",720.1,340.35,243,0,"돌로 만든 홍예 세 개가 있는 문입니다. 서울광장 쪽의 목조 정문과 함께 환구단에 남아 있는 옛 시설입니다."),
  place("웨스틴 조선 서울",705.5,370.6,97,-21,"옛 환구단 본단이 있던 자리에 들어선 호텔입니다. 호텔 북쪽 정원에 황궁우와 석고, 삼문이 남아 있습니다.")
];

// Plan positions and tower heights from OpenStreetMap. Simplified rings retain
// the major corners and setbacks without copying any map tiles into the scene.
export const hwangudanBuildings=[
  building("plaza-hotel","더 플라자",87,22,[[532.1,349.6],[537.6,339.7],[543.9,336.8],[555.9,339],[559.3,336],[613.7,340.6],[622.4,355.7],[626.1,356.1],[626.1,363.8],[565.1,362.1]]),
  building("president-hotel","프레지던트 호텔",90,28,[[671.1,250.1],[678.8,234.2],[684.3,226.5],[692.8,220.7],[702,218.3],[716.8,217.6],[715.6,261.2],[693.7,279.3],[686.5,256.3]]),
  building("president-annex","",55,14,[[671.1,250.1],[686.5,256.3],[693.7,279.3],[687.2,290],[665.8,278.8],[664.2,281.8],[656.6,277.8]]),
  building("president-service","",8.3,2,[[665.8,278.8],[687.2,290],[680.1,295.6],[662,286.4]]),
  building("sogong-office","소공로",59,16,[[648.9,312.1],[668.7,320.2],[656.8,355.7],[652.6,357.3],[644.7,341],[644.1,335.3],[645.1,328.5]]),
  building("westin","웨스틴 조선 서울",56,18,[[765.3,344.8],[757.7,354.5],[750.8,358.9],[742.8,361.7],[733.1,362.9],[723.2,361.9],[721.2,379.9],[731.7,381],[740.1,384.5],[748.7,391.5],[753.9,397.7],[757.6,405.9],[776.1,398.7],[771.4,386.1],[771.6,378.2],[774.6,365.6],[780.4,355.5]]),
  building("westin-wing","",10.3,2,[[725.1,382.6],[732.9,383.2],[742.3,387.6],[749.7,394.8],[753.7,404.9],[751,412.2],[746.9,414.4],[737.5,413],[729.6,408.3],[721.5,400.2],[717.8,392.1],[720.2,385.8]]),
  building("westin-ballroom","",12.3,3,[[786.4,356.7],[794.6,359.4],[798,366.5],[799,371.1],[798.1,382],[793.8,391],[789.6,395.3],[781.8,396.6],[775.4,389.9],[774,380.7],[776.2,368.7],[779.5,361.3]]),
  building("lotte-hotel","롯데호텔 서울",150,37,[[740.4,280.3],[764.6,280.3],[764.5,268.8],[869.4,269.2],[872.6,296.7],[846,295.9],[846.1,302.1],[751.2,300.6],[751.7,294.6],[739.6,293.8]]),
  building("lotte-office","",75,20,[[732.7,220.1],[789.9,219.9],[789.8,268.9],[764.5,268.8],[764.6,280.3],[732.9,280.3]])
];

// The 2025 redesign retained a roughly 4,580 m² oval lawn within the granite plaza.
// The western frontage joins Sejong-daero's pavement and the east follows Eulji-ro.
// https://plaza.seoul.go.kr/archives/247
const seoulPlazaPerimeter=[[520.5,183],[547,179],[574,180],[595,186],[606,202],[616,218],
  [620,233],[621,245],[617,259],[614,276],[606,296],[596,309],[580,319],[550,322],
  [534,313],[525,297],[520,279],[519.5,241],[519.7,211]];
export const seoulPlazaOutline=outline(seoulPlazaPerimeter);
export const seoulPlazaLawn=Array.from({length:64},(_,index)=>{
  const angle=index*Math.PI/32,c=Math.cos(.13),s=Math.sin(.13);
  const x=Math.cos(angle)*34.4,y=Math.sin(angle)*42.4;
  return point(568.6+x*c-y*s,239+x*s+y*c);
});
const eastPavement=[[649,286],[655,270],[653,263],[666,238],[671,224],[678,216],[690,212],[717,209],
  [718,217.5],[704,219],[692,222],[681,231],[674,245],[663,265],[655,286],[650,307],[644,310],[641,306]];
const gardenFootprint=[[652,284],[660.5,288],[682.6,298],[692.2,287],[705.3,276],[718.5,270.8],
  [724,286],[740.2,283.8],[739.6,293.8],[748,297.5],[755,305],[760,318.5],[765,320.5],[782,315],
  [784,323],[757,334],[723,348],[708,351],[700,349.2],[666.3,340.6],[673.4,318],[643.7,306.4]];

export const hwangudanGround=[
  {name:"서울광장",kind:"paving",outline:seoulPlazaOutline},
  ground("을지로 남쪽 보도","paving",eastPavement),
  ground("환구단 열린 정원","garden",gardenFootprint),
  ground("환구단 정문 앞마당","paving",[[645,288],[653,280.7],[660.5,285],[661,290],[669,293.5],[666,301],[659,308],[643.7,306.4]]),
  ground("서울광장 앞 횡단보도","crossing",[[615.4,242.8],[650.8,256.1],[648,263.2],[613.3,250.5]]),
  ground("을지로","road",[[651,194],[665.8,199],[633,295],[625,312],[613,320],[594,325],[589,314],[605,306],[613,294]]),
  ground("소공로","road",[[591,310],[613,312],[633,321],[671,369],[709,417],[700,427],[654,377],[615,331],[593,325]]),
  ground("웨스틴 조선 서울 진입로","paving",[[638,313],[646,309],[674,319],[668,340],[699,349],[712,351],[717,362],[711,380],[700,385],[679,368],[661,362],[650,357],[641,342]])
];

export const hwangudanPaths=[
  path("서울광장 동쪽 산책로",5.5,[[seoulPlazaApproach.x,seoulPlazaApproach.y],[577,209],[596,216],[608,230],[616.5,247]]),
  path("서울광장 앞 횡단보도",7.2,[[616.5,247],[649.4,259.3]],"crossing"),
  path("을지로 남쪽 보도",5.4,[[645.5,302],[651,286],[655,273],[654.5,264],[649.4,259.3],[660.4,243],[669.1,227],[680,218.8],[695,214.5],[716,212.8]]),
  path("서울광장 정류장 보도",4.4,[[649.4,259.3],[643.8,263.5],[640.5,269.6],[643.5,277.6],[650,284]]),
  path("환구단 정문",5,[[650,286],[652.3,294.45],[658.3,297],[666.4,300.45],[677.5,305.4],[686.4,309.6]]),
  path("황궁우 서쪽 산책로",4.2,[[686.4,309.6],[691,302.9],[701,305.1],[699.4,316.7],[702.6,329.6],[707.1,336.8]]),
  path("황궁우 앞마당",4.6,[[702.6,329.6],[711.1,326.8],[716.3,321.45],[730,322.5],[742.2,320],[752.9,325]]),
  path("삼문·석고 산책로",4.4,[[698.8,336.7],[705.2,336.1],[710.2,343.9],[714.6,343.1],[720.1,340.35],[732.2,333.8],[752.9,325]]),
  path("조선호텔 앞",4.6,[[710.2,343.9],[712.8,350.5],[711.6,358.1],[705.5,370.6],[702.6,377.8],[701.6,383]])
];

export const hwangudanPlantingBeds=[
  ground("정문 북쪽 화단","bed",[[651.7,284.7],[654,285.3],[650.8,292.2],[648.8,291.1]]),
  ground("정문 남쪽 화단","bed",[[645.5,298.3],[649.2,299.8],[646.9,305.6],[642.9,304]]),
  ground("정문 뒤 정원","bed",[[666.7,293.6],[679,298.9],[677.6,302.1],[665.3,296.9]]),
  ground("궁우 북서쪽 정원","bed",[[700.4,292.6],[706,284.1],[715.1,282.9],[722.4,289.1],[710.3,298.1],[705.7,299.2]]),
  ground("궁우 동쪽 정원","bed",[[731.8,295.4],[739.8,296.2],[749,302.8],[755.5,313.3],[748.1,314.1],[742.4,310.8],[734.8,313.1]]),
  ground("석고 옆 정원","bed",[[674.1,324.5],[685.8,327.7],[687.4,334.2],[682.5,343.9],[670.2,339.4]]),
  ground("삼문 동쪽 정원","bed",[[731.8,337],[749.2,329.2],[756,331.9],[742.6,339.2],[727.7,345.4],[721.7,344.7]])
];

const promenade=hwangudanGround.filter(({kind})=>kind!=="road");
function nearPath(x,y,{points,width}){
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.min(1,Math.max(0,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
    if((x-a.x-dx*t)**2+(y-a.y-dy*t)**2<(width/2)**2)return true;
  }
  return false;
}
export function inHwangudan(x,y){
  return x>=hwangudanBounds.minX&&x<=hwangudanBounds.maxX&&y>=hwangudanBounds.minY&&y<=hwangudanBounds.maxY;
}
export function hwangudanWalkable(x,y){
  return inHwangudan(x,y)&&(
    promenade.some(({outline})=>insideCorridorPolygon(x,y,outline))||hwangudanPaths.some(path=>nearPath(x,y,path))
  )&&!hwangudanBuildings.some(({outline})=>insideCorridorPolygon(x,y,outline))&&
    !hwangudanPlantingBeds.some(({outline})=>insideCorridorPolygon(x,y,outline));
}

export function hwangudanAt(origin,lateral,depth){
  const c=Math.cos(origin.angle),s=Math.sin(origin.angle);
  return point(origin.x+lateral*c+depth*s,origin.y-lateral*s+depth*c);
}
export function hwangudanGateApronHeight(along,depth){
  const {rampEnd,end}=hwangudanGateApron;
  const ground=southWorldSurfaceHeight(hwangudanAt(hwangudanGate,along,depth));
  const gate=southWorldSurfaceHeight(hwangudanGate);
  const progress=Math.max(0,Math.min(1,(Math.abs(depth)-rampEnd)/(end-rampEnd)));
  return .05+(ground+.064-gate-.05)*progress;
}
export function hwangudanFloorHeight(position){
  const {x,y}=position;
  if(!inHwangudan(x,y))return undefined;
  const dx=x-hwangudanGate.x,dy=y-hwangudanGate.y,c=Math.cos(hwangudanGate.angle),s=Math.sin(hwangudanGate.angle);
  const along=dx*c-dy*s,depth=dx*s+dy*c;
  if(Math.abs(along)<6.7&&Math.abs(depth)<5.25){
    let surface=.05+.33*Math.max(0,Math.min(1,(5.25-Math.abs(depth))/2.75));
    if(Math.abs(along+1.15)<5.38){
      for(let step=0;step<3;step++){
        if(Math.abs(Math.abs(depth)-(4.79-step*.82))<.385)surface=Math.max(surface,.055+.107*(step+1));
      }
    }
    // The gate and treads are one rigid model placed at the grade beneath its centre.
    return surface+southWorldSurfaceHeight(hwangudanGate)-southWorldSurfaceHeight(position);
  }
  if(Math.abs(along)<hwangudanGateApron.halfWidth&&Math.abs(depth)<hwangudanGateApron.end){
    return hwangudanGateApronHeight(along,depth)+southWorldSurfaceHeight(hwangudanGate)-southWorldSurfaceHeight(position);
  }
  const stoneX=x-hwangudanStoneGate.x,stoneY=y-hwangudanStoneGate.y;
  const stoneC=Math.cos(hwangudanStoneGate.angle),stoneS=Math.sin(hwangudanStoneGate.angle);
  const stoneAlong=stoneX*stoneC-stoneY*stoneS,stoneDepth=stoneX*stoneS+stoneY*stoneC;
  if(Math.abs(stoneAlong)<5.4&&Math.abs(stoneDepth)<2.09){
    const steps=Math.abs(stoneDepth)<.78?4:1+Math.floor((2.09-Math.abs(stoneDepth))/.46);
    return .062+.09*steps;
  }
  if(insideCorridorPolygon(x,y,hwangudanGround[2].outline))return .062;
  return hwangudanWalkable(x,y)?.051:undefined;
}

export const hwangudanPlantings=[
  [646.1,301.7,5.3,"pine"],[650.8,287.3,5.5,"pine"],[669.9,295.7,5.6,"pine"],[677.3,300.5,6.4,"pine"],
  [675.3,333.4,7.8,"pine"],[681.5,337,8.6,"maple"],[682.1,330.1,5.9,"pine"],
  [705.6,291.5,6.3,"pine"],[713.1,286.8,9.3,"ginkgo"],[709.3,295.6,6.6,"pine"],
  [735.3,298.8,8.3,"maple"],[740.5,300.7,6.8,"pine"],[749.4,309.2,7.1,"pine"],
  [728.5,342.1,8.8,"maple"],[739.2,337.1,6.8,"pine"],[749.1,333.3,6.9,"pine"],
  [566.4,202.9,7.9,"ginkgo"],[586.8,209.3,7.2,"ginkgo"],[609.4,246.4,7.6,"ginkgo"],
  [656.9,300.1,3.9,"pine"]
];

export const hwangudanRails=[
  [[707.8,304.8],[711.8,298.8]],[[707.7,306.3],[706.7,318.9]],
  [[707.4,323.3],[710.2,325.9]],[[708.7,329.1],[712.6,337.3]],
  [[717.5,346.8],[744.75,335.38]]
];

let registered=false;
export function registerHwangudanNavigation(){
  if(registered)return;
  registered=true;
  for(const {outline} of hwangudanBuildings){
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      addObstacle((a.x+b.x)/2,(a.y+b.y)/2,Math.hypot(b.x-a.x,b.y-a.y),.04,Math.atan2(a.y-b.y,b.x-a.x));
    }
  }
  for(const x of [-5.72,-2.68,2.68,5.72]){
    for(const y of [-1.85,1.85]){
      const p=hwangudanAt(hwangudanGate,x,y);
      addObstacle(p.x,p.y,.52,.52,hwangudanGate.angle);
    }
  }
  for(const x of [-5.72,5.72]){
    const p=hwangudanAt(hwangudanGate,x,0);
    addObstacle(p.x,p.y,.19,3.68,hwangudanGate.angle);
  }
  addObstacle(hwangunggu.x,hwangunggu.y,12.9,12.9,Math.PI/8);
  addObstacle(hwangunggu.x,hwangunggu.y,13.55,6.0,0);
  addObstacle(hwangunggu.x,hwangunggu.y,6.0,13.55,0);
  for(const [x,width] of [[-5.19,1.27],[-2.02,.7],[2.02,.7],[5.19,1.27]]){
    const p=hwangudanAt(hwangudanStoneGate,x,0);
    addObstacle(p.x,p.y,width,1.33,hwangudanStoneGate.angle);
  }
  for(const {x,y} of hwangudanDrums)addObstacle(x,y,1.88,1.5);
  for(const {x,y} of hwangudanRelics)addObstacle(x,y,.9,.88);
  for(const [x,y] of hwangudanPlantings)addObstacle(x,y,.46,.46);
  for(const lateral of [-3.6,3.6])for(const depth of [-3.8,3.8]){
    const {x,y}=hwangudanAt(hwangudanHotelPorch,lateral,depth);
    addObstacle(x,y,.48,.48);
  }
  for(const [[ax,ay],[bx,by]] of hwangudanRails){
    addObstacle((ax+bx)/2,(ay+by)/2,Math.hypot(bx-ax,by-ay),.13,Math.atan2(ay-by,bx-ax));
  }
  for(const {outline} of hwangudanPlantingBeds){
    const x=outline.reduce((sum,p)=>sum+p.x,0)/outline.length;
    const y=outline.reduce((sum,p)=>sum+p.y,0)/outline.length;
    if(x<680&&y<307)addObstacle(x,y,1.3,2.0);
  }
}

addZone({name:"환구단",contains:inHwangudan,walkable:hwangudanWalkable});
addLandmarks(hwangudanLandmarks);
