import {bukchonBounds,bukchonPaths,bukchonStreetTrees,bukchonTerrain,bukchonWalkable} from "./bukchon-layout.js";
import {hwangudanBounds,hwangudanPaths,hwangudanWalkable} from "./seoul-hwangudan-layout.js";
import {jeongdongExtensionBounds,jeongdongExtensionPaths} from "./jeongdong-extension-layout.js";
import {mmcaLandmarks,mmcaTrees,mmcaAt,mmcaGround} from "./mmca-layout.js";
import {cheonggyeAnimalTrails,cheonggyeBounds,cheonggyeTrees,cheonggyeWalkable} from "./cheonggye-layout.js";
import {songhyeonBounds,songhyeonGrade,songhyeonPaths,songhyeonTrees,songhyeonWalkable} from "./songhyeon-layout.js";
import {southWorldSurfaceHeight} from "./gyeongbok-terrain.js";
import {westBounds,westWalkable} from "./west-district-layout.js";

const samples=(points,stride=23)=>points.slice(1).flatMap((to,i)=>{
  const from=points[i],length=Math.hypot(to.x-from.x,to.y-from.y),count=Math.max(1,Math.ceil(length/stride));
  return Array.from({length:count},(_,j)=>{
    const t=(j+.5)/count;
    return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
  });
});
const trails=paths=>paths.map(path=>samples(path.points));
const bukchonTrails=trails(bukchonPaths.filter(({kind})=>kind!=="road"));
const plazaApproach=[{x:736,y:-1293},...mmcaLandmarks];
bukchonTrails.push(samples(plazaApproach,11));
const surveyTrees=bukchonStreetTrees.map(([x,y,height])=>({x,y,height:bukchonTerrain(x,y)+height*.75,kind:"tree"}));
const museumTrees=mmcaTrees.map(([east,south,height])=>({...mmcaAt(east,south),height:mmcaGround(east,south)+height*.79,kind:"tree"}));


const westTrails=[[[175,296],[186,323],[200,341],[201,377]],[[153,278],[95,231],[39,186],[-46,137],[-113,80],[-165,-4]],
  [[-165,-193],[-177,-230],[-210,-253],[-248,-292],[-270,-340]],
  [[-278,-356],[-284,-370],[-292,-386]]].map(path=>samples(path.map(([x,y])=>({x,y})),12).filter(p=>westWalkable(p.x,p.y)));
export const expansionWildlife=[
  {id:"west",bounds:westBounds,land:westWalkable,trails:westTrails,catCount:8,birdCount:25,perches:[]},
  {id:"jeongdong",bounds:jeongdongExtensionBounds,trails:trails(jeongdongExtensionPaths),catCount:5,birdCount:13,perches:[
    {x:158,y:237,height:7.6,kind:"tree"},{x:174,y:201,height:2.6,kind:"wall"},{x:282,y:89,height:7,kind:"tree"}
  ]},
  {id:"hwangudan",bounds:hwangudanBounds,land:hwangudanWalkable,trails:trails(hwangudanPaths),catCount:5,birdCount:14,perches:[
    {x:686.3,y:296.2,height:4.8,kind:"tree"},{x:710.8,y:311.6,height:1.35,kind:"wall"},{x:749.9,y:325.3,height:4.5,kind:"tree"}
  ]},
  {id:"bukchon",bounds:bukchonBounds,land:bukchonWalkable,trails:bukchonTrails,catCount:12,birdCount:33,perches:[...surveyTrees,...museumTrees]},
  {id:"songhyeon",bounds:songhyeonBounds,land:songhyeonWalkable,trails:trails(songhyeonPaths),catCount:7,birdCount:22,
    perches:songhyeonTrees.map(([x,y,height])=>({x,y,height:songhyeonGrade(x,y)+height*.76,kind:"tree"}))},
  {id:"cheonggye",bounds:cheonggyeBounds,land:cheonggyeWalkable,trails:cheonggyeAnimalTrails.map(path=>samples(path,14)),
    catCount:5,birdCount:18,perches:cheonggyeTrees.map(([x,y,height])=>({x,y,height:southWorldSurfaceHeight({x,y})+height*.75,kind:"tree"}))}
];
