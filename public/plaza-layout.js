import {addLandmarks,addZone,eastMetres,northMetres,project} from "./layout.js";

// Metres east and north of 37.57050 N, 126.97697 E, at the south end of the square.
export const plazaOrigin=project("광화문광장",37.57050,126.97697);
export const plazaAt=(east,north,name="")=>({name,east,north,x:plazaOrigin.x+east,y:plazaOrigin.y-north,
  lat:plazaOrigin.lat+north/northMetres,lng:plazaOrigin.lng+east/eastMetres});
export const plazaBounds={minX:plazaOrigin.x-125,maxX:plazaOrigin.x+120,minY:plazaOrigin.y-631,maxY:plazaOrigin.y+19};
const inPlazaBounds=(x,y)=>x>=plazaBounds.minX&&x<=plazaBounds.maxX&&y>=plazaBounds.minY&&y<=plazaBounds.maxY;
export function inGwanghwamunPlaza(x,y){
  return inPlazaBounds(x,y)&&y<=plazaOrigin.y&&y>plazaOrigin.y-sajikRoad.north;
}
const polygon=points=>points.map(([east,north])=>plazaAt(east,north));
export const plazaOutline=polygon([
  [-51,0],[-8,0],[8,4],[11,13],[11,242],[8,344],[5,442],[2,504],[3.5,513],[8,528],[-9,530],
  [-25,533],[-41,530],[-55,520],[-65,499],[-62,474],[-48,440],[-45,384],[-47,305],
  [-50,261],[-48,191],[-50,132],[-55,92],[-54,42]
]);
export const plazaSites={
  forest:plazaAt(-37,30,"광장숲"),myeongnyang:plazaAt(-1,31,"명량분수"),yi:plazaAt(-2,52,"이순신장군 동상"),
  hangeul:plazaAt(-37,75,"한글분수"),haechi:plazaAt(-21,110,"해치마당"),tunnel:plazaAt(-12,114,"터널분수"),
  open:plazaAt(-36,151,"열린마당"),culture:plazaAt(-40,190,"문화쉼터"),play:plazaAt(-19,221,"놀이마당"),
  sejong:plazaAt(-5,269,"세종대왕 동상"),fourSeasons:plazaAt(-34,290,"사계정원"),
  gratitude:plazaAt(-40,316,"감사의 정원"),sejongPark:plazaAt(-68,333,"세종로공원"),ruins:plazaAt(-37,362,"사헌부 문터"),
  time:plazaAt(-38,387,"시간의 정원"),cascade:plazaAt(-34,403,"시간의 벽천"),
  pine:plazaAt(-43,426,"소나무정원"),lawn:plazaAt(-21,473,"육조마당"),
  woldae:plazaAt(-13,576,"광화문 월대"),gate:plazaAt(-13.2,602.7,"광화문")
};

export const plazaTransitStops=[
  {id:"gwanghwamun-plaza",name:"광화문역 7번 출구",mode:"subway",...plazaAt(-45,13,"광화문역 7번 출구"),
    angle:Math.PI/2,door:plazaAt(-40.2,13),arrive:{...plazaAt(-37,13),heading:27}},
  {id:"bus-gwanghwamun-plaza",name:"세종문화회관 정류장",mode:"bus",...plazaAt(3,358,"세종문화회관 정류장"),
    angle:Math.PI/2,door:plazaAt(.7,358),arrive:{...plazaAt(-2.8,357),heading:310}}
];
export const plazaShortcuts={
  station:{...plazaTransitStops[0].arrive,name:plazaTransitStops[0].name},
  yi:{...plazaAt(-16.5,27,"이순신장군 동상 앞"),heading:65,tilt:-3},
  sejong:{...plazaAt(-5,245,"세종대왕 동상 앞"),heading:0,tilt:-10},
  north:{...plazaAt(-13,554,"광화문 월대 앞"),heading:0,tilt:-8},
  bus:{...plazaTransitStops[1].arrive,name:plazaTransitStops[1].name}
};
export const plazaLandmarks=[...Object.values(plazaSites),...plazaTransitStops];
export const plazaPaths=[
  {width:8,surface:"stone",points:polygon([[-18,1],[-18,34],[-21,65],[-6,97],[-5,173],[-8,221],[-15,263],
    [-10,306],[-10,364],[-10,414],[-6,457],[-6,514],[-13,541],[-13,586]])},
  {width:5.5,surface:"stone",points:polygon([[-45,4],[-48,53],[-48,91],[-43,125],[-43,190],[-43,221],[-45,252],
    [-43,292],[-49,330],[-46,370],[-49,420],[-47,457],[-44,505]])},
  {width:5.8,surface:"stone",points:polygon([[-52,332.6],[-68.5,332.6],[-80,335]])},
  {width:5,surface:"stone",points:polygon([[46,487],[57,487],[58.8,492.3]])}
];
export const plazaSideForecourts=[
  polygon([[-55,329.3],[-67,329.3],[-77,331.8],[-82,331.8],[-82,338.2],[-76,338.2],[-67,335.9],[-55,335.9]]),
  polygon([[48,483.6],[56.2,483.6],[61.8,486],[61.8,499],[55.9,499],[55.9,490.6],[48,490.6]]),
  polygon([[48,460.2],[48.8,460.2],[48.8,476.2],[48,476.2]])
];
// The relocated lanes stay east of the plaza. The roadway and pedestrian tests share this profile.
export const plazaRoadProfile=[[0,11],[242,11],[344,8],[442,5],[504,2],[528,8],[548,23]];
export function eastCurb(north){
  for(let i=1;i<plazaRoadProfile.length;i++){
    const [start,left]=plazaRoadProfile[i-1],[end,right]=plazaRoadProfile[i];
    if(north<=end)return left+(right-left)*Math.max(0,north-start)/(end-start);
  }
  return plazaRoadProfile.at(-1)[1];
}
export const eastRoadWidth=27;
export const plazaCrossings=[9,80,246,418,514];
export const plazaCrossingApronHalf=4.65;
const plazaEastPavement=(north,clearance=5)=>plazaAt(eastCurb(north)+eastRoadWidth+clearance,north);
export const plazaEastWalkSpine=[
  ...[7.2,80,246,344,349].map(north=>plazaEastPavement(north)),
  plazaEastPavement(353,1.7),plazaEastPavement(363,1.7),
  ...[369,418,442,504,514].map(north=>plazaEastPavement(north)),
  plazaAt(38.2,527),plazaAt(38.2,552)
];
export const sajikRoad={south:529,north:551,crossX:-13,crossWidth:10.5};
export const haechiBasin={west:-29,east:-14,south:97,north:138,rampEnd:120,depth:2.05};

const bed=(id,kind,points)=>({id,kind,outline:polygon(points)});
export const yukjoLawn=bed("yukjo-lawn","lawn",
  [[-33,449],[-12,449],[-9,454],[-9,493],[-13,499],[-32,499],[-36,495],[-36,454]]);
export const plazaBeds=[
  bed("forest-west","grove",[[-43,20],[-28,21],[-25,33],[-27,57],[-36,64],[-49,56],[-50,40],[-48,26]]),
  bed("forest-nook","grove",[[-49,66],[-44,64],[-44,86],[-47,94],[-51,87]]),
  bed("haechi-south","mixed",[[-30,86],[-22,82],[-17,86],[-16,93],[-27,94]]),
  bed("haechi-east","mixed",[[-1,105],[8,105],[9,129],[4,138],[-2,134]]),
  bed("open-west","mixed",[[-48,138],[-42,136],[-41,154],[-43,172],[-48,173]]),
  bed("culture-west","mixed",[[-49,179],[-39,179],[-37,186],[-45,197],[-49,196]]),
  bed("culture-east","mixed",[[-1,178],[9,178],[10,204],[6,210],[-1,201]]),
  bed("four-seasons","mixed",[[-39,271],[-24,277],[-22,291],[-27,305],[-38,303],[-43,293],[-43,280]]),
  bed("park-verge","mixed",[[-53,282],[-48,282],[-48,321],[-50,338],[-55,337],[-54,313]]),
  bed("ruins-verge","mixed",[[-48,344],[-43,346],[-43,367],[-46,381],[-50,377]]),
  bed("time-pocket","mixed",[[-29,378],[-23,380],[-22,393],[-27,399],[-35,395],[-34,386]]),
  bed("pine-grove","pine",[[-46,408],[-30,407],[-27,418],[-32,434],[-47,445],[-55,438],[-53,422]]),
  bed("north-west-grove","pine",[[-57,467],[-46,476],[-40,489],[-41,507],[-47,518],[-58,510],[-63,499],[-61,482]]),
  yukjoLawn,
  bed("north-lawn-edge","mixed",[[-5.7,514],[.7,513],[2.8,516],[4.4,522],[3.3,526],[-1.6,528],[-6.4,525]]),
  bed("woldae-west","lawn",[[-54,565],[-37,562],[-31,570],[-31,595],[-59,596],[-60,578]]),
  bed("woldae-east","lawn",[[5,567],[22,563],[30,572],[31,594],[6,596]]),
  // The park sits behind the plaza-side promenade and opens through a break in the planting.
  bed("sejongno-park-south","grove",[[-95,281],[-70,279],[-56,282],[-56,328.7],[-67.5,328.7],[-80,331.2],[-95,328]]),
  bed("sejongno-park-north","grove",[[-95,340],[-82,339],[-76.6,339],[-66.8,336.6],[-56,336.6],[-56,381.5],[-78,385],[-96,376]]),
  bed("pine-approach","pine",[[-66.2,406],[-61,403],[-56.2,406],[-56.2,421],[-62,424],[-66.2,421]])
];

export function insidePlazaPolygon(x,y,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

export function inKiteLawn(x,y){
  return insidePlazaPolygon(x,y,yukjoLawn.outline);
}

export function plazaGroundHeight(position){
  const east=position.x-plazaOrigin.x,north=plazaOrigin.y-position.y;
  const {west,east:right,south,north:top,depth,rampEnd}=haechiBasin;
  if(east<west||east>right||north<south||north>top)return null;
  return -depth*Math.min(1,(top-north)/(top-rampEnd));
}

export function isPlazaWalkable(x,y){
  const east=x-plazaOrigin.x,north=plazaOrigin.y-y;
  const curb=eastCurb(north),sidewalk=curb+eastRoadWidth;
  if(north>=0&&north<=528){
    const landing=east<curb+1.32||east>sidewalk-1.32;
    const crossingHalf=landing?plazaCrossingApronHalf:3.7;
    if(east>=curb-2.2&&east<=sidewalk+.4&&plazaCrossings.some(crossing=>Math.abs(north-crossing)<crossingHalf))return true;
    if(east>=sidewalk&&east<=48)return true;
    if(north<430&&east>-55&&east< -45&&!insidePlazaPolygon(x,y,plazaOutline))return true;
  }
  const sajik=sajikRoad;
  if(north>=522&&north<=sajik.north+1&&Math.abs(east-sajik.crossX)<sajik.crossWidth/2)return true;
  if(north>494&&north<529&&east>=41&&east<=66)return true;
  if(plazaSideForecourts.some(outline=>insidePlazaPolygon(x,y,outline)))return true;
  if(plazaBeds.some(bed=>bed.kind==="lawn"&&insidePlazaPolygon(x,y,bed.outline)))return true;
  if(!insidePlazaPolygon(x,y,plazaOutline))return false;
  return !plazaBeds.some(bed=>bed.kind!=="lawn"&&insidePlazaPolygon(x,y,bed.outline));
}

addZone({name:"광화문광장",contains:inPlazaBounds,walkable:isPlazaWalkable});
addLandmarks(plazaLandmarks);
