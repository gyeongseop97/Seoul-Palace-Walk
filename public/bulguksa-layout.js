import {mappedPaths,mappedHalls,mappedBridges,mappedPonds,mappedWoods} from "./bulguksa-geography.js";
import {templeOrigin,templePoint,templeAxis,templeAxes,groundHeightAt,insideTempleGround} from "./bulguksa-ground.js";
import {hallTerraceAt} from "./bulguksa-hall-layout.js";
import {templeCorridors,templeScreenAt} from "./bulguksa-cloisters.js";
export {templeOrigin,templePoint,templeAxis,templeAxes};

// Same east/south metre frame as the rest of Gyeongju.
export const inBulguksa=p=>Math.abs(p.x-templeOrigin.x)<700&&Math.abs(p.z-templeOrigin.z-150)<700;
const polygon=points=>points.map(templePoint);
export const templeHalls=mappedHalls.map(([id,name,kind,ring])=>({id,name,kind,points:polygon(ring)}));
export const templeBridges=mappedBridges.map(([id,name,ring])=>({id,name,points:polygon(ring)}));
export const templePonds=mappedPonds.map(([,ring])=>polygon(ring));
export const templeWoods=mappedWoods.map(([,ring])=>polygon(ring));
export const templePaths=mappedPaths.map(([id,name,kind,line])=>({id,name,kind,width:kind==="footway"?5:kind==="steps"?2.4:2.7,points:polygon(line)}));
// The real bus bays and the footway to Iljumun are separate objects on the map.
templePaths.push({kind:"path",width:4.4,points:polygon([[44.4,414.6],[41,406],[32,398],[26,379],[30,356],[38,345]])});
const c=Math.cos(.15),s=Math.sin(.15);
const rect=(left,top,right,bottom)=>[templeAxis(left,top),templeAxis(right,top),templeAxis(right,bottom),templeAxis(left,bottom)];
export const templeCourtBounds=[[-27,-45,24,17],[-65,-17,-28,19],[-62,-86,14,-45]];
export const templeCourts=templeCourtBounds.map(bounds=>rect(...bounds));
export const templePagodas=[
 {name:"다보탑",...templePoint([10.93,.44]),height:10.29,file:"bulguksa-dabotap",yaw:.15-11.675*Math.PI/180,
  footprints:[[-2.10,2.35,-2.07,2.36],[-3.65,3.87,-.85,1.14],[-.88,1.14,-3.63,3.90]]},
 {name:"석가탑",...templePoint([-11.29,4]),height:10.75,file:"bulguksa-seokgatap",yaw:.15,
  footprints:[[-2.187,2.187,-2.187,2.187]]}
];
const clamp=v=>Math.max(0,Math.min(1,v));
const risers={"청운교":16,"백운교":18,"칠보교":8,"연화교":10};
export const stoneStairs=[];
export const stairPaths=[];
for(const pair of [["청운교","백운교",5],["칠보교","연화교",3.1]]){
 const [upper,lower,height]=pair;
 const axes=name=>templeBridges.find(b=>b.name===name).points.map(templeAxes);
 const a=axes(upper),b=axes(lower),pts=[...a,...b];
 const north=Math.min(...a.map(p=>p.v)),south=Math.max(...b.map(p=>p.v));
 const join=(Math.max(...a.map(p=>p.v))+Math.min(...b.map(p=>p.v)))/2;
 const left=Math.min(...pts.map(p=>p.u)),right=Math.max(...pts.map(p=>p.u));
 const middle=height*risers[lower]/(risers[upper]+risers[lower]);
 const u=(left+right)/2;
 stoneStairs.push({name:upper,u,width:right-left,north,south:join,bottom:middle,top:height,count:risers[upper],upper:true},
  {name:lower,u,width:right-left,north:join,south,bottom:0,top:middle,count:risers[lower],upper:false});
 stairPaths.push({kind:"steps",points:[south+2,south,join,north,19,16,12].map(v=>templeAxis(u,v))});
}
function stairAt(u,v){
 return stoneStairs.find(f=>Math.abs(u-f.u)<=f.width/2+.42&&v>=(f.upper?20:f.north)&&v<=f.south);
}
export function stairStepHeight(f,v){
 if(v<f.north)return f.top;
 const t=clamp((f.south-v)/(f.south-f.north));
 return f.bottom+(f.top-f.bottom)*Math.min(f.count,Math.floor(t*f.count)+1)/f.count;
}
export function templeHeight(p){
 const axes=templeAxes(p),{u,v}=axes,f=stairAt(u,v);
 if(f)return stairRail(f,u,v)||stairStepHeight(f,v);
 const coping=courtCoping(u,v);
 if(coping)return coping;
 const terrace=hallTerraceAt(axes);
 return groundHeightAt(u,v)+(terrace?.height??0);
}
// The capstones extend past the cut earth. Keep supporting a walker until the
// outer lip, so a jump begins at the same height from which the player sees it.
function courtCoping(u,v){
 if(v<20.415||v>22.185)return 0;
 if(u>=-69&&u<=-50||u>=-43&&u<=-5||u>=4&&u<=27)return groundHeightAt(u,20)+.155;
 return 0;
}
function stairRail(f,u,v){
 if(Math.abs(u-f.u)<f.width/2-.21)return 0;
 const t=clamp((v-f.north)/(f.south-f.north)),bays=f.upper?1:2;
 const nearest=Math.round(t*bays*2)/(bays*2),post=Math.abs(t-nearest)*(f.south-f.north)<.23;
 return f.top+(f.bottom-f.top)*t+(post?1.16:.865);
}
function narrowSupport(p){
 const a=templeAxes(p),{u,v}=a,f=stairAt(u,v);
 if(f)return stairRail(f,u,v);
 const terrace=hallTerraceAt(a);
 return terrace?.edge?groundHeightAt(u,v)+terrace.height:courtCoping(u,v);
}
function contains(p,line){
 let hit=false;
 for(let i=0,j=line.length-1;i<line.length;j=i++){
  const a=line[i],b=line[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)hit=!hit;
 }
 return hit;
}
export const templeGallery=id=>templeCorridors.has(id);
const footprints=templeHalls.map(b=>{
 const xs=b.points.map(p=>p.x),zs=b.points.map(p=>p.z);
 const gallery=templeGallery(b.id),gate=b.kind==="gatehouse",main=b.id===244539247||b.id===244539240;
 return {...b,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...zs),bottom:Math.max(...zs),
  overhead:gallery?2.55:gate?3.88:0,height:gallery?4.25:gate?7.4:main?11:7.8};
});
const inFootprint=(p,b)=>p.x>=b.left&&p.x<=b.right&&p.z>=b.top&&p.z<=b.bottom&&contains(p,b.points);
const buildings=footprints.filter(b=>!b.overhead);
function pagodaBase(p,t){
 const x=p.x-t.x,z=p.z-t.z,u=x*c-z*s,v=x*s+z*c;
 return t.footprints.some(([left,right,top,bottom])=>u>=left-.12&&u<=right+.12&&v>=top-.12&&v<=bottom+.12);
}
export function templeSolid(p,feet){
 const axes=templeAxes(p);
 const terrace=hallTerraceAt(axes);
 return templeScreenAt(axes)||terrace?.solid&&!(terrace.edge&&feet>=groundHeightAt(axes.u,axes.v)+terrace.height-.015)||
  buildings.some(b=>b.id!==244539247&&b.id!==244539240&&inFootprint(p,b))||templePagodas.some(t=>pagodaBase(p,t));
}
export function templeCameraBlocked(p,y){
 const h=y-templeHeight(p);
 if(h<.04)return true;
 if(h>11)return false;
 if(h<2.7&&templeScreenAt(templeAxes(p)))return true;
 if(footprints.some(b=>h>=b.overhead&&h<=b.height&&inFootprint(p,b)&&
  (b.id!==244539247&&b.id!==244539240||h>5||hallTerraceAt(templeAxes(p))?.solid)))return true;
 return templePagodas.some(t=>h<t.height&&(h<2?pagodaBase(p,t):Math.hypot(t.x-p.x,t.z-p.z)<(h<5?2:1.26)));
}
const cells=new Map();
const key=(x,z)=>x+","+z;
for(const r of templePaths)for(let i=1;i<r.points.length;i++){
 const a=r.points[i-1],b=r.points[i],dx=b.x-a.x,dz=b.z-a.z,radius=r.width/2+.5;
 const seg={a,dx,dz,squared:dx*dx+dz*dz||1,radius};
 for(let x=Math.floor((Math.min(a.x,b.x)-radius)/12);x<=Math.floor((Math.max(a.x,b.x)+radius)/12);x++)
  for(let z=Math.floor((Math.min(a.z,b.z)-radius)/12);z<=Math.floor((Math.max(a.z,b.z)+radius)/12);z++){
   const id=key(x,z);if(!cells.has(id))cells.set(id,[]);cells.get(id).push(seg);
  }
}
function visitorPath(p){
 if(templeCourts.some(r=>contains(p,r)))return true;
 for(const {a,dx,dz,squared,radius} of cells.get(key(Math.floor(p.x/12),Math.floor(p.z/12)))??[]){
  const t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/squared);
  if(Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)<=radius)return true;
 }
 return false;
}
// Build this index on the first visit, for both drawn trees and walking clearance.
let plantings;
export function templePlantings(){
 if(plantings)return plantings;
 const trees=[],trunks=new Map();
 let seed=10763;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<470;i++){
  const p=templePoint([-140+rand()*260,-117+rand()*539]);
  if(p.z<templeOrigin.z+60&&p.z>templeOrigin.z-107&&Math.abs(p.x-templeOrigin.x+18)<104)continue;
  if(visitorPath(p)||templeSolid(p)||templePaths.some(r=>r.points.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<5)))continue;
  if(templePonds.some(r=>contains(p,r)||Math.hypot(r[0].x-p.x,r[0].z-p.z)<42))continue;
  const tree={...p,height:5+rand()*6,palette:i%5===0?"maple":i%3===0?"pine":"deep",style:i%3===0?"cone":"branchy"};
  trees.push(tree);
  const radius=tree.height*.045+.14;
  for(let x=Math.floor((p.x-radius)/12);x<=Math.floor((p.x+radius)/12);x++)
   for(let z=Math.floor((p.z-radius)/12);z<=Math.floor((p.z+radius)/12);z++){
    const id=key(x,z);if(!trunks.has(id))trunks.set(id,[]);
    trunks.get(id).push(tree);
   }
 }
 plantings={trees,trunks};
 return plantings;
}
export function templeWalkable(p,feet,from){
 const {u,v}=templeAxes(p);
 if(!insideTempleGround(p))return false;
 const clearance=feet??(from?narrowSupport(from):0);
 if(templeSolid(p,clearance)||templePonds.some(r=>contains(p,r)))return false;
 const f=stairAt(u,v);
 if(f){
  const top=stairRail(f,u,v);
  return !top||clearance>=top-.015;
 }
 const coping=courtCoping(u,v);
 if(coping&&clearance<coping-.015)return false;
 return !(templePlantings().trunks.get(key(Math.floor(p.x/12),Math.floor(p.z/12)))??[]).some(t=>Math.hypot(p.x-t.x,p.z-t.z)<t.height*.045+.14);
}
const source="https://www.heritage.go.kr/heri/html/HtmlPage.do?pageNo=5_4_2_1&pg=%2Funesco%2FHeritage%2FHeritage_01.jsp";
const add=(name,x,z,description,directions,kind="heritage",heading=0)=>({
 name,kind,heading,...templePoint([x,z]),guide:{title:name,description,directions,source,sourceLabel:"국가유산청 불국사 안내"}
});
export const templeSites=[
 add("불국사 정류장",44.4,414.6,"토함산 기슭에 있는 불국사의 정문 쪽 정류장입니다.","북쪽 일주문으로 난 길을 따라가세요. 이곳에서 게임 내 버스로 경주역이나 황리단길에 돌아갈 수 있어요.","bus",345),
 add("불국사 일주문",30,313,"불국사로 들어서는 첫 문이에요. 석굴암과 불국사는 1995년에 함께 유네스코 세계유산에 등재됐습니다.","문을 지나 해탈교를 건너면 천왕문이 보입니다."),
 add("해탈교",38,228,"일주문과 천왕문 사이의 숲길에 놓인 다리예요.","북쪽으로 천왕문을 지나 계속 걸으면 석축 앞에 닿습니다."),
 add("천왕문",31,171,"일주문을 지나 경내로 들어가는 길목의 문입니다.","길을 따라 북쪽으로 올라가 청운교와 백운교를 바라보세요."),
 add("청운교·백운교",7,40,"돌계단 형태의 두 다리가 위쪽 자하문과 대웅전 영역으로 이어집니다.","백운교와 청운교를 차례로 올라 자하문을 지나면 두 탑이 보입니다."),
 add("연화교·칠보교",-39,39,"극락전 앞 안양문으로 향하는 두 석교입니다. 대웅전 앞 석교의 서쪽에 자리해요.","연화교와 칠보교를 차례로 올라 안양문을 지나면 극락전이 보입니다."),
 add("다보탑",2.2,4.8,"대웅전 앞 동쪽 탑입니다. 사각 기단 위에 돌난간과 팔각형 구조가 겹겹이 올라가요.","같은 마당 서쪽의 석가탑과 형태를 비교해 보세요.","heritage",63),
 add("석가탑",-5.5,4.5,"대웅전 앞 서쪽에 선 삼층석탑입니다. 두 층의 기단 위에 세 층의 탑신을 쌓았어요.","동쪽에 다보탑, 북쪽에 대웅전이 있습니다.","heritage",275),
 add("불국사 대웅전",-1,-3,"불국사의 동쪽 중심 전각입니다. 마당 남쪽에 자하문이 있고, 두 탑 너머 북쪽으로 대웅전이 자리합니다.","법당 앞마당을 걸어 서쪽 극락전 쪽 관람로로 가 보세요."),
 add("불국사 극락전",-48,12,"안양문 안쪽의 서쪽 영역입니다. 대웅전 마당보다 낮은 석단 위에 자리해요.","동쪽 위로는 대웅전 마당이, 남쪽 아래로는 연화교와 칠보교가 보입니다.")
];
