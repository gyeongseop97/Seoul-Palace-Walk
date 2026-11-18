import {addLandmarks,addObstacle,addZone} from "./layout.js";
import {westSurfaces,westBuildings,westStreetTrees} from "./west-district-data.js";
export {westSurfaces,westBuildings};

export const westBounds={minX:-470,maxX:474,minY:-558,maxY:464};
export const westSites=[
  {name:"서울시립미술관",label:"서소문본관",x:201,y:378,heading:177},
  {name:"정동길",label:"정동길",x:-46.53,y:136.94,heading:305},
  {name:"경희궁 흥화문",label:"흥화문",x:-158,y:-183,heading:325},
  {name:"경희궁 숭정전",label:"숭정전",x:-292,y:-385,heading:328},
  {name:"경희궁 자정전",label:"자정전",x:-321,y:-425,heading:328},
  {name:"경희궁 태령전",label:"태령전",x:-357,y:-393,heading:328}
];
const index=new Map(),step=32;
function indexRing(feature){
  const outer=feature.rings[0],xs=outer.map(p=>p[0]),ys=outer.map(p=>p[1]);
  for(let col=Math.floor(Math.min(...xs)/step);col<=Math.floor(Math.max(...xs)/step);col++)
    for(let row=Math.floor(Math.min(...ys)/step);row<=Math.floor(Math.max(...ys)/step);row++){
      const key=row*1000+col;
      if(!index.has(key))index.set(key,[]);
      index.get(key).push(feature);
    }
}
for(const surface of westSurfaces)indexRing(surface);
function inRing(x,y,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [ax,ay]=ring[i],[bx,by]=ring[j];
    if((ay>y)!==(by>y)&&x<ax+(y-ay)*(bx-ax)/(by-ay))inside=!inside;
  }
  return inside;
}
export function westGround(x,y){
  const items=index.get(Math.floor(y/step)*1000+Math.floor(x/step));
  return items?.find(({rings})=>inRing(x,y,rings[0])&&!rings.slice(1).some(h=>inRing(x,y,h)))?.kind;
}
export function westWalkable(x,y){
  const kind=westGround(x,y);
  return Boolean(kind&&kind!=="road"&&kind!=="verge"&&kind!=="backdrop");
}
export function westRegion(x,y){
  return y>296&&x>115?"서울시립미술관":y< -174&&x< -145?"경희궁":"정동길";
}
// Recovered roofs face the same rotated courtyard axis. Use the roof outline's support lines
// to keep gates traversable between their pillars and to set each hall's individual dimensions.
export function palaceRoof(site){
  const angle=-.563,cos=Math.cos(angle),sin=Math.sin(angle);
  const us=site.rings[0].map(([x,y])=>x*cos+y*sin),vs=site.rings[0].map(([x,y])=>-x*sin+y*cos);
  const lo=Math.min(...us),hi=Math.max(...us),top=Math.min(...vs),bottom=Math.max(...vs);
  const u=(lo+hi)/2,v=(top+bottom)/2;
  const base=site.kind==="gate"?0:site.name==="숭정전"?1.65:.82;
  return {x:u*cos-v*sin,y:u*sin+v*cos,w:hi-lo,d:bottom-top,angle,base,steps:Math.ceil(base/.18)};
}
let registered=false;
export function registerWestDistrict(){
  if(registered)return;
  registered=true;addLandmarks(westSites);
  addZone({name:"정동길 · 경희궁",contains:(x,y)=>x>=westBounds.minX&&x<=westBounds.maxX&&y>=westBounds.minY&&y<=westBounds.maxY,walkable:westWalkable});
  for(const [x,y] of westStreetTrees)addObstacle(x,y,.48,.48,0);
  for(const b of westBuildings){
    if(b.kind==="gallery")continue;
    if(b.kind==="hall"){
      const {x,y,w,d,angle,base,steps}=palaceRoof(b);
      addObstacle(x,y,w*.73,d*.61,-angle);
      addObstacle(x,y,w*.89,d*.87,-angle,base+.095);
      for(let k=1;k<=steps;k++){
        const v=d*.42+(steps-k+.5)*.38;
        addObstacle(x-v*Math.sin(angle),y+v*Math.cos(angle),w*.24,.4,-angle,base*k/steps);
      }
      continue;
    }
    if(b.kind==="gate"){
      const {x,y,w,d,angle}=palaceRoof(b);
      for(const u of [-.38,-.135,.135,.38])for(const v of [-.32,.32]){
        addObstacle(x+w*u*Math.cos(angle)-d*v*Math.sin(angle),y+w*u*Math.sin(angle)+d*v*Math.cos(angle),.59,.59,-angle);
      }
      continue;
    }
    for(const ring of b.rings)for(const [i,a] of ring.entries()){
      const c=ring[(i+1)%ring.length],dx=c[0]-a[0],dy=c[1]-a[1];
      addObstacle((a[0]+c[0])/2,(a[1]+c[1])/2,Math.hypot(dx,dy),.18,-Math.atan2(dy,dx));
    }
  }
}
